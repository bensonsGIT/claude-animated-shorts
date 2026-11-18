import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of The Picture of Dorian Gray short: shots timed to the voice words (couch.potato.history/dorian-gray-short/voice/words.json).
// One shot per narration beat. Camera grammar from the house style: continuous slow push-ins, big reframes are cuts, 7-frame flip kicks.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "school" | "studio" | "theatre" | "library";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
type WK = keyof typeof WORD;
const W = (k: WK) => F(WORD[k]);
const S = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const school = S("school", "night", { night: true }), schoolM = S("school", "moon", { night: true });
const studio = S("studio", "day"), theatre = S("theatre", "dark"), library = S("library", "morning");
const LINES: ((id: number, a: number, b: number) => ShotDef)[] = [
  school, // 1 "For eighteen years, a man never aged, while his portrait grew old and hideous!"
  studio, // 2 "This is The Picture of Dorian Gray, by Oscar Wilde."
  studio, // 3 "In London, a painter finishes a portrait of a beautiful young man."
  studio, // 4 "Dorian wishes the picture could grow old instead of him."
  studio, // 5 "He swears, I would give my soul for that!"
  studio, // 6 "Then a witty lord tells him youth and pleasure are everything."
  theatre, // 7 "Dorian falls for Sibyl Vane, a teenage actress who plays Juliet."
  theatre, // 8 "One night she acts badly, and he dumps her, cruelly."
  library, // 9 "At home, the portrait's mouth has turned cruel!"
  theatre, // 10 "By dawn, the actress has poisoned herself."
  school, // 11 "He locks the painting away upstairs, and lives however he likes."
  school, // 12 "Every sin lands on the canvas; at thirty-eight, he still looks twenty."
  school, // 13 "When the painter finally sees it, Dorian stabs him!"
  school, // 14 "A chemist friend is blackmailed into making the body disappear."
  school, // 15 "He tries being good, but the portrait just adds a hypocrite's sneer."
  schoolM, // 16 "So he stabs the painting with the same knife."
  schoolM, // 17 "The servants find the portrait young and lovely again."
  schoolM, // 18 "On the floor: a withered old man, a knife in his heart."
  schoolM, // 19 "They only know it's Dorian by his rings!"
  schoolM, // 20 "Wilde's point: the picture was his conscience, and killing it killed him."
  school, // 21 "All because a young man wished he'd never grow old."
];
export const SHOTS: ShotDef[] = LINES.map((mk, i) => mk(i + 1, i === 0 ? 0 : cf(i), i === LINES.length - 1 ? TOTAL : cf(i + 1)));
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 3: 8, 7: 14, 9: 14, 10: 12, 11: 14, 13: 10, 14: 12, 15: 10, 16: 12, 20: 16, 21: 14 };
/** white 4-frame flash after the hook */
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** full-frame white: the knife going into the canvas (shot 16), a short white-out that clears before the cut */
export const glareAt = (f: number) => {
  const t = f / FPS, t0 = WORD.knife - 0.02, cut = SHOTS[16].a / FPS, end = cut + 0.3;
  if (t < t0 || t >= end) return 0;
  if (t < t0 + 0.12) return (t - t0) / 0.12;
  return t < cut ? 1 : (1 - (t - cut) / 0.3) ** 1.5;
};
/** the lamp falls and goes out after the murder: the picture dims (shot 13) */
export const blackAt = (f: number) => {
  const s = SHOTS[12], t = f / FPS;
  if (f < s.a || f >= s.b) return 0;
  return 0.55 * smooth((t - (WORD.stabs + 0.25)) / 0.3);
};

