// The Stranger's interiors (and the dawn square). Floor y = 0 everywhere; the cameras mostly look toward -z.
// - Vigil: the whitewashed mortuary of the old people's home at Marengo. Closed coffin on trestles, a row of straw
//   chairs behind it for the mother's old friends, a skylight and one harsh bare bulb.
// - Office: the shipping-office desk under a big window onto the white rooftops and the harbour; at night the same room
//   is his flat (desk cleared, a bed, the window shows the night street and the moon).
// - Cinema: rows of seats lit only by the flicker of the (unseen) screen behind the lens.
// - Court: a hot yellow courtroom: judges' bench, the jury box, the dock rail, a high window with a hard sunbeam, a fan.
// - Square: a paved square at dawn, white houses with shutters, plane trees (the imagined execution crowd).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

const shell = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material | null, tile = 2) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / tile, (z1 - z0) / tile), floor);
  b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, z1), 2), wall);
  b.add(boxGeo(V(x1, 0, z0), V(x1 + 0.4, h, z1), 2), wall);
  b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), wall);
  if (ceil) b.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.3, z1 + 0.4), 0, true), ceil);
};
const lime = (key: string, base = "#efe9dc") => lam(key, () => ({ map: stoneHD(key, [base, "#e8e1d2", "#f3eee4", "#e2dacb"], "#d2c9b8") }));

// ---------------- vigil ----------------
export const COFFIN: V3 = [0, 0, -1.9];
export const VIGIL = { x0: -3.6, x1: 3.6, z0: -4.2, z1: 4, h: 3.4 };
export class Vigil extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = VIGIL;
    const wall = lime("vgWall");
    const floor = lam("vgFloor", () => ({ map: stoneHD("vgFloor", ["#c9b9a2", "#bfae96", "#d1c2ac", "#b8a68e"], "#8e7e68") }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("vgCeil", () => ({ color: "#e6dfd0" })));
    b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
    // skylight: a pale night pane in the ceiling
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.26, 0.5) }));
    sky.rotation.x = Math.PI / 2; sky.position.set(-0.8, h - 0.01, -0.4); sky.layers.set(NOINK); this.root.add(sky);
    // the coffin: dark stained wood with a lid screwed down (brass screw heads), on two trestles
    const wood = lam("vgCoffin", () => ({ color: "#5a3424" })), wood2 = lam("vgCoffin2", () => ({ color: "#4a2a1c" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const [cx, , cz] = COFFIN;
    deco.add(boxGeo(V(cx - 1.0, 0.7, cz - 0.32), V(cx + 1.0, 1.15, cz + 0.32)), wood);
    deco.add(boxGeo(V(cx - 1.04, 1.15, cz - 0.36), V(cx + 1.04, 1.24, cz + 0.36)), wood2);
    for (const dx of [-0.85, -0.3, 0.3, 0.85]) deco.add(cyl(0.03, 0.03, 0.02, 10), brass, at(cx + dx, 1.25, cz + 0.2));
    const trestle = lam("vgTrestle", () => ({ color: "#3a2a20" }));
    for (const dx of [-0.7, 0.7]) for (const s of [-1, 1]) deco.add(boxGeo(V(-0.04, 0, -0.04), V(0.04, 0.72, 0.04)), trestle, at(cx + dx + s * 0.18, 0, cz, 0, 0, s * 0.22));
    // straw chairs: a row behind the coffin (the old friends), a few on the near side
    const straw = lam("vgStraw", () => ({ color: "#d8b468" })), frame = lam("vgChair", () => ({ color: "#6a4630" }));
    const chair = (x: number, z: number) => {
      deco.add(boxGeo(V(x - 0.22, 0.42, z - 0.22), V(x + 0.22, 0.47, z + 0.22)), straw);
      for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) deco.add(boxGeo(V(x + dx - 0.02, 0, z + dz - 0.02), V(x + dx + 0.02, 0.42, z + dz + 0.02)), frame);
      deco.add(boxGeo(V(x - 0.22, 0.47, z - 0.24), V(x + 0.22, 0.95, z - 0.2)), frame);
    };
    for (const x of VIGIL_SEATS) chair(x, -3.35);
    // the bare bulb on its flex
    deco.add(cyl(0.008, 0.008, 0.6, 4), lam("vgFlex", () => ({ color: "#222" })), at(0.2, h - 0.3, -0.9));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.8, 3.2) }));
    bulb.position.set(0.2, h - 0.65, -0.9); bulb.layers.set(NOINK); this.root.add(bulb);
    this.glow(0.2, h - 0.65, -0.9, 1.6, 0.8);
    b.build(this.root, false); deco.build(this.root, true);
  }
}
export const VIGIL_SEATS = [-2.6, -1.6, -0.6, 0.6, 1.6, 2.6];

