// The House of Representatives, 1932 (the green chamber): timber-panelled walls with cream plaster above, tall bright
// windows high on the side walls, three tiers of green leather benches down each side (x = +-2.4 .. +-4.6), the Clerk's
// table in the middle with papers, the Speaker's chair under a carved canopy at the far end (z = -8.6), and a place on
// the back wall above it for the coat-of-arms crest (an fx card, CREST). Floor y = 0, the near end open at z = 6.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, at } from "../../engine/hall";
import type { V3 } from "./story";

export const HOUSE = { x0: -7, x1: 7, z0: -10, z1: 7, h: 7 };
/** bench tiers: seat top y and inner x per tier; seats run z -6 .. 4 */
export const BENCH = { tiers: [[0.45, 2.4], [0.85, 3.2], [1.25, 4.0]] as [number, number][], z0: -6, z1: 4 };
/** the crest's centre on the back wall (an upright card facing +z) */
export const CREST: V3 = [0, 4.7, -9.9];

const carpet = () => ctex("houseCarpet", 256, 256, (g, r) => {
  g.fillStyle = "#3e6a4a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,80,50,0.5)" : "rgba(90,130,90,0.4)"; g.fillRect(r() * 256, r() * 256, 3, 3); }
  g.strokeStyle = "rgba(200,180,110,0.35)"; g.lineWidth = 4; g.strokeRect(10, 10, 236, 236);
});
const panels = () => ctex("housePanels", 256, 256, (g) => {
  g.fillStyle = "#8a5a36"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#5a3820"; g.lineWidth = 8;
  for (const x of [0, 128]) for (const y of [0, 128]) { g.strokeRect(x + 14, y + 14, 100, 100); g.fillStyle = "#94643e"; g.fillRect(x + 20, y + 20, 88, 88); }
});

export class Parliament extends Room {
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = HOUSE;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: carpet() }));
    const panel = lam("housePanel", () => ({ map: panels() }));
    const plaster = lam("housePlaster", () => ({ color: "#e8dcc0" }));
    const ceil = lam("houseCeil", () => ({ color: "#d8c8a4" }));
    const wood = lam("houseWood", () => ({ map: beam() }));
    const dark = lam("houseDark", () => ({ color: "#4a2e1c" }));
    const leather = lam("houseLeather", () => ({ color: "#2f6a44" }));
    const leather2 = lam("houseLeather2", () => ({ color: "#286040" }));
    const paper = lam("housePaper", () => ({ color: "#f2ead6" }));
    const gilt = twoTone(new THREE.MeshPhongMaterial({ color: "#d9b04c", specular: "#fff2c4", shininess: 80 }), 0.2);
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 3, (z1 - z0) / 3), floor);
    for (const [a, b] of [[V(x0 - 0.5, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.5, h, z1)], [V(x0 - 0.5, 0, z0 - 0.5), V(x1 + 0.5, h, z0)],
      [V(x0 - 0.5, 0, z1), V(x1 + 0.5, h, z1 + 0.5)]] as const) {
      shell.add(boxGeo(a, V(b.x, 2.6, b.z), 1.3), panel);
      shell.add(boxGeo(V(a.x, 2.6, a.z), b, 2.5), plaster);
    }
    shell.add(boxGeo(V(x0 - 0.5, h, z0 - 0.5), V(x1 + 0.5, h + 0.4, z1 + 0.5), 0, true), ceil);
    for (const s of [-1, 1]) { const xw = s < 0 ? x0 : x1; fix.add(boxGeo(V(Math.min(xw, xw - s * 0.12), 2.55, z0), V(Math.max(xw, xw - s * 0.12), 2.7, z1)), dark); }
    fix.add(boxGeo(V(x0, 2.55, z0), V(x1, 2.7, z0 + 0.12)), dark);
    // high bright windows on both side walls
    for (const s of [-1, 1]) for (const z of [-6, -2, 2]) {
      const x = s < 0 ? x0 + 0.02 : x1 - 0.02, w = 1.4, y0 = 3.6, y1 = 6.2;
      const g = s < 0 ? quad(V(x, y0, z + w / 2), V(x, y0, z - w / 2), V(x, y1, z - w / 2), V(x, y1, z + w / 2)) : quad(V(x, y0, z - w / 2), V(x, y0, z + w / 2), V(x, y1, z + w / 2), V(x, y1, z - w / 2));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.85, 1.7) })); m.layers.set(NOINK); this.root.add(m);
      fix.add(boxGeo(V(Math.min(x, x - s * 0.1), y0 - 0.1, z - w / 2 - 0.1), V(Math.max(x, x - s * 0.1), y0, z + w / 2 + 0.1)), dark);
    }
    // three tiers of green benches each side (a riser + a seat + a back), seats along z
    const { z0: bz0, z1: bz1 } = BENCH;
    for (const s of [-1, 1]) BENCH.tiers.forEach(([top, xin], i) => {
      const xa = s * xin, xb = s * (xin + 0.75), xl = Math.min(xa, xb), xr = Math.max(xa, xb);
      deco.add(boxGeo(V(xl, 0, bz0), V(xr, top - 0.1, bz1)), wood); // riser
      deco.add(boxGeo(V(xl, top - 0.1, bz0), V(xr, top, bz1)), i % 2 ? leather2 : leather); // seat
      const xback = s * (xin + 0.72);
      deco.add(boxGeo(V(Math.min(xback, xback + s * 0.08), top, bz0), V(Math.max(xback, xback + s * 0.08), top + 0.55, bz1)), i % 2 ? leather2 : leather);
    });
    // the Clerk's table: a long table down the middle with green cloth and stacks of papers, a dispatch box at each side
    deco.add(boxGeo(V(-0.7, 0.74, -6), V(0.7, 0.8, 1)), wood);
    deco.add(boxGeo(V(-0.66, 0.8, -5.9), V(0.66, 0.81, 0.9)), leather);
    for (const [x, z] of [[-0.6, -5.9], [0.6, -5.9], [-0.6, 0.9], [0.6, 0.9]]) deco.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, 0.74, z + 0.05)), dark);
    for (let i = 0; i < 6; i++) deco.add(boxGeo(V(-0.4 + (i % 2) * 0.55, 0.81, -5 + i * 0.9), V(-0.1 + (i % 2) * 0.55, 0.85 + 0.04 * (i % 3), -4.6 + i * 0.9)), paper);
    for (const s of [-1, 1]) deco.add(boxGeo(V(s * 0.35 - 0.2, 0.81, 0.2), V(s * 0.35 + 0.2, 1.0, 0.6)), wood);
    // the Speaker's chair under a carved canopy, raised on a dais
    deco.add(boxGeo(V(-1.6, 0, -9.6), V(1.6, 0.3, -7.6)), wood);
    deco.add(boxGeo(V(-0.55, 0.3, -9.3), V(0.55, 0.85, -8.5)), leather);
    deco.add(boxGeo(V(-0.6, 0.3, -9.6), V(0.6, 3.0, -9.35)), dark);
    for (const s of [-1, 1]) deco.add(boxGeo(V(s * 0.75 - 0.08, 0.3, -9.5), V(s * 0.75 + 0.08, 3.3, -9.34)), wood);
    deco.add(boxGeo(V(-0.95, 3.3, -9.7), V(0.95, 3.55, -8.6)), wood);
    deco.add(new THREE.ConeGeometry(0.6, 0.6, 4), wood, at(0, 3.85, -9.2, 0, Math.PI / 4, 0));
    fix.add(boxGeo(V(-1.25, 3.95, -9.95), V(1.25, 5.45, -9.9)), gilt); // a gilt frame behind the crest card
    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
}
