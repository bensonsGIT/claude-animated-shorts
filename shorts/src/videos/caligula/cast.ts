// The Caligula seashell short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus calStage():
// who stands where, with which face and prop, in every shot, the legion, shells, crab, trireme. Cards, effects and blobs live on NOINK.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxSplash, fxPuff, fxCloud, Outfit, FrontOpts, SideOpts } from "../../engine/toon";
import { CALIGULA, LEGIONARY, CENTURION, KID_CALIGULA, SUETONIUS, PRINCE, HERALD, SENATOR, fxShell, fxCrab, fxGull, fxTrireme, fxEagle, fxBubble,
  fxBootsBubble, fxGuardShadows, fxMoon, fxRain, fxPurse } from "../../engine/library/caligula";
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


// ================= the Caligula short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const CA = who(800, CALIGULA, "cal"), CE = who(801, CENTURION, "cen"), CEH = who(801, { ...CENTURION, hat: "hair", hair: "#7a7a80", cape: undefined }, "cenh");
const SUE = who(802, SUETONIUS, "sue"), PR = who(803, PRINCE, "prince"), HE = who(804, HERALD, "herald");
const SEN = [0, 1, 2, 3, 4, 5].map((v) => who(820 + v, SENATOR(v), `sen${v}`));
const LEG = [0, 1, 2, 3, 4, 5].map((v) => who(840 + v, LEGIONARY(v), `leg${v}`));
const LEGH = [0, 1, 2, 3, 4, 5].map((v) => who(840 + v, { ...LEGIONARY(v, false), hat: "hair", hair: ["#3a2a20", "#6a4a30", "#2a2224", "#8a5a32", "#4a3a2a", "#1e1a1c"][v] }, `legh${v}`));
const stand = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...fo }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
};
const walk = (cam: CamInfo, out: Stage, w: Who, m: V3, t: number, fo: FrontOpts, rate = 2.2) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "march", phase: q((t * rate + hh(w.i, 2)) % 1, 16), lift: 70, blink: lidAt(t, w.i), ...fo }, {}));
  blob(out, m[0], m[1], m[2]);
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
/** which way (screen) a world motion goes: -1 / 1 */
const scr = (cam: CamInfo, vx: number, vz: number) => Math.sign(vx * cam.right.x + vz * cam.right.z) as -1 | 0 | 1;

// ---------------- the legion ----------------
const COLS = 13, ROWS = 5, NL = COLS * ROWS;
/** each soldier's place in the ranks (x, z) */
const RANK = (i: number): [number, number] => [-7.2 + (i % COLS) * 1.2 + (hh(i, 1) - 0.5) * 0.18, 0.4 + Math.floor(i / COLS) * 1.35 + (hh(i, 2) - 0.5) * 0.18];
const legion = (cam: CamInfo, out: Stage, t: number, fo: (i: number) => FrontOpts, mode: "stand" | "kneel" = "stand", skipNear = 0) => {
  for (let i = 0; i < NL; i++) {
    const [x, z] = RANK(i);
    if (Math.hypot(cam.pos.x - x, cam.pos.z - z) < skipNear) continue;
    if (mode === "kneel") stand(cam, out, LEGH[i % 6], [x, 0, z], { mode: "sit", prop: "shells", expr: hh(i, 5) < 0.5 ? "dazed" : "nervous", ...fo(i) });
    else stand(cam, out, LEG[i % 6], [x, 0, z], { expr: "stern", ...fo(i) });
  }
};
const EAGLES: V3[] = [[-4.0, 0, -0.7], [4.4, 0, -0.7]];
const eagle = (out: Stage, m: V3, dz = 0) => out.fx.push({ key: "eagle", cw: 160, ch: 560, draw: fxEagle, x: m[0], y: 1.36, z: m[2] + dz, w: 0.72, h: 2.5 });
/** shells lying on the beach */
const SHELLS: [number, number, number, number][] = Array.from({ length: 46 }, (_, i) => [-9 + 18 * hh(i, 71), -5.8 + 4.6 * hh(i, 72), i % 3, i % 6]);
const shells = (cam: CamInfo, out: Stage, scale = 1, near = 0) => {
  for (const [x, z, k, c] of SHELLS) {
    if (Math.hypot(cam.pos.x - x, cam.pos.z - z) < near) continue;
    out.fx.push({ key: `shell${k}${c}`, cw: 120, ch: 100, draw: (p) => fxShell(p, k, c), x, y: 0.06 * scale, z, w: 0.15 * scale, h: 0.125 * scale });
  }
};
const splash = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.7) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 24);
  out.fx.push({ key: `splash${u}`, cw: 400, ch: 400, draw: (p) => { p.g.scale(0.5, 0.5); fxSplash(p, u); }, x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const puff = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.6) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 20);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x: c[0], y: c[1], z: c[2], w: size, h: size, soft: true });
};
const bub = (cam: CamInfo, m: V3, side: number, y: number) => handAt(cam, m, side, y, 0.3);

