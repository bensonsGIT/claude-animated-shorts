// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, swingKid, soldier, townsfolk, OFFICER, KID, PARENT, fxNote, fxBurst, fxSplash, fxStars, fxCreak, fxRing, fxShadow, fxContact, fxPlank, fxDrum,
  Outfit, Expr, FrontOpts, SideOpts, fxPuff, fxIcon, fxSparkle,
  PETER, BOYAR, shaved, POLICE, MERCHANT, PEASANT, GATEKEEPER, MINTWORKER, CARPENTER, CARPENTER_BEARD, PERRY, OLDMAN, MUSCOVITE,
  fxRazor, fxGlint, fxBeard, fxToken, fxPurse, fxKopek,
} from "./toon";
import {
  FPS, D0, FILES, ROW_GAP, COUNT, PARK, SHOTS, SNAP, DROP0, DROP1, DROP_H, V3, front, marchPhase, stomp, deckY, dropW, dropU, shapeZ,
  smooth, clamp01, BridgeState, WORD, MARK, cf, camAt, TOKEN_CAM, PETER_SCALE, MINT_HITS, CARP_HITS,
} from "./story";
import { NOINK } from "./ink";
import type { LightName } from "./lights";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

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
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const SOLDIER = [0, 1, 2, 3].map((v) => soldier(v));
const BARE = [0, 1, 2, 3].map((v) => soldier(v, { hat: null }));
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
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
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = { 4: [16.17, 17.3], 5: [19.48, 20.6], 6: [21.9, 23.7], 7: [29.4, 30.6], 8: [SNAP] };
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
const CONTACT: Record<LightName, [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.16, 0.13, 0.26], lab: [0.3, 0.32, 0.42], sun: [0.24, 0.22, 0.34], dark: [0.1, 0.1, 0.2], moon: [0.14, 0.15, 0.3] };
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
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const exprMarch = (id: number, t: number, i: number, tau: number): { expr: Expr; look: number } => {
  const lau = i % 3 === 0, whi = i % 5 === 1, L = LEAD;
  switch (id) {
    case 1: return { expr: lau ? "laugh" : whi ? "whistle" : "grin", look: 0 };
    case 2: case 3: return { expr: i % 4 === 3 ? "smile_closed" : i % 2 ? "neutral" : "stern", look: 0 };
    case 4: return t < 16.17 - L ? { expr: i % 2 ? "neutral" : "stern", look: 0 } : t < 17.3 - L ? { expr: lau ? "shock" : "nervous", look: 0 } : { expr: "neutral", look: 0 };
    case 5: return { expr: t < 19.48 - L ? "neutral" : t < 20.6 - L ? "grin" : i % 2 ? "laugh" : "grin", look: 0 };
    case 6: return { expr: (i === 2 && t > 21.9 - L) || (t > 23.7 - L && i % 4 === 1) ? "whistle" : t > 23.7 - L && lau ? "laugh" : "grin", look: 0 };
    case 7: return t < 29.4 - L ? { expr: lau ? "laugh" : "grin", look: 0 } : t < 30.6 - L ? { expr: i % 2 ? "nervous" : "grin", look: -1 } : { expr: "nervous", look: 0 };
    case 8: return { expr: tau < SNAP - L ? "nervous" : "shock", look: tau < SNAP + 0.6 ? -1 : 0 };
    default: return { expr: whi ? "whistle" : "grin", look: 0 };
  }
};

