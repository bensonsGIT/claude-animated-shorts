// Interiors far from the spa (floor y = 0), side by side:
// - the PARIS salon (x 200): parquet, rose silk walls in gilt panels, a tall window on rooftops, a gilt sofa, a chandelier;
// - the debtors' CELL at Roulettenburg (x 240): rough stone, a small barred window high up, a plank bed; a row of iron
//   BARS across the front (pose(bars)) for the camera to peer through;
// - the St Petersburg STUDY, October 1866 (x 280): dark green paper, Dostoyevsky's desk with a candle, the stenographer's
//   little table, a bookcase, a window whose pane cycles day / night (pose(..., day 0..1)).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const PARIS: V3 = [200, 0, 0];
export const CELL: V3 = [240, 0, 0];
export const STUDY: V3 = [280, 0, 0];
export const DESK_TOP = 0.78;

const silk = () => ctex("gbSilk", 512, 512, (g) => {
  g.fillStyle = "#e8b8bc"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#d9a84a"; g.lineWidth = 10; g.strokeRect(48, 60, 416, 340);
  g.fillStyle = "#f0c8cc"; g.fillRect(58, 70, 396, 320);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.arc(70 + (i * 97) % 380, 80 + (i * 53) % 300, 6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#5a2a30"; g.fillRect(0, 450, 512, 62); g.fillStyle = "#d9a84a"; g.fillRect(0, 442, 512, 8);
});
const paper = () => ctex("gbPaper", 512, 512, (g) => {
  g.fillStyle = "#2e4a3a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#38564a"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 22, 512);
  g.fillStyle = "#3a2a20"; g.fillRect(0, 456, 512, 56);
});
const roofs = () => ctex("gbRoofs", 256, 512, (g) => { // Paris through the window: sky, grey mansard roofs, chimney pots
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#9ac4ec"); gr.addColorStop(1, "#e6eef6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#6a7488"; g.beginPath(); g.moveTo(0, 330); g.lineTo(60, 300); g.lineTo(140, 300); g.lineTo(200, 320); g.lineTo(256, 310); g.lineTo(256, 512); g.lineTo(0, 512); g.fill();
  g.fillStyle = "#e8dcc4"; g.fillRect(0, 380, 256, 132);
  g.fillStyle = "#a8603a"; for (const x of [40, 110, 190]) g.fillRect(x, 270, 14, 34);
  g.fillStyle = "#4a5a7a"; for (let x = 20; x < 256; x += 60) g.fillRect(x, 410, 24, 40);
});

