// Two interiors for the Gatsby short.
// Cottage: Nick's small rented house (ch. 5), the tea in the rain: floral paper, a rain-streaked window on the back wall,
// a small round tea table (TEA) with a teapot and cups, two chairs, a mantelpiece with a clock. Floor y = 0, open at z = 2.6.
// Plaza: a hot hotel suite in New York (ch. 7): tall bright windows on the back wall, gold-green paper, a sofa, a table
// with a whisky bottle wrapped in a towel and glasses, an electric fan whose blades turn. Open at z = 3.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const COT = { x0: -3.2, x1: 3.2, z0: -3, z1: 2.6, h: 2.8 };
export const TEA: V3 = [0, 0.74, -0.9];
export const PLZ = { x0: -4.2, x1: 4.2, z0: -4, z1: 3, h: 3.6 };
export const PTABLE: V3 = [0, 0.72, -1.2];
export const FAN: V3 = [2.9, 0.95, -3.2];

const paper = (key: string, base: string, a: string, b: string) => ctex(key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = i * 64 + (j % 2) * 32 + 16, y = j * 64 + 24;
    g.fillStyle = a; for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(x + 7 * Math.cos(t), y + 7 * Math.sin(t), 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = b; g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = b; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 10); g.quadraticCurveTo(x + 10 * (r() - 0.5), y + 26, x, y + 38); g.stroke();
  }
});
const rainPane = () => ctex("gtRain", 256, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#8a9ab0"); gr.addColorStop(1, "#6a7a90");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(60,90,70,0.6)"; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(r() * 256, 220 + r() * 40, 30 + r() * 30, 26, 0, 0, Math.PI * 2); g.fill(); } // garden beyond
  for (let i = 0; i < 70; i++) { g.strokeStyle = "rgba(230,240,255,0.55)"; g.lineWidth = 1.5; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 14 + r() * 26); g.stroke(); g.fillStyle = "rgba(240,248,255,0.7)"; g.beginPath(); g.arc(x + 2, y + 16 + r() * 20, 2.2, 0, Math.PI * 2); g.fill(); }
});
const rug = () => ctex("gtRug", 256, 256, (g) => {
  g.fillStyle = "#8a3a3a"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#d8b06a"; g.lineWidth = 8; g.strokeRect(14, 14, 228, 228); g.lineWidth = 3; g.strokeRect(32, 32, 192, 192);
  g.fillStyle = "#2a4a6a"; g.beginPath(); g.ellipse(128, 128, 60, 40, 0, 0, Math.PI * 2); g.fill();
});

const shell = (B: Batch, d: { x0: number; x1: number; z0: number; z1: number; h: number }, floor: THREE.Material, wall: THREE.Material, skirt: THREE.Material, ceil: THREE.Material, t = 1.2) => {
  const { x0, x1, z0, z1, h } = d;
  B.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), floor);
  for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)]] as const) {
    B.add(boxGeo(a, V(b.x, 0.14, b.z)), skirt);
    B.add(boxGeo(V(a.x, 0.14, a.z), b, t), wall);
  }
  B.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), ceil);
};

