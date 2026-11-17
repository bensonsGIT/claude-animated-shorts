// The Trial's sets. Floor y = 0 everywhere; cameras mostly look toward -z. Every set is a Room shown one at a time.
// - Bedroom: K.'s room at Frau Grubach's (bed under the window, the warders' breakfast table, a door in the back wall,
//   the house across the street with the nosy neighbours' window). Also the night of ch. 10 and the loop.
// - Hearing: the low, packed room up five flights of a slum tenement: a gallery under the ceiling, the magistrate's podium.
// - Junk: the junk room off a bank corridor: shelves of old forms, a candle; a door that opens and slams.
// - Sick: Huld's sickroom: bed, bedside table with a candle, a visitor's chair.
// - Studio: Titorelli's tiny attic: narrow bed, the small door above it onto the court offices, an easel.
// - Cathedral: dark nave, pews, a small pulpit on a pillar.
// - LawDoor: the parable: a glowing doorway in the dark, two stools, a door leaf that swings shut.
// - Quarry: moonlit quarry, a stone block, a lone house up on the rim with one lit window.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";

const shell = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material | null, tile = 2, back = true) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / tile, (z1 - z0) / tile), floor);
  b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, z1), 2), wall);
  b.add(boxGeo(V(x1, 0, z0), V(x1 + 0.4, h, z1), 2), wall);
  b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), wall);
  if (back) b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
  if (ceil) b.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.3, z1 + 0.4), 0, true), ceil);
};
/** back wall at z with rectangular holes [x0, x1, y0, y1] (doors, windows) */
const wallHoles = (b: Batch, x0: number, x1: number, z: number, h: number, holes: [number, number, number, number][], mat: THREE.Material) => {
  const xs = [x0 - 0.4, ...holes.flatMap((o) => [o[0], o[1]]), x1 + 0.4];
  for (let i = 0; i < xs.length; i += 2) if (xs[i + 1] > xs[i]) b.add(boxGeo(V(xs[i], 0, z - 0.4), V(xs[i + 1], h, z), 2), mat);
  for (const [a, c, y0, y1] of holes) {
    if (y0 > 0) b.add(boxGeo(V(a, 0, z - 0.4), V(c, y0, z), 2), mat);
    b.add(boxGeo(V(a, y1, z - 0.4), V(c, h, z), 2), mat);
  }
};
const chair = (b: Batch, x: number, z: number, seat: THREE.Material, frame: THREE.Material, backZ = -1) => {
  b.add(boxGeo(V(x - 0.22, 0.42, z - 0.22), V(x + 0.22, 0.47, z + 0.22)), seat);
  for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) b.add(boxGeo(V(x + dx - 0.02, 0, z + dz - 0.02), V(x + dx + 0.02, 0.42, z + dz + 0.02)), frame);
  const bz = z + backZ * 0.22;
  b.add(boxGeo(V(x - 0.22, 0.47, Math.min(bz, bz - backZ * 0.04)), V(x + 0.22, 0.98, Math.max(bz, bz - backZ * 0.04))), frame);
};
const hdr = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), fog: false });