// ---------------- office / flat ----------------
export const OFFICE = { x0: -3.5, x1: 3.5, z0: -3.6, z1: 4, h: 3.3 };
export const DESK = { x0: -1.1, x1: 1.1, z0: -1.55, z1: -0.85, top: 0.78 };
const viewTex = (night: boolean) => ctex(night ? "ofViewN" : "ofViewD", 512, 512, (g, r) => {
  const sky = g.createLinearGradient(0, 0, 0, 300);
  if (night) { sky.addColorStop(0, "#0c1430"); sky.addColorStop(1, "#2a3460"); } else { sky.addColorStop(0, "#5aa0e8"); sky.addColorStop(1, "#d8ecf8"); }
  g.fillStyle = sky; g.fillRect(0, 0, 512, 512);
  if (night) { g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(380, 80, 26, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,240,0.8)"; g.fillRect(r() * 512, r() * 200, 2, 2); } }
  // sea + harbour crane silhouettes
  g.fillStyle = night ? "#1a2a50" : "#3a8ab8"; g.fillRect(0, 250, 512, 70);
  g.strokeStyle = night ? "#0a0e1c" : "#5a5a64"; g.lineWidth = 6;
  for (const x of [90, 170, 420]) { g.beginPath(); g.moveTo(x, 260); g.lineTo(x, 170); g.lineTo(x + 60, 150); g.stroke(); }
  // white cubic rooftops
  for (let i = 0; i < 40; i++) {
    const x = (i % 10) * 54 - 10 + r() * 14, y = 300 + Math.floor(i / 10) * 52 + r() * 16, w = 48 + r() * 20, hh = 60 + r() * 40;
    g.fillStyle = night ? (r() < 0.25 ? "#e8c070" : "#4a5070") : r() < 0.85 ? "#f8f4ec" : "#e8d8bc"; g.fillRect(x, y, w, hh);
    g.fillStyle = night ? "rgba(10,12,30,0.5)" : "rgba(110,130,170,0.35)"; g.fillRect(x + w * 0.65, y, w * 0.35, hh);
  }
});
export class Office extends Room {
  private pane: THREE.MeshBasicMaterial;
  private views = { day: viewTex(false), night: viewTex(true) };
  private work = new THREE.Group();
  private home = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), work = new Batch(), home = new Batch();
    const { x0, x1, z0, z1, h } = OFFICE;
    const wall = lam("ofWall", () => ({ color: "#e8dcc0" })), dado = lam("ofDado", () => ({ color: "#5a7a6a" }));
    const floor = lam("ofFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("ofCeil", () => ({ color: "#efe6d2" })));
    // back wall with one big window (x -1.3..1.3, y 1.0..2.7) onto the rooftops
    const wx0 = -1.3, wx1 = 1.3, wy0 = 1.0, wy1 = 2.7;
    b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(wx0, h, z0), 2), wall);
    b.add(boxGeo(V(wx1, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
    b.add(boxGeo(V(wx0, 0, z0 - 0.4), V(wx1, wy0, z0), 2), wall);
    b.add(boxGeo(V(wx0, wy1, z0 - 0.4), V(wx1, h, z0), 2), wall);
    for (const [a, c] of [[x0, wx0], [wx1, x1]]) b.add(boxGeo(V(a, 0, z0), V(c, 0.9, z0 + 0.03)), dado);
    this.pane = new THREE.MeshBasicMaterial({ map: this.views.day });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wy1 - wy0), this.pane);
    pane.position.set(0, (wy0 + wy1) / 2, z0 - 0.35); pane.layers.set(NOINK); this.root.add(pane);
    const frame = lam("ofFrame", () => ({ color: "#f4f0e8" }));
    deco.add(boxGeo(V(-0.03, wy0, z0 - 0.2), V(0.03, wy1, z0 - 0.14)), frame);
    deco.add(boxGeo(V(wx0, (wy0 + wy1) / 2 - 0.03, z0 - 0.2), V(wx1, (wy0 + wy1) / 2 + 0.03, z0 - 0.14)), frame);
    // desk
    const { x0: dx0, x1: dx1, z0: dz0, z1: dz1, top } = DESK;
    const oak = lam("ofDesk", () => ({ color: "#7a4a2e" }));
    deco.add(boxGeo(V(dx0, top - 0.05, dz0), V(dx1, top, dz1)), oak);
    deco.add(boxGeo(V(dx0, 0, dz0), V(dx0 + 0.45, top - 0.05, dz1)), oak);
    deco.add(boxGeo(V(dx1 - 0.45, 0, dz0), V(dx1, top - 0.05, dz1)), oak);
    // the office dressing: paper stacks, a rubber stamp, a filing cabinet, a wall calendar block
    const paper = lam("ofPaper", () => ({ color: "#f4ecd8" }));
    for (const [x, n] of [[-0.8, 9], [0.75, 6]] as const) for (let i = 0; i < n; i++) work.add(boxGeo(V(x - 0.15, top + i * 0.012, dz0 + 0.1), V(x + 0.15, top + i * 0.012 + 0.01, dz0 + 0.42)), paper, at(0, 0, 0, 0, 0.02 * Math.sin(i * 3.1), 0));
    work.add(boxGeo(V(2.4, 0, -3.5), V(3.3, 1.3, -2.9)), lam("ofCab", () => ({ color: "#6a7078" })));
    for (let i = 0; i < 3; i++) work.add(boxGeo(V(2.6, 0.25 + i * 0.4, -2.89), V(3.1, 0.28 + i * 0.4, -2.86)), lam("ofHandle", () => ({ color: "#d0d4da" })));
    // the flat dressing: an iron bed on the left, a chair, a mirror
    const iron = lam("ofIron", () => ({ color: "#2a2a30" })), sheet = lam("ofSheet", () => ({ color: "#f2efe6" }));
    home.add(boxGeo(V(-3.4, 0.4, -3.4), V(-2.0, 0.6, -1.4)), sheet);
    for (const z of [-3.4, -1.4]) home.add(boxGeo(V(-3.4, 0, z - 0.03), V(-2.0, 0.9, z + 0.03)), iron);
    b.build(this.root, false); deco.build(this.root, true);
    work.build(this.work, true); home.build(this.home, true);
    this.root.add(this.work, this.home);
  }
  pose(night: boolean) { this.pane.map = night ? this.views.night : this.views.day; this.work.visible = !night; this.home.visible = night; }
}

