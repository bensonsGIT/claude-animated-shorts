// The Grand Inquisitor sets. Floor y = 0; cameras mostly look toward -z. Each set is a Room shown one at a time.
// - Void: black, one candle on a stand (the ticket and the tear, lines 1 and 17).
// - Tavern: "the Metropolis" (Book V ch. 3): a table under a hanging oil lamp, two chairs behind it, a samovar, a dusk window.
// - Square: Seville in the 16th century: the cathedral façade and its broad steps, white houses with iron balconies (outdoor).
// - Prison: the vaulted cell of the Holy Inquisition: barrel vault, stone bench, an iron-bound door that opens, a high grille.
// - Desert: dunes, stones, a rock for the Prisoner (the three temptations), dusk (outdoor).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, beam } from "../../engine/paint";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import { shell, holedWall, doorTex, windowUnit, doorUnit, brassK, gold } from "../dorian/rooms";
import { plaster, stone, skyDome, backdrop, ridgeTex } from "../frankenstein/rooms";
import type { V3 } from "./story";

// ================= the void =================
export const CANDLE: V3 = [0, 1.0, -1.6];
export class Void extends Room {
  constructor() {
    super();
    const b = new Batch();
    b.add(quad(V(-30, 0, 20), V(30, 0, 20), V(30, 0, -30), V(-30, 0, -30), 8, 8), lam("vdFloor", () => ({ color: "#100c12" })));
    b.add(cyl(0.03, 0.05, CANDLE[1] - 0.12, 8), brassK(), at(CANDLE[0], (CANDLE[1] - 0.12) / 2, CANDLE[2]));
    b.add(cyl(0.1, 0.12, 0.03, 14), brassK(), at(CANDLE[0], CANDLE[1] - 0.12, CANDLE[2]));
    b.add(cyl(0.025, 0.025, 0.16, 8), lam("vdWax", () => ({ color: "#f0e6cc" })), at(CANDLE[0], CANDLE[1] - 0.03, CANDLE[2]));
    this.flame(CANDLE[0], CANDLE[1] + 0.1, CANDLE[2], 0.06, 0.12, 3.2); this.glow(CANDLE[0], CANDLE[1] + 0.1, CANDLE[2], 1.6, 0.5);
    b.build(this.root, true);
  }
}

