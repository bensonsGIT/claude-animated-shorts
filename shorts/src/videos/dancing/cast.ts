// The Dancing Plague short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus gatsbyStage():
// who stands where, with which face and prop, in every shot. Cards, effects and blobs live on the NOINK layer.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts } from "../../engine/toon";
import { TROFFEA, HUSBAND, PHYSICIAN, COUNCILLOR, MUSICIAN, STRONGMAN, GUARD, FOLK1518,
  fxFiddle, fxPipe, fxTabor, fxVitus, fxWagon, fxIdea, fxBucket, fxScrollOpen } from "../../engine/library/dancing";
import { FPS, SHOTS, V3, clamp01, smooth, WORD, BEAT, MARK } from "./story";
import { STAGE, ROAD } from "./town";
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

// ================= the Dancing Plague short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const TR = who(600, TROFFEA, "troffea"), HB = who(601, HUSBAND, "husband"), GD = who(610, GUARD, "guard");
const DOC = [who(602, PHYSICIAN(0), "doc0"), who(603, PHYSICIAN(1), "doc1")];
const CNL = [0, 1, 2].map((v) => who(604 + v, COUNCILLOR(v), `cn${v}`));
const MUS = [0, 1, 2].map((v) => who(620 + v, MUSICIAN(v), `mu${v}`));
const STR = [0, 1].map((v) => who(630 + v, STRONGMAN(v), `st${v}`));
const stand = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...fo }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
};
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
};
const popK = (t: number, t0: number) => (t < t0 ? 0 : Math.min(1, (t - t0) / 0.12) * (1.12 - 0.12 * clamp01((t - t0 - 0.12) / 0.2)));
const handAt = (cam: CamInfo, m: V3, side: number, y: number, toward = 0.12): V3 => {
  const dx = cam.pos.x - m[0], dz = cam.pos.z - m[2], d = Math.hypot(dx, dz) || 1;
  return [m[0] + cam.right.x * side + (dx / d) * toward, y, m[2] + cam.right.z * side + (dz / d) * toward];
};
const bubbleAt = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, s: number, w = 0.95) => {
  if (s > 0) out.fx.push({ key, cw: 460, ch: 400, draw, x: c[0], y: c[1], z: c[2], w: w * s, h: w * 0.87 * s });
};
/** one dancer: stepping feet, an arm waving, the body swaying and hopping; e = energy 0 (wilting) .. 1 (wild) */
const dancer = (cam: CamInfo, out: Stage, w: Who, m: V3, t: number, e = 1, expr?: Expr, scale = 1, shadow = true) => {
  const k = hh(w.i, 5), ph = q((t * (1.4 + 0.5 * e) + k) % 1, 16), sw = Math.sin((t * (1.4 + 0.5 * e) + k) * Math.PI * 2);
  const hop = Math.max(0, sw) * 0.07 * e;
  const ex: Expr = expr ?? (e > 0.7 ? (["grin", "laugh", "dazed", "grin"] as Expr[])[w.i % 4] : e > 0.35 ? "dazed" : "pained");
  out.places.push(person(cam, w, m[0], m[1] + hop, m[2], FRONT, { mode: "march", phase: ph, expr: ex, wave: q(sw, 8), tilt: q(9 * e * sw, 2), blink: lidAt(t, w.i), lift: 60 + 40 * e }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale, 0.9);
};
const crowdDance = (cam: CamInfo, out: Stage, t: number, spots: V3[], e: number, seed = 0, near = 30) => spots.forEach((m, i) => {
  const d = Math.hypot(cam.pos.x - m[0], cam.pos.z - m[2]);
  if (d < 1.4) return;
  dancer(cam, out, who(700 + i + seed, FOLK1518(i + seed), `f${(i + seed) % 10}`), m, t, e, undefined, 1, d < near);
});
/** a grid of spots filling a rectangle, jittered */
const fill = (x0: number, x1: number, z0: number, z1: number, n: number, seed: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < 400 && out.length < n; i++) {
    const x = x0 + (x1 - x0) * hh(i, seed), z = z0 + (z1 - z0) * hh(i, seed + 1);
    if (out.some(([a, , c]) => Math.hypot(a - x, c - z) < 0.85)) continue;
    out.push([x, 0, z]);
  }
  return out;
};
const ST_SPOTS = fill(STAGE.x0 + 0.6, STAGE.x1 - 2.8, STAGE.z0 + 0.8, STAGE.z1 - 0.4, 10, 61).map(([x, , z]) => [x, STAGE.top, z] as V3);
const SQ_SPOTS = fill(53, 67, -1.5, 3.5, 14, 63);
const LANE_FEW = fill(-1.6, 1.8, -9, -2.5, 8, 65);
const LANE_FULL = fill(-1.9, 1.9, -40, 4, 54, 67);
const HALL_SPOTS = fill(-0.5, 5.5, -9, 0.5, 14, 69);
const musicians = (cam: CamInfo, out: Stage, t: number, base: V3, hard = 1, broken = -1) => {
  MUS.forEach((w, i) => {
    const m: V3 = [base[0] + i * 0.75, base[1], base[2] - 0.15 * i];
    stand(cam, out, w, m, { expr: hard > 1 ? "nervous" : "grin", facing: -1, tilt: q(3 * Math.sin(t * 8 * hard + i), 2) }, base[1] === 0);
    const h = handAt(cam, m, 0.22, m[1] + 1.0);
    if (i === 0 && broken < 0) out.fx.push({ key: `fid${q((Math.sin(t * 10 * hard) + 1) / 2, 4)}`, cw: 200, ch: 400, draw: (p) => fxFiddle(p, q((Math.sin(t * 10 * hard) + 1) / 2, 4)), x: h[0], y: h[1] + 0.15, z: h[2], w: 0.25, h: 0.5, rot: -0.5 });
    if (i === 0 && broken >= 0) out.fx.push({ key: "fidB", cw: 200, ch: 400, draw: (p) => fxFiddle(p, 0), x: h[0], y: h[1], z: h[2], w: 0.25, h: 0.5, rot: -0.9 });
    if (i === 1) out.fx.push({ key: "pipe", cw: 120, ch: 400, draw: fxPipe, x: h[0] - 0.12, y: m[1] + 1.25, z: h[2], w: 0.1, h: 0.36, rot: 0.25 });
    if (i === 2) { const hit = q(Math.max(0, Math.sin(t * 9 * hard)), 4); out.fx.push({ key: `tab${hit}`, cw: 240, ch: 240, draw: (p) => fxTabor(p, hit), x: h[0], y: m[1] + 1.0, z: h[2], w: 0.36, h: 0.36 }); }
  });
};

