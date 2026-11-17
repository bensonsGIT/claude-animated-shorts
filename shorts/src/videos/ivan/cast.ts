// The Ivan Ilych short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus ivanStage():
// who stands where, with which face and prop, in every shot. Cards, effects and blobs live on NOINK.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, fxStars, Outfit, FrontOpts, SideOpts } from "../../engine/toon";
import { IVAN, IVAN_SICK, WIFE, WIFE_BLACK, WIFE_EVENING, LIZA, FIANCE, GERASIM, VASYA, PETER, FEDOR, SHEBEK, UPHOLSTERER, DOCTOR, PLAYER,
  fxThought, fxNewspaper, fxBolts, fxBruise, fxTaste, fxCard, fxTear, fxLegsUp } from "../../engine/library/ivan";
import { fxArmchair } from "../../engine/library/gambler";
import { fxHeart } from "../../engine/library/gatsby";
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


// ================= the Ivan Ilych short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
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

const IV = who(800, IVAN, "iv"), IVS = who(800, IVAN_SICK, "ivs"), WI = who(801, WIFE, "wi"), WIB = who(801, WIFE_BLACK, "wib"), WIE = who(801, WIFE_EVENING, "wie");
const LI = who(802, LIZA, "li"), FI = who(803, FIANCE, "fi"), GE = who(804, GERASIM, "ge"), VA = who(805, VASYA, "va");
const PE = who(806, PETER, "pe"), FE = who(807, FEDOR, "fe"), SH = who(808, SHEBEK, "sh"), UP = who(809, UPHOLSTERER, "up");
const DOC = [0, 1].map((v) => who(810 + v, DOCTOR(v), `doc${v}`)), PL = [0, 1].map((v) => who(820 + v, PLAYER(v), `pl${v}`));
const go = (moving: boolean, cam: CamInfo, out: Stage, w: Who, m: V3, t: number, fo: FrontOpts) => (moving ? walk(cam, out, w, m, t, fo) : stand(cam, out, w, m, fo));
/** a seated card on a seat of height `seat` (the sit pose's hips sit ~0.2 m above the card's feet) */
const sit = (cam: CamInfo, out: Stage, w: Who, m: V3, seat: number, fo: FrontOpts) => stand(cam, out, w, [m[0], seat - 0.2, m[2]], { mode: "sit", ...fo }, false);
const thought = (out: Stage, t: number, t0: number, c: V3, kind: Parameters<typeof fxThought>[1], s0 = 0.85, t1 = Infinity) => {
  const s = popK(t, t0) * (t > t1 ? clamp01(1 - (t - t1) / 0.2) : 1);
  if (s <= 0.01) return;
  out.fx.push({ key: `thought${kind}`, cw: 480, ch: 400, draw: (p) => fxThought(p, kind), x: c[0], y: c[1], z: c[2], w: s0 * s, h: s0 * 0.83 * s });
};
const BED = 0.54, SOFA = 0.5;

