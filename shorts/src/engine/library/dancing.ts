// Cast + effects first drawn for the Dancing Plague short (Strasbourg, July-September 1518). Any short can import them.
import { Pen, mul, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";

const SK = ["#ffe0c4", "#f5d0b0", "#efc6a0", "#f5c9a0"];
/** Frau Troffea: a russet dress, white linen coif */
export const TROFFEA: Outfit = { jacket: "#a8583a", dress: "#a8583a", pants: "#6a4a3a", boots: "#3a2a20", hat: "veil", cap: "#f4efe4", skin: "#f5d0b0", band: "#f4efe4" };
export const HUSBAND: Outfit = { jacket: "#6a4a32", pants: "#4a3a2a", boots: "#3a2a20", hat: "cap", cap: "#5a3a2a", beard: "#6a4630", beardStyle: "short", skin: "#efc6a0", build: "stout" };
/** physicians: long black robes, black skullcaps, beards */
export const PHYSICIAN = (v = 0): Outfit => ({ jacket: "#1e1c24", dress: "#1e1c24", pants: "#1e1c24", boots: "#1a1a1e", hat: "zucchetto", cap: "#14121a", hair: v ? "#b8b4ac" : "#3a2a20",
  beard: v ? "#d8d4cc" : "#2a2224", beardStyle: v ? "long" : "short", skin: SK[v % 4], build: v ? "stout" : "adult", band: "#f4f1e8" });
/** councillors: fur-trimmed gowns, flat Tudor bonnets */
export const COUNCILLOR = (v = 0): Outfit => ({ jacket: ["#8a2a2e", "#2e5a3a", "#3a3a6a"][v % 3], dress: ["#8a2a2e", "#2e5a3a", "#3a3a6a"][v % 3], pants: "#2a2228", boots: "#2a2024",
  hat: "tudor", cap: ["#1e1a22", "#3a2a1e", "#2a2a3a"][v % 3], hair: ["#5a3a26", "#b8b4ac", "#2a1e1a"][v % 3], moustache: v % 2 ? "#6a4a30" : undefined,
  beard: v === 1 ? "#d8d4cc" : undefined, beardStyle: "short", buttons: "#d9b04a", skin: SK[(v + 1) % 4], build: v === 1 ? "stout" : "adult", band: "#e8dcc4" });
/** musicians: parti-coloured doublets */
export const MUSICIAN = (v = 0): Outfit => ({ jacket: ["#c8303a", "#d8a83a", "#3a6ab0"][v % 3], pants: ["#d8a83a", "#c8303a", "#e8e0d0"][v % 3], boots: "#3a2a20", hat: "cap",
  cap: ["#3a6ab0", "#8a2a2e", "#d8a83a"][v % 3], skin: SK[(v + 2) % 4], belt: "#3a2a20" });
export const STRONGMAN = (v = 0): Outfit => ({ jacket: "#7a6a52", pants: "#4a3a2a", boots: "#3a2a20", hat: v ? "hair" : null, hair: "#3a2a20", beard: v ? "#3a2a20" : undefined, beardStyle: "short",
  skin: "#e8b898", build: "stout", belt: "#3a2a20" });
export const GUARD: Outfit = { jacket: "#a83a3a", pants: "#e8e0d0", boots: "#2a2024", hat: "peaked", cap: "#8a8e98", skin: "#f5d0b0", moustache: "#5a3a26", belt: "#3a2a20", buttons: "#c8ccd4" };
/** townsfolk of 1518: men in doublets + caps, women in coifs and plain dresses */
export const FOLK1518 = (v = 0): Outfit => {
  const skin = SK[v % 4];
  if (v % 2) {
    const d = ["#5a6a8a", "#8a5a3a", "#6a7a4a", "#8a3a4a", "#4a5a6a"][(v >> 1) % 5];
    return { jacket: d, dress: d, pants: "#e8d8c0", boots: "#3a2a20", hat: "veil", cap: ["#f4efe4", "#e8dcc4", "#d8c8a8"][v % 3], skin, band: "#f4efe4" };
  }
  return { jacket: ["#7a4a2a", "#4a5a7a", "#6a3a3a", "#5a6a3a", "#8a6a3a"][(v >> 1) % 5], pants: ["#3a3040", "#6a4a3a", "#2e3a4a"][v % 3], boots: "#3a2a20", hat: "cap",
    cap: ["#3a2a20", "#8a2a2e", "#2e4a6a", "#5a4a2a"][(v >> 1) % 4], beard: v % 4 === 0 ? ["#6a4630", "#3a2a20", "#b8b4ac"][v % 3] : undefined, beardStyle: "short", skin, belt: "#3a2a20" };
};

// ================= effects =================
/** a fiddle held up (200 x 400) with its bow */
export const fxFiddle = (p: Pen, bow = 0) => {
  p.ell(100, 260, 60, 90, "#a8602a", 6); p.ell(100, 260, 30, 18, "#6a3a1a", 4);
  p.poly([[90, 170], [110, 170], [108, 40], [92, 40]], "#3a2418", 5); p.ell(100, 34, 14, 18, "#a8602a", 4);
  for (const x of [94, 100, 106]) p.stroke([[x, 50], [x, 320]], 1.4, "#e8e0d0");
  p.stroke([[20 + 40 * bow, 200 - 30 * bow], [190 - 30 * bow, 330 + 10 * bow]], 4, "#5a3a20");
};
/** a shawm / pipe (120 x 400) */
export const fxPipe = (p: Pen) => {
  p.poly([[52, 20], [68, 20], [80, 330], [96, 390], [24, 390], [40, 330]], "#8a5a2a", 5);
  for (let k = 0; k < 6; k++) p.dot(60, 120 + k * 32, 5, "#2a1a10");
};
/** a frame drum (240 x 240) */
export const fxTabor = (p: Pen, hit = 0) => {
  p.ell(120, 120, 100, 100, "#e8d8b0", 8); p.ell(120, 120, 82, 82, null, 3, 0, 360);
  p.stroke([[200, 40 - 30 * hit], [130, 110]], 7, "#5a3a20");
};
/** the painted wooden statue of Saint Vitus on a plinth (300 x 600): a young saint in a red cloak with a palm */
export const fxVitus = (p: Pen) => {
  p.poly([[60, 600], [240, 600], [230, 520], [70, 520]], "#9a8a7a", 6);
  p.poly([[96, 520], [204, 520], [196, 250], [104, 250]], "#c8303a", 6);
  p.poly([[110, 300], [190, 300], [184, 250], [116, 250]], "#e8c868", 4);
  p.ell(150, 200, 48, 52, "#f5d6b8", 6);
  p.ell(150, 168, 52, 26, "#8a5a2a", 5, 180, 360);
  p.ell(150, 120, 70, 16, null, 6); p.g.strokeStyle = "#e8c23a"; p.g.lineWidth = 8; p.g.beginPath(); p.g.ellipse(150, 120, 70, 16, 0, 0, Math.PI * 2); p.g.stroke(); // halo
  p.dot(135, 200, 5); p.dot(165, 200, 5); p.arc(150, 222, 12, 6, 20, 160, 3);
  p.stroke([[220, 470], [250, 260]], 6, "#5a7a3a");
  for (let k = 0; k < 6; k++) p.stroke([[248, 280 + k * 14], [278 - k * 2, 260 + k * 18]], 4, "#5a9a3a");
};
/** an ox-cart full of still-twitching dancers, side-on (760 x 400, wheels on y 390, facing right); leg 0-3 */
export const fxWagon = (p: Pen, leg = 0, seed = 0) => {
  // passengers: heads + waving arms over the cart rail
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 62, bob = 8 * Math.sin(leg * 1.6 + i * 2.1), y = 170 + bob;
    const skin = SK[(i + seed) % 4], col = ["#5a6a8a", "#8a5a3a", "#6a7a4a", "#8a3a4a", "#4a5a6a"][(i + seed) % 5];
    p.poly([[x - 26, 250], [x + 26, 250], [x + 22, y + 30], [x - 22, y + 30]], col, 5);
    p.stroke([[x - 18, y + 40], [x - 40, y - 20 - 14 * Math.sin(leg + i)]], 7);
    p.stroke([[x + 18, y + 40], [x + 40, y - 18 - 14 * Math.cos(leg + i)]], 7);
    p.ell(x, y, 24, 26, skin, 5);
    p.dot(x - 8, y - 2, 3); p.dot(x + 8, y - 2, 3);
    if (rnd(seed, i) < 0.5) p.ell(x, y - 18, 26, 12, "#f4efe4", 4, 180, 360);
  }
  p.poly([[40, 230], [430, 230], [430, 320], [40, 320]], "#8a6a4a", 7);
  for (let x = 60; x < 430; x += 60) p.stroke([[x, 232], [x, 318]], 3, mul("#8a6a4a", [0.6, 0.55, 0.5]));
  for (const x of [110, 360]) { p.ell(x, 330, 58, 58, "#6a4a32", 7); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI + leg * 0.35; p.stroke([[x - 54 * Math.cos(a), 330 - 54 * Math.sin(a)], [x + 54 * Math.cos(a), 330 + 54 * Math.sin(a)]], 4); } }
  p.stroke([[430, 280], [520, 270]], 8, "#5a3a20");
  // the ox
  const ox = "#c8a878", bob = leg % 2 ? -4 : 0;
  const legs: [number, number][] = [[540, [520, 560, 540, 520][leg]], [660, [680, 640, 660, 690][leg]]];
  for (const [a, b] of legs) { p.line([[a, 280 + bob], [a, 330], [b, 388]], ox, 16, true); p.line([[a + 20, 280 + bob], [a + 20, 330], [b + 16, 388]], mul(ox, [0.85, 0.82, 0.8]), 16, true); }
  p.ell(600, 260 + bob, 100, 54, ox, 7);
  p.ell(712, 250 + bob, 40, 34, ox, 6); p.dot(722, 240 + bob, 5);
  p.poly([[700, 214 + bob], [688, 180 + bob], [706, 216 + bob]], "#f4efe4", 3); p.poly([[728, 214 + bob], [744, 180 + bob], [738, 218 + bob]], "#f4efe4", 3);
  p.stroke([[500, 240 + bob], [480, 300 + bob]], 6, mul(ox, [0.6, 0.55, 0.5]));
};
/** thought bubbles (460 x 400): "hot" = a heart in a boiling pot, "famine" = an empty bowl, "sick" = a sick bed */
export const fxIdea = (p: Pen, kind: "hot" | "famine" | "sick", t = 0) => {
  p.ell(60, 370, 14, 12, "#ffffff", 6); p.ell(100, 330, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([240 + (175 + 11 * Math.sin(a * 9)) * Math.cos(a), 170 + (135 + 11 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  const cx = 240, cy = 180;
  if (kind === "hot") {
    for (let k = 0; k < 3; k++) { const fl = 20 * Math.sin(t * 8 + k); p.poly([[cx - 60 + k * 50, cy + 110], [cx - 40 + k * 50, cy + 60 + fl], [cx - 20 + k * 50, cy + 110]], "#ff8a2a", 4); }
    p.poly([[cx - 90, cy - 10], [cx + 90, cy - 10], [cx + 70, cy + 80], [cx - 70, cy + 80]], "#5a5a64", 6);
    for (let k = 0; k < 5; k++) p.ell(cx - 60 + k * 30, cy - 14 - 6 * Math.abs(Math.sin(t * 6 + k)), 12, 10, "#ffffff", 3);
    const hy = cy - 40 - 6 * Math.sin(t * 5);
    p.poly([[cx, hy + 30], [cx - 34, hy - 4], [cx - 22, hy - 24], [cx, hy - 12], [cx + 22, hy - 24], [cx + 34, hy - 4]], "#e8405a", 5);
  } else if (kind === "famine") {
    p.ell(cx, cy + 10, 110, 40, "#a8804a", 6); p.ell(cx, cy - 4, 96, 24, "#6a4a2a", 4);
    p.stroke([[cx + 70, cy - 70], [cx + 20, cy - 10]], 7, "#c8c8d0"); p.ell(cx + 10, cy - 2, 18, 8, "#c8c8d0", 3);
  } else {
    p.poly([[cx - 120, cy + 60], [cx + 120, cy + 60], [cx + 120, cy + 10], [cx - 120, cy + 10]], "#8a6a4a", 6);
    p.poly([[cx - 110, cy + 10], [cx + 110, cy + 10], [cx + 100, cy - 20], [cx - 100, cy - 20]], "#e8e0d0", 5);
    p.ell(cx - 80, cy - 30, 26, 24, "#d8e8b0", 5); p.dot(cx - 88, cy - 34, 3); p.dot(cx - 72, cy - 34, 3); p.arc(cx - 80, cy - 16, 8, 4, 200, 340, 3);
    p.ell(cx - 80, cy - 62, 24, 10, "#e8e8f0", 4);
  }
};
/** a wooden bucket (200 x 200) */
export const fxBucket = (p: Pen) => {
  p.poly([[40, 40], [160, 40], [148, 190], [52, 190]], "#9a7048", 6);
  for (const y of [70, 160]) p.stroke([[44, y], [156, y]], 6, "#5a5a64");
  p.ell(100, 40, 60, 14, "#6a9ac8", 5);
};
/** a blank scroll held open (300 x 200) */
export const fxScrollOpen = (p: Pen) => {
  p.poly([[40, 30], [260, 30], [260, 170], [40, 170]], "#f2e6c8", 5);
  for (const x of [40, 260]) p.ell(x, 100, 16, 80, "#d8c8a0", 5);
  for (let k = 0; k < 6; k++) p.stroke([[70, 55 + k * 20], [230 - (k % 3) * 20, 55 + k * 20]], 3, "#a8987a");
};
