// Cast + effects first drawn for the Frankenstein (Mary Shelley, 1818/1831) short: Ingolstadt, Geneva, the Orkneys, the
// Arctic, 1790s. Looks follow the novel only: the creature is ~8 ft, yellow-skinned, with lustrous flowing black hair,
// watery eyes and black lips (ch. 4-5). No flat head, bolts, stitches or green skin (those are the 1931 film's).
import { Pen, bodyFront } from "../toon";
import type { Outfit, FrontOpts } from "../toon";

export const C_SKIN = "#d9c46c";
/** Victor Frankenstein, a Genevese student: dark-blue tailcoat, cream waistcoat, white stock, brown hair */
export const VICTOR: Outfit = { jacket: "#2e3a5c", pants: "#5a4a3a", boots: "#1e1a1e", hat: "hair", hair: "#4a2e1e", skin: "#f2d6bc", stock: "#f4f0e6", buttons: "#c8b07a" };
/** Victor in the Arctic, gaunt, a heavy brown greatcoat */
export const VICTOR_ARCTIC: Outfit = { jacket: "#5a4636", pants: "#3a3430", boots: "#1e1a1e", hat: "hair", hair: "#5a4232", skin: "#e2cdb8", stock: "#d8d0c4", buttons: "#3a2a20", stubble: true };
/** the creature on its first night: wrapped in a sheet from the table */
export const CREATURE_NEW: Outfit = { jacket: "#e8e2d2", pants: "#e8e2d2", boots: C_SKIN, hat: "hair", long: true, hair: "#141016", skin: C_SKIN };
/** the creature later: a dark ragged cloak taken from Victor's room, coarse breeches */
export const CREATURE: Outfit = { jacket: "#34303a", pants: "#4a4036", boots: "#2a2420", hat: "hair", long: true, hair: "#141016", skin: C_SKIN, belt: "#2a2018" };
/** old De Lacey, blind: "silver hair and a benevolent countenance" (ch. 11) */
export const DELACEY: Outfit = { jacket: "#6a5040", pants: "#3a3430", boots: "#2a2024", hat: "hair", hair: "#e8e8ee", skin: "#f2d4bc", beard: "#e4e4ea", beardStyle: "short", band: "#f0ece0" };
/** Felix, his son */
export const FELIX: Outfit = { jacket: "#8a5a3a", pants: "#4a4038", boots: "#2a2024", hat: "hair", hair: "#3a2618", skin: "#eac6a4", band: "#f0ece0" };
/** Agatha, his daughter: plaited light-brown hair, a grey dress, white apron (ch. 11) */
export const AGATHA: Outfit = { jacket: "#7a7a88", dress: "#7a7a88", pants: "#7a7a88", boots: "#3a3030", hat: "curls", hair: "#a87a4a", skin: "#f4d8c4", sash: "#f0ece4" };
/** the girl at the river and the rustic who shoots */
export const GIRL: Outfit = { jacket: "#d88a9a", dress: "#d88a9a", pants: "#d88a9a", boots: "#6a4a3a", hat: "bonnet", cap: "#ecdca8", hair: "#c89a5a", skin: "#f6dccb", build: "kid" };
export const RUSTIC: Outfit = { jacket: "#9a9670", pants: "#5a4a38", boots: "#3a2a1e", hat: "cap", cap: "#5a4632", skin: "#e6b890", moustache: "#6a4a2a", belt: "#3a2a1a" };
/** William, Victor's little brother: "laughing blue eyes, dark eyelashes and curling hair" (ch. 6) */
export const WILLIAM: Outfit = { jacket: "#3a5a9a", pants: "#3a5a9a", boots: "#2a2024", hat: "hair", hair: "#5a3a1e", skin: "#f8dcc6", build: "kid", band: "#f6f4ee" };
/** Justine Moritz, the family's servant: white cap, brown dress */
export const JUSTINE: Outfit = { jacket: "#8a6a50", dress: "#8a6a50", pants: "#8a6a50", boots: "#3a2a20", hat: "bonnet", cap: "#f4f0e6", hair: "#6a4a2a", skin: "#f4d6c0", sash: "#f0ece4" };
/** Elizabeth, the bride: "hair the brightest living gold" (ch. 1) */
export const ELIZABETH: Outfit = { jacket: "#f4f0e8", dress: "#f4f0e8", pants: "#f4f0e8", boots: "#d8d0c0", hat: "curls", hair: "#f2c84a", skin: "#fae2d0" };
/** Robert Walton, the explorer captain */
export const WALTON: Outfit = { jacket: "#2a3450", pants: "#2a3450", boots: "#1e1a1e", hat: "fur", hair: "#6a4a2a", skin: "#ecc8a8", buttons: "#c8b07a", beard: "#6a4a2a", beardStyle: "short" };

