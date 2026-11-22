// Our cast as lit flat sprites in the 3D world (machinery shared with the Frankenstein short). Each frame every character
// asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct drawing. Effects are unlit cards.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { fxShine, fxTwinkle } from "../../engine/library/stranger";
import { IVAN, ALYOSHA, INQUISITOR, PRISONER, GUARD, TOWNS, fxTicket, fxOpenHand, fxTearLarge, fxDevil, fxOffer, fxTick, fxGlow } from "../../engine/library/inquisitor";
import { FPS, SHOTS, V3, smooth, clamp01, WORD, MARK, SI } from "./story";
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



// ================= The Grand Inquisitor: who stands where, per shot =================
const IV = who(800, IVAN, "iv"), AL = who(801, ALYOSHA, "al"), IN = who(802, INQUISITOR, "in"), PR = who(803, PRISONER, "pr");
const GU = (i: number) => who(810 + i, GUARD, `gu${i}`);
const sit = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, scale = 1) => standAt(cam, out, w, m, { ...fo, mode: "sit" }, true, scale);
const big = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, w: number, h = w, cw = 200, ch = cw, k = 3, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw: cw * k, ch: ch * k, draw: (p) => { p.g.scale(k, k); draw(p); }, x: c[0], y: c[1], z: c[2], w, h, ...extra });
const twinkles = (out: Stage, t: number, t0: number, c: V3, n = 4, r = 0.35, size = 0.16) => {
  if (t < t0 - LEAD) return;
  for (let k = 0; k < n; k++) {
    const tw = q(0.5 + 0.5 * Math.sin(t * 5 + k * 2.1), 8), a = k * 2.4 + 0.6;
    icon(out, t, t0 + 0.06 * k, [c[0] + r * Math.cos(a), c[1] + 0.7 * r * Math.sin(a), c[2] + 0.05], size, `tw${tw}`, (p) => fxTwinkle(p, tw));
  }
};
/** a soft warm glow that swells and fades (the kisses) */
const glow = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 2.2) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = (t - t0) / dur, k = q(Math.sin(Math.PI * Math.min(1, u * 1.4)) ** 0.7, 12);
  out.fx.push({ key: `glow${k}`, cw: 200, ch: 200, draw: (p) => fxGlow(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const offer = (out: Stage, t: number, t0: number, c: V3, k: number, size = 0.8) => icon(out, t, t0, c, size, `offer${k}`, (p) => fxOffer(p, k));
/** the ticket rising from the hand (dir 1, shot 1) or settling back into it (dir -1, shot 18) */
const ticketAt = (t: number, t0: number, dir: 1 | -1): V3 => {
  const u = dir > 0 ? smooth((t - t0) / 2.2) : 1 - smooth((t - t0) / 1.6);
  const h = M.hand, top = M.ticketTop;
  return [h[0] + (top[0] - h[0]) * u + 0.08 * Math.sin(t * 2.3) * u, h[1] + 0.22 + (top[1] - h[1] - 0.22) * u, h[2] + (top[2] - h[2]) * u];
};
const CROWD: V3[] = [[-1.7, 0, -4.2], [-2.5, 0, -5.4], [1.7, 0, -4.0], [2.6, 0, -5.2], [-1.2, 0, -6.3], [1.4, 0, -6.4], [-3.3, 0, -3.6], [3.4, 0, -3.4]];

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS;
  switch (id) {
    case 1: case 18: { // the void: a hand, the ticket, one tear past the candle
      big(out, "hand", fxOpenHand, M.hand, 0.5, 0.5, 200, 200, 3);
      const tk = id === 1 ? ticketAt(t, W.ticket - 0.1, 1) : ticketAt(t, W.given2 - 0.2, -1);
      big(out, "ticket", fxTicket, tk, 0.36, 0.36, 200, 200, 3, { rot: id === 1 ? 0.2 * Math.sin(t * 1.7) : 0.1 });
      if (id === 1) shine(out, t, W.heaven - 0.05, [tk[0] + 0.12, tk[1] + 0.08, tk[2] + 0.05], 0.3, 0.5);
      if (id === 1 && on(t, W.tears)) { const u = clamp01((t - W.tears) / 1.1); big(out, "tear", fxTearLarge, [M.tear[0], M.tear[1] - 1.25 * u * u, M.tear[2]], 0.13, 0.13, 200, 200, 2); }
      break;
    }
    case 2: case 3: case 4: case 10: case 15: case 16: case 17: { // the Metropolis tavern
      const ivEx = id === 3 ? (on(t, W.refuses) ? "pained" : "stern") : id === 4 ? "smug" : id === 10 ? (on(t, W.cardinal3) ? "smug" : "stern") : id === 15 ? "nervous" : id === 16 ? (on(t, W.plagiarism) ? "laugh" : on(t, W.kiss2) ? "shock" : "nervous") : "neutral";
      sit(cam, out, IV, M.ivan, { expr: ivEx, facing: 1, blink: lidAt(t, 800, [W.refuses, W.plagiarism]) });
      const up = id === 16 && on(t, W.answers);
      const alEx = id === 3 ? "pained" : id === 10 ? (on(t, W.secret) ? "shock" : "pained") : id === 16 ? (on(t, W.kiss2) ? "smile_closed" : "relief") : id === 17 ? "smile_closed" : "smile";
      if (up) standAt(cam, out, AL, M.alyoshaUp, { mode: "stand", expr: alEx, prop: "cross", facing: -1, blink: on(t, W.kiss2) ? 1 : lidAt(t, 801), headTilt: on(t, W.kiss2) ? -10 : 0 }, false);
      else sit(cam, out, AL, M.alyosha, { expr: alEx, prop: "cross", facing: -1, blink: lidAt(t, 801, [W.secret]) });
      if (id === 16) glow(out, t, W.kiss2 - 0.1, [M.ivan[0] + 0.25, 1.45, M.ivan[2] + 0.15], 1.0);
      if (id === 4 && on(t, W.inquisitor)) twinkles(out, t, W.inquisitor, [M.ivan[0], 1.7, M.ivan[2] + 0.1], 3, 0.35, 0.12);
      break;
    }
    case 5: { // Seville: the Prisoner in the square, the crowd; the cardinal on the steps; the guards; the crowd bows
      const taken = on(t, W.prison);
      standAt(cam, out, PR, M.pris5, { mode: "stand", expr: "smile_closed", blink: lidAt(t, 803), facing: 0 });
      CROWD.forEach((m, i) => {
        const w = who(820 + i, TOWNS(i), `tw${i}`);
        if (taken) sit(cam, out, w, [m[0], -0.32, m[2]], { expr: "nervous", blink: 1, headTilt: 14 * (m[0] < 0 ? 1 : -1) });
        else standAt(cam, out, w, m, { mode: "stand", expr: i % 3 ? "smile" : "shock", blink: lidAt(t, 820 + i), facing: m[0] < 0 ? 1 : -1 });
      });
      standAt(cam, out, IN, M.inq5, { mode: "stand", expr: on(t, W.cardinal) ? "angry" : "stern", prop: on(t, W.throws) ? "point" : "candle", facing: -1, blink: lidAt(t, 802) }, true, SI);
      if (taken) { standAt(cam, out, GU(0), M.guardA, { mode: "stand", expr: "stern", facing: 1, blink: lidAt(t, 810) }); standAt(cam, out, GU(1), M.guardB, { mode: "stand", expr: "stern", facing: -1, blink: lidAt(t, 811) }); }
      break;
    }
    case 6: { // the wilderness: the Prisoner on a rock, the Devil's silhouette, three offers refused
      sit(cam, out, PR, M.prisRock, { expr: "smile_closed", blink: lidAt(t, 803), facing: on(t, W.power) ? (Math.floor((t - W.power) * 5) % 2 ? 1 : -1) : 1 });
      big(out, "devil", fxDevil, [M.devil[0], 1.2, M.devil[2]], 1.1, 2.2, 200, 400, 2, { soft: true });
      const bc: V3 = [M.devil[0] - 0.15, 2.75, M.devil[2] + 0.1];
      if (on(t, W.power)) offer(out, t, W.power, bc, 2); else if (on(t, W.miracles)) offer(out, t, W.miracles, bc, 1); else if (on(t, W.bread)) offer(out, t, W.bread, bc, 0);
      break;
    }
    case 7: case 8: case 9: case 14: { // the prison: the Inquisitor with his lamp before the seated Prisoner
      sit(cam, out, PR, M.prisBench, { expr: "smile_closed", blink: lidAt(t, 803), facing: 1 });
      const pace = id === 8 ? walk(t, b0 + 0.2, b0 + 2.6, M.inq, [0.45, 0, -1.25], 1.4) : { m: M.inq, moving: false, phase: 0 };
      const ex = id === 7 ? "stern" : id === 8 ? (on(t, W.worship) ? "pained" : "stern") : id === 9 ? (on(t, W.lie) ? "smug" : "angry") : on(t, W.idea) ? "stern" : "pained";
      const pr = id === 9 && on(t, W.love) && !on(t, W.corrected) ? "chest" : id === 14 && on(t, W.heart) && !on(t, W.idea) ? "chest" : "candle";
      standAt(cam, out, IN, pace.m, { mode: pace.moving ? "stroll" : "stand", phase: pace.phase, expr: ex, prop: pr, facing: -1, blink: lidAt(t, 802), headTilt: id === 8 && on(t, W.worship) ? 10 : 0 }, true, SI);
      const bc: V3 = [pace.m[0] - 0.15, 2.5, pace.m[2] + 0.1];
      if (id === 8 && on(t, W.bread2)) offer(out, t, W.bread2, bc, 3);
      if (id === 9) {
        if (on(t, W.lie)) offer(out, t, W.lie, bc, 4);
        else if (on(t, W.corrected)) icon(out, t, W.corrected, [bc[0] - 0.1, 2.3, bc[2]], 0.4, "tick", fxTick);
      }
      if (id === 7 && on(t, W.freely)) twinkles(out, t, W.freely, [M.prisBench[0], 1.4, M.prisBench[2] + 0.1], 4, 0.3, 0.12);
      break;
    }
    case 11: { // close: the Prisoner, silent
      sit(cam, out, PR, M.prisBench, { expr: "smile_closed", blink: lidAt(t, 803), facing: 0 });
      break;
    }
    case 12: { // He rises and kisses the old man
      const w = walk(t, b0 + 0.2, W.kisses - 0.05, M.prisBench, M.prisKiss, 1.3);
      if (t < b0 + 0.2) sit(cam, out, PR, M.prisBench, { expr: "smile_closed", blink: lidAt(t, 803), facing: 1 });
      else standAt(cam, out, PR, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "smile_closed", blink: on(t, W.kisses) ? 1 : lidAt(t, 803), facing: 1, headTilt: on(t, W.kisses) ? 8 : 0 });
      standAt(cam, out, IN, M.inq, { mode: "stand", expr: on(t, W.kisses) ? "shock" : "stern", prop: "candle", facing: -1, blink: on(t, W.kisses) ? 0 : lidAt(t, 802) }, true, SI);
      glow(out, t, W.kisses - 0.05, [0.58, 1.6, -1.5], 1.2, 2.4);
      break;
    }
    case 13: { // the door opens onto the dark alley; the Prisoner goes out
      const go = on(t, W.go);
      const w = go ? walk(t, W.go, W.go + 2.6, M.prisKiss, M.doorIn, 1.3) : { m: M.prisKiss, moving: false, phase: 0 };
      const w2 = go && t > W.go + 2.6 ? walk(t, W.go + 2.6, W.go + 3.6, M.doorIn, M.doorOut, 1.3) : w;
      standAt(cam, out, PR, w2.m, { mode: w2.moving ? "stroll" : "stand", phase: w2.phase, expr: "smile_closed", blink: lidAt(t, 803), facing: -1 });
      standAt(cam, out, IN, M.inq, { mode: "stand", expr: go ? "pained" : "stern", prop: on(t, W.opens) && !go ? "point" : "candle", facing: -1, blink: lidAt(t, 802) }, true, SI);
      break;
    }
  }
  return out;
};
export { FPS };
