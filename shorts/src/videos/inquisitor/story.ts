import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Grand Inquisitor short: shots timed to Ben's narration (couch.potato.history/grand-inquisitor-short/voice/words.json).
// House camera grammar: continuous slow push-ins, big reframes are cuts. This one is quiet and intense: few kicks, long holds.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "void" | "tavern" | "square" | "prison" | "desert";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
type WK = keyof typeof WORD;
const W = (k: WK) => F(WORD[k]);
const cw = (k: WK) => W(k) - PRE;
export const isOutdoor = (s: ShotDef) => s.set === "square" || s.set === "desert";
const PLAN: [ShotSet, LightName, number][] = [
  ["void", "dark", 0], // 1 "A man hands God back his ticket to heaven, because one child's tears are too high a price."
  ["tavern", "dark", cf(1)], // 2 "This is The Brothers Karamazov, by Dostoyevsky."
  ["tavern", "dark", cf(2)], // 3 "Ivan Karamazov doesn't deny God; he refuses a world built on the suffering of innocent children."
  ["tavern", "dark", cf(3)], // 4 "Then he tells his brother, a young monk, a story: The Grand Inquisitor."
  ["square", "sun", cf(4)], // 5 "Christ returns to Seville, and a ninety-year-old cardinal throws him in prison."
  ["desert", "golden", cf(5)], // 6 "At night the cardinal accuses him: you refused the Devil's bread, miracles and power,
  ["prison", "dark", cw("because2")], // 7   because you wanted faith given freely."
  ["prison", "dark", cf(6)], // 8 "But people can't bear freedom; they'll trade it for bread and someone to worship."
  ["prison", "dark", cf(7)], // 9 "So, out of love for them, we corrected your work, and gave them a comforting lie!"
  ["tavern", "dark", cf(8)], // 10 "The young monk sees the secret: the cardinal doesn't believe in God at all."
  ["prison", "dark", cf(9)], // 11 "And Christ answers with no argument."
  ["prison", "dark", cf(10)], // 12 "He kisses the old man who wants him burned."
  ["prison", "dark", cf(11)], // 13 "The cardinal opens the door: Go, and come no more!"
  ["prison", "dark", cf(12)], // 14 "The kiss burns in his heart, but he keeps his idea."
  ["tavern", "dark", cf(13)], // 15 "Then Ivan asks: if I believe everything is allowed, will you disown me?"
  ["tavern", "dark", cf(14)], // 16 "His brother answers the same way, with a kiss, and Ivan laughs: plagiarism!"
  ["tavern", "dark", cf(15)], // 17 "Dostoyevsky's point: faith can't be forced by proof, and real love is never earned."
  ["void", "dark", cf(16)], // 18 "It's given, even to the man who returns his ticket."
];
export const SHOTS: ShotDef[] = PLAN.map(([set, light, a], i) => ({ id: i + 1, a, b: i + 1 < PLAN.length ? PLAN[i + 1][2] : TOTAL, set, light }));
export const XFADE: Record<number, number> = { 2: 14, 5: 16, 6: 16, 7: 14, 10: 16, 11: 18, 15: 16, 17: 12, 18: 20 };
export const FLASH_AT = cf(1);
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const glareAt = (_f: number) => 0;
export const blackAt = (_f: number) => 0;

// ---------------- staging marks ----------------
export const SI = 1.08; // the Inquisitor: "tall and erect"
export const MARK = {
  // tavern: the table x -0.95..0.95, z -1.95..-1.2 (top 0.75); the brothers on chairs behind it (raised marks)
  ivan: [-0.45, 0.18, -2.05] as V3, alyosha: [0.45, 0.18, -2.05] as V3, alyoshaUp: [-0.05, 0, -2.05] as V3,
  // void
  hand: [0.12, 0.62, -1.25] as V3, ticketTop: [0.55, 2.7, -2.6] as V3, tear: [-0.16, 1.55, -1.45] as V3,
  // square
  pris5: [0.0, 0, -4.8] as V3, inq5: [1.6, 1.2, -9.25] as V3, guardA: [-0.7, 0, -5.4] as V3, guardB: [0.75, 0, -5.5] as V3,
  // desert
  prisRock: [-0.4, 0.0, -1.7] as V3, devil: [0.85, 0, -2.6] as V3,
  // prison: bench along the back wall; the door on the left wall at z -0.4
  prisBench: [-0.35, 0, -1.95] as V3, inq: [0.85, 0, -1.55] as V3, prisKiss: [0.3, 0, -1.62] as V3,
  doorIn: [-1.85, 0, -0.4] as V3, doorOut: [-2.9, 0, -0.4] as V3,
};
const M = MARK;
const EYE = 1.45;
const eyesOf = (m: V3, dy = 0, s = 1): V3 => [m[0], m[1] + EYE * s + dy, m[2]];
const SIT = -0.45;
/** the cell door opens on "door" (shot 13) and stays open */
export const doorAt = (id: number, t: number) => (id === 13 ? smooth((t - (WORD.door - 0.2)) / 0.6) : 0);

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
const cuPos = (m: V3, s = 1, dx = 0, dz = 2.9): V3 => [m[0] + dx, m[1] + 1.4 * s, m[2] + dz * Math.sqrt(s)];
const cuLook = (m: V3, s = 1): V3 => [m[0], m[1] + 1.12 * s, m[2]];
const seatPos = (m: V3, dx = 0): V3 => [m[0] + dx, m[1] + 1.05, m[2] + 2.5];
const seatLook = (m: V3): V3 => [m[0], m[1] + 0.82, m[2]];

