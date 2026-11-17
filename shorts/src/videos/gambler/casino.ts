// The Kursaal gaming salon at Roulettenburg (x 100, floor y 0): parquet, red damask walls with gilt pilasters and tall
// mirrors, three gas chandeliers, and one long roulette TABLE (x 97.4..102.6, z -0.9..0.9, top y 0.82) in green felt with
// a brass rail. The wheel itself is a flat effect card (library/gambler fxRoulette) laid on the felt at WHEEL; the betting
// layout (painted cells, no numerals) covers the right half. Players sit or stand on the far side (z ~ -1.3).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const CASINO: V3 = [100, 0, 0];
export const TOP_Y = 0.82;
export const WHEEL: V3 = [98.75, TOP_Y + 0.012, 0];
/** where a stake on zero lies (the green cell at the layout's left end), and the red cells' middle */
export const ZERO_CELL: V3 = [100.14, TOP_Y + 0.01, 0];
export const RED_CELL: V3 = [101.12, TOP_Y + 0.01, 0.54];

const damask = () => ctex("gbDamask", 512, 512, (g) => {
  g.fillStyle = "#7a1e26"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#8e2a30";
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const cx = x * 128 + (y % 2 ? 64 : 0) + 64, cy = y * 128 + 64;
    g.beginPath(); g.moveTo(cx, cy - 46); g.bezierCurveTo(cx + 40, cy - 30, cx + 30, cy + 20, cx, cy + 46); g.bezierCurveTo(cx - 30, cy + 20, cx - 40, cy - 30, cx, cy - 46); g.fill();
  }
  g.fillStyle = "#3a1a14"; g.fillRect(0, 440, 512, 72); g.fillStyle = "#d9a84a"; g.fillRect(0, 432, 512, 8); // dado + gilt rail
});
const felt = () => ctex("gbFelt", 1024, 512, (g) => {
  g.fillStyle = "#2f7a46"; g.fillRect(0, 0, 1024, 512);
  // the betting layout on the right half: a green zero cell, then 3 x 12 number cells marked red / black by a lozenge
  const x0 = 560, y0 = 96, cw = 34, ch = 106;
  g.strokeStyle = "#f2ecd8"; g.lineWidth = 4;
  g.fillStyle = "#3e9a5a"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 - 40, y0 + 1.5 * ch); g.lineTo(x0, y0 + 3 * ch); g.closePath(); g.fill(); g.stroke();
  const reds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) {
    const n = c * 3 + (3 - r), x = x0 + c * cw, y = y0 + r * ch;
    g.strokeRect(x, y, cw, ch);
    g.fillStyle = reds.has(n) ? "#c8282e" : "#1c1a20";
    g.beginPath(); g.ellipse(x + cw / 2, y + ch / 2, 9, 24, 0, 0, Math.PI * 2); g.fill();
  }
  for (let k = 0; k < 3; k++) { g.strokeRect(x0 + k * 4 * cw, y0 + 3 * ch, 4 * cw, 50); } // the dozens
  g.fillStyle = "#c8282e"; g.beginPath(); g.moveTo(x0 + 4.5 * cw, y0 + 3 * ch + 25); g.lineTo(x0 + 5.5 * cw, y0 + 3 * ch + 12); g.lineTo(x0 + 6.5 * cw, y0 + 3 * ch + 25); g.lineTo(x0 + 5.5 * cw, y0 + 3 * ch + 38); g.fill();
  g.fillStyle = "#1c1a20"; g.beginPath(); g.moveTo(x0 + 6.5 * cw, y0 + 3 * ch + 25); g.lineTo(x0 + 7.5 * cw, y0 + 3 * ch + 12); g.lineTo(x0 + 8.5 * cw, y0 + 3 * ch + 25); g.lineTo(x0 + 7.5 * cw, y0 + 3 * ch + 38); g.fill();
  // the wheel's sunken ring on the left half
  g.fillStyle = "#24603a"; g.beginPath(); g.arc(250, 256, 210, 0, Math.PI * 2); g.fill();
});

