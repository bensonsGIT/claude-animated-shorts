// The Gambler short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus gambStage():
// who stands where, with which face and prop, in every shot, the legion, shells, crab, trireme. Cards, effects and blobs live on NOINK.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, fxStars, Outfit, FrontOpts, SideOpts } from "../../engine/toon";
import { GRANNY, GENERAL, GENERAL_PARIS, BLANCHE, TUTOR, TUTOR_RICH, TUTOR_BROKE, TUTOR_LACKEY, POTAPITCH, MARTHA, CROUPIER, ASTLEY, FOOTMAN, PUNTER,
  fxArmchair, fxRoulette, pocketAngle, fxCoins, fxBanknote, fxMoneyBubble, fxPortrait, fxHatboxes, fxGold } from "../../engine/library/gambler";
import { ZERO_CELL, RED_CELL } from "./casino";
import { FPS, SHOTS, V3, clamp01, smooth, WORD, BEAT, MARK } from "./story";
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


// ================= the Gambler short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const GR = who(900, GRANNY, "granny"), GE = who(901, GENERAL, "gen"), GEP = who(901, GENERAL_PARIS, "genp"), BL = who(902, BLANCHE, "bl");
const TU = who(903, TUTOR, "tu"), TUR = who(903, TUTOR_RICH, "tur"), TUB = who(903, TUTOR_BROKE, "tub"), TUL = who(903, TUTOR_LACKEY, "tul");
const PO = who(904, POTAPITCH, "po"), MA = who(905, MARTHA, "ma"), CR = who(906, CROUPIER, "cr"), AS = who(907, ASTLEY, "as");
const FO = [0, 1].map((v) => who(910 + v, FOOTMAN(v), `fo${v}`));
const PU = [0, 1, 2, 3, 4, 5].map((v) => who(930 + v, PUNTER(v), `pu${v}`));
const stand = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...fo }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
};
const walk = (cam: CamInfo, out: Stage, w: Who, m: V3, t: number, fo: FrontOpts, rate = 2.0) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stroll", phase: q((t * rate + hh(w.i, 2)) % 1, 16), blink: lidAt(t, w.i), ...fo }, {}));
  blob(out, m[0], m[1], m[2]);
};
const burst = (out: Stage, t: number, t0: number, c: V3, size: number, col = "#fff3b0", dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col, 10, 30, 230), x: c[0], y: c[1], z: c[2], w: size, h: size });
};
const puff = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.6) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 20);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const popK = (t: number, t0: number) => (t < t0 ? 0 : Math.min(1, (t - t0) / 0.12) * (1.12 - 0.12 * clamp01((t - t0 - 0.12) / 0.2)));
/** a point offset from m toward the camera's right (side metres) and toward the lens (toward metres) */
const handAt = (cam: CamInfo, m: V3, side: number, y: number, toward = 0.12): V3 => {
  const dx = cam.pos.x - m[0], dz = cam.pos.z - m[2], d = Math.hypot(dx, dz) || 1;
  return [m[0] + cam.right.x * side + (dx / d) * toward, y, m[2] + cam.right.z * side + (dz / d) * toward];
};

