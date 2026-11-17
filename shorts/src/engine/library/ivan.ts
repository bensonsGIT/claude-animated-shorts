// Cast + effects first drawn for The Death of Ivan Ilych short (Tolstoy, 1886). Looks follow the novella's own descriptions
// (chapter refs from the Maude translation); nothing from adaptations.
import { Pen, mul, mix, bodyFront } from "../toon";
import type { Outfit, P2, FrontOpts } from "../toon";

/** Ivan Ilych (ch. II): a capable, cheerful, "comme il faut" official of the Court; a neat brown beard; the uniform-cut dark
 *  green frock coat of the civil service, a white stock */
export const IVAN: Outfit = { jacket: "#2f4a3c", pants: "#2a2a32", boots: "#1a1a1e", hat: "hair", hair: "#6a4a30",
  moustache: "#6a4a30", skin: "#f3d0b2", buttons: "#d9b04a", stock: "#f4f1e8" };
/** ill (ch. VI-VII): thin, sallow, grey-yellow; a dressing gown over his nightshirt */
export const IVAN_SICK: Outfit = { ...IVAN, jacket: "#7a5a7a", buttons: "#c8b07a", skin: "#dcc896", stock: "#f2efe4" };
/** Praskovya Fedorovna (ch. I): short and plump, broadening "from her shoulders downwards"; plum silk by day */
export const WIFE: Outfit = { jacket: "#6a2a4a", dress: "#6a2a4a", pants: "#4a2030", boots: "#2a2024", hat: "chignon", hair: "#3a2a22", skin: "#f4d0b8",
  build: "stout", buttons: "#f2e6c8" };
/** in mourning (ch. I): all in black, with black lace on her head */
export const WIFE_BLACK: Outfit = { ...WIFE, jacket: "#1e1a22", dress: "#1e1a22", hat: "veil", cap: "#2a2430" };
/** ...and dressed for the theatre (ch. VIII): an evening gown */
export const WIFE_EVENING: Outfit = { ...WIFE, jacket: "#a83a5a", dress: "#a83a5a" };
/** Liza, the daughter (ch. VIII): in evening dress, young and healthy */
export const LIZA: Outfit = { jacket: "#8ab4e0", dress: "#8ab4e0", pants: "#6a8ab0", boots: "#2a2024", hat: "chignon", hair: "#4a3424", skin: "#f8dcc6",
  buttons: "#f6f0e0" };
/** her fiance Fedor Petrovich (ch. VIII): an examining magistrate, in evening dress (tails, white tie) */
export const FIANCE: Outfit = { jacket: "#1a1a22", pants: "#1a1a22", boots: "#121216", hat: "hair", hair: "#2a2028", moustache: "#2a2028", skin: "#f5d0b0",
  buttons: "#1a1a22", stock: "#ffffff" };
/** Gerasim (ch. VII): a clean, fresh peasant lad grown stout on town food, always cheerful; a clean hessian apron, a cotton
 *  print shirt with the sleeves rolled up over strong bare young arms */
export const GERASIM: Outfit = { jacket: "#c84a40", pants: "#3a3a44", boots: "#2a2020", hat: "frizz", hair: "#d8b878", skin: "#f8cfa8", build: "stout",
  buttons: "#f2e6c8", apron: "#d8ccae" };
/** Vasya (ch. I, XII): the schoolboy son, very like his father, in his school uniform */
export const VASYA: Outfit = { jacket: "#2a3456", pants: "#2a3456", boots: "#1a1a1e", hat: "hair", hair: "#6a4a30", skin: "#f6d6bc", build: "kid",
  buttons: "#e8c45a", belt: "#1a1a1e" };
/** Peter Ivanovich (ch. I): colleague and old school friend */
export const PETER: Outfit = { jacket: "#1e1c24", pants: "#24222a", boots: "#141418", hat: "hair", hair: "#1e1a1e", beard: "#1e1a1e", beardStyle: "whiskers",
  moustache: "#1e1a1e", skin: "#f5d0b0", buttons: "#d9b04a", stock: "#f4f1e8" };
