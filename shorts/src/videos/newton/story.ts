import type { LightName } from "./lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Isaac Newton short: shots timed to the voice words (~/newton-short/voice/words.json) and the
// camera grammar measured in the reference study: continuous slow push-ins; symmetric ease-in-out moves ~23 f;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
// The bridge physics below is kept only because the (hidden) bridge world still builds from it.
export const FPS = 30;
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of the front row, marching toward -z
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz cycle = 2 steps/s, footfalls at 0 and 0.5
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau); // "a little harder every step"
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26); // 1 on the near half, 0 at the far tower
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = LightName;
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
/** interior sets: study.ts (1665), mint.ts (the Tower, 1696-99), cell.ts (Newgate, 1699); "out" = the hidden bridge world */
export type ShotSet = "out" | "study" | "mint" | "cell";
export type ShotDef = {
  id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean;
  set?: ShotSet; sunAz?: number; sunEl?: number; mode?: "night" | "sun" | "prism" | "dark";
};
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const room = (set: ShotSet, light: Light, mode?: ShotDef["mode"]) => (id: number, a: number, b: number): ShotDef =>
  ({ id, a, b, light, crowd: "none", tau: (t) => t, set, mode });
const study = room("study", "night", "night"), prism = room("study", "night", "prism"), sunny = room("study", "sun", "sun"), dark = room("study", "dark", "dark");
const mintDay = room("mint", "sun"), mintNight = room("mint", "night"), cell = room("cell", "night");
/** the hook cuts on "behind"; the sun shot cuts to the dark room on "hide"; the ending cuts on "Neither" */
export const CUT_HIDE = F(WORD.hide) - PRE;
export const SHOTS: ShotDef[] = [
  study(1, 0, cf(1)), // "A young man once slid a needle behind his own eyeball, on purpose!"
  study(2, cf(1), cf(2)), // "He wanted to know how we see color, so he pressed on the back of his eye."
  study(3, cf(2), cf(3)), // "He saw rings of white, dark and color, and sketched it all in his notebook."
  prism(4, cf(3), cf(4)), // "That man was Isaac Newton, one of the greatest scientists in history!"
  sunny(5, cf(4), CUT_HIDE), // "Later, he stared at the sun's reflection until he had to"
  dark(6, CUT_HIDE, cf(5)), // "hide in a dark room for days!"
  mintDay(7, cf(5), cf(6)), // "Decades later, he took a job at England's Royal Mint."
  mintDay(8, cf(6), cf(7)), // "His mission: hunt counterfeiters, a crime punished as high treason."
  mintDay(9, cf(7), cf(8)), // "The slipperiest was William Chaloner, who accused the Mint itself of fraud!"
  mintNight(10, cf(8), cf(9)), // "Newton spent months building the case against him."
  cell(11, cf(9), cf(11)), // "In March 1699, Chaloner was condemned to hang. He wrote Newton a letter begging for mercy."
  mintNight(12, cf(11), cf(12)), // "Newton was unmoved."
  mintNight(13, cf(12), TOTAL), // "Mercy was never his specialty. Neither was caution!"
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 7: 10, 11: 10, 12: 8 };
export const FLASH_AT = cf(3);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the sun's reflection: a warm white veil that builds over the frame from "stared" to the cut on "hide" (0..1) */
export const glareAt = (f: number) => {
  const t = T(f);
  if (f < SHOTS[4].a || f >= CUT_HIDE) return 0;
  return 0.66 * smooth((t - (WORD.stared - 0.05)) / (CUT_HIDE / FPS - WORD.stared - 0.1)) ** 1.6;
};

const CALM: BridgeState = { bounce: 0, drop: 0, snap: 0, collapsed: false };
export const bridgeState = (_id: number, _t: number): BridgeState => CALM;