// ---------------- cinema ----------------
export class Cinema extends Room {
  private beam: THREE.Sprite;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const wall = lam("cnWall", () => ({ color: "#4a2a34" })), floor = lam("cnFloor", () => ({ color: "#3a2a2a" }));
    shell(b, -5, 5, -4, 7, 4.5, wall, floor, lam("cnCeil", () => ({ color: "#2a1a22" })));
    b.add(boxGeo(V(-5.4, 0, -4.4), V(5.4, 4.5, -4)), wall);
    // rows of red plush seats facing -z (the screen is behind the camera, at z -4)
    const plush = lam("cnPlush", () => ({ color: "#b02a34" })), arm = lam("cnArm", () => ({ color: "#3a2224" }));
    for (const [z, y] of [[0, 0], [1.4, 0.18], [2.8, 0.36], [4.2, 0.54]] as const) {
      if (y > 0) b.add(boxGeo(V(-5, 0, z - 0.7), V(5, y, z + 0.7)), floor);
      for (let x = -4.2; x <= 4.21; x += 0.7) {
        deco.add(boxGeo(V(x - 0.3, y + 0.38, z - 0.25), V(x + 0.3, y + 0.48, z + 0.2)), plush);
        deco.add(boxGeo(V(x - 0.3, y + 0.48, z + 0.15), V(x + 0.3, y + 1.0, z + 0.25)), plush);
        deco.add(boxGeo(V(x + 0.3, y, z - 0.25), V(x + 0.36, y + 0.62, z + 0.25)), arm);
      }
    }
    b.build(this.root, false); deco.build(this.root, true);
    // the projector's beam from the booth window high on the back wall
    this.glow(0.6, 3.9, 6.6, 1.2, 0.9);
    this.beam = this.glows[this.glows.length - 1];
  }
  flicker(t: number) { const k = 0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7.3); this.beam.material.opacity = k; }
}

