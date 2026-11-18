// Cast + effects first drawn for The Picture of Dorian Gray (Wilde, 1890/1891) short: London, c. 1890.
// Looks follow the novel's own descriptions (ch. 1, 2, 4, 20), never a film or stage adaptation.
import { Pen, bodyFront } from "../toon";
import type { Outfit, FrontOpts } from "../toon";

/** Dorian Gray: "crisp gold hair", "frank blue eyes", "finely curved scarlet lips" (ch. 2); black evening dress, white tie */
export const DORIAN: Outfit = { jacket: "#1c1c26", pants: "#1c1c26", boots: "#0e0e12", hat: "hair", hair: "#f2c24e", skin: "#fbe2cc", band: "#f8f6f0", tie: "#f8f6f0", buttons: "#f8f6f0" };
/** Dorian in the studio in June: a light grey-blue lounge suit, white collar, a lavender tie */
export const DORIAN_DAY: Outfit = { jacket: "#5a6a8e", pants: "#4a5470", boots: "#2a2024", hat: "hair", hair: "#f2c24e", skin: "#fbe2cc", band: "#f8f6f0", tie: "#8a6aa8" };
/** the dead man on the floor (ch. 20): the same evening dress, "withered, wrinkled, and loathsome" */
export const DORIAN_OLD: Outfit = { ...DORIAN, hair: "#e6e2d8", skin: "#c9c1a2" };
/** Basil Hallward: "rugged strong face and coal-black hair" (ch. 1); a brown painter's smock */
export const BASIL: Outfit = { jacket: "#8a6440", pants: "#3a3430", boots: "#2a2024", hat: "hair", hair: "#141016", skin: "#eab892", band: "#f4f0e6" };
/** Basil on the night he leaves for Paris (ch. 12): grey ulster */
export const BASIL_ULSTER: Outfit = { jacket: "#6e6e76", pants: "#3a3a42", boots: "#1e1a1e", hat: "hair", hair: "#141016", skin: "#eab892", band: "#f4f0e6", buttons: "#3a3a42" };
/** Lord Henry Wotton: "olive-coloured face", "long nervous fingers" (ch. 1-2); dove-grey frock coat, lavender tie */
export const HENRY: Outfit = { jacket: "#9c9ca8", pants: "#4a4a58", boots: "#1e1a1e", hat: "hair", hair: "#2a2018", skin: "#d9b98c", band: "#f6f4ee", tie: "#9a7ab8", buttons: "#6a6a78" };
/** Sibyl Vane, "hardly seventeen": "plaited coils of dark-brown hair" (ch. 4); a cream Juliet gown */
export const SIBYL: Outfit = { jacket: "#efe2c8", dress: "#efe2c8", pants: "#efe2c8", boots: "#c8a060", hat: "curls", hair: "#5a3a22", skin: "#f7decd", sash: "#c8a04a" };
/** Alan Campbell, the chemist (ch. 14): brown hair, sallow, a dark frock coat, white stock */
export const ALAN: Outfit = { jacket: "#2a2a36", pants: "#2a2a36", boots: "#141216", hat: "hair", hair: "#6a4a2a", skin: "#e8d0a8", stock: "#f0ece0" };
/** the servants who break in (ch. 20): old Mrs Leaf, Francis the valet, the coachman */
export const MRS_LEAF: Outfit = { jacket: "#5a5a68", dress: "#5a5a68", pants: "#5a5a68", boots: "#2a2024", hat: "hair", hair: "#ece8e0", skin: "#f2d4bc", band: "#f8f6f0", build: "stout" };
export const FRANCIS: Outfit = { jacket: "#16161c", pants: "#16161c", boots: "#0e0e12", hat: "hair", hair: "#4a3a2a", skin: "#f0cfb2", band: "#f8f6f0", buttons: "#d8b04a" };
export const COACHMAN: Outfit = { jacket: "#5a4632", pants: "#3a3430", boots: "#1e1a1e", hat: "tophat", cap: "#2a2224", skin: "#e8b890", moustache: "#6a4a2a", buttons: "#c8a060", build: "stout" };

