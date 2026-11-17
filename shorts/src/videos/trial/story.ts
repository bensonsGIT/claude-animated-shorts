import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of The Trial short: shots timed to the voice words (~/the-trial-short/voice/words.json); camera grammar
// from the reference study: continuous slow push-ins, ease-in-out moves, big reframes are cuts, 7-frame flip kicks.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "bed" | "hear" | "junk" | "sick" | "studio" | "church" | "law" | "quarry";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const S = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const bed = S("bed", "morning", { sunAz: 40, sunEl: 30 }), bedN = S("bed", "night", { night: true }), hear = S("hear", "lab"), junk = S("junk", "dark");
const sick = S("sick", "night"), studio = S("studio", "day"), church = S("church", "dark"), law = S("law", "dark"), quarry = S("quarry", "moon");
export const SHOTS: ShotDef[] = [
  bed(1, 0, cf(1)), // "A man is arrested on his birthday, and nobody ever tells him why!"
  bed(2, cf(1), cf(2)), // "This is The Trial, by Franz Kafka."
  bed(3, cf(2), cf(3)), // "Josef K. is a bank officer, and the guards arresting him eat his breakfast!"
  hear(4, cf(3), cf(4)), // "His first hearing is in a slum tenement, on a Sunday."
  hear(5, cf(4), cw("everyone")), // "He gives a fiery speech, then sees"
  hear(6, cw("everyone"), cf(5)), // "everyone wears court badges!"
  junk(7, cf(5), cf(6)), // "Then, at his bank, he finds the guards being whipped, because he complained."
  junk(8, cf(6), cf(7)), // "Next day he opens the door: same guards, same whip!"
  sick(9, cf(7), cf(8)), // "His lawyer works from a sickbed and never files a petition."
  studio(10, cf(8), cf(9)), // "A court painter has never seen a single real acquittal!"
  studio(11, cf(9), cf(10)), // "The court has offices in nearly every attic, even behind the painter's bed."
  church(12, cf(10), cw("whole")), // "A priest tells him of a man who waits his"
  law(13, cw("whole"), cf(11)), // "whole life at a door to the law."
  law(14, cf(11), cf(12)), // "Dying, the man learns the door was meant only for him; now it's shutting."
  bedN(15, cf(12), cw("quarry")), // "A year later, two men in top hats walk him to a"
  quarry(16, cw("quarry"), cf(13)), // "quarry."
  quarry(17, cf(13), cf(14)), // "They bring a butcher's knife; his last words: like a dog!"
  church(18, cf(14), cf(15)), // "Kafka's point: you don't need to believe the system is true, only necessary."
  bed(19, cf(15), TOTAL), // "And nobody ever told him why."
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 4: 12, 7: 12, 9: 12, 10: 12, 12: 14, 13: 12, 15: 14, 16: 10, 18: 18, 19: 14 };
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** black after the door of the Law shuts: fades in right after "shutting", holds through the pause, lifts into shot 15 */
export const blackAt = (f: number) => {
  const t = f / FPS, t0 = WORD.shutting + 0.35, a15 = SHOTS[14].a;
  if (t < t0) return 0;
  if (f < a15) return smooth((t - t0) / 0.2);
  return 1 - smooth((f - a15) / 12);
};

// ---------------- door / light states ----------------
/** K.'s door: bangs open on "arrested"; opens on "hats" at night; starts to open again on the last "why" (the loop) */
export const kDoor = (id: number, t: number) => {
  if (id === 1) return smooth((t - WORD.arrested + 0.12) / 0.18);
  if (id === 2 || id === 3) return 1;
  if (id === 15) return smooth((t - WORD.hats + 0.3) / 0.35);
  if (id === 19) return 0.35 * smooth((t - WORD.why2) / 0.6);
  return 0;
};
/** the junk-room door: opens on "bank" / "opens", slams at the end of each shot */
export const junkDoor = (id: number, t: number, end: number) => {
  const open = id === 7 ? smooth((t - WORD.bank2 + 0.1) / 0.3) : smooth((t - WORD.opens + 0.1) / 0.3);
  const slam = smooth((t - (end - 0.32)) / 0.12);
  return open * (1 - slam);
};
export const studioDoor = (id: number, t: number) => (id === 11 ? smooth((t - WORD.behind + 0.1) / 0.3) : 0);
export const lawShut = (id: number, t: number) => (id === 14 ? smooth((t - WORD.shutting + 0.05) / 0.32) : 0);
export const quarryLit = (id: number, t: number) => (id === 17 ? 1 - clamp01((t - WORD.dog) / 0.1) : 1);

