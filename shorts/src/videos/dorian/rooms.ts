// The Picture of Dorian Gray sets. Floor y = 0 everywhere; cameras mostly look toward -z. Each set is a Room shown one at a time.
// - Studio: Basil Hallward's studio in June (ch. 1-2): big paned window onto the lilac garden, the easel with the portrait,
//   a divan (Lord Henry), a low dais (Dorian), paint table, roses, a panelled door.
// - Theatre: the shabby little theatre (ch. 4, 7): stage with footlights, proscenium with red curtains + a drop curtain,
//   Juliet's balcony, a side box for Dorian, stall rows.
// - Library: Dorian's library (ch. 7-8): the portrait on the wall behind a gilt leather screen, fireplace, window with blinds.
// - Schoolroom: the old schoolroom at the top of the house (ch. 10, 13, 20): the portrait under purple satin, the painted
//   chest (the knife), a table with an oil lamp + the rickety chair, a dusty bookcase, a moonlit window (the servants' way in).
// Every layer on a wall stands >= 4 cm proud of the layer behind it (no coplanar faces).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import { Pen } from "../../engine/toon";
import { drawPortrait, PORTRAIT_W, PORTRAIT_H } from "../../engine/library/dorian";
import type { V3 } from "./story";

export const shell = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material | null, back = true, tile = 2) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / tile, (z1 - z0) / tile), floor);
  b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, z1), 2), wall);
  b.add(boxGeo(V(x1, 0, z0), V(x1 + 0.4, h, z1), 2), wall);
  b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), wall);
  if (back) b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
  if (ceil) b.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.3, z1 + 0.4), 0, true), ceil);
};
/** the back wall of a room with one rectangular hole (window or door) at x0..x1, y0..y1 */
export const holedWall = (b: Batch, X0: number, X1: number, z: number, h: number, x0: number, x1: number, y0: number, y1: number, wall: THREE.Material) => {
  b.add(boxGeo(V(X0 - 0.4, 0, z - 0.4), V(x0, h, z), 2), wall);
  b.add(boxGeo(V(x1, 0, z - 0.4), V(X1 + 0.4, h, z), 2), wall);
  if (y0 > 0) b.add(boxGeo(V(x0, 0, z - 0.4), V(x1, y0, z), 2), wall);
  b.add(boxGeo(V(x0, y1, z - 0.4), V(x1, h, z), 2), wall);
};
export const paper = (key: string, a: string, b2: string, stripe = true) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = a; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) {
    g.fillStyle = b2;
    if (stripe) g.fillRect(x + 28, 0, 8, 512);
    for (let y = 16; y < 512; y += 64) { g.beginPath(); g.arc(x + 32, y + (x % 128 ? 32 : 0), stripe ? 7 : 11, 0, Math.PI * 2); g.fill(); }
  }
  for (let i = 0; i < 200; i++) { g.fillStyle = "rgba(0,0,0,0.03)"; g.fillRect(r() * 512, r() * 512, 20, 20); }
});
export const doorTex = (key: string, col: string, dark: string) => ctex(key, 256, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(0,0,0,0.05)"; g.lineWidth = 2; const x = r() * 256; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() * 6 - 3, 512); g.stroke(); }
  const panel = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = dark; g.fillRect(x, y, w, h);
    g.fillStyle = col; g.fillRect(x + 10, y + 10, w - 20, h - 20);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x, y, w, 5); g.fillRect(x, y, 5, h);
    g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(x, y + h - 5, w, 5); g.fillRect(x + w - 5, y, 5, h);
    g.strokeStyle = "#141018"; g.lineWidth = 3; g.strokeRect(x, y, w, h);
  };
  panel(34, 40, 82, 250); panel(140, 40, 82, 250); panel(34, 330, 82, 140); panel(140, 330, 82, 140);
  g.strokeStyle = "#141018"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 504);
});
type WinOpts = { frame: THREE.Material; glass?: THREE.Material | null; cols?: number; rows?: number; shutter?: THREE.Material; sill?: THREE.Material; head?: boolean };
/** a window on a wall whose face is the plane z, built out toward +z: casing, header, sill + apron, sash bars, shutters */
export const windowUnit = (b: Batch, x: number, y0: number, w: number, h: number, z: number, o: WinOpts) => {
  const { frame, glass = null, cols = 2, rows = 2, shutter, sill = frame, head = true } = o;
  const c = 0.09, bar = 0.035;
  if (glass) b.add(boxGeo(V(x - w / 2, y0, z - 0.02), V(x + w / 2, y0 + h, z + 0.01)), glass);
  b.add(boxGeo(V(x - w / 2 - c, y0 - 0.02, z), V(x - w / 2, y0 + h + 0.02, z + 0.06)), frame);
  b.add(boxGeo(V(x + w / 2, y0 - 0.02, z), V(x + w / 2 + c, y0 + h + 0.02, z + 0.06)), frame);
  b.add(boxGeo(V(x - w / 2 - c, y0 + h, z), V(x + w / 2 + c, y0 + h + c, z + 0.06)), frame);
  if (head) b.add(boxGeo(V(x - w / 2 - c - 0.05, y0 + h + c, z), V(x + w / 2 + c + 0.05, y0 + h + c + 0.06, z + 0.1)), frame);
  b.add(boxGeo(V(x - w / 2 - c - 0.06, y0 - 0.07, z), V(x + w / 2 + c + 0.06, y0, z + 0.14)), sill);
  b.add(boxGeo(V(x - w / 2 - 0.02, y0 - 0.16, z), V(x + w / 2 + 0.02, y0 - 0.07, z + 0.04)), frame);
  for (let i = 1; i < cols; i++) { const xx = x - w / 2 + (w * i) / cols; b.add(boxGeo(V(xx - bar / 2, y0, z + 0.01), V(xx + bar / 2, y0 + h, z + 0.04)), frame); }
  for (let j = 1; j < rows; j++) { const yy = y0 + (h * j) / rows, k = j === rows / 2 ? 1.6 : 1; b.add(boxGeo(V(x - w / 2, yy - (bar * k) / 2, z + 0.01), V(x + w / 2, yy + (bar * k) / 2, z + 0.04)), frame); }
  if (shutter) for (const sd of [-1, 1]) {
    const sx0 = sd < 0 ? x - w / 2 - c - w * 0.46 : x + w / 2 + c, sx1 = sx0 + w * 0.46;
    b.add(boxGeo(V(sx0, y0 - 0.02, z), V(sx1, y0 + h + 0.02, z + 0.04)), shutter);
    for (let yy = y0 + 0.08; yy < y0 + h - 0.04; yy += 0.11) b.add(boxGeo(V(sx0 + 0.04, yy, z + 0.04), V(sx1 - 0.04, yy + 0.035, z + 0.065)), frame);
  }
};
/** a door on a wall face at z (built toward +z): casing + header + cornice, optional transom light, the leaf, a brass knob */
export const doorUnit = (b: Batch, x: number, y0: number, w: number, h: number, z: number, o: { frame: THREE.Material; leaf?: THREE.Material | null; knob: THREE.Material; transom?: THREE.Material }) => {
  const c = 0.1;
  if (o.leaf) {
    b.add(boxGeo(V(x - w / 2, y0, z - 0.02), V(x + w / 2, y0 + h, z + 0.03)), o.leaf);
    b.add(new THREE.SphereGeometry(0.045, 10, 8), o.knob, at(x + w / 2 - 0.12, y0 + 1.0, z + 0.07));
    b.add(boxGeo(V(x + w / 2 - 0.15, y0 + 0.88, z + 0.03), V(x + w / 2 - 0.09, y0 + 1.1, z + 0.045)), o.knob);
  }
  const top = o.transom ? y0 + h + 0.36 : y0 + h;
  if (o.transom) { b.add(boxGeo(V(x - w / 2, y0 + h + 0.04, z - 0.02), V(x + w / 2, top - 0.04, z + 0.01)), o.transom); b.add(boxGeo(V(x - w / 2, y0 + h, z), V(x + w / 2, y0 + h + 0.05, z + 0.05)), o.frame); for (let i = 1; i < 3; i++) b.add(boxGeo(V(x - w / 2 + (w * i) / 3 - 0.015, y0 + h, z + 0.01), V(x - w / 2 + (w * i) / 3 + 0.015, top, z + 0.04)), o.frame); }
  b.add(boxGeo(V(x - w / 2 - c, y0, z), V(x - w / 2, top, z + 0.07)), o.frame);
  b.add(boxGeo(V(x + w / 2, y0, z), V(x + w / 2 + c, top, z + 0.07)), o.frame);
  b.add(boxGeo(V(x - w / 2 - c - 0.05, top, z), V(x + w / 2 + c + 0.05, top + 0.12, z + 0.11)), o.frame);
  b.add(boxGeo(V(x - w / 2 - c - 0.08, top + 0.12, z), V(x + w / 2 + c + 0.08, top + 0.16, z + 0.15)), o.frame);
};
export const gold = () => twoTone(new THREE.MeshPhongMaterial({ color: "#c8a04a", specular: "#fff0c0", shininess: 70 }), 0.2);
export const brassK = () => twoTone(new THREE.MeshPhongMaterial({ color: "#d8b04a", specular: "#fff0c0", shininess: 80 }), 0.2);

