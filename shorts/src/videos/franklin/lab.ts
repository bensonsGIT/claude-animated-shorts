// The 2010 forensics lab: pale mint walls, grey vinyl tile floor, white ceiling with fluorescent panels, a steel exam
// table under a surgical lamp holding the opened coffin, counters with a microscope, bottles and a monitor whose
// text-free chart shows two equal bars (copper, zinc). Floor y = 0, exam table centred at (0, -3).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";

export const LAB = { x0: -6, x1: 6, z0: -9, z1: 6, h: 3.2 };
export const EXAM = { x: 0, z: -3, top: 0.9, w: 0.95, l: 2.3 };

const vinyl = () => ctex("labVinyl", 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const v = 214 + Math.round(r() * 14);
    g.fillStyle = `rgb(${v},${v + 2},${v + 4})`; g.fillRect(x * 128, y * 128, 128, 128);
  }
  g.strokeStyle = "#9aa2a6"; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
const screen = () => ctex("labScreen", 512, 320, (g) => {
  g.fillStyle = "#0f2a44"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#7fb0d8"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(60, 40); g.lineTo(60, 270); g.lineTo(470, 270); g.stroke();
  for (let y = 80; y < 270; y += 48) { g.strokeStyle = "rgba(127,176,216,0.3)"; g.beginPath(); g.moveTo(62, y); g.lineTo(470, y); g.stroke(); }
  g.fillStyle = "#d8813a"; g.fillRect(130, 110, 110, 160); // copper
  g.fillStyle = "#a9b4c2"; g.fillRect(290, 110, 110, 160); // zinc: equal parts
});