// ---------------- story beats (seconds, from words.json; reactions land 0-3 f before their word) ----------------
/** staging marks (x, floor y, z); the set files hold the rooms, cast.ts places the people on these marks */
export const MARK = {
  // the study (study.ts): beside his desk, by the prism stand, at the looking glass, on the bed (dark room)
  desk: [-0.6, 0, -2.85] as V3, prism: [-0.4, 0, -0.6] as V3, glass: [-1.6, 0, -0.75] as V3, bed: [2.25, 0.36, 0.55] as V3,
  // the Mint (mint.ts): Newton among the presses, the coin examined, Chaloner, Newton behind his desk; two minters
  mintStand: [0.4, 0, -2.6] as V3, mintExam: [1.0, 0, -2.2] as V3, chaloner: [-0.2, 0, -0.2] as V3, wardenBg: [1.65, 0, -2.25] as V3,
  warden: [1.65, 0, -2.2] as V3, minterA: [-4.5, 0, -3.5] as V3, minterB: [-0.75, 0, -3.65] as V3, minterC: [3.4, 0, -3.75] as V3,
  // Newgate (cell.ts)
  cellCh: [-0.25, 0, -1.2] as V3,
};
const EYE = 1.6, SIT_EYE = 1.25;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
/** the press strikes (s): on "Decades", "job" and "Mint" */
export const STRIKES = [WORD.decades + 0.05, WORD.job - 0.05, WORD.mint - 0.08];
/** fly-bar angle of the screw press at time t: a fast quarter-turn on each strike, then a slow return */
export const strikeAt = (t: number) => {
  let a = 0.25;
  for (const s of STRIKES) {
    const d = t - s;
    if (d < -0.35) continue;
    a += d < 0 ? -0.35 * smooth((d + 0.35) / 0.35) : d < 0.1 ? -0.35 + 1.25 * (d / 0.1) : 0.9 - 0.9 * smooth((d - 0.1) / 0.8);
  }
  return a;
};
/** the case papers pile up across "months building the case against him", and stay */
export const growAt = (t: number) => smooth((t - (WORD.months - 0.1)) / (WORD.him + 0.4 - WORD.months));

// ---------------- camera ----------------
// Grammar (motion.md): every move is a symmetric smootherstep glide of 18-40 f; a reframe bigger than about half a
// frame width or 40 % zoom is a hard cut. Holds push in 0.15-0.35 %/f, ~0.6 %/f for ~35 f on punch words.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep (attack = release, ~10 f each on a 23 f move) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// the (hidden) bridge world still imports these
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