export const danceStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  cam.t = t;
  if (id === 1 || id === 18 || id === 9 || id === 11) { // the horse-market stage
    const e = id === 11 ? 0.25 : id === 9 ? 0.7 : on(t, id === 1 ? WORD.dancing2 : WORD.dancing8) ? 1.0 : 0.75;
    ST_SPOTS.forEach((m, i) => dancer(cam, out, who(700 + i, FOLK1518(i), `f${i % 10}`), m, t * (id === 18 || (id === 1 && on(t, WORD.dancing2)) ? 1.25 : 1), e, undefined, 1, false));
    crowdDance(cam, out, t, SQ_SPOTS, id === 11 ? 0.3 : e, 20, 14);
    musicians(cam, out, t, [STAGE.x1 - 2.3, STAGE.top, STAGE.z0 + 1.1], id === 11 ? 1.6 : 1, id === 11 && on(t, WORD.work) ? 1 : -1);
    if (id === 1 || id === 18) {
      const pt = on(t, id === 1 ? WORD.cure : WORD.cure2);
      stand(cam, out, DOC[1], M.physStage, { expr: pt ? "smug" : "neutral", facing: 1, prop: pt ? "point" : null });
    }
    if (id === 9) { // carpenters hammering the stage together
      const k = (t * 2.2) % 1, strike = k < 0.15 ? 1 : 0;
      for (const [i, x] of [[0, STAGE.x0 + 0.6], [1, STAGE.x0 + 4.0]] as const) stand(cam, out, STR[i], [x, 0, STAGE.z1 + 0.6], { expr: "stern", prop: ["hammer", q(strike, 2)], facing: 1 });
      burst(out, t, WORD.stage - LEAD, [STAGE.x0 + 1.6, STAGE.top + 0.2, STAGE.z1 + 0.2], 0.9, "#fff3b0", 0.3);
    }
    if (id === 11) burst(out, t, WORD.work - LEAD, [STAGE.x1 - 2.1, STAGE.top + 1.25, STAGE.z0 + 1.3], 0.5, "#ffffff", 0.25);
    return;
  }
  if (id === 2 || id === 3 || id === 4) { // Frau Troffea starts to dance
    const step = on(t, WORD.steps) || id > 2;
    const m: V3 = id === 2 && !step ? [-1.7, 0, 0.25] : M.troffea;
    if (id === 2 && !on(t, WORD.dance)) stand(cam, out, TR, m, { expr: "neutral", facing: 1 });
    else dancer(cam, out, TR, m, t, id === 4 ? 0.55 : 0.85, id === 4 ? (on(t, WORD.stop2) ? "pained" : "dazed") : "grin");
    if (id === 2) [[0.9, 0, -3.0], [1.35, 0, -5.2]].forEach((p, i) => stand(cam, out, who(640 + i, FOLK1518(i + 4), `nb${i}`), p as V3, { expr: on(t, WORD.dance) ? "shock" : "neutral", facing: -1 }));
    if (id === 3) stand(cam, out, HB, M.husband, { expr: "shock", facing: 1, prop: "candle" });
    if (id === 4) burst(out, t, WORD.stop2 - LEAD, [M.troffea[0], 0.25, M.troffea[2] + 0.1], 0.6, "#ffffff", 0.3);
    return;
  }
  if (id === 5) { // neighbours join, one by one
    dancer(cam, out, TR, M.troffea, t, 0.8);
    LANE_FEW.forEach((m, i) => {
      const t0 = WORD.dozens - 0.3 + 0.18 * i;
      if (t >= t0) dancer(cam, out, who(700 + i, FOLK1518(i), `f${i % 10}`), m, t, 0.9, undefined, popK(t, t0));
      else if (i < 3) stand(cam, out, who(700 + i, FOLK1518(i), `f${i % 10}`), m, { expr: "neutral", facing: 1 });
    });
    return;
  }
  if (id === 6 || id === 12) { // the lane full of dancers
    dancer(cam, out, TR, M.troffea, t, 0.8);
    crowdDance(cam, out, t, id === 6 ? LANE_FULL.slice(0, 30) : LANE_FULL, id === 12 ? 0.8 : 0.9, 0, 12);
    return;
  }
  if (id === 7 || id === 8 || id === 13) { // the council chamber
    CNL.forEach((w, i) => stand(cam, out, w, [-1.4 + i * 1.4, 0, -2.5], { expr: id === 8 && on(t, WORD.out) ? "shock" : id === 13 && i === 1 ? (on(t, WORD.bans) ? "angry" : "stern") : "stern", facing: 0, prop: id === 13 && i === 1 && on(t, WORD.bans) ? "fist" : null }, false));
    if (id === 7 || id === 8) {
      DOC.forEach((w, i) => {
        const jig = id === 8 && i === 1 && on(t, WORD.out);
        if (jig) dancer(cam, out, w, M.docB, t, 1, "laugh");
        else stand(cam, out, w, i ? M.docB : M.docA, { expr: id === 8 && i === 1 ? "smug" : "stern", facing: i ? -1 : 1, prop: id === 8 && i === 1 && on(t, WORD.prescription) ? "point" : null });
      });
      if (id === 7) {
        out.fx.push({ key: "scroll", cw: 300, ch: 200, draw: fxScrollOpen, x: -0.1, y: 1.25, z: 0.0, w: 0.6 * Math.max(0.01, popK(t, WORD.natural - 0.2)), h: 0.4 });
        bubbleAt(out, `hot${q(t % 1, 8)}`, (p) => fxIdea(p, "hot", q(t % 1, 8)), [0.55, 2.35, -0.6], popK(t, WORD.hot - 0.05), 0.85);
      }
    }
    if (id === 13) { // the music is confiscated: the guard takes the drum
      const take = on(t, WORD.music);
      stand(cam, out, MUS[2], M.musician, { expr: take ? "pained" : "nervous", facing: 1 });
      stand(cam, out, GD, M.guard, { expr: take ? "smug" : "stern", facing: -1 });
      const from = handAt(cam, M.musician, 0.22, 1.0), to = handAt(cam, M.guard, -0.22, 1.05), u = smooth(clamp01((t - WORD.music + 0.1) / 0.3));
      out.fx.push({ key: "tab0", cw: 240, ch: 240, draw: (p) => fxTabor(p, 0), x: from[0] + (to[0] - from[0]) * u, y: from[1] + (to[1] - from[1]) * u, z: from[2] + (to[2] - from[2]) * u, w: 0.36, h: 0.36 });
      burst(out, t, WORD.bans - LEAD, [0.0, 0.95, -1.2], 0.6, "#ffffff", 0.25);
    }
    return;
  }
  if (id === 10) { // the guild hall: dancers, musicians, strong men holding a dancer up
    crowdDance(cam, out, t, HALL_SPOTS, 0.9, 40, 12);
    musicians(cam, out, t, [4.6, 0, -6.6], 1.1);
    const s = popK(t, WORD.strong - 0.1);
    dancer(cam, out, who(690, FOLK1518(2), "sag"), M.held, t, s > 0 ? 0.4 : 0.6, s > 0 ? "dazed" : "grin");
    if (s > 0) STR.forEach((w, i) => stand(cam, out, w, i ? M.holdR : M.holdL, { expr: "pained", facing: i ? -1 : 1, prop: "chest" }, true, s));
    return;
  }
  if (id === 14) { // ox-wagons of twitching dancers on the hill road
    for (let k = 0; k < 2; k++) {
      const z = 1.2 - 1.4 * (t - BEAT[12]) + 4.2 * k, leg = Math.floor(t * 6 + k) % 4;
      out.fx.push({ key: `wagon${leg}${k}`, cw: 760, ch: 400, draw: (p) => fxWagon(p, leg, k * 3), x: ROAD[0], y: 1.05, z, w: 3.8, h: 2.0 });
      blob(out, ROAD[0], 0, z, 3.0, 0.7);
    }
    return;
  }
  if (id === 15) { // the shrine: the statue of Saint Vitus; dancers kneel; one foot still tapping
    out.fx.push({ key: "vitus", cw: 300, ch: 600, draw: fxVitus, x: M.statue[0], y: M.statue[1] + 0.95, z: M.statue[2], w: 0.95, h: 1.9 });
    for (let i = 0; i < 5; i++) {
      const m: V3 = [M.statue[0] - 1.6 + i * 0.8, 0, M.statue[2] + 2.6 + 0.4 * (i % 2)];
      const tap = i === 2 ? q(2 * Math.sin(t * 18), 2) : 0;
      stand(cam, out, who(720 + i, FOLK1518(i + 5), `k${i}`), m, { mode: "sit", expr: on(t, WORD.pray) ? "smile_closed" : "neutral", facing: 0, headTilt: 12, tilt: tap }, false);
    }
    return;
  }
  if (id === 16) { // the quiet lane: Frau Troffea on her doorstep, feet in a bucket
    stand(cam, out, TR, M.doorstep, { mode: "sit", expr: on(t, WORD.stops) ? "relief" : "dazed", facing: 1 }, false);
    out.fx.push({ key: "bucket", cw: 200, ch: 200, draw: fxBucket, x: M.doorstep[0] + 0.25, y: 0.2, z: M.doorstep[2] + 0.35, w: 0.42, h: 0.42 });
    return;
  }
  if (id === 17) { // the lane back to normal; the thought bubbles over the roofs
    [[-1.2, 0, -4], [1.4, 0, -8], [0.3, 0, -12], [-0.9, 0, -16]].forEach((p, i) => stand(cam, out, who(740 + i, FOLK1518(i + 7), `n${i}`), p as V3, { expr: "neutral", facing: i % 2 ? 1 : -1 }));
    bubbleAt(out, "famine", (p) => fxIdea(p, "famine"), [-0.25, 3.9, 1.5], popK(t, WORD.famine - 0.05), 1.6);
    bubbleAt(out, "sick", (p) => fxIdea(p, "sick"), [0.7, 5.0, 0.0], popK(t, WORD.disease2 - 0.05), 1.6);
    return;
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  danceStage(id, t, cam, out);
  return out;
};
