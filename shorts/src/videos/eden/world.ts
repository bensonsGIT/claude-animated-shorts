// East of Eden's world: no outdoor town, every set is a Room (rooms.ts) shown one at a time.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f): light rig (camera-relative
// sun frozen per shot), the set's own animation, then the cast and effect cards from cast.ts.
import * as THREE from "three";
import { Kit, V } from "../../engine/build";
import { LIGHTS, LOOK, LightPreset } from "../../engine/lights";
import { TONE, CHAR, untone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Ranch, Pass, Dining, Parlour, Bedroom } from "./rooms";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef, noseAt, slideAt, lampAt, doorAt, V3 } from "./story";

type LightPool = [V3, V3, number];
/** motivated light per set (shade.ts pools): base light scale + pools at the real sources. Exteriors keep base 1. */
const lightPlan = (s: ShotDef, id: number, t: number): { base: number; pools: LightPool[] } => {
  const flick = 1 + 0.06 * Math.sin(t * 9.1) * Math.sin(t * 5.3);
  switch (s.set) {
    case "dining": return s.night
      ? { base: 0.38, pools: [[[-0.85, 1.0, -1.25], [1.5 * flick, 0.85 * flick, 0.38], 2.6], [[2.25, 0.6, -2.6], [1.9 * flick, 0.75 * flick, 0.25], id === 16 ? 3.0 : 2.2], [[0, 1.8, -3.4], [0.25, 0.35, 0.75], 2.6]] }
      : { base: 0.5, pools: [[[0, 1.4, -3.0], [1.6, 1.3, 0.85], 4.2], [[-0.85, 1.0, -1.25], [0.9 * flick, 0.5, 0.2], 1.9], [[2.25, 0.6, -2.6], [0.9, 0.36, 0.1], 2.0]] };
    case "parlour": { const k = lampAt(id, t); return { base: 0.56, pools: [[[2.4, 1.5, -2.2], [2.6 * k, 0.7 * k, 0.5 * k], 4.2], [[0.8, 1.2, -0.7], [0.9 * k, 0.45 * k, 0.35 * k], 2.6], [[-1.25, 1.2, -4.0], [0.2, 0.16, 0.4], 2.2]] }; }
    case "bedroom": return { base: 0.42, pools: [[[1.2, 1.4, -2.2], [0.5, 0.65, 1.3], 3.2], [[-1.47, 1.0, -2.65], [1.9 * flick, 1.05 * flick, 0.45], 2.8], [[0, 1.3, -1.6], [0.45, 0.36, 0.4], 2.2]] };
    case "nursery": return { base: 0.36, pools: [[[-1.47, 1.0, -2.65], [1.7 * flick, 0.95 * flick, 0.42], 2.8], [[1.9, 1.7, -2.9], [0.4, 0.55, 1.1], 3.2], [[0, 0.6, -2.2], [0.3, 0.22, 0.15], 1.6]] };
    default: return { base: 1, pools: [] };
  }
};

export const loadKit = () => Promise.resolve({} as Kit);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sunCache = new Map<number, THREE.Vector3>();
  private ranch = new Ranch();
  private pass = new Pass();
  private dining = new Dining();
  private parlour = new Parlour();
  private bedroom = new Bedroom();
  private fog = new THREE.Fog("#2b1a22", 14, 70);
  private bg = new THREE.Color();
  private tint = new THREE.Vector3();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.root.add(this.hemi, this.sun, this.sun.target);
    for (const r of this.rooms()) this.root.add(r.root);
  }
  private rooms() { return [this.ranch, this.pass, this.dining, this.parlour, this.bedroom]; }
  private roomOf(s: ShotDef) {
    return ({ ranch: this.ranch, pass: this.pass, dining: this.dining, parlour: this.parlour, bedroom: this.bedroom, nursery: this.bedroom } as const)[s.set];
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const room = this.roomOf(s);
    for (const r of this.rooms()) r.root.visible = r === room;
    room.update(t);
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- set poses ----
    if (s.set === "ranch") this.ranch.pose(s.light === "golden", !!s.boxcar);
    if (s.set === "pass") this.pass.pose(noseAt(t), slideAt(t));
    if (s.set === "dining") this.dining.pose(!!s.night);
    if (s.set === "parlour") this.parlour.pose(doorAt(id, t), lampAt(id, t));
    if (s.set === "bedroom" || s.set === "nursery") this.bedroom.pose(s.set === "nursery");
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const plan = lightPlan(s, id, t);
    TONE.uBaseK.value = plan.base;
    for (let i = 0; i < 3; i++) {
      const p = plan.pools[i];
      if (p) { TONE.uPoolPos.value[i].set(...p[0]).applyMatrix4(cam.matrixWorldInverse); TONE.uPoolCol.value[i].set(...p[1]); TONE.uPoolR.value[i] = p[2]; }
      else { TONE.uPoolCol.value[i].set(0, 0, 0); }
    }
    // cards: a touch of the room's light colour and level (reference heads stay bright, V ~.97)
    if (plan.pools.length && Math.max(...plan.pools[0][1]) > 0.05) { const c = plan.pools[0][1], m = Math.max(...c); CHAR.uCharTint.value.multiply(this.tint.set(0.88 + 0.12 * c[0] / m, 0.88 + 0.12 * c[1] / m, 0.88 + 0.12 * c[2] / m)); }
    const outdoor = s.set === "ranch" || s.set === "pass";
    untone(L.fog, this.fog.color);
    this.fog.near = outdoor ? 60 : L.fogNear; this.fog.far = outdoor ? 600 : L.fogFar;
    scene.fog = this.fog; scene.background = outdoor ? null : untone(L.fog, this.bg);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.yaw !== undefined) e.mesh.rotation.set(0, p.yaw, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
