import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Peter the Great beard-tax short: shots timed to the voice words (~/peter-short/voice/words.json) and the
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
/** sets: banquet.ts (Moscow feast hall 1698), moscow.ts (city wall, gate, toll booth, street), mint.ts (token striking),
 *  wharf.ts (riverside shipyard), heaven.ts (the imagined gate); "out" = the hidden bridge world */
export type ShotSet = "out" | "banquet" | "moscow" | "mint" | "wharf" | "heaven";
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
const hall = room("banquet", "night"), city = room("moscow", "day"), mint = room("mint", "sun"), wharf = room("wharf", "day"), heaven = room("heaven", "lab");
export const SHOTS: ShotDef[] = [
  hall(1, 0, cf(1)), // "A ruler once came home from a trip, pulled out a razor at his own welcome party, and started shaving his guests!"
  city(2, cf(1), cf(2)), // "In 1698, the tsar returned from Western Europe, where the fashionable men were clean-shaven."
  city(3, cf(2), cf(3)), // "His name was Peter the Great, and at six foot eight, nobody argued."
  hall(4, cf(3), cw("lost")), // "One by one, Russia's proudest nobles"
  hall(5, cw("lost"), cf(4)), // "lost their beards to his own hand."
  { ...hall(6, cf(4), cf(5)), sunAz: -35 }, // "To many Russians, a beard was holy, and shaving it was a sin."
  city(7, cf(5), cf(6)), // "Soon, police could shave any bearded man on sight!"
  hall(8, cf(6), cf(7)), // "Then Peter offered a deal: keep your beard, but pay for it every year."
  city(9, cf(7), cf(8)), // "A rich merchant paid up to a hundred rubles."
  city(10, cf(8), cf(9)), // "A peasant paid a kopek every time he walked through the city gates."
  mint(11, cf(9), cw("nose")), // "Payers had to carry a copper token stamped with a"
  mint(12, cw("nose"), cw("burden")), // "nose, a mouth and a beard! One version even carried a message: the beard is a superfluous"
  city(13, cw("burden"), cf(11)), // "burden."
  wharf(14, cf(11), cf(12)), // "But some shaved men had a bigger worry."
  wharf(15, cf(12), cf(13)), // "An English captain met a carpenter who kept his cut-off beard tucked inside his coat."
  heaven(16, cf(13), cf(14)), // "He planned to be buried with it, so he could explain himself to Saint Nicholas!"
  city(17, cf(14), cf(15)), // "The tax outlived Peter by almost fifty years."
  hall(18, cf(15), TOTAL), // "All because one tsar came home and reached for a razor!"
];
/** crossfades (frames) at place changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 10, 4: 10, 7: 10, 8: 10, 9: 10, 11: 10, 13: 8, 14: 12, 16: 14, 17: 12, 18: 10 };
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
/** staging marks (x, floor y, z). Banquet: open floor in front of the table end (z 3.5..11.5); Moscow: wall at
 *  z = -8, booth outside at x 3.3, street inside (z < -9); Mint: coin table at (3.4, -4.6); wharf bank top y 0.5 */
