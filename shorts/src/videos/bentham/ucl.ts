// Sets of the Bentham short (all floors at y = 0):
//  Centre   - the UCL Student Centre today: pale terrazzo, a tall glazed back wall, white walls, the auto-icon's glass case.
//  Cloister - UCL's South Cloisters 1850-1975: a stone corridor with an open arcade on the left, the mahogany cabinet.
//  Theatre  - the Webb Street anatomy theatre, 9 June 1832: tiered benches in a U, a sheeted table, a lectern, a skylight
//             that flashes with the lightning.
//  Case     - the glass case (Centre / on a trolley in the council room) or the wooden cabinet (Cloister).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, stoneHD, beam, planksHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";
import type { V3 } from "./story";

const SIT = 0.1; // a seated card's hips sit this far above its origin (story.ts)

// ---------------- the case / cabinet ----------------
export type CaseKind = "glass" | "wood" | "trolley";
/** local layout: origin on the floor at the centre of the base, front toward local +z */
export const CASE_DIM = { w: 1.25, d: 1.0, base: 0.3, h: 2.5, trolley: 0.16 };
/** seat of the chair inside, local (seat top height above the base top is 0.46) */
export const caseSeat = (k: CaseKind): V3 => [0, (k === "trolley" ? CASE_DIM.trolley : 0) + (k === "wood" ? 0.15 : CASE_DIM.base) + 0.46 - SIT, -0.02];
/** where the real head sits on the case floor (between the feet), local */
export const caseFloor = (k: CaseKind): V3 => [0, (k === "wood" ? 0.15 : CASE_DIM.base) + 0.005, 0.3];

