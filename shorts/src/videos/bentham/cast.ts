// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, swingKid, soldier, townsfolk, OFFICER, KID, PARENT, fxNote, fxBurst, fxSplash, fxStars, fxCreak, fxRing, fxShadow, fxContact, fxPlank, fxDrum,
  Outfit, Expr, FrontOpts, SideOpts, fxPuff, fxRobe, fxSparkle,
  BENTHAM, AUTOICON, AUTO_SACK, SKELETON, PADDED, SMITH, SMITH_PALE, TALRICH, GENT, GUEST, STUDENT75, OFFICIAL, COUNCIL, STUDENT,
  fxCloche, fxBust, fxScrollTile, fxTuft,
} from "./toon";
import {
  FPS, D0, FILES, ROW_GAP, COUNT, PARK, SHOTS, SNAP, DROP0, DROP1, DROP_H, V3, front, marchPhase, stomp, deckY, dropW, dropU, shapeZ,
  smooth, clamp01, BridgeState, WORD, MARK, BEAT, trolleySeat,
} from "./story";
import { tierX, tierY, tierZ } from "./ucl";
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
  if (s.set && s.set !== "out") { benthamStage(id, t, cam, out); return out; }
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

// ================= Jeremy Bentham, 1832 - today =================
const W_ = WORD;
const SITY = 0.1;
const sitEyes = (m: V3): V3 => [m[0], m[1] + 0.86, m[2]];
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const standAt = (cam: CamInfo, out: Stage, who: Who, m: V3, fo: FrontOpts, shadow = true) => {
  out.places.push(person(cam, who, m[0], m[1], m[2], FRONT, { mode: "stand", ...fo }, {}));
  if (shadow) blob(out, m[0], m[1], m[2]);
};
const sitAt = (cam: CamInfo, out: Stage, who: Who, m: V3, fo: FrontOpts) => out.places.push(person(cam, who, m[0], m[1], m[2], FRONT, { ...fo, mode: "sit" }, {}));
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
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

const BEN: Who = { i: 200, o: BENTHAM, okey: "ben" };
const ICON: Who = { i: 201, o: AUTOICON, okey: "icon" };
const SM: Who = { i: 202, o: SMITH, okey: "sm" };
const SMP: Who = { i: 202, o: SMITH_PALE, okey: "smp" };
const TAL: Who = { i: 203, o: TALRICH, okey: "tal" };
const OFF: Who = { i: 204, o: OFFICIAL, okey: "off75" };
const GENTS: Who[] = Array.from({ length: 24 }, (_, v) => ({ i: 210 + v, o: GENT(v), okey: `gent${v}` }));
const GUESTS: Who[] = Array.from({ length: 6 }, (_, v) => ({ i: 240 + v, o: GUEST(v), okey: `guest${v}` }));
const KCL: Who[] = [0, 1, 2].map((v) => ({ i: 250 + v, o: STUDENT75(v), okey: `kcl${v}` }));
const COUNC: Who[] = Array.from({ length: 12 }, (_, v) => ({ i: 260 + v, o: COUNCIL(v), okey: `cou${v}` }));
const STUD: Who[] = Array.from({ length: 8 }, (_, v) => ({ i: 280 + v, o: STUDENT(v), okey: `stu${v}` }));

/** the auto-icon seated: fixed glass stare, never blinks, stick across the lap */
const icon = (cam: CamInfo, out: Stage, m: V3) => sitAt(cam, out, ICON, m, { expr: "stare", prop: "stick", blink: 0 });
/** the real head under its cloche (card standing on the case floor) */
const head = (out: Stage, m: V3, s = 0.3, dome = true) =>
  out.fx.push({ key: `cloche${dome}`, cw: 300, ch: 360, draw: (p) => fxCloche(p, true, dome), x: m[0], y: m[1] + 0.6 * s, z: m[2], w: s, h: 1.2 * s });

