import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Gambler short (Dostoyevsky, 1866): shots timed to the voice words (~/gambler-short/voice/words.json); the
// house camera grammar (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: spa.ts (the hotel verandah + square round the origin), casino.ts (x 100), rooms.ts (Paris x 200, cell x 240, study x 280) */
export type ShotSet = "spa" | "casino" | "rooms";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const day = sh("spa", "day", { sunAz: 140, sunEl: 40 }), gold = sh("spa", "golden", { sunAz: 150, sunEl: 14 });
const casino = sh("casino", "night"), paris = sh("rooms", "sun"), cell = sh("rooms", "dark"), study = sh("rooms", "night");
export const SHOTS: ShotDef[] = [
  day(1, 0, cf(1)), // "A whole family in a German casino town was waiting for Granny to die."
  day(2, cf(1), cf(2)), // "The broke General needed her fortune to marry a French beauty called Blanche."
  day(3, cf(2), cf(3)), // "Then Granny arrived, very much alive, carried in her armchair!"
  casino(4, cf(3), cf(4)), // "This is The Gambler, by Fyodor Dostoyevsky."
  casino(5, cf(4), cf(5)), // "She went straight to the roulette table and bet on zero."
  casino(6, cf(5), cw("again")), // "Zero hit, and then hit"
  casino(7, cw("again"), cf(6)), // "again!"
  casino(8, cf(6), cf(7)), // "Two days later, she'd lost nearly a hundred thousand roubles."
  casino(9, cf(7), cw("red")), // "Then the family's tutor sat down, and"
  casino(10, cw("red"), cf(8)), // "red came up again and again."
  casino(11, cf(8), cf(9)), // "He broke the bank: two hundred thousand francs!"
  paris(12, cf(9), cf(10)), // "Blanche took him to Paris, and in three weeks the money was gone."
  paris(13, cf(10), cw("and6")), // "Months later, Granny finally died,"
  paris(14, cw("and6"), cf(11)), // "and the General got his inheritance."
  paris(15, cf(11), cf(12)), // "Then he died of a stroke, and his new wife, Blanche, kept every franc!"
  cell(16, cf(12), cw("then5")), // "The tutor ended up in debtors' prison,"
  paris(17, cw("then5"), cf(13)), // "then working as a footman."
  study(18, cf(13), cf(14)), // "The author, a gambler himself, dictated this book in twenty-six days to beat a deadline."
  study(19, cf(14), cf(15)), // "Then he married the stenographer."
  gold(20, cf(15), TOTAL), // "The tutor got ten gold coins from a friend, and started waiting all over again." -> loops into line 1
];
export const XFADE: Record<number, number> = { 4: 10, 8: 12, 12: 10, 13: 10, 16: 10, 18: 12, 20: 14 };
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
const VY = 0.6; // the verandah floor (spa.ts VER_Y)
export const MARK = {
  gen: [-0.75, VY, -0.9] as V3, blanche: [0.12, VY, -1.5] as V3, tutorSeat: [0.85, VY, -2.6] as V3, astley: [-0.15, VY, -2.3] as V3,
  /** Granny's chair in the casino, the croupier, the tutor's seat at the layout end; the crowd stands behind (z < -2) */
  grannyC: [99.1, 0, -1.3] as V3, croup: [100.0, 0, -1.4] as V3, tutorC: [101.0, 0, -1.3] as V3,
  wheel: [98.75, 0.832, 0] as V3,
  blancheP: [199.5, 0, -1.4] as V3, tutorP: [200.75, 0, -1.0] as V3, genP: [199.3, 0, -1.2] as V3, portrait: [198.2, 2.55, -3.9] as V3,
  tutorCell: [240.15, 0, -0.5] as V3, lackey: [201.4, 0, -1.3] as V3,
  dosto: [279.3, 0, -0.7] as V3, anna: [281.5, 0, -1.05] as V3, pages: [280.98, 0.7, -0.62] as V3,
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
const M = MARK, WH = M.wheel;

const S1: [V3, V3, number] = [[0.1, 1.95, 3.9], [0.1, 1.5, -1.6], 44];
/** the overhead wheel insert: straight down onto the wheel, a slight roll */
const wheelCam = (f0: number, rate = 0.002, pf?: number) => (f: number): Shot => ({ ...hold([WH[0] + 0.08, WH[1] + 3.1, WH[2] + 0.75], WH, 42, f0, rate, pf, 0.008)(f), roll: 0.08 });
const C = {
  s1: hold(S1[0], S1[1], S1[2], 0, 0.0016, W("die") - 2, 0.007),
  s2: hold([-0.3, 2.1, 2.9], [-0.3, 1.85, -1.2], 42, cf(1), 0.0016, W("blanche") - 2, 0.005),
  s3: hold([0.25, 2.9, -6.2], [0.0, 1.0, 2.6], 46, cf(2), 0.0012, W("alive") - 2, 0.006),
  s4: wheelCam(cf(3), 0.0024),
  s5: hold([99.6, 1.4, 3.6], [99.55, 1.2, -1.0], 44, cf(4), 0.0016, W("zero") - 2, 0.006),
  s6: wheelCam(cf(5), 0.003, W("hit") - 2),
  s7: hold([99.35, 1.3, 1.9], [99.25, 1.3, -1.3], 42, cw("again"), 0.0018),
  s8: hold([99.4, 1.3, 2.3], [99.2, 1.25, -1.3], 42, cf(6), 0.0014, W("roubles") - 2, 0.005),
  s9: hold([100.6, 1.65, 3.4], [100.6, 1.1, -1.3], 44, cf(7), 0.0016),
  s10: wheelCam(cw("red"), 0.003),
  s11: hold([100.7, 1.5, 2.6], [100.7, 1.3, -1.3], 46, cf(8), 0.0016, W("bank") - 2, 0.007),
  s12: hold([200.2, 1.6, 3.9], [200.1, 1.2, -1.4], 46, cf(9), 0.0014, W("gone") - 2, 0.005),
  s13: hold([198.35, 2.45, -1.7], [198.2, 2.5, -3.9], 42, cf(10), 0.002, W("died") - 2, 0.005),
  s14: hold([199.8, 1.6, 2.3], [199.75, 1.3, -1.3], 42, cw("and6"), 0.0016, W("inheritance") - 2, 0.005),
  s15: hold([199.75, 1.55, 3.4], [199.7, 1.15, -1.3], 44, cf(11), 0.0016, W("franc") - 2, 0.006),
  s16: hold([240.15, 1.55, 3.6], [240.15, 1.35, -0.5], 42, cf(12), 0.0016, W("prison") - 2, 0.005),
  s17: hold([201.45, 1.6, 1.4], [201.4, 1.4, -1.3], 42, cw("then5"), 0.0016, W("footman") - 2, 0.005),
  s18: hold([280.45, 1.7, 5.0], [280.45, 1.15, -0.9], 46, cf(13), 0.0012, W("deadline") - 2, 0.005),
  s19: hold([280.35, 1.6, 2.6], [280.3, 1.4, -0.9], 42, cf(14), 0.0016, W("stenographer") - 2, 0.006),
  s20: hold(S1[0], S1[1], S1[2], cf(15), 0.0016, W("waiting2") - 2, 0.006),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }], 2: [{ f: cf(1), s: C.s2 }], 3: [{ f: cf(2), s: C.s3 }], 4: [{ f: cf(3), s: C.s4 }], 5: [{ f: cf(4), s: C.s5 }],
  6: [{ f: cf(5), s: C.s6 }], 7: [{ f: cw("again"), s: C.s7 }], 8: [{ f: cf(6), s: C.s8 }], 9: [{ f: cf(7), s: C.s9 }], 10: [{ f: cw("red"), s: C.s10 }],
  11: [{ f: cf(8), s: C.s11 }], 12: [{ f: cf(9), s: C.s12 }], 13: [{ f: cf(10), s: C.s13 }], 14: [{ f: cw("and6"), s: C.s14 }], 15: [{ f: cf(11), s: C.s15 }],
  16: [{ f: cf(12), s: C.s16 }], 17: [{ f: cw("then5"), s: C.s17 }], 18: [{ f: cf(13), s: C.s18 }], 19: [{ f: cf(14), s: C.s19 }], 20: [{ f: cf(15), s: C.s20 }],
};
const KICKS: [number, number][] = [[WORD.die, 0.5], [WORD.alive, 0.9], [WORD.hit, 0.7], [WORD.again, 0.6], [WORD.bank, 1.0], [WORD.gone, 0.4], [WORD.stroke, 0.6],
  [WORD.prison, 0.5], [WORD.deadline, 0.4]];
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
  { f: 0, cInf: 6, focus: () => eyesOf(M.gen) },
  { f: cf(1), cInf: 10, focus: () => eyesOf(M.gen) },
  { f: cf(2), cInf: 4, focus: () => [0, 1.6, 1.0] },
  { f: cf(3), cInf: 8, focus: () => WH },
  { f: cf(4), cInf: 9, focus: () => eyesOf(M.grannyC, -0.45) },
  { f: cf(5), cInf: 8, focus: () => WH },
  { f: cw("again"), cInf: 12, focus: () => eyesOf(M.grannyC, -0.45) },
  { f: cf(6), cInf: 11, focus: () => eyesOf(M.grannyC, -0.45) },
  { f: cf(7), cInf: 9, focus: () => eyesOf(M.tutorC, -0.45) },
  { f: cw("red"), cInf: 8, focus: () => WH },
  { f: cf(8), cInf: 11, focus: () => eyesOf(M.tutorC) },
  { f: cf(9), cInf: 8, focus: () => eyesOf(M.blancheP) },
  { f: cf(10), cInf: 10, focus: () => M.portrait },
  { f: cw("and6"), cInf: 11, focus: () => eyesOf(M.genP) },
  { f: cf(11), cInf: 9, focus: () => eyesOf(M.blancheP) },
  { f: cf(12), cInf: 10, focus: () => eyesOf(M.tutorCell) },
  { f: cw("then5"), cInf: 12, focus: () => eyesOf(M.lackey) },
  { f: cf(13), cInf: 6, focus: () => eyesOf(M.dosto) },
  { f: cf(14), cInf: 10, focus: () => [280.3, 1.55, -0.9] },
  { f: cf(15), cInf: 6, focus: () => eyesOf(M.tutorSeat, -0.4) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
