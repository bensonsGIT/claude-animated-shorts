// Cast + effects first drawn for the wombat cube-poo short (Tasmania + an Atlanta lab). Any short can import them.

import { Pen, mul, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";

// ================= people =================
const COAT = "#f4f4f0";
/** Patricia Yang: long black hair, white lab coat over a navy top */
export const YANG: Outfit = { jacket: COAT, pants: "#2a3550", boots: "#2a2a30", hat: "hair", hair: "#17131a", long: true, skin: "#f2d4b2", buttons: "#c8ccd4", band: "#2a3550" };
/** David Hu: short black hair, glasses, lab coat over a blue shirt */
export const HU: Outfit = { jacket: COAT, pants: "#3a3a44", boots: "#222226", hat: "hair", hair: "#141216", specs: true, skin: "#eecca6", buttons: "#c8ccd4", band: "#5a8ad0", build: "stout" };
/** the field ecologist in Tasmania: wide-brim hat, olive field shirt, sandy hair */
export const RANGER: Outfit = { jacket: "#6f8456", pants: "#7a6648", boots: "#4a3220", hat: "brimhat", cap: "#8a6a42", skin: "#f2c4a2", belt: "#4a3220", moustache: "#a8783e" };

// ================= the wombat =================
export type WombatEye = "dot" | "happy" | "strain" | "wink" | "smug" | "shock" | "sleepy";
export type WombatOpt = { leg?: number; dir?: number; eye?: WombatEye; xray?: number; seed?: number; squat?: number; blush?: boolean };
const FUR = "#8a7256", FUR_D = "#6a5440", FUR_L = "#a08a6c", NOSE = "#38303a";
/** a common (bare-nosed) wombat side-on, facing right, on a 1000 x 640 canvas (feet at y 620).
 *  leg 0-3 = walk frames (3 = standing); squat 0..1 drops the rump; xray >= 0 opens a window on the gut with a lump moving
 *  down its last stretch (0 = round, still soft .. 1 = a finished cube at the exit) */
export const fxWombat = (p: Pen, o: WombatOpt = {}) => {
  const { leg = 3, dir = 1, eye = "dot", xray = -1, seed = 0, squat = 0, blush = true } = o;
  const g = p.g;
  g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 1000, 0);
  g.scale(2, 2);
  const walk = leg < 3, bob = walk ? [0, -4, 0][leg] : 0;
  const tilt = -0.12 * squat; // rump down, nose up
  // legs: stubby columns, back pair darker; walk = diagonal pairs swing
  const sw = walk ? [[-14, 10, 10, -14], [0, 0, 0, 0], [14, -10, -10, 14]][leg] : [0, 0, 0, 0];
  const legX = [112, 160, 330, 372], far = [true, false, true, false];
  legX.forEach((x, i) => {
    const top: P2 = [x + (i < 2 ? -6 * squat : 0), 235 + bob + (i < 2 ? 22 * squat : 0)], ft: P2 = [x + sw[i], 304];
    const col = far[i] ? mul(FUR_D, [0.82, 0.82, 0.86]) : FUR_D;
    p.line([top, ft], col, 34, true);
    for (const k of [-9, 0, 9]) p.stroke([[ft[0] + 10 + k, ft[1] + 6], [ft[0] + 18 + k, ft[1] + 12]], 3.5, "#e8dcc4");
  });
  if (tilt) p.rot = [tilt, 360, 250];
  // body: a fat loaf, flatter underneath
  const body: P2[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, r = 1 + 0.025 * rnd(seed + 3, i);
    let y = 182 + bob + 96 * r * Math.sin(a);
    if (y > 232 + bob) y = 232 + bob + (y - 232 - bob) * 0.45;
    body.push([228 + 178 * r * Math.cos(a), y]);
  }
  p.poly(body, FUR, 7);
  // fur flecks along the back
  for (let i = 0; i < 18; i++) { const x = 90 + i * 15, y = 112 + bob + 30 * Math.abs(Math.cos((i - 9) / 7)); p.stroke([[x, y], [x - 7, y + 12]], 3, FUR_D); }
  // stubby tail nub
  p.ell(54, 186 + bob + 20 * squat, 12, 9, FUR_D, 5);
  // x-ray window: pale belly cut-away with the gut and the travelling lump
  if (xray >= 0) {
    const win: P2[] = []; for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; win.push([210 + 128 * Math.cos(a), 190 + bob + 58 * Math.sin(a)]); }
    p.poly(win, "#f8ecdc", 5);
    p.clip(win, () => {
      // loops of gut, then the final straight to the exit on the left
      const loop: P2[] = [];
      for (let i = 0; i <= 60; i++) { const s = i / 60; loop.push([330 - 200 * s + 18 * Math.sin(s * 22), 176 + bob + 34 * Math.sin(s * 11 + 1)]); }
      p.line(loop, "#e88a9a", 26, true);
      p.line([[130, 200 + bob], [40, 214 + bob]], "#e88a9a", 34, true);
      // stiff bands along the final straight (darker stripes)
      for (const x of [118, 92, 66]) p.stroke([[x, 186 + bob], [x - 4, 228 + bob]], 6, "#b8506a");
      const u = Math.min(1, Math.max(0, xray)), cx = 150 - 100 * u, cy = 204 + bob + 3 * u, s = 15;
      // rounded square whose corners sharpen as it goes (superellipse)
      const n = 2 + 6 * u * u, pts: P2[] = [];
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
        pts.push([cx + s * Math.sign(c) * Math.abs(c) ** (2 / n), cy + s * Math.sign(si) * Math.abs(si) ** (2 / n)]);
      }
      p.poly(pts, "#6a4a2e", 4);
    });
  }
  // head
  const hx = 392, hy = 172 + bob;
  for (const [ex, ey, r] of [[hx - 34, hy - 58, -20], [hx - 4, hy - 64, 9]] as const) { // ears
    p.ell(ex, ey, 15, 24, FUR, 5, 0, 360, r);
    p.ell(ex, ey + 4, 7, 13, "#c89a8a", 0, 0, 360, r);
  }
  p.ell(hx, hy, 80, 68, FUR_L, 7);
  p.ell(hx + 6, hy + 34, 46, 24, mul(FUR_L, [1.06, 1.05, 1.02]), 0);
  // big bare nose
  p.ell(hx + 66, hy - 4, 30, 27, NOSE, 6);
  p.dot(hx + 58, hy - 13, 6, "rgba(255,255,255,0.55)");
  p.arc(hx + 56, hy + 26, 12, 8, 20, 160, 4);
  if (blush) p.ell(hx + 22, hy + 22, 14, 8, "rgba(230,130,130,0.45)", 0);
  // eye
  const ex = hx + 26, ey = hy - 22;
  if (eye === "wink") p.arc(ex, ey + 4, 10, 7, 200, 340, 5);
  else if (eye === "happy") p.arc(ex, ey + 6, 10, 9, 200, 340, 5);
  else if (eye === "strain") { p.stroke([[ex - 11, ey - 6], [ex + 6, ey], [ex - 11, ey + 6]], 5); }
  else if (eye === "sleepy") { p.stroke([[ex - 10, ey + 2], [ex + 10, ey + 2]], 5); }
  else {
    const r = eye === "shock" ? 13 : 10;
    p.ell(ex, ey, r, r, "#1c1418", 0);
    p.dot(ex + 3, ey - 3, eye === "shock" ? 3 : 3.5, "#ffffff");
    if (eye === "shock") p.ell(ex, ey, r + 4, r + 4, null, 3);
    if (eye === "smug") { // half-closed lid
      p.poly([[ex - 14, ey - 15], [ex + 14, ey - 15], [ex + 14, ey - 1], [ex - 14, ey - 1]], FUR_L, 0);
      p.stroke([[ex - 13, ey - 1], [ex + 13, ey - 1]], 4);
    }
  }
  p.rot = null;
  g.restore();
};

