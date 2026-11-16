// The Crime and Punishment interiors (each a Room, floor y = 0, open toward +z for the camera):
// Garret: Raskolnikov's "cupboard" under the roof (I.1): yellow peeling paper, the ceiling sloping down to 1.45 m over the
//   sofa he sleeps on, one small window, a table with books and a jug.
// Pawn: the pawnbroker's flat (I.1): yellow paper, geraniums and muslin at the window, the icon corner with its little
//   lamp (a flame that goes out), a chest of drawers, the door to the hall on the right; plus the LANDING (x = 12): a
//   dark stairwell wall with her door open a crack on its chain.
// Office: the police office: green-grey walls, two desks with ledgers, a tiled stove, a window, an empty frame.
// SonyaRoom: Sonya's big crooked room (IV.4): the back wall runs at a slant into a sharp corner, bare floor, a bed, a
//   chest, a table with a candle and a book.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const GARRET = { x0: -1.6, x1: 1.6, z0: -1.6, z1: 1.8, h: 2.4 };
export const PAWN = { x0: -2.6, x1: 2.6, z0: -2.2, z1: 2.2, h: 2.7 };
export const LANDING: V3 = [12, 0, -1];
export const OFFICE = { x0: -3.6, x1: 3.6, z0: -3, z1: 2.5, h: 3.2 };
export const SONYA_T: V3 = [0.6, 0.74, -1.0];

