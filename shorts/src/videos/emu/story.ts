import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Great Emu War short: shots timed to the voice words (~/emu-short/voice/words.json) and the
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
/** sets: farm.ts (the Campion wheat farm, the dam, the army truck), parliament.ts (the House of Representatives);
 *  "out" = the hidden bridge world */
export type ShotSet = "out" | "farm" | "house";
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
const farm = room("farm", "day"), dusk = room("farm", "golden"), house = room("house", "sun");
export const SHOTS: ShotDef[] = [
  farm(1, 0, cf(1)), // "In 1932, Australia sent soldiers with machine guns to fight a flock of birds!"
  farm(2, cf(1), cw("wheat")), // "Twenty thousand emus had stormed the"
  farm(3, cw("wheat"), cf(2)), // "wheat farms of Western Australia."
  farm(4, cf(2), cf(3)), // "The army sent Major Meredith, two soldiers, two Lewis guns, and ten thousand bullets."
  farm(5, cf(3), cf(4)), // "At their first big ambush, by a dam, a gun jammed after about a dozen birds!"
  farm(6, cf(4), cf(5)), // "The rest split into small groups and ran in every direction."
  farm(7, cf(5), cf(6)), // "An ornithologist later wrote that the emus had switched to guerrilla tactics!"
  farm(8, cf(6), cf(7)), // "So the soldiers mounted a gun on a truck and gave chase."
  farm(9, cf(7), cw("emus3")), // "But the ground was so rough the gunner couldn't aim, and the"
  farm(10, cw("emus3"), cf(8)), // "emus outran the truck!"
  dusk(11, cf(8), cf(9)), // "After less than a week, the army pulled out."
  house(12, cf(9), cf(10)), // "In Parliament, one member joked that the medals should go to the emus."
  farm(13, cf(10), cf(11)), // "Meredith went back, and by December he claimed 986 kills."
  farm(14, cf(11), cf(12)), // "That's ten bullets for every bird."
  farm(15, cf(12), cf(13)), // "He said the emus could face machine guns with the invulnerability of tanks!"
  farm(16, cf(13), cf(14)), // "Two years later, farmers filed over fifty-seven thousand emu bounty claims in just six months."
  house(17, cf(14), cf(15)), // "Today, the emu stands on Australia's coat of arms."
  house(18, cf(15), TOTAL), // "The army lost the war, but the emu got the coat of arms!"
];
/** crossfades (frames) at place / time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 2: 10, 5: 12, 7: 10, 8: 8, 11: 12, 12: 12, 13: 12, 16: 10, 17: 12 };
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
/** staging marks (x, floor y, z). Farm: track along x (z -1.5..1.5), fence z = -1.6, wheat behind; dam at (19, -8),
 *  the ambush gun at (17.2, -2.6). House: benches x = +-2.4.. +-4.75, the crest on the back wall. */
export const MARK = {
  hookSgt: [-0.85, 0, 3.4] as V3, hookGun: [0.9, 0, 3.6] as V3, hookMaj: [-0.2, 0, 1.4] as V3,
  farmerA: [-2.75, 0, -0.75] as V3, farmerB: [-1.45, 0, -0.35] as V3,
  major: [-0.2, 0, 3.0] as V3,
  damGun: [16.75, 0, -1.95] as V3, damSgt: [17.85, 0, -1.6] as V3, damMaj: [18.75, 0, -1.15] as V3,
  joker: [-0.95, 0, 1.0] as V3,
  heroEmu: [0.4, 0, -4.4] as V3,
  claimA: [-1.35, 0, 0.4] as V3, claimB: [0.15, 0, 0.7] as V3,
  pile: [1.35, 0, 1.55] as V3,
};
/** the parked truck (shots 4, 13, 14) and its path in the chase shots: x(t) along the track, bounce + roll on the ruts */
export const PARKED = { x: -1.5, z: 0 };
export const truckAt = (id: number, t: number) => {
  const rough = (k: number) => ({ bounce: k * (0.05 * Math.sin(t * 17) + 0.035 * Math.sin(t * 29 + 1.3)), roll: k * 0.05 * Math.sin(t * 11 + 0.4) });
  if (id === 4 || id === 13 || id === 14) return { on: true, x: PARKED.x, z: PARKED.z, yaw: 0, ...rough(0) };
  if (id === 8 || id === 9 || id === 10) { const t0 = cf(6) / FPS; return { on: true, x: -12 + 5.2 * (t - t0), z: 0, yaw: 0, ...rough(id === 8 ? 0.5 : 1) }; }
  if (id === 11) { const t0 = cf(8) / FPS; return { on: true, x: 0.5 - 2.2 * (t - t0), z: -0.2, yaw: Math.PI, ...rough(0.4) }; }
  return { on: false, x: 0, z: 0, yaw: 0, bounce: 0, roll: 0 };
};
/** what the farm set shows in shot id at t: the truck and the toppling fence post (shot 2, on "stormed") */
export const farmPose = (id: number, t: number) => ({ truck: truckAt(id, t), post: id === 2 ? smooth((t - WORD.stormed + 0.1) / 0.35) : id === 3 ? 1 : 0 });
/** hammer of the Lewis gun at the dam: bursts from "ambush" until it jams */
export const GUN_FIRE = { t0: WORD.ambush - 0.1, t1: WORD.jammed - 0.05 };
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