export class Case {
  root = new THREE.Group();
  constructor(readonly kind: CaseKind) {
    const b = new Batch(), glassB = new Batch();
    const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#8a8e98", specular: "#e0e0e0", shininess: 70 }), 0.15);
    const charcoal = lam("caseBase", () => ({ color: "#3e3e46" }));
    const mahog = lam("caseMahog", () => ({ map: beam(), color: "#a0583c" }));
    const dark = lam("caseDark", () => ({ color: "#4a2a20" }));
    const chairM = lam("caseChair", () => ({ map: beam(), color: "#c28a5a" }));
    const glass = new THREE.MeshPhongMaterial({ color: "#d6eef8", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    const { w, d, h } = CASE_DIM, hw = w / 2, hd = d / 2;
    const lift = kind === "trolley" ? CASE_DIM.trolley : 0;
    const base = kind === "wood" ? 0.15 : CASE_DIM.base, y0 = lift + base;
    if (kind === "wood") {
      // mahogany cabinet: plinth, back, sides, top with a cornice, glazed front doors in heavy frames
      b.add(boxGeo(V(-hw - 0.05, 0, -hd - 0.05), V(hw + 0.05, base, hd + 0.05)), dark);
      b.add(boxGeo(V(-hw, base, -hd), V(hw, h + 0.1, -hd + 0.06)), mahog);
      for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -hw : hw - 0.06, base, -hd), V(s < 0 ? -hw + 0.06 : hw, h + 0.1, hd)), mahog);
      b.add(boxGeo(V(-hw - 0.08, h + 0.1, -hd - 0.08), V(hw + 0.08, h + 0.26, hd + 0.08)), dark);
      for (const x of [-hw, hw - 0.07]) b.add(boxGeo(V(x, base, hd - 0.06), V(x + 0.07, h + 0.1, hd)), mahog);
      for (const y of [base, h + 0.02]) b.add(boxGeo(V(-hw, y, hd - 0.06), V(hw, y + 0.08, hd)), mahog);
      glassB.add(quad(V(-hw + 0.07, base + 0.08, hd - 0.03), V(hw - 0.07, base + 0.08, hd - 0.03), V(hw - 0.07, h + 0.02, hd - 0.03), V(-hw + 0.07, h + 0.02, hd - 0.03)), glass);
      // a faded green baize lining on the back
      b.add(boxGeo(V(-hw + 0.06, base, -hd + 0.06), V(hw - 0.06, h + 0.05, -hd + 0.07)), lam("caseBaize", () => ({ color: "#4a6a4a" })));
    } else {
      b.add(boxGeo(V(-hw, lift, -hd), V(hw, y0, hd)), charcoal);
      if (kind === "trolley") for (const [x, z] of [[-hw + 0.12, -hd + 0.12], [hw - 0.12, -hd + 0.12], [-hw + 0.12, hd - 0.12], [hw - 0.12, hd - 0.12]])
        b.add(cyl(0.07, 0.07, 0.05, 14), lam("caseWheel", () => ({ color: "#1e1e24" })), at(x, 0.07, z, Math.PI / 2, 0, 0));
      // steel edges of the glass box
      const top = y0 + h - base, e = 0.025;
      for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) b.add(boxGeo(V(x - e, y0, z - e), V(x + e, top, z + e)), steel);
      for (const z of [-hd, hd]) b.add(boxGeo(V(-hw - e, top - e, z - e), V(hw + e, top + e, z + e)), steel);
      for (const x of [-hw, hw]) b.add(boxGeo(V(x - e, top - e, -hd - e), V(x + e, top + e, hd + e)), steel);
      for (const z of [-hd, hd]) b.add(boxGeo(V(-hw - e, y0, z - e), V(hw + e, y0 + 2 * e, z + e)), steel);
      glassB.add(quad(V(-hw, y0, hd), V(hw, y0, hd), V(hw, top, hd), V(-hw, top, hd)), glass);
      glassB.add(quad(V(hw, y0, -hd), V(-hw, y0, -hd), V(-hw, top, -hd), V(hw, top, -hd)), glass);
      glassB.add(quad(V(-hw, y0, -hd), V(-hw, y0, hd), V(-hw, top, hd), V(-hw, top, -hd)), glass);
      glassB.add(quad(V(hw, y0, hd), V(hw, y0, -hd), V(hw, top, -hd), V(hw, top, hd)), glass);
      glassB.add(quad(V(-hw, top, hd), V(hw, top, hd), V(hw, top, -hd), V(-hw, top, -hd)), glass);
    }
    // his own wooden chair: seat, four legs, a plain back
    const sy = y0 + 0.46, cz = -0.02;
    b.add(boxGeo(V(-0.26, sy - 0.05, cz - 0.24), V(0.26, sy, cz + 0.24)), chairM);
    for (const [x, z] of [[-0.23, cz - 0.21], [0.23, cz - 0.21], [-0.23, cz + 0.21], [0.23, cz + 0.21]]) b.add(boxGeo(V(x - 0.025, y0, z - 0.025), V(x + 0.025, sy - 0.05, z + 0.025)), chairM);
    b.add(boxGeo(V(-0.26, sy, cz - 0.26), V(0.26, sy + 0.62, cz - 0.21)), chairM);
    b.build(this.root, true);
    const gm = new THREE.Group(); glassB.build(gm, false);
    gm.traverse((o) => { o.layers.set(NOINK); if (o instanceof THREE.Mesh) { o.renderOrder = 3; o.castShadow = false; o.receiveShadow = false; } });
    this.root.add(gm);
  }
  /** a local point of the case in world space (rooms sit at the world origin) */
  world(p: V3): V3 {
    const v = V(...p).applyEuler(this.root.rotation).add(this.root.position);
    return [v.x, v.y, v.z];
  }
}

