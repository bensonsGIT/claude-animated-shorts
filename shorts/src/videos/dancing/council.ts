// The Strasbourg council chamber, 1518: oak-panelled lower walls, whitewashed plaster above with painted beams, two tall
// leaded windows on the back wall (bright day), a long oak table with a green cloth (TABLE), high-backed chairs, a
// heraldic banner (red and white bands, no lettering). Floor y = 0, open toward +z.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const ROOM = { x0: -4, x1: 4, z0: -3.5, z1: 3, h: 3.6 };
export const TABLE: V3 = [0, 0.78, -1.6];

const panel = () => ctex("dcPanel", 256, 256, (g) => {
  g.fillStyle = "#6a4428"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#3e2818"; g.lineWidth = 8;
  for (const x of [0, 128]) for (const y of [0, 128]) { g.strokeRect(x + 12, y + 12, 104, 104); g.fillStyle = "#76502e"; g.fillRect(x + 18, y + 18, 92, 92); }
});
const leaded = () => ctex("dcLeaded", 128, 256, (g) => {
  g.fillStyle = "#e8f0f4"; g.fillRect(0, 0, 128, 256);
  g.strokeStyle = "rgba(60,60,70,0.7)"; g.lineWidth = 3;
  for (let i = -256; i < 256; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); }
});

export class Council extends Room {
  constructor() {
    super();
    const s = new Batch(), deco = new Batch(), fix = new Batch();
    const { x0, x1, z0, z1, h } = ROOM;
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: planksHD() }));
    const pan = lam("dcPanelM", () => ({ map: panel() })), plaster = lam("dcPlaster", () => ({ color: "#efe6d4" })), beam = lam("dcBeam", () => ({ color: "#4a3020" }));
    const oak = lam("dcOakT", () => ({ color: "#5a3a22" })), cloth = lam("dcCloth", () => ({ color: "#2f5a3a" }));
    s.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), 3, 3), floor);
    for (const [a, b] of [[V(x0 - 0.3, 0, z0), V(x0, h, z1)], [V(x1, 0, z0), V(x1 + 0.3, h, z1)], [V(x0 - 0.3, 0, z0 - 0.3), V(x1 + 0.3, h, z0)]] as const) {
      s.add(boxGeo(a, V(b.x, 1.5, b.z), 1.2), pan);
      s.add(boxGeo(V(a.x, 1.5, a.z), b, 2), plaster);
    }
    s.add(boxGeo(V(x0 - 0.3, h, z0 - 0.3), V(x1 + 0.3, h + 0.2, z1 + 0.3), 0, true), plaster);
    for (let x = x0 + 0.8; x < x1; x += 1.6) fix.add(boxGeo(V(x - 0.12, h - 0.25, z0), V(x + 0.12, h, z1)), beam);
    // two tall leaded windows (bright)
    for (const cx of [-1.9, 1.9]) {
      const m = new THREE.Mesh(quad(V(cx - 0.65, 1.3, z0 + 0.02), V(cx + 0.65, 1.3, z0 + 0.02), V(cx + 0.65, 3.2, z0 + 0.02), V(cx - 0.65, 3.2, z0 + 0.02)),
        new THREE.MeshBasicMaterial({ map: leaded(), color: new THREE.Color(1.7, 1.7, 1.6) }));
      m.layers.set(NOINK); this.root.add(m);
      fix.add(boxGeo(V(cx - 0.75, 1.2, z0), V(cx + 0.75, 1.3, z0 + 0.2)), oak);
    }
    // a banner between the windows: red and white bands
    for (let k = 0; k < 4; k++) fix.add(boxGeo(V(-0.45, 1.6 + k * 0.4, z0 + 0.02), V(0.45, 2.0 + k * 0.4, z0 + 0.05)), lam(k % 2 ? "dcBanW" : "dcBanR", () => ({ color: k % 2 ? "#f2ece0" : "#c8303a" })));
    // the long table, a cloth, a candlestick and papers; high-backed chairs behind it
    const [tx, ty, tz] = TABLE;
    deco.add(boxGeo(V(tx - 2.2, ty - 0.06, tz - 0.55), V(tx + 2.2, ty, tz + 0.55)), oak);
    deco.add(boxGeo(V(tx - 2.1, ty, tz - 0.5), V(tx + 2.1, ty + 0.01, tz + 0.5)), cloth);
    for (const [a, c] of [[-2.0, -0.45], [2.0, -0.45], [-2.0, 0.45], [2.0, 0.45]]) deco.add(boxGeo(V(tx + a - 0.06, 0, tz + c - 0.06), V(tx + a + 0.06, ty - 0.06, tz + c + 0.06)), oak);
    deco.add(cyl(0.05, 0.08, 0.3, 8), lam("dcBrass", () => ({ color: "#c9a24a" })), at(tx + 1.2, ty + 0.15, tz));
    for (let k = 0; k < 3; k++) deco.add(boxGeo(V(tx - 1.2 + k * 0.5, ty + 0.01, tz - 0.2), V(tx - 0.85 + k * 0.5, ty + 0.02, tz + 0.15)), lam("dcPaper", () => ({ color: "#f2e6c8" })));
    for (const x of [-1.4, 0, 1.4]) { deco.add(boxGeo(V(x - 0.3, 0.45, tz - 1.05), V(x + 0.3, 0.5, tz - 0.7)), oak); deco.add(boxGeo(V(x - 0.3, 0.5, tz - 1.1), V(x + 0.3, 1.9, tz - 1.0)), oak); }
    s.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
  }
}
