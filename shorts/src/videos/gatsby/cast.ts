// The Great Gatsby short: our cast as lit flat sprites in the 3D world (the canvas pool, lit cards, unlit effect
// cards and contact shadows are the shared card machinery first written for the bridge short), plus gatsbyStage():
// who stands where, with which face and prop, in every shot. Cards, effects and blobs live on the NOINK layer.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, fxRing, Outfit, Expr, FrontOpts, SideOpts } from "../../engine/toon";
import { GATSBY, GATSBY_WHITE, GATSBY_OFFICER, DAISY, DAISY_CLOCHE, DAISY_BRIDE, TOM_SUIT, NICK, NICK_BARE, MYRTLE, WILSON, OWL, GATZ, POSTMAN, MINISTER, GUEST,
  fxDog, fxRumour, fxHeart, fxFlowers, fxTower, fxMattress, fxLeaf, fxGunShadow, fxBeam } from "../../engine/library/gatsby";
import { FPS, SHOTS, V3, clamp01, WORD, MARK, carAt } from "./story";
import { GATE, FOUNT, POOL, POOL_WALL_Z, GRAVE } from "./egg";
import { TEA } from "./rooms";
import { SEAT_Y } from "./valley";
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

// ================= the Gatsby short =================
export type Stage = { places: Place[]; fx: FxPlace[] };
const FRONT = { side: false, mirror: false };
const on = (t: number, w: number) => t >= w - LEAD;
const who = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const G = who(600, GATSBY, "gatsby"), GW = who(600, GATSBY_WHITE, "gatsbyW"), GO = who(600, GATSBY_OFFICER, "gatsbyO");
const D = who(601, DAISY, "daisy"), DC = who(601, DAISY_CLOCHE, "daisyC"), DB = who(601, DAISY_BRIDE, "daisyB");
const TS = who(602, TOM_SUIT, "tomS");
const NB = who(603, NICK_BARE, "nickB"), NK = who(603, NICK, "nick");
const MY = who(604, MYRTLE, "myrtle"), WL = who(605, WILSON, "wilson"), OW = who(606, OWL, "owl"), GZ = who(607, GATZ, "gatz");
const PM = who(608, POSTMAN, "postman"), MN = who(609, MINISTER, "minister");
const stand = (cam: CamInfo, out: Stage, w: Who, m: V3, fo: FrontOpts, shadow = true, scale = 1) => {
  out.places.push(person(cam, w, m[0], m[1], m[2], FRONT, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...fo }, {}, scale));
  if (shadow) blob(out, m[0], m[1], m[2], scale);
};
/** side view facing the point `to` on screen */
const profile = (cam: CamInfo, out: Stage, w: Who, m: V3, to: V3, so: SideOpts, shadow = true) => {
  const mirror = (to[0] - m[0]) * cam.right.x + (to[2] - m[2]) * cam.right.z < 0;
  out.places.push(person(cam, w, m[0], m[1], m[2], { side: true, mirror }, {}, { mode: "stand", blink: lidAt(cam.t ?? 0, w.i), ...so }));
  if (shadow) blob(out, m[0], m[1], m[2]);
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
/** pop-in scale: 0 before t0, overshoot to 1.12, settle at 1 */
const popK = (t: number, t0: number) => (t < t0 ? 0 : Math.min(1, (t - t0) / 0.12) * (1.12 - 0.12 * clamp01((t - t0 - 0.12) / 0.2)));

// the party crowd on the lawn: up to 34 guests (x -8..8, z -7..12), a few dancing, some holding coupes
const CROWD: [number, number][] = [];
for (let i = 0; i < 400 && CROWD.length < 34; i++) {
  const x = -8 + 16 * hh(i, 41), z = -7 + 19 * hh(i, 42);
  if (Math.abs(x) < 1.6 && z > 0.6 && z < 4.2) continue; // Nick + Gatsby's spot (shot 3)
  if (x > 2.2 && z > -0.6 && z < 3.8) continue; // the line from the gate to Gatsby (shot 2)
  if (Math.hypot(x - FOUNT[0], z - FOUNT[2]) < 2.6) continue; // the fountain
  if (x < -5.2 && z < -3.2) continue; // the band stand
  if (CROWD.some(([a, c]) => Math.hypot(a - x, c - z) < 0.95)) continue;
  CROWD.push([x, z]);
}
const partyCrowd = (cam: CamInfo, t: number, out: Stage, near = 30) => {
  const exprs: Expr[] = ["laugh", "grin", "whistle", "smile_closed", "grin", "laugh"];
  CROWD.forEach(([x, z], i) => {
    const d = Math.hypot(cam.pos.x - x, cam.pos.z - z);
    if (d < 1.2) return;
    const w = who(700 + i, GUEST(i), `g${i}`);
    const dance = i % 3 === 0 ? q(Math.sin(t * 7 + i), 8) : 0;
    stand(cam, out, w, [x, Math.abs(dance) * 0.06, z], { expr: exprs[i % 6], prop: i % 4 === 1 ? "goblet" : null, wave: i % 5 === 2 ? q(Math.sin(t * 8 + i), 20) : undefined,
      tilt: i % 3 === 0 ? 4 * dance : 0, facing: i % 2 ? 1 : -1 }, d < near);
  });
};
/** fireworks bursting over the roof: staggered shells, each a coloured ray burst that grows and fades */
const fireworks = (out: Stage, t: number) => {
  const cols = ["#ffd84a", "#ff6a8a", "#7ad8ff", "#a8ff7a", "#ffffff", "#ff9a3a"];
  for (let k = 0; k < 5; k++) {
    const per = 1.6 + 0.3 * k, ph = (t + k * 0.47) / per, n = Math.floor(ph), u = ph - n;
    if (u > 0.55) continue;
    const x = -14 + 28 * hh(n * 5 + k, 81), y = 27 + 6 * hh(n * 5 + k, 82), size = 7 + 4 * hh(n * 5 + k, 83), col = cols[(n + k) % cols.length];
    const uu = q(u / 0.55, 30);
    out.fx.push({ key: `fw${col}${uu}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, uu, col, 14, 20, 240), x, y, z: -30, w: size, h: size });
  }
};
const lawnProps = (out: Stage) => {
  out.fx.push({ key: "tower", cw: 420, ch: 460, draw: fxTower, x: 4.5, y: 0.8 + 0.58, z: -5.3, w: 1.05, h: 1.15 });
};
/** Nick's cottage is full of flowers (ch. 5): vases on the mantel, the side table and the floor */
const flowersIn = (out: Stage) => {
  for (const [x, y, z, s, k] of [[-2.3, 1.22, -2.85, 0.5, 0], [-1.05, 1.22, -2.85, 0.45, 1], [2.65, 0.7, -2.5, 0.55, 2], [-2.6, 0, -1.6, 0.8, 3], [2.7, 0, 0.6, 0.8, 4], [TEA[0] + 0.38, TEA[1], TEA[2] - 0.15, 0.32, 5]] as const)
    out.fx.push({ key: `flowers${k}`, cw: 300, ch: 420, draw: (p) => fxFlowers(p, k), x, y: y + 0.7 * s, z, w: s, h: 1.4 * s });
};
const fxCoupe = (p: Pen) => { p.ell(150, 120, 110, 30, "#f2d27a", 6); p.stroke([[150, 140], [150, 250]], 8, "#c8d8e0"); p.ell(150, 260, 50, 12, "#d8e6ee", 5); };

export const gatsbyStage = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const M = MARK;
  cam.t = t;
  // ---- the party on the lawn ----
  if (id === 1 || id === 23) {
    partyCrowd(cam, t, out, 14);
    lawnProps(out);
    stand(cam, out, G, M.terrace, { expr: "smile", look: 1, facing: 1 });
    return;
  }
  if (id === 2) {
    partyCrowd(cam, t, out, 16);
    lawnProps(out);
    const seen = on(t, WORD.in);
    stand(cam, out, G, M.gateWatch, { expr: seen ? "dazed" : on(t, WORD.wander) ? "grin" : "smile", facing: 1, prop: seen ? null : "goblet", headTilt: seen ? 8 : 0 });
    // the stray dog trots in through the gate on "in", toward Gatsby, then sits
    const t0 = WORD.wander + 0.2, u = clamp01((t - t0) / 1.1), x = GATE[0] + 2.2 - 4.4 * u, z = GATE[2] + 0.05 - 0.9 * u;
    if (t >= t0 - 0.4) {
      const trot = u < 1 ? Math.floor(t * 9) % 3 : 3, wag = Math.floor(t * 6) % 4;
      out.fx.push({ key: `dog${trot}${wag}`, cw: 400, ch: 300, draw: (p) => fxDog(p, trot, -1, wag / 4), x, y: 0.33, z, w: 0.88, h: 0.66 });
      blob(out, x, 0, z, 1.0, 0.8);
    }
    return;
  }
  if (id === 3) {
    partyCrowd(cam, t, out, 10);
    stand(cam, out, NK, M.nick3, { expr: on(t, WORD.idea) ? "nervous" : "grin", prop: "goblet", facing: 1 });
    stand(cam, out, G, M.gatsby3, { expr: "smile", facing: -1, prop: "goblet" });
    // the rumours pop up over the guests behind them
    const R: ["spy" | "crown" | "skull", number, V3][] = [["spy", WORD.no, [-1.35, 2.75, -0.9]], ["crown", WORD.idea + 0.15, [0.45, 3.0, -1.7]], ["skull", WORD.really, [1.45, 2.7, -0.5]]];
    for (const [k, w0, c] of R) {
      const s = popK(t, w0 - 0.05);
      if (s > 0) out.fx.push({ key: `rum${k}`, cw: 460, ch: 400, draw: (p) => fxRumour(p, k), x: c[0], y: c[1], z: c[2], w: 0.95 * s, h: 0.83 * s });
    }
    return;
  }
  // ---- the bay at night ----
  if (id === 4) { stand(cam, out, G, M.dockEnd, { expr: "neutral", prop: "point", facing: -1 }); return; }
  if (id === 8) { profile(cam, out, G, M.dockEnd, [14, 1.7, 44], { expr: on(t, WORD.dock) ? "relief" : "neutral" }); return; }
  // ---- the flashback (1917-19) ----
  if (id === 5) {
    const go = on(t, WORD.war) ? t - WORD.war + 0.2 : 0;
    const gx = M.officer[0] - 2.4 * go;
    if (go > 0) profile(cam, out, GO, [gx, 0, M.officer[2]], [gx - 5, 0, M.officer[2]], { mode: "march", phase: q((t * 1.8) % 1, 20), expr: "stern" });
    else stand(cam, out, GO, M.officer, { expr: on(t, WORD.fell) ? "relief" : "smile", facing: 1 });
    stand(cam, out, D, M.girl, { expr: on(t, WORD.war) ? "nervous" : on(t, WORD.fell) ? "smile_closed" : "smile", facing: -1, wave: on(t, WORD.war) ? q(Math.sin(t * 9), 20) : undefined });
    for (let k = 0; k < 3; k++) {
      const s = popK(t, WORD.fell + 0.12 * k);
      if (s > 0 && t < WORD.war) out.fx.push({ key: "heart", cw: 200, ch: 200, draw: (p) => fxHeart(p), x: 45.62 + (k - 1) * 0.3, y: 2.25 + 0.25 * (k % 2) + 0.15 * (t - WORD.fell), z: 1.1, w: 0.32 * s, h: 0.32 * s });
    }
    return;
  }
  if (id === 6) {
    stand(cam, out, DB, M.bride, { expr: "smile_closed", facing: 1 });
    stand(cam, out, TS, M.groom, { expr: on(t, WORD.rich) ? "smug" : "grin", facing: -1, prop: on(t, WORD.rich) ? "purse" : null });
    for (let k = 0; k < 4; k++) burst(out, t, WORD.married - LEAD + 0.08 * k, [49.3 + 0.6 * k, 2.3 + 0.2 * (k % 2), 3.0], 0.75, ["#ffe080", "#ff9ab0", "#9ad8ff", "#ffffff"][k], 0.45);
    burst(out, t, WORD.rich - LEAD, [50.95, 1.15, 3.1], 0.55, "#ffd84a", 0.35);
    return;
  }
  if (id === 7) { partyCrowd(cam, t, out, 0); fireworks(out, t); return; }
  // ---- Nick's cottage ----
  if (id === 9) {
    stand(cam, out, NB, M.nick9, { expr: on(t, WORD.tea) ? "shock" : on(t, WORD.invite) ? "grin" : "neutral", prop: on(t, WORD.invite) ? "letter" : null, facing: 1 });
    if (on(t, WORD.tea)) {
      stand(cam, out, GW, M.gatsby9, { expr: "nervous", facing: -1 }, true, popK(t, WORD.tea - LEAD));
      puff(out, t, WORD.tea - 0.05, [M.gatsby9[0], 0.9, M.gatsby9[2] + 0.1], 1.1, 0.5);
    }
    flowersIn(out);
    return;
  }
  if (id === 10) {
    stand(cam, out, DC, M.daisy10, { expr: on(t, WORD.seeing) ? "relief" : "smile", facing: 1 });
    stand(cam, out, GW, M.gatsby10, { expr: on(t, WORD.seeing) ? "relief_open" : "nervous", facing: -1 });
    for (let k = 0; k < 4; k++) {
      const t0 = WORD.seeing + 0.18 * k, s = popK(t, t0);
      if (s > 0) out.fx.push({ key: "heart", cw: 200, ch: 200, draw: (p) => fxHeart(p), x: -0.35 + 0.25 * k, y: 2.05 + 0.3 * (t - t0) + 0.1 * (k % 2), z: -0.2, w: 0.22 * s, h: 0.22 * s });
    }
    flowersIn(out);
    return;
  }
  if (id === 11) { // lanterns going out over an empty lawn; Gatsby alone on the terrace
    stand(cam, out, G, M.terrace, { expr: "neutral", facing: -1 });
    out.fx.push({ key: "coupe", cw: 300, ch: 300, draw: fxCoupe, x: 0.6, y: 0.08, z: 6.0, w: 0.3, h: 0.3, flat: true, rot: 1.4 });
    return;
  }
  // ---- the Plaza ----
  if (id === 12 || id === 13) {
    const accuse = on(t, WORD.never2), both = id === 13 && on(t, WORD.both);
    stand(cam, out, TS, M.tom12, { expr: both ? "shock" : accuse ? "angry" : "stern", facing: 1, prop: id === 12 && !accuse ? "fist" : null });
    stand(cam, out, G, M.gatsby12, { expr: both ? "shock" : accuse ? "yell" : "stern", facing: -1, prop: id === 12 && accuse ? "point" : null });
    stand(cam, out, DC, M.daisy12, { expr: id === 13 && !both ? "neutral" : "nervous", facing: 0 });
    if (id === 12) burst(out, t, WORD.him - LEAD, [0, 1.5, -1.35], 0.6, "#ffffff", 0.25);
    if (both) { burst(out, t, WORD.both - LEAD, [-0.85, 2.0, -1.4], 0.45); burst(out, t, WORD.both - LEAD, [0.85, 2.0, -1.4], 0.45); }
    return;
  }
  // ---- the valley of ashes ----
  if (id >= 14 && id <= 18) {
    const car = carAt(id, t);
    const seat = (sx: number, sz: number): V3 => [car.x + sx, car.bounce + SEAT_Y - 0.42, car.z + sz];
    if (id !== 16 && id !== 18) {
      stand(cam, out, DC, seat(-0.3, -0.36), { mode: "sit", expr: id === 15 ? "shock" : "stern", facing: 1 }, false);
      stand(cam, out, G, seat(-0.3, 0.36), { mode: "sit", expr: id === 15 ? "shock" : "neutral", facing: -1 }, false);
      for (const s of [-1, 1]) out.fx.push({ key: "beam", cw: 512, ch: 256, draw: fxBeam, x: car.x + 2.25 + 3.2, y: 0.03, z: car.z + s * 0.45, w: 6.5, h: 1.6, flat: true, rot: -Math.PI / 2, soft: true });
    }
    if (id === 14) { // Myrtle comes out of the garage and runs toward the road
      const u = clamp01((t - (WORD.daisy4 - 0.6)) / 1.2), m: V3 = [M.myrtle[0] - 0.6 * u, 0, M.myrtle[2] + 2.0 * u];
      if (u > 0) profile(cam, out, MY, m, [m[0] - 1, 0, m[2] + 3], { mode: "march", phase: q((t * 2.2) % 1, 20), expr: "angry" });
      else stand(cam, out, MY, m, { expr: "angry", facing: -1 });
    }
    if (id === 15) burst(out, t, WORD.hit - 0.02, [car.x + 2.6, 1.0, 1.0], 2.2, "#fff8e0", 0.35);
    if (id === 18) {
      stand(cam, out, G, M.blameG, { expr: on(t, WORD.blame) ? "stern" : "neutral", prop: "chest", facing: 1 });
      stand(cam, out, DC, M.blameD, { expr: "nervous", facing: -1 });
    }
    return;
  }
  if (id === 19) {
    stand(cam, out, TS, M.tom19, { expr: on(t, WORD.car2) ? "smug" : "stern", prop: on(t, WORD.whose) ? "point" : "shush", facing: -1 });
    stand(cam, out, WL, M.wilson19, { expr: on(t, WORD.car2) ? "dazed" : "nervous", facing: -1 });
    return;
  }
  // ---- the pool ----
  if (id >= 20 && id <= 22) {
    const [fx, fy, fz] = M.float, mx = fx + 0.06 * (t - WORD.next), mz = fz + 0.12 * Math.sin(t * 0.3);
    out.fx.push({ key: "mattress", cw: 600, ch: 160, draw: fxMattress, x: mx, y: fy + 0.02, z: mz, w: 1.9, h: 0.6, flat: true, rot: 0.25 });
    const ru = q((t * 0.4) % 1, 90);
    out.fx.push({ key: `ring${ru}`, cw: 600, ch: 600, draw: (p) => fxRing(p, ru), x: mx, y: fy + 0.01, z: mz, w: 2.6, h: 2.6, flat: true });
    if (id === 20) stand(cam, out, G, [mx - 0.1, fy - 0.12, mz], { mode: "sit", expr: on(t, WORD.pool) ? "smile_closed" : "neutral", facing: 1 }, false);
    if (id === 21) {
      const k = clamp01((t - WORD.husband2 + 0.35) / 0.4);
      out.fx.push({ key: "gunshadow", cw: 500, ch: 900, draw: (p) => fxGunShadow(p), x: -36.6 - 1.4 * k, y: 1.15, z: POOL_WALL_Z + 0.03, w: 1.2, h: 2.15, yaw: 0, soft: true });
    }
    for (let k = 0; k < 6; k++) out.fx.push({ key: `leaf${k % 3}`, cw: 120, ch: 120, draw: (p) => fxLeaf(p, ["#d8642a", "#e8a03a", "#b8402a"][k % 3]),
      x: POOL.x - 3.8 + 1.5 * k + 0.1 * Math.sin(t * 0.5 + k), y: POOL.y + 0.012, z: POOL.z - 1.7 + 0.7 * (k % 4) + 0.08 * Math.cos(t * 0.4 + k), w: 0.24, h: 0.24, flat: true, rot: k * 1.1 + 0.1 * t });
    if (id === 22) out.fx.push({ key: "leafR", cw: 120, ch: 120, draw: (p) => fxLeaf(p, "#c8202a"), x: mx + 0.2, y: fy + 0.05, z: mz - 0.05, w: 0.3, h: 0.3, flat: true, rot: 0.6 });
    return;
  }
  // ---- the funeral in the rain ----
  if (id === 24 || id === 25) {
    stand(cam, out, NB, M.nickG, { expr: "neutral", facing: -1 });
    stand(cam, out, GZ, M.gatz, { expr: "pained", facing: 1 });
    stand(cam, out, OW, M.owl, { expr: on(t, WORD.funeral) && id === 24 ? "pained" : "neutral", facing: -1 });
    stand(cam, out, PM, M.postman, { expr: "neutral", facing: 1 });
    stand(cam, out, MN, M.minister, { expr: "neutral", facing: 0, prop: "letter" });
    for (let k = 0; k < 10; k++) {
      const u = q((t * 1.3 + hh(k, 71)) % 1, 60), x = GRAVE[0] - 2.5 + 5 * hh(k, 72), z = GRAVE[2] + 1.0 + 2.2 * hh(k, 73);
      out.fx.push({ key: `ring${u}`, cw: 600, ch: 600, draw: (p) => fxRing(p, u), x, y: 0.02, z, w: 0.5, h: 0.5, flat: true });
    }
    if (id === 25) burst(out, t, WORD.flower - LEAD, [153.75, 1.08, -1.1], 0.35, "#dff0ff", 0.3);
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);
  gatsbyStage(id, t, cam, out);
  return out;
};

