import type { LightName } from "./lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Cadaver Synod short: shots timed to the voice words (~/formosus-short/voice/words.json) and the
// camera grammar measured in the reference study: continuous slow push-ins; symmetric ease-in-out moves ~23 f;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
// The bridge physics below is kept only because the (hidden) bridge world still builds from it.
export const FPS = 30;
export const D0 = 6.0; // bank top + deck height (m)
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
/** sets: basilica.ts (the Lateran 897 / St Peter's), cell.ts (crypt + prison), tiber.ts (the river); "out" = hidden bridge world */
export type ShotSet = "out" | "basilica" | "cell" | "tiber";
export type ShotDef = {
  id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean;
  set?: ShotSet; sunAz?: number; sunEl?: number; mode?: "synod" | "peter" | "crypt" | "prison";
};
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const room = (set: ShotSet, light: Light, mode?: ShotDef["mode"]) => (id: number, a: number, b: number): ShotDef =>
  ({ id, a, b, light, crowd: "none", tau: (t) => t, set, mode });
const synod = room("basilica", "night", "synod"), peter = room("basilica", "sun", "peter");
const crypt = room("cell", "night", "crypt"), prison = room("cell", "night", "prison");
const river = room("tiber", "moon"), bank = room("tiber", "day");
export const SHOTS: ShotDef[] = [
  synod(1, 0, cf(1)), // "In 897, a man was put on trial nine months after he died!" (cut to the corpse CU on "died")
  crypt(2, cf(1), cw("propped")), // "His body was dug up, dressed in his old robes, and"
  synod(3, cw("propped"), cf(2)), // "propped on a throne."
  synod(4, cf(2), cw("defendant")), // "The judge was Pope Stephen the Sixth. The"
  synod(5, cw("defendant"), cf(3)), // "defendant was a former pope, Formosus."
  synod(6, cf(3), cf(4)), // "A deacon stood beside the corpse to answer for him."
  synod(7, cf(4), cw("the5")), // "Stephen hurled accusations."
  synod(8, cw("the5"), cf(5)), // "The corpse stayed silent."
  synod(9, cf(5), cf(6)), // "The verdict: guilty!"
  synod(10, cf(6), cw("threw")), // "They ripped off his robes, cut off his blessing fingers, and"
  river(11, cw("threw"), cf(7)), // "threw his body into the Tiber."
  synod(12, cf(7), cf(8)), // "Then an earthquake cracked the very church where the trial was held!"
  bank(13, cf(8), cw("washed")), // "Rome was disgusted. Rumors spread that the body had"
  bank(14, cw("washed"), cf(9)), // "washed ashore and was working miracles."
  synod(15, cf(9), cw("prison")), // "Within months, Stephen was overthrown, thrown in"
  prison(16, cw("prison"), cf(10)), // "prison, and strangled!"
  peter(17, cf(10), cw("reburied")), // "The next popes cancelled the verdict and"
  peter(18, cw("reburied"), cf(11)), // "reburied Formosus in St. Peter's, in full papal robes."
  peter(19, cf(11), cf(12)), // "Legend says the saints' images bowed to him as he passed."
  peter(20, cf(12), cw("until")), // "Case closed."
  synod(21, cw("until"), cw("all")), // "Until one of the original judges became pope, and declared him guilty"
  peter(22, cw("all"), TOTAL), // "all over again!"
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 8, 12: 8, 13: 10, 15: 8, 17: 10 };
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** a white veil overlay (unused in this short) */
export const glareAt = (_f: number) => 0;

const CALM: BridgeState = { bounce: 0, drop: 0, snap: 0, collapsed: false };
export const bridgeState = (_id: number, _t: number): BridgeState => CALM;

