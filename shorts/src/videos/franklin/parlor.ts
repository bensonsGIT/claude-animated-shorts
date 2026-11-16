// Franklin's Philadelphia parlour, winter 1750: sage plaster over green-grey panelled wainscot, a white Georgian
// mantel with a log fire on the back wall, 12-pane sash windows on the left wall (night or morning glass), a
// bookcase on the right. The props are the story: the electrical table (two giant Leyden jars with foil coats,
// brass rods and knobs, the "united top wires" ending in a hook = the live wire, an iron chain), a shelf for forty
// common phials (they pop in on "forty"), three more jars for the second attempt, a dinner dressing (roast turkey),
// a writing desk with a candle and a wing chair by the window.
// Floor y = 0, x across (-6..6), z into the room (back wall z = -8, camera side z = +6), ceiling 3.6 m.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, planksHD, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";

export const PARLOR = { x0: -6, x1: 6, z0: -8, z1: 6, h: 3.6 };
export const ETABLE = { x0: -0.6, x1: 1.45, z: -3.6, d: 0.8, top: 0.78 };
const T0 = ETABLE.top;
export const JARS: [number, number][] = [[0.28, -3.62], [0.72, -3.62]];
const JAR_R = 0.15, JAR_H = 0.42, KNOB_Y = T0 + JAR_H + 0.14;
export const KNOBS: [number, number, number][] = JARS.map(([x, z]) => [x, KNOB_Y, z]);
/** the free end of the top wire: Franklin touches it */
export const WIRE_END: [number, number, number] = [1.3, 1.12, -3.6];
export const EXTRA_JARS: [number, number][] = [[-0.05, -3.92], [0.5, -3.98], [1.0, -3.92]];
/** the turkey's wire in the second attempt (from the first jar's knob to just over the bird) */
export const TURKEY_WIRE_END: [number, number, number] = [-0.2, 1.38, -3.55];
export const DESK = { x: 4.0, z: -5.2, top: 0.76, seatZ: -5.75, seatTop: 0.47 };
export const WING = { x: -4.35, z: -2.2, seatTop: 0.47 };
export const SHELF = { x0: -4.7, x1: -2.3, z: -7.72, ys: [0.95, 1.35, 1.75, 2.15] };

