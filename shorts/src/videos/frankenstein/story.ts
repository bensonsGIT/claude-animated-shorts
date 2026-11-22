import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of the Frankenstein short: shots timed to Ben's narration (couch.potato.history/frankenstein-short/voice/words.json).
// Camera grammar from the house style: continuous slow push-ins, big reframes are cuts, 7-frame flip kicks.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
export type ShotSet = "garret" | "cottage" | "inside" | "river" | "barn" | "cell" | "glacier" | "hut" | "bedroom" | "arctic" | "cabin";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; sunAz?: number; sunEl?: number; night?: boolean };
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
/** cut frame for narration beat b: PRE frames before its first word */
const cf = (b: number) => F(BEAT[b]) - PRE;
type WK = keyof typeof WORD;
const W = (k: WK) => F(WORD[k]);
/** cut frame just before word k */
const cw = (k: WK) => W(k) - PRE;
const OUTDOOR: ShotSet[] = ["cottage", "river", "glacier", "arctic"];
export const isOutdoor = (s: ShotDef) => OUTDOOR.includes(s.set);
const PLAN: [ShotSet, LightName, number, boolean?][] = [
  ["garret", "dark", 0], // 1 "A student built a man from corpses, took one look at him, and ran!"
  ["garret", "dark", cf(1)], // 2 "This is Frankenstein, by Mary Shelley."
  ["garret", "dark", cf(2)], // 3 "At university, Victor Frankenstein builds an eight-foot giant out of body parts, and brings it to life."
  ["cottage", "morning", cf(3)], // 4 "Spying on a family through a crack in the wall,
  ["inside", "dark", cw("teaches")], // 5   it teaches itself to speak and read."
  ["cottage", "day", cf(4)], // 6 "It even reads Paradise Lost!"
  ["inside", "dark", cf(5)], // 7 "But when it finally introduces itself, the son beats it with a stick."
  ["river", "day", cf(6)], // 8 "Then it saves a girl from drowning, and a man shoots it for its trouble!"
  ["river", "moon", cf(7), true], // 9 "Now murderous, it strangles Victor's little brother
  ["barn", "moon", cw("frames"), true], // 10  and frames the family maid,
  ["cell", "moon", cw("who"), true], // 11  who is executed."
  ["glacier", "day", cf(8)], // 12 "Then it offers Victor a deal: build me a wife, and we will vanish forever."
  ["hut", "moon", cf(9), true], // 13 "Victor builds her on a remote Scottish island, then tears her to pieces."
  ["hut", "moon", cf(10), true], // 14 "Watching at the window, the creature swears: I shall be with you on your wedding night."
  ["hut", "moon", cf(11), true], // 15 "Victor thinks it means to kill him."
  ["bedroom", "night", cf(12), true], // 16 "Instead, on his wedding night, it strangles his bride."
  ["arctic", "moon", cf(13), true], // 17 "Victor chases it across the Arctic ice, and
  ["cabin", "dark", cw("dies"), true], // 18  dies aboard an explorer's ship."
  ["cabin", "dark", cf(14), true], // 19 "The creature mourns over his body,
  ["arctic", "moon", cw("then4"), true], // 20  then drifts off into the dark."
  ["arctic", "moon", cf(15), true], // 21 "Shelley's point: the creature was born good; it was rejection that made a monster."
  ["garret", "dark", cf(16)], // 22 "All because a student took one look at his creation, and ran."
];
export const SHOTS: ShotDef[] = PLAN.map(([set, light, a, night], i) => ({ id: i + 1, a, b: i + 1 < PLAN.length ? PLAN[i + 1][2] : TOTAL, set, light, night: !!night }));
/** crossfades (frames) at place / time changes */
export const XFADE: Record<number, number> = { 3: 8, 4: 14, 5: 10, 6: 10, 7: 10, 8: 14, 9: 14, 10: 10, 11: 10, 12: 16, 13: 14, 16: 14, 17: 16, 18: 10, 20: 10, 21: 16, 22: 16 };
/** white 4-frame flash after the hook */
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the gunshot: a 0.2 s white pop */
export const glareAt = (f: number) => {
  const d = f / FPS - (WORD.shoots + 0.05);
  return d >= 0 && d < 0.2 ? 0.7 * (1 - d / 0.2) : 0;
};
/** the woods go dark on "strangles" (shot 9, before the cut to the cap); the bride's candle out (shot 16) */
export const blackAt = (f: number) => {
  const t = f / FPS, s9 = SHOTS[8], s16 = SHOTS[15];
  if (f >= s9.a && f < s9.b) return 0.6 * smooth((t - (WORD.strangles + 0.1)) / 0.35) * (t < WORD.brother - 0.12 ? 1 : 0);
  if (f >= s16.a && f < s16.b) return 0.35 * smooth((t - WORD.bride) / 0.4);
  return 0;
};