export class Casino extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const [cx, , cz] = CASINO;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wall = lam("gbDamaskW", () => ({ map: damask(), side: THREE.DoubleSide }));
    const gilt = lam("gbGilt", () => ({ color: "#d9a84a" })), mirror = lam("gbMirror", () => ({ color: "#b8c4d0", emissive: "#3a4450" }));
    const tableMat = lam("gbFeltM", () => ({ map: felt() })), rail = lam("gbRail", () => ({ color: "#6a3a1e" })), brass = lam("gbBrass", () => ({ color: "#e8c45a" }));
    const ceil = lam("gbCeil", () => ({ color: "#f0e2c0", side: THREE.DoubleSide })), crystal = lam("gbCrystal", () => ({ color: "#f8f0dc", emissive: "#8a7a50" }));

    b.add(quad(V(cx - 9, 0, cz + 9), V(cx + 9, 0, cz + 9), V(cx + 9, 0, cz - 6), V(cx - 9, 0, cz - 6), 4, 3), floor);
    b.add(quad(V(cx - 9, 0, cz - 6), V(cx + 9, 0, cz - 6), V(cx + 9, 6.5, cz - 6), V(cx - 9, 6.5, cz - 6), 4, 1.4), wall);
    for (const s of [-1, 1]) b.add(quad(V(cx + s * 9, 0, cz + 9), V(cx + s * 9, 0, cz - 6), V(cx + s * 9, 6.5, cz - 6), V(cx + s * 9, 6.5, cz + 9), 3, 1.4), wall);
    b.add(quad(V(cx - 9, 6.5, cz + 9), V(cx + 9, 6.5, cz + 9), V(cx + 9, 6.5, cz - 6), V(cx - 9, 6.5, cz - 6), 1, 1), ceil);
    // gilt pilasters and tall mirrors on the back wall
    for (let i = 0; i < 7; i++) {
      const x = cx - 7.5 + i * 2.5;
      fix.add(boxGeo(V(x - 0.18, 0, cz - 6), V(x + 0.18, 6.5, cz - 5.86)), gilt);
      if (i < 6 && i % 2 === 0) {
        const mx = x + 1.25;
        fix.add(boxGeo(V(mx - 0.75, 1.1, cz - 5.98), V(mx + 0.75, 4.6, cz - 5.9)), gilt);
        fix.add(boxGeo(V(mx - 0.62, 1.22, cz - 5.9), V(mx + 0.62, 4.48, cz - 5.88)), mirror);
      }
    }
    fix.add(boxGeo(V(cx - 9, 6.1, cz - 6), V(cx + 9, 6.5, cz - 5.7)), gilt); // cornice
    // the roulette table
    deco.add(boxGeo(V(cx - 2.6, TOP_Y - 0.08, cz - 0.9), V(cx + 2.6, TOP_Y, cz + 0.9)), rail);
    b.add(quad(V(cx - 2.45, TOP_Y + 0.002, cz + 0.75), V(cx + 2.45, TOP_Y + 0.002, cz + 0.75), V(cx + 2.45, TOP_Y + 0.002, cz - 0.75), V(cx - 2.45, TOP_Y + 0.002, cz - 0.75), 1, 1), tableMat);
    for (const s of [-1, 1]) {
      deco.add(boxGeo(V(cx - 2.6, TOP_Y, cz + s * 0.9 - 0.08), V(cx + 2.6, TOP_Y + 0.05, cz + s * 0.9 + 0.08)), rail);
      deco.add(boxGeo(V(cx + s * 2.6 - 0.08, TOP_Y, cz - 0.9), V(cx + s * 2.6 + 0.08, TOP_Y + 0.05, cz + 0.9)), rail);
    }
    deco.add(boxGeo(V(cx - 2.5, 0.1, cz - 0.8), V(cx + 2.5, TOP_Y - 0.08, cz + 0.8)), lam("gbTableSide", () => ({ color: "#4a2414" })));
    deco.add(boxGeo(V(cx - 2.62, TOP_Y + 0.05, cz + 0.84), V(cx + 2.62, TOP_Y + 0.07, cz + 0.88)), brass);
    // three chandeliers: a gilt ring, crystal drops and gas flames
    for (const x of [cx - 5, cx, cx + 5]) {
      const y = 4.9, z = cz + 0.5;
      fix.add(cyl(0.02, 0.02, 1.6, 6), gilt, at(x, y + 0.8, z));
      fix.add(new THREE.TorusGeometry(0.6, 0.05, 6, 24), gilt, at(x, y, z, Math.PI / 2));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, fx = x + 0.6 * Math.cos(a), fz = z + 0.6 * Math.sin(a);
        fix.add(new THREE.ConeGeometry(0.05, 0.16, 6), crystal, at(fx, y - 0.12, fz, Math.PI));
        this.flame(fx, y + 0.16, fz, 0.07, 0.15, 2.2);
      }
      this.glow(x, y + 0.1, z, 3.2, 0.5);
    }
    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
  pose() { this.setFlames(true); }
}
