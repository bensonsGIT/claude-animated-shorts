// Cast + effects first drawn for The Trial (Kafka, 1925) short: a European city c. 1914. Any short can import them.
// Looks follow the novel's own descriptions (chapter refs in ~/the-trial-short/SCRIPT.md), never a film adaptation.
import { Pen, SKINS, bodyFront, FrontOpts } from "../toon";
import type { Outfit } from "../toon";

const PALE = "#f4dcc4";
/** Josef K., 30, a senior bank officer: plain, dark parted hair, clean-shaven, black suit and a dark tie */
export const JOSEF: Outfit = { jacket: "#22222c", pants: "#22222c", boots: "#141418", hat: "hair", hair: "#2a1e1a", tie: "#4a4a5a", skin: PALE };
/** the arrest morning: still in his long white nightshirt, barefoot */
export const JOSEF_NIGHT: Outfit = { jacket: "#f2eee4", dress: "#f2eee4", pants: "#f2eee4", boots: PALE, hat: "hair", hair: "#2a1e1a", skin: PALE };
/** the warders (ch. 1): close black travelling suits with pleats, pockets, buckles and a belt. Franz slim, Willem big */
export const FRANZ: Outfit = { jacket: "#1c1c24", pants: "#1c1c24", boots: "#141418", belt: "#4a3a2a", buttons: "#c8b070", hat: "hair", hair: "#c8a060", skin: SKINS[1] };
export const WILLEM: Outfit = { ...FRANZ, hair: "#5a3a24", moustache: "#4a3020", build: "stout", skin: "#f0c8a8" };
/** the whipper (ch. 5): dark leather, neck and arms bare, shaven head */
export const WHIPPER: Outfit = { jacket: "#4a2e1e", pants: "#3a2418", boots: "#1a1210", hat: null, skin: "#d8a070", build: "stout" };
/** the examining magistrate (ch. 2): small and fat, thin hair, black coat */
export const MAGISTRATE: Outfit = { jacket: "#24242c", pants: "#24242c", boots: "#141418", hat: "hair", hair: "#7a7a80", build: "stout", skin: "#f5d0b8" };
/** the hearing crowd: bearded men in long black coats */
export const CROWDMAN = (v = 0): Outfit => ({ jacket: ["#22222a", "#2a2630", "#1c1c22", "#302a2a"][v % 4], dress: v % 3 === 0 ? "#22222a" : undefined, pants: "#1c1c22",
  boots: "#141418", hat: "hair", hair: ["#2a1e1a", "#5a3a24", "#8a8a90", "#141014", "#7a5232"][v % 5],
  beard: ["#2a1e1a", "#5a3a24", "#8a8a90", "#141014", "#7a5232", "#b8b4ac"][v % 6], beardStyle: v % 2 ? "short" : "long", skin: SKINS[v % 3] });
/** Huld the lawyer: old and ill, in his nightshirt, white hair, grey beard */
export const HULD: Outfit = { jacket: "#f2eee4", pants: "#f2eee4", boots: PALE, hat: "hair", hair: "#ecebe6", beard: "#c8c6c0", beardStyle: "long", skin: "#f6e0d0" };
/** Titorelli the court painter (ch. 7): nightshirt + wide linen trousers, barefoot, wild hair */
export const TITORELLI: Outfit = { jacket: "#f2eee4", pants: "#e2d4b0", boots: SKINS[1], hat: "frizz", hair: "#7a5232", skin: SKINS[1] };
/** the prison chaplain (ch. 9): young, pale, black cassock */
export const PRIEST: Outfit = { jacket: "#16161c", dress: "#16161c", pants: "#16161c", boots: "#16161c", hat: "hair", hair: "#2a1e1a", skin: "#fbe2c8" };
/** the doorkeeper of the parable: fur coat + fur hat, long thin black beard */
export const DOORKEEPER: Outfit = { jacket: "#6a4a30", pants: "#3a2a20", boots: "#1a1210", hat: "fur", cap: "#5a3e2a", beard: "#141014", beardStyle: "long", skin: "#ecc8a4", build: "stout" };
/** the man from the country, ageing: 0 young (brown beard), 1 grey, 2 white */
export const PEASANT = (age = 0): Outfit => ({ jacket: "#8a6a44", pants: "#5a4a3a", boots: "#3a2a20", hat: "hair", hair: ["#5a3a24", "#9a968e", "#ecebe6"][age],
  beard: ["#5a3a24", "#9a968e", "#ecebe6"][age], beardStyle: age ? "long" : "short", skin: ["#ecc09a", "#e8c4a6", "#f0d4c0"][age] });
