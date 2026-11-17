// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxSplash, fxRing, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { CLERK, CLERK_TIE, MARIE, RAYMOND, ARAB, CARETAKER, PROSECUTOR, JUDGE, CHAPLAIN, OLDFRIEND, JUROR, CROWD,
  fxHeart, fxShine, fxGull, fxFilm, fxCup, fxCig, fxTelegram, fxTear, fxTwinkle } from "../../engine/library/stranger";
import { FPS, SHOTS, V3, smooth, clamp01, WORD, MARK } from "./story";
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

// ================= The Stranger =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const M = MARK;
const FRONT = { side: false, mirror: false };
const W = WORD as Record<string, number>;
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const CL = who(400, CLERK, "cl"), CLT = who(400, CLERK_TIE, "clt"), MA = who(401, MARIE, "ma"), RA = who(402, RAYMOND, "ra");
const AR0 = who(403, ARAB(0), "ar0"), AR1 = who(404, ARAB(1), "ar1"), CT = who(405, CARETAKER, "ct"), PR = who(406, PROSECUTOR, "pr");
const JU = who(407, JUDGE, "ju"), CH = who(408, CHAPLAIN, "ch");
const standAt = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, fo, {}, scale));
  if (shadow && fo.mode !== "sit") blob(out, m[0], m[1], m[2], scale);
};
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
};
const puff = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.6) => {
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
/** sobbing old friends in a row behind the coffin, tears flying */
const mourners = (cam: CamInfo, t: number, out: Stage, loud: number) => {
  M.friends.forEach((m, i) => {
    const sob = Math.floor(t * 3 + i * 0.7) % 2 === 0;
    standAt(cam, out, who(420 + i, OLDFRIEND(i), `of${i}`), m, { mode: "sit", expr: sob ? "pained" : "nervous", prop: i % 2 ? null : null, blink: lidAt(t, 420 + i), tilt: q(2 * Math.sin(t * 6 + i), 2), facing: 0 });
    const n = t >= loud ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const u = ((t * 1.4 + k / n + hh(i, k)) % 1), sd = (k + i) % 2 ? 1 : -1;
      out.fx.push({ key: "tear", cw: 100, ch: 100, draw: fxTear, x: m[0] + sd * (0.12 + 0.25 * u), y: m[1] + 1.25 + 0.25 * u - 0.9 * u * u, z: m[2] + 0.05, w: 0.08, h: 0.08 });
    }
  });
};
const shine = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.5) => {
  if (t < t0 || t >= t0 + dur) return;
  const k = q((t - t0) / dur, 20);
  out.fx.push({ key: `shine${k}`, cw: 200, ch: 200, draw: (p) => fxShine(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, rot: k * 0.5 });
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS;
  switch (id) {
    case 20: { // Camus's point: the clerk alone at sunset, calm, the sea behind him
      standAt(cam, out, CL, M.quiet, { mode: "stand", expr: on(t, W.feelings) ? "smile_closed" : "neutral", blink: lidAt(t, 400) });
      break;
    }
    case 1: case 21: { // the clerk alone on the blinding beach
      // Raymond's revolver hangs at his side; on "shoots" the arm comes up (the flare hides the moment) and drops again
      const g = id === 1 ? clamp01((t - (W.shoots - 0.25)) / 0.15) * (1 - clamp01((t - (W.shoots + 0.5)) / 0.3)) : 0;
      standAt(cam, out, CL, M.hook, { mode: "stand", expr: "neutral", prop: ["gun", q(g, 20)], facing: 1, blink: lidAt(t, 400) });
      if (id === 1) for (let k = 0; k < 3; k++) {
        const t0 = W.shoots - 0.05 + k * 0.08, u = t - t0;
        if (u > 0 && u < 2.5) out.fx.push({ key: `gull${q((t * 4 + k) % 1, 4)}`, cw: 200, ch: 200, draw: (p) => fxGull(p, q((t * 4 + k) % 1, 4) > 0.5 ? 1 : 0), x: M.hook[0] + 1.2 + k * 0.5 + 1.5 * u, y: 0.4 + 1.8 * u, z: M.hook[2] - 2.5 - k * 0.6, w: 0.45, h: 0.45 });
      }
      break;
    }
    case 2: { // the vigil: friends sobbing, the clerk dry-eyed
      mourners(cam, t, out, W.crying);
      standAt(cam, out, CLT, M.vigilClerk, { mode: "sit", expr: "neutral", blink: on(t, W.crying) && t < W.crying + 0.14 ? 1 : lidAt(t, 400) });
      break;
    }
    case 3: { // golden beach walk
      const w = walk(t, b0, b0 + 3.2, M.walkA, M.walkB, 1.4);
      standAt(cam, out, CL, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "neutral", blink: lidAt(t, 400) });
      break;
    }
    case 4: { // the office: telegram
      const got = on(t, W.mother);
      standAt(cam, out, CL, M.desk, { mode: "stand", expr: got ? "neutral" : "neutral", prop: got ? "letter" : "fist", blink: lidAt(t, 400) });
      if (!got) {
        const u = clamp01((t - (W.mother - 0.8)) / 0.6);
        out.fx.push({ key: "telegram", cw: 200, ch: 200, draw: fxTelegram, x: 0.9 - 0.9 * u, y: 0.79, z: -1.05, w: 0.32, h: 0.32, flat: true, rot: 0.4 - 0.4 * u });
      }
      break;
    }
    case 5: case 6: { // the vigil: coffee, cigarette, dozing
      mourners(cam, t, out, W.cries);
      const doze = id === 6 && on(t, W.dozes) && t < W.cries;
      const prop: FrontOpts["prop"] = id === 5 ? (on(t, W.smokes) ? "cigarette" : on(t, W.coffee) ? "cup" : null) : null;
      standAt(cam, out, CLT, M.vigilClerk, { mode: "sit", expr: doze ? "neutral" : id === 6 && on(t, W.cries) ? "shock" : "neutral", prop, blink: doze ? 1 : lidAt(t, 400), headTilt: doze ? 14 * smooth((t - W.dozes) / 0.4) : 0 });
      if (id === 5) {
        const near = on(t, W.coffee) && t < W.smokes + 0.2;
        standAt(cam, out, CT, near ? M.ctNear : M.ctFar, { mode: "stand", expr: "grin", prop: on(t, W.smokes) ? "cigarette" : on(t, W.coffee) ? null : "cup", facing: -1, blink: lidAt(t, 405) });
        if (on(t, W.smokes)) for (let k = 0; k < 2; k++) {
          const u = (t - W.smokes + k * 0.6) % 1.2 / 1.2;
          puff(out, u, 0, [M.vigilClerk[0] + 0.5 + 0.6 * u, 1.6 + 0.8 * u, M.vigilClerk[2] - 0.4], 0.5 + 0.4 * u, 1);
        }
      }
      break;
    }
    case 7: { // the harbour baths
      const up = clamp01((t - (W.swimming - 0.1)) / 0.35);
      out.places.push(person(cam, CL, M.swimClerk[0], M.swimClerk[1] + 0.35 * up, M.swimClerk[2], FRONT, { mode: "stand", expr: "neutral", blink: lidAt(t, 400) }, {}));
      const mu = clamp01((t - (W.marie - 0.2)) / 0.35);
      if (mu > 0) out.places.push(person(cam, MA, M.swimMarie[0], M.swimMarie[1] + 0.35 * mu, M.swimMarie[2], FRONT, { mode: "stand", expr: "laugh", blink: lidAt(t, 401), facing: -1 }, {}));
      for (const [tw, m] of [[W.swimming, M.swimClerk], [W.marie, M.swimMarie]] as const) {
        const u = (t - tw + 0.1) / 0.9;
        if (u >= 0 && u < 1) out.fx.push({ key: `splash${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, q(u, 30)), x: m[0], y: 0.25, z: m[2] + 0.1, w: 1.6, h: 1.6 });
        const r = ((t * 0.5 + m[0]) % 1);
        out.fx.push({ key: `ring${q(r, 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(r, 30)), x: m[0], y: -0.06, z: m[2], w: 1.6, h: 1.6, flat: true });
      }
      break;
    }
    case 8: { // the cinema
      const laugh = Math.floor(t * 4) % 2 === 0;
      standAt(cam, out, MA, [M.seatMarie[0], M.seatMarie[1] + (laugh ? 0.03 : 0), M.seatMarie[2]], { mode: "sit", expr: laugh ? "laugh" : "relief_open", blink: 0, facing: -1, tilt: laugh ? -4 : 2 });
      standAt(cam, out, CL, M.seatClerk, { mode: "sit", expr: "neutral", blink: lidAt(t, 400) });
      break;
    }
    case 9: { // the flat at night: "probably not"
      const pop = on(t, W.probably);
      standAt(cam, out, MA, M.flatMarie, { mode: "stand", expr: pop ? "pained" : "smile_closed", facing: -1, blink: pop ? 0 : lidAt(t, 401), headTilt: pop ? 0 : -6 });
      standAt(cam, out, CL, M.flatClerk, { mode: "stand", expr: "neutral", blink: lidAt(t, 400) });
      for (let k = 0; k < 3; k++) {
        const base: V3 = [M.flatMarie[0] - 0.15 + 0.22 * k, 1.95 + 0.18 * k + 0.05 * Math.sin(t * 2 + k), M.flatMarie[2] + 0.1];
        const u = pop ? clamp01((t - W.probably + LEAD) / 0.25) : 0;
        if (u >= 1) continue;
        const rise = clamp01((t - b0 - 0.2 * k) / 0.6);
        if (rise <= 0) continue;
        out.fx.push({ key: `heart${q(u, 10)}`, cw: 200, ch: 200, draw: (p) => fxHeart(p, q(u, 10)), x: base[0], y: base[1] - 0.3 * (1 - rise), z: base[2], w: 0.22, h: 0.22 });
      }
      break;
    }
    case 10: { // Raymond
      standAt(cam, out, RA, M.ray, { mode: "stand", expr: "grin", prop: "letter", facing: -1, blink: lidAt(t, 402) });
      standAt(cam, out, CL, M.rayClerk, { mode: "stand", expr: "neutral", blink: lidAt(t, 400), facing: 1 });
      break;
    }
    case 11: { // the feud on the beach
      standAt(cam, out, AR0, M.ar0, { mode: "stand", expr: "stern", blink: lidAt(t, 403) });
      standAt(cam, out, AR1, M.ar1, { mode: "stand", expr: "stern", blink: lidAt(t, 404), facing: -1 });
      standAt(cam, out, RA, M.feudRay, { mode: "stand", expr: "angry", prop: "point", facing: 1, blink: lidAt(t, 402) });
      standAt(cam, out, CL, M.feudClerk, { mode: "stand", expr: "neutral", blink: lidAt(t, 400) });
      break;
    }
    case 12: { // the shooting (never shown): the walk in the heat, the glint
      const w = walk(t, b0, W.knife - 0.4, M.walk1, M.walk2, 1.2);
      standAt(cam, out, CL, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: on(t, W.sunlight) ? "pained" : "dazed", prop: ["gun", 0], facing: 1, blink: lidAt(t, 400) });
      const rise = clamp01((t - (W.flashes - 0.3)) / 0.4), draw = clamp01((t - (W.knife - 0.35)) / 0.3);
      standAt(cam, out, AR0, M.spring, { mode: rise > 0.5 ? "stand" : "sit", expr: "stern", prop: rise > 0.5 ? ["knife", q(draw, 20)] : null, blink: lidAt(t, 403), facing: -1 });
      shine(out, t, W.knife - 0.05, [M.spring[0] - 0.42, 1.55, M.spring[2] + 0.3], 1.4, 0.6);
      break;
    }
    case 13: { // four more: gulls lift off the empty beach, one per shot
      [W.four, W.more, W.times, W.times + 0.42].forEach((tg, k) => {
        const u = t - tg;
        const x = -1.6 + 1.1 * k, y = u < 0 ? 0.1 : 0.1 + 2.2 * u + 0.4 * u * u, z = -3.5 - 0.4 * k;
        const fl = u < 0 ? 0 : q((t * 5 + k * 0.3) % 1, 4) > 0.5 ? 1 : 0;
        out.fx.push({ key: `gull${fl}`, cw: 200, ch: 200, draw: (p) => fxGull(p, fl), x: x + (u > 0 ? 1.2 * u : 0), y, z, w: 0.5, h: 0.5 });
      });
      break;
    }
    case 14: case 15: case 16: { // the trial
      standAt(cam, out, CL, M.dock, { mode: "stand", expr: id === 15 && on(t, W.sun) ? "pained" : id === 16 && on(t, W.guillotine) ? "neutral" : "neutral", blink: lidAt(t, 400), facing: 1 });
      const pt = id === 14 && on(t, W.bringing);
      standAt(cam, out, PR, id === 16 ? M.pros16 : M.pros, { mode: "stand", expr: id === 16 ? (on(t, W.guillotine) ? "smug" : "shock") : pt ? "stern" : "neutral", prop: pt || id === 16 ? "point" : null, facing: -1, blink: lidAt(t, 406) });
      standAt(cam, out, JU, M.judge, { mode: "stand", expr: "stern", blink: lidAt(t, 407) }, false);
      M.jurors.forEach((m, i) => {
        const nod = id === 16 && on(t, W.soulless) && t < W.soulless + 0.6;
        const gasp = id === 14 && on(t, W.cigarettes + i * 0.04);
        const laughJ = id === 15 && on(t, W.sun + 0.15);
        const fanning = !(id === 16 && on(t, W.soulless));
        standAt(cam, out, who(440 + i, JUROR(i), `j${i}`), m, { mode: "sit", expr: laughJ ? "laugh" : gasp ? "shock" : id === 16 ? "stern" : "neutral", blink: lidAt(t, 440 + i),
          wave: fanning ? q(Math.sin(t * 7 + i * 1.1), 20) : undefined, headTilt: nod ? 10 * Math.sin(((t - W.soulless) / 0.6) * Math.PI) : 0 });
      });
      if (id === 14) {
        const c = M.pros;
        icon(out, t, W.coffee2, [c[0] + 0.15, 2.55, c[2]], 0.38, "icup", fxCup);
        icon(out, t, W.cigarettes, [c[0] + 0.75, 2.75, c[2]], 0.38, "icig", fxCig);
        icon(out, t, W.comedy2, [c[0] + 1.35, 2.55, c[2]], 0.42, "ifilm", fxFilm);
      }
      if (id === 16 && on(t, W.guillotine - 0.15)) {
        const u = clamp01((t - (W.guillotine - 0.15)) / 0.15);
        out.fx.push({ key: "blade", cw: 300, ch: 600, draw: bladeShadow, x: -1.0, y: 4.6 - 1.2 * u * u, z: -5.92, w: 1.3, h: 2.6, yaw: 0, soft: true });
      }
      break;
    }
    case 17: { // the chaplain
      const boom = on(t, W.explodes);
      const cw2 = boom ? walk(t, W.explodes + 0.1, W.explodes + 1.0, M.chap, M.chapOut, 2) : { m: M.chap, moving: false, phase: 0 };
      standAt(cam, out, CH, cw2.m, { mode: cw2.moving ? "stroll" : "stand", phase: cw2.phase, expr: boom ? "shock" : on(t, W.repent) ? "nervous" : "smile_closed", prop: boom ? null : "cross", facing: -1, blink: boom ? 0 : lidAt(t, 408), tilt: boom ? 8 : 0 });
      standAt(cam, out, CL, M.cellClerk, { mode: "stand", expr: boom ? "yell" : "neutral", prop: boom ? "fist" : null, facing: 1, blink: boom ? 0 : lidAt(t, 400), tilt: boom ? -8 : 0 });
      burst(out, t, W.explodes - LEAD, [M.cellClerk[0] + 0.6, 1.6, M.cellClerk[2] + 0.2], 1.1, "#ffd0a0", 0.35);
      break;
    }
    case 18: { // calm: stars
      standAt(cam, out, CL, M.bunk, { mode: "sit", expr: on(t, W.free) ? "relief" : on(t, W.calm) ? "smile_closed" : "neutral", blink: lidAt(t, 400), look: -1 });
      for (let k = 0; k < 7; k++) {
        const tk = b0 + 0.25 + k * 0.35;
        if (t < tk) continue;
        const tw = q(0.5 + 0.5 * Math.sin(t * 3 + k * 2), 8);
        out.fx.push({ key: `tw${tw}`, cw: 200, ch: 200, draw: (p) => fxTwinkle(p, tw), x: 0.4 + (k % 4) * 0.2, y: 2.12 + Math.floor(k / 4) * 0.22 + 0.05 * (k % 2), z: -2.62, w: 0.1, h: 0.1, yaw: 0 });
      }
      break;
    }
    case 19: { // the imagined crowd at dawn
      standAt(cam, out, CL, M.squareClerk, { mode: "stand", expr: on(t, W.hate) ? "smile" : "neutral", blink: lidAt(t, 400) });
      const hate = on(t, W.hate);
      for (let i = 0; i < 22; i++) {
        const row = Math.floor(i / 6), col = i % 6;
        const x = (col - 2.5) * 0.95 + (row % 2 ? 0.45 : 0) + (hh(i, 3) - 0.5) * 0.3, z = -1.0 - row * 1.25 + (hh(i, 4) - 0.5) * 0.3;
        const tin = W.huge - 0.4 + row * 0.25 + hh(i) * 0.2, u = clamp01((t - tin) / 0.25);
        if (u <= 0) continue;
        const jeer = hate && Math.floor(t * 5 + i) % 2 === 0;
        standAt(cam, out, who(460 + i, CROWD(i), `cr${i}`), [x, -0.6 * (1 - u), z], { mode: "stand", expr: hate ? (jeer ? "yell" : "angry") : "stern", prop: hate && i % 2 ? "fist" : null, blink: lidAt(t, 460 + i), facing: x < 0 ? 1 : -1, tilt: jeer ? q(3 * Math.sin(t * 9 + i), 2) : 0 }, u >= 1);
      }
      break;
    }
  }
  return out;
};
/** the guillotine blade's shadow on the courtroom wall (soft, violet-dark) */
const bladeShadow = (p: Pen) => {
  const col = "rgba(40,20,50,0.6)";
  p.poly([[40, 0], [80, 0], [80, 600], [40, 600]], col, 0);
  p.poly([[220, 0], [260, 0], [260, 600], [220, 600]], col, 0);
  p.poly([[20, 0], [280, 0], [280, 30], [20, 30]], col, 0);
  p.poly([[80, 250], [220, 190], [220, 330], [80, 330]], col, 0); // the slanted blade
  p.poly([[80, 470], [220, 470], [220, 500], [80, 500]], col, 0); // the lunette
};
export { FPS };
