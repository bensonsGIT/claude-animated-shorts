// Roulettenburg, a German spa town, 1860s (one outdoor set + sky dome), round the origin:
// - the HOTEL (facade at z -7, facing +z) with its raised VERANDAH (floor y 0.6, z -7..0, x -7..7) under a striped awning,
//   potted orange trees along the edge, a cafe TABLE with two chairs; broad STEPS (z 0..1.5) down to the square;
// - the cobbled SQUARE (z 1.5..44) with gas lamps and flower beds;
// - across it the KURSAAL (the casino: a cream colonnade with a pediment and a shallow dome) at z 44, facing -z.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, facadeHD, cobbleHD, grassHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const VER_Y = 0.6;
export const TABLE: V3 = [1.6, VER_Y, -2.6];
export const KURSAAL_Z = 44;

const stripes = () => ctex("gbStripes", 512, 64, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#2f6a4a"; g.fillRect(i * 32, 0, 32, 64); } });
const sky = (key: string, top: string, mid: string, hor: string) => ctex(key, 128, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.36, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
});
const boards = () => ctex("gbBoards", 512, 512, (g, r) => {
  g.fillStyle = "#c8a878"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { g.fillStyle = `rgba(90,60,30,${0.08 + 0.1 * r()})`; g.fillRect(0, y, 512, 30); g.fillStyle = "rgba(60,40,20,0.55)"; g.fillRect(0, y + 30, 512, 2); }
});

export class Spa extends Room {
  private dome: THREE.Mesh;
  private skies = { day: sky("gbSkyD", "#3a80d8", "#80b8ec", "#dcecf6"), golden: sky("gbSkyG", "#6a4f8c", "#f0a07a", "#ffd08a") };
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const cob = twoTone(new THREE.MeshLambertMaterial({ map: cobbleHD() }));
    const ver = twoTone(new THREE.MeshLambertMaterial({ map: boards() }));
    const hotelW = twoTone(new THREE.MeshLambertMaterial({ map: facadeHD("gbHotel", 26, 16, { wall: "#e8d8b4", shutter: "#3a6a4a", door: true }), side: THREE.DoubleSide }));
    const kurW = twoTone(new THREE.MeshLambertMaterial({ map: facadeHD("gbKursaal", 40, 12, { wall: "#efe6cf", shutter: "#8a6a3a", door: false }), side: THREE.DoubleSide }));
    const stone = lam("gbStone", () => ({ color: "#e4dccb" })), white = lam("gbWhite", () => ({ color: "#f4f0e6" })), iron = lam("gbIron", () => ({ color: "#2a2e2a" }));
    const awn = lam("gbAwn", () => ({ map: stripes(), side: THREE.DoubleSide })), tub = lam("gbTub", () => ({ color: "#3a5a8a" }));
    const leaf = lam("gbLeaf", () => ({ color: "#3e7a3a" })), orange = lam("gbOrange", () => ({ color: "#f0962a" })), wood = lam("gbWood", () => ({ color: "#6a4428" }));
    const cloth = lam("gbCloth", () => ({ color: "#f6f4ee" })), copper = lam("gbCopper", () => ({ color: "#6aa890" })), bed = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const flowers = [lam("gbFlR", () => ({ color: "#d8384a" })), lam("gbFlY", () => ({ color: "#f2c838" })), lam("gbFlP", () => ({ color: "#d878b8" }))];

