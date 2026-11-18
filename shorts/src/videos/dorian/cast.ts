// Our cast as lit flat sprites in the 3D world (machinery shared with the East of Eden short). Each frame every character
// asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct drawing. Characters are yaw-only
// billboards shaded by cardShade(); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { fxShine, fxHeart, fxTwinkle } from "../../engine/library/stranger";
import { fxHalo } from "../../engine/library/eden";
import { DORIAN, DORIAN_DAY, BASIL, BASIL_ULSTER, HENRY, SIBYL, ALAN, MRS_LEAF, FRANCIS, COACHMAN, lyingOld, fxHandRings, fxOldThought, fxSoulSwirl, fxSmokeRing, fxBottle, fxChemChest, fxFume, fxStabShadow, fxKey } from "../../engine/library/dorian";
import { FPS, SHOTS, V3, smooth, clamp01, WORD, MARK, P_HEAD } from "./story";
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
  /** lie flat on the floor (the card's up axis points toward -z) */
  flat?: boolean;
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean;
  /** upright card fixed in the world (on a wall) at this yaw instead of facing the camera */
  yaw?: number };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

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

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */

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
const CONTACT: Partial<Record<LightName, [number, number, number]>> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.16, 0.13, 0.26], lab: [0.3, 0.32, 0.42], sun: [0.24, 0.22, 0.34], dark: [0.1, 0.1, 0.2], moon: [0.14, 0.15, 0.3], morning: [0.22, 0.2, 0.3] };
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