// ---------------- courtroom ----------------
export const COURT = { x0: -6, x1: 6, z0: -6, z1: 6, h: 5.6 };
export const DOCK: V3 = [-3.3, 0.35, -1.2];
export class Court extends Room {
  private fan = new THREE.Group();
  private beam: THREE.Mesh;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fx = new Batch();
    const { x0, x1, z0, z1, h } = COURT;
    const wall = lam("ctWall", () => ({ color: "#e6cf98" })), panel = lam("ctPanel", () => ({ color: "#7a4a2a" })), panel2 = lam("ctPanel2", () => ({ color: "#5e3820" }));
    const floor = lam("ctFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("ctCeil", () => ({ color: "#d8bc84" })));
    b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
    // wainscot round the room
    b.add(boxGeo(V(x0, 0, z0), V(x1, 1.4, z0 + 0.06)), panel2);
    b.add(boxGeo(V(x0, 0, z0), V(x0 + 0.06, 1.4, z1)), panel2);
    b.add(boxGeo(V(x1 - 0.06, 0, z0), V(x1, 1.4, z1)), panel2);
    // the judges' bench: a raised dais and a long panelled desk across the back
    deco.add(boxGeo(V(-3.2, 0, -5.9), V(3.2, 0.5, -4.4)), panel2);
    deco.add(boxGeo(V(-3.2, 0.5, -4.6), V(3.2, 1.6, -4.3)), panel);
    deco.add(boxGeo(V(-3.3, 1.6, -4.7), V(3.3, 1.68, -4.2)), panel2);
    for (const x of [-1.6, 0, 1.6]) deco.add(boxGeo(V(x - 0.35, 0.5, -5.8), V(x + 0.35, 2.6, -5.6)), lam("ctChair", () => ({ color: "#6a1a1a" })));
    // jury box on the right: two raised benches behind a rail
    for (const [z, y] of [[-2.6, 0.2], [-1.6, 0.5]] as const) {
      deco.add(boxGeo(V(3.0, 0, z - 0.45), V(5.9, y, z + 0.45)), panel2);
      deco.add(boxGeo(V(3.0, y + 0.4, z - 0.15), V(5.9, y + 0.48, z + 0.15)), panel);
    }
    deco.add(boxGeo(V(2.9, 0, -0.95), V(5.9, 1.05, -0.85)), panel);
    // the dock on the left: a low platform with a rail in front
    deco.add(boxGeo(V(-4.6, 0, -1.9), V(-2.0, 0.35, -0.5)), panel2);
    deco.add(boxGeo(V(-4.6, 0.35, -0.55), V(-2.0, 1.3, -0.45)), panel);
    for (const x of [-4.55, -2.05]) deco.add(boxGeo(V(x - 0.05, 0.35, -1.9), V(x + 0.05, 1.3, -0.5)), panel);
    // the high window on the left wall + the hard sunbeam slanting across the room
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.0, 2.4) }));
    pane.position.set(x0 + 0.02, 4.2, -2.0); pane.rotation.y = Math.PI / 2; pane.layers.set(NOINK); this.root.add(pane);
    const beamTex = ctex("ctBeam", 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,240,190,0.55)"); gr.addColorStop(1, "rgba(255,240,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
    this.beam = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 6), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    this.beam.layers.set(NOINK); this.beam.renderOrder = 6; this.root.add(this.beam);
    this.aimBeam(DOCK);
    // ceiling fan
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#c9a04a", specular: "#fff0c0", shininess: 70 }), 0.2);
    fx.add(cyl(0.02, 0.02, 0.8, 6), brass, at(0, h - 0.4, 0));
    const blades = new Batch();
    for (let i = 0; i < 4; i++) blades.add(boxGeo(V(0.1, -0.015, -0.1), V(0.95, 0.015, 0.1)), lam("ctBlade", () => ({ color: "#5a3a22" })), at(0, 0, 0, 0, (i * Math.PI) / 2, 0));
    blades.build(this.fan, true); this.fan.position.set(0, h - 0.8, 0); this.root.add(this.fan);
    b.build(this.root, false); deco.build(this.root, true); fx.build(this.root, false);
  }
  /** point the window's sunbeam at a spot (the dock by default) */
  aimBeam(p: V3, k = 1) {
    const from = V(COURT.x0 + 0.1, 4.2, -2.0), to = V(p[0], p[1] + 1.5, p[2]), mid = from.clone().lerp(to, 0.5);
    this.beam.position.copy(mid); this.beam.lookAt(to); this.beam.rotateX(Math.PI / 2);
    this.beam.scale.set(1, from.distanceTo(to) / 6, 1);
    (this.beam.material as THREE.MeshBasicMaterial).opacity = k;
  }
  spin(t: number, on = true) { this.fan.rotation.y = on ? t * 2.2 : 0; }
}