const W = (k: keyof typeof WORD) => F(WORD[k]);
const M = MARK;
// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// 1: candlelit MS of young Newton by his desk, needle raised -> cut on "behind" to a CU as it slides in
const S1a = (f: number) => dolly([0.55, 1.62, 0.6], [-0.45, 1.4, -2.85], pushK(f, 0, 0.0028), { fov: 40 });
const S1b = (f: number) => dolly([-0.05, 1.6, -0.45], [-0.5, 1.46, -2.85], pushK(f, W("behind") - PRE, 0.0025, 0.006, 30), { fov: 36 });
// 2: the CU continues, a little tighter; punch on "pressed"
const S2a = (f: number) => dolly([-0.1, 1.58, -0.6], [-0.52, 1.46, -2.85], pushK(f, cf(1), 0.002, 0, 0), { fov: 36 });
const S2b = (f: number) => dolly([-0.1, 1.58, -0.6], [-0.52, 1.46, -2.85], pushK(f, cf(1), 0.002) * pushK(f, W("pressed") - 2, 0, 0.006, 30), { fov: 36 });
// 3: the rings bloom round his head (MS) -> cut on "sketched" to the notebook on the desk
const S3a = (f: number) => dolly([0.25, 1.7, -0.6], [-0.55, 1.5, -2.85], pushK(f, cf(2), 0.0022), { fov: 40 });
const S3b = (f: number) => dolly([1.0, 1.48, -2.95], [1.0, 0.84, -3.62], pushK(f, W("sketched") - PRE, 0.003), { fov: 34 });
// 4: the dark room, the pin-hole beam, the prism, the spectrum on the back wall: Newton proud beside it
const S4a = (f: number) => dolly([1.2, 1.8, 2.8], [-2.4, 1.3, -2.4], pushK(f, cf(3), 0.0018, 0.005, 30), { fov: 48 });
const S4b = (f: number) => dolly([0.7, 1.55, 1.9], [-1.25, 1.35, -1.75], pushK(f, W("greatest") - PRE, 0.0025, 0.006, 30), { fov: 42 });
// 5: shutters open, sun on the looking glass; Newton staring into it as the glare builds
const S5a = (f: number) => dolly([-0.2, 1.55, 1.6], [-2.0, 1.35, -1.2], pushK(f, cf(4), 0.0025, 0.005, 40), { fov: 40 });
// 6: shutters shut, the dark room: Newton on the bed, dazzled; tally marks on the wall behind
const S6a = (f: number) => dolly([0.6, 1.35, 2.9], [2.45, 1.2, 0.0], pushK(f, CUT_HIDE, 0.0022, 0.005, 30), { fov: 42 });
// 7: the Mint wide: press, furnace, coin table, Newton among it all -> glide in to him on "Royal Mint"
const S7a = (f: number) => dolly([3.6, 2.6, 4.6], [-0.8, 1.5, -4.0], pushK(f, cf(5), 0.0016), { fov: 48 });
const S7b = (f: number) => dolly([1.6, 1.85, 1.0], [0.1, 1.45, -2.9], pushK(f, W("royal") - 12, 0.0022, 0.005, 30), { fov: 42 });
// 8: Newton with his magnifier; the coin (fx) in the near foreground goes fake on "counterfeiters", cracks on "treason"
const S8a = (f: number) => dolly([1.3, 1.5, 0.35], [1.0, 1.38, -2.2], pushK(f, cf(6), 0.0025), { fov: 38 });
const S8b = (f: number) => dolly([1.3, 1.5, 0.35], [1.0, 1.38, -2.2], pushK(f, cf(6), 0.0025) * pushK(f, W("treason") - 2, 0, 0.007, 30), { fov: 38 });
// 9: Chaloner front left, smirking -> points at the Warden on "accused" (glide to a two-shot)
const S9a = (f: number) => dolly([0.0, 1.5, 2.3], [-0.25, 1.4, -0.2], pushK(f, cf(7), 0.0025), { fov: 38 });
const S9b = (f: number) => dolly([-0.9, 1.65, 2.6], [0.6, 1.3, -1.4], pushK(f, W("accused") + 6, 0.0018, 0.005, 30), { fov: 44 });
// 10: night at the desk: Newton writing, the piles grow
const S10a = (f: number) => dolly([2.3, 1.55, 1.0], [1.6, 1.32, -1.8], pushK(f, cf(8), 0.0022), { fov: 40 });
// 11: Newgate: Chaloner by his stool; the noose shadow on "hang" -> cut on "He wrote" to a CU, the letter held up
const S11a = (f: number) => dolly([-0.1, 1.5, 2.0], [-0.7, 1.35, -1.8], pushK(f, cf(9), 0.002, 0.005, 30), { fov: 44 });
const S11b = (f: number) => dolly([0.05, 1.5, 1.2], [-0.25, 1.38, -1.2], pushK(f, cf(10), 0.0025, 0.005, 30), { fov: 38 });
// 12: the Warden reads it. Unmoved.
const S12a = (f: number) => dolly([1.7, 1.5, 0.0], [1.65, 1.4, -2.2], pushK(f, cf(11), 0.0025, 0.006, 35), { fov: 36 });
// 13: he drops it on the pile -> cut on "Neither": CU, the bodkin up to the candle, a grin (roll)
const S13a = (f: number) => dolly([2.4, 1.6, 1.1], [1.6, 1.32, -1.9], pushK(f, cf(12), 0.002), { fov: 40 });
const S13b = (f: number) => dolly([1.85, 1.5, 0.2], [1.65, 1.42, -2.2], pushK(f, cf(13), 0.003, 0.006, 30), { fov: 36 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: W("behind") - PRE, cut: true, s: S1b }],
  2: [{ f: cf(1), s: S2a }, { f: W("pressed") - 2, cut: true, s: S2b }],
  3: [{ f: cf(2), s: S3a }, { f: W("sketched") - PRE, cut: true, s: S3b }],
  4: [{ f: cf(3), s: S4a }, { f: W("greatest") - PRE, cut: true, s: S4b }, { f: W("history") - 4, dur: 20, s: rolled(S4b, 0.05) }],
  5: [{ f: cf(4), s: S5a }],
  6: [{ f: CUT_HIDE, s: S6a }, { f: W("days") - 4, dur: 18, s: rolled(S6a, -0.05) }],
  7: [{ f: cf(5), s: S7a }, { f: W("royal") - 12, dur: 30, s: S7b }],
  8: [{ f: cf(6), s: S8a }, { f: W("treason") - 2, cut: true, s: S8b }],
  9: [{ f: cf(7), s: S9a }, { f: W("accused") - 6, dur: 24, s: S9b }, { f: W("fraud") - 4, dur: 18, s: rolled(S9b, 0.045) }],
  10: [{ f: cf(8), s: S10a }],
  11: [{ f: cf(9), s: S11a }, { f: cf(10), cut: true, s: S11b }],
  12: [{ f: cf(11), s: S12a }],
  13: [{ f: cf(12), s: S13a }, { f: cf(13), cut: true, s: S13b }, { f: W("caution") - 2, dur: 20, s: rolled(S13b, -0.05) }],
};