// ---------------- staging marks (x, floor y, z) ----------------
export const MARK = {
  // schoolroom: the portrait on the back wall at x 0.45 (frame -0.22..1.12), the window left, the table + chair right
  dor: [-0.6, 0, -2.45] as V3, dorMid: [-0.45, 0, -1.7] as V3, dorLunge: [-0.25, 0, -2.5] as V3,
  basil: [1.35, 0, -2.2] as V3, alan: [1.35, 0, -1.6] as V3, chestAlan: [1.0, 0.33, -1.15] as V3,
  leaf: [-1.25, 0, -1.55] as V3, francis: [-2.05, 0, -2.05] as V3, coach: [-0.55, 0, -0.95] as V3,
  body: [0.45, 0.03, -0.95] as V3, hand: [0.82, 0.045, -1.55] as V3,
  // studio: easel at (1.0, -1.9), dais at (-0.55, -2.5), divan x -3.05..-1.35 at z -1.9
  dorDais: [-0.55, 0.2, -2.5] as V3, basilEasel: [1.65, 0, -1.55] as V3, basilBack: [1.6, 0, -1.0] as V3,
  henry: [-1.85, 0, -1.45] as V3, dorHenry: [-0.85, 0, -1.95] as V3,
  // theatre: Juliet's balcony (platform y 1.9), Dorian's box chair on the left wall
  sibyl: [-0.6, 1.9, -4.85] as V3, dorBox: [-3.55, 1.81, -0.5] as V3, dorBoxUp: [-3.45, 1.7, -0.35] as V3,
  bottle: [0.9, 0.9, -3.05] as V3,
  // library: the portrait at (1.75, 1.85) on the back wall, Dorian left of it
  dorLib: [0.55, 0, -2.25] as V3,
};
const M = MARK;
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
const SIT = -0.45;
/** painted head of the portrait in each set (canvas centre + 0.32 of a 1.5 m canvas) */
export const P_HEAD = { school: [0.45, 1.62 + 0.36, -3.08] as V3, library: [1.75, 1.85 + 0.32, -3.48] as V3, studio: [1.0, 1.73 + 0.32, -1.78] as V3 };

// ---------------- the picture, the satin, the lamp, the screen, the curtains ----------------
/** the portrait's painted stage at time t in shot id (see library/dorian.ts drawPortrait) */
export const portraitAt = (id: number, t: number) => {
  switch (id) {
    case 1: return t >= WORD.hideous - 0.08 ? 2 : 0;
    case 9: return t >= WORD.cruel - 0.08 ? 1 : 0;
    case 11: return 1;
    case 12: return t >= WORD.sin - 0.08 ? 2 : 1;
    case 13: case 14: return 2;
    case 15: return t >= WORD.sneer - 0.08 ? 3 : 2;
    case 16: return 3;
    case 17: return t >= WORD.portrait4 - 0.08 ? 4 : 3;
    case 18: case 19: case 20: return 4;
    default: return 0;
  }
};
/** the purple satin: 1 hanging over the frame, 0 off */
export const coverAt = (id: number, t: number) => {
  const b0 = SHOTS[id - 1].a / FPS;
  if (id === 11) return smooth((t - (b0 + 0.25)) / 0.6);
  if (id === 12) return 1 - smooth((t - (b0 + 0.15)) / 0.55);
  if (id === 14) return 1;
  return 0;
};
/** the schoolroom oil lamp: lit, except after the murder (shot 13) and on the moonlit shots */
export const lampAt = (id: number, t: number) => {
  if (id === 13) return 1 - smooth((t - (WORD.stabs + 0.25)) / 0.25);
  return SHOTS[id - 1].light === "moon" ? 0 : 1;
};
/** the casements stand open once the servants have climbed in (shots 17-20) */
export const sashAt = (id: number) => (id >= 17 && id <= 20 ? 1 : 0);
/** the satin heap on the floor once it has slipped off (shots 12-20) */
export const heapAt = (id: number) => id >= 12 && id <= 17 && id !== 14;
/** the library screen swings aside at the start of shot 9 */
export const screenAt = (id: number, t: number) => (id === 9 ? smooth((t - (SHOTS[8].a / FPS + 0.1)) / 0.6) : 0);
/** the drop curtain falls on "cruelly" (shot 8); the footlights go out one by one from "poisoned" (shot 10) */
export const dropAt = (id: number, t: number) => (id === 8 ? smooth((t - WORD.her) / 0.7) : 0);
export const footAt = (id: number, t: number) => (id === 10 ? 1 - clamp01((t - WORD.poisoned) / Math.max(0.6, SHOTS[9].b / FPS - WORD.poisoned - 0.3)) : 1);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
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
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
/** a held shot: slow push-in from f0, with an optional punch-in from word frame fp */
const hold = (pos: V3, look: V3, f0: number, rate: number, fov = 42, fp?: number, punch = 0.005) => (f: number): Shot =>
  dolly(pos, look, pushK(f, f0, rate) * (fp !== undefined ? pushK(f, fp - 3, 0, punch, 30) : 1), { fov });

