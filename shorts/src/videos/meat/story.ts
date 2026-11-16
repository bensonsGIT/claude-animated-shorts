import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Kentucky Meat Shower short: shots timed to the voice words (~/meat-short/voice/words.json) and the
// camera grammar measured in the reference study: continuous slow push-ins; symmetric ease-in-out moves ~23 f;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
// The bridge physics below is kept only because the (hidden) bridge world still builds from it.
export const FPS = 30;
import { D0 } from "../../engine/build";
export { D0 };
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of the front row, marching toward -z
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz cycle = 2 steps/s, footfalls at 0 and 0.5
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau); // "a little harder every step"
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26); // 1 on the near half, 0 at the far tower
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = LightName;
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
/** sets: farm.ts (the Crouch farm, 1876), office.ts (a doctor's study); "out" = the hidden bridge world */
export type ShotSet = "out" | "farm" | "office";
export type ShotDef = {
  id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean;
  set?: ShotSet; sunAz?: number; sunEl?: number; mode?: string;
};
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const room = (set: ShotSet, light: Light) => (id: number, a: number, b: number): ShotDef =>
  ({ id, a, b, light, crowd: "none", tau: (t) => t, set });
const farm = room("farm", "day"), office = room("office", "sun");
export const SHOTS: ShotDef[] = [
  farm(1, 0, cf(1)), // "In 1876, it rained meat in Kentucky!"
  farm(2, cf(1), cw("chunks")), // "Mrs. Crouch was outside making soap when"
  farm(3, cw("chunks"), cf(2)), // "chunks of raw flesh started falling from a clear blue sky."
  farm(4, cf(2), cf(3)), // "For a few minutes, it covered a strip of land the size of a football field."
  farm(5, cf(3), cf(4)), // "The biggest pieces were four inches across."
  farm(6, cf(4), cf(5)), // "Two men came to investigate."
  farm(7, cf(5), cf(6)), // "And they did the obvious thing. They tasted it!"
  farm(8, cf(6), cf(7)), // "Their verdict: mutton. Or maybe venison."
  office(9, cf(7), cf(8)), // "One scientist insisted it was a kind of algae."
  office(10, cf(8), cw("lung")), // "Then the microscopes came out. It was"
  office(11, cw("lung"), cf(9)), // "lung, muscle and cartilage."
  office(12, cf(9), cf(10)), // "One doctor said the lung came from either a horse, or a human baby."
  farm(13, cf(10), cf(11)), // "The leading theory: vultures."
  farm(14, cf(11), cf(12)), // "Vultures throw up their meals to lighten the load, so they can take off faster."
  farm(15, cf(12), cf(13)), // "A flock passing overhead had simply lost its lunch."
  farm(16, cf(13), cf(14)), // "Which means two men in Kentucky had tasted vulture vomit!"
  office(17, cf(14), TOTAL), // "And a piece of it is still kept in a jar."
];
/** crossfades (frames) at place changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 9: 10, 13: 10, 17: 10 };
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

const CALM: BridgeState = { bounce: 0, drop: 0, snap: 0, collapsed: false };
export const bridgeState = (_id: number, _t: number): BridgeState => CALM;

// ---------------- story beats ----------------
/** staging marks (x, floor y, z) */
export const MARK = {
  crouch: [0.3, 0, -2.45] as V3,
  tasterA: [-0.3, 0, 0.45] as V3, tasterB: [0.32, 0, 0.62] as V3,
  scientist: [-0.45, 0, -1.85] as V3, doctor: [0.35, 0, -1.9] as V3,
};
/** the meat shower: falls from "rained" until the men arrive; the vultures' second helping in shot 15 */
export const RAIN = { t0: WORD.rained - 0.2, t1: BEAT[4] - 0.3 };
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

export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