// ---------------- the portrait ----------------
/** the painted Dorian at each stage: 0 young (as painted) · 1 a touch of cruelty in the mouth (ch. 7) · 2 old and hideous,
 *  blood on the hand (ch. 13) · 3 the hypocrite's wrinkle, cunning eyes (ch. 20) · 4 restored, as the servants find it */
export const PORTRAIT_W = 600, PORTRAIT_H = 900;
export const drawPortrait = (p: Pen, stage: number) => {
  const g = p.g;
  // background: dark olive-brown studio ground with a warm glow behind the head
  const bg = g.createRadialGradient(300, 260, 40, 300, 380, 560);
  const sick = stage === 2 || stage === 3;
  bg.addColorStop(0, sick ? "#5a5a3a" : "#7a6a48"); bg.addColorStop(1, sick ? "#1e1e14" : "#2a2418");
  g.fillStyle = bg; g.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);
  // the figure, painted from head to knee
  const o: Outfit = sick ? { ...DORIAN_DAY, skin: stage === 3 ? "#b8b08a" : "#c0b88e", hair: "#b8b4a8" } : DORIAN_DAY;
  const fo: FrontOpts = { mode: "stand", seed: 4, expr: stage === 0 || stage === 4 ? "smile_closed" : stage === 1 ? "smug" : stage === 2 ? "angry" : "smug" };
  g.save(); g.translate(300, 450); g.scale(1.22, 1.22); g.translate(-300, -470);
  bodyFront(p, o, fo);
  const HX = 300, HY = 309; // head centre in the 600 x 1000 body design (adult build, seed 4)
  if (stage === 1) p.stroke([[HX + 14, HY + 52], [HX + 40, HY + 42]], 6, "#6a1a22"); // the cruel curl at one corner
  if (sick) {
    const w = "rgba(40,30,20,0.75)";
    // wrinkles: forehead, crow's feet, cheek folds, a sagging jaw
    for (const dy of [-62, -50]) p.stroke([[HX - 50, HY + dy], [HX - 15, HY + dy - 5], [HX + 20, HY + dy], [HX + 50, HY + dy - 4]], 4, w);
    for (const s of [-1, 1]) {
      p.stroke([[HX + s * 70, HY - 14], [HX + s * 84, HY - 20]], 4, w); p.stroke([[HX + s * 70, HY - 4], [HX + s * 86, HY - 2]], 4, w);
      p.stroke([[HX + s * 30, HY + 20], [HX + s * 44, HY + 52], [HX + s * 40, HY + 76]], 5, w);
      p.stroke([[HX + s * 30, HY - 10], [HX + s * 36, HY + 4]], 4, w);
    }
    // the leprosy of sin: dark green-brown blotches on face and coat
    const blot = (x: number, y: number, r: number) => { p.ell(x, y, r, r * 0.8, "rgba(70,80,30,0.55)", 0); p.ell(x + r * 0.2, y - r * 0.1, r * 0.5, r * 0.4, "rgba(40,50,20,0.5)", 0); };
    for (const [x, y, r] of [[HX - 60, HY + 30, 16], [HX + 58, HY - 40, 12], [HX - 20, 560, 30], [HX + 70, 640, 26], [HX - 90, 700, 22]] as const) blot(x, y, r);
    // blood on the hand that held the knife (ch. 13) and dripping from it
    for (const sx of stage === 3 ? [-1, 1] : [1]) {
      p.ell(HX + sx * 128, 690, 26, 20, "rgba(170,20,30,0.9)", 0);
      p.poly([[HX + sx * 120, 700], [HX + sx * 136, 700], [HX + sx * 128, 760]], "rgba(170,20,30,0.85)", 0);
    }
    if (stage === 3) {
      // the curved wrinkle of the hypocrite + cunning brows
      p.stroke([[HX - 40, HY + 44], [HX - 10, HY + 56], [HX + 24, HY + 50], [HX + 48, HY + 30]], 7, "#3a1a18");
      for (const s of [-1, 1]) p.stroke([[HX + s * 20, HY - 30], [HX + s * 62, HY - 44]], 7, "#2a1a14");
    }
  }
  g.restore();
  // varnish: soft top-left sheen + dark vignette at the edges (oil painting)
  const sh = g.createLinearGradient(0, 0, PORTRAIT_W, PORTRAIT_H);
  sh.addColorStop(0, "rgba(255,240,200,0.12)"); sh.addColorStop(0.5, "rgba(255,240,200,0)"); sh.addColorStop(1, "rgba(0,0,0,0.25)");
  g.fillStyle = sh; g.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);
  // brush texture
  for (let i = 0; i < 260; i++) { const x = Math.sin(i * 91.7) * 300 + 300, y = Math.sin(i * 37.3) * 450 + 450; g.strokeStyle = `rgba(${i % 2 ? "255,240,210" : "20,14,8"},0.05)`; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 22, y + 8 * Math.sin(i)); g.stroke(); }
};

