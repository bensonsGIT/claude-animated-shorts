// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { fxShine, fxTelegram, fxTwinkle } from "../../engine/library/stranger";
import { CAL, ARON, ARON_ARMY, ADAM, KATE, CATHY, WIREBOY, FARMER, inBed, fxBean, fxGift, fxCrate, fxSlime, fxFly, fxCash, fxHalo, fxFlake, fxCrossDown } from "../../engine/library/eden";
import { FPS, SHOTS, V3, smooth, clamp01, WORD, MARK } from "./story";
import { PASS } from "./rooms";
const PASS_SLIDE = PASS.slide;
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

// ================= East of Eden =================
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
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
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

const CA = who(500, CAL, "ca"), AR = who(501, ARON, "ar"), ARA = who(501, ARON_ARMY, "ara"), AD = who(502, ADAM, "ad");
const KA = who(503, KATE, "ka"), CY = who(503, CATHY, "cy"), WB = who(504, WIREBOY, "wb");
/** Lee, the Trasks' cook and friend: Chinese-American, ~60 in 1917, grey-black hair, a plain dark suit */
const LEE: Outfit = { jacket: "#2e3038", pants: "#2e3038", boots: "#1a1a1e", hat: "hair", hair: "#9a9898", skin: "#ecc89c", band: "#f4f1e8", buttons: "#8a8c98", specs: true };
const LE = who(505, LEE, "le");
const sit = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts) => standAt(cam, out, w, m, { ...fo, mode: "sit" });
const card = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, w: number, h = w, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw: 200, ch: 200, draw, x: c[0], y: c[1], z: c[2], w, h, ...extra });
/** Adam propped up in bed (one tableau card standing on the mattress) */
const inBedAt = (cam: CamInfo, out: Stage, m: V3, fo: FrontOpts) => {
  const d = cam.pos.distanceTo(tmp.set(m[0], m[1] + 1.2, m[2]));
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { ...fo, light: light2D(cam, false), seed: seedOf(AD.i) };
  out.places.push({ key: `B|ad|${fkey(f2)}`, x: m[0], y: m[1], z: m[2], draw: (p) => inBed(p, ADAM, f2), size: [w, h, k] });
};
/** beans raining down round (cx, cz) from t0: n beans, each falling from ~4.5 m and bouncing out on the ground */
const beanRain = (out: Stage, t: number, t0: number, cx: number, cz: number, n = 75) => {
  for (let i = 0; i < n; i++) {
    const ti = t0 + hh(i, 1) * 1.6, u = t - ti;
    if (u < 0) continue;
    const x = cx + (hh(i, 2) - 0.5) * 3.4, z = cz + (hh(i, 3) - 0.5) * 1.6 - 0.2;
    const y = Math.max(0.05, 4.6 - 4.9 * u * u * 1.2);
    card(out, `bean${i % 4}`, (p) => fxBean(p, i % 4), [x, y, z], 0.16, 0.16, { rot: q(t * 4 + i, 8) });
  }
};
/** a single fly on a little orbit */
const fly = (out: Stage, t: number, c: V3, i: number, r = 0.35) => {
  const a = t * (2.4 + 0.4 * i) + i * 2.1, k = Math.floor(t * 18 + i) % 2;
  card(out, `fly${k}`, (p) => fxFly(p, k), [c[0] + r * Math.cos(a), c[1] + 0.15 * Math.sin(a * 1.7), c[2] + 0.3 * r * Math.sin(a)], 0.07);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS;
  switch (id) {
    case 1: case 26: { // the hook: Cal in the bean field holding a big present; beans rain down
      const tr = id === 1 ? W.beans : W.buy;
      standAt(cam, out, CA, M.hook, { mode: "stand", expr: on(t, tr) ? "smile" : "nervous", prop: "fist", blink: lidAt(t, 500) });
      card(out, "gift", fxGift, [M.hook[0] + 0.05, 1.0, M.hook[2] + 0.18], 0.62);
      beanRain(out, t, tr - 0.25, M.hook[0], M.hook[2]);
      break;
    }
    case 2: { // "His father turned it down!": the present slides back to Cal across the table
      sit(cam, out, AD, M.adamSeat, { expr: on(t, W.turned) ? "stern" : "neutral", prop: on(t, W.turned) ? "point" : null, facing: -1, blink: lidAt(t, 502) });
      standAt(cam, out, CA, M.calEnd, { mode: "stand", expr: on(t, W.down) ? "pained" : "smile", facing: 1, blink: lidAt(t, 500, [W.down]) });
      const u = smooth((t - (W.turned - 0.05)) / 0.45);
      card(out, "gift", fxGift, [-0.1 - 1.15 * u, 0.93, -1.35 + 0.15 * u], 0.36);
      break;
    }
    case 3: { // wide: the ranch, the two boys tiny in the yard
      standAt(cam, out, AR, M.boy1, { mode: "stand", expr: "smile", blink: lidAt(t, 501) });
      standAt(cam, out, CA, M.boy2, { mode: "stand", expr: "neutral", blink: lidAt(t, 500), facing: -1 });
      break;
    }
    case 4: { // golden Aron (halo) in front, dark Cal behind, glaring
      standAt(cam, out, AR, M.aron4, { mode: "stand", expr: on(t, W.loves) ? "grin" : "smile", blink: lidAt(t, 501), facing: 1 });
      if (on(t, W.golden)) icon(out, t, W.golden, [M.aron4[0], 2.3, M.aron4[2]], 0.55, "halo", fxHalo);
      standAt(cam, out, CA, M.cal4, { mode: "stand", expr: on(t, W.jealous) ? "angry" : "stern", blink: lidAt(t, 500, [W.jealous]), facing: -1 });
      break;
    }
    case 5: { // the nursery, night: the glint and bang (never the gun), then Cathy walks out toward the camera
      const gone = on(t, W.walked);
      const w = gone ? walk(t, W.walked - 0.1, W.walked + 1.3, M.cathy, M.cathyOut, 1.6) : { m: M.cathy, moving: false, phase: 0 };
      standAt(cam, out, CY, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: gone ? "smug" : "stern", blink: lidAt(t, 503), facing: gone ? -1 : 1 });
      shine(out, t, W.shot - 0.08, [M.cathy[0] + 0.5, 1.25, M.cathy[2] + 0.2], 0.7, 0.4);
      burst(out, t, W.shot, [M.cathy[0] + 0.9, 1.3, M.cathy[2] - 0.2], 1.3, "#fff3b0", 0.25);
      break;
    }
    case 6: { // Adam tells the boys she is dead
      sit(cam, out, CA, M.calSeat, { expr: on(t, W.dead) ? "shock" : "neutral", blink: lidAt(t, 500, [W.dead]), facing: 1 });
      sit(cam, out, AD, M.adamSeat, { expr: on(t, W.dead) ? "pained" : "stern", prop: "chest", blink: lidAt(t, 502) });
      sit(cam, out, AR, M.aronSeat, { expr: on(t, W.dead) ? "pained" : "neutral", blink: lidAt(t, 501), facing: -1 });
      break;
    }
    case 7: case 8: case 17: { // Kate's parlour: Cal (and Aron) in the doorway, Kate on the settee
      if (id !== 8) sit(cam, out, KA, M.kate, { expr: id === 17 && on(t, W.mom) ? "smug" : on(t, W.alive) ? "smug" : "stern", blink: lidAt(t, 503), facing: -1 });
      if (id === 17) {
        standAt(cam, out, CA, M.doorCal, { mode: "stand", expr: "stern", blink: lidAt(t, 500), facing: 1 });
        standAt(cam, out, AR, M.doorAron, { mode: "stand", expr: on(t, W.mom) ? "shock" : "smile", blink: on(t, W.mom) ? 0 : lidAt(t, 501), facing: 1, tilt: on(t, W.mom) ? -6 : 0 });
      } else {
        standAt(cam, out, CA, id === 8 ? M.doorCal : M.door, { mode: "stand", expr: id === 8 ? (on(t, W.blood) ? "pained" : "nervous") : on(t, W.alive) ? "shock" : "neutral", blink: lidAt(t, 500, [W.alive]), facing: 1 });
      }
      break;
    }
    case 9: { // Adam loads a lettuce crate into the iced boxcar
      const u = smooth((t - (W.lettuce - 0.4)) / 0.7);
      standAt(cam, out, AD, M.adamCar, { mode: "stand", expr: "smile", prop: u < 1 ? "fist" : "point", facing: -1, blink: lidAt(t, 502) });
      card(out, "crate0", (p) => fxCrate(p, 0), [1.55 - 0.85 * u, 1.05 + 0.35 * u, -1.55 - 1.0 * u], 0.5);
      break;
    }
    case 10: { // the snowslide: flakes billow on impact
      const sl = t - WORD.blocked;
      if (sl > -0.2) for (let i = 0; i < 18; i++) {
        const u = clamp01((sl + 0.2) / 1.4), a2 = hh(i, 5) * Math.PI;
        card(out, "flake", fxFlake, [PASS_SLIDE + Math.cos(a2) * (1 + 5 * u), 4 + Math.sin(a2) * 4 * u + 2 * hh(i, 6), -8 + (hh(i, 7) - 0.5) * 4], 0.6 + 0.8 * u, undefined, { soft: true });
      }
      break;
    }
    case 11: { // close on a boxcar: slime oozes out of the door, flies
      const u = smooth((t - (W.rotted - 0.5)) / 0.7);
      if (u > 0) card(out, `slime${q(u, 10)}`, (p) => fxSlime(p, q(u, 10)), [-6.0, 4.0 - 0.3 * u, -6.62], 1.3, 1.3, { yaw: 0 });
      if (on(t, W.rotted)) for (let i = 0; i < 5; i++) fly(out, t, [-6.0, 4.6, -6.3], i);
      break;
    }
    case 12: { // Cal and the bean farmers: sacks fill, a bundle of cash appears in Cal's hands
      standAt(cam, out, CA, M.calField, { mode: "stand", expr: on(t, W.earns) ? "grin" : "smile", prop: "fist", blink: lidAt(t, 500) });
      M.farmers.forEach((m, i) => standAt(cam, out, who(510 + i, FARMER(i), `fm${i}`), m, { mode: "stand", expr: on(t, W.wartime) ? "grin" : "neutral", prop: i === 1 ? "point" : null, blink: lidAt(t, 510 + i), facing: m[0] < 0 ? 1 : -1 }));
      beanRain(out, t, W.wartime - 0.2, 0.2, -1.6, 30);
      if (on(t, W.earns)) icon(out, t, W.earns, [M.calField[0] + 0.05, 1.05, M.calField[2] + 0.2], 0.42, "cash", fxCash);
      break;
    }
    case 13: case 14: case 15: { // Thanksgiving
      const hope = id === 13, refuse = id === 14 && on(t, W.profit), praise = id === 15 && on(t, W.brother);
      sit(cam, out, CA, M.calSeat, { expr: hope ? (on(t, W.thanksgiving) ? "smile" : "nervous") : refuse || id === 15 ? "pained" : "nervous", blink: lidAt(t, 500, [W.profit]), facing: 1 });
      sit(cam, out, AD, M.adamSeat, { expr: praise ? "smile" : refuse ? "stern" : "neutral", prop: id === 14 && on(t, W.give) ? "point" : null, facing: praise ? 1 : -1, blink: lidAt(t, 502) });
      sit(cam, out, AR, M.aronSeat, { expr: praise ? "smile_closed" : "neutral", blink: lidAt(t, 501), facing: -1 });
      if (praise) icon(out, t, W.brother, [M.aronSeat[0], 1.95, M.aronSeat[2]], 0.45, "halo", fxHalo);
      const g0: V3 = [-0.85, 0.91, -1.25], g1: V3 = [0.0, 0.91, -1.3];
      const u = id === 13 ? smooth((t - (W.thanksgiving - 0.3)) / 0.5) : id === 14 ? 1 - smooth((t - (W.profit - 0.05)) / 0.4) : 0;
      card(out, "gift", fxGift, [g0[0] + (g1[0] - g0[0]) * u, g0[1], g0[2] + (g1[2] - g0[2]) * u], 0.34);
      break;
    }
    case 16: { // night: Cal feeds the cash into the stove
      standAt(cam, out, CA, M.calStove, { mode: "stand", expr: on(t, W.burns) ? "angry" : "pained", prop: "fist", facing: 1, blink: lidAt(t, 500) });
      for (let i = 0; i < 5; i++) {
        const u = clamp01((t - (W.burns - 0.1 + i * 0.12)) / 0.45);
        if (u > 0 && u < 1) card(out, "cash", fxCash, [2.0 + 0.35 * u, 1.05 - 0.45 * u + 0.25 * Math.sin(u * Math.PI), -2.3 - 0.3 * u], 0.25 * (1 - 0.4 * u), undefined, { rot: u * 2 });
      }
      burst(out, t, W.burns + 0.35, [2.3, 0.65, -2.6], 0.9, "#ffb060", 0.35);
      break;
    }
    case 18: { // Aron in uniform walks toward the camera and out of frame
      const w = walk(t, b0 + 0.2, b0 + 3.4, M.armyA, M.armyB, 1.7);
      standAt(cam, out, ARA, w.m, { mode: w.moving ? "march" : "stand", phase: w.phase, expr: "stern", blink: lidAt(t, 501) });
      break;
    }
    case 19: { // Kate alone; the lamp dies; her eyes close
      const shut = on(t, W.everything);
      sit(cam, out, KA, M.kate, { expr: shut ? "neutral" : "stern", blink: shut ? 1 : lidAt(t, 503), headTilt: shut ? 10 * smooth((t - W.everything) / 0.6) : 0 });
      break;
    }
    case 20: { // the empty road, Aron's little cross lying in the dust
      card(out, "crossdown", fxCrossDown, [M.cross[0], 0.03, M.cross[2]], 0.42, 0.42, { flat: true, rot: 0.5 });
      break;
    }
    case 21: { // the telegram on the porch
      const got = on(t, W.telegram);
      standAt(cam, out, AD, M.porchAdam, { mode: "stand", expr: on(t, W.stroke) ? "dazed" : got ? "shock" : "neutral", prop: got ? "letter" : null, blink: lidAt(t, 502), tilt: on(t, W.stroke) ? 7 * smooth((t - W.stroke) / 0.5) : 0 });
      standAt(cam, out, WB, M.wireBoy, { mode: "stand", expr: "nervous", prop: got ? null : "letter", facing: -1, blink: lidAt(t, 504) });
      break;
    }
    case 22: { // Lee at the table at night with his books; the word glows
      sit(cam, out, LE, M.adamSeat, { expr: on(t, W.timshel) ? "smile_closed" : "neutral", prop: "chin", blink: lidAt(t, 505) });
      card(out, "telegram", fxTelegram, [-0.25, 0.75, -1.2], 0.3, 0.3, { flat: true, rot: 0.2 });
      card(out, "telegram", fxTelegram, [0.3, 0.755, -1.15], 0.3, 0.3, { flat: true, rot: -0.3 });
      if (on(t, W.timshel)) for (let k = 0; k < 3; k++) { const tw = q(0.5 + 0.5 * Math.sin(t * 4 + k * 2), 8); icon(out, t, W.timshel + 0.1 * k, [-0.45 + 0.45 * k, 0.86 + 0.06 * (k % 2), -1.1], 0.15, `tw${tw}`, (p) => fxTwinkle(p, tw)); }
      break;
    }
    case 23: case 24: { // Adam in bed, Lee to his left, Cal to his right; the blessing
      const bless = id === 24 && on(t, W.blesses);
      inBedAt(cam, out, M.bedAdam, { expr: bless ? "smile_closed" : "dazed", blink: bless ? 0.5 : lidAt(t, 502) });
      if (id === 23) standAt(cam, out, LE, M.lee, { mode: "stand", expr: on(t, W.choose) ? "smile" : "neutral", prop: on(t, W.means) ? "point" : null, facing: 1, blink: lidAt(t, 505) });
      standAt(cam, out, CA, M.calBed, { mode: "stand", expr: bless ? (on(t, W.word2) ? "relief" : "nervous") : "pained", facing: -1, blink: lidAt(t, 500) });
      if (id === 24 && on(t, W.word2)) icon(out, t, W.word2, [M.calBed[0], 2.3, M.calBed[2]], 0.5, "halo", fxHalo);
      break;
    }
    case 25: { // Steinbeck's point: Cal alone in the field at sunset
      standAt(cam, out, CA, M.quiet, { mode: "stand", expr: on(t, W.choices) ? "smile_closed" : "neutral", blink: lidAt(t, 500) });
      break;
    }
  }
  return out;
};
export { FPS };