const a = (id: number) => SHOTS[id - 1].a;
const HOOK_POS: V3 = [0.05, 1.5, 2.2], HOOK_LOOK: V3 = [0.15, 1.35, -3.0];
/** close-up rig: ~2.9 m from a standing card, face in the upper third (head centre ~1.44 m over the mark) */
const cuPos = (m: V3, dx = 0, dz = 2.9): V3 => [m[0] + dx, m[1] + 1.4, m[2] + dz];
const cuLook = (m: V3): V3 => [m[0], m[1] + 1.12, m[2]];
const PH = P_HEAD;
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(HOOK_POS, HOOK_LOOK, 0, 0.0012, 50, W("hideous")) }],
  2: [{ f: a(2), s: hold([-0.15, 1.75, 4.2], [-0.25, 1.45, -2.0], a(2), 0.0009, 58) }],
  3: [{ f: a(3), s: hold([1.05, 1.6, 2.6], [1.45, 1.35, -1.7], a(3), 0.0016, 50, W("beautiful")) }],
  4: [{ f: a(4), s: hold([0.75, 1.75, 1.6], [0.15, 1.65, -2.2], a(4), 0.0016, 50, W("wishes")) }],
  5: [{ f: a(5), s: rolled(hold(cuPos(MARK.dorDais, 0.1), cuLook(MARK.dorDais), a(5), 0.0024, 40, W("soul"), 0.007), 0.03) }],
  6: [{ f: a(6), s: hold([-1.1, 1.5, 2.6], [-1.4, 1.1, -1.7], a(6), 0.0016, 52, W("witty")) }],
  7: [{ f: a(7), s: hold([0.2, 2.0, 4.6], [-0.45, 2.6, -4.6], a(7), 0.0012, 48) },
      { f: W("falls") - 3, cut: true, s: rolled(hold([-2.6, 2.75, 2.2], [-3.5, 2.4, -0.5], W("falls") - 3, 0.0022, 44), -0.03) },
      { f: W("teenage") - 3, cut: true, s: hold([-0.45, 3.2, -1.4], [-0.6, 3.0, -4.85], W("teenage") - 3, 0.0018, 42, W("juliet")) }],
  8: [{ f: a(8), s: hold([-0.45, 3.2, -1.6], [-0.6, 3.0, -4.85], a(8), 0.0022, 42, W("badly")) },
      { f: W("dumps") - 3, cut: true, s: rolled(hold([-2.6, 3.05, 2.4], [-3.45, 2.75, -0.35], W("dumps") - 3, 0.0024, 44, W("dumps"), 0.006), 0.04) },
      { f: W("cruelly") - 3, cut: true, s: hold([0.1, 2.5, 1.6], [-0.5, 2.7, -4.6], W("cruelly") - 3, 0.0014, 46) }],
  9: [{ f: a(9), s: hold([0.75, 1.75, 1.6], [1.2, 1.75, -3.0], a(9), 0.0012, 50) },
      { f: W("mouth") - 4, dur: 30, s: hold([1.75, PH.library[1] - 0.1, -1.15], PH.library, W("mouth") - 4, 0.002, 40, W("cruel"), 0.008) }],
  10: [{ f: a(10), s: hold([0.3, 1.7, 3.2], [0.0, 1.7, -4.4], a(10), 0.0014, 50) }],
  11: [{ f: a(11), s: hold([0.35, 1.6, 1.9], [0.0, 1.55, -3.0], a(11), 0.0014, 48) },
      { f: W("likes") - 3, cut: true, s: hold(cuPos(MARK.dor, 0.1), cuLook(MARK.dor), W("likes") - 3, 0.0022, 40) }],
  12: [{ f: a(12), s: hold([0.45, 1.9, 0.0], PH.school, a(12), 0.0018, 42, W("sin"), 0.006) },
      { f: W("thirtyeight") - 3, cut: true, s: rolled(hold(cuPos(MARK.dor, -0.1), cuLook(MARK.dor), W("thirtyeight") - 3, 0.0022, 40, W("twenty")), -0.03) }],
  13: [{ f: a(13), s: hold([0.4, 1.55, 2.8], [0.45, 1.3, -2.6], a(13), 0.0014, 54, W("finally")) },
      { f: W("stabs") - 3, cut: true, s: rolled(hold([1.3, 1.6, -0.6], [1.6, 1.75, -3.15], W("stabs") - 3, 0.003, 46, W("stabs"), 0.008), 0.05) }],
  14: [{ f: a(14), s: hold([0.45, 1.55, 2.8], [0.45, 1.25, -2.2], a(14), 0.0014, 54, W("blackmailed")) }],
  15: [{ f: a(15), s: hold(cuPos(MARK.dorMid, 0.1, 3.2), cuLook(MARK.dorMid), a(15), 0.0018, 42, W("good")) },
       { f: W("portrait3") - 3, cut: true, s: hold([0.45, PH.school[1], -1.0], PH.school, W("portrait3") - 3, 0.0024, 40, W("sneer"), 0.008) }],
  16: [{ f: a(16), s: rolled(hold([0.6, 1.5, 2.4], [0.25, 1.3, -2.8], a(16), 0.0018, 52, W("same"), 0.008), -0.04) }],
  17: [{ f: a(17), s: hold([0.6, 1.6, 2.2], [-1.2, 1.45, -2.0], a(17), 0.0016, 50, W("servants")) },
       { f: W("portrait4") - 3, cut: true, s: hold([0.45, 1.75, 0.3], [0.45, 1.65, -3.1], W("portrait4") - 3, 0.0018, 46, W("lovely")) }],
  18: [{ f: a(18), s: hold([0.5, 1.95, 0.55], [0.45, 0.0, -1.85], a(18), 0.0018, 48, W("heart")) }],
  19: [{ f: a(19), s: rolled(hold([0.95, 1.1, -0.65], [0.82, 0.04, -1.55], a(19), 0.003, 40, W("rings"), 0.008), 0.04) }],
  20: [{ f: a(20), s: hold([0.45, 1.75, 1.6], [0.45, 1.75, -3.1], a(20), 0.0016, 44) }],
  21: [{ f: a(21), s: hold(HOOK_POS, HOOK_LOOK, a(21), 0.0012, 50, W("wished")) }],
};

