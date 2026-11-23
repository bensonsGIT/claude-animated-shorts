// Cast + effects first drawn for the Sonya confession short (Crime and Punishment, Part V ch. 4; Garnett 1914).
// Raskolnikov, Sonya and Lizaveta come from library/crime.ts; this adds his mother and sister (III.1), the old woman and
// girl on the bridge (II.2), Svidrigailov (IV.1) and the tableau / effect cards. No blade is ever drawn.
import { Pen, bodyFront, mul } from "../toon";
import type { Outfit, FrontOpts } from "../toon";
import { RASKOL, SONYA, LIZAVETA } from "./crime";

export { RASKOL, SONYA, LIZAVETA };
/** Raskolnikov bare-headed (indoors at Sonya's) */
export const RASKOL_IN: Outfit = { ...RASKOL, hat: "hair" };
/** Sonya at home: the plain dark dress, fair hair, no shawl */
export const SONYA_HOME: Outfit = { ...SONYA, sash: undefined };
/** Pulcheria Alexandrovna, 43: a faded beauty, hair going grey, a black dress and bonnet */
export const MOTHER: Outfit = { jacket: "#26222a", dress: "#26222a", pants: "#26222a", boots: "#1a1618", hat: "bonnet", cap: "#3a3440", hair: "#9a9088", skin: "#f2d6c0" };
/** Dunya, 22: tall, dark hair, a dark-blue dress (she looks like him) */
export const DUNYA: Outfit = { jacket: "#2a3a5a", dress: "#2a3a5a", pants: "#2a3a5a", boots: "#1a1618", hat: "hair", hair: "#3a2418", long: true, skin: "#f4d8c4" };
/** the elderly merchant's wife on the bridge: headscarf, brown shawl */
export const OLDWOMAN: Outfit = { jacket: "#6a4a32", dress: "#5a4636", pants: "#4a3a2e", boots: "#3a2a20", hat: "veil", cap: "#8a6a5a", skin: "#ecc8a8" };
export const GIRL: Outfit = { jacket: "#8a5a6a", dress: "#8a5a6a", pants: "#5a4048", boots: "#3a2a20", hat: "bonnet", cap: "#d8c8a8", hair: "#a8743a", skin: "#f8dcc4", build: "kid" };
/** Svidrigailov, ~50: broad-shouldered, a thick light beard almost white, light-blue eyes, a light summer suit */
export const SVID: Outfit = { jacket: "#d8ccb0", pants: "#c8bc9e", boots: "#3a2a20", hat: "hair", hair: "#e4dcc0", skin: "#f0d2b8", beard: "#ece4cc", beardStyle: "short", build: "stout", buttons: "#8a7a5a" };

// ================= tableau: Sonya on her knees, her arms round him (seen from behind her) =================
/** Raskolnikov standing (fo), Sonya kneeling in front of him with her back to the camera, arms round his legs.
 *  hands 0 = his arms hang .. 1 = his hands come down onto her shoulders */
export const kneelHug = (p: Pen, fo: FrontOpts, hands = 0) => {
  bodyFront(p, RASKOL_IN, { ...fo, mode: "stand", prop: null });
  const dress = SONYA_HOME.dress!, hair = SONYA_HOME.hair!, dk = mul(dress, [0.7, 0.7, 0.75]);
  // her skirt spread on the floor, her back, her shoulders
  p.poly([[150, 985], [170, 880], [215, 800], [385, 800], [430, 880], [450, 985]], dress, 7);
  p.stroke([[300, 830], [300, 980]], 3, dk);
  p.poly([[222, 820], [228, 690], [262, 640], [338, 640], [372, 690], [378, 820]], dress, 7);
  // arms reaching round his legs (sleeves, then small hands on the far side)
  p.band([[236, 690], [196, 720], [214, 760]], dress, 30, 6, "round");
  p.band([[364, 690], [404, 720], [386, 760]], dress, 30, 6, "round");
  p.ell(222, 762, 14, 11, SONYA_HOME.skin!, 4); p.ell(378, 762, 14, 11, SONYA_HOME.skin!, 4);
  // the back of her head: fair hair in a knot
  p.ell(300, 600, 58, 62, hair, 7);
  p.ell(300, 566, 26, 20, mul(hair, [0.9, 0.86, 0.8]), 5);
  for (const dx of [-30, -10, 12, 32]) p.stroke([[300 + dx, 552], [300 + dx * 1.1, 650]], 2.5, mul(hair, [0.78, 0.72, 0.62]));
  if (hands > 0.5) for (const s of [-1, 1]) { // his hands on her shoulders
    p.band([[300 + s * 92, 470], [300 + s * 70, 560], [300 + s * 52, 636]], RASKOL_IN.jacket, 22, 5, "round");
    p.ell(300 + s * 50, 644, 13, 11, RASKOL_IN.skin!, 4);
  }
};

