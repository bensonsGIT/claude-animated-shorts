import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Great Gatsby short: shots timed to the voice words (~/gatsby-short/voice/words.json) and the camera
// grammar of the house style: continuous slow push-ins; eased moves ~24 f; big reframes are cuts; impacts are 7-frame
// kicks that flip sign every frame; no hand-held float.
export const FPS = 30;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- shots ----------------
/** sets: egg.ts (Gatsby's lawn, the bay + docks, the pool, the flashback tree, the graveyard), valley.ts (the valley of
 *  ashes road, Wilson's garage, the yellow car), rooms.ts (Nick's cottage, the Plaza suite) */
export type ShotSet = "egg" | "valley" | "cottage" | "plaza";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: keyof typeof WORD) => W(k) - PRE;
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const party = sh("egg", "party"), bay = sh("egg", "moon"), past = sh("egg", "day", { sunAz: 70, sunEl: 40 }), cot = sh("cottage", "morning"), plz = sh("plaza", "sun");
const ash = sh("valley", "moon"), pool = sh("egg", "golden", { sunAz: 30, sunEl: 14 }), rain = sh("egg", "lab");
export const SHOTS: ShotDef[] = [
  party(1, 0, cw("wander")), // "A man threw giant parties every weekend, hoping one woman would"
  party(2, cw("wander"), cf(1)), // "wander in!"
  party(3, cf(1), cf(2)), // "It's 1922, and his neighbor Nick has no idea who he really is."
  bay(4, cf(2), cf(3)), // "This is The Great Gatsby, by F. Scott Fitzgerald."
  past(5, cf(3), cf(4)), // "Five years earlier, a young officer named Jay Gatsby fell for a girl named Daisy, then went to war."
  past(6, cf(4), cf(5)), // "While he was gone, she married rich Tom Buchanan."
  party(7, cf(5), cw("stared")), // "So Gatsby got rich, bought a mansion across the bay, and"
  bay(8, cw("stared"), cf(6)), // "stared at the green light on her dock!"
  cot(9, cf(6), cf(7)), // "When she never showed, he had Nick invite her over for tea."
  cot(10, cf(7), cw("parties2")), // "Soon they were seeing each other, and the"
  party(11, cw("parties2"), cf(8)), // "parties stopped."
  plz(12, cf(8), cf(9)), // "Then, in a sweltering hotel room, Gatsby told Tom that Daisy never loved him!"
  plz(13, cf(9), cf(10)), // "Daisy said she'd loved them both."
  ash(14, cf(10), cw("hit")), // "Driving Gatsby's yellow car home, Daisy"
  ash(15, cw("hit"), cw("killed")), // "hit and"
  ash(16, cw("killed"), cw("didnt")), // "killed Tom's mistress, Myrtle, and"
  ash(17, cw("didnt"), cf(11)), // "didn't stop."
  ash(18, cf(11), cf(12)), // "Gatsby said he'd take the blame."
  ash(19, cf(12), cf(13)), // "Tom told Myrtle's husband whose car it was."
  pool(20, cf(13), cw("husband2")), // "The next day, Gatsby finally used his pool, and the"
  pool(21, cw("husband2"), cw("shot")), // "husband"
  pool(22, cw("shot"), cf(14)), // "shot him in it."
  party(23, cf(14), cw("funeral")), // "Hundreds came to his parties, but almost nobody came to his"
  rain(24, cw("funeral"), cf(15)), // "funeral."
  rain(25, cf(15), TOTAL), // "And the one guest he'd thrown them all for didn't even send a flower!"
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 4: 10, 5: 14, 7: 14, 9: 12, 11: 8, 12: 12, 14: 12, 18: 10, 19: 8, 20: 14, 23: 10, 25: 10 };
export const FLASH_AT = cf(1);
/** sepia flashback shots and rain shots (index.tsx overlays) */
export const SEPIA = new Set([5, 6]);
export const RAIN = new Set([24, 25]);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- staging marks (x, floor y, z) ----------------
const TY = 0.6, DY = 0.15, PY = -0.2;
export const MARK = {
  terrace: [2.4, TY, -9.9] as V3,
  gateWatch: [3.6, 0, 2.75] as V3,
  nick3: [-0.5, 0, 2.5] as V3, gatsby3: [0.62, 0, 2.3] as V3,
  dockEnd: [0, DY, 33.4] as V3,
  officer: [45.1, 0, 0.9] as V3, girl: [46.15, 0, 1.05] as V3,
  bride: [49.45, 0, 2.95] as V3, groom: [50.6, 0, 2.9] as V3,
  nick9: [-0.78, 0, -0.2] as V3, gatsby9: [0.86, 0, -0.1] as V3,
  daisy10: [-0.42, 0, -0.3] as V3, gatsby10: [0.48, 0, -0.32] as V3,
  tom12: [-0.95, 0, -1.6] as V3, gatsby12: [0.95, 0, -1.6] as V3, daisy12: [0, 0, -0.45] as V3,
  myrtle: [4.4, 0, -3.6] as V3,
  blameG: [-59.3, 0, 2.5] as V3, blameD: [-58.45, 0, 2.05] as V3,
  tom19: [2.15, 0, -2.35] as V3, wilson19: [3.95, 0, -2.8] as V3,
  float: [-41.0, PY, 0.35] as V3,
  gatz: [151.05, 0, 0.45] as V3, nickG: [152.35, 0, 0.75] as V3, owl: [153.45, 0, 0.15] as V3, postman: [149.85, 0, -0.25] as V3, minister: [152.0, 0, -2.75] as V3,
};
const EYE = 1.6;
const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];
/** the yellow car in the valley of ashes: one continuous drive along the road (z = 1.0, toward +x) for shots 14-17;
 *  parked far down the road for 18 */
