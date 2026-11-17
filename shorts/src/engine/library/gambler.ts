// Cast + effects first drawn for the Gambler short (Dostoyevsky, 1866: Roulettenburg, a German spa town, then Paris).
// Every look follows the novel's own descriptions (chapter refs from the Hogarth translation); nothing from adaptations.
import { Pen, mul, mix, bodyFront } from "../toon";
import type { Outfit, P2, FrontOpts } from "../toon";

/** Granny, Antonida Vassilievna (ch. IX): 75, stout and tall, back "as straight as a board", large grey head, keen rugged
 *  features, a fresh face; "dressed in a black silk gown and white mobcap"; carried everywhere in her armchair */
export const GRANNY: Outfit = { jacket: "#2c2632", dress: "#2c2632", pants: "#2c2632", boots: "#1e1a20", hat: "mobcap", cap: "#f6f4ee",
  hair: "#c8c4c0", skin: "#f4d4bc", build: "stout", buttons: "#4a4250" };
/** the General (ch. III, XVI): 55, a widower and former cuirassier, imposing, of fair height, "a dyed moustache and whiskers",
 *  a handsome but wrinkled face, carries a frock coat well; in Paris he wears his orders */
export const GENERAL: Outfit = { jacket: "#2f3d36", pants: "#2a2a30", boots: "#1a1a1e", hat: "hair", hair: "#b8b4ac", beard: "#1c181c",
  beardStyle: "whiskers", moustache: "#1c181c", skin: "#f0c8a8", build: "stout", buttons: "#d9b04a", stock: "#f4f1e8" };
export const GENERAL_PARIS: Outfit = { ...GENERAL, orders: true };
/** Mlle Blanche de Cominges (ch. III): ~25, tall, broad sloping shoulders, "dull yellow" skin, hair "as black as Indian ink"
 *  and "sufficient to make two coiffures", black eyes, gleaming teeth; dress "invariably rich, effective, and chic" */
export const BLANCHE: Outfit = { jacket: "#9a1e34", dress: "#9a1e34", pants: "#6a2030", boots: "#2a2024", hat: "chignon", hair: "#141016",
  skin: "#e2bf8c", buttons: "#f2e6c8" };
/** the tutor, Alexei Ivanovich (ch. VI): 25, a university graduate, "merely your family tutor"; the book gives no face, so a
 *  plain young man in a modest brown frock coat */
export const TUTOR: Outfit = { jacket: "#5e4c3c", pants: "#3a3640", boots: "#2a2024", hat: "hair", hair: "#6a4a30", skin: "#f5d0b0", stock: "#f4f1e8" };
export const TUTOR_RICH: Outfit = { ...TUTOR, jacket: "#3a3a4a", buttons: "#d9b04a" };
export const TUTOR_BROKE: Outfit = { ...TUTOR, jacket: "#5a4e44", stubble: true, stock: undefined };
/** five months "with lacqueys" (ch. XVII): a valet's striped waistcoat livery */
export const TUTOR_LACKEY: Outfit = { jacket: "#3a4a7a", pants: "#2a2a34", boots: "#1e1a1e", hat: "hair", hair: "#6a4a30", skin: "#f5d0b0",
  buttons: "#d9b04a", band: "#f4f1e8" };
/** Potapitch (ch. IX): the old chamberlain "dressed in a frock coat and white waistcoat, had a bald, red head" */
export const POTAPITCH: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: "#1a1a1e", hat: "bald", hair: "#dcd8d0", skin: "#e89a7c", build: "stout",
  buttons: "#f4f1e8", stock: "#f4f1e8" };
/** Martha (ch. X): "forty-year-old and rosy, but slightly grey-headed", "in a mobcap, cotton dress" */
export const MARTHA: Outfit = { jacket: "#6a8ab8", dress: "#6a8ab8", pants: "#5a6a8a", boots: "#3a2a20", hat: "mobcap", cap: "#f2f0e8", hair: "#8a7868",
  skin: "#f8c8b0" };
/** the croupier (ch. X): "the flaxen-haired croupier"; black coat, white shirt front */
export const CROUPIER: Outfit = { jacket: "#1e1c24", pants: "#1e1c24", boots: "#141418", hat: "hair", hair: "#ead9a0", skin: "#f5d0b0", buttons: "#f4f1e8", band: "#f4f1e8" };
/** Mr Astley (ch. III): a shy, taciturn Englishman; no looks given: a sandy-haired man in a brown tweed suit */
export const ASTLEY: Outfit = { jacket: "#8a7458", pants: "#6a5a48", boots: "#3a2a20", hat: "hair", hair: "#c89a5a", skin: "#f8d8c0", stock: "#f4f1e8" };
/** hotel footmen who carry the chair (ch. IX): red livery, gold buttons, white stocks */
export const FOOTMAN = (v = 0): Outfit => ({ jacket: "#8a2a2e", pants: "#e8e0c8", boots: "#1e1a1e", hat: "hair", hair: ["#3a2a20", "#8a6a4a", "#2a2224"][v % 3],
  skin: ["#f5d0b0", "#e8b890", "#f0c8a4"][v % 3], buttons: "#d9b04a", stock: "#f4f1e8" });
