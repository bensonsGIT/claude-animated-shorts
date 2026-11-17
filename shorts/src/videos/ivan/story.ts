import type { LightName } from "../../engine/lights";
import { TOTAL, WORD, BEAT } from "./timing";
export { TOTAL, WORD, BEAT };
// Timeline of The Death of Ivan Ilych short (Tolstoy, 1886): shots timed to the voice words (~/ivan-short/voice/words.json);
// the house camera grammar (slow push-ins, eased moves, cuts on big reframes, 7-frame flip kicks on impacts).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

// ---------------- shots ----------------
/** sets: house.ts (drawing room x 0, sickroom x 40, the dark x 200), court.ts (Law Courts x 100, card room x 140) */
export type ShotSet = "house" | "court";
export type Dress = "decor" | "hung" | "funeral";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: ShotSet; dress?: Dress; sunAz?: number; sunEl?: number };
const T = (f: number) => f / FPS;
const F = (s: number) => Math.round(s * FPS);
const PRE = 3;
const cf = (b: number) => F(BEAT[b]) - PRE;
const W = (k: keyof typeof WORD) => F(WORD[k]);
const sh = (set: ShotSet, light: LightName, extra: Partial<ShotDef> = {}) => (id: number, a: number, b: number): ShotDef => ({ id, a, b, light, set, ...extra });
const funeral = sh("house", "night", { dress: "funeral" }), court = sh("court", "day", { sunAz: 140, sunEl: 40 });
const room = sh("house", "sun", { dress: "hung" }), decor = sh("house", "sun", { dress: "decor" }), dusk = sh("house", "night", { dress: "hung" });
const sick = sh("house", "night"), dark = sh("house", "dark"), cards = sh("court", "night");
export const SHOTS: ShotDef[] = [
  funeral(1, 0, cf(1)), // "A Russian judge died because he wanted perfect curtains!"
  court(2, cf(1), cf(2)), // "His colleagues' first thought was who would get his job."
  room(3, cf(2), cf(3)), // "This is The Death of Ivan Ilych, by Leo Tolstoy."
  room(4, cf(3), cf(4)), // "The judge did everything right: good career, proper wife, fashionable furniture."
  dusk(5, cf(4), cf(5)), // "His life was simple, ordinary, and therefore terrible."
  decor(6, cf(5), cf(6)), // "Then came a big promotion, and a grand new home to decorate."
  decor(7, cf(6), cf(7)), // "Showing the upholsterer how to hang drapes, he climbed a ladder, slipped, and banged his side on a window knob."
  decor(8, cf(7), cf(8)), // "Just a bruise. Then a strange taste. Then a pain that never left."
  sick(9, cf(8), cf(9)), // "Doctors debated a floating kidney or the appendix. Nobody said dying."
  sick(10, cf(9), cf(10)), // "His family pretended he was just sick, and that lie hurt worse than the pain."
  sick(11, cf(10), cf(11)), // "Only the servant Gerasim told the truth, and held his master's legs on his shoulders all night."
  dark(12, cf(11), cf(12)), // "For his last three days, he screamed."
  sick(13, cf(12), cf(13)), // "Then his schoolboy son kissed his hand, and he pitied them all."
  dark(14, cf(13), cf(14)), // "He looked for his fear of death, and found light instead!"
  cards(15, cf(14), TOTAL), // "Then he died, and his colleagues went back to playing cards." -> loops into line 1
];
export const XFADE: Record<number, number> = { 3: 10, 5: 12, 6: 10, 9: 12, 12: 12, 13: 10, 14: 10, 15: 16 };
export const FLASH_AT = cf(1);

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- staging marks ----------------
export const MARK = {
  widow: [-0.05, 0, -1.55] as V3, coffin: [0.6, 1.0, -2.3] as V3, drapes: [0.6, 2.7, -3.8] as V3,
  fedor: [99.35, 0, -2.15] as V3, peter: [100.2, 0, -2.3] as V3, shebek: [101.05, 0, -2.15] as V3,
  ivanR: [0.6, 0, -1.6] as V3, ivan4: [0.25, 0, -1.6] as V3, wife4: [1.0, 0, -1.85] as V3, chair4: [-0.4, 0, -1.05] as V3,
  sofa: [-3.0, 0, -3.25] as V3,
  ivan6: [0.1, 0, -1.3] as V3, uph6: [1.45, 0, -1.1] as V3, bolts: [1.05, 0, -1.7] as V3,
  ladder: [2.05, 1.14, -3.2] as V3, uph7: [0.5, 0, -2.3] as V3, knob: [1.6, 2.05, -3.86] as V3,
  ivan8: [0.4, 0, -1.2] as V3,
  bed: [40.0, 0, -2.45] as V3, doc1: [39.15, 0, -1.5] as V3, doc2: [40.85, 0, -1.5] as V3, door: [43.2, 0, -2.7] as V3,
  vasya: [40.62, 0, -2.0] as V3, wife13: [41.35, 0, -2.6] as V3,
  dark: [200, -0.55, 0] as V3,
  table: [140.6, 0.76, -1.6] as V3, pl1: [140.0, 0.3, -2.35] as V3, pl2: [141.2, 0.3, -2.35] as V3, peterC: [139.75, 0.3, -1.55] as V3,
};
const EYE = 1.6;
export const eyesOf = (m: V3, dy = 0): V3 => [m[0], m[1] + EYE + dy, m[2]];

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
const hold = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0012, pf?: number, punch = 0.006) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate) * (pf !== undefined ? pushK(f, pf, 0, punch, 30) : 1), { fov });

