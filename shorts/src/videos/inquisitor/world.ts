// The Grand Inquisitor's world: every set is a Room (rooms.ts) shown one at a time; outdoor sets carry their own sky dome.
// update(id, f, camera) poses everything for shot `id` at frame f: light rig, the set's animation (the cell door), then the cast.
import * as THREE from "three";
import { Kit, V } from "../../engine/build";
import { LIGHTS, LOOK, LightPreset } from "../../engine/lights";
import { TONE, CHAR, untone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room } from "../../engine/hall";
import { Void, Tavern, Square, Prison, Desert, CANDLE, T_LAMP, SAMOVAR } from "./rooms";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef, V3, isOutdoor, MARK, WORD, doorAt, smooth } from "./story";

type LightPool = [V3, V3, number];
/** motivated light per set: base light scale + pools at the real sources. Exteriors keep base 1. */
const lightPlan = (s: ShotDef, id: number, t: number): { base: number; pools: LightPool[] } => {
  const fl = 1 + 0.07 * Math.sin(t * 9.1) * Math.sin(t * 5.3);
  const warm = (p: V3, k: number, r: number): LightPool => [p, [1.9 * k * fl, 1.1 * k * fl, 0.45 * k], r];
  switch (s.set) {
    case "void": return { base: 0.5, pools: [warm([CANDLE[0], CANDLE[1] + 0.1, CANDLE[2] + 0.2], 1.5, 2.6)] };
    case "tavern": return { base: 0.85, pools: [warm([T_LAMP[0], T_LAMP[1] - 0.3, T_LAMP[2] + 0.3], 1.4, 3.8), warm([SAMOVAR[0], 1.1, SAMOVAR[2]], 0.5, 1.8), [[-1.85, 1.6, -2.8], [0.45, 0.42, 0.75], 2.4]] };
    case "prison": {
      const k = id === 12 ? smooth((t - (WORD.kisses - 0.1)) / 0.6) * (1 - smooth((t - (WORD.kisses + 2.0)) / 1.0)) : 0;
      const lamp: V3 = [MARK.inq[0] - 0.25, 1.4, MARK.inq[2] + 0.35];
      return { base: 0.9, pools: [warm(lamp, 1.3, 3.6), [[1.2, 2.3, -2.2], [0.4, 0.5, 1.0], 2.8], k > 0.02 ? [[0.55, 1.6, -1.4], [2.2 * k, 1.6 * k, 0.9 * k], 2.2] : [[-1.9, 1.2, -0.4], [0.2, 0.24, 0.45], 2.0]] };
    }
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
  private sets: Record<ShotDef["set"], Room> = { void: new Void(), tavern: new Tavern(), square: new Square(), prison: new Prison(), desert: new Desert() };
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
  private rooms() { return Object.values(this.sets); }
  private roomOf(s: ShotDef) { return this.sets[s.set]; }

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
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // ---- set poses ----
    if (s.set === "prison") (this.sets.prison as Prison).pose(id === 13 ? doorAt(id, t) : id === 14 ? 1 : 0);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
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
    // cards: a touch of the room's main light colour (guard against a dark pool: it would divide by ~0)
    if (plan.pools.length && Math.max(...plan.pools[0][1]) > 0.05) { const c = plan.pools[0][1], m = Math.max(...c); CHAR.uCharTint.value.multiply(this.tint.set(0.88 + 0.12 * c[0] / m, 0.88 + 0.12 * c[1] / m, 0.88 + 0.12 * c[2] / m)); }
    untone(L.fog, this.fog.color);
    const outdoor = isOutdoor(s);
    this.fog.near = outdoor ? 40 : L.fogNear; this.fog.far = outdoor ? 400 : L.fogFar;
    scene.fog = this.fog; scene.background = outdoor ? null : untone(L.fog, this.bg);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const stg = stage(id, t, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of stg.places) {
      const sc2 = p.scale ?? 1;
      if (!p.flat && !this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) a.mesh.rotation.set(-Math.PI / 2, 0, 0);
      else a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = false; // interiors: a card shadow thrown on the wall read as a blue ghost
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of stg.fx) {
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