/** the chase cameras ride with the truck */
const tx = (id: number, f: number) => truckAt(id, T(f)).x;
const S1a = (f: number) => dolly([0.3, 1.3, 9.0], [0.0, 1.75, -3.0], pushK(f, 0, 0.0008), { fov: 46 });
const S1b = (f: number) => dolly([0.3, 1.3, 9.0], [0.0, 1.75, -3.0], pushK(f, 0, 0.0008) * pushK(f, W("birds") - 3, 0, 0.005, 30), { fov: 46 });
const S2a = (f: number) => dolly([6.0, 6.2, 9.8], [2.5, 0.4, -5.5], pushK(f, cf(1), 0.0012), { fov: 46 });
const S3a = (f: number) => dolly([-1.0, 1.6, 4.8], [-2.1, 1.45, -1.2], pushK(f, cw("wheat"), 0.0015), { fov: 42 });
const S4a = (f: number) => dolly([-1.5, 1.75, 9.8], [-1.15, 1.35, 0.6], pushK(f, cf(2), 0.0008), { fov: 46 });
const S5a = (f: number) => dolly([14.8, 2.0, 4.6], [18.4, 0.9, -7.8], pushK(f, cf(3), 0.001), { fov: 44 });
const S5b = (f: number) => dolly([14.8, 2.0, 4.6], [18.4, 0.9, -7.8], pushK(f, cf(3), 0.001) * pushK(f, W("jammed") - 2, 0, 0.006, 30), { fov: 44 });
const S6a = (f: number) => dolly([16.4, 3.4, 6.5], [18.8, 0.6, -7.0], pushK(f, cf(4), 0.0008), { fov: 50 });
const S7a = (f: number) => dolly([1.2, 1.65, 3.4], [0.5, 1.15, -5.0], pushK(f, cf(5), 0.0012), { fov: 44 });
const S7b = (f: number) => dolly([1.2, 1.65, 3.4], [0.5, 1.15, -5.0], pushK(f, cf(5), 0.0012) * pushK(f, W("guerrilla") - 2, 0, 0.006, 30), { fov: 44 });
const S8a = (f: number): Shot => { const x = tx(8, f); return { pos: [x - 0.4, 2.3, 12.0], look: [x + 1.5, 1.2, 0.5], fov: 50 }; };
const S9a = (f: number): Shot => { const x = tx(9, f); return { pos: [x - 0.2, 2.15, 2.9], look: [x - 0.75, 1.95, 0.1], fov: 42 }; };
const S10a = (f: number): Shot => { const x = tx(10, f) + 0.5 * (4.5 + 2.6 * Math.max(0, T(f) - cw("emus3") / FPS)); return { pos: [x + 2.0, 2.4, 15.0], look: [x + 2.6, 1.0, 0.8], fov: 50 }; };
const S11a = (f: number) => dolly([3.0, 1.7, 9.5], [-4.5, 1.0, -1.5], pushK(f, cf(8), 0.0008), { fov: 48 });
const S12a = (f: number) => dolly([1.6, 1.75, 4.6], [-1.5, 1.45, -0.9], pushK(f, cf(9), 0.001), { fov: 46 });
const S12b = (f: number) => dolly([1.6, 1.75, 4.6], [-1.5, 1.45, -0.9], pushK(f, cf(9), 0.001) * pushK(f, W("medals") - 3, 0, 0.005, 30), { fov: 46 });
const S13a = (f: number) => dolly([0.6, 1.6, 7.0], [0.0, 1.3, 0.8], pushK(f, cf(10), 0.0012), { fov: 42 });
const S14a = (f: number) => dolly([1.9, 1.25, 4.7], [1.3, 1.0, 1.4], pushK(f, cf(11), 0.002), { fov: 40 });
const S15a = (f: number) => dolly([1.0, 0.55, 5.2], [0.9, 1.45, -0.8], pushK(f, cf(12), 0.001), { fov: 46 });
const S15b = (f: number) => dolly([1.0, 0.55, 5.2], [0.9, 1.45, -0.8], pushK(f, cf(12), 0.001) * pushK(f, W("tanks") - 3, 0, 0.006, 30), { fov: 46 });
const S16a = (f: number) => dolly([-0.4, 1.6, 5.4], [-0.6, 1.4, 0.2], pushK(f, cf(13), 0.001), { fov: 42 });
const S17a = (f: number) => dolly([0.5, 2.3, 3.4], [0.0, 4.2, -9.8], pushK(f, cf(14), 0.0025), { fov: 42 });
const S18a = (f: number) => dolly([0.42, 4.75, -6.9], [0.42, 4.72, -9.9], pushK(f, cf(15), 0.0012), { fov: 40 });
const S18b = (f: number) => dolly([0.42, 4.75, -6.9], [0.42, 4.72, -9.9], pushK(f, cf(15), 0.0012) * pushK(f, W("arms2") - 3, 0, 0.006, 30), { fov: 40 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: W("birds") - 3, cut: true, s: S1b }],
  2: [{ f: cf(1), s: S2a }],
  3: [{ f: cw("wheat"), s: S3a }],
  4: [{ f: cf(2), s: S4a }],
  5: [{ f: cf(3), s: S5a }, { f: W("jammed") - 2, cut: true, s: rolled(S5b, 0.04) }],
  6: [{ f: cf(4), s: S6a }],
  7: [{ f: cf(5), s: S7a }, { f: W("guerrilla") - 2, cut: true, s: S7b }],
  8: [{ f: cf(6), s: S8a }],
  9: [{ f: cf(7), s: S9a }, { f: W("aim") - 2, dur: 10, s: rolled(S9a, 0.06) }],
  10: [{ f: cw("emus3"), s: S10a }],
  11: [{ f: cf(8), s: S11a }],
  12: [{ f: cf(9), s: S12a }, { f: W("medals") - 3, cut: true, s: S12b }],
  13: [{ f: cf(10), s: S13a }],
  14: [{ f: cf(11), s: S14a }],
  15: [{ f: cf(12), s: S15a }, { f: W("tanks") - 3, cut: true, s: rolled(S15b, -0.05) }],
  16: [{ f: cf(13), s: S16a }],
  17: [{ f: cf(14), s: S17a }],
  18: [{ f: cf(15), s: S18a }, { f: W("arms2") - 3, cut: true, s: S18b }],
};

