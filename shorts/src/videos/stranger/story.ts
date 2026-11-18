import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of The Stranger short: shots timed to the voice words (~/the-stranger-short/voice/words.json); camera grammar
// from the reference study: continuous slow push-ins, ease-in-out moves, big reframes are cuts, 7-frame flip kicks.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "beach" | "vigil" | "office" | "flat" | "cinema" | "court" | "cell" | "square";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; sky?: string; bathing?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const S = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const beach = S("beach", "day", { sky: "sun", sunEl: 62 }), gold = S("beach", "golden"), swim = S("beach", "day", { bathing: true, sky: "day" });
const vigil = S("vigil", "lab"), office = S("office", "sun"), flat = S("flat", "moon"), cinema = S("cinema", "dark");
const court = S("court", "sun"), cell = S("cell", "moon"), square = S("square", "morning");
export const SHOTS: ShotDef[] = [
  beach(1, 0, cw("dooms")), // "A man shoots a stranger on a beach, but what"
  vigil(2, cw("dooms"), cf(1)), // "dooms him is not crying at a funeral!"
  gold(3, cf(1), cf(2)), // "This is The Stranger, by Albert Camus."
  office(4, cf(2), cf(3)), // "In Algiers, a clerk named Meursault loses his mother."
  vigil(5, cf(3), cw("dozes")), // "At her vigil he drinks coffee, smokes,"
  vigil(6, cw("dozes"), cf(4)), // "dozes, and never cries."
  swim(7, cf(4), cw("sees")), // "Next day he goes swimming, meets Marie, and"
  cinema(8, cw("sees"), cf(5)), // "sees a comedy."
  flat(9, cf(5), cf(6)), // "She asks if he loves her; he says probably not!"
  office(10, cf(6), cw("feud")), // "Then his shady neighbor drags him into a"
  beach(11, cw("feud"), cf(7)), // "feud with an Arab man."
  beach(12, cf(7), cf(8)), // "On a blinding beach, sunlight flashes off the man's knife, and the clerk fires."
  beach(13, cf(8), cf(9)), // "Then he fires four more times."
  court(14, cf(9), cf(10)), // "At trial, the prosecutor keeps bringing up the coffee, the cigarettes, the comedy."
  court(15, cf(10), cf(11)), // "Asked why, the clerk blames the sun."
  court(16, cf(11), cf(12)), // "The prosecutor calls him soulless, and he gets the guillotine!"
  cell(17, cf(12), cf(13)), // "In his cell, a priest begs him to repent, and he explodes."
  cell(18, cf(13), cf(14)), // "Calm at last, he accepts the universe doesn't care, and feels free."
  square(19, cf(14), cf(15)), // "His last wish: a huge crowd at his execution, screaming with hate."
  gold(20, cf(15), cf(16)), // "Camus said his hero is condemned because he refuses to lie about his feelings."
  beach(21, cf(16), TOTAL), // "All because he didn't cry at a funeral."
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 10, 4: 10, 5: 12, 7: 12, 9: 10, 11: 12, 14: 14, 17: 14, 19: 14, 20: 18, 21: 12 };
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** full-frame sun glare: a 6-frame flare on "shoots", white-out on "fires" fading into the empty sky, a swelling flare
 *  on the last "funeral" that the loop cuts into shot 1 on */
export const glareAt = (f: number) => {
  const t = f / FPS;
  let g = 0;
  const d1 = t - WORD.shoots;
  if (d1 >= -0.03 && d1 < 0.2) g = Math.max(g, 0.85 * (1 - d1 / 0.2));
  const d2 = t - WORD.fires;
  if (d2 >= -0.03 && f < SHOTS[12].a + 22) g = Math.max(g, f < SHOTS[12].a ? 1 : 1 - (f - SHOTS[12].a) / 22);
  const d3 = t - WORD.funeral2;
  if (d3 >= 0) g = Math.max(g, 0.85 * smooth(d3 / Math.max(0.3, TOTAL / FPS - WORD.funeral2)));
  const d4 = t - WORD.knife;
  if (d4 >= 0 && d4 < 0.25) g = Math.max(g, 0.35 * (1 - d4 / 0.25));
  return g;
};
/** a slow heat haze ramp on the blinding beach (shot 12), shown as a faint warm wash */
export const heatAt = (f: number) => (f >= SHOTS[11].a && f < SHOTS[11].b ? 0.18 * smooth((f - SHOTS[11].a) / (SHOTS[11].b - SHOTS[11].a)) : 0);

