// Cast + effects first drawn for the Tycho Brahe short: Renaissance Denmark (1566) / the Prague court (1601). Any short can import them.

import { Pen, SH_SKIN, SKIN, SKINS, WHITE, mix, mul, shade } from "../toon";
import type { Outfit, P2 } from "../toon";


// Renaissance Denmark (1566) / Prague court (1601): doublet + hose, white ruff, rapier at the hip
export const RUFF = "#f6f1e6";
export const TYCHO_YOUNG: Outfit = { jacket: "#2c2a3a", pants: "#3a2f36", boots: "#3a2a20", hat: "hair", hair: "#c8743a", moustache: "#b9652e",
  ruff: RUFF, buttons: "#e1b84c", sword: true, skin: "#ffdcbc" };
export const MANDERUP: Outfit = { jacket: "#8a2a3a", pants: "#3b2b2e", boots: "#3a2a20", hat: "hair", hair: "#3a2a22", moustache: "#2e221c",
  ruff: RUFF, buttons: "#e1b84c", sword: true, skin: "#f5c9a0" };
export const BRASS = "#c9a24a";
// portraits show him balding with a big drooping moustache
export const TYCHO_OLD: Outfit = { ...TYCHO_YOUNG, jacket: "#26242f", hat: null, moustache: "#a8703f", build: "stout", nose: BRASS, sword: false };
export const noble = (v = 0): Outfit => {
  const coats = ["#2f5a3c", "#2c3a6b", "#7a2836", "#5a3a6a", "#8a5a2a", "#26303a"];
  const hairs = ["#3a2a20", "#7a4a2a", "#c8a060", "#1e1a1a", "#9a5a30"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#33282e", boots: "#3a2a20", hat: "hair", hair: hairs[v % 5], ruff: RUFF, buttons: "#d9b04a", skin: SKINS[v % 4] };
  if (v % 4 === 2) return { ...o, hat: "bonnet", dress: ["#8a2a4a", "#2a5a7a", "#7a6a2a"][v % 3] };
  return v % 3 === 1 ? { ...o, moustache: shade(o.hair!, 0.8) } : o;
};

/** Prague court, 1601: brighter silks, gold chains for some */
export const courtier = (v = 0): Outfit => {
  const coats = ["#2f6a8a", "#7a3a8a", "#3a7a4a", "#a8742a", "#8a2a4a", "#3a3a7a"];
  const hairs = ["#3a2a20", "#7a4a2a", "#c8a060", "#1e1a1a", "#9a5a30", "#b8b0a8"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#2e2a34", boots: "#3a2a20", hat: "hair", hair: hairs[v % 6], ruff: RUFF, buttons: "#e1b84c", skin: SKINS[(v + 1) % 4] };
  if (v % 4 === 1) return { ...o, hat: "bonnet", dress: ["#c25a7a", "#5a8fc2", "#d9a441"][v % 3] };
  return { ...o, moustache: v % 2 ? shade(o.hair!, 0.75) : undefined, sash: v % 3 === 0 ? "#d9b04c" : undefined };
};
/** 2010 forensic scientists: white lab coats over everyday clothes */
export const scientist = (v = 0): Outfit => ({
  jacket: "#f2f4f6", pants: ["#3a4a6a", "#4a4a52", "#2f3a4a"][v % 3], boots: "#2a2a30", hat: "hair",
  hair: ["#3a2a20", "#c8a060", "#1e1a1a", "#7a4a2a"][v % 4], buttons: "#c8ccd4", skin: SKINS[(v + 2) % 4],
});
/** the host at the head of the table */
export const HOST: Outfit = { jacket: "#1e3a5a", pants: "#2a2630", boots: "#3a2a20", hat: "hair", hair: "#5a3a26", moustache: "#4a2e1e", ruff: RUFF,
  buttons: "#e1b84c", sash: "#d9b04c", build: "stout", skin: "#f5c9a0" };

/** a flying cartoon nose (skin bean, plum ink, soft crescent) on a 200 x 200 canvas */
export const fxNose = (p: Pen, col = SKIN) => {
  p.ell(100, 104, 52, 66, col, 9, 0, 360, -18);
  p.ell(82, 82, 14, 22, mix(col, WHITE, 0.55), 0, 0, 360, -18);
  p.ell(118, 140, 22, 12, mul(col, SH_SKIN), 0, 0, 360, -18);
};

/** candle / torch flame on a 128 x 256 canvas: white-hot core, amber body, flickering lean s in -1..1 */
export const fxFlame = (p: Pen, s = 0) => {
  const lean = 10 * s, g = p.g;
  const glow = g.createRadialGradient(64, 170, 4, 64, 160, 64);
  glow.addColorStop(0, "rgba(255,190,90,0.55)"); glow.addColorStop(1, "rgba(255,150,60,0)");
  g.fillStyle = glow; g.fillRect(0, 60, 128, 196);
  const body: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2, r = 1 - 0.55 * Math.max(0, -Math.sin(a));
    body.push([64 + 30 * r * Math.cos(a) + lean * Math.max(0, -Math.sin(a)) ** 2, 180 + 70 * Math.sin(a) * (Math.sin(a) < 0 ? 1.6 : 0.6)]);
  }
  p.poly(body, "#ffb24a", 0);
  p.ell(64 + lean * 0.3, 190, 15, 30, "#fff2c8", 0);
};

/** cartoon skull on a 400 x 400 canvas; stain = the green copper-salt ring round the nasal opening */
export const fxSkull = (p: Pen, stain = false) => {
  const bone = "#efe6cf", hole = "#3a2a30";
  p.poly([[118, 228], [282, 228], [262, 336], [138, 336]], bone, 10);
  p.ell(200, 168, 142, 132, bone, 10);
  p.ell(150, 205, 40, 44, hole, 0); p.ell(250, 205, 40, 44, hole, 0);
  if (stain) {
    p.ell(200, 262, 56, 40, "rgba(78,168,96,0.62)", 0);
    p.ell(168, 248, 18, 14, "rgba(60,150,80,0.55)", 0); p.ell(236, 276, 16, 12, "rgba(60,150,80,0.55)", 0);
  }
  p.poly([[200, 238], [180, 282], [220, 282]], hole, 0);
  for (let i = 0; i < 6; i++) p.stroke([[150 + i * 20, 300], [150 + i * 20, 328]], 6);
  p.stroke([[136, 300], [264, 300]], 6);
  p.stroke([[250, 70], [232, 104], [252, 124], [238, 150]], 5);
};