// ---------------- K.'s room ----------------
export const BED_ROOM = { x0: -2.8, x1: 2.8, z0: -3.4, z1: 4.4, h: 3.1 };
export const KBED = { x0: -1.5, x1: 0.4, z0: -3.35, z1: -2.45, top: 0.55 };
export const KTABLE = { x0: 0.95, x1: 2.05, z0: -2.6, z1: -1.8, top: 0.76 };
/** a sitter's card z -> the chair centre behind it (card 0.1 m in front of the seat's front face) */
const seatZ = (cardZ: number) => cardZ - 0.32;
export const KDOOR = { x0: -2.55, x1: -1.7, y1: 2.15 };
export class Bedroom extends Room {
  private door = new THREE.Group();
  private breakfast = new THREE.Group();
  private outside = new THREE.Group();
  private nightOnly = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), bf = new Batch(), out = new Batch();
    const { x0, x1, z0, z1, h } = BED_ROOM;
    const wall = lam("kbWall", () => ({ color: "#d8c8a4" })), floor = lam("kbFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("kbCeil", () => ({ color: "#e8dcc4" })), 2, false);
    // back wall: the door (left) and the window above the bed
    wallHoles(b, x0, x1, z0, h, [[KDOOR.x0, KDOOR.x1, 0, KDOOR.y1], [-1.05, 0.15, 1.3, 2.5]], wall);
    const wood = lam("kbWood", () => ({ color: "#6a4028" })), dark = lam("kbDark", () => ({ color: "#3a2418" }));
    // window frame + cross bars
    for (const [a, c] of [[-1.05, -1.0], [0.1, 0.15]] as const) deco.add(boxGeo(V(a, 1.3, z0 - 0.1), V(c, 2.5, z0 + 0.04)), lam("kbFrame", () => ({ color: "#f0ead8" })));
    deco.add(boxGeo(V(-1.1, 1.25, z0 - 0.1), V(0.2, 1.3, z0 + 0.1)), lam("kbFrame", () => ({ color: "#f0ead8" })));
    // door frame + the door leaf (hinged on its left edge, swings into the room)
    deco.add(boxGeo(V(KDOOR.x0 - 0.08, 0, z0 - 0.02), V(KDOOR.x0, KDOOR.y1 + 0.08, z0 + 0.06)), dark);
    deco.add(boxGeo(V(KDOOR.x1, 0, z0 - 0.02), V(KDOOR.x1 + 0.08, KDOOR.y1 + 0.08, z0 + 0.06)), dark);
    deco.add(boxGeo(V(KDOOR.x0 - 0.08, KDOOR.y1, z0 - 0.02), V(KDOOR.x1 + 0.08, KDOOR.y1 + 0.08, z0 + 0.06)), dark);
    const leaf = new Batch();
    leaf.add(boxGeo(V(0, 0, -0.04), V(KDOOR.x1 - KDOOR.x0, KDOOR.y1, 0.0)), wood);
    leaf.add(boxGeo(V(0.1, 0.25, 0.0), V(KDOOR.x1 - KDOOR.x0 - 0.1, 0.95, 0.015)), dark);
    leaf.add(boxGeo(V(0.1, 1.15, 0.0), V(KDOOR.x1 - KDOOR.x0 - 0.1, 2.0, 0.015)), dark);
    leaf.build(this.door, true); this.door.position.set(KDOOR.x0, 0, z0 - 0.02); this.root.add(this.door);
    // the dark landing beyond the door
    b.add(quad(V(KDOOR.x0 - 0.5, 0, z0 - 0.4), V(KDOOR.x1 + 0.5, 0, z0 - 0.4), V(KDOOR.x1 + 0.5, 0, z0 - 3), V(KDOOR.x0 - 0.5, 0, z0 - 3)), floor);
    b.add(boxGeo(V(KDOOR.x0 - 0.9, 0, z0 - 3.4), V(KDOOR.x1 + 0.9, h, z0 - 3)), lam("kbHall", () => ({ color: "#6a5a48" })));
    // the bed (head against the back wall, under the window): iron frame, white sheets, a pillow
    const { x0: bx0, x1: bx1, z0: bz0, z1: bz1, top } = KBED;
    const sheet = lam("kbSheet", () => ({ color: "#f2efe6" })), iron = lam("kbIron", () => ({ color: "#2a2a30" }));
    deco.add(boxGeo(V(bx0, 0.3, bz0), V(bx1, top, bz1)), sheet);
    deco.add(boxGeo(V(bx0 + 0.1, top, bz0 + 0.08), V(bx0 + 0.55, top + 0.14, bz1 - 0.08)), lam("kbPillow", () => ({ color: "#fbf8f0" })));
    deco.add(boxGeo(V(bx0 + 0.6, top - 0.02, bz0), V(bx1, top + 0.06, bz1 + 0.02)), lam("kbQuilt", () => ({ color: "#b8584a" })));
    for (const x of [bx0, bx1 - 0.05]) for (const z of [bz0, bz1 - 0.05]) deco.add(boxGeo(V(x, 0, z), V(x + 0.05, 0.32, z + 0.05)), iron);
    deco.add(boxGeo(V(bx0 - 0.05, 0, bz0), V(bx0, 1.05, bz1)), iron);
    // the warders' breakfast table by the right wall, two chairs behind it (they sit facing the room)
    const { x0: tx0, x1: tx1, z0: tz0, z1: tz1, top: tt } = KTABLE;
    deco.add(boxGeo(V(tx0, tt - 0.05, tz0), V(tx1, tt, tz1)), lam("kbTable", () => ({ color: "#8a5a36" })));
    for (const x of [tx0 + 0.05, tx1 - 0.1]) for (const z of [tz0 + 0.05, tz1 - 0.1]) deco.add(boxGeo(V(x, 0, z), V(x + 0.05, tt - 0.05, z + 0.05)), wood);
    deco.add(boxGeo(V(tx0, tt - 0.25, tz1 - 0.01), V(tx1, tt, tz1 + 0.01)), lam("kbCloth", () => ({ color: "#f4f0e4" })));
    const seat = lam("kbSeat", () => ({ color: "#7a4a2e" }));
    for (const x of KSEATS) chair(deco, x, seatZ(tz0 - 0.12), seat, wood, -1);
    // a chair by the door (the night of ch. 10; only set out that night)
    const nc = new Batch();
    chair(nc, NIGHT_CHAIR[0], seatZ(NIGHT_CHAIR[2]), seat, wood, -1);
    nc.build(this.nightOnly, true); this.root.add(this.nightOnly);
    // breakfast: bread, honey pot, coffee pot, cups (hidden after the warders finish? kept: crumbs are the gag)
    bf.add(new THREE.SphereGeometry(0.11, 12, 8), lam("kbBread", () => ({ color: "#d09850" })), at(tx0 + 0.3, tt + 0.06, tz0 + 0.45, 0, 0, 0, 1));
    bf.add(cyl(0.06, 0.07, 0.13, 12), lam("kbHoney", () => ({ color: "#e0a830" })), at(tx0 + 0.6, tt + 0.065, tz0 + 0.35));
    bf.add(cyl(0.06, 0.08, 0.24, 12), lam("kbPot", () => ({ color: "#f4f0e8" })), at(tx1 - 0.25, tt + 0.12, tz0 + 0.4));
    bf.build(this.breakfast, true); this.root.add(this.breakfast);
    // wardrobe on the right of the window
    deco.add(boxGeo(V(0.45, 0, z0 + 0.02), V(0.9, 2.1, z0 + 0.55)), wood);
    b.build(this.root, false); deco.build(this.root, true);
    // across the street: the facade of the house opposite with the neighbours' window (a hole the cards look out of)
    const facade = lam("kbFacade", () => ({ map: stoneHD("kbFacade", ["#c8b494", "#c0ac8a", "#ccba9a", "#b8a482"], "#8a7a62") }));
    const fz = -9.5, wx0 = -1.15, wx1 = 0.35, wy0 = 1.0, wy1 = 2.6;
    for (const [a, c, y0, y1] of [[-8, wx0, -2, 9], [wx1, 8, -2, 9], [wx0, wx1, -2, wy0], [wx0, wx1, wy1, 9]] as const) out.add(boxGeo(V(a, y0, fz - 0.3), V(c, y1, fz)), facade);
    out.add(boxGeo(V(wx0 - 0.1, wy0 - 0.08, fz), V(wx1 + 0.1, wy0, fz + 0.18)), lam("kbSill", () => ({ color: "#e8dcc4" })));
    out.add(boxGeo(V(-8, -2, fz - 4), V(8, 9, fz - 3.6)), lam("kbInside", () => ({ color: "#3a2e2a" })));
    out.add(quad(V(wx0 - 0.5, 0.2, fz), V(wx1 + 0.5, 0.2, fz), V(wx1 + 0.5, 0.2, fz - 3.6), V(wx0 - 0.5, 0.2, fz - 3.6)), lam("kbInsideF", () => ({ color: "#4a3a30" })));
    out.build(this.outside, true); this.root.add(this.outside);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: "#a8c0d8", fog: false }));
    sky.position.set(0, 10, fz - 6); sky.layers.set(NOINK); this.outside.add(sky); this.sky = sky.material as THREE.MeshBasicMaterial;
  }
  private sky: THREE.MeshBasicMaterial;
  /** door 0 shut .. 1 wide open; night = the dark of ch. 10 (sky + breakfast off) */
  pose(door: number, night: boolean, breakfast: boolean) {
    this.door.rotation.y = -1.6 * door;
    this.sky.color.set(night ? "#141a30" : "#a8c0d8");
    this.breakfast.visible = breakfast;
    this.nightOnly.visible = night;
  }
}
export const KSEATS = [1.2, 1.8];
export const NIGHT_CHAIR: [number, number, number] = [-0.3, 0, -1.5];