const M = MARK;
/** the microscope view: a fixed camera looking straight down the axis (-z), the round field held 0.6 m in front */
export const SCOPE_CAM = { pos: [0.35, 1.3, -1.0] as V3, look: [0.35, 1.3, -3.0] as V3, fov: 40 };
const S1a = (f: number) => dolly([3.4, 2.5, 6.6], [-0.4, 1.7, -5.0], pushK(f, 0, 0.0018), { fov: 46 });
const S2a = (f: number) => dolly([1.5, 1.55, 1.2], [0.6, 1.15, -2.5], pushK(f, cf(1), 0.0022), { fov: 42 });
const S3a = (f: number) => dolly([1.2, 1.45, 0.6], [0.55, 1.25, -2.5], pushK(f, cw("chunks"), 0.0025, 0.006, 30), { fov: 42 });
const S3b = (f: number) => dolly([1.2, 1.3, 0.6], [0.6, 2.6, -2.8], pushK(f, W("sky") - 6, 0.002), { fov: 46 });
const S4a = (f: number) => dolly([6.5, 6.5, 8.5], [0.0, 0.3, -4.5], pushK(f, cf(2), 0.0016), { fov: 48 });
const S5a = (f: number) => dolly([-1.05, 1.42, 1.0], [-1.6, 1.12, -0.6], pushK(f, cf(3), 0.003, 0.007, 30), { fov: 40 });
const S6a = (f: number) => dolly([1.6, 1.75, 6.2], [0.6, 1.25, 0.3], pushK(f, cf(4), 0.0018), { fov: 42 });
const S7a = (f: number) => dolly([0.05, 1.65, 3.9], [0.05, 1.45, 0.5], pushK(f, cf(5), 0.0022), { fov: 40 });
const S7b = (f: number) => dolly([0.05, 1.65, 3.9], [0.05, 1.45, 0.5], pushK(f, cf(5), 0.0022) * pushK(f, W("tasted") - 2, 0, 0.007, 30), { fov: 40 });
const S8a = (f: number) => dolly([0.05, 1.75, 3.7], [0.02, 1.75, 0.5], pushK(f, cf(6), 0.0022), { fov: 40 });
const S9a = (f: number) => dolly([0.35, 1.55, 0.7], [-0.4, 1.45, -1.9], pushK(f, cf(7), 0.0024), { fov: 40 });
const S10a = (f: number) => dolly([1.3, 1.55, 0.2], [0.35, 1.3, -2.1], pushK(f, cf(8), 0.0024), { fov: 40 });
const S11a = (f: number) => ({ ...SCOPE_CAM, pos: [SCOPE_CAM.pos[0], SCOPE_CAM.pos[1], SCOPE_CAM.pos[2] - 0.08 * (1 - pushK(f, cw("lung"), 0.004))] as V3 });
const S12a = (f: number) => dolly([1.05, 1.55, -0.3], [0.35, 1.5, -1.9], pushK(f, cf(9), 0.0024), { fov: 38 });
const S12b = (f: number) => dolly([1.05, 1.55, -0.3], [0.35, 1.5, -1.9], pushK(f, cf(9), 0.0024) * pushK(f, W("baby") - 2, 0, 0.008, 30), { fov: 38 });
const S13a = (f: number) => dolly([0.0, 1.4, 3.0], [0.0, 9.5, -9.0], pushK(f, cf(10), 0.0018), { fov: 50 });
const S14a = (f: number) => dolly([0.0, 1.6, 2.0], [0.0, 6.0, -4.0], pushK(f, cf(11), 0.0022), { fov: 46 });
const S15a = (f: number) => dolly([5.5, 3.2, 7.5], [0.0, 3.2, -4.0], pushK(f, cf(12), 0.0016), { fov: 50 });
const S16a = (f: number) => dolly([0.05, 1.65, 3.5], [0.05, 1.6, 0.5], pushK(f, cf(13), 0.0022), { fov: 40 });
const S16b = (f: number) => dolly([0.05, 1.65, 3.5], [0.05, 1.6, 0.5], pushK(f, cf(13), 0.0022) * pushK(f, W("vomit") - 2, 0, 0.009, 30), { fov: 40 });
const S17a = (f: number) => dolly([1.35, 1.62, 1.6], [2.55, 1.62, 0.4], pushK(f, cf(14), 0.003), { fov: 38 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: cf(1), s: S2a }],
  3: [{ f: cw("chunks"), s: S3a }, { f: W("sky") - 6, dur: 22, s: S3b }],
  4: [{ f: cf(2), s: S4a }],
  5: [{ f: cf(3), s: S5a }, { f: W("four") - 3, dur: 16, s: rolled(S5a, 0.05) }],
  6: [{ f: cf(4), s: S6a }],
  7: [{ f: cf(5), s: S7a }, { f: W("tasted") - 2, cut: true, s: S7b }],
  8: [{ f: cf(6), s: S8a }, { f: W("venison") - 3, dur: 16, s: rolled(S8a, -0.04) }],
  9: [{ f: cf(7), s: S9a }],
  10: [{ f: cf(8), s: S10a }],
  11: [{ f: cw("lung"), s: S11a }],
  12: [{ f: cf(9), s: S12a }, { f: W("baby") - 2, cut: true, s: rolled(S12b, 0.05) }],
  13: [{ f: cf(10), s: S13a }],
  14: [{ f: cf(11), s: S14a }],
  15: [{ f: cf(12), s: S15a }],
  16: [{ f: cf(13), s: S16a }, { f: W("vomit") - 2, cut: true, s: rolled(S16b, 0.05) }],
  17: [{ f: cf(14), s: S17a }],
};

const KICKS: [number, number][] = [[WORD.meat - 0.03, 0.7], [WORD.chunks, 0.8], [WORD.four, 0.9], [WORD.tasted, 0.6], [WORD.mutton, 0.4],
  [WORD.lung, 0.4], [WORD.baby, 1.1], [WORD.vultures, 0.6], [WORD.up, 0.7], [WORD.lunch, 0.6], [WORD.vomit, 1.3], [WORD.jar, 0.5]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = id === 11 ? 0 : kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const MID_TASTERS: V3 = [0.05, 1.6, 0.5];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: cf(1), cInf: 10, focus: () => eyesOf(M.crouch) },
  { f: cf(2), cInf: 0 },
  { f: cf(3), cInf: 13, focus: () => [-1.6, 1.15, -0.6] },
  { f: cf(4), cInf: 6, focus: () => [0.6, 1.6, 0.5] },
  { f: cf(5), cInf: 10, focus: () => MID_TASTERS },
  { f: cf(7), cInf: 10, focus: () => eyesOf(M.scientist) },
  { f: cf(8), cInf: 9, focus: () => eyesOf(M.doctor, -0.1) },
  { f: cw("lung"), cInf: 0 },
  { f: cf(9), cInf: 12, focus: () => eyesOf(M.doctor) },
  { f: cf(10), cInf: 0 },
  { f: cf(13), cInf: 10, focus: () => MID_TASTERS },
  { f: cf(14), cInf: 12, focus: () => [2.55, 1.62, 0.4] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
export { cf, cw, W as wf };