/** casino onlookers: top hats and bonnets */
export const PUNTER = (v = 0): Outfit => {
  const o: Outfit = { jacket: ["#3a3040", "#2e3a4e", "#4a3a2a", "#2a3a30"][v % 4], pants: "#2a2a30", boots: "#1e1a1e", hat: v % 3 === 2 ? "hair" : "tophat",
    hair: ["#3a2a20", "#8a6a4a", "#b8b4ac", "#2a2224"][v % 4], skin: ["#f5d0b0", "#f0c8a4", "#e8b890", "#f6d6bc"][v % 4], moustache: v % 2 ? "#4a3020" : undefined };
  return v % 4 === 1 ? { ...o, dress: ["#5a8fc2", "#c25a7a", "#d9a441"][v % 3], jacket: ["#5a8fc2", "#c25a7a", "#d9a441"][v % 3], hat: "bonnet", moustache: undefined } : o;
};
/** Dostoyevsky in October 1866 (45), after Anna Snitkina's Reminiscences: light-brown hair off a high forehead, a reddish-brown
 *  beard, a worn blue cloth jacket */
export const DOSTO: Outfit = { jacket: "#3a4a6a", pants: "#2e2e36", boots: "#1e1a1e", hat: "hair", hair: "#8a6a4a", beard: "#8a5a3a", beardStyle: "short",
  moustache: "#8a5a3a", skin: "#ecd0b4", stock: "#f4f1e8" };
/** Anna Snitkina (20), the stenographer: dark hair in a plain bun, a black dress */
export const ANNA: Outfit = { jacket: "#24202a", dress: "#24202a", pants: "#24202a", boots: "#1e1a1e", hat: "chignon", hair: "#3a2a22", skin: "#f6d8c0", buttons: "#f4f1e8" };
export const ANNA_BRIDE: Outfit = { ...ANNA, jacket: "#f4efe6", dress: "#f4efe6", hat: "veil", cap: "#fdfbf6" };

// ================= props and effects =================
/** Granny's armchair (420 x 520): a red velvet wing chair in a gilt frame; carry = two carrying poles under the seat */
export const fxArmchair = (p: Pen, carry = false) => {
  const red = "#a82a34", gold = "#d9a84a";
  if (carry) for (const y of [372, 388]) p.band([[-10, y], [430, y]], "#7a5030", 12, 3, "round");
  p.poly([[70, 60], [350, 60], [372, 120], [360, 360], [60, 360], [48, 120]], gold, 6); // gilt frame of the back
  p.poly([[96, 84], [324, 84], [340, 130], [330, 340], [90, 340], [80, 130]], red, 4); // the velvet back
  for (const [x, y] of [[150, 160], [270, 160], [210, 230], [150, 290], [270, 290]] as const) p.dot(x, y, 6, mul(red, [0.7, 0.66, 0.7])); // buttons
  for (const s of [-1, 1]) { // arms
    const x0 = 210 + s * 165, x1 = 210 + s * 128;
    p.poly([[x0 - 26, 250], [x0 + 26, 250], [x1 + 22, 400], [x1 - 22, 400]].map(([x, y]) => [x, y] as P2), red, 5);
    p.ell(x0, 250, 30, 16, gold, 4);
  }
  p.poly([[64, 360], [356, 360], [362, 420], [58, 420]], red, 5); // seat front
  p.band([[58, 420], [362, 420]], gold, 10, 3);
  for (const x of [80, 340]) p.band([[x, 424], [x + (x < 200 ? -8 : 8), 500]], gold, 12, 3, "round"); // legs
};
const POCKETS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
/** a roulette wheel seen from above (600 x 600), single zero (European, as at the German spas): rot = wheel angle (rad),
 *  ball = ball angle (rad, absolute), ballR 0 = in a pocket .. 1 = rolling on the outer track */
