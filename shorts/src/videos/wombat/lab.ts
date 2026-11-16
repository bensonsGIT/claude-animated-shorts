// Two interiors for the wombat short.
// Lab: an engineering lab, Atlanta (Georgia Tech): grey-blue tile floor, pale walls, a black-topped bench across the
// room (BENCH), a whiteboard on the back wall (BOARD, its drawings are fx cards), a chest freezer, shelves of bottles,
// a window on the right wall and fluorescent ceiling panels. Floor y = 0; the near end open at z = 3.
// Stage: the prize ceremony: a timber stage, deep red pleated curtains behind, a lectern, a warm spotlight pool.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const LABR = { x0: -3.6, x1: 3.6, z0: -3.2, z1: 3.2, h: 3.0 };
export const BENCH = { x0: -1.35, x1: 1.35, z0: -1.05, z1: -0.25, top: 0.92 };
/** whiteboard drawing area: centre and size of the fx card on it (faces +z) */
export const BOARD = { c: [0, 1.66, -3.155] as V3, w: 1.92, h: 1.24 };
export const FREEZER: V3 = [2.55, 0, -2.45];

const tiles = () => ctex("wbTiles", 256, 256, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const v = r();
    g.fillStyle = v < 0.33 ? "#b4bcc4" : v < 0.66 ? "#aab3bc" : "#bec6cc"; g.fillRect(i * 64, j * 64, 64, 64);
    for (let k = 0; k < 30; k++) { g.fillStyle = "rgba(120,130,140,0.35)"; g.fillRect(i * 64 + r() * 64, j * 64 + r() * 64, 2, 2); }
  }
  g.strokeStyle = "rgba(90,100,110,0.45)"; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
});
const curtainTex = () => ctex("wbCurtain", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 256, 0);
  for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? "#5a0e18" : "#a8202e");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});