// ---------------- the hearing room ----------------
export const HEAR = { x0: -3.6, x1: 3.6, z0: -6, z1: 3.4, h: 3.0, gallery: 1.85 };
export const PODIUM = { x0: 0.5, x1: 2.5, z0: -4.45, z1: -3.0, top: 0.4 };
export class Hearing extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h, gallery } = HEAR;
    const wall = lam("hrWall", () => ({ map: stoneHD("hrWall", ["#b8a888", "#b0a080", "#c0b090", "#a89878"], "#7a6a52") }));
    const floor = lam("hrFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("hrCeil", () => ({ color: "#8a7a62" })));
    // the gallery along the back wall, just under the ceiling, on posts
    const wood = lam("hrWood", () => ({ color: "#5a3a24" })), dark = lam("hrDark", () => ({ color: "#3a2618" }));
    deco.add(boxGeo(V(x0, gallery - 0.12, z0), V(x1, gallery, z0 + 1.5)), wood);
    deco.add(boxGeo(V(x0, gallery, z0 + 1.45), V(x1, gallery + 0.75, z0 + 1.52)), dark);
    for (let x = x0 + 0.6; x < x1; x += 1.4) deco.add(boxGeo(V(x - 0.06, 0, z0 + 1.4), V(x + 0.06, gallery, z0 + 1.52)), dark);
    // the podium with the magistrate's little table and chair
    const { x0: px0, x1: px1, z0: pz0, z1: pz1, top } = PODIUM;
    deco.add(boxGeo(V(px0, 0, pz0), V(px1, top, pz1)), wood);
    deco.add(boxGeo(V(px0 + 0.55, top + 0.72, -3.85), V(px1 - 0.55, top + 0.77, -3.35)), lam("hrTable", () => ({ color: "#7a5030" })));
    for (const x of [px0 + 0.6, px1 - 0.65]) deco.add(boxGeo(V(x, top, -3.8), V(x + 0.05, top + 0.72, -3.75)), dark);
    const seat = lam("hrSeat", () => ({ color: "#6a4028" }));
    deco.add(boxGeo(V(MAG[0] - 0.22, top + 0.42, MAG[2] - 0.42), V(MAG[0] + 0.22, top + 0.47, MAG[2] - 0.1)), seat);
    for (const dx of [-0.19, 0.17]) deco.add(boxGeo(V(MAG[0] + dx, top, MAG[2] - 0.4), V(MAG[0] + dx + 0.04, top + 0.42, MAG[2] - 0.36)), dark);
    deco.add(boxGeo(V(MAG[0] - 0.22, top + 0.47, MAG[2] - 0.44), V(MAG[0] + 0.22, top + 1.0, MAG[2] - 0.4)), dark);
    // a small high window with grey light + a hanging lamp
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), hdr(1.6, 1.6, 1.5));
    pane.position.set(x0 + 0.02, 2.4, -1.0); pane.rotation.y = Math.PI / 2; pane.layers.set(NOINK); this.root.add(pane);
    this.glow(x0 + 0.3, 2.4, -1.0, 1.6, 0.5);
    b.build(this.root, false); deco.build(this.root, true);
    // the laundry line across the doorway (near the lens): the cloths are fx cards
    const line = new THREE.Mesh(cyl(0.006, 0.006, 3.2, 4), new THREE.MeshBasicMaterial({ color: "#3a3030" }));
    line.rotation.z = Math.PI / 2; line.position.set(0, 2.12, 1.7); this.root.add(line);
  }
}
export const MAG: [number, number, number] = [1.5, 0.4, -3.97];

