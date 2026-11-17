// The Channel coast of Gaul near Boulogne, AD 40 (one outdoor set + sky dome):
// - the BEACH: a wide strand round the origin, the sea toward -z (the water's edge at z = SHORE_Z, surf bands washing in and out),
//   grass-topped dunes behind (z > 16);
// - the CLIFF on the left (x < CLIFF_X): white chalk, 14 m high, a grassy top; the LIGHTHOUSE stands near its edge at LH and is
//   built stage by stage (pose build 0..12), later burns at night, and in 1644 the cliff edge under it gives way (pose fall 0..1);
//   after the fall the RUBBLE lies in the surf;
// - six BALLISTAS on the sand aimed at the waves (pose showBallistas).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const SHORE_Z = -6;
export const CLIFF_X = -15;
export const CLIFF_H = 14;
/** the lighthouse base (on the cliff top, near the edge) */
export const LH: V3 = [-18, CLIFF_H, -13];
export const STAGES = 12;
export const STAGE_H = 1.15;
/** ballista positions (front row of the legion, aimed at the sea) */
export const BALLISTAS: V3[] = [-9, -5.5, 5.5, 9, -13, 13].map((x) => [x, 0, -3.6] as V3);
/** where the rubble lands at the cliff foot, in the surf */
export const RUBBLE: V3 = [-13.5, 0, -12];

const sandT = () => ctex("clSand", 512, 512, (g, r) => {
  g.fillStyle = "#e8d4a6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(200,176,128,0.5)" : "rgba(250,240,214,0.6)"; g.fillRect(r() * 512, r() * 512, 2 + r() * 2, 2 + r() * 2); }
  for (let i = 0; i < 24; i++) { g.strokeStyle = "rgba(196,170,120,0.45)"; g.lineWidth = 3; const y = r() * 512; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + 6 * Math.sin(x / 40 + i)); g.stroke(); }
});
const wetT = () => ctex("clWet", 512, 512, (g, r) => {
  g.fillStyle = "#b8a47e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1200; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,132,98,0.5)" : "rgba(214,200,168,0.5)"; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const waterT = () => ctex("clWater", 512, 512, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) {
    const x = r() * 512, y = r() * 512, w = 20 + r() * 60;
    g.strokeStyle = r() < 0.55 ? "rgba(255,255,255,0.55)" : "rgba(30,40,70,0.35)"; g.lineWidth = 3 + r() * 3;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
});
const foamT = () => ctex("clFoam", 512, 64, (g, r) => {
  g.clearRect(0, 0, 512, 64);
  g.fillStyle = "rgba(255,255,255,0.95)";
  g.beginPath(); g.moveTo(0, 64);
  for (let x = 0; x <= 512; x += 8) g.lineTo(x, 26 + 10 * Math.sin(x / 23) + 6 * Math.sin(x / 7.3));
  g.lineTo(512, 64); g.closePath(); g.fill();
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(r() * 512, 10 + r() * 20, 2 + r() * 4, 0, Math.PI * 2); g.fill(); }
});
const chalkT = () => ctex("clChalk", 512, 512, (g, r) => {
  g.fillStyle = "#ece6d6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) { const y = i * 37 + r() * 10; g.fillStyle = "rgba(190,180,160,0.35)"; g.fillRect(0, y, 512, 4 + r() * 5); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(90,90,100,0.55)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 5 + r() * 6, 3 + r() * 3, 0, 0, Math.PI * 2); g.fill(); } // flints
  for (let i = 0; i < 18; i++) { g.strokeStyle = "rgba(150,140,124,0.5)"; g.lineWidth = 2; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 40, 512); g.stroke(); }
});
const towerT = () => ctex("clTower", 256, 256, (g) => {
  g.fillStyle = "#d8ccb4"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 0 : 24; x < 256; x += 48) { g.fillStyle = "#cbbea4"; g.fillRect(x + 2, y + 2, 44, 28); }
  g.fillStyle = "#b8604a"; g.fillRect(0, 200, 256, 22); g.fillStyle = "#a8543e"; for (let x = 0; x < 256; x += 22) g.fillRect(x + 1, 202, 19, 8); // a red tile band (Roman banded masonry)
  g.fillStyle = "#3a2a2a"; g.fillRect(112, 60, 30, 60); // a window
});
const sky = (key: string, stops: [number, string][]) => ctex(key, 128, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
});

