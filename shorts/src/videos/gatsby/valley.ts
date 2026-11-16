// The valley of ashes (ch. 2), at night: grey ash ground and ash heaps, the road along x (z -2.5..2.5), Wilson's garage
// (a small shabby block on the left of the road, x 3..8, z -9..-4) with a petrol pump, a faded billboard of
// Dr. T. J. Eckleburg's eyes (no lettering) on stilts, telegraph poles, a dark sky with a low moon, and Gatsby's yellow
// roadster (posable: x, z, yaw, headlights on; seats at SEAT_Y).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Pen } from "../../engine/toon";
import { fxEyes } from "../../engine/library/gatsby";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const BILLBOARD: V3 = [-24, 6.4, -6];
export const BB_W = 10, BB_H = 4.7;
export const PUMP: V3 = [3.4, 0, -3.4];
export const GARAGE = { x0: 3, x1: 9, z0: -10, z1: -4.2, h: 3.4 };
/** car: origin = ground under the middle; length along +x (bonnet at +x); seat cushion top */
export const SEAT_Y = 0.62;
export const SEATS = { driver: [-0.35, 0.36] as [number, number], passenger: [-0.35, -0.36] as [number, number] };

const ash = () => ctex("vaAsh", 512, 512, (g, r) => {
  g.fillStyle = "#8a8a8e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,110,116,0.5)" : "rgba(170,170,174,0.45)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 6, 0, Math.PI * 2); g.fill(); }
});
const road = () => ctex("vaRoad", 512, 128, (g, r) => {
  g.fillStyle = "#5a5a60"; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(70,70,76,0.5)" : "rgba(120,120,126,0.4)"; g.fillRect(r() * 512, r() * 128, 3, 2); }
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#c8c4b0"; g.fillRect(x, 61, 34, 5); }
});
const skyTex = () => ctex("vaSky", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#06081a"); gr.addColorStop(0.36, "#141a36"); gr.addColorStop(0.5, "#2c3050"); gr.addColorStop(1, "#2c3050");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + 0.6 * r()})`; g.fillRect(r() * 256, r() * 200, 1, 1); }
});
const moonTex = () => ctex("vaMoon", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,240,210,1)"); gr.addColorStop(0.45, "rgba(255,240,210,1)"); gr.addColorStop(0.5, "rgba(255,240,210,0.2)"); gr.addColorStop(1, "rgba(255,240,210,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const shed = () => ctex("vaShed", 256, 256, (g, r) => {
  g.fillStyle = "#b8ae9a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,110,96,${0.2 + 0.3 * r()})`; g.fillRect(r() * 256, r() * 256, 20 + r() * 60, 4 + r() * 10); }
  for (let y = 0; y < 256; y += 32) { g.fillStyle = "rgba(90,84,76,0.6)"; g.fillRect(0, y, 256, 3); }
});
const eyesTex = () => ctex("vaEyes", 1024, 480, (g) => fxEyes(new Pen(g)));

export class Valley extends Room {
  private moon: THREE.Sprite;
  car = new THREE.Group();
  private lamps: THREE.Mesh[] = [];
  private glows2: THREE.Sprite[] = [];
  private dome: THREE.Mesh;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const ashM = twoTone(new THREE.MeshLambertMaterial({ map: ash() }));
    const roadM = twoTone(new THREE.MeshLambertMaterial({ map: road() }));
    const heap = lam("vaHeap", () => ({ color: "#8e8e94" })), heap2 = lam("vaHeap2", () => ({ color: "#7a7a82" }));
    const shedM = lam("vaShedM", () => ({ map: shed() }));
    const roofM = lam("vaRoof", () => ({ color: "#4a4448" }));
    const wood = lam("vaWood", () => ({ color: "#6a5a4a" })), dark = lam("vaDark", () => ({ color: "#2a2a30" }));
    const red = lam("vaPump", () => ({ color: "#c8302e" })), cream = lam("vaCream", () => ({ color: "#efe6cc" }));
    b.add(quad(V(-200, 0, 200), V(200, 0, 200), V(200, 0, -200), V(-200, 0, -200), 70, 70), ashM);
    b.add(quad(V(-200, 0.01, 2.5), V(200, 0.01, 2.5), V(200, 0.01, -2.5), V(-200, 0.01, -2.5), 80, 1), roadM);
    // ash heaps: lumpy grey mounds, nearer ones lower
    for (let i = 0; i < 46; i++) {
      const a = i * 2.39, r = 14 + (i % 9) * 7 + 3 * Math.sin(i * 7), x = r * Math.cos(a) * 1.4, z = r * Math.sin(a);
      if (Math.abs(z) < 7 || (x > 0 && x < 12 && z < 0 && z > -14)) continue;
      const h = 2 + (r / 60) * 6 + 1.5 * Math.abs(Math.sin(i)), w = h * (1.6 + 0.5 * Math.sin(i * 3));
      deco.add(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? heap : heap2, at(x, 0, z).scale(V(w, h, w * 0.8)));
    }
    // Wilson's garage: a shabby block, a big dark doorway, a small window, a flat roof
    const { x0, x1, z0, z1, h } = GARAGE;
    b.add(boxGeo(V(x0, 0, z0), V(x1, h, z1), 1.5), shedM);
    fix.add(boxGeo(V(x0 - 0.2, h, z0 - 0.2), V(x1 + 0.2, h + 0.2, z1 + 0.2)), roofM);
    fix.add(boxGeo(V(x0 + 0.6, 0, z1), V(x0 + 3.2, 2.6, z1 + 0.04)), dark);
    const winM = new THREE.Mesh(quad(V(x1 - 2.2, 1.2, z1 + 0.05), V(x1 - 0.8, 1.2, z1 + 0.05), V(x1 - 0.8, 2.3, z1 + 0.05), V(x1 - 2.2, 2.3, z1 + 0.05)), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.3, 0.7) }));
    winM.layers.set(NOINK); this.root.add(winM);
    // the petrol pump: a tall red column with a white glass globe
    const [px, , pz] = PUMP;
    deco.add(boxGeo(V(px - 0.25, 0, pz - 0.25), V(px + 0.25, 1.9, pz + 0.25)), red);
    deco.add(new THREE.SphereGeometry(0.24, 12, 10), cream, at(px, 2.15, pz));
    deco.add(cyl(0.02, 0.02, 1.0, 4), dark, at(px + 0.32, 1.0, pz, 0, 0, 0.3));
    // the billboard on stilts, facing the road (+z)
    const [bx, by, bz] = BILLBOARD;
    for (const s of [-1, 1]) for (const dz of [-0.2, 0.2]) deco.add(cyl(0.12, 0.14, by, 6), wood, at(bx + s * (BB_W / 2 - 1), by / 2, bz + dz - 0.3));
    fix.add(boxGeo(V(bx - BB_W / 2 - 0.15, by - BB_H / 2 - 0.15, bz - 0.25), V(bx + BB_W / 2 + 0.15, by + BB_H / 2 + 0.15, bz - 0.05)), wood);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(BB_W, BB_H), twoTone(new THREE.MeshLambertMaterial({ map: eyesTex() })));
    bm.position.set(bx, by, bz); this.root.add(bm);
    // telegraph poles along the road with sagging wires
    for (let x = -60; x <= 60; x += 15) if (x < -34 || x > -14) { deco.add(cyl(0.1, 0.12, 6, 6), wood, at(x, 3, -3.6)); deco.add(boxGeo(V(x - 0.6, 5.6, -3.65), V(x + 0.6, 5.7, -3.55)), wood); }
    b.build(this.root, false);
    deco.build(this.root, true);
    fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), fog: false, depthWrite: false, transparent: true }));
    this.moon.scale.set(12, 12, 1); this.moon.layers.set(NOINK); this.moon.renderOrder = -1; this.root.add(this.moon);
    this.buildCar();
    this.root.add(this.car);
  }

  /** the yellow roadster (rich cream-yellow, nickel trim, ch. 4): long bonnet toward +x, open two-seat cockpit */
  private buildCar() {
    const b = new Batch();
    const yel = lam("vaCar", () => ({ color: "#f2c838" })), nickel = lam("vaNickel", () => ({ color: "#d8dce4" }));
    const tyre = lam("vaTyre", () => ({ color: "#1e1e22" })), seat = lam("vaSeat", () => ({ color: "#5a2a24" })), glass = lam("vaGlass", () => ({ color: "#3a4a6a" }));
    b.add(boxGeo(V(-1.6, 0.35, -0.72), V(2.1, 0.55, 0.72)), yel); // body sill
    b.add(boxGeo(V(0.3, 0.55, -0.62), V(2.1, 1.05, 0.62)), yel); // long bonnet
    b.add(boxGeo(V(2.1, 0.5, -0.5), V(2.22, 1.05, 0.5)), nickel); // radiator
    b.add(boxGeo(V(-1.6, 0.55, -0.72), V(-0.9, 1.0, 0.72)), yel); // rear deck
    for (const s of [-1, 1]) b.add(boxGeo(V(-0.9, 0.55, s * 0.72 - (s > 0 ? 0.08 : 0)), V(0.3, 0.9, s * 0.72 + (s < 0 ? 0.08 : 0))), yel); // cockpit sides
    b.add(boxGeo(V(-0.85, 0.55, -0.62), V(0.2, SEAT_Y, 0.62)), seat); // seat cushion
    b.add(boxGeo(V(-0.9, SEAT_Y, -0.62), V(-0.75, 1.15, 0.62)), seat); // seat back
    b.add(boxGeo(V(0.28, 1.05, -0.6), V(0.32, 1.45, 0.6)), glass); // windscreen
    for (const [x, s] of [[1.5, -1], [1.5, 1], [-1.1, -1], [-1.1, 1]] as const) {
      b.add(cyl(0.38, 0.38, 0.22, 18), tyre, at(x, 0.38, s * 0.82, Math.PI / 2, 0, 0));
      b.add(cyl(0.18, 0.18, 0.24, 12), nickel, at(x, 0.38, s * 0.82, Math.PI / 2, 0, 0));
      b.add(new THREE.CylinderGeometry(0.48, 0.48, 0.28, 16, 1, false, 0, Math.PI), yel, at(x, 0.42, s * 0.82, Math.PI / 2, 0, 0));
    }
    for (const s of [-1, 1]) b.add(boxGeo(V(-1.0, 0.36, s * 0.86 - 0.12), V(1.05, 0.42, s * 0.86 + 0.12)), nickel); // running boards
    b.add(cyl(0.08, 0.08, 0.02, 10), nickel, at(0.05, 1.1, 0.36, 0, 0, 0.6)); // steering wheel
    b.build(this.car, true);
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.7, 1.9) }));
      m.position.set(2.25, 0.95, s * 0.45); m.layers.set(NOINK); this.car.add(m); this.lamps.push(m);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("vaGlow", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }),
        color: new THREE.Color(1.4, 1.25, 0.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      gl.position.set(2.3, 0.95, s * 0.45); gl.scale.set(1.4, 1.4, 1); gl.layers.set(NOINK); gl.renderOrder = 5; this.car.add(gl); this.glows2.push(gl);
    }
  }

  pose(car: { on: boolean; x: number; z: number; yaw: number; bounce: number }, camPos?: THREE.Vector3) {
    this.car.visible = car.on;
    this.car.position.set(car.x, car.bounce, car.z); this.car.rotation.y = car.yaw;
    if (camPos) { this.dome.position.copy(camPos); this.moon.position.set(camPos.x - 60, camPos.y + 35, camPos.z - 120); }
  }
}
