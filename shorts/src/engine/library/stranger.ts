// Cast + effects first drawn for The Stranger (Camus, 1942) short: Algiers, 1930s-40s. Any short can import them.
// Looks follow the novel's own few descriptions, never a film adaptation.
import { Pen, SKINS } from "../toon";
import type { Outfit } from "../toon";

/** Meursault, the clerk: slim, sun-tanned, short dark hair, white shirt, grey trousers */
export const CLERK: Outfit = { jacket: "#f4f2ec", pants: "#6a6e78", boots: "#3a2a24", hat: "hair", hair: "#2a1e1a", skin: "#e8bc90" };
/** at the vigil: the borrowed black tie */
export const CLERK_TIE: Outfit = { ...CLERK, tie: "#1a1a20" };
/** Marie Cardona: tanned, dark curly hair, the red-and-white dress (drawn red with a white top) */
export const MARIE: Outfit = { jacket: "#f6eee6", dress: "#d8443c", pants: "#3a2a24", boots: "#c8443c", hat: "curls", hair: "#3a2418", skin: "#e8bc90" };
/** Raymond: short, broad-shouldered, a boxer's nose, always well dressed; dark suit, loud tie, white shoes */
export const RAYMOND: Outfit = { jacket: "#2e3448", pants: "#2e3448", boots: "#f2efe6", hat: "hair", hair: "#141014", tie: "#e0a030", build: "stout", skin: "#f0caa0" };
/** the man on the beach (unnamed in the book) and his friend: blue work overalls, plain and dignified */
export const ARAB = (v = 0): Outfit => ({ jacket: v ? "#4a6aa8" : "#3a5a9a", pants: v ? "#4a6aa8" : "#3a5a9a", boots: "#3a2a24", hat: "hair", hair: "#141014",
  skin: v ? "#b98a62" : "#c08e66", stubble: true });
/** the caretaker of the home: grey work coat, cap, white moustache */
export const CARETAKER: Outfit = { jacket: "#7a7a80", pants: "#4a4a52", boots: "#2a2024", hat: "cap", cap: "#4a4a50", moustache: "#e8e4dc", skin: "#f5d0b0" };
/** the prosecutor: black robe, white jabot, slicked grey hair */
export const PROSECUTOR: Outfit = { jacket: "#16161c", dress: "#16161c", pants: "#16161c", boots: "#16161c", hat: "hair", hair: "#8a8a92", stock: "#f6f4ee", skin: "#f5d6b8" };
/** the presiding judge in red */
export const JUDGE: Outfit = { jacket: "#a8242a", dress: "#a8242a", pants: "#2a2228", boots: "#2a2228", hat: "hair", hair: "#e8e4dc", stock: "#f6f4ee", skin: "#f5d6b8", build: "stout" };
/** the chaplain: young, pale, round specs, black cassock */
export const CHAPLAIN: Outfit = { jacket: "#16161c", dress: "#16161c", pants: "#16161c", boots: "#16161c", hat: "hair", hair: "#b8844a", specs: true, skin: "#fbe2c8" };
/** the mother's old friends at the vigil: black clothes, white hair; women in black bonnets */
export const OLDFRIEND = (v = 0): Outfit => v % 2
  ? { jacket: "#26262c", dress: "#26262c", pants: "#26262c", boots: "#1a1a1e", hat: "bonnet", skin: "#f5d6c0", cap: "#1a1a20" }
  : { jacket: "#2e2e36", pants: "#2e2e36", boots: "#1a1a1e", hat: "hair", hair: "#ecebe6", moustache: v % 4 === 0 ? "#ecebe6" : undefined, skin: SKINS[v % 3] };
/** jurors: light summer suits, varied hair and moustaches */
export const JUROR = (v = 0): Outfit => ({ jacket: ["#d8cfb8", "#c8c0aa", "#b8b4a8", "#d0c4a0", "#a8b0b8", "#c8b89a"][v % 6], pants: "#5a5a60", boots: "#3a2a24",
  hat: "hair", hair: ["#2a1e1a", "#8a8a90", "#5a3a24", "#e8e4dc", "#141014", "#7a5232"][v % 6], moustache: v % 3 === 1 ? "#3a2a20" : undefined, skin: SKINS[v % 4] });