export const MARK = {
  guests: [[-1.1, 0, 4.6], [-0.25, 0, 4.0], [0.65, 0, 4.3], [1.25, 0, 5.3], [-0.8, 0, 6.6], [0.55, 0, 7.0]] as V3[],
  b1: [-0.95, 0, 9.0] as V3, b2: [-0.4, 0, 7.6] as V3, b3: [0.15, 0, 6.2] as V3,
  iconBoyar: [4.7, 0, 6.2] as V3, icon: [6.94, 2.55, 5.2] as V3,
  dealPeter: [0.0, 0, 6.4] as V3, dealB: [[-1.35, 0, 4.4], [1.25, 0, 4.2]] as V3[],
  peterStop: [0.0, 0, -12.4] as V3, shortBoyar: [-0.72, 0, -12.1] as V3,
  folk: [[-1.3, 0, -10.2], [1.35, 0, -11.0], [-1.45, 0, -13.2], [1.5, 0, -14.6]] as V3[],
  walker: [0.5, 0, -15.9] as V3, police: [1.95, 0, -18.9] as V3, policeOut: [1.3, 0, -16.9] as V3,
  merchant: [-2.65, 0, -13.85] as V3, clerk: [-1.35, 0, -14.75] as V3,
  peasant: [2.3, 0, -4.85] as V3, keeper: [3.9, 0, -5.4] as V3,
  minter: [3.4, 0, -5.4] as V3, anvil: [3.25, 0.9, -4.75] as V3,
  oldman: [0.3, 0, -13.0] as V3,
  carp: [-1.25, 0.5, 2.3] as V3, perry: [-0.32, 0.5, 2.75] as V3, perryIn: [1.7, 0.5, 3.1] as V3,
  carpGate: [0.0, 0, -3.3] as V3,
  gatePolice: [-1.15, 0, -6.3] as V3,
};
/** Peter's card is drawn this much taller than everyone (6 ft 8) */
export const PETER_SCALE = 1.25;
/** the Mint's fly-bar: a slow idle swing (the hammer does the striking in this short) */
export const mintStrike = (t: number) => 0.25 * Math.sin(t * 0.7);
/** heaven's glow: a bright pulse on "Nicholas", decaying */
export const heavenPulse = (t: number) => { const d = t - WORD.nicholas + 0.07; return d < 0 ? 0 : Math.exp(-d * 1.6) * Math.min(1, d * 8); };
/** hammer strikes at the Mint and on the wharf (s) */
export const MINT_HITS = [WORD.copper - 0.03, WORD.token - 0.03, WORD.stamped - 0.03];
export const CARP_HITS = [BEAT[11] + 0.15, WORD.some + 0.05, WORD.shaved + 0.1, WORD.men2 + 0.1, WORD.bigger - 0.1];
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0, s = 1): V3 => [m[0], m[1] + EYE * s + dy, m[2]];

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
/** the token close-up: a fixed camera in the Mint looking -z, the token card held 0.6 m in front */
export const TOKEN_CAM = { pos: [0.35, 1.35, -1.0] as V3, look: [0.35, 1.35, -3.0] as V3, fov: 40 };
const S1a = (f: number) => dolly([0.4, 1.75, 12.2], [0.05, 1.45, 5.2], pushK(f, 0, 0.0007), { fov: 46 });
const S1b = (f: number) => dolly([0.4, 1.75, 12.2], [0.05, 1.45, 5.2], pushK(f, 0, 0.0007) * pushK(f, W("razor") - 4, 0, 0.004, 30), { fov: 46 });
const S2a = (f: number) => dolly([0.9, 1.45, -17.8], [0.0, 2.3, -8.5], pushK(f, cf(1), 0.0016), { fov: 48 });
const S3a = (f: number) => dolly([0.95, 0.5, -16.9], [-0.25, 2.0, -12.3], pushK(f, cf(2), 0.0012), { fov: 46 });
const S3b = (f: number) => dolly([0.95, 0.5, -16.9], [-0.25, 2.0, -12.3], pushK(f, cf(2), 0.0012) * pushK(f, W("argued") - 3, 0, 0.006, 30), { fov: 46 });
const S4a = (f: number) => dolly([1.5, 1.8, 13.4], [-0.45, 1.45, 7.9], pushK(f, cf(3), 0.001), { fov: 42 });
const S5a = (f: number) => dolly([1.75, 1.7, 11.9], [0.0, 1.45, 6.7], pushK(f, cw("lost"), 0.0012, 0.005, 30), { fov: 42 });
const S6a = (f: number) => dolly([2.1, 1.6, 10.6], [5.0, 1.55, 5.9], pushK(f, cf(4), 0.001), { fov: 44 });
const S6b = (f: number) => dolly([2.1, 1.6, 10.6], [5.0, 1.55, 5.9], pushK(f, cf(4), 0.001) * pushK(f, W("sin") - 2, 0, 0.006, 30), { fov: 44 });
const S7a = (f: number) => dolly([-0.55, 1.65, -10.6], [1.0, 1.25, -16.9], pushK(f, cf(5), 0.001), { fov: 40 });
const S8a = (f: number) => dolly([0.5, 2.0, 12.4], [0.0, 1.95, 6.4], pushK(f, cf(6), 0.001), { fov: 40 });
const S8b = (f: number) => dolly([0.5, 2.0, 12.4], [0.0, 1.95, 6.4], pushK(f, cf(6), 0.001) * pushK(f, W("pay") - 3, 0, 0.005, 30), { fov: 40 });
const S9a = (f: number) => dolly([-1.7, 1.6, -9.5], [-2.1, 1.3, -14.3], pushK(f, cf(7), 0.0012), { fov: 42 });
const S10a = (f: number) => dolly([0.4, 1.55, -0.6], [2.9, 1.35, -5.3], pushK(f, cf(8), 0.0022), { fov: 40 });
const S11a = (f: number) => dolly([2.45, 1.45, -1.5], [3.35, 1.15, -4.9], pushK(f, cf(9), 0.0026), { fov: 40 });
const S12a = (f: number) => ({ ...TOKEN_CAM, pos: [TOKEN_CAM.pos[0], TOKEN_CAM.pos[1], TOKEN_CAM.pos[2] - 0.1 * (1 - pushK(f, cw("nose"), 0.003))] as V3 });
const S13a = (f: number) => dolly([0.65, 1.7, -10.2], [0.3, 1.65, -13.0], pushK(f, cw("burden"), 0.003), { fov: 40 });
const S14a = (f: number) => dolly([0.35, 2.0, 7.6], [-0.6, 1.6, 2.5], pushK(f, cf(11), 0.001), { fov: 40 });
const S15a = (f: number) => dolly([-0.75, 1.9, 6.9], [-0.68, 1.55, 2.5], pushK(f, cf(12), 0.001), { fov: 40 });
const S15b = (f: number) => dolly([-0.75, 1.9, 6.9], [-0.68, 1.55, 2.5], pushK(f, cf(12), 0.001) * pushK(f, W("coat") - 3, 0, 0.005, 30), { fov: 40 });
const S16a = (f: number) => dolly([0.45, 1.45, 0.7], [0.0, 1.35, -4.3], pushK(f, cf(13), 0.0012), { fov: 50 });
const S16b = (f: number) => dolly([0.45, 1.45, 0.7], [0.0, 1.35, -4.3], pushK(f, cf(13), 0.0012) * pushK(f, W("nicholas") - 2, 0, 0.006, 30), { fov: 50 });
const S17a = (f: number) => dolly([1.0, 1.65, 0.2], [0.0, 1.7, -7.6], pushK(f, cf(14), 0.0008), { fov: 44 });
const S18a = (f: number) => dolly([0.4, 1.75, 12.2], [0.05, 1.45, 5.2], pushK(f, cf(15), 0.0008), { fov: 46 });
const S18b = (f: number) => dolly([0.4, 1.75, 12.2], [0.05, 1.45, 5.2], pushK(f, cf(15), 0.0008) * pushK(f, W("razor2") - 4, 0, 0.004, 30), { fov: 46 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: W("razor") - 4, cut: true, s: S1b }],
  2: [{ f: cf(1), s: S2a }],
  3: [{ f: cf(2), s: S3a }, { f: W("argued") - 3, cut: true, s: rolled(S3b, 0.05) }],
  4: [{ f: cf(3), s: S4a }],
  5: [{ f: cw("lost"), s: S5a }],
  6: [{ f: cf(4), s: S6a }, { f: W("sin") - 2, cut: true, s: rolled(S6b, -0.04) }],
  7: [{ f: cf(5), s: S7a }, { f: W("sight") - 3, dur: 14, s: rolled(S7a, 0.05) }],
  8: [{ f: cf(6), s: S8a }, { f: W("pay") - 3, cut: true, s: S8b }],
  9: [{ f: cf(7), s: S9a }, { f: W("hundred") - 2, dur: 12, s: rolled(S9a, -0.04) }],
  10: [{ f: cf(8), s: S10a }],
  11: [{ f: cf(9), s: S11a }],
  12: [{ f: cw("nose"), s: S12a }],
  13: [{ f: cw("burden"), s: S13a }],
  14: [{ f: cf(11), s: S14a }],
  15: [{ f: cf(12), s: S15a }, { f: W("coat") - 3, cut: true, s: rolled(S15b, 0.04) }],
  16: [{ f: cf(13), s: S16a }, { f: W("nicholas") - 2, cut: true, s: S16b }],
  17: [{ f: cf(14), s: S17a }],
  18: [{ f: cf(15), s: S18a }, { f: W("razor2") - 4, cut: true, s: S18b }],
};