// ---------------- the square at dawn ----------------
export class Square extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const pave = lam("sqPave", () => ({ map: stoneHD("sqPave", ["#c8bcae", "#bfb2a2", "#d0c4b6", "#b6a998"], "#8a7e72") }));
    b.add(quad(V(-40, 0, 30), V(40, 0, 30), V(40, 0, -40), V(-40, 0, -40), 20, 18), pave);
    const white = lime("sqHouse", "#f2ece0"), shut = lam("sqShut", () => ({ color: "#3a6ab0" })), roof = lam("sqRoof", () => ({ color: "#c86a48" }));
    const house = (x: number, z: number, w: number, hgt: number, yaw: number) => {
      const g = new Batch();
      g.add(boxGeo(V(-w / 2, 0, -2), V(w / 2, hgt, 2), 2), white);
      g.add(boxGeo(V(-w / 2 - 0.1, hgt, -2.1), V(w / 2 + 0.1, hgt + 0.2, 2.1)), roof);
      for (let fy = 1.6; fy < hgt - 0.8; fy += 2.4) for (let fx = -w / 2 + 1; fx < w / 2 - 0.5; fx += 1.8) g.add(boxGeo(V(fx - 0.35, fy, 2.0), V(fx + 0.35, fy + 1.1, 2.08)), shut);
      const grp = new THREE.Group(); g.build(grp, true); grp.position.set(x, 0, z); grp.rotation.y = yaw; this.root.add(grp);
    };
    house(-9, -14, 7, 9, 0); house(-1.5, -15, 6.5, 11, 0); house(5.5, -14, 7, 8, 0); house(12, -13, 6, 10, -0.3);
    house(-15, -6, 6, 9, 1.2); house(16, -5, 6, 9, -1.2);
    const bark = lam("sqBark", () => ({ color: "#8a7a62" })), leaf = lam("sqLeaf", () => ({ color: "#5a8a4a" }));
    for (const [x, z] of [[-6, -8], [6.5, -8.5], [-11, -2], [11, -1]] as const) {
      deco.add(cyl(0.18, 0.25, 4.2, 8), bark, at(x, 2.1, z));
      for (let k = 0; k < 5; k++) deco.add(new THREE.SphereGeometry(1.3, 10, 8), leaf, at(x + Math.cos(k * 1.3) * 1.0, 4.6 + (k % 2) * 0.6, z + Math.sin(k * 1.3) * 0.8));
    }
    b.build(this.root, false); deco.build(this.root, true);
    const skyT = ctex("sqSky", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#4a6ab0"); gr.addColorStop(0.36, "#a8b8e0"); gr.addColorStop(0.5, "#f6c8b0"); gr.addColorStop(1, "#f6c8b0"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -2; dome.layers.set(NOINK); this.root.add(dome);
  }
}
