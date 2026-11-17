// Cast + effects first drawn for the Caligula seashell short (the Channel coast of Gaul, AD 40). Any short can import them.
import { Pen, mul, curve, bodyFront } from "../toon";
import type { Outfit, P2, FrontOpts } from "../toon";

const SKINS = ["#f6d6bc", "#e8b890", "#d8a070", "#f0c8a4", "#c48a60", "#f4d0b0"];
/** Caligula (27): busts show a thin young face, light-brown hair combed forward; gilded muscle cuirass, purple general's
 *  cloak, white tunic skirt with leather strips, the red soldier's boots (caligae) of his nickname, a laurel wreath */
export const CALIGULA: Outfit = { jacket: "#d8a842", pants: "#e8c4a4", boots: "#c0303a", hat: "laurel", hair: "#8a5a32", skin: "#f6dcc4",
  cuirass: "muscle", cape: "#6e2a78", kilt: "#f2ece0" };
/** a legionary: iron segmented armour, red tunic, bronze helmet with a short red plume, the red curved shield */
export const LEGIONARY = (v = 0, shield = true): Outfit => ({ jacket: ["#a9adb6", "#9ea3ac", "#b0b3ba"][v % 3], pants: "#c89a78", boots: "#5a3a24",
  hat: "galea", cap: ["#c9a050", "#bf9446", "#d0a858", "#b8a070"][v % 4], skin: SKINS[v % SKINS.length], cuirass: "segmented", kilt: "#b8322e",
  scutum: shield ? "#b8322e" : undefined, stubble: v % 3 === 1, moustache: v % 5 === 3 ? "#4a3020" : undefined, build: v % 4 === 2 ? "stout" : "adult" });
/** the centurion: mail shirt with silver medals, a transverse crest, grey stubble, stout */
export const CENTURION: Outfit = { jacket: "#868c96", pants: "#c89a78", boots: "#4a2e1c", hat: "galea_cent", cap: "#c0c4cc", skin: "#e8b890",
  kilt: "#b8322e", phalerae: true, stubble: true, build: "stout", cape: "#b8322e" };
/** little Caligula in camp: a child-size legionary kit and the little red boots */
export const KID_CALIGULA: Outfit = { jacket: "#a9adb6", pants: "#f0c8a4", boots: "#c0303a", hat: "galea", cap: "#d0a858", skin: "#f6dcc4",
  cuirass: "segmented", kilt: "#b8322e", build: "kid" };
/** the historian: grey, receding, in a white toga */
export const SUETONIUS: Outfit = { jacket: "#f0ead8", pants: "#e0c8a8", boots: "#6a4a30", hat: "hair", hair: "#b8b4ac", skin: "#f0c8a4",
  drape: "#f8f4ea", kilt: "#f0ead8" };
/** the runaway British prince: long fair hair, drooping moustache, checked green tunic, gold torc, trousers */
export const PRINCE: Outfit = { jacket: "#3a6a4a", pants: "#8a6a3a", boots: "#5a3a24", hat: "hair", long: true, hair: "#e2c070", moustache: "#d0a850",
  skin: "#f4d6bc", plaid: "#c8a040", torc: "#e2b84a" };
/** the herald reading the letter in the Senate */
export const HERALD: Outfit = { jacket: "#d8c8a0", pants: "#c89a78", boots: "#6a4a30", hat: "hair", hair: "#3a2a20", skin: "#e8b890", kilt: "#d8c8a0", belt: null };
/** senators: white togas with the purple stripe, red senatorial shoes, grey heads */
export const SENATOR = (v = 0): Outfit => ({ jacket: "#f2ece0", pants: "#e0c0a0", boots: "#8a2a2a", hat: "hair", hair: ["#c8c4bc", "#e8e4dc", "#8a8478", "#5a4a3a", "#b0aca4", "#d8d4cc"][v % 6],
  skin: ["#f0c8a4", "#f6d6bc", "#e8b890", "#d8a882", "#f4d0b0", "#ecc4a0"][v % 6], drape: "#f8f4ea", clavus: "#6e2a78", kilt: "#f2ece0",
  build: v % 3 === 0 ? "stout" : "adult", moustache: undefined });

