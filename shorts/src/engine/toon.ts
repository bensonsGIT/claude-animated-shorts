// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
export const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
export const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
export const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
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
  /** round spectacles, a white stock (neckcloth) under the chin, long hair down to the shoulders (Franklin short) */
  specs?: boolean; stock?: string; long?: boolean;
  /** plain white falling band / cravat under the chin (17th-century England) */
  band?: string;
  /** beard colour + style (Peter short): long to the belly, forked, scruffy, short; stubble = freshly shaved jaw */
  beard?: string; beardStyle?: "long" | "fork" | "scruffy" | "short"; stubble?: boolean;
  /** Stranger short: a narrow necktie (the borrowed black tie) */
  tie?: string;
};
export type P2 = [number, number];

export const rad = (d: number) => (d * Math.PI) / 180;
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
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
export const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
export const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
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

export const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

export const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
export const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
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
export const DEF_LIGHT = rad(-120);

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
  skin: string, moustache?: string, stout = false, nose?: string, specs = false) => {
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
  if (specs) {
    for (const side of [-1, 1]) p.ell(fx + side * ex, ey, 11 * u, 10 * u, null, 2.4 * u);
    p.arc(fx, ey - 1 * u, ex - 11 * u, 3 * u, 200, 340, 2.2 * u);
    for (const side of [-1, 1]) p.stroke([[fx + side * (ex + 11 * u), ey - 2 * u], [fx + side * (ex + 21 * u), ey - 4 * u]], 2.2 * u);
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
  if (o.long && (!o.hat || o.hat === "hair" || o.hat === "frizz")) {
    // long hair at the sides and back, falling to the shoulders (the crown stays bald)
    const col = o.hair!, lb = blobPts(cx, hc + 0.5 * H.b, { ...H, a: H.a * 1.16, b: H.b * 0.82, asym: 0, egg: -0.2, seed: H.seed + 5 });
    p.shadedFill(lb, col, mul(col, SH_FELT), light, H.a * 1.1);
    p.inkRing(lb, ow * 0.85, thick);
  }
  if (o.hat === "curls") {
    // 1930s-40s women's hair: a soft mass of curls framing the face down to the jaw, scalloped all round, curl swirls
    const col = o.hair!, ccx = cx - (side ? 8 * H.a / 50 : 0), ccy = hc + 0.2 * H.b, pts: P2[] = [];
    for (let i = 0; i < 112; i++) {
      const t = (i / 112) * Math.PI * 2, k = 1 + 0.055 * Math.abs(Math.cos(7 * t));
      pts.push([ccx + 1.24 * H.a * k * Math.cos(t), ccy + 1.12 * H.b * k * Math.sin(t)]);
    }
    p.shadedFill(pts, col, mul(col, SH_FELT), light, H.a * 1.3, 0.35);
    p.inkRing(pts, ow * 0.85, thick);
    const dk = mul(col, [0.66, 0.64, 0.72]), u = H.a / 50;
    for (let i = 0; i < 9; i++) {
      const t = Math.PI * (0.05 + (0.9 * i) / 8) + Math.PI / 2, rr = 1.1;
      p.arc(ccx + rr * H.a * Math.cos(t) * (i % 2 ? 1 : -1), ccy + 0.85 * H.b * Math.sin(t) * 0.6 + 0.25 * H.b, 7 * u, 6 * u, 200, 470, 1.6 * u, dk);
    }
  }
  if (o.hat === "frizz") {
    const seed = H.seed, u = (2 * H.a) / 100;
    void u;
    // hair standing on end after the shock: spikes all round the crown, singed dark at the tips
    const col = o.hair!, pts: P2[] = [], n = 15;
    for (let i = 0; i <= n * 2; i++) {
      const ang = rad(160 + (220 * i) / (n * 2)), r = (i % 2 ? 1.05 : 1.42 + 0.12 * rnd(seed, i)) * H.a;
      pts.push([cx + r * Math.cos(ang), hc + 0.15 * H.b + r * Math.sin(ang)]);
    }
    p.shadedFill(pts, col, mul(col, SH_FELT), light, H.a * 1.3, 0.35);
    p.poly(pts, null, ow);
    for (let i = 0; i <= n * 2; i += 2) { const [x, y] = pts[i]; p.dot(x, y, 4 * H.a / 50, "#3a3036"); }
    return;
  }
  if (o.hat === "wig" || o.hat === "periwig" || (o.hat === "tricorn" && o.hair)) {
    // long hair / periwig: a mass behind the head that falls over the shoulders (the face is drawn on top)
    const big = o.hat === "periwig", u = H.a / 50, col = o.hair!; // tricorn: shoulder-length curls under the hat
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
  if (o.hat === "battered") { // Crime and Punishment: Raskolnikov's worn tall round hat, dented, a rusty patch, over his hair
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
    hatOn(p, { ...o, hat: "tophat", hair: undefined }, hp, H, cx, hc, light, seed, facing, side);
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wt = 0.33 * W;
    p.stroke(R([[cx - wt * 0.7, yb - ht * 0.95], [cx - wt * 0.1, yb - ht * 0.78], [cx + wt * 0.5, yb - ht * 0.98]]), 2.6 * u, "#5a5060"); // the dent
    p.poly(R([[cx + wt * 0.15, yb - ht * 0.55], [cx + wt * 0.7, yb - ht * 0.5], [cx + wt * 0.62, yb - ht * 0.32], [cx + wt * 0.12, yb - ht * 0.36]]), "#6a4a3a", 1.6 * u); // a rusty patch
    return;
  }
  if (o.hat === "fur" || o.hat === "furcap") {
    // boyar's tall fur hat (gorlatnaya, wider at the top) / a merchant's low cap with a fur band
    const tallH = o.hat === "fur", yb = crown + (tallH ? 0.24 : 0.2) * HH, ht = (tallH ? 0.95 : 0.42) * HH;
    const wb = (tallH ? 0.47 : 0.5) * W, wt = (tallH ? 0.56 : 0.4) * W, fur = "#5a3e2a";
    if (!tallH) { // velvet crown dome
      const dome = R([...sag(yb, wb * 0.92).reverse(), ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (i / 12) * Math.PI; return [cx + wb * 0.92 * Math.cos(a), yb - 0.12 * HH + ht * 0.9 * Math.sin(a)] as P2; })]);
      p.shadedFill(dome, o.cap ?? "#8a2a2a", mul(o.cap ?? "#8a2a2a", SH_FELT), light, wb, 0.4); p.poly(dome, null, ow);
    }
    const bh = tallH ? ht : 0.16 * HH, bt = tallH ? wt : wb * 1.04;
    const body = R([...sag(yb, wb).reverse(), [cx - bt, yb - bh], [cx - bt * 0.6, yb - bh - 4 * u], [cx, yb - bh - 6 * u], [cx + bt * 0.6, yb - bh - 4 * u], [cx + bt, yb - bh]]);
    p.shadedFill(body, fur, mul(fur, SH_FELT), light, bt, 0.4);
    p.clip(body, () => { for (let i = 0; i < 26; i++) { const x = cx - bt + ((i + 0.5) / 26) * 2 * bt, y0 = yb - bh + rnd(seed, 40 + i) * bh * 0.5; p.stroke(R([[x, y0], [x + 3 * u, y0 + 9 * u]]), 1.6 * u, mul(fur, [0.62, 0.6, 0.66])); } });
    p.poly(body, null, ow);
    if (tallH) { const [tx, ty] = R([[cx, yb - bh - 3 * u]])[0]; p.ell(tx, ty, bt * 0.9, 5 * u, mix(fur, "#ffffff", 0.12), 2.2 * u, 0, 360, (a * 180) / Math.PI); }
  } else if (o.hat === "tricorn") {
    hatOn(p, { ...o, hat: "wig" }, hp, H, cx, hc, light, seed, facing, side);
    const yb = crown + 0.2 * HH, col = "#1e1c26", gold = "#d9b04a";
    const brim: P2[] = R([[cx - 0.66 * W, yb + 2 * u], [cx - 0.5 * W, yb - 0.2 * HH], [cx - 0.3 * W, yb - 0.36 * HH], [cx, yb - 0.42 * HH], [cx + 0.3 * W, yb - 0.36 * HH],
      [cx + 0.5 * W, yb - 0.2 * HH], [cx + 0.66 * W, yb + 2 * u], [cx + 0.3 * W, yb + 0.02 * HH], [cx, yb + 0.1 * HH], [cx - 0.3 * W, yb + 0.02 * HH]]);
    p.shadedFill(brim, col, mul(col, SH_FELT), light, 0.6 * W, 0.4);
    p.stroke(R([[cx - 0.62 * W, yb], [cx - 0.3 * W, yb + 0.0 * HH], [cx, yb + 0.07 * HH], [cx + 0.3 * W, yb + 0.0 * HH], [cx + 0.62 * W, yb]]), 3.2 * u, gold);
    p.poly(brim, null, ow);
  } else if (o.hat === "shako" || o.hat === "shako_tall") {
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
  } else if (o.hat === "curls") {
    hatOn(p, { ...o, hat: "hair" }, hp, H, cx, hc, light, seed, facing, side);
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
  } else if (o.hat === "tricornFlat") { // Franklin short (1750): felt crown + upturned brim, no wig
    const yb = crown + 0.27 * HH, col = "#2a2530";
    const cr = R(ellPts(cx, yb - 0.08 * HH, 0.34 * W, 0.24 * HH, 180, 360));
    p.shadedFill(cr, col, mul(col, SH_FELT), light, 0.33 * W, 0.4);
    p.poly(cr, null, ow);
    const brim = R([[cx - 0.66 * W, yb - 0.2 * HH], [cx - 0.3 * W, yb - 0.02 * HH], [cx + 4 * u * facing, yb + 0.07 * HH], [cx + 0.3 * W, yb - 0.02 * HH],
      [cx + 0.66 * W, yb - 0.2 * HH], [cx + 0.45 * W, yb - 0.3 * HH], [cx, yb - 0.17 * HH], [cx - 0.45 * W, yb - 0.3 * HH]]);
    p.shadedFill(brim, col, mul(col, SH_FELT), light, 0.6 * W, 0.4);
    p.poly(brim, null, ow);
    p.stroke(R([[cx - 0.62 * W, yb - 0.21 * HH], [cx + 4 * u * facing, yb + 0.05 * HH], [cx + 0.62 * W, yb - 0.21 * HH]]), 2.4 * u, "#c9a24a");
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

// ---------------- beards (Peter short) ----------------
/** a front-view beard on the lower face: top edge just above the mouth (mouth + moustache are drawn over it), sides
 *  following the jaw, hanging to the chest / belly; forked = two points. Clockwise on screen for inkRing. */
const beardFront = (p: Pen, o: Outfit, cx: number, hc: number, H: Blob, chin: number, HH: number, u: number, light: number, thick: number, ow: number) => {
  const st = o.beardStyle ?? "long", col = o.beard!;
  const L = st === "long" ? 1.0 : st === "fork" ? 0.9 : st === "scruffy" ? 0.42 : 0.24;
  const a = H.a, top = hc + 0.1 * H.b, ys = chin + L * HH;
  const right: P2[] = [[cx + 1.0 * a, top], [cx + 1.04 * a, hc + 0.5 * H.b], [cx + 0.9 * a, chin + 0.12 * L * HH]];
  if (st === "fork") right.push([cx + 0.62 * a, ys - 0.2 * HH], [cx + 0.34 * a, ys], [cx + 0.14 * a, ys - 0.16 * HH], [cx, ys - 0.42 * L * HH]);
  else if (st === "scruffy") right.push([cx + 0.6 * a, ys - 0.08 * HH], [cx + 0.42 * a, ys - 0.02 * HH], [cx + 0.25 * a, ys - 0.07 * HH], [cx + 0.1 * a, ys], [cx, ys - 0.04 * HH]);
  else right.push([cx + 0.62 * a, ys - 0.3 * L * HH], [cx + 0.25 * a, ys - 0.05 * HH], [cx, ys]);
  const left = right.slice(0, right.length - 1).map(([x, y]) => [2 * cx - x, y] as P2).reverse();
  const topEdge: P2[] = [[cx - 0.55 * a, hc + 0.36 * H.b], [cx, hc + 0.3 * H.b], [cx + 0.55 * a, hc + 0.36 * H.b]];
  const pts = [...right, ...left, ...topEdge];
  const sm: P2[] = [];
  for (let i = 0; i < pts.length; i++) { const A = pts[i], B = pts[(i + 1) % pts.length]; for (let k = 0; k < 6; k++) sm.push(lerp2(A, B, k / 6)); }
  p.shadedFill(sm, col, mul(col, SH_FELT), light, a * 1.2, 0.35);
  const dk = mul(col, [0.66, 0.64, 0.72]);
  p.clip(sm, () => { for (let i = 0; i < 9; i++) { const x = cx + (i - 4) * 0.2 * a; p.stroke(curve([x, hc + 0.55 * H.b], [x + 0.04 * a * (i - 4), (hc + ys) / 2 + 0.2 * H.b], [x * 0.9 + cx * 0.1, ys - 0.05 * HH]), 1.4 * u, dk); } });
  p.inkRing(sm, ow * 0.85, thick);
};
/** a cut-off beard hanging from a hand at (x, y): tied at the top with string, s = length scale */
const beardBundle = (p: Pen, x: number, y: number, col: string, u: number, s: number) => {
  const Lb = 70 * u * s, w = 16 * u;
  const pts: P2[] = [[x + w * 0.5, y], [x + w, y + Lb * 0.35], [x + w * 0.7, y + Lb * 0.8], [x + 2 * u, y + Lb], [x - w * 0.6, y + Lb * 0.82], [x - w, y + Lb * 0.35], [x - w * 0.5, y]];
  p.poly(pts, col, 2.2 * u);
  const dk = mul(col, [0.66, 0.64, 0.72]);
  for (let i = -1; i <= 1; i++) p.stroke([[x + i * 5 * u, y + 8 * u], [x + i * 6 * u + u, y + Lb * 0.8]], 1.2 * u, dk);
  p.band([[x - w * 0.55, y + 6 * u], [x + w * 0.55, y + 6 * u]], "#c8a46a", 2.6 * u, 1 * u);
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
  | "paddle" | "meat" | "meatHold"
  /** Peter short: a raised straight razor; a fat coin purse held out; a kopek / beard token held up; a coin bitten;
   *  ["deal", beardColour]: beard raised in the left hand, coin in the right; ["beardOut", k, colour]: a cut-off beard
   *  pulled out of the coat, k 0 = hand at the chest .. 1 = held up beside the face */
  /** Franklin short: ["touch", k] reaching for the live wire; "writeQuill" seated at the desk; a fork; hand on chest; finger on lips */
  | ["touch", number] | "writeQuill" | "fork" | "chest" | "shush"
  | "razor" | "purse" | "kopek" | "token" | "bite" | "chin" | ["deal", string] | ["beardOut", number, string]
  /** Stranger short: a cigarette held by the mouth; a coffee cup held in front; a small wooden cross held up */
  | "cigarette" | "cup" | "cross"
  /** ["gun", k]: a revolver, k 0 = held down by the leg .. 1 = arm straight out toward the facing side;
   *  ["knife", k]: a short blade, k 0 = held low .. 1 = raised in front of the chest toward the facing side */
  | ["gun", number] | ["knife", number];

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** dinner napkin tucked in at the collar */
  bib?: boolean;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave, bib = false,
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
  const handProp = prop === "writeQuill" || prop === "fork" || prop === "chest" || prop === "shush";
  const propArm = (): Arm => {
    const S = sh(1);
    if (prop === "writeQuill") return { pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.45 * T.a, S[1] + 0.55 * HH]], front: true };
    if (prop === "fork") return { pts: [S, [tcx + 1.25 * T.a + 14 * u, S[1] + 0.22 * HH], [tcx + 1.12 * T.a + 12 * u, S[1] - 0.28 * HH]], front: true };
    if (prop === "chest") return { pts: [S, [tcx + 0.95 * T.a, S[1] + 0.42 * HH], [tcx + 0.12 * T.a, chin + 0.3 * HH]], front: true };
    return { pts: [S, [tcx + 1.0 * T.a + 6 * u, S[1] + 0.3 * HH], [300 + 8 * u * facing, chin - 0.12 * HH]], front: true }; // shush
  };
  if (mode === "sit" && handProp) for (const side of [-1, 1]) arms.push(side > 0 && handProp ? propArm() : { pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "sit" && !prop) for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else if (handProp) { arms.push({ pts: hang(-1, 0), front: false }); arms.push(propArm()); }
  else if (Array.isArray(prop) && prop[0] === "touch") {
    // reaching for the live wire on the facing side; the other hand hangs on to the chain
    const sd = facing || 1, k = clamp(prop[1], 0, 1), S = sh(sd);
    arms.push({ pts: hang(-sd, 0), front: false });
    arms.push({ pts: [S, [tcx + sd * (1.0 * T.a + (8 + 10 * k) * u), S[1] + (0.2 - 0.12 * k) * HH], [tcx + sd * (1.05 * T.a + (16 + 28 * k) * u), S[1] + (0.32 - 0.36 * k) * HH]], front: true });
  }
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
  } else if (prop === "razor" || prop === "kopek" || prop === "token") {
    // raised clear of the head (the head is drawn over anything inside its outline)
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.45 * T.a + 24 * u, S[1] + 0.05 * HH], [tcx + 1.32 * T.a + 18 * u, S[1] - 0.48 * HH]], front: true });
  } else if (Array.isArray(prop) && prop[0] === "deal") {
    for (const sd of [-1, 1]) { const S = sh(sd); arms.push({ pts: [S, [tcx + sd * (1.5 * T.a + 26 * u), S[1] + 0.02 * HH], [tcx + sd * (1.4 * T.a + 22 * u), S[1] - 0.55 * HH]], front: true }); }
  } else if (Array.isArray(prop) && prop[0] === "beardOut") {
    const S = sh(1), k = clamp(prop[1], 0, 1);
    arms.push({ pts: hang(-1, 0), front: false });
    const H0: P2 = [tcx + 0.15 * T.a, chin + 0.45 * HH], H1: P2 = [tcx + 1.38 * T.a + 20 * u, S[1] - 0.5 * HH];
    const Hd = lerp2(H0, H1, k), E = lerp2([tcx + 0.9 * T.a + 6 * u, S[1] + 0.42 * HH], [tcx + 1.25 * T.a + 16 * u, S[1] + 0.1 * HH], k);
    arms.push({ pts: [S, E, Hd], front: true });
  } else if (prop === "bite" || prop === "chin" || prop === "cigarette") {
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.2 * T.a + 14 * u, S[1] + 0.25 * HH], [tcx + 0.3 * T.a, chin + 0.02 * HH]], front: true });
  } else if (prop === "fist") {
    // a fist shaken overhead
    const S = sh(1);
    arms.push({ pts: hang(-1, 0), front: false });
    arms.push({ pts: [S, [tcx + 1.25 * T.a + 18 * u, S[1] - 0.15 * HH], [tcx + 1.05 * T.a + 10 * u, S[1] - 0.7 * HH]], front: true });
  } else if (Array.isArray(prop) && (prop[0] === "gun" || prop[0] === "knife")) {
    const sd = facing || 1, S = sh(sd), k = clamp(prop[1], 0, 1);
    arms.push({ pts: hang(-sd, 0), front: false });
    const low = hang(sd, 0);
    const up: [P2, P2, P2] = prop[0] === "gun"
      ? [S, [tcx + sd * (1.15 * T.a + 24 * u), S[1] + 0.02 * HH], [tcx + sd * (1.25 * T.a + 50 * u), S[1] - 0.04 * HH]]
      : [S, [tcx + sd * (1.15 * T.a + 14 * u), S[1] + 0.32 * HH], [tcx + sd * (0.9 * T.a + 22 * u), S[1] + 0.12 * HH]];
    arms.push({ pts: [S, lerp2(low[1], up[1], k), lerp2(low[2], up[2], k)], front: true });
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
    } else if (prop === "purse") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 8 * u, S[1] + 0.35 * HH], [tcx + 1.0 * T.a + 18 * u, S[1] + 0.2 * HH]], front: true });
    } else if (prop === "icecream" || prop === "goblet" || prop === "magnifier" || prop === "quill" || prop === "letter" || prop === "scroll" || prop === "candle" || prop === "cup" || prop === "cross") {
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
  const longHair = o.hat === "wig" || o.hat === "periwig" || o.hat === "curls" || (o.hat === "tricorn" && !!o.hair);
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  const headRot: typeof p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  if (longHair) {
    const bodyRot = p.rot;
    p.rot = headRot;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    if (o.band) for (const sd of [-1, 1]) p.poly([[300, chin - 0.02 * HH], [300 + sd * 15 * u, chin - 0.01 * HH], [300 + sd * 12 * u, chin + 0.24 * HH], [300 + sd * 1.5 * u, chin + 0.25 * HH]], o.band, 2.2 * u);
    p.rot = bodyRot;
  }
  if (o.tie) {
    p.poly([[300 - 6 * u, chin - 2 * u], [300 + 6 * u, chin - 2 * u], [300 + 4 * u, chin + 0.08 * HH], [300 - 4 * u, chin + 0.08 * HH]], o.tie, 1.6 * u);
    p.poly([[300 - 4 * u, chin + 0.08 * HH], [300 + 4 * u, chin + 0.08 * HH], [300 + 6.5 * u, chin + 0.62 * HH], [300, chin + 0.7 * HH], [300 - 6.5 * u, chin + 0.62 * HH]], o.tie, 1.6 * u);
  }
  if (o.stock && !o.ruff) {
    p.poly([[300 - 15 * u, chin - 3 * u], [300 + 15 * u, chin - 3 * u], [300 + 9 * u, chin + 0.2 * HH], [300, chin + 0.3 * HH], [300 - 9 * u, chin + 0.2 * HH]], o.stock, 2.6 * u);
  }
  if (bib) p.poly([[300 - 30 * u, chin - 2 * u], [300 + 30 * u, chin - 2 * u], [300 + 22 * u, chin + 0.5 * HH], [300, chin + 0.62 * HH], [300 - 22 * u, chin + 0.5 * HH]], "#f7f4ec", 3 * u);
  if (Array.isArray(prop) && prop[0] === "touch") {
    // iron chain from the back hand down to the floor (it runs to the jars along the floor)
    const sd = facing || 1, [hx, hy] = arms[0].pts[2];
    const pts = curve([hx, hy], [hx + sd * 6 * u, (hy + sole) / 2], [hx + sd * 34 * u, sole - 6 * u], 16);
    pts.forEach(([x, y], i) => p.ell(x, y, (i % 2 ? 3 : 5.5) * u, (i % 2 ? 5.5 : 3) * u, "#7d7f88", 1.6 * u));
    p.dot(hx, hy, 5.5 * u);
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
    } else if (prop === "cigarette") {
      // a white cigarette poking out of the fist toward the mouth side, a glowing tip and a thin curl of smoke
      p.band([[hx + 2 * u, hy - 2 * u], [hx + 20 * u, hy - 10 * u]], "#f6f3ea", 2.6 * u, 0.9 * u, "butt");
      p.dot(hx + 21 * u, hy - 10.5 * u, 1.8 * u, "#ff7a3a");
      p.stroke(curve([hx + 22 * u, hy - 13 * u], [hx + 28 * u, hy - 30 * u], [hx + 20 * u, hy - 48 * u]), 1.4 * u, "rgba(220,220,230,0.8)");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "cup") {
      p.poly([[hx - 10 * u, hy - 20 * u], [hx + 10 * u, hy - 20 * u], [hx + 8 * u, hy - 4 * u], [hx - 8 * u, hy - 4 * u]], "#f6f3ea", 2 * u);
      p.arc(hx + 12 * u, hy - 13 * u, 5 * u, 5 * u, -90, 90, 1.8 * u);
      p.ell(hx, hy - 20 * u, 10 * u, 2.6 * u, "#6a3a1e", 1.4 * u);
      for (const dx of [-4, 4]) p.stroke(curve([hx + dx * u, hy - 24 * u], [hx + (dx + 5) * u, hy - 33 * u], [hx + dx * u, hy - 42 * u]), 1.3 * u, "rgba(230,230,236,0.85)");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "cross") {
      p.band([[hx, hy + 6 * u], [hx, hy - 44 * u]], "#8a5a34", 4 * u, 1.3 * u);
      p.band([[hx - 12 * u, hy - 30 * u], [hx + 12 * u, hy - 30 * u]], "#8a5a34", 4 * u, 1.3 * u);
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
    } else if (prop === "razor") {
      // straight razor: dark handle down through the fist, the open steel blade up and out at an angle, a glint
      p.band([[hx - 6 * u, hy + 22 * u], [hx + 2 * u, hy - 4 * u]], "#2a2026", 6 * u, 1.4 * u, "round");
      const bl: P2[] = [[hx + 2 * u, hy - 6 * u], [hx + 30 * u, hy - 52 * u], [hx + 40 * u, hy - 50 * u], [hx + 44 * u, hy - 40 * u], [hx + 10 * u, hy + 2 * u]];
      p.poly(bl, "#e6ebf2", 2.2 * u);
      p.stroke([[hx + 6 * u, hy - 4 * u], [hx + 36 * u, hy - 50 * u]], 2.4 * u, "#9aa4b4");
      p.dot(hx + 40 * u, hy - 44 * u, 3 * u, "#ffffff");
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "purse") {
      p.stroke([[hx, hy], [hx + 2 * u, hy + 14 * u]], 2 * u, "#5a3a20");
      p.poly([[hx - 6 * u, hy + 12 * u], [hx + 10 * u, hy + 12 * u], [hx + 30 * u, hy + 34 * u], [hx + 28 * u, hy + 60 * u], [hx + 2 * u, hy + 70 * u], [hx - 24 * u, hy + 60 * u], [hx - 26 * u, hy + 34 * u]], "#8a5a30", 2.4 * u);
      p.band([[hx - 8 * u, hy + 16 * u], [hx + 12 * u, hy + 16 * u]], "#d9b04a", 3 * u, 1.2 * u);
      p.ell(hx + 2 * u, hy + 44 * u, 8 * u, 8 * u, "#d9b04a", 1.6 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "kopek" || prop === "token") {
      const r = prop === "kopek" ? 5 * u : 12 * u, cy = hy - r - 3 * u;
      p.ell(hx + 2 * u, cy, r, r, "#c8743a", 1.6 * u);
      if (prop === "token") { p.ell(hx + 2 * u, cy, r * 0.7, r * 0.7, null, 0.9 * u); p.dot(hx + 2 * u, cy, 1.6 * u); p.arc(hx + 2 * u, cy + 4 * u, 4 * u, 4 * u, 20, 160, 1.2 * u); }
      p.dot(hx + 2 * u - r * 0.35, cy - r * 0.35, r * 0.22, "rgba(255,240,210,0.8)");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "deal") {
      if (hx < 300) beardBundle(p, hx, hy - 2 * u, prop[1], u, 1);
      else { p.ell(hx + 2 * u, hy - 12 * u, 9 * u, 9 * u, "#e2b84a", 1.8 * u); p.dot(hx - 1 * u, hy - 15 * u, 2 * u, "rgba(255,255,255,0.8)"); }
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "beardOut") {
      const k = clamp(prop[1], 0, 1);
      beardBundle(p, hx, hy - 2 * u, prop[2], u, 0.25 + 0.75 * k);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "bite" || prop === "chin") {
      p.dot(hx, hy, 5.5 * u);
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
    } else if (prop === "writeQuill") {
      p.band([[hx + 2 * u, hy + 4 * u], [hx + 22 * u, hy - 46 * u]], "#3a2a24", 1.6 * u, 0.8 * u, "round");
      p.poly([[hx + 8 * u, hy - 14 * u], [hx + 30 * u, hy - 56 * u], [hx + 26 * u, hy - 30 * u]], "#f4f0e6", 1.8 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "fork") {
      p.band([[hx, hy + 6 * u], [hx, hy - 30 * u]], "#c2c4cc", 2.4 * u, 1 * u, "round");
      for (const dx of [-4, 0, 4]) p.band([[hx + dx * u, hy - 30 * u], [hx + dx * u, hy - 42 * u]], "#c2c4cc", 1.4 * u, 0.8 * u, "round");
      p.ell(hx, hy - 44 * u, 9 * u, 7 * u, "#b8642a", 2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "chest") {
      p.dot(hx, hy, 6.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "touch") {
      p.dot(hx, hy, 6 * u);
    } else if (Array.isArray(prop) && prop[0] === "gun") {
      // a dark revolver: grip in the fist, cylinder, barrel pointing down at rest and out toward the facing side when raised
      const sd = facing || 1, k = clamp(prop[1], 0, 1), a = rad(-90 + 90 * k);
      const dir: P2 = [sd * Math.cos(a), -Math.sin(a)], nrm: P2 = [-dir[1], dir[0]];
      const at = (al: number, ac: number): P2 => [hx + (dir[0] * al + nrm[0] * ac) * u, hy + (dir[1] * al + nrm[1] * ac) * u];
      p.poly([at(-4, -4), at(4, -6), at(8, 10), at(1, 12)], "#3a2a24", 1.4 * u); // grip
      p.poly([at(2, -9), at(14, -9), at(14, -2), at(2, -2)], "#4a4e58", 1.4 * u); // cylinder
      p.band([at(14, -6), at(34, -6)], "#4a4e58", 4 * u, 1.3 * u); // barrel
      p.dot(...at(9, -7.5), 1.2 * u, "#8a8e98");
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "knife") {
      // a short knife: dark handle in the fist, the steel blade up and out toward the facing side, a white glint
      const sd = facing || 1, k = clamp(prop[1], 0, 1), a = rad(-70 + 125 * k);
      const dir: P2 = [sd * Math.cos(a), -Math.sin(a)], nrm: P2 = [-dir[1], dir[0]];
      const at = (al: number, ac: number): P2 => [hx + (dir[0] * al + nrm[0] * ac) * u, hy + (dir[1] * al + nrm[1] * ac) * u];
      p.band([at(-8, 0), at(5, 0)], "#3a2a24", 5 * u, 1.3 * u, "round");
      p.poly([at(5, -3), at(30, -1.5), at(34, 1), at(5, 3)], "#e6ebf2", 1.6 * u);
      p.dot(...at(28, 0), 1.6 * u, "#ffffff");
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
  if (o.stubble) p.clip(hp, () => { for (let i = 0; i < 70; i++) { const a = rad(20 + 140 * rnd(seed, 60 + i)), r = H.a * (0.55 + 0.42 * rnd(seed, 160 + i)); p.dot(300 + r * Math.cos(a) * (1 + 0.1 * facing), hc + 0.15 * H.b + r * 0.95 * Math.sin(a), 1.5 * u, "#6a6a84"); } });
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  if (o.beard) beardFront(p, o, 300 + 4 * u * facing, hc, H, chin, HH, u, light, thick, ow);
  const brim = !!o.hat && !["hair", "bonnet", "cap", "wig", "periwig", "frizz", "curls"].includes(o.hat);
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout", o.nose, o.specs);
  if (prop === "shush") { // index finger across the lips, drawn over the face
    const mx = 300 + 8 * u * facing, my = hc + 20 * u;
    p.stroke([[mx, my + 12 * u], [mx, my - 7 * u]], 8 * u, INK); p.stroke([[mx, my + 12 * u], [mx, my - 7 * u]], 4.5 * u, skin);
    p.ell(mx, my + 20 * u, 10 * u, 9 * u, skin, 2.6 * u);
  }
  if (prop === "bite") { // the coin between the teeth, drawn over the face
    const mx = 300 + 8 * u * facing + 3 * u, my = hc + 19 * u;
    p.ell(mx, my, 7 * u, 7 * u, "#c8743a", 1.8 * u); p.dot(mx - 2 * u, my - 2 * u, 1.6 * u, "rgba(255,240,210,0.8)");
  }
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
  const brim = !!o.hat && !["hair", "bonnet", "cap", "wig", "periwig", "curls"].includes(o.hat);
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
export const BEARDS = ["#b8b4ac", "#c0582a", "#2a2224", "#6a4630", "#e8e4dc", "#8a6a4a"];
