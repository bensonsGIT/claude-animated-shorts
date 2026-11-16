import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the wombat cube-poo short: shots timed to the voice words (~/wombat-short/voice/words.json) and the
// house camera grammar: continuous slow push-ins; symmetric ease-in-out moves ~23 f; big reframes are cuts; impacts are
// 7-frame kicks that flip sign every frame; no hand-held float.
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

// ---------------- (hidden) bridge physics, tau = story time in seconds ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4);
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1;
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau);
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26);
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;
export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = LightName;
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
/** sets: bush.ts (the Tasmanian bush: latrine rock, log, burrow), lab.ts (the Atlanta lab; the prize stage) */
export type ShotSet = "out" | "bush" | "lab" | "stage";
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
const night = room("bush", "moon"), day = room("bush", "day"), lab = room("lab", "lab"), stage = room("stage", "night");
export const SHOTS: ShotDef[] = [
  night(1, 0, cf(1)), // "Somewhere in Australia, an animal is pooping perfect little cubes!"
  day(2, cf(1), cf(2)), // "It's the wombat, a chubby burrower with very short legs."
  night(3, cf(2), cf(3)), // "Every night, it leaves dozens of cubes on rocks and logs to mark its turf."
  lab(4, cf(3), cf(4)), // "For years, nobody knew how a round tube could make a square poo."
  day(5, cf(4), cw("guts")), // "Then a scientist in Australia sent two engineers in Atlanta the"
  lab(6, cw("guts"), cf(5)), // "guts of two roadkill wombats, frozen!"
  lab(7, cf(5), cf(6)), // "One of them said they opened those intestines like it was Christmas!"
  lab(8, cf(6), cf(7)), // "They slid long skinny balloons inside and blew them up, to see where the gut stretched."
  lab(9, cf(7), cf(8)), // "Around the wall, they found two stiff bands and two stretchy ones."
  lab(10, cf(8), cf(9)), // "Near the end, the poo dries out, and that uneven squeeze presses in the corners!"
  day(11, cf(9), cf(10)), // "So the cubes are shaped inside the wombat, not on the way out."
  lab(12, cf(10), cf(11)), // "The lead scientist, Patricia Yang, even tested whether they roll like dice!"
  stage(13, cf(11), cf(12)), // "In 2019, the team won an Ig Nobel Prize for physics!"
  lab(14, cf(12), cf(13)), // "Now Yang hopes factories can learn a new way to make cubes."
  night(15, cf(13), TOTAL), // "Until then, the best cube machine on Earth is still a wombat!"
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 10, 3: 10, 4: 12, 5: 12, 6: 10, 11: 12, 12: 12, 13: 12, 14: 12, 15: 14 };
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

// ---------------- staging ----------------
/** marks (x, floor y, z). Bush: the rock at the origin (top y .52), the log at (-2.6, -1.6), the burrow at (2.4, -2.2).
 *  Lab: bench x -1.35..1.35, z -1.05..-.25 (top .92), whiteboard on the back wall (z -3.15). Stage: lectern at (1.25, -1.7). */
export const TOP = 0.52, BTOP = 0.92;
export const MARK = {
  rockWombat: [0.12, TOP, 0.08] as V3,
  yang: [-0.36, 0, -1.55] as V3, hu: [0.4, 0, -1.6] as V3,
  esky: [0.0, BTOP, -0.62] as V3,
  huBoard: [-0.85, 0, -2.6] as V3, yangBoard: [-0.85, 0, -2.6] as V3,
  ranger: [0.75, 0, 0.55] as V3, eskyBush: [0.05, 0, 1.0] as V3,
  xray: [0.0, 0, 0.8] as V3,
  yangDice: [-0.3, 0, -1.55] as V3,
  yangStage: [-0.38, 0, -1.3] as V3, huStage: [0.42, 0, -1.38] as V3,
};
/** shot 2: the wombat waddles out of the burrow toward +x */
export const wombat2X = (t: number) => 2.25 + 0.3 * Math.max(0, t - T(cf(1)) - 0.7);
/** shot 2: how far the wombat is still down the hole (m) */
export const wombat2Sink = (t: number) => 0.5 * (1 - smooth((t - T(cf(1)) + 0.1) / 0.7));
/** shot 3: the wombat walks along the log toward +x and stops to mark it */
export const wombat3X = (t: number) => Math.min(-2.0, -3.3 + 0.4 * Math.max(0, t - T(cf(2))));
/** shot 11: slow walk across the frame */
export const wombat11X = (t: number) => -0.02 + 0.05 * (t - T(cf(9)));
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

