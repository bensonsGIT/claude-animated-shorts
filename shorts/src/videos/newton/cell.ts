// Newgate, March 1699: a condemned cell. Rough dark stone, a straw-strewn floor, one small barred window high in the
// back wall (cold moonlight), a plank bench with a blanket, an iron ring and chain on the wall, a stool with a stub of
// candle, ink and paper. Floor y = 0, x (-2.2..2.2), z (-2.6 back wall .. 2), ceiling 3.0 m.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, stoneHD, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";
import type { V3 } from "./story";

export const CELL = { x0: -2.2, x1: 2.2, z0: -2.6, z1: 2, h: 3.0 };
export const STOOL: V3 = [0.75, 0, -1.55];
/** where the noose shadow falls on the back wall */
export const NOOSE_AT: V3 = [-1.15, 1.75, -2.585];

const straw = () => ctex("cellStraw", 512, 512, (g, r) => {
  g.fillStyle = "#6e6258"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI, l = 10 + r() * 26;
    g.strokeStyle = r() < 0.6 ? "rgba(214,178,98,0.8)" : "rgba(170,136,70,0.8)"; g.lineWidth = 2 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
});

export class Cell extends Room {
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = CELL;
    const wall = lam("cellWall", () => ({ map: stoneHD("cellWall", ["#7c7884", "#716d7a", "#86828e", "#6a6672", "#78748a"], "#46424e") }));
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: straw() }));
    const oak = lam("cellOak", () => ({ map: beam() }));
    const dark = lam("cellDark", () => ({ color: "#3a2a22" }));
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 50 }), 0.15);
    const wax = lam("cellWax", () => ({ color: "#f0e6cc" }));
    const blanket = lam("cellBlanket", () => ({ color: "#6a5a4a" }));

    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 1.6, (z1 - z0) / 1.6), floor);
    shell.add(boxGeo(V(x0 - 0.5, 0, z0), V(x0, h, z1), 1.6), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.5, h, z1), 1.6), wall);
    shell.add(boxGeo(V(x0 - 0.5, 0, z1), V(x1 + 0.5, h, z1 + 0.5), 1.6), wall);
    // back wall around a small window (x 0.35..1.05, y 2.0..2.55)
    const wx0 = 0.35, wx1 = 1.05, wy0 = 2.0, wy1 = 2.55;
    shell.add(boxGeo(V(x0 - 0.5, 0, z0 - 0.5), V(wx0, h, z0), 1.6), wall);
    shell.add(boxGeo(V(wx1, 0, z0 - 0.5), V(x1 + 0.5, h, z0), 1.6), wall);
    shell.add(boxGeo(V(wx0, 0, z0 - 0.5), V(wx1, wy0, z0), 1.6), wall);
    shell.add(boxGeo(V(wx0, wy1, z0 - 0.5), V(wx1, h, z0), 1.6), wall);
    shell.add(boxGeo(V(x0 - 0.5, h, z0 - 0.5), V(x1 + 0.5, h + 0.3, z1 + 0.5), 0, true), lam("cellCeil", () => ({ color: "#3e3a44" })));
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wy1 - wy0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.7, 1.25) }));
    moon.position.set((wx0 + wx1) / 2, (wy0 + wy1) / 2, z0 - 0.45); moon.layers.set(NOINK); this.root.add(moon);
    for (let i = 1; i < 4; i++) { const x = wx0 + ((wx1 - wx0) * i) / 4; fix.add(cyl(0.022, 0.022, wy1 - wy0, 8), iron, at(x, (wy0 + wy1) / 2, z0 - 0.06)); }
    fix.add(boxGeo(V(wx0, wy0 + 0.25, z0 - 0.09), V(wx1, wy0 + 0.29, z0 - 0.03)), iron);
    // iron ring + chain on the left wall
    fix.add(new THREE.TorusGeometry(0.1, 0.022, 6, 16), iron, at(x0 + 0.04, 1.1, -0.9, 0, Math.PI / 2));
    for (let i = 0; i < 7; i++) fix.add(new THREE.TorusGeometry(0.045, 0.012, 6, 12), iron, at(x0 + 0.06, 1.0 - i * 0.075, -0.9, 0, (i % 2) * Math.PI / 2));
    // plank bench along the left wall with a blanket
    deco.add(boxGeo(V(x0, 0.42, -2.4), V(x0 + 0.6, 0.48, -0.4)), oak);
    for (const z of [-2.3, -0.5]) deco.add(boxGeo(V(x0 + 0.05, 0, z - 0.05), V(x0 + 0.55, 0.42, z + 0.05)), dark);
    deco.add(boxGeo(V(x0 + 0.05, 0.48, -2.2), V(x0 + 0.58, 0.54, -1.3)), blanket);
    // the stool: candle stub, ink pot, quill, a sheet of paper
    const [sx, , sz] = STOOL;
    deco.add(cyl(0.24, 0.24, 0.05, 14), oak, at(sx, 0.5, sz));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; deco.add(cyl(0.025, 0.025, 0.5), dark, at(sx + 0.15 * Math.cos(a), 0.25, sz + 0.15 * Math.sin(a), 0.12 * Math.sin(a), 0, -0.12 * Math.cos(a))); }
    deco.add(cyl(0.03, 0.032, 0.07), wax, at(sx + 0.1, 0.56, sz - 0.08));
    this.flame(sx + 0.1, 0.65, sz - 0.08, 0.07, 0.14, 2.6);
    this.glow(sx + 0.1, 0.66, sz - 0.08, 1.6, 0.45);
    deco.add(cyl(0.035, 0.04, 0.05), lam("cellInk", () => ({ color: "#22202a" })), at(sx - 0.1, 0.55, sz - 0.08));
    deco.add(boxGeo(V(sx - 0.12, 0.525, sz + 0.0), V(sx + 0.06, 0.527, sz + 0.2)), lam("cellPaper", () => ({ color: "#f2e8cf" })));

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
}
