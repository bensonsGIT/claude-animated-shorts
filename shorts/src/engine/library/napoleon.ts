// Cast + effects first drawn for the Napoleon rabbit-hunt short (Berthier's park outside Paris, summer 1806).
// Any short can import them.
import { Pen, mul } from "../toon";
import type { Outfit, P2 } from "../toon";

/** Napoleon in his hunting dress (Thiébault: short green coats trimmed with gold braid); plain bicorne, white cravat, breeches */
export const NAPOLEON: Outfit = { jacket: "#2f6a3e", pants: "#f2ede2", boots: "#1e1a20", hat: "bicorne", hair: "#3a2a20", skin: "#f8dcc4",
  buttons: "#d9b04a", band: "#f6f2ea", belt: "#d9b04a" };
/** Napoleon at war: the grey redingote (map tent) */
export const NAPOLEON_WAR: Outfit = { ...NAPOLEON, jacket: "#7c7c88", buttons: "#c8c8d0", belt: null };
/** Marshal Berthier: stout, dark curly hair, ruddy, dark-blue marshal's coat with gold, red sash, plumed bicorne */
export const BERTHIER: Outfit = { jacket: "#26325e", pants: "#f2ede2", boots: "#1e1a20", hat: "bicorne_plume", hair: "#2e2018", skin: "#f4c4a4",
  buttons: "#e2b84a", sash: "#c0353a", build: "stout", band: "#f6f2ea" };
/** Berthier's buyer: a timid clerk in brown, spectacles */
export const BUYER: Outfit = { jacket: "#8a6a48", pants: "#5a4a3a", boots: "#3a2a20", hat: "cap", cap: "#6a5a48", specs: true, skin: "#f5d0b0", buttons: "#c8b088" };
/** coachmen: drab caped greatcoats, top hats, red noses, side-whiskers */
export const COACHMAN = (v = 0): Outfit => ({ jacket: ["#8a7a5a", "#6a5a48", "#7a6a50", "#5a5048"][v % 4], pants: "#4a3e34", boots: "#1e1a20", hat: "tophat",
  moustache: ["#5a3a26", "#8a6a4a", "#3a2a20", "#b8b4ac"][v % 4], skin: ["#f0b898", "#e8b090", "#f4c0a0", "#ecb494"][v % 4], build: "stout", buttons: "#c8a060" });
/** the hunting party: the same green-and-gold coats, tricorns over powdered or plain hair */
export const HUNTER = (v = 0): Outfit => ({ jacket: "#2f6a3e", pants: "#f2ede2", boots: "#1e1a20", hat: "tricorn",
  hair: ["#c86a3a", "#b8b4ac", "#2a1e1a", "#8a6a4a", "#e8e0d0"][v % 5], skin: ["#f8dcc4", "#f5d0b0", "#efc6a0", "#f4c8a8"][v % 4], buttons: "#d9b04a",
  moustache: v % 3 === 1 ? "#6a4a30" : undefined, band: "#f6f2ea", build: v % 4 === 2 ? "stout" : "adult" });

// ================= rabbits =================
/** domestic coats: [fur, belly/blaze or null, inner ear] */
export const COATS: [string, string | null, string][] = [
  ["#f6f2ec", null, "#f0a8b0"], ["#a8a4ac", "#e8e4e8", "#e09aa4"], ["#a8784a", "#e8d4b8", "#e09aa4"], ["#34303a", "#f6f2ec", "#d08a96"],
  ["#d8b888", "#f4ead8", "#e8a0a8"], ["#8a8a92", null, "#e09aa4"], ["#f6f2ec", "#3a3640", "#f0a8b0"], ["#7a5a3a", "#d8c0a0", "#d8909c"],
];
export type RabbitPose = "hop" | "sit" | "front" | "belly";
export type RabbitEye = "dot" | "hungry" | "shock" | "happy";
/** a hutch rabbit (320 x 260 canvas, feet at y ~ 228). hop / sit: side view facing +x (dir -1 = facing -x); front: running at the
 *  camera; belly: flopped on its back, paws up. ph 0..1 = hop / gallop phase. lop = floppy ears. */