// ---------------- the Student Centre ----------------
export const CENTRE = { x0: -7, x1: 7, z0: -9, z1: 7, h: 7 };
export const CENTRE_CASE: V3 = [0, 0, -3.2];
const terrazzo = () => ctex("terrazzo", 1024, 1024, (g, r) => {
  g.fillStyle = "#e6e2da"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ["#c8c2b8", "#b8b0a6", "#f4f2ee", "#9aa0a8", "#d8cfc0"][Math.floor(r() * 5)]; const s = 3 + r() * 7; g.fillRect(r() * 1024, r() * 1024, s, s); }
  g.strokeStyle = "#b4aca0"; g.lineWidth = 4;
  for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 512, 0); g.lineTo(i * 512, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i * 512); g.lineTo(1024, i * 512); g.stroke(); }
});
const slats = () => ctex("woodSlats", 512, 512, (g) => {
  g.fillStyle = "#6a4a30"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#c89a64" : "#b88a58"; g.fillRect(i * 32 + 4, 0, 24, 512); }
});
/** the view through the glass wall: a pale London sky over brick and trees (unlit) */
const cityView = () => ctex("cityView", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#9cc4ec"); gr.addColorStop(0.6, "#d8e8f4"); gr.addColorStop(1, "#e8eef2");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 9; i++) { const x = i * 120 + r() * 40, hh = 120 + r() * 140; g.fillStyle = ["#b8786a", "#c8b8a0", "#a8987e"][i % 3]; g.fillRect(x, 512 - hh, 100, hh);
    g.fillStyle = "rgba(255,255,255,0.5)"; for (let k = 0; k < 4; k++) for (let j = 0; j < Math.floor(hh / 40); j++) g.fillRect(x + 10 + k * 22, 512 - hh + 14 + j * 40, 12, 18); }
  for (let i = 0; i < 7; i++) { g.fillStyle = "#6a9a5a"; g.beginPath(); g.arc(60 + i * 150 + r() * 40, 470, 60 + r() * 20, 0, Math.PI * 2); g.fill(); }
});

export class Centre extends Room {
  case = new Case("glass");
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = CENTRE;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: terrazzo() }));
    const white = lam("centreWall", () => ({ color: "#ece8e2" }));
    const ceil = lam("centreCeil", () => ({ color: "#f2f0ec" }));
    const mull = lam("centreMullion", () => ({ color: "#3a3e46" }));
    const slatM = lam("centreSlats", () => ({ map: slats() }));
    const oak = lam("centreOak", () => ({ map: beam(), color: "#d8b08a" }));
    const red = lam("centreRed", () => ({ color: "#c8463a" }));
    const green = lam("centrePlant", () => ({ color: "#4a8a4a" }));
    const pot = lam("centrePot", () => ({ color: "#5a5e68" }));
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.4, (z1 - z0) / 2.4), floor);
    shell.add(boxGeo(V(x0 - 0.3, 0, z0), V(x0, h, z1)), white);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.3, h, z1)), white);
    shell.add(boxGeo(V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3)), white);
    shell.add(boxGeo(V(x0 - 0.3, h, z0 - 0.5), V(x1 + 0.3, h + 0.3, z1 + 0.3), 0, true), ceil);
    // the glazed back wall: an unlit city view behind dark mullions
    const view = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, h), new THREE.MeshBasicMaterial({ map: cityView(), color: new THREE.Color(1.25, 1.25, 1.25) }));
    view.position.set(0, h / 2, z0 - 0.4); view.layers.set(NOINK); this.root.add(view);
    for (let x = x0; x <= x1 + 0.01; x += 1.75) fix.add(boxGeo(V(x - 0.06, 0, z0 - 0.08), V(x + 0.06, h, z0 + 0.04)), mull);
    for (const y of [0, 2.6, 5.2]) fix.add(boxGeo(V(x0, y, z0 - 0.08), V(x1, y + 0.1, z0 + 0.04)), mull);
    // timber slat feature wall on the left, a red accent band and a mezzanine on the right
    fix.add(boxGeo(V(x0, 0, -6), V(x0 + 0.08, 4.2, 3)), slatM);
    fix.add(boxGeo(V(x1 - 0.06, 3.2, z0), V(x1, 3.5, z1)), red);
    deco.add(boxGeo(V(x1 - 2.4, 3.4, z0), V(x1, 3.65, z1)), white);
    fix.add(boxGeo(V(x1 - 2.42, 3.65, z0), V(x1 - 2.38, 4.6, z1)), mull);
    // ceiling light strips (unlit, bright)
    const lightM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.8, 1.75) });
    for (const x of [-4, 0, 4]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, z1 - z0 - 2), lightM); m.rotation.x = Math.PI / 2; m.position.set(x, h - 0.02, (z0 + z1) / 2); m.layers.set(NOINK); this.root.add(m); }
    // round tables with stools (left), planters by the glass
    for (const [x, z] of [[-4.6, -1.2], [-4.4, 2.2], [4.3, 1.6]]) {
      deco.add(cyl(0.55, 0.55, 0.05, 24), oak, at(x, 0.74, z));
      deco.add(cyl(0.05, 0.05, 0.72, 10), pot, at(x, 0.37, z));
      for (const a of [0.4, 2.5, 4.4]) deco.add(cyl(0.2, 0.2, 0.46, 14), red, at(x + 0.85 * Math.cos(a), 0.23, z + 0.85 * Math.sin(a)));
    }
    for (const x of [-5.6, -2.6, 2.6, 5.6]) {
      deco.add(boxGeo(V(x - 0.4, 0, z0 + 0.3), V(x + 0.4, 0.55, z0 + 1.0)), pot);
      deco.add(new THREE.SphereGeometry(0.55, 14, 10), green, at(x, 0.95, z0 + 0.65).scale(V(1, 1.2, 0.8)));
    }
    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
    this.case.root.position.set(...CENTRE_CASE);
    this.root.add(this.case.root);
  }
}