export const CAR_T0 = BEAT[10] - 0.1;
export const carAt = (id: number, t: number) => {
  if (id >= 14 && id <= 17) return { on: true, x: -45 + 16 * (t - CAR_T0), z: 1.0, yaw: 0, bounce: 0.012 * Math.sin(t * 23) };
  if (id === 18) return { on: true, x: -60, z: 1.0, yaw: 0, bounce: 0 };
  return { on: false, x: 0, z: 0, yaw: 0, bounce: 0 };
};
/** what the egg set shows in shot id at t: windows lit, lanterns lit, the gate, the green light */
export const eggPose = (id: number, t: number) => {
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.4);
  if (id === 7) return { lit: smooth((t - WORD.mansion + 0.15) / 1.1), lamps: 1, gate: 0, green: 0.8 };
  if (id === 11) return { lit: 0.35, lamps: 1 - smooth((t - WORD.parties2 + 0.1) / Math.max(0.3, WORD.stopped - WORD.parties2 + 0.2)), gate: 0, green: 0.8 };
  if (id === 2) return { lit: 1, lamps: 1, gate: smooth((t - WORD.wander + 0.05) / 0.45), green: 0.8 };
  if (id === 4) return { lit: 1, lamps: 1, gate: 0, green: pulse };
  if (id === 8) return { lit: 1, lamps: 1, gate: 0, green: t >= WORD.dock - 0.05 ? 1.4 : t >= WORD.green - 0.05 ? 1.0 + 0.2 * Math.sin(t * 6) : pulse };
  return { lit: 1, lamps: 1, gate: 0, green: 0.8 };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
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
/** a held framing that creeps in from f0 (rate per frame), with an optional punch-in at word frame pf */
const hold = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0012, pf?: number, punch = 0.006) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate) * (pf !== undefined ? pushK(f, pf, 0, punch, 30) : 1), { fov });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

