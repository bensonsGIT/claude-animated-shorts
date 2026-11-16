// Cast + effects first drawn for The Great Gatsby short (Long Island, summer 1922). Any short can import them.
// Looks follow the novel, not the films: Gatsby tanned with short fair hair (ch. 5) and the pink suit (ch. 7); Daisy
// small with DARK hair (ch. 5) in white (ch. 1); Tom big and straw-haired in riding clothes (ch. 1); Wilson pale, blond,
// dusted with ash (ch. 2); Owl Eyes stout with huge spectacles (ch. 3).
import { Pen, mul, rad, rnd, INK } from "../toon";
import type { Outfit, P2 } from "../toon";

const TAN = "#f0c8a0", FAIR = "#ffe0c4";
export const GATSBY_HAIR = "#c9a462";
/** Jay Gatsby, ~32: the pink suit (ch. 7), short neat dark-blond hair, tanned */
export const GATSBY: Outfit = { jacket: "#e9a3ad", pants: "#e29aa5", boots: "#f2ece2", hat: "hair", hair: GATSBY_HAIR, skin: TAN, buttons: "#f6efe6", band: "#f8f4ec" };
/** at the tea (ch. 5): white flannel suit (and a gold tie, the band) */
export const GATSBY_WHITE: Outfit = { ...GATSBY, jacket: "#f3efe6", pants: "#ece6da", boots: "#d8cfc0", buttons: "#d9b04a", band: "#e0b448" };
/** the young officer, 1917: olive tunic, Sam Browne belt, peaked service cap */
export const GATSBY_OFFICER: Outfit = { jacket: "#7c7a4c", pants: "#6c6a44", boots: "#4a3020", hat: "peaked", cap: "#8a8458", belt: "#6a3e22", buttons: "#d9b04a", skin: TAN };
const DAISY_HAIR = "#2e2226";
/** Daisy Buchanan: white dress, dark bob */
export const DAISY: Outfit = { jacket: "#fbf8f1", dress: "#fbf8f1", pants: "#f2dcc8", boots: "#e8e0d4", hat: "bob", hair: DAISY_HAIR, skin: FAIR, buttons: "#f2e6c8" };
/** out in the rain / in the car: a lavender cloche (ch. 5 has a lavender hat) */
export const DAISY_CLOCHE: Outfit = { ...DAISY, hat: "cloche", cap: "#b9a3cf", dress: "#f1ecf6", jacket: "#f1ecf6" };
/** the 1919 wedding: veil */
export const DAISY_BRIDE: Outfit = { ...DAISY, hat: "veil", cap: "#fdfbf6" };
/** Tom Buchanan: big, straw-blond, riding clothes */
export const TOM: Outfit = { jacket: "#a8825a", pants: "#d9c8a0", boots: "#3a2418", hat: "hair", hair: "#e6cf86", skin: "#f5cfb0", build: "stout", buttons: "#5a3a22", belt: "#4a2e1c" };
/** Tom at the wedding / the Plaza: grey three-piece suit */
export const TOM_SUIT: Outfit = { ...TOM, jacket: "#6e7078", pants: "#5e6068", boots: "#1e1a1e", band: "#f4f1e8", buttons: "#c8ccd4", belt: null };
/** Nick Carraway: plain grey suit, straw boater */
export const NICK: Outfit = { jacket: "#8c8f98", pants: "#7c7f88", boots: "#3a2a22", hat: "boater", cap: "#e6d398", hair: "#6a4a30", skin: FAIR, band: "#f4f1e8", buttons: "#c8ccd4" };
export const NICK_BARE: Outfit = { ...NICK, hat: "hair" };
/** Myrtle Wilson: "faintly stout", dark hair, a dark-blue dress */
export const MYRTLE: Outfit = { jacket: "#2e3c80", dress: "#2e3c80", pants: "#d8b8a0", boots: "#2a2024", hat: "bob", hair: "#2a1e1e", skin: "#f5d0b0", build: "stout" };
/** George Wilson: thin, pale, blond, dark suit dusted with ash */
export const WILSON: Outfit = { jacket: "#6a6a70", pants: "#5a5a62", boots: "#3a3438", hat: "hair", hair: "#e2dab2", skin: "#ead8c8", buttons: "#9a9aa0" };
/** Owl Eyes: stout, middle-aged, enormous round spectacles */
export const OWL: Outfit = { jacket: "#3a3640", pants: "#2e2a34", boots: "#1e1a1e", hat: "hair", hair: "#6a5a4a", specs: true, skin: "#f5d0b0", build: "stout", band: "#f4f1e8" };
/** Henry C. Gatz: a solemn old man in a long cheap overcoat */
export const GATZ: Outfit = { jacket: "#5e5246", dress: "#5e5246", pants: "#3a3430", boots: "#2a2024", hat: "hair", hair: "#c8c4bc", moustache: "#bab6ae", skin: "#ecc8a8", buttons: "#3a3430" };
/** the postman */
export const POSTMAN: Outfit = { jacket: "#34446a", pants: "#2a344e", boots: "#1e1a1e", hat: "peaked", cap: "#2a3656", buttons: "#c8ccd4", skin: FAIR, moustache: "#6a4a30" };
/** the minister */
export const MINISTER: Outfit = { jacket: "#1e1c24", dress: "#1e1c24", pants: "#1e1c24", boots: "#1a1a1e", hat: "hair", hair: "#9a968e", band: "#f4f1e8", skin: "#f5d0b0" };
/** party guests: flappers (beaded dresses, bobs and cloches) and men in dinner jackets */
export const GUEST = (v = 0): Outfit => {
  const skin = ["#ffe0c4", "#f5d0b0", "#efc6a0", "#c99067", "#f5c9a0"][v % 5];
  if (v % 2 === 0) {
    const dress = ["#e2b33c", "#d0506e", "#3fa4a0", "#c8c4ce", "#8a5ac2", "#e47a3a"][(v >> 1) % 6];
    return { jacket: dress, dress, pants: "#e8c8b0", boots: "#2a2024", hat: v % 4 === 2 ? "cloche" : "bob", cap: ["#2a2a3a", "#c84a5a", "#e8dcc8"][v % 3],
      hair: ["#2a1e1e", "#c8a050", "#6a3a24", "#e8d8a0"][(v >> 1) % 4], skin, buttons: "#f2e6c8" };
  }
  return { jacket: "#1e1e26", pants: "#1a1a22", boots: "#141418", hat: v % 5 === 1 ? "tophat" : "hair", hair: ["#3a2a20", "#c8a050", "#1a1414", "#7a5a3a"][(v >> 1) % 4],
    band: "#f4f1e8", buttons: "#f4f1e8", moustache: v % 3 === 0 ? "#3a2a20" : undefined, skin, build: v % 3 === 1 ? "stout" : "adult" };
};

