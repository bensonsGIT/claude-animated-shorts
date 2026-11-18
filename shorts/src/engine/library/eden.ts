// Cast + effects first drawn for the East of Eden (Steinbeck, 1952) short: Salinas, California, 1917.
// Looks follow the novel's descriptions (Aron fair and golden-haired, Cal dark), never a film or TV adaptation.
import { Pen, bodyFront } from "../toon";
import type { Outfit, FrontOpts } from "../toon";

/** Cal Trask, 17: dark hair, dark eyes, brown jacket, white shirt, a dark tie */
export const CAL: Outfit = { jacket: "#6a4a32", pants: "#3a3430", boots: "#2a2024", hat: "hair", hair: "#1e1612", skin: "#e6c09a", tie: "#3a2a24" };
/** Aron Trask, 17: fair, golden-haired, light blue jacket, white collar */
export const ARON: Outfit = { jacket: "#8ab0d8", pants: "#4a5468", boots: "#3a2a24", hat: "hair", hair: "#f0c860", skin: "#fbe0c4", band: "#f6f4ee" };
/** Aron in the army: olive drab tunic and cap */
export const ARON_ARMY: Outfit = { jacket: "#6e6a3c", pants: "#6e6a3c", boots: "#3a2a1a", hat: "cap", cap: "#5e5a30", hair: "#f0c860", skin: "#fbe0c4", belt: "#4a3a22", buttons: "#c8b07a" };
/** Adam Trask, ~55: tall, grey, clean-shaven, a dark grey three-piece suit */
export const ADAM: Outfit = { jacket: "#4a4c58", pants: "#4a4c58", boots: "#1e1a1e", hat: "hair", hair: "#b8b4ac", skin: "#f5d6b8", tie: "#22222a", buttons: "#8a8c98" };
/** Kate (the twins' mother) in 1917: small, pale blonde, black high-necked dress */
export const KATE: Outfit = { jacket: "#16141a", dress: "#16141a", pants: "#16141a", boots: "#16141a", hat: "curls", hair: "#e6d6a0", skin: "#f4dcc8", stock: "#2a1a24" };
/** Cathy young (the nursery, 1862 era): the same face, a long pale dress */
export const CATHY: Outfit = { jacket: "#e8dccc", dress: "#e8dccc", pants: "#e8dccc", boots: "#6a5a4a", hat: "curls", hair: "#f2dca0", skin: "#f8e2cc" };
/** the telegram boy: navy uniform, brass buttons, cap */
export const WIREBOY: Outfit = { jacket: "#2a3a6a", pants: "#2a3a6a", boots: "#1e1a1e", hat: "cap", cap: "#22305a", buttons: "#d8b04a", build: "kid", skin: "#f5d0b0" };
/** bean farmers: work shirts, overalls, caps, moustaches */
export const FARMER = (v = 0): Outfit => ({ jacket: ["#a8643a", "#5a7a9a", "#8a8a5a"][v % 3], pants: "#3a4a6a", boots: "#3a2a20", hat: "cap", cap: ["#5a4632", "#3a3440", "#6a5a3a"][v % 3],
  moustache: v % 2 ? undefined : "#5a3a24", skin: ["#efc6a0", "#e0b088", "#f5d0b0"][v % 3], belt: "#3a2a1a" });

/** someone propped up in bed: the body drawn sitting, cut off by a quilt over the lap (port of the Trial short's tableau) */
export const inBed = (p: Pen, o: Outfit, fo: FrontOpts, quilt = "#b8a890") => {
  p.clip([[0, 0], [600, 0], [600, 900], [0, 900]], () => bodyFront(p, o, { ...fo, mode: "sit" }));
  const q: [number, number][] = [[0, 1000], [10, 880], [120, 840], [300, 828], [480, 840], [590, 880], [600, 1000]];
  p.poly(q, quilt, 8);
  for (const x of [150, 300, 450]) p.stroke([[x, 850], [x + 10, 990]], 4, "rgba(60,30,40,0.35)");
};