/** the dead man on the floor: the body on its back, eyes closed, a wrinkled face (the card is laid flat) */
export const lyingOld = (p: Pen, fo: FrontOpts) => {
  const g = p.g;
  // drawn upright in the 600 x 1000 design; world.ts lays the card flat on the floor
  g.save();
  bodyFront(p, DORIAN_OLD, { ...fo, mode: "stand", blink: 1, expr: "pained" });
  const HX = 300, HY = 309, w = "rgba(50,40,30,0.8)";
  for (const dy of [-60, -48, -36]) p.stroke([[HX - 50, HY + dy], [HX, HY + dy - 6], [HX + 50, HY + dy]], 5, w);
  for (const s of [-1, 1]) { p.stroke([[HX + s * 28, HY + 18], [HX + s * 42, HY + 56], [HX + s * 36, HY + 82]], 6, w); p.stroke([[HX + s * 66, HY - 6], [HX + s * 86, HY - 12]], 5, w); }
  g.restore();
};

/** close-up of the withered hand on the floorboards, three gold rings (how the servants knew him) */
export const fxHandRings = (p: Pen, k = 0) => {
  const skin = "#c9c1a2", bone = "#a89e7e";
  // cuff + sleeve
  p.poly([[0, 120], [60, 108], [70, 170], [0, 186]], "#1c1c26", 8);
  p.poly([[56, 110], [76, 106], [86, 168], [66, 172]], "#f8f6f0", 6);
  // the back of the hand + four bony fingers, spread on the floor
  p.poly([[80, 112], [130, 100], [150, 128], [140, 170], [86, 172]], skin, 8);
  const fingers: [number, number][][] = [[[132, 104], [168, 88], [194, 84]], [[146, 120], [184, 112], [200, 112]], [[146, 140], [182, 142], [196, 148]], [[136, 162], [166, 172], [178, 182]]];
  for (const f of fingers) { p.line(f, skin, 13); for (const q of f.slice(1)) p.dot(q[0], q[1], 3, bone); }
  p.line([[96, 168], [110, 190], [130, 196]], skin, 13); // thumb
  for (const [x, y] of [[100, 124], [120, 118], [110, 142]] as const) p.stroke([[x, y], [x + 18, y + 6]], 3, "rgba(60,40,30,0.6)");
  // rings, with a pulsing gleam
  for (const [x, y, c] of [[160, 98, "#e8c04a"], [170, 116, "#e8c04a"], [164, 144, "#7ac0e8"]] as const) {
    p.ell(x, y, 8, 11, null, 6); p.arc(x, y, 8, 11, 0, 360, 5, "#e8c04a"); if (c !== "#e8c04a") p.dot(x, y - 8, 5, c);
  }
  if (k > 0) p.dot(168, 112, 5 + 5 * k, "rgba(255,250,220,0.9)");
};