// ---------------- the South Cloisters ----------------
export const CLOISTER = { x0: -2.6, x1: 2.6, z0: -12, z1: 4, h: 4.4 };
/** cabinet against the right wall, its glass front facing -x (toward the arcade) */
export const CABINET: V3 = [1.95, 0, -4.2];
const garden = (night: boolean) => ctex(night ? "gardenNight" : "gardenDay", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  if (night) { gr.addColorStop(0, "#0e1438"); gr.addColorStop(1, "#2a3a6a"); } else { gr.addColorStop(0, "#8ab8e8"); gr.addColorStop(1, "#d8e8f0"); }
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  if (night) { g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(760, 110, 30, 0, Math.PI * 2); g.fill(); }
  // the quad's far range: pale stone with a portico, then lawn
  g.fillStyle = night ? "#3a3e5a" : "#d8cbb0"; g.fillRect(0, 220, 1024, 200);
  for (let i = 0; i < 12; i++) { g.fillStyle = night ? "#2a2e48" : "#b8aa90"; g.fillRect(40 + i * 82, 250, 26, 170); }
  g.fillStyle = night ? "#2a2e48" : "#c8baa0"; g.beginPath(); g.moveTo(380, 220); g.lineTo(512, 150); g.lineTo(644, 220); g.fill();
  g.fillStyle = night ? "#1e2e2a" : "#6a9a4a"; g.fillRect(0, 420, 1024, 92);
  for (let i = 0; i < 6; i++) { g.fillStyle = night ? "#1a2a24" : "#4a7a3a"; g.beginPath(); g.arc(80 + i * 180 + r() * 40, 420, 40 + r() * 20, Math.PI, 0); g.fill(); }
});
const portrait = (k: number) => ctex(`portrait${k}`, 256, 320, (g) => {
  g.fillStyle = ["#3a3028", "#2a3040"][k % 2]; g.fillRect(0, 0, 256, 320);
  g.fillStyle = ["#e8c8a8", "#f0d0b0"][k % 2]; g.beginPath(); g.ellipse(128, 130, 52, 64, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1e1a20"; g.beginPath(); g.moveTo(40, 320); g.quadraticCurveTo(128, 180, 216, 320); g.fill();
  g.fillStyle = "#f4f1e8"; g.fillRect(112, 200, 32, 30);
  g.strokeStyle = "#c8a04a"; g.lineWidth = 22; g.strokeRect(11, 11, 234, 298);
});

export class Cloister extends Room {
  case = new Case("wood");
  private dayView: THREE.Mesh; private nightView: THREE.Mesh;
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = CLOISTER;
    const flags = lam("cloisterFlags", () => ({ map: stoneHD("cloisterFlags", ["#c8beae", "#beb3a2", "#d2c8b8", "#b4a998"], "#8a8070") }));
    const stone = lam("cloisterStone", () => ({ map: stoneHD("cloisterStone", ["#e2d8c6", "#d8ccb8", "#e8dfcf", "#d0c4b0"], "#b0a28c") }));
    const plaster = lam("cloisterPlaster", () => ({ color: "#ece2cc" }));
    const lawn = lam("cloisterLawn", () => ({ color: "#6a9a4a" }));
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 1.2, (z1 - z0) / 1.2), flags);
    // the arcade wall (left): a stone screen with round-arched openings over a low parapet, extruded 0.5 m outward
    const sh = new THREE.Shape();
    sh.moveTo(z0, 0); sh.lineTo(z1, 0); sh.lineTo(z1, h); sh.lineTo(z0, h); sh.lineTo(z0, 0);
    for (let k = 0; k < 6; k++) {
      const zc = -10.8 + 2.4 * k, hole = new THREE.Path();
      hole.moveTo(zc - 0.8, 0.55); hole.lineTo(zc + 0.8, 0.55); hole.lineTo(zc + 0.8, 2.5); hole.absarc(zc, 2.5, 0.8, 0, Math.PI, false); hole.lineTo(zc - 0.8, 0.55);
      sh.holes.push(hole);
    }
    const arc = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false, curveSegments: 14 });
    arc.applyMatrix4(at(x0, 0, 0, 0, -Math.PI / 2, 0));
    shell.add(arc, stone);
    // right wall (plaster above a stone dado), end walls, ceiling with transverse ribs
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.3, 1.0, z1), 1.2), stone);
    shell.add(boxGeo(V(x1, 1.0, z0), V(x1 + 0.3, h, z1)), plaster);
    shell.add(boxGeo(V(x0 - 0.5, 0, z0 - 0.3), V(x1 + 0.3, h, z0), 1.2), stone);
    shell.add(boxGeo(V(x0 - 0.5, 0, z1), V(x1 + 0.3, h, z1 + 0.3), 1.2), stone);
    shell.add(boxGeo(V(x0 - 0.5, h, z0 - 0.3), V(x1 + 0.3, h + 0.3, z1 + 0.3), 0, true), plaster);
    for (let k = 0; k <= 6; k++) { const z = -12 + 2.4 * k; fix.add(boxGeo(V(x0, h - 0.35, z - 0.2), V(x1, h, z + 0.2)), stone); }
    fix.add(boxGeo(V(x1 - 0.06, 0.98, z0), V(x1, 1.08, z1)), stone);
    // portraits along the right wall, either side of the cabinet
    for (const [z, k] of [[-8.6, 0], [0.4, 1]] as const) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.12), twoTone(new THREE.MeshLambertMaterial({ map: portrait(k) })));
      m.rotation.y = -Math.PI / 2; m.position.set(x1 - 0.02, 2.2, z); this.root.add(m);
    }
    // the lawn and the far range of the quad beyond the arches (painted, unlit)
    deco.add(quad(V(-9, -0.02, z1), V(x0 - 0.5, -0.02, z1), V(x0 - 0.5, -0.02, z0), V(-9, -0.02, z0)), lawn);
    const mk = (night: boolean) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0 + 12, 8), new THREE.MeshBasicMaterial({ map: garden(night), color: night ? new THREE.Color(1, 1, 1) : new THREE.Color(1.2, 1.2, 1.2) }));
      m.rotation.y = Math.PI / 2; m.position.set(-9, 2.8, (z0 + z1) / 2); m.layers.set(NOINK); this.root.add(m); return m;
    };
    this.dayView = mk(false); this.nightView = mk(true);
    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
    this.case.root.position.set(...CABINET);
    this.case.root.rotation.y = -Math.PI / 2;
    this.root.add(this.case.root);
  }
  pose(night: boolean) { this.dayView.visible = !night; this.nightView.visible = night; }
}

