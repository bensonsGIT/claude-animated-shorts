import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Caligula seashell short: shots timed to the voice words (~/caligula-short/voice/words.json); the house
// camera grammar (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: beach.ts (the strand round the origin, the sea toward -z, the cliff at x < -15), rome.ts (x >= 200) */
export type ShotSet = "beach" | "rome";
/** sky for the beach dome */
export type SkyKey = "day" | "morning" | "golden" | "night" | "storm";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sky?: SkyKey; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const gold = sh("beach", "golden", { sky: "golden" }), morn = sh("beach", "morning", { sky: "morning", sunAz: 140, sunEl: 26 }), day = sh("beach", "day", { sky: "day", sunAz: 140, sunEl: 40 });
const night = sh("beach", "moon", { sky: "night" }), storm = sh("beach", "moon", { sky: "storm" });
const rome = sh("rome", "lab"), dark = sh("rome", "dark");
export const SHOTS: ShotDef[] = [
  gold(1, 0, cf(1)), // "A Roman emperor once marched his army to the beach, to conquer the ocean!"
  rome(2, cf(1), cw("it")), // "According to the historian Suetonius,"
  morn(3, cw("it"), cf(2)), // "it happened in the year 40."
  day(4, cf(2), cf(3)), // "The emperor was Caligula, nicknamed Little Boots, and he badly wanted a war."
  rome(5, cf(3), cw("so")), // "A runaway British prince surrendered,"
  rome(6, cw("so"), cf(4)), // "so he told the Senate Britain had submitted."
  day(7, cf(4), cf(5)), // "He lined up his legions on the coast of Gaul, catapults aimed at the waves."
  day(8, cf(5), cf(6)), // "He even sailed out a little way, then turned straight back."
  day(9, cf(6), cf(7)), // "Nobody knew what was coming."
  day(10, cf(7), cw("seashells")), // "Then came the order: pick up"
  day(11, cw("seashells"), cf(8)), // "seashells!"
  day(12, cf(8), cf(9)), // "The soldiers filled their helmets and their tunics."
  gold(13, cf(9), cf(10)), // "He called them spoils of the sea, owed to Jupiter's temple and his own palace!"
  gold(14, cf(10), cw("paid")), // "He built a lighthouse to mark the victory, and"
  gold(15, cw("paid"), cf(11)), // "paid each man a hundred silver coins."
  gold(16, cf(11), cf(12)), // "'Go away happy,' he said. 'Go away rich!'"
  dark(17, cf(12), cf(13)), // "Less than a year later, his own guards killed him."
  gold(18, cf(13), cw("but")), // "The shells are long gone."
  night(19, cw("but"), cf(14)), // "But that lighthouse stood for sixteen centuries."
  storm(20, cf(14), cf(15)), // "Then, in 1644, the cliff under it collapsed, and took the tower down."
  gold(21, cf(15), TOTAL), // "So in the end, the ocean beat..." -> loops into line 1
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 5: 10, 7: 10, 14: 8, 17: 12, 18: 14, 19: 12, 20: 12, 21: 14 };
export const FLASH_AT = cf(1);
/** lightning in the storm: frames of a white flicker */
export const LIGHTNING = [cf(14) + 4, W("collapsed") - 2, W("tower") + 6];

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
  cal: [0.6, 0, -4.3] as V3, // Caligula at the front, between the ballistas, near the water
  cen: [-1.5, 0, -1.2] as V3, // the centurion in front of the first rank
  lh: [-18, 14, -13] as V3, // lighthouse base (beach.ts LH)
  rubble: [-13.5, 0, -12] as V3,
  herald: [200, 0, -1.0] as V3, prince: [200.3, 0, 0.6] as V3,
  sue: [270, 0, -1.05] as V3,
  corr: [240, 0, 0] as V3,
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
const M = MARK, C0 = M.cal, CE = M.cen, LH = M.lh;