export class Rooms extends Room {
  private bars = new THREE.Group();
  private pane: THREE.MeshLambertMaterial;
  private parisFl: THREE.Sprite[] = []; private studyFl: THREE.Sprite[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const parquet = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const silkW = lam("gbSilkW", () => ({ map: silk(), side: THREE.DoubleSide })), paperW = lam("gbPaperW", () => ({ map: paper(), side: THREE.DoubleSide }));
    const stoneW = twoTone(new THREE.MeshLambertMaterial({ map: stoneHD("gbCellStone", ["#8a8478", "#7e786e", "#948e82", "#76706a"], "#5a554e"), side: THREE.DoubleSide }));
    const gilt = lam("gbGilt", () => ({ color: "#d9a84a" })), rose = lam("gbSofa", () => ({ color: "#c84a6a" })), iron = lam("gbIron", () => ({ color: "#2a2e2a" }));
    const wood = lam("gbDarkWood", () => ({ color: "#4a2e1c" })), plank = lam("gbPlank", () => ({ color: "#8a6a44" })), straw = lam("gbStraw", () => ({ color: "#d8b860" }));
    const books = [lam("gbBk1", () => ({ color: "#8a2a2a" })), lam("gbBk2", () => ({ color: "#2a4a6a" })), lam("gbBk3", () => ({ color: "#6a5a2a" }))];
    const view = lam("gbView", () => ({ map: roofs(), emissive: "#ffffff", emissiveMap: roofs() }));
    this.pane = new THREE.MeshLambertMaterial({ color: "#1a2240", emissive: "#1a2240" });
    const wax = lam("gbWax", () => ({ color: "#f5ecd6" })), parch = lam("gbParch", () => ({ color: "#efe2bf" }));

    // ---- Paris salon ----
    const [px] = PARIS;
    b.add(quad(V(px - 5, 0, 6), V(px + 5, 0, 6), V(px + 5, 0, -4), V(px - 5, 0, -4), 2, 2), parquet);
    b.add(quad(V(px - 5, 0, -4), V(px + 5, 0, -4), V(px + 5, 5, -4), V(px - 5, 5, -4), 3, 1), silkW);
    for (const s of [-1, 1]) b.add(quad(V(px + s * 5, 0, 6), V(px + s * 5, 0, -4), V(px + s * 5, 5, -4), V(px + s * 5, 5, 6), 3, 1), silkW);
    fix.add(boxGeo(V(px + 1.4, 0.6, -4), V(px + 3.4, 4.4, -3.92)), gilt); // the window frame
    fix.add(boxGeo(V(px + 1.55, 0.75, -3.92), V(px + 3.25, 4.25, -3.9)), view);
    fix.add(boxGeo(V(px + 2.37, 0.75, -3.9), V(px + 2.43, 4.25, -3.86)), gilt); fix.add(boxGeo(V(px + 1.55, 2.47, -3.9), V(px + 3.25, 2.53, -3.86)), gilt);
    deco.add(boxGeo(V(px - 2.6, 0.1, -3.7), V(px + 0.4, 0.5, -2.9)), rose); // the sofa
    deco.add(boxGeo(V(px - 2.6, 0.5, -3.9), V(px + 0.4, 1.2, -3.6)), rose);
    for (const x of [px - 2.6, px + 0.4]) deco.add(boxGeo(V(x - 0.12, 0.1, -3.9), V(x + 0.12, 0.8, -2.9)), gilt);
    deco.add(boxGeo(V(px - 2.6, 0, -3.8), V(px + 0.4, 0.1, -2.9)), gilt);
    fix.add(cyl(0.02, 0.02, 1.2, 6), gilt, at(px - 0.5, 4.4, 0)); fix.add(new THREE.TorusGeometry(0.5, 0.05, 6, 20), gilt, at(px - 0.5, 3.8, 0, Math.PI / 2));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; this.flame(px - 0.5 + 0.5 * Math.cos(a), 3.95, 0.5 * Math.sin(a), 0.06, 0.12, 2.0); }
    this.glow(px - 0.5, 3.9, 0, 2.4, 0.35);

