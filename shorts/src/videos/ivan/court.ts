// The Law Courts and the card room (ch. I), floor y = 0:
// - the COURT (x 100): the judges' private room: grey-blue walls, tall daylit windows, a long table in green baize with
//   stacks of files, high-backed chairs, a column.
// - the CARD ROOM (x 140): Fedor Vasilievich's, that evening: a round card table in green baize with two candles and a lamp,
//   and behind it a tall window hung with the same kind of pink cretonne drapes, so the last shot echoes the first.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { Room, cyl, at } from "../../engine/hall";
import { cretonne, drape } from "./house";
import type { V3 } from "./story";

export const COURT: V3 = [100, 0, 0];
export const CARDS: V3 = [140, 0, 0];
export const BAIZE_Y = 0.78;
export const CARD_TABLE: V3 = [140.6, 0.76, -1.6];

const wallTex = () => ctex("ivCourtWall", 512, 512, (g) => {
  g.fillStyle = "#8a9aa8"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#7a8a98"; g.lineWidth = 6; g.strokeRect(40, 40, 432, 330);
  g.fillStyle = "#4a3a30"; g.fillRect(0, 440, 512, 72); g.fillStyle = "#c8b07a"; g.fillRect(0, 432, 512, 8);
});
const cardWall = () => ctex("ivCardWall", 512, 512, (g) => {
  g.fillStyle = "#c8a878"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#bc9a6a"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 24, 512);
  g.fillStyle = "#4a2e20"; g.fillRect(0, 450, 512, 62); g.fillStyle = "#d9a84a"; g.fillRect(0, 442, 512, 8);
});
const sky = () => ctex("ivCourtSky", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#a8c4e4"); gr.addColorStop(1, "#e8eef4"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#b8a890"; g.fillRect(0, 330, 256, 182); g.fillStyle = "#f6f6f8"; g.fillRect(0, 320, 256, 14);
  g.fillStyle = "#6a7a94"; for (let x = 20; x < 256; x += 60) g.fillRect(x, 370, 22, 40);
});
const dusk = () => ctex("ivDusk", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2a2a5a"); gr.addColorStop(1, "#7a5a7a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#1e1a2a"; g.fillRect(0, 360, 256, 152);
  g.fillStyle = "#f2d27a"; for (const x of [30, 110, 190]) g.fillRect(x, 390, 14, 22);
});

