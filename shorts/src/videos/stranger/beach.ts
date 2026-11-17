// A beach near Algiers, 1930s-40s (one outdoor set + sky dome), adapted from the Caligula short's beach:
// - the strand round the origin, the sea toward -z (the water's edge at z = SHORE_Z, surf washing in and out);
// - a big flat ROCK at ROCK with a small SPRING trickling out behind it (where the shooting happens);
// - a low rocky headland on the right, a bathing buoy + float out in the water (the harbour baths shots),
//   a faint white city on the far left shore (Algiers).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const SHORE_Z = -6;
export const ROCK: V3 = [3.6, 0, -2.6];
export const SPRING: V3 = [1.4, 0, -3.2];
export const BUOY: V3 = [0.6, 0, -11];

const sandT = () => ctex("stSand", 512, 512, (g, r) => {
  g.fillStyle = "#f0dcac"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(214,188,136,0.5)" : "rgba(255,248,226,0.6)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 2, 2 + r() * 2); }
  for (let i = 0; i < 24; i++) { g.strokeStyle = "rgba(206,180,126,0.45)"; g.lineWidth = 3; const y = r() * 512; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + 6 * Math.sin(x / 40 + i)); g.stroke(); }
});
const wetT = () => ctex("stWet", 512, 512, (g, r) => {
  g.fillStyle = "#c4ae84"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1200; i++) { g.fillStyle = r() < 0.5 ? "rgba(160,140,104,0.5)" : "rgba(224,210,176,0.5)"; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const waterT = () => ctex("stWater", 512, 512, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) {
    const x = r() * 512, y = r() * 512, w = 20 + r() * 60;
    g.strokeStyle = r() < 0.6 ? "rgba(255,255,255,0.6)" : "rgba(30,40,70,0.3)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const foamT = () => ctex("stFoam", 512, 64, (g, r) => {
  g.clearRect(0, 0, 512, 64);
  g.fillStyle = "rgba(255,255,255,0.95)";
  g.beginPath(); g.moveTo(0, 64);
  for (let x = 0; x <= 512; x += 8) g.lineTo(x, 26 + 10 * Math.sin(x / 23) + 6 * Math.sin(x / 7.3));
  g.lineTo(512, 64); g.closePath(); g.fill();
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(r() * 512, 10 + r() * 20, 2 + r() * 4, 0, Math.PI * 2); g.fill(); }
});
const rockT = () => ctex("stRock", 512, 512, (g, r) => {
  g.fillStyle = "#b8a48a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,122,100,0.5)" : "rgba(214,200,176,0.5)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 30, 5 + r() * 12, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 20; i++) { g.strokeStyle = "rgba(96,80,66,0.5)"; g.lineWidth = 2; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 80, 512); g.stroke(); }
});
const cityT = () => ctex("stCity", 1024, 256, (g, r) => {
  g.clearRect(0, 0, 1024, 256);
  // a hill of white cubic houses (the Casbah seen across the bay), soft and hazy
  g.fillStyle = "#c9c2b4"; g.beginPath(); g.moveTo(0, 256); g.quadraticCurveTo(420, 30, 1024, 150); g.lineTo(1024, 256); g.closePath(); g.fill();
  for (let i = 0; i < 260; i++) {
    const x = r() * 1024, top = 256 - (256 - (30 + 120 * Math.abs(x - 420) / 600)) * (0.6 + 0.4 * r());
    const w = 10 + r() * 22, h = 8 + r() * 14;
    g.fillStyle = r() < 0.85 ? "#f6f2ea" : "#e6d8c0"; g.fillRect(x, top, w, h);
    g.fillStyle = "rgba(120,130,160,0.35)"; g.fillRect(x + w * 0.6, top, w * 0.4, h);
  }
});
const sky = (key: string, stops: [number, string][]) => ctex(key, 128, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
});

export class Beach extends Room {
  private dome: THREE.Mesh;
  private skies: Record<string, THREE.Texture> = {
    // "sun": bleached, nearly white at the horizon (the blinding afternoon)
    sun: sky("stSkyS", [[0, "#4a92e0"], [0.36, "#a6d0f2"], [0.5, "#fbf6e8"], [1, "#fbf6e8"]]),
    day: sky("stSkyD", [[0, "#3a80d8"], [0.36, "#80b8ec"], [0.5, "#dcecf6"], [1, "#dcecf6"]]),
    golden: sky("stSkyG", [[0, "#6a6aa8"], [0.3, "#e8a080"], [0.5, "#ffd08a"], [1, "#ffd08a"]]),
  };
  private water: THREE.MeshLambertMaterial;
  private foam: THREE.Mesh[] = [];
  private bathing = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const sand = twoTone(new THREE.MeshLambertMaterial({ map: sandT() }));
    const wet = twoTone(new THREE.MeshLambertMaterial({ map: wetT() }));
    const rock = twoTone(new THREE.MeshLambertMaterial({ map: rockT() }));
    const scrub = lam("stScrub", () => ({ color: "#7a8a4a" })), dune = lam("stDune", () => ({ color: "#e4cc98" }));
    const wood = lam("stWood", () => ({ color: "#8a5a34" })), red = lam("stRed", () => ({ color: "#d04a3a" })), white = lam("stWhite", () => ({ color: "#f4f0e6" }));
    const spring = lam("stSpring", () => ({ color: "#6ab0d8" }));

