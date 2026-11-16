// Cast + effects first drawn for the Newton short: England 1665 and the Royal Mint, 1696-99. Any short can import them.

import { INK, Pen, SKINS, clamp, mul, rnd } from "../toon";
import type { Outfit } from "../toon";


// ---- Newton short: England 1665 (Cambridge / Woolsthorpe) and the Royal Mint at the Tower, 1696-99 ----
export const LINEN = "#f4f1e8";
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