/** shot 1 and shot 15 share this framing (the coffin between the drapes / the card table between the drapes) */
const S1: [V3, V3, number] = [[0.6, 1.45, 4.0], [0.6, 1.45, -2.6], 44];
const S15: [V3, V3, number] = [[140.6, 1.45, 4.0], [140.6, 1.45, -2.6], 44];
const C = {
  s1: hold(S1[0], S1[1], S1[2], 0, 0.0016),
  s1b: hold([0.6, 1.7, 2.6], [0.6, 2.75, -3.8], 44, W("curtains") - 4, 0.002),
  s2: hold([100.2, 1.75, 3.1], [100.2, 1.75, -2.1], 44, cf(1), 0.0016, W("job") - 2, 0.006),
  s3: hold([0.6, 1.6, 2.7], [0.6, 1.45, -1.6], 44, cf(2), 0.0022),
  s4: hold([0.35, 1.5, 3.0], [0.35, 1.3, -1.6], 44, cf(3), 0.0016, W("furniture") - 2, 0.005),
  s5: hold([-3.0, 1.4, 1.5], [-3.0, 1.05, -3.25], 42, cf(4), 0.0016, W("terrible") - 2, 0.007),
  s6: hold([0.45, 1.55, 2.9], [0.45, 1.25, -1.3], 44, cf(5), 0.0016, W("promotion") - 2, 0.005),
  s7: hold([1.15, 1.95, 3.4], [1.25, 1.65, -3.2], 44, cf(6), 0.0012, W("knob") - 2, 0.004),
  s8: hold([0.4, 1.6, 1.45], [0.4, 1.5, -1.2], 40, cf(7), 0.0016, W("left") - 2, 0.003),
  s9: hold([40.0, 1.7, 4.3], [40.0, 1.45, -1.9], 44, cf(8), 0.0014, W("dying") - 2, 0.006),
  s10: hold([40.85, 1.55, 3.2], [40.8, 1.25, -1.8], 44, cf(9), 0.0014, W("lie") - 2, 0.006),
  s11: hold([40.25, 1.0, 2.9], [40.25, 0.9, -2.0], 44, cf(10), 0.0018, W("shoulders") - 2, 0.004),
  s12: hold([200, 1.0, 3.4], [200, 0.75, -1.0], 44, cf(11), 0.003, W("screamed") - 2, 0.01),
  s13: hold([40.3, 1.35, 1.5], [40.3, 1.05, -2.2], 42, cf(12), 0.0018, W("pitied") - 2, 0.005),
  s14: hold([200, 1.0, 3.6], [200, 0.85, -1.0], 44, cf(13), 0.0018, W("light") - 2, 0.007),
  s15: hold(S15[0], S15[1], S15[2], cf(14), 0.0016, W("cards") - 2, 0.006),
};
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C.s1 }, { f: W("curtains") - 4, dur: 22, s: C.s1b }], 2: [{ f: cf(1), s: C.s2 }], 3: [{ f: cf(2), s: C.s3 }], 4: [{ f: cf(3), s: C.s4 }],
  5: [{ f: cf(4), s: C.s5 }], 6: [{ f: cf(5), s: C.s6 }], 7: [{ f: cf(6), s: C.s7 }], 8: [{ f: cf(7), s: C.s8 }], 9: [{ f: cf(8), s: C.s9 }],
  10: [{ f: cf(9), s: C.s10 }], 11: [{ f: cf(10), s: C.s11 }], 12: [{ f: cf(11), s: C.s12 }], 13: [{ f: cf(12), s: C.s13 }], 14: [{ f: cf(13), s: C.s14 }],
  15: [{ f: cf(14), s: C.s15 }],
};
const KICKS: [number, number][] = [[WORD.job, 0.4], [WORD.career, 0.35], [WORD.wife, 0.35], [WORD.furniture, 0.5], [WORD.slipped, 0.4], [WORD.knob, 1.0],
  [WORD.dying, 0.5], [WORD.screamed, 1.0], [WORD.cards, 0.4]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  // the scream: a fine tremor all through it
  const s0 = WORD.screamed, s1 = BEAT[12] - 0.3;
  if (t > s0 && t < s1) a += 0.12 * Math.sin(t * 63) * (1 - (t - s0) / (s1 - s0));
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

// ---------------- lens ----------------
const M = MARK;
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 6, focus: () => M.coffin },
  { f: W("curtains") - 4, dur: 20, cInf: 4, focus: () => M.drapes },
  { f: cf(1), cInf: 9, focus: () => eyesOf(M.peter) },
  { f: cf(2), cInf: 7, focus: () => eyesOf(M.ivanR) },
  { f: cf(3), cInf: 8, focus: () => eyesOf(M.ivan4) },
  { f: cf(4), cInf: 10, focus: () => eyesOf(M.sofa, -0.4) },
  { f: cf(5), cInf: 8, focus: () => eyesOf(M.ivan6) },
  { f: cf(6), cInf: 4, focus: () => eyesOf(M.ladder) },
  { f: cf(7), cInf: 13, focus: () => eyesOf(M.ivan8) },
  { f: cf(8), cInf: 8, focus: () => eyesOf(M.bed, -0.5) },
  { f: cf(9), cInf: 8, focus: () => eyesOf(M.bed, -0.5) },
  { f: cf(10), cInf: 9, focus: () => [40.0, 0.9, -1.9] },
  { f: cf(11), cInf: 6, focus: () => eyesOf(M.dark) },
  { f: cf(12), cInf: 11, focus: () => eyesOf(M.bed, -0.5) },
  { f: cf(13), cInf: 6, focus: () => eyesOf(M.dark) },
  { f: cf(14), cInf: 6, focus: () => M.table },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export { cf, W as wf };
