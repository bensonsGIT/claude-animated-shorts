import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Napoleon rabbit-hunt short: shots timed to the voice words (~/napoleon-short/voice/words.json); the house
// camera grammar (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: park.ts (the lawn round the origin, hutches at z -19, pavilion at x 7, the drive at x -11), tent.ts (x = 200) */
export type ShotSet = "park" | "tent";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const park = sh("park", "day", { sunAz: 140, sunEl: 40 }), morn = sh("park", "morning", { sunAz: 150, sunEl: 26 }), tent = sh("tent", "golden");
const END16 = W("field") + 14;
export const SHOTS: ShotDef[] = [
  tent(1, 0, cw("bunnies")), // "The man who conquered half of Europe once ran away from a thousand"
  park(2, cw("bunnies"), cf(1)), // "bunnies!" - a wall of rabbits charging the lens
  morn(3, cf(1), cf(2)), // "According to one of his own generals, it happened in the summer of 1806."
  park(4, cf(2), cf(3)), // "Napoleon was at the height of his power, and his court competed to keep him entertained."
  park(5, cf(3), cf(4)), // "His chief of staff, Marshal Berthier, offered a rabbit shoot on his estate just outside Paris."
  park(6, cf(4), cf(5)), // "The estate had everything, except rabbits."
  park(7, cf(5), cf(6)), // "So the marshal bought a thousand of them, and set them loose that very morning."
  park(8, cf(6), cf(7)), // "After a splendid breakfast, the Emperor raised his gun."
  park(9, cf(7), cw("bunched")), // "But the rabbits didn't run. They"
  park(10, cw("bunched"), cw("napoleon2")), // "bunched up, turned around, and charged straight at"
  park(11, cw("napoleon2"), cf(8)), // "Napoleon!"
  park(12, cf(8), cf(9)), // "The marshal counter-attacked with a squad of coachmen cracking long whips."
  park(13, cf(9), cw("split")), // "It worked, until the rabbits"
  park(14, cw("split"), cf(10)), // "split into wings, swept around both flanks, and hit the Emperor from behind!"
  park(15, cf(10), cf(11)), // "They piled up between his legs until he staggered."
  park(16, cf(11), END16), // "The conqueror of conquerors retreated to his carriage, and left the rabbits the field."
  park(17, END16, cf(12)), // (the rabbits hold the field)
  park(18, cf(12), cf(13)), // "Then the truth came out. The marshal's buyer didn't know one rabbit from another."
  park(19, cf(13), cf(14)), // "He'd bought tame hutch rabbits, not wild ones."
  park(20, cf(14), cf(15)), // "They thought Napoleon was the man with their cabbage, and nobody had fed them that day!"
  park(21, cf(15), cw("because")), // "Everyone laughed. The marshal was mortified,"
  tent(22, cw("because"), TOTAL), // "because..." -> loops into line 1
];
export const XFADE: Record<number, number> = { 4: 8, 6: 10, 7: 10, 8: 12, 12: 8, 16: 8, 18: 14, 19: 10, 20: 10, 21: 10, 22: 8 };
export const FLASH_AT = cf(1);

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
  nap: [0.4, 0, 1.0] as V3, ber: [-0.2, 0, 2.4] as V3,
  napTent: [200, 0, -2.3] as V3,
  seat: [7, 0, 6.2] as V3, berPav: [8.35, 0, 4.4] as V3,
  buyer: [-6.7, 0, -15.9] as V3, berBuyer: [-5.6, 0, -15.7] as V3, berHutch: [0.2, 0, -14.2] as V3, buyerHutch: [-1.9, 0, -15.7] as V3,
  coachStop: [-11, 0, 4] as V3,
  shame: [7.3, 0, 3.4] as V3,
};
const EYE = 1.6;
export const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

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
const M = MARK, N = M.nap;