export class Lab extends Room {
  constructor() {
    super();
    const shell = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = LABR;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: tiles() }));
    const wall = lam("wbWall", () => ({ color: "#dfe6e0" }));
    const skirt = lam("wbSkirt", () => ({ color: "#6a7480" }));
    const ceil = lam("wbCeil", () => ({ color: "#eef0ee" }));
    const black = lam("wbBenchTop", () => ({ color: "#2c2e34" }));
    const cab = lam("wbCabinet", () => ({ color: "#f2f2ee" }));
    const handle = lam("wbHandle", () => ({ color: "#8a929a" }));
    const alu = lam("wbAlu", () => ({ color: "#b8bec4" }));
    const white = lam("wbBoard", () => ({ color: "#fbfbf8" }));
    const steel = lam("wbSteel", () => ({ color: "#9aa2aa" }));
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 1.2, (z1 - z0) / 1.2), floor);
    for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)],
      [V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3)]] as const) {
      shell.add(boxGeo(a, V(b.x, 0.12, b.z)), skirt);
      shell.add(boxGeo(V(a.x, 0.12, a.z), b), wall);
    }
    shell.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), ceil);
    // fluorescent panels (unlit, bright)
    for (const [x, z] of [[-1.6, -1.8], [1.6, -1.8], [-1.6, 1.0], [1.6, 1.0]]) {
      const m = new THREE.Mesh(quad(V(x - 0.6, h - 0.01, z - 0.3), V(x - 0.6, h - 0.01, z + 0.3), V(x + 0.6, h - 0.01, z + 0.3), V(x + 0.6, h - 0.01, z - 0.3)),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.85, 1.9) }));
      m.layers.set(NOINK); this.root.add(m);
    }
    // the whiteboard: aluminium frame, white face, a pen tray
    const { c, w, h: bh } = BOARD;
    deco.add(boxGeo(V(c[0] - w / 2 - 0.05, c[1] - bh / 2 - 0.05, z0), V(c[0] + w / 2 + 0.05, c[1] + bh / 2 + 0.05, z0 + 0.03)), alu);
    deco.add(boxGeo(V(c[0] - w / 2, c[1] - bh / 2, z0), V(c[0] + w / 2, c[1] + bh / 2, z0 + 0.04)), white);
    deco.add(boxGeo(V(c[0] - 0.6, c[1] - bh / 2 - 0.08, z0), V(c[0] + 0.6, c[1] - bh / 2 - 0.05, z0 + 0.1)), alu);
    for (const [x, col] of [[-0.3, "#2a4ab0"], [-0.15, "#c02a2a"], [0.05, "#1a1a1e"]] as const)
      deco.add(cyl(0.012, 0.012, 0.13, 6), lam("wbPen" + col, () => ({ color: col })), at(c[0] + x, c[1] - bh / 2 - 0.035, z0 + 0.06, 0, 0, Math.PI / 2));
    // the bench: white cabinets under a black epoxy top, steel legs at the ends, a sink and tap at the left end
    const B = BENCH;
    deco.add(boxGeo(V(B.x0, 0.1, B.z0 + 0.04), V(B.x1, B.top - 0.04, B.z1 - 0.04)), cab);
    deco.add(boxGeo(V(B.x0 - 0.03, B.top - 0.04, B.z0 - 0.02), V(B.x1 + 0.03, B.top, B.z1 + 0.02)), black);
    deco.add(boxGeo(V(B.x0, 0, B.z0 + 0.08), V(B.x1, 0.1, B.z1 - 0.08)), skirt);
    for (let i = 0; i < 4; i++) {
      const xa = B.x0 + 0.06 + i * ((B.x1 - B.x0 - 0.12) / 4), xb = xa + (B.x1 - B.x0 - 0.12) / 4 - 0.04;
      deco.add(boxGeo(V(xa, 0.16, B.z1 - 0.045), V(xb, B.top - 0.1, B.z1 - 0.035)), cab);
      deco.add(boxGeo(V((xa + xb) / 2 - 0.08, B.top - 0.2, B.z1 - 0.035), V((xa + xb) / 2 + 0.08, B.top - 0.18, B.z1 - 0.015)), handle);
    }
    deco.add(cyl(0.015, 0.015, 0.35, 8), steel, at(B.x0 + 0.2, B.top + 0.17, B.z0 + 0.12));
    deco.add(cyl(0.012, 0.012, 0.16, 8), steel, at(B.x0 + 0.2, B.top + 0.34, B.z0 + 0.2, Math.PI / 2, 0, 0));
    // the chest freezer at the back right
    const [fx, , fz] = FREEZER;
    deco.add(boxGeo(V(fx - 0.6, 0, fz - 0.4), V(fx + 0.6, 0.86, fz + 0.4)), cab);
    deco.add(boxGeo(V(fx - 0.62, 0.86, fz - 0.42), V(fx + 0.62, 0.92, fz + 0.42)), lam("wbFreezerLid", () => ({ color: "#e6e8ea" })));
    deco.add(boxGeo(V(fx - 0.25, 0.8, fz + 0.4), V(fx + 0.25, 0.84, fz + 0.44)), handle);
    // shelves of bottles on the left wall
    for (const y of [1.1, 1.55, 2.0]) {
      deco.add(boxGeo(V(x0, y - 0.03, -2.6), V(x0 + 0.35, y, 0.2)), alu);
      for (let k = 0; k < 9; k++) {
        const col = ["#3a8ad0", "#d0a030", "#e8e8e0", "#4aa06a", "#b84a4a", "#8a6ad0"][(k + Math.round(y * 7)) % 6], hb = 0.14 + 0.08 * ((k * 7 + y * 10) % 3) / 2;
        deco.add(cyl(0.05, 0.05, hb, 10), lam("wbBottle" + col, () => ({ color: col })), at(x0 + 0.18, y + hb / 2, -2.4 + k * 0.3));
      }
    }
    // a lab stool and a microscope at the bench's right end
    deco.add(cyl(0.18, 0.18, 0.05, 14), black, at(-2.0, 0.7, 0.4));
    deco.add(cyl(0.025, 0.025, 0.68, 6), steel, at(-2.0, 0.34, 0.4));
    deco.add(cyl(0.2, 0.22, 0.03, 14), steel, at(-2.0, 0.02, 0.4));
    deco.add(boxGeo(V(1.0, B.top, -0.85), V(1.2, B.top + 0.03, -0.62)), black);
    deco.add(cyl(0.025, 0.025, 0.3, 8), black, at(1.12, B.top + 0.18, -0.8, 0.25, 0, 0));
    deco.add(cyl(0.035, 0.03, 0.14, 8), steel, at(1.12, B.top + 0.33, -0.72, -0.5, 0, 0));
    // a bright window on the right wall
    const wx = x1 - 0.02;
    const win = new THREE.Mesh(quad(V(wx, 1.0, -0.4), V(wx, 1.0, 1.4), V(wx, 2.4, 1.4), V(wx, 2.4, -0.4)), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.85, 2.0) }));
    win.layers.set(NOINK); this.root.add(win);
    deco.add(boxGeo(V(wx - 0.06, 0.94, -0.46), V(wx, 1.0, 1.46)), alu);
    deco.add(boxGeo(V(wx - 0.04, 1.68, -0.4), V(wx, 1.72, 1.4)), alu);
    shell.build(this.root, false);
    deco.build(this.root, true);
  }
}

