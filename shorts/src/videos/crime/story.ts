import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Crime and Punishment short: shots timed to the voice words (~/crime-short/voice/words.json); camera
// grammar of the house style (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: petersburg.ts (canal street at x 0, courtyard at x 60, Haymarket at x -70), rooms.ts (garret, pawn + landing at
 *  x 12, office, sonya), siberia.ts */
export type ShotSet = "pb" | "garret" | "pawn" | "office" | "sonya" | "siberia";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const yard = sh("pb", "day", { sunAz: 140, sunEl: 38 }), street = sh("pb", "day", { sunAz: 145, sunEl: 36 }), garret = sh("garret", "morning"), fever = sh("garret", "dark");
const pawn = sh("pawn", "sun"), office = sh("office", "sun"), sonya = sh("sonya", "night"), snowy = sh("siberia", "day", { sunAz: 60, sunEl: 25 });
export const SHOTS: ShotDef[] = [
  yard(1, 0, cf(1)), // "A broke student killed a pawnbroker to prove he was a genius, then never spent a single kopek!"
  street(2, cf(1), cw("cupboard")), // "It's 1865 in St. Petersburg, and Rodion Raskolnikov lives in a room the size of a"
  garret(3, cw("cupboard"), cf(3)), // "cupboard. This is Crime and Punishment, by Fyodor Dostoevsky."
  garret(4, cf(3), cf(4)), // "He has a theory: extraordinary men, like Napoleon, are allowed to step over the law."
  yard(5, cf(4), cw("visits")), // "So he takes an axe from the porter's lodge and"
  pawn(6, cw("visits"), cf(5)), // "visits the old pawnbroker."
  pawn(7, cf(5), cf(6)), // "But her sister Lizaveta walks in, and he kills her too!"
  yard(8, cf(6), cf(7)), // "He hides the loot under a stone in a courtyard, and never even checks how much he took."
  fever(9, cf(7), cf(8)), // "Then he falls into a fever for days."
  office(10, cf(8), cf(9)), // "A detective named Porfiry plays cat and mouse with him, but never quite arrests him."
  office(11, cf(9), cf(10)), // "Then a house painter confesses to the murders instead!"
  street(12, cf(10), cf(11)), // "Raskolnikov could have walked free."
  sonya(13, cf(11), cf(12)), // "Instead, he confesses to Sonya, a poor girl forced onto the streets to feed her family."
  sonya(14, cf(12), cf(13)), // "She tells him to kiss the ground at the crossroads and turn himself in."
  street(15, cf(13), cw("gets")), // "He does, and" (the Haymarket)
  office(16, cw("gets"), cw("siberia")), // "gets eight years of hard labor in"
  snowy(17, cw("siberia"), cf(14)), // "Siberia!"
  snowy(18, cf(14), cf(15)), // "Sonya follows him there."
  snowy(19, cf(15), TOTAL), // "He set out to prove he was Napoleon, and decided he was a louse!"
];
export const XFADE: Record<number, number> = { 2: 10, 3: 8, 4: 8, 5: 12, 6: 10, 8: 12, 9: 14, 10: 12, 12: 12, 13: 14, 15: 12, 18: 12, 19: 10 };
export const FLASH_AT = cf(1);
/** overlays (index.tsx): snowfall in Siberia, a fever wobble */
export const SNOW = new Set([17, 18, 19]);
export const FEVER = new Set([9]);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- staging marks ----------------
export const MARK = {
  yardR: [59.15, 0, -1.0] as V3, lodgeR: [55.0, 0, -0.9] as V3,
  walkStreet: [-2.6, 0, -0.8] as V3, rail: [0, 0, 1.45] as V3,
  sofa: [-0.25, 0.02, -1.12] as V3, standUp: [-0.25, 0, -0.85] as V3,
  landingR: [12.85, 0, 0.55] as V3,
  lizaveta: [1.9, 0, 0.25] as V3,
  suspect: [-0.42, 0, -0.1] as V3, porfiry: [0.7, 0, -0.5] as V3, mikolka: [0.85, 0, 0.45] as V3,
  clerk: [-1.6, 0, -1.85] as V3, confessR: [-0.5, 0, 0.35] as V3,
  sonya: [0.2, 0, -0.35] as V3, sonyaR: [1.05, 0, -0.25] as V3,
  kneel: [-70, 0, 1.4] as V3,
  convict: [-3.0, 0, 2.7] as V3, sonyaGate: [0, 0, -4.7] as V3, last: [1.0, 0, 2.0] as V3,
};
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
/** set poses: the courtyard stone lifted, the pawnbroker's door on its chain, her icon lamp */
export const stoneAt = (id: number, t: number) =>
  id === 1 ? (t < WORD.genius - 0.9 ? smooth((t - 0.2) / 0.5) : 1 - smooth((t - WORD.genius + 0.25) / 0.25))
  : id === 8 ? (t < WORD.checks ? smooth((t - WORD.stone + 0.7) / 0.5) * (1 - smooth((t - WORD.checks + 0.3) / 0.25)) : 0) : 0;
export const doorAt = (id: number, t: number) => (id === 6 ? smooth((t - WORD.old + 0.3) / 0.35) : 0);
export const lampAt = (id: number, t: number) => !(id === 7 && t >= WORD.too - 0.05);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
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
const hold = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0012, pf?: number, punch = 0.006) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate) * (pf !== undefined ? pushK(f, pf, 0, punch, 30) : 1), { fov });
/** the fever: the room sways */
const sway = (s: (f: number) => Shot) => (f: number): Shot => ({ ...s(f), roll: 0.05 * Math.sin(f / 9) });

