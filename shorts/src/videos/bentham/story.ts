import type { LightName } from "./lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Bentham short: shots timed to the voice words (~/bentham-short/voice/words.json) and the
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
/** sets: ucl.ts (centre, cloister, theatre), study.ts (Bentham's study by day / Smith's workshop by night),
 *  banquet.ts (the 1820s dinner by night / the 2013 council by day); "out" = hidden bridge world */
export type ShotSet = "out" | "centre" | "cloister" | "theatre" | "study" | "banquet";
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
const centre = room("centre", "lab"), study = room("study", "sun"), shop = room("study", "night"), theatre = room("theatre", "night");
const dinner = room("banquet", "night"), council = room("banquet", "sun"), cloD0 = room("cloister", "sun"), cloN0 = room("cloister", "moon");
// the cloister: sun behind the lens so the cabinet front is lit, not the side
const cloD = (id: number, a: number, b: number): ShotDef => ({ ...cloD0(id, a, b), sunAz: 145, sunEl: 38 });
const cloN = (id: number, a: number, b: number): ShotDef => ({ ...cloN0(id, a, b), sunAz: 145, sunEl: 38 });
export const SHOTS: ShotDef[] = [
  centre(1, 0, cw("the2")), // "A man has sat in the same London university for over a hundred and seventy years, and he's been dead"
  centre(2, cw("the2"), cf(1)), // "the entire time."
  study(3, cf(1), cf(2)), // "In 1832, a famous philosopher left very specific instructions for his own corpse."
  study(4, cf(2), cf(3)), // "His name was Jeremy Bentham, and he wanted to be useful even after death."
  theatre(5, cf(3), cf(4)), // "First, his body was to be dissected in public, for science!"
  theatre(6, cf(4), cw("shook")), // "His doctor lectured over the corpse while a thunderstorm"
  theatre(7, cw("shook"), cf(5)), // "shook the building."
  shop(8, cf(5), cf(6)), // "Next, his skeleton was padded out, dressed in his own clothes, and seated in his own chair."
  dinner(9, cf(6), cf(7)), // "Legend says he had carried his future glass eyes in his pocket for years."
  shop(10, cf(7), cf(8)), // "But the preserved head came out dark, dried and shrivelled!"
  shop(11, cf(8), cf(9)), // "So a French artist sculpted him a nicer one out of wax."
  cloD(12, cf(9), cf(10)), // "The real head was placed on the floor of the case, right between his feet!"
  cloN(13, cf(10), cw("demanded")), // "In 1975, students from a rival college stole it and"
  cloN(14, cw("demanded"), cf(11)), // "demanded a hundred pounds for charity."
  cloD(15, cf(11), cf(12)), // "The university offered ten."
  cloD(16, cf(12), cf(13)), // "The students took the deal!"
  council(17, cf(13), cw("surprise")), // "In 2013, he was wheeled into a university council meeting as a"
  council(18, cw("surprise"), cf(14)), // "surprise guest."
  council(19, cf(14), cf(15)), // "He didn't vote."
  centre(20, cf(15), TOTAL), // "And today, he's still sitting in that London university, in his own clothes, watching everyone walk by!"
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 5: 8, 8: 8, 9: 10, 10: 8, 12: 10, 13: 10, 15: 8, 17: 10, 20: 12 };
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

// ---------------- story beats (seconds, from words.json; reactions land 0-3 f before their word) ----------------
/** the thunderstorm: two lightning strikes (on "thunderstorm" and "shook"), each a double flicker decaying over ~0.4 s */
export const lightningAt = (t: number) => {
  let v = 0;
  for (const t0 of [WORD.thunderstorm - 0.03, WORD.shook - 0.03]) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 14) v = Math.max(v, [1, 0.55, 0.15, 0.85, 0.6, 0.4, 0.28, 0.2, 0.14, 0.1, 0.06, 0.04, 0.02, 0.01][n]);
  }
  return v;
};
/** the phone flash in the hook, on "entire" (3 frames) */
const phoneAt = (t: number) => { const n = Math.floor((t - (WORD.entire - 0.05)) * FPS + 1e-6); return n >= 0 && n < 4 ? [0.8, 0.5, 0.25, 0.1][n] : 0; };
/** a white veil overlay: lightning in the theatre shots, the phone flash in the hook */
export const glareAt = (f: number) => {
  const s = shotAt(f), t = T(f);
  if (s.set === "theatre") return 0.42 * lightningAt(t);
  if (s.id === 2) return phoneAt(t);
  return 0;
};