/** a dried bean (brown kidney bean with a pale eye), seed varies the tint */
export const fxBean = (p: Pen, seed = 0) => {
  const c = ["#a8643a", "#c8843a", "#8a4a2a", "#e8d8b0"][seed % 4];
  p.ell(100, 100, 70, 44, c, 9, 0, 360, 0.3);
  p.ell(100, 82, 14, 8, seed % 4 === 3 ? "#5a3a2a" : "#f4e8d0", 0, 0, 360, 0.3);
  p.arc(84, 92, 30, 18, 200, 300, 5, "rgba(255,255,255,0.45)");
};
/** the present: a box in white paper with a red ribbon and bow */
export const fxGift = (p: Pen) => {
  p.poly([[30, 80], [170, 80], [170, 180], [30, 180]], "#f6f0e2", 8);
  p.poly([[88, 80], [112, 80], [112, 180], [88, 180]], "#c83a3a", 0);
  p.poly([[30, 118], [170, 118], [170, 140], [30, 140]], "#c83a3a", 0);
  p.poly([[30, 80], [170, 80], [170, 180], [30, 180]], null, 8);
  p.ell(72, 64, 28, 18, "#d84a4a", 6, 0, 360, -0.4); p.ell(128, 64, 28, 18, "#d84a4a", 6, 0, 360, 0.4); p.dot(100, 76, 12, "#a82a2a");
};
/** a lettuce crate: slatted box with green heads; rot 0 fresh .. 1 rotten (brown-green, drooping) */
export const fxCrate = (p: Pen, rot = 0) => {
  const g = rot > 0.5 ? "#7a8a3a" : "#6ac04a", g2 = rot > 0.5 ? "#5a6a2a" : "#4a9a3a";
  for (const [x, y] of [[60, 70], [100, 62], [140, 70]] as const) { p.dot(x, y, 34, g); p.arc(x, y, 22, 22, 200, 340, 5, g2); p.ell(x, y, 34, 34, null, 6); }
  p.poly([[20, 80], [180, 80], [176, 180], [24, 180]], "#c8a060", 8);
  for (const y of [112, 146]) p.stroke([[24, y], [176, y]], 5, "#8a6a3a");
};
/** green slime oozing out of a boxcar door: k 0..1 spread */
export const fxSlime = (p: Pen, k = 1) => {
  const w = 40 + 140 * k;
  const pts: [number, number][] = [[100 - w / 2, 40], [100 + w / 2, 40]];
  for (let i = 0; i <= 6; i++) { const x = 100 + w / 2 - (i / 6) * w; pts.push([x, 120 + 50 * k * (0.6 + 0.4 * Math.sin(i * 2.1))]); }
  p.poly(pts, "#7a9a2a", 7);
  p.dot(80, 70, 9, "rgba(255,255,220,0.5)"); p.dot(130, 90, 6, "rgba(255,255,220,0.4)");
};
/** a fly: k 0/1 wing frame */
export const fxFly = (p: Pen, k = 0) => {
  p.ell(70, 100 - 18 * k, 26, 14, "rgba(220,235,255,0.8)", 4, 0, 360, -0.5);
  p.ell(130, 100 - 18 * k, 26, 14, "rgba(220,235,255,0.8)", 4, 0, 360, 0.5);
  p.ell(100, 110, 22, 18, "#1e1a22", 0);
};
/** a bundle of dollar bills (green, banded) */
export const fxCash = (p: Pen) => {
  for (let i = 0; i < 4; i++) p.poly([[30 + i * 4, 70 + i * 10], [170 + i * 4, 66 + i * 10], [172 + i * 4, 130 + i * 10], [32 + i * 4, 134 + i * 10]], "#9ac08a", 6);
  p.poly([[90, 92], [118, 92], [118, 166], [90, 166]], "#e8dcb0", 5);
  p.ell(60, 130, 14, 14, null, 4);
};
/** a golden halo ring (over Aron) */
export const fxHalo = (p: Pen) => {
  p.ell(100, 100, 86, 30, null, 16, 0, 360);
  p.ell(100, 100, 86, 30, null, 9, 0, 360);
  p.arc(100, 100, 86, 30, 0, 360, 10, "#ffd84a");
};
/** a snowflake / snow puff */
export const fxFlake = (p: Pen) => { p.dot(100, 100, 40, "#f8fbff"); p.dot(100, 100, 18, "#ffffff"); };
/** a small wooden cross lying on the road (Aron's) */
export const fxCrossDown = (p: Pen) => {
  p.band([[100, 20], [100, 180]], "#8a5a32", 26, 7);
  p.band([[50, 70], [150, 70]], "#8a5a32", 26, 7);
};
/** a cradle (side view) */
export const fxCradle = (p: Pen) => {
  p.poly([[20, 90], [180, 90], [160, 160], [40, 160]], "#c89a62", 8);
  p.arc(100, 170, 90, 22, 200, 340, 8, "#8a5a32");
  p.ell(100, 92, 70, 14, "#f4f0e8", 6);
};