// ---------------- staging marks (x, floor y, z) ----------------
export const MARK = {
  // beach: sea toward -z, shore z = -6, the rock at (3.6, -2.6), the spring at (3.0, -3.9)
  hook: [0, 0, 0] as V3, walkA: [-3.0, 0, -2.6] as V3, walkB: [0.2, 0, -2.8] as V3,
  swimClerk: [0.2, -1.3, -9.6] as V3, swimMarie: [1.05, -1.3, -9.9] as V3,
  ar0: [1.3, 0, -1.2] as V3, ar1: [2.3, 0, -0.9] as V3, feudRay: [-0.6, 0, 1.2] as V3, feudClerk: [-1.6, 0, 1.9] as V3,
  walk1: [-2.4, 0, 2.6] as V3, walk2: [-0.6, 0, 0.6] as V3, spring: [1.1, 0, -2.6] as V3,
  // vigil: coffin at (0, -1.9), friends' chairs at z -3.35
  friends: [-2.6, -1.6, -0.6, 0.6, 1.6, 2.6].map((x) => [x, 0, -3.1] as V3),
  vigilClerk: [-0.65, 0, 0.6] as V3, ctNear: [0.1, 0, 0.85] as V3, ctFar: [1.2, 0, 0.3] as V3,
  // office: desk z -1.55..-0.85, window behind
  desk: [0, 0, -2.0] as V3, ray: [0.55, 0, 0.5] as V3, rayClerk: [-0.5, 0, -0.3] as V3,
  flatMarie: [0.6, 0, -0.5] as V3, flatClerk: [-0.45, 0, -1.3] as V3,
  // cinema: front row z 0
  seatMarie: [0.36, 0.05, 0.0] as V3, seatClerk: [-0.36, 0.05, 0.0] as V3,
  // court
  dock: [-3.3, 0.35, -1.3] as V3, pros: [1.3, 0, 0.6] as V3, pros16: [-1.3, 0, 0.5] as V3, judge: [0, 0.5, -5.1] as V3,
  jurors: [[3.5, 0.2, -2.45], [4.4, 0.2, -2.45], [5.3, 0.2, -2.45], [3.9, 0.5, -1.45], [4.8, 0.5, -1.45], [5.6, 0.5, -1.45]] as V3[],
  // cell (newton cell: x -2.2..2.2, z -2.6..2, window x .35..1.05)
  chap: [0.5, 0, -0.9] as V3, chapOut: [2.4, 0, 0.3] as V3, cellClerk: [-0.5, 0, -1.2] as V3, bunk: [-0.5, 0.0, -1.6] as V3,
  // square
  squareClerk: [0, 0, 1.4] as V3,
  // the quiet golden beach (the author's point)
  quiet: [0, 0, -1.6] as V3,
};
const M = MARK;
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
/** the courtroom sunbeam: on the dock, brightening on "sun" */
export const courtBeam = (id: number, t: number): { at: V3; k: number } => ({ at: M.dock, k: id === 15 ? 0.45 + 0.55 * smooth((t - WORD.sun + 0.1) / 0.25) : 0.4 });
/** the fans and the ceiling fan stop when the prosecutor says "soulless" */
export const fanOn = (t: number) => !(t >= WORD.soulless && t < WORD.guillotine + 1.5);

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
const HOOK_POS: V3 = [0.7, 1.05, 7.4], HOOK_LOOK: V3 = [0, 1.45, -1.5];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(HOOK_POS, HOOK_LOOK, 0, 0.0012, 44, W("shoots")) }],
  2: [{ f: a(2), s: hold([0.15, 1.5, 4.6], [-0.3, 1.05, -1.4], a(2), 0.0014, 44) }, { f: W("crying") - 3, cut: true, s: rolled(hold([-0.4, 1.3, 2.9], [-0.65, 1.15, 0.6], W("crying") - 3, 0.003, 40), 0.04) }],
  3: [{ f: a(3), s: hold([1.4, 1.5, 8.0], [-1.2, 1.5, -3.0], a(3), 0.0012, 46) }],
  4: [{ f: a(4), s: hold([0.35, 1.5, 2.6], [0, 1.3, -1.7], a(4), 0.0016, 42) }, { f: W("mother") - 3, cut: true, s: hold([0.2, 1.55, 0.9], [0, 1.4, -2.0], W("mother") - 3, 0.002, 40) }],
  5: [{ f: a(5), s: hold([-0.25, 1.6, 3.8], [-0.35, 1.1, -1.6], a(5), 0.0014, 54) }],
  6: [{ f: a(6), s: hold([-0.35, 1.3, 3.0], [-0.65, 1.12, 0.6], a(6), 0.0022, 40, W("cries"), 0.006) }],
  7: [{ f: a(7), s: hold([0.6, 0.7, -5.7], [0.6, 0.0, -10.2], a(7), 0.0018, 44) }],
  8: [{ f: a(8), s: hold([0.0, 1.05, -2.3], [0.0, 1.0, 0.4], a(8), 0.002, 42) }],
  9: [{ f: a(9), s: hold([0.45, 1.55, 2.6], [0.15, 1.55, -1.0], a(9), 0.0016, 44, W("probably")) }],
  10: [{ f: a(10), s: hold([0.05, 1.55, 3.7], [0.0, 1.35, -0.3], a(10), 0.0016, 50) }],
  11: [{ f: a(11), s: hold([-0.1, 1.7, 9.6], [-0.1, 1.2, -0.6], a(11), 0.0012, 48) }],
  12: [{ f: a(12), s: hold([-2.6, 1.55, 7.4], [0.0, 1.2, -1.2], a(12), 0.0016, 46) }, { f: W("knife") - 3, cut: true, s: rolled(hold([1.0, 1.45, 0.7], [1.1, 1.25, -2.6], W("knife") - 3, 0.004, 40), -0.04) }],
  13: [{ f: a(13), s: hold([0, 1.4, 5.0], [0.5, 3.0, -20], a(13), 0.001, 52) }],
  14: [{ f: a(14), s: hold([0.4, 2.0, 6.6], [2.7, 1.6, -1.6], a(14), 0.0012, 50) }],
  15: [{ f: a(15), s: hold([-2.45, 2.0, 1.9], [-3.3, 1.85, -1.3], a(15), 0.002, 42, W("sun"), 0.006) }],
  16: [{ f: a(16), s: hold([0.4, 1.9, 5.4], [-2.2, 1.5, -0.8], a(16), 0.0014, 50) }, { f: W("guillotine") - 3, cut: true, s: rolled(hold([0.2, 2.1, 3.2], [-1.0, 2.4, -4.0], W("guillotine") - 3, 0.003, 50), 0.05) }],
  17: [{ f: a(17), s: hold([0.0, 1.5, 1.9], [0.0, 1.35, -1.3], a(17), 0.0016, 58, W("explodes"), 0.006) }],
  18: [{ f: a(18), s: hold([0.55, 1.3, 1.7], [-0.15, 1.55, -2.3], a(18), 0.0022, 54) }],
  19: [{ f: a(19), s: hold([0, 1.25, 5.2], [0, 1.9, -3.0], a(19), 0.0014, 48, W("hate")) }],
  20: [{ f: a(20), s: hold([0.3, 1.5, 4.2], [0.0, 1.55, -2.5], a(20), 0.0026, 42) }],
  21: [{ f: a(21), s: hold(HOOK_POS, HOOK_LOOK, a(21), 0.0012, 44, W("funeral2")) }],
};

