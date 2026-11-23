// The Sonya confession sets. Floor y = 0; cameras mostly look toward -z. Each set is a Room shown one at a time.
// - SonyaRoom: her big, low, crooked room (IV.4): the right wall runs in at a slant to a sharp corner, yellowish peeling
//   paper, a bed, a chest of drawers with the New Testament, a deal table with a blue cloth and a candle-end, two rush
//   chairs, two windows on the canal at dusk, the entry door and the LOCKED door into the empty room next door.
// - Wall: a plaster wall on the pawnbroker's landing, one lamp (the axe shadow).
// - Bridge: the Nikolaevsky Bridge over the Neva (II.2): railing, the wide river, a low palace front and a gold dome far off.
// - Garret: his cupboard of a room under the roof, the too-short sofa, the door his mother and sister come through.
// - Lodging: his family's rooms at Bakaleyev's (IV.3): a table with a samovar, two chairs, the door he leaves by.
// - Canal: the embankment outside Sonya's house at dusk, her lit window above.
// - Empty: Madame Resslich's empty room next door: bare boards, the locked door with light under it, one chair beside it.
// - Haymarket: the crossroads, grey morning (her words).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, beam, cobbleHD } from "../../engine/paint";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import { shell, holedWall, doorTex, windowUnit, doorUnit, brassK, gold } from "../dorian/rooms";
import { plaster, skyDome, backdrop, ridgeTex } from "../frankenstein/rooms";
import type { V3 } from "./story";

const peel = (key: string, base: string, fig: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = fig; g.lineWidth = 3;
  for (let x = 24; x < 512; x += 64) { g.beginPath(); for (let y = 0; y <= 512; y += 8) g.lineTo(x + 7 * Math.sin(y / 18), y); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = fig; g.beginPath(); g.arc(56 + (i % 8) * 64, 30 + Math.floor(i / 8) * 110, 5, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(110,90,60,${0.18 + 0.2 * r()})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 12 + r() * 40, 8 + r() * 24, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(0,0,0,0.035)"; g.fillRect(r() * 512, r() * 512, 18, 18); }
});
const sky = (key: string, top: string, mid: string, low: string) => ctex(key, 128, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, top); gr.addColorStop(0.6, mid); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#2a2a3a"; for (let i = 0; i < 6; i++) g.fillRect(i * 22, 86 - (i % 3) * 8, 20, 42);
  g.fillStyle = "#f8d898"; for (let i = 0; i < 7; i++) g.fillRect(4 + i * 18, 100 + (i % 2) * 8, 3, 4);
});
/** a window pane picture (unlit) on a wall face at z, then the joinery on top */
const paneOn = (root: THREE.Object3D, b: Batch, x: number, y0: number, w: number, h: number, z: number, tex: THREE.Texture, frame: THREE.Material, rows = 3) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(x, y0 + h / 2, z + 0.005); m.layers.set(NOINK); root.add(m);
  windowUnit(b, x, y0, w, h, z, { frame, cols: 2, rows, sill: frame });
};
/** a hinged door leaf group (pivot at its left edge, opening toward +z) */
const leaf = (w: number, h: number, mat: THREE.Material, knob: THREE.Material) => {
  const g = new THREE.Group(), b = new Batch();
  b.add(boxGeo(V(0, 0, -0.03), V(w, h, 0.02)), mat);
  b.add(new THREE.SphereGeometry(0.045, 10, 8), knob, at(w - 0.12, 1.0, 0.06));
  b.build(g, true);
  return g;
};

