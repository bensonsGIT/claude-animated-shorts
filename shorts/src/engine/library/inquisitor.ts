// Cast + effects first drawn for The Grand Inquisitor short (Dostoevsky, The Brothers Karamazov, 1880; Garnett 1912).
// Ivan and Alyosha in the Metropolis tavern (1860s); the poem's Seville (16th century). The Prisoner is drawn plainly and
// gently, never as a gag; the Devil is only a silhouette; the suffering of children is never shown.
import { Pen } from "../toon";
import type { Outfit } from "../toon";

/** Ivan Karamazov, 23: dark hair, pale, a black frock coat, white stock */
export const IVAN: Outfit = { jacket: "#1c1c24", pants: "#26262e", boots: "#0e0e12", hat: "hair", hair: "#2a2018", skin: "#f0d4bc", stock: "#f4f0e6", buttons: "#3a3a44" };
/** Alyosha, 20, a novice: "red-cheeked, clear-eyed"; black cassock, a small wooden cross */
export const ALYOSHA: Outfit = { jacket: "#16161c", dress: "#16161c", pants: "#16161c", boots: "#0e0e12", hat: "hair", hair: "#8a6a44", skin: "#f8d2bc", belt: "#3a3030" };
/** the Grand Inquisitor, almost ninety: tall, withered, white hair, a coarse old monk's cassock (ch. 5) */
export const INQUISITOR: Outfit = { jacket: "#3a2e2a", dress: "#3a2e2a", pants: "#3a2e2a", boots: "#1e1a1a", hat: "hair", hair: "#ece8e2", skin: "#e2cdb4", belt: "#5a4a3a" };
/** the Prisoner: no description in the text; a plain cream robe, a brown mantle, long brown hair, a short beard */
export const PRISONER: Outfit = { jacket: "#efe6d2", dress: "#efe6d2", pants: "#efe6d2", boots: "#8a6a4a", hat: "hair", long: true, hair: "#5a3a22", skin: "#efcfae", beard: "#5a3a22", beardStyle: "short", sash: "#8a5a3a" };
/** the holy guard: steel caps, red tabards (no blades are ever drawn) */
export const GUARD: Outfit = { jacket: "#a02a2a", pants: "#3a3030", boots: "#1e1a1a", hat: "cap", cap: "#9a9aa8", skin: "#e6c09a", moustache: "#3a2a1e", belt: "#2a2020", buttons: "#d8b04a" };
/** Seville townsfolk, 16th century */
export const TOWNS = (v = 0): Outfit => {
  const j = ["#7a3a3a", "#3a4a6a", "#6a5a3a", "#2a2a30", "#8a6a4a", "#4a6a5a"][v % 6], s = ["#e6b890", "#d8a878", "#f0c8a0", "#c89868"][v % 4];
  return v % 2
    ? { jacket: j, dress: j, pants: j, boots: "#2a2020", hat: "bonnet", cap: "#1a1a22", hair: "#2a1e18", skin: s }
    : { jacket: j, pants: "#3a3030", boots: "#2a2020", hat: "cap", cap: ["#3a2a20", "#5a4632", "#2a2a30"][v % 3], skin: s, moustache: v % 4 ? undefined : "#3a2a1e", belt: "#2a1e18" };
};