const CALM: BridgeState = { bounce: 0, drop: 0, snap: 0, collapsed: false };
export const bridgeState = (_id: number, _t: number): BridgeState => CALM;

/** staging marks (x, floor y, z); the set files hold the rooms, cast.ts places the people on these marks */
const SIT = 0.1; // a seated card's hips sit this far above its origin
export const MARK = {
  // the Student Centre (ucl.ts CENTRE_CASE [0, 0, -3.2]; glass case base 0.3, seat 0.46)
  icon: [0, 0.3 + 0.46 - SIT, -2.96] as V3,
  // Bentham's study / Smith's workshop (newton study.ts: chair at x 0.575, seat 0.49, z -2.72; desk on the back wall; stand by the window)
  chair: [0.575, 0.49 - SIT, -2.45] as V3, smith8: [-0.35, 0, -2.25] as V3,
  cloche: [1.25, 0.82, -3.55] as V3, smith10: [0.45, 0, -3.0] as V3,
  bust: [-2.5, 1.07, -1.6] as V3, talrich: [-1.85, 0, -1.05] as V3, smith11: [-1.05, 0, -2.3] as V3,
  // the anatomy theatre (ucl.ts DTABLE at z -0.6, LECTERN [1.25, 0, -1.6])
  smith: [0.5, 0, -1.6] as V3, gentFront: [-1.05, 0, 1.0] as V3,
  // the dinner (banquet.ts: chairs at x +-1.1, seat top .48)
  benthamDine: [-1.1, 0.48 - SIT, -3.5] as V3,
  // the cloister (ucl.ts CABINET [1.95, 0, -4.2], front facing -x; seat .51 above the floor, head on the case floor in front of the feet)
  cabSeat: [1.73, 0.15 + 0.46 - SIT, -4.2] as V3, cabHead: [1.54, 0.155, -4.2] as V3,
  official: [0.55, 0, -3.55] as V3,
  // the council (banquet.ts, daylight): the trolley stops at the foot of the table, facing up it
  trolleyStop: [0, 0, 4.4] as V3,
};
const EYE = 1.6, SIT_EYE = 0.86;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
const sitEyes = (m: V3): V3 => [m[0], m[1] + SIT_EYE, m[2]];
/** the trolley case in the council room: rolls in from behind the lens on "wheeled", stops at the table's foot.
 *  Returns [x, yaw, z] (yaw PI = glass front toward the table, -z), or null when it is not in this shot. */