// ---------------- the bank's junk room ----------------
export const JUNK = { x0: -1.7, x1: 1.7, z0: -2.6, z1: 5.0, h: 2.7, front: 1.4, dx0: -0.8, dx1: 0.6, dy1: 2.1 };
export class Junk extends Room {
  private door = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h, front, dx0, dx1, dy1 } = JUNK;
    const wall = lam("jkWall", () => ({ color: "#a89878" })), floor = lam("jkFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("jkCeil", () => ({ color: "#8a7a64" })), 2, true);
    // the partition between the junk room and the corridor (camera side), with the doorway
    const corr = lam("jkCorr", () => ({ color: "#d8ccb0" })), panel = lam("jkPanel", () => ({ color: "#6a4a30" }));
    b.add(boxGeo(V(x0, 0, front), V(dx0, h, front + 0.15), 2), corr);
    b.add(boxGeo(V(dx1, 0, front), V(x1, h, front + 0.15), 2), corr);
    b.add(boxGeo(V(dx0, dy1, front), V(dx1, h, front + 0.15), 2), corr);
    for (const [a, c] of [[x0, dx0], [dx1, x1]]) deco.add(boxGeo(V(a, 0, front + 0.15), V(c, 0.9, front + 0.18)), panel);
    const leaf = new Batch();
    leaf.add(boxGeo(V(0, 0, 0), V(dx1 - dx0, dy1, 0.05)), panel);
    leaf.add(boxGeo(V(dx1 - dx0 - 0.15, 1.0, 0.05), V(dx1 - dx0 - 0.08, 1.06, 0.1)), lam("jkKnob", () => ({ color: "#c8a050" })));
    leaf.build(this.door, true); this.door.position.set(dx0, 0, front + 0.15); this.root.add(this.door);
    // shelves of old printed forms + toppled ink bottles along the back wall
    const shelf = lam("jkShelf", () => ({ color: "#5a3a24" })), paper = lam("jkPaper", () => ({ color: "#e8dcc0" })), ink = lam("jkInk", () => ({ color: "#1a2240" }));
    for (const y of [0.5, 1.2, 1.9]) {
      deco.add(boxGeo(V(x0 + 0.1, y, z0), V(x1 - 0.1, y + 0.04, z0 + 0.45)), shelf);
      for (let k = 0; k < 6; k++) deco.add(boxGeo(V(x0 + 0.25 + k * 0.52, y + 0.04, z0 + 0.06), V(x0 + 0.6 + k * 0.52, y + 0.12 + 0.12 * ((k * 7 + y * 10) % 3), z0 + 0.38)), paper);
    }
    for (const [x, y] of [[-0.9, 1.24], [0.6, 0.54], [1.1, 1.94]] as const) deco.add(cyl(0.05, 0.05, 0.14, 10), ink, at(x, y + 0.07, z0 + 0.3, 0, 0, x > 0 ? 1.5 : 0));
    // the candle on the middle shelf (right side, away from the faces)
    deco.add(cyl(0.025, 0.025, 0.16, 8), lam("jkWax", () => ({ color: "#f4ecd8" })), at(1.25, 1.32, z0 + 0.25));
    this.flame(1.25, 1.45, z0 + 0.25, 0.08, 0.16, 4);
    this.glow(1.25, 1.45, z0 + 0.25, 2.0, 0.55);
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** door 0 shut .. 1 open (swings out toward the corridor) */
  pose(open: number) { this.door.rotation.y = -1.7 * open; }
}