const S1: [V3, V3, number] = [[0.55, 1.3, -0.9], [0.2, 1.5, -7.8], 46];
const C = {
  s1: hold(S1[0], S1[1], S1[2], 0, 0.0016, W("ocean") - 2, 0.006),
  s2: hold([270.2, 1.35, 1.9], [270, 1.0, -1.05], 40, cf(1), 0.0016, W("suetonius") - 2, 0.004),
  s3: hold([11, 6.5, 17], [-1, 0.6, 2.5], 46, cw("it"), 0.0008),
  s4: hold([C0[0] + 0.3, 1.6, C0[2] + 2.75], [C0[0] + 0.25, 1.45, C0[2]], 42, cf(2), 0.0016, W("war") - 2, 0.005),
  s5: hold([200.45, 1.55, 3.7], [200.25, 1.3, 0.6], 42, cf(3), 0.0016, W("surrendered") - 2, 0.004),
  s6: hold([200, 2.0, 5.6], [200, 1.45, -2.8], 46, cw("so"), 0.0014, W("submitted") - 2, 0.004),
  s7: hold([1.5, 12, 15], [0, 0, -6], 48, cf(4), 0.0008),
  s7b: hold([1.5, 12, 15], [-1, 0.5, -10], 48, cf(4), 0.0008),
  s8: hold([20, 2.8, -10.2], [0, 1.0, -10.2], 44, cf(5), 0.0008),
  s9a: (f: number): Shot => ({ pos: [3.2 - 0.012 * (f - cf(6)), 1.55, -3.0], look: [-2.2 - 0.012 * (f - cf(6)), 1.4, 1.2], fov: 44 }),
  s10: hold([C0[0] + 1.3, 1.45, C0[2] + 3.4], [C0[0] + 0.2, 1.15, C0[2]], 44, cf(7), 0.0016, W("order") - 2, 0.006),
  s11: hold([C0[0] + 1.25, 0.32, C0[2] + 0.75], [C0[0] + 1.0, 0.04, C0[2] - 0.55], 40, cw("seashells"), 0.003),
  s12: hold([CE[0] + 0.35, 1.05, CE[2] + 2.5], [CE[0] + 0.1, 0.75, CE[2]], 44, cf(8), 0.0016, W("tunics") - 2, 0.006),
  s13: hold([C0[0] - 0.4, 1.0, C0[2] + 3.0], [C0[0] + 0.1, 1.7, C0[2]], 44, cf(9), 0.0016, W("palace") - 2, 0.005),
  s14: hold([8, 7.5, 24], [LH[0], LH[1] + 6, LH[2]], 42, cf(10), 0.0010, W("victory") - 2, 0.004),
  s15: hold([CE[0] + 0.3, 1.6, CE[2] + 2.7], [CE[0] + 0.1, 1.4, CE[2]], 42, cw("paid"), 0.0016, W("coins") - 2, 0.005),
  s16: hold([1.6, 1.75, 13.5], [0.4, 1.3, -3.5], 46, cf(11), 0.0012, W("rich") - 2, 0.005),
  s17: hold([240.1, 1.55, 3.8], [240, 1.35, -6], 44, cf(12), 0.0016, W("killed") - 2, 0.006),
  s18: hold([1.2, 0.55, -2.4], [0.2, 0.08, -6.3], 42, cf(13), 0.002, W("gone") - 2, 0.004),
  s19: hold([-2.5, 2.2, 7], [LH[0], LH[1] + 7.5, LH[2]], 44, cw("but"), 0.0016, W("centuries") - 2, 0.004),
  s20: hold([10, 6, 22], [-16, 12, -13], 44, cf(14), 0.0010, W("collapsed") - 2, 0.004),
  s21: hold(S1[0], S1[1], S1[2], cf(15), 0.0016, W("beat") - 2, 0.006),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }], 2: [{ f: cf(1), s: C.s2 }], 3: [{ f: cw("it"), s: C.s3 }], 4: [{ f: cf(2), s: C.s4 }], 5: [{ f: cf(3), s: C.s5 }],
  6: [{ f: cw("so"), s: C.s6 }], 7: [{ f: cf(4), s: C.s7 }, { f: W("waves") - 6, dur: 26, s: C.s7b }], 8: [{ f: cf(5), s: C.s8 }],
  9: [{ f: cf(6), s: C.s9a }], 10: [{ f: cf(7), s: C.s10 }], 11: [{ f: cw("seashells"), s: C.s11 }], 12: [{ f: cf(8), s: C.s12 }],
  13: [{ f: cf(9), s: C.s13 }], 14: [{ f: cf(10), s: C.s14 }], 15: [{ f: cw("paid"), s: C.s15 }], 16: [{ f: cf(11), s: C.s16 }],
  17: [{ f: cf(12), s: C.s17 }], 18: [{ f: cf(13), s: C.s18 }], 19: [{ f: cw("but"), s: C.s19 }], 20: [{ f: cf(14), s: C.s20 }],
  21: [{ f: cf(15), s: C.s21 }],
};
const KICKS: [number, number][] = [[WORD.ocean, 0.8], [WORD.back, 0.5], [WORD.seashells, 0.9], [WORD.tunics, 0.5], [WORD.victory, 0.4], [WORD.killed, 0.5],
  [WORD.collapsed, 1.0], [WORD.beat, 0.6]];
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
  { f: 0, cInf: 7, focus: () => eyesOf(C0, -0.1) },
  { f: cf(1), cInf: 9, focus: () => eyesOf(M.sue, -0.5) },
  { f: cw("it"), cInf: 0 },
  { f: cf(2), cInf: 10, focus: () => eyesOf(C0) },
  { f: cf(3), cInf: 8, focus: () => eyesOf(M.prince) },
  { f: cw("so"), cInf: 5, focus: () => eyesOf(M.herald) },
  { f: cf(4), cInf: 0 },
  { f: cf(5), cInf: 2, focus: () => [0, 1, -14] },
  { f: cf(6), cInf: 7, focus: () => [-0.5, 1.5, 0.2] },
  { f: cf(7), cInf: 8, focus: () => eyesOf(C0, -0.2) },
  { f: cw("seashells"), cInf: 14, focus: () => [C0[0] + 1.0, 0.05, C0[2] - 0.55] },
  { f: cf(8), cInf: 9, focus: () => [CE[0], 0.9, CE[2]] },
  { f: cf(9), cInf: 8, focus: () => eyesOf(C0) },
  { f: cf(10), cInf: 0 },
  { f: cw("paid"), cInf: 9, focus: () => eyesOf(CE) },
  { f: cf(11), cInf: 4, focus: () => [0, 1.4, 6] },
  { f: cf(12), cInf: 6, focus: () => [240, 1.4, -1] },
  { f: cf(13), cInf: 10, focus: () => [0.2, 0.08, -5.4] },
  { f: cw("but"), cInf: 0 },
  { f: cf(14), cInf: 0 },
  { f: cf(15), cInf: 5, focus: () => [0.4, 0.4, -5.4] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