/** Fedor Vasilievich (ch. I): the colleague who works out the promotions first */
export const FEDOR: Outfit = { jacket: "#4a4a54", pants: "#2a2a32", boots: "#1a1a1e", hat: "bald", hair: "#b8b0a8", moustache: "#b8b0a8", skin: "#f0c4a4",
  build: "stout", buttons: "#d9b04a", stock: "#f4f1e8" };
/** a third colleague at the Law Courts (Shebek, ch. I) */
export const SHEBEK: Outfit = { jacket: "#2e3a4e", pants: "#2a2a30", boots: "#1a1a1e", hat: "hair", hair: "#a8743a", skin: "#f6d6bc", specs: true,
  buttons: "#d9b04a", stock: "#f4f1e8" };
/** the upholsterer (ch. III): a workman's cap and blue smock */
export const UPHOLSTERER: Outfit = { jacket: "#4a6a9a", pants: "#3a3a40", boots: "#2a2020", hat: "cap", cap: "#3a3a44", hair: "#5a3a24", moustache: "#5a3a24",
  skin: "#f0c8a4" };
/** the celebrated doctors (ch. IV, VIII): grave, important, spectacled, in black */
export const DOCTOR = (v = 0): Outfit => ({ jacket: v ? "#2a2830" : "#1c1c24", pants: "#24242c", boots: "#121216", hat: v ? "bald" : "hair",
  hair: v ? "#c8c4bc" : "#8a8680", beard: v ? undefined : "#a8a49c", beardStyle: v ? undefined : "short", moustache: "#a8a49c", skin: v ? "#f2c8a8" : "#f4d4bc",
  specs: true, buttons: "#1c1c24", stock: "#f4f1e8" });
/** card-party colleague at Fedor Vasilievich's (ch. I) */
export const PLAYER = (v = 0): Outfit => ({ jacket: ["#3a3040", "#2e3a4e", "#4a3a2a"][v % 3], pants: "#2a2a30", boots: "#1e1a1e", hat: "hair",
  hair: ["#3a2a20", "#8a6a4a", "#b8b4ac"][v % 3], skin: ["#f5d0b0", "#f0c8a4", "#e8b890"][v % 3], moustache: ["#3a2a20", undefined, "#b8b4ac"][v % 3],
  buttons: "#d9b04a", stock: "#f4f1e8" });