// ---------------- staging marks (x, floor y, z) ----------------
export const SC = 1.35; // the creature: about eight feet
export const MARK = {
  // garret: the long table along z (x -0.45..0.45, z -3..-0.3, top 0.85); the door on the left wall at z 0.9
  lying: [0, 0.875, -0.35] as V3, sitUp: [0, 0.24, -0.15] as V3,
  vic: [0.95, 0, -0.3] as V3, vicDoor: [-2.35, 0, 0.95] as V3, vicWork: [0.85, 0, -1.7] as V3,
  head: [0, 1.02, -2.25] as V3, hand: [0.5, 0.95, -1.1] as V3,
  // cottage + hovel
  hovel: [1.25, 0.02, -6.3] as V3, log: [1.6, 0, -4.05] as V3,
  // inside the cottage
  delacey: [-1.35, 0.04, -1.5] as V3, felix: [0.25, 0, -2.5] as V3, felixHit: [1.15, 0, -2.3] as V3, agatha: [0.85, 0, -2.55] as V3, door: [1.85, 0, -2.85] as V3,
  // river
  girl: [0.75, 0, -3.55] as V3, splash: [0.8, -0.1, -4.9] as V3, cypress: [-1.55, 0, -2.3] as V3, bankC: [0.25, 0, -3.3] as V3, rustic: [2.3, 0, -2.4] as V3,
  // night woods
  william: [0.35, 0, -2.3] as V3, loom: [-0.75, 0, -3.4] as V3, cap: [0.4, 0.03, -2.15] as V3,
  // barn + cell
  justine: [-0.1, 0.445, 0.45] as V3, locket: [0.05, 0.62, -0.25] as V3,
  // glacier
  vicIce: [-0.75, 0, -1.8] as V3, crIce: [0.85, 0, -2.9] as V3,
  // hut: the bench along z (x -1.2..-0.4, z -2.6..-0.6), the casement at x 0.95
  form: [-0.8, 0.82, -0.75] as V3, vicHut: [0.3, 0, -1.25] as V3, window: [0.95, 0, -3.5] as V3,
  // bedroom: the window at x 1.3..2.5 in the back wall (z -3.2)
  sillCr: [1.9, 0, -3.42] as V3, sleeve: [1.0, 0.58, -1.35] as V3,
  // arctic
  sledgeA: [-1.0, 0, 8.0] as V3, sledgeB: [0.6, 0, 3.0] as V3, crFar: [3.2, 0, -2.0] as V3,
  // cabin: the bunk along the left wall (x -2..-1.15, z -2.35..-0.25, top 0.62)
  vicBunk: [-1.57, 0.665, -0.4] as V3, crCabin: [-0.45, 0, -1.45] as V3,
};
const M = MARK;
const EYE = 1.45;
const eyesOf = (m: V3, dy = 0, s = 1): V3 => [m[0], m[1] + EYE * s + dy, m[2]];
const SIT = -0.45;
/** raft position: drifting away from the ice edge into the dark (shot 20) */
export const raftAt = (t: number): V3 => {
  const u = clamp01((t - (WORD.then4 - 0.1)) / Math.max(1, WORD.dark - WORD.then4 + 1.2));
  return [1.2 + 7 * u, -0.05 - 0.06 * Math.sin(t * 2), -3.9 - 14 * u * u];
};
/** the instruments swept off the side table on "pieces" (shot 13) */
export const sweptAt = (id: number, t: number) => (id === 13 ? smooth((t - (WORD.pieces - 0.15)) / 0.4) : 0);
/** the cell candle, snuffed on "executed" */
export const cellCandleAt = (t: number) => 1 - smooth((t - WORD.executed) / 0.25);
/** the bedroom candle goes out on "bride" */
export const bedCandleAt = (id: number, t: number) => (id === 16 ? (t < WORD.bride - 0.05 ? 1 : 0) : 1);

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
const hold = (pos: V3, look: V3, f0: number, rate: number, fov = 42, fp?: number, punch = 0.005) => (f: number): Shot =>
  dolly(pos, look, pushK(f, f0, rate) * (fp !== undefined ? pushK(f, fp - 3, 0, punch, 30) : 1), { fov });
