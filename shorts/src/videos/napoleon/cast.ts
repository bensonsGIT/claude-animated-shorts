// The Napoleon rabbit-hunt short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus napStage():
// who stands where, with which face and prop, in every shot, and the rabbit herd. Cards, effects and blobs live on NOINK.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, Outfit, FrontOpts, SideOpts } from "../../engine/toon";
import { NAPOLEON, NAPOLEON_WAR, BERTHIER, BUYER, COACHMAN, HUNTER, fxRabbit, fxCabbage, fxCabbageBubble, fxTumble, fxSteam, fxCoach, fxPie,
  RabbitPose, RabbitEye } from "../../engine/library/napoleon";
import { FPS, SHOTS, V3, clamp01, smooth, WORD, BEAT, MARK } from "./story";
import { HUTCH_X, HUTCH_Z, TABLE } from "./park";
import { MAP } from "./tent";
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


// ================= the Napoleon short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const NP = who(800, NAPOLEON, "nap"), NPW = who(800, NAPOLEON_WAR, "napw"), BE = who(801, BERTHIER, "ber"), BU = who(802, BUYER, "buyer");
const CO = [0, 1, 2, 3].map((v) => who(810 + v, COACHMAN(v), `co${v}`));
const HU = [0, 1, 2, 3, 4].map((v) => who(820 + v, HUNTER(v), `hu${v}`));
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

// ---------------- the rabbits ----------------
const RW = 0.62, RH = (RW * 260) / 320;
/** one rabbit card on the ground at (x, z) (+ y lift); dir from its world velocity (screen side), else seeded */
const rabbit = (cam: CamInfo, out: Stage, i: number, x: number, y: number, z: number, pose: RabbitPose, ph = 0, vel: [number, number] = [0, 0],
  eye: RabbitEye = "dot", scale = 1, shadow = true) => {
  const d = Math.hypot(cam.pos.x - x, cam.pos.y - y, cam.pos.z - z) / scale;
  if (d < 0.35) return;
  const k = d < 2.5 ? 2 : d < 8 ? 1 : d < 18 ? 0.5 : 0.3;
  const sd = scr(cam, vel[0], vel[1]), dir = sd !== 0 ? sd : hh(i, 3) < 0.5 ? 1 : -1;
  const coat = i % 8, lop = hh(i, 7) < 0.18, phq = q(((ph % 1) + 1) % 1, 8);
  const lift = pose === "hop" || pose === "front" ? 0.13 * scale * Math.abs(Math.sin(Math.PI * phq)) : 0;
  out.fx.push({ key: `rab|${coat}|${pose}|${phq}|${dir}|${eye}|${lop}|${k}`, cw: Math.round(320 * k), ch: Math.round(260 * k),
    draw: (p) => { p.g.scale(k, k); fxRabbit(p, coat, pose, phq, dir, eye, lop); },
    x, y: y + lift + (RH * scale) / 2 - 0.035 * scale, z, w: RW * scale, h: RH * scale });
  if (shadow && d < 12 && y < 0.05) blob(out, x, 0, z, 0.6 * scale, 0.75);
};
const NR = 150;
/** where each rabbit settles on the lawn after the release */
const SPOT: [number, number][] = Array.from({ length: NR }, (_, i) => [-9.5 + 19 * hh(i, 21), -15.5 + 10.5 * hh(i, 22)]);
/** the phalanx: rows of 15 facing the Emperor */
const PHX = (i: number): [number, number] => [-3.8 + (i % 15) * 0.56 + (hh(i, 31) - 0.5) * 0.2, -9.5 - Math.floor(i / 15) * 0.55 + (hh(i, 32) - 0.5) * 0.2];
const gal = (t: number, i: number, rate = 3.2) => t * rate + hh(i, 11);
const T_REL = (i: number) => WORD.loose + 0.05 + Math.floor(i / 8) * 0.045;
/** release from the hutches: [x, z, u] (null = still inside) */
const fromHutch = (i: number, t: number): [number, number, number] | null => {
  const t0 = T_REL(i);
  if (t < t0) return null;
  const u = clamp01((t - t0) / 1.5), h = i % 8, x0 = HUTCH_X[h] + (hh(i, 4) - 0.5) * 0.6, z0 = HUTCH_Z + 0.6, [x1, z1] = SPOT[i];
  return [x0 + (x1 - x0) * smooth(u), z0 + (z1 - z0) * smooth(u), u];
};
/** the flank attack (three bodies wheeling right and left): [x, z, vx, vz] */
const flank = (i: number, t: number): [number, number, number, number] => {
  const N = MARK.nap, c = i % 3, j = Math.floor(i / 3);
  const dur = Math.max(0.9, WORD.behind - WORD.split - 0.15);
  const at = (tt: number) => {
    const u = smooth(clamp01((tt - WORD.split - j * 0.012) / dur));
    const P0 = [-3.8 + (i % 15) * 0.56, -6.5 - Math.floor(i / 15) * 0.4];
    const P1 = c === 0 ? [-6.5, -2] : c === 2 ? [7.5, -2] : [N[0] + (hh(i, 12) - 0.5) * 3, -5];
    const P2 = c === 1 ? [N[0] + (hh(i, 8) - 0.5) * 3.4, -2.6 - hh(i, 9) * 2.2] : [N[0] + (c === 0 ? -0.5 : 0.5) + (hh(i, 8) - 0.5) * 1.6, N[2] + 0.7 + hh(i, 9) * 1.8];
    const s = 1 - u;
    return [s * s * P0[0] + 2 * s * u * P1[0] + u * u * P2[0], s * s * P0[1] + 2 * s * u * P1[1] + u * u * P2[1]];
  };
  const a = at(t), b = at(t + 0.05);
  return [a[0], a[1], (b[0] - a[0]) / 0.05, (b[1] - a[1]) / 0.05];
};
/** a little bicorne card (200 x 110) for the victorious rabbit */
const fxHat = (p: Pen) => {
  p.poly([[8, 92], [40, 46], [100, 14], [160, 46], [192, 92], [100, 80]], "#1a1820", 5);
  p.ell(70, 58, 9, 9, "#c8303a", 2); p.ell(70, 58, 6, 6, "#f6f2ea", 0); p.ell(70, 58, 3, 3, "#2a4a9a", 0);
};

