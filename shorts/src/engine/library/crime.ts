// Cast + effects first drawn for the Crime and Punishment short (St. Petersburg, July 1865; Siberia). Any short can import them.
// Looks follow the novel: Raskolnikov tall, thin, handsome, dark brown hair, in rags with a worn tall round hat (I.1);
// the pawnbroker tiny and withered, flannel round her neck (I.1); Lizaveta tall and timid (I.5); Porfiry short, stout,
// round-faced with almost white eyelashes (III.5); Sonya small, thin, fair-haired, a green shawl (II.7, I.2).
import { Pen, mul, rad } from "../toon";
import type { Outfit, P2 } from "../toon";

const PALE = "#f2dcc8";
export const RASKOL: Outfit = { jacket: "#4a4452", pants: "#3a3640", boots: "#2a2024", hat: "battered", hair: "#4a3020", skin: PALE, buttons: "#6a6470" };
export const RASKOL_BARE: Outfit = { ...RASKOL, hat: "hair" };
/** in the convict camp: grey convict coat, cap */
export const RASKOL_CONVICT: Outfit = { jacket: "#8a8a8e", pants: "#6a6a70", boots: "#3a3438", hat: "cap", cap: "#6a6a70", hair: "#4a3020", skin: PALE, buttons: "#4a4a50" };
/** the pawnbroker: tiny (kid build), withered, a dark kerchief, flannel at the neck */
export const ALYONA: Outfit = { jacket: "#7a5a4a", dress: "#6a5048", pants: "#5a4a40", boots: "#2a2024", hat: "veil", cap: "#4a3a3a", skin: "#e8ccb0", build: "kid", band: "#d8c8b0" };
export const LIZAVETA: Outfit = { jacket: "#8a6a4a", dress: "#8a6a4a", pants: "#6a5040", boots: "#3a2a20", hat: "veil", cap: "#c8a070", skin: "#f5d0b0" };
/** Porfiry Petrovich: short and stout, very fair (almost white lashes), civil-service frock coat */
export const PORFIRY: Outfit = { jacket: "#3e4c3e", pants: "#2e3430", boots: "#1e1a1e", hat: "hair", hair: "#e6dcb8", skin: "#f8dcc4", build: "stout", buttons: "#d9b04a", band: "#f4f1e8" };
/** Sonya: small, thin, fair hair, a plain dark dress, the green shawl */
export const SONYA: Outfit = { jacket: "#3a3446", dress: "#3a3446", pants: "#2a2630", boots: "#2a2024", hat: "hair", hair: "#e8d094", long: true, skin: "#fbe2cc", sash: "#3a8a5a" };
export const SONYA_SHAWL: Outfit = { ...SONYA, hat: "veil", cap: "#3a8a5a" };
/** Mikolka the painter: a peasant lad in a paint-spattered smock and cap */
export const MIKOLKA: Outfit = { jacket: "#d8d0c0", pants: "#5a5048", boots: "#4a3020", hat: "cap", cap: "#5a4a3a", skin: "#f5c9a0", belt: "#8a3a2a" };
/** police clerks */
export const CLERK = (v = 0): Outfit => ({ jacket: ["#2e3a4e", "#3a3e34", "#3a3040"][v % 3], pants: "#24242a", boots: "#1a1a1e", hat: "hair", hair: ["#3a2a20", "#8a6a4a", "#b8b4ac"][v % 3],
  moustache: v % 2 ? "#3a2a20" : undefined, buttons: "#d9b04a", band: "#f4f1e8", skin: ["#f5d0b0", "#ffe0c4", "#efc6a0"][v % 3] });
/** convicts in the camp */
export const CONVICT = (v = 0): Outfit => ({ jacket: ["#8a8a8e", "#7e7e84", "#94949a"][v % 3], pants: "#5a5a60", boots: "#3a3438", hat: "cap", cap: "#6a6a70",
  beard: v % 2 ? ["#5a4030", "#2a2224", "#8a6a4a"][v % 3] : undefined, beardStyle: "scruffy", skin: ["#f5d0b0", "#efc6a0", "#e8b898"][v % 3] });

