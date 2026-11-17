import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Dancing Plague short: shots timed to the voice words (~/dancing-short/voice/words.json); the house camera
// grammar (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: town.ts (the lane at x 0, the horse-market stage at x 60, the shrine road at x -80), the engine's great hall
 *  (the guild hall), council.ts */
export type ShotSet = "town" | "hall" | "council";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const stage = sh("town", "golden", { sunAz: 150, sunEl: 22 }), lane = sh("town", "day", { sunAz: 140, sunEl: 40 }), night = sh("town", "moon");
const hall = sh("hall", "night"), council = sh("council", "sun"), road = sh("town", "golden", { sunAz: 150, sunEl: 20 }), shrine = sh("town", "day", { sunAz: 150, sunEl: 35 });
export const SHOTS: ShotDef[] = [
  stage(1, 0, cf(1)), // "In 1518, a city's cure for people who couldn't stop dancing was… more dancing!"
  lane(2, cf(1), cf(2)), // "It's July in Strasbourg, and a woman named Frau Troffea steps into the street and starts to dance."
  night(3, cf(2), cw("days")), // "She dances all day, all night, for"
  lane(4, cw("days"), cf(3)), // "days, and she can't stop."
  lane(5, cf(3), cf(4)), // "Within a week, dozens of people have joined her."
  lane(6, cf(4), cf(5)), // "This is the Dancing Plague of 1518."
  council(7, cf(5), cf(6)), // "The city's doctors decide it's a natural disease, caused by hot blood."
  council(8, cf(6), cf(7)), // "Their prescription: dance it out!"
  stage(9, cf(7), cf(8)), // "So the council opens the guild halls and builds a wooden stage for the dancers."
  hall(10, cf(8), cf(9)), // "They even hire musicians, and strong men to hold the dancers up!"
  stage(11, cf(9), cf(10)), // "It doesn't work."
  lane(12, cf(10), cf(11)), // "One chronicle says four hundred people were dancing within a month."
  council(13, cf(11), cf(12)), // "So the council does a U-turn and bans public dancing and music!"
  road(14, cf(12), cw("shrine")), // "The dancers are loaded into wagons and sent to a mountain"
  shrine(15, cw("shrine"), cf(13)), // "shrine of Saint Vitus, to pray."
  lane(16, cf(13), cf(14)), // "By September, the dancing finally stops."
  lane(17, cf(14), cf(15)), // "Today, most historians blame mass panic, after years of famine and disease."
  stage(18, cf(15), TOTAL), // "But in 1518, the cure for dancing… was more dancing!"
];
export const XFADE: Record<number, number> = { 2: 12, 4: 10, 7: 12, 9: 12, 10: 10, 11: 8, 12: 10, 13: 10, 14: 12, 15: 12, 16: 14, 17: 10, 18: 8 };
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
  troffea: [-1.05, 0, 0.5] as V3, doorstep: [-2.35, 0, 0.1] as V3, husband: [-2.55, 0, -0.95] as V3,
  docA: [-0.8, 0, -0.35] as V3, docB: [0.75, 0, -0.25] as V3,
  physStage: [56.2, 0, -0.8] as V3,
  holdL: [1.0, 0, -1.4] as V3, holdR: [2.15, 0, -1.4] as V3, held: [1.58, 0, -1.3] as V3,
  musician: [0.75, 0, -0.1] as V3, guard: [1.55, 0, -0.45] as V3,
  statue: [-80, 0.3, -31.6] as V3,
};
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

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

