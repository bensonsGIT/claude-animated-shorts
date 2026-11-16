// Newton's room, 1665-66: plank floor, cream plaster between dark oak posts, a low beamed ceiling. Left wall: a
// casement window with two oak shutters (open = sunlit glass; "hole" = shut with a pin-hole beam for the prism;
// shut = the dark room). Back wall: his desk (candle, books, ink, the open notebook). By the window: a stand that holds
// the prism (a real 3D beam in, a 7-colour fan out onto the right wall) or the looking glass (sun glare).
// Floor y = 0, x across (-3.5..3.5), z (-4 back wall .. 3), ceiling 3.1 m.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, planksHD, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";
import type { V3 } from "./story";

export const STUDY = { x0: -3.5, x1: 3.5, z0: -4, z1: 3, h: 3.1 };
export const SDESK = { x0: -0.1, x1: 1.7, z0: -3.98, z1: -3.3, top: 0.82 };
/** window centre on the left wall (x0), the stand that holds the prism / glass */
export const WIN: V3 = [-3.5, 1.65, -1.6];
export const PRISM: V3 = [-2.5, 1.18, -1.6];
export const NOTEBOOK: V3 = [0.95, SDESK.top + 0.025, -3.62];
/** in the sun shot the looking glass stands on the prism stand */
export const GLASS: V3 = [-2.5, 1.36, -1.6];
/** the white board the spectrum falls on (centre of its face), turned to face the prism */
export const BOARD: V3 = [-2.16, 1.3, -2.86];
const BOARD_YAW = Math.atan2(PRISM[0] - BOARD[0], PRISM[2] - BOARD[2]);
export type StudyMode = "night" | "sun" | "prism" | "dark";

const plaster = () => ctex("studyPlaster", 512, 512, (g, r) => {
  g.fillStyle = "#e6d7b8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, s = 10 + r() * 40, v = r() < 0.5 ? "rgba(160,130,90,0.06)" : "rgba(255,250,235,0.08)";
    g.fillStyle = v; g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, Math.PI * 2); g.fill();
  }
});
const pagesTex = () => ctex("notebookPages", 512, 256, (g) => {
  g.fillStyle = "#f3e9cf"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#d8c9a4"; g.fillRect(250, 0, 12, 256);
  g.strokeStyle = "rgba(90,70,54,0.55)"; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(30, 30 + i * 24); g.lineTo(214 - (i % 3) * 40, 30 + i * 24); g.stroke(); }
  g.strokeStyle = "#241726"; g.lineWidth = 6; g.strokeRect(3, 3, 506, 250);
});
const SPECTRUM = ["#e8322e", "#ff8a1e", "#ffd83a", "#4ccf4a", "#2fa6ff", "#4a4ad8", "#8a3ad8"];

export class Study extends Room {
  private shutL: THREE.Mesh; private shutR: THREE.Mesh; private glassPane: THREE.Mesh; private holeBeam: THREE.Mesh;
  private fan = new THREE.Group(); private prism: THREE.Mesh; private glass = new THREE.Group(); private glare: THREE.Mesh;
  private candle = new THREE.Group();

  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = STUDY;
    const floor = lam("studyFloor", () => ({ map: planksHD() }));
    const wall = lam("studyWall", () => ({ map: plaster() }));
    const oak = lam("studyOak", () => ({ map: beam() }));
    const dark = lam("studyDarkOak", () => ({ color: "#4a2e22" }));
    const ceil = lam("studyCeil", () => ({ color: "#d9c7a6" }));
    const cloth = lam("studyCloth", () => ({ color: "#7a3040" }));
    const wax = lam("studyWax", () => ({ color: "#f5ecd6" }));
    const ink = lam("studyInk", () => ({ color: "#22202a" }));
    const books = ["#7a2a2a", "#2a4a6a", "#5a4a2a", "#2f5a3c", "#6a3a5a"].map((c) => lam(`studyBook${c}`, () => ({ color: c })));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const pewter = twoTone(new THREE.MeshPhongMaterial({ color: "#b4b6be", specular: "#ffffff", shininess: 60 }), 0.2);