// ---------------- effects ----------------
/** the "ticket": a pale admission card with a perforated stub (no lettering) */
export const fxTicket = (p: Pen) => {
  p.poly([[20, 60], [180, 60], [180, 140], [20, 140]], "#f2e8c8", 7);
  p.stroke([[140, 64], [140, 136]], 3, "rgba(90,70,40,0.6)");
  for (let y = 70; y < 136; y += 10) p.dot(140, y, 2.5, "#f2e8c8");
  p.poly([[40, 84], [120, 84], [120, 116], [40, 116]], null, 4);
  p.ell(160, 100, 10, 14, null, 4);
};
/** an open, pale hand from below (giving / receiving) */
export const fxOpenHand = (p: Pen) => {
  const sk = "#f0d4bc";
  p.poly([[60, 190], [70, 120], [140, 120], [150, 190]], "#1c1c24", 7);
  p.poly([[50, 120], [160, 120], [170, 90], [40, 90]], sk, 8);
  for (const x of [52, 82, 112, 142]) p.line([[x + 4, 94], [x + 2, 60]], sk, 16);
  p.line([[160, 110], [186, 86]], sk, 16);
};
/** a single tear */
export const fxTearLarge = (p: Pen) => { p.poly([[100, 20], [150, 110], [134, 160], [66, 160], [50, 110]], "#9ad0f4", 8); p.dot(84, 104, 12, "rgba(255,255,255,0.85)"); };
/** the Devil in the wilderness: only a tall dark silhouette with two gleams for eyes */
export const fxDevil = (p: Pen) => {
  const g = p.g, c = "rgba(14,8,20,0.92)";
  g.fillStyle = c;
  g.beginPath(); g.ellipse(100, 70, 34, 40, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(66, 100); g.lineTo(134, 100); g.lineTo(168, 400); g.lineTo(32, 400); g.closePath(); g.fill();
  g.lineCap = "round"; g.strokeStyle = c; g.lineWidth = 20; g.beginPath(); g.moveTo(128, 130); g.lineTo(186, 170); g.stroke();
  g.fillStyle = "#ffb040"; g.beginPath(); g.ellipse(88, 66, 6, 3, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(112, 66, 6, 3, 0, 0, Math.PI * 2); g.fill();
};
const bubble = (p: Pen) => {
  for (const [x, y, r] of [[30, 180, 10], [52, 156, 15]] as const) p.ell(x, y, r, r, "#fbfaf4", 6);
  p.ell(122, 82, 74, 64, "#fbfaf4", 8);
  for (const [x, y, r] of [[70, 50, 30], [130, 32, 34], [178, 70, 26], [160, 126, 30], [84, 126, 28]] as const) p.ell(x, y, r, r, "#fbfaf4", 0);
  p.ell(122, 82, 74, 64, null, 8);
};
/** offer bubbles: 0 bread, 1 a falling star (the miracle), 2 a crown (power), 3 a bread queue, 4 a gilt smiling mask (the lie), 5 fire */
export const fxOffer = (p: Pen, k: number) => {
  bubble(p);
  if (k === 0) { for (const [x, y] of [[100, 92], [140, 96], [120, 70]] as const) { p.ell(x, y, 26, 16, "#d8a058", 5); p.arc(x, y - 2, 18, 8, 200, 340, 3, "#f0c888"); } }
  if (k === 1) { const s: [number, number][] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 14 : 32; s.push([140 + r * Math.cos(a), 70 + r * Math.sin(a)]); } p.poly(s, "#ffd84a", 5); for (let i = 0; i < 3; i++) p.stroke([[118 - i * 14, 92 + i * 12], [92 - i * 14, 116 + i * 12]], 5, "rgba(255,216,74,0.6)"); }
  if (k === 2) { p.poly([[78, 110], [78, 70], [98, 88], [122, 60], [146, 88], [166, 70], [166, 110]], "#e8c04a", 6); for (const x of [98, 122, 146]) p.dot(x, 100, 6, "#c83a4a"); }
  if (k === 3) { for (let i = 0; i < 6; i++) { p.dot(64 + i * 22, 74 - (i % 2) * 2, 9, "#3a3040"); p.poly([[56 + i * 22, 84], [72 + i * 22, 84], [74 + i * 22, 118], [54 + i * 22, 118]], ["#7a3a3a", "#3a4a6a", "#6a5a3a"][i % 3], 3); } p.ell(186, 96, 16, 11, "#d8a058", 4); }
  if (k === 4) { p.ell(122, 84, 38, 44, "#e8c04a", 6); for (const x of [108, 136]) p.ell(x, 76, 9, 6, "#3a2a10", 0); p.arc(122, 94, 18, 12, 20, 160, 5, "#3a2a10"); p.stroke([[160, 80], [186, 70]], 3, "#8a6a2a"); }
  if (k === 5) { for (const [x, h, c] of [[96, 50, "#f08030"], [122, 66, "#f8b040"], [148, 46, "#e85a2a"]] as const) p.poly([[x - 18, 120], [x, 120 - h], [x + 18, 120]], c, 5); }
};
/** a red tick mark (the "correction") */
export const fxTick = (p: Pen) => { p.band([[40, 110], [86, 156], [170, 44]], "#c82a2a", 22, 6, "round"); };
/** a warm round glow for the kisses */
export const fxGlow = (p: Pen, k = 1) => {
  const g = p.g, gr = g.createRadialGradient(100, 100, 4, 100, 100, 96);
  gr.addColorStop(0, `rgba(255,236,190,${0.9 * k})`); gr.addColorStop(0.5, `rgba(255,190,120,${0.4 * k})`); gr.addColorStop(1, "rgba(255,160,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 200, 200);
};
/** the girl of seven in her small open white coffin (the miracle), k 0 lying .. 1 sitting up */
export const fxCoffin = (p: Pen, k = 0) => {
  p.poly([[20, 120], [180, 120], [168, 170], [32, 170]], "#f6f4ee", 7);
  const y = 112 - 46 * k;
  p.ell(100, y, 22, 24, "#f6d8c4", 6);
  p.ell(100, y - 14, 24, 12, "#7a4a2a", 0);
  if (k > 0.5) { p.arc(100, y + 6, 8, 5, 20, 160, 3); for (const x of [92, 108]) p.dot(x, y - 2, 3); }
  else for (const x of [92, 108]) p.stroke([[x - 4, y - 2], [x + 4, y - 2]], 3);
  p.poly([[70, y + 18], [130, y + 18], [134, 124], [66, 124]], "#fbfaf6", 6);
};
