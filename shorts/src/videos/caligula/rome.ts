// Rome, far from the beach (x >= 200), three interiors side by side, floor y = 0:
// - the SENATE house (CURIA, x 194..206): marble floor, red-and-ochre walls with pilasters, two raised tiers of benches across
//   the back (z -3.6 / -5.2) for the senators, a gilt statue of Victory on a pillar between them;
// - the palace CORRIDOR (x 238.5..241.5, running along z): marble, dark red walls, torches every 4 m (night);
// - the historian's STUDY (x 270): plaster walls, a desk with a candle, pigeonholes full of scrolls.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const CURIA: V3 = [200, 0, 0];
export const TIER1 = { z: -3.6, y: 0.45 }, TIER2 = { z: -5.2, y: 1.0 };
export const CORR: V3 = [240, 0, 0];
export const STUDY: V3 = [270, 0, 0];
export const DESK_TOP = 0.78;

const wallT = (key: string, base: string, panel: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.fillStyle = panel; g.fillRect(40, 120, 432, 300);
  g.strokeStyle = "#e8d8a8"; g.lineWidth = 8; g.strokeRect(40, 120, 432, 300);
  g.fillStyle = "#2a1e1a"; g.fillRect(0, 470, 512, 42); // dado
  g.fillStyle = "#e8d8a8"; g.fillRect(0, 462, 512, 8);
});