export const napStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK, N = M.nap;
  cam.t = t;
  if (id === 1 || id === 22) { // the tent: Napoleon over the map
    const shock = id === 1 && on(t, WORD.ran);
    stand(cam, out, NPW, M.napTent, { expr: shock ? "shock" : "smug", prop: "chest", facing: 0 });
    burst(out, t, WORD.ran - LEAD, [M.napTent[0], 2.0, M.napTent[2] + 0.2], 0.6, "#ffffff", 0.25);
    if (id === 22) rabbit(cam, out, 3, MAP[0] + 0.85, MAP[1], MAP[2] + 0.5, "sit", 0, [-1, 0], "happy", 0.7, false);
    return;
  }
  if (id === 2) { // the hook: the phalanx charging the lens
    const t0 = WORD.bunnies - 0.12;
    for (let i = 0; i < 90; i++) {
      const [x, z0] = PHX(i), z = z0 + 3 + 6.5 * (t - t0);
      rabbit(cam, out, i, x, 0, z, "front", gal(t, i, 4), [0, 1], "hungry");
    }
    return;
  }
  if (id === 3) { // the coach rolls up the drive at sunrise; the party waits on the lawn
    const u = smooth(clamp01((t - BEAT[1]) / Math.max(1, BEAT[2] - BEAT[1] - 0.6))), z = 12.5 - 8.5 * u;
    const leg = u < 1 ? Math.floor(t * 8) % 4 : 0, dir = scr(cam, 0, -1) || 1;
    out.fx.push({ key: `coach${leg}${dir}1`, cw: 760, ch: 420, draw: (p) => fxCoach(p, leg, dir, true), x: M.coachStop[0], y: 0.95, z, w: 3.6, h: 2.0,
      yaw: Math.atan2(cam.pos.x - M.coachStop[0], cam.pos.z - z) });
    blob(out, M.coachStop[0], 0, z, 3.2, 0.7);
    [[2.0, 2.2], [2.9, 1.6], [-2.2, 2.6], [3.6, 2.8], [-3.0, 1.8]].forEach(([x, z2], k) => stand(cam, out, HU[k], [x, 0, z2], { expr: "neutral", facing: -1 }));
    stand(cam, out, BE, [5.4, 0, 3.4], { expr: "grin", facing: -1 });
    return;
  }
  if (id === 4) { // the Emperor, bored; the court jostles in with amusements
    const bored = on(t, WORD.entertained);
    stand(cam, out, NP, N, { expr: bored ? "dazed" : on(t, WORD.power) ? "smug" : "neutral", prop: ["fowling", 0], headTilt: bored ? 10 : 0 });
    const offers: [V3, FrontOpts["prop"], number][] = [[[N[0] - 0.95, 0, N[2] - 0.5], "goblet", 1], [[N[0] + 0.95, 0, N[2] - 0.45], "scroll", -1], [[N[0] + 0.35, 0, N[2] - 1.3], "letter", -1]];
    offers.forEach(([m, prop, f], k) => {
      const s = popK(t, WORD.court + 0.15 * k);
      if (s > 0) stand(cam, out, HU[k], m, { expr: "grin", prop, facing: f as -1 | 1 }, true, s);
    });
    return;
  }
  if (id === 5) { // Berthier bows and offers his rabbit shoot
    const offer = on(t, WORD.rabbit);
    stand(cam, out, BE, M.ber, { expr: "grin", headTilt: on(t, WORD.staff) && !offer ? 16 : 0, tilt: on(t, WORD.staff) && !offer ? -7 : 0, prop: offer ? "point" : "chest", facing: -1 });
    stand(cam, out, NP, N, { expr: offer ? "grin" : "neutral", prop: ["fowling", 0], facing: -1 });
    return;
  }
  if (id === 6) { // the empty lawn; a tumbleweed rolls across
    const t0 = WORD.except - 0.4, u = clamp01((t - t0) / 2.4);
    if (t >= t0) out.fx.push({ key: `tumble${q(u * 3, 8)}`, cw: 200, ch: 200, draw: (p) => fxTumble(p, q(u * 3, 8)), x: -7 + 13 * u, y: 0.4 + 0.15 * Math.abs(Math.sin(u * 14)), z: -9, w: 0.75, h: 0.75 });
    return;
  }
  if (id === 7) { // the release: the hutch doors drop and the rabbits pour out
    stand(cam, out, BE, M.berHutch, { expr: "smug", prop: on(t, WORD.bought) ? "point" : null, facing: -1 });
    stand(cam, out, BU, M.buyerHutch, { expr: on(t, WORD.loose) ? "grin" : "nervous", facing: 1 });
    for (let i = 0; i < NR; i++) {
      const r = fromHutch(i, t);
      if (!r) continue;
      const [x, z, u] = r;
      rabbit(cam, out, i, x, 0, z, u < 1 ? "front" : "sit", gal(t, i), [0, 1], "dot");
    }
    return;
  }
  if (id === 8) { // breakfast, then the gun
    const up = on(t, WORD.raised), k = smooth((t - WORD.raised + 0.1) / 0.35);
    if (!up) stand(cam, out, NP, M.seat, { mode: "sit", expr: on(t, WORD.breakfast) ? "grin" : "smug", facing: 0 }, false);
    else stand(cam, out, NP, M.seat, { expr: "stern", prop: ["fowling", k], facing: -1 }, false);
    stand(cam, out, BE, M.berPav, { expr: "grin", facing: -1 });
    const bites = Math.min(3, Math.floor(3 * clamp01((t - WORD.splendid) / 1.2)));
    out.fx.push({ key: `pie${bites}`, cw: 220, ch: 140, draw: (p) => fxPie(p, bites), x: TABLE[0] - 0.25, y: TABLE[1] + 0.12, z: TABLE[2] - 0.05, w: 0.55, h: 0.35 });
    return;
  }
  if (id === 9) { // the rabbits sit; on "run" they all turn to look
    const look = on(t, WORD.run);
    for (let i = 0; i < 120; i++) rabbit(cam, out, i, SPOT[i][0], 0, SPOT[i][1], look ? "front" : "sit", 0, [0, 0], look ? "shock" : "dot");
    return;
  }
  if (id === 10) { // bunch up, turn around, charge
    const u = smooth((t - WORD.bunched) / Math.max(0.5, WORD.turned - WORD.bunched)), ch = Math.max(0, t - WORD.charged + 0.05);
    for (let i = 0; i < NR; i++) {
      const [x0, z0] = SPOT[i], [x1, z1] = PHX(i);
      const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u + 8.0 * ch;
      if (!on(t, WORD.turned)) rabbit(cam, out, i, x, 0, z, u > 0 && u < 1 ? "hop" : "sit", gal(t, i), [x1 - x0, z1 - z0], "dot");
      else rabbit(cam, out, i, x, 0, z, ch > 0 ? "front" : "front", ch > 0 ? gal(t, i, 4) : 0, [0, 1], ch > 0 ? "hungry" : "dot");
    }
    return;
  }
  if (id === 11) { // the Emperor, gun up, sees them coming
    const sh2 = on(t, WORD.napoleon2);
    stand(cam, out, NP, N, { expr: sh2 ? "shock" : "stern", prop: ["fowling", 1], tilt: sh2 ? q(4 * Math.sin(t * 20), 2) : 0 });
    burst(out, t, WORD.napoleon2 - LEAD, [N[0], 2.05, N[2] - 0.1], 0.7, "#ffffff", 0.25);
    for (let i = 0; i < 16; i++) {
      const x = N[0] + (hh(i, 41) - 0.5) * 2.6, z = N[2] - 2.2 + 1.9 * ((t * 0.9 + hh(i, 42)) % 1);
      rabbit(cam, out, i, x, 0, z, "hop", gal(t, i, 3.6), [0.3 * (hh(i, 43) - 0.5), 1], "hungry");
    }
    return;
  }
  if (id === 12) { // Berthier leads the coachmen and their whips
    const t0 = BEAT[8], zz = Math.max(-1.2, 3.4 - 2.0 * (t - t0));
    const crack = (k: number) => q((Math.sin(t * 7 + k * 1.7) + 1) / 2, 6);
    walk(cam, out, BE, [-0.3, 0, zz], t, { expr: "yell", prop: ["whip", crack(0)] }, 2.6);
    [-1.9, -1.1, 0.6, 1.4].forEach((x, k) => walk(cam, out, CO[k], [x, 0, zz + 0.7 + 0.25 * (k % 2)], t, { expr: "angry", prop: ["whip", crack(k + 1)] }, 2.6));
    for (const [k, x] of [[0, -0.3], [1, -1.9], [2, 1.4]] as const) burst(out, t, WORD.cracking - LEAD + 0.12 * k, [x + 0.6, 2.5, zz + 0.3], 0.6, "#ffffff", 0.22);
    for (let i = 0; i < 24; i++) { // rabbits put to flight, toward the lens
      const x = -2.4 + 4.8 * hh(i, 51), z = zz - 1.2 - 1.6 * hh(i, 52) - 2.6 * Math.max(0, t - t0);
      rabbit(cam, out, i, x, 0, z, "front", gal(t, i, 4), [0, -1], "shock");
    }
    return;
  }
  if (id === 13) { // "it worked": the herd scatters, Berthier triumphant
    stand(cam, out, NP, N, { expr: "relief", prop: ["fowling", 0.5] });
    stand(cam, out, BE, [-0.6, 0, -0.6], { expr: "smug", prop: "fist" });
    [-2.2, -1.5, 0.9, 1.7].forEach((x, k) => stand(cam, out, CO[k], [x, 0, -0.2 + 0.3 * (k % 2)], { expr: "laugh", prop: ["whip", 0.3] }));
    const stop = on(t, WORD.until);
    for (let i = 0; i < 80; i++) {
      const sx = hh(i, 61) < 0.5 ? -1 : 1, d = stop ? Math.max(0, WORD.until - BEAT[9]) : t - BEAT[9];
      const x = sx * (1 + 2 * hh(i, 62) + 4.5 * d), z = -3 - 5 * hh(i, 63);
      rabbit(cam, out, i, x, 0, z, stop ? "front" : "hop", gal(t, i, 3.6), [sx, 0], "dot");
    }
    return;
  }
  if (id === 14) { // the flank attack, seen from above
    const hit = on(t, WORD.behind);
    stand(cam, out, NP, N, { expr: hit ? "shock" : "nervous", prop: ["fowling", 1], tilt: hit ? q(-10 * Math.exp(-(t - WORD.behind) * 3) * Math.cos((t - WORD.behind) * 18), 2) : 0 });
    stand(cam, out, BE, [-1.4, 0, -0.4], { expr: "shock", prop: ["whip", 0.2] });
    [-2.4, 1.6].forEach((x, k) => stand(cam, out, CO[k], [x, 0, -0.1], { expr: "shock", prop: ["whip", 0.2] }));
    burst(out, t, WORD.behind - LEAD, [N[0], 0.9, N[2] + 0.4], 1.0, "#ffffff", 0.3);
    for (let i = 0; i < NR; i++) {
      const [x, z, vx, vz] = flank(i, t), moving = Math.hypot(vx, vz) > 0.2;
      rabbit(cam, out, i, x, 0, z, moving ? "hop" : "sit", gal(t, i, 3.8), [vx, vz], "hungry");
    }
    return;
  }
  if (id === 15) { // piled up between his legs until he staggers
    const stag = on(t, WORD.staggered), u = clamp01((t - WORD.piled + 0.2) / Math.max(0.6, WORD.staggered - WORD.piled));
    const sway = stag ? q(12 * Math.sin((t - WORD.staggered) * 7), 2) : q(3 * Math.sin(t * 9), 2);
    stand(cam, out, NP, [N[0] + (stag ? 0.06 * Math.sin((t - WORD.staggered) * 7) : 0), 0, N[2]], { expr: stag ? "dazed" : "shock", prop: ["fowling", 0.6], tilt: sway });
    const slots: V3[] = [];
    for (let k = 0; k < 9; k++) slots.push([N[0] + (k - 4) * 0.17, 0, N[2] - 0.22 - 0.08 * (k % 2)]);
    for (let k = 0; k < 6; k++) slots.push([N[0] + (k - 2.5) * 0.17, 0.2, N[2] - 0.32]);
    for (let k = 0; k < 4; k++) slots.push([N[0] + (k - 1.5) * 0.18, 0.4, N[2] - 0.4]);
    const n = 5 + Math.floor(14 * u);
    slots.slice(0, n).forEach(([x, y, z], k) => rabbit(cam, out, k, x, y, z, "front", 0, [0, 0], "hungry", 0.75, y === 0));
    return;
  }
  if (id === 16) { // retreat to the carriage; the coach rolls off; one rabbit misses the rumble seat
    const t0 = BEAT[11], tIn = WORD.carriage + 0.25, u = clamp01((t - t0) / Math.max(0.5, tIn - t0));
    const go = Math.max(0, t - WORD.field), cz = M.coachStop[2] - 2.2 * go * go - 1.5 * go;
    const inside = t >= tIn, mv = go > 0;
    const dir = scr(cam, 0, -1) || 1, leg = mv ? Math.floor(t * 9) % 4 : 0;
    out.fx.push({ key: `coach${leg}${dir}${inside ? 1 : 0}`, cw: 760, ch: 420, draw: (p) => fxCoach(p, leg, dir, inside), x: M.coachStop[0], y: 0.95, z: cz, w: 3.6, h: 2.0,
      yaw: Math.atan2(cam.pos.x - M.coachStop[0], cam.pos.z - cz) });
    blob(out, M.coachStop[0], 0, cz, 3.2, 0.7);
    if (!inside) {
      const m: V3 = [-5.6 + (-4.4) * u, 0, 3.0 + 0.9 * u];
      walk(cam, out, NP, m, t, { expr: "nervous", prop: ["fowling", 0.3], facing: scr(cam, -1, 0) || -1 }, 3.0);
      for (const s of [-1, 1]) { const h = handAt(cam, m, s * 0.24, 0.75, 0.15); rabbit(cam, out, 90 + s, h[0], h[1], h[2], "front", 0, [0, 0], "hungry", 0.6, false); }
    }
    for (let i = 0; i < 26; i++) { // the herd chasing
      const x = -1.5 + 1.6 * hh(i, 71) - 5.5 * clamp01((t - t0 - 0.2 * hh(i, 72)) / 2.2), z = 2.2 + 2.2 * hh(i, 73);
      rabbit(cam, out, i, x, 0, z, "hop", gal(t, i, 3.6), [-1, 0], "hungry");
    }
    if (go > 0.1) { // the would-be stowaway: jumps for the rumble, misses
      const v = clamp01((go - 0.1) / 0.6), rz = M.coachStop[2] + 1.9 - 0.6 * v;
      rabbit(cam, out, 99, M.coachStop[0] + 0.1, 1.0 * Math.sin(Math.PI * v), rz, v < 1 ? "hop" : "sit", 0.5, [0, -1], v < 1 ? "hungry" : "shock");
      burst(out, t, WORD.field + 0.7, [M.coachStop[0] + 0.1, 0.25, M.coachStop[2] + 1.3], 0.45, "#ffffff", 0.22);
    }
    return;
  }
  if (id === 17) { // the rabbits hold the field; one wears the hat
    for (let i = 0; i < 46; i++) {
      const x = -4 + 8 * hh(i, 81), z = -7 + 7.5 * hh(i, 82);
      rabbit(cam, out, i, x, 0, z, "sit", 0, [0, 0], "happy");
    }
    const hx = 0.25, hz = 1.6;
    rabbit(cam, out, 5, hx, 0, hz, "front", 0, [0, 0], "happy", 1.1);
    out.fx.push({ key: "hatR", cw: 200, ch: 110, draw: fxHat, x: hx, y: 0.42, z: hz + 0.03, w: 0.36, h: 0.2 });
    return;
  }
  if (id === 18) { // Berthier corners his buyer, who can't tell one rabbit from another
    const show = on(t, WORD.another);
    stand(cam, out, BE, M.berBuyer, { expr: on(t, WORD.truth) ? "angry" : "stern", prop: on(t, WORD.buyer) ? "point" : null, facing: -1 });
    stand(cam, out, BU, M.buyer, { expr: show ? "grin" : "nervous", facing: 1 });
    if (show) for (const s of [-1, 1]) { const h = handAt(cam, M.buyer, s * 0.42, 0.85, 0.18); rabbit(cam, out, 3 + (s > 0 ? 0 : 8), h[0], h[1], h[2], "sit", 0, [s, 0], "dot", 0.55, false); }
    return;
  }
  if (id === 19) { // a tame rabbit in front of the open hutch flops over for a belly rub
    const flop = on(t, WORD.tame);
    rabbit(cam, out, 0, HUTCH_X[3] + 0.05, 0, HUTCH_Z + 1.6, flop ? "belly" : "sit", 0, [-1, 0], flop ? "happy" : "dot", 0.9);
    if (on(t, WORD.wild)) out.fx.push({ key: "cab", cw: 200, ch: 200, draw: fxCabbage, x: HUTCH_X[3] - 0.45, y: 0.14, z: HUTCH_Z + 1.75, w: 0.28 * popK(t, WORD.wild), h: 0.28 * popK(t, WORD.wild) });
    burst(out, t, WORD.tame - LEAD, [HUTCH_X[3], 0.35, HUTCH_Z + 1.6], 0.55, "#ffd0e0", 0.3);
    return;
  }
  if (id === 20) { // a rabbit's-eye view: the man with the gun must be the man with the cabbage
    const hungry = on(t, WORD.cabbage);
    stand(cam, out, NP, N, { expr: "grin", prop: ["fowling", 1] });
    for (let i = 10; i < 34; i++) rabbit(cam, out, i, -3 + 6 * hh(i, 91), 0, -5.5 + 4 * hh(i, 92), "sit", 0, [0, 0], hungry ? "hungry" : "dot");
    rabbit(cam, out, 2, 0.95, 0, -7.1, "sit", 0, [-1, 0], hungry ? "hungry" : "dot", 1.0);
    const s = popK(t, WORD.cabbage - 0.12);
    if (s > 0) out.fx.push({ key: "cabB", cw: 460, ch: 400, draw: fxCabbageBubble, x: 1.45, y: 1.0, z: -6.4, w: 0.95 * s, h: 0.83 * s });
    return;
  }
  if (id === 21) { // the party roars; Berthier burns
    const laugh = q((Math.sin(t * 14) + 1) / 2, 2);
    [5.7, 6.6, 7.5, 8.4].forEach((x, k) => stand(cam, out, HU[k], [x, 0, 6.1], { expr: "laugh", tilt: q(4 * (laugh - 0.5) * (k % 2 ? 1 : -1), 2), facing: -1 }, false));
    const shame = on(t, WORD.mortified);
    stand(cam, out, BE, M.shame, { expr: shame ? "pained" : "nervous", facing: 1, headTilt: shame ? 12 : 0 });
    if (shame) out.fx.push({ key: `steam${q(t % 1, 8)}`, cw: 300, ch: 300, draw: (p) => fxSteam(p, q(t % 1, 8)), x: M.shame[0], y: 2.15, z: M.shame[2] + 0.05, w: 0.8, h: 0.8, soft: true });
    return;
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  napStage(id, t, cam, out);
  return out;
};