export class Cottage extends Room {
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("gtPaper", () => ({ map: paper("gtPaperT", "#efe2c4", "#d88a9a", "#7a9a6a") }));
    const skirt = lam("gtSkirt", () => ({ color: "#f4efe4" })), ceil = lam("gtCeil", () => ({ color: "#f2ead8" }));
    const wood = lam("gtWood", () => ({ color: "#7a5236" })), white = lam("gtWhite", () => ({ color: "#f8f6f0" }));
    const cloth = lam("gtCloth", () => ({ color: "#f4f0e8" })), china = lam("gtChina", () => ({ color: "#f2f4f8" })), blue = lam("gtBlue", () => ({ color: "#4a6ab0" }));
    const brass = lam("gtBrass", () => ({ color: "#d9b04a" })), stone = lam("gtMantel", () => ({ color: "#d8d0c4" }));
    shell(s, COT, floor, wall, skirt, ceil);
    const rm = new THREE.Mesh(quad(V(-1.6, 0.004, 1.0), V(1.6, 0.004, 1.0), V(1.6, 0.004, -2.6), V(-1.6, 0.004, -2.6)), twoTone(new THREE.MeshLambertMaterial({ map: rug() })));
    rm.receiveShadow = true; this.root.add(rm);
    // the rain window on the back wall (right of centre), white frame and sash bars
    const w0 = 0.4, w1 = 2.2, y0 = 0.95, y1 = 2.35, z = COT.z0 + 0.02;
    const pane = new THREE.Mesh(quad(V(w0, y0, z), V(w1, y0, z), V(w1, y1, z), V(w0, y1, z)), new THREE.MeshBasicMaterial({ map: rainPane() }));
    pane.layers.set(NOINK); this.root.add(pane);
    fix.add(boxGeo(V(w0 - 0.1, y0 - 0.12, COT.z0), V(w1 + 0.1, y0, COT.z0 + 0.14)), white);
    fix.add(boxGeo(V(w0 - 0.1, y1, COT.z0), V(w1 + 0.1, y1 + 0.1, COT.z0 + 0.08)), white);
    for (const x of [w0 - 0.05, (w0 + w1) / 2, w1 + 0.05]) fix.add(boxGeo(V(x - 0.04, y0, COT.z0), V(x + 0.04, y1, COT.z0 + 0.06)), white);
    fix.add(boxGeo(V(w0, (y0 + y1) / 2 - 0.03, COT.z0), V(w1, (y0 + y1) / 2 + 0.03, COT.z0 + 0.06)), white);
    // fireplace + mantel with the clock (left of the back wall)
    deco.add(boxGeo(V(-2.6, 0, COT.z0), V(-0.8, 1.15, COT.z0 + 0.3)), stone);
    fix.add(boxGeo(V(-2.3, 0, COT.z0 + 0.3), V(-1.1, 0.8, COT.z0 + 0.32)), lam("gtHearth", () => ({ color: "#2a2228" })));
    deco.add(boxGeo(V(-2.75, 1.15, COT.z0), V(-0.65, 1.22, COT.z0 + 0.4)), stone);
    deco.add(boxGeo(V(-1.9, 1.22, COT.z0 + 0.1), V(-1.5, 1.6, COT.z0 + 0.3)), wood);
    deco.add(cyl(0.15, 0.15, 0.04, 16), cloth, at(-1.7, 1.42, COT.z0 + 0.32, Math.PI / 2, 0, 0));
    // tea table: round top on a pedestal, a cloth, the teapot (blue and white), cups, a cake plate
    const [tx, ty, tz] = TEA;
    deco.add(cyl(0.55, 0.55, 0.05, 24), wood, at(tx, ty - 0.025, tz));
    deco.add(cyl(0.58, 0.62, 0.12, 24), cloth, at(tx, ty - 0.03, tz));
    deco.add(cyl(0.06, 0.1, ty - 0.05, 8), wood, at(tx, (ty - 0.05) / 2, tz));
    deco.add(cyl(0.3, 0.3, 0.04, 12), wood, at(tx, 0.02, tz));
    deco.add(new THREE.SphereGeometry(0.13, 14, 10), blue, at(tx + 0.12, ty + 0.13, tz - 0.12).scale(V(1, 0.85, 1)));
    deco.add(cyl(0.03, 0.015, 0.16, 8), blue, at(tx + 0.27, ty + 0.15, tz - 0.12, 0, 0, -0.9));
    deco.add(new THREE.TorusGeometry(0.06, 0.015, 6, 12), blue, at(tx - 0.02, ty + 0.15, tz - 0.12));
    deco.add(new THREE.SphereGeometry(0.03, 8, 6), white, at(tx + 0.12, ty + 0.25, tz - 0.12));
    for (const [cx, cz] of [[-0.25, 0.1], [0.28, 0.18]]) { deco.add(cyl(0.05, 0.04, 0.06, 10), china, at(tx + cx, ty + 0.03, tz + cz)); deco.add(cyl(0.09, 0.09, 0.01, 12), china, at(tx + cx, ty + 0.005, tz + cz)); }
    deco.add(cyl(0.16, 0.16, 0.015, 14), china, at(tx - 0.12, ty + 0.01, tz - 0.25));
    deco.add(cyl(0.1, 0.1, 0.08, 14), lam("gtCake", () => ({ color: "#f0d8a8" })), at(tx - 0.12, ty + 0.055, tz - 0.25));
    // two chairs
    for (const [cx, cz, ry] of [[-0.95, -0.7, 0.3], [0.95, -0.6, -0.3]] as const) {
      const g = new THREE.Group(), cb = new Batch();
      cb.add(boxGeo(V(-0.24, 0.44, -0.22), V(0.24, 0.5, 0.22)), wood);
      for (const [a, c] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) cb.add(boxGeo(V(a - 0.025, 0, c - 0.025), V(a + 0.025, 0.44, c + 0.025)), wood);
      cb.add(boxGeo(V(-0.24, 0.5, -0.24), V(0.24, 1.05, -0.2)), wood);
      cb.build(g, true); g.position.set(cx, 0, cz); g.rotation.y = ry; this.root.add(g);
    }
    // a side table on the right with a lamp
    deco.add(boxGeo(V(2.3, 0, -2.6), V(3.0, 0.7, -1.9)), wood);
    deco.add(cyl(0.05, 0.08, 0.4, 8), brass, at(2.65, 0.9, -2.25));
    deco.add(cyl(0.12, 0.25, 0.28, 12, ), lam("gtShade", () => ({ color: "#f2d8a8" })), at(2.65, 1.22, -2.25));
    // a framed picture
    fix.add(boxGeo(V(-2.5, 1.65, COT.z0), V(-1.0, 2.4, COT.z0 + 0.04)), brass);
    fix.add(boxGeo(V(-2.42, 1.72, COT.z0 + 0.01), V(-1.08, 2.33, COT.z0 + 0.05)), lam("gtPic", () => ({ color: "#7a9a8a" })));
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
}