// ================= props =================
/** the esky (cooler box) the frozen guts travel in, 500 x 420. open 0..1 swings the lid up; frost = icicles + rime */
export const fxEsky = (p: Pen, open = 0, frost = false, glow = false) => {
  const base = "#e9eef3", blue = "#2f72c4";
  if (open > 0.05) { // the open box: dark inside, a glow when it is Christmas
    p.poly([[70, 170], [430, 170], [410, 196], [90, 196]], glow ? "#ffe6a0" : "#1c2a44", 5);
  }
  p.poly([[60, 180], [440, 180], [430, 400], [70, 400]], base, 7);
  p.poly([[66, 330], [434, 330], [430, 400], [70, 400]], blue, 6);
  p.poly([[150, 230], [350, 230], [350, 290], [150, 290]], mul(base, [0.94, 0.95, 0.97]), 4);
  // paw-print sticker
  p.ell(250, 268, 16, 13, "#8a7256", 0); for (const [x, y] of [[230, 248], [244, 242], [258, 242], [272, 248]]) p.ell(x, y, 5.5, 6.5, "#8a7256", 0);
  for (const s of [-1, 1]) p.poly([[250 + s * 205, 215], [250 + s * 222, 215], [250 + s * 222, 260], [250 + s * 205, 260]], blue, 4); // side handles
  // lid, hinged at the back (left edge in the drawing)
  p.rot = [-open * 1.75, 64, 176];
  p.poly([[52, 140], [448, 140], [448, 182], [52, 182]], blue, 7);
  p.poly([[180, 120], [320, 120], [320, 140], [180, 140]], blue, 5);
  if (frost) for (let i = 0; i < 11; i++) { const x = 70 + i * 35, l = 18 + 16 * rnd(7, i); p.poly([[x - 8, 182], [x + 8, 182], [x, 182 + l]], "#d8f0ff", 3); }
  p.rot = null;
  if (frost) {
    for (let i = 0; i < 22; i++) { const x = 80 + 340 * rnd(11, i), y = 190 + 130 * rnd(12, i); p.stroke([[x - 6, y], [x + 6, y]], 2.5, "#9ad4ff"); p.stroke([[x, y - 6], [x, y + 6]], 2.5, "#9ad4ff"); }
  }
};