// ---------------- staging marks (x, floor y, z) ----------------
export const MARK = {
  // K.'s room: bed front z -2.45 (top .55), door x -2.55..-1.7 in the back wall z -3.4, table z -2.6..-1.8
  kBed: [-0.6, 0.08, -2.33] as V3, doorIn: [-2.12, 0, -3.7] as V3, willem: [-2.0, 0, -1.95] as V3, franz: [-1.45, 0, -1.3] as V3,
  kStand: [0.0, 0, -0.9] as V3, eatW: [1.2, 0, -2.72] as V3, eatF: [1.8, 0, -2.72] as V3,
  nb: [[-0.4, 0.2, -9.85], [0.05, 0.2, -9.9], [-0.85, 0.2, -9.95]] as V3[],
  kNight: [-0.3, 0, -1.5] as V3, topA: [-2.1, 0, -3.75] as V3, topB: [-1.5, 0, -2.85] as V3,
  // hearing room: podium x .5..2.5 z -4.45..-3, top .4; magistrate behind the table
  kDoorway: [0.2, 0, -0.1] as V3, kPodium: [0.95, 0.4, -3.2] as V3, mag: [1.5, 0.4, -3.97] as V3,
  // junk room: doorway x -.8..0.6 at z 1.4; K. in the corridor
  kCorr: [0.75, 0, 2.7] as V3, whipper: [0.15, 0, -1.7] as V3, kneelW: [-0.45, -0.42, -0.85] as V3, kneelF: [0.3, -0.42, -0.6] as V3,
  // sickroom
  huld: [-0.95, 0.56, -2.45] as V3, kVisit: [0.35, 0, -1.25] as V3,
  // studio: bed front z -1.85 top .48
  kTbed: [0.22, 0.03, -1.73] as V3, tito: [0.9, 0, -1.05] as V3, wait: [[-1.25, 0, -3.7], [-0.75, 0, -4.8]] as V3[],
  // cathedral: pulpit floor y 2.2 at (1.6, -7.5)
  priest: [1.6, 2.2, -7.62] as V3, kNave: [-0.45, 0, -1.6] as V3,
  // parable
  keeper: [-1.15, 0, -3.1] as V3, man: [1.15, 0, -3.1] as V3,
  // quarry: block z -0.7..0 h .6
  qA: [-0.55, 0, -2.2] as V3, qK: [0.0, 0, -2.2] as V3, qB: [0.55, 0, -2.2] as V3,
};
const M = MARK;
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

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
const HOOK_POS: V3 = [0.25, 1.5, 3.6], HOOK_LOOK: V3 = [-1.0, 1.2, -2.4];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(HOOK_POS, HOOK_LOOK, 0, 0.0014, 50, W("why")) }],
  2: [{ f: a(2), s: hold([-0.45, 1.85, -2.5], [-0.4, 1.75, -9.6], a(2), 0.0018, 32) }],
  3: [{ f: a(3), s: hold([-0.9, 1.5, 2.6], [1.1, 1.15, -2.6], a(3), 0.0016, 48, W("breakfast"), 0.006) }],
  4: [{ f: a(4), s: hold([0.15, 1.6, 3.1], [0.45, 1.35, -4.0], a(4), 0.0014, 54) }],
  5: [{ f: a(5), s: hold([-0.3, 1.75, 2.0], [0.85, 1.75, -3.2], a(5), 0.0022, 46) }],
  6: [{ f: a(6), s: rolled(hold([0.55, 1.75, 1.7], [-1.4, 1.45, -1.6], a(6), 0.0022, 48, W("badges"), 0.007), 0.03) }],
  7: [{ f: a(7), s: hold([0.45, 1.55, 5.2], [0.05, 1.15, -1.2], a(7), 0.0016, 50, W("whipped")) }],
  8: [{ f: a(8), s: hold([0.45, 1.55, 5.2], [0.05, 1.15, -1.2], a(8), 0.0016, 50, W("whip")) }],
  9: [{ f: a(9), s: hold([0.8, 1.5, 2.5], [-0.3, 1.15, -2.3], a(9), 0.0018, 48) }],
  10: [{ f: a(10), s: hold([0.4, 1.45, 2.6], [0.45, 1.15, -1.8], a(10), 0.0016, 50, W("acquittal")) }],
  11: [{ f: a(11), s: hold([0.1, 1.35, 1.9], [-0.65, 1.15, -3.0], a(11), 0.0022, 52, W("behind")) }],
  12: [{ f: a(12), s: hold([-0.5, 1.55, 3.6], [0.9, 2.7, -7.5], a(12), 0.0018, 44) }],
  13: [{ f: a(13), s: hold([0, 1.4, 4.5], [0, 1.35, -3.5], a(13), 0.0012, 46) }],
  14: [{ f: a(14), s: hold([0.2, 1.35, 1.6], [0.1, 1.15, -3.4], a(14), 0.0018, 56, W("shutting"), 0.006) }],
  15: [{ f: a(15), s: hold([0.6, 1.45, 2.8], [-1.0, 1.2, -2.6], a(15), 0.0016, 50, W("hats")) }],
  16: [{ f: a(16), s: hold([0.0, 1.15, 7.2], [0.0, 1.6, -6.0], a(16), 0.0012, 50) }],
  17: [{ f: a(17), s: hold([0.25, 1.3, 2.6], [0.0, 1.4, -2.2], a(17), 0.0016, 46) },
    { f: W("words") - 8, dur: 20, s: (f) => ({ pos: [0.5, 1.7, 2.6], look: [1.9, 6.5 - 0.0004 * (f - W("words")), -15.6], fov: 26 }) }],
  18: [{ f: a(18), s: hold([0.85, 2.9, -2.9], [1.6, 3.1, -7.6], a(18), 0.0024, 46) }],
  19: [{ f: a(19), s: hold(HOOK_POS, HOOK_LOOK, a(19), 0.0014, 50) }],
};