// ---------------- Huld's sickroom ----------------
export const SICK = { x0: -2.6, x1: 2.6, z0: -3.0, z1: 3.4, h: 3.0 };
export const HBED = { x0: -2.1, x1: 0.1, z0: -2.95, z1: -1.95, top: 0.6 };
export const VISIT_CHAIR: [number, number, number] = [0.35, 0, -1.25];
export class Sick extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = SICK;
    const wall = lam("skWall", () => ({ color: "#6a5a6a" })), floor = lam("skFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("skCeil", () => ({ color: "#4a3a48" })));
    const wood = lam("skWood", () => ({ color: "#4a2a1c" }));
    const { x0: bx0, x1: bx1, z0: bz0, z1: bz1, top } = HBED;
    deco.add(boxGeo(V(bx0, 0.3, bz0), V(bx1, top, bz1)), lam("skSheet", () => ({ color: "#ece6dc" })));
    deco.add(boxGeo(V(bx0, top - 0.04, bz0), V(bx1, top + 0.08, bz1 + 0.02)), lam("skQuilt", () => ({ color: "#b8908a" })));
    deco.add(boxGeo(V(bx0, 0, bz0), V(bx0 + 0.08, 1.4, bz1)), wood);
    deco.add(boxGeo(V(bx1 - 0.08, 0, bz0), V(bx1, 0.8, bz1)), wood);
    // bedside table on the far right with the candle (out of the line to the faces)
    deco.add(boxGeo(V(1.7, 0, -2.9), V(2.3, 0.7, -2.4)), wood);
    deco.add(cyl(0.03, 0.03, 0.2, 8), lam("skWax", () => ({ color: "#f4ecd8" })), at(2.0, 0.8, -2.65));
    this.flame(2.0, 0.96, -2.65, 0.09, 0.18, 4);
    this.glow(2.0, 0.96, -2.65, 2.4, 0.6);
    // a heavy curtain on the back wall
    deco.add(boxGeo(V(-0.6, 0.3, z0 + 0.01), V(1.3, 2.8, z0 + 0.08)), lam("skDrape", () => ({ color: "#5a2a34" })));
    chair(deco, VISIT_CHAIR[0], seatZ(VISIT_CHAIR[2]), lam("skSeat", () => ({ color: "#6a3a2a" })), wood, -1);
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ---------------- Titorelli's studio ----------------
export const STUDIO = { x0: -2.1, x1: 2.1, z0: -2.5, z1: 3.6, h: 2.7 };
export const TBED = { x0: -1.8, x1: 0.6, z0: -2.45, z1: -1.85, top: 0.48 };
export const SDOOR = { x0: -1.45, x1: -0.65, y0: 0.62, y1: 1.85 };
export class Studio extends Room {
  private door = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = STUDIO;
    const wall = lam("stWall", () => ({ color: "#c8b898" })), floor = lam("stFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("stCeil", () => ({ color: "#b0a080" })), 2, false);
    wallHoles(b, x0, x1, z0, h, [[SDOOR.x0, SDOOR.x1, SDOOR.y0, SDOOR.y1]], wall);
    // the court offices beyond the little door: a dim corridor with a bench
    const corr = lam("stCorr", () => ({ color: "#6a6250" }));
    b.add(quad(V(-2.4, SDOOR.y0 - 0.62, z0 - 0.4), V(0.4, SDOOR.y0 - 0.62, z0 - 0.4), V(0.4, SDOOR.y0 - 0.62, z0 - 5), V(-2.4, SDOOR.y0 - 0.62, z0 - 5)), lam("stCorrF", () => ({ color: "#5a5040" })));
    b.add(boxGeo(V(-2.8, 0, z0 - 5.4), V(0.8, 3, z0 - 5)), corr);
    b.add(boxGeo(V(-2.8, 0, z0 - 5), V(-2.4, 3, z0 - 0.4)), corr);
    b.add(boxGeo(V(0.4, 0, z0 - 5), V(0.8, 3, z0 - 0.4)), corr);
    b.add(boxGeo(V(-2.8, 2.6, z0 - 5.4), V(0.8, 3, z0 - 0.4)), corr);
    deco.add(boxGeo(V(-2.35, 0.4, z0 - 4.2), V(-1.9, 0.45, z0 - 1.2)), lam("stBench", () => ({ color: "#4a3420" })));
    this.glow(-1.0, 2.3, z0 - 3.4, 1.4, 0.35);
    const leaf = new Batch(), wood = lam("stDoor", () => ({ color: "#7a5a3a" }));
    leaf.add(boxGeo(V(0, 0, 0), V(SDOOR.x1 - SDOOR.x0, SDOOR.y1 - SDOOR.y0, 0.04)), wood);
    leaf.build(this.door, true); this.door.position.set(SDOOR.x0, SDOOR.y0, z0 - 0.02); this.root.add(this.door);
    // the narrow bed against the back wall, under the little door
    const { x0: bx0, x1: bx1, z0: bz0, z1: bz1, top } = TBED;
    deco.add(boxGeo(V(bx0, 0.22, bz0), V(bx1, top, bz1)), lam("stSheet", () => ({ color: "#e8e0cc" })));
    deco.add(boxGeo(V(bx0 + 0.3, top - 0.02, bz0), V(bx1, top + 0.05, bz1 + 0.02)), lam("stBlanket", () => ({ color: "#7a6a8a" })));
    for (const x of [bx0, bx1 - 0.05]) deco.add(boxGeo(V(x, 0, bz1 - 0.05), V(x + 0.05, 0.24, bz1)), lam("stLeg", () => ({ color: "#3a2a20" })));
    // easel on the right + a stack of identical heath paintings leaning on the wall
    const ez = -1.3, ex = 1.45;
    for (const dx of [-0.25, 0.25]) deco.add(boxGeo(V(ex + dx - 0.025, 0, ez), V(ex + dx + 0.025, 1.9, ez + 0.05)), lam("stEasel", () => ({ color: "#8a6a44" })), at(0, 0, 0, 0, 0, 0));
    deco.add(boxGeo(V(ex - 0.35, 0.95, ez + 0.05), V(ex + 0.35, 1.0, ez + 0.14)), lam("stEasel", () => ({ color: "#8a6a44" })));
    for (let k = 0; k < 4; k++) deco.add(boxGeo(V(1.6, 0, -2.4 + k * 0.06), V(2.05, 0.6, -2.36 + k * 0.06)), lam("stCanvas", () => ({ color: "#a07a3e" })), at(0, 0, 0, -0.1));
    // skylight: dusty daylight
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), hdr(1.8, 1.8, 1.7));
    sky.rotation.x = Math.PI / 2; sky.position.set(0.5, h - 0.01, -0.5); sky.layers.set(NOINK); this.root.add(sky);
    this.glow(0.5, h - 0.2, -0.5, 2.2, 0.35);
    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(open: number) { this.door.rotation.y = 1.9 * open; }
}
export const CANVAS_AT: [number, number, number] = [1.45, 1.38, -1.12];