// ================= the Metropolis tavern =================
export const TAVERN = { x0: -2.8, x1: 2.8, z0: -3.2, z1: 3.4, h: 3.0 };
export const T_TABLE = { x0: -0.95, x1: 0.95, z0: -1.95, z1: -1.2, top: 0.75 };
export const T_LAMP: V3 = [0, 2.05, -1.6];
export const SAMOVAR: V3 = [1.25, 0.75, -1.4];
export class Tavern extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = TAVERN;
    const wall = lam("tvWall", () => ({ map: plaster("tvPlaster", "#7a5a40", "#86664a") }));
    shell(b, x0, x1, z0, z1, h, wall, lam("tvFloor", () => ({ map: planksHD(), color: "#7a5a44" })), lam("tvCeil", () => ({ map: beam(), color: "#4a3426" })), false);
    holedWall(b, x0, x1, z0, h, -2.35, -1.35, 1.05, 2.25, wall);
    const dusk = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), new THREE.MeshBasicMaterial({ map: ctex("tvDusk", 128, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#2a3260"); gr.addColorStop(0.6, "#8a6a7a"); gr.addColorStop(1, "#c88a6a"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.fillStyle = "#1a1420"; for (let i = 0; i < 5; i++) g.fillRect(i * 28, 70 - (i % 3) * 10, 24, 60); g.fillStyle = "#f8d080"; for (let i = 0; i < 6; i++) g.fillRect(6 + i * 20, 90 + (i % 2) * 8, 4, 5);
    }) }));
    dusk.position.set(-1.85, 1.65, z0 - 0.9); dusk.layers.set(NOINK); this.root.add(dusk);
    const frame = lam("tvFrame", () => ({ color: "#4a3020" }));
    windowUnit(deco, -1.85, 1.05, 1.0, 1.2, z0, { frame, cols: 2, rows: 3, sill: frame });
    // wainscot
    const oak = lam("tvOak", () => ({ map: beam(), color: "#6a4a30" }));
    for (const [a, c] of [[x0, -2.55], [-1.15, x1]] as const) { deco.add(boxGeo(V(a, 0, z0), V(c, 1.0, z0 + 0.05)), oak); deco.add(boxGeo(V(a, 1.0, z0), V(c, 1.05, z0 + 0.09)), oak); }
    doorUnit(deco, 1.9, 0, 0.95, 2.15, z0, { frame, leaf: lam("tvDoor", () => ({ map: doorTex("tvDoorT", "#5a3a26", "#3e2818") })), knob: brassK() });
    // the table with a cloth, tea glasses; the samovar
    const { x0: t0, x1: t1, z0: tz0, z1: tz1, top } = T_TABLE;
    deco.add(boxGeo(V(t0, top - 0.05, tz0), V(t1, top, tz1)), oak);
    deco.add(boxGeo(V(t0 - 0.02, top, tz0 - 0.02), V(t1 + 0.02, top + 0.01, tz1 + 0.02)), lam("tvCloth", () => ({ color: "#d8ccb0" })));
    deco.add(boxGeo(V(t0 - 0.02, top - 0.3, tz1 + 0.02), V(t1 + 0.02, top, tz1 + 0.03)), lam("tvCloth", () => ({ color: "#d8ccb0" })));
    for (const [x, z] of [[t0 + 0.06, tz0 + 0.06], [t1 - 0.06, tz0 + 0.06], [t0 + 0.06, tz1 - 0.06], [t1 - 0.06, tz1 - 0.06]] as const) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, top - 0.05, z + 0.04)), oak);
    const tea = lam("tvTea", () => ({ color: "#b8642a", transparent: true, opacity: 0.85 }));
    for (const x of [-0.45, 0.2]) deco.add(cyl(0.04, 0.035, 0.11, 10), tea, at(x, top + 0.065, -1.45));
    const brass = brassK(), [sx, sy, sz] = SAMOVAR;
    deco.add(cyl(0.11, 0.14, 0.26, 14), brass, at(sx, sy + 0.15, sz)); deco.add(cyl(0.04, 0.08, 0.1, 12), brass, at(sx, sy + 0.33, sz));
    deco.add(cyl(0.12, 0.08, 0.04, 12), brass, at(sx, sy + 0.02, sz));
    deco.add(boxGeo(V(sx - 0.25, 0, sz - 0.25), V(sx + 0.25, sy, sz + 0.25)), oak); deco.add(cyl(0.012, 0.012, 0.12, 6), brass, at(sx + 0.19, sy + 0.12, sz, 0, 0, Math.PI / 2));
    // two chairs behind the table (Ivan left, Alyosha right): seats 0.66, the brothers' marks are raised (y 0.18)
    const cw = lam("tvChair", () => ({ color: "#3a2416" }));
    for (const cx of [-0.45, 0.45]) {
      const cz = -2.3;
      deco.add(boxGeo(V(cx - 0.24, 0.6, cz - 0.24), V(cx + 0.24, 0.66, cz + 0.22)), cw);
      for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.18], [0.2, 0.18]] as const) deco.add(boxGeo(V(cx + dx - 0.025, 0, cz + dz - 0.025), V(cx + dx + 0.025, 0.6, cz + dz + 0.025)), cw);
      deco.add(boxGeo(V(cx - 0.24, 0.66, cz - 0.28), V(cx + 0.24, 1.15, cz - 0.22)), cw);
    }
    // the hanging oil lamp over the table
    deco.add(cyl(0.01, 0.01, h - T_LAMP[1] - 0.2, 6), lam("tvChain", () => ({ color: "#2a2a30" })), at(T_LAMP[0], (h + T_LAMP[1] + 0.2) / 2, T_LAMP[2]));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.26, 0.18, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.7), side: THREE.DoubleSide }));
    shade.position.set(...T_LAMP); shade.layers.set(NOINK); this.root.add(shade);
    this.flame(T_LAMP[0], T_LAMP[1] - 0.12, T_LAMP[2], 0.05, 0.1, 3); this.glow(T_LAMP[0], T_LAMP[1] - 0.1, T_LAMP[2], 2.2, 0.45);
    // an icon corner with a little red lamp (Russian tavern), a bench on the right wall
    deco.add(boxGeo(V(x1 - 0.6, 2.0, z0 + 0.02), V(x1 - 0.2, 2.5, z0 + 0.07)), gold());
    deco.add(boxGeo(V(x1 - 0.56, 2.04, z0 + 0.07), V(x1 - 0.24, 2.46, z0 + 0.1)), lam("tvIcon", () => ({ color: "#6a2a20" })));
    this.flame(x1 - 0.4, 1.9, z0 + 0.2, 0.03, 0.06, 2.2);
    deco.add(boxGeo(V(x1 - 0.45, 0.42, -2.4), V(x1, 0.48, 0.6)), oak);
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ================= Seville: the cathedral square (outdoor) =================
export const STEPS = { z0: -9.6, z1: -6.8, top: 1.2, n: 6 };
export class Square extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const paving = lam("sqPave", () => ({ map: stone("sqPaveT", ["#c8b89a", "#d4c4a6", "#bca88a"], "#8a7a62") }));
    b.add(quad(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -80), V(-80, 0, -80), 60, 60), paving);
    // the cathedral façade: a tall gabled front, buttresses, a rose window, a great arched door, then the broad steps
    const ashlar = lam("sqAshlar", () => ({ map: stone("sqAshlarT", ["#e6d4b0", "#dcc8a2", "#ecdcba"], "#a89474") }));
    const { z0, z1, top, n } = STEPS;
    b.add(boxGeo(V(-6, top, z0 - 4), V(6, 13, z0), 2), ashlar);
    const gab = new THREE.BufferGeometry(); gab.setAttribute("position", new THREE.Float32BufferAttribute([-6, 13, z0, 6, 13, z0, 0, 17, z0], 3)); gab.computeVertexNormals(); b.add(gab, ashlar);
    for (const x of [-6.2, -2.4, 2.4, 6.2]) deco.add(boxGeo(V(x - 0.4, top, z0), V(x + 0.4, 14, z0 + 0.6)), ashlar);
    const rose = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), lam("sqRose", () => ({ map: ctex("sqRoseT", 256, 256, (g) => {
      g.fillStyle = "#3a2a3a"; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
      const cols = ["#c83a4a", "#3a6ac8", "#e8c04a", "#4a9a5a"];
      for (let i = 0; i < 12; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 110, (i / 12) * Math.PI * 2, ((i + 0.8) / 12) * Math.PI * 2); g.fill(); }
      g.strokeStyle = "#e6d4b0"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(128, 128, 30, 0, Math.PI * 2); g.fillStyle = "#e8c04a"; g.fill();
    }) })));
    rose.position.set(0, 9.6, z0 + 0.05); this.root.add(rose);
    deco.add(boxGeo(V(-1.6, top, z0), V(1.6, top + 4.2, z0 + 0.06)), lam("sqDoor", () => ({ map: doorTex("sqDoorT", "#5a3a22", "#3a2414") })));
    deco.add(new THREE.TorusGeometry(1.75, 0.18, 8, 24, Math.PI), ashlar, at(0, top + 4.2, z0 + 0.12));
    for (const x of [-1.85, 1.85]) deco.add(boxGeo(V(x - 0.18, top, z0), V(x + 0.18, top + 4.2, z0 + 0.3)), ashlar);
    for (let i = 0; i < n; i++) { const y = (top / n) * (i + 1), z = z1 - ((z1 - z0) / n) * i; b.add(boxGeo(V(-7, 0, z0), V(7, y, z), 2), ashlar); }
    // whitewashed houses with iron balconies either side
    const white = lam("sqWhite", () => ({ color: "#f2ece0" })), iron = lam("sqIron", () => ({ color: "#2a2a30" })), roofT = lam("sqTile", () => ({ color: "#b8643a", side: THREE.DoubleSide }));
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x0 = s < 0 ? -18 + k * 3.6 : 7.5 + k * 3.6, x1 = x0 + 3.4, zz = -4 - k * 1.5, hh = 7 + (k % 2) * 1.6;
      b.add(boxGeo(V(x0, 0, zz - 6), V(x1, hh, zz), 1.4), white);
      deco.add(boxGeo(V(x0 - 0.2, hh, zz - 6.2), V(x1 + 0.2, hh + 0.3, zz + 0.25)), roofT);
      for (const yy of [3.2, 5.6]) { deco.add(boxGeo(V(x0 + 0.9, yy, zz), V(x1 - 0.9, yy + 0.08, zz + 0.6)), iron); for (let j = 0; j < 6; j++) deco.add(boxGeo(V(x0 + 0.95 + j * 0.3, yy, zz + 0.55), V(x0 + 0.98 + j * 0.3, yy + 0.8, zz + 0.58)), iron); deco.add(boxGeo(V(x0 + 1.1, yy + 0.08, zz - 0.02), V(x1 - 1.1, yy + 1.9, zz + 0.03)), lam("sqShutter", () => ({ color: "#3a6a52" }))); }
      deco.add(boxGeo(V(x0 + 1.2, 0, zz - 0.02), V(x1 - 1.2, 2.4, zz + 0.04)), lam("sqHouseDoor", () => ({ color: "#5a3a22" })));
    }
    // two palms
    const trunk = lam("sqPalm", () => ({ color: "#8a6a44" })), frond = lam("sqFrond", () => ({ color: "#4a8a3a", side: THREE.DoubleSide }));
    for (const [x, z] of [[-6.5, -3.2], [6.8, -2.6]] as const) {
      deco.add(cyl(0.18, 0.26, 6, 8), trunk, at(x, 3, z));
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; deco.add(boxGeo(V(0, -0.04, -0.25), V(2.2, 0.04, 0.25)), frond, at(x, 6, z, 0, a, -0.45)); }
    }
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "sqSky", [[0, "#2a62c8"], [0.4, "#7ab0ea"], [0.5, "#f0e8d8"], [1, "#f0e8d8"]]);
    backdrop(this.root, ridgeTex("sqHills", [[760, 90, 16, "#c8a878", null]], null), 260, 130, -80);
  }
}