const KICKS: [number, number][] = [[WORD.arrested, 0.9], [WORD.why, 0.4], [WORD.breakfast, 0.6], [WORD.badges, 0.9], [WORD.whipped, 0.8],
  [WORD.whip, 0.8], [WORD.acquittal, 0.5], [WORD.behind, 0.4], [WORD.shutting + 0.1, 1.3], [WORD.hats, 0.4], [WORD.dog, 0.9]];
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
  { f: 0, cInf: 8, focus: () => eyesOf(M.kBed, -0.45) },
  { f: a(2), cInf: 6, focus: () => [-0.4, 1.8, -9.9] },
  { f: a(3), cInf: 8, focus: () => eyesOf(M.eatW, -0.45) },
  { f: a(4), cInf: 6, focus: () => eyesOf(M.kDoorway) },
  { f: a(5), cInf: 10, focus: () => eyesOf(M.kPodium) },
  { f: a(6), cInf: 6, focus: () => [0.0, 1.5, -1.0] },
  { f: a(7), cInf: 6, focus: () => eyesOf(M.whipper) },
  { f: a(9), cInf: 9, focus: () => eyesOf(M.huld, -0.45) },
  { f: a(10), cInf: 9, focus: () => eyesOf(M.kTbed, -0.45) },
  { f: a(11), cInf: 6, focus: () => [-1.05, 1.3, -2.5] },
  { f: a(12), cInf: 5, focus: () => eyesOf(M.priest) },
  { f: a(13), cInf: 0 },
  { f: a(14), cInf: 8, focus: () => eyesOf(M.man, -0.45) },
  { f: a(15), cInf: 8, focus: () => eyesOf(M.kNight, -0.45) },
  { f: a(16), cInf: 0 },
  { f: a(17), cInf: 7, focus: () => eyesOf(M.qA) },
  { f: W("words"), dur: 20, cInf: 0 },
  { f: a(18), cInf: 6, focus: () => eyesOf(M.priest) },
  { f: a(19), cInf: 8, focus: () => eyesOf(M.kBed, -0.45) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus ?? p.focus };
};
export { cf, cw, W as wf };