/** students crossing the Student Centre in two lanes (front lane left->right, back lane right->left), side views */
const walkers = (cam: CamInfo, t: number, out: Stage, n: number, skip = -1) => {
  for (let i = 0; i < n; i++) {
    if (i === skip) continue;
    const back = i % 2 === 1, dir = back ? -1 : 1, sp = 0.95 + 0.3 * hh(i, 3), z = back ? -5.8 - 0.4 * hh(i, 4) : -1.15 - 0.3 * hh(i, 4);
    const span = 13, x = ((((hh(i) * span + sp * t) % span) + span) % span - span / 2) * dir;
    const who = STUD[i % STUD.length], phase = q(((t * sp) / 1.4 + hh(i, 5)) % 1, 120);
    const view = viewOf(cam, x, z, dir, 0);
    const fo: FrontOpts = { mode: "stroll", phase, expr: (["smile", "neutral", "smile_closed", "grin"] as Expr[])[i % 4], blink: lidAt(t, 280 + i) };
    const so: SideOpts = { mode: "march", phase, expr: fo.expr, stomp: 0.55, stride: 0.875 * view.fs, blink: lidAt(t, 280 + i) };
    out.places.push(person(cam, who, x, 0, z, view, fo, so));
    blob(out, x, 0, z);
  }
};

const centreStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  icon(cam, out, MARK.icon);
  if (id === 2) {
    burst(out, t, W_.entire - 0.05, [0.55, 1.75, -2.25], 0.7, "#ffffff", 0.2);
    return;
  }
  walkers(cam, t, out, id === 1 ? 5 : 7);
  if (id === 1) {
    // a student strolls in, stops beside the case and does a double-take on "dead"
    const stop = W_.dead - 0.6, x = t < stop ? -0.8 - 1.1 * (stop - t) : -0.8, z = -1.75;
    const dt = on(t, W_.dead), phase = q(((t * 1.1) / 1.4) % 1, 120);
    out.places.push(person(cam, STUD[6], x, 0, z, t < stop ? viewOf(cam, x, z, 1, 0) : FRONT,
      { mode: t < stop ? "stroll" : "stand", phase, expr: dt ? "shock" : "smile", facing: dt ? 1 : 0, look: dt ? 1 : 0, blink: dt ? 0 : lidAt(t, 286) },
      { mode: "march", phase, expr: "smile", stomp: 0.55, stride: 0.8 }));
    blob(out, x, 0, z);
  } else {
    // one student stops to take a photo on the way past
    standAt(cam, out, STUD[7], [1.15, 0, -1.6], { expr: on(t, W_.sitting) ? "grin" : "smile", facing: -1, prop: "phone", blink: lidAt(t, 287) });
  }
};

/** the scroll of instructions unrolling across the floor toward the lens */
const scrollFloor = (t: number, out: Stage) => {
  const u = smooth((t - (W_.instructions - LEAD)) / 1.1), n = Math.ceil(u * 9);
  for (let k = 0; k < n; k++) {
    const last = k === n - 1;
    out.fx.push({ key: `scroll${last}`, cw: 256, ch: 256, draw: (p) => fxScrollTile(p, last), x: 0.55, y: 0.012, z: -2.25 + 0.36 * (k + 0.5), w: 0.36, h: 0.36, flat: true });
  }
};

const studyStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  if (id === 3) {
    const ins = on(t, W_.instructions);
    sitAt(cam, out, BEN, M.chair, { expr: ins ? "grin" : on(t, W_.famous) ? "smug" : "neutral", prop: ins ? "scroll" : "quill", blink: lidAt(t, 200) });
    scrollFloor(t, out);
    return;
  }
  if (id === 4) {
    const use = on(t, W_.useful);
    sitAt(cam, out, BEN, M.chair, { expr: use ? "relief_open" : "grin", wave: use ? q(0.5 + 0.5 * Math.sin((t - W_.useful) * 7), 8) : undefined, blink: lidAt(t, 200) });
    scrollFloor(t, out);
    return;
  }
  if (id === 8) {
    // the skeleton on the chair -> padded ("padded") -> dressed, a bag over the head ("dressed") -> stick in hand ("chair")
    const pad = on(t, W_.padded), dress = on(t, W_.dressed), done = on(t, W_.chair);
    const o = dress ? AUTO_SACK : pad ? PADDED : SKELETON;
    sitAt(cam, out, { i: 205, o, okey: dress ? "sack" : pad ? "pad" : "skel" }, M.chair, { expr: pad ? "neutral" : "skull", prop: done ? "stick" : null, blink: 0 });
    const work = !done;
    standAt(cam, out, SM, M.smith8, { expr: done ? "relief" : on(t, W_.skeleton) ? "grin" : "stern", facing: 1, tilt: work ? q(5 * Math.sin(t * 8), 2) : 0, blink: lidAt(t, 202) });
    const c = sitEyes(M.chair);
    if (pad && t < W_.dressed) for (let k = 0; k < 5; k++) {
      const u = ((t - W_.padded + k * 0.17) * 1.4) % 1, a = k * 1.3;
      out.fx.push({ key: `tuft${k % 3}`, cw: 200, ch: 200, draw: (p) => fxTuft(p, k % 3), x: c[0] + 0.5 * u * Math.cos(a), y: c[1] - 0.3 + 0.6 * u, z: c[2] + 0.15, w: 0.18 * (1 - u * 0.5), h: 0.18 * (1 - u * 0.5) });
    }
    if (dress && t < W_.dressed + 0.5) {
      const u = (t - W_.dressed + LEAD) / 0.5;
      out.fx.push({ key: "coat", cw: 300, ch: 300, draw: (p) => fxRobe(p, "#2c2a33"), x: c[0] - 0.9 * (1 - u), y: c[1] - 0.25 + 0.6 * (1 - u), z: c[2] + 0.2, w: 0.7, h: 0.7, rot: q(2 * (1 - u), 20) });
    }
    puff(out, t, W_.dressed - LEAD + 0.4, [c[0], c[1] - 0.2, c[2] + 0.2], 1.0, 0.45);
    puff(out, t, W_.padded - LEAD, [c[0], c[1] - 0.2, c[2] + 0.2], 0.9, 0.45);
    return;
  }
  if (id === 10) {
    // the cloche under a cloth; Smith whips it off on "came"; the head is dark and shrivelled; poof on "shrivelled"
    const off = on(t, W_.came), sh = on(t, W_.shrivelled);
    const cl = M.cloche;
    if (off) head(out, cl, 0.36);
    const lift = clamp01((t - (W_.came - LEAD)) / 0.35);
    if (lift < 1) out.fx.push({ key: "cloth", cw: 300, ch: 360, draw: clothDraw, x: cl[0] + 0.5 * lift, y: cl[1] + 0.216 + 0.6 * lift, z: cl[2] + 0.05, w: 0.4, h: 0.48, rot: q(-1.2 * lift, 20) });
    standAt(cam, out, sh ? SMP : SM, M.smith10, { expr: sh ? "shock" : off ? "nervous" : "stern", facing: 1, blink: sh ? 0 : lidAt(t, 202) });
    puff(out, t, W_.shrivelled - LEAD, [cl[0], cl[1] + 0.3, cl[2] + 0.15], 0.8, 0.6);
    return;
  }
  // 11: Talrich spins the wax head; it comes round smiling on "wax"; Smith relieved
  const b = M.bust, t0 = W_.sculpted - LEAD, t1 = W_.wax - LEAD;
  const a = t < t0 ? 0 : t > t1 ? 4 * Math.PI : 4 * Math.PI * smooth((t - t0) / (t1 - t0)), c = Math.cos(a);
  out.fx.push({ key: `bust${c < 0}`, cw: 300, ch: 400, draw: (p) => fxBust(p, c < 0), x: b[0], y: b[1] + 0.25, z: b[2], w: Math.max(0.02, 0.36 * Math.abs(c)), h: 0.48 });
  const wax = on(t, W_.wax);
  standAt(cam, out, TAL, MARK.talrich, { expr: wax ? "relief_open" : "grin", facing: -1, prop: wax ? null : "point", wave: wax ? 0.6 : undefined, blink: lidAt(t, 203) });
  standAt(cam, out, SM, MARK.smith11, { expr: wax ? "relief" : "nervous", facing: -1, blink: lidAt(t, 202) });
  if (wax) for (let k = 0; k < 4; k++) {
    const s = q(Math.abs(Math.sin(t * 4 + k * 1.7)), 12), aa = k * 1.6;
    out.fx.push({ key: `spark${s}`, cw: 200, ch: 200, draw: (p) => fxSparkle(p, s), x: b[0] + 0.3 * Math.cos(aa), y: b[1] + 0.35 + 0.2 * Math.sin(aa), z: b[2] + 0.15, w: 0.14, h: 0.14 });
  }
};
const clothDraw = (p: Pen) => {
  p.poly([[40, 340], [70, 120], [150, 40], [230, 120], [260, 340], [200, 320], [150, 345], [100, 320]], "#8a8478", 8);
  p.stroke([[110, 140], [96, 320]], 4, "#6a6458"); p.stroke([[190, 140], [204, 320]], 4, "#6a6458");
};