export const fxRabbit = (p: Pen, coat: number, pose: RabbitPose = "hop", ph = 0, dir = 1, eye: RabbitEye = "dot", lop = false) => {
  const [fur, patch, ear] = COATS[coat % COATS.length], g = p.g, sh = mul(fur, [0.82, 0.8, 0.88]);
  g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 320, 0);
  const eyes = (x: number, y: number, s = 1) => {
    if (eye === "hungry") { p.ell(x, y, 8 * s, 9 * s, "#ffffff", 2.5); p.dot(x + 1, y + 1, 4.5 * s); p.dot(x - 2, y - 3, 1.8 * s, "#ffffff"); }
    else if (eye === "shock") { p.ell(x, y, 7 * s, 8 * s, "#ffffff", 2.5); p.dot(x, y, 2.4 * s); }
    else if (eye === "happy") p.arc(x, y + 2, 6 * s, 5 * s, 200, 340, 3);
    else p.dot(x, y, 5 * s);
  };
  if (pose === "front") {
    const b = Math.sin(ph * Math.PI * 2), bob = 6 * b;
    for (const [x, s] of [[124, 1], [196, -1]] as const) p.ell(x, 226 - 8 * s * b, 22, 11, fur, 5); // feet
    p.ell(160, 176 + bob * 0.5, 70, 54, fur, 6);
    if (patch) p.ell(160, 190 + bob * 0.5, 38, 34, patch, 0);
    for (const s of [-1, 1]) { // ears
      const ex = 160 + s * 24, ey = lop ? 120 : 52 + bob;
      if (lop) p.ell(160 + s * 50, 130 + bob, 13, 38, fur, 5, 0, 360, -s * 15);
      else { p.ell(ex, ey, 14, 44, fur, 5, 0, 360, s * 12); p.ell(ex, ey + 4, 6, 30, ear, 0, 0, 360, s * 12); }
    }
    p.ell(160, 116 + bob, 48, 42, fur, 6);
    if (patch && coat % COATS.length === 3) p.poly([[150, 76 + bob], [170, 76 + bob], [182, 156 + bob], [138, 156 + bob]], patch, 0); // Dutch blaze
    eyes(142, 108 + bob); eyes(178, 108 + bob);
    p.ell(160, 126 + bob, 6, 5, "#e87a8a", 2);
    if (eye === "hungry") { p.poly([[152, 136 + bob], [168, 136 + bob], [168, 150 + bob], [152, 150 + bob]], "#ffffff", 2.5); p.stroke([[160, 136 + bob], [160, 150 + bob]], 2); }
    else p.arc(160, 132 + bob, 8, 5, 20, 160, 2.5);
    for (const s of [-1, 1]) for (const k of [-1, 1]) p.stroke([[160 + s * 14, 128 + bob + k * 3], [160 + s * 46, 122 + bob + k * 8]], 1.6);
    for (const [x, s] of [[132, 1], [188, -1]] as const) p.ell(x, 208 + bob + 10 * s * b, 13, 16, fur, 4); // front paws
    g.restore();
    return;
  }
  if (pose === "belly") {
    p.ell(160, 190, 74, 44, patch ?? mul(fur, [1.04, 1.02, 1.0]), 6);
    for (const x of [116, 140, 180, 204]) p.ell(x, 140 + (x % 3) * 4, 11, 22, fur, 4); // paws in the air
    p.ell(244, 178, 40, 34, fur, 6);
    p.ell(262, 214, 12, 34, fur, 4, 0, 360, 70); p.ell(254, 222, 12, 30, fur, 4, 0, 360, 60);
    p.arc(250, 172, 6, 5, 200, 340, 3); p.arc(268, 170, 6, 5, 200, 340, 3);
    p.ell(280, 186, 5, 4, "#e87a8a", 2);
    p.ell(84, 196, 15, 13, "#fbf8f2", 4);
    g.restore();
    return;
  }
  // side views (hop / sit)
  const k = pose === "hop" ? Math.sin(ph * Math.PI * 2) : -1, s = (k + 1) / 2;
  p.ell(108 - 34 * s, 216, 42, 11, sh, 5, 0, 360, 8 * s); // hind foot
  p.ell(66 - 8 * s, 146 + 4 * s, 16, 14, "#fbf8f2", 4); // tail
  p.ell(108, 168 - 6 * s, 46, 42, fur, 6); // haunch
  p.ell(152 + 8 * s, 156 - 8 * s, 72 + 16 * s, 46 - 8 * s, fur, 6, 0, 360, -6 - 12 * s); // body
  if (patch) p.ell(190 + 10 * s, 150 - 8 * s, 22, 34, patch, 0, 0, 360, -10);
  p.line([[198 + 6 * s, 170 - 8 * s], [214 + 34 * s, 212 - 18 * s]], fur, 15); // front leg
  const hx = 218 + 12 * s, hy = 110 - 12 * s;
  if (lop) p.ell(hx - 18, hy + 26, 13, 38, fur, 5, 0, 360, 18);
  else {
    p.ell(hx - 30, hy - 50, 12, 42, mul(fur, [0.9, 0.88, 0.94]), 5, 0, 360, -24 - 18 * s);
    p.ell(hx - 18, hy - 54, 14, 44, fur, 5, 0, 360, -14 - 18 * s);
    p.ell(hx - 18, hy - 50, 6, 30, ear, 0, 0, 360, -14 - 18 * s);
  }
  p.ell(hx, hy, 40, 33, fur, 6);
  if (patch && coat % COATS.length === 3) p.poly([[hx + 6, hy - 32], [hx + 18, hy - 30], [hx + 40, hy + 12], [hx + 14, hy + 30]], patch, 0);
  eyes(hx + 12, hy - 6);
  p.ell(hx + 38, hy + 6, 6, 5, "#e87a8a", 2);
  for (const d of [-4, 4]) p.stroke([[hx + 34, hy + 10 + d], [hx + 66, hy + 4 + 2 * d]], 1.6);
  g.restore();
};

