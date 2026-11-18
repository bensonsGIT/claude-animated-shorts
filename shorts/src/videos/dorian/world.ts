// Dorian Gray's world: no outdoor town, every set is a Room (rooms.ts) shown one at a time.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f): light rig (camera-relative
// sun frozen per shot), the set's own animation (portrait stage, satin, lamp, screen, curtain), then the cast from cast.ts.
import * as THREE from "three";
import { Kit, V } from "../../engine/build";
import { LIGHTS, LOOK, LightPreset } from "../../engine/lights";
import { TONE, CHAR, untone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Studio, Theatre, Library, Schoolroom, STUDIO, LIBRARY, SCH_WIN, LAMP, LIB_WIN, HEARTH, THEATRE, BOX } from "./rooms";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef, V3, portraitAt, coverAt, lampAt, sashAt, screenAt, dropAt, footAt, heapAt } from "./story";

type LightPool = [V3, V3, number];
/** motivated light per set (shade.ts pools): base light scale + pools at the real sources */
const lightPlan = (s: ShotDef, id: number, t: number): { base: number; pools: LightPool[] } => {
  const flick = 1 + 0.06 * Math.sin(t * 9.1) * Math.sin(t * 5.3);
  switch (s.set) {
    case "studio": // June daylight through the big window, warm bounce off the floor
      return { base: 0.68, pools: [[[-1.9, 2.0, -3.2], [1.5, 1.42, 1.25], 5.2], [[0.6, 0.6, -1.0], [0.5, 0.42, 0.3], 3.2], [[2.4, 1.8, -2.0], [0.25, 0.28, 0.4], 2.5]] };
    case "theatre": { // footlights up into the stage, gas brackets, a cool fill in the auditorium
      const f = footAt(id, t);
      return { base: 0.92, pools: [[[0, 1.6, -3.4], [2.4 * f * flick, 1.65 * f * flick, 0.8 * f], 4.2], [[BOX.x1 - 0.5, BOX.floor + 1.2, -0.6], [1.1 * flick, 0.7 * flick, 0.42], 2.4], [[0, 3.0, 2.0], [0.42, 0.36, 0.6], 5.0]] };
    }
    case "library": // dawn at the window, the dying fire, the green lamp
      return { base: 0.88, pools: [[[LIB_WIN.x, 1.9, LIBRARY.z0 + 0.4], [1.7, 1.35, 1.1], 4.0], [[HEARTH[0], 0.6, HEARTH[2] + 0.6], [1.4 * flick, 0.6 * flick, 0.25], 2.4], [[1.75, 1.9, -2.6], [0.8, 0.72, 0.62], 2.6]] };
    case "school": { // the oil lamp on the table, moonlight from the window, the servants' candle
      const l = lampAt(id, t), moon: LightPool = [[SCH_WIN.x + 0.3, 1.6, -2.6], [0.55, 0.72, 1.4], 3.8];
      const lamp: LightPool = [[LAMP[0] - 0.3, LAMP[1] + 0.4, LAMP[2] + 0.2], [2.2 * l * flick, 1.3 * l * flick, 0.6 * l], 4.4];
      const candle: LightPool = id === 17 ? [[-1.15, 1.2, -1.35], [1.5 * flick, 0.95 * flick, 0.4], 2.4] : [[0.45, 1.7, -2.6], [0.6, 0.52, 0.55], 3.0];
      return { base: s.light === "moon" ? 0.9 : 0.92, pools: l > 0.05 ? [lamp, moon, candle] : [moon, candle, [[0.45, 1.6, -2.4], [0.5, 0.56, 0.85], 3.2]] };
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
  private studio = new Studio();
  private theatre = new Theatre();
  private library = new Library();
  private school = new Schoolroom();
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
    void STUDIO; void THEATRE;
  }
  private rooms() { return [this.studio, this.theatre, this.library, this.school]; }
  private roomOf(s: ShotDef) { return ({ studio: this.studio, theatre: this.theatre, library: this.library, school: this.school } as const)[s.set]; }

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
    const st = portraitAt(id, t);
    if (s.set === "school") { this.school.portrait.pose(st, coverAt(id, t), id === 11 ? "drape" : "slip", heapAt(id)); this.school.pose(lampAt(id, t), sashAt(id)); }
    if (s.set === "library") { this.library.portrait.pose(st); this.library.pose(screenAt(id, t)); }
    if (s.set === "studio") this.studio.portrait.pose(0);
    if (s.set === "theatre") this.theatre.pose(dropAt(id, t), footAt(id, t));
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
    this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = untone(L.fog, this.bg);
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