const KICKS: [number, number][] = [[WORD.hideous, 1.0], [WORD.soul, 0.7], [WORD.dumps, 0.6], [WORD.cruel, 0.8], [WORD.stabs, 1.1],
  [WORD.disappear, 0.5], [WORD.sneer, 0.6], [WORD.knife + 0.1, 1.2], [WORD.rings, 0.9]];
export const kickAt = (t: number) => {
  let k = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) k += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return k;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), k = kickAt(f / FPS);
  if (!k) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * k;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + k * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 7, focus: () => eyesOf(M.dor) },
  { f: a(2), cInf: 0 },
  { f: a(3), cInf: 9, focus: () => eyesOf(M.basilEasel) },
  { f: a(4), cInf: 9, focus: () => eyesOf(M.dorDais) },
  { f: a(5), cInf: 13, focus: () => eyesOf(M.dorDais) },
  { f: a(6), cInf: 10, focus: () => eyesOf(M.henry, SIT) },
  { f: a(7), cInf: 6, focus: () => eyesOf(M.sibyl) },
  { f: W("falls") - 3, cInf: 11, focus: () => eyesOf(M.dorBox, SIT) },
  { f: W("teenage") - 3, cInf: 10, focus: () => eyesOf(M.sibyl) },
  { f: a(8), cInf: 11, focus: () => eyesOf(M.sibyl) },
  { f: W("dumps") - 3, cInf: 11, focus: () => eyesOf(M.dorBoxUp) },
  { f: W("cruelly") - 3, cInf: 8, focus: () => eyesOf(M.sibyl) },
  { f: a(9), cInf: 9, focus: () => PH.library },
  { f: a(10), cInf: 7, focus: () => M.bottle },
  { f: a(11), cInf: 8, focus: () => eyesOf(M.dor) },
  { f: a(12), cInf: 10, focus: () => PH.school },
  { f: W("thirtyeight") - 3, cInf: 13, focus: () => eyesOf(M.dor) },
  { f: a(13), cInf: 8, focus: () => eyesOf(M.basil) },
  { f: a(14), cInf: 8, focus: () => eyesOf(M.alan) },
  { f: a(15), cInf: 11, focus: () => eyesOf(M.dorMid) },
  { f: W("portrait3") - 3, cInf: 12, focus: () => PH.school },
  { f: a(16), cInf: 9, focus: () => eyesOf(M.dorLunge) },
  { f: a(17), cInf: 8, focus: () => eyesOf(M.leaf) },
  { f: W("portrait4") - 3, cInf: 10, focus: () => PH.school },
  { f: a(18), cInf: 10, focus: () => [M.body[0], 0.05, M.body[2] - 0.9] },
  { f: a(19), cInf: 13, focus: () => M.hand },
  { f: a(20), cInf: 9, focus: () => PH.school },
  { f: a(21), cInf: 7, focus: () => eyesOf(M.dor) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, W as wf };
