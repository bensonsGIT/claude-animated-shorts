import type { LightName } from "../../engine/lights";
import type { Dress } from "./parlor";
import { TOTAL, WORD, SHOT_F } from "./timing";
export { TOTAL, WORD };
// Timeline of the Franklin short ("In 1750, a man tried to kill a turkey with electricity..."): 13 shots timed to the
// narration's words (~/franklin-short/voice/words.json), all in Franklin's parlour (parlor.ts). Camera grammar from the
// reference study: continuous slow push-ins; symmetric ease-in-out moves; big reframes are cuts; impacts are 7-frame
// kicks that flip sign every frame; no hand-held float. The bridge physics below only feeds the (hidden) outdoor world.
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
export type ShotSet = "out" | "parlor";
export type ShotDef = {
  id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean;
  set?: ShotSet; sunAz?: number; sunEl?: number;
};
const room = (id: number, light: Light = "night"): ShotDef => ({ id, a: SHOT_F[id - 1], b: SHOT_F[id], light, crowd: "none", tau: (t) => t, set: "parlor" });
export const SHOTS: ShotDef[] = [
  room(1), // "In 1750, a man tried to kill a turkey with electricity, and shocked himself instead!"
  room(2), // "He'd charged two giant glass jars with as much power as forty ordinary ones."
  room(3), // "Friends gathered to watch."
  room(4), // "That man was Benjamin Franklin, one of the greatest scientists in history!"
  room(5), // "Distracted by the chatter, he touched the live wire while holding the chain."
  room(6), // "His guests saw a blinding flash and heard a crack as loud as a pistol!"
  room(7), // "Franklin saw nothing. Heard nothing. His senses were simply gone."
  room(8, "morning"), // "His arms stayed numb until morning. His chest felt bruised."
  room(9), // "He begged his brother to keep it quiet. He was ashamed."
  room(10), // "But he didn't quit! That same winter, his jars did kill a ten-pound turkey."
  room(11), // "His verdict: birds killed this way eat... 'uncommonly tender.'"
  room(12), // "Franklin won the war!"
  room(13), // "But round one went to the bird!" (flashback to the first attempt)
];
const F = (t: number) => Math.round(t * 30);
const W = WORD;
/** crossfades (frames) at place/time changes */
export const XFADE: Record<number, number> = { 9: 8, 10: 8, 11: 10, 12: 8 };
/** white flashes: [frame, peak, frames] - after the hook, the blinding flash, the zaps, the flashback */
export const FLASHES: [number, number, number][] = [
  [F(W.shocked) - 1, 0.55, 3], [SHOT_F[1], 1, 4], [F(W.flash) - 1, 1, 9], [F(W.kill2) - 1, 0.5, 3], [SHOT_F[12], 1, 4],
];
export const flashAt = (f: number) => {
  let a = 0;
  for (const [f0, k, n] of FLASHES) if (f >= f0 && f < f0 + n) a = Math.max(a, k * (1 - (f - f0) / n) ** 1.3);
  return a;
};
/** "his senses were simply gone": the frame darkens from "nothing" to "gone", then the morning fades up from black */
export const dimAt = (f: number) => {
  const t = f / 30, s8 = SHOT_F[7];
  if (f >= s8) return f < s8 + 18 ? 0.75 * (1 - (f - s8) / 18) : 0;
  if (t < W.nothing) return 0;
  const ramp = (a: number, b: number, v0: number, v1: number) => v0 + (v1 - v0) * Math.min(1, Math.max(0, (t - a) / (b - a)));
  if (t < W.heard) return ramp(W.nothing, W.nothing + 0.4, 0, 0.25);
  if (t < W.gone) return ramp(W.heard, W.heard + 0.4, 0.25, 0.42);
  return ramp(W.gone, W.gone + 1.0, 0.42, 0.75);
};

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

const CALM: BridgeState = { bounce: 0, drop: 0, snap: 0, collapsed: false };
export const bridgeState = (_id: number, _t: number): BridgeState => CALM;

// ---------------- staging (parlor.ts holds the room; cast.ts places the people on these marks) ----------------
export const MARK = {
  fr: [1.75, 0, -3.35] as V3, // Franklin at the end of the electrical table
  tk: [-0.3, 0.78, -3.48] as V3, // the turkey standing on the table
  tk13: [1.08, 0.78, -3.42] as V3, // flashback: the turkey right next to him
  guests: [[-1.55, 0, -4.75], [-0.75, 0, -5.0], [0.1, 0, -5.1], [0.95, 0, -4.9], [-2.35, 0, -3.3], [2.8, 0, -4.5]] as V3[],
  desk: [4.0, 0.31, -5.75] as V3, wing: [-4.3, 0.31, -2.2] as V3,
};
const EYE = 1.5, SEAT_EYE = 1.2;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

