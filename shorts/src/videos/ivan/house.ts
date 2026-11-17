// Ivan Ilych's new house (ch. III) and the dark (ch. IX-XII), floor y = 0, side by side:
// - the DRAWING ROOM (x 0): parquet, cream-and-gold paper, a tall window on the back wall with a brass KNOB on its frame and
//   the pink-flowered cretonne drapes he chose himself; a plush sofa, a pouffe, a cabinet of bronzes and antique plates, a
//   step-ladder by the window. Dressed by pose(): "decor" (left drape only, ladder up), "hung" (both drapes, no ladder),
//   "funeral" (both drapes, a closed coffin on a stand, four tall candles).
// - the SICKROOM (x 40): his study with the sofa made up as a bed (sheet, pillow), a small table of medicine bottles and a
//   night candle, a doorway at the right, a window onto a night sky.
// - the DARK (x 200): the "black sack": a long dark tube receding from the lens, with a light at its far end that grows
//   (pose light 0..1) until it fills the frame.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const DRAW: V3 = [0, 0, 0];
export const SICK: V3 = [40, 0, 0];
export const DARK: V3 = [200, 0, 0];
/** the window (back wall z -4): frame x -0.3..1.5, y 0.7..3.5; the brass knob on the right jamb */
export const KNOB: V3 = [1.6, 2.05, -3.86];
/** the step-ladder's top step (Ivan stands here in shot 7) */
export const LADDER_TOP: V3 = [2.05, 1.12, -3.2];
export const COFFIN: V3 = [0.6, 0, -2.3];
export const COFFIN_TOP = 0.98;

const paper = () => ctex("ivPaper", 512, 512, (g) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#dccca8"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 24, 512);
  g.fillStyle = "#c8a85a"; for (let x = 32; x < 512; x += 64) for (let y = 30; y < 440; y += 72) { g.beginPath(); g.arc(x + 12, y, 5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#5a3a2a"; g.fillRect(0, 450, 512, 62); g.fillStyle = "#c8a85a"; g.fillRect(0, 442, 512, 8);
});
const sickPaper = () => ctex("ivSickPaper", 512, 512, (g) => {
  g.fillStyle = "#6a7a5a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#74846a"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 22, 512);
  g.fillStyle = "#3a2a20"; g.fillRect(0, 456, 512, 56);
});
/** the pink-flowered cretonne (ch. I: "the pink cretonne") */
export const cretonne = () => ctex("ivCretonne", 512, 512, (g) => {
  g.fillStyle = "#f0b4c2"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
    const cx = x * 86 + (y % 2 ? 43 : 0) + 20, cy = y * 64 + 30;
    g.fillStyle = "#6a9a5a"; g.beginPath(); g.ellipse(cx + 14, cy + 8, 10, 5, 0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d8486a"; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.arc(cx + 8 * Math.cos(a), cy + 8 * Math.sin(a), 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#f8e08a"; g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill();
  }
});
const night = () => ctex("ivNightSky", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0c1430"); gr.addColorStop(1, "#24305a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#e8eef8"; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % 256, (i * 53) % 300, 2, 2);
  g.fillStyle = "#1a1e30"; g.fillRect(0, 380, 256, 132);
  g.fillStyle = "#f2d27a"; for (const x of [30, 120, 200]) g.fillRect(x, 410, 16, 22);
});
const street = () => ctex("ivStreet", 256, 512, (g) => { // a winter street through the drawing-room window: pale sky, snowy roofs
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#b4cce4"); gr.addColorStop(1, "#eef2f6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#c8b8a0"; g.fillRect(0, 300, 256, 212);
  g.fillStyle = "#f8f8fa"; g.fillRect(0, 290, 256, 16);
  g.fillStyle = "#6a7a94"; for (let x = 16; x < 256; x += 56) g.fillRect(x, 340, 26, 46);
});

