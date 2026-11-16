// Cast + effects first drawn for the Kentucky Meat Shower short, 1876. Any short can import them.

import { Pen, rad, rnd } from "../toon";
import type { Outfit, P2 } from "../toon";


// ================= The Kentucky Meat Shower, 1876 =================
/** Mrs. Crouch: work dress, apron (sash), bonnet */
export const CROUCH: Outfit = { jacket: "#7a5aa8", pants: "#3a3040", boots: "#3a2a20", dress: "#6a4a98", hat: "bonnet", sash: "#efe6d4", skin: "#f5d0b0" };
/** the two men who tasted it: farm clothes, slouch caps, beards (moustache) */
export const TASTER_A: Outfit = { jacket: "#6a7a4a", pants: "#4a4038", boots: "#3a2a20", hat: "cap", cap: "#5a4632", belt: "#3a2a1a", moustache: "#5a3a24", skin: "#efc6a0", buttons: "#c8b07a" };
export const TASTER_B: Outfit = { jacket: "#a8643a", pants: "#3a3a48", boots: "#2a2024", hat: "tophat", moustache: "#c89a5a", skin: "#ffe0c4", belt: "#2a1a14", build: "stout" };
/** the scientist who said algae: grey suit, dark hair, moustache */
export const SCIENTIST: Outfit = { jacket: "#5a5e6a", pants: "#2e2e36", boots: "#1e1a1e", hat: "hair", hair: "#2a1e18", moustache: "#2a1e18", buttons: "#c8ccd4", skin: "#f5d0b0" };
/** the doctor at the microscope: black frock coat, grey hair, side whiskers */
export const DOCTOR: Outfit = { jacket: "#2a2a3a", pants: "#2a2630", boots: "#1e1a1e", hat: "hair", hair: "#b8b4ac", moustache: "#9a968e", buttons: "#d8b04a", skin: "#ffe0c4", band: "#f4f1e8", build: "stout" };

