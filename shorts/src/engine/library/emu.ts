// Cast + effects first drawn for the Great Emu War short, Western Australia 1932. Any short can import them.

import { Pen, mul, rad, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";

// ================= The Great Emu War, 1932 =================
const KHAKI = "#8a7a50", BRASS = "#d9b04a";
/** Major G.P.W. Meredith: khaki tunic, Sam Browne belt, peaked cap, neat dark moustache */
export const MEREDITH: Outfit = { jacket: KHAKI, pants: "#6a5e3e", boots: "#3a2618", hat: "peaked", belt: "#6a3e22", buttons: BRASS, moustache: "#3a2a20", skin: "#f5d0b0" };
/** the sergeant: ginger hair under a slouch hat, clean-shaven */
export const SERGEANT: Outfit = { jacket: KHAKI, pants: "#6a5e3e", boots: "#3a2618", hat: "slouch", buttons: BRASS, skin: "#ffe0c4", belt: "#6a3e22" };
/** the gunner: slouch hat, darker skin tone, clean-shaven */
export const GUNNER: Outfit = { jacket: "#7e7048", pants: "#6a5e3e", boots: "#3a2618", hat: "slouch", buttons: BRASS, skin: "#ecc29a" };
/** wheat farmers: rolled shirt sleeves, braces (belt), wide-brim felt hats */
export const FARMER = (v = 0): Outfit => ({ jacket: ["#c8b89a", "#9ab0c8"][v % 2], pants: ["#4a4a5a", "#5a4632"][v % 2], boots: "#3a2618", hat: "brimhat",
  cap: ["#7a6040", "#5a4a3a"][v % 2], belt: "#3a2a20", moustache: v % 2 ? undefined : "#b8b4ac", skin: "#e8a888", build: v % 2 ? "adult" : "stout" });
/** members of the House: dark suits, wing collars; v 0 = the joker (round glasses, grey moustache, bald) */
export const MP = (v = 0): Outfit => ({ jacket: ["#2a2a34", "#3a3440", "#24303a", "#3a3a3a"][v % 4], pants: "#22222a", boots: "#1a1a1e",
  hat: v === 0 ? null : "hair", hair: ["#b8b4ac", "#3a2a20", "#6a4a30", "#9a968e"][v % 4], moustache: v % 3 === 0 ? "#b8b4ac" : undefined,
  band: "#f4f1e8", buttons: "#c8ccd4", specs: v === 0, build: v % 2 ? "adult" : "stout", skin: ["#f5d0b0", "#ffe0c4", "#efc6a0", "#f5c9a0"][v % 4] });

/** an emu side-on on a 400 x 480 canvas (feet at y 470, facing right; dir -1 mirrors it).
 *  leg 0-2 = run cycle, 3 = standing; eye "dot" | "smug" (half lid) | "wink" | "shock"; hat = a tiny slouch hat; medal = on its chest */
export type EmuEye = "dot" | "smug" | "wink" | "shock";
export const fxEmu = (p: Pen, leg = 3, dir = 1, eye: EmuEye = "dot", hat = false, medal = false, seed = 0) => {
  const g = p.g;
  g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 400, 0);
  const body = "#6a5a4c", dark = "#3e3430", skin = "#8aa0b8", legC = "#7a6a5a";
  const run = leg < 3, bob = run ? [0, -10, -4][leg] : 0;
  // legs (behind the body): thigh hidden in feathers, long shank, three toes
  const legs: [P2, P2][] = run ? [[[170, 330], ([[110, 470], [250, 440], [200, 470]] as P2[])[leg]], [[200, 330], ([[260, 455], [140, 470], [220, 466]] as P2[])[leg]]]
    : [[[175, 330], [165, 470]], [[205, 330], [215, 470]]];
  legs.forEach(([h, f], i) => {
    const k: P2 = [(h[0] + f[0]) / 2 + (i ? 14 : -14), (h[1] + f[1]) / 2 - 6];
    p.line([[h[0], h[1] + bob], k, f], i ? legC : mul(legC, [0.8, 0.8, 0.84]), 11, true);
    for (const a of [-30, 0, 30]) p.line([f, [f[0] + 22 * Math.cos(rad(a)), f[1] + 4 * Math.sin(rad(a))]], legC, 5, true);
  });
  // shaggy body: a lumpy oval with drooping feather fringe at the back
  const pts: P2[] = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, r = 1 + 0.06 * rnd(seed + 11, i); pts.push([190 + 120 * r * Math.cos(a), 270 + bob + 78 * r * Math.sin(a) + (Math.cos(a) < -0.3 ? 26 * Math.sin(a) ** 2 : 0)]); }
  p.poly(pts, body, 8);
  for (let i = 0; i < 14; i++) { const x = 100 + i * 13, y = 240 + bob + 24 * Math.sin(i * 1.7); p.stroke([[x, y], [x - 16, y + 40]], 4, mul(body, [0.7, 0.68, 0.74])); }
  for (let i = 0; i < 6; i++) p.stroke([[86 + i * 8, 300 + bob], [72 + i * 7, 352 + bob]], 5, dark); // tail fringe
  // neck + head: long blue-grey neck rising from the front of the body, a little forward when running
  const lean = run ? 34 : 0, nb: P2 = [278, 236 + bob], nm: P2 = [300 + lean * 0.5, 130 + bob], nh: P2 = [296 + lean, 66 + bob];
  p.line([nb, nm, nh], skin, 28, true);
  for (let i = 0; i < 6; i++) p.stroke([[nb[0] - 8 + i * 4, nb[1] - i * 22], [nb[0] - 16 + i * 4, nb[1] - i * 22 - 10]], 3, mul(body, [0.8, 0.8, 0.86]));
  const [hx, hy] = nh;
  p.ell(hx + 6, hy, 30, 24, mul(skin, [0.92, 0.92, 0.96]), 7);
  p.poly([[hx + 30, hy - 4], [hx + 66, hy + 4], [hx + 30, hy + 12]], "#4a4248", 5); // beak
  const ex = hx + 14, ey = hy - 6;
  if (eye === "wink") p.arc(ex, ey + 3, 9, 6, 200, 340, 5);
  else {
    const r = eye === "shock" ? 12 : 9;
    p.ell(ex, ey, r, r, "#e8902a", 4);
    p.dot(ex + 2, ey, eye === "shock" ? 3 : 4.5);
    if (eye === "smug") p.poly([[ex - r - 2, ey - r - 2], [ex + r + 2, ey - r - 2], [ex + r + 2, ey - 1], [ex - r - 2, ey - 1]], mul(skin, [0.92, 0.92, 0.96]), 0), p.stroke([[ex - r - 1, ey - 1], [ex + r + 1, ey - 1]], 4);
  }
  if (hat) {
    p.ell(hx + 4, hy - 22, 40, 8, "#8a7a50", 5);
    p.poly([[hx - 14, hy - 22], [hx - 10, hy - 50], [hx + 18, hy - 50], [hx + 22, hy - 22]], "#9a8a5c", 5);
    p.poly([[hx - 36, hy - 22], [hx - 34, hy - 54], [hx - 16, hy - 46], [hx - 14, hy - 22]], "#9a8a5c", 4);
  }
  if (medal) {
    p.poly([[nb[0] - 6, nb[1] - 4], [nb[0] + 10, nb[1] - 4], [nb[0] + 8, nb[1] + 26], [nb[0] - 4, nb[1] + 26]], "#c8303a", 3);
    p.ell(nb[0] + 2, nb[1] + 38, 14, 14, "#e2b84a", 4); p.dot(nb[0] - 2, nb[1] + 34, 3, "rgba(255,255,255,0.7)");
  }
  g.restore();
};

