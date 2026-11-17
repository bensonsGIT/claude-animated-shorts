// Berthier's park just outside Paris, summer 1806 (one outdoor set + sky dome):
// - the hunting lawn round the origin (mown grass, x -16..16, z -24..10), oak woods on three sides with a vista gap at the back
//   showing a brick-and-stone château far off (z -95);
// - the HUTCHES: a row of wooden crates along z = -19 whose front doors drop open (pose(open));
// - the breakfast PAVILION at x 7, z 5: a striped canopy on poles over a long table with a white cloth and silver domes;
// - the gravel DRIVE along x = -11 where the imperial coach waits (COACH).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const HUTCH_Z = -19;
export const HUTCH_X = Array.from({ length: 8 }, (_, i) => -9.1 + i * 2.6);
export const PAV: V3 = [7, 0, 5];
export const TABLE: V3 = [7, 0.78, 5];
export const COACH: V3 = [-11, 0, 4];

const gravel = () => ctex("npGravel", 256, 256, (g, r) => {
  g.fillStyle = "#cbbf9e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,135,105,0.6)" : "rgba(235,228,205,0.6)"; g.fillRect(r() * 256, r() * 256, 3, 3); }
});
const mown = () => ctex("npMown", 512, 512, (g, r) => {
  const base = grassHD().image as HTMLCanvasElement;
  g.drawImage(base, 0, 0, 512, 512);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "rgba(255,255,220,0.07)" : "rgba(0,40,0,0.05)"; g.fillRect(0, i * 128, 512, 128); } // mowing stripes
  for (let i = 0; i < 60; i++) { g.fillStyle = ["#f4f0e0", "#f0d84a", "#e8a0c0"][Math.floor(r() * 3)]; g.fillRect(r() * 512, r() * 512, 3, 3); } // daisies
});
const stripes = () => ctex("npStripes", 512, 64, (g) => {
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#c8303a"; g.fillRect(i * 32, 0, 32, 64); }
});
const scallop = () => ctex("npScallop", 512, 64, (g) => {
  g.clearRect(0, 0, 512, 64);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#c8303a"; g.fillRect(i * 32, 0, 32, 34); g.beginPath(); g.arc(i * 32 + 16, 34, 16, 0, Math.PI); g.fill(); }
});
const brickT = () => ctex("npBrick", 256, 256, (g) => {
  g.fillStyle = "#b8604a"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#a8543e"; for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) g.fillRect(x + 1, y + 1, 30, 14);
});
const sky = (key: string, top: string, mid: string, hor: string) => ctex(key, 128, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.36, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
});

