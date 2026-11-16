// Cast + effects first drawn for the Cadaver Synod short: Rome, 896-897. Any short can import them.

import { Pen, SKINS, rad, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";


// ================= Cadaver Synod short: Rome, 896-897 (and Sergius III, 904) =================
export const ROBE_W = "#f1ebde", GOLD = "#e1b84c", CORPSE = "#c9d3b2";
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