// ---------------- the cathedral ----------------
export const PULPIT: [number, number, number] = [1.6, 2.2, -7.5];
export class Cathedral extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const wall = lam("caWall", () => ({ map: stoneHD("caWall", ["#7a7488", "#726c80", "#827c90", "#6a6478"], "#4a4458") }));
    const floor = lam("caFloor", () => ({ map: stoneHD("caFloor", ["#6a6470", "#625c68", "#726c78", "#5a5460"], "#3a3440") }));
    shell(b, -5, 5, -16, 5, 12, wall, floor, lam("caCeil", () => ({ color: "#2a2632" })), 3);
    // pillars down both sides of the nave
    const stone = lam("caPillar", () => ({ color: "#8a8498" }));
    for (const z of [-14, -10, -6, -2, 2]) for (const x of [-3.4, 3.4]) deco.add(cyl(0.45, 0.5, 12, 14), stone, at(x, 6, z));
    // pews: rows on both sides of the centre aisle
    const pew = lam("caPew", () => ({ color: "#4a2e1e" }));
    for (let z = -12; z <= 1; z += 1.3) for (const [a, c] of [[-3.0, -0.6], [0.6, 3.0]] as const) {
      deco.add(boxGeo(V(a, 0.42, z - 0.22), V(c, 0.47, z + 0.2)), pew);
      deco.add(boxGeo(V(a, 0, z + 0.15), V(c, 0.95, z + 0.22)), pew);
    }
    // the small pulpit on the pillar at the right: a stone cup, its floor at y 2.2
    const [px, py, pz] = PULPIT;
    deco.add(cyl(0.18, 0.22, py, 10), stone, at(px, py / 2, pz - 0.2));
    deco.add(boxGeo(V(px - 0.5, py - 0.15, pz - 0.6), V(px + 0.5, py, pz + 0.25)), stone);
    deco.add(boxGeo(V(px - 0.5, py, pz + 0.18), V(px + 0.5, py + 0.95, pz + 0.26)), lam("caPulpit", () => ({ color: "#9a8a70" })));
    for (const dx of [-0.5, 0.45]) deco.add(boxGeo(V(px + dx, py, pz - 0.6), V(px + dx + 0.05, py + 0.95, pz + 0.2)), lam("caPulpit", () => ({ color: "#9a8a70" })));
    // far altar candles + a tall dim window
    for (const x of [-0.9, -0.3, 0.3, 0.9]) { deco.add(cyl(0.04, 0.04, 0.6, 8), lam("caWax", () => ({ color: "#f4ecd8" })), at(x, 1.3, -15.2)); this.flame(x, 1.68, -15.2, 0.12, 0.22, 3); }
    deco.add(boxGeo(V(-1.4, 0, -15.8), V(1.4, 1.0, -15.0)), lam("caAltar", () => ({ color: "#5a4a40" })));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.5), hdr(0.35, 0.42, 0.8));
    win.position.set(0, 6.5, -15.95); win.layers.set(NOINK); this.root.add(win);
    this.glow(0, 1.7, -15.2, 3.5, 0.45);
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ---------------- the door to the Law (parable) ----------------
export const LAW = { x0: -0.75, x1: 0.75, h: 2.9, z: -4 };
export const STOOLS = { keeper: [-1.15, 0, -3.3] as [number, number, number], man: [1.15, 0, -3.3] as [number, number, number] };
export class LawDoor extends Room {
  private door = new THREE.Group();
  private light: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const floor = lam("lwFloor", () => ({ map: stoneHD("lwFloor", ["#4a4250", "#423a48", "#524a58", "#3a3240"], "#2a2430") }));
    b.add(quad(V(-12, 0, 8), V(12, 0, 8), V(12, 0, -20), V(-12, 0, -20), 8, 9), floor);
    const stone = lam("lwStone", () => ({ map: stoneHD("lwStone", ["#6a6274", "#62596c", "#72697c", "#5a5264"], "#3a3444") }));
    const { x0, x1, h, z } = LAW;
    // a huge dark wall with the doorway; further, smaller doorways glowing behind it
    b.add(boxGeo(V(-12, 0, z - 0.6), V(x0, 14, z)), stone);
    b.add(boxGeo(V(x1, 0, z - 0.6), V(12, 14, z)), stone);
    b.add(boxGeo(V(x0, h, z - 0.6), V(x1, 14, z)), stone);
    deco.add(boxGeo(V(x0 - 0.25, 0, z), V(x0, h + 0.25, z + 0.25)), stone);
    deco.add(boxGeo(V(x1, 0, z), V(x1 + 0.25, h + 0.25, z + 0.25)), stone);
    deco.add(boxGeo(V(x0 - 0.35, h, z), V(x1 + 0.35, h + 0.35, z + 0.3)), stone);
    this.light = hdr(3.2, 2.7, 1.9);
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, h), this.light);
    fill.position.set(0, h / 2, z - 0.55); fill.layers.set(NOINK); this.root.add(fill);
    this.glow(0, 1.4, z + 0.2, 5.5, 0.7);
    const leaf = new Batch();
    leaf.add(boxGeo(V(0, 0, 0), V(x1 - x0, h, 0.08)), lam("lwDoor", () => ({ color: "#3a2a20" })));
    for (const y of [0.6, 1.5, 2.4]) leaf.add(boxGeo(V(0.05, y, 0.08), V(x1 - x0 - 0.05, y + 0.06, 0.12)), lam("lwBand", () => ({ color: "#2a2a30" })));
    leaf.build(this.door, true); this.door.position.set(x1, 0, z - 0.3); this.root.add(this.door);
    // two stools beside the door
    const wood = lam("lwStool", () => ({ color: "#5a3a24" }));
    for (const [sx, , sz] of [STOOLS.keeper, STOOLS.man]) {
      deco.add(cyl(0.22, 0.22, 0.06, 12), wood, at(sx, 0.45, sz - 0.12));
      for (let k = 0; k < 3; k++) deco.add(cyl(0.025, 0.025, 0.45, 6), wood, at(sx + 0.15 * Math.cos(k * 2.1), 0.22, sz - 0.12 + 0.15 * Math.sin(k * 2.1)));
    }
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** door 0 open (swung back against the wall) .. 1 shut */
  pose(shut: number) {
    this.door.rotation.y = Math.PI - (1 - shut) * 1.75;
    const k = 1 - 0.9 * shut;
    this.light.color.setRGB(3.2 * k, 2.7 * k, 1.9 * k);
    for (const g of this.glows) g.material.opacity = 0.7 * (1 - shut);
  }
}

