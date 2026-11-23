// Our cast as lit flat sprites in the 3D world (machinery shared with the Frankenstein / Inquisitor shorts). Each frame every character
// asks for a drawing (a key + a draw call); the pool keeps one canvas per distinct drawing. Effects are unlit cards.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fxPuff } from "../../engine/toon";
import { fxShine } from "../../engine/library/stranger";
import { fxTearLarge, fxGlow } from "../../engine/library/inquisitor";
import { RASKOL, RASKOL_IN, SONYA_HOME, LIZAVETA, MOTHER, DUNYA, OLDWOMAN, GIRL, SVID, kneelSide, hugSide, kneelAlone, ghost, fxCoin, fxSplash, fxShadowAlone, fxListen, fxCopper, fxSnow } from "../../engine/library/sonya";
import { fxShadow2, fxNapoleon } from "../../engine/library/crime";
import { FPS, SHOTS, V3, smooth, clamp01, WORD, MARK, BEAT } from "./story";
import { WALL_Z, RAIL_Z, KNEEL } from "./rooms";
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



// ================= the Sonya confession: who stands where, per shot =================
const RA = who(900, RASKOL, "ra"), RI = who(900, RASKOL_IN, "ri"), SO = who(901, SONYA_HOME, "so"), MO = who(902, MOTHER, "mo"), DU = who(903, DUNYA, "du");
const OW = who(904, OLDWOMAN, "ow"), GI = who(905, GIRL, "gi"), SV = who(906, SVID, "sv");
const sit = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, scale = 1) => standAt(cam, out, w, m, { ...fo, mode: "sit" }, true, scale);
const big = (out: Stage, key: string, draw: (p: Pen) => void, c: V3, w: number, h = w, cw = 200, ch = cw, k = 3, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw: cw * k, ch: ch * k, draw: (p) => { p.g.scale(k, k); draw(p); }, x: c[0], y: c[1], z: c[2], w, h, ...extra });
/** a soft warm glow that swells and fades */
const glow = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 2.2) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = (t - t0) / dur, k = q(Math.sin(Math.PI * Math.min(1, u * 1.4)) ** 0.7, 12);
  out.fx.push({ key: `glow${k}`, cw: 200, ch: 200, draw: (p) => fxGlow(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
/** a tableau card: the 600 x 1000 design canvas at body scale, standing on m */
const tableau = (cam: CamInfo, out: Stage, key: string, m: V3, draw: (p: Pen) => void) => {
  const d = cam.pos.distanceTo(tmp.set(m[0], m[1] + 1.2, m[2]));
  const [w, h, k] = tier(d);
  out.places.push({ key: `${key}|${w}`, x: m[0], y: m[1], z: m[2], draw, size: [w, h, k] });
  blob(out, m[0], m[1], m[2], 1.3);
};
const tear = (out: Stage, t: number, t0: number, c: V3, dur = 1.1) => {
  if (t < t0) return;
  const u = ((t - t0) % dur) / dur;
  big(out, "tear", fxTearLarge, [c[0], c[1] - 0.18 * u * u, c[2]], 0.05, 0.05, 200, 200, 1);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light === "golden" ? "golden" : s.light === "day" ? "day" : s.light;
  findSun(cam, SUN);
  const b0 = s.a / FPS;
  switch (id) {
    case 1: { // alone at her door, before
      standAt(cam, out, RI, M.rDoor, { mode: "stand", expr: on(t, W.dostoyevsky) ? "nervous" : "stern", facing: 0, blink: lidAt(t, 900, [W.dostoyevsky]) });
      break;
    }
    case 2: { // the shadow on the landing wall
      const k: "axe" | "raise" = on(t, W.killed - 0.35) ? "raise" : "axe";
      const after = on(t, W.killed + 0.1);
      const c: V3 = [0.1, 1.2, WALL_Z + 0.02];
      if (!after) out.fx.push({ key: `sh2|${k}`, cw: 500, ch: 900, draw: (p) => fxShadow2(p, k, "rgba(30,24,40,0.82)"), x: c[0], y: c[1], z: c[2], w: 1.35, h: 2.4, yaw: 0, soft: true });
      else out.fx.push({ key: "shAlone", cw: 500, ch: 900, draw: (p) => fxShadowAlone(p, "rgba(30,24,40,0.82)"), x: c[0], y: c[1], z: c[2], w: 1.35, h: 2.4, yaw: 0, soft: true });
      break;
    }
    case 3: { // the bridge: the old woman takes him for a beggar
      standAt(cam, out, RA, M.rBridge, { mode: "stand", expr: on(t, W.coin) ? "dazed" : "neutral", facing: 0, blink: lidAt(t, 900), prop: on(t, W.coin) ? "kopek" : null });
      const inW = walk(t, b0 + 0.3, W.coin - 0.35, M.oldIn, M.oldAt, 1.5);
      const outW = walk(t, W.coin + 0.9, W.coin + 3.4, M.oldAt, M.oldOut, 1.5);
      const w = on(t, W.coin + 0.9) ? outW : inW;
      standAt(cam, out, OW, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "smile", facing: on(t, W.coin + 0.9) ? -1 : 1, blink: lidAt(t, 904), prop: !w.moving && on(t, W.beggar) && !on(t, W.coin + 0.9) ? "point" : null });
      standAt(cam, out, GI, [w.m[0] - 0.55, 0, w.m[2] + 0.3], { mode: w.moving ? "stroll" : "stand", phase: q((w.phase + 0.5) % 1, 24), expr: "nervous", facing: on(t, W.coin + 0.9) ? -1 : 1, blink: lidAt(t, 905) });
      break;
    }
    case 4: { // the coin into the Neva from his hand; the camera pulls away and he is a speck
      const thrown = on(t, W.river - 0.3);
      standAt(cam, out, RA, M.rBridge, { mode: "stand", expr: on(t, W.cut) ? "pained" : "neutral", facing: 1, blink: lidAt(t, 900, [W.cut]), prop: thrown ? null : "kopek" });
      if (thrown) {
        const u = clamp01((t - (W.river - 0.3)) / 0.95), y = M.hand[1] + 0.25 - 4.6 * u * u;
        if (u < 1) big(out, `coin${q(t * 3 % 1, 6)}`, (p) => fxCoin(p, t * 3 % 1), [M.hand[0], y, M.hand[2] - 0.55 * u], 0.11, 0.11, 100, 100, 2);
        if (u >= 1) { const k = q(clamp01((t - (W.river + 0.65)) / 0.9), 20); if (k < 1) big(out, `splash${k}`, (p) => fxSplash(p, k), [M.hand[0], -3.35, M.hand[2] - 0.6], 0.9, 0.6, 300, 200, 1, { soft: true }); }
        shine(out, t, W.river - 0.3, [M.hand[0], M.hand[1] + 0.25, M.hand[2] + 0.05], 0.16, 0.4);
      }
      break;
    }
    case 5: { // the garret: they rush to hold him; his arms hang
      const tin = BEAT[4] + 0.35, tat = W.hug - 0.05;
      const mw = walk(t, tin, tat, M.gDoor, M.momAt, 1.8), dw = walk(t, tin + 0.15, tat + 0.1, M.gDoor, M.dunAt, 1.8);
      const held = on(t, W.hug);
      standAt(cam, out, DU, dw.m, { mode: dw.moving ? "stroll" : "stand", phase: dw.phase, expr: held ? "pained" : "relief_open", facing: 1, blink: lidAt(t, 903), headTilt: held ? -12 : 0, wave: dw.moving ? undefined : 0.6 });
      standAt(cam, out, MO, mw.m, { mode: mw.moving ? "stroll" : "stand", phase: mw.phase, expr: held ? "pained" : "relief_open", facing: -1, blink: lidAt(t, 902), headTilt: held ? 12 : 0 });
      standAt(cam, out, RA, M.rGarret, { mode: "stand", expr: on(t, W.lift) ? "pained" : "neutral", facing: 0, blink: lidAt(t, 900, [W.lift]) });
      break;
    }
    case 6: { // the lodging: "forget me", out of the door
      const go = on(t, W.forget);
      sit(cam, out, MO, M.mom, { expr: go ? "shock" : "nervous", facing: -1, blink: lidAt(t, 902, [W.forget]) });
      sit(cam, out, DU, M.dun, { expr: go ? "pained" : "stern", facing: -1, blink: lidAt(t, 903, [W.forget]) });
      const w1 = walk(t, W.forget + 0.1, W.forget + 1.2, M.rLodge, M.lDoor, 1.5), w2 = walk(t, W.forget + 1.2, W.forget + 1.8, M.lDoor, M.lOut, 1.5);
      const w = on(t, W.forget + 1.2) ? w2 : w1;
      if (!on(t, W.forget + 1.8)) standAt(cam, out, RA, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "stern", facing: go ? -1 : 0, blink: lidAt(t, 900) });
      break;
    }
    case 7: { // the canal at dusk: he walks toward us; her window above
      const w = walk(t, b0, W.sonya, M.canalFar, M.canalNear, 1.3);
      standAt(cam, out, RA, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "pained", facing: 0, blink: lidAt(t, 900) });
      break;
    }
    case 8: { // Sonya at the chest of drawers; Lizaveta's copper cross
      standAt(cam, out, SO, M.sChest, { mode: "stand", expr: on(t, W.lizaveta) ? "pained" : "neutral", facing: 1, blink: lidAt(t, 901, [W.lizaveta]), headTilt: -6, look: -0.3 });
      if (on(t, W.lizaveta)) {
        big(out, "copper", fxCopper, [M.sChest[0] + 0.02, 1.08, M.sChest[2] + 0.06], 0.06, 0.084, 100, 140, 2);
        shine(out, t, W.lizaveta, [M.sChest[0] + 0.04, 1.12, M.sChest[2] + 0.08], 0.14, 0.5);
      }
      break;
    }
    case 9: { // the two-shot: she on her bed, he on the rush chair. "Guess."
      sit(cam, out, SO, M.sBed, { expr: on(t, W.guess) ? "nervous" : "neutral", facing: 1, blink: lidAt(t, 901, [W.guess]) });
      sit(cam, out, RI, M.rChair, { expr: on(t, W.guess) ? "stern" : "pained", facing: -1, blink: lidAt(t, 900), tilt: on(t, W.guess) ? -6 : 0, look: -0.5 });
      break;
    }
    case 10: { // close on Sonya: she understands; she backs away like Lizaveta did (the ghost, same pose)
      const back = on(t, W.backs), gk = q(smooth((t - (W.backs - 0.1)) / 0.4) * (1 - smooth((t - (W.friend2 + 0.4)) / 0.6)), 10);
      if (gk > 0.02) out.fx.push({ key: `ghost${gk}`, cw: 600, ch: 1000, draw: (p) => { p.g.globalAlpha = 0.5 * gk; ghost(p, LIZAVETA, { mode: "stand", expr: "shock", facing: 1, prop: "point", tilt: 8, light: 0, seed: 3 }); p.g.globalAlpha = 1; },
        x: M.sBed[0] - 0.22, y: M.sBed[1] + 0.5 * 2.16 * 0.95 - 0.38, z: M.sBed[2] - 0.12, w: 1.3, h: 2.16, soft: true });
      sit(cam, out, SO, M.sBed, { expr: on(t, W.stares) ? "shock" : "nervous", facing: 1, blink: on(t, W.stares) ? 0 : lidAt(t, 901), tilt: back ? 8 : 0, prop: back ? "point" : null });
      break;
    }
    case 11: case 17: { // V.4: she falls on her knees before him, then jumps up and throws her arms round his neck (side view)
      const lit = { light: 0, seed: seedOf(900) };
      const hug = id === 17 || on(t, W.throws2), down = on(t, W.knees);
      if (hug) tableau(cam, out, `hug${id === 17 ? 1 : 0}|${q(lidAt(t, 900), 4)}|${q(lidAt(t, 901), 4)}`, M.kneel, (p) => hugSide(p,
        { ...lit, expr: id === 17 ? "relief" : "shock", blink: id === 17 ? 1 : lidAt(t, 900) }, { ...lit, seed: seedOf(901), expr: id === 17 ? "relief" : "pained", blink: 1 }, id === 17 ? 1 : 0));
      else if (down) tableau(cam, out, `kneelS|${q(lidAt(t, 900), 4)}`, M.kneel, (p) => kneelSide(p,
        { ...lit, expr: "shock", blink: lidAt(t, 900) }, { ...lit, seed: seedOf(901), expr: "shock", blink: 0 }));
      else {
        standAt(cam, out, RI, [M.kneel[0] + 0.25, 0, M.kneel[2]], { mode: "stand", expr: "stern", facing: -1, blink: lidAt(t, 900) });
        standAt(cam, out, SO, [M.kneel[0] - 0.35, 0, M.kneel[2] + 0.1], { mode: "stand", expr: "pained", facing: 1, blink: lidAt(t, 901) });
      }
      glow(out, t, (id === 17 ? W.truth : W.knees) - 0.05, [M.kneel[0], 1.55, M.kneel[2] - 0.45], 1.2, 3.0);
      break;
    }
    case 12: { // her face looking up, then his, breaking
      if (!on(t, W.unhappy - 0.1)) {
        standAt(cam, out, SO, M.sKneel, { mode: "stand", expr: "pained", facing: 0, blink: lidAt(t, 901) });
        tear(out, t, b0 + 0.3, [M.sKneel[0] - 0.07, M.sKneel[1] + 1.5, M.sKneel[2] + 0.12]);
      } else {
        standAt(cam, out, RI, M.kneel, { mode: "stand", expr: "nervous", facing: 0, blink: lidAt(t, 900, [W.unhappy]) });
        tear(out, t, W.unhappy + 0.4, [M.kneel[0] + 0.07, M.kneel[1] + 1.52, M.kneel[2] + 0.12], 1.3);
      }
      break;
    }
    case 13: { // at the sharp corner by the locked door: Napoleon, blown out
      standAt(cam, out, RI, M.rCorner, { mode: "stand", expr: on(t, W.myself) ? "pained" : on(t, W.theory) ? "stern" : "nervous", facing: -1, blink: lidAt(t, 900, [W.myself]), prop: on(t, W.theory) && !on(t, W.myself) ? "chin" : null });
      if (on(t, W.theory) && !on(t, W.myself)) icon(out, t, W.theory, [M.rCorner[0] - 0.3, 2.0, M.rCorner[2] + 0.35], 0.55, "napo", (p) => { p.g.scale(200 / 460, 200 / 460); fxNapoleon(p); });
      puff(out, t, W.myself - 0.05, [M.rCorner[0] - 0.3, 2.0, M.rCorner[2] + 0.35], 0.7, 0.6);
      break;
    }
    case 14: { // her cypress cross held out: go to the crossroads
      standAt(cam, out, SO, M.sCross, { mode: "stand", expr: on(t, W.kiss) ? "stern" : "pained", facing: 1, blink: lidAt(t, 901, [W.kiss]), prop: "cross" });
      shine(out, t, W.tells3 + 0.1, [M.sCross[0] + 0.25, 1.35, M.sCross[2] + 0.15], 0.2, 0.5);
      break;
    }
    case 15: { // the Haymarket crossroads: someone kneeling far off; snow on "Siberia"
      tableau(cam, out, "kneelAlone", KNEEL, (p) => kneelAlone(p, RASKOL, { expr: "pained", blink: 1, light: 0, seed: seedOf(900) }));
      if (on(t, W.siberia - 0.1)) for (let i = 0; i < 60; i++) {
        const x = (hh(i, 1) - 0.5) * 9, z = -2 - hh(i, 2) * 14, y = 6 - ((t * (0.6 + 0.5 * hh(i, 3)) + hh(i, 4) * 6) % 6.2);
        out.fx.push({ key: "snow", cw: 60, ch: 60, draw: fxSnow, x: x + 0.3 * Math.sin(t + i), y, z, w: 0.07, h: 0.07 });
      }
      break;
    }
    case 16: { // the empty room: Svidrigailov on the chair by the locked door, listening
      const turn = on(t, W.word);
      sit(cam, out, SV, M.svid, { expr: turn ? "grin" : "smug", facing: turn ? 0 : -1, blink: lidAt(t, 906, [W.word]), prop: turn ? null : "chin", headTilt: turn ? 0 : -8 });
      const k = q((t * 0.9) % 1, 12);
      out.fx.push({ key: `listen${k}`, cw: 300, ch: 200, draw: (p) => fxListen(p, k), x: -0.02, y: 1.25, z: -2.1, w: 0.5, h: 0.34, soft: true });
      break;
    }
  }
  return out;
};
export { FPS, RAIL_Z };
