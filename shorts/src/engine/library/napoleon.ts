// Cast + effects first drawn for the Napoleon rabbit-hunt short (Berthier's park outside Paris, summer 1806).
// Any short can import them.
import { Pen, mul, mix, curve, taper, INK } from "../toon";
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
  // two horses in a trot: the far one (darker) half a stride out of phase, a little ahead; the pole and traces between
  const ph = (leg % 4) / 4;
  fxHorse(p, 582, 400, 0.98, (ph + 0.5) % 1, "#4a2c1c", "#1e140e");
  p.stroke([[330, 252], [590, 262]], 7, dark); // the pole
  p.stroke([[318, 228], [470, 286]], 3, dark); // a trace
  fxHorse(p, 552, 400, 1.0, ph, "#8a5432", "#24160e");
  p.stroke([[372, 90], [470, 168], [700, 226]], 3, dark); // reins to the bit
  g.restore();
};

/** Catmull-Rom spline through the points (closed loop), n samples per span */
const spline = (pts: P2[], n = 6): P2[] => {
  const out: P2[] = [], L = pts.length;
  for (let i = 0; i < L; i++) {
    const p0 = pts[(i - 1 + L) % L], p1 = pts[i], p2 = pts[(i + 1) % L], p3 = pts[(i + 2) % L];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as P2);
    }
  }
  return out;
};
/** a carriage horse, side view facing +x, hooves on (x0, y0), ~312 x 240 design units at s = 1 (girth at x0). ph 0..1 = the
 *  trot (diagonal pairs: near fore + far hind, then far fore + near hind); coat + black points (mane, tail, lower legs);
 *  harness: bridle with blinker, breast collar, saddle pad and girth. */