// ---------------- story beats (seconds, from words.json; reactions land 0-3 f before their word) ----------------
/** staging marks (x, floor y, z); the set files hold the rooms, cast.ts places the people on these marks */
const SIT = 0.1; // a seated card's hips sit this far above its origin
export const MARK = {
  // the Lateran (basilica.ts): Stephen on the cathedra (seated / standing in front of it), the corpse on its throne,
  // the deacon beside it, Sergius at the front of the right-hand bench
  stephenSit: [1.0, 0.6 + 0.46 - SIT, -14.13] as V3, stephenStand: [1.0, 0.6, -13.35] as V3,
  corpse: [-1.67, 0.46 - SIT, -9.93] as V3, deacon: [-0.82, 0, -9.62] as V3, sergius: [2.28, 0.45 - SIT, -8.6] as V3,
  theodore: [-1.45, 0, -6.1] as V3,
  // the crypt (cell.ts PIT): two diggers either side of the open grave
  digL: [-0.68, 0, -1.25] as V3, digR: [0.5, 0, -1.25] as V3, grave: [-0.1, 0, -0.42] as V3,
  // the prison (cell.ts)
  cellSt: [-0.25, 0, -1.2] as V3,
  // the Tiber (tiber.ts): two throwers at the water's edge
  throwL: [-0.5, 0, -0.55] as V3, throwR: [0.5, 0, -0.55] as V3,
};
const EYE = 1.6, SIT_EYE = 0.86;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
const sitEyes = (m: V3): V3 => [m[0], m[1] + SIT_EYE, m[2]];
/** the sarcophagus lid: open (0) until it swings shut on "closed", then stays shut (1) */
export const lidAt = (t: number) => (t < WORD.closed - 0.45 ? 0 : smooth((t - (WORD.closed - 0.45)) / 0.4));
/** the last gag: the closed lid jolts up on "again" (0..1..0) */
export const joltAt = (t: number) => { const d = t - (WORD.again - 0.05); return d < 0 || d > 0.5 ? 0 : Math.sin((d / 0.5) * Math.PI) * (1 - d / 0.5); };
/** the earthquake: shaking from "earthquake" to the end of the beat (0..1 envelope) */
export const quakeAt = (t: number) => (t < WORD.earthquake - 0.1 || t > BEAT[8] - 0.4 ? 0 : Math.min(1, (t - WORD.earthquake + 0.1) / 0.3, (BEAT[8] - 0.4 - t) / 0.5));

// ---------------- camera ----------------
// Grammar (motion.md): every move is a symmetric smootherstep glide of 18-40 f; a reframe bigger than about half a
// frame width or 40 % zoom is a hard cut. Holds push in 0.15-0.35 %/f, ~0.6 %/f for ~35 f on punch words.
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

// the (hidden) bridge world still imports these
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