// ================= Sonya's room =================
export const SROOM = { x0: -3.2, x1: 3.6, z0: -3.0, z1: 2.6, h: 2.45 };
export const S_BED = { x0: -3.1, x1: -1.3, z0: -2.95, z1: -2.15, top: 0.5 };
export const S_TABLE: V3 = [0.75, 0.74, -1.55];
export const S_CANDLE: V3 = [0.95, 0.74, -1.55];
export const S_CHAIR: V3 = [0.35, 0, -0.92];
export const S_CHEST = { x0: -3.2, x1: -2.72, z0: -1.1, z1: -0.1, top: 1.0 };
export const S_DOOR = { x: -0.75, w: 0.9, h: 2.05 }; // the entry door (Kapernaumov's side)
export const S_LOCKED = { x: 2.55, w: 0.85, h: 2.0 }; // the locked door into the empty room
export const S_WIN = [0.55, 1.5];
export class SonyaRoom extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = SROOM;
    const wall = lam("snWall", () => ({ map: peel("snPaper", "#c8b880", "#a89458") }));
    const floor = lam("snFloor", () => ({ map: planksHD(), color: "#8a7458" }));
    b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), floor);
    b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, z1), 2), wall); // left
    b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), wall); // behind the camera
    b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall); // back (windows + doors are on its face)
    b.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.25, z1 + 0.4), 0, true), lam("snCeil", () => ({ color: "#b8ae98" })));
    // the right wall comes in at a slant: from the back corner (x1, z0) to (1.9, z1): the sharp corner is at the back
    const len = Math.hypot(x1 - 1.9, z1 - z0), ang = Math.atan2(x1 - 1.9, z1 - z0);
    const rw = new THREE.BoxGeometry(0.4, h, len); rw.translate(0.2, h / 2, len / 2);
    b.add(rw, wall, new THREE.Matrix4().compose(V(x1, 0, z0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -ang, 0)), V(1, 1, 1)));
    const skirt = lam("snSkirt", () => ({ color: "#5a4632" }));
    deco.add(boxGeo(V(x0, 0, z0), V(x1, 0.12, z0 + 0.04)), skirt);
    const frame = lam("snFrame", () => ({ color: "#6a5238" }));
    // two windows on the canal (dusk, a white night)
    const dusk = sky("snDusk", "#3a4a7a", "#8a8aa8", "#c8a88a");
    for (const x of S_WIN) paneOn(this.root, deco, x, 0.95, 0.72, 1.05, z0 + 0.04, dusk, frame);
    // the entry door and the locked door, both panelled, brass knobs
    const leafM = lam("snDoorLeaf", () => ({ map: doorTex("snDoorT", "#7a5a3a", "#4a3422") }));
    doorUnit(deco, S_DOOR.x, 0, S_DOOR.w, S_DOOR.h, z0 + 0.04, { frame, leaf: leafM, knob: brassK() });
    doorUnit(deco, S_LOCKED.x, 0, S_LOCKED.w, S_LOCKED.h, z0 + 0.04, { frame, leaf: lam("snDoorLeaf2", () => ({ map: doorTex("snDoorT2", "#6a4e34", "#3e2c1c") })), knob: brassK() });
    // the bed (along the back wall, left): frame, mattress, a grey blanket, pillow
    const wood = lam("snWood", () => ({ map: beam(), color: "#6a4a32" }));
    const { x0: bx0, x1: bx1, z0: bz0, z1: bz1, top } = S_BED;
    deco.add(boxGeo(V(bx0, 0, bz0), V(bx1, top - 0.14, bz1)), wood);
    deco.add(boxGeo(V(bx0 + 0.03, top - 0.14, bz0 + 0.03), V(bx1 - 0.03, top, bz1 - 0.03)), lam("snMatt", () => ({ color: "#8a8478" })));
    deco.add(boxGeo(V(bx0, 0, bz0 - 0.02), V(bx0 + 0.06, 0.95, bz1)), wood);
    deco.add(new THREE.SphereGeometry(0.22, 10, 8).scale(1.1, 0.4, 0.8), lam("snPillow", () => ({ color: "#e0d8c4" })), at(bx0 + 0.32, top + 0.06, (bz0 + bz1) / 2));
    // the chest of drawers on the left wall, the New Testament on it
    const { x0: cx0, x1: cx1, z0: cz0, z1: cz1, top: ct } = S_CHEST;
    deco.add(boxGeo(V(cx0 + 0.02, 0, cz0), V(cx1, ct, cz1)), wood);
    for (let i = 0; i < 3; i++) { deco.add(boxGeo(V(cx1, 0.12 + i * 0.29, cz0 + 0.06), V(cx1 + 0.03, 0.36 + i * 0.29, cz1 - 0.06)), wood); deco.add(new THREE.SphereGeometry(0.025, 8, 6), brassK(), at(cx1 + 0.05, 0.24 + i * 0.29, (cz0 + cz1) / 2)); }
    deco.add(boxGeo(V(cx0 + 0.1, ct, cz0 + 0.3), V(cx0 + 0.36, ct + 0.06, cz0 + 0.66)), lam("snBible", () => ({ color: "#3a2a22" })));
    // the deal table with the blue cloth, the candle-end in a battered candlestick
    const [tx, ty, tz] = S_TABLE;
    deco.add(boxGeo(V(tx - 0.55, ty - 0.04, tz - 0.38), V(tx + 0.55, ty, tz + 0.38)), wood);
    for (const [a, c] of [[-0.5, -0.33], [0.5, -0.33], [-0.5, 0.33], [0.5, 0.33]]) deco.add(boxGeo(V(tx + a - 0.03, 0, tz + c - 0.03), V(tx + a + 0.03, ty - 0.04, tz + c + 0.03)), wood);
    const cloth = lam("snCloth", () => ({ color: "#4a6a9a" }));
    deco.add(boxGeo(V(tx - 0.57, ty, tz - 0.4), V(tx + 0.57, ty + 0.01, tz + 0.4)), cloth);
    deco.add(boxGeo(V(tx - 0.57, ty - 0.26, tz + 0.4), V(tx + 0.57, ty + 0.01, tz + 0.41)), cloth);
    const [kx, ky, kz] = S_CANDLE;
    deco.add(cyl(0.06, 0.07, 0.02, 10), brassK(), at(kx, ky + 0.02, kz)); deco.add(cyl(0.018, 0.02, 0.1, 8), brassK(), at(kx, ky + 0.07, kz));
    deco.add(cyl(0.02, 0.02, 0.07, 8), lam("snWax", () => ({ color: "#f0e6cc" })), at(kx, ky + 0.15, kz));
    this.flame(kx, ky + 0.22, kz, 0.045, 0.09, 3.0); this.glow(kx, ky + 0.22, kz, 1.4, 0.45);
    // two rush-bottomed chairs: one by the table (his), one against the left wall
    const rush = lam("snRush", () => ({ color: "#b89a5a" }));
    const chair = (x: number, z: number, back: 1 | -1) => {
      deco.add(boxGeo(V(x - 0.22, 0.42, z - 0.22), V(x + 0.22, 0.47, z + 0.22)), rush);
      for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]] as const) deco.add(boxGeo(V(x + dx - 0.022, 0, z + dz - 0.022), V(x + dx + 0.022, 0.42, z + dz + 0.022)), wood);
      const bz = z + back * 0.22; deco.add(boxGeo(V(x - 0.22, 0.47, bz - 0.03), V(x + 0.22, 1.0, bz + 0.03)), wood);
    };
    chair(S_CHAIR[0], S_CHAIR[2], -1);
    chair(-2.75, 0.8, -1);
    // an icon shelf? no: a few hooks with a dress, a shawl (the green drap-de-dames)
    deco.add(boxGeo(V(x0, 1.7, 0.2), V(x0 + 0.04, 1.75, 1.4)), wood);
    deco.add(boxGeo(V(x0 + 0.04, 0.9, 0.5), V(x0 + 0.08, 1.7, 0.85)), lam("snShawl", () => ({ color: "#3a7a52" })));
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ================= the landing wall (axe shadow) =================
export const WALL_Z = -1.5;
export const W_LAMP: V3 = [-1.0, 1.9, WALL_Z + 0.12];
export class Wall extends Room {
  constructor() {
    super();
    const b = new Batch();
    const wall = lam("wlWall", () => ({ map: plaster("wlPlaster", "#b8a88a", "#a8987a") }));
    b.add(quad(V(-6, 0, 6), V(6, 0, 6), V(6, 0, WALL_Z), V(-6, 0, WALL_Z), 4, 4), lam("wlFloor", () => ({ map: planksHD(), color: "#6a5a48" })));
    b.add(boxGeo(V(-6, 0, WALL_Z - 0.3), V(6, 4, WALL_Z), 2), wall);
    b.add(boxGeo(V(-6, 0, WALL_Z), V(6, 0.14, WALL_Z + 0.04)), lam("wlSkirt", () => ({ color: "#4a3a2a" })));
    b.add(boxGeo(V(W_LAMP[0] - 0.06, W_LAMP[1] - 0.25, WALL_Z), V(W_LAMP[0] + 0.06, W_LAMP[1] - 0.1, WALL_Z + 0.06)), brassK());
    b.add(cyl(0.05, 0.08, 0.18, 10), lam("wlGlass", () => ({ color: "#f0e0b0", emissive: "#a08040" })), at(W_LAMP[0], W_LAMP[1], W_LAMP[2]));
    this.flame(W_LAMP[0], W_LAMP[1] + 0.02, W_LAMP[2], 0.04, 0.08, 2.6); this.glow(W_LAMP[0], W_LAMP[1], W_LAMP[2], 1.2, 0.4);
    b.build(this.root, false);
  }
}

