import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Sonya confession short: shots timed to Ben's narration (couch.potato.history/sonya-confession-short/voice/words.json).
// Intense and quiet: long slow push-ins, the world getting emptier and greyer until she kneels (shot 11), then warm.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "sonya" | "wall" | "bridge" | "garret" | "lodging" | "canal" | "empty" | "haymarket";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
type WK = keyof typeof WORD;
const W = (k: WK) => F(WORD[k]);
const cw = (k: WK) => W(k) - PRE;
export const isOutdoor = (s: ShotDef) => s.set === "bridge" || s.set === "canal" || s.set === "haymarket";
const PLAN: [ShotSet, LightName, number][] = [
  ["sonya", "dark", 0], // 1 "Spoiler warning for Crime and Punishment, by Fyodor Dostoyevsky."
  ["wall", "dark", cf(1)], // 2 "A student killed two women with an axe, and the loneliest part came after."
  ["bridge", "day", cf(2)], // 3 "On a bridge, a stranger takes Raskolnikov for a beggar and gives him a coin."
  ["bridge", "day", cf(3)], // 4 "He throws it into the river, and feels cut off from everyone and everything."
  ["garret", "dark", cf(4)], // 5 "His mother and sister rush to hug him, and he can't even lift his arms."
  ["lodging", "dark", cf(5)], // 6 "He tells his family to forget him."
  ["canal", "night", cf(6)], // 7 "There's one person he can tell: Sonya, who sells herself to feed her stepmother's children."
  ["sonya", "dark", cf(7)], // 8 "His second victim, Lizaveta, was her friend."
  ["sonya", "dark", cf(8)], // 9 "In her crooked room, he tells her to guess who did it."
  ["sonya", "dark", cf(9)], // 10 "She stares at his face, then backs away exactly the way her friend did."
  ["sonya", "dark", cf(10)], // 11 "Then she falls to her knees and throws her arms around him!"
  ["sonya", "dark", cf(11)], // 12 "She cries that nobody on earth is more unhappy than he is."
  ["sonya", "dark", cf(12)], // 13 "He tries to explain his theory, then gives up: I murdered myself, not her!"
  ["sonya", "dark", cf(13)], // 14 "She tells him to kiss the ground at the
  ["haymarket", "morning", cw("crossroads")], // 15   crossroads and confess, and swears she'll follow him to Siberia."
  ["empty", "dark", cf(14)], // 16 "But in the empty room next door, the man stalking his sister heard every word!"
  ["sonya", "dark", cf(15)], // 17 "Dostoyevsky's point: the axe cut him off from everyone, and only the truth let one person back in."
];
export const SHOTS: ShotDef[] = PLAN.map(([set, light, a], i) => ({ id: i + 1, a, b: i + 1 < PLAN.length ? PLAN[i + 1][2] : TOTAL, set, light }));
export const XFADE: Record<number, number> = { 3: 14, 5: 16, 7: 16, 15: 18, 17: 18 };
export const FLASH_AT = -100;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const glareAt = (_f: number) => 0;
/** a hard cut to black for 5 frames on "killed" */
export const blackAt = (f: number) => (f >= W("killed") && f < W("killed") + 5 ? 1 : 0);
/** the grade: how grey / how closed in each shot is (his world shrinks until she kneels) */
export const greyOf = (id: number) => (id === 1 ? 0.3 : id >= 2 && id <= 10 ? 0.12 + 0.045 * (id - 2) : id === 16 ? 0.35 : id === 15 ? 0.25 : 0);
export const vigOf = (id: number) => (id === 1 ? 0.55 : id >= 2 && id <= 10 ? 0.42 + 0.025 * (id - 2) : id === 16 ? 0.6 : isOutdoor(SHOTS[id - 1]) ? 0.25 : 0.36);