/** the 1832 audience on the tiers: back rows across x, side rows along z; they lean toward the table, turn on "public" */
const SEATS: { m: V3; face: -1 | 0 | 1 }[] = (() => {
  const s: { m: V3; face: -1 | 0 | 1 }[] = [];
  for (let k = 0; k < 3; k++) for (const x of k % 2 ? [-1.65, -0.55, 0.55, 1.65] : [-2.2, -1.1, 0, 1.1, 2.2]) s.push({ m: [x, tierY(k) - SITY, tierZ(k)], face: 0 });
  for (let k = 0; k < 2; k++) for (const sd of [-1, 1]) for (const z of [-1.7, -0.2, 1.3]) s.push({ m: [sd * tierX(k), tierY(k) - SITY, z], face: (-sd) as -1 | 1 });
  return s;
})();
const theatreStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const pub = id === 5 && on(t, W_.public), storm = id >= 6 && on(t, W_.thunderstorm), shook = id === 7 && on(t, W_.shook);
  SEATS.forEach((st, i) => {
    const expr: Expr = pub ? (i % 3 ? "shock" : "nervous") : shook ? "shock" : storm ? (i % 2 ? "nervous" : "shock") : (["stern", "neutral", "nervous", "smug"] as Expr[])[i % 4];
    const lean = pub || storm ? 0 : st.face ? -st.face * 7 : 0;
    sitAt(cam, out, GENTS[i % GENTS.length], st.m, { expr, facing: pub ? 0 : st.face, tilt: lean, blink: lidAt(t, 210 + i) });
  });
  const pale = storm;
  standAt(cam, out, pale ? SMP : SM, MARK.smith, { expr: pale ? "nervous" : id === 5 && on(t, W_.science) ? "grin" : "stern", facing: 0, prop: "scroll", blink: pale ? 0 : lidAt(t, 202) });
  if (id === 7) {
    // a gentleman at the rail in the foreground: his top hat jumps off on "shook"
    const g = GENTS[0], gm = MARK.gentFront;
    standAt(cam, out, shook ? { ...g, o: { ...g.o, hat: "hair" }, okey: "gent0bare" } : g, gm, { expr: shook ? "shock" : "nervous", facing: 1, blink: lidAt(t, 230) });
    if (shook) {
      const d = t - (W_.shook - LEAD), y = gm[1] + 2.0 + 1.6 * d - 4.9 * d * d;
      if (y > 0.1) out.fx.push({ key: "tophat", cw: 200, ch: 200, draw: hatDraw, x: gm[0] - 0.4 * d, y, z: gm[2] + 0.1, w: 0.36, h: 0.36, rot: q(3 * d, 20) });
      else out.fx.push({ key: "tophat", cw: 200, ch: 200, draw: hatDraw, x: gm[0] - 0.4 * 0.95, y: 0.1, z: gm[2] + 0.1, w: 0.36, h: 0.36, rot: 1.6 });
    }
  }
};
const hatDraw = (p: Pen) => {
  p.poly([[60, 160], [140, 160], [146, 40], [54, 40]], "#2e2a36", 8);
  p.ell(100, 162, 80, 14, "#1d1b22", 8);
};