// ================= shells, crab, gull =================
const SHELL_COLS: [string, string][] = [["#f4e2c8", "#c89a72"], ["#f2b0b4", "#c06a74"], ["#e8c890", "#b08a4a"], ["#e2d8ee", "#9a8ab4"], ["#f6f2ec", "#b4a898"], ["#e8a878", "#a8603a"]];
/** a seashell on the sand (120 x 100): kind 0 scallop, 1 spiral, 2 cockle; c = colour index */
export const fxShell = (p: Pen, kind = 0, c = 0) => {
  const [fill, line] = SHELL_COLS[c % SHELL_COLS.length];
  if (kind === 0) {
    p.poly([[60, 92], [16, 52], [24, 26], [60, 12], [96, 26], [104, 52]], fill, 5);
    for (let i = -3; i <= 3; i++) p.stroke([[60, 88], [60 + i * 13, 22 + Math.abs(i) * 4]], 2.4, line);
    p.poly([[46, 92], [74, 92], [70, 80], [50, 80]], fill, 4);
  } else if (kind === 1) {
    p.poly([[20, 78], [14, 52], [34, 26], [72, 10], [104, 30], [100, 62], [70, 86]], fill, 5);
    for (let i = 0; i < 3; i++) p.arc(58 - i * 6, 46 + i * 6, 34 - i * 10, 22 - i * 6, 160, 380, 2.4, line);
    p.ell(84, 68, 12, 10, mul(fill, [1.0, 0.86, 0.88]), 3);
  } else {
    p.ell(60, 54, 46, 38, fill, 5);
    for (let i = -2; i <= 2; i++) p.arc(60 + i * 2, 90, 14 + Math.abs(i) * 14, 70, 200, 340, 2.2, line);
    p.ell(60, 20, 10, 6, mul(fill, [0.9, 0.86, 0.9]), 3);
  }
};
/** a little red crab (200 x 140), side-scuttling; pinch 0..1 closes the raised claw; ph = leg phase */
export const fxCrab = (p: Pen, pinch = 0, ph = 0) => {
  const red = "#d8483a", dk = "#a8302a";
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x0 = 100 + s * 26, y0 = 92 + i * 6, w = 4 * Math.sin((ph + i / 3 + (s > 0 ? 0.5 : 0)) * Math.PI * 2);
    p.line([[x0, y0], [x0 + s * (34 + i * 4), y0 - 6 + w], [x0 + s * (46 + i * 4), y0 + 30 + w]], dk, 5);
  }
  p.ell(100, 88, 48, 30, red, 5);
  for (const s of [-1, 1]) { // claws: the right one raised
    const up = s > 0, bx = 100 + s * 44, by = up ? 50 : 70;
    p.line([[100 + s * 30, 80], [bx, by]], dk, 7);
    const o = up ? 12 * (1 - pinch) : 10;
    p.ell(bx + s * 10, by - 10, 16, 12, red, 4, 0, 360, s * 20);
    p.poly([[bx + s * 14, by - 18], [bx + s * 34, by - 30 - o], [bx + s * 24, by - 12]], red, 4);
  }
  for (const s of [-1, 1]) { p.line([[100 + s * 12, 64], [100 + s * 16, 44]], dk, 3); p.ell(100 + s * 16, 40, 8, 8, "#ffffff", 3); p.dot(100 + s * 17, 41, 3.4); }
  p.arc(100, 92, 10, 5, 20, 160, 3);
};
/** a gull (220 x 160): flying (wings by flap 0..1) or standing */
export const fxGull = (p: Pen, flap = 0, stand = false) => {
  const w = "#f6f6f2", grey = "#a8b0bc";
  if (stand) {
    p.line([[100, 120], [96, 148]], "#e8a03a", 3); p.line([[116, 120], [120, 148]], "#e8a03a", 3);
    p.ell(108, 96, 44, 26, w, 5); p.ell(96, 90, 34, 16, grey, 4, 0, 360, -8);
    p.poly([[64, 92], [40, 104], [66, 104]], "#2a2a30", 4);
    p.ell(150, 66, 20, 18, w, 5); p.poly([[166, 64], [190, 70], [166, 74]], "#f0b030", 3); p.dot(156, 60, 3.2);
    return;
  }
  const a = Math.sin(flap * Math.PI * 2) * 36;
  for (const s of [-1, 1]) p.poly([[110, 80], [110 + s * 46, 80 - a * 0.7], [110 + s * 96, 74 - a], [110 + s * 60, 92 - a * 0.4]], s < 0 ? grey : w, 4);
  p.ell(110, 86, 34, 16, w, 5); p.ell(146, 80, 14, 12, w, 4); p.poly([[158, 78], [176, 82], [158, 86]], "#f0b030", 2.5); p.dot(150, 76, 2.6);
};

