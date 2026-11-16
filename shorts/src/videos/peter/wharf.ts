// A Russian riverside shipyard wharf, c. 1700 (re-dressed from the formosus Tiber bank): a muddy bank sloping into the
// river, stacks of timber, a sawhorse, a half-built hull on the stocks with its bare ribs, a timber quay, and a painted
// far bank with a wooden town and onion domes. Water y = 0; the bank rises to y = 0.5 at z = 2 and stays flat behind.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";
import type { V3 } from "./story";

export const BANK_Y = 0.5;
/** bank height at z (water line at z = -1.2) */
export const bankY = (z: number) => (z >= 2 ? BANK_Y : z <= -1.2 ? -0.05 : -0.05 + (BANK_Y + 0.05) * ((z + 1.2) / 3.2));
/** where the body washes up */
export const SHORE: V3 = [0.3, bankY(-0.35), -0.35];

const waterTex = () => ctex("wharfWater", 512, 512, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, w = 20 + r() * 60;
    g.strokeStyle = r() < 0.5 ? "rgba(255,255,255,0.5)" : "rgba(40,40,60,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const mud = () => ctex("wharfMud", 512, 512, (g, r) => {
  g.fillStyle = "#a08a68"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,100,72,0.5)" : "rgba(196,176,140,0.5)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 5, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 60; i++) { g.strokeStyle = "rgba(90,110,60,0.7)"; g.lineWidth = 3; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 10, y - 18 - r() * 16); g.stroke(); }
});
/** the city across the river: sky gradient, hills, walls, towers, the round mausoleum, a basilica gable; moon or sun */
const skyline = (night: boolean) => ctex(night ? "wharfNight" : "wharfDay", 2048, 1024, (g, r) => {
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
  const far = night ? "#33305a" : "#8fa0b8", mid = night ? "#2a2848" : "#b8a88a", ink = "#141018";
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
  // onion-domed churches and a wooden belfry across the river
  const dome = (x: number, y: number, w: number, col: string) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w * 0.5, y);
    g.bezierCurveTo(x - w * 0.75, y - w * 0.5, x - w * 0.1, y - w * 0.7, x, y - w * 1.15);
    g.bezierCurveTo(x + w * 0.1, y - w * 0.7, x + w * 0.75, y - w * 0.5, x + w * 0.5, y); g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 6; g.stroke();
    g.beginPath(); g.moveTo(x, y - w * 1.15); g.lineTo(x, y - w * 1.6); g.moveTo(x - w * 0.18, y - w * 1.42); g.lineTo(x + w * 0.18, y - w * 1.42); g.stroke();
  };
  for (const [x, w, h, col] of [[560, 150, 280, "#3a6ab8"], [760, 90, 200, "#e2b84a"], [1400, 130, 250, "#2f8a5a"], [1590, 80, 180, "#e2b84a"]] as const) {
    g.fillStyle = night ? "#3a3858" : "#ece6d8"; g.fillRect(x - w / 2, 820 - h, w, h); g.strokeStyle = ink; g.lineWidth = 7; g.strokeRect(x - w / 2, 820 - h, w, h);
    dome(x, 820 - h, w * 0.9, night ? "#2a2848" : col);
  }
  g.fillStyle = night ? "#2a2238" : "#8a6040"; g.fillRect(1060, 470, 80, 350); g.strokeStyle = ink; g.lineWidth = 7; g.strokeRect(1060, 470, 80, 350);
  g.fillStyle = night ? "#1e1c36" : "#3f7a5a"; g.beginPath(); g.moveTo(1048, 470); g.lineTo(1100, 340); g.lineTo(1152, 470); g.closePath(); g.fill(); g.stroke();
  // birches
  for (let k = 0; k < 9; k++) { const x = 60 + k * 240 + r() * 60; g.fillStyle = night ? "#142a24" : "#4f7a44"; g.beginPath(); g.ellipse(x, 760, 30, 70, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  // the far bank
  g.fillStyle = night ? "#2a2238" : "#9a8466"; g.fillRect(0, 818, 2048, 206);
  g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 818); g.lineTo(2048, 818); g.stroke();
});