const dinnerStage = (t: number, cam: CamInfo, out: Stage) => {
  const pk = on(t, W_.pocket), lg = on(t, W_.legend);
  sitAt(cam, out, BEN, MARK.benthamDine, { expr: pk ? "grin" : lg ? "smug" : "smile", facing: 1, prop: pk ? "eyes" : on(t, W_.carried) ? "fist" : null, blink: lidAt(t, 200) });
  const spots: V3[] = [[1.1, 0.38, -2.0], [1.1, 0.38, -3.5], [-1.1, 0.38, -5.0], [1.1, 0.38, -5.0], [-1.1, 0.38, -6.5], [1.1, 0.38, -6.5]];
  spots.forEach((m, i) => {
    const sd = m[0] < 0 ? 1 : -1;
    sitAt(cam, out, GUESTS[i], m, { expr: pk ? (i % 2 ? "shock" : "nervous") : (["smile", "laugh", "smile_closed"] as Expr[])[i % 3], facing: sd as 1 | -1, tilt: pk ? -sd * 9 : 0, blink: lidAt(t, 240 + i) });
  });
  if (pk) for (let k = 0; k < 3; k++) {
    const s = q(Math.abs(Math.sin((t - W_.pocket) * 5 + k)), 12), b = sitEyes(MARK.benthamDine);
    out.fx.push({ key: `spark${s}`, cw: 200, ch: 200, draw: (p) => fxSparkle(p, s), x: b[0] + 0.3 + 0.15 * k, y: b[1] + 0.25 + 0.12 * k, z: b[2] + 0.2, w: 0.12, h: 0.12 });
  }
};

const cloisterStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  icon(cam, out, M.cabSeat);
  const stolen = id === 14 || id === 15 || (id === 13 && on(t, W_.stole)) || (id === 16 && !on(t, W_.deal));
  if (!stolen && id !== 16) head(out, M.cabHead);
  if (id === 12) return;
  if (id === 13) {
    const s0 = BEAT[10], st = W_.stole - LEAD, gone = clamp01((t - st - 0.35) / 0.9);
    const starts: V3[] = [[-0.9, 0, 1.2], [-1.6, 0, 1.6], [-0.2, 0, 1.9]], ends: V3[] = [[1.15, 0, -3.75], [0.35, 0, -3.1], [0.9, 0, -2.6]], exit: V3 = [-2.0, 0, 1.0];
    KCL.forEach((w, j) => {
      const u = smooth((t - s0 - 0.1 * j) / (st - s0 - 0.25));
      const m = gone > 0 ? lerp3(ends[j], exit, gone) : lerp3(starts[j], ends[j], u);
      const tiptoe = u < 1 && gone === 0, bob = tiptoe ? 0.05 * Math.abs(Math.sin(t * 6 + j)) : 0;
      standAt(cam, out, w, [m[0], bob, m[2]], { expr: gone > 0 ? "laugh" : on(t, W_.stole) ? "grin" : "whistle", facing: gone > 0 ? -1 : 1,
        prop: j === 0 && on(t, W_.stole) ? "box" : null, tilt: gone > 0 ? -12 : tiptoe ? q(4 * Math.sin(t * 6 + j), 2) : 0, blink: lidAt(t, 250 + j) }, bob < 0.02);
    });
    puff(out, t, W_.stole - LEAD, [M.cabHead[0], 0.4, M.cabHead[2]], 0.9, 0.5);
    return;
  }
  if (id === 14) {
    const hund = on(t, W_.hundred2);
    standAt(cam, out, KCL[2], [0.35, 0, -2.4], { expr: hund ? "laugh" : "grin", facing: 0, prop: "letter", blink: lidAt(t, 252) });
    standAt(cam, out, KCL[0], [-0.45, 0, -3.0], { expr: hund ? "laugh" : "grin", facing: 1, blink: lidAt(t, 250) });
    standAt(cam, out, KCL[1], [1.05, 0, -3.15], { expr: hund ? "laugh" : "whistle", facing: -1, prop: "box", blink: lidAt(t, 251) });
    return;
  }
  if (id === 15) {
    const ten = on(t, W_.ten);
    standAt(cam, out, OFF, M.official, { expr: ten ? "neutral" : "stern", facing: 0, prop: ten ? "ten" : "letter", blink: ten ? 0 : lidAt(t, 204) });
    return;
  }
  // 16: the students hand the box back glumly; the official takes it on "deal"
  const deal = on(t, W_.deal);
  standAt(cam, out, OFF, M.official, { expr: deal ? "relief" : "stern", facing: -1, prop: deal ? "box" : null, blink: lidAt(t, 204) });
  const giver: V3 = deal ? [-0.1, 0, -3.0] : [0.1, 0, -3.15];
  standAt(cam, out, KCL[0], giver, { expr: "dazed", facing: 1, prop: deal ? null : "box", blink: lidAt(t, 250) });
  standAt(cam, out, KCL[2], [-0.55, 0, -3.5], { expr: "dazed", facing: 1, blink: lidAt(t, 252) });
  standAt(cam, out, KCL[1], [-1.0, 0, -2.6], { expr: "pained", facing: 1, blink: lidAt(t, 251) });
  burst(out, t, W_.deal - LEAD, [M.official[0] - 0.05, 1.0, M.official[2] + 0.2], 0.8, "#fff3b0", 0.3);
};

const COUNCIL_Z = [-6.5, -5, -3.5, -2, -0.5, 1];
const councilStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const seat = trolleySeat(id, t);
  if (seat) icon(cam, out, seat);
  const shock = on(t, W_.surprise), vote = id === 19;
  let k = 0;
  for (const sd of [-1, 1]) COUNCIL_Z.forEach((z) => {
    const i = k++, m: V3 = [sd * 1.1, 0.38, z];
    const expr: Expr = vote ? (i % 3 ? "neutral" : "smug") : shock ? (i % 3 === 1 ? "nervous" : "shock") : on(t, W_.wheeled) ? (i % 2 ? "nervous" : "neutral") : (["neutral", "stern", "smile"] as Expr[])[i % 3];
    sitAt(cam, out, COUNC[i], m, { expr, facing: (-sd) as -1 | 1, wave: vote && on(t, W_.he4) ? 0.85 : undefined, tilt: shock && !vote ? sd * 6 : 0, blink: lidAt(t, 260 + i) });
  });
};

/** everything with a face in the Bentham shots */
const benthamStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const s = SHOTS[id - 1];
  if (s.set === "centre") centreStage(id, t, cam, out);
  else if (s.set === "study") studyStage(id, t, cam, out);
  else if (s.set === "theatre") theatreStage(id, t, cam, out);
  else if (s.set === "banquet") { if (s.light === "night") dinnerStage(t, cam, out); else councilStage(id, t, cam, out); }
  else if (s.set === "cloister") cloisterStage(id, t, cam, out);
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