/** a chunk of raw meat on a 200 x 200 canvas */
export const fxMeat = (p: Pen, seed = 0) => {
  const pts: P2[] = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = 62 + rnd(seed, i) * 30; pts.push([100 + r * Math.cos(a), 100 + 0.8 * r * Math.sin(a)]); }
  p.poly(pts, "#c8424e", 8);
  p.stroke([[70, 85], [100, 95], [135, 80]], 9, "#f4d6cc");
  p.stroke([[80, 125], [118, 118]], 7, "#f4d6cc");
  p.ell(120, 72, 14, 9, "#e07882", 0);
};
/** a splat ring on landing, 300 x 300 canvas, t 0..1 */
export const fxSplat = (p: Pen, t: number) => {
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45 + 20), d = 40 + 90 * t, r = 14 * (1 - t) + 4;
    p.ell(150 + d * Math.cos(a), 150 + d * 0.6 * Math.sin(a), r, r, "#c8424e", 4);
  }
};
/** a thought bubble with a picture inside, 400 x 400 canvas: sheep, deer, algae, horse, baby */
export const fxBubble = (p: Pen, kind: "sheep" | "deer" | "algae" | "horse" | "baby") => {
  p.ell(70, 360, 14, 12, "#ffffff", 6); p.ell(110, 318, 22, 18, "#ffffff", 6);
  const pts: P2[] = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([230 + (150 + 10 * Math.sin(a * 9)) * Math.cos(a), 170 + (125 + 10 * Math.sin(a * 9)) * Math.sin(a)]); }
  p.poly(pts, "#ffffff", 8);
  const cx = 230, cy = 175;
  if (kind === "sheep") {
    for (let i = 0; i < 7; i++) p.ell(cx - 50 + (i % 4) * 32, cy - 20 + Math.floor(i / 4) * 34, 30, 26, "#f4f0e6", 5);
    p.ell(cx + 82, cy - 20, 24, 30, "#3a3038", 5);
    for (const x of [-40, -10, 25, 50]) p.stroke([[cx + x, cy + 30], [cx + x, cy + 75]], 9);
  } else if (kind === "deer") {
    p.ell(cx - 10, cy + 10, 70, 38, "#b07848", 6);
    p.ell(cx + 72, cy - 40, 24, 28, "#b07848", 6); p.stroke([[cx + 50, cy - 20], [cx + 62, cy - 30]], 14, "#b07848");
    for (const s of [-1, 1]) p.stroke([[cx + 72 + s * 8, cy - 64], [cx + 72 + s * 26, cy - 108], [cx + 72 + s * 40, cy - 100]], 7, "#5a3a24");
    for (const x of [-50, -25, 30, 50]) p.stroke([[cx + x, cy + 40], [cx + x, cy + 90]], 8);
  } else if (kind === "algae") {
    for (let i = 0; i < 6; i++) p.ell(cx - 70 + i * 28, cy + 10 * Math.sin(i * 1.7), 26, 22, ["#5aa04a", "#7ab85a", "#4a8a3a"][i % 3], 5);
    p.stroke([[cx - 90, cy + 40], [cx + 90, cy + 40]], 6, "#3a6a8a");
  } else if (kind === "horse") {
    p.ell(cx - 10, cy + 10, 78, 40, "#8a5a3a", 6);
    p.poly([[cx + 50, cy - 10], [cx + 80, cy - 80], [cx + 120, cy - 70], [cx + 104, cy - 50], [cx + 78, cy + 10]], "#8a5a3a", 6);
    p.stroke([[cx + 76, cy - 80], [cx + 50, cy - 30]], 10, "#3a2418");
    for (const x of [-55, -30, 30, 55]) p.stroke([[cx + x, cy + 40], [cx + x, cy + 95]], 9);
  } else {
    // a baby's bonnet and rattle
    p.ell(cx - 30, cy + 10, 62, 56, "#f6d8e0", 6); p.ell(cx - 30, cy + 22, 40, 36, "#ffe2c2", 5);
    p.dot(cx - 44, cy + 16, 4); p.dot(cx - 16, cy + 16, 4); p.arc(cx - 30, cy + 34, 8, 5, 20, 160, 3);
    p.stroke([[cx + 50, cy + 60], [cx + 90, cy - 10]], 9, "#e8c45a"); p.ell(cx + 95, cy - 24, 22, 22, "#7ab8e8", 5);
  }
};
/** the view down the microscope (round field), 512 x 512 canvas: lung (air sacs), muscle (striped fibres), cartilage (cells) */
export const fxScope = (p: Pen, kind: "lung" | "muscle" | "cartilage") => {
  const g = p.g;
  g.fillStyle = "#0e0a12"; g.fillRect(0, 0, 512, 910);
  g.translate(0, 199);
  g.save(); g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#fbe6e6"; g.fillRect(0, 0, 512, 512);
  if (kind === "lung") for (let i = 0; i < 22; i++) { const x = 60 + (i % 5) * 96 + (Math.floor(i / 5) % 2) * 40, y = 70 + Math.floor(i / 5) * 92; p.ell(x, y, 40, 34, "#fbe6e6", 0); g.strokeStyle = "#d8506a"; g.lineWidth = 10; g.beginPath(); g.ellipse(x, y, 42, 36, 0, 0, Math.PI * 2); g.stroke(); }
  else if (kind === "muscle") for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "#e07a8a" : "#c8505e"; g.fillRect(0, 40 + i * 76, 512, 60);
    for (let x = 0; x < 512; x += 18) { g.fillStyle = "rgba(120,20,40,0.45)"; g.fillRect(x, 40 + i * 76, 6, 60); }
  } else { g.fillStyle = "#dfe6f2"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 18; i++) { const x = 60 + (i * 97) % 400, y = 60 + ((i * 61) % 400); p.ell(x, y, 30, 22, "#b8c8e8", 5); p.dot(x, y, 9, "#6a5aa8"); } }
  g.restore();
  g.strokeStyle = "#241726"; g.lineWidth = 16; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
  g.setTransform(1, 0, 0, 1, 0, 0);
};
/** a turkey vulture (black body, bald red head), 400 x 240 canvas; w = wing phase 0/1/2, gag = mouth open */
export const fxVulture = (p: Pen, w: number, gag = false) => {
  const up = [-50, 0, 40][w];
  for (const s of [-1, 1]) p.poly([[200, 130], [200 + s * 60, 110 + up * 0.4], [200 + s * 190, 110 + up], [200 + s * 150, 150 + up * 0.6], [200 + s * 60, 150]], "#2a2228", 6);
  p.ell(200, 140, 46, 30, "#2a2228", 6);
  p.ell(200, 92, 22, 22, "#d8505a", 5);
  p.dot(192, 88, 4); p.dot(208, 88, 4);
  if (gag) p.ell(200, 108, 9, 10, "#5a1e28", 3);
  else p.poly([[194, 104], [206, 104], [200, 116]], "#f0e6d0", 3);
};
/** the surviving sample in its jar, 300 x 420 canvas */
export const fxJar = (p: Pen) => {
  p.poly([[60, 90], [240, 90], [250, 380], [240, 400], [60, 400], [50, 380]], "rgba(210,236,240,0.55)", 8);
  p.ell(150, 330, 70, 50, "#d8b090", 0);
  p.poly([[100, 300], [140, 280], [190, 300], [195, 350], [150, 370], [105, 350]], "#b8606a", 6);
  p.stroke([[120, 320], [170, 316]], 6, "#f4d6cc");
  p.poly([[50, 50], [250, 50], [250, 92], [50, 92]], "#3a3030", 8);
  p.stroke([[80, 120], [80, 360]], 12, "rgba(255,255,255,0.6)");
  p.poly([[90, 200], [210, 200], [210, 250], [90, 250]], "#efe2bf", 5);
  p.stroke([[110, 218], [190, 218]], 4, "#5a4636"); p.stroke([[110, 234], [170, 234]], 4, "#5a4636");
};