const S1a = (f: number) => dolly([-0.85, 1.08, 3.45], [0.02, 0.74, 0.05], pushK(f, 0, 0.0012), { fov: 40 });
const S1b = (f: number) => dolly([-0.85, 1.08, 3.45], [0.02, 0.74, 0.05], pushK(f, 0, 0.0012) * pushK(f, W("cubes") - 3, 0, 0.007, 30), { fov: 40 });
const S2a = (f: number): Shot => { const x = wombat2X(T(f)); return dolly([x - 0.1, 0.85, 2.6], [x + 0.2, 0.45, -0.9], pushK(f, cf(1), 0.001), { fov: 42 }); };
const S2b = (f: number): Shot => { const x = wombat2X(T(f)); return { pos: [x + 0.25, 0.26, 0.45], look: [x + 0.1, 0.2, -0.9], fov: 40 }; };
const S3a = (f: number) => dolly([0.4, 1.25, 3.0], [-0.1, 0.55, 0.0], pushK(f, cf(2), 0.0008), { fov: 42 });
const S3b = (f: number) => dolly([-2.55, 1.2, 2.3], [-3.0, 0.62, -1.6], pushK(f, W("logs"), 0.0012), { fov: 42 });
const S4a = (f: number) => dolly([-0.2, 1.62, 2.2], [-0.15, 1.5, -3.0], pushK(f, cf(3), 0.0012), { fov: 40 });
const S4b = (f: number) => dolly([-0.2, 1.62, 2.2], [-0.15, 1.5, -3.0], pushK(f, cf(3), 0.0012) * pushK(f, W("poo") - 3, 0, 0.006, 30), { fov: 40 });
const S5a = (f: number) => dolly([0.75, 1.35, 4.4], [0.4, 0.95, 0.6], pushK(f, cf(4), 0.0012), { fov: 42 });
const S6a = (f: number) => dolly([0.0, 1.65, 3.2], [0.0, 1.35, -1.0], pushK(f, cw("guts"), 0.0016), { fov: 40 });
const S6b = (f: number) => dolly([0.0, 1.65, 3.2], [0.0, 1.35, -1.0], pushK(f, cw("guts"), 0.0016) * pushK(f, W("frozen") - 3, 0, 0.007, 30), { fov: 40 });
const S7a = (f: number) => dolly([-0.3, 1.6, 2.7], [0.0, 1.4, -1.0], pushK(f, cf(5), 0.0012), { fov: 40 });
const S7b = (f: number) => dolly([-0.3, 1.6, 2.7], [0.0, 1.4, -1.0], pushK(f, cf(5), 0.0012) * pushK(f, W("christmas") - 3, 0, 0.006, 30), { fov: 40 });
const S8a = (f: number) => dolly([0.05, 1.5, 1.3], [0.0, 1.15, -0.75], pushK(f, cf(6), 0.0014), { fov: 40 });
const S9a = (f: number) => dolly([0.0, 1.62, 0.45], [0.0, 1.6, -3.15], pushK(f, cf(7), 0.0012), { fov: 40 });
const S10a = (f: number) => dolly([0.0, 1.62, 0.45], [0.0, 1.6, -3.15], pushK(f, cf(8), 0.0012), { fov: 40 });
const S10b = (f: number) => dolly([0.0, 1.62, 0.45], [0.0, 1.6, -3.15], pushK(f, cf(8), 0.0012) * pushK(f, W("corners") - 3, 0, 0.007, 30), { fov: 40 });
const S11a = (f: number) => dolly([0.0, 0.72, 4.5], [0.0, 0.4, 0.8], pushK(f, cf(9), 0.0012), { fov: 40 });
const S11b = (f: number) => dolly([0.0, 0.72, 4.5], [0.0, 0.4, 0.8], pushK(f, cf(9), 0.0012) * pushK(f, W("inside2") - 3, 0, 0.006, 30), { fov: 40 });
const S12a = (f: number) => dolly([0.3, 1.5, 1.9], [-0.05, 1.18, -0.9], pushK(f, cf(10), 0.0012), { fov: 40 });
const S12b = (f: number) => dolly([0.3, 1.5, 1.9], [-0.05, 1.18, -0.9], pushK(f, cf(10), 0.0012) * pushK(f, W("dice") - 3, 0, 0.007, 30), { fov: 40 });
const S13a = (f: number) => dolly([0.0, 1.55, 3.6], [0.0, 1.32, -1.3], pushK(f, cf(11), 0.0012), { fov: 40 });
const S13b = (f: number) => dolly([0.0, 1.55, 3.6], [0.0, 1.32, -1.3], pushK(f, cf(11), 0.0012) * pushK(f, W("physics") - 3, 0, 0.006, 30), { fov: 40 });
const S14a = (f: number) => dolly([-0.2, 1.62, 2.2], [-0.15, 1.5, -3.0], pushK(f, cf(12), 0.0012), { fov: 40 });
const S15a = (f: number) => dolly([-0.85, 1.08, 3.45], [0.02, 0.74, 0.05], pushK(f, cf(13), 0.0012), { fov: 40 });
const S15b = (f: number) => dolly([-0.85, 1.08, 3.45], [0.02, 0.74, 0.05], pushK(f, cf(13), 0.0012) * pushK(f, W("wombat3") - 3, 0, 0.007, 30), { fov: 40 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: W("cubes") - 3, cut: true, s: S1b }],
  2: [{ f: cf(1), s: S2a }, { f: cw("short"), cut: true, s: S2b }],
  3: [{ f: cf(2), s: S3a }, { f: W("logs") - 4, dur: 18, s: S3b }],
  4: [{ f: cf(3), s: S4a }, { f: W("poo") - 3, cut: true, s: rolled(S4b, 0.03) }],
  5: [{ f: cf(4), s: S5a }],
  6: [{ f: cw("guts"), s: S6a }, { f: W("frozen") - 3, cut: true, s: S6b }],
  7: [{ f: cf(5), s: S7a }, { f: W("christmas") - 3, cut: true, s: S7b }],
  8: [{ f: cf(6), s: S8a }],
  9: [{ f: cf(7), s: S9a }],
  10: [{ f: cf(8), s: S10a }, { f: W("corners") - 3, cut: true, s: S10b }],
  11: [{ f: cf(9), s: S11a }, { f: W("inside2") - 3, cut: true, s: S11b }],
  12: [{ f: cf(10), s: S12a }, { f: W("dice") - 3, cut: true, s: rolled(S12b, -0.03) }],
  13: [{ f: cf(11), s: S13a }, { f: W("physics") - 3, cut: true, s: S13b }],
  14: [{ f: cf(12), s: S14a }],
  15: [{ f: cf(13), s: S15a }, { f: W("wombat3") - 3, cut: true, s: S15b }],
};