// ================= the bridge over the Neva =================
export const RAIL_Z = -1.2;
const waterTex = () => ctex("brWater", 256, 256, (g, r) => {
  g.fillStyle = "#5a7088"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.strokeStyle = r() < 0.5 ? "rgba(230,240,250,0.5)" : "rgba(30,50,70,0.35)"; g.lineWidth = 2 + r() * 3; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 40, y + 2 - r() * 4); g.stroke(); }
});
const skyline = () => ctex("brSkyline", 2048, 1024, (g) => {
  g.clearRect(0, 0, 2048, 1024);
  const land = 830, c = "#8a8c98", c2 = "#a6a4a8";
  g.fillStyle = c2; for (let i = 0; i < 18; i++) { const x = i * 120, hh = 40 + ((i * 37) % 50); g.fillRect(x, land - hh, 110, hh); }
  // the low palace front, long, with a row of windows
  g.fillStyle = "#b8a68a"; g.fillRect(260, land - 90, 700, 90); g.fillStyle = "#8a7a62"; for (let x = 280; x < 950; x += 36) g.fillRect(x, land - 70, 14, 26);
  // the cathedral with its gold dome and drum, columns
  g.fillStyle = c; g.fillRect(1150, land - 130, 360, 130); g.fillRect(1250, land - 210, 160, 90);
  for (let x = 1260; x < 1410; x += 20) { g.fillStyle = "#6a6c78"; g.fillRect(x, land - 205, 8, 80); }
  const gr = g.createRadialGradient(1310, land - 280, 10, 1330, land - 250, 120); gr.addColorStop(0, "#fff2b0"); gr.addColorStop(0.5, "#e0b040"); gr.addColorStop(1, "#9a7020");
  g.fillStyle = gr; g.beginPath(); g.ellipse(1330, land - 210, 82, 96, 0, Math.PI, 0); g.fill();
  g.fillStyle = "#e0b040"; g.fillRect(1322, land - 335, 16, 34); g.fillRect(1310, land - 322, 40, 6);
  g.fillStyle = "#3a3c48"; g.fillRect(0, land - 4, 2048, 8);
});
export class Bridge extends Room {
  private water: THREE.Texture;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const deck = lam("brDeck", () => ({ map: planksHD(), color: "#8a8070" }));
    b.add(quad(V(-40, 0, 8), V(40, 0, 8), V(40, 0, RAIL_Z - 0.2), V(-40, 0, RAIL_Z - 0.2), 20, 4), deck);
    b.add(boxGeo(V(-40, -0.6, RAIL_Z - 0.4), V(40, 0, RAIL_Z - 0.2)), lam("brEdge", () => ({ color: "#5a5660" })));
    // the iron railing: posts, two rails, a lattice of bars
    const iron = lam("brIron", () => ({ color: "#2a2c34" }));
    deco.add(boxGeo(V(-40, 1.02, RAIL_Z - 0.05), V(40, 1.1, RAIL_Z + 0.05)), iron);
    deco.add(boxGeo(V(-40, 0.12, RAIL_Z - 0.03), V(40, 0.17, RAIL_Z + 0.03)), iron);
    for (let x = -20; x <= 20; x += 2.4) deco.add(boxGeo(V(x - 0.06, 0, RAIL_Z - 0.06), V(x + 0.06, 1.18, RAIL_Z + 0.06)), iron);
    for (let x = -20; x <= 20; x += 0.24) deco.add(boxGeo(V(x - 0.012, 0.17, RAIL_Z - 0.012), V(x + 0.012, 1.02, RAIL_Z + 0.012)), iron);
    // lamp posts
    for (const x of [-4.8, 4.8]) { deco.add(cyl(0.05, 0.07, 3.2, 8), iron, at(x, 1.6, RAIL_Z)); deco.add(boxGeo(V(x - 0.12, 3.2, RAIL_Z - 0.12), V(x + 0.12, 3.5, RAIL_Z + 0.12)), lam("brLampG", () => ({ color: "#d8d0b8" }))); }
    // the river
    this.water = waterTex(); this.water.repeat.set(40, 30);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), lam("brWaterM", () => ({ map: this.water })));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -3.5, RAIL_Z - 150); this.root.add(water);
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "brSky", [[0, "#6a7a98"], [0.35, "#a8b2c4"], [0.5, "#d8dce2"], [1, "#d8dce2"]]);
    backdrop(this.root, skyline(), 300, 150, -170);
  }
  pose(t: number) { this.water.offset.x = -t * 0.02; this.water.offset.y = -t * 0.01; }
}