    // ---- the debtors' cell ----
    const [cx] = CELL;
    b.add(quad(V(cx - 3, 0, 4), V(cx + 3, 0, 4), V(cx + 3, 0, -3), V(cx - 3, 0, -3), 2, 2), stoneW);
    b.add(quad(V(cx - 3, 0, -3), V(cx + 3, 0, -3), V(cx + 3, 4, -3), V(cx - 3, 4, -3), 2, 1.3), stoneW);
    for (const s of [-1, 1]) b.add(quad(V(cx + s * 3, 0, 4), V(cx + s * 3, 0, -3), V(cx + s * 3, 4, -3), V(cx + s * 3, 4, 4), 2, 1.3), stoneW);
    fix.add(boxGeo(V(cx + 0.6, 2.6, -3.0), V(cx + 1.6, 3.3, -2.96)), lam("gbCellSky", () => ({ color: "#a8c0e0", emissive: "#5a7090" })));
    for (let i = 1; i < 5; i++) fix.add(boxGeo(V(cx + 0.6 + i * 0.2 - 0.02, 2.6, -2.96), V(cx + 0.6 + i * 0.2 + 0.02, 3.3, -2.92)), iron);
    deco.add(boxGeo(V(cx - 2.6, 0.4, -2.9), V(cx - 0.6, 0.48, -2.1)), plank); // plank bed on two blocks
    for (const x of [cx - 2.4, cx - 0.8]) deco.add(boxGeo(V(x - 0.15, 0, -2.85), V(x + 0.15, 0.4, -2.15)), plank);
    for (let k = 0; k < 14; k++) fix.add(new THREE.BoxGeometry(0.5, 0.02, 0.04), straw, at(cx + 1.0 + 0.6 * Math.sin(k * 2.3), 0.012, -1.8 + 0.5 * Math.cos(k * 1.7), 0, k * 0.9, 0));
    for (let i = 0; i < 13; i++) this.bars.add(new THREE.Mesh(cyl(0.025, 0.025, 4, 8), iron).translateX(cx - 3 + i * 0.5).translateY(2).translateZ(1.6));
    this.bars.add(new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 0.06), iron).translateX(cx).translateY(2.6).translateZ(1.6));
    this.root.add(this.bars);

    // ---- the St Petersburg study ----
    const [sx] = STUDY;
    b.add(quad(V(sx - 4, 0, 5), V(sx + 4, 0, 5), V(sx + 4, 0, -3), V(sx - 4, 0, -3), 2, 2), parquet);
    b.add(quad(V(sx - 4, 0, -3), V(sx + 4, 0, -3), V(sx + 4, 4.2, -3), V(sx - 4, 4.2, -3), 3, 1), paperW);
    for (const s of [-1, 1]) b.add(quad(V(sx + s * 4, 0, 5), V(sx + s * 4, 0, -3), V(sx + s * 4, 4.2, -3), V(sx + s * 4, 4.2, 5), 3, 1), paperW);
    fix.add(boxGeo(V(sx - 2.9, 1.0, -3), V(sx - 1.3, 3.4, -2.94)), wood); // the window: frame + pane (day / night)
    const paneM = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.02), this.pane); paneM.position.set(sx - 2.1, 2.2, -2.92); this.root.add(paneM);
    fix.add(boxGeo(V(sx - 2.13, 1.1, -2.92), V(sx - 2.07, 3.3, -2.88)), wood); fix.add(boxGeo(V(sx - 2.8, 2.17, -2.92), V(sx - 1.4, 2.23, -2.88)), wood);
    // bookcase
    deco.add(boxGeo(V(sx + 1.4, 0, -3), V(sx + 3.4, 2.6, -2.55)), wood);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) fix.add(boxGeo(V(sx + 1.5 + i * 0.2, 0.15 + r * 0.62, -2.6), V(sx + 1.66 + i * 0.2, 0.62 + r * 0.62 - 0.05 * (i % 3), -2.5)), books[(i + r) % 3]);
    // Dostoyevsky's desk (left) and the stenographer's small table (right)
    deco.add(boxGeo(V(sx - 1.6, DESK_TOP - 0.06, -1.9), V(sx + 0.2, DESK_TOP, -1.1)), wood);
    for (const [x, z] of [[-1.5, -1.8], [0.1, -1.8], [-1.5, -1.2], [0.1, -1.2]]) deco.add(boxGeo(V(sx + x - 0.04, 0, z - 0.04), V(sx + x + 0.04, DESK_TOP - 0.06, z + 0.04)), wood);
    deco.add(cyl(0.035, 0.04, 0.22, 8), wax, at(sx - 1.3, DESK_TOP + 0.11, -1.6));
    this.flame(sx - 1.3, DESK_TOP + 0.3, -1.6, 0.07, 0.15, 2.4); this.glow(sx - 1.3, DESK_TOP + 0.3, -1.6, 1.8, 0.45);
    deco.add(boxGeo(V(sx - 0.9, DESK_TOP, -1.7), V(sx - 0.4, DESK_TOP + 0.04, -1.35)), parch);
    deco.add(boxGeo(V(sx + 0.9, 0.66, -0.9), V(sx + 1.9, 0.7, -0.3)), wood);
    for (const [x, z] of [[0.95, -0.85], [1.85, -0.85], [0.95, -0.35], [1.85, -0.35]]) deco.add(boxGeo(V(sx + x - 0.03, 0, z - 0.03), V(sx + x + 0.03, 0.66, z + 0.03)), wood);
    deco.add(cyl(0.035, 0.04, 0.2, 8), wax, at(sx + 1.75, 0.8, -0.75));
    this.flame(sx + 1.75, 0.98, -0.75, 0.06, 0.13, 2.2); this.glow(sx + 1.75, 0.98, -0.75, 1.5, 0.4);

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    void this.parisFl; void this.studyFl;
  }
  /** bars across the cell front; day 0 = night pane .. 1 = daylight pane in the study window */
  pose(bars: boolean, day = 0) {
    this.bars.visible = bars;
    const c = new THREE.Color("#141a34").lerp(new THREE.Color("#cfe2f4"), day);
    this.pane.color.copy(c); this.pane.emissive.copy(c).multiplyScalar(0.8);
    this.setFlames(true);
  }
}