// ================= effects =================
const cloud = (p: Pen, cx: number, cy: number, rx: number, ry: number) => {
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([cx + (rx + 9 * Math.sin(a * 9)) * Math.cos(a), cy + (ry + 9 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 7);
};
/** a thought bubble (480 x 400) with tail to the lower left: "chair" a bigger office chair, "money" a salary purse,
 *  "kidney" a bean-shaped kidney, "appendix" the gut with its little worm */
export const fxThought = (p: Pen, kind: "chair" | "money" | "kidney" | "appendix" | "medal") => {
  cloud(p, 250, 170, 200, 140);
  p.ell(110, 340, 22, 16, "#ffffff", 5); p.ell(70, 380, 12, 9, "#ffffff", 4);
  if (kind === "chair") { // a grand high-backed official's armchair, gilded
    const red = "#a82a34", gold = "#d9a84a";
    p.poly([[180, 60], [320, 60], [334, 100], [326, 230], [174, 230], [166, 100]], gold, 5);
    p.poly([[196, 78], [304, 78], [314, 106], [308, 220], [192, 220], [186, 106]], red, 4);
    p.poly([[150, 220], [350, 220], [356, 262], [144, 262]], red, 5);
    for (const x of [160, 340]) p.band([[x, 264], [x + (x < 250 ? -6 : 6), 300]], gold, 9, 3, "round");
    p.ell(250, 46, 26, 18, gold, 4);
  } else if (kind === "medal") { // an order on its ribbon: a red ribbon, a gold eight-point star
    p.poly([[210, 50], [290, 50], [280, 150], [250, 130], [220, 150]], "#c8303a", 5);
    const st: P2[] = [];
    for (let i = 0; i < 16; i++) { const r = i % 2 ? 40 : 82, an = (-90 + i * 22.5) * Math.PI / 180; st.push([250 + r * Math.cos(an), 210 + r * Math.sin(an)]); }
    p.poly(st, "#e8c45a", 6); p.ell(250, 210, 24, 24, "#c8303a", 4);
  } else if (kind === "money") {
    for (const [x, y, s] of [[180, 190, 1], [310, 200, 1.1]] as const) {
      const r = 58 * s;
      p.poly([[x - 14, y - r * 1.25], [x + 14, y - r * 1.25], [x + r, y - r * 0.2], [x + r * 0.9, y + r * 0.75], [x, y + r * 0.95], [x - r * 0.9, y + r * 0.75], [x - r, y - r * 0.2]], "#b08a5a", 5);
      p.band([[x - 18, y - r], [x + 18, y - r]], "#6a4a2a", 7, 2);
      p.ell(x, y + 6, 16 * s, 16 * s, "#e2b84a", 3);
    }
  } else if (kind === "kidney") { // a bean, with a little "float" wave under it
    const pts: P2[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, r = 1 - 0.32 * Math.max(0, Math.cos(a - Math.PI)) ** 3;
      pts.push([250 + 120 * r * Math.cos(a), 160 + 80 * r * Math.sin(a)]);
    }
    p.poly(pts, "#b8484a", 6);
    p.arc(230, 140, 60, 30, 200, 300, 4, "#e8807a");
    for (let i = 0; i < 3; i++) p.stroke([[150 + i * 70, 268], [170 + i * 70, 256], [190 + i * 70, 268], [210 + i * 70, 256]], 5, "#5a8ac8");
  } else { // a coil of gut with the appendix poking out
    const pts: P2[] = [];
    for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI * 5, r = 30 + i * 1.6; pts.push([240 + r * Math.cos(a), 170 + 0.7 * r * Math.sin(a)]); }
    p.line(pts, "#e89a8a", 26);
    p.line([[340, 200], [372, 236], [362, 262]], "#e07a6a", 16);
    p.dot(362, 262, 9, "#e07a6a");
  }
};
/** a folded newspaper held open (360 x 260): columns of grey lines, a black-bordered notice in the corner (no words) */
export const fxNewspaper = (p: Pen) => {
  p.poly([[10, 20], [350, 10], [352, 250], [8, 246]], "#f2ecdc", 5);
  p.stroke([[180, 14], [180, 248]], 3, "#c8c0ac");
  p.band([[30, 40], [330, 36]], "#3a3632", 12, 0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 9; r++) {
    const x = 26 + c * 80, y = 70 + r * 18;
    if (c === 3 && r < 5) continue;
    p.stroke([[x, y], [x + 64 - (r % 3) * 8, y]], 3.5, "#9a948a");
  }
  p.poly([[268, 64], [334, 62], [334, 150], [268, 152]], "#ffffff", 4); // the black-bordered death notice
  p.poly([[276, 72], [326, 70], [326, 142], [276, 144]], null, 3);
  p.stroke([[286, 94], [316, 94]], 3, "#5a5450"); p.stroke([[286, 112], [312, 112]], 3, "#5a5450");
};
/** rolls of pink-flowered cretonne leaning on each other (n 1..4), 320 x 360 */
export const fxBolts = (p: Pen, n: number) => {
  for (let i = 0; i < n; i++) {
    const x = 60 + i * 60, top = 40 + (i % 2) * 40, rot = (i - 1.5) * 0.08;
    const pts: P2[] = [[x - 30, 350], [x + 30, 350], [x + 30 + rot * 300, top], [x - 30 + rot * 300, top]];
    p.poly(pts, "#f2b8c6", 5);
    for (let k = 0; k < 6; k++) { const yy = 320 - k * 48, xx = x + rot * (350 - yy); p.dot(xx - 8, yy, 7, "#d8486a"); p.dot(xx + 10, yy - 20, 5, "#6a9a5a"); }
    p.ell(x + rot * 310, top, 30, 10, "#f8d8e0", 4);
  }
};
/** a bruise blooming on the side (200 x 160), k 0 small .. 1 big */
export const fxBruise = (p: Pen, k: number) => {
  const r = 30 + 40 * k;
  p.ell(100, 80, r * 1.2, r, mix("#8a5aa8", "#5a3a7a", k), 0);
  p.ell(96, 76, r * 0.6, r * 0.5, mix("#b07ac8", "#7a4a9a", k), 0);
};
/** a sour-taste squiggle (220 x 180) by the mouth */
export const fxTaste = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const pts: P2[] = [];
    for (let k = 0; k <= 12; k++) pts.push([40 + k * 12, 50 + i * 40 + 10 * Math.sin(k * 1.4 + t * 10 + i)]);
    p.line(pts, "#9ac850", 7);
  }
};
/** playing cards: a face-down card back (120 x 170) or a face card (red / black pip, no numbers) */
export const fxCard = (p: Pen, kind: 0 | 1 | 2) => {
  p.poly([[6, 6], [114, 6], [114, 164], [6, 164]], kind ? "#fbf8f0" : "#2a4a8a", 4);
  if (!kind) { p.poly([[18, 18], [102, 18], [102, 152], [18, 152]], null, 2); for (let i = 0; i < 5; i++) p.stroke([[24, 30 + i * 26], [96, 30 + i * 26]], 3, "#5a7ac0"); return; }
  const col = kind === 1 ? "#c8282e" : "#1c1a20";
  if (kind === 1) { p.ell(48, 78, 20, 18, col, 0); p.ell(72, 78, 20, 18, col, 0); p.poly([[30, 86], [90, 86], [60, 126]], col, 0); }
  else { p.poly([[60, 46], [92, 92], [60, 110], [28, 92]], col, 0); p.poly([[54, 100], [66, 100], [72, 128], [48, 128]], col, 0); }
};
/** tear drops (60 x 90) */
export const fxTear = (p: Pen) => { p.poly([[30, 6], [50, 52], [44, 76], [30, 84], [16, 76], [10, 52]], "#8ac8f0", 4); p.dot(24, 56, 5, "#e8f6ff"); };