// ================= effects =================
const bubble = (p: Pen) => {
  p.ell(60, 370, 14, 12, "#ffffff", 6); p.ell(100, 330, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([240 + (175 + 11 * Math.sin(a * 9)) * Math.cos(a), 170 + (135 + 11 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
};
/** Napoleon in a thought bubble (460 x 400): bicorne, grey coat, hand in his coat; hop 0..1 = jumping over a row of law books */
export const fxNapoleon = (p: Pen, hop = -1) => {
  bubble(p);
  const books = hop >= 0;
  if (books) for (let i = 0; i < 5; i++) p.poly([[180 + i * 26, 270], [204 + i * 26, 270], [204 + i * 26, 214], [180 + i * 26, 214]], ["#8a2a2a", "#2a4a8a", "#3a6a3a", "#8a6a2a", "#5a2a5a"][i], 4);
  const u = books ? Math.min(1, Math.max(0, hop)) : 0, x = books ? 120 + 240 * u : 240, y = books ? -120 * Math.sin(Math.PI * u) : 0;
  const cx = x, cy = 200 + y;
  p.poly([[cx - 34, cy + 70], [cx + 34, cy + 70], [cx + 28, cy - 4], [cx - 28, cy - 4]], "#6a6a78", 5); // coat
  p.stroke([[cx - 14, cy + 70], [cx - 14, cy + 92]], 7); p.stroke([[cx + 14, cy + 70], [cx + 14, cy + 92]], 7);
  p.ell(cx + 6, cy + 24, 9, 7, "#ffe2c2", 3); // the hand in the coat
  p.ell(cx, cy - 26, 26, 28, "#ffe2c2", 5);
  p.poly([[cx - 52, cy - 38], [cx, cy - 78], [cx + 52, cy - 38], [cx, cy - 50]], "#1e1c26", 5); // bicorne
  p.dot(cx - 8, cy - 26, 3.5); p.dot(cx + 8, cy - 26, 3.5); p.arc(cx, cy - 12, 8, 4, 200, 340, 3);
};
/** a louse in a thought bubble (460 x 400) */
export const fxLouse = (p: Pen) => {
  bubble(p);
  const cx = 240, cy = 180;
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.stroke([[cx + s * 20, cy - 10 + k * 22], [cx + s * 60, cy - 30 + k * 30], [cx + s * 74, cy - 6 + k * 30]], 5);
  p.ell(cx, cy + 10, 34, 46, "#c8b49a", 6);
  p.ell(cx, cy - 46, 20, 16, "#c8b49a", 5);
  p.dot(cx - 7, cy - 48, 4); p.dot(cx + 7, cy - 48, 4);
  for (let k = 0; k < 3; k++) p.stroke([[cx - 22, cy - 4 + k * 18], [cx + 22, cy - 4 + k * 18]], 3, mul("#c8b49a", [0.6, 0.55, 0.5]));
};
/** a cat chasing a mouse in a thought bubble (460 x 400), t 0..1 runs the chase */
export const fxCatMouse = (p: Pen, t = 0) => {
  bubble(p);
  const mx = 300 + 30 * Math.sin(t * Math.PI * 2), cx = 170 + 30 * Math.sin(t * Math.PI * 2 - 0.6);
  p.ell(mx, 220, 26, 16, "#b0a8a8", 4); p.ell(mx + 26, 208, 9, 9, "#b0a8a8", 3); p.dot(mx + 30, 206, 2.5); p.stroke([[mx - 26, 222], [mx - 60, 212]], 3);
  p.ell(cx, 200, 54, 34, "#e8a050", 5);
  p.ell(cx + 52, 170, 30, 28, "#e8a050", 5);
  for (const s of [-1, 1]) p.poly([[cx + 52 + s * 8, 148], [cx + 52 + s * 24, 128], [cx + 52 + s * 26, 154]], "#e8a050", 4);
  p.dot(cx + 44, 166, 3.5); p.dot(cx + 62, 166, 3.5);
  p.stroke([[cx - 54, 196], [cx - 90, 160]], 8, "#e8a050");
};
/** a woodcutter's axe (200 x 400, head at the top): ash handle, grey iron head with a bright edge */
export const fxAxe = (p: Pen) => {
  p.poly([[92, 70], [108, 70], [114, 390], [88, 390]], "#a87a4a", 6);
  p.stroke([[100, 120], [102, 360]], 3, "#8a5e34");
  p.poly([[60, 30], [124, 22], [130, 96], [62, 100], [20, 118], [8, 60], [24, 10]], "#8a8e98", 7);
  p.stroke([[16, 64], [24, 112]], 6, "#e8ecf4");
};
/** a hard dark shadow cast on a wall (soft card, 500 x 900): "axe" = a man holding an axe low; "arm" = an arm raised (no blade);
 *  "raise" = an arm raised with an axe (a silhouette only) */
export const fxShadow2 = (p: Pen, kind: "axe" | "arm" | "raise", col = "#1e1828") => {
  const g = p.g; g.fillStyle = col;
  g.beginPath(); g.ellipse(250, 150, 60, 68, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(195, 215); g.lineTo(305, 215); g.lineTo(330, 560); g.lineTo(305, 890); g.lineTo(258, 890); g.lineTo(250, 600); g.lineTo(242, 890); g.lineTo(195, 890); g.lineTo(170, 560); g.closePath(); g.fill();
  if (kind === "axe") {
    g.save(); g.translate(330, 520); g.rotate(rad(20));
    g.fillRect(-8, -10, 16, 230); g.beginPath(); g.moveTo(-8, 200); g.lineTo(-70, 190); g.lineTo(-80, 250); g.lineTo(-8, 238); g.closePath(); g.fill();
    g.restore();
  } else if (kind === "arm") {
    g.beginPath(); g.moveTo(290, 240); g.lineTo(420, 30); g.lineTo(450, 50); g.lineTo(320, 280); g.closePath(); g.fill();
  } else { // "raise": the arm up, the axe handle back over the head, the blade's silhouette at the top (all inside the card)
    g.beginPath(); g.moveTo(285, 235); g.lineTo(395, 120); g.lineTo(420, 140); g.lineTo(315, 270); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(398, 128); g.lineTo(330, 40); g.lineTo(346, 30); g.lineTo(414, 118); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(336, 44); g.lineTo(268, 64); g.lineTo(252, 8); g.lineTo(322, 18); g.closePath(); g.fill();
  }
};
/** a small brass Orthodox cross (120 x 160) */
export const fxCross = (p: Pen) => {
  const c = "#e1b84c";
  p.poly([[52, 6], [68, 6], [68, 154], [52, 154]], c, 4);
  p.poly([[22, 46], [98, 46], [98, 62], [22, 62]], c, 4);
  p.poly([[36, 24], [84, 24], [84, 34], [36, 34]], c, 3);
  p.poly([[34, 110], [86, 98], [86, 108], [34, 120]], c, 3);
};
/** the purse (200 x 200) */
export const fxPurse2 = (p: Pen) => {
  p.ell(100, 120, 70, 60, "#7a4a2a", 6);
  p.poly([[60, 70], [140, 70], [130, 44], [70, 44]], "#5a3a20", 5);
  p.stroke([[100, 44], [100, 26]], 5); p.ell(100, 22, 8, 8, "#d9b04a", 3);
};
