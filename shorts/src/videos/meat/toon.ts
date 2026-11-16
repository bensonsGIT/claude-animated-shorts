// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build;
  /** Renaissance pleated collar fill */
  ruff?: string;
  /** "hurt" (fresh wound), "bandage", or a metal colour for a prosthetic nose; the house style otherwise draws no nose */
  nose?: string;
  /** plain white falling band / cravat under the chin (17th-century England) */
  band?: string;
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

// Renaissance Denmark (1566) / Prague court (1601): doublet + hose, white ruff, rapier at the hip
const RUFF = "#f6f1e6";
export const TYCHO_YOUNG: Outfit = { jacket: "#2c2a3a", pants: "#3a2f36", boots: "#3a2a20", hat: "hair", hair: "#c8743a", moustache: "#b9652e",
  ruff: RUFF, buttons: "#e1b84c", sword: true, skin: "#ffdcbc" };
export const MANDERUP: Outfit = { jacket: "#8a2a3a", pants: "#3b2b2e", boots: "#3a2a20", hat: "hair", hair: "#3a2a22", moustache: "#2e221c",
  ruff: RUFF, buttons: "#e1b84c", sword: true, skin: "#f5c9a0" };
export const BRASS = "#c9a24a";
// portraits show him balding with a big drooping moustache
export const TYCHO_OLD: Outfit = { ...TYCHO_YOUNG, jacket: "#26242f", hat: null, moustache: "#a8703f", build: "stout", nose: BRASS, sword: false };
export const noble = (v = 0): Outfit => {
  const coats = ["#2f5a3c", "#2c3a6b", "#7a2836", "#5a3a6a", "#8a5a2a", "#26303a"];
  const hairs = ["#3a2a20", "#7a4a2a", "#c8a060", "#1e1a1a", "#9a5a30"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#33282e", boots: "#3a2a20", hat: "hair", hair: hairs[v % 5], ruff: RUFF, buttons: "#d9b04a", skin: SKINS[v % 4] };
  if (v % 4 === 2) return { ...o, hat: "bonnet", dress: ["#8a2a4a", "#2a5a7a", "#7a6a2a"][v % 3] };
  return v % 3 === 1 ? { ...o, moustache: shade(o.hair!, 0.8) } : o;
};

/** Prague court, 1601: brighter silks, gold chains for some */
export const courtier = (v = 0): Outfit => {
  const coats = ["#2f6a8a", "#7a3a8a", "#3a7a4a", "#a8742a", "#8a2a4a", "#3a3a7a"];
  const hairs = ["#3a2a20", "#7a4a2a", "#c8a060", "#1e1a1a", "#9a5a30", "#b8b0a8"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#2e2a34", boots: "#3a2a20", hat: "hair", hair: hairs[v % 6], ruff: RUFF, buttons: "#e1b84c", skin: SKINS[(v + 1) % 4] };
  if (v % 4 === 1) return { ...o, hat: "bonnet", dress: ["#c25a7a", "#5a8fc2", "#d9a441"][v % 3] };
  return { ...o, moustache: v % 2 ? shade(o.hair!, 0.75) : undefined, sash: v % 3 === 0 ? "#d9b04c" : undefined };
};
/** 2010 forensic scientists: white lab coats over everyday clothes */
export const scientist = (v = 0): Outfit => ({
  jacket: "#f2f4f6", pants: ["#3a4a6a", "#4a4a52", "#2f3a4a"][v % 3], boots: "#2a2a30", hat: "hair",
  hair: ["#3a2a20", "#c8a060", "#1e1a1a", "#7a4a2a"][v % 4], buttons: "#c8ccd4", skin: SKINS[(v + 2) % 4],
});
/** the host at the head of the table */
export const HOST: Outfit = { jacket: "#1e3a5a", pants: "#2a2630", boots: "#3a2a20", hat: "hair", hair: "#5a3a26", moustache: "#4a2e1e", ruff: RUFF,
  buttons: "#e1b84c", sash: "#d9b04c", build: "stout", skin: "#f5c9a0" };

// ---- Newton short: England 1665 (Cambridge / Woolsthorpe) and the Royal Mint at the Tower, 1696-99 ----
const LINEN = "#f4f1e8";
/** young Newton, 22: plain scholar's coat, white band, his own long brown hair */
export const NEWTON_YOUNG: Outfit = { jacket: "#2f5d5a", pants: "#353038", boots: "#3a2a20", hat: "wig", hair: "#6b4630", band: LINEN, buttons: "#c8b07a", skin: "#ffe0c4" };
/** Warden Newton, 54: wine-red coat, gold buttons, cravat, grey periwig */
export const NEWTON_OLD: Outfit = { jacket: "#6e2430", pants: "#2e2830", boots: "#2a2024", hat: "periwig", hair: "#d9d4cb", band: LINEN, buttons: "#e1b84c", skin: "#fbd9bd", build: "stout" };
/** William Chaloner, coiner and dandy: peacock-blue coat, gold sash, dark periwig, a thin rogue's moustache */
export const CHALONER: Outfit = { jacket: "#2a62b8", pants: "#2c2a3a", boots: "#2a2024", hat: "periwig", hair: "#3f2a1e", band: LINEN, buttons: "#f0c850", sash: "#e0b444", moustache: "#2e1e14", skin: "#f5c9a0" };
/** Chaloner in Newgate: wig gone, shirt-sleeves, unshaven */
export const CHALONER_CELL: Outfit = { jacket: "#b9b2a2", pants: "#3a3640", boots: "#2a2024", hat: "hair", hair: "#3f2a1e", moustache: "#2e1e14", buttons: "#8a826e", skin: "#efc6a0" };
/** Mint workman: shirt, leather belt, cap */
export const MINTER = (v = 0): Outfit => ({ jacket: ["#c9a77a", "#a8b5b8", "#c6b58e"][v % 3], pants: "#3d3a40", boots: "#3a2a20", hat: v % 2 ? "cap" : "hair",
  cap: "#5a4636", hair: ["#3a2a20", "#7a4a2a", "#1e1a1a"][v % 3], belt: "#5a3a24", skin: SKINS[(v + 1) % 4] });

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick" | "dead" | "angry" | "yell" | "smug";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral" | "x";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick" | "slack";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
  /** the corpse: X eyes, slack jaw */
  dead: { eye: ["x", "x"], brow: [1, 1], mouth: "slack" },
  angry: { eye: ["lid", "lid"], brow: [8, -5], mouth: "frown" },
  yell: { eye: ["lid", "lid"], brow: [9, -6], mouth: "O" },
  smug: { eye: ["lid", "lid"], brow: [-2, -4], mouth: "smirk" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  k === "x" ? k : lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "x": p.stroke([[x - 7 * u, ey - 7 * u], [x + 7 * u, ey + 7 * u]], lw); p.stroke([[x - 7 * u, ey + 7 * u], [x + 7 * u, ey - 7 * u]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "slack": p.ell(mx, my + 3 * u, 6 * u * k, 8 * u, MOUTH, 2.6 * u); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, nose?: string) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (nose) {
    const nx = cx + 7.5 * u * facing, ny = cy + 8 * u;
    if (nose === "hurt") p.ell(nx, ny, 5.5 * u, 4.5 * u, "#e0727a", 2 * u);
    else if (nose === "bandage") for (const s of [-1, 1])
      p.poly(rotPts([[nx - 10 * u, ny - 3 * u], [nx + 10 * u, ny - 3 * u], [nx + 10 * u, ny + 3 * u], [nx - 10 * u, ny + 3 * u]], s * rad(35), nx, ny), "#f3ece0", 1.8 * u);
    else {
      p.ell(nx, ny, 7 * u, 9.5 * u, nose, 2.4 * u);
      p.ell(nx - 2.4 * u, ny - 3.4 * u, 2 * u, 3.2 * u, mix(nose, WHITE, 0.6), 0);
    }
  }
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
  if (expr === "yell" || expr === "angry") { // cross-popping vein on the temple
    const vx = cx - 30 * u * (facing || 1), vy = cy - 30 * u;
    for (const s of [-1, 1]) for (const t of [-1, 1]) p.arc(vx + s * 4.5 * u, vy + t * 4.5 * u, 3.5 * u, 3.5 * u, s > 0 ? (t > 0 ? 180 : 90) : (t > 0 ? 270 : 0), s > 0 ? (t > 0 ? 270 : 180) : (t > 0 ? 360 : 90), 2.4 * u, "#d8283a");
  }
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "wig" || o.hat === "periwig") {
    // long hair / periwig: a mass behind the head that falls over the shoulders (the face is drawn on top)
    const big = o.hat === "periwig", u = H.a / 50, col = o.hair!;
    const bb = blobPts(cx - (side ? 9 * u : 0), hc + (big ? 0.4 : 0.3) * H.b,
      { ...H, a: H.a * (big ? 1.36 : 1.14), b: H.b * (big ? 1.42 : 1.22), nTop: 2.2, nBot: 2.4, asym: 0, egg: 0, noise: big ? 0.03 : 0.012, seed: H.seed + 5 });
    p.shadedFill(bb, col, mul(col, SH_FELT), light, H.a * 1.3);
    p.inkRing(bb, ow * 0.85, thick);
    const dk = mul(col, [0.72, 0.7, 0.78]);
    if (big) for (const sd of side ? [-1] : [-1, 1]) for (let i = 0; i < 5; i++) {
      const x = cx + sd * H.a * (1.0 + 0.12 * (i % 2)) - (side ? 9 * u : 0), y = hc + H.b * (-0.1 + 0.36 * i);
      p.arc(x, y, 11 * u, 8 * u, sd < 0 ? 90 : -90, sd < 0 ? 300 : 120, 2.4 * u, dk);
    }
    else for (const sd of side ? [-1] : [-1, 1]) p.stroke([[cx + sd * H.a * 0.98, hc + 0.3 * H.b], [cx + sd * H.a * 1.04, hc + 1.2 * H.b]], 1.6 * u, dk);
    return;
  }
  if (o.hat === "veil") {
    const u = H.a / 50, col = o.cap!;
    const bb = blobPts(cx - (side ? 9 * u : 0), hc + 0.35 * H.b, { ...H, a: H.a * 1.2, b: H.b * 1.3, nTop: 2.2, nBot: 2.4, asym: 0, egg: 0, noise: 0.01, seed: H.seed + 5 });
    p.shadedFill(bb, col, mul(col, SH_CLOTH), light, H.a * 1.2);
    p.inkRing(bb, ow * 0.85, thick);
    return;
  }
  if (o.hat === "mitre" && !side) { // two lappets hanging behind the head
    const col = o.cap!;
    for (const sd of [-1, 1]) p.poly([[cx + sd * 0.55 * H.a, hc], [cx + sd * 0.85 * H.a, hc], [cx + sd * 0.9 * H.a, hc + 1.25 * H.b], [cx + sd * 0.6 * H.a, hc + 1.25 * H.b]], col, ow * 0.7);
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "cap" || o.hat === "hair" || o.hat === "wig" || o.hat === "periwig") {
    const hairy = o.hat !== "cap";
    const cut = crown + (o.hat === "cap" ? 0.3 : o.hat === "periwig" ? 0.27 : o.hat === "wig" ? 0.3 : 0.42) * HH;
    const keep = (x: number, y: number) => y < cut || (side && hairy && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (hairy) { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "periwig" && !side) p.stroke([[cx, crown + 4 * u], [cx, cut - 6 * u]], 1.4 * u, mul(col, [0.72, 0.7, 0.78])); // centre parting
    else if (hairy) {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "mitre") {
    // bishop's mitre: tall pointed cap with a gold band round the brow and a gold upright (orphrey)
    const yb = crown + 0.26 * HH, ht = 0.78 * HH, wb = 0.43 * W, col = o.cap!, gold = o.buttons ?? "#e1b84c";
    const pts: P2[] = [...sag(yb, wb)];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([cx + wb - wb * t * 0.9 + 6 * u * Math.sin(t * Math.PI), yb - ht * Math.sin((t * Math.PI) / 2) ** 0.8]); }
    for (let i = 10; i >= 0; i--) { const t = i / 10; pts.push([cx - wb + wb * t * 0.9 - 6 * u * Math.sin(t * Math.PI), yb - ht * Math.sin((t * Math.PI) / 2) ** 0.8]); }
    const body = R(pts);
    p.shadedFill(body, col, mul(col, SH_CLOTH), light, wb, 0.4);
    p.clip(body, () => {
      p.band(R([[cx - wb - 6 * u, yb - 0.06 * HH], [cx + wb + 6 * u, yb - 0.06 * HH]]), gold, 0.11 * HH, 1.2 * u);
      p.band(R([[cx, yb], [cx, yb - ht]]), gold, 0.1 * W, 1.2 * u);
      const [jx, jy] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(jx, jy, 5 * u, 6 * u, "#c8203a", 1.4 * u);
    });
    p.poly(body, null, ow);
  } else if (o.hat === "zucchetto" || o.hat === "veil") {
    // skullcap (clergy) / headscarf front edge: a cap with no brim; clergy keep a fringe of hair below it
    if (o.hat === "zucchetto" && o.hair) hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    const cut = crown + (o.hat === "veil" ? 0.3 : 0.13) * HH;
    const arc = hp.filter(([, y]) => y < cut).map(([x, y]) => [cx + (x - cx) * 1.04, hc + (y - hc) * 1.04] as P2);
    if (arc.length < 3) return;
    arc.sort((a1, b1) => Math.atan2(a1[1] - hc, a1[0] - cx) - Math.atan2(b1[1] - hc, b1[0] - cx));
    const col = o.cap!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
/** ["rapier", k]: k 0 = en garde, 1 = full lunge (sword arm on the facing side) */
export type Prop = null | "icecream" | "shako" | "goblet" | "magnifier" | ["hammer", number] | ["rapier", number]
  /** ["needle", k]: the bodkin slid toward the back of the eye, k 0 = tip at the cheek .. 1 = pushed in (hidden under the face) */
  | ["needle", number] | "quill" | "letter" | "bodkin" | "point"
  /** ["bless", n]: right hand raised in blessing with n fingers up (3 .. 0 once they are cut off) */
  | ["bless", number] | "scroll" | "shovel" | "candle" | "fist"
  /** "paddle": a long soap paddle held down into the kettle; "meat": a chunk raised to the mouth; "meatHold": held up to look at */
  | "paddle" | "meat" | "meatHold";

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave,
    light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit" && !prop) for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else if (Array.isArray(prop) && prop[0] === "rapier") {
    const sd = facing || 1, k = clamp(prop[1], 0, 1), S = sh(sd);
    arms.push({ pts: hang(-sd, 0), front: false });
    arms.push({ pts: [S, [tcx + sd * (1.0 * T.a + (8 + 12 * k) * u), S[1] + (0.2 - 0.1 * k) * HH],
      [tcx + sd * (1.05 * T.a + (16 + 26 * k) * u), S[1] + (0.12 - 0.16 * k) * HH]], front: true });
  } else if (Array.isArray(prop) && prop[0] === "bless") {
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.2 * T.a + 16 * u, S[1] + 0.12 * HH], [tcx + 1.15 * T.a + 12 * u, S[1] - 0.42 * HH]], front: true });
  } else if (prop === "meat") {
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.2 * T.a + 14 * u, S[1] + 0.25 * HH], [tcx + 0.3 * T.a, chin + 0.02 * HH]], front: true });
  } else if (prop === "meatHold") {
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.25 * T.a + 16 * u, S[1] + 0.1 * HH], [tcx + 1.05 * T.a + 6 * u, S[1] - 0.42 * HH]], front: true });
  } else if (prop === "paddle") {
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.2 * T.a + 12 * u, S[1] + 0.3 * HH], [tcx + 1.35 * T.a + 20 * u, S[1] + 0.25 * HH]], front: true });
  } else if (prop === "fist") {
    // a fist shaken overhead
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.25 * T.a + 18 * u, S[1] - 0.15 * HH], [tcx + 1.05 * T.a + 10 * u, S[1] - 0.7 * HH]], front: true });
  } else if (prop === "point") {
    // an accusing arm straight out toward the facing side, index finger drawn in front
    const sd = facing || 1, S = sh(sd);
    arms.push({ pts: hang(-sd, 0), front: false });
    arms.push({ pts: [S, [tcx + sd * (1.15 * T.a + 24 * u), S[1] + 0.02 * HH], [tcx + sd * (1.25 * T.a + 50 * u), S[1] - 0.06 * HH]], front: true });
  } else {
    arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (Array.isArray(prop) && prop[0] === "needle") {
      // the needle arm is drawn late, between the hair and the face (head section)
    } else if (prop === "bodkin") {
      const S = sh(1);
      // raised clear of a periwig: the hand out by the cheek, the bodkin held up to the light
      arms.push({ pts: [S, [tcx + 1.3 * T.a + 16 * u, S[1] + 0.34 * HH], [tcx + 0.95 * T.a + 6 * u, chin + 0.02 * HH]], front: true });
    } else if (prop === "icecream" || prop === "goblet" || prop === "magnifier" || prop === "quill" || prop === "letter" || prop === "scroll" || prop === "candle") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (prop === "shovel") {
      arms.push({ pts: hang(1, 0.3), front: true });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit" && !(Array.isArray(prop) && prop[0] === "rapier")) {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (dress) {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(300, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(sp, ow * 0.9, thick);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      for (let i = 0; i < 4; i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
  }
  if (o.ruff) {
    // pleated millstone collar under the chin: scalloped rim + radial pleats (the head is drawn over its top half)
    const rx = 1.02 * H.a, ry = 0.2 * HH, ry0 = chin + 0.03 * HH, n = 18, rim: P2[] = [];
    for (let i = 0; i < n * 6; i++) {
      const a = (i / (n * 6)) * Math.PI * 2, r = 1 + 0.07 * Math.abs(Math.sin((a * n) / 2));
      rim.push([300 + Math.cos(a) * rx * r, ry0 + Math.sin(a) * ry * r]);
    }
    p.poly(rim, o.ruff, 3.2 * u);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      p.stroke([[300 + Math.cos(a) * rx * 0.45, ry0 + Math.sin(a) * ry * 0.45], [300 + Math.cos(a) * rx * 0.97, ry0 + Math.sin(a) * ry * 0.97]], 1.5 * u, mul(o.ruff, SH_CLOTH));
    }
  }
  // long hair / periwig + band fall over the shoulders: drawn here (head rotation), so held props stay in front of them
  const longHair = o.hat === "wig" || o.hat === "periwig";
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  const headRot: typeof p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  if (longHair) {
    const bodyRot = p.rot;
    p.rot = headRot;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    if (o.band) for (const sd of [-1, 1]) p.poly([[300, chin - 0.02 * HH], [300 + sd * 15 * u, chin - 0.01 * HH], [300 + sd * 12 * u, chin + 0.24 * HH], [300 + sd * 1.5 * u, chin + 0.25 * HH]], o.band, 2.2 * u);
    p.rot = bodyRot;
  }
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "goblet") {
      p.band([[hx, hy - 8 * u], [hx, hy + 6 * u]], "#d8b04a", 3 * u, 1.4 * u, "round");
      p.ell(hx, hy + 7 * u, 8 * u, 2.6 * u, "#d8b04a", 1.6 * u);
      p.poly([[hx - 11 * u, hy - 26 * u], [hx + 11 * u, hy - 26 * u], [hx + 6 * u, hy - 8 * u], [hx - 6 * u, hy - 8 * u]], "#d8b04a", 2 * u);
      p.ell(hx, hy - 26 * u, 11 * u, 3 * u, "#7a1a2a", 1.6 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "magnifier") {
      p.band([[hx, hy + 16 * u], [hx, hy - 8 * u]], "#3a2a24", 4.5 * u, 1.4 * u, "round");
      p.ell(hx, hy - 30 * u, 22 * u, 22 * u, "rgba(200,232,255,0.55)", 3.2 * u);
      p.ell(hx - 7 * u, hy - 37 * u, 6 * u, 8 * u, "rgba(255,255,255,0.7)", 0);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "quill") {
      p.poly([[hx - 2 * u, hy + 4 * u], [hx + 30 * u, hy - 46 * u], [hx + 22 * u, hy - 58 * u], [hx + 8 * u, hy - 30 * u]], "#f6f2e8", 1.8 * u);
      p.stroke([[hx - 3 * u, hy + 8 * u], [hx + 24 * u, hy - 52 * u]], 1.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "letter") {
      p.poly([[hx - 30 * u, hy - 44 * u], [hx + 18 * u, hy - 50 * u], [hx + 22 * u, hy + 8 * u], [hx - 26 * u, hy + 14 * u]], "#f2e8cf", 2 * u);
      for (let i = 0; i < 5; i++) p.stroke([[hx - 22 * u, hy - 36 * u + i * 9 * u], [hx + (10 - (i % 3) * 6) * u, hy - 38 * u + i * 9 * u]], 1.3 * u, "#5a4636");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "bless") {
      // two fingers + thumb raised (the blessing), drawn as short skin strokes with ink rims; stumps once cut
      const n = Math.round(prop[1]);
      for (let i = 0; i < 3; i++) {
        const a = rad(-100 + (i - 1) * 16), L = i < n ? 22 * u : 5 * u;
        p.line([[hx + (i - 1) * 3 * u, hy - 2 * u], [hx + (i - 1) * 3 * u + L * Math.cos(a), hy - 2 * u + L * Math.sin(a)]], skin, 4.2 * u, true);
      }
      p.dot(hx, hy, 6.5 * u);
    } else if (prop === "fist") {
      p.ell(hx, hy, 9 * u, 8 * u, skin, 2.4 * u);
    } else if (prop === "meat" || prop === "meatHold") {
      const my = prop === "meat" ? hy - 4 * u : hy - 12 * u;
      p.poly([[hx - 16 * u, my - 6 * u], [hx - 4 * u, my - 16 * u], [hx + 14 * u, my - 12 * u], [hx + 18 * u, my + 2 * u], [hx + 4 * u, my + 10 * u], [hx - 14 * u, my + 6 * u]], "#c8505a", 2.4 * u);
      p.stroke([[hx - 8 * u, my - 4 * u], [hx + 8 * u, my]], 2.2 * u, "#f2d8d0");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "paddle") {
      p.band([[hx - 4 * u, hy - 50 * u], [hx + 10 * u, hy + 90 * u]], "#9a7048", 4.5 * u, 1.4 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "scroll") {
      p.poly([[hx - 30 * u, hy - 60 * u], [hx + 22 * u, hy - 60 * u], [hx + 22 * u, hy + 4 * u], [hx - 30 * u, hy + 4 * u]], "#efe2bf", 2 * u);
      for (let i = 0; i < 5; i++) p.stroke([[hx - 22 * u, hy - 48 * u + i * 10 * u], [hx + (14 - (i % 3) * 7) * u, hy - 48 * u + i * 10 * u]], 1.4 * u, "#5a4636");
      for (const y of [hy - 62 * u, hy + 6 * u]) p.band([[hx - 34 * u, y], [hx + 26 * u, y]], "#b8925a", 7 * u, 1.4 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "candle") {
      p.band([[hx, hy + 6 * u], [hx, hy - 46 * u]], "#f5ecd6", 6 * u, 1.4 * u);
      p.poly([[hx, hy - 66 * u], [hx + 5 * u, hy - 52 * u], [hx, hy - 47 * u], [hx - 5 * u, hy - 52 * u]], "#ffd25a", 1.4 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "shovel") {
      p.band([[hx - 6 * u, hy - 60 * u], [hx + 10 * u, hy + 80 * u]], "#8a5a34", 4.5 * u, 1.4 * u, "round");
      p.poly([[hx + 1 * u, hy + 78 * u], [hx + 22 * u, hy + 76 * u], [hx + 26 * u, hy + 112 * u], [hx + 12 * u, hy + 122 * u], [hx - 1 * u, hy + 110 * u]], "#7d848c", 2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "bodkin") {
      p.band([[hx, hy + 8 * u], [hx - 8 * u, hy - 62 * u]], "#e4e8ee", 3.4 * u, 1.4 * u, "round");
      p.dot(hx - 8 * u, hy - 62 * u, 2 * u, "#ffffff");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "point") {
      const sd = facing || 1;
      p.band([[hx, hy], [hx + sd * 14 * u, hy - 1.5 * u]], skin, 3.4 * u, 1.3 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "rapier") {
      // thin steel blade from the hand toward the facing side, raised en garde, near level in the lunge
      const sd = facing || 1, k = clamp(prop[1], 0, 1), a = rad(52 - 44 * k), L = 1.0 * HH;
      const tip: P2 = [hx + sd * L * Math.cos(a), hy - L * Math.sin(a)];
      p.band([[hx, hy], tip], "#dfe3ea", 2.6 * u, 1.3 * u, "round");
      p.band([[hx - sd * 9 * u * Math.cos(a), hy + 9 * u * Math.sin(a)], [hx, hy]], "#5a3a24", 4 * u, 1.3 * u, "round");
      const qx = 9 * u * Math.sin(a), qy = 9 * u * Math.cos(a);
      p.band([[hx + sd * 3 * u * Math.cos(a) - sd * qx, hy - 3 * u * Math.sin(a) - qy], [hx + sd * 3 * u * Math.cos(a) + sd * qx, hy - 3 * u * Math.sin(a) + qy]], "#d8b04a", 3 * u, 1.2 * u, "round");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop)) {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  p.rot = headRot;
  if (!longHair) hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  if (o.band && !longHair) { // falling band / cravat: two white tabs under the chin, over the hair that falls on the shoulders
    for (const sd of [-1, 1]) p.poly([[300, chin - 0.02 * HH], [300 + sd * 15 * u, chin - 0.01 * HH], [300 + sd * 12 * u, chin + 0.24 * HH], [300 + sd * 1.5 * u, chin + 0.25 * HH]], o.band, 2.2 * u);
  }
  if (Array.isArray(prop) && prop[0] === "needle") {
    // the bodkin from the hand at the cheek toward the outer corner of the screen-right eye; the head is drawn over it,
    // so as k grows the steel disappears under the face: "behind his own eyeball"
    const k = clamp(prop[1], 0, 1), tgt: P2 = [300 + 0.17 * W, hc + 0.02 * HH];
    const h0: P2 = [300 + 1.08 * W, hc + 0.52 * HH], h1: P2 = [300 + 0.68 * W, hc + 0.32 * HH], hd = lerp2(h0, h1, k);
    const dx = tgt[0] - h1[0], dy = tgt[1] - h1[1], dl = Math.hypot(dx, dy), L = 0.6 * W;
    const tip: P2 = [hd[0] + (dx / dl) * L, hd[1] + (dy / dl) * L];
    p.band([hd, tip], "#e4e8ee", 2.4 * u, 1.2 * u, "round");
    const S = sh(1);
    p.stroke(curve(S, [tcx + 1.3 * T.a + 16 * u, S[1] + 0.16 * HH], hd), 5.2 * u, armCol);
    p.dot(hd[0], hd[1], 5.5 * u);
  }
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && !["hair", "bonnet", "cap", "wig", "periwig"].includes(o.hat);
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout", o.nose);
  p.rot = null;
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && !["hair", "bonnet", "cap", "wig", "periwig"].includes(o.hat);
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** a flying cartoon nose (skin bean, plum ink, soft crescent) on a 200 x 200 canvas */
export const fxNose = (p: Pen, col = SKIN) => {
  p.ell(100, 104, 52, 66, col, 9, 0, 360, -18);
  p.ell(82, 82, 14, 22, mix(col, WHITE, 0.55), 0, 0, 360, -18);
  p.ell(118, 140, 22, 12, mul(col, SH_SKIN), 0, 0, 360, -18);
};

/** candle / torch flame on a 128 x 256 canvas: white-hot core, amber body, flickering lean s in -1..1 */
export const fxFlame = (p: Pen, s = 0) => {
  const lean = 10 * s, g = p.g;
  const glow = g.createRadialGradient(64, 170, 4, 64, 160, 64);
  glow.addColorStop(0, "rgba(255,190,90,0.55)"); glow.addColorStop(1, "rgba(255,150,60,0)");
  g.fillStyle = glow; g.fillRect(0, 60, 128, 196);
  const body: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2, r = 1 - 0.55 * Math.max(0, -Math.sin(a));
    body.push([64 + 30 * r * Math.cos(a) + lean * Math.max(0, -Math.sin(a)) ** 2, 180 + 70 * Math.sin(a) * (Math.sin(a) < 0 ? 1.6 : 0.6)]);
  }
  p.poly(body, "#ffb24a", 0);
  p.ell(64 + lean * 0.3, 190, 15, 30, "#fff2c8", 0);
};

/** cartoon skull on a 400 x 400 canvas; stain = the green copper-salt ring round the nasal opening */
export const fxSkull = (p: Pen, stain = false) => {
  const bone = "#efe6cf", hole = "#3a2a30";
  p.poly([[118, 228], [282, 228], [262, 336], [138, 336]], bone, 10);
  p.ell(200, 168, 142, 132, bone, 10);
  p.ell(150, 205, 40, 44, hole, 0); p.ell(250, 205, 40, 44, hole, 0);
  if (stain) {
    p.ell(200, 262, 56, 40, "rgba(78,168,96,0.62)", 0);
    p.ell(168, 248, 18, 14, "rgba(60,150,80,0.55)", 0); p.ell(236, 276, 16, 12, "rgba(60,150,80,0.55)", 0);
  }
  p.poly([[200, 238], [180, 282], [220, 282]], hole, 0);
  for (let i = 0; i < 6; i++) p.stroke([[150 + i * 20, 300], [150 + i * 20, 328]], 6);
  p.stroke([[136, 300], [264, 300]], 6);
  p.stroke([[250, 70], [232, 104], [252, 124], [238, 150]], 5);
};

// ---------------- Newton short effects ----------------
/** what Newton saw: concentric rings of white, dark and colour pulsing outward (u = 0..1 loops), 500 x 500 */
export const fxRings = (p: Pen, u: number, n = 6) => {
  const g = p.g, cols = ["#ffffff", "#2a2140", "#ff5a4a", "#ffffff", "#2a2140", "#ffd23a", "#ffffff", "#2a2140", "#3ac0ff", "#9a5aff"];
  g.lineCap = "round";
  for (let i = n - 1; i >= 0; i--) {
    const r = 26 + (i + u) * 36;
    if (r > 236) continue;
    g.strokeStyle = INK; g.lineWidth = 26; g.beginPath(); g.arc(250, 250, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = cols[i % cols.length]; g.lineWidth = 18; g.beginPath(); g.arc(250, 250, r, 0, Math.PI * 2); g.stroke();
  }
};
/** Newton's notebook drawing (CUL MS Add. 3975): the eye in profile, the bodkin slid behind it, the rings he saw;
 *  drawn progressively (u 0..1) in brown ink on a transparent 512 x 512 card that lies on the open page */
export const fxSketch = (p: Pen, u: number) => {
  const g = p.g, ink = "#3a2418";
  g.strokeStyle = ink; g.lineCap = "round"; g.lineJoin = "round";
  const seg = (a: number, b: number) => clamp((u - a) / (b - a), 0, 1);
  let k = seg(0, 0.35); // eyeball
  if (k > 0) { g.lineWidth = 9; g.beginPath(); g.arc(230, 250, 120, Math.PI * 0.15, Math.PI * 0.15 + k * Math.PI * 1.85); g.stroke(); }
  k = seg(0.3, 0.45); // cornea bulge + pupil
  if (k > 0) { g.lineWidth = 8; g.beginPath(); g.arc(112, 250, 46, Math.PI * 0.62, Math.PI * (0.62 + 0.76 * k)); g.stroke(); }
  if (u > 0.45) { g.fillStyle = ink; g.beginPath(); g.arc(96, 250, 12, 0, Math.PI * 2); g.fill(); }
  k = seg(0.45, 0.7); // the bodkin: from the lower right, round behind the eyeball
  if (k > 0) {
    g.lineWidth = 8; g.beginPath(); g.moveTo(470, 470);
    g.lineTo(470 - k * 170, 470 - k * 120); g.stroke();
    if (k > 0.6) { g.beginPath(); g.moveTo(300, 350); g.quadraticCurveTo(352, 300, 350, 236 + (1 - k) * 100); g.stroke(); }
  }
  k = seg(0.7, 1); // the rings he saw: three small concentric sets
  for (let i = 0; i < 3; i++) if (k > i / 3) {
    const cx = 120 + i * 100, cy = 70;
    g.lineWidth = 5; for (const r of [10, 20, 30]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
  }
};
/** chalk tally marks scratched on a wall, n = 1..5, 256 x 256 */
export const fxTally = (p: Pen, n: number) => {
  for (let i = 0; i < Math.min(n, 4); i++) {
    p.stroke([[52 + i * 44, 52 + (i % 2) * 6], [46 + i * 44, 210 - (i % 2) * 4]], 16, "#2a2230");
    p.stroke([[52 + i * 44, 52 + (i % 2) * 6], [46 + i * 44, 210 - (i % 2) * 4]], 9, "#f1ece2");
  }
  if (n >= 5) { p.stroke([[30, 190], [226, 70]], 16, "#2a2230"); p.stroke([[30, 190], [226, 70]], 9, "#f1ece2"); }
};
/** the shadow of a noose falling on a wall (soft violet-black, no ink), 256 x 512 */
export const fxNoose = (p: Pen) => {
  const c = "rgba(26,16,40,0.8)", g = p.g;
  g.strokeStyle = c; g.lineCap = "round"; g.lineWidth = 16;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 250); g.stroke();
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(108, 210 + i * 18); g.lineTo(148, 220 + i * 18); g.stroke(); }
  g.lineWidth = 15; g.beginPath(); g.ellipse(128, 360, 66, 96, 0, 0, Math.PI * 2); g.stroke();
};
/** a coin, 200 x 200: real (gold, milled edge, a crowned profile) or fake (dull grey, pitted); crack 0..1 splits it in two */
export const fxCoin = (p: Pen, fake = false, crack = 0) => {
  const base = fake ? "#a8a396" : "#e2b84a", rim = fake ? "#7e7a70" : "#c8952e";
  const half = (sd: number) => {
    const g = p.g; g.save();
    if (crack > 0) {
      g.translate(100, 100); g.rotate(sd * crack * 0.35); g.translate(-100 + sd * crack * 26, -100 + crack * 8);
      g.beginPath(); g.rect(sd < 0 ? -40 : 100, -40, 140, 280); g.clip();
    }
    p.ell(100, 100, 80, 80, rim, 7);
    p.ell(100, 100, 64, 64, base, 0);
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; p.stroke([[100 + 70 * Math.cos(a), 100 + 70 * Math.sin(a)], [100 + 78 * Math.cos(a), 100 + 78 * Math.sin(a)]], 2.5, mul(rim, [0.7, 0.7, 0.7])); }
    p.ell(104, 104, 28, 36, mul(base, [0.86, 0.84, 0.8]), 3); // profile head
    p.poly([[80, 66], [88, 50], [98, 62], [108, 48], [118, 62], [126, 50], [128, 68]], fake ? "#8e8a80" : "#f4d26a", 3); // crown
    p.ell(74, 78, 10, 14, "rgba(255,255,255,0.45)", 0);
    if (fake) for (const [x, y] of [[60, 130], [140, 124], [122, 150], [66, 92]]) p.dot(x, y, 4, "#6e6a62");
    g.restore();
  };
  half(-1); if (crack > 0) half(1);
};
/** a sheet of the case papers / the letter lying flat (tilted card on a desk), 256 x 320, scribble lines, no words */
export const fxPage = (p: Pen, seed = 0) => {
  p.poly([[14, 10], [242, 18], [236, 308], [8, 300]], "#f2e8cf", 6);
  for (let i = 0; i < 9; i++) p.stroke([[36, 50 + i * 28], [200 - rnd(seed, i) * 60, 52 + i * 28]], 4, "#5a4636");
};
/** a soft coloured after-image dot (transparent surround), 128 x 128 */
export const fxGlowDot = (p: Pen, col: string) => {
  const g = p.g, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, col); gr.addColorStop(0.55, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 64, 0, Math.PI * 2); g.fill();
};

// ================= Cadaver Synod short: Rome, 896-897 (and Sergius III, 904) =================
const ROBE_W = "#f1ebde", GOLD = "#e1b84c", CORPSE = "#c9d3b2";
/** Pope Stephen VI: red mozzetta over a white robe, gold-banded white mitre, black beard-moustache */
export const STEPHEN: Outfit = { jacket: "#c4202e", pants: ROBE_W, boots: "#6a1a22", dress: ROBE_W, hat: "mitre", cap: ROBE_W, buttons: GOLD,
  moustache: "#2a1a14", skin: "#f5c9a0", build: "stout" };
/** Formosus, dead nine months: grey-green skin, gold chasuble, white robe, mitre (askew via headTilt) */
export const FORMOSUS: Outfit = { jacket: "#d9a93c", pants: ROBE_W, boots: "#7a5a2a", dress: ROBE_W, hat: "mitre", cap: ROBE_W, buttons: "#c8203a",
  skin: CORPSE, sash: ROBE_W };
/** ... in his burial shroud (dug up) */
export const FORMOSUS_SHROUD: Outfit = { jacket: "#d8d0bc", pants: "#d8d0bc", boots: "#b8ae98", dress: "#d8d0bc", hat: null, skin: CORPSE };
/** ... robes ripped off: a plain sackcloth shift */
export const FORMOSUS_STRIPPED: Outfit = { jacket: "#9a8e78", pants: "#9a8e78", boots: "#7a6e58", dress: "#9a8e78", hat: null, skin: CORPSE };
/** the deacon who answered for the corpse: young, white alb, red stole (sash), tonsured brown hair */
export const DEACON: Outfit = { jacket: ROBE_W, pants: ROBE_W, boots: "#4a3428", dress: ROBE_W, hat: "hair", hair: "#6b4630", sash: "#c4202e", skin: "#ffe0c4" };
/** Sergius, bishop and judge at the synod (purple, white mitre, ginger moustache); later Pope Sergius III (gold) */
export const SERGIUS: Outfit = { jacket: "#6a3c8c", pants: ROBE_W, boots: "#3a2440", dress: ROBE_W, hat: "mitre", cap: ROBE_W, buttons: GOLD, moustache: "#c0682e",
  skin: "#f5d0b0" };
export const SERGIUS_POPE: Outfit = { ...SERGIUS, jacket: "#c4202e", cap: "#f3d27a", buttons: "#c8203a", build: "stout" };
/** Pope Theodore II, who reburied him */
export const THEODORE: Outfit = { jacket: "#c4202e", pants: ROBE_W, boots: "#6a1a22", dress: ROBE_W, hat: "mitre", cap: ROBE_W, buttons: GOLD, skin: "#ffe0c4" };
/** synod clergy: bishops (mitres) and cardinals/priests (skullcaps) in coloured capes over white */
export const CLERIC = (v = 0): Outfit => {
  const capes = ["#5a3c8c", "#2f5d5a", "#8a2a3a", "#3a4a7a", "#7a5a2a"];
  const o: Outfit = { jacket: capes[v % 5], pants: ROBE_W, boots: "#3a2a20", dress: ROBE_W, buttons: GOLD, skin: SKINS[v % 4], hair: ["#3a2a20", "#c8c4bc", "#7a4a2a", "#1e1a1a"][v % 4] };
  return v % 2 ? { ...o, hat: "mitre", cap: ROBE_W } : { ...o, hat: "zucchetto", cap: ["#c4202e", "#6a3c8c"][v % 4 === 0 ? 0 : 1] };
};
/** Roman townsfolk, 897: tunics, cloaks, headscarves */
export const ROMAN = (v = 0): Outfit => {
  const tun = ["#b5653f", "#5d7a3a", "#3f6fb5", "#8c3b4a", "#a88a4a", "#6a5a8a"];
  const o: Outfit = { jacket: tun[v % 6], pants: "#5a4a3a", boots: "#4a3426", skin: SKINS[(v + 1) % 4] };
  return v % 2 ? { ...o, hat: "veil", cap: ["#e9dcc0", "#c8a26a", "#9ab0c8"][v % 3], dress: ["#7a5a3a", "#5a6a4a", "#8a4a3a"][v % 3] }
    : { ...o, hat: v % 4 === 0 ? "cap" : "hair", cap: "#6a4a32", hair: ["#3a2a20", "#1e1a1a", "#7a4a2a"][v % 3], belt: "#4a3424" };
};
/** gravediggers / guards / the strong-arm men */
export const DIGGER = (v = 0): Outfit => ({ jacket: ["#7a6a4a", "#5a4a3a", "#6a5a48"][v % 3], pants: "#3d3a40", boots: "#3a2a20", hat: v % 2 ? "cap" : "hair", cap: "#4a3a2a",
  hair: ["#3a2a20", "#1e1a1a"][v % 2], belt: "#3a2a1a", skin: SKINS[(v + 2) % 4], moustache: v % 2 ? undefined : "#2a1a14" });

/** a buzzing fly on a 160 x 120 canvas; w = wing phase 0/1 */
export const fxFly = (p: Pen, w: number) => {
  p.ell(46, 34, 26, 16, "rgba(220,235,255,0.85)", 4, 0, 360, w ? -40 : -10);
  p.ell(108, 34, 26, 16, "rgba(220,235,255,0.85)", 4, 0, 360, w ? 40 : 10);
  p.ell(78, 66, 22, 28, "#2a2630", 5);
  p.dot(70, 54, 5, "#c83a3a"); p.dot(86, 54, 5, "#c83a3a");
};
/** a cut-off finger (cartoon stick, no gore) on a 120 x 240 canvas */
export const fxFinger = (p: Pen, skin = CORPSE) => {
  p.line([[60, 40], [60, 200]], skin, 46, true);
  p.ell(60, 52, 14, 10, "#e8e2d2", 3);
};
/** whisper squiggle (rumour) on a 300 x 200 canvas; t 0..1 grows the curl */
export const fxWhisper = (p: Pen, t: number) => {
  const pts: P2[] = [];
  const n = Math.max(2, Math.round(40 * t));
  for (let i = 0; i < n; i++) { const a = i * 0.45; pts.push([30 + i * 6, 100 + Math.sin(a) * 30 * (1 - i / 60)]); }
  p.line(pts, "#ffffff", 9, true);
  for (let k = 0; k < 3; k++) if (t > 0.3 + k * 0.2) p.ell(250 + k * 14, 60 - k * 18, 7 + k * 3, 7 + k * 3, "#ffffff", 4);
};
/** soft gold halo / miracle glow on a 512 x 512 canvas */
export const fxHalo = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, "rgba(255,246,200,0.6)"); gr.addColorStop(0.35, "rgba(255,220,120,0.3)"); gr.addColorStop(1, "rgba(255,200,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
};
/** a four-point sparkle on a 200 x 200 canvas; s = size 0..1 */
export const fxSparkle = (p: Pen, s: number) => {
  const r = 90 * s, k = 18 * s;
  p.poly([[100, 100 - r], [100 + k, 100 - k], [100 + r, 100], [100 + k, 100 + k], [100, 100 + r], [100 - k, 100 + k], [100 - r, 100], [100 - k, 100 - k]], "#fff2a8", 6);
};
/** jagged crack growing down a wall on a 512 x 1024 canvas; u 0..1 */
export const fxCrack = (p: Pen, u: number, seed = 1) => {
  const pts: P2[] = [[256, 0]];
  const n = Math.max(1, Math.round(14 * u));
  for (let i = 1; i <= n; i++) pts.push([256 + (rnd(seed, i) - 0.5) * 180, (i / 14) * 1000]);
  p.stroke(pts, 20, "#1a1218");
  for (let i = 3; i <= n; i += 4) { const [x, y] = pts[i]; p.stroke([[x, y], [x + (rnd(seed, i + 40) - 0.5) * 260, y + 90]], 11, "#1a1218"); }
};
/** a falling chunk of masonry on a 200 x 200 canvas */
export const fxRubble = (p: Pen, seed = 0) => {
  const pts: P2[] = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, r = 60 + rnd(seed, i) * 35; pts.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]); }
  p.poly(pts, "#b8ad9c", 8);
  p.stroke([[80, 90], [120, 110]], 5, "#8a8070");
};
/** looming shadow of a strangler on a wall, 512 x 768 canvas (hands raised); k 0..1 hands closing */
export const fxLurker = (p: Pen, k: number) => {
  const c = "rgba(20,12,34,0.82)", g = p.g;
  g.fillStyle = c;
  g.beginPath(); g.ellipse(256, 200, 80, 92, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(130, 768); g.quadraticCurveTo(110, 330, 256, 290); g.quadraticCurveTo(402, 330, 382, 768); g.fill();
  g.strokeStyle = c; g.lineCap = "round"; g.lineWidth = 46;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(256 + s * 110, 360); g.quadraticCurveTo(256 + s * 220, 240, 256 + s * (170 - 60 * k), 120); g.stroke();
    g.beginPath(); g.arc(256 + s * (170 - 60 * k), 110, 38, 0, Math.PI * 2); g.fill();
  }
};
/** the robe flying off (a tumbling cloth) on a 300 x 300 canvas */
export const fxRobe = (p: Pen, col = "#d9a93c") => {
  p.poly([[60, 60], [240, 40], [270, 230], [150, 270], [40, 220]], col, 8);
  p.stroke([[150, 50], [150, 260]], 18, "#f1ebde");
};
/** angry zig-zag shout lines on a 400 x 300 canvas; t 0..1 */
export const fxShout = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const a = rad(-30 + i * 30), r0 = 40 + 120 * t, r1 = r0 + 90, x0 = 60, y0 = 150;
    const pts: P2[] = [];
    for (let k = 0; k <= 4; k++) { const r = r0 + ((r1 - r0) * k) / 4, o = (k % 2 ? 14 : -14); pts.push([x0 + r * Math.cos(a) - o * Math.sin(a), y0 + r * Math.sin(a) + o * Math.cos(a)]); }
    p.stroke(pts, 9, "#ffffff");
  }
};
/** torn paper scraps (the cancelled verdict) on a 120 x 120 canvas */
export const fxScrap = (p: Pen, seed = 0) => {
  p.poly([[10 + rnd(seed, 1) * 20, 14], [110, 8 + rnd(seed, 2) * 20], [104, 108], [16, 100 - rnd(seed, 3) * 20]], "#efe2bf", 5);
  p.stroke([[30, 50], [90, 46]], 4, "#5a4636");
};
/** a painted saint's icon panel (gold ground, haloed bust) on a 256 x 384 canvas */
export const fxIcon = (p: Pen, v = 0, bow = 0) => {
  p.poly([[8, 8], [248, 8], [248, 376], [8, 376]], "#d9a93c", 10);
  p.rot = bow ? [rad(-38 * bow), 128, 360] : null; // the saint bows at the waist toward the tomb
  p.ell(128, 130, 72, 72, "#f3d27a", 6);
  p.ell(128, 140, 46, 52, ["#f5c9a0", "#ecd0b6", "#e8b890"][v % 3], 6);
  p.poly([[60, 376], [70, 230], [128, 200], [186, 230], [196, 376]], ["#3a4a9a", "#9a2a3a", "#2f6d5a"][v % 3], 6);
  p.stroke([[110, 130], [118, 130]], 5); p.stroke([[138, 130], [146, 130]], 5);
  p.arc(128, 160, 10, 5, 20, 160, 4);
  p.rot = null;
};

