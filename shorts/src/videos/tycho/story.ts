import type { LightName } from "./lights";
import { TOTAL, WORD, HIT, PLOP, rf } from "./timing";
export { TOTAL, WORD, HIT, PLOP, rf };
// Timeline of the Tycho Brahe short: shots timed to the voice words (~/tycho-brahe-short/voice/words.json) and the
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
/** "hall" = the great hall + study corner (hall.ts); "out" = the bridge world */
export type ShotSet = "out" | "hall" | "banquet" | "lab";
export type ShotDef = {
  id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean;
  set?: ShotSet; sunAz?: number; sunEl?: number;
};
const hall = (id: number, a: number, b: number): ShotDef => ({ id, a, b, light: "night", crowd: "none", tau: (t) => t, set: "hall" });
const feast = (id: number, a: number, b: number): ShotDef => ({ ...hall(id, a, b), set: "banquet" });
const lab = (id: number, a: number, b: number): ShotDef => ({ ...hall(id, a, b), light: "lab", set: "lab" });
export const SHOTS: ShotDef[] = [
  hall(1, rf(0), rf(182)), // "In 1566, two drunk noblemen at a party got into an argument... about math."
  hall(2, rf(182), rf(325)), // "They couldn't agree who was the better mathematician, so they settled it with swords."
  hall(3, rf(325), rf(413)), // "One of them lost. And so did his nose."
  hall(4, rf(413), rf(560)), // "That man was Tycho Brahe, who became one of the greatest astronomers in history."
  hall(5, rf(560), rf(696)), // "For the rest of his life, he wore a metal nose, stuck on with paste."
  hall(6, rf(696), rf(775)), // "Legend said it was made of gold and silver."
  lab(7, rf(775), rf(870)), // "In 2010, scientists dug him up to find out."
  lab(8, rf(870), rf(1009)), // "Green stains around his nose showed copper and zinc. It was brass."
  hall(9, rf(1009), rf(1080)), // "But his death was even stranger."
  feast(10, rf(1080), rf(1235)), // "At a banquet in Prague, Tycho needed to pee. But leaving the table would've been rude."
  feast(11, rf(1235), rf(1276)), // "So he held it."
  feast(12, rf(1276), rf(1331)), // "Eleven days later, he was dead." (his empty chair, the brass nose left on his plate)
  hall(13, rf(1331), TOTAL), // "All because he was too polite... for a man who lost his nose over a math argument."
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 7: 8, 10: 8, 13: 8 };
export const FLASH_AT = rf(182);

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

// ---------------- story beats (seconds, from words.json; reactions land 0-3 f before their word) ----------------
/** the clash lands in the pause after "lost" (HIT, so the word stays clear); the nose flies into a goblet and lands at PLOP */
export const LUNGE0 = HIT - 0.25;
/** staging marks in the hall (x, floor y, z); hall.ts holds the room, cast.ts places the people on these marks */
export const MARK = {
  tyArgue: [0.2, 0, -1.2] as V3, manArgue: [0.95, 0, -2.3] as V3, // staged in depth for the 9:16 two-shot
  tyDuel: [-0.35, 0, -2.25] as V3, manDuel: [0.9, 0, -2.55] as V3,
  goblet: [-2.73, 0.98, -2.38] as V3,
  study: [4.3, 0, -10.2] as V3,
  // Prague banquet (banquet.ts): Tycho seated right of the table (card y puts his hips on the 0.48 m seat), his plate
  // 2010 lab (lab.ts): the skull at the head end of the opened coffin, three scientists round the exam table
  skull: [0, 1.16, -3.55] as V3, sciA: [-0.75, 0, -2.4] as V3, sciB: [0.95, 0, -3.7] as V3, sciC: [0.25, 0, -4.5] as V3,
  bqSeat: [1.1, 0.32, -3.5] as V3, bqPlate: [0.42, 0.825, -3.5] as V3, bqHost: [0, 0.32, -9.8] as V3,
};
const EYE = 1.6, SEAT_EYE = 1.25;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

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
/** zoom push (camera stays put, for lenses next to towers / houses): tan(fov/2) shrinks by k */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// near-left anchorage where the bolt lives, and the free end of the snapped backstay
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};