/** close-up rig: ~2.9 m from a standing card (s = scale), face in the upper third */
const cuPos = (m: V3, s = 1, dx = 0, dz = 2.9): V3 => [m[0] + dx, m[1] + 1.4 * s, m[2] + dz * Math.sqrt(s)];
const cuLook = (m: V3, s = 1): V3 => [m[0], m[1] + 1.12 * s, m[2]];

const a = (id: number) => SHOTS[id - 1].a;
const HOOK_POS: V3 = [0.95, 2.6, 1.9], HOOK_LOOK: V3 = [0.15, 0.95, -1.7];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: hold(HOOK_POS, HOOK_LOOK, 0, 0.0012, 52, W("look")) }],
  2: [{ f: a(2), s: hold([-0.3, 1.7, 3.0], [0.2, 1.4, -2.2], a(2), 0.001, 56) }],
  3: [{ f: a(3), s: hold(cuPos(M.vicWork, 1, -0.5, 2.6), cuLook(M.vicWork), a(3), 0.0018, 44, W("body")) },
      { f: W("life") - 3, cut: true, s: hold([0, 1.75, -1.25], [0, 1.0, -2.25], W("life") - 3, 0.003, 40, W("life"), 0.008) }],
  4: [{ f: a(4), s: hold([2.4, 1.6, -1.0], [1.2, 1.1, -6.3], a(4), 0.0016, 46) },
      { f: W("crack") - 3, cut: true, s: hold([1.4, 1.42, -5.75], [1.5, 1.35, -6.97], W("crack") - 3, 0.0025, 40, W("crack"), 0.007) }],
  5: [{ f: a(5), s: hold([-0.2, 1.7, 3.2], [-0.25, 1.2, -2.0], a(5), 0.0012, 56, W("speak")) }],
  6: [{ f: a(6), s: hold(cuPos(M.log, SC, -0.2, 2.2), [M.log[0], 1.2, M.log[2]], a(6), 0.0022, 44, W("paradise")) }],
  7: [{ f: a(7), s: hold([0.25, 1.8, 3.2], [0.25, 1.35, -2.2], a(7), 0.0012, 60, W("introduces")) },
      { f: W("son") - 3, cut: true, s: rolled(hold([1.5, 1.95, 0.6], [1.6, 1.7, -2.7], W("son") - 3, 0.0024, 46, W("stick"), 0.008), 0.04) }],
  8: [{ f: a(8), s: hold([0.0, 1.7, 3.6], [0.1, 1.1, -3.6], a(8), 0.0014, 52, W("drowning")) },
      { f: W("man2") - 3, cut: true, s: hold(cuPos(M.rustic, 1, -0.3), cuLook(M.rustic), W("man2") - 3, 0.0024, 42, W("shoots"), 0.007) },
      { f: W("trouble") - 6, cut: true, s: rolled(hold(cuPos(M.bankC, SC, 0.2, 2.6), cuLook(M.bankC, SC), W("trouble") - 6, 0.002, 44, W("trouble"), 0.007), -0.04) }],
  9: [{ f: a(9), s: hold([0.2, 1.6, 2.4], [-0.1, 1.5, -3.0], a(9), 0.0016, 52, W("strangles")) },
      { f: W("brother") - 3, cut: true, s: hold([0.45, 1.0, -0.9], [0.4, 0.0, -2.15], W("brother") - 3, 0.002, 42) }],
  10: [{ f: a(10), s: hold([0.4, 2.2, 2.0], [0.0, 0.4, -0.6], a(10), 0.0018, 46, W("frames")) }],
  11: [{ f: a(11), s: hold([0.4, 1.3, 1.8], [0.3, 0.6, -1.5], a(11), 0.0018, 46, W("executed"), 0.006) }],
  12: [{ f: a(12), s: hold([0.2, 1.8, 3.6], [0.1, 1.55, -2.4], a(12), 0.0012, 54, W("wife")) }],
  13: [{ f: a(13), s: hold([0.6, 1.75, 2.4], [-0.3, 1.0, -1.6], a(13), 0.0016, 50, W("pieces"), 0.008) }],
  14: [{ f: a(14), s: hold([0.75, 1.75, 0.6], [0.95, 1.8, -3.5], a(14), 0.0014, 44, W("window")) },
       { f: W("shall") - 3, dur: 60, s: hold([0.92, 1.9, -1.25], [0.95, 1.92, -3.5], W("shall") - 3, 0.0022, 40) }],
  15: [{ f: a(15), s: rolled(hold(cuPos(M.vicHut, 1, 0.15), cuLook(M.vicHut), a(15), 0.0024, 40, W("kill")), -0.03) }],
  16: [{ f: a(16), s: hold([0.4, 1.6, 2.4], [1.3, 1.5, -3.0], a(16), 0.0016, 50, W("instead")) }],
  17: [{ f: a(17), s: hold([-1.5, 2.8, 13.0], [1.6, 0.8, -6.0], a(17), 0.0012, 48, W("chases")) }],
  18: [{ f: a(18), s: hold([-0.4, 2.4, 0.9], [-1.55, 0.6, -1.4], a(18), 0.0016, 52, W("ship")) }],
  19: [{ f: a(19), s: hold([0.4, 1.9, 1.9], [-0.8, 1.3, -1.5], a(19), 0.0018, 52, W("mourns")) }],
  20: [{ f: a(20), s: hold([0.4, 2.0, 3.2], [3.0, 1.0, -10.0], a(20), 0.0012, 48) }],
  21: [{ f: a(21), s: hold([0.6, 3.0, 9.0], [0.2, 3.4, -13.0], a(21), 0.001, 46) }],
  22: [{ f: a(22), s: hold(HOOK_POS, HOOK_LOOK, a(22), 0.0012, 52, W("look2")) }],
};