// ---------------- tableau cards (drawn upright; laid flat on the floor / table by the build) ----------------
const sheetOver = (p: Pen, from: number, col = "#ece6d8") => {
  const pts: [number, number][] = [[150, from + 30], [300, from], [450, from + 30], [470, 975], [130, 975]];
  p.poly(pts, col, 9);
  for (const x of [220, 300, 380]) p.stroke([[x, from + 40], [x + 12, 960]], 4, "rgba(80,70,60,0.35)");
};
/** the creature lying on the table under a sheet, head and black hair showing, eyes shut (or open: k) */
export const lyingCreature = (p: Pen, fo: FrontOpts, open = 0) => {
  bodyFront(p, CREATURE_NEW, { ...fo, mode: "stand", blink: 1 - open, expr: open > 0.5 ? "dazed" : "neutral" });
  sheetOver(p, 395);
};
/** the half-made female companion under a sheet on the bench in the Orkneys (no face) */
export const sheetedForm = (p: Pen) => {
  p.ell(300, 300, 110, 105, "#e4ddcc", 9);
  p.poly([[170, 380], [300, 360], [430, 380], [460, 975], [140, 975]], "#e4ddcc", 9);
  for (const x of [230, 300, 370]) p.stroke([[x, 400], [x + 10, 960]], 4, "rgba(80,70,60,0.35)");
};
/** Victor laid out on the cabin bunk, eyes closed */
export const lyingVictor = (p: Pen, fo: FrontOpts) => bodyFront(p, VICTOR_ARCTIC, { ...fo, mode: "stand", blink: 1, expr: "neutral" });
/** Justine asleep on the hay, eyes closed */
export const sleepingJustine = (p: Pen, fo: FrontOpts) => bodyFront(p, JUSTINE, { ...fo, mode: "stand", blink: 1, expr: "smile_closed" });

