// Cast + effects first drawn for the Franklin short: Philadelphia, 1750 (turkey + electricity). Any short can import them.

import { DEF_LIGHT, INK, Pen, SH_CLOTH, SH_SKIN, SKINS, curve, ellPts, mix, mul, rad, rnd, rrect, taper, thickAngle } from "../toon";
import type { Outfit, P2 } from "../toon";


// Philadelphia, 1750: Franklin (44, own long hair, spectacles, plain brown suit) and his guests (tricorns, stocks, gowns)
export const FRANKLIN: Outfit = { jacket: "#7a4e2c", pants: "#5a3a22", boots: "#2e2420", hat: null, hair: "#9a8270", long: true, specs: true,
  stock: "#f6f1e6", buttons: "#d9b04a", build: "stout", skin: "#f8d4b2" };
export const FRANKLIN_FRIZZ: Outfit = { ...FRANKLIN, hat: "frizz" };
export const colonist = (v = 0): Outfit => {
  const coats = ["#2f4f7a", "#6a2a34", "#3d6a4a", "#8a6a3a", "#4a3a5a", "#2a5a6a"];
  const hairs = ["#3a2a20", "#7a4a2a", "#c8a060", "#1e1a1a", "#9a5a30", "#d8d0c8"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3a3236", boots: "#2e2420", hat: "tricornFlat", hair: hairs[v % 6], stock: "#f4efe4", buttons: "#d9b04a", skin: SKINS[v % 4] };
  if (v % 3 === 1) return { ...o, hat: "bonnet", stock: undefined, dress: ["#b8586a", "#5a86b8", "#c9a24a", "#6a9a6a"][v % 4] };
  return v % 4 === 2 ? { ...o, hat: "hair", long: true } : o;
};

// ================= Franklin short: turkey + electricity effects =================
export type TurkeyState = "alive" | "smug" | "nervous" | "shock" | "dead" | "laugh";
export const TK_BODY = "#5a3a28", TK_BRONZE = "#8a5a2e", TK_HEAD = "#c9d8e6", TK_RED = "#d43a3a", TK_LEG = "#e0956a", TK_BEAK = "#e8c26a";
/** a live (or very dead) turkey in the 600 x 1000 character design space, feet on y = 975; ~0.65 m tall at card scale 1 */
export const turkey = (p: Pen, state: TurkeyState, light = DEF_LIGHT, lid = 0, frazzle = false) => {
  const thick = thickAngle(light), ow = 9;
  if (state === "dead") {
    // flat on its back, feet in the air, X eyes, tongue out
    p.ell(300, 905, 150, 26, mix(TK_BRONZE, "#e8d8b0", 0.2), ow, 180, 360);
    for (const s of [-1, 1]) {
      const hx = 300 + s * 34, top = 770;
      p.stroke([[hx, 880], [hx + s * 8, top]], 12, TK_LEG);
      for (const a of [-35, 0, 35]) p.stroke([[hx + s * 8, top], [hx + s * 8 + 26 * Math.sin(rad(a)), top - 26 * Math.cos(rad(a))]], 8, TK_LEG);
    }
    const bp = ellPts(300, 905, 105, 70);
    p.shadedFill(bp, TK_BODY, mul(TK_BODY, SH_CLOTH), light, 105);
    p.inkRing(bp, ow, thick);
    p.stroke([[392, 920], [440, 950]], 16, TK_HEAD);
    p.ell(458, 955, 34, 28, TK_HEAD, 7);
    p.ell(470, 985, 10, 16, TK_RED, 4);
    for (const ex of [446, 470]) { p.stroke([[ex - 7, 940], [ex + 7, 952]], 4.5); p.stroke([[ex + 7, 940], [ex - 7, 952]], 4.5); }
    p.poly([[488, 952], [512, 958], [488, 966]], TK_BEAK, 4);
    p.ell(500, 970, 6, 9, "#e86e78", 3);
    return;
  }
  const up = state === "shock" ? 1 : 0;
  // tail fan: striped feathers, raised high in shock
  const fc = 300, fy = 830 - 25 * up, R0 = 160 + 30 * up, n = 11;
  for (let i = 0; i < n; i++) {
    const a = rad(198 + (144 * i) / (n - 1)), x1 = fc + R0 * Math.cos(a), y1 = fy + R0 * Math.sin(a);
    const fp = curve([fc + 30 * Math.cos(a - 0.2), fy + 30 * Math.sin(a - 0.2)], [fc + 0.6 * R0 * Math.cos(a - 0.12), fy + 0.6 * R0 * Math.sin(a - 0.12)], [x1, y1], 6)
      .concat(curve([x1, y1], [fc + 0.6 * R0 * Math.cos(a + 0.12), fy + 0.6 * R0 * Math.sin(a + 0.12)], [fc + 30 * Math.cos(a + 0.2), fy + 30 * Math.sin(a + 0.2)], 6));
    p.poly(fp, i % 2 ? TK_BRONZE : "#6a4428", 6);
    p.arc(fc, fy, 0.82 * R0, 0.82 * R0, (a * 180) / Math.PI - 7, (a * 180) / Math.PI + 7, 10, "#efe2c0");
  }
  // legs
  for (const s of [-1, 1]) {
    p.stroke([[300 + s * 28, 900], [300 + s * 32, 968]], 12, TK_LEG);
    for (const a of [-50, 0, 50]) p.stroke([[300 + s * 32, 968], [300 + s * 32 + 24 * Math.sin(rad(a)), 972]], 8, TK_LEG);
  }
  // body
  const bp = ellPts(300, 858, 92 + 6 * up, 72 + 4 * up);
  p.shadedFill(bp, TK_BODY, mul(TK_BODY, SH_CLOTH), light, 95);
  if (frazzle || up) for (let i = 0; i < 9; i++) { const a = rad(200 + i * 16); p.stroke([[300 + 88 * Math.cos(a), 858 + 70 * Math.sin(a)], [300 + 112 * Math.cos(a), 858 + 92 * Math.sin(a)]], 7); }
  p.inkRing(bp, ow, thick);
  p.arc(300, 862, 60, 40, 20, 160, 5, mul(TK_BODY, [0.7, 0.7, 0.75]));
  // neck + head
  const tilt = state === "laugh" ? -0.25 : state === "smug" ? 0.12 : 0, hx = 300 + 20 * Math.sin(tilt), hy = 712 - 20 * up;
  p.stroke([[300, 810], [hx, hy + 30]], 30, TK_HEAD);
  p.stroke([[300, 810], [hx, hy + 30]], 22, TK_HEAD);
  const hp = ellPts(hx, hy, 40, 44, 0, 360, (tilt * 180) / Math.PI);
  p.shadedFill(hp, TK_HEAD, mul(TK_HEAD, SH_SKIN), light, 42);
  p.inkRing(hp, 7, thick);
  p.ell(hx + 14, hy + 50, 13, 26, TK_RED, 5); // wattle
  p.poly([[hx - 4, hy - 34], [hx + 6, hy - 30], [hx + 2, hy + 6]], TK_RED, 4); // snood
  const open = state === "laugh" || state === "shock";
  p.poly([[hx - 12, hy + 8], [hx + 12, hy + 8], [hx, hy + 26 + (open ? 4 : 0)]], TK_BEAK, 4);
  if (open) p.poly([[hx - 9, hy + 24], [hx + 9, hy + 24], [hx, hy + 36]], TK_BEAK, 4);
  const shut = lid >= 1;
  for (const s of [-1, 1]) {
    const ex = hx + s * 15, ey = hy - 8;
    if (state === "shock") { p.ell(ex, ey, 13, 13, "#ffffff", 3.5); p.dot(ex, ey + 2, 4); }
    else if (state === "laugh") p.stroke([[ex - 8 * s, ey - 6], [ex + 6 * s, ey], [ex - 8 * s, ey + 6]], 4.5);
    else if (shut) p.stroke([[ex - 8, ey], [ex + 8, ey]], 4.5);
    else if (state === "smug") { p.ell(ex, ey + 1, 7, 5, INK, 0, 0, 180); p.stroke([[ex - 9, ey + 1], [ex + 9, ey + 1]], 4.5); taper(p, [ex - s * 2, ey - 14], [ex + s * 12, ey - 18], 5, 2.5); }
    else if (state === "nervous") { p.dot(ex, ey, 4); taper(p, [ex - s * 2, ey - 14], [ex + s * 10, ey - 10], 5, 2.5); }
    else p.ell(ex, ey, 4.5, 6.5, INK, 0);
  }
  if (state === "nervous") p.ell(hx + 52, hy - 30, 6, 10, "#9fd4ff", 3);
};

/** electric discharge on a 500 x 500 canvas: jagged bolts radiating from the centre, white core + cyan glow, ink rim */
export const fxZap = (p: Pen, seed: number, n = 7, reach = 1) => {
  for (let i = 0; i < n; i++) {
    const a0 = rad((360 * i) / n + 40 * rnd(seed, i)), pts: P2[] = [[250, 250]];
    let r = 0, a = a0;
    while (r < 225 * reach) { r += 28 + 22 * rnd(seed, i * 17 + r); a = a0 + 0.45 * (rnd(seed, i * 31 + r) - 0.5); pts.push([250 + r * Math.cos(a), 250 + r * Math.sin(a)]); }
    p.line(pts, "#8fe8ff", 16);
    p.stroke(pts, 6, "#ffffff");
  }
  p.ell(250, 250, 34, 34, "#ffffff", 8);
};
/** one jagged bolt along a 1000 x 200 canvas, left to right */
export const fxBolt = (p: Pen, seed: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 12; i++) pts.push([20 + 80 * i, 100 + (i === 0 || i === 12 ? 0 : 70 * (rnd(seed, i) - 0.5))]);
  p.line(pts, "#8fe8ff", 22);
  p.stroke(pts, 8, "#ffffff");
};
/** grey smoke puff on a 300 x 300 canvas; t in 0..1 */
export const fxSmoke = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(200 + i * 35), d = 30 + 50 * t, r = (34 + 16 * (i % 2)) * (0.7 + 0.5 * t);
    p.ell(150 + d * Math.cos(a), 190 + d * Math.sin(a) - 60 * t, r, r * 0.85, `rgba(110,104,116,${(0.85 * (1 - t)).toFixed(3)})`, 0);
  }
};
/** a handwritten letter (no legible text) with a red wax seal, on a 300 x 220 canvas */
export const fxLetter = (p: Pen, sealed = false) => {
  p.poly(rrect(16, 16, 284, 204, 8), "#f3ead2", 6);
  for (let i = 0; i < 7; i++) {
    const y = 46 + i * 21, pts: P2[] = [];
    for (let x = 40; x < (i === 6 ? 170 : 258); x += 8) pts.push([x, y + 3 * Math.sin(x * 0.4 + i)]);
    p.stroke(pts, 3, "#3a3a5a");
  }
  if (sealed) p.ell(220, 170, 22, 20, "#b8202c", 4);
};