const KICKS: [number, number][] = [[WORD.shaving, 0.8], [WORD.argued, 0.5], [WORD.one2, 0.7], [WORD.lost, 0.7], [WORD.beards, 0.6], [WORD.sin, 0.5],
  [WORD.sight, 1.0], [WORD.deal, 0.4], [WORD.hundred + 0.12, 0.9], [WORD.copper, 0.5], [WORD.token, 0.4], [WORD.stamped, 0.4], [WORD.coat, 0.5],
  [WORD.nicholas, 0.6], [WORD.fifty, 0.4], [WORD.razor2, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = id === 12 ? 0 : kickAt(T(f));
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
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: cf(1), cInf: 0 },
  { f: cf(2), cInf: 10, focus: () => eyesOf(M.peterStop, 0, PETER_SCALE) },
  { f: cf(3), cInf: 8, focus: () => eyesOf(M.b1) },
  { f: cw("lost"), cInf: 9, focus: () => eyesOf(M.b2) },
  { f: cf(4), cInf: 11, focus: () => eyesOf(M.iconBoyar) },
  { f: cf(5), cInf: 7, focus: () => [0.6, 1.5, -16.2] },
  { f: cf(6), cInf: 11, focus: () => eyesOf(M.dealPeter, 0, PETER_SCALE) },
  { f: cf(7), cInf: 10, focus: () => [-2.0, 1.55, -14.2] },
  { f: cf(8), cInf: 8, focus: () => [3.0, 1.5, -5.1] },
  { f: cf(9), cInf: 9, focus: () => eyesOf(M.minter, -0.2) },
  { f: cw("nose"), cInf: 14, focus: () => [TOKEN_CAM.pos[0], TOKEN_CAM.pos[1], TOKEN_CAM.pos[2] - 0.6] },
  { f: cw("burden"), cInf: 12, focus: () => eyesOf(M.oldman) },
  { f: cf(11), cInf: 8, focus: () => eyesOf(M.carp) },
  { f: cf(12), cInf: 10, focus: () => [-0.55, 2.0, 3.0] },
  { f: cf(13), cInf: 9, focus: () => eyesOf(M.carpGate) },
  { f: cf(14), cInf: 0 },
  { f: cf(15), cInf: 0 },
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