// ================= the portrait (one prop, five painted stages) =================
const portraitMat = (s: number) => lam(`dgPortrait${s}`, () => ({ map: ctex(`dgPortraitT${s}`, PORTRAIT_W, PORTRAIT_H, (g) => drawPortrait(new Pen(g), s)) }));
/** the canvas in a carved gilt frame, its face at z = 0 of the group, centre at (0, 0); w x h is the painted canvas */
export class Portrait {
  root = new THREE.Group();
  private face: THREE.Mesh;
  private mats: THREE.Material[];
  private cover: THREE.Group | null = null;
  private heap: THREE.Group | null = null;
  private stageNow = -1;
  constructor(readonly w: number, readonly h: number, coverable = false, frameDepth = 0.1) {
    this.mats = [0, 1, 2, 3, 4].map(portraitMat);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mats[0]);
    this.face.position.z = 0.02; this.root.add(this.face);
    const b = new Batch(), gilt = gold(), dark = lam("dgFrameDark", () => ({ color: "#5a3a1a" }));
    const f = 0.12, d = frameDepth;
    // backing board, then the frame: outer moulding + a thin inner lip, all proud of the canvas
    b.add(boxGeo(V(-w / 2 - f, -h / 2 - f, -0.04), V(w / 2 + f, h / 2 + f, 0)), dark);
    for (const [x0, y0, x1, y1] of [[-w / 2 - f, -h / 2 - f, w / 2 + f, -h / 2], [-w / 2 - f, h / 2, w / 2 + f, h / 2 + f], [-w / 2 - f, -h / 2, -w / 2, h / 2], [w / 2, -h / 2, w / 2 + f, h / 2]] as const)
      b.add(boxGeo(V(x0, y0, 0), V(x1, y1, d)), gilt);
    for (const [x0, y0, x1, y1] of [[-w / 2, -h / 2, w / 2, -h / 2 + 0.03], [-w / 2, h / 2 - 0.03, w / 2, h / 2], [-w / 2, -h / 2, -w / 2 + 0.03, h / 2], [w / 2 - 0.03, -h / 2, w / 2, h / 2]] as const)
      b.add(boxGeo(V(x0, y0, 0.02), V(x1, y1, 0.07)), dark);
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) b.add(new THREE.SphereGeometry(0.07, 10, 8), gilt, at(x * (w / 2 + f / 2), y * (h / 2 + f / 2), d + 0.02));
    b.build(this.root, false); // no cast shadows: the frame threw blue ghosts on the wall
    if (coverable) {
      // the purple satin coverlet (ch. 10): a draped sheet hanging over the frame, folds as vertical ribs
      const satin = lam("dgSatin", () => ({ color: "#5a2a78" })), satin2 = lam("dgSatin2", () => ({ color: "#4a1e66" }));
      // built hanging DOWN from its top edge (the group origin sits on the top of the frame), so it can unroll or slip
      const cb = new Batch(), hb = new Batch(), L = h + 2 * f + 0.15;
      cb.add(boxGeo(V(-w / 2 - f - 0.04, -L, d + 0.05), V(w / 2 + f + 0.04, 0.03, d + 0.09)), satin);
      for (let i = 0; i < 6; i++) { const x = -w / 2 - f + 0.08 + i * ((w + 2 * f - 0.16) / 5); cb.add(cyl(0.035, 0.05, L - 0.05, 8), satin2, at(x, -L / 2, d + 0.11)); }
      cb.add(boxGeo(V(-w / 2 - f - 0.04, 0, -0.1), V(w / 2 + f + 0.04, 0.05, d + 0.09)), satin);
      this.cover = new THREE.Group(); cb.build(this.cover, false); this.root.add(this.cover);
      this.coverTop = h / 2 + f;
      // the heap on the floor once it has been pulled off
      for (let i = 0; i < 5; i++) hb.add(new THREE.SphereGeometry(0.22 + 0.06 * (i % 2), 10, 8), i % 2 ? satin2 : satin, at(-0.5 + i * 0.25, 0, 0.25 + 0.08 * (i % 3), 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.3, 0.45, 1)));
      this.heap = new THREE.Group(); hb.build(this.heap, true); this.root.add(this.heap);
    }
  }
  private coverTop = 0;
  /** stage 0..4 (see drawPortrait); cover 1 = hanging over the frame, 0 = off. mode "drape": it unrolls down from the
   *  top edge (thrown over); "slip": it slides down off the frame. heap: the satin lies in a heap on the floor below */
  pose(stage: number, cover = 0, mode: "drape" | "slip" = "slip", heap = false) {
    const s = Math.max(0, Math.min(4, Math.round(stage)));
    if (s !== this.stageNow) { this.face.material = this.mats[s]; this.stageNow = s; }
    if (this.cover && this.heap) {
      this.cover.visible = cover > 0.02;
      if (mode === "drape") { this.cover.position.y = this.coverTop; this.cover.scale.y = Math.max(0.02, cover); }
      else { this.cover.position.y = this.coverTop - (1 - cover) * (this.h + 0.3); this.cover.scale.y = 0.3 + 0.7 * cover; }
      const hk = mode === "slip" && heap ? Math.max(1 - cover, 0) : 0;
      this.heap.visible = hk > 0.02;
      this.heap.position.y = -this.root.position.y + 0.08;
      this.heap.scale.setScalar(0.4 + 0.6 * hk);
    }
  }
}