/** a hanging drape: a vertical strip with sine folds, from yTop down to yBot, between x0 and x1 at depth z */
export const drape = (x0: number, x1: number, yTop: number, yBot: number, z: number, folds = 5, depth = 0.09) => {
  const n = folds * 8, geo = new THREE.PlaneGeometry(x1 - x0, yTop - yBot, n, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + (x1 - x0) / 2) / (x1 - x0);
    pos.setZ(i, depth * Math.sin(u * folds * Math.PI * 2));
  }
  geo.computeVertexNormals();
  geo.translate((x0 + x1) / 2, (yTop + yBot) / 2, z);
  return geo;
};

export class House extends Room {
  private leftDrape: THREE.Mesh; private rightDrape: THREE.Mesh;
  private ladder = new THREE.Group(); private coffin = new THREE.Group(); private funeralFl: THREE.Sprite[] = [];
  private tube: THREE.Mesh; private hole: THREE.Mesh; private holeMat: THREE.MeshBasicMaterial; private holeGlow: THREE.Sprite;
  private sickFl: THREE.Sprite[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const parquet = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const wallM = lam("ivPaperW", () => ({ map: paper(), side: THREE.DoubleSide })), sickW = lam("ivSickW", () => ({ map: sickPaper(), side: THREE.DoubleSide }));
    const gilt = lam("ivGilt", () => ({ color: "#d9a84a" })), wood = lam("ivWood", () => ({ color: "#5a3420" })), white = lam("ivWhiteWood", () => ({ color: "#f2ece0" }));
    const plush = lam("ivPlush", () => ({ color: "#7a3a5a" })), brass = lam("ivBrass", () => ({ color: "#f0c850", emissive: "#5a4010" }));
    const bronze = lam("ivBronze", () => ({ color: "#8a5a2a" })), plate = lam("ivPlate", () => ({ color: "#e8eef4" })), glass = lam("ivGlass", () => ({ color: "#9ab8c8" }));
    const view = lam("ivStreetV", () => ({ map: street(), emissive: "#ffffff", emissiveMap: street() }));
    const nightV = lam("ivNightV", () => ({ map: night(), emissive: "#ffffff", emissiveMap: night() }));
    const drapeM = lam("ivDrape", () => ({ map: cretonne(), side: THREE.DoubleSide }));
    const wax = lam("ivWax", () => ({ color: "#f5ecd6" })), sheet = lam("ivSheet", () => ({ color: "#f4f2ea" }));
    const coffinM = lam("ivCoffin", () => ({ color: "#5a3a26" })), pall = lam("ivPall", () => ({ color: "#e8e0cc" }));

    // ---- the drawing room ----
    const W = 5, D0 = -4, D1 = 6, H = 4.6;
    b.add(quad(V(-W, 0, D1), V(W, 0, D1), V(W, 0, D0), V(-W, 0, D0), 2, 2), parquet);
    b.add(quad(V(-W, 0, D0), V(W, 0, D0), V(W, H, D0), V(-W, H, D0), 3, 1), wallM);
    for (const s of [-1, 1]) b.add(quad(V(s * W, 0, D1), V(s * W, 0, D0), V(s * W, H, D0), V(s * W, H, D1), 3, 1), wallM);
    fix.add(boxGeo(V(-W, H - 0.3, D0), V(W, H, D0 + 0.2)), gilt); // cornice
    // the window: white frame, the street outside, glazing bars, the brass knob on the right jamb
    fix.add(boxGeo(V(-0.3, 0.7, D0), V(1.5, 3.5, D0 + 0.08)), white);
    fix.add(boxGeo(V(-0.15, 0.85, D0 + 0.08), V(1.35, 3.35, D0 + 0.1)), view);
    fix.add(boxGeo(V(0.57, 0.85, D0 + 0.1), V(0.63, 3.35, D0 + 0.14)), white);
    for (const y of [1.65, 2.5]) fix.add(boxGeo(V(-0.15, y - 0.03, D0 + 0.1), V(1.35, y + 0.03, D0 + 0.14)), white);
    fix.add(boxGeo(V(-0.4, 0.62, D0), V(1.6, 0.72, D0 + 0.22)), white); // sill
    fix.add(new THREE.SphereGeometry(0.075, 14, 10), brass, at(KNOB[0], KNOB[1], KNOB[2]));
    fix.add(cyl(0.025, 0.025, 0.08, 8), brass, at(KNOB[0], KNOB[1], KNOB[2] - 0.05, Math.PI / 2));
    // the curtain rod + the two drapes
    fix.add(cyl(0.03, 0.03, 3.4, 8), gilt, at(0.6, 3.75, D0 + 0.22, 0, 0, Math.PI / 2));
    for (const x of [-1.1, 2.3]) fix.add(new THREE.SphereGeometry(0.07, 10, 8), gilt, at(x, 3.75, D0 + 0.22));
    this.leftDrape = new THREE.Mesh(drape(-1.0, 0.0, 3.72, 0.02, D0 + 0.26), drapeM);
    this.rightDrape = new THREE.Mesh(drape(1.2, 2.2, 3.72, 0.02, D0 + 0.26), drapeM);
    for (const m of [this.leftDrape, this.rightDrape]) { m.receiveShadow = true; this.root.add(m); }
    // the sofa (left), a pouffe, a cabinet of bronzes and plates (right)
    deco.add(boxGeo(V(-4.2, 0.1, -3.7), V(-1.8, 0.5, -2.9)), plush);
    deco.add(boxGeo(V(-4.2, 0.5, -3.95), V(-1.8, 1.25, -3.65)), plush);
    for (const x of [-4.2, -1.8]) deco.add(boxGeo(V(x - 0.12, 0.1, -3.95), V(x + 0.12, 0.8, -2.9)), plush);
    deco.add(boxGeo(V(-4.2, 0, -3.8), V(-1.8, 0.1, -2.9)), wood);
    deco.add(cyl(0.32, 0.32, 0.42, 14), plush, at(-1.2, 0.21, -1.8));
    deco.add(cyl(0.3, 0.3, 0.04, 14), gilt, at(-1.2, 0.44, -1.8));
    deco.add(boxGeo(V(2.9, 0, -3.95), V(4.6, 1.9, -3.45)), wood);
    for (let i = 0; i < 3; i++) fix.add(new THREE.SphereGeometry(0.16, 12, 8), plate, at(3.2 + i * 0.55, 2.4, -3.92, Math.PI / 2, 0, 0, 1)); // plates on the wall
    for (const [x, h] of [[3.15, 0.42], [3.75, 0.55], [4.3, 0.36]] as const) { // bronzes on the cabinet
      deco.add(cyl(0.07, 0.1, 0.06, 10), bronze, at(x, 1.93, -3.7));
      deco.add(cyl(0.05, 0.08, h * 0.7, 10), bronze, at(x, 1.96 + h * 0.35, -3.7));
      deco.add(new THREE.SphereGeometry(0.07, 10, 8), bronze, at(x, 1.96 + h * 0.75, -3.7));
    }
    for (const x of [-4.4, 4.4]) { // gilt frames
      fix.add(boxGeo(V(x - 0.4, 2.0, D0), V(x + 0.4, 3.0, D0 + 0.05)), gilt);
      fix.add(boxGeo(V(x - 0.32, 2.08, D0 + 0.05), V(x + 0.32, 2.92, D0 + 0.06)), lam("ivCanvas", () => ({ color: "#6a7a5a" })));
    }
    // the step-ladder (pose: decor)
    const lw = lam("ivLadder", () => ({ color: "#b08a5a" }));
    const [lx, , lz] = LADDER_TOP;
    for (const s of [-1, 1]) {
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.05), lw); front.position.set(lx + s * 0.28, 0.6, lz + 0.32); front.rotation.x = -0.25; this.ladder.add(front);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.05), lw); back.position.set(lx + s * 0.28, 0.6, lz - 0.3); back.rotation.x = 0.25; this.ladder.add(back);
    }
    for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.18), lw); st.position.set(lx, 0.3 + i * 0.38, lz + 0.42 - i * 0.1); this.ladder.add(st); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.36), lw); top.position.set(lx, LADDER_TOP[1], lz); this.ladder.add(top);
    this.ladder.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.root.add(this.ladder);
    // the coffin on its stand, under a white pall at the foot; four tall candles (pose: funeral)
    const [cx, , cz] = COFFIN;
    const shape = new THREE.Shape([[-0.32, -1.0], [0.32, -1.0], [0.4, 0.5], [0.3, 1.0], [-0.3, 1.0], [-0.4, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)));
    const box = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false }); box.rotateX(-Math.PI / 2); box.rotateY(Math.PI / 2);
    const cm = new THREE.Mesh(box, coffinM); cm.position.set(cx, 0.58, cz); this.coffin.add(cm);
    const lidG = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); lidG.rotateX(-Math.PI / 2); lidG.rotateY(Math.PI / 2); lidG.scale(0.96, 1, 0.96);
    const lid = new THREE.Mesh(lidG, coffinM); lid.position.set(cx, 0.98, cz); this.coffin.add(lid);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.03, 0.03), gilt); trim.position.set(cx, 0.9, cz + 0.4); this.coffin.add(trim);
    const pallM = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.86), pall); pallM.position.set(cx + 0.55, 1.08, cz); this.coffin.add(pallM);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.58, 0.7), lam("ivStand", () => ({ color: "#2a2228" }))); stand.position.set(cx, 0.29, cz); this.coffin.add(stand);
    for (const [dx, dz] of [[-1.25, 0.6], [1.25, 0.6], [-1.25, -0.6], [1.25, -0.6]]) {
      const pole = new THREE.Mesh(cyl(0.03, 0.06, 1.5, 8), gilt); pole.position.set(cx + dx, 0.75, cz + dz); this.coffin.add(pole);
      const c = new THREE.Mesh(cyl(0.035, 0.035, 0.3, 8), wax); c.position.set(cx + dx, 1.65, cz + dz); this.coffin.add(c);
    }
    this.coffin.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.root.add(this.coffin);
    const nf = this.flames.length;
    for (const [dx, dz] of [[-1.25, 0.6], [1.25, 0.6], [-1.25, -0.6], [1.25, -0.6]]) { this.flame(cx + dx, 1.88, cz + dz, 0.07, 0.16, 2.4); this.glow(cx + dx, 1.88, cz + dz, 1.6, 0.4); }
    this.funeralFl = [...this.flames.slice(nf).map((f) => f.s), ...this.glows.slice(-4)];

    // ---- the sickroom ----
    const sx = SICK[0];
    b.add(quad(V(sx - 4, 0, 5), V(sx + 4, 0, 5), V(sx + 4, 0, -3), V(sx - 4, 0, -3), 2, 2), parquet);
    b.add(quad(V(sx - 4, 0, -3), V(sx + 4, 0, -3), V(sx + 4, 4.2, -3), V(sx - 4, 4.2, -3), 3, 1), sickW);
    for (const s of [-1, 1]) b.add(quad(V(sx + s * 4, 0, 5), V(sx + s * 4, 0, -3), V(sx + s * 4, 4.2, -3), V(sx + s * 4, 4.2, 5), 3, 1), sickW);
    fix.add(boxGeo(V(sx - 3.0, 1.1, -3), V(sx - 1.6, 3.3, -2.94)), wood); // window
    fix.add(boxGeo(V(sx - 2.9, 1.2, -2.94), V(sx - 1.7, 3.2, -2.92)), nightV);
    fix.add(boxGeo(V(sx - 2.33, 1.2, -2.92), V(sx - 2.27, 3.2, -2.88)), wood);
    // the sofa-bed against the back wall, sheet + pillow
    deco.add(boxGeo(V(sx - 1.3, 0.1, -2.9), V(sx + 1.3, 0.48, -2.0)), plush);
    deco.add(boxGeo(V(sx - 1.3, 0.48, -2.98), V(sx + 1.3, 1.2, -2.7)), plush);
    for (const x of [sx - 1.3, sx + 1.3]) deco.add(boxGeo(V(x - 0.12, 0.1, -2.98), V(x + 0.12, 0.78, -2.0)), plush);
    deco.add(boxGeo(V(sx - 1.2, 0.48, -2.7), V(sx + 1.2, 0.54, -2.02)), sheet);
    deco.add(boxGeo(V(sx - 1.2, 0.54, -2.66), V(sx - 0.7, 0.7, -2.2)), sheet);
    // the medicine table + night candle (right), a low stool
    deco.add(boxGeo(V(sx + 1.6, 0.68, -2.8), V(sx + 2.3, 0.72, -2.2)), wood);
    for (const [x, z] of [[1.64, -2.76], [2.26, -2.76], [1.64, -2.24], [2.26, -2.24]]) deco.add(boxGeo(V(sx + x - 0.03, 0, z - 0.03), V(sx + x + 0.03, 0.68, z + 0.03)), wood);
    for (const [x, h] of [[1.75, 0.2], [1.9, 0.26], [2.05, 0.16]] as const) deco.add(cyl(0.035, 0.04, h, 8), glass, at(sx + x, 0.72 + h / 2, -2.55));
    deco.add(cyl(0.035, 0.04, 0.2, 8), wax, at(sx + 2.18, 0.82, -2.35));
    const ns = this.flames.length;
    this.flame(sx + 2.18, 1.0, -2.35, 0.06, 0.13, 2.4); this.glow(sx + 2.18, 1.0, -2.35, 2.0, 0.5);
    this.sickFl = [this.flames[ns].s, this.glows[this.glows.length - 1]];
    // the doorway at the right of the back wall
    fix.add(boxGeo(V(sx + 2.7, 0, -3), V(sx + 3.8, 2.6, -2.96)), lam("ivDoorDark", () => ({ color: "#2a1e18" })));
    for (const x of [2.62, 3.8]) fix.add(boxGeo(V(sx + x, 0, -3), V(sx + x + 0.1, 2.7, -2.9)), white);
    fix.add(boxGeo(V(sx + 2.62, 2.6, -3), V(sx + 3.9, 2.72, -2.9)), white);

    // ---- the dark: the black sack ----
    const [dx] = DARK;
    const tubeG = new THREE.CylinderGeometry(2.2, 1.0, 40, 24, 12, true); tubeG.rotateX(Math.PI / 2);
    this.tube = new THREE.Mesh(tubeG, new THREE.MeshLambertMaterial({ color: "#2a2230", side: THREE.BackSide }));
    this.tube.position.set(dx, 1.5, -16); this.root.add(this.tube);
    for (let i = 0; i < 10; i++) { // ribs of the sack (fold lines) so the camera feels the depth
      const r = 2.2 - (1.2 * (i + 0.5)) / 10, ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 32), lam("ivRib", () => ({ color: "#140e18" })));
      ring.position.set(dx, 1.5, 4 - i * 4); this.root.add(ring);
    }
    this.holeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.9, 2.6), fog: false });
    this.hole = new THREE.Mesh(new THREE.CircleGeometry(1, 40), this.holeMat); this.hole.position.set(dx, 1.5, -35.9); this.root.add(this.hole);
    this.holeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ color: "#fff6e0", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.holeGlow.layers.set(1); this.root.add(this.holeGlow);
    void this.holeGlow;

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
  /** dressing of the drawing room; candles; light = the far light in the dark (0 none .. 1 floods toward the lens) */
  pose(dress: "decor" | "hung" | "funeral", sickCandle = true, light = 0) {
    this.leftDrape.visible = true; this.rightDrape.visible = dress !== "decor";
    this.ladder.visible = dress === "decor";
    this.coffin.visible = dress === "funeral";
    this.setFlames(true);
    for (const s of this.funeralFl) s.visible = dress === "funeral";
    for (const s of this.sickFl) s.visible = sickCandle;
    // the light: a pinprick far down the tube that rushes toward the lens and swells until it fills the frame
    const k = Math.max(0, light);
    this.hole.visible = k > 0;
    const z = -35.9 + 34 * k ** 2.2, s = 0.05 + 2.6 * k ** 1.5;
    this.hole.position.z = z; this.hole.scale.set(s, s, 1);
    const hdr = 1.5 + 4 * k; this.holeMat.color.setRGB(hdr, hdr * 0.97, hdr * 0.88);
  }
}
