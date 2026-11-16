// The Crime and Punishment short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus gatsbyStage():
// who stands where, with which face and prop, in every shot. Cards, effects and blobs live on the NOINK layer.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxStars, Outfit, FrontOpts, SideOpts } from "../../engine/toon";
import { RASKOL, RASKOL_BARE, RASKOL_CONVICT, ALYONA, LIZAVETA, PORFIRY, SONYA, SONYA_SHAWL, MIKOLKA, CLERK, CONVICT,
  fxNapoleon, fxLouse, fxCatMouse, fxShadow2, fxCross, fxPurse2 } from "../../engine/library/crime";
import { MUSCOVITE, PEASANT } from "../../engine/library/peter";
import { fxCoin } from "../../engine/library/newton";
import { FPS, SHOTS, V3, clamp01, smooth, WORD, BEAT, MARK, doorAt } from "./story";
import { STONE, LODGE } from "./petersburg";
import { LANDING } from "./rooms";
import { NOINK } from "../../engine/ink";
import type { LightName } from "../../engine/lights";
import { cardShade, blobMaterial, CARD_K } from "../../engine/cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean;
  /** upright card fixed in the world (on a wall) at this yaw instead of facing the camera */
  yaw?: number };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3; t?: number };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: LightName = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Partial<Record<LightName, [number, number, number]>> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.16, 0.13, 0.26], lab: [0.3, 0.32, 0.42], sun: [0.24, 0.22, 0.34], morning: [0.26, 0.24, 0.36], party: [0.14, 0.13, 0.28], dark: [0.1, 0.1, 0.2], moon: [0.14, 0.15, 0.3] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME]!, k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ================= the Crime and Punishment short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const RK = who(600, RASKOL, "rask"), RB = who(600, RASKOL_BARE, "raskB"), RC = who(600, RASKOL_CONVICT, "raskC");
const AL = who(601, ALYONA, "alyona"), LZ = who(602, LIZAVETA, "liza"), PF = who(603, PORFIRY, "porf");
const SO = who(604, SONYA, "sonya"), SS = who(604, SONYA_SHAWL, "sonyaS"), MK = who(605, MIKOLKA, "mik");
const stand = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...fo }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
};
const profile = (cam: CamInfo, out: Stage, w: Who, m: V3, to: V3, so: SideOpts, shadow = true) => {
  const mirror = (to[0] - m[0]) * cam.right.x + (to[2] - m[2]) * cam.right.z < 0;
  out.places.push(person(cam, w, m[0], m[1], m[2], { side: true, mirror }, {}, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...so }));
  if (shadow) blob(out, m[0], m[1], m[2]);
};
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
};
const popK = (t: number, t0: number) => (t < t0 ? 0 : Math.min(1, (t - t0) / 0.12) * (1.12 - 0.12 * clamp01((t - t0 - 0.12) / 0.2)));
const bubbleAt = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, s: number, w = 0.95) => {
  if (s > 0) out.fx.push({ key, cw: 460, ch: 400, draw, x: c[0], y: c[1], z: c[2], w: w * s, h: w * 0.87 * s });
};
const crowd = (cam: CamInfo, t: number, out: Stage, spots: V3[], laugh: boolean) => spots.forEach((m, i) => {
  const o = i % 3 === 2 ? MUSCOVITE(i) : PEASANT;
  stand(cam, out, who(700 + i, o, `c${i}${i % 3 === 2 ? "m" : "p"}`), m, { expr: laugh ? (i % 2 ? "laugh" : "grin") : i % 2 ? "neutral" : "stern", facing: i % 2 ? 1 : -1,
    tilt: laugh && i % 2 ? q(3 * Math.sin(t * 11 + i), 2) : 0 });
});
const fxEyesPeek = (p: Pen) => { p.g.fillStyle = "#140e14"; p.g.fillRect(0, 0, 200, 120); for (const x of [70, 130]) { p.ell(x, 60, 20, 14, "#f4ecd8", 0); p.ell(x + 4, 62, 7, 9, "#1a1418", 0); } p.stroke([[50, 38], [92, 46]], 6, "#8a7a6a"); p.stroke([[150, 46], [110, 38]], 6, "#8a7a6a"); };

