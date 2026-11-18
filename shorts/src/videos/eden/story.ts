import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the East of Eden short: shots timed to the voice words (couch.potato.history/east-of-eden-short/voice/words.json).
// Camera grammar from the house style: continuous slow push-ins, ease-in-out moves, big reframes are cuts, 7-frame flip kicks.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "ranch" | "pass" | "dining" | "parlour" | "bedroom" | "nursery";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; boxcar?: boolean; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const S = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const field = S("ranch", "day"), sunset = S("ranch", "golden"), ranch = S("ranch", "day"), car = S("ranch", "day", { boxcar: true });
const pass = S("pass", "morning", { sunEl: 30 }), dine = S("dining", "sun"), dineN = S("dining", "night", { night: true });
const parlour = S("parlour", "dark"), bed = S("bedroom", "moon"), nursery = S("nursery", "night");
export const SHOTS: ShotDef[] = [
  field(1, 0, cf(1)), // "A teenager made fifteen thousand dollars on beans, just so his father would love him."
  dine(2, cf(1), cf(2)), // "His father turned it down!"
  field(3, cf(2), cf(3)), // "This is East of Eden, by John Steinbeck, a retelling of Cain and Abel."
  field(4, cf(3), cf(4)), // "In Salinas, California, Adam Trask has twin sons: golden Aron ... and dark, jealous Cal."
  nursery(5, cf(4), cf(5)), // "Their mother shot Adam and walked out on the newborn twins."
  dine(6, cf(5), cf(6)), // "He told the boys she was dead."
  parlour(7, cf(6), cf(7)), // "Cal finds her alive, running a brothel across town!"
  parlour(8, cf(7), cf(8)), // "He fears her badness is in his blood."
  car(9, cf(8), cf(9)), // "Then Adam shipped a train of lettuce, packed in ice, across the country."
  pass(10, cf(9), cw("six")), // "Snow blocked the mountains, and"
  pass(11, cw("six"), cf(10)), // "six carloads of lettuce rotted!"
  field(12, cf(10), cf(11)), // "So Cal bets on wartime beans and earns the loss back."
  dine(13, cf(11), cf(12)), // "He gift-wraps it for Thanksgiving."
  dine(14, cf(12), cf(13)), // "Adam calls it war profit, and tells him to give it back."
  dine(15, cf(13), cf(14)), // "He only wishes Cal were more like his brother."
  dineN(16, cf(14), cw("and7")), // "So Cal burns the cash,"
  parlour(17, cw("and7"), cf(15)), // "and takes Aron to meet Mom at the brothel!"
  ranch(18, cf(15), cf(16)), // "Aron runs off and joins the army."
  parlour(19, cf(16), cf(17)), // "Their mother poisons herself, and leaves him everything."
  ranch(20, cf(17), cf(18)), // "Then Aron is killed in France."
  ranch(21, cf(18), cf(19)), // "The telegram gives Adam a stroke."
  dineN(22, cf(19), cf(20)), // "But Lee, the family's cook, spent years studying one Hebrew word from the Cain story: timshel."
  bed(23, cf(20), cf(21)), // "It means sin is not destiny: you may choose to beat it."
  bed(24, cf(21), cf(22)), // "Paralyzed, Adam blesses Cal with that one word."
  sunset(25, cf(22), cf(23)), // "Steinbeck's point: you inherit your family's sins, but never your choices."
  field(26, cf(23), TOTAL), // "All because a teenager tried to buy his father's love."
];
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 3: 10, 5: 12, 6: 12, 7: 12, 9: 12, 10: 12, 12: 12, 13: 10, 16: 12, 17: 10, 18: 12, 19: 12, 20: 12, 21: 10, 22: 16, 23: 14, 25: 18, 26: 12 };
/** white 4-frame flash after the hook */
export const FLASH_AT = cf(2);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** full-frame flashes: the gunshot in the nursery (a 0.2 s white pop) */
export const glareAt = (f: number) => {
  const d = f / FPS - WORD.shot;
  return d >= -0.03 && d < 0.22 ? 0.8 * (1 - d / 0.22) : 0;
};
/** the stroke: the picture dims to black over the last 0.4 s of shot 21 */
export const blackAt = (f: number) => {
  const e = SHOTS[20].b, n = 12;
  return f >= e - n - 5 && f < e ? smooth((f - (e - n - 5)) / n) : 0;
};