// ---------------- staging marks ----------------
export const MARK = {
  // Sonya's room (rooms.ts SROOM): entry door x -0.75 on the back wall z -3.0; bed front edge z -2.15 (seat 0.5);
  // his rush chair at (1.25, -0.75) (seat 0.47); the locked door x 2.55
  rDoor: [-0.75, 0, -2.55] as V3,
  sChest: [-2.3, 0, -0.55] as V3,
  sBed: [-1.5, 0.02, -2.0] as V3, rChair: [0.35, -0.01, -0.85] as V3,
  kneel: [-0.35, 0, -0.85] as V3, sKneel: [-0.35, 0, -0.6] as V3,
  rCorner: [2.45, 0, -2.25] as V3,
  sCross: [-0.35, 0, -1.6] as V3, rCross: [0.75, 0, -1.05] as V3,
  // bridge: the railing at z -1.2
  rBridge: [0.15, 0, -0.75] as V3, oldIn: [-4.2, 0, -0.35] as V3, oldAt: [-0.5, 0, -0.5] as V3, oldOut: [-5.0, 0, 0.2] as V3,
  hand: [0.47, 1.05, -0.85] as V3,
  // garret: door at x 0.85 on the back wall z -1.8
  rGarret: [-0.1, 0, -0.55] as V3, gDoor: [0.85, 0, -1.55] as V3, momAt: [0.5, 0, -0.95] as V3, dunAt: [-0.72, 0, -1.0] as V3,
  // lodging: door x -1.45 on z -2.6, chairs at x 0.6 / 1.4 (seat 0.66)
  mom: [0.6, 0.18, -2.1] as V3, dun: [1.4, 0.18, -2.1] as V3, rLodge: [-0.55, 0, -0.85] as V3, lDoor: [-1.45, 0, -2.3] as V3, lOut: [-1.45, 0, -3.4] as V3,
  // canal
  canalFar: [-0.9, 0, -17] as V3, canalNear: [-0.9, 0, -4.6] as V3,
  // empty room: chair at (0.4, -1.95), seat 0.49
  svid: [0.4, 0.01, -1.72] as V3,
};
const M = MARK;
const EYE = 1.45;
const eyesOf = (m: V3, dy = 0, s = 1): V3 => [m[0], m[1] + EYE * s + dy, m[2]];
const SIT = -0.45;
/** garret door: opens as shot 5 starts */
export const gDoorAt = (t: number) => smooth((t - (BEAT[4] + 0.05)) / 0.5);
/** lodging door: open, he goes out on "forget", it swings shut behind him */
export const lDoorAt = (t: number) => 1 - smooth((t - (WORD.forget + 1.55)) / 0.45);

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
const hold = (pos: V3, look: V3, f0: number, rate: number, fov = 42, fp?: number, punch = 0.005) => (f: number): Shot =>
  dolly(pos, look, pushK(f, f0, rate) * (fp !== undefined ? pushK(f, fp - 3, 0, punch, 30) : 1), { fov });
/** close-ups: standing (s = scale) or seated cards; face in the upper third */
const cuPos = (m: V3, s = 1, dx = 0, dz = 2.6): V3 => [m[0] + dx, m[1] + 1.42 * s, m[2] + dz * Math.sqrt(s)];
const cuLook = (m: V3, s = 1): V3 => [m[0], m[1] + 1.14 * s, m[2]];
const seatPos = (m: V3, dx = 0): V3 => [m[0] + dx, m[1] + 1.05, m[2] + 2.3];
const seatLook = (m: V3): V3 => [m[0], m[1] + 0.82, m[2]];