const KICKS: [number, number][] = [[WORD.shoots, 0.9], [WORD.crying, 0.4], [WORD.mother, 0.4], [WORD.probably, 0.7], [WORD.fires, 1.2],
  [WORD.four, 0.5], [WORD.more, 0.5], [WORD.times, 0.5], [WORD.times + 0.42, 0.5], [WORD.sun, 0.5], [WORD.guillotine, 1.0], [WORD.explodes, 1.0], [WORD.hate, 0.6]];
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
  { f: 0, cInf: 0 },
  { f: a(2), cInf: 9, focus: () => eyesOf(M.vigilClerk, -0.45) },
  { f: a(3), cInf: 0 },
  { f: a(4), cInf: 10, focus: () => eyesOf(M.desk) },
  { f: a(5), cInf: 8, focus: () => eyesOf(M.vigilClerk, -0.45) },
  { f: a(6), cInf: 13, focus: () => eyesOf(M.vigilClerk, -0.45) },
  { f: a(7), cInf: 8, focus: () => [0.6, 0.55, -9.7] },
  { f: a(8), cInf: 12, focus: () => [0, 1.1, 0] },
  { f: a(9), cInf: 11, focus: () => eyesOf(M.flatMarie) },
  { f: a(10), cInf: 11, focus: () => eyesOf(M.ray) },
  { f: a(11), cInf: 0 },
  { f: a(12), cInf: 0 },
  { f: a(13), cInf: 0 },
  { f: a(14), cInf: 6, focus: () => eyesOf(M.pros) },
  { f: a(15), cInf: 13, focus: () => eyesOf(M.dock) },
  { f: a(16), cInf: 8, focus: () => eyesOf(M.pros16) },
  { f: a(17), cInf: 10, focus: () => eyesOf(M.cellClerk) },
  { f: a(18), cInf: 12, focus: () => eyesOf(M.bunk, -0.45) },
  { f: a(19), cInf: 7, focus: () => eyesOf(M.squareClerk) },
  { f: a(20), cInf: 9, focus: () => eyesOf(M.quiet) },
  { f: a(21), cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