// ---------------- effects ----------------
/** a great watery yellow eye, k 0 shut .. 1 open (ch. 5: "the dull yellow eye of the creature open") */
export const fxEye = (p: Pen, k = 1) => {
  p.ell(200, 100, 190, 92, C_SKIN, 0);
  const o = Math.max(0.04, k);
  p.ell(200, 104, 120, 58 * o, "#e8e4c8", 9);
  if (k > 0.2) { p.ell(200, 104, 34, 34 * Math.min(1, o * 1.4), "#c8c4a0", 6); p.dot(200, 104, 13 * o, "#2a2420"); p.dot(190, 94, 6 * o, "rgba(255,255,255,0.9)"); }
  p.arc(200, 104, 122, 60 * o + 6, 200, 340, 10, "#141016"); // upper lid line
  p.arc(200, 104, 120, 58 * o, 20, 160, 6, "rgba(60,50,20,0.6)");
  if (k > 0.5) p.poly([[296, 132], [306, 150], [296, 168], [286, 150]], "rgba(150,200,240,0.8)", 4); // watery
};
/** a yellow hand at the table edge, fingers curled (0) or twitched open (1) */
export const fxHand = (p: Pen, k = 0) => {
  p.poly([[20, 120], [90, 104], [110, 150], [30, 170]], C_SKIN, 8);
  const f = [[104, 110], [112, 126], [112, 142], [104, 156]];
  f.forEach(([x, y], i) => p.line([[x, y], [x + 30 + 26 * k, y - 10 + 6 * i * k], [x + 40 + 40 * k, y + (k > 0.5 ? -6 + 8 * i : 14)]], C_SKIN, 12));
};
/** an open book (Paradise Lost: no readable text, only ruled lines) */
export const fxBook = (p: Pen) => {
  p.poly([[20, 60], [100, 74], [100, 170], [20, 156]], "#f4ecd8", 7);
  p.poly([[100, 74], [180, 60], [180, 156], [100, 170]], "#f0e6cc", 7);
  for (let i = 0; i < 6; i++) { p.stroke([[32, 82 + i * 12], [90, 92 + i * 12]], 3, "rgba(60,40,30,0.45)"); p.stroke([[110, 92 + i * 12], [168, 82 + i * 12]], 3, "rgba(60,40,30,0.45)"); }
  p.poly([[14, 154], [100, 170], [186, 154], [186, 164], [100, 180], [14, 164]], "#6a2a2a", 6);
};
/** a speech bubble with a scribble (the words it is learning) */
export const fxSpeech = (p: Pen, k = 0) => {
  p.ell(100, 90, 82, 58, "#fbfaf4", 8); p.poly([[60, 136], [44, 178], [90, 142]], "#fbfaf4", 8); p.ell(100, 90, 82, 58, null, 8);
  const ph = k * 6;
  p.stroke(Array.from({ length: 9 }, (_, i) => [42 + i * 14, 90 + 14 * Math.sin(i * 1.6 + ph)] as [number, number]), 6, "#3a3040");
};
/** De Lacey's guitar */
export const fxGuitar = (p: Pen) => {
  p.ell(80, 130, 52, 46, "#b8783a", 8); p.ell(80, 82, 38, 34, "#b8783a", 8); p.dot(80, 112, 14, "#2a1a10");
  p.band([[100, 70], [190, 10]], "#5a3a20", 16, 6);
  for (const d of [-4, 4]) p.stroke([[60, 150 + d], [186, 14 + d]], 2, "rgba(240,230,200,0.8)");
};
/** motion arcs of a stick swung (the stick itself only as a blur) */
export const fxSwing = (p: Pen, k = 0) => {
  for (let i = 0; i < 4; i++) p.arc(40, 180, 150 - i * 18, 150 - i * 18, -80 + 60 * k, -10 + 60 * k, 8 - i, `rgba(250,250,255,${0.9 - i * 0.18})`);
  p.band([[40, 180], [40 + 150 * Math.cos((-30 + 60 * k) * Math.PI / 180), 180 + 150 * Math.sin((-30 + 60 * k) * Math.PI / 180)]], "#8a5a32", 12, 5);
};
/** William's little blue cap, lying in the grass */
export const fxCap = (p: Pen) => {
  p.ell(100, 110, 70, 40, "#3a5a9a", 8); p.ell(100, 128, 86, 18, "#2a4478", 7); p.dot(100, 76, 10, "#c83a3a");
};
/** the miniature of Victor's mother in a gold locket (planted on Justine) */
export const fxLocket = (p: Pen) => {
  p.stroke([[40, 20], [100, 70], [160, 20]], 4, "#d8b04a");
  p.ell(100, 120, 44, 56, "#d8b04a", 8); p.ell(100, 120, 30, 40, "#f4e0c8", 4); p.ell(100, 112, 12, 14, "#e8c8a8", 3); p.ell(100, 140, 18, 12, "#5a6a9a", 3);
};
const bubble = (p: Pen) => {
  for (const [x, y, r] of [[30, 180, 10], [52, 156, 15]] as const) p.ell(x, y, r, r, "#fbfaf4", 6);
  p.ell(122, 82, 74, 64, "#fbfaf4", 8);
  for (const [x, y, r] of [[70, 50, 30], [130, 32, 34], [178, 70, 26], [160, 126, 30], [84, 126, 28]] as const) p.ell(x, y, r, r, "#fbfaf4", 0);
  p.ell(122, 82, 74, 64, null, 8);
};
/** a thought bubble with a heart in it (a companion) */
export const fxHeartBubble = (p: Pen) => {
  bubble(p);
  p.poly([[122, 120], [86, 84], [86, 62], [104, 52], [122, 66], [140, 52], [158, 62], [158, 84]], "#d83a4a", 6);
};
/** a thought bubble with a palm tree on a little island (the wilds of South America, ch. 17) */
export const fxPalmBubble = (p: Pen) => {
  bubble(p);
  p.ell(122, 118, 46, 12, "#e8c87a", 5);
  p.band([[122, 112], [128, 66]], "#8a5a32", 9, 4);
  for (const a of [-150, -110, -70, -30]) { const r = (a * Math.PI) / 180; p.band([[128, 66], [128 + 34 * Math.cos(r), 72 + 26 * Math.sin(r) + 14]], "#4a9a3a", 10, 4); }
};
/** a white sleeve and a limp hand hanging over the edge of the bed (all that is shown of the bride) */
export const fxSleeve = (p: Pen) => {
  p.poly([[40, 20], [120, 20], [116, 120], [70, 130]], "#f4f0e8", 7);
  p.line([[92, 126], [96, 168], [104, 180]], "#fae2d0", 12);
};
/** a sledge seen from the side, a figure-sized load */
export const fxSledge = (p: Pen) => {
  p.poly([[20, 120], [180, 120], [170, 96], [30, 96]], "#8a5a32", 7);
  p.stroke([[10, 140], [190, 140], [200, 126]], 7, "#3a3030");
  for (const x of [50, 100, 150]) p.stroke([[x, 120], [x, 140]], 5, "#3a3030");
};
/** a tear */
export const fxTearDrop = (p: Pen) => { p.poly([[50, 10], [80, 60], [70, 88], [30, 88], [20, 60]], "#8ec8f0", 5); p.dot(42, 55, 6, "rgba(255,255,255,0.8)"); };
/** a gun's muzzle smoke (the gun itself is never drawn) */
export const fxSmoke = (p: Pen, k = 0) => {
  for (const [x, y, r] of [[60, 120, 34], [100, 100, 40], [140, 110, 30], [110, 70, 28]] as const) p.ell(x + 40 * k, y - 20 * k, r * (0.8 + 0.6 * k), r * (0.8 + 0.6 * k), `rgba(235,235,240,${0.8 * (1 - k)})`, 0);
};
/** scraps of the torn-up body: rags + fragments flying */
export const fxScraps = (p: Pen, seed = 0) => {
  const c = ["#e4ddcc", "#d9c46c", "#c8bfa8"][seed % 3];
  p.poly([[40, 60 + seed * 7], [150, 40], [170, 120 - seed * 5], [60, 150]], c, 7);
  p.stroke([[60, 90], [140, 80]], 4, "rgba(80,70,60,0.4)");
};
