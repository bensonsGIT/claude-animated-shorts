// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { JOSEF, JOSEF_NIGHT, FRANZ, WILLEM, WHIPPER, MAGISTRATE, CROWDMAN, HULD, TITORELLI, PRIEST, DOORKEEPER, PEASANT, TOPHAT, NEIGHBOUR,
  inBed, fxHeath, fxSheet, fxLaundry, fxReach, fxCrumb } from "../../engine/library/trial";
import { fxShine } from "../../engine/library/stranger";
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
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1,
  alt?: (p: Pen, o: Outfit, fo: FrontOpts) => void): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `${alt ? "B" : "F"}|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (alt ? alt(p, who.o, f2) : view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
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

// ================= The Trial =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const M = MARK;
const FRONT = { side: false, mirror: false };
const W = WORD as Record<string, number>;
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const JK = who(500, JOSEF, "jk"), JN = who(500, JOSEF_NIGHT, "jn"), FR = who(501, FRANZ, "fr"), WI = who(502, WILLEM, "wi");
const WH = who(503, WHIPPER, "wh"), MG = who(504, MAGISTRATE, "mg"), HU = who(505, HULD, "hu"), TI = who(506, TITORELLI, "ti");
const PRI = who(507, PRIEST, "pri"), DK = who(508, DOORKEEPER, "dk"), TA = who(509, TOPHAT(0), "ta"), TB = who(510, TOPHAT(1), "tb");
const standAt = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, fo, {}, scale));
  if (shadow && fo.mode !== "sit") blob(out, m[0], m[1], m[2], scale);
};
const puff = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.6) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
};
const walk = (t: number, t0: number, t1: number, a: V3, b: V3, rate = 1.6) => {
  const u = clamp01((t - t0) / (t1 - t0)), e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  return { m: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e] as V3, moving: u > 0 && u < 1, phase: q((t * rate) % 1, 24) };
};
/** a card that pops in on a word (overshoot), bobbing gently */
const icon = (out: Stage, t: number, t0: number, c: V3, w: number, h: number, key: string, draw: (p: Pen) => void, yaw?: number) => {
  if (t < t0 - LEAD) return;
  const u = clamp01((t - t0 + LEAD) / 0.18), s = u < 1 ? 0.6 + 0.5 * Math.sin((u * Math.PI) / 1.6) : 1;
  out.fx.push({ key, cw: 200, ch: 200, draw, x: c[0], y: c[1] + 0.02 * Math.sin(t * 3 + c[0]), z: c[2], w: w * s, h: h * s, yaw });
};
const shine = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.5) => {
  if (t < t0 || t >= t0 + dur) return;
  const k = q((t - t0) / dur, 20);
  out.fx.push({ key: `shine${k}`, cw: 200, ch: 200, draw: (p) => fxShine(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, rot: k * 0.5 });
};
/** the whipper's rod: a thin cane from his raised hand; rest raised back, one hard swing down on the word */
const fxRod = (p: Pen) => { p.stroke([[100, 196], [100, 6]], 34); p.stroke([[100, 196], [100, 6]], 20, "#8a5a30"); };
const rod = (out: Stage, t: number, tw: number, hand: V3) => {
  const d = t - tw + LEAD;
  const ang = d < 0 ? -0.7 + 0.08 * Math.sin(t * 5) : d < 0.12 ? -0.7 + 2.1 * smooth(d / 0.12) : 1.4 - 2.1 * smooth((d - 0.12) / 0.5);
  const len = 1.0, cx = hand[0] + 0.5 * len * Math.sin(ang), cy = hand[1] + 0.5 * len * Math.cos(ang);
  out.fx.push({ key: "rod", cw: 200, ch: 200, draw: fxRod, x: cx, y: cy, z: hand[2], w: 0.16, h: len, rot: -ang });
};
/** the hearing crowd: two blocks either side of the aisle, plus the gallery men squashed under the ceiling */
const CROWD_AT: V3[] = (() => {
  const r: V3[] = [];
  for (const [ri, z] of [-2.5, -1.4, -0.3].entries()) for (const x of [-3.0, -2.2, -1.4, -0.7, 1.55, 2.3, 3.05]) if (!(ri === 2 && x > 1)) r.push([x + (ri % 2) * 0.2, 0, z]);
  return r;
})();
const crowd = (cam: CamInfo, t: number, out: Stage, mood: "murmur" | "clap" | "badge") => {
  CROWD_AT.forEach((m, i) => {
    const half = m[0] < 0;
    const expr = mood === "clap" ? (half ? (Math.floor(t * 5 + i) % 2 ? "grin" : "laugh") : "smug") : mood === "badge" ? "smug" : i % 3 ? "stern" : "neutral";
    standAt(cam, out, who(520 + i, CROWDMAN(i), `cm${i}`), m, { mode: "stand", expr, blink: lidAt(t, 520 + i), facing: half ? 1 : -1,
      prop: mood === "clap" && !half && i % 2 ? "fist" : null, tilt: mood === "clap" ? q(2 * Math.sin(t * 8 + i), 2) : 0 });
  });
  for (let k = 0; k < 9; k++) {
    const m: V3 = [-3.0 + k * 0.75, 1.85, -5.3 + (k % 2) * 0.15];
    standAt(cam, out, who(560 + k, CROWDMAN(k + 3), `cg${k}`), m, { mode: "stand", expr: k % 2 ? "nervous" : "stern", blink: lidAt(t, 560 + k), headTilt: 8 }, false, 0.62);
  }
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS, b1 = s.b / FPS;
  switch (id) {
    case 1: { // the arrest: K. in his nightshirt on the bed, the warders stride in through the door
      standAt(cam, out, JN, M.kBed, { mode: "sit", expr: on(t, W.why) ? "shock" : on(t, W.arrested + 0.2) ? "nervous" : "neutral", blink: lidAt(t, 500, [W.arrested + 0.2, W.why]) });
      for (const [w, m, d] of [[WI, M.willem, 0], [FR, M.franz, 0.15]] as const) {
        const t0 = W.arrested + 0.05 + d;
        if (t < t0) continue;
        const wk = walk(t, t0, t0 + 0.7, M.doorIn, m, 1.8);
        standAt(cam, out, w, wk.m, { mode: wk.moving ? "march" : "stand", phase: wk.phase, expr: "stern", blink: lidAt(t, w.i), facing: 1 });
      }
      break;
    }
    case 19: break; // the loop: the empty room in the morning, the door starting to open
    case 2: { // the neighbours across the street pop up at their window
      [b0 + 0.15, W.kafka - 0.1, W.kafka + 0.3].forEach((t0, k) => {
        const u = smooth((t - t0) / 0.25);
        if (u <= 0) return;
        const m = M.nb[k];
        standAt(cam, out, who(540 + k, NEIGHBOUR(k), `nb${k}`), [m[0], m[1] - 0.7 * (1 - u), m[2]], { mode: "stand", expr: k === 0 ? "grin" : k === 1 ? "smug" : "nervous", blink: lidAt(t, 540 + k), facing: k === 2 ? 1 : -1, tilt: k === 1 ? -6 : 4 }, false);
      });
      break;
    }
    case 3: { // the warders eat his breakfast
      const eat = on(t, W.breakfast);
      standAt(cam, out, JK, M.kStand, { mode: "stand", expr: eat ? "shock" : "neutral", blink: lidAt(t, 500), facing: 1 });
      const chew = Math.floor(t * 6) % 2 === 0;
      standAt(cam, out, WI, M.eatW, { mode: "sit", expr: eat ? (chew ? "lick" : "grin") : "smug", prop: "cup", blink: lidAt(t, 502), facing: -1, tilt: eat ? q(3 * Math.sin(t * 12), 2) : 0 });
      standAt(cam, out, FR, M.eatF, { mode: "sit", expr: eat ? (chew ? "laugh" : "grin") : "grin", prop: "fork", blink: lidAt(t, 501), facing: -1 });
      if (eat) for (let k = 0; k < 6; k++) {
        const u = ((t - W.breakfast) * 1.3 + k / 6) % 1, sd = k % 2 ? 1 : -1;
        out.fx.push({ key: "crumb", cw: 100, ch: 100, draw: fxCrumb, x: 1.5 + sd * (0.1 + 0.4 * u), y: 1.25 + 0.5 * u - 1.1 * u * u, z: -2.55, w: 0.07, h: 0.07, rot: k + t * 4 });
      }
      break;
    }
    case 4: case 5: case 6: { // the hearing
      crowd(cam, t, out, id === 6 ? "badge" : id === 5 && on(t, W.fiery) ? "clap" : "murmur");
      standAt(cam, out, MG, M.mag, { mode: "sit", expr: id === 4 && on(t, W.sunday) ? "smug" : "stern", prop: "letter", blink: lidAt(t, 504) });
      if (id === 4) {
        const duck = smooth((t - b0) / 0.6) * (1 - smooth((t - b0 - 1.4) / 0.5));
        standAt(cam, out, JK, M.kDoorway, { mode: "stand", expr: "nervous", blink: lidAt(t, 500), facing: 1, tilt: 12 * duck, headTilt: 8 * duck });
        for (const [x, col] of [[0.25, "#e8e4d8"], [0.85, "#c8d4e8"], [-1.0, "#e8d0c8"]] as const)
          out.fx.push({ key: `laundry${col}`, cw: 200, ch: 200, draw: (p) => fxLaundry(p, col), x, y: 1.95, z: 1.7, w: 0.34, h: 0.34, yaw: 0, rot: 0.04 * Math.sin(t * 2 + x) });
      }
      if (id === 5) standAt(cam, out, JK, M.kPodium, { mode: "stand", expr: on(t, W.sees) ? "shock" : "yell", prop: on(t, W.sees) ? null : "fist", blink: on(t, W.sees) ? 0 : lidAt(t, 500), facing: -1, tilt: on(t, W.sees) ? 0 : q(4 * Math.sin(t * 6), 2) });
      if (id === 6) CROWD_AT.forEach((m, i) => shine(out, t, W.badges - 0.08 + (i % 5) * 0.03, [m[0] + 0.05, 1.32, m[2] + 0.08], 0.32, 0.55));
      break;
    }
    case 7: case 8: { // the junk room
      standAt(cam, out, JK, M.kCorr, { mode: "stand", expr: on(t, id === 7 ? W.whipped : W.opens) ? "shock" : "neutral", blink: lidAt(t, 500), facing: -1 });
      const tw = id === 7 ? W.whipped : W.whip;
      const hit = t >= tw - LEAD && t < tw + 0.5;
      standAt(cam, out, WH, M.whipper, { mode: "stand", expr: "stern", prop: "fist", blink: lidAt(t, 503), facing: 1 });
      rod(out, t, tw, [M.whipper[0] + 0.32, 1.95, M.whipper[2] + 0.05]);
      const pointW = id === 7 ? on(t, W.complained) : on(t, W.whip + 0.2);
      standAt(cam, out, WI, M.kneelW, { mode: "sit", expr: hit ? "yell" : pointW ? "angry" : "pained", prop: pointW ? "point" : null, blink: hit ? 0 : lidAt(t, 502), facing: 1, tilt: hit ? 8 : 0 }, false);
      standAt(cam, out, FR, M.kneelF, { mode: "sit", expr: hit ? "yell" : "pained", blink: hit ? 0 : lidAt(t, 501), facing: -1, tilt: hit ? -8 : 0 }, false);
      burst(out, t, tw - LEAD, [M.whipper[0] - 0.2, 1.0, M.whipper[2] + 0.6], 0.8, "#ffe0a0", 0.25);
      break;
    }
    case 9: { // Huld in bed, a blank petition, nodding off
      const sheet = on(t, W.petition), doze = t > W.petition + 0.55;
      out.places.push(person(cam, HU, M.huld[0], M.huld[1], M.huld[2], FRONT, { expr: doze ? "neutral" : sheet ? "smug" : "smile_closed", blink: doze ? 1 : lidAt(t, 505),
        headTilt: doze ? 16 * smooth((t - W.petition - 0.55) / 0.5) : 0 }, {}, 1, (p, o, fo) => inBed(p, o, fo, "#b8908a")));
      if (sheet) icon(out, t, W.petition, [M.huld[0] + 0.3, 1.2 - (doze ? 0.15 * smooth((t - W.petition - 0.55) / 0.5) : 0), M.huld[2] + 0.25], 0.3, 0.3, "sheet", fxSheet);
      standAt(cam, out, JK, M.kVisit, { mode: "sit", expr: doze ? "stern" : "neutral", blink: lidAt(t, 500), facing: -1 });
      break;
    }
    case 10: case 11: { // Titorelli's studio
      const acq = id === 10 && on(t, W.acquittal);
      standAt(cam, out, JK, M.kTbed, { mode: "sit", expr: id === 11 && on(t, W.bed) ? "shock" : acq ? "pained" : "neutral", blink: lidAt(t, 500), facing: id === 11 ? -1 : 1, tilt: id === 11 && on(t, W.bed) ? 8 : 0 });
      const laugh = id === 10 && on(t, W.single);
      standAt(cam, out, TI, M.tito, { mode: "stand", expr: laugh ? (Math.floor(t * 5) % 2 ? "laugh" : "grin") : "grin", blink: lidAt(t, 506), facing: -1, headTilt: laugh ? q(8 * Math.sin(t * 14), 2) : 0 });
      if (id === 10) [[0.55, 1.2, -0.85], [0.95, 1.95, -0.92], [1.35, 1.2, -0.85]].forEach((c, k) => icon(out, t, W.acquittal + k * 0.28, c as V3, 0.4, 0.35, "heath", fxHeath));
      if (id === 11) {
        const op = on(t, W.behind + 0.15);
        M.wait.forEach((m, k) => standAt(cam, out, who(545 + k, CROWDMAN(k + 7), `wt${k}`), m, { mode: "stand", expr: op ? "nervous" : "neutral", blink: lidAt(t, 545 + k), facing: k ? -1 : 1 }));
      }
      break;
    }
    case 12: case 18: { // the cathedral: the priest in his pulpit
      standAt(cam, out, PRI, M.priest, { mode: "stand", expr: id === 18 && on(t, W.necessary) ? "neutral" : "stern", prop: "candle", blink: id === 18 && on(t, W.necessary) ? 1 : lidAt(t, 507), facing: -1 }, false);
      if (id === 12) standAt(cam, out, JK, M.kNave, { mode: "stand", expr: "nervous", blink: lidAt(t, 500), facing: 1, look: 1 });
      break;
    }
    case 13: case 14: { // the parable: the doorkeeper and the man from the country
      const age = id === 14 ? 2 : on(t, W.life + 0.45) ? 2 : on(t, W.life) ? 1 : 0;
      const dying = id === 14, dead = dying && on(t, W.shutting);
      standAt(cam, out, DK, [M.keeper[0], 0.03, M.keeper[2]], { mode: "sit", expr: dying && on(t, W.meant) ? "smug" : "stern", blink: lidAt(t, 508), facing: 1, tilt: dying && on(t, W.meant) ? -10 * smooth((t - W.meant) / 0.4) : 0 });
      standAt(cam, out, who(511, PEASANT(age), `pe${age}`), [M.man[0], 0.03, M.man[2]], { mode: "sit", expr: dead ? "dead" : dying ? "pained" : age ? "dazed" : "nervous", blink: dead ? 0 : lidAt(t, 511, [W.life, W.life + 0.45]), facing: -1,
        headTilt: dying ? 12 : age * 5, tilt: dying ? 6 : 0 }, false, [1, 0.94, 0.88][age]);
      if (dying) for (const dx of [-0.6, 0.6]) puff(out, t, W.shutting + 0.3, [dx, 0.4, -3.6], 1.2, 0.7);
      break;
    }
    case 15: { // the night before his next birthday: K. waiting in black, the two men in the door
      standAt(cam, out, JK, M.kNight, { mode: "sit", expr: on(t, W.hats) ? "nervous" : "neutral", blink: lidAt(t, 500), facing: -1 });
      if (on(t, W.hats - 0.1)) {
        standAt(cam, out, TA, M.topA, { mode: "stand", expr: "neutral", blink: lidAt(t, 509), facing: 1 });
        const wk = walk(t, W.hats + 0.25, W.hats + 0.9, M.topA, M.topB, 1.6);
        if (t > W.hats + 0.25) standAt(cam, out, TB, wk.m, { mode: wk.moving ? "march" : "stand", phase: wk.phase, expr: "neutral", blink: lidAt(t, 510), facing: 1 });
      }
      break;
    }
    case 16: { // the walk into the quarry, locked arm in arm, toward the lens
      const t1 = b1 - 0.35;
      for (const [w, m, k] of [[TA, M.qA, 0], [JK, M.qK, 1], [TB, M.qB, 2]] as const) {
        const wk = walk(t, b0 - 0.2, t1, [m[0], 0, -7.5], m, 1.5);
        standAt(cam, out, w, wk.m, { mode: wk.moving ? "march" : "stand", phase: wk.phase, expr: k === 1 ? "nervous" : "neutral", blink: lidAt(t, w.i), facing: k === 0 ? 1 : k === 2 ? -1 : 0 });
      }
      break;
    }
    case 17: { // the knife only as a glint passing between them; the figure at the lit window
      standAt(cam, out, TA, M.qA, { mode: "stand", expr: "neutral", blink: lidAt(t, 509), facing: 1, headTilt: 10 });
      standAt(cam, out, TB, M.qB, { mode: "stand", expr: "neutral", blink: lidAt(t, 510), facing: -1, headTilt: 10 });
      for (const [t0, dir] of [[W.butchers, 1], [W.knife + 0.35, -1]] as const) {
        const u = (t - t0) / 0.45;
        if (u >= 0 && u < 1) out.fx.push({ key: `shine${q(u, 10)}`, cw: 200, ch: 200, draw: (p) => fxShine(p, q(u, 10)), x: -0.3 * dir + 0.6 * dir * smooth(u), y: 1.1, z: -1.9, w: 0.45, h: 0.45, rot: u });
      }
      if (on(t, W.words - 0.3) && t < W.dog + 0.05) out.fx.push({ key: "reach", cw: 200, ch: 200, draw: fxReach, x: 1.9, y: 6.55, z: -15.5, w: 0.55, h: 0.55, yaw: 0 });
      break;
    }
  }
  return out;
};
export { FPS };