    // ---- ground: the square ----
    b.add(quad(V(-40, 0, 60), V(40, 0, 60), V(40, 0, -7), V(-40, 0, -7), 10, 8), cob);
    // ---- the hotel facade + verandah ----
    b.add(quad(V(-13, 0, -7), V(13, 0, -7), V(13, 16, -7), V(-13, 16, -7), 1, 1), hotelW);
    for (const s of [-1, 1]) b.add(quad(V(s * 13, 0, -7), V(s * 13, 0, -30), V(s * 13, 16, -30), V(s * 13, 16, -7), 1, 1), hotelW);
    deco.add(boxGeo(V(-7.2, 0, -7), V(7.2, VER_Y - 0.04, 0)), stone);
    b.add(quad(V(-7.2, VER_Y, 0), V(7.2, VER_Y, 0), V(7.2, VER_Y, -7), V(-7.2, VER_Y, -7), 6, 3), ver);
    for (let i = 0; i < 3; i++) deco.add(boxGeo(V(-4.5, 0, 0 + i * 0.5), V(4.5, VER_Y - 0.2 * (i + 1) + 0.2, 0.5 + i * 0.5)), stone); // steps
    for (const s of [-1, 1]) { // low balustrades either side of the steps (below hip height)
      deco.add(boxGeo(V(s * 4.7 - 0.1 + (s > 0 ? 0 : 0), VER_Y, -0.2), V(s * 4.7 + 0.1, VER_Y + 0.5, 0)), stone);
      deco.add(boxGeo(V(Math.min(s * 4.7, s * 7.2), VER_Y + 0.45, -0.2), V(Math.max(s * 4.7, s * 7.2), VER_Y + 0.55, 0)), stone);
    }
    // the awning on iron posts
    for (const x of [-7, -2.4, 2.4, 7]) deco.add(cyl(0.05, 0.05, 3.2, 8), iron, at(x, VER_Y + 1.6, -0.15));
    b.add(quad(V(-7.3, VER_Y + 3.2, -0.15), V(7.3, VER_Y + 3.2, -0.15), V(7.3, VER_Y + 4.1, -7), V(-7.3, VER_Y + 4.1, -7), 6, 1), awn);
    for (let i = 0; i < 12; i++) { const x = -7.3 + (i + 0.5) * (14.6 / 12); fix.add(new THREE.CircleGeometry(0.62, 12, Math.PI, Math.PI), awn, at(x, VER_Y + 3.2, -0.15)); } // scalloped edge
    // orange trees in blue tubs along the verandah edge
    for (const x of [-6.3, 6.3, -5.2, 5.2]) {
      const z = Math.abs(x) > 6 ? -0.7 : -6.2;
      deco.add(cyl(0.32, 0.26, 0.55, 12), tub, at(x, VER_Y + 0.28, z));
      deco.add(cyl(0.04, 0.05, 0.8, 6), wood, at(x, VER_Y + 0.9, z));
      deco.add(new THREE.SphereGeometry(0.5, 12, 10), leaf, at(x, VER_Y + 1.5, z));
      for (let k = 0; k < 5; k++) deco.add(new THREE.SphereGeometry(0.06, 6, 5), orange, at(x + 0.4 * Math.cos(k * 1.3), VER_Y + 1.45 + 0.25 * Math.sin(k * 2.1), z + 0.38 * Math.sin(k * 1.3)));
    }
    // the cafe table + two chairs
    const [tx, , tz] = TABLE;
    deco.add(cyl(0.45, 0.45, 0.04, 20), cloth, at(tx, VER_Y + 0.74, tz));
    deco.add(cyl(0.05, 0.08, 0.72, 8), iron, at(tx, VER_Y + 0.36, tz));
    for (const s of [-1, 1]) {
      const cx = tx + s * 0.75;
      deco.add(boxGeo(V(cx - 0.22, VER_Y + 0.44, tz - 0.2), V(cx + 0.22, VER_Y + 0.48, tz + 0.2)), wood);
      deco.add(boxGeo(V(cx - 0.22, VER_Y + 0.48, tz - 0.24), V(cx + 0.22, VER_Y + 0.98, tz - 0.2)), wood);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.16], [0.18, 0.16]]) deco.add(boxGeo(V(cx + dx - 0.02, VER_Y, tz + dz - 0.02), V(cx + dx + 0.02, VER_Y + 0.44, tz + dz + 0.02)), wood);
    }
    deco.add(cyl(0.035, 0.03, 0.12, 8), white, at(tx - 0.15, VER_Y + 0.82, tz + 0.1)); // coffee cup
    // ---- the square: gas lamps, flower beds ----
    for (const [x, z] of [[-9, 8], [9, 8], [-9, 24], [9, 24], [-9, 38], [9, 38]]) {
      deco.add(cyl(0.07, 0.1, 3.6, 8), iron, at(x, 1.8, z));
      deco.add(boxGeo(V(x - 0.18, 3.6, z - 0.18), V(x + 0.18, 4.0, z + 0.18)), lam("gbLampGlass", () => ({ color: "#f8ecc0", emissive: "#6a5a30" })));
    }
    for (const [x, z, r] of [[0, 16, 3.2], [-14, 22, 2.2], [14, 22, 2.2]] as const) {
      deco.add(cyl(r, r, 0.3, 24), bed, at(x, 0.15, z));
      for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2, rr = r * (0.55 + 0.3 * ((k * 7) % 3) / 2); fix.add(new THREE.SphereGeometry(0.14, 6, 5), flowers[k % 3], at(x + rr * Math.cos(a), 0.36, z + rr * Math.sin(a))); }
      if (r > 3) { deco.add(cyl(0.6, 0.8, 1.0, 16), stone, at(x, 0.8, z)); deco.add(cyl(0.12, 0.12, 1.2, 8), stone, at(x, 1.8, z)); deco.add(cyl(0.7, 0.3, 0.3, 16), stone, at(x, 2.5, z)); } // a fountain
    }
    // ---- the Kursaal ----
    const kz = KURSAAL_Z;
    b.add(quad(V(20, 0, kz), V(-20, 0, kz), V(-20, 12, kz), V(20, 12, kz), 1, 1), kurW);
    deco.add(boxGeo(V(-8, 0, kz - 3.2), V(8, 0.5, kz)), stone); // portico steps
    for (let i = 0; i < 8; i++) deco.add(cyl(0.38, 0.42, 7.5, 16), white, at(-7 + i * 2, 0.5 + 3.75, kz - 2.6));
    deco.add(boxGeo(V(-8.2, 8.0, kz - 3.2), V(8.2, 9.0, kz)), white); // entablature
    const ped = new THREE.BufferGeometry().setFromPoints([V(-8.4, 9, kz - 3.1), V(8.4, 9, kz - 3.1), V(0, 11.6, kz - 3.1)]); ped.computeVertexNormals();
    deco.add(ped, white);
    deco.add(new THREE.SphereGeometry(6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper, at(0, 12, kz + 6));
    deco.add(boxGeo(V(-20.5, 12, kz - 0.3), V(20.5, 12.6, kz + 0.3)), white);

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
  }
  pose(light: string, camPos: THREE.Vector3) {
    (this.dome.material as THREE.MeshBasicMaterial).map = light === "golden" ? this.skies.golden : this.skies.day;
    this.dome.position.copy(camPos);
  }
}