// ================= effects =================
/** a scruffy stray dog side-on (400 x 300, feet at y 290, facing right; dir -1 mirrors). leg 0-2 = trot, 3 = sitting */
export const fxDog = (p: Pen, leg = 3, dir = 1, wag = 0) => {
  const g = p.g;
  g.save();
  if (dir < 0) g.transform(-1, 0, 0, 1, 400, 0);
  const fur = "#c89a62", dark = "#8a6238", sit = leg === 3, bob = sit ? 0 : [0, -6, -2][leg];
  const legs: [P2, P2][] = sit ? [[[250, 200], [262, 288]], [[278, 200], [290, 288]]]
    : [[[130, 200], ([[100, 288], [150, 288], [126, 280]] as P2[])[leg]], [[155, 200], ([[178, 288], [120, 288], [160, 288]] as P2[])[leg]],
       [[245, 200], ([[270, 288], [228, 288], [252, 280]] as P2[])[leg]], [[268, 200], ([[240, 288], [290, 288], [262, 288]] as P2[])[leg]]];
  for (const [a, b] of legs) p.line([[a[0], a[1] + bob], b], dark, 16, true);
  if (sit) { p.ell(160, 228, 62, 54, fur, 7); p.ell(140, 278, 40, 14, dark, 6); }
  const body = sit ? [[200, 230], [140, 200], [250, 130]] as P2[] : [[120, 175 + bob], [270, 175 + bob]] as P2[];
  void body;
  if (!sit) p.ell(195, 172 + bob, 100, 44, fur, 7);
  else p.ell(225, 180, 52, 70, fur, 7, 0, 360, -20);
  // tail
  const tw = Math.sin(wag * Math.PI * 2) * 22;
  p.line([[sit ? 140 : 98, (sit ? 250 : 160) + bob], [sit ? 96 : 60, (sit ? 230 : 120) + bob + tw]], fur, 14, true);
  // head
  const hx = sit ? 268 : 300, hy = (sit ? 100 : 126) + bob;
  p.ell(hx, hy, 46, 40, fur, 7);
  p.ell(hx + 40, hy + 14, 26, 18, mul(fur, [1.05, 1.02, 0.98]), 6);
  p.dot(hx + 64, hy + 8, 9);
  p.ell(hx - 18, hy - 6, 16, 32, dark, 6, 0, 360, 20); // floppy ear
  p.dot(hx + 16, hy - 8, 6.5);
  p.arc(hx + 42, hy + 26, 12, 6, 20, 160, 4);
  g.restore();
};