export const fxRoulette = (p: Pen, rot = 0, ball = 0, ballR = 1) => {
  const c = 300, g = p.g;
  p.ell(c, c, 292, 292, "#6a3a1e", 6); // wooden bowl rim
  p.ell(c, c, 262, 262, "#8a5230", 4); // ball track
  p.ell(c, c, 222, 222, "#4a2a18", 4);
  const n = POCKETS.length, r0 = 150, r1 = 218;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2, v = POCKETS[i];
    const col = v === 0 ? "#2a9a4a" : REDS.has(v) ? "#c8282e" : "#1c1a20";
    const pts: P2[] = [];
    for (let k = 0; k <= 4; k++) { const a = a0 + ((a1 - a0) * k) / 4; pts.push([c + r1 * Math.cos(a), c + r1 * Math.sin(a)]); }
    for (let k = 4; k >= 0; k--) { const a = a0 + ((a1 - a0) * k) / 4; pts.push([c + r0 * Math.cos(a), c + r0 * Math.sin(a)]); }
    g.fillStyle = col; p.path(pts, true); g.fill();
    g.strokeStyle = "#e8c45a"; g.lineWidth = 2.5; g.stroke(); // brass frets
  }
  p.ell(c, c, 150, 150, null, 4);
  p.ell(c, c, 140, 140, "#9a6034", 4); // the cone
  for (let i = 0; i < 4; i++) { const a = rot + (i * Math.PI) / 2; p.band([[c, c], [c + 112 * Math.cos(a), c + 112 * Math.sin(a)]], "#e8c45a", 12, 3, "round"); p.ell(c + 112 * Math.cos(a), c + 112 * Math.sin(a), 13, 13, "#f2d478", 3); }
  p.ell(c, c, 30, 30, "#f2d478", 4); // turret
  const br = 184 + (240 - 184) * ballR;
  p.ell(c + br * Math.cos(ball), c + br * Math.sin(ball), 13, 13, "#fbf8f0", 3);
  p.dot(c + br * Math.cos(ball) - 4, c + br * Math.sin(ball) - 4, 3, "#ffffff");
};
/** the angle (rad) of pocket number v on a wheel turned by rot: its centre */
export const pocketAngle = (v: number, rot = 0) => rot + ((POCKETS.indexOf(v) + 0.5) / POCKETS.length) * Math.PI * 2;
/** a pile of gold coins (400 x 260), n 0..1 how big, stacks + a heap */
export const fxCoins = (p: Pen, n = 1, seed = 0) => {
  const k = Math.max(0, Math.min(1, n)), stacks = Math.round(1 + 7 * k);
  for (let s = 0; s < stacks; s++) {
    const x = 200 + (s - (stacks - 1) / 2) * 44 + 6 * Math.sin(s * 3.1 + seed), h = 3 + Math.round(9 * k * (0.6 + 0.4 * Math.sin(s * 1.7 + seed) ** 2));
    for (let i = 0; i < h; i++) { const y = 236 - i * 9; p.ell(x, y, 22, 7, i % 2 ? "#e8b840" : "#f2c850", 2.6, 0, 360); }
    p.ell(x, 236 - h * 9 + 2, 22, 7, "#f8dc78", 2.6);
  }
};
/** a banknote (140 x 80): a 19th-century note, cream with a green frame and a medallion; tint 0/1/2 */
export const fxBanknote = (p: Pen, tint = 0) => {
  const base = ["#e8e0c0", "#d8e4d0", "#ecd8c8"][tint % 3], ink = ["#4a7a4a", "#3a6a5a", "#8a4a3a"][tint % 3];
  p.poly([[6, 6], [134, 6], [134, 74], [6, 74]], base, 3);
  p.poly([[16, 14], [124, 14], [124, 66], [16, 66]], null, 2);
  p.g.strokeStyle = ink; p.g.lineWidth = 2; p.g.strokeRect(16, 14, 108, 52);
  p.ell(70, 40, 16, 20, mix(base, ink, 0.25), 2);
};
/** a thought bubble (480 x 400) full of money sacks */
export const fxMoneyBubble = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([250 + (200 + 9 * Math.sin(a * 9)) * Math.cos(a), 170 + (140 + 9 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 7);
  p.ell(110, 340, 22, 16, "#ffffff", 5); p.ell(70, 380, 12, 9, "#ffffff", 4);
  for (const [x, y, s] of [[170, 190, 1], [300, 200, 1.15], [240, 120, 0.8]] as const) {
    const r = 56 * s;
    p.poly([[x - 14, y - r * 1.25], [x + 14, y - r * 1.25], [x + r, y - r * 0.2], [x + r * 0.9, y + r * 0.75], [x, y + r * 0.95], [x - r * 0.9, y + r * 0.75], [x - r, y - r * 0.2]], "#b08a5a", 5);
    p.band([[x - 18, y - r], [x + 18, y - r]], "#6a4a2a", 7, 2);
    p.ell(x, y + 6, 16 * s, 16 * s, "#e2b84a", 3); p.ell(x, y + 6, 9 * s, 9 * s, null, 2);
  }
};
/** Granny's portrait (360 x 440) in a gilt frame; ribbon = the black mourning band across the corner */
export const fxPortrait = (p: Pen, ribbon = false, opts: FrontOpts = {}) => {
  p.poly([[10, 10], [350, 10], [350, 430], [10, 430]], "#d9a84a", 8);
  p.poly([[40, 40], [320, 40], [320, 400], [40, 400]], "#5a3a4a", 5);
  p.clip([[40, 40], [320, 40], [320, 400], [40, 400]], () => {
    p.g.save(); p.g.translate(25, 40); p.g.scale(0.52, 0.52); bodyFront(p, GRANNY, { mode: "stand", expr: "stern", ...opts }); p.g.restore();
  });
  p.poly([[40, 40], [320, 40], [320, 400], [40, 400]], null, 5);
  if (ribbon) {
    p.poly([[200, 10], [262, 10], [350, 98], [350, 160]], "#141018", 4);
    p.poly([[262, 150], [300, 120], [290, 220], [270, 200]], "#141018", 4);
    p.poly([[262, 150], [230, 210], [250, 228]], "#141018", 4);
  }
};
/** a stack of striped hat boxes (300 x 420), n 1..5 boxes */
export const fxHatboxes = (p: Pen, n = 3) => {
  const cols = ["#f2b8c8", "#b8d8e8", "#f2e0a8", "#c8e0b8", "#e0c8f0"];
  for (let i = 0; i < Math.min(5, n); i++) {
    const y = 400 - i * 74, w = 120 - i * 8, x = 150 + (i % 2 ? 10 : -8), col = cols[i];
    p.poly([[x - w, y], [x + w, y], [x + w, y - 64], [x - w, y - 64]], col, 4);
    for (let k = -3; k <= 3; k++) p.stroke([[x + k * w * 0.28, y - 4], [x + k * w * 0.28, y - 56]], 6, mix(col, "#ffffff", 0.5));
    p.ell(x, y - 64, w, 12, mix(col, "#ffffff", 0.25), 4);
    p.stroke([[x - 20, y - 64], [x - 34, y - 86], [x, y - 70], [x + 34, y - 86], [x + 20, y - 64]], 4, "#c8303a");
  }
};
/** a stack of manuscript pages (260 x 400), k 0..1 how tall */
export const fxPages = (p: Pen, k = 1) => {
  const h = 30 + 330 * Math.max(0, Math.min(1, k));
  p.poly([[30, 390], [230, 390], [234, 390 - h], [26, 390 - h]], "#f2ead6", 4);
  for (let y = 390 - 12; y > 390 - h + 6; y -= 12) p.stroke([[30, y], [230, y + (y % 24 ? 1 : -1)]], 1.6, "#c8bca0");
  p.poly([[20, 390 - h], [240, 390 - h], [236, 390 - h - 16], [24, 390 - h - 16]], "#fbf6ea", 3);
  for (let i = 0; i < 5; i++) p.stroke([[50, 390 - h - 9 + (i % 2) * 2], [70 + (i * 37) % 140, 390 - h - 9 + (i % 2) * 2]], 1.4, "#5a4a3a");
};
/** a single gold coin (100 x 100) for flips and drops */
export const fxGold = (p: Pen, squash = 1) => {
  p.ell(50, 50, 40 * Math.max(0.12, Math.abs(squash)), 40, "#f2c850", 4);
  if (Math.abs(squash) > 0.4) { p.ell(50, 50, 26 * Math.abs(squash), 26, null, 2.4); p.dot(40, 38, 5, "#fff4c0"); }
};
/** wedding bells (300 x 260) swinging by k (-1..1) */
export const fxBells = (p: Pen, k = 0) => {
  for (const [x, s] of [[110, 1], [190, -1]] as const) {
    const a = (k * s * 18 * Math.PI) / 180, R = (q: P2): P2 => [x + (q[0] - x) * Math.cos(a) - (q[1] - 40) * Math.sin(a), 40 + (q[0] - x) * Math.sin(a) + (q[1] - 40) * Math.cos(a)];
    p.poly([[x - 12, 40], [x + 12, 40], [x + 30, 120], [x + 56, 190], [x - 56, 190], [x - 30, 120]].map((q) => R(q as P2)), "#f2c850", 5);
    const cl = R([x, 204]); p.ell(cl[0], cl[1], 12, 12, "#d9a03a", 4);
  }
  p.band([[60, 40], [240, 40]], "#f2f0f6", 14, 3, "round");
  p.ell(150, 40, 22, 16, "#f2f0f6", 4);
};