// ---------------- the anatomy theatre ----------------
export const THEATRE = { x0: -6.3, x1: 6.3, z0: -7.2, z1: 5, h: 6.5 };
/** the dissecting table (centre of its top), the lectern, Smith's mark behind them */
export const DTABLE = { x: 0, z: -0.6, top: 0.9, l: 2.0, w: 0.8 };
export const LECTERN: V3 = [1.25, 0, -1.6];
/** tier k (0..3): seat top height, back-row seat z, side-row seat |x| */
export const tierY = (k: number) => 0.45 * (k + 1);
export const tierZ = (k: number) => -3.0 - 0.8 * k;
export const tierX = (k: number) => 3.3 + 0.8 * k;

export class Theatre extends Room {
  private sky: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = THEATRE;
    const floor = lam("theatreFloor", () => ({ map: planksHD() }));
    const panel = lam("theatrePanel", () => ({ map: beam(), color: "#8a5a3e" }));
    const dark = lam("theatreDark", () => ({ color: "#3a2420" }));
    const plaster = lam("theatrePlaster", () => ({ color: "#cbb89a" }));
    const sheet = lam("theatreSheet", () => ({ color: "#f2eee4" }));
    const oak = lam("theatreOak", () => ({ map: beam() }));
    const wax = lam("theatreWax", () => ({ color: "#f5ecd6" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.2, (z1 - z0) / 2.2), floor);
    for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)], [V(x0 - 0.3, 0, z1), V(x1 + 0.3, h, z1 + 0.3)]] as const) {
      shell.add(boxGeo(a, V(b.x, 2.6, b.z)), panel);
      shell.add(boxGeo(V(a.x, 2.6, a.z), b), plaster);
    }
    // ceiling around a skylight (x -1.6..1.6, z -2.2..0.6)
    const sx0 = -1.6, sx1 = 1.6, sz0 = -2.2, sz1 = 0.6;
    for (const [a, b] of [[V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.3, sz0)], [V(x0 - 0.3, h, sz1), V(x1 + 0.3, h + 0.3, z1 + 0.3)], [V(x0 - 0.3, h, sz0), V(sx0, h + 0.3, sz1)], [V(sx1, h, sz0), V(x1 + 0.3, h + 0.3, sz1)]] as const)
      shell.add(boxGeo(a, b, 0, true), plaster);
    for (const [a, b] of [[V(sx0, h, sz0), V(sx1, h + 1.0, sz0 + 0.1)], [V(sx0, h, sz1 - 0.1), V(sx1, h + 1.0, sz1)], [V(sx0, h, sz0), V(sx0 + 0.1, h + 1.0, sz1)], [V(sx1 - 0.1, h, sz0), V(sx1, h + 1.0, sz1)]] as const)
      shell.add(boxGeo(a, b), plaster);
    this.sky = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.12, 0.3) });
    const sk = new THREE.Mesh(new THREE.PlaneGeometry(sx1 - sx0, sz1 - sz0), this.sky);
    sk.rotation.x = Math.PI / 2; sk.position.set(0, h + 0.95, (sz0 + sz1) / 2); sk.layers.set(NOINK); this.root.add(sk);
    for (let x = sx0 + 0.8; x < sx1; x += 0.8) fix.add(boxGeo(V(x - 0.03, h + 0.85, sz0), V(x + 0.03, h + 0.92, sz1)), dark);
    fix.add(boxGeo(V(sx0, h + 0.85, -0.83), V(sx1, h + 0.92, -0.77)), dark);
    // tiered benches in a U: back (across x) and two sides (along z); a rail in front of every tier
    for (let k = 0; k < 4; k++) {
      const y = tierY(k), zb = tierZ(k), xs = tierX(k);
      deco.add(boxGeo(V(-xs - 0.4, 0, zb - 0.4), V(xs + 0.4, y, zb + 0.4)), oak);
      for (const s of [-1, 1]) deco.add(boxGeo(V(s < 0 ? -xs - 0.4 : xs - 0.4, 0, zb + 0.4), V(s < 0 ? -xs + 0.4 : xs + 0.4, y, 3.4)), oak);
      fix.add(boxGeo(V(-xs + 0.4, y + 0.55, zb + 0.4), V(xs - 0.4, y + 0.62, zb + 0.46)), dark);
      for (const s of [-1, 1]) fix.add(boxGeo(V(s * (xs - 0.46) - 0.03, y + 0.55, zb + 0.46), V(s * (xs - 0.46) + 0.03, y + 0.62, 3.4)), dark);
      for (let x = -xs + 0.6; x < xs - 0.4; x += 0.6) fix.add(boxGeo(V(x - 0.02, y, zb + 0.41), V(x + 0.02, y + 0.55, zb + 0.45)), dark);
    }
    // the dissecting table under a sheet, the body a long hump beneath it
    const T = DTABLE;
    for (const [x, z] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]]) deco.add(boxGeo(V(T.x + x - 0.05, 0, T.z + z - 0.05), V(T.x + x + 0.05, T.top - 0.06, T.z + z + 0.05)), dark);
    deco.add(boxGeo(V(T.x - T.l / 2, T.top - 0.06, T.z - T.w / 2), V(T.x + T.l / 2, T.top, T.z + T.w / 2)), oak);
    deco.add(boxGeo(V(T.x - T.l / 2 - 0.08, T.top - 0.42, T.z - T.w / 2 - 0.08), V(T.x + T.l / 2 + 0.08, T.top + 0.01, T.z + T.w / 2 + 0.08)), sheet);
    deco.add(new THREE.SphereGeometry(0.5, 20, 12), sheet, at(T.x + 0.05, T.top, T.z).scale(V(1.7, 0.32, 0.55)));
    deco.add(new THREE.SphereGeometry(0.15, 14, 10), sheet, at(T.x - 0.82, T.top + 0.1, T.z).scale(V(1, 0.8, 1)));
    for (const s of [-1, 1]) deco.add(new THREE.SphereGeometry(0.07, 10, 8), sheet, at(T.x + 0.92, T.top + 0.13, T.z + s * 0.12));
    // the lectern: a slanted desk on a post, with a candle either side
    const [lx, , lz] = LECTERN;
    deco.add(boxGeo(V(lx - 0.06, 0, lz - 0.06), V(lx + 0.06, 1.05, lz + 0.06)), dark);
    deco.add(boxGeo(V(-0.3, -0.03, -0.2), V(0.3, 0.03, 0.2)), oak, at(lx, 1.12, lz, 0.35, 0, 0));
    for (const dx of [-0.36, 0.36]) {
      deco.add(cyl(0.05, 0.06, 0.03), brass, at(lx + dx, 1.08, lz + 0.05));
      deco.add(cyl(0.025, 0.025, 0.16), wax, at(lx + dx, 1.17, lz + 0.05));
      this.flame(lx + dx, 1.3, lz + 0.05, 0.07, 0.15, 2.6);
      this.glow(lx + dx, 1.3, lz + 0.05, 1.3, 0.4);
    }
    // wall sconces
    for (const [x, z] of [[x0 + 0.1, -4], [x0 + 0.1, 1.5], [x1 - 0.1, -4], [x1 - 0.1, 1.5], [-2.5, z0 + 0.1], [2.5, z0 + 0.1]]) {
      fix.add(cyl(0.04, 0.04, 0.2), brass, at(x, 3.0, z));
      fix.add(cyl(0.025, 0.025, 0.14), wax, at(x, 3.17, z));
      this.flame(x, 3.3, z, 0.08, 0.16, 2.6);
      this.glow(x, 3.3, z, 1.6, 0.45);
    }
    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
  /** lightning 0..1: the skylight flares HDR blue-white */
  pose(flash: number) { this.sky.color.setRGB(0.1 + 3.4 * flash, 0.12 + 3.5 * flash, 0.3 + 3.9 * flash); }
}
