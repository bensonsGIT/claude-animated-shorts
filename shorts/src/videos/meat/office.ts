// A doctor's study, 1876 (the samples under the microscope), which also serves for the final jar on its shelf.
// Floor y = 0; x (-3..3), z (-3 back wall .. 3), ceiling 3.2. Desk against the back wall with a brass microscope and
// specimen jars; a bookcase on the left; a tall window on the back wall (daylight); a jar shelf on the right wall.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const ROOM = { x0: -3, x1: 3, z0: -3, z1: 3, h: 3.2 };
export const DESK = { x0: -0.9, x1: 0.9, z0: -2.95, z1: -2.15, top: 0.78 };
/** the microscope (base centre on the desk) */
export const SCOPE: V3 = [0.35, DESK.top, -2.55];
/** the jar of meat on the shelf (bottom centre) */
export const JAR: V3 = [2.6, 1.42, 0.4];

const paper = () => ctex("officeWall", 512, 512, (g, r) => {
  g.fillStyle = "#5f7a68"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#57705f" : "#67826f"; g.fillRect(i * 64, 0, 64, 512); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(230,210,150,0.5)"; const x = (i % 8) * 64 + 32, y = Math.floor(i / 8) * 110 + 50; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 8, y); g.lineTo(x, y + 12); g.lineTo(x - 8, y); g.fill(); }
  void r;
});
const books = () => ctex("officeBooks", 512, 512, (g, r) => {
  g.fillStyle = "#3a2418"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 4; row++) {
    let x = 6;
    while (x < 500) {
      const w = 14 + r() * 22, h = 80 + r() * 36;
      g.fillStyle = ["#7a2a2a", "#2a4a6a", "#3a5a3a", "#8a6a3a", "#4a2a4a"][Math.floor(r() * 5)];
      g.fillRect(x, row * 128 + 124 - h, w, h);
      g.fillStyle = "#d8b04a"; g.fillRect(x + 2, row * 128 + 124 - h + 12, w - 4, 4);
      g.strokeStyle = "#140c08"; g.lineWidth = 3; g.strokeRect(x, row * 128 + 124 - h, w, h);
      x += w + 2;
    }
    g.fillStyle = "#5a3a24"; g.fillRect(0, row * 128 + 120, 512, 8);
  }
});