/** a rumour thought bubble (460 x 400, tail at the bottom left): "spy" = black domino mask, "crown" = royal, "skull" = he killed a man */
export const fxRumour = (p: Pen, kind: "spy" | "crown" | "skull") => {
  p.ell(60, 370, 14, 12, "#ffffff", 6); p.ell(100, 330, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([240 + (175 + 11 * Math.sin(a * 9)) * Math.cos(a), 170 + (135 + 11 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  const cx = 240, cy = 170;
  if (kind === "spy") {
    p.poly([[cx - 110, cy - 30], [cx - 40, cy - 46], [cx, cy - 22], [cx + 40, cy - 46], [cx + 110, cy - 30], [cx + 96, cy + 20], [cx + 40, cy + 36], [cx, cy + 10], [cx - 40, cy + 36], [cx - 96, cy + 20]], "#22202a", 7);
    for (const s of [-1, 1]) p.ell(cx + s * 52, cy - 6, 24, 14, "#ffffff", 5);
    for (const s of [-1, 1]) p.dot(cx + s * 52 + 6, cy - 6, 7);
    p.stroke([[cx - 110, cy - 26], [cx - 150, cy - 50]], 6); p.stroke([[cx + 110, cy - 26], [cx + 150, cy - 50]], 6);
  } else if (kind === "crown") {
    p.poly([[cx - 100, cy + 50], [cx - 110, cy - 50], [cx - 55, cy - 5], [cx, cy - 75], [cx + 55, cy - 5], [cx + 110, cy - 50], [cx + 100, cy + 50]], "#f2c642", 7);
    for (const [x, c] of [[-50, "#d8283a"], [0, "#3a7ad8"], [50, "#2a9a5a"]] as const) p.ell(cx + x, cy + 22, 13, 13, c, 5);
    for (const x of [-110, 0, 110]) p.ell(cx + x, cy + (x ? -56 : -82), 11, 11, "#fff3b0", 5);
  } else {
    p.ell(cx, cy - 18, 78, 70, "#f4efe2", 7);
    p.poly([[cx - 44, cy + 30], [cx + 44, cy + 30], [cx + 36, cy + 78], [cx - 36, cy + 78]], "#f4efe2", 7);
    for (const s of [-1, 1]) p.ell(cx + s * 30, cy - 18, 20, 22, INK, 0);
    p.poly([[cx, cy + 6], [cx - 9, cy + 24], [cx + 9, cy + 24]], INK, 0);
    for (let i = -2; i <= 2; i++) p.stroke([[cx + i * 14, cy + 44], [cx + i * 14, cy + 72]], 5);
  }
};

/** a puffy red heart (200 x 200) */
export const fxHeart = (p: Pen, col = "#e8405a") => {
  const pts: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([100 + x * 5.6, 96 - y * 5.6]);
  }
  p.poly(pts, col, 8);
  p.ell(70, 68, 14, 9, "#ffffff", 0, 0, 360, -30);
};

/** a tall vase of flowers (300 x 420; Nick's cottage is full of them, ch. 5) */
export const fxFlowers = (p: Pen, seed = 0) => {
  p.poly([[110, 410], [190, 410], [205, 300], [180, 250], [120, 250], [95, 300]], ["#5a8ac2", "#d8c8a8", "#7ab08a"][seed % 3], 7);
  for (let i = 0; i < 9; i++) { const a = rad(-150 + i * 15 + 10 * rnd(seed, i)); p.stroke([[150, 252], [150 + 120 * Math.cos(a), 250 + 140 * Math.sin(a)]], 5, "#4a7a3a"); }
  for (let i = 0; i < 11; i++) {
    const a = rad(-160 + i * 14 + 8 * rnd(seed, i + 20)), r = 110 + 30 * rnd(seed, i + 40), x = 150 + r * Math.cos(a), y = 230 + r * 1.05 * Math.sin(a);
    const c = ["#f4a6b8", "#fff2b0", "#e85a6a", "#f8f4ec", "#c8a0e8"][(i + seed) % 5];
    for (let k = 0; k < 5; k++) { const b = rad(k * 72); p.ell(x + 15 * Math.cos(b), y + 15 * Math.sin(b), 13, 13, c, 4); }
    p.ell(x, y, 9, 9, "#e8b83a", 3);
  }
};

/** a pyramid of champagne coupes (420 x 460, base at y 450) */
export const fxTower = (p: Pen) => {
  const rows = [5, 4, 3, 2, 1];
  rows.forEach((n, r) => {
    const y = 430 - r * 82;
    for (let i = 0; i < n; i++) {
      const x = 210 + (i - (n - 1) / 2) * 78;
      p.stroke([[x, y], [x, y - 34]], 5, "#c8d8e0");
      p.ell(x, y + 2, 20, 6, "#d8e6ee", 4);
      p.poly([[x - 36, y - 60], [x + 36, y - 60], [x + 20, y - 36], [x - 20, y - 36]], "#f2d27a", 5);
      p.ell(x, y - 60, 36, 9, "#fff0b8", 4);
    }
  });
  for (let i = 0; i < 14; i++) p.dot(150 + rnd(3, i) * 120, 80 + rnd(4, i) * 300, 4, "#fff8d8"); // bubbles
};

/** an air mattress side-on, red and white stripes (600 x 160) */
export const fxMattress = (p: Pen) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([300 + 285 * Math.cos(a), 90 + 52 * Math.sin(a) * (Math.abs(Math.cos(a)) > 0.9 ? 1 : 0.92)]); }
  p.poly(pts, "#f4efe6", 8);
  p.g.fillStyle = "#d8404a";
  p.clip(pts, () => { for (let i = 1; i < 8; i += 2) p.g.fillRect(15 + i * 71, 30, 71, 130); });
  p.poly(pts, null, 8);
  p.ell(300, 70, 230, 10, "#ffffff", 0);
};

/** a fallen leaf (120 x 120) */
export const fxLeaf = (p: Pen, col = "#d8642a") => {
  p.poly([[60, 10], [92, 40], [100, 74], [64, 110], [26, 76], [26, 40]], col, 5);
  p.stroke([[60, 18], [62, 108]], 3, mul(col, [0.6, 0.5, 0.5]));
};

/** a man's shadow on a wall, arm raised straight out with a pistol (500 x 900): no gun close-up, just the shape */
export const fxGunShadow = (p: Pen, col = "#2a2240") => {
  const g = p.g;
  g.fillStyle = col;
  g.beginPath(); g.ellipse(170, 150, 62, 70, 0, 0, Math.PI * 2); g.fill(); // head
  g.beginPath(); g.moveTo(120, 220); g.lineTo(225, 220); g.lineTo(250, 560); g.lineTo(225, 890); g.lineTo(178, 890); g.lineTo(172, 600); g.lineTo(150, 890);
  g.lineTo(104, 890); g.lineTo(96, 560); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(200, 250); g.lineTo(440, 300); g.lineTo(440, 336); g.lineTo(196, 316); g.closePath(); g.fill(); // arm
  g.fillRect(430, 280, 66, 26); g.fillRect(440, 300, 20, 46); // pistol
};

/** Dr. T. J. Eckleburg's billboard (ch. 2): blue eyes behind enormous yellow spectacles, no face, no lettering. 1024 x 480 */
export const fxEyes = (p: Pen, faded = 0.25) => {
  const g = p.g;
  g.fillStyle = "#d8ccb0"; g.fillRect(0, 0, 1024, 480);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(150,130,100,${0.15 + 0.2 * rnd(5, i)})`; g.fillRect(rnd(6, i) * 1024, rnd(7, i) * 480, 40 + 90 * rnd(8, i), 6 + 16 * rnd(9, i)); }
  for (const s of [-1, 1]) {
    const cx = 512 + s * 230, cy = 230;
    p.ell(cx, cy, 170, 132, "#f6f0e2", 0);
    p.ell(cx, cy, 92, 92, "#3a7ac8", 0);
    p.ell(cx, cy, 42, 42, "#141018", 0);
    p.ell(cx - 26, cy - 30, 16, 12, "#ffffff", 0);
    p.ell(cx, cy, 190, 150, null, 34);
    p.g.strokeStyle = "#e8c23a"; p.g.lineWidth = 26; p.g.beginPath(); p.g.ellipse(cx, cy, 190, 150, 0, 0, Math.PI * 2); p.g.stroke();
  }
  g.strokeStyle = "#e8c23a"; g.lineWidth = 26; g.beginPath(); g.moveTo(472, 210); g.quadraticCurveTo(512, 180, 552, 210); g.stroke();
  g.fillStyle = `rgba(216,204,176,${faded})`; g.fillRect(0, 0, 1024, 480);
  g.strokeStyle = INK; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 466);
};

/** a soft headlight beam (512 x 256, bright at the left edge = the lamp, fading right) */
export const fxBeam = (p: Pen) => {
  const g = p.g, gr = g.createLinearGradient(0, 0, 512, 0);
  gr.addColorStop(0, "rgba(255,246,200,0.9)"); gr.addColorStop(0.5, "rgba(255,240,190,0.35)"); gr.addColorStop(1, "rgba(255,240,190,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, 112); g.lineTo(512, 0); g.lineTo(512, 256); g.lineTo(0, 144); g.closePath(); g.fill();
};