/** the marching column (shots 1-8, 13) */
const column = (id: number, t: number, b: BridgeState, cam: CamInfo, out: Stage) => {
  const s = SHOTS[id - 1], tau = s.tau(t);
  const stopT = SNAP + 0.3, walkT = id === 8 ? Math.min(tau, stopT) : tau;
  const F = front(walkT), ph = marchPhase(walkT), st = stomp(tau);
  const falling = id === 8 && tau >= DROP0;
  for (let i = 0; i < COUNT; i++) {
    const row = i >> 2, x0 = FILES[i & 3] + (hh(i) - 0.5) * 0.08, z = F + row * ROW_GAP + (hh(i, 2) - 0.5) * 0.1;
    let x = x0, y = Math.abs(z) <= 30 ? deckY(z, b) : D0;
    const who: Who = { i, o: SOLDIER[vOf(i)], okey: `s${vOf(i)}` };
    let { expr, look } = exprMarch(id, t, i, tau);
    let mode: "march" | "stand" | "fall" | "sit" = id === 8 && tau >= SNAP + 0.25 ? "stand" : "march";
    let tilt = 0;
    if (falling) {
      // the soldiers lag the falling deck a little (cartoon hang time), then sit in the water
      const lagY = D0 + b.bounce * shapeZ(z) - dropU(tau - 0.13) * DROP_H * dropW(z);
      const air = Math.max(0, lagY - y);
      y += air;
      const u = clamp01((tau - DROP0) / (DROP1 - DROP0));
      x = x0 + (hh(i, 3) - 0.5) * 0.7 * u;
      mode = tau < DROP1 + 0.13 ? "fall" : "sit";
      tilt = mode === "fall" ? (hh(i, 4) - 0.5) * 50 * u : 0;
      if (mode === "sit") expr = i % 3 ? "dazed" : "shock";
    }
    const view = viewOf(cam, x, z, 0, -1);
    const blink = expr !== "whistle" ? lidAt(t, i, SWAPS[id]) : 0;
    const fo: FrontOpts = { phase: mode === "march" ? ph : 0, expr, mode, look, blink, lift: 60 * st, tilt };
    // side views: the stance foot keeps pace with the column (0.8 m steps at 2 steps/s), foreshortened by the view
    const so: SideOpts = { phase: mode === "march" ? ph : 0, expr, mode: mode === "march" ? "march" : "stand", blink, stomp: st, stride: view.fs };
    out.places.push(person(cam, who, x, y, z, mode === "fall" || mode === "sit" ? { side: false, mirror: false } : view, fo, so));
    if (mode === "march" || mode === "stand") blob(out, x, y, z);
    // whistled notes drift up from whistlers near the lens
    if (expr === "whistle" && (id === 6 || id === 1 || id === 13) && cam.pos.distanceTo(tmp.set(x, y, z)) < 16) {
      for (let n = 0; n < 4; n++) {
        const age = ((t - 21.9 + n * 0.42 + hh(i, 5)) % 1.68) / 1.68;
        const pop = Math.min(1, age * 7) * (age > 0.82 ? (1 - age) / 0.18 : 1);
        if (pop <= 0.02) continue;
        const kind = (n + i) % 2, side = 0.16 + 0.32 * age + 0.05 * Math.sin(age * 9 + n);
        out.fx.push({ key: `note${kind}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind), x: x + cam.right.x * side, y: y + 1.5 + 0.85 * age, z: z + cam.right.z * side - 0.1,
          w: 0.17 * pop, h: 0.2 * pop, rot: 0.3 * Math.sin(age * 6 + n) });
      }
    }
  }
};

const sitters = (cam: CamInfo, t: number, out: Stage, spots: [number, number, number][], exprs: (i: number) => Expr, stars: (i: number) => boolean, water: boolean) => {
  spots.forEach(([x, y, z], i) => {
    const bare = i % 3 === 1;
    const v = vOf(i + 3), who: Who = { i, o: bare ? BARE[v] : SOLDIER[v], okey: `${bare ? "b" : "s"}${v}` };
    const expr = exprs(i), bob = water ? 0.03 * Math.sin(t * 2.2 + i) : 0;
    out.places.push(person(cam, who, x, y + bob, z, { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, i), look: 0 }, {}));
    if (stars(i)) {
      const u = (t * 0.9 + hh(i)) % 1;
      out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x, y: y + bob + 1.3, z, w: 0.75, h: 0.375 });
    }
    if (water) {
      const u = ((t + hh(i, 7) * 2) % 2.2) / 2.2;
      out.fx.push({ key: `ring${q(u, 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(u, 30)), x, y: 0.03, z, w: 2.0, h: 2.0, flat: true });
      // darker water right where the body meets the surface (only the front arc shows below the card)
      out.fx.push({ key: `blob|contact|${WATERLINE}`, cw: 128, ch: 128, draw: (p) => fxContact(p, WATERLINE), x, y: 0.034 + bob * 0.3, z, w: 0.7, h: 0.5, flat: true });
      if (bare) out.fx.push({ key: "shako", cw: 200, ch: 200, draw: shakoAlone, x: x + 0.55 + 0.3 * hh(i, 8), y: 0.12 + 0.03 * Math.sin(t * 2 + i), z: z - 0.3, w: 0.42, h: 0.42, rot: -0.5 + hh(i, 6) });
    } else {
      out.fx.push({ key: "puddle", cw: 300, ch: 150, draw: puddle, x, y: D0 + 0.02, z: z - 0.05, w: 1.5, h: 0.75, flat: true });
      blob(out, x, y, z, 1.05, 0.8);
    }
  });
};
const WATERLINE = hexOf([0.3, 0.36, 0.52], 1);
/** flotsam in the near water of the river shots (9-10), so the bottom of the frame is not empty: hats, planks, a drum.
 *  World positions 2.5-5 m in front of both river cameras (z -27 / -25.4 looking +z); half under the surface, bobbing. */
const FLOAT: { kind: "shako" | "plank" | "drum"; x: number; z: number; s: number; r: number }[] = [
  // round-4 river cameras sit at z -24.6 / -24.2: the two nearest pieces were 0.7-1.5 m from the lens (cut-off blobs)
  { kind: "shako", x: -0.25, z: -22.5, s: 0.46, r: 0.6 }, // (drum removed: cut by the frame edge it read as a blob)
  { kind: "shako", x: 0.95, z: -24.6, s: 0.42, r: 0.25 }, // (near plank removed: cut by the frame edge)
];
const flotsam = (t: number, out: Stage) =>
  FLOAT.forEach((f, i) => {
    const bob = 0.03 * Math.sin(t * 1.9 + i * 1.7), r = f.r + 0.08 * Math.sin(t * 1.3 + i);
    const [cw, ch, draw, ar] = f.kind === "shako" ? [200, 200, shakoAlone, 1] as const : f.kind === "plank" ? [320, 110, fxPlank, 110 / 320] as const : [260, 240, fxDrum, 240 / 260] as const;
    const w = f.s, h = f.s * ar;
    out.fx.push({ key: f.kind, cw, ch, draw, x: f.x, y: 0.28 * h + bob, z: f.z, w, h, rot: r });
    out.fx.push({ key: `ring${q(((t * 0.45 + i * 0.3) % 1), 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(((t * 0.45 + i * 0.3) % 1), 30)), x: f.x, y: 0.03, z: f.z, w: 1.1 * f.s + 0.5, h: 1.1 * f.s + 0.5, flat: true });
  });
const shakoAlone = (p: Pen) => {
  p.poly([[42, 160], [158, 160], [166, 50], [34, 50]], "#3a3d47", 8);
  p.ell(100, 158, 60, 10, "#16171b", 7, 0, 180);
  p.ell(100, 96, 14, 12, "#c9ccd2", 6);
  p.ell(100, 36, 14, 14, "#2b7a4b", 6);
};
const puddle = (p: Pen) => { p.ell(150, 75, 140, 58, "#6f97c6", 0); p.ell(120, 62, 60, 16, "#a9c9ea", 0); };

/** the extras hold still and only cheer on cue: "pride of the whole town", "like a crowd of tourists" */
const CHEER: [number, number][] = [[8.01 - LEAD, 9.45], [65.96 - LEAD, 67.5]];
const townsfolkAt = (cam: CamInfo, t: number, out: Stage) => {
  const spots: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const bank = i < 13 ? -1 : 1, k = i % 13, sx = k % 2 ? 1 : -1;
    spots.push([sx * (5.2 + (k >> 1) * 1.7 + hh(i) * 0.6), bank * (31.6 + hh(i, 2) * 3.2)]);
  }
  const on = CHEER.some(([a, b]) => t >= a && t < b);
  spots.forEach(([x, z], i) => {
    const kid = i % 5 === 2, o = kid ? KID : FOLK[i % 6], hop = kid && on ? Math.max(0, Math.sin(t * 7 + i)) * 0.18 : 0;
    const who: Who = { i: i + 200, o, okey: kid ? "kid" : `f${i % 6}` };
    const expr: Expr = (["smile", "grin", "laugh", "smile_closed"] as Expr[])[i % 4];
    const fo: FrontOpts = { mode: "stand", expr, wave: i % 3 === 2 || !on ? undefined : q(Math.sin(t * 9 + i * 1.3), 30), blink: lidAt(t, i + 40) };
    out.places.push(person(cam, who, x, D0 + hop, z, { side: false, mirror: false }, fo, {}, kid ? 0.72 : 1));
    blob(out, x, D0, z, kid ? 0.72 : 1, hop > 0 ? 0.6 : 1);
  });
};

/** soldiers strolling out of step across the rebuilt bridge (shot 15): own pace kept (sound), poses on ones */
const tourists = (cam: CamInfo, t: number, out: Stage) => {
  const t0 = 62.08;
  for (let i = 0; i < 24; i++) {
    const sp = 0.55 + hh(i) * 0.5, z = -4 + (i / 24) * 28 + hh(i, 2) * 1.5 - sp * (t - t0), x = (hh(i, 3) - 0.5) * 4.0;
    const bare = i % 5 === 2, v = vOf(i), who: Who = { i, o: bare ? BARE[v] : SOLDIER[v], okey: `${bare ? "b" : "s"}${v}` };
    const prop = i % 7 === 3 ? "icecream" : bare ? "shako" : null;
    const lick = prop === "icecream" && (t * 0.7 + hh(i, 4)) % 1 < 0.45;
    const expr: Expr = lick ? "lick" : (["smile", "smile_closed", "grin", "smile"] as Expr[])[i % 4];
    const phase = q(((t - t0) * sp / 1.4 + hh(i, 5)) % 1, 120); // cadence sp/1.4 Hz unchanged = 0.7 m per step
    const look = Math.round(Math.sin(t * 0.8 + i * 1.7) * 1.2);
    const fo: FrontOpts = { mode: "stroll", phase, expr, look: Math.max(-1, Math.min(1, look)), prop, blink: lidAt(t, i) };
    const view = viewOf(cam, x, z, 0, -1);
    const so: SideOpts = { mode: "march", phase, expr, stomp: 0.55, stride: 0.875 * view.fs };
    out.places.push(person(cam, who, x, D0, z, view, fo, so));
    blob(out, x, D0, z);
  }
};

// officer hammering the new rule onto a sign at the bridge end (shot 14)
export const HITS = [59.79, 60.33, 61.69];
export const SIGN_AT: V3 = [2.25, D0, -30.9];
/** 0 = hammer up, 1 = struck. Reference action timing: 4 f wind-up, held ~7 f at the top, a 1-frame strike on the word */
const hammerK = (t: number) => {
  let k = 1;
  for (const th of HITS) {
    const n = (t - th) * FPS; // frames to contact
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4));
    else if (n >= -7 && n < 0) k = 0;
  }
  return k;
};
const officer = (cam: CamInfo, t: number, out: Stage) => {
  const fo: FrontOpts = { mode: "stand", expr: "stern", prop: ["hammer", q(hammerK(t), 30)], blink: lidAt(t, 99), facing: 1 };
  out.places.push(person(cam, { i: 99, o: OFFICER, okey: "off" }, 3.35, D0, -31.55, { side: false, mirror: false }, fo, {}));
  blob(out, 3.35, D0, -31.55, 1.1);
  for (const th of HITS) if (t >= th && t < th + 5 / FPS) {
    const u = (t - th) / (5 / FPS);
    out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: 2.95, y: D0 + 1.55, z: -31.0, w: 0.9, h: 0.9 });
  }
};

// swing in the park (shot 12): pushes land at the back end of every swing, the arc grows
export const SWING_T = 1.55, PUSH0 = 48.79;
const pushes = [0, 1, 2, 3].map((k) => PUSH0 + k * SWING_T);
export const swingAmp = (t: number) => 6 + pushes.reduce((a, tp) => a + 11 * smooth((t - tp) / 0.3), 0);
export const swingAngle = (t: number) => -((swingAmp(t) * Math.PI) / 180) * Math.cos((2 * Math.PI * (t - PUSH0)) / SWING_T);
/** the swing kid's back (seat + ~.12 m, ~8 cm behind the rope) in world space when the swing is at angle th */
const kidBack = (th: number): [number, number] => {
  const lx = -0.083, ly = -2.174; // local to the swing card (pivot at the origin), card yawed by PI
  return [PARK[0] - (lx * Math.cos(th) - ly * Math.sin(th)), PARK[1] + 2.88 + lx * Math.sin(th) + ly * Math.cos(th)];
};
/** where the parent stands for push k: hands reach the kid's back at the back of the arc with the arms ~ straight */
const pushSpot = (k: number) => {
  const A = (swingAmp(pushes[k]) * Math.PI) / 180, [bx, by] = kidBack(-A);
  const cy = 975 - (by - D0) / SU, dy = cy - 515, dx = Math.sqrt(Math.max(120 * 120, 222 * 222 - dy * dy));
  return { px: bx + (53 + dx) * SU, hand: [300 + 53 + dx, cy] as [number, number] };
};
const park = (cam: CamInfo, t: number, out: Stage) => {
  const th = swingAngle(t), vel = Math.sin((2 * Math.PI * (t - PUSH0)) / SWING_T);
  const A = (swingAmp(t) * Math.PI) / 180, kick = q(0.35 + 0.55 * vel, 40);
  const expr: Expr = A < 0.35 ? "smile" : A < 0.6 ? "grin" : "laugh";
  const light = light2D(cam, true), lid = lidAt(t, 78);
  out.places.push({ key: `swing|${kick}|${expr}|${q(light)}|${lid}`, geo: "swing", x: PARK[0], y: PARK[1] + 2.88, z: PARK[2], yaw: Math.PI, roll: th,
    draw: (p) => swingKid(p, KID, kick, expr, light, lid), size: [490, 1610, 0.7] });
  const push = Math.max(0, ...pushes.map((tp) => 1 - Math.abs(t - tp + 0.05) / 0.32));
  // stand at this push's spot; step back to the next spot between pushes (the arc grows after every push)
  let k = 0;
  while (k < pushes.length - 1 && t > pushes[k] + 0.35) k++;
  const cur = pushSpot(k), prev = pushSpot(Math.max(0, k - 1));
  const step = k > 0 ? smooth((t - (pushes[k - 1] + 0.35)) / (SWING_T - 0.7)) : 1;
  const px = prev.px + (cur.px - prev.px) * step, pz = PARK[2] + 0.1;
  const so: SideOpts = { mode: "push", pose: q(push, 40), expr: push > 0.3 ? "grin" : "smile", blink: lidAt(t, 77), hand: cur.hand };
  out.places.push({ ...person(cam, { i: 77, o: PARENT, okey: "parent" }, px, D0, pz, { side: true, mirror: true }, {}, so), mirror: false, yaw: Math.PI });
  blob(out, px, D0, pz);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: BridgeState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  if (s.set && s.set !== "out") { peterStage(id, t, cam, out); return out; }
  if (s.crowd === "march" || s.crowd === "fall") column(id, t, b, cam, out);
  if (s.towns) townsfolkAt(cam, t, out);
  if (s.crowd === "water") {
    const spots: [number, number, number][] = [];
    for (let i = 0; i < 40; i++) spots.push([FILES[i & 3] * 1.12 + (hh(i, 11) - 0.5) * 0.6, -0.6, -21.6 + (i >> 2) * 1.6 + (hh(i, 12) - 0.5) * 0.7]);
    const happy: Expr[] = ["relief", "relief_open", "smile", "relief"], hurt: Expr[] = ["pained", "dazed", "pained", "dazed"];
    sitters(cam, t, out, spots, (i) => (id === 9 ? happy : hurt)[i % 4], (i) => id === 10 && i % 4 === 1, true);
    flotsam(t, out);
  }
  if (s.crowd === "bank") {
    const spots: [number, number, number][] = [[-7.2, D0, -33.6], [-6.1, D0, -32.1], [-5.0, D0, -34.3], [-4.3, D0, -31.6], [-3.4, D0, -33.2],
      [-2.4, D0, -31.9], [-6.8, D0, -35.4], [-4.1, D0, -35.6], [-1.9, D0, -34.6]];
    const ex: Expr[] = ["dazed", "relief", "smile_closed", "pained"];
    sitters(cam, t, out, spots, (i) => ex[i % 4], (i) => i % 4 === 0, false);
    officer(cam, t, out);
  }
  if (s.crowd === "tourists") tourists(cam, t, out);
  if (id === 12) park(cam, t, out);
  return out;
};

// ================= Peter the Great and the beard tax =================
const M = MARK;
const PE: Who = { i: 300, o: PETER, okey: "pe" };
const boyar = (v: number, bare = false): Who => ({ i: 310 + v, o: bare ? shaved(BOYAR(v)) : BOYAR(v), okey: `b${v}${bare ? "s" : ""}` });
const mus = (v: number, beard?: string): Who => ({ i: 330 + v, o: beard ? { ...MUSCOVITE(v), beard, moustache: beard, stubble: false } : MUSCOVITE(v), okey: `m${v}${beard ?? ""}` });
const POL: Who = { i: 350, o: POLICE, okey: "pol" };
const MER: Who = { i: 351, o: MERCHANT, okey: "mer" };
const PEA: Who = { i: 352, o: PEASANT, okey: "pea" };
const GK: Who = { i: 353, o: GATEKEEPER, okey: "gk" };
const MW: Who = { i: 354, o: MINTWORKER, okey: "mw" };
const CP: Who = { i: 355, o: CARPENTER, okey: "cp" };
const PY: Who = { i: 356, o: PERRY, okey: "py" };
const OLD: Who = { i: 357, o: OLDMAN, okey: "old" };
const CLK: Who = { i: 358, o: { ...GATEKEEPER, jacket: "#5a4a6a", hat: "cap", cap: "#2a2430" }, okey: "clk" };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const standAt = (cam: CamInfo, out: Stage, who: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, who, m[0], m[1], m[2], FRONT, fo, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
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
const glint = (out: Stage, t: number, t0: number, c: V3, size: number, dur = 0.4) => {
  if (t < t0 || t >= t0 + dur) return;
  const k = q((t - t0) / dur, 20);
  out.fx.push({ key: `glint${k}`, cw: 200, ch: 200, draw: (p) => fxGlint(p, k), x: c[0], y: c[1], z: c[2], w: size, h: size, rot: k * 0.6 });
};
/** smooth walk between two marks from t0 to t1; returns the position, whether still walking, and the stroll phase */
const walk = (t: number, t0: number, t1: number, a: V3, b: V3, rate = 1.6) => {
  const u = clamp01((t - t0) / (t1 - t0)), e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  return { m: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e] as V3, moving: u > 0 && u < 1, phase: q((t * rate) % 1, 24) };
};
/** hammer 0 = raised .. 1 = struck: 4 f wind-up, held ~7 f at the top, a 1-frame strike on each hit time */
const hammerAt = (t: number, hits: number[]) => {
  let k = 1;
  for (const th of hits) {
    const n = (t - th) * FPS;
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4));
    else if (n >= -7 && n < 0) k = 0;
  }
  return k;
};
/** a beard shaved off at tp: a hair puff at the chin and clumps falling to the floor, then lying there */
const shave = (out: Stage, t: number, tp: number, m: V3, col: string, scale = 1) => {
  if (t < tp - LEAD) return;
  const chin: V3 = [m[0], m[1] + 1.15 * scale, m[2] + 0.06];
  puff(out, t, tp - LEAD, [chin[0], chin[1], chin[2] + 0.05], 0.75 * scale, 0.55);
  for (let k = 0; k < 4; k++) {
    const d = t - (tp - LEAD), dx = (hh(k, 71) - 0.5) * 0.5, y = chin[1] - 0.15 + 1.2 * d - 0.5 * 9.0 * d * d * 0.55;
    const x = chin[0] + dx * Math.min(1, d * 3), z = chin[2] + 0.04 + 0.05 * k;
    if (y > m[1] + 0.03) out.fx.push({ key: `bd${col}${k % 2}`, cw: 200, ch: 260, draw: (p) => fxBeard(p, col, k % 2), x, y, z, w: 0.13 * scale, h: 0.17 * scale, rot: q(d * 5 + k, 10) });
    else out.fx.push({ key: `bd${col}${k % 2}`, cw: 200, ch: 260, draw: (p) => fxBeard(p, col, k % 2), x: chin[0] + dx, y: m[1] + 0.025, z: chin[2] + 0.1 + 0.06 * k, w: 0.13 * scale, h: 0.17 * scale, flat: true, rot: k * 1.3 });
  }
};
/** the giant razor rising into frame before `tw`, glinting on the word (shots 1 and 18) */
const bigRazor = (out: Stage, t: number, tw: number, id: number) => {
  const u = clamp01((t - (tw - 0.45)) / 0.4), e = 1 - (1 - u) ** 3;
  if (u <= 0) return;
  // held in camera space 1.3 m ahead of the lens: rises from below the frame to the upper third
  const c = camAt(id, Math.round(t * FPS)), P = new THREE.Vector3(...c.pos), fw = new THREE.Vector3(...c.look).sub(P).normalize();
  const rt = new THREE.Vector3().crossVectors(fw, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rt, fw);
  const at = P.clone().addScaledVector(fw, 1.3).addScaledVector(up, -0.8 + 0.98 * e).addScaledVector(rt, 0.06);
  out.fx.push({ key: "bigrazor", cw: 640, ch: 280, draw: fxRazor, x: at.x, y: at.y, z: at.z, w: 0.44, h: 0.19, rot: 0.15 - 0.15 * e });
  const g = at.clone().addScaledVector(rt, 0.16).addScaledVector(up, 0.06).addScaledVector(fw, -0.02);
  glint(out, t, tw - 0.05, [g.x, g.y, g.z], 0.2, 0.45);
};
/** the feast guests, cheering (shots 1, 18); shocked from `shockAt` */
const guests = (cam: CamInfo, t: number, out: Stage, shockAt: number) => {
  M.guests.forEach((m, i) => {
    const shock = on(t, shockAt), cheer = !shock && Math.floor(t * 2.6 + i * 0.7) % 2 === 0;
    const expr: Expr = shock ? "shock" : cheer ? "laugh" : i % 2 ? "grin" : "relief_open";
    const prop: FrontOpts["prop"] = i % 3 === 2 ? null : "goblet";
    const wave = prop || shock ? undefined : q(Math.sin(t * 8 + i), 30);
    standAt(cam, out, { i: 320 + i, o: BOYAR(i), okey: `g${i}` }, m, { mode: "stand", expr, prop, wave, blink: shock ? 0 : lidAt(t, 320 + i), facing: m[0] < -0.2 ? 1 : m[0] > 0.2 ? -1 : 0, tilt: shock ? 0 : q(2 * Math.sin(t * 5 + i), 2) });
  });
};
const beside = (m: V3): V3 => [m[0] + 0.66, 0, m[2] - 0.18];

const peterStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  if (id === 1 || id === 18) {
    const tw = id === 1 ? WORD.razor : WORD.razor2, shockAt = id === 1 ? WORD.shaving : WORD.razor2 + 0.1;
    guests(cam, t, out, shockAt);
    bigRazor(out, t, tw, id);
    return;
  }
  if (id === 2) {
    const w = walk(t, cf(1) / FPS + 0.1, WORD.cleanshaven - 0.35, [0.05, 0, -4.8], M.peterStop);
    const rub = on(t, WORD.cleanshaven);
    standAt(cam, out, PE, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: rub ? "smug" : "grin", prop: rub ? "chin" : null, blink: lidAt(t, 300) }, true, PETER_SCALE);
    M.folk.forEach((m, i) => {
      const near = Math.abs(w.m[2] - m[2]) < 1.6 && w.moving;
      const bow = near || (on(t, WORD.europe) && i % 2 === 0 && t < WORD.cleanshaven);
      const who = mus(i + 1, i % 2 ? "#6a4630" : undefined);
      standAt(cam, out, who, m, { mode: "stand", expr: bow ? "nervous" : i % 2 ? "neutral" : "shock", tilt: bow ? -14 : 0, headTilt: bow ? 12 : 0, blink: lidAt(t, 330 + i), facing: m[0] < 0 ? 1 : -1 });
    });
    return;
  }
  if (id === 3) {
    standAt(cam, out, PE, M.peterStop, { mode: "stand", expr: on(t, WORD.great) ? "smug" : "grin", blink: lidAt(t, 300), facing: -1 }, true, PETER_SCALE);
    const gasp = on(t, WORD.argued - 0.2) && t < WORD.argued + 0.3;
    standAt(cam, out, boyar(4), M.shortBoyar, { mode: "stand", expr: gasp ? "shock" : on(t, WORD.argued) ? "nervous" : "neutral", headTilt: -9, facing: 1, look: 1, blink: gasp ? 0 : lidAt(t, 314) });
    return;
  }
  if (id === 4 || id === 5) {
    const t1 = WORD.one2, t2 = WORD.lost, t3 = WORD.beards + 0.05;
    const marks = [M.b1, M.b2, M.b3], cuts = [t1, t2, t3], cols = ["#b8b4ac", "#c0582a", "#2a2224"];
    marks.forEach((m, k) => {
      const bare = on(t, cuts[k]);
      const expr: Expr = bare ? (k === 0 && on(t, WORD.hand) ? "pained" : "dazed") : on(t, cuts[k] - 0.6) ? "shock" : "nervous";
      standAt(cam, out, boyar(k, bare), m, { mode: "stand", expr, blink: bare ? 0 : lidAt(t, 310 + k), facing: 1, prop: bare && k !== 0 ? "chin" : null });
      shave(out, t, cuts[k], m, cols[k]);
    });
    // Peter steps from boyar to boyar, razor up
    let pm: V3;
    if (t < WORD.nobles) pm = beside(M.b1);
    else if (t < t2 - 0.25) pm = walk(t, WORD.nobles, t2 - 0.25, beside(M.b1), beside(M.b2)).m;
    else if (t < WORD.their) pm = beside(M.b2);
    else pm = walk(t, WORD.their, t3 - 0.12, beside(M.b2), beside(M.b3)).m;
    const moving = (t > WORD.nobles && t < t2 - 0.25) || (t > WORD.their && t < t3 - 0.12);
    standAt(cam, out, PE, pm, { mode: moving ? "stroll" : "stand", phase: q((t * 1.6) % 1, 24), expr: on(t, WORD.hand) ? "laugh" : "grin", prop: "razor", facing: -1, blink: lidAt(t, 300) }, true, PETER_SCALE);
    return;
  }
  if (id === 6) {
    const up = on(t, WORD.holy), sin = on(t, WORD.sin);
    standAt(cam, out, boyar(3), M.iconBoyar, { mode: "stand", expr: sin ? "shock" : up ? "relief" : "nervous", prop: "chin", facing: 1, look: up ? 1 : 0, headTilt: up ? -7 : 0, blink: lidAt(t, 313) });
    out.fx.push({ key: "icon1", cw: 256, ch: 384, draw: (p) => fxIcon(p, 1), x: M.icon[0], y: M.icon[1], z: M.icon[2], w: 0.62, h: 0.93, yaw: -Math.PI / 2 });
    out.fx.push({ key: "icon0", cw: 256, ch: 384, draw: (p) => fxIcon(p, 0), x: M.icon[0], y: M.icon[1] + 0.1, z: M.icon[2] - 1.05, w: 0.5, h: 0.75, yaw: -Math.PI / 2 });
    out.fx.push({ key: "icon2", cw: 256, ch: 384, draw: (p) => fxIcon(p, 2), x: M.icon[0], y: M.icon[1] + 0.1, z: M.icon[2] + 1.05, w: 0.5, h: 0.75, yaw: -Math.PI / 2 });
    if (up) for (let k = 0; k < 3; k++) { const s = q((t * 1.5 + k / 3) % 1, 20); out.fx.push({ key: `spark${s}`, cw: 200, ch: 200, draw: (p) => fxSparkle(p, s), x: M.icon[0] - 0.05, y: M.icon[1] + 0.35 - 0.2 * k, z: M.icon[2] - 0.25 + 0.25 * k, w: 0.14, h: 0.14, yaw: -Math.PI / 2 }); }
    return;
  }
  if (id === 7) {
    const tS = WORD.sight;
    const w = walk(t, cf(5) / FPS, tS - 0.1, [-1.25, 0, -15.9], M.walker, 1.5);
    const bare = on(t, tS);
    const who = bare ? mus(0) : mus(0, "#6a4630");
    standAt(cam, out, who, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: bare ? "dazed" : on(t, WORD.police) ? "whistle" : "smile_closed", blink: bare ? 0 : lidAt(t, 330), facing: 1 });
    shave(out, t, tS, w.m, "#6a4630");
    // the policeman pops up from behind the cart and lunges
    const pop = clamp01((t - (tS - 0.42)) / 0.14), lunge = clamp01((t - (tS - 0.24)) / 0.2);
    const pm: V3 = [M.police[0] + (M.policeOut[0] - M.police[0]) * lunge, -0.95 * (1 - pop), M.police[2] + (M.policeOut[2] - M.police[2]) * lunge];
    if (pop > 0) standAt(cam, out, POL, pm, { mode: "stand", expr: bare ? "laugh" : "grin", prop: "razor", facing: -1, blink: lidAt(t, 350), tilt: lunge > 0 && lunge < 1 ? -10 : 0 }, pop >= 1);
    glint(out, t, tS - 0.2, [pm[0] + 0.3, pm[1] + 1.75, pm[2] + 0.08], 0.25, 0.3);
    standAt(cam, out, mus(4), [-2.6, 0, -19.5], { mode: "stand", expr: bare ? "shock" : "neutral", facing: 1, blink: lidAt(t, 334) });
    return;
  }
  if (id === 8) {
    standAt(cam, out, PE, M.dealPeter, { mode: "stand", expr: on(t, WORD.pay) ? "smug" : "grin", prop: ["deal", "#b8b4ac"], blink: lidAt(t, 300) }, true, PETER_SCALE);
    M.dealB.forEach((m, k) => standAt(cam, out, boyar(k + 1, true), m, { mode: "stand", expr: on(t, WORD.pay) ? "nervous" : "dazed", blink: lidAt(t, 311 + k), facing: m[0] < 0 ? 1 : -1, prop: "chin" }));
    glint(out, t, WORD.deal - 0.1, [M.dealPeter[0] + 0.62, 2.2, M.dealPeter[2] + 0.1], 0.22, 0.35);
    return;
  }
  if (id === 9) {
    const thud = WORD.hundred + 0.12, drop = WORD.hundred - 0.2;
    standAt(cam, out, MER, M.merchant, { mode: "stand", expr: on(t, thud) ? "nervous" : "smile_closed", prop: on(t, drop) ? null : "purse", facing: 1, blink: lidAt(t, 351) });
    standAt(cam, out, CLK, M.clerk, { mode: "stand", expr: on(t, thud + 0.2) ? "grin" : "stern", facing: -1, blink: lidAt(t, 358) });
    if (on(t, drop)) {
      const u = clamp01((t - drop) / (thud - drop)), x = -2.12 + 0.14 * u, y = 1.02 + (1.0 - 1.02) * u + 0.14 * Math.sin(Math.PI * u) - 0.1 * u, z = -14.0;
      out.fx.push({ key: "purse", cw: 240, ch: 240, draw: fxPurse, x, y: u >= 1 ? 1.0 : y, z, w: 0.24, h: 0.24, rot: u >= 1 ? 0 : -0.3 * (1 - u) });
      puff(out, t, thud, [-1.98, 0.95, -13.95], 0.45, 0.4);
    }
    return;
  }
  if (id === 10) {
    const tf = WORD.kopek - 0.1, tc = WORD.kopek + 0.5, tb = WORD.walked - 0.1;
    const w = walk(t, WORD.walked, WORD.gates + 0.6, M.peasant, [0.75, 0, -8.6]);
    standAt(cam, out, PEA, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: on(t, WORD.walked) ? "whistle" : on(t, tf) ? "smile_closed" : "neutral", prop: on(t, tf) ? null : "kopek", facing: on(t, WORD.walked) ? 0 : 1, blink: lidAt(t, 352) });
    const biting = on(t, tc) && t < tb;
    standAt(cam, out, GK, M.keeper, { mode: "stand", expr: biting ? "stern" : on(t, tb) ? "smug" : "neutral", prop: biting ? "bite" : null, facing: -1, blink: biting ? 0 : lidAt(t, 353) }, false);
    if (t >= tf - LEAD && t < tc) {
      const u = clamp01((t - tf) / (tc - tf)), x = 2.62 + (3.55 - 2.62) * u, y = 1.6 + (1.5 - 1.6) * u + 0.55 * Math.sin(Math.PI * u), z = -4.9 - 0.4 * u;
      out.fx.push({ key: "kopek", cw: 120, ch: 120, draw: fxKopek, x, y, z, w: 0.1, h: 0.1 * Math.max(0.15, Math.abs(Math.cos(u * 14))) });
    }
    glint(out, t, tc, [3.72, 1.45, -5.15], 0.14, 0.3);
    return;
  }
  if (id === 11) {
    const k = hammerAt(t, MINT_HITS);
    standAt(cam, out, MW, M.minter, { mode: "stand", expr: on(t, WORD.stamped) ? "grin" : "stern", prop: ["hammer", q(k, 30)], facing: -1, blink: lidAt(t, 354) }, false);
    for (const th of MINT_HITS) burst(out, t, th, [M.anvil[0], M.anvil[1] + 0.12, M.anvil[2] + 0.1], 0.5, "#ffd890", 0.25);
    const struck = on(t, WORD.stamped);
    out.fx.push(struck ? { key: "tok0", cw: 300, ch: 300, draw: (p) => fxToken(p, 0), x: M.anvil[0], y: M.anvil[1] + 0.07, z: M.anvil[2] + 0.12, w: 0.13, h: 0.13 }
      : { key: "blank", cw: 120, ch: 120, draw: fxKopek, x: M.anvil[0], y: M.anvil[1] + 0.07, z: M.anvil[2] + 0.12, w: 0.13, h: 0.13 });
    return;
  }
  if (id === 12) {
    const tf = WORD.message - 0.12, u = clamp01((t - tf) / 0.3), side = u < 0.5 ? 0 : 2, sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * u)));
    let pulse = 1;
    for (const tw of [WORD.nose, WORD.mouth, WORD.beard3]) { const d = t - tw + LEAD; if (d >= 0 && d < 0.25) pulse = Math.max(pulse, 1 + 0.07 * Math.sin((Math.PI * d) / 0.25)); }
    const c = TOKEN_CAM.pos;
    out.fx.push({ key: `tok${side}`, cw: 300, ch: 300, draw: (p) => fxToken(p, side), x: c[0], y: c[1] + 0.03, z: c[2] - 0.6, w: 0.2 * sx * pulse, h: 0.2 * pulse, yaw: 0 });
    return;
  }
  if (id === 13) {
    const drop = WORD.burden + 0.15;
    standAt(cam, out, OLD, M.oldman, { mode: "stand", expr: on(t, drop + 0.15) ? "pained" : "nervous", prop: on(t, drop) ? "chin" : "token", blink: lidAt(t, 357) });
    standAt(cam, out, mus(2), [-1.3, 0, -16.0], { mode: "stand", expr: "neutral", blink: lidAt(t, 332), facing: 1 });
    return;
  }
  if (id === 14 || id === 15) {
    const stop = WORD.worry - 0.1;
    const hammering = id === 14 && t < stop;
    let prop: FrontOpts["prop"] = hammering ? ["hammer", q(hammerAt(t, CARP_HITS), 30)] : null;
    let expr: Expr = id === 14 ? (on(t, stop) ? "stern" : "neutral") : "stern";
    if (id === 15) {
      const k = clamp01((t - (WORD.tucked - 0.25)) / (WORD.coat + 0.15 - (WORD.tucked - 0.25)));
      prop = ["beardOut", q(smooth(k), 30), CARPENTER_BEARD];
      expr = on(t, WORD.coat + 0.3) ? "smug" : "stern";
    }
    standAt(cam, out, CP, M.carp, { mode: "stand", expr, prop, facing: 1, blink: lidAt(t, 355) });
    if (id === 14) for (const th of CARP_HITS) if (th < stop) burst(out, t, th, [M.carp[0] + 0.45, M.carp[1] + 0.95, M.carp[2] + 0.35], 0.32, "#fff3b0", 0.2);
    const w = id === 14 ? walk(t, cf(11) / FPS + 0.2, WORD.bigger, M.perryIn, M.perry) : { m: M.perry, moving: false, phase: 0 };
    const shocked = id === 15 && on(t, WORD.coat);
    standAt(cam, out, PY, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: shocked ? "shock" : "laugh", facing: -1, blink: shocked ? 0 : lidAt(t, 356) });
    return;
  }
  if (id === 16) {
    const lit = on(t, WORD.nicholas);
    standAt(cam, out, CP, M.carpGate, { mode: "stand", expr: lit ? "relief" : on(t, WORD.explain) ? "smug" : "smile_closed", prop: ["beardOut", 1, CARPENTER_BEARD], facing: 0, blink: lidAt(t, 355) });
    if (lit) for (let k = 0; k < 5; k++) { const s = q((t * 1.2 + k / 5) % 1, 20); out.fx.push({ key: `spark${s}`, cw: 200, ch: 200, draw: (p) => fxSparkle(p, s), x: -0.9 + 0.45 * k, y: 2.2 + 0.5 * Math.sin(k * 2.1), z: -4.4, w: 0.22, h: 0.22 }); }
    return;
  }
  if (id === 17) {
    const t0 = cf(14) / FPS;
    for (let k = 0; k < 3; k++) {
      const w = walk(t, t0 + k * 0.7 - 0.6, t0 + k * 0.7 + 2.0, [-0.7 + 0.7 * k, 0, -10.5], [-1.0 + 1.1 * k, 0, -4.4 - 0.6 * k]);
      if (t > t0 + k * 0.7 - 0.6) standAt(cam, out, mus(k + 3), w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: "neutral", blink: lidAt(t, 333 + k) });
    }
    const w = walk(t, WORD.peter3 - 0.4, WORD.years + 0.3, [0.25, 0, -9.6], [0.4, 0, -5.4]);
    standAt(cam, out, OLD, w.m, { mode: w.moving ? "stroll" : "stand", phase: w.phase, expr: on(t, WORD.fifty) ? "smug" : "neutral", prop: "token", blink: lidAt(t, 357) });
    glint(out, t, WORD.fifty - 0.05, [w.m[0] + 0.42, 1.62, w.m[2] + 0.1], 0.22, 0.35);
    standAt(cam, out, POL, M.gatePolice, { mode: "stand", expr: on(t, WORD.fifty + 0.2) ? "nervous" : "stern", prop: "razor", facing: 1, blink: lidAt(t, 350) });
    return;
  }
};

// ---------------- one-off effects ----------------
export const snapFx = (tau: number, at: V3, out: Stage) => {
  if (tau >= SNAP && tau < SNAP + 0.45) {
    const u = (tau - SNAP) / 0.45;
    out.fx.push({ key: `bigburst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: at[0], y: at[1] + 0.12, z: at[2] - 0.15, w: 1.5, h: 1.5 });
  }
};
export const splashFx = (tau: number, out: Stage) => {
  const u = (tau - DROP1) / 1.1;
  if (u < 0 || u >= 1) return;
  for (const [x, z, s] of [[-2.9, -24, 1], [2.9, -21, 0.9], [-2.9, -15, 0.85], [2.9, -9, 0.8], [0, -27.5, 1.2], [-2.9, -5, 0.6]] as const)
    out.fx.push({ key: `splash${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, q(u, 30)), x, y: 2.6 * s, z, w: 7 * s, h: 7 * s }); // base of the drawing on the water line
};
export const creakFx = (t: number, pts: V3[], out: Stage, size = 0.8) =>
  pts.forEach(([x, y, z], i) => {
    const u = q((t * 1.3 + i * 0.37) % 1, 30);
    out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x, y, z, w: size, h: size, rot: i * 0.6 - 0.6 });
  });
export { FPS };