export const crimeStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  cam.t = t;
  if (id === 1) { // under the stone: the purse goes in on "genius"; a coin rolls out on "kopek", he snatches it back
    stand(cam, out, RK, M.yardR, { expr: on(t, WORD.kopek) ? "shock" : on(t, WORD.genius) ? "smug" : "nervous", facing: 1 });
    if (t < WORD.genius - 0.15) out.fx.push({ key: "purse", cw: 200, ch: 200, draw: fxPurse2, x: STONE[0] - 0.15, y: 0.3 + 0.4 * (1 - smooth((t - WORD.genius + 0.7) / 0.5)), z: STONE[2] + 0.4, w: 0.32, h: 0.32 });
    const r0 = WORD.kopek - 0.35, u = clamp01((t - r0) / 0.5);
    if (t >= r0 && t < WORD.kopek + 0.55) out.fx.push({ key: "coin", cw: 200, ch: 200, draw: (p) => fxCoin(p), x: STONE[0] + 0.3 + 0.9 * u, y: 0.08, z: STONE[2] + 0.5 + 0.4 * u, w: 0.14, h: 0.14, rot: 6 * u });
    return;
  }
  if (id === 2) { // along the canal: Raskolnikov walking, a few passers-by
    const x = M.walkStreet[0] + 0.9 * (t - BEAT[1]);
    profile(cam, out, RK, [x, 0, M.walkStreet[2]], [x + 3, 0, M.walkStreet[2]], { mode: "march", phase: q((t * 1.6) % 1, 20), expr: "nervous" });
    crowd(cam, t, out, [[-6, 0, -3], [5, 0, 0.5], [9, 0, -4], [-10, 0, 0.8], [13, 0, -2]], false);
    return;
  }
  if (id === 3 || id === 4 || id === 9) { // the garret
    if (id === 3 && on(t, WORD.dostoevsky)) {
      stand(cam, out, RK, M.standUp, { expr: "pained", facing: 1, headTilt: 10 });
      burst(out, t, WORD.dostoevsky - LEAD, [M.standUp[0], 1.9, M.standUp[2]], 0.4, "#fff3b0", 0.25);
      const u = q(((t - WORD.dostoevsky) * 0.9) % 1, 30);
      out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: M.standUp[0], y: 2.0, z: M.standUp[2] + 0.1, w: 0.5, h: 0.25 });
    } else {
      const shiver = id === 9 ? 0.012 * Math.sin(t * 50) : 0;
      stand(cam, out, id === 9 ? RB : RK, [M.sofa[0] + shiver, M.sofa[1], M.sofa[2]], { mode: "sit", expr: id === 9 ? "dazed" : id === 4 && on(t, WORD.napoleon) ? "smug" : "neutral", facing: 1 }, false);
    }
    if (id === 4) {
      const s = popK(t, WORD.theory - 0.05), hop = on(t, WORD.step) ? q(clamp01((t - WORD.step) / 0.9), 30) : -1;
      bubbleAt(out, `nap${hop}`, (p) => fxNapoleon(p, hop), [0.55, 2.0, -0.6], s, 0.95);
    }
    return;
  }
  if (id === 5) { // the porter's lodge: only the shadow of the axe crosses the wall
    stand(cam, out, RK, M.lodgeR, { expr: on(t, WORD.axe) ? "stern" : "nervous", facing: -1 });
    const k = clamp01((t - WORD.axe + 0.2) / 0.6);
    if (t >= WORD.axe - 0.2) out.fx.push({ key: "axeShadow", cw: 500, ch: 900, draw: (p) => fxShadow2(p, "axe"), x: LODGE[0] - 0.15, y: 1.0, z: -0.6 - 0.9 * k, w: 1.0, h: 1.9, yaw: Math.PI / 2, soft: true });
    return;
  }
  if (id === 6) { // her door opens a crack on the chain: two sharp eyes
    stand(cam, out, RK, M.landingR, { expr: "nervous", facing: -1 });
    const k = doorAt(6, t);
    if (k > 0.3) out.fx.push({ key: "peek", cw: 200, ch: 120, draw: fxEyesPeek, x: LANDING[0] + 0.42, y: 1.48, z: LANDING[2] + 0.06, w: 0.16 * k, h: 0.1, yaw: 0 });
    return;
  }
  if (id === 7) { // Lizaveta in the doorway; on "too" only an arm's shadow on the yellow paper, and the icon lamp goes out
    if (t < WORD.too - 0.05) stand(cam, out, LZ, M.lizaveta, { expr: on(t, WORD.walks) ? "shock" : "neutral", facing: -1, prop: "letter" });
    else out.fx.push({ key: "armShadow", cw: 500, ch: 900, draw: (p) => fxShadow2(p, "arm"), x: -1.15, y: 1.25, z: -2.17, w: 1.1, h: 2.0, yaw: 0, soft: true });
    void AL;
    return;
  }
  if (id === 8) { // the loot goes under the stone; he freezes on "checks"
    stand(cam, out, RK, M.yardR, { expr: on(t, WORD.checks) ? "shock" : "nervous", facing: 1, headTilt: on(t, WORD.checks) ? -6 : 0 });
    if (t < WORD.checks + 0.1) {
      out.fx.push({ key: "purse", cw: 200, ch: 200, draw: fxPurse2, x: STONE[0] + 0.05, y: 0.15, z: STONE[2] + 0.15, w: 0.3, h: 0.3 });
      out.fx.push({ key: "watch", cw: 200, ch: 200, draw: (p) => fxCoin(p), x: STONE[0] - 0.2, y: 0.08, z: STONE[2] + 0.3, w: 0.13, h: 0.13 });
    }
    if (on(t, WORD.checks)) burst(out, t, WORD.checks - LEAD, [M.yardR[0], 2.1, M.yardR[2]], 0.45, "#ffffff", 0.3);
    return;
  }
  if (id === 10 || id === 11 || id === 16) { // the police office
    if (id === 16) {
      stand(cam, out, who(710, CLERK(0), "clerk0"), M.clerk, { expr: on(t, WORD.years) ? "stern" : "shock", facing: 1 });
      stand(cam, out, who(711, CLERK(1), "clerk1"), [1.4, 0, -1.65], { expr: on(t, WORD.gets) ? "shock" : "neutral", facing: -1 });
      stand(cam, out, RB, M.confessR, { expr: "relief", facing: -1 });
      burst(out, t, WORD.years - LEAD, [-1.35, 0.95, -1.0], 0.6, "#ffffff", 0.25);
      return;
    }
    const circ = id === 10 ? t * 1.3 : 2.4;
    const pm: V3 = [M.suspect[0] + 1.25 * Math.cos(circ), 0, M.suspect[2] - 0.35 + 0.55 * Math.sin(circ)];
    stand(cam, out, RK, M.suspect, { expr: id === 11 && on(t, WORD.confesses) ? "shock" : "nervous", facing: 1 });
    const wink = id === 10 && on(t, WORD.arrests);
    stand(cam, out, PF, id === 10 ? pm : M.porfiry, { expr: id === 11 ? (on(t, WORD.confesses) ? "shock" : "smug") : wink ? "smile" : "grin", facing: -1, prop: id === 10 && on(t, WORD.cat) ? "point" : null });
    if (id === 10) bubbleAt(out, `cat${q((t * 1.4) % 1, 20)}`, (p) => fxCatMouse(p, q((t * 1.4) % 1, 20)), [0.35, 2.45, -0.8], popK(t, WORD.cat - 0.05) * (t < WORD.arrests - 0.1 ? 1 : 0), 0.9);
    if (id === 11) {
      const u = clamp01((t - WORD.painter + 0.2) / 0.5), kneel = on(t, WORD.confesses);
      stand(cam, out, MK, [M.mikolka[0] + 1.6 * (1 - u), 0, M.mikolka[2]], { mode: kneel ? "sit" : "stand", expr: kneel ? "nervous" : "grin", facing: -1 }, !kneel);
      if (kneel) burst(out, t, WORD.confesses - LEAD, [M.mikolka[0], 0.5, M.mikolka[2] + 0.1], 0.5, "#ffffff", 0.25);
    }
    return;
  }
  if (id === 12) { // free by the canal railing; a sunbeam
    stand(cam, out, RB, M.rail, { expr: on(t, WORD.free) ? "relief" : "dazed", facing: 0 });
    burst(out, t, WORD.free - LEAD, [M.rail[0] + 0.4, 2.3, M.rail[2] + 0.4], 1.1, "#fff4c8", 0.5);
    return;
  }
  if (id === 13) {
    stand(cam, out, SO, M.sonya, { expr: on(t, WORD.confesses2) ? (on(t, WORD.family) ? "pained" : "shock") : "neutral", facing: 1 });
    stand(cam, out, RB, M.sonyaR, { expr: "pained", facing: -1 });
    return;
  }
  if (id === 14) {
    stand(cam, out, SS, M.sonya, { expr: on(t, WORD.crossroads) ? "stern" : "nervous", facing: 1, prop: on(t, WORD.crossroads) ? "point" : null });
    const s = popK(t, WORD.himself - 0.1);
    if (s > 0) out.fx.push({ key: "cross", cw: 120, ch: 160, draw: fxCross, x: M.sonya[0] + 0.3, y: 1.25, z: M.sonya[2] + 0.2, w: 0.1 * s, h: 0.13 * s });
    return;
  }
  if (id === 15) { // the Haymarket: he kneels and kisses the ground; people stare and laugh
    const down = on(t, WORD.does);
    stand(cam, out, RB, M.kneel, { mode: down ? "sit" : "stand", expr: down ? "relief" : "nervous", facing: 1, headTilt: down ? 18 : 0 }, !down);
    const ring: V3[] = [];
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + 1.1 * (i / 8)); ring.push([M.kneel[0] + 2.4 * Math.cos(a) * 1.2, 0, M.kneel[2] - 0.6 + 2.0 * Math.sin(a)]); }
    crowd(cam, t, out, ring, down);
    return;
  }
  if (id >= 17) { // Siberia
    const convicts: V3[] = [[-5.2, 0, 3.2], [-1.6, 0, 1.6], [-6.6, 0, 4.4], [-2.2, 0, 4.6]];
    convicts.forEach((m, i) => stand(cam, out, who(720 + i, CONVICT(i), `conv${i}`), m, { expr: i % 2 ? "stern" : "pained", facing: i % 2 ? 1 : -1, prop: i % 2 ? "chest" : null }));
    if (id === 17) stand(cam, out, RC, M.convict, { expr: "stern", facing: -1, prop: "chest" });
    if (id === 18) {
      stand(cam, out, SS, M.sonyaGate, { expr: on(t, WORD.follows) ? "smile_closed" : "neutral", facing: 0 });
      profile(cam, out, RC, M.last, M.sonyaGate, { expr: "neutral" });
    }
    if (id === 19) {
      stand(cam, out, RC, M.last, { expr: on(t, WORD.louse) ? "smile_closed" : on(t, WORD.napoleon2) ? "smug" : "neutral", facing: 0 });
      const c: V3 = [M.last[0] + 0.2, 2.2, M.last[2] - 0.2];
      if (on(t, WORD.louse)) bubbleAt(out, "louse", fxLouse, c, popK(t, WORD.louse - 0.05), 0.8);
      else bubbleAt(out, "napB", (p) => fxNapoleon(p), c, popK(t, WORD.napoleon2 - 0.05), 0.8);
    }
    return;
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  crimeStage(id, t, cam, out);
  return out;
};