const C = {
  s1: hold([200, 2.15, 1.25], [200, 1.15, -1.75], 44, 0, 0.0016),
  s2: (f: number): Shot => ({ pos: [0.4, 0.42, 0.6 - 0.02 * (f - cw("bunnies"))], look: [0.4, 0.55, -10], fov: 50 }),
  s3: hold([-6.2, 2.6, 15.5], [-11.0, 1.0, 6.5], 46, cf(1), 0.0008),
  s4: hold([N[0] + 0.25, 1.62, N[2] + 2.7], [N[0], 1.45, N[2]], 42, cf(2), 0.0016, W("entertained") - 2, 0.004),
  s5: hold([0.0, 1.6, 5.7], [0.1, 1.3, 1.4], 44, cf(3), 0.0014, W("rabbit") - 2, 0.004),
  s6a: hold([0, 1.5, 6.5], [-7, 1.0, -14], 46, cf(4), 0.0006),
  s6b: hold([0, 1.5, 6.5], [6, 1.0, -14], 46, cf(4), 0.0006),
  s7: hold([1.6, 1.9, -8.6], [-1.2, 0.6, -18.5], 48, cf(5), 0.0012, W("loose") - 2, 0.004),
  s8: hold([7.25, 1.5, 3.05], [7.0, 1.12, 6.2], 44, cf(6), 0.0014, W("raised") - 2),
  s9: hold([N[0], 1.25, N[2] - 0.6], [0, 0.35, -12], 46, cf(7), 0.0018, W("run") - 2, 0.004),
  s10: (f: number): Shot => ({ pos: [0.4, 0.45, -0.6 + 0.01 * Math.max(0, f - W("charged"))], look: [0.4, 0.6, -12], fov: 48 }),
  s11: hold([N[0] + 0.15, 1.5, N[2] - 2.5], [N[0], 1.45, N[2]], 44, cw("napoleon2"), 0.002, W("napoleon2") - 1, 0.008),
  s12: hold([-0.6, 1.45, -4.8], [-0.4, 1.2, 2.5], 46, cf(8), 0.0012),
  s13: hold([0.4, 4.2, -9.5], [0.4, 0.6, 0.5], 48, cf(9), 0.001),
  s14: hold([0.4, 10.5, -13.5], [0.4, 0.0, -1.2], 50, cw("split"), 0.0008, W("behind") - 2, 0.006),
  s15: hold([N[0] + 0.1, 0.75, N[2] - 2.3], [N[0], 0.95, N[2]], 46, cf(10), 0.0016, W("staggered") - 2, 0.006),
  s16: hold([-5.0, 2.0, 11.0], [-11.2, 1.1, 2.6], 46, cf(11), 0.001),
  s17: hold([0.2, 0.9, 4.2], [0.2, 0.6, -4], 46, END16, 0.0014),
  s18: hold([-6.1, 1.6, -12.3], [-6.1, 1.3, -15.8], 44, cf(12), 0.0014, W("another") - 2, 0.004),
  s19: hold([-1.1, 1.25, -15.4], [-1.3, 0.2, -17.4], 40, cf(13), 0.002, W("tame") - 2, 0.004),
  s20: hold([0.55, 0.5, -8.6], [0.6, 1.0, 0.8], 46, cf(14), 0.0014, W("cabbage") - 2, 0.004),
  s21: hold([7.0, 1.6, 0.6], [7.0, 1.3, 5.5], 44, cf(15), 0.0014, W("mortified") - 2, 0.006),
  s22: hold([200, 2.15, 1.25], [200, 1.15, -1.75], 44, cw("because"), 0.0016),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }], 2: [{ f: cw("bunnies"), s: C.s2 }], 3: [{ f: cf(1), s: C.s3 }], 4: [{ f: cf(2), s: C.s4 }], 5: [{ f: cf(3), s: C.s5 }],
  6: [{ f: cf(4), s: C.s6a }, { f: cf(4) + 4, dur: Math.max(30, cf(5) - cf(4) - 8), s: C.s6b }],
  7: [{ f: cf(5), s: C.s7 }], 8: [{ f: cf(6), s: C.s8 }], 9: [{ f: cf(7), s: C.s9 }], 10: [{ f: cw("bunched"), s: C.s10 }], 11: [{ f: cw("napoleon2"), s: C.s11 }],
  12: [{ f: cf(8), s: C.s12 }], 13: [{ f: cf(9), s: C.s13 }], 14: [{ f: cw("split"), s: C.s14 }], 15: [{ f: cf(10), s: C.s15 }], 16: [{ f: cf(11), s: C.s16 }],
  17: [{ f: END16, s: C.s17 }], 18: [{ f: cf(12), s: C.s18 }], 19: [{ f: cf(13), s: C.s19 }], 20: [{ f: cf(14), s: C.s20 }], 21: [{ f: cf(15), s: C.s21 }],
  22: [{ f: cw("because"), s: C.s22 }],
};
const KICKS: [number, number][] = [[WORD.bunnies, 0.8], [WORD.charged, 0.9], [WORD.cracking, 0.6], [WORD.behind, 0.9], [WORD.staggered, 0.6], [WORD.field, 0.4], [WORD.mortified, 0.6]];
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
export const DOF: Dof[] = [
  { f: 0, cInf: 6, focus: () => eyesOf(M.napTent, -0.1) },
  { f: cw("bunnies"), cInf: 4, focus: () => [0.4, 0.4, -4] },
  { f: cf(1), cInf: 0 },
  { f: cf(2), cInf: 9, focus: () => eyesOf(N) },
  { f: cf(3), cInf: 7, focus: () => eyesOf(M.ber, -0.2) },
  { f: cf(4), cInf: 2, focus: () => [0, 1, -12] },
  { f: cf(5), cInf: 4, focus: () => [-1, 0.6, -17] },
  { f: cf(6), cInf: 8, focus: () => eyesOf(M.seat, -0.4) },
  { f: cf(7), cInf: 4, focus: () => [0, 0.3, -10] },
  { f: cw("bunched"), cInf: 6, focus: () => [0.4, 0.4, -6] },
  { f: cw("napoleon2"), cInf: 9, focus: () => eyesOf(N) },
  { f: cf(8), cInf: 6, focus: () => [-0.4, 1.5, 0.5] },
  { f: cf(9), cInf: 2, focus: () => [0.4, 0.6, 0] },
  { f: cw("split"), cInf: 1, focus: () => [0.4, 0.4, 0] },
  { f: cf(10), cInf: 8, focus: () => [N[0], 0.9, N[2]] },
  { f: cf(11), cInf: 3, focus: () => [-10, 1.2, 3.5] },
  { f: END16, cInf: 6, focus: () => [0.2, 0.4, 1.4] },
  { f: cf(12), cInf: 8, focus: () => eyesOf(M.buyer, -0.2) },
  { f: cf(13), cInf: 10, focus: () => [-1.3, 0.3, -18.0] },
  { f: cf(14), cInf: 7, focus: () => [0.9, 0.5, -7.2] },
  { f: cf(15), cInf: 7, focus: () => eyesOf(M.shame, -0.1) },
  { f: cw("because"), cInf: 6, focus: () => eyesOf(M.napTent, -0.1) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