const paper = (key: string, base: string, fig: string, peel = false) => ctex(key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = fig; g.lineWidth = 2;
  for (let x = 16; x < 256; x += 32) { g.beginPath(); for (let y = 0; y <= 256; y += 8) g.lineTo(x + 5 * Math.sin(y / 14), y); g.stroke(); }
  for (let i = 0; i < 24; i++) { g.fillStyle = fig; g.beginPath(); g.arc(16 + (i % 8) * 32, 20 + Math.floor(i / 8) * 90, 4, 0, Math.PI * 2); g.fill(); }
  if (peel) for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(120,100,70,${0.25 + 0.25 * r()})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 26, 6 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const shell = (B: Batch, d: { x0: number; x1: number; z0: number; z1: number; h: number }, floor: THREE.Material, wall: THREE.Material, skirt: THREE.Material, ceil: THREE.Material | null) => {
  const { x0, x1, z0, z1, h } = d;
  B.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), floor);
  for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)]] as const) {
    B.add(boxGeo(a, V(b.x, 0.12, b.z)), skirt);
    B.add(boxGeo(V(a.x, 0.12, a.z), b, 1.2), wall);
  }
  if (ceil) B.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), ceil);
};
const winPane = (root: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, col: THREE.Color) => {
  const m = new THREE.Mesh(quad(a, b, c, d), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.layers.set(NOINK); root.add(m);
};

export class Garret extends Room {
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("crGarretPaper", () => ({ map: paper("crGarretT", "#d8c078", "#a88a4a", true) }));
    const skirt = lam("crSkirt", () => ({ color: "#5a4632" })), ceil = lam("crCeil", () => ({ color: "#c8bca0" }));
    const wood = lam("crWood", () => ({ color: "#6a4a32" })), cloth = lam("crSofa", () => ({ color: "#7a6a5a" }));
    const { x0, x1, z0, z1, h } = GARRET;
    shell(s, GARRET, floor, wall, skirt, ceil);
    // the sloping roof: from 1.45 m over the back wall up to the flat ceiling at z = 0.2
    const slope = new THREE.Mesh(quad(V(x0, 1.45, z0), V(x1, 1.45, z0), V(x1, h, 0.2), V(x0, h, 0.2)), ceil); slope.receiveShadow = true;
    const sl2 = quad(V(x0, h, 0.2), V(x1, h, 0.2), V(x1, 1.45, z0), V(x0, 1.45, z0)); fix.add(sl2, ceil); void slope;
    for (let k = 0; k < 4; k++) { const z = z0 + 0.3 + k * 0.45, y = 1.45 + (h - 1.45) * ((z - z0) / (0.2 - z0)); fix.add(boxGeo(V(x0, y - 0.08, z - 0.06), V(x1, y, z + 0.06)), wood); } // rafters
    // the sofa he sleeps on (lumpy, too short), a pillow, his coat as a blanket
    deco.add(boxGeo(V(-1.2, 0, -1.55), V(1.2, 0.42, -0.95)), cloth);
    deco.add(boxGeo(V(-1.2, 0.42, -1.6), V(1.2, 0.85, -1.4)), cloth);
    deco.add(boxGeo(V(-1.3, 0, -1.55), V(-1.15, 0.62, -0.95)), cloth); deco.add(boxGeo(V(1.15, 0, -1.55), V(1.3, 0.62, -0.95)), cloth);
    deco.add(new THREE.SphereGeometry(0.2, 10, 8).scale(1.3, 0.5, 0.9), lam("crPillow", () => ({ color: "#e8e0cc" })), at(-0.9, 0.5, -1.2));
    // a small table with books and a jug, a chair
    deco.add(boxGeo(V(0.8, 0.7, 0.2), V(1.5, 0.75, 0.9)), wood);
    for (const [x, z] of [[0.85, 0.25], [1.45, 0.25], [0.85, 0.85], [1.45, 0.85]]) deco.add(boxGeo(V(x - 0.025, 0, z - 0.025), V(x + 0.025, 0.7, z + 0.025)), wood);
    for (let k = 0; k < 3; k++) deco.add(boxGeo(V(0.9, 0.75 + k * 0.06, 0.35), V(1.2, 0.81 + k * 0.06, 0.6)), lam(`crBook${k}`, () => ({ color: ["#7a2a2a", "#2a4a6a", "#4a5a2a"][k] })));
    deco.add(cyl(0.07, 0.09, 0.22, 10), lam("crJug", () => ({ color: "#b8b0a0" })), at(1.35, 0.86, 0.6));
    // the one small window in the left wall
    winPane(this.root, V(x0 + 0.02, 1.0, -0.2), V(x0 + 0.02, 1.0, 0.5), V(x0 + 0.02, 1.6, 0.5), V(x0 + 0.02, 1.6, -0.2), new THREE.Color(1.6, 1.55, 1.4));
    fix.add(boxGeo(V(x0, 0.95, -0.25), V(x0 + 0.08, 1.0, 0.55)), wood);
    void z1;
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
}

export class Pawn extends Room {
  door = new THREE.Group();
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("crPawnPaper", () => ({ map: paper("crPawnT", "#e2c860", "#b8963a") }));
    const skirt = lam("crSkirt", () => ({ color: "#5a4632" })), ceil = lam("crCeilP", () => ({ color: "#e0d8c4" }));
    const wood = lam("crWoodP", () => ({ color: "#5a3a24" })), white = lam("crMuslin", () => ({ color: "#f2ece0" }));
    const red = lam("crGeranium", () => ({ color: "#d8303a" })), leaf = lam("crLeaf", () => ({ color: "#3a7a3a" })), gold = lam("crGoldP", () => ({ color: "#d9b04a" }));
    const { x0, x1, z0, h } = PAWN;
    shell(s, PAWN, floor, wall, skirt, ceil);
    // window with muslin curtains and geraniums (back wall, right)
    winPane(this.root, V(0.6, 1.0, z0 + 0.02), V(1.9, 1.0, z0 + 0.02), V(1.9, 2.2, z0 + 0.02), V(0.6, 2.2, z0 + 0.02), new THREE.Color(1.9, 1.7, 1.25));
    for (const x of [0.5, 2.0]) deco.add(boxGeo(V(x - 0.15, 0.95, z0 + 0.02), V(x + 0.15, 2.35, z0 + 0.08)), white);
    deco.add(boxGeo(V(0.5, 0.95, z0), V(2.0, 1.0, z0 + 0.25)), wood);
    for (let k = 0; k < 3; k++) { deco.add(cyl(0.08, 0.06, 0.14, 8), lam("crPot", () => ({ color: "#b8603a" })), at(0.8 + k * 0.45, 1.07, z0 + 0.14)); deco.add(new THREE.SphereGeometry(0.12, 8, 6), leaf, at(0.8 + k * 0.45, 1.22, z0 + 0.14)); deco.add(new THREE.SphereGeometry(0.06, 6, 5), red, at(0.8 + k * 0.45, 1.32, z0 + 0.14)); }
    // the icon corner (back-left) with a gilt frame and a lamp
    fix.add(boxGeo(V(x0 + 0.05, 1.7, z0 + 0.05), V(x0 + 0.65, 2.3, z0 + 0.1)), gold);
    fix.add(boxGeo(V(x0 + 0.12, 1.77, z0 + 0.08), V(x0 + 0.58, 2.23, z0 + 0.12)), lam("crIcon", () => ({ color: "#6a3a2a" })));
    deco.add(cyl(0.05, 0.03, 0.08, 8), lam("crLampGlass", () => ({ color: "#c8303a" })), at(x0 + 0.35, 1.58, z0 + 0.25));
    this.flame(x0 + 0.35, 1.68, z0 + 0.25, 0.05, 0.1, 2.4);
    this.glow(x0 + 0.35, 1.68, z0 + 0.25, 0.7, 0.5);
    // chest of drawers with pledges, a sofa, chairs, a round table
    deco.add(boxGeo(V(-2.4, 0, -2.15), V(-1.2, 1.0, -1.65)), wood);
    for (let k = 0; k < 3; k++) fix.add(boxGeo(V(-2.35, 0.15 + k * 0.3, -1.64), V(-1.25, 0.38 + k * 0.3, -1.62)), lam("crDrawer", () => ({ color: "#6a4630" })));
    for (let k = 0; k < 4; k++) deco.add(new THREE.SphereGeometry(0.06, 8, 6), gold, at(-2.2 + k * 0.28, 1.06, -1.9));
    deco.add(boxGeo(V(-0.4, 0, -2.15), V(0.4, 0.45, -1.7)), lam("crSofaP", () => ({ color: "#8a6a4a" })));
    deco.add(cyl(0.45, 0.45, 0.04, 16), wood, at(-0.8, 0.72, -0.6)); deco.add(cyl(0.05, 0.08, 0.7, 8), wood, at(-0.8, 0.36, -0.6));
    // the door to the hall, right wall, open
    fix.add(boxGeo(V(x1 - 0.02, 0, -0.2), V(x1 + 0.02, 2.15, 0.7)), lam("crHall", () => ({ color: "#2a2228" })));
    // ---- the landing at x = 12: a dark stair wall, her door on its chain, open a crack ----
    const [lx, , lz] = LANDING;
    s.add(boxGeo(V(lx - 3, 0, lz - 0.4), V(lx + 3, h + 0.5, lz)), lam("crStair", () => ({ color: "#6a6458" })));
    s.add(quad(V(lx - 3, 0, lz + 3), V(lx + 3, 0, lz + 3), V(lx + 3, 0, lz), V(lx - 3, 0, lz)), floor);
    fix.add(boxGeo(V(lx - 0.55, 0, lz - 0.02), V(lx + 0.55, 2.15, lz + 0.01)), lam("crGap", () => ({ color: "#140e14" })));
    const db = new Batch(); db.add(boxGeo(V(0, 0, -0.03), V(1.05, 2.1, 0.03)), lam("crDoor", () => ({ color: "#7a4a2e" })));
    db.add(new THREE.SphereGeometry(0.04, 8, 6), gold, at(0.9, 1.05, 0.05));
    db.build(this.door, true); this.door.position.set(lx - 0.55, 0, lz + 0.02); this.root.add(this.door);
    for (let k = 0; k < 5; k++) fix.add(new THREE.TorusGeometry(0.025, 0.007, 4, 8), lam("crChain", () => ({ color: "#b8b8c0" })), at(lx + 0.5 - 0.0 + k * 0.0, 1.35 + 0.0, lz + 0.05 + k * 0.04, 0, k % 2 ? Math.PI / 2 : 0, 0));
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
  /** door 0 shut .. 1 open a crack (on the chain); lamp lit or out */
  pose(door: number, lamp: boolean) { this.door.rotation.y = -0.32 * door; this.setFlames(lamp); }
}

export class Office extends Room {
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("crOfficeWall", () => ({ color: "#a8b4a0" })), skirt = lam("crSkirtO", () => ({ color: "#3a3a34" })), ceil = lam("crCeilO", () => ({ color: "#d8d8cc" }));
    const wood = lam("crDesk", () => ({ color: "#5a3a26" })), green = lam("crBaize", () => ({ color: "#2f5a3a" })), paper2 = lam("crPaper", () => ({ color: "#f2ead6" }));
    const tile = lam("crStove", () => ({ color: "#e8e2d4" })), brass = lam("crBrassO", () => ({ color: "#c9a24a" }));
    const { x0, x1, z0, h } = OFFICE;
    shell(s, OFFICE, floor, wall, skirt, ceil);
    winPane(this.root, V(-2.6, 1.0, z0 + 0.02), V(-1.2, 1.0, z0 + 0.02), V(-1.2, 2.6, z0 + 0.02), V(-2.6, 2.6, z0 + 0.02), new THREE.Color(1.9, 1.85, 1.7));
    for (const x of [-2.65, -1.9, -1.15]) fix.add(boxGeo(V(x - 0.04, 1.0, z0), V(x + 0.04, 2.6, z0 + 0.06)), lam("crFrameW", () => ({ color: "#f2ece0" })));
    // two desks with green baize, ledgers, inkwells; a tall clerk's desk
    for (const [cx, cz] of [[-1.6, -1.2], [1.4, -0.9]]) {
      deco.add(boxGeo(V(cx - 0.8, 0.72, cz - 0.45), V(cx + 0.8, 0.78, cz + 0.45)), wood);
      deco.add(boxGeo(V(cx - 0.75, 0.78, cz - 0.4), V(cx + 0.75, 0.79, cz + 0.4)), green);
      for (const [a, c] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) deco.add(boxGeo(V(cx + a - 0.04, 0, cz + c - 0.04), V(cx + a + 0.04, 0.72, cz + c + 0.04)), wood);
      for (let k = 0; k < 3; k++) deco.add(boxGeo(V(cx - 0.5 + k * 0.1, 0.79 + k * 0.05, cz - 0.2), V(cx - 0.1 + k * 0.1, 0.84 + k * 0.05, cz + 0.15)), lam(`crLedger${k}`, () => ({ color: ["#6a2a2a", "#2a3a5a", "#3a2a1a"][k] })));
      deco.add(boxGeo(V(cx + 0.2, 0.79, cz - 0.1), V(cx + 0.6, 0.8, cz + 0.25)), paper2);
      deco.add(cyl(0.05, 0.05, 0.06, 8), lam("crInk", () => ({ color: "#1a1a22" })), at(cx + 0.55, 0.82, cz - 0.25));
    }
    // a tiled stove in the back-right corner with brass doors
    deco.add(boxGeo(V(x1 - 1.0, 0, z0 + 0.05), V(x1 - 0.1, 2.8, z0 + 0.95)), tile);
    deco.add(boxGeo(V(x1 - 0.75, 0.5, z0 + 0.94), V(x1 - 0.35, 0.85, z0 + 0.97)), brass);
    // an empty gilt frame (no portrait detail), a wall clock, a bench by the wall
    fix.add(boxGeo(V(0.0, 1.6, z0 + 0.02), V(1.2, 2.6, z0 + 0.08)), brass);
    fix.add(boxGeo(V(0.1, 1.7, z0 + 0.05), V(1.1, 2.5, z0 + 0.1)), lam("crCanvas", () => ({ color: "#4a5a4a" })));
    deco.add(boxGeo(V(x0 + 0.05, 0.42, -1.5), V(x0 + 0.55, 0.48, 1.5)), wood);
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    void h;
  }
}