// ================= The Kentucky Meat Shower, 1876 =================
/** Mrs. Crouch: work dress, apron (sash), bonnet */
export const CROUCH: Outfit = { jacket: "#7a5aa8", pants: "#3a3040", boots: "#3a2a20", dress: "#6a4a98", hat: "bonnet", sash: "#efe6d4", skin: "#f5d0b0" };
/** the two men who tasted it: farm clothes, slouch caps, beards (moustache) */
export const TASTER_A: Outfit = { jacket: "#6a7a4a", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#5a4632", belt: "#3a2a1a", moustache: "#5a3a24", skin: "#efc6a0", buttons: "#c8b07a" };
export const TASTER_B: Outfit = { jacket: "#a8643a", pants: "#3a3a48", boots: "#2a2024", hat: "tophat", moustache: "#c89a5a", skin: "#ffe0c4", belt: "#2a1a14", build: "stout" };
/** the scientist who said algae: grey suit, dark hair, moustache */
export const SCIENTIST: Outfit = { jacket: "#5a5e6a", pants: "#2e2e36", boots: "#1e1a1e", hat: "hair", hair: "#2a1e18", moustache: "#2a1e18", buttons: "#c8ccd4", skin: "#f5d0b0" };
/** the doctor at the microscope: black frock coat, grey hair, side whiskers */
export const DOCTOR: Outfit = { jacket: "#2a2a3a", pants: "#2a2630", boots: "#1e1a1e", hat: "hair", hair: "#b8b4ac", moustache: "#9a968e", buttons: "#d8b04a", skin: "#ffe0c4", band: "#f4f1e8", build: "stout" };

/** a chunk of raw meat on a 200 x 200 canvas */
export const fxMeat = (p: Pen, seed = 0) => {
  const pts: P2[] = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = 62 + rnd(seed, i) * 30; pts.push([100 + r * Math.cos(a), 100 + 0.8 * r * Math.sin(a)]); }
  p.poly(pts, "#c8424e", 8);
  p.stroke([[70, 85], [100, 95], [135, 80]], 9, "#f4d6cc");
  p.stroke([[80, 125], [118, 118]], 7, "#f4d6cc");
  p.ell(120, 72, 14, 9, "#e07882", 0);
};
/** a splat ring on landing, 300 x 300 canvas, t 0..1 */
export const fxSplat = (p: Pen, t: number) => {
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45 + 20), d = 40 + 90 * t, r = 14 * (1 - t) + 4;
    p.ell(150 + d * Math.cos(a), 150 + d * 0.6 * Math.sin(a), r, r, "#c8424e", 4);
  }
};
/** a thought bubble with a picture inside, 400 x 400 canvas: sheep, deer, algae, horse, baby */
export const fxBubble = (p: Pen, kind: "sheep" | "deer" | "algae" | "horse" | "baby") => {
  p.ell(70, 360, 14, 12, "#ffffff", 6); p.ell(110, 318, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([230 + (150 + 10 * Math.sin(a * 9)) * Math.cos(a), 170 + (125 + 10 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  const cx = 230, cy = 175;
  if (kind === "sheep") {
    for (let i = 0; i < 7; i++) p.ell(cx - 50 + (i % 4) * 32, cy - 20 + Math.floor(i / 4) * 34, 30, 26, "#f4f0e6", 5);
    p.ell(cx + 82, cy - 20, 24, 30, "#3a3038", 5);
    for (const x of [-40, -10, 25, 50]) p.stroke([[cx + x, cy + 30], [cx + x, cy + 75]], 9);
  } else if (kind === "deer") {
    p.ell(cx - 10, cy + 10, 70, 38, "#b07848", 6);
    p.ell(cx + 72, cy - 40, 24, 28, "#b07848", 6); p.stroke([[cx + 50, cy - 20], [cx + 62, cy - 30]], 14, "#b07848");
    for (const s of [-1, 1]) p.stroke([[cx + 72 + s * 8, cy - 64], [cx + 72 + s * 26, cy - 108], [cx + 72 + s * 40, cy - 100]], 7, "#5a3a24");
    for (const x of [-50, -25, 30, 50]) p.stroke([[cx + x, cy + 40], [cx + x, cy + 90]], 8);
  } else if (kind === "algae") {
    for (let i = 0; i < 6; i++) p.ell(cx - 70 + i * 28, cy + 10 * Math.sin(i * 1.7), 26, 22, ["#5aa04a", "#7ab85a", "#4a8a3a"][i % 3], 5);
    p.stroke([[cx - 90, cy + 40], [cx + 90, cy + 40]], 6, "#3a6a8a");
  } else if (kind === "horse") {
    p.ell(cx - 10, cy + 10, 78, 40, "#8a5a3a", 6);
    p.poly([[cx + 50, cy - 10], [cx + 80, cy - 80], [cx + 120, cy - 70], [cx + 104, cy - 50], [cx + 78, cy + 10]], "#8a5a3a", 6);
    p.stroke([[cx + 76, cy - 80], [cx + 50, cy - 30]], 10, "#3a2418");
    for (const x of [-55, -30, 30, 55]) p.stroke([[cx + x, cy + 40], [cx + x, cy + 95]], 9);
  } else {
    // a baby's bonnet and rattle
    p.ell(cx - 30, cy + 10, 62, 56, "#f6d8e0", 6); p.ell(cx - 30, cy + 22, 40, 36, "#ffe2c2", 5);
    p.dot(cx - 44, cy + 16, 4); p.dot(cx - 16, cy + 16, 4); p.arc(cx - 30, cy + 34, 8, 5, 20, 160, 3);
    p.stroke([[cx + 50, cy + 60], [cx + 90, cy - 10]], 9, "#e8c45a"); p.ell(cx + 95, cy - 24, 22, 22, "#7ab8e8", 5);
  }
};
/** the view down the microscope (round field), 512 x 512 canvas: lung (air sacs), muscle (striped fibres), cartilage (cells) */
export const fxScope = (p: Pen, kind: "lung" | "muscle" | "cartilage") => {
  const g = p.g;
  g.fillStyle = "#0e0a12"; g.fillRect(0, 0, 512, 910);
  g.translate(0, 199);
  g.save(); g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#fbe6e6"; g.fillRect(0, 0, 512, 512);
  if (kind === "lung") for (let i = 0; i < 22; i++) { const x = 60 + (i % 5) * 96 + (Math.floor(i / 5) % 2) * 40, y = 70 + Math.floor(i / 5) * 92; p.ell(x, y, 40, 34, "#fbe6e6", 0); g.strokeStyle = "#d8506a"; g.lineWidth = 10; g.beginPath(); g.ellipse(x, y, 42, 36, 0, 0, Math.PI * 2); g.stroke(); }
  else if (kind === "muscle") for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "#e07a8a" : "#c8505e"; g.fillRect(0, 40 + i * 76, 512, 60);
    for (let x = 0; x < 512; x += 18) { g.fillStyle = "rgba(120,20,40,0.45)"; g.fillRect(x, 40 + i * 76, 6, 60); }
  } else { g.fillStyle = "#dfe6f2"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 18; i++) { const x = 60 + (i * 97) % 400, y = 60 + ((i * 61) % 400); p.ell(x, y, 30, 22, "#b8c8e8", 5); p.dot(x, y, 9, "#6a5aa8"); } }
  g.restore();
  g.strokeStyle = "#241726"; g.lineWidth = 16; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
  g.setTransform(1, 0, 0, 1, 0, 0);
};
/** a turkey vulture (black body, bald red head), 400 x 240 canvas; w = wing phase 0/1/2, gag = mouth open */
export const fxVulture = (p: Pen, w: number, gag = false) => {
  const up = [-50, 0, 40][w];
  for (const s of [-1, 1]) p.poly([[200, 130], [200 + s * 60, 110 + up * 0.4], [200 + s * 190, 110 + up], [200 + s * 150, 150 + up * 0.6], [200 + s * 60, 150]], "#2a2228", 6);
  p.ell(200, 140, 46, 30, "#2a2228", 6);
  p.ell(200, 92, 22, 22, "#d8505a", 5);
  p.dot(192, 88, 4); p.dot(208, 88, 4);
  if (gag) p.ell(200, 108, 9, 10, "#5a1e28", 3);
  else p.poly([[194, 104], [206, 104], [200, 116]], "#f0e6d0", 3);
};
/** the surviving sample in its jar, 300 x 420 canvas */
export const fxJar = (p: Pen) => {
  p.poly([[60, 90], [240, 90], [250, 380], [240, 400], [60, 400], [50, 380]], "rgba(210,236,240,0.55)", 8);
  p.ell(150, 330, 70, 50, "#d8b090", 0);
  p.poly([[100, 300], [140, 280], [190, 300], [195, 350], [150, 370], [105, 350]], "#b8606a", 6);
  p.stroke([[120, 320], [170, 316]], 6, "#f4d6cc");
  p.poly([[50, 50], [250, 50], [250, 92], [50, 92]], "#3a3030", 8);
  p.stroke([[80, 120], [80, 360]], 12, "rgba(255,255,255,0.6)");
  p.poly([[90, 200], [210, 200], [210, 250], [90, 250]], "#efe2bf", 5);
  p.stroke([[110, 218], [190, 218]], 4, "#5a4636"); p.stroke([[110, 234], [170, 234]], 4, "#5a4636");
};
