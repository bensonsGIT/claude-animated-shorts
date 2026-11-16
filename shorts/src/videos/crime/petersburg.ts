// St. Petersburg, July 1865 (one outdoor set, three places far apart, one sky dome):
// - the canal street at the origin: a cobbled quay along x (z -8..2), a row of 4-5 storey stucco tenements at z = -8
//   (facing +z) with a dark courtyard arch at x 8..11, a granite embankment + iron railing at z = 2, the canal
//   (water y WATER_Y, z 2..14) and the far row of tenements at z = 16 (facing -z) with a little church dome beyond.
// - the courtyard at x = 60: four peeling walls (open toward +z), the big STONE, the porter's lodge door, a woodpile.
// - the Haymarket at x = -70: an open cobbled square, market stalls with striped awnings, a yellow church with green domes.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const WATER_Y = -1.3;
export const STONE: V3 = [60, 0, -1.6];
export const LODGE: V3 = [54.2, 0, -2.4];
export const HAY: V3 = [-70, 0, 0];

const cobbles = () => ctex("pbCobble", 512, 512, (g, r) => {
  g.fillStyle = "#8a8078"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 24) for (let x = (y / 24) % 2 ? 0 : 14; x < 512; x += 28) {
    g.fillStyle = ["#9a9088", "#847a72", "#a49a90", "#8e8478"][Math.floor(r() * 4)];
    g.beginPath(); g.ellipse(x + 13, y + 11, 12, 10, 0, 0, Math.PI * 2); g.fill();
  }
});
const stucco = (key: string, base: string) => ctex(key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,70,50,${0.05 + 0.08 * r()})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 20 + r() * 40, 8 + r() * 20, 0, 0, Math.PI * 2); g.fill(); } // peeling, stains
  g.fillStyle = "rgba(255,255,255,0.15)"; g.fillRect(0, 0, 256, 6);
});
const skyTex = (golden: boolean) => ctex(golden ? "pbSkyG" : "pbSkyD", 64, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  if (golden) { gr.addColorStop(0, "#5a6aa8"); gr.addColorStop(0.3, "#c08ea0"); gr.addColorStop(0.46, "#f6c48a"); gr.addColorStop(1, "#f6c48a"); }
  else { gr.addColorStop(0, "#3a7ad0"); gr.addColorStop(0.35, "#7ab0e6"); gr.addColorStop(0.5, "#d0e2f0"); gr.addColorStop(1, "#d0e2f0"); }
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
});
const COLS = ["#e6c070", "#d8a090", "#c8d0a8", "#e8d8b8", "#d8b878", "#b8c8d0"];

export class Petersburg extends Room {
  private dome: THREE.Mesh;
  private skies = { golden: skyTex(true), day: skyTex(false) };
  stone = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const cob = twoTone(new THREE.MeshLambertMaterial({ map: cobbles() }));
    const water = twoTone(new THREE.MeshLambertMaterial({ color: "#3a5a6a" }));
    const granite = lam("pbGranite", () => ({ color: "#8a8288" }));
    const iron = lam("pbIron", () => ({ color: "#26242c" }));
    const trim = lam("pbTrim", () => ({ color: "#f2ece0" }));
    const roofM = lam("pbRoof", () => ({ color: "#6a7a6a" }));
    const glass = new THREE.MeshBasicMaterial({ color: "#3a4256", side: THREE.DoubleSide });
    const dark = lam("pbDark", () => ({ color: "#1e1a20" }));
    const wood = lam("pbWood", () => ({ color: "#6a4a32" }));
    const stalls = [lam("pbAwnR", () => ({ color: "#c8403a" })), lam("pbAwnB", () => ({ color: "#3a5a9a" })), lam("pbAwnY", () => ({ color: "#d8a83a" }))];
    const greenDome = lam("pbDome", () => ({ color: "#3a8a6a" })), gold = lam("pbGold", () => ({ color: "#d9b04a" }));
    const walls = COLS.map((c, i) => lam(`pbWall${i}`, () => ({ map: stucco(`pbStucco${i}`, c) })));