// ---------------- Granny in her armchair ----------------
const CHAIR_W = 1.0, CHAIR_H = 1.24, SEAT = 0.38;
/** Granny seated bolt upright in her chair whose feet stand at m; the chair card sits just behind her (away from the lens) */
const granny = (cam: CamInfo, out: Stage, m0: V3, fo: FrontOpts, carry = false) => {
  const m: V3 = [m0[0], m0[1] + (m0[0] > 90 ? 0.2 : 0), m0[2]];
  const c = handAt(cam, m, 0, m[1] + CHAIR_H / 2, -0.1);
  out.fx.push({ key: `chair${carry}`, cw: 420, ch: 520, draw: (p) => fxArmchair(p, carry), x: c[0], y: c[1], z: c[2], w: CHAIR_W, h: CHAIR_H });
  stand(cam, out, GR, [m[0], m[1] + SEAT - 0.1, m[2]], { mode: "sit", ...fo }, false);
  if (!carry) blob(out, m0[0], m0[1], m0[2], 1.6);
};
// ---------------- the wheel ----------------
const WROT = (t: number) => -1.7 * t;
const wheel = (out: Stage, rot: number, ball: number, ballR: number) => {
  const r = q(((rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), 90), b = q(((ball % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), 180), br = q(ballR, 12);
  out.fx.push({ key: `wheel${r}|${b}|${br}`, cw: 600, ch: 600, draw: (p) => fxRoulette(p, r, b, br), x: MARK.wheel[0], y: MARK.wheel[1], z: MARK.wheel[2], w: 1.7, h: 1.7, flat: true, rot: 0 });
};
/** the ball rolling round the track and dropping into pocket `v` at each landing time (it is relaunched 0.35 s after each) */
const spin = (out: Stage, t: number, lands: [number, number][], t0: number) => {
  let prev = t0, cur: [number, number] | null = null;
  for (const L of lands) { if (t < L[0]) { cur = L; break; } prev = L[0] + 0.35; cur = null; }
  const rot = WROT(t);
  if (!cur) { const last = lands[lands.length - 1]; const settle = lands.length && t >= last[0]; wheel(out, rot, settle ? pocketAngle(last[1], rot) : 3.1 * t, settle ? 0 : 1); return; }
  const [tl, v] = cur, left = tl - t, run = Math.max(0.3, tl - prev);
  const target = pocketAngle(v, WROT(tl)) + 4.2 * left + 1.2 * left * left; // decelerating, opposite the wheel
  const rr = clamp01(left / Math.min(0.9, run)) ** 0.7;
  wheel(out, rot, t < prev ? pocketAngle(v, rot) : target, rr);
};
const coins = (out: Stage, m: V3, n: number, w = 0.5, seed = 0) => {
  if (n <= 0.01) return;
  const k = q(n, 20);
  out.fx.push({ key: `coins${k}|${seed}`, cw: 400, ch: 260, draw: (p) => fxCoins(p, k, seed), x: m[0], y: m[1] + w * 0.33, z: m[2], w, h: w * 0.65 });
};
/** banknotes fluttering down from y0 over a box round c (rate notes/s over [t0, t1]) */
const noteRain = (out: Stage, t: number, t0: number, c: V3, span: number, n = 22, y0 = 3.2, rise = false) => {
  if (t < t0) return;
  for (let i = 0; i < n; i++) {
    const s = t0 + hh(i, 41) * 0.8, u = t - s;
    if (u < 0) continue;
    const fall = rise ? (u < 0.5 ? -2.4 * u + 2.4 * u * u * 2 : 0.6 * (u - 0.5)) : 0.95 * u;
    const y = (rise ? c[1] + 0.6 - fall * -1 : y0 - fall) + 0.04 * Math.sin(u * 7 + i);
    if (y < 0.05 || y > 4.5) continue;
    const x = c[0] + (hh(i, 42) - 0.5) * span + 0.15 * Math.sin(u * 3 + i), z = c[2] + (hh(i, 43) - 0.5) * span * 0.5;
    const sq = q(Math.cos(u * (5 + 3 * hh(i, 44)) + i), 8);
    out.fx.push({ key: `note${i % 3}`, cw: 140, ch: 80, draw: (p) => fxBanknote(p, i % 3), x, y, z, w: 0.26, h: 0.15 * Math.max(0.15, Math.abs(sq)), rot: 0.6 * Math.sin(u * 4 + i) });
  }
};
const crowd = (cam: CamInfo, out: Stage, t: number, ex: (i: number) => FrontOpts) => {
  const SPOT: V3[] = [[97.8, 0, -2.3], [98.6, 0, -2.6], [99.5, 0, -2.4], [100.5, 0, -2.6], [101.4, 0, -2.3], [102.2, 0, -2.5]];
  SPOT.forEach((m, i) => stand(cam, out, PU[i], m, { expr: "neutral", ...ex(i) }, false));
};
const go = (moving: boolean, cam: CamInfo, out: Stage, w: Who, m: V3, t: number, fo: FrontOpts) => (moving ? walk(cam, out, w, m, t, fo) : stand(cam, out, w, m, fo));
const VY = 0.6;
const stepY = (z: number) => (z > 1.5 ? 0 : z < 0 ? VY : VY * (1.5 - z) / 1.5);

export const gambStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  cam.t = t;
  if (id === 1 || id === 18) { // the verandah: the family waiting (the loop: the tutor alone, plotting tomorrow's comeback)
    if (id === 1) {
      const d = on(t, WORD.die);
      stand(cam, out, GE, M.gen, { expr: d ? "grin" : "nervous", prop: "watch", facing: 1 });
      stand(cam, out, BL, M.blanche, { expr: d ? "grin" : "smug", prop: "fan", facing: -1 });
      stand(cam, out, TU, M.tutorSeat, { mode: "sit", expr: d ? "nervous" : "neutral", look: d ? -0.6 : 0 }, false);
    } else {
      const got = on(t, WORD.coins), sm = on(t, WORD.smiled), tm = on(t, WORD.tomorrow);
      stand(cam, out, TUB, M.tutorSeat, { mode: "sit", expr: tm ? "smug" : sm ? "smile" : got ? "relief" : "dazed", prop: got ? "coin" : null, look: tm ? 0 : -0.4 }, false);
      // Mr. Astley hands over the coins, wags a finger on "You'll only gamble them", then leaves
      const off = Math.max(0, t - WORD.them - 0.4), warn = on(t, WORD.youll);
      if (off < 1.6) go(off > 0, cam, out, AS, [M.astley[0] + 0.0, VY, M.astley[2] + 1.4 * smooth(off / 1.6)], t, { expr: warn ? "stern" : "nervous", prop: got ? (warn && off === 0 ? "point" : null) : "coin", facing: -1 });
      if (t >= WORD.ten - 0.1 && t < WORD.coins + 0.2) { // the ten coins tumble from his hand to the tutor's
        const u = clamp01((t - WORD.ten + 0.1) / Math.max(0.3, WORD.coins - WORD.ten + 0.3));
        for (let i = 0; i < 4; i++) { const sq = q(Math.cos(t * 14 + i), 6); const a = handAt(cam, M.astley, 0.3, VY + 1.3, 0.1), b = handAt(cam, M.tutorSeat, 0.3, VY + 0.9, 0.2);
          out.fx.push({ key: `gold${sq}`, cw: 100, ch: 100, draw: (p) => fxGold(p, sq), x: a[0] + (b[0] - a[0]) * u + 0.05 * i, y: a[1] + (b[1] - a[1]) * u + 0.15 * Math.sin(u * Math.PI) + 0.04 * i, z: a[2] + (b[2] - a[2]) * u, w: 0.09, h: 0.09 }); }
      }
    }
    return;
  }
  if (id === 2) { // broke: pockets out, a money bubble; Blanche
    const broke = on(t, WORD.broke), fort = on(t, WORD.fortune), bl = on(t, WORD.blanche);
    stand(cam, out, GE, M.gen, { expr: bl ? "grin" : broke ? "nervous" : "neutral", prop: bl ? "point" : broke ? "pockets" : null, facing: bl ? 1 : 0 });
    stand(cam, out, BL, M.blanche, { expr: bl ? "smug" : "neutral", prop: "fan", facing: -1 });
    const s = popK(t, WORD.fortune - 0.1) * (bl ? clamp01(1 - (t - WORD.blanche) / 0.2) : 1);
    if (fort && s > 0.01) { const b = handAt(cam, M.gen, -0.35, VY + 2.25, 0.3); out.fx.push({ key: "moneyBubble", cw: 480, ch: 400, draw: fxMoneyBubble, x: b[0], y: b[1], z: b[2], w: 0.85 * s, h: 0.71 * s }); }
    return;
  }
  if (id === 3) { // Granny carried up the steps in her armchair, toward the lens; the family at the sides
    const t0 = BEAT[2] - 0.4, t1 = WORD.armchair, u = 1 - (1 - clamp01((t - t0) / Math.max(1, t1 - t0))) ** 2, z = 5.5 - 6.0 * u, moving = t < t1;
    const al = on(t, WORD.alive);
    const fy = stepY(z + 0.2), lift = 0.42;
    for (const [k, s] of [[0, -1], [1, 1]] as const) go(moving, cam, out, FO[k], [s * 0.66, stepY(z + 0.25), z + 0.25], t, { expr: "nervous" } as FrontOpts);
    granny(cam, out, [0, fy + lift, z], { expr: al ? "grin" : "stern", prop: on(t, WORD.armchair) ? "point" : null, facing: 0 }, true);
    for (const [w, x] of [[PO, -0.45], [MA, 0.5]] as const) { const zz = z + 1.5; go(moving, cam, out, w, [x, stepY(zz), zz], t, { expr: "neutral" } as FrontOpts); }
    return;
  }
  if (id === 4) { spin(out, t, [], BEAT[3]); return; } // the wheel spinning: the title beat
  if (id === 5 || id === 7 || id === 8 || id === 9 || id === 11) { // the table
    const rot = WROT(t);
    if (id === 5) { // wheeled in, a stake on zero
      const u = smooth((t - BEAT[4] + 0.2) / Math.max(0.8, WORD.table - BEAT[4] + 0.2)), gx = 97.4 + (M.grannyC[0] - 97.4) * u;
      granny(cam, out, [gx, 0, M.grannyC[2]], { expr: on(t, WORD.zero) ? "grin" : "stern", prop: on(t, WORD.bet) ? "point" : null, facing: 1 });
      go(u < 1, cam, out, PO, [gx - 0.75, 0, M.grannyC[2] - 0.25], t, { expr: "neutral" } as FrontOpts);
      stand(cam, out, CR, M.croup, { expr: on(t, WORD.zero) ? "smug" : "neutral", prop: "rake", facing: -1 });
      stand(cam, out, TU, [98.1, 0, -1.7], { expr: "nervous" });
      crowd(cam, out, t, (i) => ({ expr: on(t, WORD.zero) ? (i % 2 ? "laugh" : "shock") : "neutral", facing: (i % 2 ? 1 : -1) as -1 | 1 }));
      const k = smooth((t - WORD.bet) / 0.35); if (on(t, WORD.bet)) coins(out, [M.grannyC[0] + (ZERO_CELL[0] - M.grannyC[0]) * k, ZERO_CELL[1], -0.3 + 0.3 * k], 0.15, 0.22);
      wheel(out, rot, 3.1 * t, 1);
      return;
    }
    if (id === 7) { // "again!": a mountain of gold raked across to her
      const u = clamp01((t - WORD.again + 0.1) / 0.6);
      granny(cam, out, M.grannyC, { expr: "laugh", prop: "fist", facing: 1 });
      stand(cam, out, CR, M.croup, { expr: "shock", prop: "rake", facing: -1 });
      coins(out, [ZERO_CELL[0] - 0.9 * u, TOP + 0.01, -0.45], 0.4 + 0.6 * u, 0.6, 1);
      burst(out, t, WORD.again - 0.05, [ZERO_CELL[0] - 0.6, TOP + 0.25, -0.2], 1.0, "#ffe27a", 0.35);
      crowd(cam, out, t, (i) => ({ expr: i % 2 ? "shock" : "laugh" }));
      wheel(out, rot, pocketAngle(0, rot), 0);
      return;
    }
    if (id === 8) { // two days later: cleaned out
      const u = clamp01((t - BEAT[6]) / Math.max(1, WORD.roubles - BEAT[6]));
      granny(cam, out, M.grannyC, { expr: on(t, WORD.roubles) ? "dazed" : "nervous", facing: 1 });
      stand(cam, out, CR, M.croup, { expr: "smug", prop: "rake", facing: -1 });
      stand(cam, out, PO, [98.2, 0, -1.6], { expr: "shock" });
      coins(out, [99.1 + 0.8 * u, TOP + 0.01, -0.45], 0.3 * (1 - u), 0.5, 2);
      if (on(t, WORD.roubles)) { const v = t - WORD.roubles, sq = q(Math.cos(v * 16), 6); out.fx.push({ key: `gold${sq}`, cw: 100, ch: 100, draw: (p) => fxGold(p, sq), x: 99.15 - 0.1 * v, y: TOP + 0.06 - Math.max(0, v - 0.35) ** 2 * 6, z: 0.5 + 0.6 * Math.min(v, 0.35), w: 0.09, h: 0.09 }); }
      wheel(out, rot, 3.1 * t, 1);
      return;
    }
    if (id === 9) { // the tutor sits down and stakes on red
      const sat = on(t, WORD.sat);
      stand(cam, out, TU, M.tutorC, { expr: sat ? "smug" : "nervous", prop: on(t, WORD.and3) ? "point" : null, facing: -1 });
      stand(cam, out, CR, M.croup, { expr: "neutral", prop: "rake", facing: 1 });
      crowd(cam, out, t, (i) => ({ expr: "neutral", facing: (i < 3 ? 1 : -1) as -1 | 1 }));
      if (on(t, WORD.and3)) coins(out, RED_CELL, 0.25, 0.22, 3);
      wheel(out, rot, 3.1 * t, 1);
      return;
    }
    // 11: the bank is broken: armfuls of notes, banknote rain
    const bk = on(t, WORD.bank);
    stand(cam, out, TUR, M.tutorC, { expr: bk ? "laugh" : "grin", prop: "notes", facing: -1 });
    stand(cam, out, CR, M.croup, { expr: bk ? "shock" : "nervous", prop: bk ? null : "rake", facing: 1, tilt: bk ? -6 : 0 });
    crowd(cam, out, t, (i) => ({ expr: bk ? (i % 2 ? "shock" : "laugh") : "nervous", facing: 1 }));
    coins(out, [M.tutorC[0], TOP + 0.01, -0.5], 1, 0.6, 4);
    noteRain(out, t, WORD.bank - 0.05, [M.tutorC[0] - 0.2, 0, -0.8], 2.6, 26);
    wheel(out, rot, pocketAngle(21, rot), 0);
    return;
  }
  if (id === 6 || id === 10) { // the wheel insert: zero, zero again / red, red, red
    if (id === 6) { spin(out, t, [[WORD.hit, 0], [WORD.hit2, 0]], BEAT[5] - 0.6); for (const w of [WORD.hit, WORD.hit2]) burst(out, t, w, [M.wheel[0], M.wheel[1] + 0.05, M.wheel[2] + 0.4], 0.9, "#7af0a0", 0.3); }
    else { const L: [number, number][] = [[WORD.red + 0.35, 32], [WORD.again2, 19], [WORD.again3, 21]]; spin(out, t, L, WORD.red - 0.8); for (const [w] of L) burst(out, t, w, [M.wheel[0], M.wheel[1] + 0.05, M.wheel[2] + 0.4], 0.9, "#ff7a7a", 0.3); }
    return;
  }
  if (id === 12) { // Paris: Blanche spends it; hat boxes pile up; the tutor's notes run out
    const g = on(t, WORD.gone), u = clamp01((t - BEAT[9]) / Math.max(1, WORD.gone - BEAT[9]));
    stand(cam, out, BL, M.blancheP, { expr: g ? "smug" : "laugh", prop: g ? "fan" : "notes", facing: 1 });
    stand(cam, out, g ? TUB : TUR, M.tutorP, { expr: g ? "dazed" : "grin", prop: g ? "pockets" : "notes", facing: -1 });
    const nb = 1 + Math.floor(4.99 * u);
    out.fx.push({ key: `hats${nb}`, cw: 300, ch: 420, draw: (p) => fxHatboxes(p, nb), x: 198.4, y: 0.45, z: -2.4, w: 0.65, h: 0.91 });
    if (!g) noteRain(out, t, BEAT[9] + 0.1, [M.blancheP[0], 0, M.blancheP[2] + 0.3], 1.4, 14, 2.6);
    return;
  }
  if (id === 13) { // the portrait: a black mourning ribbon on "died"
    const r = on(t, WORD.died);
    out.fx.push({ key: `portrait${r}`, cw: 360, ch: 440, draw: (p) => fxPortrait(p, r), x: M.portrait[0], y: M.portrait[1], z: M.portrait[2] + 0.04, w: 0.9, h: 1.1, yaw: 0 });
    return;
  }
  if (id === 14 || id === 15) { // the General's inheritance; the stroke; Blanche keeps every franc
    const bl: V3 = [200.15, 0, -1.45];
    if (id === 14) {
      stand(cam, out, GEP, M.genP, { expr: on(t, WORD.inheritance) ? "laugh" : "grin", prop: "sacks", facing: 1 });
      stand(cam, out, BL, bl, { expr: "smug", prop: "fan", facing: -1 });
      burst(out, t, WORD.inheritance - 0.05, [M.genP[0], 1.3, M.genP[2] + 0.3], 1.4, "#ffe27a", 0.3);
      return;
    }
    const k = smooth((t - WORD.stroke + 0.05) / 0.8), down = on(t, WORD.stroke);
    const pl = person(cam, GEP, M.genP[0] - 0.15 * k, -1.9 * k * k, M.genP[2], FRONT, { mode: down ? "fall" : "stand", expr: down ? "dead" : "laugh", prop: down ? null : "sacks", blink: lidAt(t, GEP.i) }, {});
    pl.roll = 0.9 * k; out.places.push(pl);
    if (!down) blob(out, M.genP[0], 0, M.genP[2]);
    if (down && t < WORD.stroke + 0.9) { const u = q((t - WORD.stroke) * 1.6 % 1, 12); out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: M.genP[0] - 0.2 * k, y: 1.95 - 1.2 * k, z: M.genP[2] + 0.2, w: 0.7, h: 0.35 }); }
    puff(out, t, WORD.stroke + 0.35, [M.genP[0] - 0.3, 0.2, M.genP[2] + 0.2], 1.2, 0.6);
    const kept = on(t, WORD.kept);
    stand(cam, out, BL, bl, { expr: kept ? "smug" : down ? "shock" : "grin", prop: kept ? "sacks" : "fan", facing: -1 });
    return;
  }
  if (id === 16) { // the debtors' prison: behind bars
    stand(cam, out, TUB, M.tutorCell, { expr: on(t, WORD.prison) ? "dazed" : "nervous" });
    return;
  }
  if (id === 17) { // a footman with a tray
    stand(cam, out, TUL, M.lackey, { expr: on(t, WORD.footman) ? "nervous" : "neutral", prop: "tray", facing: -1 });
    return;
  }
};

const TOP = 0.82;

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  gambStage(id, t, cam, out);
  return out;
};