// ================= Basil's studio =================
export const STUDIO = { x0: -3.4, x1: 3.4, z0: -3.8, z1: 4.4, h: 3.8 };
export const EASEL: V3 = [1.0, 0, -1.9];
export const DIVAN = { x0: -3.05, x1: -1.35, z: -1.9, seat: 0.45 };
export const DAIS: V3 = [-0.55, 0, -2.5];
const garden = () => ctex("dgGarden", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#6aa0e0"); gr.addColorStop(0.45, "#c8e0f4"); gr.addColorStop(1, "#c8e0f4");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#5a8a3a"; g.beginPath(); g.moveTo(0, 330); for (let x = 0; x <= 512; x += 32) g.lineTo(x, 300 - 30 * Math.sin(x / 70)); g.lineTo(512, 512); g.lineTo(0, 512); g.fill();
  for (let i = 0; i < 14; i++) { const x = r() * 512, y = 250 + r() * 120; g.fillStyle = r() < 0.5 ? "#4a7a34" : "#6a9a44"; g.beginPath(); g.arc(x, y, 40 + r() * 30, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = 240 + r() * 150; g.fillStyle = r() < 0.6 ? "#b88ad0" : "#f0e0f4"; g.beginPath(); g.arc(x, y, 6 + r() * 6, 0, Math.PI * 2); g.fill(); } // lilac
  g.fillStyle = "#d8a0b0"; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(r() * 512, 420 + r() * 80, 7, 0, Math.PI * 2); g.fill(); } // roses
});
const palette = () => ctex("dgPalette", 256, 256, (g) => {
  g.fillStyle = "#c89a62"; g.beginPath(); g.ellipse(128, 128, 120, 90, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#6a4a2a"; g.beginPath(); g.arc(70, 150, 14, 0, Math.PI * 2); g.fill();
  ["#c83a3a", "#e8c04a", "#3a6ac8", "#f4f0e6", "#4a8a3a", "#8a3a8a"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(90 + i * 22, 70 + (i % 2) * 18, 12, 0, Math.PI * 2); g.fill(); });
});
export class Studio extends Room {
  portrait: Portrait;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = STUDIO;
    const wall = lam("stWall", () => ({ map: paper("stPaper", "#d8c8a6", "#cbb894") }));
    const floor = lam("stFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("stCeil", () => ({ color: "#efe6d2" })), false);
    const wx0 = -2.95, wx1 = -0.85, wy0 = 0.75, wy1 = 3.25;
    holedWall(b, x0, x1, z0, h, wx0, wx1, wy0, wy1, wall);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.0), new THREE.MeshBasicMaterial({ map: garden() }));
    view.position.set((wx0 + wx1) / 2, 2.0, z0 - 1.2); view.layers.set(NOINK); this.root.add(view);
    const frame = lam("stFrame", () => ({ color: "#f4f0e6" })), sill = lam("stSill", () => ({ color: "#e6dcc8" }));
    windowUnit(deco, (wx0 + wx1) / 2, wy0, wx1 - wx0, wy1 - wy0, z0, { frame, cols: 3, rows: 4, sill });
    // silk curtains on a brass rod, standing well off the casing
    const rod = gold();
    deco.add(cyl(0.022, 0.022, 3.0, 8), rod, at((wx0 + wx1) / 2, wy1 + 0.32, z0 + 0.3, 0, 0, Math.PI / 2));
    const silk = lam("stCurtain", () => ({ color: "#c8b06a" }));
    for (const x of [wx0 - 0.25, wx1 + 0.25]) deco.add(boxGeo(V(x - 0.26, 0.4, z0 + 0.24), V(x + 0.26, wy1 + 0.28, z0 + 0.34)), silk);
    // dado rail + skirting
    deco.add(boxGeo(V(x0, 0, z0), V(wx0 - 0.6, 0.14, z0 + 0.04)), lam("stSkirt", () => ({ color: "#6a4a2e" })));
    deco.add(boxGeo(V(wx1 + 0.6, 0, z0), V(x1, 0.14, z0 + 0.04)), lam("stSkirt", () => ({ color: "#6a4a2e" })));
    // panelled door with a transom in the back wall, right
    const knob = brassK();
    doorUnit(deco, 2.45, 0, 1.0, 2.25, z0, { frame: lam("stCasing", () => ({ color: "#efe8d8" })), leaf: lam("stDoor", () => ({ map: doorTex("stDoorT", "#7a5236", "#5a3a24") })), knob, transom: lam("stTransom", () => ({ color: "#9ab8d8" })) });
    // the easel: two front legs + a back leg, a tray ledge; the portrait sits on it
    const oak = lam("stOak", () => ({ map: beam() }));
    const [ex, , ez] = EASEL;
    const leg = (a: THREE.Vector3, c: THREE.Vector3, r = 0.035) => { const mid = a.clone().add(c).multiplyScalar(0.5); deco.add(cyl(r, r, a.distanceTo(c), 6), oak, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1))); };
    leg(V(ex - 0.45, 0, ez + 0.12), V(ex - 0.2, 2.65, ez - 0.12)); leg(V(ex + 0.45, 0, ez + 0.12), V(ex + 0.2, 2.65, ez - 0.12)); leg(V(ex, 0, ez - 0.75), V(ex, 2.5, ez - 0.14));
    deco.add(boxGeo(V(ex - 0.6, 0.8, ez - 0.02), V(ex + 0.6, 0.86, ez + 0.16)), oak);
    this.portrait = new Portrait(1.0, 1.5, false, 0.08);
    this.portrait.root.position.set(ex, 0.86 + 0.12 + 0.75, ez + 0.08); this.portrait.root.rotation.x = -0.06; this.root.add(this.portrait.root);
    // paint table with the palette + brush jars
    const tx = 2.35, tz = -1.15;
    deco.add(boxGeo(V(tx - 0.4, 0.72, tz - 0.3), V(tx + 0.4, 0.77, tz + 0.3)), oak);
    for (const [dx, dz] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) deco.add(boxGeo(V(tx + dx - 0.03, 0, tz + dz - 0.03), V(tx + dx + 0.03, 0.72, tz + dz + 0.03)), oak);
    const pal = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), lam("stPal", () => ({ map: palette() }))); pal.rotation.x = -Math.PI / 2; pal.position.set(tx - 0.1, 0.775, tz + 0.05); this.root.add(pal);
    const jar = lam("stJar", () => ({ color: "#5a7a8a" })), brush = lam("stBrush", () => ({ color: "#8a5a32" }));
    for (const [x, z] of [[tx + 0.22, tz - 0.12], [tx + 0.12, tz - 0.2]] as const) { deco.add(cyl(0.06, 0.06, 0.18, 10), jar, at(x, 0.86, z)); for (let i = 0; i < 3; i++) deco.add(cyl(0.008, 0.008, 0.36, 5), brush, at(x - 0.02 + i * 0.02, 1.0, z, 0, 0, -0.15 + i * 0.15)); }
    // the low dais Dorian poses on
    deco.add(cyl(0.62, 0.66, 0.2, 24), lam("stDais", () => ({ color: "#7a3a3a" })), at(DAIS[0], 0.1, DAIS[2]));
    // the divan (Lord Henry lies on it, ch. 1): Persian saddle-bag cover, cushions; he sits on its front edge
    const { x0: d0, x1: d1, z: dz, seat } = DIVAN;
    const persian = lam("stDivan", () => ({ color: "#7a3a5a" })), persian2 = lam("stDivan2", () => ({ color: "#5a2a44" })), dleg = lam("stDLeg", () => ({ color: "#3a2416" }));
    deco.add(boxGeo(V(d0, 0.16, dz - 0.4), V(d1, seat, dz + 0.4)), persian);
    deco.add(boxGeo(V(d0, seat, dz - 0.45), V(d1, 0.95, dz - 0.3)), persian2);
    deco.add(boxGeo(V(d0, seat, dz - 0.4), V(d0 + 0.18, 0.78, dz + 0.4)), persian2);
    for (const x of [d0 + 0.5, d1 - 0.35]) deco.add(new THREE.SphereGeometry(0.17, 10, 8), lam("stCushion", () => ({ color: "#d8a83a" })), at(x, seat + 0.12, dz - 0.18, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.3, 0.7, 0.8)));
    for (const x of [d0 + 0.06, d1 - 0.06]) for (const z of [dz - 0.34, dz + 0.34]) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.16, z + 0.04)), dleg);
    // roses in a vase on a pedestal under the window
    deco.add(cyl(0.18, 0.22, 0.95, 12), lam("stPed", () => ({ color: "#e8e0d0" })), at(-0.45, 0.475, z0 + 0.45));
    deco.add(cyl(0.1, 0.07, 0.3, 12), lam("stVase", () => ({ color: "#3a6a9a" })), at(-0.45, 1.1, z0 + 0.45));
    for (let i = 0; i < 6; i++) deco.add(new THREE.SphereGeometry(0.06, 8, 6), lam(i % 2 ? "stRose" : "stRose2", () => ({ color: i % 2 ? "#c83a4a" : "#f0b0c0" })), at(-0.45 + 0.12 * Math.cos(i), 1.32 + 0.06 * (i % 3), z0 + 0.45 + 0.12 * Math.sin(i)));
    // a rug under the dais
    b.add(quad(V(-2.2, 0.01, 0.2), V(1.6, 0.01, 0.2), V(1.6, 0.01, -3.3), V(-2.2, 0.01, -3.3), 1, 1), lam("stRug", () => ({ color: "#8a5a3a" })));
    // daylight through the window
    this.glow((wx0 + wx1) / 2, 2.0, z0 + 0.2, 3.0, 0.22);
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ================= the theatre =================
export const THEATRE = { x0: -4.4, x1: 4.4, z0: -7.0, z1: 6.0, h: 6.5, stage: 0.9, front: -2.4 };
export const BALCONY: V3 = [-0.6, 0.9 + 1.0, -4.9];
export const BOX = { x0: -4.4, x1: -2.7, z0: -1.6, z1: 0.2, floor: 1.7 };
const verona = () => ctex("dgVerona", 1024, 768, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 768); gr.addColorStop(0, "#1a2050"); gr.addColorStop(0.6, "#3a3a70"); gr.addColorStop(1, "#4a3a5a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 768);
  g.fillStyle = "#f4ecc8"; g.beginPath(); g.arc(800, 140, 46, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,230,0.8)"; g.fillRect(r() * 1024, r() * 300, 3, 3); }
  g.fillStyle = "#2a3a2a"; for (let i = 0; i < 7; i++) { const x = 60 + i * 150; g.beginPath(); g.moveTo(x, 640); g.lineTo(x + 30, 280 + r() * 60); g.lineTo(x + 60, 640); g.fill(); } // cypresses
  g.fillStyle = "#c8a880"; g.fillRect(0, 560, 1024, 208);
  g.strokeStyle = "#141018"; g.lineWidth = 5; g.strokeRect(2, 2, 1020, 764);
});
export class Theatre extends Room {
  private drop = new THREE.Group();
  private foot: number[] = [];
  private footGlow: THREE.Sprite[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h, stage, front } = THEATRE;
    const wall = lam("thWall", () => ({ map: paper("thPaper", "#5a1a22", "#4a141c", false) }));
    const floor = lam("thFloor", () => ({ map: planksHD(), color: "#8a6a5a" }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("thCeil", () => ({ color: "#2a1418" })), true, 2.5);
    // the stage + apron (the apron runs from the proscenium out to the footlights)
    const boards = lam("thBoards", () => ({ map: planksHD(), color: "#a88a6a" })), apron = lam("thApron", () => ({ color: "#2a1a16" }));
    b.add(boxGeo(V(x0, 0, z0), V(x1, stage, front - 0.4)), boards);
    b.add(boxGeo(V(-3.6, 0, front), V(3.6, stage, front + 0.55)), boards);
    deco.add(boxGeo(V(-3.6, 0, front + 0.55), V(3.6, stage - 0.04, front + 0.6)), apron);
    // proscenium wall with its arch opening, gilt trim standing proud of it
    const pros = lam("thPros", () => ({ color: "#6a1e24" })), gilt = gold();
    holedWall(b, x0, x1, front, h, -3.1, 3.1, stage, 4.7, pros);
    for (const [a0, a1, y0, y1] of [[-3.3, -3.1, stage, 4.9], [3.1, 3.3, stage, 4.9], [-3.3, 3.3, 4.7, 4.9]] as const) deco.add(boxGeo(V(a0, y0, front), V(a1, y1, front + 0.07)), gilt);
    deco.add(boxGeo(V(-1.0, 4.95, front), V(1.0, 5.45, front + 0.09)), gilt); // cartouche
    // red velvet side legs + valance, just behind the arch
    const velvet = lam("thVelvet", () => ({ color: "#8a1424" })), velvet2 = lam("thVelvet2", () => ({ color: "#6a0e1c" }));
    for (const s of [-1, 1]) {
      deco.add(boxGeo(V(s < 0 ? -3.1 : 2.4, stage, front - 0.55), V(s < 0 ? -2.4 : 3.1, 4.7, front - 0.45)), velvet);
      for (let i = 0; i < 4; i++) deco.add(cyl(0.05, 0.07, 4.7 - stage, 8), velvet2, at(s * (2.5 + i * 0.17), (stage + 4.7) / 2, front - 0.42));
    }
    deco.add(boxGeo(V(-3.1, 4.0, front - 0.5), V(3.1, 4.7, front - 0.42)), velvet);
    // the drop curtain (raised out of sight unless dropped)
    const db = new Batch();
    db.add(boxGeo(V(-2.4, 0, -0.05), V(2.4, 3.8 - stage, 0.05)), velvet);
    for (let i = 0; i < 12; i++) db.add(cyl(0.045, 0.06, 3.8 - stage, 8), velvet2, at(-2.25 + i * 0.41, (3.8 - stage) / 2, 0.08));
    db.build(this.drop, true); this.drop.position.set(0, stage, front - 0.7); this.root.add(this.drop);
    // painted backdrop: a Verona night garden
    const back = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.8), lam("thBack", () => ({ map: verona() })));
    back.position.set(0, stage + 2.4, z0 + 0.3); this.root.add(back);
    // Juliet's balcony: a platform on two columns, a stone balustrade, a painted wall flat behind it with an arched door
    const stone = lam("thStone", () => ({ color: "#d8ccb0" })), stone2 = lam("thStone2", () => ({ color: "#b8ac90" }));
    const [bx, by, bz] = BALCONY;
    deco.add(boxGeo(V(bx - 1.4, stage, bz - 1.3), V(bx + 1.4, by + 2.6, bz - 0.9)), stone2); // the house wall flat
    deco.add(boxGeo(V(bx - 0.45, by, bz - 0.88), V(bx + 0.45, by + 1.9, bz - 0.84)), lam("thArch", () => ({ color: "#2a1e24" })));
    deco.add(boxGeo(V(bx - 1.0, by - 0.12, bz - 0.9), V(bx + 1.0, by, bz + 0.45)), stone);
    for (const x of [bx - 0.8, bx + 0.8]) deco.add(cyl(0.1, 0.12, by - stage - 0.12, 10), stone, at(x, (stage + by - 0.12) / 2, bz + 0.25));
    deco.add(boxGeo(V(bx - 1.0, by + 0.5, bz + 0.38), V(bx + 1.0, by + 0.58, bz + 0.5)), stone);
    for (let i = 0; i < 9; i++) deco.add(cyl(0.035, 0.05, 0.5, 8), stone, at(bx - 0.88 + i * 0.22, by + 0.25, bz + 0.44));
    // footlights: tin hoods hiding a row of gas flames
    const tin = lam("thTin", () => ({ color: "#3a3a40" }));
    for (let i = 0; i < 9; i++) {
      const x = -3.0 + i * 0.75;
      deco.add(boxGeo(V(x - 0.18, stage, front + 0.38), V(x + 0.18, stage + 0.14, front + 0.48)), tin);
      this.foot.push(this.flames.length); this.flame(x, stage + 0.1, front + 0.3, 0.09, 0.14, 3);
      this.glow(x, stage + 0.25, front + 0.3, 0.9, 0.35); this.footGlow.push(this.glows[this.glows.length - 1]);
    }
    // stall rows: red plush seat backs in three rows with a centre aisle
    const plush = lam("thPlush", () => ({ color: "#7a1a2a" })), seatW = lam("thSeatW", () => ({ color: "#3a2416" }));
    for (const z of [0.4, 1.6, 2.8]) for (const s of [-1, 1]) {
      deco.add(boxGeo(V(s < 0 ? -3.9 : 0.6, 0, z), V(s < 0 ? -0.6 : 3.9, 0.45, z + 0.5)), seatW);
      deco.add(boxGeo(V(s < 0 ? -3.9 : 0.6, 0.45, z + 0.4), V(s < 0 ? -0.6 : 3.9, 1.0, z + 0.55)), plush);
    }
    // Dorian's box on the left wall: floor, a gilt-and-red parapet facing the stage side, a chair, a curtain swag
    const { x0: bx0, x1: bx1, z0: bz0, z1: bz1, floor: bf } = BOX;
    deco.add(boxGeo(V(bx0, bf - 0.15, bz0), V(bx1, bf, bz1)), lam("thBoxFloor", () => ({ color: "#3a1a1a" })));
    deco.add(boxGeo(V(bx0, bf - 0.6, bz0 - 0.05), V(bx1 + 0.05, bf - 0.15, bz1 + 0.05)), pros);
    deco.add(boxGeo(V(bx1 - 0.08, bf, bz0), V(bx1, bf + 0.7, bz1)), pros);
    deco.add(boxGeo(V(bx1 - 0.1, bf + 0.7, bz0 - 0.03), V(bx1 + 0.03, bf + 0.78, bz1 + 0.03)), gilt);
    deco.add(boxGeo(V(bx0, bf, bz1 - 0.08), V(bx1, bf + 0.7, bz1)), pros); // front rail toward the camera side
    deco.add(boxGeo(V(bx0 - 0.02, bf + 0.7, bz1 - 0.1), V(bx1, bf + 0.78, bz1 + 0.03)), gilt);
    const ch = lam("thChair", () => ({ color: "#4a2416" })), cs = lam("thChairS", () => ({ color: "#8a1a2a" }));
    const cx = -3.55, cz = -0.75;
    deco.add(boxGeo(V(cx - 0.24, bf + 0.5, cz - 0.24), V(cx + 0.24, bf + 0.58, cz + 0.24)), cs);
    deco.add(boxGeo(V(cx - 0.24, bf + 0.58, cz - 0.3), V(cx + 0.24, bf + 1.1, cz - 0.24)), ch);
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) deco.add(boxGeo(V(cx + dx - 0.025, bf, cz + dz - 0.025), V(cx + dx + 0.025, bf + 0.5, cz + dz + 0.025)), ch);
    deco.add(boxGeo(V(bx0 + 0.02, bf + 2.3, bz0), V(bx1 + 0.06, bf + 2.6, bz1)), velvet);
    for (const z of [bz0 + 0.05, bz1 - 0.15]) deco.add(boxGeo(V(bx1 - 0.12, bf + 0.8, z), V(bx1 - 0.02, bf + 2.3, z + 0.1)), velvet);
    // gas brackets on the side walls
    for (const s of [-1, 1]) { deco.add(boxGeo(V(s * 4.4 - (s > 0 ? 0.25 : 0), 3.0, 1.5), V(s * 4.4 + (s < 0 ? 0.25 : 0), 3.05, 1.56)), brassK()); this.flame(s * 4.1, 3.15, 1.53, 0.08, 0.13, 2.4); this.glow(s * 4.1, 3.2, 1.53, 1.4, 0.4); }
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** drop 0 raised .. 1 down; lights 0..1 how many footlights are still burning (they go out left to right) */
  pose(drop: number, lights = 1) {
    this.drop.visible = drop > 0.01;
    this.drop.position.y = THEATRE.stage + (1 - drop) * 3.6;
    this.foot.forEach((fi, i) => { const on = i / this.foot.length < lights - 1e-6; this.flames[fi].s.visible = on; this.footGlow[i].visible = on; });
  }
}