/** shot 11 tableau (1400 x 1000 canvas, design 1400 x 1000 at k): Ivan lying on the sofa, head on a pillow at the left, his
 *  legs raised onto the shoulders of Gerasim, who sits on a low stool at the right. Both drawn with bodyFront onto rotated
 *  sub-canvases (the card is an fx card standing in front of the 3D sofa). */
export const fxLegsUp = (p: Pen, ivan: FrontOpts, ger: FrontOpts) => {
  const g = p.g;
  // Gerasim sitting at the right, facing left (toward Ivan)
  // ... on a tall kitchen stool, so his shoulders are level with Ivan's raised feet
  p.poly([[930, 664], [1150, 664], [1150, 690], [930, 690]], "#8a6a44", 5);
  for (const x of [950, 1125]) p.poly([[x - 9, 690], [x + 9, 690], [x + (x < 1000 ? -2 : 16), 998], [x + (x < 1000 ? -20 : -2), 998]], "#7a5a38", 4);
  p.band([[946, 860], [1134, 860]], "#7a5a38", 10, 3);
  g.save(); g.translate(760, -190); g.scale(0.92, 0.92);
  bodyFront(p, GERASIM, { mode: "sit", facing: -1, ...ger });
  g.restore();
  // Ivan lying: his body card rotated so the head is low-left and the feet rest on Gerasim's shoulders
  g.save(); g.translate(538, 525); g.rotate(-1.75); g.scale(0.92, 0.92); g.translate(-300, -520);
  bodyFront(p, IVAN_SICK, { mode: "stand", ...ivan });
  g.restore();
};
/** a cushion / pillow (260 x 160) */
export const fxPillow = (p: Pen) => { p.poly([[20, 40], [240, 24], [250, 120], [16, 136]], "#f4f0e6", 6); p.stroke([[40, 80], [220, 70]], 3, "#d8d0c0"); };
export { mul };