// ---------------- staging marks (x, floor y, z) ----------------
export const MARK = {
  // ranch: yard round the origin, bean rows from x -1 back, farmhouse at (-6.5, -12) with its porch at z -9..-7.4
  hook: [0, 0, 0] as V3,
  aron4: [-0.55, 0, 0.3] as V3, cal4: [0.8, 0, -1.3] as V3,
  boy1: [-3.9, 0, -6.4] as V3, boy2: [-3.1, 0, -6.6] as V3,
  adamCar: [2.0, 0, -1.7] as V3,
  calField: [0.1, 0, -0.4] as V3, farmers: [[-1.3, 0, -0.9], [1.4, 0, -0.95], [2.3, 0, -1.5]] as V3[],
  armyA: [-1.0, 0, -8.0] as V3, armyB: [2.0, 0, 3.4] as V3, cross: [-0.25, 0, -1.2] as V3,
  porchAdam: [-6.2, 0.2, -8.0] as V3, wireBoy: [-5.1, 0, -6.6] as V3,
  quiet: [0, 0, -0.6] as V3,
  // nursery
  cathy: [-1.3, 0, -1.4] as V3, cathyOut: [-2.6, 0, 3.0] as V3,
  // dining: seats behind the table (Cal left, Adam centre, Aron right), the stove in the right corner
  calSeat: [-0.9, 0.18, -1.9] as V3, adamSeat: [0, 0.18, -1.9] as V3, aronSeat: [0.9, 0.18, -1.9] as V3,
  calEnd: [-2.05, 0, -1.15] as V3, calStove: [1.75, 0, -2.2] as V3,
  // parlour: Kate on the settee's front edge, the doorway at x -1.8..-0.7 in the back wall (z -3.6)
  kate: [0.8, 0, -1.05] as V3, door: [-1.25, 0, -3.25] as V3, doorCal: [-1.55, 0, -3.2] as V3, doorAron: [-0.95, 0, -3.0] as V3,
  // bedroom: Adam propped up in bed, Lee to the left, Cal to the right
  bedAdam: [0, 0.28, -2.35] as V3, lee: [-1.0, 0, -0.6] as V3, calBed: [1.0, 0, -0.6] as V3,
};
const M = MARK;
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
const SIT = -0.45;
/** the train's nose x on the Sierra trestle: rolls in and stops short of the slide on "blocked" */
export const noseAt = (t: number) => {
  const t0 = BEAT[9] - 0.6, t1 = WORD.blocked + 0.5;
  const u = clamp01((t - t0) / (t1 - t0));
  return -26 + 32 * (1 - (1 - u) * (1 - u));
};
/** the snowslide 0..1: falls on "blocked" */
export const slideAt = (t: number) => clamp01((t - (WORD.blocked - 0.35)) / 0.55);
/** Kate's lamp dies out over the poison line */
export const lampAt = (id: number, t: number) => (id === 19 ? 1 - smooth((t - WORD.poisons) / Math.max(0.5, WORD.everything - WORD.poisons + 0.4)) : 1);
/** the parlour door: opens at the start of shots 7 and 17 */
export const doorAt = (id: number, t: number) => (id === 7 || id === 8 || id === 17 ? (id === 8 ? 1 : smooth((t - SHOTS[id - 1].a / FPS - 0.05) / 0.45)) : 0);

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
const HOOK_POS: V3 = [0.45, 1.35, 4.4], HOOK_LOOK: V3 = [0, 1.45, -2.0];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(HOOK_POS, HOOK_LOOK, 0, 0.0012, 44, W("beans")) }],
  2: [{ f: a(2), s: rolled(hold([0.7, 1.5, 2.4], [-0.6, 1.15, -1.4], a(2), 0.0018, 48, W("down")), 0.03) }],
  3: [{ f: a(3), s: hold([3.0, 1.7, 6.0], [-4.0, 2.2, -10.0], a(3), 0.0008, 46) }, { f: W("retelling") - 6, dur: 40, s: hold([3.0, 4.2, 7.5], [-4.0, 2.6, -10.0], W("retelling") - 6, 0.0008, 46) }],
  4: [{ f: a(4), s: hold([0.15, 1.5, 3.9], [0.15, 1.35, -0.8], a(4), 0.0016, 44, W("golden")) }, { f: W("dark") - 3, cut: true, s: rolled(hold([0.95, 1.6, 0.9], [0.8, 1.55, -1.3], W("dark") - 3, 0.003, 40), -0.04) }],
  5: [{ f: a(5), s: hold([0.4, 1.5, 2.8], [-0.4, 1.1, -1.8], a(5), 0.0016, 50, W("shot"), 0.007) }],
  6: [{ f: a(6), s: hold([0.0, 1.45, 2.1], [0.0, 1.15, -1.6], a(6), 0.0018, 52, W("dead")) }],
  7: [{ f: a(7), s: hold([0.15, 1.5, 3.2], [-0.1, 1.3, -2.0], a(7), 0.0014, 52) }, { f: W("brothel") - 3, cut: true, s: rolled(hold([1.05, 1.3, 1.1], [0.8, 1.1, -1.05], W("brothel") - 3, 0.003, 42), 0.04) }],
  8: [{ f: a(8), s: hold([-0.95, 1.6, -0.9], [-1.4, 1.5, -3.25], a(8), 0.0026, 44, W("blood"), 0.006) }],
  9: [{ f: a(9), s: hold([3.6, 1.7, 4.2], [0.9, 1.55, -2.4], a(9), 0.0016, 50, W("lettuce")) }],
  10: [{ f: a(10), s: hold([25, 12, 25], [1.5, 3.2, -8], a(10), 0.0008, 50, W("blocked"), 0.004) }],
  11: [{ f: a(11), s: hold([-4.4, 4.8, -2.6], [-6.0, 4.2, -6.7], a(11), 0.002, 46, W("rotted"), 0.006) }],
  12: [{ f: a(12), s: hold([0.3, 1.5, 3.8], [0.4, 1.2, -1.0], a(12), 0.0016, 48, W("wartime")) }],
  13: [{ f: a(13), s: hold([-0.4, 1.45, 1.9], [-0.4, 1.1, -1.6], a(13), 0.002, 48, W("thanksgiving")) }],
  14: [{ f: a(14), s: hold([0.15, 1.4, 1.5], [0.0, 1.2, -1.9], a(14), 0.0018, 44, W("profit")) }, { f: W("give") - 3, cut: true, s: hold([-0.2, 1.45, 2.0], [-0.45, 1.15, -1.7], W("give") - 3, 0.0024, 48) }],
  15: [{ f: a(15), s: hold([0.85, 1.5, 1.9], [0.65, 1.3, -1.9], a(15), 0.0018, 46, W("brother")) }],
  16: [{ f: a(16), s: hold([0.3, 1.4, 0.8], [2.2, 1.0, -2.5], a(16), 0.0024, 46, W("burns"), 0.006) }],
  17: [{ f: a(17), s: hold([0.4, 1.55, 3.0], [-0.4, 1.35, -2.2], a(17), 0.0016, 52) }, { f: W("mom") - 3, cut: true, s: rolled(hold([-0.6, 1.6, -0.6], [-0.95, 1.55, -3.0], W("mom") - 3, 0.003, 42), -0.04) }],
  18: [{ f: a(18), s: hold([0.2, 1.45, 5.6], [-0.4, 1.35, -5.0], a(18), 0.0012, 44) }],
  19: [{ f: a(19), s: hold([0.75, 1.4, 1.9], [0.8, 1.15, -1.2], a(19), 0.002, 46) }],
  20: [{ f: a(20), s: hold([0.3, 1.2, 2.6], [-0.25, 0.2, -1.2], a(20), 0.0026, 42, W("france")) }],
  21: [{ f: a(21), s: hold([-4.2, 1.55, -3.5], [-5.9, 1.45, -8.0], a(21), 0.0018, 44) }, { f: W("stroke") - 3, cut: true, s: rolled(hold([-5.7, 1.75, -6.6], [-6.2, 1.75, -8.0], W("stroke") - 3, 0.003, 40), 0.05) }],
  22: [{ f: a(22), s: hold([0.0, 1.5, 1.9], [0.0, 1.15, -1.7], a(22), 0.0016, 46, W("timshel")) }],
  23: [{ f: a(23), s: hold([0.0, 1.6, 3.4], [0.0, 1.25, -1.5], a(23), 0.0012, 58) }],
  24: [{ f: a(24), s: hold([0.45, 1.35, 0.4], [0.05, 1.2, -2.35], a(24), 0.0022, 44, W("word2")) }],
  25: [{ f: a(25), s: hold([0.3, 1.5, 3.6], [0.0, 1.55, -2.5], a(25), 0.0026, 42) }],
  26: [{ f: a(26), s: hold(HOOK_POS, HOOK_LOOK, a(26), 0.0012, 44, W("buy")) }],
};