/** charge glow in the jars 0..1 */
const chargeAt = (id: number, t: number) => {
  const up = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  switch (id) {
    case 1: return t < W.shocked ? 0.25 + 0.75 * up(W.electricity - 0.1, W.electricity + 0.6) : 0;
    case 2: return 0.15 + 0.85 * up(W.charged - 0.1, W.charged + 1.2);
    case 3: case 4: case 5: return 0.75 + 0.15 * Math.sin(t * 7);
    case 6: return t < W.flash ? 0.8 : 0;
    case 10: return t < W.kill2 ? 0.3 + 0.7 * up(W.winter, W.kill2 - 0.2) : 0;
    case 13: return 0.35;
    default: return 0;
  }
};
export const dressAt = (id: number, f: number): Dress => {
  const t = f / 30;
  const phials = id < 2 ? 0 : id > 2 ? 40 : Math.max(0, Math.min(40, Math.floor(((t - (W.forty - 0.08)) / 0.85) * 40)));
  return { elec: id !== 11 && id !== 12, extra: id === 10, dinner: id === 11 || id === 12, phials, charge: chargeAt(id, t), morning: id === 8 };
};
// ---------------- camera ----------------
// Grammar (motion.md): every move is a symmetric smootherstep glide of 18-40 f (peak speed = 1.875 x distance / dur,
// so dur >= 0.075 x the move in 720p px keeps the peak near the reference 14-25 px/f); a reframe bigger than about
// half a frame width or 40 % zoom is a hard cut on its key frame. Glides are centred on the old key frame (the
// whoosh in the sound mix peaks there), so a glide key starts dur/2 earlier. Holds push in (dolly toward the look
// point or a fov zoom near walls/towers): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on the punch words. Rolls of 4-8 deg
// over >= 18 f on emphasis beats, held tilt <= 0.07 rad.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep (attack = release, ~10 f each on a 23 f move) */
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
const T = (f: number) => f / FPS;
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// near-left anchorage where the bolt lives, and the free end of the snapped backstay
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};


const S = SHOT_F;
const at = (t: number) => F(t) - 2; // reactions / cuts land 2 f before the word
const dz = (p: V3, l: V3, fov: number, f0: number, rate = 0.0022, punch = 0, n = 30) => (f: number) => dolly(p, l, pushK(f, f0, rate, punch, n), { fov });
// ---- framings ----
const K1a = dz([1.65, 2.05, 1.5], [0.5, 1.0, -3.7], 50, S[0], 0.0018);
const K1b = dz([-0.1, 1.22, -1.85], [-0.3, 1.1, -3.48], 38, at(W.turkey), 0.003);
const K1c = dz([1.22, 1.32, -1.55], [1.58, 1.18, -3.38], 40, at(W.shocked), 0.002, 0.006);
const K2a = dz([0.62, 1.4, -2.0], [0.5, 1.2, -3.62], 38, S[1], 0.0025);
const K2b = dz([1.0, 1.55, -1.75], [-3.4, 1.5, -7.6], 40, at(W.forty), 0.002);
const K3a = dz([0.6, 2.0, 1.9], [0.0, 1.1, -4.3], 50, S[2], 0.002);
const K4a = dz([2.35, 1.45, -0.85], [1.75, 1.3, -3.35], 38, S[3], 0.0022, 0.006);
const K5a = dz([0.9, 1.55, -1.3], [-0.35, 1.32, -4.9], 42, S[4], 0.0022);
const K5b = dz([1.05, 1.32, -1.65], [1.5, 1.22, -3.45], 36, at(W.touched), 0.003);
const K6a = dz([2.6, 1.6, -1.35], [0.55, 1.22, -4.3], 48, S[5], 0.002);
const K7a = dz([1.62, 1.55, -1.3], [1.75, 1.4, -3.35], 38, S[6], 0.0022);
const K7b = dz([1.68, 1.55, -1.75], [1.75, 1.45, -3.35], 34, at(W.heard), 0.0025);
const K8a = dz([-2.3, 1.25, 0.1], [-4.3, 0.95, -2.2], 40, S[7], 0.0018);
const K8b = dz([-2.6, 1.22, -0.35], [-4.3, 1.0, -2.2], 36, at(W.chest), 0.0025, 0.006);
const K9a = dz([3.95, 1.35, -3.25], [4.0, 1.08, -5.6], 38, S[8], 0.002);
const K9b = dz([3.97, 1.3, -3.7], [4.0, 1.12, -5.65], 32, at(W.ashamed), 0.0025);
const K10a = dz([2.3, 1.42, -0.95], [1.75, 1.3, -3.35], 38, S[9], 0.0022, 0.006);
const K10b = dz([-0.05, 1.42, -1.55], [-0.12, 1.08, -3.6], 42, at(W.winter) - 8, 0.002);
const K11a = dz([0.95, 1.45, -0.85], [1.25, 1.2, -3.45], 40, S[10], 0.002);
const K11b = dz([1.35, 1.45, -1.2], [1.72, 1.36, -3.35], 36, at(W.uncommonly), 0.003, 0.006);
const K12a = dz([1.4, 2.1, 1.3], [0.7, 1.0, -4.0], 50, S[11], 0.002);
const K13a = dz([1.5, 1.32, -0.85], [1.45, 1.12, -3.4], 46, S[12], 0.0022, 0.006);