export const STAGE = { x0: -6, x1: 6, z0: -3.6, z1: 4, h: 6 };
export const LECTERN: V3 = [1.25, 0, -1.7];
export class Stage extends Room {
  constructor() {
    super();
    const shell = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = STAGE;
    const planks = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const curtain = lam("wbCurtainM", () => ({ map: curtainTex() }));
    const dark = lam("wbStageDark", () => ({ color: "#1a1418" }));
    const wood = lam("wbLectern", () => ({ color: "#6a4228" }));
    const gold = lam("wbGold", () => ({ color: "#d8b04a" }));
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), planks);
    // pleated back curtain: a strip of vertical folds
    const n = 60, pos: number[] = [], uv: number[] = [];
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n;
      const za = z0 + 0.12 * Math.sin(i * 1.3), zb = z0 + 0.12 * Math.sin((i + 1) * 1.3);
      pos.push(xa, 0, za, xb, 0, zb, xb, h, zb, xa, 0, za, xb, h, zb, xa, h, za);
      const ua = i / 8, ub = (i + 1) / 8;
      uv.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); cg.computeVertexNormals();
    shell.add(cg, curtain);
    // side drapes, a pelmet, black walls beyond
    for (const s of [-1, 1]) deco.add(boxGeo(V(s < 0 ? x0 : x1 - 1.2, 0, z0 + 0.3), V(s < 0 ? x0 + 1.2 : x1, h, z0 + 0.8)), curtain);
    deco.add(boxGeo(V(x0, h - 1.0, z0 + 0.25), V(x1, h, z0 + 0.6)), curtain);
    deco.add(boxGeo(V(x0, h - 1.05, z0 + 0.6), V(x1, h - 0.95, z0 + 0.64)), gold);
    shell.add(boxGeo(V(x0 - 0.3, 0, z0 - 0.5), V(x0, h, z1)), dark);
    shell.add(boxGeo(V(x1, 0, z0 - 0.5), V(x1 + 0.3, h, z1)), dark);
    // stage front edge
    deco.add(boxGeo(V(x0, -0.6, z1 - 0.02), V(x1, 0, z1 + 0.05)), dark);
    // the lectern
    const [lx, , lz] = LECTERN;
    deco.add(boxGeo(V(lx - 0.3, 0, lz - 0.22), V(lx + 0.3, 1.05, lz + 0.22)), wood);
    deco.add(boxGeo(V(lx - 0.36, 1.05, lz - 0.28), V(lx + 0.36, 1.12, lz + 0.3)), wood);
    deco.add(cyl(0.012, 0.012, 0.35, 6), dark, at(lx - 0.1, 1.28, lz + 0.1, 0.5, 0, 0));
    deco.add(new THREE.SphereGeometry(0.035, 8, 6), dark, at(lx - 0.1, 1.45, lz + 0.2));
    shell.build(this.root, false);
    deco.build(this.root, true);
    // the spotlight pool on the floor + a haze glow up in the rig
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshBasicMaterial({ map: ctex("wbPool", 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, "rgba(255,236,190,0.55)"); gr.addColorStop(1, "rgba(255,236,190,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.012, -1.3); pool.layers.set(NOINK); this.root.add(pool);
    this.glow(0, 5.2, 1.5, 3.2, 0.35);
  }
}