const KICKS: [number, number][] = [[WORD.down, 1.0], [WORD.shot, 0.9], [WORD.brothel, 0.8], [WORD.blocked, 1.2], [WORD.rotted, 0.6],
  [WORD.profit, 0.4], [WORD.burns, 0.6], [WORD.mom, 1.0], [WORD.stroke, 1.0]];
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
  { f: 0, cInf: 7, focus: () => eyesOf(M.hook) },
  { f: a(2), cInf: 10, focus: () => eyesOf(M.adamSeat, SIT) },
  { f: a(3), cInf: 0 },
  { f: a(4), cInf: 10, focus: () => eyesOf(M.aron4) },
  { f: W("dark") - 3, cInf: 13, focus: () => eyesOf(M.cal4) },
  { f: a(5), cInf: 9, focus: () => eyesOf(M.cathy) },
  { f: a(6), cInf: 9, focus: () => eyesOf(M.adamSeat, SIT) },
  { f: a(7), cInf: 8, focus: () => eyesOf(M.kate, SIT) },
  { f: a(8), cInf: 13, focus: () => eyesOf(M.doorCal) },
  { f: a(9), cInf: 9, focus: () => eyesOf(M.adamCar) },
  { f: a(10), cInf: 0 },
  { f: a(11), cInf: 8, focus: () => [-6.0, 4.2, -6.7] },
  { f: a(12), cInf: 9, focus: () => eyesOf(M.calField) },
  { f: a(13), cInf: 10, focus: () => eyesOf(M.calSeat, SIT) },
  { f: a(14), cInf: 11, focus: () => eyesOf(M.adamSeat, SIT) },
  { f: a(15), cInf: 10, focus: () => eyesOf(M.aronSeat, SIT) },
  { f: a(16), cInf: 11, focus: () => eyesOf(M.calStove) },
  { f: a(17), cInf: 8, focus: () => eyesOf(M.doorAron) },
  { f: a(18), cInf: 6, focus: () => eyesOf(M.armyB) },
  { f: a(19), cInf: 11, focus: () => eyesOf(M.kate, SIT) },
  { f: a(20), cInf: 9, focus: () => [M.cross[0], 0.1, M.cross[2]] },
  { f: a(21), cInf: 9, focus: () => eyesOf(M.porchAdam) },
  { f: a(22), cInf: 10, focus: () => eyesOf(M.adamSeat, SIT) },
  { f: a(23), cInf: 8, focus: () => eyesOf(M.bedAdam, SIT) },
  { f: a(24), cInf: 13, focus: () => eyesOf(M.bedAdam, SIT) },
  { f: a(25), cInf: 9, focus: () => eyesOf(M.quiet) },
  { f: a(26), cInf: 7, focus: () => eyesOf(M.hook) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