// ================= his garret =================
export const GARRET = { x0: -1.7, x1: 1.7, z0: -1.8, z1: 2.4, h: 2.5 };
export const G_DOOR = { x: 0.85, w: 0.85, h: 1.95 };
export class Garret extends Room {
  private door: THREE.Group;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = GARRET;
    const wall = lam("grWall", () => ({ map: peel("grPaper", "#c8b070", "#9a8248") }));
    shell(b, x0, x1, z0, z1, h, wall, lam("grFloor", () => ({ map: planksHD(), color: "#7a6448" })), lam("grCeil", () => ({ color: "#a8a090" })), false);
    holedWall(b, x0, x1, z0, h, G_DOOR.x - G_DOOR.w / 2, G_DOOR.x + G_DOOR.w / 2, 0, G_DOOR.h, wall);
    const frame = lam("grFrame", () => ({ color: "#5a4430" }));
    doorUnit(deco, G_DOOR.x, 0, G_DOOR.w, G_DOOR.h, z0, { frame, knob: brassK() });
    // the landing beyond the door: lit
    const land = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ color: "#c8a870" }));
    land.position.set(G_DOOR.x, 1.2, z0 - 1.0); land.layers.set(NOINK); this.root.add(land);
    this.door = leaf(G_DOOR.w, G_DOOR.h, lam("grLeaf", () => ({ map: doorTex("grLeafT", "#6a4a30", "#3e2a1c") })), brassK());
    this.door.position.set(G_DOOR.x - G_DOOR.w / 2, 0, z0 + 0.02); this.root.add(this.door);
    // the sloping roof over the left side, rafters
    const ceil = lam("grSlope", () => ({ color: "#9a9282", side: THREE.DoubleSide }));
    const sl = new THREE.Mesh(quad(V(x0, 1.35, z0), V(x0, 1.35, z1), V(-0.2, h, z1), V(-0.2, h, z0)), ceil); this.root.add(sl);
    // (no rafters: they crossed the faces in the two-shot)
    // the little window high on the right wall: a skylight square of grey
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshBasicMaterial({ color: "#b8c0cc" })); win.position.set(x1 - 0.01, 1.75, -0.6); win.rotation.y = -Math.PI / 2; win.layers.set(NOINK); this.root.add(win);
    for (const [a, c] of [[V(x1 - 0.06, 1.47, -0.95), V(x1, 2.03, -0.89)], [V(x1 - 0.06, 1.47, -0.31), V(x1, 2.03, -0.25)], [V(x1 - 0.06, 1.47, -0.95), V(x1, 1.53, -0.25)], [V(x1 - 0.06, 1.97, -0.95), V(x1, 2.03, -0.25)], [V(x1 - 0.05, 1.73, -0.95), V(x1, 1.77, -0.25)]]) deco.add(boxGeo(a, c), frame);
    // the too-short sofa on the left (under the slope), his coat as a blanket, a table with books
    const sofa = lam("grSofa", () => ({ color: "#7a6a5a" }));
    deco.add(boxGeo(V(x0 + 0.02, 0, -1.3), V(x0 + 0.62, 0.42, 1.0)), sofa);
    deco.add(boxGeo(V(x0 + 0.02, 0.42, -1.3), V(x0 + 0.22, 0.8, 1.0)), sofa);
    deco.add(boxGeo(V(x0 + 0.25, 0.42, -0.2), V(x0 + 0.6, 0.47, 0.8)), lam("grCoat", () => ({ color: "#4a4452" })));
    deco.add(boxGeo(V(x1 - 0.7, 0.7, -1.7), V(x1 - 0.1, 0.74, -1.25)), lam("grTable", () => ({ color: "#5a4430" })));
    for (const [x, z] of [[x1 - 0.66, -1.66], [x1 - 0.14, -1.66], [x1 - 0.66, -1.29], [x1 - 0.14, -1.29]] as const) deco.add(boxGeo(V(x - 0.02, 0, z - 0.02), V(x + 0.02, 0.7, z + 0.02)), lam("grTable", () => ({ color: "#5a4430" })));
    for (let i = 0; i < 3; i++) deco.add(boxGeo(V(x1 - 0.6 + i * 0.12, 0.74, -1.6), V(x1 - 0.5 + i * 0.12, 0.8 + i * 0.03, -1.35)), lam(`grBook${i}`, () => ({ color: ["#6a2a2a", "#2a3a5a", "#5a5a3a"][i] })));
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** door 0 shut .. 1 open into the room */
  pose(open: number) { this.door.rotation.y = open * 1.6; } // swings out onto the landing
}

