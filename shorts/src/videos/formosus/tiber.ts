// The Tiber at Rome, 897: a muddy sand bank sloping into the river (near side, z > -1), the water out to a far bank
// at z = -34, and a painted backdrop of the city (Hadrian's round tomb, towers, old St Peter's gable, hills) with
// the sky, night (moon) or day. Water y = 0; the bank rises to y = 0.5 at z = 2 and stays flat behind.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room } from "../../engine/hall";
import type { V3 } from "./story";

export const BANK_Y = 0.5;
/** bank height at z (water line at z = -1.2) */
export const bankY = (z: number) => (z >= 2 ? BANK_Y : z <= -1.2 ? -0.05 : -0.05 + (BANK_Y + 0.05) * ((z + 1.2) / 3.2));
/** where the body washes up */
export const SHORE: V3 = [0.3, bankY(-0.35), -0.35];

const waterTex = () => ctex("tiberWater", 512, 512, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, w = 20 + r() * 60;
    g.strokeStyle = r() < 0.5 ? "rgba(255,255,255,0.5)" : "rgba(40,40,60,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const mud = () => ctex("tiberMud", 512, 512, (g, r) => {
  g.fillStyle = "#a08a68"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,100,72,0.5)" : "rgba(196,176,140,0.5)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 5, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 60; i++) { g.strokeStyle = "rgba(90,110,60,0.7)"; g.lineWidth = 3; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 10, y - 18 - r() * 16); g.stroke(); }
});
/** the city across the river: sky gradient, hills, walls, towers, the round mausoleum, a basilica gable; moon or sun */
const skyline = (night: boolean) => ctex(night ? "tiberNight" : "tiberDay", 2048, 1024, (g, r) => {
  const sky = g.createLinearGradient(0, 0, 0, 760);
  if (night) { sky.addColorStop(0, "#0e1438"); sky.addColorStop(0.6, "#25336a"); sky.addColorStop(1, "#4a4f86"); }
  else { sky.addColorStop(0, "#4f8cdb"); sky.addColorStop(0.6, "#8fb6ea"); sky.addColorStop(1, "#cfe0f4"); }
  g.fillStyle = sky; g.fillRect(0, 0, 2048, 1024);
  if (night) {
    for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,250,230,${0.4 + r() * 0.6})`; g.fillRect(r() * 2048, r() * 520, 3, 3); }
    g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(1500, 200, 70, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#25336a"; g.beginPath(); g.arc(1528, 186, 62, 0, Math.PI * 2); g.fill();
  } else {
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 420 + r() * 80, y = 140 + r() * 120;
      g.fillStyle = "#fbf8f1"; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 50, y + Math.sin(k) * 14, 70, 40, 0, 0, Math.PI * 2); g.fill(); }
    }
  }
  const far = night ? "#33305a" : "#8fa0b8", mid = night ? "#2a2848" : "#b8a88a", near = night ? "#1e1c36" : "#c8b48e", ink = "#141018";
  // hills
  g.fillStyle = far; g.beginPath(); g.moveTo(0, 760);
  for (let x = 0; x <= 2048; x += 64) g.lineTo(x, 640 - 70 * Math.sin(x / 260) - 30 * Math.sin(x / 90));
  g.lineTo(2048, 1024); g.lineTo(0, 1024); g.fill();
  // city wall + buildings
  const bld = (x: number, w: number, h: number, c: string, roof = true) => {
    g.fillStyle = c; g.fillRect(x, 820 - h, w, h);
    if (roof) { g.beginPath(); g.moveTo(x - 8, 820 - h); g.lineTo(x + w / 2, 820 - h - w * 0.28); g.lineTo(x + w + 8, 820 - h); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(x, 820 - h, w, h);
    g.fillStyle = night ? "#f2c060" : "#3a3040";
    for (let k = 0; k < Math.floor(w / 46); k++) if (r() < (night ? 0.45 : 0.8)) g.fillRect(x + 14 + k * 46, 820 - h + 26 + r() * (h - 60), 12, 18);
  };
  for (let x = -20; x < 2048; x += 70 + r() * 60) bld(x, 60 + r() * 90, 60 + r() * 110, mid);
  // Hadrian's round tomb (later Castel Sant'Angelo)
  g.fillStyle = near; g.fillRect(560, 520, 360, 300); g.fillRect(620, 430, 240, 100); g.fillRect(700, 370, 80, 70);
  g.strokeStyle = ink; g.lineWidth = 7; g.strokeRect(560, 520, 360, 300); g.strokeRect(620, 430, 240, 100); g.strokeRect(700, 370, 80, 70);
  for (let k = 0; k < 9; k++) { g.fillStyle = near; g.fillRect(560 + k * 42, 500, 24, 22); g.strokeRect(560 + k * 42, 500, 24, 22); }
  // old St Peter's: a long nave with a gable front and a bell tower
  g.fillStyle = near; g.fillRect(1180, 560, 420, 260); g.beginPath(); g.moveTo(1170, 560); g.lineTo(1390, 450); g.lineTo(1610, 560); g.fill();
  g.strokeRect(1180, 560, 420, 260); g.beginPath(); g.moveTo(1170, 560); g.lineTo(1390, 450); g.lineTo(1610, 560); g.stroke();
  g.fillRect(1660, 420, 90, 400); g.strokeRect(1660, 420, 90, 400);
  g.beginPath(); g.moveTo(1650, 420); g.lineTo(1705, 350); g.lineTo(1760, 420); g.fill(); g.stroke();
  g.fillStyle = night ? "#f2c060" : "#3a3040";
  for (let k = 0; k < 5; k++) g.fillRect(1215 + k * 78, 640, 26, 60);
  // cypresses
  for (let k = 0; k < 9; k++) { const x = 60 + k * 240 + r() * 60; g.fillStyle = night ? "#142a24" : "#3a5a32"; g.beginPath(); g.ellipse(x, 760, 18, 90, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  // the far bank
  g.fillStyle = night ? "#2a2238" : "#9a8466"; g.fillRect(0, 818, 2048, 206);
  g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 818); g.lineTo(2048, 818); g.stroke();
});

export class Tiber extends Room {
  private water: THREE.MeshLambertMaterial;
  private back: THREE.Mesh;
  private sky: { night: THREE.Texture; day: THREE.Texture };
  constructor() {
    super();
    const b = new Batch();
    const bank = twoTone(new THREE.MeshLambertMaterial({ map: mud(), color: "#c2b49c" }));
    const stone = lam("tiberStone", () => ({ map: stoneHD("tiberStone", ["#bfb3a0", "#b3a794", "#c9bea9"], "#8a7e6c") }));
    // near bank: slope from the water line to the flat top, 40 m wide
    const W0 = -20, W1 = 20;
    b.add(quad(V(W0, BANK_Y, 2), V(W1, BANK_Y, 2), V(W1, -0.05, -1.2), V(W0, -0.05, -1.2), 40 / 2, 3.2 / 2), bank);
    b.add(quad(V(W0, BANK_Y, 14), V(W1, BANK_Y, 14), V(W1, BANK_Y, 2), V(W0, BANK_Y, 2), 40 / 2, 6), bank);
    b.add(quad(V(W0, -0.05, -1.2), V(W1, -0.05, -1.2), V(W1, -0.05, -3), V(W0, -0.05, -3), 20, 1), bank);
    // an old quay wall with steps on the left, stone posts
    b.add(boxGeo(V(-9, 0, -1.6), V(-3.2, 1.3, 2.6), 1.5), stone);
    for (let i = 0; i < 4; i++) b.add(boxGeo(V(-3.2, 0, -1.4 + i * 0.6), V(-2.4, 1.3 - i * 0.3, -0.8 + i * 0.6)), stone);
    for (const x of [3.4, 6.2]) b.add(boxGeo(V(x - 0.15, BANK_Y, 3.5), V(x + 0.15, BANK_Y + 0.9, 3.8)), stone);
    // a moored boat
    const hull = lam("tiberBoat", () => ({ color: "#6a4a32" }));
    b.add(boxGeo(V(4.6, -0.12, -2.6), V(7.4, 0.25, -1.7)), hull);
    b.build(this.root, true);
    // the river: a big lit plane whose ripple map drifts with the current
    const wt = waterTex(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(16, 10);
    this.water = twoTone(new THREE.MeshLambertMaterial({ map: wt, color: "#2a5a8a" }));
    const w = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), this.water);
    w.rotation.x = -Math.PI / 2; w.position.set(0, 0, -31); w.receiveShadow = true; this.root.add(w);
    // backdrop: the far bank + city + sky, unlit, no fog
    this.sky = { night: skyline(true), day: skyline(false) };
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(150, 75), new THREE.MeshBasicMaterial({ map: this.sky.night, fog: false }));
    this.back.position.set(0, 75 * (818 / 1024) - 37.5 + 1.5, -60); // the far bank's top edge 1.5 m above the water
    this.back.layers.set(NOINK); this.root.add(this.back);
    // a torch on a post by the quay (night only)
    this.flame(-3.6, 1.95, 0.4, 0.2, 0.42, 3.0);
    this.glow(-3.6, 1.95, 0.4, 2.4, 0.5);
  }
  pose(night: boolean, t: number) {
    (this.back.material as THREE.MeshBasicMaterial).map = night ? this.sky.night : this.sky.day;
    this.water.color.set(night ? "#1e3a6a" : "#3a7aa8");
    this.water.map!.offset.set(t * 0.012, t * 0.035);
    this.setFlames(night);
  }
}