const nightGlass = () => ctex("parlorNight", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#1a2448"); gr.addColorStop(1, "#33416e");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#e8edf6"; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 97) % 256, (i * 151) % 512, 2.5, 0, Math.PI * 2); g.fill(); } // snow
  g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(180, 110, 26, 0, Math.PI * 2); g.fill();
  muntins(g);
});
const morningGlass = () => ctex("parlorMorning", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#fff6e0"); gr.addColorStop(0.6, "#ffe2b4"); gr.addColorStop(1, "#f3e9d6");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(90, 300, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#dfe6ee"; g.fillRect(0, 430, 256, 82); // snowy roofs
  muntins(g);
});
function muntins(g: CanvasRenderingContext2D) {
  g.strokeStyle = "#f2efe6"; g.lineWidth = 10;
  for (const x of [85, 171]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (const y of [128, 256, 384]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.lineWidth = 18; g.strokeRect(9, 9, 238, 494);
}
const landscape = () => ctex("parlorPainting", 512, 384, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#9cb8d4"); gr.addColorStop(1, "#f0d8a8");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#6a8a4a"; g.beginPath(); g.moveTo(0, 260); g.quadraticCurveTo(160, 180, 300, 250); g.quadraticCurveTo(420, 300, 512, 230); g.lineTo(512, 384); g.lineTo(0, 384); g.fill();
  g.fillStyle = "#4a6a3a"; g.beginPath(); g.moveTo(0, 320); g.quadraticCurveTo(260, 260, 512, 330); g.lineTo(512, 384); g.lineTo(0, 384); g.fill();
  g.fillStyle = "#3a5a8a"; g.fillRect(200, 300, 140, 12); // a river
});
const books = () => ctex("parlorBooks", 512, 256, (g, r) => {
  g.fillStyle = "#2a1a14"; g.fillRect(0, 0, 512, 256);
  let x = 4;
  while (x < 508) {
    const w = 14 + r() * 16, h = 180 + r() * 66, c = ["#7a2a2a", "#2a4a6a", "#5a3a22", "#2f5a3a", "#8a6a3a", "#4a2a4a"][Math.floor(r() * 6)];
    g.fillStyle = c; g.fillRect(x, 256 - h, w - 2, h);
    g.fillStyle = "#d9b04a"; g.fillRect(x + 2, 256 - h + 20, w - 6, 5);
    x += w;
  }
});

/** the parlour dressing for one frame (story.ts dressAt) */
export type Dress = { elec: boolean; extra: boolean; dinner: boolean; phials: number; charge: number; morning: boolean };

export class Parlor extends Room {
  private elec = new THREE.Group();
  private extra = new THREE.Group();
  private dinner = new THREE.Group();
  private phials: THREE.Group[] = [];
  private glows: THREE.Sprite[] = [];
  private glass: THREE.MeshBasicMaterial;
  private night = nightGlass(); private morn = morningGlass();

  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch(), el = new Batch(), ex = new Batch(), din = new Batch();
    const { x0, x1, z0, z1, h } = PARLOR;
    const floor = lam("parlorFloor", () => ({ map: planksHD() }));
    const plaster = lam("parlorPlaster", () => ({ color: "#b7c4a8" }));
    const panel = lam("parlorPanel", () => ({ color: "#6f8576" }));
    const trim = lam("parlorTrim", () => ({ color: "#efe9dc" }));
    const ceil = lam("parlorCeil", () => ({ color: "#ece4d2" }));
    const soot = lam("hallSoot", () => ({ color: "#2a1a18" }));
    const wood = lam("wood", () => ({ map: beam() }));
    const mahog = lam("parlorMahogany", () => ({ color: "#6a3424" }));
    const red = lam("parlorRed", () => ({ color: "#8a2a2c" }));
    const wax = lam("hallWax", () => ({ color: "#f5ecd6" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const foil = twoTone(new THREE.MeshPhongMaterial({ color: "#c8ccd4", specular: "#ffffff", shininess: 80 }), 0.2);
    const glassM = twoTone(new THREE.MeshPhongMaterial({ color: "#bfe2e6", specular: "#ffffff", shininess: 100 }), 0.3);
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#4a4d56", specular: "#9a9a9a", shininess: 40 }), 0.15);
    const pewter = twoTone(new THREE.MeshPhongMaterial({ color: "#c2c4cc", specular: "#ffffff", shininess: 60 }), 0.2);
    const roast = twoTone(new THREE.MeshPhongMaterial({ color: "#b8642a", specular: "#ffd8a0", shininess: 40 }), 0.2);
    const paper = lam("parlorPaper", () => ({ color: "#f3ead2" }));
    const ink = lam("parlorInk", () => ({ color: "#1e1a22" }));
    const gilt = twoTone(new THREE.MeshPhongMaterial({ color: "#d9b04c", specular: "#fff2c4", shininess: 80 }), 0.2);

    // ---- shell ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 3, (z1 - z0) / 3), floor);
    for (const [a, b] of [[V(x0 - 0.4, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.4, h, z1)], [V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0)],
      [V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4)]] as const) {
      shell.add(boxGeo(a, V(b.x, 0.95, b.z)), panel);
      shell.add(boxGeo(V(a.x, 0.95, a.z), b), plaster);
    }
    shell.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.3, z1 + 0.4), 0, true), ceil);
    // chair rail, skirting, cornice (white trim) round the walls
    for (const [y0, y1, d] of [[0.95, 1.03, 0.05], [0, 0.16, 0.03], [h - 0.18, h, 0.1]] as const) {
      fix.add(boxGeo(V(x0, y0, z0), V(x0 + d, y1, z1)), trim); fix.add(boxGeo(V(x1 - d, y0, z0), V(x1, y1, z1)), trim);
      fix.add(boxGeo(V(x0, y0, z0), V(x1, y1, z0 + d)), trim);
    }
    // ---- fireplace (back wall, centred) + painting over it ----
    fix.add(boxGeo(V(-1.15, 0, z0), V(1.15, 1.35, z0 + 0.32)), trim);
    fix.add(boxGeo(V(-1.3, 1.35, z0), V(1.3, 1.45, z0 + 0.4)), trim);
    fix.add(boxGeo(V(-0.7, 0.05, z0 + 0.3), V(0.7, 0.95, z0 + 0.33)), soot);
    fix.add(boxGeo(V(-1.2, 0, z0 + 0.32), V(1.2, 0.04, z0 + 0.8)), lam("parlorHearth", () => ({ color: "#8a4a3a" })));
    for (const [x, r] of [[-0.25, 0.08], [0.22, 0.09], [0, 0.07]] as const) fix.add(cyl(r, r, 0.8), wood, at(x, 0.14 + (x === 0 ? 0.12 : 0), z0 + 0.5, 0, 0.3 * x, Math.PI / 2));
    this.flame(-0.25, 0.42, z0 + 0.5, 0.45, 0.8, 3.0); this.flame(0.15, 0.46, z0 + 0.48, 0.55, 0.95, 3.2); this.flame(0.4, 0.4, z0 + 0.52, 0.4, 0.7, 2.8);
    this.glow(0, 0.6, z0 + 0.9, 3.0, 0.5);
    fix.add(boxGeo(V(-0.8, 1.75, z0), V(0.8, 2.85, z0 + 0.06)), gilt);
    const pm = new THREE.Mesh(quad(V(-0.7, 1.84, z0 + 0.065), V(0.7, 1.84, z0 + 0.065), V(0.7, 2.76, z0 + 0.065), V(-0.7, 2.76, z0 + 0.065)), twoTone(new THREE.MeshLambertMaterial({ map: landscape() })));
    this.root.add(pm);
    // candlesticks on the mantel
    for (const x of [-1.0, 1.0]) {
      deco.add(cyl(0.05, 0.06, 0.04), brass, at(x, 1.47, z0 + 0.2)); deco.add(cyl(0.018, 0.02, 0.2), brass, at(x, 1.57, z0 + 0.2));
      deco.add(cyl(0.025, 0.025, 0.14), wax, at(x, 1.74, z0 + 0.2)); this.flame(x, 1.86, z0 + 0.2, 0.07, 0.14, 2.6);
    }
    // ---- sash windows on the left wall, red curtains ----
    this.glass = new THREE.MeshBasicMaterial({ map: this.night });
    for (const z of [-4.4, -0.2, 3.6]) {
      const w = 1.1, y0 = 0.95, y1 = 2.85, x = x0 + 0.02;
      const m = new THREE.Mesh(quad(V(x, y0, z + w / 2), V(x, y0, z - w / 2), V(x, y1, z - w / 2), V(x, y1, z + w / 2)), this.glass);
      m.layers.set(NOINK); this.root.add(m);
      fix.add(boxGeo(V(x0, y0 - 0.1, z - w / 2 - 0.1), V(x0 + 0.14, y0, z + w / 2 + 0.1)), trim);
      fix.add(boxGeo(V(x0, y1, z - w / 2 - 0.1), V(x0 + 0.1, y1 + 0.1, z + w / 2 + 0.1)), trim);
      for (const s of [-1, 1]) {
        fix.add(boxGeo(V(x0, y0, z + s * w / 2 - (s > 0 ? 0 : 0.08)), V(x0 + 0.1, y1, z + s * w / 2 + (s > 0 ? 0.08 : 0))), trim);
        deco.add(boxGeo(V(x0 + 0.05, 0.05, z + s * (w / 2 + 0.12) - 0.16), V(x0 + 0.2, 3.1, z + s * (w / 2 + 0.12) + 0.16)), red);
      }
      fix.add(boxGeo(V(x0 + 0.02, 3.1, z - w / 2 - 0.35), V(x0 + 0.24, 3.22, z + w / 2 + 0.35)), gilt);
    }
    // sconces with candles on the right wall + a bookcase
    for (const z of [-6.5, -1.5, 2.5]) {
      fix.add(boxGeo(V(x1 - 0.06, 1.75, z - 0.08), V(x1, 2.0, z + 0.08)), brass);
      fix.add(cyl(0.025, 0.025, 0.14), wax, at(x1 - 0.15, 2.05, z)); this.flame(x1 - 0.15, 2.17, z, 0.07, 0.14, 2.6);
    }
    deco.add(boxGeo(V(x1 - 0.45, 0, -5.4), V(x1, 2.4, -3.0)), mahog);
    const bk = new THREE.Mesh(quad(V(x1 - 0.46, 0.15, -3.1), V(x1 - 0.46, 0.15, -5.3), V(x1 - 0.46, 2.3, -5.3), V(x1 - 0.46, 2.3, -3.1)), twoTone(new THREE.MeshLambertMaterial({ map: books() })));
    this.root.add(bk);
    // ---- the phial shelf on the back wall (left of the fire): four boards, forty phials ----
    const { x0: sx0, x1: sx1, z: sz, ys } = SHELF;
    for (const y of ys) deco.add(boxGeo(V(sx0, y - 0.03, sz - 0.2), V(sx1, y, sz + 0.16)), mahog);
    for (const sx of [sx0, sx1]) deco.add(boxGeo(V(sx - 0.03, 0, sz - 0.2), V(sx + 0.03, 2.4, sz + 0.16)), mahog);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 10; i++) {
      const b = new Batch(), g = new THREE.Group(), x = sx0 + 0.15 + i * 0.235, y = ys[row], z = sz;
      b.add(cyl(0.045, 0.045, 0.17, 12), glassM, at(x, y + 0.085, z));
      b.add(cyl(0.048, 0.048, 0.08, 12), foil, at(x, y + 0.04, z));
      b.add(cyl(0.006, 0.006, 0.1), brass, at(x, y + 0.2, z));
      b.add(new THREE.SphereGeometry(0.014, 8, 6), brass, at(x, y + 0.25, z));
      b.build(g, false); g.visible = false; this.root.add(g); this.phials.push(g);
    }

    // ---- the electrical table ----
    const { x0: tx0, x1: tx1, z: tz, d } = ETABLE;
    deco.add(boxGeo(V(tx0, T0 - 0.05, tz - d / 2), V(tx1, T0, tz + d / 2), 0), mahog);
    for (const [lx, lz] of [[tx0 + 0.08, tz - d / 2 + 0.08], [tx1 - 0.08, tz - d / 2 + 0.08], [tx0 + 0.08, tz + d / 2 - 0.08], [tx1 - 0.08, tz + d / 2 - 0.08]])
      deco.add(cyl(0.035, 0.025, T0 - 0.05), mahog, at(lx, (T0 - 0.05) / 2, lz));
    const jar = (b: Batch, x: number, z: number, r: number, hgt: number) => {
      b.add(cyl(r, r, hgt, 24), glassM, at(x, T0 + hgt / 2, z));
      b.add(cyl(r + 0.006, r + 0.006, hgt * 0.62, 24), foil, at(x, T0 + hgt * 0.31, z));
      b.add(cyl(r * 0.92, r * 0.92, 0.03, 24), wood, at(x, T0 + hgt + 0.015, z));
      b.add(cyl(0.008, 0.008, 0.16), brass, at(x, T0 + hgt + 0.08, z));
      b.add(new THREE.SphereGeometry(0.035, 12, 10), brass, at(x, T0 + hgt + 0.14, z));
    };
    for (const [x, z] of JARS) jar(el, x, z, JAR_R, JAR_H);
    const wire = (b: Batch, pts: THREE.Vector3[], r = 0.006, m: THREE.Material = brass) => {
      const c = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1);
      b.add(new THREE.TubeGeometry(c, 40, r, 6, false), m);
    };
    const [ka, kb] = KNOBS;
    wire(el, [V(...ka), V((ka[0] + kb[0]) / 2, KNOB_Y + 0.03, ka[2]), V(...kb)]);
    wire(el, [V(...kb), V(1.0, KNOB_Y + 0.02, kb[2]), V(WIRE_END[0], KNOB_Y - 0.04, WIRE_END[2]), V(...WIRE_END)]);
    el.add(new THREE.SphereGeometry(0.022, 10, 8), brass, at(...WIRE_END));
    // iron chain: from the jars' foil coats along the table, over the edge and down to the floor toward Franklin
    const chainPts = [V(0.28, T0 + 0.01, -3.42), V(0.72, T0 + 0.01, -3.4), V(1.38, T0 + 0.01, -3.32), V(1.47, T0 - 0.2, -3.3), V(1.5, 0.02, -3.25), V(1.62, 0.015, -3.3)];
    const cc = new THREE.CatmullRomCurve3(chainPts, false, "catmullrom", 0.2), L = cc.getLength();
    for (let k = 0, n = Math.floor(L / 0.028); k < n; k++) {
      const pnt = cc.getPointAt(k / n), tan = cc.getTangentAt(k / n);
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), tan).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (k % 2) * Math.PI / 2));
      el.add(new THREE.TorusGeometry(0.012, 0.004, 5, 10), iron, new THREE.Matrix4().compose(pnt, q, V(1, 1.6, 1)));
    }
    // three more jars for the second attempt + the wire to the turkey
    for (const [x, z] of EXTRA_JARS) jar(ex, x, z, 0.12, 0.36);
    wire(ex, [V(EXTRA_JARS[0][0], T0 + 0.5, EXTRA_JARS[0][1]), V(0.5, T0 + 0.56, -3.9), V(EXTRA_JARS[2][0], T0 + 0.5, EXTRA_JARS[2][1])]);
    wire(ex, [V(...ka), V(0.05, KNOB_Y + 0.06, -3.58), V(TURKEY_WIRE_END[0], TURKEY_WIRE_END[1] + 0.12, TURKEY_WIRE_END[2]), V(...TURKEY_WIRE_END)]);
    ex.add(new THREE.SphereGeometry(0.02, 10, 8), brass, at(...TURKEY_WIRE_END));
    // charge glows inside the jars (blue-white, additive) and on the knobs
    for (const [x, z] of JARS) {
      for (const [y, s] of [[T0 + 0.24, 0.5], [KNOB_Y, 0.22]] as const) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ color: new THREE.Color(0.6, 0.9, 1.6), transparent: true, opacity: 0, depthWrite: false,
          blending: THREE.AdditiveBlending, fog: false, map: this.glowTexBlue() }));
        sp.position.set(x, y, z + 0.02); sp.scale.set(s, s, 1); sp.layers.set(NOINK); sp.renderOrder = 5;
        this.elec.add(sp); this.glows.push(sp);
      }
    }
    // ---- dinner: platter + roast turkey, plates, candles ----
    din.add(cyl(0.32, 0.28, 0.025, 24), pewter, at(0.55, T0 + 0.012, -3.6));
    din.add(new THREE.SphereGeometry(0.2, 18, 14), roast, at(0.55, T0 + 0.12, -3.6).scale(V(1.15, 0.65, 0.95)));
    for (const s of [-1, 1]) {
      din.add(cyl(0.035, 0.045, 0.18), roast, at(0.55 + s * 0.12, T0 + 0.16, -3.42, -0.9, 0, s * 0.5));
      din.add(new THREE.SphereGeometry(0.022, 8, 6), paper, at(0.55 + s * 0.17, T0 + 0.24, -3.32));
    }
    for (const x of [-0.35, 1.2]) for (const z of [-3.85, -3.35]) din.add(cyl(0.13, 0.11, 0.015, 18), pewter, at(x, T0 + 0.008, z));
    for (const x of [-0.05, 1.05]) {
      din.add(cyl(0.05, 0.06, 0.04), brass, at(x, T0 + 0.02, -3.75)); din.add(cyl(0.018, 0.02, 0.18), brass, at(x, T0 + 0.11, -3.75));
      din.add(cyl(0.025, 0.025, 0.14), wax, at(x, T0 + 0.27, -3.75));
    }
    // ---- writing desk with a candle, inkwell and paper; Franklin's chair behind it ----
    const { x: dx, z: dz, top: dt } = DESK;
    deco.add(boxGeo(V(dx - 0.65, dt - 0.05, dz - 0.33), V(dx + 0.65, dt, dz + 0.33)), mahog);
    deco.add(boxGeo(V(dx - 0.62, 0.12, dz + 0.28), V(dx + 0.62, dt - 0.05, dz + 0.32)), mahog); // modesty panel toward the lens
    for (const sx of [-1, 1]) deco.add(boxGeo(V(dx + sx * 0.6 - 0.04, 0, dz - 0.3), V(dx + sx * 0.6 + 0.04, dt - 0.05, dz + 0.3)), mahog);
    deco.add(boxGeo(V(dx - 0.25, dt, dz - 0.25), V(dx + 0.05, dt + 0.03, dz + 0.0)), paper);
    deco.add(cyl(0.035, 0.04, 0.05), ink, at(dx + 0.3, dt + 0.025, dz - 0.05));
    deco.add(cyl(0.05, 0.06, 0.03), brass, at(dx - 0.45, dt + 0.015, dz - 0.1)); deco.add(cyl(0.025, 0.025, 0.16), wax, at(dx - 0.45, dt + 0.11, dz - 0.1));
    this.flame(dx - 0.45, dt + 0.24, dz - 0.1, 0.07, 0.14, 2.6);
    this.glow(dx - 0.45, dt + 0.25, dz - 0.05, 0.8, 0.35);
    deco.add(boxGeo(V(dx - 0.3, 0.4, DESK.seatZ - 0.25), V(dx + 0.3, 0.47, DESK.seatZ + 0.2)), wood);
    deco.add(boxGeo(V(dx - 0.28, 0.47, DESK.seatZ - 0.3), V(dx + 0.28, 1.25, DESK.seatZ - 0.24)), wood);
    // ---- wing chair by the window ----
    const { x: wx, z: wz } = WING;
    deco.add(boxGeo(V(wx - 0.32, 0.12, wz - 0.34), V(wx + 0.3, 0.47, wz + 0.34)), red);
    deco.add(boxGeo(V(wx - 0.42, 0.12, wz - 0.4), V(wx - 0.3, 1.35, wz + 0.4)), red);
    for (const s of [-1, 1]) deco.add(boxGeo(V(wx - 0.4, 0.47, wz + s * 0.36 - 0.06), V(wx + 0.05, 1.15, wz + s * 0.36 + 0.06)), red);
    for (const s of [-1, 1]) deco.add(boxGeo(V(wx - 0.2, 0.47, wz + s * 0.36 - 0.06), V(wx + 0.3, 0.66, wz + s * 0.36 + 0.06)), red);
    // side table with a candle by the chair
    deco.add(cyl(0.25, 0.25, 0.04, 20), mahog, at(wx + 0.1, 0.62, wz + 0.8)); deco.add(cyl(0.04, 0.06, 0.6), mahog, at(wx + 0.1, 0.3, wz + 0.8));

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
    el.build(this.elec, true); ex.build(this.extra, true); din.build(this.dinner, true);
    this.root.add(this.elec, this.extra, this.dinner);
  }

  private blueTex: THREE.Texture | null = null;
  private glowTexBlue() {
    if (!this.blueTex) this.blueTex = ctex("zapGlow", 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(170,230,255,0.6)"); gr.addColorStop(1, "rgba(120,200,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
    return this.blueTex;
  }

  dress(d: Dress) {
    this.elec.visible = d.elec; this.extra.visible = d.extra; this.dinner.visible = d.dinner;
    this.phials.forEach((g, i) => (g.visible = i < d.phials));
    this.glows.forEach((s, i) => ((s.material as THREE.SpriteMaterial).opacity = d.charge * (i % 2 ? 0.9 : 0.55)));
    this.glass.map = d.morning ? this.morn : this.night;
  }
}
