// Napoleon's campaign tent (the hook + the loop), far from the park at x = 200: striped canvas walls (a 10-sided drum, open
// toward +z), a peaked ceiling, a camp table with a painted map of Europe (MAP) where little tricolour flags pop up one by one
// (pose(flags)), a lantern, a camp chair. Floor y = 0.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const TENT: V3 = [200, 0, 0];
/** the map tabletop centre (top surface) */
export const MAP: V3 = [200, 0.8, -1.2];
const MW = 2.2, MD = 1.5;

/** a stylised map of Europe: sea, beige land with soft borders, no lettering */
const mapTex = () => ctex("npMap", 1024, 700, (g) => {
  g.fillStyle = "#9cc0d0"; g.fillRect(0, 0, 1024, 700);
  const land = (pts: number[][], col = "#e8d8b0") => { g.fillStyle = col; g.strokeStyle = "#6a5a3a"; g.lineWidth = 4; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke(); };
  land([[90, 520], [260, 480], [300, 560], [250, 650], [110, 660], [70, 600]], "#e2cfa0"); // Iberia
  land([[260, 480], [250, 360], [330, 300], [430, 330], [450, 420], [380, 500], [300, 520]], "#d8e0a8"); // France
  land([[430, 330], [700, 260], [960, 280], [1000, 520], [760, 540], [600, 470], [450, 420]], "#e8d8b0"); // central + eastern Europe
  land([[450, 420], [520, 450], [600, 600], [640, 640], [610, 660], [520, 520], [470, 470]], "#e8c8a8"); // Italy
  land([[600, 470], [760, 540], [780, 640], [690, 650], [640, 560]], "#e0d0b8"); // the Balkans
  land([[250, 160], [320, 120], [340, 270], [270, 290], [230, 230]], "#e0d8c0"); // Britain
  land([[560, 30], [700, 10], [760, 140], [660, 240], [600, 160]], "#dcd0b0"); // Scandinavia
  g.strokeStyle = "rgba(110,80,50,0.5)"; g.lineWidth = 3; g.setLineDash([10, 8]);
  for (const [a, b] of [[[430, 330], [450, 420]], [[600, 300], [620, 460]], [[760, 280], [780, 520]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.setLineDash([]); g.strokeStyle = "#5a4a30"; g.lineWidth = 10; g.strokeRect(5, 5, 1014, 690);
});
const canvasT = () => ctex("npCanvas", 256, 256, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4ecd6" : "#4a7ab0"; g.fillRect(i * 32, 0, 32, 256); }
});
const flagT = () => ctex("npTricolour", 96, 64, (g) => { for (const [i, c] of ["#2a4a9a", "#f6f2ea", "#c8303a"].entries()) { g.fillStyle = c; g.fillRect(i * 32, 0, 32, 64); } });

/** flag spots on the map, in map units (-1..1) */
const FLAGS: [number, number][] = [[-0.35, -0.05], [0.05, -0.1], [0.3, 0.05], [-0.05, 0.35], [0.42, 0.35], [0.6, -0.2], [-0.62, 0.55], [0.15, -0.4]];

export class Tent extends Room {
  private flags: THREE.Group[] = [];
  constructor() {
    super();
    const s = new Batch(), deco = new Batch();
    const [x0, , z0] = TENT, R = 4.2, H = 2.6;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    s.add(quad(V(x0 - 6, 0, z0 + 6), V(x0 + 6, 0, z0 + 6), V(x0 + 6, 0, z0 - 6), V(x0 - 6, 0, z0 - 6), 3, 3), floor);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 20, 1, true, Math.PI * 0.25, Math.PI * 1.5), new THREE.MeshLambertMaterial({ map: canvasT(), side: THREE.DoubleSide }));
    (wall.material as THREE.MeshLambertMaterial).map!.wrapS = THREE.RepeatWrapping; (wall.material as THREE.MeshLambertMaterial).map!.repeat.set(6, 1);
    wall.position.set(x0, H / 2, z0); wall.receiveShadow = true; this.root.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.1, 1.6, 20, 1, true), new THREE.MeshLambertMaterial({ color: "#efe4c8", side: THREE.DoubleSide }));
    roof.position.set(x0, H + 0.8, z0); this.root.add(roof);
    deco.add(cyl(0.07, 0.07, H + 1.6, 8), lam("npPoleT", () => ({ color: "#6a4a2a" })), at(x0 + 1.6, (H + 1.6) / 2, z0 - 2.6));
    // the camp table with the map
    const [mx, my, mz] = MAP, wood = lam("npTable", () => ({ color: "#6a4428" }));
    deco.add(boxGeo(V(mx - MW / 2 - 0.08, my - 0.06, mz - MD / 2 - 0.08), V(mx + MW / 2 + 0.08, my - 0.005, mz + MD / 2 + 0.08)), wood);
    for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) deco.add(boxGeo(V(mx + a * MW / 2 - 0.05, 0, mz + c * MD / 2 - 0.05), V(mx + a * MW / 2 + 0.05, my - 0.06, mz + c * MD / 2 + 0.05)), wood);
    const map = new THREE.Mesh(new THREE.PlaneGeometry(MW, MD), new THREE.MeshLambertMaterial({ map: mapTex(), emissive: "#ffffff", emissiveMap: mapTex(), emissiveIntensity: 0.45 }));
    map.rotation.x = -Math.PI / 2; map.position.set(mx, my, mz); map.receiveShadow = true; this.root.add(map);
    // a brass lantern, an inkwell, a rolled map
    deco.add(cyl(0.08, 0.1, 0.28, 8), lam("npBrassT", () => ({ color: "#c9a24a" })), at(mx + 0.95, my + 0.14, mz - 0.6));
    deco.add(cyl(0.05, 0.05, 0.8, 10), lam("npRoll", () => ({ color: "#efe4c8" })), at(mx - 0.8, my + 0.05, mz - 0.6, 0, 0, Math.PI / 2));
    // the camp chair behind the table
    deco.add(boxGeo(V(mx - 0.3, 0, mz - 1.5), V(mx + 0.3, 0.46, mz - 1.0)), lam("npChairT", () => ({ color: "#8a2a2a" })));
    s.build(this.root, false); deco.build(this.root, true);
    this.flame(mx + 0.95, my + 0.36, mz - 0.6, 0.08, 0.16, 2.2); this.glow(mx + 0.95, my + 0.36, mz - 0.6, 1.2, 0.35);
    // the little flags (pin + tricolour), shown by pose()
    const ft = new THREE.MeshBasicMaterial({ map: flagT(), side: THREE.DoubleSide }), pin = lam("npPin", () => ({ color: "#3a3a40" }));
    for (const [u, v] of FLAGS) {
      const f = new THREE.Group(); f.position.set(mx + u * MW / 2, my, mz + v * MD / 2);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), pin); st.position.y = 0.1; f.add(st);
      const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), ft); cl.position.set(0.06, 0.16, 0); cl.layers.set(NOINK); f.add(cl);
      f.visible = false; this.root.add(f); this.flags.push(f);
    }
  }
  /** flags 0..8 planted so far (fractional = the next one popping up) */
  pose(flags: number) {
    this.flags.forEach((f, i) => { const k = Math.max(0, Math.min(1, flags - i)); f.visible = k > 0; f.scale.setScalar(Math.max(0.001, k < 1 ? 1.25 * Math.sin(k * 2) : 1)); });
  }
}