const M = MARK;
const CORPSE_EYE: V3 = [M.corpse[0] + 0.02, M.corpse[1] + SIT_EYE, M.corpse[2]];
const STEPH_EYE: V3 = sitEyes(M.stephenSit);
// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// 1: the synod wide down the nave (clergy benches, the corpse enthroned, Stephen on the dais) -> CU of the corpse on "died"
const S1a = (f: number) => dolly([1.8, 2.6, 3.5], [-0.5, 1.0, -11.5], pushK(f, 0, 0.0021), { fov: 46 });
const S1b = (f: number) => dolly([-0.95, 1.3, -7.65], CORPSE_EYE, pushK(f, cw("died"), 0.0026, 0.006, 30), { fov: 36 });
// 2: the crypt: the diggers haul the shrouded body out of the grave; puff into robes on "dressed"
const S2a = (f: number) => dolly([0.35, 1.6, 2.42], [-0.1, 0.85, -0.6], pushK(f, cf(1), 0.0024), { fov: 50 });
const S2b = (f: number) => dolly([0.25, 1.5, 2.4], [-0.1, 1.05, -0.6], pushK(f, cw("dressed"), 0.0025, 0.006, 30), { fov: 42 });
// 3: plop onto the throne (MS)
const S3a = (f: number) => dolly([-0.35, 1.45, -6.9], [-1.62, 1.0, -9.95], pushK(f, cw("propped"), 0.0022, 0.006, 25), { fov: 40 });
// 4: Stephen on the cathedra from below: points at the corpse on "Sixth"
const S4a = (f: number) => dolly([1.55, 1.55, -10.5], [0.95, 1.7, -14.1], pushK(f, cf(2), 0.0024), { fov: 40 });
// 5: the defendant (MS), mitre askew, a fly
const S5a = (f: number) => dolly([-0.85, 1.38, -7.4], [-1.64, 1.12, -9.95], pushK(f, cw("defendant"), 0.0024, 0.005, 30), { fov: 38 });
// 6: the deacon beside the corpse (two-shot, deacon nearer)
const S6a = (f: number) => dolly([0.1, 1.5, -5.6], [-1.25, 1.2, -9.8], pushK(f, cf(3), 0.0022), { fov: 40 });
// 7: Stephen up on his feet, yelling, scraps of accusation flying
const S7a = (f: number) => dolly([2.0, 1.95, -9.4], [0.95, 1.95, -13.4], pushK(f, cf(4), 0.0026, 0.006, 30), { fov: 40 });
// 8: the corpse, silent (slow deadpan push)
const S8a = (f: number) => dolly([-1.0, 1.32, -7.35], CORPSE_EYE, pushK(f, cw("the5"), 0.0035), { fov: 34 });
// 9: over the corpse's mitre up at Stephen: "guilty!" punch
const S9a = (f: number) => dolly([-1.25, 1.55, -8.6], [0.85, 1.85, -13.4], pushK(f, cf(5), 0.0022), { fov: 40 });
const S9b = (f: number) => dolly([-1.25, 1.55, -8.6], [0.85, 1.85, -13.4], pushK(f, cf(5), 0.0022) * pushK(f, W("guilty") - 2, 0, 0.009, 30), { fov: 40 });
// 10: the corpse MS: robe ripped away, the blessing fingers snipped off
const S10a = (f: number) => dolly([-0.75, 1.4, -7.35], [-1.6, 1.15, -9.95], pushK(f, cf(6), 0.0022), { fov: 40 });
const S10b = (f: number) => dolly([-0.75, 1.4, -7.35], [-1.6, 1.15, -9.95], pushK(f, cf(6), 0.0022) * pushK(f, W("cut") - 2, 0, 0.006, 30), { fov: 40 });
// 11: the Tiber by night: the body swung out over the water, splash on "Tiber"
const S11a = (f: number) => dolly([1.9, 1.5, 3.0], [-0.1, 0.8, -2.2], pushK(f, cw("threw"), 0.0018), { fov: 44 });
// 12: the quake: wide of the nave and apse, shaking; the crack runs down the arch
const S12a = (f: number) => dolly([0.9, 2.2, -2.4], [0.4, 3.2, -16.5], pushK(f, cf(7), 0.002), { fov: 48 });
// 13: Roman townsfolk on the river bank, disgusted, whispering
const S13a = (f: number) => dolly([0.5, 2.2, 9.0], [0.0, 1.4, 2.6], pushK(f, cf(8), 0.0022), { fov: 42 });
// 14: the body washed up on the shore, glowing; kneeling folk; sparkles on "miracles"
const S14a = (f: number) => dolly([1.6, 1.8, 4.2], [0.2, 0.6, -0.2], pushK(f, cw("washed"), 0.0022, 0.005, 30), { fov: 42 });
// 15: Stephen thrown off his throne
const S15a = (f: number) => dolly([2.5, 1.85, -9.2], [0.9, 1.5, -13.9], pushK(f, cf(9), 0.0022), { fov: 42 });
// 16: the prison: Stephen, the strangler's shadow rising on the wall
const S16a = (f: number) => dolly([0.15, 1.5, 2.0], [-0.55, 1.35, -1.6], pushK(f, cw("prison"), 0.0022, 0.005, 30), { fov: 44 });
// 17: St Peter's by day: the new pope tears up the verdict
const S17a = (f: number) => dolly([-0.4, 1.65, -2.6], [-1.4, 1.45, -6.1], pushK(f, cf(10), 0.0024), { fov: 40 });
// 18: the reburial: the corpse in full robes in the open sarcophagus, clergy with candles
const S18a = (f: number) => dolly([2.4, 2.1, -3.0], [0.0, 0.95, -8.2], pushK(f, cw("reburied"), 0.0018), { fov: 42 });
// 19: down the colonnade: the saints' icons bow toward the tomb
const S19a = (f: number) => dolly([1.5, 2.1, -3.2], [4.0, 2.6, -9.6], pushK(f, cf(11), 0.002), { fov: 44 });
// 20: "Case closed": the lid swings shut
const S20a = (f: number) => dolly([2.6, 2.8, -2.4], [0.0, 1.0, -8.2], pushK(f, cf(12), 0.0024, 0.006, 30), { fov: 40 });
// 21: Sergius, now pope, on the same cathedra (rhymes with 4): "guilty!" again
const S21a = (f: number) => dolly([1.55, 1.55, -10.5], [0.95, 1.7, -14.1], pushK(f, cw("until"), 0.0024), { fov: 40 });
const S21b = (f: number) => dolly([1.55, 1.55, -10.5], [0.95, 1.7, -14.1], pushK(f, cw("until"), 0.0024) * pushK(f, W("guilty2") - 2, 0, 0.009, 30), { fov: 40 });
// 22: the sarcophagus: the lid jolts on "again"
const S22a = (f: number) => dolly([2.2, 2.5, -3.6], [0.0, 1.0, -8.2], pushK(f, cw("all"), 0.0028, 0.007, 30), { fov: 40 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: cw("died"), cut: true, s: S1b }],
  2: [{ f: cf(1), s: S2a }, { f: cw("dressed"), cut: true, s: S2b }],
  3: [{ f: cw("propped"), s: S3a }],
  4: [{ f: cf(2), s: S4a }, { f: W("sixth") - 4, dur: 20, s: rolled(S4a, 0.045) }],
  5: [{ f: cw("defendant"), s: S5a }, { f: W("formosus") - 4, dur: 20, s: rolled(S5a, -0.04) }],
  6: [{ f: cf(3), s: S6a }],
  7: [{ f: cf(4), s: S7a }],
  8: [{ f: cw("the5"), s: S8a }],
  9: [{ f: cf(5), s: S9a }, { f: W("guilty") - 2, cut: true, s: rolled(S9b, 0.05) }],
  10: [{ f: cf(6), s: S10a }, { f: W("cut") - 2, cut: true, s: S10b }],
  11: [{ f: cw("threw"), s: S11a }],
  12: [{ f: cf(7), s: S12a }, { f: W("cracked") - 4, dur: 20, s: rolled(S12a, -0.05) }],
  13: [{ f: cf(8), s: S13a }],
  14: [{ f: cw("washed"), s: S14a }],
  15: [{ f: cf(9), s: S15a }, { f: W("overthrown") - 4, dur: 18, s: rolled(S15a, 0.06) }],
  16: [{ f: cw("prison"), s: S16a }],
  17: [{ f: cf(10), s: S17a }],
  18: [{ f: cw("reburied"), s: S18a }],
  19: [{ f: cf(11), s: S19a }],
  20: [{ f: cf(12), s: S20a }],
  21: [{ f: cw("until"), s: S21a }, { f: W("guilty2") - 2, cut: true, s: rolled(S21b, -0.05) }],
  22: [{ f: cw("all"), s: S22a }, { f: W("again") - 3, dur: 18, s: rolled(S22a, 0.05) }],
};