const KICKS: [number, number][] = [[WORD.birds, 0.8], [WORD.stormed, 0.5], [WORD.bullets, 0.5], [WORD.jammed, 0.9], [WORD.guerrilla, 0.4],
  [WORD.chase, 0.4], [WORD.aim, 0.9], [WORD.outran, 0.4], [WORD.medals, 0.4], [WORD.y986, 0.5], [WORD.bird, 0.3], [WORD.tanks, 1.0], [WORD.claims, 0.4], [WORD.arms2, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = id === 18 ? 0 : kickAt(T(f));
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
  { f: 0, cInf: 6, focus: () => eyesOf(M.hookSgt, -0.15) },
  { f: cf(1), cInf: 0 },
  { f: cw("wheat"), cInf: 10, focus: () => eyesOf(M.farmerA) },
  { f: cf(2), cInf: 7, focus: () => eyesOf(M.major) },
  { f: cf(3), cInf: 6, focus: () => [17.2, 1.2, -3.0] },
  { f: cf(4), cInf: 0 },
  { f: cf(5), cInf: 10, focus: () => [0.4, 1.4, -4.4] },
  { f: cf(6), cInf: 0 },
  { f: cf(7), cInf: 12, focus: (f) => [tx(9, f) - 0.75, 1.95, 0.1] },
  { f: cw("emus3"), cInf: 0 },
  { f: cf(9), cInf: 9, focus: () => eyesOf(M.joker) },
  { f: cf(10), cInf: 8, focus: () => eyesOf(M.major) },
  { f: cf(11), cInf: 12, focus: () => [1.35, 0.6, 1.55] },
  { f: cf(12), cInf: 9, focus: () => [0.6, 1.5, -0.5] },
  { f: cf(13), cInf: 8, focus: () => eyesOf(M.claimA) },
  { f: cf(14), cInf: 0 },
  { f: cf(15), cInf: 10, focus: () => [0.42, 4.7, -9.85] },
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