const CAMS: Record<number, Key[]> = {
  1: [{ f: S[0], s: K1a }, { f: at(W.turkey), cut: true, s: K1b }, { f: at(W.shocked), cut: true, s: K1c }],
  2: [{ f: S[1], s: K2a }, { f: at(W.forty), cut: true, s: K2b }],
  3: [{ f: S[2], s: K3a }],
  4: [{ f: S[3], s: K4a }, { f: at(W.greatest), dur: 20, s: rolled(K4a, 0.05) }],
  5: [{ f: S[4], s: K5a }, { f: at(W.touched), cut: true, s: K5b }],
  6: [{ f: S[5], s: K6a }],
  7: [{ f: S[6], s: K7a }, { f: at(W.heard), cut: true, s: K7b }],
  8: [{ f: S[7], s: K8a }, { f: at(W.chest), cut: true, s: K8b }],
  9: [{ f: S[8], s: K9a }, { f: at(W.ashamed), cut: true, s: K9b }],
  10: [{ f: S[9], s: K10a }, { f: at(W.winter) - 8, cut: true, s: K10b }],
  11: [{ f: S[10], s: K11a }, { f: at(W.uncommonly), cut: true, s: K11b }],
  12: [{ f: S[11], s: K12a }],
  13: [{ f: S[12], s: K13a }, { f: at(W.bird), dur: 18, s: rolled(K13a, -0.05) }],
};

// impact kicks: the image offset flips sign every frame, decays to 0 in 7 f
const KICKS: [number, number][] = [[W.shocked - 0.03, 1.3], [W.flash, 0.8], [W.crack, 1.6], [W.pistol, 0.7], [W.kill2 - 0.03, 1.1], [W.turkey2, 0.5], [W.one2, 0.5]];
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


// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const frEyes = () => eyesOf(MARK.fr);
export const DOF: Dof[] = [
  { f: S[0], cInf: 0 },
  { f: at(W.turkey), cInf: 13, focus: () => [MARK.tk[0], MARK.tk[1] + 0.32, MARK.tk[2]] },
  { f: at(W.shocked), cInf: 11, focus: frEyes },
  { f: S[1], cInf: 14, focus: () => [0.5, 1.05, -3.62] },
  { f: at(W.forty), cInf: 0 },
  { f: S[2], cInf: 0 },
  { f: S[3], cInf: 12, focus: frEyes },
  { f: S[4], cInf: 9, focus: () => eyesOf(MARK.guests[1]) },
  { f: at(W.touched), cInf: 13, focus: () => [1.32, 1.15, -3.45] },
  { f: S[5], cInf: 5, focus: () => eyesOf(MARK.guests[2]) },
  { f: S[6], cInf: 14, focus: frEyes },
  { f: S[7], cInf: 10, focus: () => [MARK.wing[0], SEAT_EYE, MARK.wing[2]] },
  { f: S[8], cInf: 12, focus: () => [MARK.desk[0], SEAT_EYE, MARK.desk[2]] },
  { f: S[9], cInf: 12, focus: frEyes },
  { f: at(W.winter) - 8, cInf: 8, focus: () => [MARK.tk[0], MARK.tk[1] + 0.3, MARK.tk[2]] },
  { f: S[10], cInf: 11, focus: frEyes },
  { f: S[11], cInf: 0 },
  { f: S[12], cInf: 8, focus: () => [1.4, 1.2, -3.4] },
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
