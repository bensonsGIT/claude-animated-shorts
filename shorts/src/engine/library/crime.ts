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
/** a droshky: a horse pulling a little open cab with a bearded driver, side-on (720 x 360, wheels on y 350, facing right;
 *  dir -1 mirrors); leg 0-3 = trot cycle */
export const fxDroshky = (p: Pen, leg = 0, dir = 1) => {
  const g = p.g; g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 720, 0);
  const horse = "#7a4a2e", dark = "#3a2418", cab = "#2a2a34";
  // cab + wheels
  for (const [x, r] of [[110, 62], [250, 52]] as const) { p.ell(x, 350 - r, r, r, null, 7); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI + leg * 0.4; p.stroke([[x - r * Math.cos(a), 350 - r - r * Math.sin(a)], [x + r * Math.cos(a), 350 - r + r * Math.sin(a)]], 3); } }
  p.poly([[60, 250], [290, 250], [300, 200], [180, 190], [150, 130], [70, 140]], cab, 6);
  p.ell(115, 120, 26, 28, "#ffe0c4", 5); p.poly([[85, 105], [145, 105], [140, 70], [90, 70]], "#3a2a2a", 5); // driver + hat
  p.poly([[95, 130], [135, 130], [128, 170], [102, 170]], "#6a4a3a", 4); // beard
  p.stroke([[150, 160], [440, 190]], 4, dark); // reins
  p.stroke([[290, 245], [460, 235]], 7, dark); // shaft
  // horse
  const bob = [0, -6, 0, -6][leg];
  const legs: [number, number][] = [[[420, 470], [430, 440], [470, 450], [440, 460]][leg] as [number, number], [[600, 610], [590, 630], [620, 600], [600, 620]][leg] as [number, number]];
  for (const [a, b] of legs) { p.line([[a, 250 + bob], [a - 10, 300], [a + (b - a) * 0.3, 345]], horse, 14, true); p.line([[b, 250 + bob], [b + 10, 300], [b - 6, 345]], horse, 14, true); }
  p.ell(520, 230 + bob, 110, 48, horse, 7);
  p.line([[600, 210 + bob], [640, 140 + bob]], horse, 40, true);
  p.ell(666, 130 + bob, 40, 22, horse, 6, 0, 360, 20);
  p.dot(670, 120 + bob, 5);
  p.stroke([[410, 215 + bob], [380, 270 + bob]], 10, dark); // tail
  p.stroke([[612, 170 + bob], [640, 120 + bob]], 8, dark); // mane
  p.poly([[600, 110 + bob], [630, 60 + bob], [650, 112 + bob]], "#c8303a", 4); // the duga arch over the collar
  g.restore();
};
/** a canal barge poled by a boatman, side-on (620 x 260, waterline at y 220) */
export const fxBarge = (p: Pen, dir = 1, k = 0) => {
  const g = p.g; g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 620, 0);
  p.poly([[20, 170], [600, 170], [560, 230], [60, 230]], "#6a4a32", 7);
  for (let i = 0; i < 4; i++) p.poly([[120 + i * 90, 170], [190 + i * 90, 170], [185 + i * 90, 130], [125 + i * 90, 130]], ["#c8a870", "#a8804a", "#d8b880", "#b89058"][i], 4); // sacks
  p.ell(520, 110, 22, 24, "#ffe0c4", 5); p.poly([[498, 130], [542, 130], [548, 172], [492, 172]], "#5a6a7a", 5); p.ell(520, 88, 26, 10, "#3a3a44", 4);
  p.stroke([[560 - 30 * k, 40], [470 + 30 * k, 250]], 6, "#8a6a4a"); // the pole
  g.restore();
};
/** a pigeon (120 x 100); wing 0 = folded, 1 = up, 2 = down */
export const fxPigeon = (p: Pen, wing = 0) => {
  p.ell(60, 62, 34, 22, "#8a8e9a", 5); p.ell(90, 44, 14, 13, "#7a7e8a", 4); p.dot(94, 42, 2.5);
  p.poly([[102, 44], [114, 48], [102, 50]], "#c8a060", 2); p.poly([[28, 62], [6, 54], [8, 72]], "#6a6e7a", 3);
  if (wing === 1) p.poly([[50, 52], [30, 6], [76, 44]], "#9a9eaa", 4);
  else if (wing === 2) p.poly([[50, 64], [24, 96], [76, 70]], "#9a9eaa", 4);
  else p.ell(58, 58, 20, 10, "#9a9eaa", 3);
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