export class SonyaRoom extends Room {
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("crSonyaWall", () => ({ map: paper("crSonyaT", "#b8b0a0", "#8a8070", true) }));
    const ceil = lam("crCeilS", () => ({ color: "#a8a094" }));
    const wood = lam("crWoodS", () => ({ color: "#5a4030" })), sheet = lam("crSheet", () => ({ color: "#d8d0c0" }));
    const h = 2.7;
    s.add(quad(V(-3.2, 0, 2.5), V(3.6, 0, 2.5), V(3.6, 0, -3.4), V(-3.2, 0, -3.4), 3, 3), floor);
    // walls: left straight, right straight, the back wall at a slant meeting the right wall in a sharp corner
    s.add(boxGeo(V(-3.5, 0, -2.2), V(-3.2, h, 2.5), 1.2), wall);
    s.add(boxGeo(V(3.6, 0, -3.4), V(3.9, h, 2.5), 1.2), wall);
    const back = new THREE.BoxGeometry(7.0, h, 0.3); back.translate(0, h / 2, 0);
    s.add(back, wall, new THREE.Matrix4().compose(V(0.2, 0, -2.85), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.17, 0)), V(1, 1, 1)));
    s.add(boxGeo(V(-3.5, h, -3.6), V(3.9, h + 0.2, 2.5), 0, true), ceil);
    // the bed (left), a chest of drawers, two chairs, the table with the candle + a book
    deco.add(boxGeo(V(-3.1, 0, -1.8), V(-2.1, 0.5, 0.3)), wood); deco.add(boxGeo(V(-3.05, 0.5, -1.75), V(-2.15, 0.62, 0.25)), sheet);
    deco.add(boxGeo(V(2.4, 0, -2.6), V(3.5, 1.0, -2.0)), wood);
    const [tx, ty, tz] = SONYA_T;
    deco.add(boxGeo(V(tx - 0.55, ty - 0.04, tz - 0.4), V(tx + 0.55, ty, tz + 0.4)), wood);
    for (const [a, c] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) deco.add(boxGeo(V(tx + a - 0.03, 0, tz + c - 0.03), V(tx + a + 0.03, ty - 0.04, tz + c + 0.03)), wood);
    deco.add(boxGeo(V(tx - 0.35, ty, tz - 0.1), V(tx - 0.05, ty + 0.06, tz + 0.15)), lam("crBible", () => ({ color: "#3a2a22" })));
    deco.add(cyl(0.035, 0.035, 0.18, 8), lam("crCandle", () => ({ color: "#f2ecd8" })), at(tx + 0.25, ty + 0.09, tz));
    deco.add(cyl(0.07, 0.07, 0.02, 10), lam("crHolder", () => ({ color: "#c9a24a" })), at(tx + 0.25, ty + 0.01, tz));
    this.flame(tx + 0.25, ty + 0.24, tz, 0.06, 0.13, 2.6);
    this.glow(tx + 0.25, ty + 0.24, tz, 2.2, 0.45);
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
}