// impact kicks: the image offset flips sign every frame, decays to 0 in 7 f; they start on the first frame at/after the event
const KICKS: [number, number][] = [[WORD.pressed - 0.03, 0.9], [STRIKES[0], 0.35], [STRIKES[1], 0.35], [STRIKES[2], 0.7], [WORD.treason, 1.2],
  [WORD.fraud, 0.6], [WORD.hang, 0.8], [WORD.unmoved, 0.4]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Lens blur per beat (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp. */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 9, focus: () => eyesOf(M.desk) },
  { f: W("behind") - PRE, cInf: 14, focus: () => eyesOf(M.desk) },
  { f: cf(2), cInf: 10, focus: () => eyesOf(M.desk) },
  { f: W("sketched") - PRE, cInf: 13, focus: () => [0.95, 0.86, -3.62] },
  { f: cf(3), cInf: 0 }, // the prism room, all sharp
  { f: W("greatest") - PRE, cInf: 10, focus: () => eyesOf(M.prism) },
  { f: cf(4), cInf: 9, focus: () => eyesOf(M.glass) },
  { f: CUT_HIDE, cInf: 7, focus: () => [M.bed[0], M.bed[1] + SIT_EYE, M.bed[2]] },
  { f: cf(5), cInf: 0 }, // the Mint wide
  { f: W("royal") - 12, dur: 30, cInf: 8, focus: () => eyesOf(M.mintStand, -0.05) },
  { f: cf(6), cInf: 12, focus: () => eyesOf(M.mintExam, -0.05) },
  { f: cf(7), cInf: 11, focus: () => eyesOf(M.chaloner) },
  { f: W("accused") - 6, dur: 24, cInf: 6, focus: () => eyesOf(M.chaloner) },
  { f: cf(8), cInf: 10, focus: () => eyesOf(M.warden, -0.05) },
  { f: cf(9), cInf: 7, focus: () => eyesOf(M.cellCh) },
  { f: cf(10), cInf: 13, focus: () => eyesOf(M.cellCh) },
  { f: cf(11), cInf: 13, focus: () => eyesOf(M.warden, -0.05) },
  { f: cf(12), cInf: 9, focus: () => eyesOf(M.warden, -0.05) },
  { f: cf(13), cInf: 14, focus: () => eyesOf(M.warden, -0.05) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
/** what the lens focuses on (DOF): the DOF table's focus point, else the camera look point */
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