const KICKS: [number, number][] = [[WORD.ran, 1.0], [WORD.stick, 1.1], [WORD.shoots + 0.05, 1.0], [WORD.trouble, 0.6], [WORD.executed, 0.5],
  [WORD.pieces, 1.0], [WORD.kill, 0.5], [WORD.bride, 0.7]];
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
  { f: 0, cInf: 7, focus: () => eyesOf(M.vic) },
  { f: a(2), cInf: 0 },
  { f: a(3), cInf: 10, focus: () => eyesOf(M.vicWork) },
  { f: W("life") - 3, cInf: 12, focus: () => M.head },
  { f: a(4), cInf: 8, focus: () => eyesOf(M.hovel, SIT, SC) },
  { f: W("crack") - 3, cInf: 13, focus: () => [1.5, 1.35, -6.9] },
  { f: a(5), cInf: 7, focus: () => eyesOf(M.delacey, SIT) },
  { f: a(6), cInf: 10, focus: () => eyesOf(M.log, SIT, SC) },
  { f: a(7), cInf: 7, focus: () => eyesOf(M.door, 0, SC) },
  { f: W("son") - 3, cInf: 10, focus: () => eyesOf(M.door, 0, SC) },
  { f: a(8), cInf: 5, focus: () => eyesOf(M.girl) },
  { f: W("man2") - 3, cInf: 11, focus: () => eyesOf(M.rustic) },
  { f: W("trouble") - 6, cInf: 11, focus: () => eyesOf(M.bankC, 0, SC) },
  { f: a(9), cInf: 8, focus: () => eyesOf(M.william, -0.3) },
  { f: W("brother") - 3, cInf: 12, focus: () => M.cap },
  { f: a(10), cInf: 9, focus: () => M.locket },
  { f: a(11), cInf: 10, focus: () => [0.3, 0.5, -1.4] },
  { f: a(12), cInf: 6, focus: () => eyesOf(M.crIce, 0, SC) },
  { f: a(13), cInf: 8, focus: () => eyesOf(M.vicHut) },
  { f: a(14), cInf: 9, focus: () => eyesOf(M.window, 0, SC) },
  { f: a(15), cInf: 13, focus: () => eyesOf(M.vicHut) },
  { f: a(16), cInf: 8, focus: () => eyesOf(M.sillCr, 0, SC) },
  { f: a(17), cInf: 0 },
  { f: a(18), cInf: 9, focus: () => [M.vicBunk[0], 0.7, M.vicBunk[2] - 1.4] },
  { f: a(19), cInf: 9, focus: () => eyesOf(M.crCabin, 0, SC) },
  { f: a(20), cInf: 4, focus: () => [4, 2, -8] },
  { f: a(21), cInf: 0 },
  { f: a(22), cInf: 7, focus: () => eyesOf(M.vic) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, cw, W as wf };