// ================= Dorian's library =================
export const LIBRARY = { x0: -3.4, x1: 3.4, z0: -3.6, z1: 4.2, h: 3.6 };
export const LIB_PORTRAIT: V3 = [1.75, 1.85, -3.6];
export const HEARTH: V3 = [-0.35, 0, -3.6];
export const LIB_WIN = { x: -2.35, y0: 1.0, w: 1.1, h: 1.9 };
const dawn = () => ctex("dgDawn", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#8ab0d8"); gr.addColorStop(0.6, "#f8d8b0"); gr.addColorStop(1, "#f0b888");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#6a6a7a"; for (let i = 0; i < 6; i++) { const x = i * 46; g.fillRect(x, 160 - (i % 3) * 18, 38, 120); g.fillRect(x + 10, 140 - (i % 3) * 18, 6, 22); } // London roofs + chimney pots
});
export class Library extends Room {
  portrait: Portrait;
  private screen = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = LIBRARY;
    const wall = lam("lbWall", () => ({ map: paper("lbPaper", "#2e4a3e", "#28402f") }));
    const floor = lam("lbFloor", () => ({ map: planksHD(), color: "#9a7a62" }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("lbCeil", () => ({ color: "#e6dcc6" })), false);
    const { x: wx, y0: wy0, w: ww, h: wh } = LIB_WIN;
    holedWall(b, x0, x1, z0, h, wx - ww / 2, wx + ww / 2, wy0, wy0 + wh, wall);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), new THREE.MeshBasicMaterial({ map: dawn() }));
    view.position.set(wx, wy0 + wh / 2, z0 - 1.0); view.layers.set(NOINK); this.root.add(view);
    const frame = lam("lbFrame", () => ({ color: "#efe8d8" }));
    windowUnit(deco, wx, wy0, ww, wh, z0, { frame, cols: 2, rows: 4, sill: lam("lbSill", () => ({ color: "#e2d8c4" })) });
    // a holland blind pulled half down, standing off the casing
    deco.add(boxGeo(V(wx - ww / 2 - 0.02, wy0 + wh * 0.55, z0 + 0.1), V(wx + ww / 2 + 0.02, wy0 + wh + 0.05, z0 + 0.13)), lam("lbBlind", () => ({ color: "#e8d8a8" })));
    deco.add(cyl(0.025, 0.025, ww + 0.1, 8), frame, at(wx, wy0 + wh * 0.55, z0 + 0.12, 0, 0, Math.PI / 2));
    // oak panelling below the dado
    const oak = lam("lbOak", () => ({ color: "#4a2e1c" })), oak2 = lam("lbOak2", () => ({ color: "#5a3a24" }));
    for (const [a, c] of [[x0, wx - ww / 2 - 0.2], [wx + ww / 2 + 0.2, HEARTH[0] - 0.95], [HEARTH[0] + 0.95, x1]] as const) {
      deco.add(boxGeo(V(a, 0, z0), V(c, 0.95, z0 + 0.05)), oak);
      deco.add(boxGeo(V(a, 0.95, z0), V(c, 1.0, z0 + 0.09)), oak2);
    }
    // the fireplace: marble surround, black firebox, mantel shelf, a clock + candlesticks, the fire
    const marble = lam("lbMarble", () => ({ color: "#e8e2d8" })), soot = lam("lbSoot", () => ({ color: "#140e10" })), [hx] = HEARTH;
    deco.add(boxGeo(V(hx - 0.85, 0, z0), V(hx - 0.55, 1.25, z0 + 0.3)), marble);
    deco.add(boxGeo(V(hx + 0.55, 0, z0), V(hx + 0.85, 1.25, z0 + 0.3)), marble);
    deco.add(boxGeo(V(hx - 0.55, 0.95, z0), V(hx + 0.55, 1.25, z0 + 0.3)), marble);
    deco.add(boxGeo(V(hx - 0.95, 1.25, z0), V(hx + 0.95, 1.33, z0 + 0.38)), marble);
    deco.add(boxGeo(V(hx - 0.55, 0, z0), V(hx + 0.55, 0.95, z0 + 0.1)), soot);
    deco.add(boxGeo(V(hx - 0.95, 0, z0 + 0.3), V(hx + 0.95, 0.05, z0 + 0.8)), marble); // hearthstone
    deco.add(boxGeo(V(hx - 0.13, 1.33, z0 + 0.1), V(hx + 0.13, 1.68, z0 + 0.26)), gold());
    deco.add(cyl(0.09, 0.09, 0.02, 16), marble, at(hx, 1.55, z0 + 0.27, Math.PI / 2));
    for (const s of [-1, 1]) { deco.add(cyl(0.035, 0.05, 0.26, 8), gold(), at(hx + s * 0.65, 1.46, z0 + 0.2)); }
    for (const [x, y] of [[-0.18, 0.2], [0.05, 0.16], [0.2, 0.22]] as const) this.flame(hx + x, y + 0.12, z0 + 0.2, 0.26, 0.34, 2.6);
    this.glow(hx, 0.35, z0 + 0.4, 1.8, 0.55);
    // the portrait on the wall, right of the fireplace
    this.portrait = new Portrait(1.0, 1.5, false, 0.09);
    this.portrait.root.position.set(LIB_PORTRAIT[0], LIB_PORTRAIT[1], z0 + 0.06); this.root.add(this.portrait.root);
    // the gilt Spanish-leather folding screen (ch. 7-8): three panels hinged at the right end; swung aside by pose()
    const sb = new Batch(), leather = lam("lbLeather", () => ({ map: ctex("lbLeatherT", 256, 512, (g, r) => {
      g.fillStyle = "#7a4a1e"; g.fillRect(0, 0, 256, 512);
      g.strokeStyle = "#e0b84a"; g.lineWidth = 6;
      for (let y = 40; y < 512; y += 110) { g.beginPath(); g.ellipse(128, y, 70, 44, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(128, y, 14, 0, Math.PI * 2); g.stroke(); }
      for (let i = 0; i < 80; i++) { g.fillStyle = "rgba(255,210,120,0.15)"; g.fillRect(r() * 256, r() * 512, 4, 4); }
      g.strokeStyle = "#141018"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 504);
    }) }));
    for (let i = 0; i < 3; i++) {
      const pw = 0.55, xa = -(i + 1) * pw, zz = i % 2 ? -0.12 : 0;
      sb.add(boxGeo(V(xa + 0.02, 0.05, zz - 0.03), V(xa + pw - 0.02, 2.0, zz + 0.03)), leather);
      sb.add(boxGeo(V(xa, 0, zz - 0.045), V(xa + 0.03, 2.05, zz + 0.045)), oak2); sb.add(boxGeo(V(xa + pw - 0.03, 0, zz - 0.045), V(xa + pw, 2.05, zz + 0.045)), oak2);
    }
    sb.build(this.screen, true); this.screen.position.set(2.75, 0, -2.75); this.root.add(this.screen);
    // a writing table with a green-shaded lamp (front left) and a leather armchair by the fire
    deco.add(boxGeo(V(-3.2, 0.72, -2.2), V(-2.3, 0.77, -1.4)), oak2);
    for (const [x, z] of [[-3.15, -2.15], [-2.35, -2.15], [-3.15, -1.45], [-2.35, -1.45]] as const) deco.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.72, z + 0.03)), oak);
    deco.add(cyl(0.02, 0.02, 0.4, 6), gold(), at(-2.75, 0.97, -1.95));
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.16, 14, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.4, 0.6), side: THREE.DoubleSide }));
    lampShade.position.set(-2.75, 1.2, -1.95); lampShade.layers.set(NOINK); this.root.add(lampShade);
    this.glow(-2.75, 1.1, -1.95, 1.1, 0.4);
    const leatherC = lam("lbChair", () => ({ color: "#5a2a1a" }));
    deco.add(boxGeo(V(-1.75, 0.12, -1.8), V(-1.0, 0.45, -1.05)), leatherC);
    deco.add(boxGeo(V(-1.75, 0.45, -1.8), V(-1.0, 1.05, -1.62)), leatherC);
    for (const x of [-1.75, -1.13]) deco.add(boxGeo(V(x, 0.45, -1.8), V(x + 0.13, 0.68, -1.05)), leatherC);
    // rug
    b.add(quad(V(-2.0, 0.01, 0.8), V(2.4, 0.01, 0.8), V(2.4, 0.01, -2.9), V(-2.0, 0.01, -2.9), 1, 1), lam("lbRug", () => ({ color: "#6a2a2a" })));
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** screen 0 in front of the portrait .. 1 swung aside */
  pose(screen: number) { this.screen.rotation.y = screen * 1.35; }
}