const C = {
  s1: hold([60.45, 1.05, 3.0], [59.4, 0.85, -1.2], 46, 0, 0.0012, W("kopek") - 2, 0.004),
  s2: hold([-7.2, 2.6, 6.4], [2.0, 1.9, -3.0], 44, cf(1), 0.0012),
  s3: hold([0.05, 1.35, 3.0], [-0.15, 1.05, -1.0], 46, cw("cupboard"), 0.0016, W("dostoevsky") - 2),
  s4: hold([0.2, 1.4, 3.0], [0.1, 1.25, -1.0], 44, cf(3), 0.0014),
  s5: hold([58.0, 1.5, 1.6], [54.4, 1.25, -2.0], 44, cf(4), 0.0014, W("axe") - 2),
  s6: hold([12.35, 1.55, 3.9], [12.6, 1.3, -0.8], 44, cw("visits"), 0.0018, W("old") - 2),
  s7a: hold([0.7, 1.5, 3.8], [1.75, 1.2, -0.2], 44, cf(5), 0.0016),
  s7b: hold([-0.8, 1.45, 1.4], [-1.2, 1.45, -2.2], 42, W("too") - 2, 0.002),
  s8: hold([60.7, 1.35, 2.9], [59.6, 0.75, -1.4], 44, cf(6), 0.0014, W("checks") - 2),
  s9: sway(hold([0.1, 1.25, 2.6], [-0.2, 1.0, -1.0], 44, cf(7), 0.0022)),
  s10: hold([0.0, 1.62, 4.1], [0.0, 1.3, -0.6], 44, cf(8), 0.0012, W("arrests") - 2, 0.004),
  s11: hold([0.2, 1.62, 4.1], [0.3, 1.2, -0.4], 44, cf(9), 0.0012, W("confesses") - 2),
  s12: hold([0.25, 1.6, -2.6], [0.0, 1.45, 4.0], 42, cf(10), 0.0016, W("free") - 2, 0.004),
  s13: hold([0.62, 1.5, 3.9], [0.62, 1.2, -0.7], 44, cf(11), 0.0014, W("confesses2") - 2, 0.004),
  s14: hold([0.3, 1.55, 2.3], [0.2, 1.42, -0.5], 40, cf(12), 0.0018),
  s15: hold([-69.7, 1.5, 4.9], [-70, 0.95, 0.9], 44, cf(13), 0.0014, W("does") - 2),
  s16: hold([-0.75, 1.6, 3.7], [-1.05, 1.2, -1.0], 44, cw("gets"), 0.0016, W("years") - 2),
  s17: hold([-2.6, 1.6, 7.6], [-4.0, 1.3, 1.5], 46, cw("siberia"), 0.0016),
  s18: hold([1.6, 1.8, 6.6], [0.2, 1.5, -4.5], 44, cf(14), 0.0012),
  s19: hold([1.2, 1.65, 4.6], [1.0, 1.55, 2.0], 40, cf(15), 0.0018, W("louse") - 2, 0.005),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }], 2: [{ f: cf(1), s: C.s2 }], 3: [{ f: cw("cupboard"), s: C.s3 }], 4: [{ f: cf(3), s: C.s4 }],
  5: [{ f: cf(4), s: C.s5 }], 6: [{ f: cw("visits"), s: C.s6 }], 7: [{ f: cf(5), s: C.s7a }, { f: W("too") - 2, cut: true, s: C.s7b }],
  8: [{ f: cf(6), s: C.s8 }], 9: [{ f: cf(7), s: C.s9 }], 10: [{ f: cf(8), s: C.s10 }], 11: [{ f: cf(9), s: C.s11 }],
  12: [{ f: cf(10), s: C.s12 }], 13: [{ f: cf(11), s: C.s13 }], 14: [{ f: cf(12), s: C.s14 }], 15: [{ f: cf(13), s: C.s15 }],
  16: [{ f: cw("gets"), s: C.s16 }], 17: [{ f: cw("siberia"), s: C.s17 }], 18: [{ f: cf(14), s: C.s18 }], 19: [{ f: cf(15), s: C.s19 }],
};
const KICKS: [number, number][] = [[WORD.genius, 0.5], [WORD.kopek, 0.6], [WORD.dostoevsky, 0.7], [WORD.too, 0.9], [WORD.years, 0.8], [WORD.siberia, 0.6], [WORD.louse, 0.4]];
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
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const M = MARK;
export const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: () => [59.8, 0.6, -1.4] },
  { f: cf(1), cInf: 0 },
  { f: cw("cupboard"), cInf: 8, focus: () => eyesOf(M.standUp, -0.4) },
  { f: cf(4), cInf: 8, focus: () => eyesOf(M.lodgeR) },
  { f: cw("visits"), cInf: 9, focus: () => [12.3, 1.45, -0.9] },
  { f: cf(5), cInf: 9, focus: () => eyesOf(M.lizaveta) },
  { f: cf(6), cInf: 9, focus: () => [59.8, 0.5, -1.5] },
  { f: cf(7), cInf: 10, focus: () => eyesOf(M.sofa, -0.45) },
  { f: cf(8), cInf: 9, focus: () => eyesOf(M.suspect) },
  { f: cf(10), cInf: 11, focus: () => eyesOf(M.rail) },
  { f: cf(11), cInf: 10, focus: () => eyesOf(M.sonya) },
  { f: cf(13), cInf: 6, focus: () => [M.kneel[0], 1.0, M.kneel[2]] },
  { f: cw("gets"), cInf: 9, focus: () => eyesOf(M.confessR) },
  { f: cw("siberia"), cInf: 6, focus: () => eyesOf(M.convict) },
  { f: cf(14), cInf: 4, focus: () => eyesOf(M.sonyaGate) },
  { f: cf(15), cInf: 12, focus: () => eyesOf(M.last) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