    // ground everywhere (cobbles), the canal cut out of it between z 2 and 14
    b.add(quad(V(-200, 0, 2), V(200, 0, 2), V(200, 0, -200), V(-200, 0, -200), 100, 100), cob);
    b.add(quad(V(-200, 0, 200), V(200, 0, 200), V(200, 0, 14), V(-200, 0, 14), 100, 50), cob);
    b.add(quad(V(-200, WATER_Y, 14), V(200, WATER_Y, 14), V(200, WATER_Y, 2), V(-200, WATER_Y, 2)), water);
    for (const z of [2, 14]) deco.add(boxGeo(V(-200, WATER_Y - 0.5, z - 0.25), V(200, 0.05, z + 0.25)), granite);
    // railing along the near embankment (and the far one)
    for (const z of [2.15, 13.85]) {
      for (let x = -60; x <= 60; x += 1.2) deco.add(cyl(0.025, 0.025, 1.0, 5), iron, at(x, 0.5, z));
      deco.add(boxGeo(V(-60, 0.98, z - 0.04), V(60, 1.04, z + 0.04)), iron);
    }
    // a row of tenements facing +z (z0 = front) or -z, with windows, cornices, doors; gap = courtyard arch
    const row = (zf: number, dir: 1 | -1, x0: number, x1: number, arch?: [number, number]) => {
      let x = x0, k = 0;
      while (x < x1) {
        const w = 9 + 4 * ((k * 7) % 3), h = 13 + 3 * ((k * 5) % 3), m = walls[(k + (dir > 0 ? 0 : 3)) % walls.length], xe = Math.min(x1, x + w);
        const zb = zf - dir * 12;
        b.add(boxGeo(V(x, 0, Math.min(zf, zb)), V(xe, h, Math.max(zf, zb)), 2.5), m);
        fix.add(boxGeo(V(x - 0.1, h - 0.3, Math.min(zf, zf + dir * 0.35)), V(xe + 0.1, h, Math.max(zf, zf + dir * 0.35))), trim);
        deco.add(boxGeo(V(x, h, Math.min(zf, zb)), V(xe, h + 1.4, Math.max(zf, zb))), roofM);
        for (const y of [3.4, 6.6, 9.8, 13.0]) {
          if (y + 1.8 > h - 0.5) continue;
          for (let wx = x + 1.2; wx < xe - 0.8; wx += 1.8) {
            if (arch && wx > arch[0] - 0.8 && wx < arch[1] + 0.8 && y < 5) continue;
            const zz = zf + dir * 0.02;
            const g = quad(V(wx - 0.4, y, zz), V(wx + 0.4, y, zz), V(wx + 0.4, y + 1.5, zz), V(wx - 0.4, y + 1.5, zz));
            const mesh = new THREE.Mesh(g, glass); mesh.layers.set(NOINK); this.root.add(mesh);
            fix.add(boxGeo(V(wx - 0.52, y - 0.12, Math.min(zz, zz + dir * 0.16)), V(wx + 0.52, y, Math.max(zz, zz + dir * 0.16))), trim);
            fix.add(boxGeo(V(wx - 0.55, y + 1.5, Math.min(zz, zz + dir * 0.2)), V(wx + 0.55, y + 1.66, Math.max(zz, zz + dir * 0.2))), trim);
          }
        }
        fix.add(boxGeo(V(x, 2.8, Math.min(zf, zf + dir * 0.2)), V(xe, 3.0, Math.max(zf, zf + dir * 0.2))), trim);
        // a door per house
        const dx = (x + xe) / 2 + 2;
        if (!(arch && dx > arch[0] - 1 && dx < arch[1] + 1)) fix.add(boxGeo(V(dx - 0.6, 0, Math.min(zf, zf + dir * 0.06)), V(dx + 0.6, 2.4, Math.max(zf, zf + dir * 0.06))), dark);
        x = xe; k++;
      }
      if (arch) { // the dark courtyard arch
        const [a0, a1] = arch, zz = zf + dir * 0.03;
        const sh = new THREE.Shape(); const w = a1 - a0; sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, 2.4); sh.absarc(0, 2.4, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
        const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), new THREE.MeshBasicMaterial({ color: "#14101a" })); m.position.set((a0 + a1) / 2, 0, zz); m.layers.set(NOINK); this.root.add(m);
      }
    };
    row(-8, 1, -60, 60, [8, 11]);
    row(16, -1, -60, 60);
    // a church dome beyond the far row
    deco.add(cyl(3, 3, 6, 16), walls[0], at(-6, 20, 32)); deco.add(new THREE.SphereGeometry(3.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), greenDome, at(-6, 23, 32));
    deco.add(cyl(0.15, 0.15, 3, 6), gold, at(-6, 27.5, 32));
    // gas lamps along the quay
    for (let x = -45; x <= 45; x += 10) { deco.add(cyl(0.06, 0.08, 3.4, 6), iron, at(x, 1.7, 1.4)); deco.add(boxGeo(V(x - 0.18, 3.4, 1.22), V(x + 0.18, 3.85, 1.58)), lam("pbLamp", () => ({ color: "#f2e0a8" }))); }

    // ---- the courtyard (x = 60) ----
    {
      const cx = 60, wm = walls[4];
      for (const [a, c] of [[V(cx - 7, 0, -7), V(cx - 6, 14, 6)], [V(cx + 6, 0, -7), V(cx + 7, 14, 6)], [V(cx - 7, 0, -8), V(cx + 7, 14, -7)]] as const) b.add(boxGeo(a, c, 2.5), wm);
      for (const y of [3.6, 7, 10.4]) for (let x = cx - 4.5; x <= cx + 4.5; x += 2.2) {
        const m = new THREE.Mesh(quad(V(x - 0.4, y, -6.98), V(x + 0.4, y, -6.98), V(x + 0.4, y + 1.4, -6.98), V(x - 0.4, y + 1.4, -6.98)), glass); m.layers.set(NOINK); this.root.add(m);
      }
      // the porter's lodge: a low door + window in the left wall, ajar (dark gap)
      const [lx, , lz] = LODGE;
      fix.add(boxGeo(V(cx - 6.02, 0, lz - 0.55), V(cx - 5.96, 2.1, lz + 0.55)), dark);
      fix.add(boxGeo(V(cx - 6.0, 0, lz + 0.35), V(cx - 5.6, 2.1, lz + 0.45)), wood);
      fix.add(boxGeo(V(cx - 6.02, 1.0, lz - 2.0), V(cx - 5.96, 1.9, lz - 1.1)), lam("pbLodgeWin", () => ({ color: "#5a5a6a" })));
      void lx;
      // washing lines strung across the yard with sheets and shirts
      const cloths = ["#f2ece0", "#c8d8e8", "#e8c8c8", "#f4f0d8", "#b8c8a8"];
      for (const [y, z] of [[4.2, -3.2], [5.6, -5.2], [7.0, -2.0]] as const) {
        deco.add(cyl(0.012, 0.012, 12, 4), iron, at(cx, y, z, 0, 0, Math.PI / 2));
        for (let i = 0; i < 7; i++) {
          const x = cx - 5 + i * 1.5 + 0.3 * Math.sin(i * 3 + y), w = 0.5 + 0.35 * ((i * 7) % 3) / 2, h = 0.6 + 0.5 * ((i * 5) % 3) / 2;
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam(`pbCloth${(i + Math.round(y)) % 5}`, () => ({ color: cloths[(i + Math.round(y)) % 5], side: THREE.DoubleSide })));
          m.position.set(x, y - h / 2, z); m.rotation.y = 0.12 * Math.sin(i + y); m.castShadow = true; this.root.add(m);
        }
      }
      // a woodpile on the right, a water barrel
      for (let i = 0; i < 18; i++) deco.add(cyl(0.12, 0.12, 1.4, 7), wood, at(cx + 5.2 - (i % 6) * 0.25, 0.13 + Math.floor(i / 6) * 0.24, -5.0, Math.PI / 2, 0, 0));
      deco.add(cyl(0.4, 0.38, 0.9, 12), wood, at(cx + 4.8, 0.45, -2.8));
      // the stone: a big flat rock (a separate group that the story can lift)
      const sb = new Batch();
      sb.add(new THREE.DodecahedronGeometry(0.42, 0).scale(1.2, 0.5, 0.9), lam("pbStone", () => ({ color: "#8e8a86" })), at(0, 0.17, 0));
      sb.build(this.stone, true);
      this.stone.position.set(...STONE); this.root.add(this.stone);
    }

    // ---- the Haymarket (x = -70): stalls round an open square, tenements behind, a yellow church ----
    {
      const [hx, , hz] = HAY;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 1.3 + Math.PI * 0.85, x = hx + 9 * Math.cos(a), z = hz - 1 + 7 * Math.sin(a);
        const g = new THREE.Group(), sb = new Batch();
        sb.add(boxGeo(V(-1.1, 0.8, -0.5), V(1.1, 0.9, 0.5)), wood);
        for (const [px, pz] of [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]]) sb.add(cyl(0.04, 0.04, 2.3, 5), wood, at(px, 1.15, pz));
        sb.add(boxGeo(V(-1.25, 2.3, -0.65), V(1.25, 2.4, 0.65)), stalls[i % 3]);
        for (let k = 0; k < 5; k++) sb.add(new THREE.SphereGeometry(0.13, 8, 6), [stalls[0], stalls[2], lam("pbVeg", () => ({ color: "#6a9a3a" }))][(i + k) % 3], at(-0.8 + k * 0.4, 1.02, 0));
        sb.build(g, true); g.position.set(x, 0, z); g.rotation.y = Math.atan2(hx - x, hz - z); this.root.add(g);
      }
      for (const [x0, z0, x1, z1] of [[hx - 30, hz - 22, hx + 30, hz - 14], [hx - 30, hz + 14, hx + 30, hz + 22]]) b.add(boxGeo(V(x0, 0, z0), V(x1, 14, z1), 2.5), walls[1]);
      b.add(boxGeo(V(hx - 6, 0, hz - 30), V(hx + 6, 12, hz - 22)), walls[0]);
      deco.add(cyl(2.8, 2.8, 4, 16), walls[0], at(hx, 14, hz - 26)); deco.add(new THREE.SphereGeometry(3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), greenDome, at(hx, 16, hz - 26));
      deco.add(cyl(0.15, 0.15, 3, 6), gold, at(hx, 20.5, hz - 26));
    }

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(240, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.golden, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
  }
  /** per-shot pose: sky, the stone lifted (0 down .. 1 tipped up on its edge) */
  pose(light: string, stoneLift: number, camPos?: THREE.Vector3) {
    (this.dome.material as THREE.MeshBasicMaterial).map = light === "golden" ? this.skies.golden : this.skies.day;
    if (camPos) this.dome.position.copy(camPos);
    this.stone.rotation.x = -1.1 * stoneLift; this.stone.position.z = STONE[2] - 0.45 * stoneLift; this.stone.position.y = 0.05 * stoneLift;
  }
}