/** a thought bubble with a wrinkled old face in it (Dorian imagining himself old) */
export const fxOldThought = (p: Pen) => {
  for (const [x, y, r] of [[30, 180, 10], [52, 156, 15]] as const) p.ell(x, y, r, r, "#fbfaf4", 6);
  p.ell(122, 82, 74, 64, "#fbfaf4", 8);
  for (const [x, y, r] of [[70, 50, 30], [130, 32, 34], [178, 70, 26], [160, 126, 30], [84, 126, 28]] as const) p.ell(x, y, r, r, "#fbfaf4", 0);
  p.ell(122, 82, 74, 64, null, 8);
  // the old face: bald crown, white tufts, droopy lids, a frown, wrinkles
  p.ell(122, 88, 34, 38, "#d8ccb0", 6);
  p.ell(92, 78, 10, 14, "#f0ece6", 4); p.ell(152, 78, 10, 14, "#f0ece6", 4);
  for (const x of [110, 134]) { p.stroke([[x - 7, 82], [x + 7, 82]], 4); p.dot(x, 86, 3); }
  p.arc(122, 112, 12, 6, 200, 340, 4);
  for (const y of [62, 70]) p.stroke([[106, y], [138, y]], 2.5, "rgba(60,40,30,0.7)");
};
/** a red-violet swirl of smoke (the bargain for his soul) */
export const fxSoulSwirl = (p: Pen, k = 0) => {
  for (let i = 0; i < 3; i++) {
    const r = 40 + i * 28, a0 = k * 260 + i * 120;
    p.arc(100, 100, r, r * 0.55, a0, a0 + 200, 10 - i * 2, i % 2 ? "rgba(150,30,70,0.8)" : "rgba(110,20,90,0.8)");
  }
};
/** a cigarette smoke ring */
export const fxSmokeRing = (p: Pen) => { p.ell(100, 100, 70, 40, null, 0); p.arc(100, 100, 70, 40, 0, 360, 14, "rgba(230,230,240,0.8)"); };
/** a small blue glass bottle (Sibyl's poison is never more than this glint) */
export const fxBottle = (p: Pen) => {
  p.poly([[78, 70], [122, 70], [126, 180], [74, 180]], "#3a6a9a", 7);
  p.poly([[90, 40], [110, 40], [110, 70], [90, 70]], "#3a6a9a", 6);
  p.poly([[86, 24], [114, 24], [114, 42], [86, 42]], "#8a5a32", 6);
  p.stroke([[88, 86], [88, 160]], 6, "rgba(255,255,255,0.45)");
};
/** Alan Campbell's mahogany chest of chemicals (ch. 14), front view, a coil of wire on top */
export const fxChemChest = (p: Pen) => {
  p.poly([[16, 80], [184, 80], [184, 180], [16, 180]], "#6a2e1e", 8);
  p.poly([[16, 62], [184, 62], [184, 82], [16, 82]], "#7a3a26", 7);
  p.poly([[88, 110], [112, 110], [112, 132], [88, 132]], "#d8b04a", 5);
  for (const x of [40, 160]) p.poly([[x - 12, 84], [x + 12, 84], [x + 12, 176], [x - 12, 176]], "#5a2618", 0);
  for (let i = 0; i < 4; i++) p.ell(150, 52 - i * 4, 26, 8, null, 5, 0, 360);
};
/** green acid fumes */
export const fxFume = (p: Pen, k = 0) => {
  const a = 0.75 * (1 - k);
  for (const [x, y, r] of [[100, 130, 50], [70, 90, 40], [130, 80, 44], [100, 50, 36]] as const) p.ell(x, y - 30 * k, r * (0.7 + 0.6 * k), r * (0.7 + 0.6 * k), `rgba(150,210,90,${a})`, 0);
};
/** a wall shadow: a figure with one arm raised high, cast by the lamp (the murder is only ever this) */
export const fxStabShadow = (p: Pen, k = 0) => {
  const c = "rgba(10,6,16,0.82)";
  const g = p.g;
  g.fillStyle = c;
  g.beginPath(); g.ellipse(100, 70, 26, 30, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(70, 100); g.lineTo(130, 100); g.lineTo(142, 260); g.lineTo(58, 260); g.closePath(); g.fill();
  // the arm: up at k 0, swung down at k 1
  const a = -2.2 + 1.9 * k, sx = 124, sy = 112, ex = sx + 70 * Math.cos(a), ey = sy + 70 * Math.sin(a);
  g.strokeStyle = c; g.lineCap = "round"; g.lineWidth = 22; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + 30 * Math.cos(a), ey + 30 * Math.sin(a)); g.stroke();
};
/** a gold key */
export const fxKey = (p: Pen) => {
  p.ell(60, 100, 30, 30, null, 0); p.arc(60, 100, 30, 30, 0, 360, 14, "#d8b04a");
  p.band([[88, 100], [180, 100]], "#d8b04a", 14, 6);
  p.band([[160, 100], [160, 130]], "#d8b04a", 12, 5); p.band([[178, 100], [178, 124]], "#d8b04a", 12, 5);
};