/** a gut segment on a steel tray with a long skinny balloon inflating inside it (u 0..1), 900 x 260. The wall bulges
 *  unevenly: soft bands balloon out, stiff bands hold. A squeeze bulb on the left. */
export const fxGut = (p: Pen, u: number) => {
  p.poly([[20, 150], [880, 150], [860, 240], [40, 240]], "#b8c0c8", 6);
  p.poly([[40, 160], [860, 160], [845, 225], [55, 225]], "#d6dce2", 0);
  const L = 120, R = 820, xi = L + (R - L) * Math.min(1, u * 1.15);
  const top: P2[] = [], bot: P2[] = [];
  for (let x = L; x <= R; x += 8) {
    const inside = x <= xi ? 1 : 0, soft = 0.5 + 0.5 * Math.sin((x - L) / 34);
    const r = 22 + inside * (10 + 26 * soft * soft) * Math.min(1, u * 2);
    top.push([x, 150 - r + 8 * Math.sin(x / 70)]); bot.push([x, 150 + r * 0.55 + 8 * Math.sin(x / 70)]);
  }
  p.poly([...top, ...bot.reverse()], "#e7909e", 6);
  for (let x = L + 40; x < R; x += 68) p.stroke([[x, 132 + 8 * Math.sin(x / 70)], [x + 4, 166 + 8 * Math.sin(x / 70)]], 3, "rgba(150,60,80,0.55)");
  // the balloon showing through
  if (u > 0.02) p.line([[L + 8, 146], [xi - 10, 146 + 8 * Math.sin(xi / 70)]], "rgba(150,210,255,0.75)", 10, false);
  // squeeze bulb + hose
  p.line([[L, 150], [70, 120], [50, 80]], "#2a2a30", 7, false);
  const b = 1 - 0.25 * Math.abs(Math.sin(u * 18));
  p.ell(50, 60, 28 * b, 34 * b, "#c02a2a", 6);
};