/** the imagined crowd: mixed townsfolk of the period */
export const CROWD = (v = 0): Outfit => {
  const o: Outfit = { jacket: ["#5a6a8a", "#8a5a3a", "#6a6a6a", "#3a4a6a", "#7a3a3a", "#4a6a5a", "#a89a7a"][v % 7], pants: "#3a3a40", boots: "#2a2024",
    hat: v % 3 === 0 ? "cap" : "hair", cap: "#3a3440", hair: ["#2a1e1a", "#141014", "#5a3a24", "#8a8a90"][v % 4], moustache: v % 5 === 1 ? "#2a201a" : undefined, skin: SKINS[v % 4] };
  return v % 4 === 3 ? { ...o, hat: "curls", dress: ["#3a5a9a", "#7a3a5a", "#5a7a4a"][v % 3], moustache: undefined, hair: "#3a2418" } : o;
};

/** a small pink heart (Marie's) that can pop: k 0 whole .. 1 burst into bits */
export const fxHeart = (p: Pen, k = 0) => {
  if (k <= 0) {
    p.poly([[100, 170], [30, 100], [28, 60], [55, 35], [100, 60], [145, 35], [172, 60], [170, 100]], "#ff6a8a", 8);
    p.dot(62, 68, 9, "rgba(255,255,255,0.7)");
    return;
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, r = 30 + 60 * k;
    p.dot(100 + Math.cos(a) * r, 100 + Math.sin(a) * r, 12 * (1 - k) + 2, "#ff6a8a");
  }
};
/** the white star-glint off a blade */
export const fxShine = (p: Pen, k = 0) => {
  const r = 90 * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, k)));
  p.poly([[100, 100 - r], [112, 88], [100 + r, 100], [112, 112], [100, 100 + r], [88, 112], [100 - r, 100], [88, 88]], "#ffffff", 0);
  p.dot(100, 100, 18, "#fffbe8");
};
/** a gull in flight, wings up (k 0) or down (k 1) */
export const fxGull = (p: Pen, k = 0) => {
  const y = 100 + (k - 0.5) * 50;
  p.stroke([[20, y], [70, 100], [100, 110], [130, 100], [180, y]], 10, "#f4f4f6");
  p.stroke([[20, y], [70, 100], [100, 110], [130, 100], [180, y]], 3);
};
/** a strip of film (the comedy, over the prosecutor's head) */
export const fxFilm = (p: Pen) => {
  p.poly([[20, 60], [180, 60], [180, 140], [20, 140]], "#2a2a30", 6);
  for (let x = 30; x < 180; x += 22) { p.poly([[x, 66], [x + 10, 66], [x + 10, 76], [x, 76]], "#f4f2ec", 0); p.poly([[x, 124], [x + 10, 124], [x + 10, 134], [x, 134]], "#f4f2ec", 0); }
  for (const x of [34, 86, 138]) p.poly([[x, 82], [x + 40, 82], [x + 40, 118], [x, 118]], "#c8d8e8", 3);
};
/** a coffee cup (icon over the prosecutor's head) */
export const fxCup = (p: Pen) => {
  p.poly([[50, 70], [150, 70], [140, 160], [60, 160]], "#f6f3ea", 8);
  p.arc(152, 112, 22, 26, -90, 90, 8);
  p.ell(100, 70, 50, 10, "#6a3a1e", 6);
  for (const dx of [-18, 18]) p.stroke([[100 + dx, 50], [110 + dx, 32], [100 + dx, 12]], 6, "#d8d8e0");
};
/** a cigarette (icon) */
export const fxCig = (p: Pen) => {
  p.band([[30, 120], [160, 80]], "#f6f3ea", 18, 6);
  p.band([[30, 120], [60, 111]], "#d8a060", 18, 6);
  p.dot(163, 79, 9, "#ff7a3a");
  p.stroke([[168, 70], [180, 45], [165, 20]], 5, "#c8c8d0");
};
/** a telegram slip */
export const fxTelegram = (p: Pen) => {
  p.poly([[20, 40], [180, 30], [184, 150], [24, 160]], "#f2e6c4", 6);
  p.poly([[34, 50], [166, 42], [168, 62], [36, 70]], "#e0c060", 0);
  for (let i = 0; i < 4; i++) p.stroke([[40, 90 + i * 16], [150 - (i % 2) * 30, 86 + i * 16]], 4, "#5a4636");
};
/** a tear drop */
export const fxTear = (p: Pen) => { p.poly([[50, 10], [80, 60], [70, 88], [30, 88], [20, 60]], "#8ec8f0", 5); p.dot(42, 55, 6, "rgba(255,255,255,0.8)"); };
/** a little star (cell window, the calm) */
export const fxTwinkle = (p: Pen, k = 0) => {
  const r = 40 + 50 * k;
  p.poly([[100, 100 - r], [110, 90], [100 + r, 100], [110, 110], [100, 100 + r], [90, 110], [100 - r, 100], [90, 90]], "#fff6c8", 0);
};