// ---- framings (f -> camera); each pushes in from the frame its key starts. 9:16 frame: stage pairs in depth ----
// shot 1: high wide over the party from the entrance -> cut on "argument" to the two arguing nobles (punch on "math")
const S1a = (f: number) => dolly([5.4, 3.5, 7.2], [-1.4, 1.1, -5.2], pushK(f, rf(0), 0.0018), { fov: 46 });
const S1b = (f: number) => dolly([2.2, 1.7, 3.4], [0.55, 1.45, -1.75], pushK(f, rf(122), 0.0022, 0.006, 30), { fov: 38 });
// shot 2: closer on Tycho jabbing his point -> cut wide on "settled" as both draw, roll on "swords"
const S2a = (f: number) => dolly([1.5, 1.66, 1.9], [0.2, 1.5, -1.2], pushK(f, rf(182), 0.0025), { fov: 36 });
const S2b = (f: number) => dolly([0.45, 1.95, 3.6], [0.28, 1.25, -2.4], pushK(f, rf(262), 0.002, 0.006, 30), { fov: 44 });
// shot 3: the duel side-on (kick on the slash) -> cut to the goblet the nose lands in
const S3a = (f: number) => dolly([0.3, 1.5, 2.0], [0.28, 1.4, -2.4], pushK(f, rf(325), 0.003), { fov: 42 });
const S3b = (f: number) => dolly([-1.45, 1.35, -0.75], [-2.73, 1.12, -2.38], pushK(f, rf(363), 0.003), { fov: 34 });
// shot 4: CU of the bandaged young Tycho -> cut (time jump) to the study, old Tycho among his instruments
const S4a = (f: number) => dolly([-0.05, 1.7, 0.4], [-0.35, 1.55, -2.25], pushK(f, rf(413), 0.003), { fov: 34 });
const S4b = (f: number) => dolly([2.4, 2.0, -5.8], [4.7, 1.55, -11.0], pushK(f, rf(461), 0.0018), { fov: 46 });
// shot 5: CU old Tycho, closer on "paste"; shot 6: zoom ECU on the nose ("gold and silver")
const S5a = (f: number) => dolly([3.5, 1.72, -7.4], [4.3, 1.55, -10.2], pushK(f, rf(560), 0.0025), { fov: 34 });
const S5b = (f: number) => dolly([3.7, 1.7, -8.0], [4.3, 1.58, -10.2], pushK(f, rf(676), 0.0025), { fov: 32 });
const S6a = (f: number) => zoom([3.75, 1.66, -8.3], [4.3, 1.6, -10.2], 24, pushK(f, rf(696), 0.003));
// shots 7-8: the 2010 lab, wide over the exam table -> CU on the skull (copper + zinc = brass)
const S7a = (f: number) => dolly([2.4, 2.0, 1.6], [0, 1.1, -3.3], pushK(f, rf(775), 0.002), { fov: 44 });
const S8a = (f: number) => dolly([0.3, 1.62, -2.3], [0, 1.28, -3.55], pushK(f, rf(870), 0.003), { fov: 32 });
// shot 9: old Tycho MS; shots 10-12: the Prague banquet (wide down the table -> across the table at Tycho -> his empty chair)
const S9a = (f: number) => dolly([2.9, 1.8, -7.4], [4.3, 1.5, -10.2], pushK(f, rf(1009), 0.0022), { fov: 40 });
const S10a = (f: number) => dolly([2.6, 3.2, 6.5], [0, 1.0, -6.0], pushK(f, rf(1080), 0.0018), { fov: 46 });
const S10b = (f: number) => dolly([-2.6, 1.6, -2.75], [1.1, 1.18, -3.55], pushK(f, rf(1117), 0.0022, 0.005, 30), { fov: 40 });
const S11a = (f: number) => dolly([-0.9, 1.42, -2.6], [1.1, 1.2, -3.5], pushK(f, rf(1235), 0.004), { fov: 32 });
const S12a = (f: number) => dolly([-0.75, 1.32, -3.2], [0.75, 1.02, -3.5], pushK(f, rf(1276), 0.0022), { fov: 34 });
// shot 13: the study wide, gliding in to a closing portrait
const S13a = (f: number) => dolly([1.6, 2.3, -4.6], [4.5, 1.5, -10.8], pushK(f, rf(1331), 0.0018), { fov: 46 });
const S13b = (f: number) => dolly([3.0, 1.8, -6.9], [4.3, 1.5, -10.2], pushK(f, rf(1400), 0.002), { fov: 38 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: rf(0), s: S1a }, { f: rf(122), cut: true, s: S1b }],
  2: [{ f: rf(182), s: S2a }, { f: rf(262), cut: true, s: S2b }, { f: rf(294), dur: 20, s: rolled(S2b, 0.045) }],
  3: [{ f: rf(325), s: S3a }, { f: rf(363), cut: true, s: S3b }],
  4: [{ f: rf(413), s: S4a }, { f: rf(461), cut: true, s: S4b }],
  5: [{ f: rf(560), s: S5a }, { f: rf(672), dur: 18, s: S5b }],
  6: [{ f: rf(696), s: S6a }],
  7: [{ f: rf(775), s: S7a }],
  8: [{ f: rf(870), s: S8a }],
  9: [{ f: rf(1009), s: S9a }],
  10: [{ f: rf(1080), s: S10a }, { f: rf(1117), cut: true, s: S10b }],
  11: [{ f: rf(1235), s: S11a }],
  12: [{ f: rf(1276), s: S12a }],
  13: [{ f: rf(1331), s: S13a }, { f: rf(1380), dur: 40, s: S13b }],
};