// impact kicks: the image offset flips sign every frame, decays to 0 in 7 f; they start on the first frame at/after the event
const KICKS: [number, number][] = [[WORD.died - 0.03, 0.5], [WORD.dug, 0.5], [WORD.propped - 0.02, 0.9], [WORD.sixth, 0.4], [WORD.hurled, 0.7], [WORD.accusations, 0.5],
  [WORD.guilty, 1.3], [WORD.ripped, 0.6], [WORD.cut, 0.8], [WORD.tiber, 0.9], [WORD.overthrown, 1.0], [WORD.strangled, 0.9], [WORD.cancelled, 0.5],
  [WORD.closed, 1.0], [WORD.guilty2, 1.3], [WORD.again, 1.1]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  // the earthquake: a continuous jitter (pseudo-random per frame, flips sign) under its envelope
  const q = quakeAt(t);
  if (q > 0) { const n = Math.floor(t * FPS); a += q * 0.9 * (n % 2 ? -1 : 1) * (0.6 + 0.4 * Math.abs(Math.sin(n * 12.9898) * 43758.5453 % 1)); }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Lens blur per beat (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp. */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // the synod wide, all sharp
  { f: cw("died"), cInf: 14, focus: () => CORPSE_EYE },
  { f: cf(1), cInf: 8, focus: () => [M.grave[0], 1.1, M.grave[2]] },
  { f: cw("dressed"), cInf: 11, focus: () => [M.grave[0], 1.25, M.grave[2]] },
  { f: cw("propped"), cInf: 10, focus: () => CORPSE_EYE },
  { f: cf(2), cInf: 12, focus: () => STEPH_EYE },
  { f: cw("defendant"), cInf: 13, focus: () => CORPSE_EYE },
  { f: cf(3), cInf: 10, focus: () => eyesOf(M.deacon, -0.05) },
  { f: cf(4), cInf: 11, focus: () => eyesOf(M.stephenStand) },
  { f: cw("the5"), cInf: 15, focus: () => CORPSE_EYE },
  { f: cf(5), cInf: 9, focus: () => eyesOf(M.stephenStand) },
  { f: cf(6), cInf: 11, focus: () => CORPSE_EYE },
  { f: cw("threw"), cInf: 0 },
  { f: cf(7), cInf: 0 },
  { f: cf(8), cInf: 8, focus: () => [0, 2.0, 2.6] },
  { f: cw("washed"), cInf: 9, focus: () => [0.3, 0.6, -0.35] },
  { f: cf(9), cInf: 8, focus: () => STEPH_EYE },
  { f: cw("prison"), cInf: 9, focus: () => eyesOf(M.cellSt) },
  { f: cf(10), cInf: 11, focus: () => eyesOf(M.theodore) },
  { f: cw("reburied"), cInf: 6, focus: () => [0, 1.1, -8.2] },
  { f: cf(11), cInf: 0 },
  { f: cf(12), cInf: 10, focus: () => [0, 1.0, -8.2] },
  { f: cw("until"), cInf: 12, focus: () => STEPH_EYE },
  { f: cw("all"), cInf: 12, focus: () => [0, 1.0, -8.2] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
/** what the lens focuses on (DOF): the DOF table's focus point, else the camera look point */
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects: visible while a <= f < b; kit = a GLB name accepted by build.ts prop() */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
export { cf, cw, W as wf };