const carX = (f: number) => carAt(14, T(f)).x;
const C = {
  s1a: hold([0, 8.8, 23], [0, 3.0, -8], 46, 0, 0.0006),
  s1b: hold([0.4, 3.0, 15.5], [0.8, 2.2, -8], 46, 0, 0.0008),
  s2: hold([16.5, 1.5, 3.0], [4.0, 1.35, 2.85], 40, cw("wander"), 0.0016, W("in") - 2),
  s3: hold([0.1, 1.62, 6.9], [0.05, 1.38, 1.0], 42, cf(1), 0.0014),
  s4: hold([19.5, 2.4, 47.6], [0.2, 1.1, 33.3], 34, cf(2), 0.0010),
  s5: hold([45.6, 1.52, 5.6], [45.6, 1.4, 0.6], 44, cf(3), 0.0012),
  s6: hold([50.0, 1.55, 7.6], [50.0, 1.45, 2.6], 44, cf(4), 0.0012),
  s7: hold([0.2, 2.4, 31.5], [0, 5.4, -14], 44, cf(5), 0.0008, W("mansion") - 2, 0.004),
  s8: hold([-3.6, 1.6, 30.0], [8.5, 1.55, 40.6], 44, cw("stared"), 0.0016, W("dock") - 2),
  s9: hold([0.05, 1.5, 4.3], [0.05, 1.15, -0.7], 44, cf(6), 0.0012),
  s10: hold([0, 1.55, 3.4], [0, 1.38, -0.4], 42, cf(7), 0.0016),
  s11: hold([0, 2.6, 17.5], [0, 2.4, -6], 46, cw("parties2"), 0.0008),
  s12: hold([0, 1.62, 4.7], [0, 1.25, -1.6], 46, cf(8), 0.001, W("him") - 2),
  s13: hold([0, 1.6, 3.0], [0, 1.45, -1.2], 40, cf(9), 0.0018, W("both") - 2, 0.005),
  s14: hold([7.0, 1.0, 5.4], [-7, 3.6, -7.5], 50, cf(10), 0.0008),
  s15: (f: number): Shot => ({ pos: [9.5, 0.7, 2.2], look: [carX(f) - 1, 0.95, 1.0], fov: 50 }),
  s16: hold([-7.6, 6.1, -10.2], [-8.25, 6.2, -16], 40, cw("killed"), 0.003),
  s17: (f: number): Shot => ({ pos: [9.5, 1.25, 2.6], look: [Math.max(carX(f), 16), 0.9, 0.9], fov: 46 }),
  s18: hold([-59.1, 1.55, 6.4], [-59.0, 1.3, 1.6], 42, cf(11), 0.0014, W("blame") - 2, 0.004),
  s19: hold([3.0, 1.6, 2.6], [3.0, 1.35, -2.8], 44, cf(12), 0.0012),
  s20: hold([-39.6, 2.9, 6.6], [-40.7, 0.3, 0.2], 42, cf(13), 0.0012),
  s21: hold([-37.4, 1.4, 2.4], [-38.7, 1.5, -6.1], 44, cw("husband2"), 0.002),
  s22: hold([-40.2, 4.6, 2.6], [-40.8, 0, 0.3], 40, cw("shot"), 0.0008),
  s25: hold([154.7, 1.35, 1.6], [153.2, 0.75, -1.3], 42, cf(15), 0.0016, W("flower") - 2, 0.004),
  s24: hold([152.0, 1.6, 6.6], [152.0, 1.05, -1.0], 46, cw("funeral"), 0.0012),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1a }, { f: 8, dur: Math.max(30, cw("wander") - 20), s: C.s1b }],
  2: [{ f: cw("wander"), s: C.s2 }],
  3: [{ f: cf(1), s: C.s3 }],
  4: [{ f: cf(2), s: C.s4 }],
  5: [{ f: cf(3), s: C.s5 }],
  6: [{ f: cf(4), s: C.s6 }],
  7: [{ f: cf(5), s: C.s7 }],
  8: [{ f: cw("stared"), s: C.s8 }],
  9: [{ f: cf(6), s: C.s9 }],
  10: [{ f: cf(7), s: C.s10 }],
  11: [{ f: cw("parties2"), s: C.s11 }],
  12: [{ f: cf(8), s: C.s12 }],
  13: [{ f: cf(9), s: C.s13 }],
  14: [{ f: cf(10), s: C.s14 }],
  15: [{ f: cw("hit"), s: C.s15 }],
  16: [{ f: cw("killed"), s: C.s16 }],
  17: [{ f: cw("didnt"), s: C.s17 }],
  18: [{ f: cf(11), s: C.s18 }],
  19: [{ f: cf(12), s: C.s19 }],
  20: [{ f: cf(13), s: C.s20 }],
  21: [{ f: cw("husband2"), s: C.s21 }],
  22: [{ f: cw("shot"), s: C.s22 }],
  23: [{ f: cf(14), s: hold([0.4, 3.0, 15.5], [0.8, 2.2, -8], 46, cf(14), 0.0008) }],
  24: [{ f: cw("funeral"), s: C.s24 }],
  25: [{ f: cf(15), s: C.s25 }],
};

const KICKS: [number, number][] = [[WORD.in, 0.8], [WORD.dock, 0.6], [WORD.him, 0.9], [WORD.hit, 0.7], [WORD.shot, 0.6], [WORD.flower, 0.3]];
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
void rolled;

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const M = MARK;
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: cw("wander"), cInf: 8, focus: () => eyesOf(M.gateWatch) },
  { f: cf(1), cInf: 11, focus: () => eyesOf(M.gatsby3, -0.05) },
  { f: cf(2), cInf: 7, focus: () => eyesOf(M.dockEnd) },
  { f: cf(3), cInf: 9, focus: () => eyesOf(M.officer) },
  { f: cf(4), cInf: 9, focus: () => eyesOf(M.bride) },
  { f: cf(5), cInf: 0 },
  { f: cw("stared"), cInf: 6, focus: () => eyesOf(M.dockEnd) },
  { f: cf(6), cInf: 10, focus: () => eyesOf(M.nick9) },
  { f: cf(7), cInf: 12, focus: () => eyesOf(M.daisy10) },
  { f: cw("parties2"), cInf: 0 },
  { f: cf(8), cInf: 9, focus: () => eyesOf(M.gatsby12) },
  { f: cf(9), cInf: 12, focus: () => eyesOf(M.daisy12, -0.1) },
  { f: cf(10), cInf: 0 },
  { f: cw("killed"), cInf: 6, focus: () => [-8.25, 6.2, -16] },
  { f: cw("didnt"), cInf: 0 },
  { f: cf(11), cInf: 10, focus: () => eyesOf(M.blameG) },
  { f: cf(12), cInf: 10, focus: () => eyesOf(M.tom19) },
  { f: cf(13), cInf: 7, focus: () => [M.float[0], 0.6, M.float[2]] },
  { f: cw("husband2"), cInf: 5, focus: () => [-38.7, 1.5, -6.1] },
  { f: cw("shot"), cInf: 6, focus: () => [-40.8, 0, 0.3] },
  { f: cf(14), cInf: 0 },
  { f: cw("funeral"), cInf: 6, focus: () => eyesOf(M.nickG) },
  { f: cf(15), cInf: 12, focus: () => [153.75, 1.05, -1.1] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