// ================= his family's lodging =================
export const LODGE = { x0: -2.4, x1: 2.4, z0: -2.6, z1: 3.0, h: 2.9 };
export const L_DOOR = { x: -1.45, w: 0.9, h: 2.1 };
export const L_TABLE = { x0: 0.25, x1: 1.75, z0: -2.15, z1: -1.4, top: 0.74 };
export class Lodging extends Room {
  private door: THREE.Group;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = LODGE;
    const wall = lam("lgWall", () => ({ map: peel("lgPaper", "#a8b098", "#88907a") }));
    shell(b, x0, x1, z0, z1, h, wall, lam("lgFloor", () => ({ map: planksHD(), color: "#8a7258" })), lam("lgCeil", () => ({ color: "#c8c0b0" })), false);
    holedWall(b, x0, x1, z0, h, L_DOOR.x - L_DOOR.w / 2, L_DOOR.x + L_DOOR.w / 2, 0, L_DOOR.h, wall);
    const frame = lam("lgFrame", () => ({ color: "#5a4430" }));
    doorUnit(deco, L_DOOR.x, 0, L_DOOR.w, L_DOOR.h, z0, { frame, knob: brassK(), transom: lam("lgTransom", () => ({ color: "#3a3428" })) });
    const corr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: "#2a2420" })); corr.position.set(L_DOOR.x, 1.3, z0 - 1.2); corr.layers.set(NOINK); this.root.add(corr);
    this.door = leaf(L_DOOR.w, L_DOOR.h, lam("lgLeaf", () => ({ map: doorTex("lgLeafT", "#7a5a3a", "#4a3422") })), brassK());
    this.door.position.set(L_DOOR.x - L_DOOR.w / 2, 0, z0 + 0.02); this.root.add(this.door);
    // a window on the back wall right (morning)
    paneOn(this.root, deco, 1.0, 1.15, 0.9, 1.2, z0, sky("lgMorning", "#9ab0cc", "#d8dce0", "#e8dcc8"), frame);
    // the table with a white cloth, the samovar, two chairs behind it
    const oak = lam("lgOak", () => ({ map: beam(), color: "#6a4a30" }));
    const { x0: t0, x1: t1, z0: tz0, z1: tz1, top } = L_TABLE;
    deco.add(boxGeo(V(t0, top - 0.05, tz0), V(t1, top, tz1)), oak);
    deco.add(boxGeo(V(t0 - 0.02, top, tz0 - 0.02), V(t1 + 0.02, top + 0.01, tz1 + 0.02)), lam("lgCloth", () => ({ color: "#e8e0cc" })));
    deco.add(boxGeo(V(t0 - 0.02, top - 0.3, tz1 + 0.02), V(t1 + 0.02, top, tz1 + 0.03)), lam("lgCloth", () => ({ color: "#e8e0cc" })));
    for (const [x, z] of [[t0 + 0.06, tz0 + 0.06], [t1 - 0.06, tz0 + 0.06], [t0 + 0.06, tz1 - 0.06], [t1 - 0.06, tz1 - 0.06]] as const) deco.add(boxGeo(V(x - 0.035, 0, z - 0.035), V(x + 0.035, top - 0.05, z + 0.035)), oak);
    const brass = brassK(), sx = t1 - 0.25, sz = (tz0 + tz1) / 2;
    deco.add(cyl(0.1, 0.13, 0.24, 14), brass, at(sx, top + 0.14, sz)); deco.add(cyl(0.035, 0.07, 0.09, 12), brass, at(sx, top + 0.31, sz));
    const cw = lam("lgChair", () => ({ color: "#3a2416" }));
    for (const cx of [0.6, 1.4]) {
      const cz = -2.35;
      deco.add(boxGeo(V(cx - 0.24, 0.6, cz - 0.22), V(cx + 0.24, 0.66, cz + 0.2)), cw);
      for (const [dx, dz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.16], [0.2, 0.16]] as const) deco.add(boxGeo(V(cx + dx - 0.025, 0, cz + dz - 0.025), V(cx + dx + 0.025, 0.6, cz + dz + 0.025)), cw);
      deco.add(boxGeo(V(cx - 0.24, 0.66, cz - 0.24), V(cx + 0.24, 1.15, cz - 0.19)), cw);
    }
    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(open: number) { this.door.rotation.y = -open * 1.5; }
}