export class Office extends Room {
  constructor() {
    super();
    const shell = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = ROOM;
    const wall = twoTone(new THREE.MeshLambertMaterial({ map: paper() }));
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wood = lam("officeWood", () => ({ map: beam() }));
    const dark = lam("officeDark", () => ({ color: "#4a2e1e" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const glass = lam("officeGlass", () => ({ color: "#cfe4e6" }));
    const lid = lam("officeLid", () => ({ color: "#3a3030" }));
    const meat = lam("officeMeat", () => ({ color: "#c0505a" }));
    const green = lam("officeGreen", () => ({ color: "#6a9a4a" }));
    const bookM = lam("officeBooks", () => ({ map: books() }));
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), 3, 3), floor);
    shell.add(boxGeo(V(x0 - 0.3, 0, z0), V(x0, h, z1), 1.6), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.3, h, z1), 1.6), wall);
    shell.add(boxGeo(V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3), 1.6), wall);
    // back wall with a tall window (x -2.2..-1.2, y 0.9..2.6)
    const wx0 = -2.2, wx1 = -1.2, wy0 = 0.9, wy1 = 2.6;
    shell.add(boxGeo(V(x0 - 0.3, 0, z0 - 0.3), V(wx0, h, z0), 1.6), wall);
    shell.add(boxGeo(V(wx1, 0, z0 - 0.3), V(x1 + 0.3, h, z0), 1.6), wall);
    shell.add(boxGeo(V(wx0, 0, z0 - 0.3), V(wx1, wy0, z0), 1.6), wall);
    shell.add(boxGeo(V(wx0, wy1, z0 - 0.3), V(wx1, h, z0), 1.6), wall);
    shell.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), lam("officeCeil", () => ({ color: "#e8dcc4" })));
    shell.add(boxGeo(V(x0, 0, z0), V(x1, 0.18, z0 + 0.04)), dark); // skirting
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wy1 - wy0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.75, 1.9) }));
    pane.position.set((wx0 + wx1) / 2, (wy0 + wy1) / 2, z0 - 0.25); pane.layers.set(NOINK); this.root.add(pane);
    deco.add(boxGeo(V(wx0, (wy0 + wy1) / 2 - 0.03, z0 - 0.2), V(wx1, (wy0 + wy1) / 2 + 0.03, z0 - 0.14)), wood);
    deco.add(boxGeo(V((wx0 + wx1) / 2 - 0.03, wy0, z0 - 0.2), V((wx0 + wx1) / 2 + 0.03, wy1, z0 - 0.14)), wood);
    // desk, chair, papers
    const { x0: dx0, x1: dx1, z0: dz0, z1: dz1, top } = DESK;
    deco.add(boxGeo(V(dx0, top - 0.06, dz0), V(dx1, top, dz1)), wood);
    for (const [x, z] of [[dx0 + 0.06, dz0 + 0.06], [dx1 - 0.06, dz0 + 0.06], [dx0 + 0.06, dz1 - 0.06], [dx1 - 0.06, dz1 - 0.06]]) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, top - 0.06, z + 0.04)), dark);
    deco.add(boxGeo(V(-0.6, top, -2.6), V(-0.25, top + 0.004, -2.3)), lam("officePaper", () => ({ color: "#f2e8cf" })));
    // the brass microscope: foot, pillar, arm, tube, stage
    const [sx, sy, sz] = SCOPE;
    deco.add(cyl(0.09, 0.11, 0.03, 16), brass, at(sx, sy + 0.015, sz));
    deco.add(cyl(0.02, 0.02, 0.2), brass, at(sx, sy + 0.13, sz - 0.03));
    deco.add(boxGeo(V(-0.06, -0.006, -0.05), V(0.06, 0.006, 0.05)), dark, at(sx, sy + 0.14, sz + 0.02));
    deco.add(cyl(0.025, 0.03, 0.26), brass, at(sx, sy + 0.3, sz + 0.03, -0.25));
    deco.add(cyl(0.032, 0.032, 0.03), lid, at(sx, sy + 0.44, sz + 0.065, -0.25));
    // specimen jars on the desk: one red (meat), one green (the 'algae')
    for (const [x, c] of [[-0.55, meat], [-0.35, green]] as const) {
      deco.add(cyl(0.06, 0.06, 0.16, 14), glass, at(x, top + 0.08, -2.75));
      deco.add(cyl(0.045, 0.045, 0.08, 12), c, at(x, top + 0.05, -2.75));
      deco.add(cyl(0.065, 0.065, 0.03, 14), lid, at(x, top + 0.175, -2.75));
    }
    // bookcase on the left wall
    deco.add(boxGeo(V(x0, 0, -2.6), V(x0 + 0.4, 2.4, -0.6)), dark);
    shell.add(quad(V(x0 + 0.405, 0.1, -0.65), V(x0 + 0.405, 0.1, -2.55), V(x0 + 0.405, 2.3, -2.55), V(x0 + 0.405, 2.3, -0.65)), bookM);
    // a shelf of specimen jars on the right wall; the meat jar at JAR
    deco.add(boxGeo(V(x1 - 0.35, JAR[1] - 0.04, -1.2), V(x1, JAR[1], 1.6)), wood);
    deco.add(boxGeo(V(x1 - 0.35, JAR[1] + 0.56, -1.2), V(x1, JAR[1] + 0.6, 1.6)), wood);
    for (const [z, c, s] of [[-0.8, green, 0.8], [-0.2, glass, 1.0], [1.0, meat, 0.9], [1.35, glass, 0.7]] as const) {
      deco.add(cyl(0.08 * s, 0.08 * s, 0.24 * s, 14), glass, at(JAR[0] + 0.1, JAR[1] + 0.12 * s, z));
      deco.add(cyl(0.06 * s, 0.06 * s, 0.12 * s, 12), c, at(JAR[0] + 0.1, JAR[1] + 0.07 * s, z));
    }
    // an oil lamp on the desk (flame lit)
    deco.add(cyl(0.06, 0.08, 0.12, 12), brass, at(0.75, top + 0.06, -2.7));
    deco.add(cyl(0.04, 0.05, 0.14, 12), glass, at(0.75, top + 0.19, -2.7));
    this.flame(0.75, top + 0.2, -2.7, 0.04, 0.08, 2.4);
    shell.build(this.root, false);
    deco.build(this.root, true);
  }
}
