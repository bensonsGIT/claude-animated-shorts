// The Prague banquet (October 1601): red damask walls, black-and-white marble floor, moonlit tall windows, a long
// white-clothed table with gilded candelabras and high-backed velvet chairs, the host's gilded chair at the head.
// Floor at y = 0, table along z at x = 0 (head of the table at z = -9.8), windows on the left wall (x = -7).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";

export const BQ = { x0: -7, x1: 7, z0: -12, z1: 8, h: 7.5 };
export const BQ_TABLE = { w: 1.6, z0: -9, z1: 3, top: 0.8 };
/** chair marks along both sides (x = +-1.1); seat top 0.48 */
export const BQ_SEAT = { x: 1.1, top: 0.48, zs: [-8, -6.5, -5, -3.5, -2, -0.5, 1, 2.4] };
// Tycho's place (right side, z = -3.5) and his plate are story.ts MARK.bqSeat / MARK.bqPlate

const checker = () => ctex("marbleChecker", 1024, 1024, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const dark = (x + y) % 2 === 1;
    g.fillStyle = dark ? "#2c2833" : "#ece6da"; g.fillRect(x * 256, y * 256, 256, 256);
    g.strokeStyle = dark ? "rgba(120,110,140,0.35)" : "rgba(170,160,150,0.45)"; g.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.moveTo(x * 256 + r() * 256, y * 256); g.bezierCurveTo(x * 256 + r() * 256, y * 256 + 90, x * 256 + r() * 256, y * 256 + 170, x * 256 + r() * 256, y * 256 + 256); g.stroke();
    }
  }
  g.strokeStyle = "#1c1820"; g.lineWidth = 6;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i * 256); g.lineTo(1024, i * 256); g.stroke(); }
});
/** red silk damask: a repeating ogee lattice with a pomegranate motif, tone on tone */
const damask = () => ctex("damask", 512, 512, (g) => {
  g.fillStyle = "#8a1f2c"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#a4303c"; g.fillStyle = "#a4303c"; g.lineWidth = 10;
  for (const [ox, oy] of [[0, 0], [256, 256], [256, -256], [0, 512], [512, 0], [512, 512], [-256, 256], [256, 768]]) {
    g.beginPath(); g.ellipse(ox + 128, oy + 128, 92, 120, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(ox + 128, oy + 140, 34, 40, 0, 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(ox + 128 + s * 40, oy + 100, 20, 9, s * 0.6, 0, Math.PI * 2); g.fill(); }
  }
});
/** night window: deep blue with a moon glow in one corner and a leaded diamond lattice */
const nightGlass = () => ctex("nightGlass", 256, 512, (g) => {
  const gr = g.createRadialGradient(190, 120, 10, 190, 120, 300);
  gr.addColorStop(0, "#7d8fc4"); gr.addColorStop(0.25, "#33467e"); gr.addColorStop(1, "#141c3a");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(190, 120, 26, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#1a1620"; g.lineWidth = 5;
  for (let k = -512; k < 768; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k + 512, 0); g.lineTo(k, 512); g.stroke(); }
  g.lineWidth = 14; g.strokeRect(7, 7, 242, 498);
});

export class Banquet extends Room {
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = BQ;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: checker() }));
    const silk = lam("bqDamask", () => ({ map: damask() }));
    const panel = lam("bqPanel", () => ({ color: "#4a2a22" }));
    const ceil = lam("bqCeil", () => ({ color: "#3a2420" }));
    const gilt = twoTone(new THREE.MeshPhongMaterial({ color: "#d9b04c", specular: "#fff2c4", shininess: 80 }), 0.2);
    const wood = lam("wood", () => ({ map: beam() }));
    const cloth = lam("bqCloth", () => ({ color: "#f4efe4" }));
    const velvet = lam("bqVelvet", () => ({ color: "#2f4a7a" }));
    const hostVelvet = lam("bqHostVelvet", () => ({ color: "#7a1e2c" }));
    const pewter = twoTone(new THREE.MeshPhongMaterial({ color: "#c2c4cc", specular: "#ffffff", shininess: 60 }), 0.2);
    const wax = lam("hallWax", () => ({ color: "#f5ecd6" }));
    const goose = lam("bqGoose", () => ({ color: "#c47a3a" }));
    const grape = lam("hallGrape", () => ({ color: "#6a2f7a" }));
    const pear = lam("bqPear", () => ({ color: "#b8c24a" }));
    const apple = lam("hallApple", () => ({ color: "#c8343c" }));
    const jug = lam("bqJug", () => ({ color: "#3c6a8a" }));
    const glass = new THREE.MeshBasicMaterial({ map: nightGlass() });

    // ---- shell: checker floor, panelled lower walls, damask above, gilt cornice, coffered ceiling ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2, (z1 - z0) / 2), floor);
    for (const [a, b] of [[V(x0 - 0.5, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.5, h, z1)], [V(x0 - 0.5, 0, z0 - 0.5), V(x1 + 0.5, h, z0)],
      [V(x0 - 0.5, 0, z1), V(x1 + 0.5, h, z1 + 0.5)]] as const) {
      shell.add(boxGeo(a, V(b.x, 1.4, b.z)), panel);
      shell.add(boxGeo(V(a.x, 1.4, a.z), b, 2.2), silk);
    }
    shell.add(boxGeo(V(x0 - 0.5, h, z0 - 0.5), V(x1 + 0.5, h + 0.4, z1 + 0.5), 0, true), ceil);
    for (const s of [-1, 1]) {
      const xw = s < 0 ? x0 : x1;
      fix.add(boxGeo(V(Math.min(xw, xw - s * 0.18), h - 0.45, z0), V(Math.max(xw, xw - s * 0.18), h - 0.2, z1)), gilt);
      fix.add(boxGeo(V(Math.min(xw, xw - s * 0.1), 1.4, z0), V(Math.max(xw, xw - s * 0.1), 1.5, z1)), gilt);
    }
    fix.add(boxGeo(V(x0, h - 0.45, z0), V(x1, h - 0.2, z0 + 0.18)), gilt);
    for (let z = z0 + 2; z < z1; z += 2.5) fix.add(boxGeo(V(x0, h - 0.4, z - 0.12), V(x1, h, z + 0.12)), wood);

    // ---- tall moonlit windows on the left wall, gilt frames ----
    for (const z of [-9, -4.5, 0, 4.5]) {
      const w = 1.5, y0 = 1.9, y1 = 5.9, x = x0 + 0.02;
      const g = quad(V(x, y0, z + w / 2), V(x, y0, z - w / 2), V(x, y1, z - w / 2), V(x, y1, z + w / 2));
      const m = new THREE.Mesh(g, glass); m.layers.set(NOINK); this.root.add(m);
      fix.add(boxGeo(V(x0, y0 - 0.12, z - w / 2 - 0.12), V(x0 + 0.12, y0, z + w / 2 + 0.12)), gilt);
      fix.add(boxGeo(V(x0, y1, z - w / 2 - 0.12), V(x0 + 0.12, y1 + 0.12, z + w / 2 + 0.12)), gilt);
      for (const s of [-1, 1]) fix.add(boxGeo(V(x0, y0, z + s * (w / 2) - 0.06), V(x0 + 0.12, y1, z + s * (w / 2) + 0.06)), gilt);
    }

    // ---- the table: white cloth hanging to the floor, chairs, the host's gilded chair at the head ----
    const { w: tw, z0: ta, z1: tb, top } = BQ_TABLE;
    deco.add(boxGeo(V(-tw / 2 - 0.08, 0.12, ta - 0.08), V(tw / 2 + 0.08, top, tb + 0.08), 0), cloth);
    const chair = (x: number, z: number, face: number, host = false) => {
      const sx = host ? 0.36 : 0.26, back = host ? 2.3 : 1.65, mat = host ? hostVelvet : velvet;
      deco.add(boxGeo(V(x - sx, BQ_SEAT.top - 0.08, z - sx), V(x + sx, BQ_SEAT.top, z + sx)), mat);
      const bx = x + face * sx;
      deco.add(boxGeo(V(bx - 0.04, 0, z - sx), V(bx + 0.04, back, z + sx)), host ? gilt : wood);
      deco.add(boxGeo(V(bx - 0.06, BQ_SEAT.top + 0.15, z - sx + 0.06), V(bx + 0.06, back - 0.1, z + sx - 0.06)), mat);
      for (const dz of [-1, 1]) deco.add(boxGeo(V(x - face * sx - 0.03, 0, z + dz * (sx - 0.03) - 0.03), V(x - face * sx + 0.03, BQ_SEAT.top - 0.08, z + dz * (sx - 0.03) + 0.03)), wood);
      if (host) deco.add(new THREE.SphereGeometry(0.09, 10, 8), gilt, at(bx, back + 0.08, z));
    };
    for (const z of BQ_SEAT.zs) for (const s of [-1, 1]) chair(s * BQ_SEAT.x, z, s);
    // head of the table: the host's chair faces down the table (+z), its back toward the far wall
    deco.add(boxGeo(V(-0.36, BQ_SEAT.top - 0.08, ta - 1.16), V(0.36, BQ_SEAT.top, ta - 0.44)), hostVelvet);
    deco.add(boxGeo(V(-0.36, 0, ta - 1.24), V(0.36, 2.3, ta - 1.16)), gilt);
    deco.add(boxGeo(V(-0.3, BQ_SEAT.top + 0.15, ta - 1.18), V(0.3, 2.2, ta - 1.1)), hostVelvet);
    deco.add(new THREE.SphereGeometry(0.09, 10, 8), gilt, at(0, 2.38, ta - 1.2));

    // ---- the feast: gilded three-branch candelabras, plates + goblets at every seat, a goose, fruit, jugs ----
    for (let z = ta + 1.2; z < tb; z += 2.6) {
      deco.add(cyl(0.12, 0.14, 0.06), gilt, at(0, top + 0.03, z));
      deco.add(cyl(0.03, 0.04, 0.5), gilt, at(0, top + 0.31, z));
      deco.add(boxGeo(V(-0.26, top + 0.52, z - 0.025), V(0.26, top + 0.57, z + 0.025)), gilt);
      for (const dx of [-0.24, 0, 0.24]) {
        const y = top + (dx ? 0.66 : 0.72);
        deco.add(cyl(0.032, 0.032, dx ? 0.16 : 0.24), wax, at(dx, y - (dx ? 0 : 0.04), z));
        this.flame(dx, y + (dx ? 0.13 : 0.15), z, 0.08, 0.17, 2.6);
      }
    }
    for (const z of BQ_SEAT.zs) for (const s of [-1, 1]) {
      const x = s * 0.42;
      deco.add(cyl(0.16, 0.14, 0.02, 18), pewter, at(x, top + 0.01, z));
      deco.add(cyl(0.05, 0.03, 0.1), gilt, at(x + s * 0.02, top + 0.11, z + 0.3));
      deco.add(cyl(0.006, 0.006, 0.06), gilt, at(x + s * 0.02, top + 0.03, z + 0.3));
      deco.add(cyl(0.04, 0.045, 0.01), gilt, at(x + s * 0.02, top + 0.005, z + 0.3));
    }
    deco.add(cyl(0.38, 0.34, 0.03, 20), gilt, at(0, top + 0.015, -6.2));
    deco.add(new THREE.SphereGeometry(0.24, 16, 12), goose, at(0, top + 0.16, -6.2).scale(V(1.2, 0.7, 1.6)));
    for (const [z, m] of [[-0.6, grape], [1.8, pear], [-4.4, apple]] as const)
      for (let k = 0; k < 6; k++) deco.add(new THREE.SphereGeometry(0.055, 10, 8), m, at((k % 3 - 1) * 0.1, top + 0.06 + (k > 2 ? 0.08 : 0), z + (k > 2 ? 0 : 0.04)));
    for (const z of [-7.4, -2.8, 1.2]) {
      deco.add(cyl(0.07, 0.09, 0.26), jug, at(0.2, top + 0.13, z));
      deco.add(cyl(0.035, 0.06, 0.08), jug, at(0.2, top + 0.3, z));
    }

    // ---- two gilt chandeliers ----
    for (const z of [-6.5, -0.5]) {
      const y = 4.9;
      fix.add(new THREE.TorusGeometry(1.0, 0.05, 8, 36), gilt, at(0, y, z, Math.PI / 2));
      fix.add(new THREE.TorusGeometry(0.55, 0.04, 8, 30), gilt, at(0, y + 0.45, z, Math.PI / 2));
      fix.add(boxGeo(V(-0.02, y, z - 0.02), V(0.02, h - 0.4, z + 0.02)), gilt);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, cx = Math.cos(a), cz = z + Math.sin(a);
        fix.add(cyl(0.03, 0.03, 0.16), wax, at(cx, y + 0.1, cz));
        this.flame(cx, y + 0.26, cz, 0.08, 0.16, 2.6);
      }
    }
    // a great hearth glow behind the host (fire off-frame on the far wall)
    fix.add(boxGeo(V(-2.2, 0, z0), V(2.2, 2.9, z0 + 0.5)), gilt);
    fix.add(boxGeo(V(-1.7, 0.1, z0), V(1.7, 2.5, z0 + 0.06)), lam("hallSoot", () => ({ color: "#2a1a18" })));
    this.flame(-0.4, 0.6, z0 + 0.35, 0.7, 1.3, 3.2); this.flame(0.3, 0.68, z0 + 0.3, 0.85, 1.5, 3.4);
    this.glow(0, 1.1, z0 + 0.8, 4.0, 0.5);

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
}