// ================= the trireme =================
/** a Roman warship side-on (960 x 440, waterline at y 360): dark hull with a bronze ram, a painted eye at the bow, a row of
 *  oars rowing (ph 0..1), mast with a red-and-white sail; dir -1 faces -x; who 1 = Caligula posing on the bow */
export const fxTrireme = (p: Pen, ph = 0, dir = 1, who = 0, tilt = 0) => {
  const g = p.g; g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 960, 0);
  g.translate(480, 360); g.rotate(tilt); g.translate(-480, -360);
  const hull = "#5a3a26", dk = "#3a2418", gold = "#d9b04a";
  // oars (behind the hull edge), sweeping
  for (let i = 0; i < 11; i++) {
    const x = 230 + i * 46, a = Math.sin((ph + i * 0.02) * Math.PI * 2) * 0.35;
    p.line([[x, 300], [x - 90 * Math.sin(a + 0.35), 300 + 110 * Math.cos(a + 0.35)]], "#c8a070", 4);
  }
  // mast + sail
  p.band([[470, 270], [470, 40]], dk, 10, 3);
  p.band([[360, 60], [580, 60]], dk, 8, 3);
  const sail: P2[] = [[366, 62], [574, 62], [588, 230], [352, 230]];
  p.poly(sail, "#f2ece0", 6);
  p.clip(sail, () => { for (let i = 0; i < 5; i++) p.stroke([[352 + i * 52, 60], [352 + i * 52, 232]], 18, "#c8303a"); });
  p.poly(sail, null, 6);
  // hull: a long low curve, the stern post curling up (left), the bow ram (right)
  const H: P2[] = [[120, 250], [160, 300], [300, 330], [700, 330], [800, 316], [880, 330], [905, 322], [860, 296], [820, 260], [160, 262]];
  p.poly(H, hull, 7);
  p.stroke([[150, 270], [830, 270]], 5, gold);
  p.stroke(curve([140, 262], [96, 200], [130, 150], 10), 14, dk); p.ell(132, 146, 14, 14, gold, 4);
  p.poly([[860, 316], [932, 322], [940, 336], [870, 334]], "#c08a3a", 5); // the bronze ram
  p.ell(790, 286, 22, 14, "#f6f2ea", 3); p.dot(794, 286, 7); // the painted eye
  for (let i = 0; i < 11; i++) p.ell(230 + i * 46, 300, 5, 5, dk, 0); // oar ports
  if (who === 1) { // Caligula on the bow: gold body, purple cloak, wreath, sword up
    const cx = 800, cy = 250;
    p.poly([[cx - 28, cy], [cx + 18, cy], [cx + 10, cy - 70], [cx - 26, cy - 70]], "#6e2a78", 4);
    p.poly([[cx - 16, cy], [cx + 12, cy], [cx + 10, cy - 62], [cx - 14, cy - 62]], "#d8a842", 4);
    p.ell(cx - 2, cy - 88, 20, 21, "#f6dcc4", 4);
    for (let i = 0; i < 7; i++) p.ell(cx - 18 + i * 6, cy - 102 + Math.abs(i - 3) * 2, 5, 3, "#5e9a40", 1.4);
    p.dot(cx + 4, cy - 90, 2.6); p.arc(cx + 4, cy - 80, 6, 4, 20, 160, 2.4);
    p.line([[cx + 10, cy - 56], [cx + 34, cy - 96]], "#d8a842", 6); p.band([[cx + 34, cy - 96], [cx + 44, cy - 150]], "#e2e6ee", 5, 2);
  }
  g.restore();
};
/** the legion's eagle standard (160 x 560): pole, gold eagle with spread wings on a thunderbolt, a laurel wreath, a red flag */
export const fxEagle = (p: Pen) => {
  p.band([[80, 548], [80, 120]], "#6a4428", 9, 3);
  p.poly([[44, 200], [116, 200], [116, 280], [44, 280]], "#b8322e", 5);
  p.stroke([[52, 268], [108, 268]], 3, "#e2b84a"); for (let i = 0; i < 4; i++) p.stroke([[52 + i * 18, 280], [52 + i * 18, 296]], 3, "#e2b84a");
  p.ell(80, 158, 22, 22, null, 6); p.ell(80, 158, 22, 22, null, 0);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.ell(80 + 22 * Math.cos(a), 158 + 22 * Math.sin(a), 6, 3.5, "#d9b04a", 1.4, 0, 360, (a * 180) / Math.PI + 90); }
  const gold = "#e2b84a";
  p.poly([[80, 112], [40, 70], [14, 26], [46, 48], [66, 78], [80, 66], [94, 78], [114, 48], [146, 26], [120, 70]], gold, 5);
  p.ell(80, 80, 14, 22, gold, 4); p.ell(80, 52, 10, 10, gold, 4); p.poly([[86, 50], [98, 54], [86, 58]], "#c08a3a", 2.5); p.dot(82, 49, 2);
  p.stroke([[64, 116], [96, 116]], 6, "#c08a3a");
};