export class Lab extends Room {
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = LAB;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: vinyl() }));
    const paint = lam("labWall", () => ({ color: "#cfe3dc" }));
    const skirt = lam("labSkirt", () => ({ color: "#6f8a86" }));
    const ceil = lam("labCeil", () => ({ color: "#f2f4f4" }));
    const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#b9c0c8", specular: "#ffffff", shininess: 90 }), 0.2);
    const white = lam("labWhite", () => ({ color: "#f4f6f6" }));
    const counter = lam("labCounter", () => ({ color: "#3f4a52" }));
    const coffin = lam("labCoffin", () => ({ map: beam() }));
    const dark = lam("labDark", () => ({ color: "#22262c" }));
    const amber = lam("labAmber", () => ({ color: "#c27a2a" }));
    const blue = lam("labBlue", () => ({ color: "#3a78c8" }));
    const green = lam("labGreen", () => ({ color: "#4aa86a" }));
    const glow = (c: THREE.ColorRepresentation, k: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });

    // ---- shell ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 1.2, (z1 - z0) / 1.2), floor);
    for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)],
      [V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3)]] as const) shell.add(boxGeo(a, b), paint);
    shell.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), ceil);
    shell.add(boxGeo(V(x0, 0, z0), V(x1, 0.12, z0 + 0.03)), skirt);
    for (const xw of [x0, x1 - 0.03]) shell.add(boxGeo(V(xw, 0, z0), V(xw + 0.03, 0.12, z1)), skirt);
    // fluorescent ceiling panels (unlit, HDR: they bloom softly)
    for (const x of [-2.5, 0, 2.5]) for (const z of [-6.5, -3, 0.5, 4]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), glow("#f4f8ff", 1.6));
      m.rotation.x = Math.PI / 2; m.position.set(x, h - 0.01, z); m.layers.set(NOINK); this.root.add(m);
      fix.add(boxGeo(V(x - 0.66, h - 0.04, z - 0.36), V(x + 0.66, h - 0.005, z + 0.36)), steel);
    }

    // ---- exam table + opened coffin ----
    const { x: ex, z: ez, top, w, l } = EXAM;
    deco.add(boxGeo(V(ex - w / 2, top - 0.05, ez - l / 2), V(ex + w / 2, top, ez + l / 2)), steel);
    deco.add(cyl(0.09, 0.12, top - 0.05), steel, at(ex, (top - 0.05) / 2, ez));
    deco.add(cyl(0.35, 0.4, 0.05, 20), steel, at(ex, 0.025, ez));
    const cw = 0.62, cl = 1.9, ch = 0.32, t = 0.04, cy = top;
    deco.add(boxGeo(V(ex - cw / 2, cy, ez - cl / 2), V(ex + cw / 2, cy + 0.03, ez + cl / 2)), coffin);
    for (const s of [-1, 1]) {
      deco.add(boxGeo(V(ex + s * (cw / 2) - (s > 0 ? t : 0), cy, ez - cl / 2), V(ex + s * (cw / 2) + (s < 0 ? t : 0), cy + ch, ez + cl / 2)), coffin);
      deco.add(boxGeo(V(ex - cw / 2, cy, ez + s * (cl / 2) - (s > 0 ? t : 0)), V(ex + cw / 2, cy + ch, ez + s * (cl / 2) + (s < 0 ? t : 0))), coffin);
    }
    // surgical lamp: arm from the ceiling, a dish with a glowing face
    fix.add(cyl(0.025, 0.025, 1.0), steel, at(ex + 0.4, h - 0.5, ez));
    fix.add(cyl(0.38, 0.3, 0.12, 24), white, at(ex + 0.4, h - 1.06, ez));
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), glow("#ffffff", 2.2));
    lamp.rotation.x = Math.PI / 2; lamp.position.set(ex + 0.4, h - 1.13, ez); lamp.layers.set(NOINK); this.root.add(lamp);

    // ---- back counter: cabinets, worktop, microscope, bottles, monitor ----
    const bz = z0 + 0.35;
    deco.add(boxGeo(V(-4.8, 0, z0), V(4.8, 0.86, bz + 0.3)), white);
    deco.add(boxGeo(V(-4.85, 0.86, z0), V(4.85, 0.92, bz + 0.35)), counter);
    for (let x = -4.4; x < 4.8; x += 0.8) deco.add(boxGeo(V(x - 0.01, 0.12, bz + 0.3), V(x + 0.01, 0.8, bz + 0.31)), steel);
    // microscope
    deco.add(boxGeo(V(-2.2, 0.92, bz - 0.15), V(-1.9, 0.96, bz + 0.15)), dark);
    deco.add(boxGeo(V(-2.1, 0.96, bz - 0.12), V(-2.02, 1.32, bz - 0.04)), dark);
    deco.add(cyl(0.035, 0.03, 0.26), dark, at(-2.05, 1.32, bz + 0.04, -0.6));
    deco.add(cyl(0.05, 0.05, 0.03), steel, at(-2.05, 1.06, bz + 0.06));
    // bottles and flasks
    for (const [x, m, r, hh] of [[1.0, amber, 0.06, 0.24], [1.2, blue, 0.05, 0.2], [1.38, green, 0.07, 0.16], [3.3, amber, 0.05, 0.22], [3.5, white, 0.06, 0.28]] as const)
      deco.add(cyl(r, r, hh), m, at(x, 0.92 + hh / 2, bz));
    deco.add(new THREE.ConeGeometry(0.09, 0.2, 14), blue, at(3.0, 1.02, bz));
    // monitor with the copper / zinc chart
    deco.add(boxGeo(V(-0.05, 0.92, bz - 0.05), V(0.05, 1.12, bz + 0.05)), dark);
    deco.add(boxGeo(V(-0.48, 1.1, bz - 0.04), V(0.48, 1.7, bz + 0.02)), dark);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.52), new THREE.MeshBasicMaterial({ map: screen() }));
    scr.position.set(0, 1.4, bz + 0.03); scr.layers.set(NOINK); this.root.add(scr);
    // a wall cabinet + poster-free noticeboard (cork) for colour
    deco.add(boxGeo(V(-4.6, 1.6, z0), V(-2.8, 2.5, z0 + 0.35)), white);
    fix.add(boxGeo(V(2.0, 1.4, z0), V(3.8, 2.4, z0 + 0.03)), lam("labCork", () => ({ color: "#c79a5a" })));
    for (const [x, y, c] of [[2.3, 2.1, "#f4f0e4"], [2.9, 1.8, "#bfe3f4"], [3.4, 2.15, "#f8d8a0"]] as const)
      fix.add(boxGeo(V(x - 0.18, y - 0.22, z0 + 0.03), V(x + 0.18, y + 0.22, z0 + 0.04)), lam(`labNote${c}`, () => ({ color: c })));

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
}