export const trolleyAt = (id: number, t: number): [number, number, number] | null => {
  if (id < 17 || id > 19) return null;
  const t0 = WORD.wheeled - 0.5, u = smooth((t - t0) / 1.6);
  return [0.15 * (1 - u), Math.PI, MARK.trolleyStop[2] + 5.2 * (1 - u)];
};
/** the seat of the auto-icon on the trolley (world) at time t */
export const trolleySeat = (id: number, t: number): V3 | null => {
  const tr = trolleyAt(id, t);
  return tr ? [tr[0], 0.16 + 0.3 + 0.46 - SIT, tr[2] - 0.24] : null;
};

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
const ICON_EYE: V3 = sitEyes(M.icon);
const CHAIR_EYE: V3 = sitEyes(M.chair);
const CAB_EYE: V3 = sitEyes(M.cabSeat);
const TROLLEY_EYE: V3 = [0, 0.16 + 0.3 + 0.46 - SIT + SIT_EYE, M.trolleyStop[2]];
// ---- framings (f -> camera); each pushes in from the frame its key starts ----
// 1: the Student Centre wide: the glass case dead centre, students streaming past; a double-take on "dead"
const S1a = (f: number) => dolly([0.3, 1.65, 4.2], [0, 1.4, -3.2], pushK(f, 0, 0.0018), { fov: 44 });
const S1b = (f: number) => dolly([0.3, 1.65, 4.2], [0, 1.4, -3.2], pushK(f, 0, 0.0018) * pushK(f, cw("dead"), 0, 0.006, 30), { fov: 44 });
// 2: CU of the wax face through the glass: a phone flash on "entire" - he does not flinch
const S2a = (f: number) => dolly([0.2, 1.58, -0.75], ICON_EYE, pushK(f, cw("the2"), 0.0032), { fov: 34 });
// 3: Bentham at his study chair, quill; the scroll of instructions unrolls across the floor toward the lens
const S3a = (f: number) => dolly([0.15, 1.45, 1.7], [0.5, 0.95, -2.5], pushK(f, cf(1), 0.0022), { fov: 46 });
// 4: MCU Bentham grinning; a cheerful wave on "useful"
const S4a = (f: number) => dolly([0.8, 1.4, -0.3], CHAIR_EYE, pushK(f, cf(2), 0.0026, 0.005, 30), { fov: 38 });
// 5: the anatomy theatre wide: tiers of top hats round the sheeted table; every head turns to the lens on "public"
const S5a = (f: number) => dolly([0.7, 3.0, 5.4], [0, 1.6, -2.4], pushK(f, cf(3), 0.002), { fov: 50 });
const S5b = (f: number) => dolly([0.7, 3.0, 5.4], [0, 1.6, -2.4], pushK(f, cf(3), 0.002) * pushK(f, cw("public"), 0, 0.006, 30), { fov: 50 });
// 6: Smith lecturing at the lectern (MCU): lightning on "thunderstorm", his face drains white
const S6a = (f: number) => dolly([0.25, 1.75, 1.35], eyesOf(M.smith, -0.1), pushK(f, cf(4), 0.0024), { fov: 38 });
// 7: staged in depth: a gentleman at the rail in front, Smith beyond; the second strike on "shook" knocks his hat off
const S7a = (f: number) => dolly([-1.75, 2.0, 3.0], [0.2, 1.45, -1.4], pushK(f, cw("shook"), 0.0026, 0.006, 25), { fov: 42 });
// 8: the workshop: the skeleton on the chair, padded, dressed, seated; Smith at work
const S8a = (f: number) => dolly([0.75, 1.4, 0.05], [0.25, 0.95, -2.6], pushK(f, cf(5), 0.002), { fov: 44 });
const S8b = (f: number) => dolly([0.75, 1.3, -0.3], CHAIR_EYE, pushK(f, cw("chair") - 1, 0.003, 0.005, 25), { fov: 38 });
// 9: the dinner flashback: Bentham at table holds up two blue glass eyes on "pocket"; guests recoil
const S9a = (f: number) => dolly([-0.25, 1.5, 0.3], [-0.95, 1.2, -3.6], pushK(f, cf(6), 0.0022), { fov: 42 });
const S9b = (f: number) => dolly([-0.25, 1.5, 0.3], [-0.95, 1.2, -3.6], pushK(f, cf(6), 0.0022) * pushK(f, W("pocket") - 2, 0, 0.007, 30), { fov: 42 });
// 10: the workshop at night: Smith lifts the cloth off the cloche on "came"; poof on "shrivelled"
const S10a = (f: number) => dolly([1.55, 1.4, -1.0], [0.95, 1.05, -3.45], pushK(f, cf(7), 0.0024), { fov: 40 });
const S10b = (f: number) => dolly([1.4, 1.2, -2.15], [1.25, 1.02, -3.55], pushK(f, W("shrivelled") - 2, 0.003, 0.008, 25), { fov: 38 });
// 11: Talrich spins the wax head on its stand; it comes round smiling on "wax"
const S11a = (f: number) => dolly([-0.9, 1.5, 1.4], [-2.25, 1.35, -1.55], pushK(f, cf(8), 0.0024), { fov: 42 });
// 12: the cloister cabinet: tilt down on "floor", settle on the head between the feet on "feet"
const S12a = (f: number) => dolly([-1.5, 1.55, -3.3], [1.9, 1.3, -4.2], pushK(f, cf(9), 0.0022), { fov: 40 });
const S12b = (f: number) => dolly([-1.5, 1.35, -3.3], [1.75, 0.55, -4.2], pushK(f, cf(9), 0.0022), { fov: 40 });
const S12c = (f: number) => dolly([0.4, 0.82, -4.15], [1.66, 0.45, -4.2], pushK(f, W("feet") - 2, 0.0026, 0.006, 30), { fov: 42 });
// 13: night: three students tiptoe in; one lifts the head out on "stole"
const S13a = (f: number) => dolly([-1.7, 1.6, 0.9], [1.0, 1.05, -3.6], pushK(f, cf(10), 0.002), { fov: 44 });
// 14: the ransom note held up, grinning; the others laugh on "hundred"
const S14a = (f: number) => dolly([-0.75, 1.55, -0.2], [0.35, 1.45, -2.4], pushK(f, cw("demanded"), 0.0026, 0.005, 30), { fov: 40 });
// 15: the official reads the note in front of the cabinet; ten fingers on "ten"
const S15a = (f: number) => dolly([-1.5, 1.6, -2.45], eyesOf(M.official, -0.05), pushK(f, cf(11), 0.003), { fov: 38 });
// 16: the students hand the box back; snatched on "deal"
const S16a = (f: number) => dolly([-2.1, 1.7, 0.6], [0.45, 1.25, -3.4], pushK(f, cf(12), 0.0024), { fov: 42 });
// 17: the council room from the far end of the table: the trolley rolls in on "wheeled"
const S17a = (f: number) => dolly([0.0, 1.9, -8.2], [0.0, 1.25, 3.6], pushK(f, cf(13), 0.0018), { fov: 46 });
// 18: the members' faces: shock on "surprise"
const S18a = (f: number) => dolly([-0.35, 1.55, 1.0], [1.1, 1.25, -3.3], pushK(f, cw("surprise"), 0.0026, 0.006, 25), { fov: 40 });
// 19: hands up for the vote; he stays still: slow deadpan push on "vote"
const S19a = (f: number) => dolly([0.0, 2.2, -8.0], TROLLEY_EYE, pushK(f, cf(14), 0.0028, 0.006, 40), { fov: 32 });
// 20: back in the Student Centre (rhymes with 1): push in on "sitting", hold on the face to the end
const S20a = (f: number) => dolly([0.55, 1.65, 4.2], [0, 1.4, -3.2], pushK(f, cf(15), 0.002), { fov: 44 });
const S20b = (f: number) => dolly([0.25, 1.6, -0.2], ICON_EYE, pushK(f, W("sitting") - 3, 0.003), { fov: 36 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: cw("dead"), cut: true, s: S1b }],
  2: [{ f: cw("the2"), s: S2a }],
  3: [{ f: cf(1), s: S3a }],
  4: [{ f: cf(2), s: S4a }, { f: W("useful") - 4, dur: 20, s: rolled(S4a, 0.04) }],
  5: [{ f: cf(3), s: S5a }, { f: cw("public"), cut: true, s: S5b }],
  6: [{ f: cf(4), s: S6a }, { f: W("thunderstorm") - 2, dur: 16, s: rolled(S6a, -0.05) }],
  7: [{ f: cw("shook"), s: S7a }],
  8: [{ f: cf(5), s: S8a }, { f: cw("chair"), cut: true, s: S8b }],
  9: [{ f: cf(6), s: S9a }, { f: W("pocket") - 2, cut: true, s: rolled(S9b, 0.04) }],
  10: [{ f: cf(7), s: S10a }, { f: W("shrivelled") - 2, cut: true, s: S10b }],
  11: [{ f: cf(8), s: S11a }, { f: W("wax") - 4, dur: 18, s: rolled(S11a, 0.04) }],
  12: [{ f: cf(9), s: S12a }, { f: W("floor") - 4, dur: 26, s: S12b }, { f: W("feet") - 2, cut: true, s: S12c }],
  13: [{ f: cf(10), s: S13a }],
  14: [{ f: cw("demanded"), s: S14a }],
  15: [{ f: cf(11), s: S15a }, { f: W("ten") - 2, dur: 14, s: rolled(S15a, -0.03) }],
  16: [{ f: cf(12), s: S16a }],
  17: [{ f: cf(13), s: S17a }],
  18: [{ f: cw("surprise"), s: S18a }],
  19: [{ f: cf(14), s: S19a }],
  20: [{ f: cf(15), s: S20a }, { f: W("sitting") - 3, dur: 40, s: S20b }],
};