export class Plaza extends Room {
  private blades = new THREE.Group();
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("plPaper", () => ({ map: paper("plPaperT", "#d8d4a8", "#c8b878", "#9aa070") }));
    const skirt = lam("plSkirt", () => ({ color: "#f4efe4" })), ceil = lam("plCeil", () => ({ color: "#f6f0e2" }));
    const wood = lam("plWood", () => ({ color: "#5a3a26" })), white = lam("plWhite", () => ({ color: "#f8f6f0" }));
    const velvet = lam("plVelvet", () => ({ color: "#8a2a3a" })), gold = lam("plGold", () => ({ color: "#d9b04a" }));
    const glassM = lam("plGlass", () => ({ color: "#c8d8e0" })), amber = lam("plAmber", () => ({ color: "#c8822a" })), steel = lam("plSteel", () => ({ color: "#6a7078" }));
    shell(s, PLZ, floor, wall, skirt, ceil);
    const rm = new THREE.Mesh(quad(V(-2.6, 0.004, 1.6), V(2.6, 0.004, 1.6), V(2.6, 0.004, -3.2), V(-2.6, 0.004, -3.2)), twoTone(new THREE.MeshLambertMaterial({ map: rug() })));
    rm.receiveShadow = true; this.root.add(rm);
    // two tall bright windows with heavy curtains
    for (const cx of [-2.0, 2.0]) {
      const w0 = cx - 0.7, w1 = cx + 0.7, y0 = 0.8, y1 = 3.1, z = PLZ.z0 + 0.02;
      const m = new THREE.Mesh(quad(V(w0, y0, z), V(w1, y0, z), V(w1, y1, z), V(w0, y1, z)), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.1, 1.95, 1.6) }));
      m.layers.set(NOINK); this.root.add(m);
      for (const x of [w0 - 0.05, cx, w1 + 0.05]) fix.add(boxGeo(V(x - 0.035, y0, PLZ.z0), V(x + 0.035, y1, PLZ.z0 + 0.06)), white);
      for (const y of [y0 + 0.77, y0 + 1.54]) fix.add(boxGeo(V(w0, y - 0.03, PLZ.z0), V(w1, y + 0.03, PLZ.z0 + 0.06)), white);
      for (const sd of [-1, 1]) deco.add(boxGeo(V(cx + sd * 0.95 - 0.22, 0.05, PLZ.z0 + 0.05), V(cx + sd * 0.95 + 0.22, 3.3, PLZ.z0 + 0.3)), velvet);
      fix.add(boxGeo(V(cx - 1.3, 3.3, PLZ.z0), V(cx + 1.3, 3.42, PLZ.z0 + 0.35)), gold);
    }
    // sofa against the left wall, an armchair right
    deco.add(boxGeo(V(-4.1, 0, -2.4), V(-3.3, 0.45, 0.4)), velvet);
    deco.add(boxGeo(V(-4.2, 0.45, -2.4), V(-3.95, 1.0, 0.4)), velvet);
    for (const z of [-2.4, 0.3]) deco.add(boxGeo(V(-4.1, 0.45, z), V(-3.3, 0.7, z + 0.15)), velvet);
    deco.add(boxGeo(V(3.0, 0, 0.2), V(3.8, 0.45, 1.0)), velvet); deco.add(boxGeo(V(3.6, 0.45, 0.2), V(3.85, 1.0, 1.0)), velvet);
    // the centre table: whisky bottle wrapped in a towel, glasses, a bucket of ice
    const [tx, ty, tz] = PTABLE;
    deco.add(boxGeo(V(tx - 0.9, ty - 0.05, tz - 0.5), V(tx + 0.9, ty, tz + 0.5)), wood);
    for (const [a, c] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) deco.add(boxGeo(V(tx + a - 0.04, 0, tz + c - 0.04), V(tx + a + 0.04, ty - 0.05, tz + c + 0.04)), wood);
    deco.add(cyl(0.08, 0.08, 0.32, 10), amber, at(tx - 0.3, ty + 0.16, tz - 0.1));
    deco.add(cyl(0.11, 0.1, 0.22, 10), white, at(tx - 0.3, ty + 0.14, tz - 0.1)); // the towel round the bottle
    deco.add(cyl(0.03, 0.03, 0.1, 8), amber, at(tx - 0.3, ty + 0.37, tz - 0.1));
    for (const [gx, gz] of [[0.1, 0.1], [0.3, -0.15], [0.5, 0.15]]) deco.add(cyl(0.045, 0.04, 0.11, 10), glassM, at(tx + gx, ty + 0.055, tz + gz));
    deco.add(cyl(0.13, 0.11, 0.18, 12), steel, at(tx - 0.65, ty + 0.09, tz + 0.15));
    // the electric fan on a side table by the window (blades turn in update)
    const [fx, fy, fz] = FAN;
    deco.add(boxGeo(V(fx - 0.4, 0, fz - 0.4), V(fx + 0.4, fy - 0.25, fz + 0.4)), wood);
    deco.add(cyl(0.16, 0.2, 0.06, 14), steel, at(fx, fy - 0.22, fz));
    deco.add(cyl(0.03, 0.03, 0.3, 6), steel, at(fx, fy - 0.05, fz));
    deco.add(cyl(0.08, 0.08, 0.16, 12), steel, at(fx, fy + 0.12, fz + 0.02, Math.PI / 2, 0, 0));
    deco.add(new THREE.TorusGeometry(0.3, 0.012, 6, 28), gold, at(fx, fy + 0.12, fz + 0.16));
    const bb = new Batch();
    for (let i = 0; i < 4; i++) bb.add(new THREE.SphereGeometry(0.13, 10, 6).scale(1, 0.45, 0.12).translate(0.15, 0, 0), gold, new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2));
    bb.build(this.blades, false);
    this.blades.position.set(fx, fy + 0.12, fz + 0.13); this.root.add(this.blades);
    // a chandelier
    deco.add(cyl(0.02, 0.02, 0.6, 4), gold, at(0, PLZ.h - 0.3, -1.2));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; deco.add(new THREE.SphereGeometry(0.06, 8, 6), glassM, at(0.3 * Math.cos(a), PLZ.h - 0.62, -1.2 + 0.3 * Math.sin(a))); }
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
  update(t: number) { super.update(t); this.blades.rotation.z = -t * 14; }
}