const a = (id: number) => SHOTS[id - 1].a;
const VOID_POS: V3 = [0.05, 1.3, 1.1], VOID_LOOK: V3 = [0.05, 1.35, -1.6];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(VOID_POS, VOID_LOOK, 0, 0.0012, 46, W("tears")) }],
  2: [{ f: a(2), s: hold([0, 1.55, 2.2], [0, 1.15, -2.1], a(2), 0.0012, 50) }],
  3: [{ f: a(3), s: hold(seatPos(M.ivan, 0.15), seatLook(M.ivan), a(3), 0.0022, 40, W("refuses")) },
      { f: W("children") - 3, cut: true, s: hold(seatPos(M.alyosha, -0.1), seatLook(M.alyosha), W("children") - 3, 0.0022, 40) }],
  4: [{ f: a(4), s: hold(seatPos(M.ivan, 0.35), seatLook(M.ivan), a(4), 0.0018, 42, W("inquisitor")) }],
  5: [{ f: a(5), s: hold([0.2, 2.4, 5.2], [0.3, 2.2, -8.5], a(5), 0.001, 52) },
      { f: W("cardinal") - 3, cut: true, s: hold([1.55, 2.75, -5.9], [1.6, 2.55, -9.25], W("cardinal") - 3, 0.002, 44) },
      { f: W("prison") - 3, cut: true, s: hold([0.2, 2.8, 3.2], [0.1, 1.2, -5.2], W("prison") - 3, 0.0016, 50) }],
  6: [{ f: a(6), s: hold([0.05, 1.45, 2.8], [0.15, 1.25, -2.3], a(6), 0.0012, 52, W("power")) }],
  7: [{ f: a(7), s: hold(cuPos(M.inq, SI, 0.2), cuLook(M.inq, SI), a(7), 0.0024, 40, W("freely")) }],
  8: [{ f: a(8), s: hold([0.2, 1.6, 2.4], [0.2, 1.3, -1.7], a(8), 0.0014, 54, W("worship")) }],
  9: [{ f: a(9), s: hold(cuPos(M.inq, SI, -0.15), cuLook(M.inq, SI), a(9), 0.0022, 40, W("lie"), 0.008) }],
  10: [{ f: a(10), s: hold(seatPos(M.alyosha, -0.1), seatLook(M.alyosha), a(10), 0.002, 40, W("secret"), 0.006) },
       { f: W("cardinal3") - 3, cut: true, s: hold(seatPos(M.ivan, 0.15), seatLook(M.ivan), W("cardinal3") - 3, 0.0018, 40) }],
  11: [{ f: a(11), s: hold([-0.3, 1.25, 0.65], [-0.35, 1.0, -1.95], a(11), 0.0026, 40) }],
  12: [{ f: a(12), s: hold([0.15, 1.6, 1.7], [0.2, 1.4, -1.7], a(12), 0.0016, 48, W("kisses"), 0.004) }],
  13: [{ f: a(13), s: hold([0.9, 1.65, 2.4], [-0.9, 1.2, -1.2], a(13), 0.0012, 52) }],
  14: [{ f: a(14), s: hold(cuPos(M.inq, SI, 0.1, 2.6), cuLook(M.inq, SI), a(14), 0.0022, 40, W("heart")) }],
  15: [{ f: a(15), s: hold(seatPos(M.ivan, 0.2), seatLook(M.ivan), a(15), 0.0024, 40, W("disown")) }],
  16: [{ f: a(16), s: hold([-0.15, 1.45, 1.4], [-0.2, 1.15, -2.05], a(16), 0.0016, 46, W("plagiarism")) }],
  17: [{ f: a(17), s: hold([0, 1.5, 2.3], [0, 1.15, -2.1], a(17), 0.0012, 50) }],
  18: [{ f: a(18), s: hold(VOID_POS, VOID_LOOK, a(18), 0.0012, 46, W("given2")) }],
};
const KICKS: [number, number][] = [[WORD.prison, 0.6], [WORD.lie, 0.8], [WORD.secret, 0.4], [WORD.door, 0.4], [WORD.plagiarism, 0.5]];
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
  { f: 0, cInf: 9, focus: () => [0, 1.15, -1.6] },
  { f: a(2), cInf: 7, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(3), cInf: 12, focus: () => eyesOf(M.ivan, SIT) },
  { f: W("children") - 3, cInf: 12, focus: () => eyesOf(M.alyosha, SIT) },
  { f: a(4), cInf: 11, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(5), cInf: 0 },
  { f: W("cardinal") - 3, cInf: 9, focus: () => eyesOf(M.inq5, 0, SI) },
  { f: W("prison") - 3, cInf: 0 },
  { f: a(6), cInf: 8, focus: () => eyesOf(M.prisRock, SIT) },
  { f: a(7), cInf: 13, focus: () => eyesOf(M.inq, 0, SI) },
  { f: a(8), cInf: 8, focus: () => eyesOf(M.inq, 0, SI) },
  { f: a(9), cInf: 13, focus: () => eyesOf(M.inq, 0, SI) },
  { f: a(10), cInf: 12, focus: () => eyesOf(M.alyosha, SIT) },
  { f: W("cardinal3") - 3, cInf: 12, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(11), cInf: 13, focus: () => eyesOf(M.prisBench, SIT) },
  { f: a(12), cInf: 9, focus: () => eyesOf(M.prisKiss) },
  { f: a(13), cInf: 6, focus: () => eyesOf(M.doorIn) },
  { f: a(14), cInf: 13, focus: () => eyesOf(M.inq, 0, SI) },
  { f: a(15), cInf: 13, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(16), cInf: 10, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(17), cInf: 7, focus: () => eyesOf(M.ivan, SIT) },
  { f: a(18), cInf: 9, focus: () => [0, 1.15, -1.6] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