// ================= bubbles, shadows, sky =================
const bubble = (p: Pen, cx: number, cy: number, rx: number, ry: number, tail: [number, number]) => {
  p.ell(tail[0], tail[1], 12, 10, "#ffffff", 5); p.ell((tail[0] + cx) / 2 - 10, (tail[1] + cy + ry) / 2, 18, 15, "#ffffff", 5);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([cx + (rx + 9 * Math.sin(a * 9)) * Math.cos(a), cy + (ry + 9 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 7);
};
const shellHeap = (p: Pen, cx: number, by: number, w: number, rows = 3) => {
  for (let r = 0; r < rows; r++) for (let i = 0; i < 6 - r; i++) {
    const x = cx - w / 2 + (i + 0.5 + r * 0.5) * (w / 6), y = by - 12 - r * 16;
    p.g.save(); p.g.translate(x - 18, y - 15); p.g.scale(0.3, 0.3); fxShell(p, (i + r) % 3, i + r * 2); p.g.restore();
  }
};
/** thought bubble (480 x 400): 0 = a heap of shells on the temple steps (Jupiter's temple), 1 = shells in the palace hall */
export const fxBubble = (p: Pen, kind = 0) => {
  bubble(p, 250, 180, 200, 150, [70, 380]);
  if (kind === 0) {
    const x0 = 140, x1 = 360, base = 270;
    p.poly([[x0 - 20, base], [x1 + 20, base], [x1 + 30, base + 22], [x0 - 30, base + 22]], "#e8e0cc", 4);
    for (let i = 0; i < 5; i++) { const x = x0 + i * ((x1 - x0) / 4); p.poly([[x - 9, base], [x + 9, base], [x + 9, 140], [x - 9, 140]], "#f4eee0", 3.5); }
    p.poly([[x0 - 26, 140], [x1 + 26, 140], [250, 86]], "#e8e0cc", 5);
    p.ell(250, 118, 10, 8, "#d9b04a", 2.5);
    shellHeap(p, 250, base + 18, 200, 3);
  } else {
    p.poly([[100, 110], [400, 110], [400, 290], [100, 290]], "#b8322e", 5);
    for (const x of [130, 370]) p.poly([[x - 12, 110], [x + 12, 110], [x + 12, 290], [x - 12, 290]], "#f2ece0", 4);
    p.poly([[220, 150], [280, 150], [280, 250], [220, 250]], "#d9b04a", 4); // a throne
    p.poly([[200, 250], [300, 250], [300, 290], [200, 290]], "#d9b04a", 4);
    shellHeap(p, 250, 292, 260, 4);
  }
};
/** a bubble with little Caligula in his child-size army kit (440 x 520) */
export const fxBootsBubble = (p: Pen, kid: Outfit, opts: FrontOpts) => {
  bubble(p, 230, 230, 200, 220, [40, 500]);
  p.g.save(); p.g.translate(130, 40); p.g.scale(0.4, 0.4); bodyFront(p, kid, opts); p.g.restore();
  for (const [x, y] of [[90, 120], [380, 140], [360, 340]] as const) { p.stroke([[x - 10, y], [x + 10, y]], 4, "#e8b84a"); p.stroke([[x, y - 10], [x, y + 10]], 4, "#e8b84a"); }
};
/** three crested guards' shadows on a wall (600 x 520), dark violet, spears up */
export const fxGuardShadows = (p: Pen) => {
  const c = "#0c0612", g = p.g;
  g.fillStyle = c;
  for (const [x, s] of [[120, 1.0], [300, 1.1], [470, 0.95]] as const) {
    g.save(); g.translate(x, 520); g.scale(s, s);
    g.beginPath(); g.ellipse(0, -330, 38, 42, 0, 0, Math.PI * 2); g.fill(); // head + helmet
    g.beginPath(); g.ellipse(0, -386, 46, 22, 0, Math.PI, 0); g.fill(); // the crest
    g.beginPath(); g.moveTo(-60, -290); g.lineTo(60, -290); g.lineTo(70, -60); g.lineTo(-70, -60); g.fill();
    g.fillRect(-46, -60, 30, 60); g.fillRect(16, -60, 30, 60);
    g.fillRect(70, -470, 8, 420); g.beginPath(); g.moveTo(74, -500); g.lineTo(88, -462); g.lineTo(60, -462); g.fill();
    g.restore();
  }
};
/** the moon (200 x 200) */
export const fxMoon = (p: Pen) => { p.ell(100, 100, 80, 80, "#fff6d8", 0); p.ell(78, 80, 14, 12, "#efe2b8", 0); p.ell(120, 120, 10, 9, "#efe2b8", 0); };
/** rain streaks (512 x 512), k 0..1 phase */
export const fxRain = (p: Pen, k = 0) => {
  const g = p.g; g.strokeStyle = "rgba(210,225,255,0.55)"; g.lineWidth = 3;
  for (let i = 0; i < 70; i++) {
    const x = (i * 97.3) % 512, y = ((i * 211.7) % 512 + k * 512) % 512;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 46); g.stroke();
  }
};
/** a leather coin purse (120 x 140) */
export const fxPurse = (p: Pen) => {
  p.poly([[44, 30], [76, 30], [104, 70], [100, 118], [60, 132], [20, 118], [16, 70]], "#8a5a30", 5);
  p.band([[40, 34], [80, 34]], "#d9b04a", 7, 2.4);
  p.ell(60, 86, 12, 12, "#dfe3ea", 3); p.dot(56, 82, 3, "#ffffff");
};
/** a rock chunk (220 x 180): chalk lump for the rubble, k = shape seed */
export const fxRock = (p: Pen, k = 0, col = "#e8e2d4") => {
  const pts: P2[] = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = 70 + 20 * Math.sin(i * 2.7 + k * 1.3); pts.push([110 + r * 1.2 * Math.cos(a), 100 + r * 0.8 * Math.sin(a)]); }
  p.poly(pts, col, 6);
  p.stroke([[70, 90], [110, 110], [150, 96]], 2.6, mul(col, [0.7, 0.68, 0.72]));
};