/** marker drawings for the whiteboard, 1200 x 774 (transparent, drawn onto the white face) */
export type BoardMode = "mystery" | "bands" | "squeeze" | "factory";
const MK = "#1e2024", MB = "#2a4ab0", MR = "#c02a2a", MP = "#e07a90", MBR = "#6a4a2e";
const qmark = (p: Pen, x: number, y: number, s: number, col = MR) => {
  p.g.save(); p.g.font = `bold ${Math.round(160 * s)}px sans-serif`; p.g.textAlign = "center"; p.g.textBaseline = "middle";
  p.g.lineWidth = 10 * s; p.g.strokeStyle = "#fbfbf8"; p.g.strokeText("?", x, y); p.g.fillStyle = col; p.g.fillText("?", x, y); p.g.restore();
};
const ringPts = (cx: number, cy: number, R: number, n: number, a0 = 0, a1 = 360): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 48) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    pts.push([cx + R * Math.sign(c) * Math.abs(c) ** (2 / n), cy + R * Math.sign(s) * Math.abs(s) ** (2 / n)]);
  }
  return pts;
};
/** k = step / progress: mystery 0..3 (tube, square, ?), bands 0..2 (+ stiff, + stretchy; w = wobble), squeeze u 0..1, factory phase */
export const fxBoard = (p: Pen, mode: BoardMode, k: number, w = 0) => {
  if (mode === "mystery") {
    if (k >= 1) { // a round tube seen end-on and along its length
      p.stroke([[110, 320], [400, 320]], 7, MK); p.stroke([[110, 480], [400, 480]], 7, MK);
      p.ell(400, 400, 46, 80, null, 7); p.ell(110, 400, 46, 80, null, 4);
      p.ell(400, 400, 26, 46, MBR, 0);
    }
    if (k >= 2) { // arrow to a square poo
      p.stroke([[500, 400], [690, 400]], 9, MB); p.stroke([[660, 370], [695, 400], [660, 430]], 9, MB);
      p.poly([[790, 300], [990, 300], [990, 500], [790, 500]], MBR, 8);
      p.poly([[820, 320], [900, 320], [900, 340], [820, 340]], "rgba(255,255,255,0.35)", 0);
    }
    if (k >= 3) qmark(p, 595, 250, 1.3);
    return;
  }
  if (mode === "bands" || mode === "squeeze") {
    const cx = 600, cy = 390, R = 235, sq = mode === "squeeze" ? Math.min(1, k) : 0, n = 2 + 6 * sq * sq;
    // stiff bands at left / right, stretchy at top / bottom
    const stiff = mode === "squeeze" || k >= 1, soft = mode === "squeeze" || k >= 2;
    const wob = mode === "bands" ? 10 * Math.sin(w) : 0;
    const band = (a0: number, a1: number, col: string, Rr: number, wd: number) => p.line(ringPts(cx, cy, Rr, n, a0, a1), col, wd, true);
    if (soft) { band(50, 130, MP, R + wob, 60); band(230, 310, MP, R + wob, 60); }
    else { band(50, 130, "#d8d8d8", R, 20); band(230, 310, "#d8d8d8", R, 20); }
    if (stiff) { band(-40, 40, MR, R - 6, 80); band(140, 220, MR, R - 6, 80); for (const a of [-25, -8, 8, 25, 155, 172, 188, 205]) { const r = (a * Math.PI) / 180; p.stroke([[cx + (R - 40) * Math.cos(r), cy + (R - 40) * Math.sin(r)], [cx + (R + 28) * Math.cos(r), cy + (R + 28) * Math.sin(r)]], 5, "#7a1418"); } }
    else { band(-40, 40, "#d8d8d8", R, 20); band(140, 220, "#d8d8d8", R, 20); }
    if (mode === "squeeze") {
      // the content: a wet round lump that dries (drops fly off) and is pressed into a square
      p.poly(ringPts(cx, cy, 160, n), sq > 0.5 ? MBR : mul(MBR, [1.25, 1.2, 1.15]), 8);
      for (let i = 0; i < 8; i++) {
        const t = Math.max(0, Math.min(1, k * 2.4 - i * 0.12));
        if (t <= 0 || t >= 1) continue;
        const a = i * 0.785 + 0.4, r = 170 + 200 * t;
        p.ell(cx + r * Math.cos(a), cy + r * Math.sin(a), 16, 22, MB, 4, 0, 360, (a * 180) / Math.PI + 90);
      }
      for (const s of [-1, 1]) { // inward squeeze arrows on the stiff sides
        const x0 = cx + s * (R + 150), x1 = cx + s * (R + 70);
        p.stroke([[x0, cy], [x1, cy]], 10, MK); p.stroke([[x1 + s * 28, cy - 26], [x1, cy], [x1 + s * 28, cy + 26]], 10, MK);
      }
      if (k > 0.85) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // corners!
        const x = cx + sx * 160, y = cy + sy * 160;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; p.stroke([[x + 18 * Math.cos(a), y + 18 * Math.sin(a)], [x + 44 * Math.cos(a), y + 44 * Math.sin(a)]], 6, "#e8b020"); }
      }
    }
    return;
  }
  // factory: a sawtooth-roof factory with a wombat face on its sign, cubes riding a conveyor out of it
  p.poly([[160, 600], [160, 300], [280, 220], [280, 300], [400, 220], [400, 300], [520, 220], [520, 600]], null, 8);
  p.poly([[450, 260], [490, 260], [490, 140], [450, 140]], null, 7);
  for (let i = 0; i < 3; i++) p.ell(480 + i * 26, 110 - i * 34, 20 + i * 8, 14 + i * 6, null, 4);
  p.ell(340, 420, 70, 58, "#a08a6c", 6); p.ell(400, 410, 22, 20, MK, 0); p.dot(360, 395, 7); p.ell(300, 372, 12, 18, null, 4); p.ell(330, 366, 12, 18, null, 4);
  p.stroke([[520, 560], [1080, 560]], 8, MK); p.stroke([[520, 600], [1080, 600]], 8, MK);
  for (let x = 540; x < 1080; x += 60) p.ell(x, 580, 16, 16, null, 4);
  for (let i = 0; i < 5; i++) { const x = 560 + ((i * 110 + k * 110) % 520); p.poly([[x, 490], [x + 64, 490], [x + 64, 554], [x, 554]], MBR, 6); }
  qmark(p, 960, 330, 0.55, MB); qmark(p, 1060, 300, 0.4, MB);
};