/** a cabbage (200 x 200) */
export const fxCabbage = (p: Pen) => {
  p.ell(100, 112, 80, 72, "#6aa84a", 6);
  for (const [x, y, r] of [[60, 110, 40], [140, 110, 40], [100, 80, 46]] as const) p.ell(x, y, r, r * 0.86, "#8ac46a", 5);
  p.ell(100, 106, 34, 30, "#b8e08a", 4);
  for (const a of [-0.6, 0, 0.6]) p.stroke([[100, 120], [100 + 70 * Math.sin(a), 120 - 50 * Math.cos(a)]], 2.4, "#4a8a3a");
};
/** thought bubble (460 x 400) of a rabbit: Napoleon's gun turned into a giant cabbage */
export const fxCabbageBubble = (p: Pen) => {
  p.ell(60, 370, 14, 12, "#ffffff", 6); p.ell(100, 330, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([240 + (175 + 11 * Math.sin(a * 9)) * Math.cos(a), 170 + (135 + 11 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  // a little Napoleon (bicorne, green coat) holding a cabbage out like a gift
  const cx = 180, cy = 190;
  p.poly([[cx - 30, cy + 70], [cx + 30, cy + 70], [cx + 26, cy - 4], [cx - 26, cy - 4]], "#2f6a3e", 5);
  p.stroke([[cx - 12, cy + 70], [cx - 12, cy + 90]], 7); p.stroke([[cx + 12, cy + 70], [cx + 12, cy + 90]], 7);
  p.ell(cx, cy - 26, 24, 26, "#f8dcc4", 5);
  p.poly([[cx - 50, cy - 36], [cx, cy - 76], [cx + 50, cy - 36], [cx, cy - 48]], "#1a1820", 5);
  p.dot(cx - 8, cy - 26, 3.5); p.dot(cx + 8, cy - 26, 3.5); p.arc(cx, cy - 14, 8, 5, 20, 160, 3);
  p.stroke([[cx + 24, cy + 14], [cx + 70, cy + 6]], 7);
  p.g.save(); p.g.translate(cx + 100, cy - 30); p.g.scale(0.7, 0.7); fxCabbage(p); p.g.restore();
  for (const [x, y] of [[330, 70], [370, 120], [300, 50]] as const) { p.stroke([[x - 8, y], [x + 8, y]], 3, "#e8b84a"); p.stroke([[x, y - 8], [x, y + 8]], 3, "#e8b84a"); }
};
/** a tumbleweed (200 x 200), r = spin in turns */
export const fxTumble = (p: Pen, r = 0) => {
  const g = p.g; g.save(); g.translate(100, 100); g.rotate(r * Math.PI * 2); g.translate(-100, -100);
  p.ell(100, 100, 70, 66, null, 4, 0, 360);
  for (let i = 0; i < 9; i++) { const a = i * 0.7; p.arc(100 + 20 * Math.cos(a * 2), 100 + 20 * Math.sin(a * 3), 46, 38, i * 40, i * 40 + 220, 3, "#8a6a3a"); }
  g.restore();
};
/** sweat drops + steam (300 x 300) for a mortified face, k 0..1 puff phase */
export const fxSteam = (p: Pen, k = 0) => {
  for (const [x, y] of [[70, 190], [230, 200]] as const) p.poly([[x, y - 26], [x + 12, y], [x, y + 10], [x - 12, y]], "#bfe4ff", 3);
  for (let i = 0; i < 3; i++) {
    const y = 120 - 70 * ((k + i / 3) % 1), x = 90 + i * 60, r = 18 + 14 * ((k + i / 3) % 1);
    p.ell(x, y, r, r * 0.8, "#f4f4f8", 3);
  }
};
/** the imperial carriage, side-on (760 x 420, wheels on y 400): a closed dark-green berline with gold trim and a gilt N in a
 *  laurel on the door, a coachman on the box, two horses; dir -1 = facing -x; leg = gallop frame 0..3; face = Napoleon in the window */
export const fxCoach = (p: Pen, leg = 0, dir = 1, face = false) => {
  const g = p.g; g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 760, 0);
  const body = "#1e4a32", gold = "#d9b04a", dark = "#2a1e18";
  // the rumble seat at the back (left)
  p.poly([[34, 200], [86, 200], [86, 214], [34, 214]], dark, 4);
  // wheels: big back, small front
  for (const [x, r] of [[110, 72], [300, 56]] as const) {
    p.ell(x, 400 - r, r, r, null, 7);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI + leg * 0.35; p.stroke([[x - r * Math.cos(a), 400 - r - r * Math.sin(a)], [x + r * Math.cos(a), 400 - r + r * Math.sin(a)]], 3.5, "#c9a24a"); }
    p.ell(x, 400 - r, 12, 12, gold, 4);
  }
  // the coach body
  p.poly([[60, 300], [320, 300], [340, 200], [318, 120], [80, 120], [52, 200]], body, 7);
  p.poly([[70, 136], [328, 136]], null, 0);
  p.stroke([[66, 290], [324, 290]], 4, gold); p.stroke([[84, 132], [316, 132]], 4, gold);
  p.poly([[60, 116], [330, 116], [318, 96], [72, 96]], "#16382a", 6); // roof
  // window + the door with the gilt N
  p.poly([[200, 146], [296, 146], [296, 200], [200, 200]], face ? "#e8e0c8" : "#3a4a5a", 5);
  if (face) { p.ell(246, 192, 26, 26, "#f8dcc4", 4); p.poly([[208, 176], [246, 148], [286, 176], [246, 168]], "#1a1820", 4); p.dot(238, 192, 3); p.dot(254, 192, 3); p.arc(246, 204, 6, 4, 200, 340, 2.5); }
  p.ell(150, 220, 30, 30, null, 3, 30, 330); p.stroke([[150, 250], [150, 190]], 0.1);
  p.stroke([[140, 236], [140, 204], [160, 236], [160, 204]], 4, gold);
  // the box seat + coachman (top hat)
  p.poly([[318, 120], [380, 120], [380, 136], [330, 140]], dark, 4);
  p.poly([[340, 120], [376, 120], [372, 70], [344, 70]], "#6a5a48", 5);
  p.ell(358, 56, 18, 18, "#f0b898", 4); p.poly([[342, 46], [374, 46], [370, 10], [346, 10]], "#1e1c26", 4); p.stroke([[336, 46], [380, 46]], 4);
  p.stroke([[372, 90], [520, 200]], 3, dark); // reins
  p.stroke([[330, 250], [470, 250]], 7, dark); // the pole
  // two horses (the far one darker, a step out of phase)
  for (const [ox, col, lg] of [[30, "#3a2418", (leg + 2) % 4], [0, "#6a4228", leg]] as const) {
    const bob = [0, -6, 0, -6][lg];
    const legs: [number, number][] = [[[460, 500], [470, 470], [500, 480], [480, 490]][lg] as [number, number], [[630, 640], [620, 660], [650, 630], [630, 650]][lg] as [number, number]];
    for (const [a, b] of legs) { p.line([[a + ox, 270 + bob], [a + ox - 10, 330], [a + ox + (b - a) * 0.3, 395]], col, 14, true); p.line([[b + ox, 270 + bob], [b + ox + 10, 330], [b + ox - 6, 395]], col, 14, true); }
    p.ell(550 + ox, 250 + bob, 110, 48, col, 7);
    p.line([[630 + ox, 230 + bob], [670 + ox, 160 + bob]], col, 40, true);
    p.ell(696 + ox, 150 + bob, 40, 22, col, 6, 0, 360, 20);
    p.dot(700 + ox, 140 + bob, 5);
    p.stroke([[440 + ox, 235 + bob], [410 + ox, 290 + bob]], 10, dark);
    p.stroke([[642 + ox, 190 + bob], [670 + ox, 140 + bob]], 8, dark);
    p.poly([[540 + ox, 210 + bob], [580 + ox, 210 + bob], [580 + ox, 290 + bob], [540 + ox, 290 + bob]], "#7a2a2a", 3); // the harness saddle-cloth
  }
  g.restore();
};
/** a tray of breakfast held out (or on the table): a fat pie (220 x 140) */
export const fxPie = (p: Pen, bites = 0) => {
  p.ell(110, 100, 96, 30, "#e8e4dc", 5);
  p.ell(110, 84, 74, 34, "#d89a4a", 6, 0, 360);
  for (let i = 0; i < 6; i++) p.arc(60 + i * 20, 80, 8, 6, 200, 340, 2.4, "#a8682a");
  if (bites > 0) for (let i = 0; i < bites; i++) p.ell(170 - i * 22, 72, 16, 14, "#e8e4dc", 0);
};