const KICKS: [number, number][] = [[WORD.cubes, 0.8], [WORD.square, 0.4], [WORD.poo, 0.6], [WORD.frozen, 0.9], [WORD.christmas, 0.8],
  [WORD.blew, 0.4], [WORD.stiff, 0.4], [WORD.corners, 0.9], [WORD.out2, 0.6], [WORD.dice, 0.8], [WORD.physics, 0.9], [WORD.wombat3, 0.7]];
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
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const M = MARK;
export const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: () => [0.1, 0.8, 0.08] },
  { f: cf(1), cInf: 8, focus: (f) => [wombat2X(T(f)) + 0.2, 0.35, -0.9] },
  { f: cf(2), cInf: 6, focus: () => [-0.1, 0.6, 0.0] },
  { f: W("logs") - 4, dur: 18, cInf: 6, focus: () => [-2.75, 0.65, -1.6] },
  { f: cf(3), cInf: 5, focus: () => [-0.4, 1.6, -3.0] },
  { f: cf(4), cInf: 8, focus: () => eyesOf(M.ranger) },
  { f: cw("guts"), cInf: 7, focus: () => [0, 1.15, -0.62] },
  { f: cf(6), cInf: 9, focus: () => [0, 1.05, -0.62] },
  { f: cf(7), cInf: 4, focus: () => [0, 1.62, -3.15] },
  { f: cf(9), cInf: 9, focus: () => [0, 0.4, 0.8] },
  { f: cf(10), cInf: 10, focus: () => [0, 1.0, -0.62] },
  { f: cf(11), cInf: 7, focus: () => eyesOf(M.yangStage) },
  { f: cf(12), cInf: 5, focus: () => [-0.4, 1.6, -3.0] },
  { f: cf(13), cInf: 8, focus: () => [0.1, 0.8, 0.08] },
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