export class Park extends Room {
  private dome: THREE.Mesh;
  private skies = { day: sky("npSkyD", "#3a80d8", "#80b8ec", "#dcecf6"), morning: sky("npSkyM", "#5a90d8", "#a8c8e8", "#f4e4cc") };
  private doors: THREE.Group[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: mown() }));
    const rough = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const grav = twoTone(new THREE.MeshLambertMaterial({ map: gravel() }));
    const leaf = lam("npLeaf", () => ({ color: "#4a7a3a" })), leaf2 = lam("npLeaf2", () => ({ color: "#5e8e46" })), leaf3 = lam("npLeaf3", () => ({ color: "#3e6a34" }));
    const bark = lam("npBark", () => ({ color: "#5a4030" })), crate = lam("npCrate", () => ({ color: "#a8804e" })), crate2 = lam("npCrate2", () => ({ color: "#8a6a40" }));
    const wire = lam("npWire", () => ({ color: "#3a3a40" })), cloth = lam("npCloth", () => ({ color: "#f6f4ee" })), silver = lam("npSilver", () => ({ color: "#d4d8e0" }));
    const pole = lam("npPole", () => ({ color: "#e8e0cc" })), stone = lam("npStone", () => ({ color: "#e8e0cc" })), slate = lam("npSlate", () => ({ color: "#4a5262" }));
    const brick = lam("npBrickM", () => ({ map: brickT() })), glass = lam("npGlass", () => ({ color: "#3a4a5e" })), chair = lam("npChair", () => ({ color: "#c8a050" }));

    // ground: the mown lawn, rough grass round it, the gravel drive
    b.add(quad(V(-18, 0, 14), V(18, 0, 14), V(18, 0, -26), V(-18, 0, -26), 9, 10), grass);
    for (const [x0, x1, z0, z1] of [[-300, -18, 300, -300], [18, 300, 300, -300], [-18, 18, 300, 14], [-18, 18, -26, -300]] as const)
      b.add(quad(V(x0, -0.005, z0), V(x1, -0.005, z0), V(x1, -0.005, z1), V(x0, -0.005, z1), (x1 - x0) / 4, (z0 - z1) / 4), rough);
    b.add(quad(V(-13, 0.012, 40), V(-9, 0.012, 40), V(-9, 0.012, -60), V(-13, 0.012, -60), 2, 40), grav);

    // oak woods: back row (a vista gap at x -4..4) and both sides
    const tree = (x: number, z: number, s: number, i: number) => {
      deco.add(cyl(0.22 * s, 0.34 * s, 3.2 * s, 7), bark, at(x, 1.6 * s, z));
      for (let k = 0; k < 5; k++) deco.add(new THREE.SphereGeometry(1.5 * s, 9, 7), [leaf, leaf2, leaf3][(k + i) % 3],
        at(x + Math.cos(k * 1.9 + i) * 1.2 * s, (3.8 + 0.6 * (k % 2)) * s, z + Math.sin(k * 1.9 + i) * 1.0 * s));
    };
    let i = 0;
    for (let x = -30; x <= 30; x += 3.4) { if (Math.abs(x) < 5) continue; for (const dz of [0, 4.5]) tree(x + Math.sin(i * 2.1) * 0.9, -27 - dz - Math.cos(i * 1.3) * 1.2, 1.1 + 0.3 * Math.sin(i * 1.7), i++); }
    for (const sx of [-1, 1]) for (let z = 14; z > -26; z -= 3.6) for (const dx of [0, 4]) tree(sx * (21 + dx) + Math.sin(i) * 0.8, z + Math.cos(i * 1.4), 1.0 + 0.3 * Math.sin(i * 1.3), i++);
    for (let z = -50; z > -90; z -= 6) for (const x of [-9, 9]) tree(x + Math.sin(z) * 1.5, z, 1.4, i++); // the avenue to the château
    // the château far off at the end of the vista: brick body, stone corners, slate roofs, two pavilions
    const cz = -100;
    b.add(boxGeo(V(-16, 0, cz - 8), V(16, 11, cz), 4), brick);
    for (const x of [-16, -4, 4, 16]) fix.add(boxGeo(V(x - 0.8, 0, cz + 0.01), V(x + 0.8, 11, cz + 0.3)), stone);
    for (let x = -14; x < 14; x += 2.6) for (const y of [2, 6.5]) fix.add(boxGeo(V(x - 0.5, y, cz + 0.02), V(x + 0.5, y + 2.6, cz + 0.12)), glass);
    const roofG = new THREE.ConeGeometry(1, 1, 4, 1); roofG.rotateY(Math.PI / 4);
    deco.add(roofG.clone().scale(32 * 0.72, 6, 8 * 0.72), slate, at(0, 14, cz - 4));
    for (const x of [-20, 20]) { b.add(boxGeo(V(x - 4, 0, cz - 9), V(x + 4, 13, cz + 1)), brick); deco.add(roofG.clone().scale(8 * 0.72, 7, 10 * 0.72), slate, at(x, 16.5, cz - 4)); }

    // the hutch crates along the back of the lawn, each with a wire-front door that drops open
    for (const x of HUTCH_X) {
      deco.add(boxGeo(V(x - 0.65, 0, HUTCH_Z - 0.45), V(x + 0.65, 0.75, HUTCH_Z + 0.4)), crate);
      fix.add(boxGeo(V(x - 0.7, 0.75, HUTCH_Z - 0.5), V(x + 0.7, 0.82, HUTCH_Z + 0.45)), crate2);
      const door = new THREE.Group(); door.position.set(x, 0.05, HUTCH_Z + 0.42);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.66, 0.04), crate2); panel.position.set(0, 0.33, 0); panel.castShadow = true;
      door.add(panel);
      for (let k = -2; k <= 2; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.05), wire); w.position.set(k * 0.18, 0.36, 0.02); door.add(w); }
      this.root.add(door); this.doors.push(door);
    }

    // the breakfast pavilion: six poles, a scalloped striped valance, a striped cone roof; the long table under it
    {
      const [px, , pz] = PAV, R = 3.2;
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.26; deco.add(cyl(0.06, 0.06, 2.8, 8), pole, at(px + R * Math.cos(a), 1.4, pz + R * Math.sin(a))); }
      const st = new THREE.MeshLambertMaterial({ map: stripes(), side: THREE.DoubleSide });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.3, 1.8, 16, 1, true), st); roof.position.set(px, 3.7, pz); roof.castShadow = true; this.root.add(roof);
      const val = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.3, R + 0.3, 0.5, 16, 1, true), new THREE.MeshLambertMaterial({ map: scallop(), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }));
      val.position.set(px, 2.55, pz); this.root.add(val);
      deco.add(new THREE.SphereGeometry(0.16, 10, 8), lam("npFinial", () => ({ color: "#d9b04a" })), at(px, 4.7, pz));
      const [tx, ty, tz] = TABLE;
      deco.add(boxGeo(V(tx - 1.5, ty - 0.05, tz - 0.55), V(tx + 1.5, ty, tz + 0.55)), cloth);
      fix.add(boxGeo(V(tx - 1.52, 0.35, tz - 0.57), V(tx + 1.52, ty - 0.05, tz + 0.57)), cloth); // the cloth hanging down
      for (const dx of [-1.0, 0.0, 1.0]) deco.add(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), silver, at(tx + dx, ty, tz - 0.15));
      for (const dx of [-0.5, 0.5]) deco.add(cyl(0.03, 0.05, 0.32, 8), silver, at(tx + dx, ty + 0.16, tz + 0.2)); // candlesticks / bottles
      deco.add(boxGeo(V(tx - 0.3, 0, tz + 0.9), V(tx + 0.3, 0.48, tz + 1.4)), chair); // the Emperor's chair
      deco.add(boxGeo(V(tx - 0.3, 0.48, tz + 1.35), V(tx + 0.3, 1.25, tz + 1.42)), chair);
    }

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
  }
  /** sky for the light, the dome centred on the camera, the hutch doors open 0..1 */
  pose(light: string, camPos: THREE.Vector3, open: number) {
    (this.dome.material as THREE.MeshBasicMaterial).map = light === "morning" ? this.skies.morning : this.skies.day;
    this.dome.position.copy(camPos);
    this.doors.forEach((d, i) => { const k = Math.max(0, Math.min(1, open * 1.6 - i * 0.08)); d.rotation.x = k * k * (Math.PI / 2 - 0.05); });
  }
}