// ================= the vaulted prison =================
export const PRISON = { x0: -2.3, x1: 2.3, z0: -2.6, z1: 3.0, h: 2.4 };
export const P_BENCH = { x0: -1.4, x1: 0.7, z0: -2.6, z1: -2.15, top: 0.45 };
export const P_DOOR = { z: -0.4, w: 1.0, h: 2.1 };
export class Prison extends Room {
  private door = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), db = new Batch();
    const { x0, x1, z0, z1, h } = PRISON;
    const st = lam("prStone", () => ({ map: stone("prStoneT", ["#6a645c", "#5e5850", "#746e66"], "#3a3630") }));
    // walls by hand: the left wall leaves a gap for the door
    const { z: dz0, w: dw0, h: dh0 } = P_DOOR;
    b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), lam("prFloor", () => ({ map: stone("prFlags", ["#5a544c", "#4e4840"], "#2a2622") })));
    b.add(boxGeo(V(x1, 0, z0 - 0.4), V(x1 + 0.4, h, z1 + 0.4), 2), st);
    b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), st);
    b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), st);
    b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, dz0 - dw0 / 2), 2), st);
    b.add(boxGeo(V(x0 - 0.4, 0, dz0 + dw0 / 2), V(x0, h, z1), 2), st);
    b.add(boxGeo(V(x0 - 0.4, dh0, dz0 - dw0 / 2), V(x0, h, dz0 + dw0 / 2), 2), st);
    // the barrel vault (half cylinder along z, inside faces) and its end wall lunettes
    const vault = new THREE.Mesh(new THREE.CylinderGeometry((x1 - x0) / 2, (x1 - x0) / 2, z1 - z0 + 0.8, 24, 1, true, Math.PI / 2, Math.PI), lam("prVault", () => ({ map: stone("prVaultT", ["#625c54", "#58524a"], "#34302a"), side: THREE.DoubleSide })));
    vault.rotation.x = Math.PI / 2; vault.position.set(0, h, (z0 + z1) / 2); this.root.add(vault);
    for (const z of [z0, z1]) { const lun = new THREE.Mesh(new THREE.CircleGeometry((x1 - x0) / 2, 24, 0, Math.PI), st); lun.position.set(0, h, z + (z === z0 ? 0.01 : -0.01)); if (z !== z0) lun.rotation.y = Math.PI; this.root.add(lun); }
    // the high grille with a sliver of moon
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: ctex("prMoon", 64, 40, (g) => { g.fillStyle = "#141c3a"; g.fillRect(0, 0, 64, 40); g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(44, 14, 6, 0, Math.PI * 2); g.fill(); }) }));
    sky.position.set(1.2, 2.6, z0 + 0.02); sky.layers.set(NOINK); this.root.add(sky);
    const iron = lam("prIron", () => ({ color: "#1e1e24" }));
    for (const x of [0.95, 1.12, 1.29, 1.46]) deco.add(cyl(0.018, 0.018, 0.5, 6), iron, at(x, 2.6, z0 + 0.06));
    // the stone bench along the back wall (the Prisoner sits on its front edge)
    const { x0: b0, x1: b1, z0: bz0, z1: bz1, top } = P_BENCH;
    deco.add(boxGeo(V(b0, 0, bz0), V(b1, top, bz1)), st);
    // the iron-bound door on the left wall (opens on "door"), the dark alley beyond
    const { z: dz, w: dw, h: dh } = P_DOOR;
    const alley = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.8), new THREE.MeshBasicMaterial({ color: "#0e1222" })); alley.position.set(x0 - 0.9, 1.3, dz); alley.rotation.y = Math.PI / 2; alley.layers.set(NOINK); this.root.add(alley);
    deco.add(boxGeo(V(x0, 0, dz - dw / 2 - 0.12), V(x0 + 0.08, dh + 0.12, dz - dw / 2)), st); deco.add(boxGeo(V(x0, 0, dz + dw / 2), V(x0 + 0.08, dh + 0.12, dz + dw / 2 + 0.12)), st);
    deco.add(boxGeo(V(x0, dh, dz - dw / 2), V(x0 + 0.08, dh + 0.12, dz + dw / 2)), st);
    const plank = lam("prDoor", () => ({ map: beam(), color: "#5a4636" }));
    db.add(boxGeo(V(0, 0, 0), V(0.06, dh, dw)), plank);
    for (const y of [0.3, 1.0, 1.75]) db.add(boxGeo(V(0.06, y, 0.04), V(0.08, y + 0.07, dw - 0.04)), iron);
    db.add(new THREE.SphereGeometry(0.04, 8, 6), iron, at(0.1, 1.0, dw - 0.15));
    db.build(this.door, true); this.door.position.set(x0 + 0.01, 0, dz - dw / 2); this.root.add(this.door);
    b.build(this.root, false); deco.build(this.root, true);
    this.glow(1.2, 2.6, z0 + 0.15, 1.0, 0.25);
  }
  /** open 0 shut .. 1 swung into the cell */
  pose(open: number) { this.door.rotation.y = open * 1.5; }
}
// ================= the desert (outdoor) =================
export const ROCK: V3 = [-0.45, 0, -2.2];
export class Desert extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const sand = lam("deSand", () => ({ color: "#d8b07a" })), sand2 = lam("deSand2", () => ({ color: "#c89a64" }));
    b.add(quad(V(-90, 0, 50), V(90, 0, 50), V(90, 0, -100), V(-90, 0, -100), 30, 30), sand);
    for (const [x, z, s] of [[-9, -14, 5], [10, -18, 6], [0, -26, 8], [-16, -30, 7], [18, -6, 4]] as const) deco.add(new THREE.SphereGeometry(s, 18, 10), sand2, at(x, -s * 0.72, z, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.8, 1, 1)));
    const rock = lam("deRock", () => ({ color: "#8a6a50" }));
    deco.add(new THREE.DodecahedronGeometry(0.42, 0), rock, at(ROCK[0], 0.28, ROCK[2] - 0.1, 0, 0.4, 0, 1).multiply(new THREE.Matrix4().makeScale(1.4, 0.75, 1)));
    for (let i = 0; i < 14; i++) deco.add(new THREE.DodecahedronGeometry(0.1 + (i % 3) * 0.07, 0), rock, at(-3 + i * 0.5, 0.06, -1.2 - (i % 4) * 0.8, i, i * 2, 0));
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "deSky", [[0, "#3a2a6a"], [0.3, "#c86a5a"], [0.45, "#f8b060"], [0.5, "#ffd8a0"], [1, "#ffd8a0"]]);
    backdrop(this.root, ridgeTex("deDunes", [[700, 120, 10, "#b88a5a", null], [790, 60, 14, "#c89a64", null]], null), 280, 140, -90);
  }
}