// ================= the old schoolroom =================
export const SCHOOL = { x0: -3.0, x1: 3.0, z0: -3.2, z1: 3.8, h: 3.0 };
export const SCH_PORTRAIT: V3 = [0.45, 1.62, -3.2];
export const CHEST = { x0: -2.15, x1: -1.05, z0: -2.95, z1: -2.4, top: 0.62 };
export const TABLE = { x0: 1.35, x1: 2.55, z0: -2.0, z1: -1.15, top: 0.76 };
export const LAMP: V3 = [2.2, 0.76, -1.6];
export const CHAIR: V3 = [1.95, 0, -0.6];
export const SCH_WIN = { x: -2.05, y0: 1.0, w: 1.0, h: 1.35 };
const moonView = () => ctex("dgMoonView", 256, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#101838"); gr.addColorStop(1, "#2a3060");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(170, 70, 22, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 25; i++) { g.fillStyle = "rgba(255,255,230,0.7)"; g.fillRect(r() * 256, r() * 140, 2, 2); }
  g.fillStyle = "#0c0e1c"; for (let i = 0; i < 6; i++) { const x = i * 46; g.fillRect(x, 180 - (i % 3) * 16, 40, 100); g.fillRect(x + 8, 160 - (i % 3) * 16, 6, 22); }
});
export class Schoolroom extends Room {
  portrait: Portrait;
  private sashL = new THREE.Group(); private sashR = new THREE.Group();
  private lampFlame: number; private lampGlow: THREE.Sprite; private moonGlow: THREE.Sprite;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = SCHOOL;
    const wall = lam("scWall", () => ({ map: paper("scPaper", "#7a8290", "#6e7684") }));
    const floor = lam("scFloor", () => ({ map: planksHD(), color: "#a09080" }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("scCeil", () => ({ color: "#c8c0b0" })), false);
    const { x: wx, y0: wy0, w: ww, h: wh } = SCH_WIN;
    holedWall(b, x0, x1, z0, h, wx - ww / 2, wx + ww / 2, wy0, wy0 + wh, wall);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: moonView() }));
    view.position.set(wx, wy0 + wh / 2, z0 - 1.0); view.layers.set(NOINK); this.root.add(view);
    const frame = lam("scFrame", () => ({ color: "#d8d0c0" }));
    windowUnit(deco, wx, wy0, ww, wh, z0, { frame, glass: null, cols: 1, rows: 1, sill: lam("scSill", () => ({ color: "#c8c0b0" })) });
    // two casement leaves, hinged at the jambs (they swing in when the servants climb through, ch. 20)
    const glassM = lam("scGlass", () => ({ color: "#2a3458", transparent: true, opacity: 0.35 }));
    for (const [g, s] of [[this.sashL, -1], [this.sashR, 1]] as const) {
      const lb = new Batch(), lw = ww / 2;
      lb.add(boxGeo(V(0, 0, -0.02), V(-s * lw, 0.05, 0.02)), frame); lb.add(boxGeo(V(0, wh - 0.05, -0.02), V(-s * lw, wh, 0.02)), frame);
      lb.add(boxGeo(V(-s * 0.05, 0, -0.02), V(0, wh, 0.02)), frame); lb.add(boxGeo(V(-s * lw, 0, -0.02), V(-s * (lw - 0.05), wh, 0.02)), frame);
      lb.add(boxGeo(V(-s * 0.05, wh / 2 - 0.02, -0.015), V(-s * (lw - 0.05), wh / 2 + 0.02, 0.015)), frame);
      lb.add(boxGeo(V(-s * 0.05, 0.05, -0.005), V(-s * (lw - 0.05), wh - 0.05, 0.005)), glassM);
      lb.build(g, false); g.position.set(wx + s * (ww / 2), wy0, z0 + 0.03); this.root.add(g);
    }
    // skirting + a dusty picture rail
    const skirt = lam("scSkirt", () => ({ color: "#4a3a30" }));
    deco.add(boxGeo(V(x0, 0, z0), V(wx - ww / 2 - 0.12, 0.14, z0 + 0.04)), skirt);
    deco.add(boxGeo(V(wx + ww / 2 + 0.12, 0, z0), V(x1, 0.14, z0 + 0.04)), skirt);
    deco.add(boxGeo(V(x0, 2.62, z0), V(x1, 2.67, z0 + 0.05)), skirt);
    // the portrait under its purple satin
    this.portrait = new Portrait(1.1, 1.62, true, 0.1);
    this.portrait.root.position.set(SCH_PORTRAIT[0], SCH_PORTRAIT[1], z0 + 0.06); this.root.add(this.portrait.root);
    // the painted chest (cassone) on the left: red with gilt panels; the knife lies on top (a glint, never drawn)
    const red = lam("scChest", () => ({ map: ctex("scChestT", 256, 128, (g) => {
      g.fillStyle = "#7a2a22"; g.fillRect(0, 0, 256, 128);
      g.strokeStyle = "#d8b04a"; g.lineWidth = 5; for (const x of [16, 136]) { g.strokeRect(x, 20, 104, 88); g.beginPath(); g.arc(x + 52, 64, 22, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i < 30; i++) g.fillRect((i * 37) % 256, (i * 53) % 128, 14, 6);
    }) }));
    const { x0: c0, x1: c1, z0: cz0, z1: cz1, top: ct } = CHEST;
    deco.add(boxGeo(V(c0, 0.06, cz0), V(c1, ct, cz1)), red);
    deco.add(boxGeo(V(c0 - 0.03, ct, cz0 - 0.03), V(c1 + 0.03, ct + 0.05, cz1 + 0.03)), lam("scChestLid", () => ({ color: "#5a1e18" })));
    for (const x of [c0 + 0.05, c1 - 0.05]) deco.add(boxGeo(V(x - 0.04, 0, cz1 - 0.08), V(x + 0.04, 0.06, cz1)), gold());
    // the table with the oil lamp, and the rickety chair in front of it (Basil sits in it, ch. 13)
    const pine = lam("scPine", () => ({ map: beam(), color: "#b8a080" }));
    const { x0: t0, x1: t1, z0: tz0, z1: tz1, top: tt } = TABLE;
    deco.add(boxGeo(V(t0, tt - 0.05, tz0), V(t1, tt, tz1)), pine);
    for (const [x, z] of [[t0 + 0.06, tz0 + 0.06], [t1 - 0.06, tz0 + 0.06], [t0 + 0.06, tz1 - 0.06], [t1 - 0.06, tz1 - 0.06]] as const) deco.add(boxGeo(V(x - 0.035, 0, z - 0.035), V(x + 0.035, tt - 0.05, z + 0.035)), pine);
    const [lx, ly, lz] = LAMP;
    deco.add(cyl(0.08, 0.1, 0.04, 14), brassK(), at(lx, ly + 0.02, lz)); deco.add(cyl(0.06, 0.04, 0.16, 14), brassK(), at(lx, ly + 0.12, lz));
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: "#fff8e8", transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    chimney.position.set(lx, ly + 0.3, lz); chimney.layers.set(NOINK); this.root.add(chimney);
    this.lampFlame = this.flames.length; this.flame(lx, ly + 0.29, lz, 0.05, 0.1, 3);
    this.glow(lx, ly + 0.3, lz, 1.4, 0.5); this.lampGlow = this.glows[this.glows.length - 1];
    const [chx, , chz] = CHAIR, cw = lam("scChair", () => ({ color: "#5a4030" }));
    deco.add(boxGeo(V(chx - 0.23, 0.46, chz - 0.23), V(chx + 0.23, 0.51, chz + 0.21)), cw);
    for (const [dx, dz, lean] of [[-0.19, -0.19, 0.02], [0.19, -0.19, -0.03], [-0.19, 0.17, 0], [0.19, 0.17, 0.04]] as const) deco.add(boxGeo(V(-0.022, 0, -0.022), V(0.022, 0.46, 0.022)), cw, at(chx + dx, 0, chz + dz, lean, 0, lean));
    for (const x of [chx - 0.2, chx + 0.2]) deco.add(boxGeo(V(x - 0.02, 0.51, chz - 0.25), V(x + 0.02, 1.02, chz - 0.21)), cw);
    deco.add(boxGeo(V(chx - 0.22, 0.86, chz - 0.25), V(chx + 0.22, 0.93, chz - 0.21)), cw, at(0, 0, 0, 0, 0, 0.0));
    // a dusty bookcase against the right wall, an old globe and a rocking horse in the corner (it was his nursery)
    const shelf = lam("scShelf", () => ({ color: "#5a4636" }));
    deco.add(boxGeo(V(x1 - 0.38, 0, -3.0), V(x1, 2.0, -2.05)), shelf);
    const books = ["#6a3a3a", "#3a4a6a", "#5a5a3a", "#7a6a4a", "#3a5a4a"];
    for (const y of [0.25, 0.75, 1.25, 1.65]) for (let i = 0; i < 6; i++) deco.add(boxGeo(V(x1 - 0.42, y, -2.95 + i * 0.15), V(x1 - 0.12, y + 0.3 - (i % 3) * 0.04, -2.83 + i * 0.15)), lam(`scBook${i % 5}`, () => ({ color: books[i % 5] })));
    deco.add(new THREE.SphereGeometry(0.2, 14, 10), lam("scGlobe", () => ({ color: "#6a8aa8" })), at(x1 - 0.2, 2.25, -2.5));
    const horse = lam("scHorse", () => ({ color: "#c8a878" }));
    deco.add(new THREE.TorusGeometry(0.45, 0.03, 6, 18, Math.PI * 0.7), horse, at(-2.45, 0.45, -1.2, 0, Math.PI / 2, Math.PI * 1.15));
    deco.add(boxGeo(V(-2.55, 0.42, -1.5), V(-2.35, 0.62, -0.9)), horse); deco.add(boxGeo(V(-2.55, 0.62, -1.55), V(-2.35, 0.95, -1.4)), horse);
    // the door on the left wall (locked; the key turns in it), panelled, facing +x
    const dg = new THREE.Group(), db = new Batch();
    doorUnit(db, 0, 0, 0.95, 2.1, 0, { frame, leaf: lam("scDoor", () => ({ map: doorTex("scDoorT", "#6a5a4a", "#4a3e32") })), knob: brassK() });
    db.build(dg, true); dg.position.set(x0 + 0.01, 0, 0.6); dg.rotation.y = Math.PI / 2; this.root.add(dg);
    // moonbeam through the window
    this.glow(wx, wy0 + wh / 2, z0 + 0.15, 2.0, 0.3); this.moonGlow = this.glows[this.glows.length - 1];
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** lamp 0 out .. 1 lit; open 0 casements shut .. 1 swung in */
  pose(lamp: number, open = 0) {
    this.flames[this.lampFlame].s.visible = lamp > 0.05;
    this.lampGlow.material.opacity = 0.5 * lamp;
    this.sashL.rotation.y = -open * 1.3; this.sashR.rotation.y = open * 1.3; // both swing in toward +z
    this.moonGlow.material.opacity = 0.3;
  }
}