export class Beach extends Room {
  private dome: THREE.Mesh;
  private skies: Record<string, THREE.Texture> = {
    day: sky("clSkyD", [[0, "#3a80d8"], [0.36, "#80b8ec"], [0.5, "#dcecf6"], [1, "#dcecf6"]]),
    morning: sky("clSkyM", [[0, "#5a90d8"], [0.36, "#a8c8e8"], [0.5, "#f6e2c4"], [1, "#f6e2c4"]]),
    golden: sky("clSkyG", [[0, "#6a6aa8"], [0.3, "#e8a080"], [0.5, "#ffd08a"], [1, "#ffd08a"]]),
    night: sky("clSkyN", [[0, "#0a0e26"], [0.36, "#1a2450"], [0.5, "#36406e"], [1, "#36406e"]]),
    storm: sky("clSkyS", [[0, "#14141e"], [0.36, "#2a2c3a"], [0.5, "#4a4c5a"], [1, "#4a4c5a"]]),
  };
  private water: THREE.MeshLambertMaterial;
  private foam: THREE.Mesh[] = [];
  private ballistas = new THREE.Group();
  private edge = new THREE.Group();
  private tower = new THREE.Group();
  private stages: THREE.Object3D[] = [];
  private fire = new THREE.Group();
  private rubble = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const sand = twoTone(new THREE.MeshLambertMaterial({ map: sandT() })); sand.map!.repeat.set(1, 1);
    const wet = twoTone(new THREE.MeshLambertMaterial({ map: wetT() }));
    const chalk = twoTone(new THREE.MeshLambertMaterial({ map: chalkT() }));
    const turf = lam("clTurf", () => ({ color: "#6a9a4a" })), dune = lam("clDune", () => ({ color: "#d8c494" })), marram = lam("clMarram", () => ({ color: "#8aa05a" }));
    const wood = lam("clWood", () => ({ color: "#8a5a34" })), wood2 = lam("clWood2", () => ({ color: "#6a4428" })), iron = lam("clIron", () => ({ color: "#5a5a64" }));
    const rope = lam("clRope", () => ({ color: "#d8c8a0" }));