    // ---- shell: floor, plaster walls with oak posts + rails, beamed ceiling ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.2, (z1 - z0) / 2.2), floor);
    shell.add(boxGeo(V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.3, h, z1)), wall);
    shell.add(boxGeo(V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3)), wall);
    // left wall with a window opening (y 1.05..2.25, z -2.25..-0.95)
    const [, wy, wz] = WIN, wy0 = wy - 0.6, wy1 = wy + 0.6, wz0 = wz - 0.65, wz1 = wz + 0.65;
    shell.add(boxGeo(V(x0 - 0.3, 0, z0), V(x0, wy0, z1)), wall);
    shell.add(boxGeo(V(x0 - 0.3, wy1, z0), V(x0, h, z1)), wall);
    shell.add(boxGeo(V(x0 - 0.3, wy0, z0), V(x0, wy1, wz0)), wall);
    shell.add(boxGeo(V(x0 - 0.3, wy0, wz1), V(x0, wy1, z1)), wall);
    shell.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), ceil);
    for (let x = x0 + 1.75; x < x1; x += 1.75) fix.add(boxGeo(V(x - 0.1, h - 0.22, z0), V(x + 0.1, h, z1)), oak);
    for (const x of [x0 + 0.02, x1 - 0.14]) for (const z of [-2.6, 0.2]) fix.add(boxGeo(V(x, 0, z - 0.09), V(x + 0.12, h, z + 0.09)), dark);
    for (const x of [-1.8, 1.9]) fix.add(boxGeo(V(x - 0.09, 0, z0), V(x + 0.09, h, z0 + 0.12)), dark);
    fix.add(boxGeo(V(x0, 0.95, z0), V(x1, 1.0, z0 + 0.06)), dark); // back rail
    fix.add(boxGeo(V(x0, 0, z0), V(x1, 0.14, z0 + 0.04)), dark); // skirting
    // window frame, sill, mullion
    fix.add(boxGeo(V(x0 - 0.02, wy0 - 0.08, wz0 - 0.08), V(x0 + 0.16, wy0, wz1 + 0.08)), oak);
    fix.add(boxGeo(V(x0 - 0.02, wy1, wz0 - 0.08), V(x0 + 0.08, wy1 + 0.08, wz1 + 0.08)), oak);
    for (const z of [wz0 - 0.04, wz1 + 0.04]) fix.add(boxGeo(V(x0 - 0.02, wy0, z - 0.04), V(x0 + 0.08, wy1, z + 0.04)), oak);
    fix.add(boxGeo(V(x0 - 0.12, wy0, wz - 0.03), V(x0 - 0.06, wy1, wz + 0.03)), dark);
    // the glass (sunlit sky beyond: unlit HDR so it blooms) + leaded diamonds
    this.glassPane = new THREE.Mesh(new THREE.PlaneGeometry(wz1 - wz0, wy1 - wy0),
      new THREE.MeshBasicMaterial({ map: ctex("studyLeaded", 256, 256, (g) => {
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#8a8a9a"; g.lineWidth = 5;
        for (let i = -256; i < 512; i += 52) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); }
      }), color: new THREE.Color(1.9, 1.75, 1.45) }));
    this.glassPane.rotation.y = Math.PI / 2; this.glassPane.position.set(x0 - 0.15, wy, wz); this.glassPane.layers.set(NOINK);
    this.root.add(this.glassPane);
    // two shutters hinged on the window's outer edges (inside the room)
    const shutMat = lam("studyShutter", () => ({ map: beam(), color: "#b08a66" }));
    const mkShut = (z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, wy1 - wy0 + 0.06, (wz1 - wz0) / 2), shutMat);
      m.castShadow = true; m.receiveShadow = true; this.root.add(m); m.userData.z = z; return m;
    };
    this.shutL = mkShut(wz0); this.shutR = mkShut(wz1);

    // ---- desk on the back wall: books, candle, ink pot, quill, open notebook ----
    const D = SDESK;
    deco.add(boxGeo(V(D.x0, D.top - 0.06, D.z0), V(D.x1, D.top, D.z1), 1.5), oak);
    for (const [x, z] of [[D.x0 + 0.06, D.z1 - 0.06], [D.x1 - 0.06, D.z1 - 0.06], [D.x0 + 0.06, D.z0 + 0.06], [D.x1 - 0.06, D.z0 + 0.06]])
      deco.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, D.top - 0.06, z + 0.05)), dark);
    let bx = D.x0 + 0.1;
    for (let i = 0; i < 5; i++) { const w = 0.07 + (i % 2) * 0.03, hh = 0.26 + (i % 3) * 0.05; deco.add(boxGeo(V(bx, D.top, D.z0 + 0.04), V(bx + w, D.top + hh, D.z0 + 0.3)), books[i]); bx += w + 0.005; }
    deco.add(boxGeo(V(D.x0 + 0.1, D.top, D.z0 + 0.36), V(D.x0 + 0.42, D.top + 0.06, D.z0 + 0.6)), books[1]);
    deco.add(boxGeo(V(D.x0 + 0.12, D.top + 0.06, D.z0 + 0.38), V(D.x0 + 0.4, D.top + 0.1, D.z0 + 0.58)), books[3]);
    const [nx, ny, nz] = NOTEBOOK;
    deco.add(boxGeo(V(nx - 0.27, D.top, nz - 0.15), V(nx + 0.27, ny - 0.01, nz + 0.15)), cloth);
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), twoTone(new THREE.MeshLambertMaterial({ map: pagesTex() })));
    pg.rotation.x = -Math.PI / 2; pg.position.set(nx, ny, nz); pg.receiveShadow = true; this.root.add(pg);
    deco.add(cyl(0.045, 0.05, 0.07), ink, at(D.x1 - 0.3, D.top + 0.035, D.z0 + 0.25));
    deco.add(boxGeo(V(D.x1 - 0.32, D.top + 0.06, D.z0 + 0.24), V(D.x1 - 0.31, D.top + 0.32, D.z0 + 0.26)), wax);
    // candle: brass stick, wax, flame (hidden by day)
    const cx = D.x1 - 0.18, cz = D.z0 + 0.45;
    const cb = new Batch();
    cb.add(cyl(0.08, 0.09, 0.03), brass, at(cx, D.top + 0.015, cz));
    cb.add(cyl(0.022, 0.028, 0.16), brass, at(cx, D.top + 0.11, cz));
    cb.add(cyl(0.03, 0.03, 0.16), wax, at(cx, D.top + 0.27, cz));
    cb.build(this.candle, true);
    this.root.add(this.candle);
    this.flame(cx, D.top + 0.4, cz, 0.1, 0.2, 2.8);
    this.glow(cx, D.top + 0.42, cz, 1.4, 0.4);
    // a chair pushed back from the desk
    deco.add(boxGeo(V(0.35, 0.44, -2.95), V(0.8, 0.49, -2.5)), oak);
    for (const [x, z] of [[0.38, -2.92], [0.77, -2.92], [0.38, -2.53], [0.77, -2.53]]) deco.add(boxGeo(V(x - 0.025, 0, z - 0.025), V(x + 0.025, 0.44, z + 0.025)), dark);
    deco.add(boxGeo(V(0.35, 0.49, -2.97), V(0.8, 1.05, -2.92)), oak);

    // ---- the stand by the window (prism / looking glass) ----
    const [px, , pz] = PRISM;
    deco.add(cyl(0.2, 0.22, 0.04, 16), oak, at(px, 0.02, pz));
    deco.add(cyl(0.035, 0.04, 1.02), dark, at(px, 0.53, pz));
    deco.add(cyl(0.14, 0.12, 0.04, 16), oak, at(px, 1.05, pz));
    // the prism: a triangular glass bar standing on the stand
    const tri = new THREE.CylinderGeometry(0.075, 0.075, 0.2, 3);
    this.prism = new THREE.Mesh(tri, new THREE.MeshPhongMaterial({ color: "#dff2ff", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.8 }));
    this.prism.position.set(px, 1.17, pz); this.root.add(this.prism);
    // the beam: from the pin-hole to the prism (additive, unlit, HDR)
    const beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.8), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const from = V(x0 + 0.02, wy + 0.05, wz), to = V(px, 1.17, pz), len = from.distanceTo(to);
    this.holeBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 10, 1, true), beamM);
    this.holeBeam.position.copy(from).add(to).multiplyScalar(0.5);
    this.holeBeam.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize());
    this.holeBeam.layers.set(NOINK); this.holeBeam.renderOrder = 6; this.root.add(this.holeBeam);
    // the white board on its easel, facing the prism
    const [bx0, by0, bz0] = BOARD, bw = 0.72, bh = 0.56;
    const bm = new THREE.Matrix4().compose(V(bx0, by0, bz0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, BOARD_YAW, 0)), V(1, 1, 1));
    deco.add(boxGeo(V(-bw / 2, -bh / 2, -0.04), V(bw / 2, bh / 2, -0.005)), lam("studyBoard", () => ({ color: "#f4efe2" })), bm);
    for (const s of [-1, 1]) deco.add(boxGeo(V(s * 0.28 - 0.025, -by0, -0.09), V(s * 0.28 + 0.025, bh / 2 + 0.06, -0.04)), dark, bm);
    deco.add(boxGeo(V(-bw / 2 - 0.02, -bh / 2 - 0.05, -0.06), V(bw / 2 + 0.02, -bh / 2, 0.02)), oak, bm);
    // the fan: 7 coloured wedges (pyramids) from the prism to 7 vertical stripes on the board, plus the stripes
    const n = SPECTRUM.length, sw = 0.56 / n, apex = V(px, 1.17, pz);
    const onBoard = (lx: number, ly: number) => V(lx, ly, 0.002).applyMatrix4(bm);
    for (let i = 0; i < n; i++) {
      const xa = -0.28 + i * sw, xb = xa + sw, ya = -0.17, yb = 0.17;
      const c = new THREE.Color(SPECTRUM[i]);
      const q = [onBoard(xa, ya), onBoard(xb, ya), onBoard(xb, yb), onBoard(xa, yb)];
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k < 4; k++) pts.push(apex, q[k], q[(k + 1) % 4]);
      const m = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(pts), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(0.8), transparent: true,
        opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.layers.set(NOINK); m.renderOrder = 6; this.fan.add(m);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(sw, yb - ya), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.8) }));
      band.position.copy(onBoard((xa + xb) / 2, 0)); band.rotation.y = BOARD_YAW; band.layers.set(NOINK); this.fan.add(band);
    }
    this.root.add(this.fan);
    // the looking glass: a round mirror on a little easel on the stand, its face a blazing sun reflection
    const gb = new Batch();
    gb.add(new THREE.TorusGeometry(0.16, 0.025, 8, 28), brass, at(0, 0, 0));
    gb.add(boxGeo(V(-0.015, -0.32, -0.04), V(0.015, -0.14, -0.01)), dark);
    gb.build(this.glass, true);
    const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), new THREE.MeshPhongMaterial({ color: "#bcd0e0", specular: "#ffffff", shininess: 100 }));
    this.glass.add(mirror);
    this.glare = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 3.6) }));
    this.glare.position.set(0.02, 0.03, 0.005); this.glare.layers.set(NOINK); this.glass.add(this.glare);
    this.glass.position.set(...GLASS); this.glass.rotation.y = 0.81; this.root.add(this.glass);

    // ---- a low bed in the front-right corner (the dark room) ----
    deco.add(boxGeo(V(1.7, 0.16, -0.2), V(3.45, 0.42, 1.9)), oak);
    deco.add(boxGeo(V(1.75, 0.42, -0.15), V(3.4, 0.52, 1.85)), lam("studyBlanket", () => ({ color: "#5a6a8a" })));
    deco.add(boxGeo(V(2.9, 0.52, -0.1), V(3.35, 0.62, 0.5)), lam("studyPillow", () => ({ color: "#efe8d8" })));
    deco.add(boxGeo(V(3.38, 0, -0.2), V(3.48, 1.1, 1.9)), dark);
    // a pewter jug on the desk (colour for the wides)
    deco.add(cyl(0.06, 0.08, 0.2), pewter, at(SDESK.x0 + 0.62, SDESK.top + 0.1, SDESK.z0 + 0.5));

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
    this.mode("night");
  }

  /** dress the room for a shot */
  mode(m: StudyMode) {
    const [, , wz] = WIN, open = m === "sun" || m === "night";
    // open: folded back flat against the wall either side; shut: closed across the window
    const half = 1.3 / 4;
    for (const [s, sd] of [[this.shutL, -1], [this.shutR, 1]] as const) {
      if (open) { s.rotation.y = 0; s.position.set(STUDY.x0 + 0.05, WIN[1], wz + sd * (0.65 + half + 0.04)); }
      else { s.rotation.y = 0; s.position.set(STUDY.x0 + 0.05, WIN[1], wz + sd * half); }
    }
    (this.glassPane.material as THREE.MeshBasicMaterial).color.set(m === "night" ? new THREE.Color(0.06, 0.07, 0.16) : new THREE.Color(1.9, 1.75, 1.45));
    this.holeBeam.visible = this.fan.visible = this.prism.visible = m === "prism";
    this.glass.visible = m === "sun";
    this.candle.visible = m === "night";
    this.setFlames(m === "night");
  }
}