// ================= the canal embankment at dusk =================
export const S_WINDOW: V3 = [-2.2, 4.4, -6.0]; // Sonya's lit window on the house wall (left)
export class Canal extends Room {
  private water: THREE.Texture;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const cob = cobbleHD(); cob.repeat.set(4, 20);
    b.add(quad(V(-2.4, 0, 10), V(1.6, 0, 10), V(1.6, 0, -60), V(-2.4, 0, -60), 1, 1), lam("cnCob", () => ({ map: cob, color: "#9a9088" })));
    // the granite parapet on the canal side (right)
    const granite = lam("cnGranite", () => ({ color: "#7a7078" }));
    deco.add(boxGeo(V(1.6, 0, -60), V(1.95, 0.85, 10)), granite);
    // the house front along the left: tall, ochre, rows of windows, Sonya's lit on the second floor
    const wall = lam("cnHouse", () => ({ map: plaster("cnHouseT", "#c8a868", "#b89858") }));
    b.add(boxGeo(V(-3.2, 0, -60), V(-2.4, 14, 10), 4), wall);
    const frame = lam("cnFrame", () => ({ color: "#e8e0d0" })), darkG = lam("cnDarkG", () => ({ color: "#2a2e44" }));
    for (let z = -50; z < 6; z += 2.2) for (const y of [1.6, 4.0, 6.4, 8.8]) {
      const lit = Math.abs(z - S_WINDOW[2]) < 0.6 && y === 4.0;
      const g = lit ? null : darkG;
      // windows on a wall facing +x: built directly
      if (g) deco.add(boxGeo(V(-2.42, y, z - 0.45), V(-2.38, y + 1.3, z + 0.45)), g);
      deco.add(boxGeo(V(-2.4, y - 0.08, z - 0.58), V(-2.26, y, z + 0.58)), frame);
      deco.add(boxGeo(V(-2.4, y + 1.3, z - 0.55), V(-2.3, y + 1.4, z + 0.55)), frame);
      deco.add(boxGeo(V(-2.4, y, z - 0.03), V(-2.34, y + 1.3, z + 0.03)), frame);
    }
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.15, 0.55) }));
    lit.position.set(-2.39, S_WINDOW[1] + 0.65 - 0.4, S_WINDOW[2]); lit.rotation.y = Math.PI / 2; lit.layers.set(NOINK); this.root.add(lit);
    this.glow(-2.2, S_WINDOW[1] + 0.25, S_WINDOW[2], 2.4, 0.5);
    // lamp posts along the parapet
    const iron = lam("cnIron", () => ({ color: "#222230" }));
    for (let z = -40; z < 4; z += 9) { deco.add(cyl(0.05, 0.07, 3.4, 8), iron, at(1.75, 2.55, z)); deco.add(boxGeo(V(1.62, 4.2, z - 0.13), V(1.88, 4.5, z + 0.13)), lam("cnLampG", () => ({ color: "#f0d890", emissive: "#a07a30" }))); this.glow(1.75, 4.35, z, 1.2, 0.5); }
    // the canal water + the far bank houses
    this.water = waterTex(); this.water.repeat.set(4, 40);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 100), lam("cnWaterM", () => ({ map: this.water, color: "#6a7898" })));
    water.rotation.x = -Math.PI / 2; water.position.set(9, -1.6, -25); this.root.add(water);
    b.add(boxGeo(V(16, -1.6, -60), V(18, 12, 10), 4), lam("cnFar", () => ({ map: plaster("cnFarT", "#9a8a9a", "#8a7a8a") })));
    for (let z = -50; z < 6; z += 2.6) for (const y of [1.5, 4.5, 7.5]) deco.add(boxGeo(V(15.96, y, z - 0.5), V(16, y + 1.3, z + 0.5)), (z * 7 + y) % 3 < 0.8 ? lam("cnLitW", () => ({ color: "#f0c870", emissive: "#906020" })) : darkG);
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "cnSky", [[0, "#1e2a5a"], [0.35, "#5a5a8a"], [0.5, "#b8909a"], [1, "#b8909a"]]);
  }
  pose(t: number) { this.water.offset.y = -t * 0.01; }
}