// ---------------- the quarry ----------------
export const BLOCK = { x0: -0.9, x1: 0.9, z0: -0.7, z1: 0.0, h: 0.6 };
export const HOUSE_WIN: [number, number, number] = [1.9, 6.6, -15.6];
export class Quarry extends Room {
  private win: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const rock = lam("qrRock", () => ({ map: stoneHD("qrRock", ["#8a8478", "#827c70", "#928c80", "#7a7468"], "#5a5448") }));
    const grit = lam("qrFloor", () => ({ map: stoneHD("qrFloor", ["#a49c8c", "#9c9484", "#aca494", "#948c7c"], "#746c5c") }));
    b.add(quad(V(-30, 0, 20), V(30, 0, 20), V(30, 0, -18), V(-30, 0, -18), 12, 10), grit);
    // the quarry face behind, stepped, and side walls
    b.add(boxGeo(V(-30, 0, -19), V(30, 5.2, -16)), rock);
    b.add(boxGeo(V(-30, 0, -16), V(-1.5, 2.4, -14)), rock);
    b.add(boxGeo(V(-30, 0, -14), V(-7, 5.2, 10)), rock);
    b.add(boxGeo(V(7, 0, -14), V(30, 5.2, 10)), rock);
    for (const [x, z, s] of [[-4.5, -9, 1.0], [4.8, -6, 1.3], [-5.5, -2, 0.8], [5.2, 2, 0.9], [3.2, -11, 0.7]] as const)
      deco.add(boxGeo(V(-0.8 * s, 0, -0.6 * s), V(0.8 * s, 1.0 * s, 0.6 * s)), rock, at(x, 0, z, 0, x * 0.3, 0));
    // the stone block where they lay him
    const { x0, x1, z0, z1, h } = BLOCK;
    deco.add(boxGeo(V(x0, 0, z0), V(x1, h, z1)), lam("qrBlock", () => ({ color: "#b0a894" })));
    // the lone house up on the rim with its one lit window
    const wall = lam("qrHouse", () => ({ color: "#c8bca4" })), roof = lam("qrRoof", () => ({ color: "#5a3a34" }));
    const [hx, hy, hz] = HOUSE_WIN;
    deco.add(boxGeo(V(hx - 1.6, 5.2, hz - 2.4), V(hx + 1.4, hy + 1.4, hz)), wall);
    deco.add(boxGeo(V(hx - 1.8, hy + 1.4, hz - 2.6), V(hx + 1.6, hy + 1.65, hz + 0.2)), roof);
    this.win = hdr(3.0, 2.4, 1.3);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), this.win);
    pane.position.set(hx, hy, hz + 0.01); pane.layers.set(NOINK); this.root.add(pane);
    this.glow(hx, hy, hz + 0.2, 2.2, 0.6);
    b.build(this.root, false); deco.build(this.root, true);
    // night sky dome: deep blue, stars, the moon
    const skyT = ctex("qrSky", 1024, 512, (g, r) => {
      const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#060a1c"); gr.addColorStop(0.45, "#1a2448"); gr.addColorStop(0.5, "#2a3460"); gr.addColorStop(1, "#2a3460");
      g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,240,${0.4 + 0.6 * r()})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * 1024, r() * 230, s, s); }
      g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(560, 120, 14, 0, Math.PI * 2); g.fill();
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -2; dome.layers.set(NOINK); this.root.add(dome);
  }
  /** window 1 lit .. 0 dark */
  pose(lit: number) {
    this.win.color.setRGB(0.12 + 2.9 * lit, 0.12 + 2.3 * lit, 0.18 + 1.1 * lit);
    for (const g of this.glows) g.material.opacity = 0.6 * lit;
  }
}
export { twoTone };