const a = (id: number) => SHOTS[id - 1].a;
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(cuPos(M.rDoor, 1, 0.15, 2.6), cuLook(M.rDoor), 0, 0.0016, 42, W("dostoyevsky"), 0.004) }],
  2: [{ f: a(2), s: hold([0.25, 1.35, 2.4], [0.05, 1.3, -1.5], a(2), 0.0012, 46) },
      { f: W("killed") + 5, cut: true, s: hold([0.15, 1.35, 1.9], [0.05, 1.3, -1.5], W("killed") + 5, 0.0022, 46, W("loneliest"), 0.006) }],
  3: [{ f: a(3), s: hold([-0.2, 1.55, 4.4], [-0.2, 1.4, -3.0], a(3), 0.001, 52, W("coin"), 0.004) }],
  4: [{ f: a(4), s: hold([0.75, 1.3, 1.9], [0.25, 0.9, -1.6], a(4), 0.0018, 46, W("river"), 0.004) },
      { f: W("cut") - 2, dur: 34, s: () => ({ pos: [2.5, 9.5, 13.0], look: [0.1, 0.6, -1.0], fov: 46 }) },
      { f: W("cut") + 34, s: hold([2.5, 9.5, 13.0], [0.1, 0.6, -1.0], W("cut") + 34, 0.0008, 46) }],
  5: [{ f: a(5), s: hold([0.0, 1.5, 2.3], [-0.05, 1.15, -1.3], a(5), 0.001, 64, W("lift"), 0.004) }],
  6: [{ f: a(6), s: hold([0.2, 1.45, 2.85], [0.1, 1.05, -2.0], a(6), 0.001, 62, W("forget"), 0.003) }],
  7: [{ f: a(7), s: hold([0.35, 1.6, 0.4], [-0.6, 1.4, -12], a(7), 0.0008, 44) },
      { f: W("sonya") - 8, dur: 30, s: hold([0.45, 2.0, -1.0], [-2.3, 4.5, -6.0], W("sonya") + 22, 0.0018, 40) }],
  8: [{ f: a(8), s: hold([-0.1, 1.5, 1.5], [-2.3, 1.25, -0.6], a(8), 0.0018, 40, W("lizaveta"), 0.004) }],
  9: [{ f: a(9), s: hold([0.0, 1.35, 2.5], [-0.5, 0.95, -1.4], a(9), 0.0009, 62, W("guess"), 0.003) }],
  10: [{ f: a(10), s: hold(seatPos(M.sBed, 0.3), seatLook(M.sBed), a(10), 0.0011, 44, W("backs"), 0.003) }],
  11: [{ f: a(11), s: hold([-0.3, 1.4, 2.2], [-0.35, 1.05, -0.85], a(11), 0.0014, 48, W("knees"), 0.006) }],
  12: [{ f: a(12), s: hold(cuPos(M.sKneel, 1, 0, 2.2), cuLook(M.sKneel), a(12), 0.0024, 40) },
       { f: W("unhappy") - 3, cut: true, s: hold(cuPos(M.kneel, 1, 0, 2.2), cuLook(M.kneel), W("unhappy") - 3, 0.0024, 40) }],
  13: [{ f: a(13), s: hold([1.85, 1.6, 0.3], [2.25, 1.55, -2.25], a(13), 0.0014, 46, W("myself"), 0.005) }],
  14: [{ f: a(14), s: hold(cuPos(M.sCross, 1, 0.1), cuLook(M.sCross), a(14), 0.002, 40, W("kiss"), 0.004) }],
  15: [{ f: a(15), s: hold([0.1, 1.7, 5.5], [0.15, 0.9, -10], a(15), 0.0012, 40, W("siberia"), 0.003) }],
  16: [{ f: a(16), s: hold([0.05, 1.3, 1.7], [0.05, 1.0, -2.2], a(16), 0.0016, 52, W("word"), 0.006) }],
  17: [{ f: a(17), s: hold([-0.25, 1.5, 2.5], [-0.35, 1.1, -0.85], a(17), 0.0011, 52) },
       { f: W("truth") - 3, dur: 60, s: hold(cuPos(M.kneel, 1, 0.1, 2.3), cuLook(M.kneel), W("truth") + 57, 0.0016, 40) }],
};
const KICKS: [number, number][] = [[WORD.killed, 0.9], [WORD.knees, 0.4], [WORD.word, 0.6]];
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
  { f: 0, cInf: 12, focus: () => eyesOf(M.rDoor) },
  { f: a(2), cInf: 6, focus: () => [0.05, 1.3, -1.5] },
  { f: a(3), cInf: 0 },
  { f: a(4), cInf: 10, focus: () => M.hand },
  { f: W("cut"), dur: 20, cInf: 0 },
  { f: a(5), cInf: 8, focus: () => eyesOf(M.rGarret) },
  { f: a(6), cInf: 6, focus: () => eyesOf(M.rLodge) },
  { f: a(7), cInf: 0 },
  { f: a(8), cInf: 12, focus: () => eyesOf(M.sChest) },
  { f: a(9), cInf: 8, focus: () => eyesOf(M.sBed, SIT) },
  { f: a(10), cInf: 13, focus: () => eyesOf(M.sBed, SIT) },
  { f: a(11), cInf: 9, focus: () => eyesOf(M.kneel) },
  { f: a(12), cInf: 13, focus: () => eyesOf(M.sKneel) },
  { f: W("unhappy") - 3, cInf: 13, focus: () => eyesOf(M.kneel) },
  { f: a(13), cInf: 11, focus: () => eyesOf(M.rCorner) },
  { f: a(14), cInf: 13, focus: () => eyesOf(M.sCross) },
  { f: a(15), cInf: 0 },
  { f: a(16), cInf: 10, focus: () => eyesOf(M.svid, SIT) },
  { f: a(17), cInf: 8, focus: () => eyesOf(M.kneel) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