// ================= shared staging helpers =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const M = MARK;
const FRONT = { side: false, mirror: false };
const W = WORD as Record<string, number>;
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const standAt = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, fo, {}, scale));
  if (shadow && fo.mode !== "sit") blob(out, m[0], m[1], m[2], scale);
};
export const puff = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.6) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const walk = (t: number, t0: number, t1: number, a: V3, b: V3, rate = 1.6) => {
  const u = clamp01((t - t0) / (t1 - t0)), e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  return { m: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e] as V3, moving: u > 0 && u < 1, phase: q((t * rate) % 1, 24) };
};
const icon = (out: Stage, t: number, t0: number, c: V3, size: number, key: string, draw: (p: Pen) => void) => {
  if (t < t0 - LEAD) return;
  const u = clamp01((t - t0 + LEAD) / 0.18), s = u < 1 ? 0.6 + 0.5 * Math.sin((u * Math.PI) / 1.6) : 1;
  out.fx.push({ key, cw: 200, ch: 200, draw, x: c[0], y: c[1] + 0.05 * Math.sin(t * 3 + c[0]), z: c[2], w: size * s, h: size * s });
};
const shine = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.5) => {
  if (t < t0 || t >= t0 + dur) return;
  const k = q((t - t0) / dur, 20);
  out.fx.push({ key: `shine${k}`, cw: 200, ch: 200, draw: (p) => fxShine(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, rot: k * 0.5 });
};


// ================= The Picture of Dorian Gray: who stands where, per shot =================
const DO = who(600, DORIAN, "do"), DD = who(600, DORIAN_DAY, "dd"), BA = who(601, BASIL, "ba"), BU = who(601, BASIL_ULSTER, "bu");
const HE = who(602, HENRY, "he"), SI = who(603, SIBYL, "si"), AL = who(604, ALAN, "al");
const ML = who(605, MRS_LEAF, "ml"), FR = who(606, FRANCIS, "fr"), CO = who(607, COACHMAN, "co");
const sit = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts) => standAt(cam, out, w, m, { ...fo, mode: "sit" });
const card = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, w: number, h = w, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw: 200, ch: 200, draw, x: c[0], y: c[1], z: c[2], w, h, ...extra });
/** little twinkles round a point from t0 */
const twinkles = (out: Stage, t: number, t0: number, c: V3, n = 4, r = 0.35, size = 0.16) => {
  if (t < t0 - LEAD) return;
  for (let k = 0; k < n; k++) {
    const tw = q(0.5 + 0.5 * Math.sin(t * 5 + k * 2.1), 8), a = k * 2.4 + 0.6;
    icon(out, t, t0 + 0.06 * k, [c[0] + r * Math.cos(a), c[1] + 0.7 * r * Math.sin(a), c[2] + 0.05], size, `tw${tw}`, (p) => fxTwinkle(p, tw));
  }
};
/** a sick green-gold ring of rays round the painted face as it changes (the centre stays clear so the face reads) */
const ring = (out: Stage, t: number, t0: number, c: V3, dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `ring${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#9aa860", 14, 185, 240), x: c[0], y: c[1], z: c[2] + 0.2, w: 1.5, h: 1.5 });
};
/** the dead man lying on the floor (one tableau card, lit like the cast) */
const lyingAt = (cam: CamInfo, out: Stage, m: V3) => {
  // laid flat on the boards, feet toward the camera, head toward the portrait wall (seen from the feet: fits 9:16)
  const d = cam.pos.distanceTo(tmp.set(m[0], m[1], m[2] - 0.9));
  const [w, h, k] = tier(d * 0.8);
  const f2: FrontOpts = { light: 0, seed: seedOf(DO.i) };
  out.places.push({ key: `L|old|${fkey(f2)}`, x: m[0], y: m[1], z: m[2], flat: true, draw: (p) => lyingOld(p, f2), size: [w, h, k] });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS;
  switch (id) {
    case 1: case 21: { // the hook / the loop: young Dorian beside his portrait in the schoolroom
      const tr = id === 1 ? W.hideous : W.wished;
      standAt(cam, out, DO, M.dor, { mode: "stand", expr: on(t, tr) ? "smug" : "smile_closed", facing: 1, blink: lidAt(t, 600, [tr]) });
      if (id === 1) ring(out, t, W.hideous - 0.05, P_HEAD.school);
      break;
    }
    case 2: { // the studio, wide: Basil at the easel, Dorian posing on the dais, Lord Henry on the divan
      standAt(cam, out, BA, M.basilEasel, { mode: "stand", expr: "smile", prop: "point", facing: -1, blink: lidAt(t, 601) });
      standAt(cam, out, DD, M.dorDais, { mode: "stand", expr: "smile_closed", facing: 1, blink: lidAt(t, 600) });
      sit(cam, out, HE, M.henry, { expr: "smug", prop: "cigarette", facing: 1, blink: lidAt(t, 602) });
      break;
    }
    case 3: { // Basil steps back from the finished canvas; the painted face sparkles
      const w = walk(t, b0 + 0.3, W.beautiful - 0.1, M.basilEasel, M.basilBack, 1.6);
      standAt(cam, out, BA, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: on(t, W.beautiful) ? "grin" : "smile", prop: on(t, W.beautiful) ? "point" : null, facing: -1, blink: lidAt(t, 601) });
      twinkles(out, t, W.beautiful, P_HEAD.studio, 5, 0.4, 0.18);
      break;
    }
    case 4: { // Dorian on the dais gazing at the portrait (front right); the old face he imagines
      standAt(cam, out, DD, M.dorDais, { mode: "stand", expr: on(t, W.instead) ? "smile" : on(t, W.wishes) ? "pained" : "neutral", facing: 1, blink: lidAt(t, 600, [W.wishes]) });
      if (on(t, W.wishes)) icon(out, t, W.wishes, [M.dorDais[0] + 0.45, 2.55, M.dorDais[2] + 0.1], 0.75, "oldthought", fxOldThought);
      break;
    }
    case 5: { // close: hand on heart, he swears; the bargain swirls round him
      standAt(cam, out, DD, M.dorDais, { mode: "stand", expr: on(t, W.soul) ? "yell" : "stern", prop: "chest", blink: lidAt(t, 600, [W.soul]) });
      if (on(t, W.soul)) { const k = q(((t - W.soul) * 0.8) % 1, 24); card(out, `swirl${k}`, (p) => fxSoulSwirl(p, k), [M.dorDais[0], 2.0, M.dorDais[2] + 0.15], 1.5, 1.5, { soft: true }); }
      break;
    }
    case 6: { // Lord Henry on the divan, smoke rings; Dorian dazzled beside him
      sit(cam, out, HE, M.henry, { expr: on(t, W.witty) ? "smug" : "smile", prop: "cigarette", facing: 1, blink: lidAt(t, 602) });
      standAt(cam, out, DD, M.dorHenry, { mode: "stand", expr: on(t, W.pleasure) ? "grin" : "dazed", facing: -1, blink: lidAt(t, 600, [W.pleasure]) });
      for (let k = 0; k < 3; k++) {
        const u = (t - (W.witty + 0.45 * k)) / 1.6;
        if (u > 0 && u < 1) card(out, "smokering", fxSmokeRing, [M.henry[0] + 0.15 + 0.3 * u, 1.35 + 0.9 * u, M.henry[2] + 0.1], 0.18 + 0.25 * u, 0.18 + 0.25 * u, { soft: true });
      }
      if (on(t, W.pleasure)) twinkles(out, t, W.pleasure, [M.dorHenry[0], 2.0, M.dorHenry[2]], 4, 0.35, 0.14);
      break;
    }
    case 7: { // Juliet on the balcony; Dorian in his box, hearts
      standAt(cam, out, SI, M.sibyl, { mode: "stand", expr: on(t, W.juliet) ? "smile_closed" : "smile", prop: "chest", blink: lidAt(t, 603) }, false);
      if (on(t, W.juliet)) twinkles(out, t, W.juliet, [M.sibyl[0], M.sibyl[1] + 1.55, M.sibyl[2] + 0.1], 4, 0.35, 0.13);
      sit(cam, out, DO, M.dorBox, { expr: on(t, W.falls) ? "grin" : "smile", facing: 1, blink: lidAt(t, 600) });
      if (on(t, W.falls)) for (let k = 0; k < 4; k++) {
        const u = (t - (W.falls + 0.25 * k)) / 1.3;
        if (u > 0 && u < 1) { const hk = q(u, 10); card(out, `heart${hk}`, (p) => fxHeart(p, hk), [M.dorBox[0] + 0.35 + 0.2 * Math.sin(k * 2 + u * 3), M.dorBox[1] + 1.25 + 0.7 * u, M.dorBox[2] + 0.1], 0.34); }
      }
      break;
    }
    case 8: { // she acts badly; he stands and denounces her; the curtain comes down on her
      const stiff = !on(t, W.cruelly);
      standAt(cam, out, SI, M.sibyl, { mode: "stand", expr: stiff ? "nervous" : "pained", blink: lidAt(t, 603, [W.cruelly]), headTilt: stiff ? 0 : 8 }, false);
      if (on(t, W.dumps)) standAt(cam, out, DO, M.dorBoxUp, { mode: "stand", expr: "yell", prop: "point", facing: 1, blink: lidAt(t, 600) }, false);
      else sit(cam, out, DO, M.dorBox, { expr: "stern", facing: 1, blink: lidAt(t, 600) });
      break;
    }
    case 9: { // the library at dawn: Dorian finds the cruelty in the painted mouth
      standAt(cam, out, DO, M.dorLib, { mode: "stand", expr: on(t, W.cruel) ? "shock" : "neutral", facing: 1, blink: on(t, W.cruel) ? 0 : lidAt(t, 600) });
      break;
    }
    case 10: { // the empty stage: a small bottle glints; the footlights die
      card(out, "bottle", fxBottle, [M.bottle[0], M.bottle[1] + 0.11, M.bottle[2]], 0.22);
      shine(out, t, W.poisoned - 0.05, [M.bottle[0] + 0.03, M.bottle[1] + 0.2, M.bottle[2] + 0.05], 0.35, 0.6);
      break;
    }
    case 11: { // he throws the satin over it, turns the key, grins at us
      standAt(cam, out, DO, M.dor, { mode: "stand", expr: on(t, W.likes) ? "grin" : on(t, W.locks) ? "smug" : "stern", prop: on(t, W.locks) ? "fist" : null, facing: 1, blink: lidAt(t, 600, [W.locks]) });
      if (on(t, W.locks) && !on(t, W.likes)) { icon(out, t, W.locks, [M.dor[0] + 0.32, 1.15, M.dor[2] + 0.25], 0.2, "key", fxKey); shine(out, t, W.locks + 0.1, [M.dor[0] + 0.36, 1.2, M.dor[2] + 0.3], 0.3, 0.45); }
      break;
    }
    case 12: { // stains bloom on the canvas; his face stays smooth as glass
      standAt(cam, out, DO, M.dor, { mode: "stand", expr: on(t, W.twenty) ? "smug" : "smile_closed", facing: 1, blink: lidAt(t, 600) });
      ring(out, t, W.sin - 0.05, P_HEAD.school);
      twinkles(out, t, W.twenty, [M.dor[0], 1.95, M.dor[2] + 0.1], 5, 0.32, 0.14);
      break;
    }
    case 13: { // Basil holds his candle up to the canvas; the shadow on the wall
      if (!on(t, W.stabs)) {
        standAt(cam, out, BU, M.basil, { mode: "stand", expr: on(t, W.finally) ? "shock" : "neutral", prop: "candle", facing: -1, blink: on(t, W.finally) ? 0 : lidAt(t, 601) });
        standAt(cam, out, DO, M.dor, { mode: "stand", expr: on(t, W.sees) ? "angry" : "stern", facing: 1, blink: lidAt(t, 600, [W.sees]) });
      } else {
        const k = q(smooth((t - (W.stabs - 0.05)) / 0.22), 12);
        card(out, `stabsh${k}`, (p) => fxStabShadow(p, k), [1.65, 1.55, -3.13], 1.3, 1.7, { yaw: 0, soft: true });
        shine(out, t, W.stabs - 0.08, [1.95, 2.25, -3.05], 0.4, 0.35);
      }
      break;
    }
    case 14: { // the blackmail letter; Campbell's chest of chemicals; green fumes and a poof
      standAt(cam, out, DO, M.dorMid, { mode: "stand", expr: "smug", prop: "letter", facing: 1, blink: lidAt(t, 600) });
      standAt(cam, out, AL, M.alan, { mode: "stand", expr: on(t, W.disappear) ? "pained" : on(t, W.blackmailed) ? "shock" : "nervous", facing: -1, blink: lidAt(t, 604, [W.blackmailed]) });
      card(out, "chemchest", fxChemChest, [0.45, 0.3, -1.4], 0.6);
      for (let k = 0; k < 3; k++) { const u = (t - (W.disappear - 0.1 + 0.18 * k)) / 1.2; if (u > 0 && u < 1) { const fk = q(u, 12); card(out, `fume${fk}`, (p) => fxFume(p, fk), [0.85 + 0.3 * (k - 1), 0.75 + 0.6 * u, -1.25], 0.8, 0.8, { soft: true }); } }
      puff(out, t, W.disappear, [0.85, 0.9, -1.2], 1.2, 0.6);
      break;
    }
    case 15: { // halo of the good man; it clatters off when the sneer appears
      const down = clamp01((t - (W.but - 0.05)) / 0.4);
      standAt(cam, out, DO, M.dorMid, { mode: "stand", expr: on(t, W.but) ? "nervous" : "smile_closed", facing: 0, blink: lidAt(t, 600) });
      if (on(t, W.good)) icon(out, t, W.good, [M.dorMid[0], 1.9 - 1.6 * down * down, M.dorMid[2] + 0.15], 0.42, "halo", fxHalo);
      ring(out, t, W.sneer - 0.05, P_HEAD.school);
      break;
    }
    case 16: { // he lunges at the canvas: a glint, then white
      const w = walk(t, W.same - 0.15, W.knife + 0.1, M.dor, M.dorLunge, 2.2);
      standAt(cam, out, DO, w.m, { mode: "stand", expr: "angry", prop: on(t, W.same) ? "fist" : null, facing: 1, blink: lidAt(t, 600), tilt: on(t, W.same) ? -6 : 0 });
      shine(out, t, W.same - 0.05, [w.m[0] + 0.3, 1.25, w.m[2] + 0.2], 0.45, 0.5);
      break;
    }
    case 17: { // the servants have climbed in at the window; then the portrait, young again
      if (!on(t, W.portrait4)) {
        standAt(cam, out, FR, M.francis, { mode: "stand", expr: "shock", facing: 1, blink: lidAt(t, 606) });
        standAt(cam, out, ML, M.leaf, { mode: "stand", expr: on(t, W.servants) ? "shock" : "nervous", prop: "candle", facing: 1, blink: lidAt(t, 605) });
        standAt(cam, out, CO, M.coach, { mode: "stand", expr: "shock", facing: -1, blink: lidAt(t, 607) });
      } else twinkles(out, t, W.lovely, P_HEAD.school, 6, 0.45, 0.2);
      break;
    }
    case 18: case 19: case 20: { // the dead man on the floor; his hand and its rings; then only the portrait
      lyingAt(cam, out, M.body);
      if (id === 18) shine(out, t, W.heart - 0.05, [M.body[0] + 0.04, 0.14, M.body[2] - 0.92], 0.55, 0.7);
      if (id === 19) {
        const rk = on(t, W.rings) ? q(0.5 + 0.5 * Math.sin((t - W.rings) * 9), 6) : 0;
        out.fx.push({ key: `hand${rk}`, cw: 700, ch: 700, draw: (p) => { p.g.scale(3.5, 3.5); fxHandRings(p, rk); }, x: M.hand[0], y: M.hand[1], z: M.hand[2], w: 0.55, h: 0.55, flat: true, rot: 0.25 });
        if (on(t, W.rings)) twinkles(out, t, W.rings, [M.hand[0] + 0.12, 0.08, M.hand[2] - 0.1], 3, 0.1, 0.09);
      }
      break;
    }
  }
  return out;
};
export { FPS };