export const ivanStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  cam.t = t;
  if (id === 1) { // the funeral: the closed coffin between the drapes, the widow in black lace (out of shot once the camera tilts up)
    if (t > WORD.curtains - 0.2) return;
    stand(cam, out, WIB, M.widow, { expr: on(t, WORD.curtains) ? "dazed" : "pained", facing: 1 });
    return;
  }
  if (id === 2) { // the judges' room: three colleagues read the paper; on "job" each one dreams of the vacancy
    const j = on(t, WORD.job);
    stand(cam, out, FE, M.fedor, { expr: j ? "grin" : on(t, WORD.thought) ? "smug" : "neutral", facing: 1 });
    stand(cam, out, PE, M.peter, { expr: j ? "grin" : "neutral", look: j ? 0 : -0.5 });
    stand(cam, out, SH, M.shebek, { expr: j ? "grin" : "neutral", facing: -1, look: j ? 0 : -0.6 });
    if (!j) { const p = handAt(cam, M.peter, -0.38, 1.12, 0.35); out.fx.push({ key: "paper", cw: 360, ch: 260, draw: fxNewspaper, x: p[0], y: p[1], z: p[2], w: 0.62, h: 0.45 }); }
    thought(out, t, WORD.job - 0.12, [M.fedor[0] + 0.2, 2.6, M.fedor[2] + 0.2], "chair", 0.85);
    thought(out, t, WORD.job - 0.02, [M.peter[0] + 0.05, 3.0, M.peter[2] + 0.1], "money", 0.85);
    thought(out, t, WORD.job + 0.08, [M.shebek[0] - 0.2, 2.6, M.shebek[2] + 0.2], "medal", 0.85);
    return;
  }
  if (id === 3) { // alive, healthy, proud in his new drawing room
    stand(cam, out, IV, M.ivanR, { expr: "smile", facing: 0 });
    return;
  }
  if (id === 4) { // everything right: career, wife, furniture pop in
    const ca = on(t, WORD.career), wf = on(t, WORD.wife), fu = on(t, WORD.furniture);
    stand(cam, out, IV, M.ivan4, { expr: fu ? "grin" : ca ? "smug" : "smile", prop: ca && !wf ? "scroll" : wf ? "point" : null, facing: wf ? 1 : 0 });
    const ws = popK(t, WORD.wife - 0.08);
    if (ws > 0.01) stand(cam, out, WI, M.wife4, { expr: "smile", facing: -1 }, true, ws);
    const cs = popK(t, WORD.furniture - 0.08);
    if (cs > 0.01) { const c = M.chair4; out.fx.push({ key: "chair", cw: 420, ch: 520, draw: (p) => fxArmchair(p, false), x: c[0], y: 0.62 * cs, z: c[2], w: 1.0 * cs, h: 1.24 * cs }); blob(out, c[0], 0, c[2], 1.4 * cs); }
    burst(out, t, WORD.career - 0.05, [M.ivan4[0] - 0.35, 1.5, M.ivan4[2] + 0.3], 0.9, "#ffe27a", 0.3);
    burst(out, t, WORD.furniture - 0.05, [M.chair4[0], 0.8, M.chair4[2] + 0.3], 1.0, "#fff3b0", 0.3);
    return;
  }
  if (id === 5) { // alone on the sofa at dusk: the smile drains away
    const e = on(t, WORD.terrible) ? "dazed" : on(t, WORD.ordinary) ? "neutral" : "smile";
    sit(cam, out, IV, M.sofa, SOFA, { expr: e, look: on(t, WORD.terrible) ? -0.4 : 0 });
    return;
  }
  if (id === 6) { // the promotion letter; the bolts of cretonne pile up, the upholsterer walks in
    const pr = on(t, WORD.promotion), de = on(t, WORD.decorate);
    stand(cam, out, IV, M.ivan6, { expr: pr ? "laugh" : "smile", prop: pr && !de ? "letter" : de ? "point" : null, facing: de ? 1 : 0 });
    burst(out, t, WORD.promotion - 0.05, [M.ivan6[0] + 0.3, 1.5, M.ivan6[2] + 0.3], 1.0, "#ffe27a", 0.35);
    const n = de ? 1 + Math.min(3, Math.floor((t - WORD.decorate) * 6)) : on(t, WORD.home) ? 1 : 0;
    if (n > 0) out.fx.push({ key: `bolts${n}`, cw: 320, ch: 360, draw: (p) => fxBolts(p, n), x: M.bolts[0], y: 0.42, z: M.bolts[2], w: 0.75, h: 0.84 });
    const u = smooth((t - WORD.grand) / 0.9), x = 3.2 + (M.uph6[0] - 3.2) * u;
    if (t > WORD.grand - 0.1) go(u < 1, cam, out, UP, [x, 0, M.uph6[2]], t, { expr: "neutral", facing: -1 });
    return;
  }
  if (id === 7) { // up the ladder, the slip, the knob
    const sl = on(t, WORD.slipped), kn = on(t, WORD.knob);
    const k = sl ? smooth((t - WORD.slipped) / 0.18) : 0, lad = M.ladder;
    const pl = person(cam, IV, lad[0] - 0.12 * k, lad[1] - 0.1 * k, lad[2], FRONT,
      { mode: "stand", expr: kn ? "pained" : sl ? "shock" : "stern", prop: sl ? "fist" : "point", facing: -1, tilt: kn ? -6 : sl ? 14 : 0, blink: lidAt(t, IV.i) }, {});
    out.places.push(pl);
    stand(cam, out, UP, M.uph7, { expr: kn ? "shock" : sl ? "nervous" : "neutral", look: 0.5, facing: 1 });
    if (kn && t < WORD.knob + 1.0) { const u = q((t - WORD.knob) * 1.6 % 1, 12); out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: lad[0] - 0.05, y: lad[1] + 1.95, z: lad[2] + 0.2, w: 0.7, h: 0.35 }); }
    burst(out, t, WORD.knob - 0.04, [M.knob[0] + 0.1, M.knob[1], M.knob[2] + 0.5], 0.8, "#fff3b0", 0.3);
    return;
  }
  if (id === 8) { // just a bruise; a strange taste; the pain moves in
    const ta = on(t, WORD.strange), pa = on(t, WORD.pain), lf = on(t, WORD.left);
    stand(cam, out, pa ? IVS : IV, M.ivan8, { expr: lf ? "pained" : pa ? "nervous" : ta ? "lick" : "grin", prop: pa ? "chest" : "chest", facing: 0, tilt: lf ? 7 : 0, headTilt: lf ? 6 : 0 });
    const bk = pa ? 1 : ta ? 0.4 : 0;
    const b = handAt(cam, M.ivan8, -0.1, 1.2, 0.15);
    out.fx.push({ key: `bruise${q(bk, 4)}`, cw: 200, ch: 160, draw: (p) => fxBruise(p, bk), x: b[0], y: b[1], z: b[2], w: 0.16 + 0.08 * bk, h: 0.13 + 0.06 * bk });
    if (ta && !pa) { const m = handAt(cam, M.ivan8, 0.3, 1.78, 0.2), u = q((t * 2) % 1, 8); out.fx.push({ key: `taste${u}`, cw: 220, ch: 180, draw: (p) => fxTaste(p, u), x: m[0], y: m[1], z: m[2], w: 0.28, h: 0.23 }); }
    return;
  }
  if (id === 9) { // two doctors argue over the patient; nobody says the word
    const dy = on(t, WORD.dying);
    sit(cam, out, IVS, M.bed, BED, { expr: dy ? "dazed" : "nervous", look: Math.sin(t * 3) > 0 ? -0.4 : 0.4 });
    stand(cam, out, DOC[0], M.doc1, { expr: dy ? "grin" : "stern", prop: dy ? null : "point", facing: 1 });
    stand(cam, out, DOC[1], M.doc2, { expr: dy ? "grin" : "angry", prop: dy ? null : "point", facing: -1 });
    const bump = on(t, WORD.kidney) && !dy ? 0.08 * Math.max(0, Math.sin((t - WORD.kidney) * 9)) : 0;
    thought(out, t, WORD.kidney - 0.1, [M.doc1[0] + 0.15 + bump, 2.4, M.doc1[2] + 0.2], "kidney", 0.68, WORD.dying - 0.1);
    thought(out, t, WORD.appendix - 0.1, [M.doc2[0] - 0.15 - bump, 2.4, M.doc2[2] + 0.2], "appendix", 0.68, WORD.dying - 0.1);
    return;
  }
  if (id === 10) { // the family off to the theatre, bright and false, walking past him toward the lens
    const lie = on(t, WORD.lie);
    sit(cam, out, IVS, M.bed, BED, { expr: lie ? "pained" : "neutral", facing: lie ? -1 : 1, look: lie ? -0.6 : 0.4 });
    const t0 = BEAT[9] - 0.2, dur = Math.max(3.0, WORD.lie - t0 + 1.4);
    [[WIE, 0], [LI, 0.45], [FI, 0.9]].forEach(([w, d], i) => {
      // they keep walking past the lens and leave the frame at the right (never vanish in shot)
      const u = Math.max(0, (t - t0 - (d as number)) / dur), x = M.door[0] - 1.2 - 0.6 * u + 0.3 * i, z = M.door[2] + 0.2 + 2.6 * u;
      if (u >= 2.0) return;
      go(true, cam, out, w as Who, [x, 0, z], t, { expr: lie ? "smile" : i === 0 ? "laugh" : "grin", facing: -1 });
    });
    return;
  }
  if (id === 11) { // night: Gerasim holds his master's legs up on his shoulders
    const sh = on(t, WORD.shoulders);
    const ie = sh ? "relief" : "pained", ge = "smile" as const;
    out.fx.push({ key: `legs${ie}|${lidAt(t, IVS.i)}|${lidAt(t, GE.i)}`, cw: 1400, ch: 1000, draw: (p) => fxLegsUp(p, { expr: ie, blink: lidAt(t, IVS.i) }, { expr: ge, blink: lidAt(t, GE.i) }),
      x: M.bed[0] + 0.25, y: 0.93, z: M.bed[2] + 0.55, w: 2.6, h: 1.86 });
    blob(out, M.bed[0] + 0.9, 0, M.bed[2] + 0.6, 1.2);
    return;
  }
  if (id === 12) { // the black sack: he screams, sinking
    const sc = on(t, WORD.screamed), y = M.dark[1] - 0.25 * clamp01((t - BEAT[11]) / 2.5);
    stand(cam, out, IVS, [M.dark[0], y, M.dark[2]], { expr: sc ? "yell" : "pained", tilt: sc ? 4 * Math.sin(t * 20) : 0 }, false);
    return;
  }
  if (id === 13) { // the son kisses his hand; the wife at his side; he pities them
    const ki = on(t, WORD.kissed), pi = on(t, WORD.pitied);
    sit(cam, out, IVS, [M.bed[0] - 0.2, 0, M.bed[2]], BED, { expr: pi ? "smile_closed" : ki ? "relief" : "pained", facing: 1, prop: ki ? "point" : null });
    stand(cam, out, VA, M.vasya, { expr: "pained", facing: -1, tilt: ki ? -10 : 0, headTilt: ki ? -8 : 0 });
    stand(cam, out, WI, M.wife13, { expr: "pained", facing: -1 });
    if (ki) for (let i = 0; i < 2; i++) { const u = ((t - WORD.kissed) * 0.9 + i * 0.5) % 1; out.fx.push({ key: "tear", cw: 60, ch: 90, draw: fxTear, x: M.vasya[0] + 0.05 + 0.08 * i, y: 1.35 - 0.7 * u, z: M.vasya[2] + 0.15, w: 0.045, h: 0.068 }); }
    if (pi) { const s = popK(t, WORD.pitied - 0.1); out.fx.push({ key: "heart", cw: 200, ch: 180, draw: (p) => fxHeart(p), x: M.bed[0] + 0.15, y: 1.55 + 0.3 * clamp01(t - WORD.pitied), z: M.bed[2] + 0.4, w: 0.2 * s, h: 0.18 * s }); }
    return;
  }
  if (id === 14) { // he looks for the fear and finds light
    const li = on(t, WORD.light);
    const look = li ? 0 : on(t, WORD.fear) ? (Math.sin((t - WORD.fear) * 4) > 0 ? -0.7 : 0.7) : 0;
    stand(cam, out, IVS, M.dark, { expr: li ? "relief" : on(t, WORD.fear) ? "nervous" : "neutral", look }, false);
    burst(out, t, WORD.light - 0.05, [M.dark[0], 1.4, M.dark[2] - 0.6], 3.2, "#ffffff", 0.5);
    return;
  }
  if (id === 15) { // that evening: cards at Fedor Vasilievich's; Peter Ivanovich cuts in
    const ca = on(t, WORD.cards);
    sit(cam, out, FE, M.pl1, 0.5, { expr: ca ? "laugh" : "smug", facing: 1 });
    sit(cam, out, PL[0], M.pl2, 0.5, { expr: ca ? "grin" : "neutral", facing: -1 });
    const u = smooth((t - BEAT[14]) / Math.max(1, WORD.back - BEAT[14]));
    if (u < 1) go(true, cam, out, PE, [139.0 + 0.75 * u, 0, -0.4 - 1.15 * u], t, { expr: "neutral", facing: 1 });
    else sit(cam, out, PE, M.peterC, 0.5, { expr: ca ? "grin" : "smile", facing: 1 });
    // the deal: face-down cards slide from Fedor to each place; on "cards" a fan of face cards jumps up
    const T0 = M.table, seats: V3[] = [[T0[0] - 0.45, 0, T0[2] + 0.1], [T0[0] + 0.45, 0, T0[2] - 0.2], [T0[0] - 0.1, 0, T0[2] - 0.45]];
    for (let i = 0; i < 6; i++) {
      const s0 = WORD.back - 0.6 + i * 0.12, v = smooth((t - s0) / 0.25);
      if (t < s0) continue;
      const d = seats[i % 3], x = M.pl1[0] + 0.2 + (d[0] - M.pl1[0] - 0.2) * v, z = T0[2] - 0.4 + (d[2] - T0[2] + 0.4) * v;
      out.fx.push({ key: "card0", cw: 120, ch: 170, draw: (p) => fxCard(p, 0), x: x + 0.03 * Math.floor(i / 3), y: T0[1] + 0.03 + 0.003 * i, z, w: 0.1, h: 0.14, flat: true, rot: 0.3 * i });
    }
    if (ca) for (let i = 0; i < 5; i++) { const s = popK(t, WORD.cards - 0.08 + i * 0.03); out.fx.push({ key: `card${1 + (i % 2)}`, cw: 120, ch: 170, draw: (p) => fxCard(p, (1 + (i % 2)) as 1 | 2), x: T0[0] - 0.24 + i * 0.12, y: T0[1] + 0.45 + 0.05 * Math.abs(i - 2) * -1, z: T0[2] + 0.3, w: 0.13 * s, h: 0.18 * s, rot: (i - 2) * 0.22 }); }
    return;
  }
};

const TOP = 0.82; void TOP; void bodySide; void puff; void IV; void WI;

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  ivanStage(id, t, cam, out);
  return out;
};