export const fxHorse = (p: Pen, x0: number, y0: number, s: number, ph: number, coat: string, points: string, harness = true) => {
  const g = p.g; g.save(); g.translate(x0, y0); g.scale(s, s);
  const ol0 = p.ol; p.ol = 2.6; // thin ink rims on the limbs (the default 12 swamps a slim leg)
  const two = Math.PI * 2, bob = -24 - 4 * Math.abs(Math.sin(two * ph)), dark = mul(coat, [0.72, 0.7, 0.76]), lite = mix(coat, "#ffffff", 0.16);
  const leather = "#2a1a12";
  /** one leg: [top, joint, fetlock, hoof]; front = knee bends forward when lifted, hind = hock points back */
  const legPts = (o: number, front: boolean): P2[] => {
    const u = (ph + o) % 1, A = 22, B = 24;
    const hx = u < 0.5 ? A * (1 - 4 * u) : -A + 4 * A * (u - 0.5), lift = u < 0.5 ? 0 : B * Math.sin(Math.PI * (u - 0.5) * 2);
    if (front) {
      const top: P2 = [44, -90 + bob], knee: P2 = [46 + 0.5 * hx + 0.5 * lift, -50 - 0.6 * lift];
      const a = (lift / B) * 1.25 - hx * 0.004, fet: P2 = [knee[0] - 36 * Math.sin(a), knee[1] + 36 * Math.cos(a)];
      return [top, knee, fet, [fet[0] + 4 - 6 * Math.sin(a), fet[1] + 12 * Math.cos(a * 0.8)]];
    }
    const top: P2 = [-104, -92 + bob], hock: P2 = [-128 + 0.4 * hx, -54 - 0.45 * lift];
    const a = (lift / B) * 0.7 + hx * 0.004, fet: P2 = [hock[0] + 8 + 32 * Math.sin(a), hock[1] + 40 * Math.cos(a)];
    return [top, hock, fet, [fet[0] + 6, fet[1] + 12]];
  };
  const drawLeg = (L: P2[], col: string, front: boolean) => {
    const [top, j, fet, hoof] = L;
    const [wa, wb] = front ? [24, 10] : [34, 12]; // muscled forearm / gaskin tapering to the knee / hock
    taper(p, top, j, wa + 5, wb + 5, INK); taper(p, top, j, wa, wb, col);
    p.line([j, fet], points, 9.5, true); // cannon (black points)
    p.line([fet, [hoof[0] - 2, hoof[1] - 4]], points, 8.5, true); // pastern
    p.poly([[hoof[0] - 6, hoof[1] - 6], [hoof[0] + 5, hoof[1] - 6], [hoof[0] + 8, hoof[1] + 1], [hoof[0] - 7, hoof[1] + 1]], "#1a1410", 2.5); // hoof
    if (front) p.ell(j[0], j[1], 5.5, 5, points, 2.4); // the knee
    else p.ell(j[0] + 2, j[1], 6.5, 6, col, 2.4); // the hock
  };
  // far legs (darker) behind the body
  drawLeg(legPts(0.5, true), dark, true); drawLeg(legPts(0.0, false), dark, false);
  // the tail, swishing a little
  const sw = 6 * Math.sin(two * ph);
  for (let k = 0; k < 6; k++) p.stroke(curve([-134, -140 + bob], [-160 - k * 2 + sw, -110 + k * 3], [-150 + sw * 1.5 + k * 3, -52 + k * 4], 10), 7 - 0.6 * k, points);
  // the body, neck and head as one smooth outline
  const B0: P2[] = [[0, -152], [-45, -142], [-85, -144], [-114, -152], [-140, -138], [-148, -112], [-138, -88], [-110, -78], [-70, -74], [-20, -70], [24, -74],
    [50, -86], [66, -106], [74, -128], [94, -152], [112, -170], [128, -168], [148, -150], [162, -150], [168, -162], [160, -178], [140, -198], [124, -212],
    [104, -210], [78, -192], [44, -168], [18, -158]];
  const body = spline(B0.map(([x, y]) => [x, y + bob] as P2), 5);
  p.poly(body, coat, 6);
  p.clip(body, () => {
    p.ell(-30, -54 + bob, 170, 34, dark, 0); // shaded belly
    p.ell(-112, -128 + bob, 30, 22, lite, 0); // hindquarter sheen
    p.ell(30, -132 + bob, 30, 14, lite, 0); // shoulder sheen
    p.ell(160, -158 + bob, 16, 14, mul(coat, [0.55, 0.5, 0.55]), 0); // dark muzzle
  });
  p.poly(body, null, 6);
  p.stroke([[52, -142 + bob], [40, -100 + bob]], 2.4, dark); // the shoulder line
  p.stroke(curve([-96, -136 + bob], [-80, -110 + bob], [-100, -84 + bob], 8), 2.4, dark); // the stifle line
  // ears, mane, forelock
  p.poly([[116, -208 + bob], [118, -238 + bob], [128, -212 + bob]], coat, 3); p.poly([[124, -212 + bob], [130, -236 + bob], [136, -208 + bob]], dark, 3);
  for (let k = 0; k < 9; k++) {
    const t = k / 8, cx = 120 - 110 * t, cy = -212 + 56 * t + 6 * Math.sin(t * Math.PI) + bob;
    p.stroke([[cx, cy], [cx - 14 - 4 * t, cy + 26 - 6 * t]], 7, points);
  }
  p.stroke([[132, -212 + bob], [142, -196 + bob]], 5, points); p.stroke([[128, -210 + bob], [134, -194 + bob]], 4, points);
  // eye, nostril, mouth
  p.ell(138, -188 + bob, 5, 4.5, "#1a1210", 1.5); p.dot(139.5, -189.5 + bob, 1.5, "#ffffff");
  p.arc(160, -160 + bob, 4, 3, 180, 360, 2.2); p.stroke([[150, -152 + bob], [162, -152 + bob]], 1.8);
  if (harness) {
    p.stroke([[124, -206 + bob], [148, -156 + bob]], 3.4, leather); // cheek strap
    p.stroke([[146, -172 + bob], [168, -170 + bob]], 3.4, leather); // noseband
    p.stroke([[118, -206 + bob], [112, -170 + bob]], 3.4, leather); // throatlatch
    p.poly([[124, -200 + bob], [134, -200 + bob], [134, -180 + bob], [124, -180 + bob]], "#1a1210", 2.4); // the blinker (behind the eye)
    p.ell(138, -188 + bob, 5, 4.5, "#1a1210", 1.5); p.dot(139.5, -189.5 + bob, 1.5, "#ffffff");
    p.ell(152, -152 + bob, 4, 4, "#c9a24a", 1.6); // the bit ring
    p.stroke(curve([74, -122 + bob], [40, -108 + bob], [-8, -112 + bob], 8), 7, leather); // breast collar
    p.poly([[-24, -150 + bob], [22, -156 + bob], [26, -118 + bob], [-22, -114 + bob]], "#7a2a2a", 3); // saddle pad
    p.stroke([[2, -118 + bob], [6, -74 + bob]], 5, leather); // girth
    p.ell(2, -150 + bob, 7, 5, "#c9a24a", 1.4); // terret ring
  }
  // near legs in front of the body
  drawLeg(legPts(0.0, true), coat, true); drawLeg(legPts(0.5, false), coat, false);
  p.ol = ol0;
  g.restore();
};
/** a tray of breakfast held out (or on the table): a fat pie (220 x 140) */
export const fxPie = (p: Pen, bites = 0) => {
  p.ell(110, 100, 96, 30, "#e8e4dc", 5);
  p.ell(110, 84, 74, 34, "#d89a4a", 6, 0, 360);
  for (let i = 0; i < 6; i++) p.arc(60 + i * 20, 80, 8, 6, 200, 340, 2.4, "#a8682a");
  if (bites > 0) for (let i = 0; i < bites; i++) p.ell(170 - i * 22, 72, 16, 14, "#e8e4dc", 0);
};