/** the Commonwealth coat of arms as a simple gilt crest (no words), 480 x 400 canvas: a shield with a star above, a
 *  kangaroo on the left and an emu on the right holding it up. wink = the emu winks (the last shot) */
export const fxCrest = (p: Pen, wink = false) => {
  // wattle sprays at the bottom
  for (let i = 0; i < 14; i++) p.ell(110 + i * 20, 372 + 8 * Math.sin(i), 10, 10, "#f2c83a", 3);
  p.stroke([[100, 380], [380, 380]], 6, "#5a7a3a");
  // the shield
  const sh: P2[] = [[160, 120], [320, 120], [320, 250], [240, 330], [160, 250]];
  p.poly(sh, "#e2b84a", 8);
  for (const [x, y] of [[200, 160], [280, 160], [200, 225], [280, 225]]) p.ell(x, y, 22, 18, ["#c8303a", "#2f5a9a", "#2f5a9a", "#c8303a"][((x > 240 ? 1 : 0) + (y > 200 ? 2 : 0))], 4);
  // the seven-point star above
  const st: P2[] = [];
  for (let k = 0; k < 14; k++) { const r = k % 2 ? 14 : 34, a = rad(-90 + k * (360 / 14)); st.push([240 + r * Math.cos(a), 74 + r * Math.sin(a)]); }
  p.poly(st, "#f2d06a", 5);
  // kangaroo (left), facing right, sitting up on its tail
  p.ell(110, 250, 42, 70, "#b07a4a", 6);
  p.poly([[80, 300], [30, 370], [70, 368], [100, 320]], "#b07a4a", 5); // tail
  p.ell(126, 160, 24, 28, "#b07a4a", 6); p.poly([[118, 136], [112, 104], [128, 130]], "#b07a4a", 4); p.poly([[132, 134], [138, 104], [142, 132]], "#b07a4a", 4);
  p.dot(136, 156, 4); p.stroke([[146, 220], [168, 200]], 8, "#b07a4a");
  // emu (right), facing left
  p.ell(370, 270, 56, 44, "#6a5a4c", 6);
  p.line([[340, 240], [334, 180], [342, 130]], "#8aa0b8", 18, true);
  p.ell(338, 122, 20, 16, "#8aa0b8", 5); p.poly([[322, 118], [296, 124], [322, 130]], "#4a4248", 4);
  if (wink) p.arc(334, 118, 7, 5, 200, 340, 4); else { p.ell(334, 117, 6, 6, "#e8902a", 3); p.dot(333, 117, 3); }
  p.stroke([[322, 236], [312, 214]], 8, "#7a6a5a");
  for (const x of [356, 386]) p.line([[x, 306], [x - 4, 372]], "#7a6a5a", 9, true);
  p.ell(230, 136, 70, 18, "rgba(255,240,200,0.25)", 0);
};
/** a thought bubble with an emu in it wearing a medal, 400 x 400 canvas */
export const fxMedalBubble = (p: Pen) => {
  p.ell(70, 360, 14, 12, "#ffffff", 6); p.ell(110, 318, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([230 + (150 + 10 * Math.sin(a * 9)) * Math.cos(a), 170 + (125 + 10 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  const g = p.g; g.save(); g.translate(150, 62); g.scale(0.44, 0.44); fxEmu(p, 3, 1, "smug", false, true); g.restore();
};
/** an olive army ammunition box (front view), 220 x 150 canvas; empty = lid open */
export const fxAmmo = (p: Pen, empty = false) => {
  p.poly([[14, 40], [206, 40], [206, 140], [14, 140]], "#5a6a3a", 7);
  p.poly([[10, 26], [210, 26], [210, 44], [10, 44]], empty ? "#4a5a30" : "#6a7a46", 6);
  p.poly([[90, 70], [130, 70], [130, 84], [90, 84]], "#2e3420", 3); // handle
  p.stroke([[30, 110], [190, 110]], 5, "#3e4a28");
  p.ell(50, 60, 10, 18, "rgba(255,255,255,0.15)", 0);
};
/** one grey-brown emu feather, 120 x 240 canvas */
export const fxFeather = (p: Pen) => {
  p.stroke([[60, 230], [62, 20]], 5, "#4a4038");
  for (let i = 0; i < 14; i++) { const y = 30 + i * 14; for (const s of [-1, 1]) p.stroke([[61, y], [61 + s * (34 - Math.abs(i - 7) * 2), y + 22]], 4, i % 2 ? "#6a5a4c" : "#7e6e5e"); }
};
/** a bounty claim form: a blank paper with ruled lines and a stamp (nothing readable), 200 x 260 canvas */
export const fxClaim = (p: Pen, seed = 0) => {
  p.poly([[16, 12], [184, 16], [180, 248], [12, 244]], "#f2ead6", 5);
  for (let i = 0; i < 7; i++) p.stroke([[34, 50 + i * 24], [150 - ((i + seed) % 3) * 24, 52 + i * 24]], 4, "#8a7a6a");
  p.ell(140, 210, 26, 22, null, 5); p.ell(140, 210, 26, 22, "rgba(200,60,60,0.35)", 0);
};