export class Court extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const parquet = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wallM = lam("ivCourtW", () => ({ map: wallTex(), side: THREE.DoubleSide })), cardW = lam("ivCardW", () => ({ map: cardWall(), side: THREE.DoubleSide }));
    const baize = lam("ivBaize", () => ({ color: "#2f6a42" })), wood = lam("ivWood2", () => ({ color: "#4a2e1c" })), white = lam("ivWhite2", () => ({ color: "#efe8da" }));
    const skyM = lam("ivSkyV", () => ({ map: sky(), emissive: "#ffffff", emissiveMap: sky() })), duskM = lam("ivDuskV", () => ({ map: dusk(), emissive: "#ffffff", emissiveMap: dusk() }));
    const files = [lam("ivFile1", () => ({ color: "#e8dcc0" })), lam("ivFile2", () => ({ color: "#c8b48a" })), lam("ivFile3", () => ({ color: "#d8c8a8" }))];
    const tape = lam("ivTape", () => ({ color: "#b03a3a" })), stone = lam("ivColumn", () => ({ color: "#d8d2c6" }));
    const drapeM = lam("ivDrape", () => ({ map: cretonne(), side: THREE.DoubleSide })), gilt = lam("ivGilt", () => ({ color: "#d9a84a" }));
    const wax = lam("ivWax", () => ({ color: "#f5ecd6" })), brass = lam("ivBrass", () => ({ color: "#f0c850", emissive: "#5a4010" }));

    // ---- the court ----
    const [cx] = COURT;
    b.add(quad(V(cx - 6, 0, 6), V(cx + 6, 0, 6), V(cx + 6, 0, -4), V(cx - 6, 0, -4), 2, 2), parquet);
    b.add(quad(V(cx - 6, 0, -4), V(cx + 6, 0, -4), V(cx + 6, 5, -4), V(cx - 6, 5, -4), 3, 1), wallM);
    for (const s of [-1, 1]) b.add(quad(V(cx + s * 6, 0, 6), V(cx + s * 6, 0, -4), V(cx + s * 6, 5, -4), V(cx + s * 6, 5, 6), 3, 1), wallM);
    for (const x of [-3.2, 0, 3.2]) { // tall windows
      fix.add(boxGeo(V(cx + x - 0.8, 1.0, -4), V(cx + x + 0.8, 4.2, -3.93)), white);
      fix.add(boxGeo(V(cx + x - 0.66, 1.14, -3.93), V(cx + x + 0.66, 4.06, -3.91)), skyM);
      fix.add(boxGeo(V(cx + x - 0.03, 1.14, -3.91), V(cx + x + 0.03, 4.06, -3.87)), white);
      fix.add(boxGeo(V(cx + x - 0.66, 2.57, -3.91), V(cx + x + 0.66, 2.63, -3.87)), white);
    }
    deco.add(cyl(0.32, 0.36, 5, 16), stone, at(cx - 4.8, 2.5, -2.6));
    // the long table in green baize, files, inkstands
    deco.add(boxGeo(V(cx - 2.4, BAIZE_Y - 0.06, -1.9), V(cx + 2.4, BAIZE_Y, -0.7)), baize);
    deco.add(boxGeo(V(cx - 2.3, 0.0, -1.8), V(cx + 2.3, BAIZE_Y - 0.06, -0.8)), lam("ivBaizeSide", () => ({ color: "#24502f" })));
    for (let i = 0; i < 6; i++) {
      const x = cx - 2.0 + i * 0.8, n = 2 + (i % 3);
      for (let k = 0; k < n; k++) deco.add(boxGeo(V(x - 0.18, BAIZE_Y + k * 0.06, -1.7 + (i % 2) * 0.15), V(x + 0.18, BAIZE_Y + k * 0.06 + 0.055, -1.45 + (i % 2) * 0.15)), files[(i + k) % 3]);
      deco.add(boxGeo(V(x - 0.19, BAIZE_Y + 0.02, -1.6 + (i % 2) * 0.15), V(x + 0.19, BAIZE_Y + n * 0.06 - 0.01, -1.57 + (i % 2) * 0.15)), tape);
    }
    for (const x of [-2.0, 0.0, 2.0]) { // high-backed chairs behind the table
      deco.add(boxGeo(V(cx + x - 0.3, 0, -2.6), V(cx + x + 0.3, 0.48, -2.2)), wood);
      deco.add(boxGeo(V(cx + x - 0.3, 0.48, -2.62), V(cx + x + 0.3, 1.7, -2.54)), wood);
    }

    // ---- the card room ----
    const [kx] = CARDS;
    b.add(quad(V(kx - 5, 0, 6), V(kx + 5, 0, 6), V(kx + 5, 0, -4), V(kx - 5, 0, -4), 2, 2), parquet);
    b.add(quad(V(kx - 5, 0, -4), V(kx + 5, 0, -4), V(kx + 5, 4.6, -4), V(kx - 5, 4.6, -4), 3, 1), cardW);
    for (const s of [-1, 1]) b.add(quad(V(kx + s * 5, 0, 6), V(kx + s * 5, 0, -4), V(kx + s * 5, 4.6, -4), V(kx + s * 5, 4.6, 6), 3, 1), cardW);
    fix.add(boxGeo(V(kx - 0.3, 0.7, -4), V(kx + 1.5, 3.5, -3.92)), white);
    fix.add(boxGeo(V(kx - 0.15, 0.85, -3.92), V(kx + 1.35, 3.35, -3.9)), duskM);
    fix.add(boxGeo(V(kx + 0.57, 0.85, -3.9), V(kx + 0.63, 3.35, -3.86)), white);
    fix.add(cyl(0.03, 0.03, 3.4, 8), gilt, at(kx + 0.6, 3.75, -3.78, 0, 0, Math.PI / 2));
    for (const [x0, x1] of [[-1.0, 0.0], [1.2, 2.2]]) { const m = new THREE.Mesh(drape(kx + x0, kx + x1, 3.72, 0.02, -3.74), drapeM); m.receiveShadow = true; this.root.add(m); }
    // the round card table, two candles and a lamp
    const [tx, ty, tz] = CARD_TABLE;
    deco.add(cyl(0.85, 0.85, 0.05, 32), baize, at(tx, ty, tz));
    deco.add(cyl(0.88, 0.88, 0.04, 32), wood, at(tx, ty - 0.04, tz));
    deco.add(cyl(0.08, 0.14, ty - 0.06, 10), wood, at(tx, (ty - 0.06) / 2, tz));
    deco.add(cyl(0.35, 0.35, 0.04, 16), wood, at(tx, 0.02, tz));
    for (const s of [-1, 1]) {
      deco.add(cyl(0.05, 0.06, 0.04, 10), brass, at(tx + s * 0.78, ty + 0.045, tz + 0.3));
      deco.add(cyl(0.025, 0.025, 0.2, 8), wax, at(tx + s * 0.78, ty + 0.16, tz + 0.3));
      this.flame(tx + s * 0.78, ty + 0.33, tz + 0.3, 0.05, 0.11, 2.4); this.glow(tx + s * 0.78, ty + 0.33, tz + 0.3, 1.4, 0.4);
    }
    deco.add(cyl(0.05, 0.08, 1.4, 10), brass, at(kx - 2.4, 0.7, -3.2)); // a standing lamp at the left
    deco.add(cyl(0.18, 0.32, 0.36, 14), lam("ivShade", () => ({ color: "#f2d8a0", emissive: "#a87a30" })), at(kx - 2.4, 1.58, -3.2));
    this.glow(kx - 2.4, 1.6, -3.2, 2.4, 0.45);

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
  pose(cards: boolean) { this.setFlames(cards); }
}