    // the strand: dry sand to z = -3, wet sand sloping to the water at SHORE_Z and under it
    b.add(quad(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -3), V(-80, 0, -3), 20, 11), sand);
    b.add(quad(V(-80, 0, -3), V(80, 0, -3), V(80, -0.25, SHORE_Z - 1), V(-80, -0.25, SHORE_Z - 1), 20, 1.5), wet);
    b.add(quad(V(-80, -0.25, SHORE_Z - 1), V(80, -0.25, SHORE_Z - 1), V(80, -1.5, SHORE_Z - 30), V(-80, -1.5, SHORE_Z - 30), 20, 6), wet);
    // dunes behind the beach, with marram tufts
    for (let i = 0; i < 14; i++) {
      const x = -12 + i * 7 + Math.sin(i * 2.3) * 2, z = 20 + Math.cos(i * 1.7) * 3, s = 3 + 1.5 * Math.sin(i * 1.3);
      deco.add(new THREE.SphereGeometry(s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dune, at(x, -0.2, z, 0, 0, 0, 1));
      for (let k = 0; k < 4; k++) deco.add(new THREE.ConeGeometry(0.25, 1.0, 5), marram, at(x + Math.cos(k * 1.6) * s * 0.5, s * 0.8 + 0.3, z + Math.sin(k * 1.6) * s * 0.5, 0.2 * Math.sin(k), 0, 0.2 * Math.cos(k)));
    }
    // the cliff: a chalk wall facing +x along x = CLIFF_X, curving out to sea, a grass cap
    const cliffSeg = (x0: number, z0: number, z1: number, depth: number) => {
      b.add(boxGeo(V(x0 - depth, -2, z1), V(x0, CLIFF_H, z0), 4), chalk);
      deco.add(boxGeo(V(x0 - depth - 0.2, CLIFF_H, z1 - 0.2), V(x0 + 0.25, CLIFF_H + 0.35, z0 + 0.2)), turf);
    };
    for (let i = 0; i < 9; i++) cliffSeg(CLIFF_X - 0.4 * Math.sin(i * 1.9) - (i < 3 ? 0 : (i - 2) * 0.35), 40 - i * 5, 35 - i * 5, 60);
    // the headland edge under the lighthouse: its own group so it can give way in 1644
    this.edge.position.set(CLIFF_X, 0, -12.5);
    const eb = new Batch();
    eb.add(boxGeo(V(-12, -2, -6.5), V(0, CLIFF_H, 6.5), 4), chalk);
    eb.add(boxGeo(V(-12.2, CLIFF_H, -6.7), V(0.25, CLIFF_H + 0.35, 6.7)), turf);
    eb.build(this.edge, true);
    b.add(boxGeo(V(CLIFF_X - 60, -2, -60), V(CLIFF_X - 12, CLIFF_H, -19)), chalk); // the headland behind it (stays)
    deco.add(boxGeo(V(CLIFF_X - 60, CLIFF_H, -60), V(CLIFF_X - 12, CLIFF_H + 0.35, -19)), turf);
    this.root.add(this.edge);

    // the lighthouse: twelve octagonal stages stepping in, banded stone + tile, a fire basket on top
    const tm = twoTone(new THREE.MeshLambertMaterial({ map: towerT() }));
    this.tower.position.set(LH[0] - this.edge.position.x, LH[1], LH[2] - this.edge.position.z);
    for (let i = 0; i < STAGES; i++) {
      const r0 = 2.6 - i * 0.16, r1 = r0 - 0.1;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, STAGE_H, 8), tm);
      st.position.y = i * STAGE_H + STAGE_H / 2; st.castShadow = st.receiveShadow = true;
      const ledge = new THREE.Mesh(new THREE.CylinderGeometry(r1 + 0.12, r1 + 0.12, 0.12, 8), lam("clLedge", () => ({ color: "#c8bca4" })));
      ledge.position.y = STAGE_H / 2; st.add(ledge);
      this.tower.add(st); this.stages.push(st);
    }
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.6, 8), iron);
    basket.position.y = 0.3; this.fire.add(basket);
    this.fire.position.y = STAGES * STAGE_H; this.tower.add(this.fire);
    this.edge.add(this.tower);
    // the fire (a flame card + glow, world-placed at the top of the finished tower)
    const fx = LH[0], fy = LH[1] + STAGES * STAGE_H + 1.2, fz = LH[2];
    this.flame(fx, fy, fz, 1.4, 2.6, 4.0); this.glow(fx, fy, fz, 9, 0.6);

    // the rubble at the cliff foot (shown after the fall)
    const rb = new Batch();
    for (let i = 0; i < 14; i++) {
      const x = RUBBLE[0] + Math.sin(i * 2.7) * 3.2, z = RUBBLE[2] + Math.cos(i * 1.9) * 3.5, s = 0.8 + 0.9 * Math.abs(Math.sin(i * 1.3));
      rb.add(new THREE.DodecahedronGeometry(s, 0), i % 3 ? chalk : tm, at(x, s * 0.4 - 0.5, z, i, i * 0.7, 0));
    }
    for (let i = 0; i < 3; i++) rb.add(new THREE.CylinderGeometry(1.6 - i * 0.3, 1.8 - i * 0.3, 1.1, 8), tm, at(RUBBLE[0] + 2 + i * 1.6, 0.2, RUBBLE[2] + 2.5 - i * 1.2, Math.PI / 2 - 0.2 * i, 0.4 * i, 0.3));
    rb.build(this.rubble, true);
    this.rubble.visible = false; this.root.add(this.rubble);

    // ballistas: a trestle, the stock with a slide, two torsion arms, a bowstring, a bolt aimed out to sea (-z)
    for (const [x, , z] of BALLISTAS) {
      const g = new Batch();
      g.add(boxGeo(V(-0.5, 0, -0.3), V(0.5, 0.12, 0.3)), wood2);
      for (const s of [-1, 1]) g.add(boxGeo(V(s * 0.4 - 0.06, 0, -0.06), V(s * 0.4 + 0.06, 0.9, 0.06)), wood2);
      g.add(boxGeo(V(-0.12, 0.85, -1.0), V(0.12, 1.0, 1.0)), wood); // the stock along z
      g.add(boxGeo(V(-0.42, 0.8, -0.95), V(0.42, 1.2, -0.75)), wood2); // the frame holding the springs
      for (const s of [-1, 1]) {
        g.add(cyl(0.09, 0.09, 0.5, 8), rope, at(s * 0.3, 1.0, -0.85));
        g.add(boxGeo(V(-0.04, -0.04, 0), V(0.04, 0.04, 0.7)), wood, at(s * 0.32, 1.0, -0.85, 0, s * 0.9, 0));
      }
      g.add(boxGeo(V(-0.85, 0.99, 0.12), V(0.85, 1.01, 0.15)), rope); // the drawn bowstring
      g.add(cyl(0.03, 0.03, 1.5, 6), wood, at(0, 1.06, -0.4, Math.PI / 2, 0, 0)); // the bolt
      g.add(new THREE.ConeGeometry(0.06, 0.22, 6), iron, at(0, 1.06, -1.25, -Math.PI / 2, 0, 0));
      const grp = new THREE.Group(); g.build(grp, true); grp.position.set(x, 0, z); this.ballistas.add(grp);
    }
    this.root.add(this.ballistas);

    b.build(this.root, false); deco.build(this.root, true);
    // the sea: a big lit plane with a drifting ripple map
    const wt = waterT(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(60, 40);
    this.water = twoTone(new THREE.MeshLambertMaterial({ map: wt, color: "#2a6a90", emissive: "#1a4a6a", emissiveIntensity: 1 }));
    const w = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), this.water);
    w.rotation.x = -Math.PI / 2; w.position.set(0, -0.08, SHORE_Z - 250 + 0.6); w.receiveShadow = true; this.root.add(w);
    // surf: three foam bands on the wet sand, washing in and out
    const fm = new THREE.MeshBasicMaterial({ map: foamT(), transparent: true, depthWrite: false, fog: true });
    fm.map!.repeat.set(12, 1);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 1.2), fm);
      m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.layers.set(NOINK); this.root.add(m); this.foam.push(m);
    }
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
  }
  /** surf line z at time t (a slow wash in and out) */
  static surfZ(t: number, i = 0) { return SHORE_Z + 0.5 + 0.7 * Math.sin(t * 0.9 + i * 2.1) - i * 0.9; }
  /** sky, sea colour, surf; build = lighthouse stages standing (0..12), fire on/off, fall 0..1 (the 1644 collapse), rubble shown */
  pose(skyKey: string, camPos: THREE.Vector3, t: number, o: { build: number; fire: boolean; fall: number; rubble: boolean; ballistas: boolean }) {
    (this.dome.material as THREE.MeshBasicMaterial).map = this.skies[skyKey] ?? this.skies.day;
    this.dome.position.copy(camPos);
    const sea: Record<string, string> = { day: "#2a7aa0", morning: "#3a80a8", golden: "#4a6a98", night: "#1a2a52", storm: "#2a3448" };
    this.water.color.set(sea[skyKey] ?? sea.day);
    const glow: Record<string, string> = { day: "#103a58", morning: "#184a68", golden: "#3a4a78", night: "#0a1430", storm: "#141a28" };
    this.water.emissive.set(glow[skyKey] ?? glow.day);
    this.water.map!.offset.set(t * 0.01, t * 0.03);
    this.foam.forEach((m, i) => { m.position.set(0, -0.02 + 0.005 * i, Beach.surfZ(t, i)); (m.material as THREE.MeshBasicMaterial).opacity = skyKey === "night" || skyKey === "storm" ? 0.55 : 0.95; });
    this.stages.forEach((s, i) => { const k = Math.max(0, Math.min(1, o.build - i)); s.visible = k > 0; s.scale.set(1, Math.max(0.001, k), 1); s.position.y = i * STAGE_H + (STAGE_H * k) / 2; });
    this.fire.visible = o.build >= STAGES;
    this.setFlames(o.fire && o.fall < 0.3);
    // the fall: the headland edge drops and tips out toward the sea, the tower toppling further on it
    const f = o.fall;
    this.edge.visible = !o.rubble;
    this.edge.position.y = -9 * f * f; this.edge.rotation.z = -0.5 * f * f; this.edge.rotation.x = -0.25 * f;
    this.tower.rotation.x = -1.1 * f * f; this.tower.rotation.z = -0.3 * f;
    this.rubble.visible = o.rubble;
    this.ballistas.visible = o.ballistas;
  }
}