// ================= the empty room next door =================
export const EMPTY = { x0: -2.0, x1: 2.0, z0: -2.4, z1: 2.8, h: 2.45 };
export const E_DOOR = { x: -0.55, w: 0.85, h: 2.0 };
export const E_CHAIR: V3 = [0.4, 0, -1.95];
export class Empty extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = EMPTY;
    const wall = lam("emWall", () => ({ map: peel("emPaper", "#9a9480", "#7a7460") }));
    shell(b, x0, x1, z0, z1, h, wall, lam("emFloor", () => ({ map: planksHD(), color: "#6a5a48" })), lam("emCeil", () => ({ color: "#8a8478" })));
    const frame = lam("emFrame", () => ({ color: "#5a4430" }));
    doorUnit(deco, E_DOOR.x, 0, E_DOOR.w, E_DOOR.h, z0, { frame, leaf: lam("emLeaf", () => ({ map: doorTex("emLeafT", "#5a4430", "#3a2a1a") })), knob: brassK() });
    // candlelight from Sonya's side: a bright line under the door and at the keyhole
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(E_DOOR.w - 0.06, 0.025), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.8) }));
    crack.position.set(E_DOOR.x, 0.013, z0 + 0.05); crack.layers.set(NOINK); this.root.add(crack);
    const key = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.8) }));
    key.position.set(E_DOOR.x + E_DOOR.w / 2 - 0.12, 0.92, z0 + 0.06); key.layers.set(NOINK); this.root.add(key);
    this.glow(E_DOOR.x, 0.05, z0 + 0.2, 0.9, 0.35);
    // one straight chair beside the door
    const wood = lam("emWood", () => ({ color: "#4a3426" }));
    const [cx, , cz] = E_CHAIR;
    deco.add(boxGeo(V(cx - 0.22, 0.44, cz - 0.22), V(cx + 0.22, 0.49, cz + 0.22)), wood);
    for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]] as const) deco.add(boxGeo(V(cx + dx - 0.022, 0, cz + dz - 0.022), V(cx + dx + 0.022, 0.44, cz + dz + 0.022)), wood);
    deco.add(boxGeo(V(cx - 0.22, 0.49, cz - 0.25), V(cx + 0.22, 1.02, cz - 0.19)), wood);
    // a shuttered window on the right side of the back wall (night)
    paneOn(this.root, deco, 1.3, 1.0, 0.7, 1.0, z0, sky("emNight", "#0e1430", "#1e2448", "#2a2a44"), frame);
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ================= the Haymarket crossroads =================
export const KNEEL: V3 = [0.2, 0, -10];
export class Haymarket extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const cob = cobbleHD(); cob.repeat.set(30, 30);
    b.add(quad(V(-60, 0, 30), V(60, 0, 30), V(60, 0, -80), V(-60, 0, -80), 1, 1), lam("hmCob", () => ({ map: cob, color: "#a8a098" })));
    const cols = ["#c8b088", "#b89878", "#a8a8a0", "#c8a898"];
    const dark = lam("hmWin", () => ({ color: "#2e3040" }));
    // four blocks: the crossroads opens between them
    for (const [x0, x1, z0, z1, k] of [[-30, -4, -60, -14, 0], [4, 30, -60, -14, 1], [-30, -4, -6, 20, 2], [4, 30, -6, 20, 3]] as const) {
      const m = lam(`hmHouse${k}`, () => ({ map: plaster(`hmHouseT${k}`, cols[k], cols[(k + 1) % 4]) }));
      b.add(boxGeo(V(x0, 0, z0), V(x1, 11 + k, z1), 4), m);
      deco.add(boxGeo(V(x0 - 0.3, 11 + k, z0 - 0.3), V(x1 + 0.3, 11.4 + k, z1 + 0.3)), lam("hmCornice", () => ({ color: "#e8e0d0" })));
      // windows on the faces toward the crossroads
      const faceX = x0 < 0 ? x1 : x0, sx = x0 < 0 ? 1 : -1;
      for (let z = z0 + 1.5; z < z1 - 1; z += 2.4) for (const y of [1.8, 4.6, 7.4]) deco.add(boxGeo(V(faceX + (sx > 0 ? 0 : -0.04), y, z - 0.45), V(faceX + (sx > 0 ? 0.04 : 0), y + 1.4, z + 0.45)), dark);
      const faceZ = z0 < -10 ? z1 : z0, sz = z0 < -10 ? 1 : -1;
      for (let x = x0 + 1.5; x < x1 - 1; x += 2.4) for (const y of [1.8, 4.6, 7.4]) deco.add(boxGeo(V(x - 0.45, y, faceZ + (sz > 0 ? 0 : -0.04)), V(x + 0.45, y + 1.4, faceZ + (sz > 0 ? 0.04 : 0))), dark);
    }
    // market stalls with canvas roofs, carts
    const canvas = lam("hmCanvas", () => ({ color: "#d8ccb0", side: THREE.DoubleSide })), wood = lam("hmWood", () => ({ color: "#6a4a32" }));
    for (const [x, z] of [[-3, -16], [2.6, -17], [-2.8, -4.5]] as const) {
      deco.add(boxGeo(V(x - 0.9, 0, z - 0.5), V(x + 0.9, 0.8, z + 0.5)), wood);
      for (const dx of [-0.85, 0.85]) deco.add(boxGeo(V(x + dx - 0.04, 0, z - 0.04), V(x + dx + 0.04, 2.0, z + 0.04)), wood);
      deco.add(boxGeo(V(x - 1.05, 2.0, z - 0.7), V(x + 1.05, 2.06, z + 0.7)), canvas);
    }
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "hmSky", [[0, "#7a8090"], [0.4, "#b0b4bc"], [0.5, "#d0d0d0"], [1, "#d0d0d0"]]);
    backdrop(this.root, ridgeTex("hmRoofs", [[760, 50, 30, "#8a8890", null]], null), 260, 130, -75);
  }
}
void gold; void V;