export const calStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK, C0 = M.cal, CEm = M.cen;
  cam.t = t;
  if (id === 1 || id === 21) { // the hook / the loop: the emperor and the waves (the loop: an empty beach, one shell rolls in)
    if (id === 1) {
      const wet = on(t, WORD.ocean);
      stand(cam, out, CA, C0, { expr: wet ? "shock" : "smug", prop: ["gladius", 0], facing: 1, tilt: wet ? -4 : 0 });
      splash(out, t, WORD.ocean - 0.12, [C0[0] - 0.1, 1.0, C0[2] - 0.35], 2.6, 0.8);
      eagle(out, [-1.8, 0, -3.0]);
    } else {
      const u = clamp01((t - BEAT[15]) / Math.max(0.6, WORD.beat - BEAT[15])), z = -7.2 + 2.3 * smooth(u);
      out.fx.push({ key: "shell10", cw: 120, ch: 100, draw: (p) => fxShell(p, 1, 0), x: C0[0] - 0.2, y: 0.08, z, w: 0.3, h: 0.25, rot: -u * 6 });
      splash(out, t, WORD.beat - 0.1, [C0[0] - 0.4, 0.6, C0[2] - 1.6], 2.4, 0.8);
    }
    shells(cam, out, 1, 1.0);
    return;
  }
  if (id === 2) { // the historian at his desk, a raised eyebrow
    stand(cam, out, SUE, M.sue, { mode: "sit", expr: on(t, WORD.suetonius) ? "smug" : "neutral", prop: "writeQuill", look: on(t, WORD.suetonius) ? 0 : -0.5 }, false, 1);
    return;
  }
  if (id === 3) { // the legion marches down to the shore
    const t0 = BEAT[1] - 0.6, dur = Math.max(1.2, BEAT[2] - t0 - 0.4);
    for (let i = 0; i < NL; i++) {
      const [x, z] = RANK(i), u = clamp01((t - t0 - 0.05 * Math.floor(i / COLS)) / dur), zz = z + 7 * (1 - smooth(u));
      if (u < 1) walk(cam, out, LEG[i % 6], [x, 0, zz], t, { expr: "stern" }, 2.2);
      else stand(cam, out, LEG[i % 6], [x, 0, zz], { expr: "stern" });
    }
    for (const e of EAGLES) eagle(out, e, 7 * (1 - smooth(clamp01((t - t0) / dur))));
    stand(cam, out, CA, C0, { expr: "smug", prop: ["gladius", 0], facing: 1 });
    stand(cam, out, CE, CEm, { expr: "stern" });
    return;
  }
  if (id === 4) { // close on the emperor: the nickname bubble, the fist for a war
    const war = on(t, WORD.war);
    stand(cam, out, CA, C0, { expr: war ? "yell" : on(t, WORD.caligula) ? "smug" : "neutral", prop: war ? "fist" : null, facing: -1 });
    const s = popK(t, WORD.little - 0.1) * (on(t, WORD.war) ? clamp01(1 - (t - WORD.war) / 0.2) : 1);
    if (s > 0.01) {
      const b = bub(cam, C0, 0.56, 1.72), ph = q((t * 2.4) % 1, 8);
      out.fx.push({ key: `boots${ph}`, cw: 440, ch: 520, draw: (p) => fxBootsBubble(p, KID_CALIGULA, { mode: "march", phase: ph, lift: 70, expr: "grin", seed: 3 }),
        x: b[0], y: b[1], z: b[2], w: 0.78 * s, h: 0.92 * s });
    }
    eagle(out, [C0[0] - 1.6, 0, C0[2] - 1.8]);
    return;
  }
  if (id === 5 || id === 6) { // the Senate: the prince with his white cloth, the herald with the endless letter
    const pr: V3 = id === 5 ? M.prince : [M.prince[0] + 1.5, 0, M.prince[2] - 0.6];
    SEN.forEach((w, k) => {
      const row = k < 3 ? 0 : 1, x = 198.0 + (k % 3) * 2.0 + row * 1.0, m: V3 = [x, row ? 0.85 : 0.33, row ? -5.1 : -3.5];
      const ex = id === 5 ? "neutral" : on(t, WORD.submitted) ? (k % 2 ? "laugh" : "relief") : on(t, WORD.britain) ? "shock" : "neutral";
      stand(cam, out, w, m, { mode: "sit", expr: ex, facing: k % 2 ? -1 : 1 }, false);
    });
    stand(cam, out, PR, pr, { expr: id === 5 && on(t, WORD.surrendered) ? "grin" : "nervous", prop: "cloth", facing: 1 });
    if (id === 6) stand(cam, out, HE, M.herald, { expr: on(t, WORD.submitted) ? "grin" : "neutral", prop: "unroll" });
    return;
  }
  if (id === 7) { // overhead: the ranks, the ballistas, the eagles, a gull over the surf
    legion(cam, out, t, () => ({}));
    stand(cam, out, CA, C0, { expr: "smug", prop: ["gladius", 0], facing: 1 });
    stand(cam, out, CE, CEm, { expr: "stern" });
    for (const e of EAGLES) eagle(out, e);
    const u = (t - BEAT[4]) / 4, gp = q((t * 3) % 1, 6);
    out.fx.push({ key: `gull${gp}`, cw: 220, ch: 160, draw: (p) => fxGull(p, gp), x: -10 + 22 * u, y: 3.5, z: -8, w: 1.0, h: 0.72 });
    return;
  }
  if (id === 8) { // the trireme rows out a little way, and turns straight back
    const t0 = BEAT[5], tOut = WORD.straight, tBack = WORD.back;
    const zAt = (tt: number) => tt < tOut ? -8.2 - 4.0 * smooth((tt - t0) / Math.max(0.5, tOut - t0)) : -12.2 + 4.2 * smooth((tt - tOut) / Math.max(0.3, tBack - tOut + 0.1));
    const z = zAt(t), vz = zAt(t + 0.05) - z, dir = (scr(cam, 0, vz) || (t < tOut ? scr(cam, 0, -1) : scr(cam, 0, 1))) || 1;
    const bump = on(t, WORD.back) ? 0.06 * Math.exp(-(t - WORD.back) * 6) * Math.cos((t - WORD.back) * 30) : 0;
    const ph = q((t * 1.4) % 1, 8);
    out.fx.push({ key: `tri${ph}${dir}${q(bump, 40)}`, cw: 960, ch: 440, draw: (p) => fxTrireme(p, ph, dir, 1, bump), x: 0, y: 0.85, z, w: 5.0, h: 2.3,
      yaw: Math.atan2(cam.pos.x - 0, cam.pos.z - z) });
    splash(out, t, WORD.back - 0.05, [0, 0.6, z + 0.6], 2.6, 0.6);
    return;
  }
  if (id === 9) { // the ranks look at each other
    const look = (i: number) => (Math.floor(t * 1.6 + hh(i, 9) * 2) % 2 ? 1 : -1) as -1 | 1;
    legion(cam, out, t, (i) => ({ expr: "nervous", facing: look(i) }));
    stand(cam, out, CE, CEm, { expr: "nervous", facing: look(3) });
    return;
  }
  if (id === 10) { // the order: the sword comes down at the sand
    const k = smooth((t - WORD.order + 0.15) / 0.3);
    stand(cam, out, CA, C0, { expr: on(t, WORD.pick) ? "yell" : "stern", prop: ["gladius", k], facing: 1 });
    eagle(out, [C0[0] - 1.7, 0, C0[2] - 1.0]);
    shells(cam, out);
    return;
  }
  if (id === 11) { // one shell, close: a glint
    shells(cam, out, 1, 0.5);
    out.fx.push({ key: "shell00", cw: 120, ch: 100, draw: (p) => fxShell(p, 0, 0), x: C0[0] + 1.0, y: 0.09, z: C0[2] - 0.55, w: 0.24, h: 0.2 });
    burst(out, t, WORD.seashells - LEAD, [C0[0] + 1.04, 0.13, C0[2] - 0.5], 0.3, "#ffffff", 0.35);
    return;
  }
  if (id === 12) { // the legion on its knees filling helmets; a crab pinches the centurion's nose
    legion(cam, out, t, () => ({}), "kneel", 1.2);
    const pinch = on(t, WORD.tunics);
    stand(cam, out, CEH, CEm, { mode: "sit", prop: "shells", expr: pinch ? "pained" : "dazed" });
    const t0 = BEAT[8], u = clamp01((t - t0) / Math.max(0.5, WORD.tunics - t0 - 0.15));
    const base = handAt(cam, CEm, 1.0 - 0.75 * u, 0, 0.35), ph = q((t * 4) % 1, 6);
    const face: V3 = [CEm[0], 0.86, CEm[2] + 0.12];
    const c: V3 = pinch ? face : base;
    out.fx.push({ key: `crab${pinch ? 1 : 0}${ph}`, cw: 200, ch: 140, draw: (p) => fxCrab(p, pinch ? 1 : 0, ph), x: c[0], y: c[1] + 0.08, z: c[2] + (pinch ? 0.05 : 0), w: 0.32, h: 0.22 });
    burst(out, t, WORD.tunics - LEAD, [face[0] + 0.1, face[1] + 0.1, face[2] + 0.1], 0.5, "#ffffff", 0.25);
    return;
  }
  if (id === 13) { // spoils of the sea: the shell held up; the temple and the palace in thought bubbles
    stand(cam, out, CA, C0, { expr: on(t, WORD.spoils) ? "grin" : "smug", prop: "shell", facing: 1 });
    const which = on(t, WORD.palace) ? 1 : on(t, WORD.jupiters) ? 0 : -1;
    if (which >= 0) {
      const s = popK(t, which ? WORD.palace - 0.1 : WORD.jupiters - 0.1), b = bub(cam, C0, -0.3, 1.95);
      out.fx.push({ key: `bub${which}`, cw: 480, ch: 400, draw: (p) => fxBubble(p, which), x: b[0], y: b[1], z: b[2], w: 0.86 * s, h: 0.72 * s });
    }
    shells(cam, out, 1, 1.0);
    return;
  }
  if (id === 14) { // the lighthouse rises; fire on "victory" (beach.ts poses the tower)
    const L = M.lh;
    burst(out, t, WORD.victory - LEAD, [L[0], L[1] + 14.6, L[2]], 4.0, "#fff3b0", 0.35);
    for (let k = 0; k < 4; k++) puff(out, t, WORD.lighthouse + k * 0.35, [L[0] + 1.5, L[1] + 1 + k * 2.6, L[2] + 2.2], 2.6, 0.6);
    return;
  }
  if (id === 15) { // a purse sails in; the centurion catches it
    const caught = on(t, WORD.coins), t0 = WORD.paid, u = clamp01((t - t0) / Math.max(0.4, WORD.coins - t0 - 0.05));
    stand(cam, out, CE, CEm, { expr: caught ? "laugh" : on(t, WORD.hundred) ? "grin" : "neutral", prop: caught ? "purse" : "fist" });
    if (!caught) {
      const a = handAt(cam, CEm, -1.4, 1.6), b = handAt(cam, CEm, 0.32, 2.3, 0.2);
      out.fx.push({ key: "purse", cw: 120, ch: 140, draw: fxPurse, x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u + 0.8 * Math.sin(Math.PI * u), z: a[2] + (b[2] - a[2]) * u, w: 0.26, h: 0.3, rot: u * 4 });
    }
    burst(out, t, WORD.coins - LEAD, handAt(cam, CEm, 0.36, 2.0, 0.2), 0.55, "#ffe9a0", 0.3);
    return;
  }
  if (id === 16) { // "Go away rich!": the legion trudges up the beach toward us, helmets full of shells; the emperor waves
    for (let i = 0; i < NL; i++) {
      const [x, z] = RANK(i), zz = z + 0.8 * (t - BEAT[11]) - 1.5;
      walk(cam, out, LEGH[i % 6], [x, 0, zz], t, { expr: hh(i, 6) < 0.5 ? "dazed" : "nervous", prop: "shells" }, 1.8);
    }
    stand(cam, out, CA, C0, { expr: on(t, WORD.rich) ? "laugh" : "grin", wave: q((Math.sin(t * 9) + 1) / 2, 4) });
    burst(out, t, WORD.rich - LEAD, [C0[0] + 0.3, 2.2, C0[2]], 0.6, "#fff3b0", 0.3);
    return;
  }
  if (id === 17) { // the corridor: he strolls on; crested shadows rise on the wall behind him; the torches go out
    const R = M.corr, z = -7 + 3.2 * clamp01((t - BEAT[12]) / Math.max(1, WORD.killed - BEAT[12]));
    walk(cam, out, CA, [R[0] - 0.25, 0, z], t, { expr: on(t, WORD.guards) ? "nervous" : "smug" }, 1.6);
    const s = smooth((t - WORD.later) / Math.max(0.4, WORD.killed - WORD.later));
    if (s > 0) out.fx.push({ key: "guards", cw: 600, ch: 520, draw: fxGuardShadows, x: R[0] - 0.1, y: 1.25 * s, z: z - 2.4, w: 2.8, h: 2.5 * s });
    return;
  }
  if (id === 18) { // the shells are long gone: the surf takes them
    const g = clamp01(1 - (t - WORD.gone + 0.1) / 0.5);
    if (g > 0) shells(cam, out, g, 0.3);
    for (let k = 0; k < 3; k++) puff(out, t, WORD.gone - 0.1 + k * 0.12, [-0.6 + k * 0.8, 0.15, -5.0 - k * 0.3], 0.9, 0.55);
    return;
  }
  if (id === 19) { // the lighthouse burns on through the nights: the moon arcs over, clouds race
    const u = clamp01((t - WORD.but) / Math.max(1, BEAT[14] - WORD.but)), L = M.lh;
    out.fx.push({ key: "moon", cw: 200, ch: 200, draw: fxMoon, x: L[0] - 22 + 44 * u, y: L[1] + 18 + 8 * Math.sin(Math.PI * u), z: L[2] - 40, w: 4, h: 4 });
    for (let k = 0; k < 3; k++) {
      const x = L[0] - 30 + ((k * 23 + 60 * u * (1 + k * 0.3)) % 70);
      out.fx.push({ key: `cloud${k}`, cw: 600, ch: 300, draw: (p) => fxCloud(p, k), x, y: L[1] + 14 + k * 4, z: L[2] - 30 - k * 4, w: 14, h: 7, soft: true });
    }
    return;
  }
  if (id === 20) { // the storm of 1644: rain, lightning, the cliff gives way
    const L = M.lh, ph = q((t * 3) % 1, 8);
    for (let k = 0; k < 3; k++) {
      const d = 3 + k * 4, f = new THREE.Vector3(...([cam.pos.x, cam.pos.y, cam.pos.z] as V3));
      const dir = new THREE.Vector3(-14.5 - f.x, 10.5 - f.y, -12 - f.z).normalize();
      out.fx.push({ key: `rain${ph}${k}`, cw: 512, ch: 512, draw: (p) => fxRain(p, (ph + k * 0.33) % 1), x: f.x + dir.x * d, y: f.y + dir.y * d, z: f.z + dir.z * d, w: 2.2 + k * 2.6, h: 2.2 + k * 2.6, soft: true });
    }
    for (let k = 0; k < 5; k++) puff(out, t, WORD.collapsed + 0.5 + k * 0.15, [L[0] + 7 + k * 0.8, 1.5 + k * 0.6, L[2] + 1 + k], 6, 0.9);
    splash(out, t, WORD.collapsed + 0.9, [M.rubble[0], 2.0, M.rubble[2] + 1], 9, 1.0);
    return;
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  calStage(id, t, cam, out);
  return out;
};