/** a figure as a pale see-through ghost (memory of Lizaveta): the body drawn, then washed toward lilac */
export const ghost = (p: Pen, o: Outfit, fo: FrontOpts) => {
  const g = p.g;
  bodyFront(p, o, fo);
  g.save(); g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(200,190,240,0.55)"; g.fillRect(0, 0, 600, 1000); g.restore();
};

// ================= effects =================
/** an open hand from below holding a coin (k 0 = coin in the palm, 1 = palm turned, coin gone) */
export const fxHandCoin = (p: Pen, k = 0, sleeve = RASKOL.jacket, skin = RASKOL.skin!) => {
  p.poly([[60, 196], [70, 128], [140, 128], [150, 196]], sleeve, 7);
  p.poly([[50, 128], [160, 128], [170, 96], [40, 96]], skin, 8);
  for (const x of [52, 82, 112, 142]) p.line([[x + 4, 100], [x + 2 + k * 10, 66 + k * 20]], skin, 16);
  p.line([[160, 116], [186, 92]], skin, 16);
  if (k < 0.5) { p.ell(104, 92, 20, 8, "#c8ccd4", 5); p.ell(104, 90, 12, 4, "#eef0f4", 0); }
};
/** a silver twenty-kopek coin, k = turn (0 face .. 1 edge-on) */
export const fxCoin = (p: Pen, k = 0) => {
  const rx = 40 * Math.max(0.15, Math.abs(Math.cos(k * Math.PI)));
  p.ell(50, 50, rx, 40, "#c8ccd4", 5); p.ell(50, 50, rx * 0.6, 24, "#e6e8ee", 0);
};
/** a small splash ring on the water (k 0..1 grows and fades) */
export const fxSplash = (p: Pen, k = 0) => {
  const a = 1 - k, g = p.g; g.globalAlpha = a;
  p.ell(150, 120, 40 + 100 * k, 12 + 26 * k, null, 6);
  if (k < 0.5) for (const dx of [-30, 0, 30]) p.stroke([[150 + dx, 110], [150 + dx * 1.6, 110 - 70 * (1 - k * 2)]], 6, "#e8f2fa");
  g.globalAlpha = 1;
};
/** a standing man's shadow on the wall, alone (soft card 500 x 900) */
export const fxShadowAlone = (p: Pen, col = "#1e1828") => {
  const g = p.g; g.fillStyle = col;
  g.beginPath(); g.ellipse(250, 150, 60, 68, 0, 0, Math.PI * 2); g.fill();
  g.fillRect(205, 60, 90, 40); g.fillRect(175, 96, 150, 14); // the tall hat
  g.beginPath(); g.moveTo(195, 215); g.lineTo(305, 215); g.lineTo(325, 560); g.lineTo(300, 890); g.lineTo(258, 890); g.lineTo(250, 600); g.lineTo(242, 890); g.lineTo(200, 890); g.lineTo(175, 560); g.closePath(); g.fill();
};
/** sound reaching through a door: three thin arcs (300 x 200), k = phase */
export const fxListen = (p: Pen, k = 0) => {
  for (let i = 0; i < 3; i++) {
    const r = 30 + ((i * 40 + k * 40) % 120), a = Math.max(0, 1 - r / 150);
    p.arc(60, 100, r, r * 0.9, -50, 50, 5, `rgba(255,236,190,${a.toFixed(2)})`);
  }
};
/** a small cypress-wood cross on a cord (120 x 160) */
export const fxCypress = (p: Pen) => {
  const c = "#8a5a32";
  p.stroke([[60, 0], [60, 20]], 3, "#3a2a20");
  p.poly([[50, 20], [70, 20], [70, 154], [50, 154]], c, 5);
  p.poly([[22, 54], [98, 54], [98, 74], [22, 74]], c, 5);
};
/** a copper cross (Lizaveta's, 100 x 140) */
export const fxCopper = (p: Pen) => {
  const c = "#c8743a";
  p.poly([[42, 6], [58, 6], [58, 134], [42, 134]], c, 4);
  p.poly([[16, 40], [84, 40], [84, 56], [16, 56]], c, 4);
};
/** a snow flake (60 x 60) */
export const fxSnow = (p: Pen) => { p.dot(30, 30, 16, "#f4f8ff"); p.dot(30, 30, 8, "#ffffff"); };