// impact kicks (reference v14): the image offset flips sign every frame (~3 px at 720p per unit), decays to 0 in
// 7 f, roll +-0.23 deg per unit; they start on the first frame at/after the event. No hand-held float.
const KICKS: [number, number][] = [[HIT, 1.4], [PLOP, 0.5]];
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
/** Lens blur per beat (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp.
 *  Reference: DOF on ~1/3 of screen time, CU 12-16, MS 10-12, wides 0; focus on the eyes. */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: rf(0), cInf: 0 }, // party establishing
  { f: rf(122), cInf: 11, focus: () => eyesOf(MARK.tyArgue) }, // the argument
  { f: rf(182), cInf: 13, focus: () => eyesOf(MARK.tyArgue) }, // Tycho jabbing
  { f: rf(262), cInf: 6, focus: () => eyesOf(MARK.tyDuel) }, // swords drawn
  { f: rf(325), cInf: 5, focus: () => eyesOf(MARK.tyDuel) }, // duel (kept readable)
  { f: rf(363), cInf: 14, focus: () => MARK.goblet }, // goblet insert
  { f: rf(413), cInf: 14, focus: () => eyesOf(MARK.tyDuel) }, // bandaged CU
  { f: rf(461), cInf: 7, focus: () => eyesOf(MARK.study) }, // study wide
  { f: rf(560), cInf: 13, focus: () => eyesOf(MARK.study) }, // old Tycho CU
  { f: rf(696), cInf: 15, focus: () => eyesOf(MARK.study, 0.07) }, // nose ECU
  { f: rf(775), cInf: 5, focus: () => MARK.skull }, // the lab, wide
  { f: rf(870), cInf: 14, focus: () => MARK.skull }, // skull CU
  { f: rf(1009), cInf: 8, focus: () => eyesOf(MARK.study) },
  { f: rf(1080), cInf: 0 }, // the banquet, down the table
  { f: rf(1117), cInf: 12, focus: () => [MARK.bqSeat[0], SEAT_EYE, MARK.bqSeat[2]] }, // Tycho across the table
  { f: rf(1235), cInf: 14, focus: () => [MARK.bqSeat[0], SEAT_EYE, MARK.bqSeat[2]] }, // "held it" CU
  { f: rf(1276), cInf: 12, focus: () => MARK.bqPlate }, // the empty chair, the nose on the plate
  { f: rf(1331), cInf: 6, focus: () => eyesOf(MARK.study) }, // closing portrait
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
