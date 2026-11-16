// Cast + effects first drawn for the Peter the Great beard-tax short, 1698-1772. Any short can import them.

import { BEARDS, Pen, SKINS, mul, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";


// ================= Peter the Great and the beard tax, 1698-1772 =================
export const LIN = "#f4f1e8", GILT = "#e1b84c";
/** Peter, 26: dark green coat with gold buttons, white cravat, tricorn over dark shoulder-length curls, small black
 *  moustache, bare chin, olive skin. Drawn ~1.25x taller than everyone (cast scale). */
export const PETER: Outfit = { jacket: "#2f5a3a", pants: "#2a2a30", boots: "#1e1a1e", hat: "tricorn", hair: "#2a1e1a", moustache: "#1e1a1a",
  band: LIN, buttons: GILT, skin: "#ecc29a" };
/** boyars: long brocade kaftans (dress), tall fur hats, long beards; v 0 grey / gold brocade (stout), 1 red / crimson,
 *  2 forked black / blue */
export const BOYAR = (v = 0): Outfit => {
  const kaftan = ["#c99a3a", "#a82a3a", "#2f4a8a", "#5a7a3a", "#7a3a7a", "#b8703a"][v % 6], beard = BEARDS[v % 6];
  return { jacket: kaftan, dress: kaftan, pants: "#2a2228", boots: "#8a2a2a", hat: "fur", buttons: GILT, beard, moustache: mul(beard, [0.8, 0.78, 0.82]),
    beardStyle: v % 3 === 2 ? "fork" : "long", skin: SKINS[v % 4], build: v % 3 === 0 ? "stout" : "adult" };
};
/** the same man after the razor: no beard, a stubbly jaw, moustache kept */
export const shaved = (o: Outfit): Outfit => ({ ...o, beard: undefined, stubble: true });
export const POLICE: Outfit = { jacket: "#3f6a3a", pants: "#3a3a44", boots: "#1e1a1e", hat: "cap", cap: "#24341f", belt: "#f1efe6", buttons: "#d9dde0", moustache: "#5a3a24", skin: "#f5c9a0" };
export const MERCHANT: Outfit = { jacket: "#7a4a2a", dress: "#7a4a2a", pants: "#3a3030", boots: "#3a2a20", hat: "furcap", cap: "#8a2a3a", buttons: GILT,
  beard: "#2a2224", moustache: "#1e1a1e", sash: "#d9b04a", build: "stout", skin: "#f5d0b0" };
export const PEASANT: Outfit = { jacket: "#a8a296", pants: "#6a6458", boots: "#c8b07a", hat: "cap", cap: "#6a5a48", sash: "#c8b48a",
  beard: "#7a5232", moustache: "#5a3a24", beardStyle: "scruffy", skin: "#efc6a0" };
export const GATEKEEPER: Outfit = { jacket: "#4a5a7a", pants: "#2e2e36", boots: "#2a2024", hat: "furcap", cap: "#3a3040", moustache: "#3a2a20", buttons: "#c8ccd4", skin: "#f5d0b0" };
export const MINTWORKER: Outfit = { jacket: "#8a6040", pants: "#3a3640", boots: "#2a2024", hat: null, sash: "#5a3a24", skin: "#efc6a0", build: "stout" };
export const CARPENTER: Outfit = { jacket: "#7a5a3a", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#4a3a2a", stubble: true, skin: "#f5d0b0", belt: "#c8a46a" };
export const CARPENTER_BEARD = "#d8b060";
export const PERRY: Outfit = { jacket: "#24365e", pants: "#2a2a34", boots: "#1e1a1e", hat: "periwig", hair: "#6b4630", band: LIN, buttons: GILT, skin: "#ffe0c4" };
export const OLDMAN: Outfit = { jacket: "#6a5a7a", dress: "#6a5a7a", pants: "#3a3040", boots: "#3a2a20", hat: "furcap", cap: "#4a3a5a", beard: "#ecebe6", moustache: "#d8d6d0",
  skin: "#f5d0b0", sash: "#c8a46a" };
/** Moscow townsfolk: shaved men in caps / headscarved women */
export const MUSCOVITE = (v = 0): Outfit => {
  const o: Outfit = { jacket: ["#8a5a3a", "#5a6a8a", "#7a7a4a", "#a8643a", "#6a4a6a", "#4a6a5a"][v % 6], pants: "#3d3a40", boots: "#3a2a20", hat: "cap",
    cap: ["#5a4632", "#3a3040", "#6a2a2a"][v % 3], moustache: v % 4 === 0 ? "#5a3a24" : undefined, skin: SKINS[v % 4], stubble: v % 3 === 1 };
  return v % 3 === 2 ? { ...o, hat: "veil", cap: ["#c8303a", "#e9dcc0", "#3a5a9a"][v % 3], dress: ["#7a5a3a", "#5a6a4a", "#8a4a3a"][v % 3], moustache: undefined, stubble: false } : o;
};

/** the giant straight razor that rises into the hook / ending, 640 x 280 canvas: steel blade up top, handle down left */
export const fxRazor = (p: Pen) => {
  p.poly([[40, 250], [70, 270], [330, 150], [312, 124]], "#2a2026", 7); // handle (scales)
  p.stroke([[80, 246], [300, 146]], 4, "#5a4a52");
  p.dot(318, 136, 10, "#c8ccd4");
  p.poly([[310, 120], [600, 40], [628, 62], [612, 108], [340, 168]], "#e6ebf2", 8); // blade
  p.stroke([[320, 132], [606, 52]], 6, "#a8b2c2");
  p.stroke([[350, 160], [610, 100]], 3, "#ffffff");
};
/** a 4-point white glint star, 200 x 200 canvas, k 0..1 grows and fades */
export const fxGlint = (p: Pen, k: number) => {
  const s = Math.sin(Math.PI * Math.min(1, Math.max(0, k))), r = 92 * s, w = 14 * s + 2;
  p.poly([[100, 100 - r], [100 + w, 100 - w], [100 + r, 100], [100 + w, 100 + w], [100, 100 + r], [100 - w, 100 + w], [100 - r, 100], [100 - w, 100 - w]], "#ffffff", 0);
  p.ell(100, 100, 18 * s + 1, 18 * s + 1, "#ffffff", 0);
};
/** a loose clump of cut beard, 200 x 260 canvas */
export const fxBeard = (p: Pen, col: string, seed = 0) => {
  const pts: P2[] = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 70 + 22 * rnd(seed + 3, i); pts.push([100 + 0.75 * r * Math.cos(a), 130 + 1.25 * r * Math.sin(a)]); }
  p.poly(pts, col, 7);
  const dk = mul(col, [0.66, 0.64, 0.72]);
  for (let i = -2; i <= 2; i++) p.stroke([[100 + i * 18, 60], [100 + i * 22 + 6, 210]], 4, dk);
};
/** the beard token, 300 x 300 canvas: side 0 = the face (nose, mouth, moustache, beard), 1 = the eagle, 2 = the
 *  inscription side (engraved lines, no readable words: captions carry the text) */
export const fxToken = (p: Pen, side = 0) => {
  const cu = "#c8743a", rim = "#9a5428", dk = "#6a3418";
  p.ell(150, 150, 130, 130, rim, 9); p.ell(150, 150, 110, 110, cu, 4);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; p.dot(150 + 120 * Math.cos(a), 150 + 120 * Math.sin(a), 3, dk); }
  if (side === 0) {
    p.poly([[138, 92], [128, 140], [152, 146]], null, 7); // nose
    p.stroke([[100, 120], [118, 114]], 6, dk); p.stroke([[182, 114], [200, 120]], 6, dk); // brows hint
    p.stroke([[112, 160], [140, 152], [150, 158], [160, 152], [188, 160]], 9, dk); // moustache
    p.arc(150, 170, 18, 8, 20, 160, 6, dk); // mouth
    p.poly([[96, 168], [204, 168], [196, 214], [172, 246], [150, 254], [128, 246], [104, 214]], mul(cu, [0.9, 0.86, 0.84]), 6); // beard
    for (const x of [124, 150, 176]) p.stroke([[x, 186], [x + 2, 236]], 4, dk);
  } else if (side === 1) {
    p.ell(150, 160, 26, 40, mul(cu, [0.9, 0.86, 0.84]), 6);
    for (const s of [-1, 1]) {
      p.poly([[150 + s * 20, 140], [150 + s * 86, 100], [150 + s * 92, 130], [150 + s * 70, 150], [150 + s * 84, 168], [150 + s * 30, 180]], mul(cu, [0.9, 0.86, 0.84]), 6);
      p.ell(150 + s * 26, 98, 16, 16, mul(cu, [0.9, 0.86, 0.84]), 6); // two heads
      p.poly([[150 + s * 36, 94], [150 + s * 52, 100], [150 + s * 38, 104]], dk, 0);
    }
    p.poly([[124, 74], [134, 58], [150, 70], [166, 58], [176, 74]], mul(cu, [1.05, 1.0, 0.9]), 5); // crown
  } else {
    for (let i = 0; i < 5; i++) { const y = 94 + i * 28, w = 80 - Math.abs(i - 2) * 12; p.stroke([[150 - w, y], [150 + w, y + 2]], 7, dk); for (let k = 0; k < 7; k++) p.stroke([[150 - w + k * (2 * w / 7) + 6, y - 8], [150 - w + k * (2 * w / 7) + 10, y + 8]], 4, dk); }
  }
  p.ell(102, 96, 22, 30, "rgba(255,236,200,0.35)", 0);
};
/** a fat merchant's purse lying / falling, 240 x 240 canvas */
export const fxPurse = (p: Pen) => {
  p.poly([[96, 40], [144, 40], [150, 64], [204, 110], [212, 176], [176, 214], [64, 214], [28, 176], [36, 110], [90, 64]], "#8a5a30", 8);
  p.band([[84, 66], [156, 66]], "#d9b04a", 10, 4);
  p.ell(120, 150, 30, 30, "#d9b04a", 6); p.ell(120, 150, 18, 18, null, 3);
  p.ell(80, 110, 16, 30, "rgba(255,230,190,0.3)", 0);
};
/** the tiny copper kopek, 120 x 120 canvas */
export const fxKopek = (p: Pen) => {
  p.ell(60, 60, 50, 50, "#c8743a", 6); p.ell(60, 60, 36, 36, null, 3);
  p.stroke([[46, 60], [74, 60]], 5, "#6a3418"); p.stroke([[60, 46], [60, 74]], 5, "#6a3418");
  p.ell(44, 42, 10, 14, "rgba(255,236,200,0.5)", 0);
};