/** the two men of ch. 10: pale and fat, frock coats and top hats, identical */
export const TOPHAT = (v = 0): Outfit => ({ jacket: "#141418", pants: "#141418", boots: "#0e0e10", hat: "tophat", build: "stout", skin: v ? "#f4e2d6" : "#f2ded2" });
/** the neighbours across the street (ch. 1) */
export const NEIGHBOUR = (v = 0): Outfit => [
  { jacket: "#3a3040", dress: "#3a3040", pants: "#3a3040", boots: "#1a1a1e", hat: "bonnet", cap: "#2a2430", skin: "#f5d6c0" },
  { jacket: "#4a4038", pants: "#3a3430", boots: "#1a1a1e", hat: "hair", hair: "#ecebe6", moustache: "#ecebe6", skin: "#f0ccb0" },
  { jacket: "#5a6a8a", pants: "#3a3a40", boots: "#1a1a1e", hat: "hair", hair: "#8a5a3a", skin: SKINS[2] },
][v % 3];

/** someone sitting up in bed: the body drawn sitting, cut off by a quilt over the lap (lit card on the mattress) */
export const inBed = (p: Pen, o: Outfit, fo: FrontOpts, quilt = "#c8a8a0") => {
  p.clip([[0, 0], [600, 0], [600, 900], [0, 900]], () => bodyFront(p, o, { ...fo, mode: "sit" }));
  const q: [number, number][] = [[0, 1000], [10, 880], [120, 840], [300, 828], [480, 840], [590, 880], [600, 1000]];
  p.poly(q, quilt, 8);
  for (const x of [150, 300, 450]) p.stroke([[x, 850], [x + 10, 990]], 4, "rgba(60,30,40,0.35)");
};

/** one of Titorelli's heath paintings: two stunted trees on a brown moor under a grey sky, all identical */
export const fxHeath = (p: Pen) => {
  p.poly([[10, 20], [190, 20], [190, 170], [10, 170]], "#a07a3e", 8);
  p.poly([[24, 34], [176, 34], [176, 104], [24, 104]], "#a8aab4", 0);
  p.poly([[24, 104], [176, 96], [176, 156], [24, 156]], "#7a6236", 0);
  for (const x of [70, 128]) { p.stroke([[x, 118], [x + 2, 80]], 5, "#3a2a20"); p.dot(x + 2, 76, 14, "#4a5a3a"); }
  p.poly([[24, 34], [176, 34], [176, 156], [24, 156]], null, 4);
};
/** a blank petition sheet */
export const fxSheet = (p: Pen) => {
  p.poly([[40, 20], [160, 14], [166, 186], [46, 190]], "#f6f0dc", 6);
  p.stroke([[60, 40], [120, 37]], 4, "#8a7a64");
};
/** a shirt hanging on the laundry line */
export const fxLaundry = (p: Pen, col = "#e8e4d8") => {
  p.poly([[40, 30], [80, 20], [120, 20], [160, 30], [175, 70], [148, 78], [146, 180], [54, 180], [52, 78], [25, 70]], col, 6);
  for (const x of [70, 130]) p.poly([[x - 6, 12], [x + 6, 12], [x + 5, 34], [x - 5, 34]], "#c8a060", 4);
};
/** the figure at the lit window (ch. 10): a small dark silhouette leaning out with both arms stretched out */
export const fxReach = (p: Pen) => {
  const c = "#1a1420";
  p.dot(100, 70, 22, c);
  p.poly([[78, 92], [122, 92], [130, 200], [70, 200]], c, 0);
  p.band([[80, 100], [40, 80], [8, 64]], c, 14, 0, "round");
  p.band([[120, 100], [160, 80], [192, 64]], c, 14, 0, "round");
};
/** a little gold court badge glint: reuse fxShine from stranger.ts; a crumb for the breakfast */
export const fxCrumb = (p: Pen) => { p.poly([[30, 40], [70, 30], [80, 60], [40, 72]], "#d8a860", 5); };