// impact kicks: the image offset flips sign every frame, decays to 0 in 7 f; they start on the first frame at/after the event
const KICKS: [number, number][] = [[WORD.dead - 0.03, 0.5], [WORD.thunderstorm - 0.03, 1.2], [WORD.shook - 0.03, 1.3], [WORD.shrivelled, 0.9], [WORD.feet, 0.6],
  [WORD.stole, 0.6], [WORD.ten, 0.4], [WORD.deal, 0.6], [WORD.wheeled, 0.4], [WORD.surprise, 0.8]];
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
  { f: 0, cInf: 0 },
  { f: cw("the2"), cInf: 14, focus: () => ICON_EYE },
  { f: cf(1), cInf: 6, focus: () => CHAIR_EYE },
  { f: cf(2), cInf: 12, focus: () => CHAIR_EYE },
  { f: cf(3), cInf: 0 },
  { f: cf(4), cInf: 12, focus: () => eyesOf(M.smith, -0.1) },
  { f: cw("shook"), cInf: 9, focus: () => eyesOf(M.smith, -0.1) },
  { f: cf(5), cInf: 8, focus: () => CHAIR_EYE },
  { f: cw("chair"), cInf: 12, focus: () => CHAIR_EYE },
  { f: cf(6), cInf: 10, focus: () => sitEyes(M.benthamDine) },
  { f: cf(7), cInf: 10, focus: () => [M.cloche[0], M.cloche[1] + 0.2, M.cloche[2]] },
  { f: cf(8), cInf: 10, focus: () => [M.bust[0], M.bust[1] + 0.25, M.bust[2]] },
  { f: cf(9), cInf: 8, focus: () => CAB_EYE },
  { f: W("feet") - 2, cInf: 13, focus: () => [M.cabHead[0], M.cabHead[1] + 0.2, M.cabHead[2]] },
  { f: cf(10), cInf: 7, focus: () => [0.6, 1.5, -3.0] },
  { f: cw("demanded"), cInf: 11, focus: () => [0.35, 1.5, -2.4] },
  { f: cf(11), cInf: 12, focus: () => eyesOf(M.official, -0.05) },
  { f: cf(12), cInf: 9, focus: () => eyesOf(M.official, -0.05) },
  { f: cf(13), cInf: 0 },
  { f: cw("surprise"), cInf: 10, focus: () => [1.1, 1.25, -3.3] },
  { f: cf(14), cInf: 9, focus: () => TROLLEY_EYE },
  { f: cf(15), cInf: 0 },
  { f: W("sitting") - 3, dur: 40, cInf: 13, focus: () => ICON_EYE },
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