export class Wharf extends Room {
  private water: THREE.MeshLambertMaterial;
  private back: THREE.Mesh;
  private sky: { night: THREE.Texture; day: THREE.Texture };
  constructor() {
    super();
    const b = new Batch();
    const bank = twoTone(new THREE.MeshLambertMaterial({ map: mud(), color: "#c2b49c" }));
    const stone = lam("wharfLog", () => ({ map: beam() }));
    // near bank: slope from the water line to the flat top, 40 m wide
    const W0 = -20, W1 = 20;
    b.add(quad(V(W0, BANK_Y, 2), V(W1, BANK_Y, 2), V(W1, -0.05, -1.2), V(W0, -0.05, -1.2), 40 / 2, 3.2 / 2), bank);
    b.add(quad(V(W0, BANK_Y, 14), V(W1, BANK_Y, 14), V(W1, BANK_Y, 2), V(W0, BANK_Y, 2), 40 / 2, 6), bank);
    b.add(quad(V(W0, -0.05, -1.2), V(W1, -0.05, -1.2), V(W1, -0.05, -3), V(W0, -0.05, -3), 20, 1), bank);
    // a timber quay on the left (log crib) with steps, mooring posts
    b.add(boxGeo(V(-9, 0, -1.6), V(-3.2, 1.3, 2.6), 1.5), stone);
    for (let i = 0; i < 4; i++) b.add(boxGeo(V(-3.2, 0, -1.4 + i * 0.6), V(-2.4, 1.3 - i * 0.3, -0.8 + i * 0.6)), stone);
    for (const x of [3.4, 6.2]) b.add(boxGeo(V(x - 0.15, BANK_Y, 3.5), V(x + 0.15, BANK_Y + 0.9, 3.8)), stone);
    // a moored boat
    const hull = lam("wharfBoat", () => ({ color: "#6a4a32" }));
    b.add(boxGeo(V(4.6, -0.12, -2.6), V(7.4, 0.25, -1.7)), hull);
    // timber stacks on the bank, a sawhorse with a log on it, a half-built hull on the stocks (keel + bare ribs)
    const logM = lam("wharfTimber", () => ({ color: "#b08454" })), end = lam("wharfEnd", () => ({ color: "#e0c08a" }));
    for (let i = 0; i < 10; i++) { const row = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3, k = i - [0, 4, 7, 9][row]; b.add(cyl(0.16, 0.16, 3.2, 10), logM, at(-3.6 + k * 0.33 + row * 0.165, BANK_Y + 0.16 + row * 0.28, 4.6, 0, 0, Math.PI / 2)); }
    for (const x of [-2.2, -1.0]) for (const s2 of [-1, 1]) b.add(boxGeo(V(x - 0.04, BANK_Y, 2.9 + s2 * 0.35 - 0.04), V(x + 0.04, BANK_Y + 0.7, 2.9 + s2 * 0.35 + 0.04)), stone);
    b.add(boxGeo(V(-2.3, BANK_Y + 0.66, 2.75), V(-0.9, BANK_Y + 0.74, 3.05)), stone);
    b.add(cyl(0.14, 0.14, 2.0, 10), logM, at(-1.6, BANK_Y + 0.88, 2.9, 0, 0, Math.PI / 2));
    b.add(cyl(0.142, 0.142, 0.01, 10), end, at(-0.6, BANK_Y + 0.88, 2.9, 0, 0, Math.PI / 2));
    const [hx, hz] = [4.4, 6.5];
    b.add(boxGeo(V(hx - 0.12, BANK_Y + 0.4, hz - 4.2), V(hx + 0.12, BANK_Y + 0.62, hz + 4.2)), logM);
    for (let i = -3; i <= 3; i++) b.add(boxGeo(V(hx - 0.5, BANK_Y, hz + i * 1.2 - 0.15), V(hx + 0.5, BANK_Y + 0.4, hz + i * 1.2 + 0.15)), stone);
    for (let i = -6; i <= 6; i++) {
      const z = hz + i * 0.6, w = 1.7 * Math.sqrt(1 - (i / 7.2) ** 2);
      b.add(new THREE.TorusGeometry(w, 0.07, 6, 18, Math.PI), logM, at(hx, BANK_Y + 0.55 + w, z, 0, 0, Math.PI));
    }
    b.add(new THREE.TorusGeometry(0.15, 0.03, 6, 10), lam("wharfIron", () => ({ color: "#3a3a44" })), at(-1.6, BANK_Y + 0.4, 2.6));
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