    b.add(quad(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -3), V(-80, 0, -3), 20, 11), sand);
    b.add(quad(V(-80, 0, -3), V(80, 0, -3), V(80, -0.25, SHORE_Z - 1), V(-80, -0.25, SHORE_Z - 1), 20, 1.5), wet);
    b.add(quad(V(-80, -0.25, SHORE_Z - 1), V(80, -0.25, SHORE_Z - 1), V(80, -1.5, SHORE_Z - 30), V(-80, -1.5, SHORE_Z - 30), 20, 6), wet);
    // low dunes with scrub behind the beach
    for (let i = 0; i < 14; i++) {
      const x = -40 + i * 7 + Math.sin(i * 2.3) * 2, z = 22 + Math.cos(i * 1.7) * 3, s = 3 + 1.5 * Math.sin(i * 1.3);
      deco.add(new THREE.SphereGeometry(s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dune, at(x, -0.2, z));
      for (let k = 0; k < 3; k++) deco.add(new THREE.SphereGeometry(0.5, 8, 6), scrub, at(x + Math.cos(k * 2.1) * s * 0.5, s * 0.75, z + Math.sin(k * 2.1) * s * 0.5));
    }
    // the big flat rock (where he finds the man) and smaller rocks round it
    const [rx, , rz] = ROCK;
    deco.add(new THREE.DodecahedronGeometry(1.4, 1), rock, at(rx, 0.55, rz).scale(V(1.5, 0.75, 1.1)));
    for (const [dx, dz, s] of [[-1.9, 0.6, 0.55], [1.7, -0.4, 0.7], [0.4, 1.4, 0.4], [2.6, 1.0, 0.45]] as const)
      deco.add(new THREE.DodecahedronGeometry(s, 0), rock, at(rx + dx, s * 0.35, rz + dz, dx, dz, 0));
    // the spring: a little pool of water at the rock's foot
    const pool = new THREE.CircleGeometry(0.7, 20); pool.rotateX(-Math.PI / 2);
    b.add(pool, spring, at(SPRING[0], 0.015, SPRING[2]).scale(V(1.4, 1, 0.8)));
    // a low rocky headland on the right running out to sea
    for (let i = 0; i < 10; i++) deco.add(new THREE.DodecahedronGeometry(2.2 + (i % 3) * 0.8, 1), rock, at(14 + i * 1.5, 0.6 + (i % 2) * 0.6, -2 - i * 3.0, i, i * 0.7, 0).scale(V(1.3, 0.8, 1.1)));
    // bathing float (a raft on drums) and a red buoy, for the swim shots only
    const bb = new Batch();
    bb.add(boxGeo(V(-1.4, 0.05, -1.0), V(1.4, 0.2, 1.0)), wood);
    for (const [dx, dz] of [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]] as const) bb.add(cyl(0.22, 0.22, 0.5, 10), white, at(dx, 0.0, dz, Math.PI / 2, 0, 0));
    bb.add(new THREE.SphereGeometry(0.32, 14, 10), red, at(-3.4, 0.05, 2.4));
    bb.build(this.bathing, true);
    this.bathing.position.set(BUOY[0] + 2.8, 0, BUOY[2] - 2.0);
    this.root.add(this.bathing);

    b.build(this.root, false); deco.build(this.root, true);
    // the sea: a big lit plane with a drifting ripple map
    const wt = waterT(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(60, 40);
    this.water = twoTone(new THREE.MeshLambertMaterial({ map: wt, color: "#2a7aa0", emissive: "#103a58", emissiveIntensity: 1 }));
    const w = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), this.water);
    w.rotation.x = -Math.PI / 2; w.position.set(0, -0.08, SHORE_Z - 250 + 0.6); w.receiveShadow = true; this.root.add(w);
    const fm = new THREE.MeshBasicMaterial({ map: foamT(), transparent: true, depthWrite: false, fog: true });
    fm.map!.repeat.set(12, 1);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 1.2), fm);
      m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.layers.set(NOINK); this.root.add(m); this.foam.push(m);
    }
    // Algiers across the bay: a hazy card far out on the left
    const city = new THREE.Mesh(new THREE.PlaneGeometry(160, 40), new THREE.MeshBasicMaterial({ map: cityT(), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(0.95, 0.95, 0.98) }));
    city.position.set(-110, 10, -170); city.lookAt(0, 10, 0); city.layers.set(NOINK); city.renderOrder = -1; this.root.add(city);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
  }
  static surfZ(t: number, i = 0) { return SHORE_Z + 0.5 + 0.7 * Math.sin(t * 0.9 + i * 2.1) - i * 0.9; }
  pose(skyKey: string, camPos: THREE.Vector3, t: number, bathing: boolean) {
    (this.dome.material as THREE.MeshBasicMaterial).map = this.skies[skyKey] ?? this.skies.day;
    this.dome.position.copy(camPos);
    const sea: Record<string, string> = { sun: "#3a8ab0", day: "#2a7aa0", golden: "#4a6a98" };
    this.water.color.set(sea[skyKey] ?? sea.day);
    const glow: Record<string, string> = { sun: "#1a4a68", day: "#103a58", golden: "#3a4a78" };
    this.water.emissive.set(glow[skyKey] ?? glow.day);
    this.water.map!.offset.set(t * 0.01, t * 0.03);
    this.foam.forEach((m, i) => { m.position.set(0, -0.02 + 0.005 * i, Beach.surfZ(t, i)); m.visible = !bathing; });
    this.bathing.visible = bathing;
    this.bathing.position.y = 0.04 * Math.sin(t * 1.6);
  }
}