/** a string of Christmas lights, 900 x 240; blink alternates which bulbs are bright */
export const fxGarland = (p: Pen, blink: number) => {
  const pts: P2[] = []; for (let i = 0; i <= 40; i++) { const x = 30 + i * 21; pts.push([x, 60 + 70 * Math.sin((i / 40) * Math.PI)]); }
  p.line(pts, "#2a5a2a", 6, false);
  const cols = ["#ff4a4a", "#ffd23a", "#3ad06a", "#4aa8ff", "#ff7ad8"];
  for (let i = 0; i < 10; i++) {
    const [x, y] = pts[2 + i * 4], on = (i + blink) % 2 === 0, c = cols[i % 5];
    if (on) p.ell(x, y + 34, 28, 30, c + "66", 0);
    p.poly([[x - 7, y], [x + 7, y], [x + 7, y + 12], [x - 7, y + 12]], "#8a8a80", 3);
    p.ell(x, y + 30, 12, 18, on ? c : mul(c, [0.55, 0.55, 0.6]), 4);
  }
};

/** a folded paper aeroplane seen from the side-top, 220 x 120, nose to the right */
export const fxPlane = (p: Pen) => {
  p.poly([[10, 40], [210, 64], [30, 104]], "#fbfbf6", 5);
  p.poly([[10, 40], [210, 64], [70, 70]], "#dedfe4", 4);
};