const C = {
  s1: hold([60.3, 2.5, 9.0], [60.0, 2.0, -4.0], 46, 0, 0.001, W("dancing2") - 2),
  s2: hold([1.1, 1.6, 7.0], [-0.6, 1.35, -1.0], 44, cf(1), 0.0014),
  s3: hold([1.1, 1.6, 7.0], [-0.6, 1.35, -1.0], 44, cf(2), 0.0016),
  s4: hold([-0.3, 1.55, 3.5], [-1.0, 1.35, 0.4], 42, cw("days"), 0.002, W("stop2") - 2),
  s5: hold([1.0, 1.9, 7.8], [0.0, 1.3, -3.0], 46, cf(3), 0.0012),
  s6a: hold([0.4, 2.2, 9.0], [0.0, 2.6, -20.0], 46, cf(4)),
  s6b: hold([0.0, 9.5, 16.0], [0.0, 4.0, -30.0], 50, cf(4), 0.0006),
  s7: hold([0.0, 1.62, 3.9], [0.0, 1.3, -1.3], 44, cf(5), 0.0012),
  s8: hold([0.85, 1.6, 1.9], [0.75, 1.45, -0.3], 42, cf(6), 0.0016, W("out") - 2),
  s9: hold([60.4, 1.8, 6.5], [60.0, 1.2, -4.5], 46, cf(7), 0.0012, W("stage") - 2, 0.004),
  s10: hold([3.4, 1.75, 5.2], [2.3, 1.35, -3.0], 46, cf(8), 0.0012),
  s11: hold([62.6, 2.2, 3.2], [62.0, 1.9, -6.0], 42, cf(9), 0.002, W("work") - 2),
  s12: hold([0.0, 10.0, 11.0], [0.0, 2.0, -18.0], 50, cf(10), 0.0008),
  s13: hold([0.5, 1.62, 4.2], [0.45, 1.3, -1.0], 46, cf(11), 0.0014, W("bans") - 2),
  s14: hold([-68.5, 1.9, -1.4], [-80.0, 1.4, -2.0], 46, cf(12), 0.0012),
  s15: hold([-78.7, 1.6, -22.4], [-80.0, 1.55, -31.0], 44, cw("shrine"), 0.0012, W("pray") - 2, 0.004),
  s16: hold([-0.5, 1.3, 3.2], [-2.2, 0.9, 0.0], 42, cf(13), 0.0014),
  s17: hold([0.6, 3.0, 9.5], [0.0, 4.2, -18.0], 48, cf(14), 0.0008),
  s18: hold([60.3, 2.5, 9.0], [60.0, 2.0, -4.0], 46, cf(15), 0.001, W("dancing8") - 2),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }], 2: [{ f: cf(1), s: C.s2 }], 3: [{ f: cf(2), s: C.s3 }], 4: [{ f: cw("days"), s: C.s4 }], 5: [{ f: cf(3), s: C.s5 }],
  6: [{ f: cf(4), s: C.s6a }, { f: cf(4) + 6, dur: Math.max(30, cf(5) - cf(4) - 12), s: C.s6b }],
  7: [{ f: cf(5), s: C.s7 }], 8: [{ f: cf(6), s: C.s8 }], 9: [{ f: cf(7), s: C.s9 }], 10: [{ f: cf(8), s: C.s10 }], 11: [{ f: cf(9), s: C.s11 }],
  12: [{ f: cf(10), s: C.s12 }], 13: [{ f: cf(11), s: C.s13 }], 14: [{ f: cf(12), s: C.s14 }], 15: [{ f: cw("shrine"), s: C.s15 }],
  16: [{ f: cf(13), s: C.s16 }], 17: [{ f: cf(14), s: C.s17 }], 18: [{ f: cf(15), s: C.s18 }],
};
const KICKS: [number, number][] = [[WORD.dancing2, 0.8], [WORD.out, 0.6], [WORD.work, 0.5], [WORD.bans, 0.8], [WORD.music, 0.5], [WORD.dancing8, 0.8]];
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
  { f: 0, cInf: 4, focus: () => [60, 2.2, -4] },
  { f: cf(1), cInf: 7, focus: () => eyesOf(M.troffea) },
  { f: cw("days"), cInf: 11, focus: () => eyesOf(M.troffea) },
  { f: cf(3), cInf: 5, focus: () => [0, 1.6, -2] },
  { f: cf(4), cInf: 0 },
  { f: cf(5), cInf: 8, focus: () => eyesOf(M.docB) },
  { f: cf(7), cInf: 4, focus: () => [60, 1.5, -3.5] },
  { f: cf(8), cInf: 7, focus: () => eyesOf(M.held) },
  { f: cf(9), cInf: 8, focus: () => [62.6, 2.6, -6.2] },
  { f: cf(10), cInf: 0 },
  { f: cf(11), cInf: 8, focus: () => eyesOf(M.musician) },
  { f: cf(12), cInf: 4, focus: () => [-80, 1.4, -2] },
  { f: cw("shrine"), cInf: 6, focus: () => [-80, 1.4, -30] },
  { f: cf(13), cInf: 10, focus: () => eyesOf(M.doorstep, -0.5) },
  { f: cf(14), cInf: 0 },
  { f: cf(15), cInf: 4, focus: () => [60, 2.2, -4] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
