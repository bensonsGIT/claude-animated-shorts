// Siberia, the convict camp (Epilogue): snow everywhere, a frozen river along the far side (z < -14), a log palisade
// across z = -6 with an open gate at x -1.2..1.2, log barracks behind it, a brick kiln with a chimney and stacks of
// bricks on the near side where the convicts work, birch trees, a pale winter sky. Ground y = 0. Snowfall is a CSS
// overlay (index.tsx).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const GATE_S: V3 = [0, 0, -6];
export const KILN: V3 = [-6, 0, 1.5];

const snow = () => ctex("sbSnow", 512, 512, (g, r) => {
  g.fillStyle = "#eef2f6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(200,212,230,0.5)" : "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 24, 3 + r() * 10, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(170,182,200,0.5)"; g.lineWidth = 3; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 * (r() - 0.5), y + 18); g.stroke(); } // footprints / tracks
});
const logs = () => ctex("sbLogs", 256, 256, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = ["#7a5a3e", "#6a4c34", "#84644a"][Math.floor(r() * 3)]; g.fillRect(0, i * 32, 256, 32); g.fillStyle = "#3a2a1e"; g.fillRect(0, i * 32 + 28, 256, 4); }
});
const sky = () => ctex("sbSky", 64, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#9aa8bc"); gr.addColorStop(0.45, "#d8dee6"); gr.addColorStop(1, "#e8ecf0");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
});

export class Siberia extends Room {
  private dome: THREE.Mesh;
  private smoke: THREE.Mesh[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const sn = twoTone(new THREE.MeshLambertMaterial({ map: snow() }));
    const ice = twoTone(new THREE.MeshLambertMaterial({ color: "#c8d8e8" }));
    const logM = lam("sbLogM", () => ({ map: logs() })), log = lam("sbLog", () => ({ color: "#6a4c34" }));
    const snowCap = lam("sbCap", () => ({ color: "#f4f6fa" }));
    const brick = lam("sbBrick", () => ({ color: "#a8584a" })), dark = lam("sbDark", () => ({ color: "#2a2224" }));
    const birch = lam("sbBirch", () => ({ color: "#ece8e0" })), twig = lam("sbTwig", () => ({ color: "#5a4a40" }));
    b.add(quad(V(-200, 0, 200), V(200, 0, 200), V(200, 0, -14), V(-200, 0, -14), 60, 60), sn);
    b.add(quad(V(-200, -0.2, -14), V(200, -0.2, -14), V(200, -0.2, -40), V(-200, -0.2, -40), 20, 5), ice);
    b.add(quad(V(-200, 0, -40), V(200, 0, -40), V(200, 0, -200), V(-200, 0, -200), 60, 30), sn);
    // the palisade: sharpened upright logs across z = -6, a gap for the gate, gate towers
    for (let x = -30; x <= 30; x += 0.36) {
      if (Math.abs(x) < 1.25) continue;
      const hh = 3.6 + 0.25 * Math.sin(x * 7);
      deco.add(cyl(0.18, 0.18, hh, 7), log, at(x, hh / 2, -6));
      deco.add(new THREE.ConeGeometry(0.18, 0.4, 7), log, at(x, hh + 0.2, -6));
      fix.add(new THREE.SphereGeometry(0.17, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), snowCap, at(x, hh + 0.02, -6));
    }
    for (const s of [-1, 1]) { b.add(boxGeo(V(s * 1.3 - 0.4, 0, -6.4), V(s * 1.3 + 0.4, 5, -5.6)), logM); deco.add(new THREE.ConeGeometry(0.8, 1.2, 4).rotateY(Math.PI / 4), snowCap, at(s * 1.3, 5.6, -6)); }
    deco.add(boxGeo(V(-1.7, 4.4, -6.2), V(1.7, 4.7, -5.8)), logM);
    // barracks behind the palisade
    for (const [x, z] of [[-10, -11], [8, -11], [-1, -12]]) {
      b.add(boxGeo(V(x - 4, 0, z - 2), V(x + 4, 3, z + 2), 2), logM);
      const r = new THREE.ConeGeometry(1, 1, 4, 1); r.rotateY(Math.PI / 4); r.scale(8 * 0.74, 1.6, 4 * 0.74);
      deco.add(r, snowCap, at(x, 3.8, z));
      fix.add(boxGeo(V(x - 0.4, 0, z + 2), V(x + 0.4, 1.9, z + 2.04)), dark);
    }
    // the brick kiln on the near side, its chimney, stacks of bricks
    const [kx, , kz] = KILN;
    deco.add(boxGeo(V(kx - 1.6, 0, kz - 1.4), V(kx + 1.6, 2.2, kz + 1.4)), brick);
    deco.add(new THREE.SphereGeometry(1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 0.9), snowCap, at(kx, 2.2, kz));
    deco.add(cyl(0.35, 0.45, 4, 10), brick, at(kx + 0.8, 3.5, kz - 0.6));
    fix.add(boxGeo(V(kx - 0.5, 0.2, kz + 1.4), V(kx + 0.5, 1.1, kz + 1.43)), lam("sbFire", () => ({ color: "#e8702a" })));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) deco.add(boxGeo(V(kx + 3 + i * 0.6, j * 0.25, kz - 0.3), V(kx + 3.5 + i * 0.6, j * 0.25 + 0.22, kz + 0.6)), brick);
    // birches
    for (const [x, z, s] of [[-16, -2, 1.2], [14, -1, 1.3], [20, -18, 1.5], [-22, -20, 1.6], [24, 6, 1.2], [-24, 8, 1.3]] as const) {
      deco.add(cyl(0.12 * s, 0.18 * s, 6 * s, 8), birch, at(x, 3 * s, z));
      for (let k = 0; k < 6; k++) deco.add(cyl(0.02 * s, 0.04 * s, 2 * s, 4), twig, at(x + Math.cos(k * 1.1) * 0.6 * s, (4.2 + 0.4 * k) * s, z + Math.sin(k * 1.1) * 0.5 * s, 0.5 * Math.sin(k * 2), 0, 0.6 * Math.cos(k * 2)));
    }
    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(240, 24, 16), new THREE.MeshBasicMaterial({ map: sky(), side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    // chimney smoke: soft grey puffs rising
    const sm = ctex("sbSmoke", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(150,150,160,0.8)"); gr.addColorStop(1, "rgba(150,150,160,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sm, transparent: true, depthWrite: false }));
      m.layers.set(NOINK); this.root.add(m); this.smoke.push(m);
    }
  }
  pose(t: number, cam: THREE.Camera) {
    this.dome.position.copy(cam.position);
    const [kx, , kz] = KILN;
    this.smoke.forEach((m, i) => {
      const u = ((t * 0.15 + i / 6) % 1), sz = 0.8 + 2.5 * u;
      m.position.set(kx + 0.8 + u * 1.5, 5.6 + u * 5, kz - 0.6); m.scale.set(sz, sz, 1); m.quaternion.copy(cam.quaternion);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - u);
    });
  }
}