export class Rome extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const marble = twoTone(new THREE.MeshLambertMaterial({ map: stoneHD("clMarble", ["#ece6dc", "#e2dace", "#f2ece2", "#dcd2c4"], "#b8ac9c") }));
    const curiaW = lam("clCuriaW", () => ({ map: wallT("clCuriaWT", "#c8a868", "#b8322e"), side: THREE.DoubleSide }));
    const corrW = lam("clCorrW", () => ({ map: wallT("clCorrWT", "#5a2a26", "#6e3430"), side: THREE.DoubleSide }));
    const studyW = lam("clStudyW", () => ({ color: "#d8c49a", side: THREE.DoubleSide }));
    const col = lam("clColumn", () => ({ color: "#f0e8da" })), bench = lam("clBench", () => ({ color: "#8a5a34" })), cushion = lam("clCushion", () => ({ color: "#6e2a78" }));
    const gold = lam("clGold", () => ({ color: "#d9b04a" })), dark = lam("clDarkWood", () => ({ color: "#5a3a24" })), parch = lam("clParch", () => ({ color: "#efe2bf" }));

    // ---- the Curia ----
    const [cx, , cz] = CURIA;
    b.add(quad(V(cx - 7, 0, cz + 8), V(cx + 7, 0, cz + 8), V(cx + 7, 0, cz - 7), V(cx - 7, 0, cz - 7), 4, 4), marble);
    b.add(quad(V(cx - 7, 0, cz - 7), V(cx + 7, 0, cz - 7), V(cx + 7, 8, cz - 7), V(cx - 7, 8, cz - 7), 3, 2), curiaW);
    for (const s of [-1, 1]) b.add(quad(V(cx + s * 7, 0, cz + 8), V(cx + s * 7, 0, cz - 7), V(cx + s * 7, 8, cz - 7), V(cx + s * 7, 8, cz + 8), 3, 2), curiaW);
    for (const x of [-5.5, -2.2, 2.2, 5.5]) { deco.add(cyl(0.32, 0.36, 7.4, 16), col, at(cx + x, 3.7, cz - 6.4)); deco.add(boxGeo(V(cx + x - 0.5, 7.2, cz - 6.9), V(cx + x + 0.5, 7.6, cz - 5.9)), col); }
    for (const [t, d] of [[TIER1, 1.2], [TIER2, 1.4]] as const) {
      deco.add(boxGeo(V(cx - 6.6, 0, cz + t.z - d / 2), V(cx + 6.6, t.y, cz + t.z + d / 2)), bench);
      deco.add(boxGeo(V(cx - 6.5, t.y, cz + t.z - 0.3), V(cx + 6.5, t.y + 0.06, cz + t.z + 0.3)), cushion);
    }
    deco.add(cyl(0.45, 0.5, 1.6, 12), col, at(cx, 0.8 + 1.0, cz - 6.2)); // the pillar on the top step
    deco.add(cyl(0.18, 0.32, 1.1, 10), gold, at(cx, 3.15, cz - 6.2)); deco.add(new THREE.SphereGeometry(0.2, 10, 8), gold, at(cx, 3.85, cz - 6.2)); // Victory
    for (const s of [-1, 1]) deco.add(boxGeo(V(-0.05, -0.4, -0.02), V(0.05, 0.4, 0.02)), gold, at(cx + s * 0.32, 3.5, cz - 6.2, 0, 0, s * 0.8)); // her wings

    // ---- the corridor ----
    const [rx] = CORR;
    b.add(quad(V(rx - 1.5, 0, 12), V(rx + 1.5, 0, 12), V(rx + 1.5, 0, -24), V(rx - 1.5, 0, -24), 1, 12), marble);
    for (const s of [-1, 1]) b.add(quad(V(rx + s * 1.5, 0, 12), V(rx + s * 1.5, 0, -24), V(rx + s * 1.5, 4.5, -24), V(rx + s * 1.5, 4.5, 12), 9, 1), corrW);
    b.add(quad(V(rx - 1.5, 0, -24), V(rx + 1.5, 0, -24), V(rx + 1.5, 4.5, -24), V(rx - 1.5, 4.5, -24), 1, 1), corrW);
    for (let z = 8; z > -22; z -= 4) for (const s of [-1, 1]) {
      deco.add(cyl(0.05, 0.03, 0.5, 6), dark, at(rx + s * 1.4, 2.2, z, 0, 0, s * 0.4));
      this.flame(rx + s * 1.3, 2.62, z, 0.18, 0.38, 3.0); this.glow(rx + s * 1.3, 2.62, z, 2.2, 0.45);
    }

    // ---- the study ----
    const [sx] = STUDY;
    b.add(quad(V(sx - 4, 0, 4), V(sx + 4, 0, 4), V(sx + 4, 0, -4), V(sx - 4, 0, -4), 2, 2), marble);
    b.add(quad(V(sx - 4, 0, -2.5), V(sx + 4, 0, -2.5), V(sx + 4, 5, -2.5), V(sx - 4, 5, -2.5), 1, 1), studyW);
    for (const s of [-1, 1]) b.add(quad(V(sx + s * 4, 0, 4), V(sx + s * 4, 0, -2.5), V(sx + s * 4, 5, -2.5), V(sx + s * 4, 5, 4), 1, 1), studyW);
    deco.add(boxGeo(V(sx - 1.0, DESK_TOP - 0.06, -0.55), V(sx + 1.0, DESK_TOP, 0.25)), dark);
    for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) deco.add(boxGeo(V(sx + a * 0.92 - 0.05, 0, (c < 0 ? -0.5 : 0.2) - 0.05), V(sx + a * 0.92 + 0.05, DESK_TOP - 0.06, (c < 0 ? -0.5 : 0.2) + 0.05)), dark);
    // pigeonholes with scroll ends on the back wall
    deco.add(boxGeo(V(sx - 2.4, 0, -2.5), V(sx + 2.4, 2.8, -2.0)), dark);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) deco.add(cyl(0.12, 0.12, 0.1, 10), parch, at(sx - 2.1 + i * 0.6, 0.3 + j * 0.52, -1.96, Math.PI / 2, 0, 0));
    // an open scroll + inkpot on the desk, the candle
    deco.add(boxGeo(V(sx - 0.35, DESK_TOP, -0.25), V(sx + 0.35, DESK_TOP + 0.01, 0.1)), parch);
    deco.add(cyl(0.05, 0.05, 0.4, 8), parch, at(sx - 0.38, DESK_TOP + 0.05, -0.08, Math.PI / 2, 0, 0));
    deco.add(cyl(0.05, 0.05, 0.4, 8), parch, at(sx + 0.38, DESK_TOP + 0.05, -0.08, Math.PI / 2, 0, 0));
    deco.add(cyl(0.05, 0.06, 0.08, 8), lam("clInk", () => ({ color: "#2a2a34" })), at(sx + 0.6, DESK_TOP + 0.04, -0.3));
    deco.add(cyl(0.035, 0.04, 0.24, 8), lam("clWax", () => ({ color: "#f5ecd6" })), at(sx - 0.7, DESK_TOP + 0.12, -0.35));
    this.flame(sx - 0.7, DESK_TOP + 0.33, -0.35, 0.07, 0.15, 2.4); this.glow(sx - 0.7, DESK_TOP + 0.33, -0.35, 1.6, 0.4);

    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(fl: boolean) { this.setFlames(fl); }
}
