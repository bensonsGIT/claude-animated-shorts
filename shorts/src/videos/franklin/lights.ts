// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export type LightName = "day" | "golden" | "night" | "lab" | "morning";
export const LIGHTS: Record<LightName, LightPreset> = {
  // winter morning through the sash windows: pale warm key from the window side, cool soft shade
  morning: {
    az: 110, el: 28,
    lit: [1.52, 1.4, 1.22], shade: [0.36, 0.36, 0.48], lift: [0.06, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.16,
    charTint: [1.0, 0.95, 0.88], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.2, sideTint: [0.9, 0.9, 0.98],
    blob: [0.6, 0.58, 0.66], actorShadow: false,
    top: "#efe4d0", hor: "#efe4d0", skyCurve: [0.0, 0.5, 0.6], fog: "#e8dcc6", fogNear: 16, fogFar: 90, sunDisc: "#000000",
    sunCol: "#fff2dc", sunI: 2.8, sky: "#f4ead8", ground: "#a08870", hemiI: 0.6,
    bias: -0.0004, normalBias: 0.02,
  },
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  // candlelit interior: warm amber key from the camera side (candles + fire), violet-blue shade (never brown), no sky
  night: {
    az: 125, el: 32,
    lit: [1.5, 1.05, 0.68], shade: [0.24, 0.2, 0.34], lift: [0.04, 0.04, 0.1], lambert: 0.4, sideK: 0.85, term: 0.12,
    charTint: [1.0, 0.84, 0.66], charShade: 0.8, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.8, 0.78, 0.96],
    blob: [0.6, 0.56, 0.78], actorShadow: false,
    top: "#140d1c", hor: "#2a1822", skyCurve: [0.0, 0.5, 0.6], fog: "#2b1a22", fogNear: 14, fogFar: 70, sunDisc: "#000000",
    sunCol: "#ffb36e", sunI: 3.2, sky: "#6a4a6e", ground: "#3a2418", hemiI: 0.35,
    bias: -0.0004, normalBias: 0.02,
  },
  // 2010 forensics lab: cool overhead fluorescent key, soft blue-grey shade, clean whites
  lab: {
    az: 150, el: 62,
    lit: [1.42, 1.46, 1.5], shade: [0.42, 0.46, 0.56], lift: [0.06, 0.07, 0.11], lambert: 0.3, sideK: 0.8, term: 0.2,
    charTint: [0.98, 0.99, 1.0], charShade: 0.88, charGrad: 0.06, bodyGrad: 0.18, sideTint: [0.92, 0.94, 1.0],
    blob: [0.6, 0.62, 0.7], actorShadow: false,
    top: "#dfe9e6", hor: "#dfe9e6", skyCurve: [0.0, 0.5, 0.6], fog: "#d9e4e2", fogNear: 20, fogFar: 140, sunDisc: "#000000",
    sunCol: "#f4f8ff", sunI: 2.6, sky: "#e8f0ff", ground: "#9aa4a8", hemiI: 0.7,
    bias: -0.0004, normalBias: 0.02,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  morning: {
    sky: { c: ["#efe4d0", "#efe4d0", "#efe4d0", "#efe4d0", "#efe4d0"], e: [0, 4, 10, 20, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0.03, 0.02, 0.0],
    sat: 1.06,
  },
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  // interiors: sky/water/clouds are hidden; a warm firelight bounce on faces turned to the lens
  night: {
    sky: { c: ["#2a1822", "#22141e", "#1a101a", "#140d16", "#0e0a12"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#22385e", far: "#2a2a44", crest: "#4a5a88", trough: "#101830", glint: "#ffd9a0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#3a2a3a", mid: "#2a1e2c", shade: "#1a1220" },
    bounce: [0.06, 0.03, 0.0],
    sat: 1.08,
  },
  lab: {
    sky: { c: ["#dfe9e6", "#dfe9e6", "#dfe9e6", "#dfe9e6", "#dfe9e6"], e: [0, 4, 10, 20, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.04,
  },
};
