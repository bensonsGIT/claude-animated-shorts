// The Lateran basilica, January 897 (the Cadaver Synod), and the same nave dressed as St Peter's for the reburial.
// Floor y = 0; nave x (-4.6..4.6) between two colonnades, side aisles out to x = +-8; entrance wall z = +8; the apse
// (gold mosaic conch) behind the dais at the far end (z < -17.5). Ceiling of the nave 10 m, aisles 6 m.
// Modes: "synod" (night, candles, the two thrones, clergy benches), "peter" (day, open sarcophagus, no thrones).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, stoneHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const NAVE = { x0: -8, x1: 8, z0: -17.5, z1: 8, h: 10, col: 4.6, aisleH: 6.2, apseR: 5 };
export const DAIS = { x0: -4.2, x1: 4.2, z0: -17.5, z1: -11.6, y: 0.6 };
/** the pope's cathedra on the dais and the corpse's throne on the nave floor (seat front centre, seat height) */
export const CATHEDRA: V3 = [1.0, DAIS.y, -14.2];
export const THRONE: V3 = [-1.7, 0, -10.0];
export const SEAT = 0.46;
/** the clergy benches along both colonnades */
export const BENCH = { xL: -2.55, xR: 2.55, z0: -8.95, z1: -1.5, top: 0.45 };
/** St Peter's: the open sarcophagus in the nave (centre, top of the chest), lid slides on from +x */
export const SARC: V3 = [0, 0, -8.2];
export const SARC_TOP = 0.95;

const marble = () => ctex("synodFloor", 1024, 1024, (g, r) => {
  // cosmatesque: cream slabs in a 4x4 grid, rose and porphyry roundels, dark seams
  g.fillStyle = "#e8dcc6"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const c = ["#e8dcc6", "#ded0b8", "#efe4d0", "#e2d5bd"][(i + j * 3) % 4];
    g.fillStyle = c; g.fillRect(i * 256 + 4, j * 256 + 4, 248, 248);
    for (let k = 0; k < 8; k++) { g.fillStyle = `rgba(150,120,100,${0.05 + r() * 0.06})`; g.fillRect(i * 256 + r() * 230, j * 256 + r() * 230, 30 + r() * 60, 3); }
  }
  for (const [x, y, rr, c] of [[256, 256, 92, "#8a2a3a"], [768, 768, 92, "#2f5d5a"], [768, 256, 70, "#c08a6a"], [256, 768, 70, "#c08a6a"]] as const) {
    g.fillStyle = "#f4ead6"; g.beginPath(); g.arc(x, y, rr + 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = "#7a6656"; g.lineWidth = 6;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i * 256); g.lineTo(1024, i * 256); g.stroke(); }
});
const mosaic = () => ctex("apseGold", 1024, 512, (g, r) => {
  // gold tesserae, a deep-blue starry band at the rim and a white cross in the middle
  g.fillStyle = "#d8a83c"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "#e8bf54" : r() < 0.5 ? "#c4922e" : "#f2d27a"; g.fillRect(r() * 1024, r() * 512, 9, 9); }
  g.fillStyle = "#24346e"; g.fillRect(0, 430, 1024, 82);
  for (let i = 0; i < 40; i++) { g.fillStyle = "#f2d27a"; g.beginPath(); g.arc(r() * 1024, 450 + r() * 50, 4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#f6f0e2"; g.fillRect(492, 120, 40, 230); g.fillRect(432, 180, 160, 40);
  g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(492, 120, 40, 230); g.strokeRect(432, 180, 160, 40);
});
const drape = () => ctex("synodDrape", 256, 512, (g) => {
  g.fillStyle = "#9a1e2c"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.06)"; g.fillRect(i * 43, 0, 22, 512); }
  g.fillStyle = "#d8b04a"; g.fillRect(0, 470, 256, 42);
});
const fresco = () => ctex("naveFresco", 1024, 256, (g, r) => {
  // the clerestory band: ochre plaster with a row of painted arcades
  g.fillStyle = "#d9c49a"; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = ["#7a3a32", "#3a5a6a", "#6a7a3a"][i % 3]; g.fillRect(i * 128 + 20, 60, 88, 150);
    g.fillStyle = "#e8dcc0"; g.beginPath(); g.arc(i * 128 + 64, 60, 44, Math.PI, 0); g.fill();
  }
  g.fillStyle = "#8a5a3a"; g.fillRect(0, 226, 1024, 30); g.fillRect(0, 0, 1024, 18);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,60,40,${r() * 0.08})`; g.fillRect(r() * 1024, r() * 256, 20, 20); }
});

export type BasilicaMode = "synod" | "peter";

export class Basilica extends Room {
  private synod = new THREE.Group();
  private peter = new THREE.Group();
  private lid: THREE.Mesh;
  private windows: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch(), sy = new Batch(), pe = new Batch();
    const { x0, x1, z0, z1, h, col, aisleH, apseR } = NAVE;
    const wall = lam("basWall", () => ({ map: stoneHD("basWall", ["#d8c8aa", "#cfbf9f", "#e0d2b6", "#c8b896"], "#9a8a6c") }));
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: marble() }));
    const columnM = lam("basCol", () => ({ map: stoneHD("basColumn", ["#efe6d6", "#e6dccb", "#f4ece0"], "#c8bca8") }));
    const porph = lam("basPorph", () => ({ color: "#8a3a42" }));
    const goldM = twoTone(new THREE.MeshPhongMaterial({ color: "#d9b04a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 50 }), 0.15);
    const wood = lam("basWood", () => ({ map: beam() }));
    const ceil = lam("basCeil", () => ({ color: "#5a3424" }));
    const red = lam("basRed", () => ({ color: "#b42434" }));
    const cream = lam("basCream", () => ({ color: "#efe4cc" }));
    const wax = lam("basWax", () => ({ color: "#f5ecd6" }));
    const drapeM = twoTone(new THREE.MeshLambertMaterial({ map: drape(), side: THREE.DoubleSide }));
    const frescoM = twoTone(new THREE.MeshLambertMaterial({ map: fresco() }));
    const sarcM = lam("basSarc", () => ({ map: stoneHD("basSarc", ["#e8e0d2", "#ddd4c4", "#f0e8da"], "#b0a690") }));

    // ---- shell: floor, aisle walls, entrance wall, nave walls above the colonnades, ceilings ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.2, (z1 - z0) / 2.2), floor);
    shell.add(boxGeo(V(x0 - 0.5, 0, z0), V(x0, aisleH, z1), 2), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.5, aisleH, z1), 2), wall);
    shell.add(boxGeo(V(x0 - 0.5, 0, z1), V(x1 + 0.5, h, z1 + 0.5), 2), wall);
    for (const s of [-1, 1]) {
      const xa = s * col;
      // the clerestory wall carried on the colonnade (arches implied by the fresco band), windows above
      shell.add(boxGeo(V(xa - 0.35, aisleH - 0.4, z0), V(xa + 0.35, h, z1), 2), wall);
      const xf = xa - s * 0.36;
      const g = s < 0 ? quad(V(xf, aisleH - 0.2, z1), V(xf, aisleH - 0.2, z0), V(xf, aisleH + 1.7, z0), V(xf, aisleH + 1.7, z1), 3, 1)
        : quad(V(xf, aisleH - 0.2, z0), V(xf, aisleH - 0.2, z1), V(xf, aisleH + 1.7, z1), V(xf, aisleH + 1.7, z0), 3, 1);
      shell.add(g, frescoM);
      // aisle ceiling
      shell.add(boxGeo(V(Math.min(xa, s * 8), aisleH, z0), V(Math.max(xa, s * 8), aisleH + 0.3, z1), 0, true), ceil);
      // columns with bases and capitals
      for (let z = z1 - 1.6; z > z0 + 0.8; z -= 3.0) {
        deco.add(boxGeo(V(xa - 0.42, 0, z - 0.42), V(xa + 0.42, 0.3, z + 0.42)), columnM);
        deco.add(cyl(0.3, 0.34, aisleH - 0.95, 16), z % 2 ? columnM : porph, at(xa, 0.3 + (aisleH - 0.95) / 2, z));
        deco.add(boxGeo(V(xa - 0.46, aisleH - 0.65, z - 0.46), V(xa + 0.46, aisleH - 0.35, z + 0.46)), columnM);
      }
    }
    shell.add(boxGeo(V(x0 - 0.5, h, z0 - 6), V(x1 + 0.5, h + 0.4, z1 + 0.5), 0, true), ceil);
    for (let z = z1 - 1; z > z0; z -= 3) shell.add(boxGeo(V(-col, h - 0.5, z - 0.2), V(col, h, z + 0.2), 2), wood);
    // clerestory windows: emissive panes (night: deep blue, day: bright)
    this.windows = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.16, 0.42) });
    for (const s of [-1, 1]) for (let z = z1 - 3; z > z0 + 1; z -= 3.0) {
      const xw = s * (col - 0.37);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), this.windows);
      m.position.set(xw, h - 1.1, z); m.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; m.layers.set(NOINK); this.root.add(m);
    }
    // ---- triumphal arch wall + apse (half cylinder) with a gold mosaic conch ----
    shell.add(boxGeo(V(x0, 0, z0 - 0.6), V(-apseR, h, z0), 2), wall);
    shell.add(boxGeo(V(apseR, 0, z0 - 0.6), V(x1, h, z0), 2), wall);
    shell.add(boxGeo(V(-apseR, 8.2, z0 - 0.6), V(apseR, h, z0), 2), wall);
    const apse = new THREE.Mesh(new THREE.CylinderGeometry(apseR, apseR, 8.2, 28, 1, true, Math.PI / 2, Math.PI),
      twoTone(new THREE.MeshLambertMaterial({ map: stoneHD("basApse", ["#cdb894", "#c4ae8a", "#d6c29e"], "#9a8a6c"), side: THREE.BackSide })));
    apse.position.set(0, 4.1, z0 - 0.6); apse.receiveShadow = true; this.root.add(apse);
    const conch = new THREE.Mesh(new THREE.SphereGeometry(apseR, 28, 12, Math.PI / 2, Math.PI, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: mosaic(), side: THREE.BackSide, color: new THREE.Color(0.9, 0.82, 0.66) }));
    conch.position.set(0, 3.4, z0 - 0.6); conch.scale.set(1, 1.0, 1); conch.layers.set(NOINK); this.root.add(conch);
    // a mosaic band on the apse wall
    const band = new THREE.Mesh(new THREE.CylinderGeometry(apseR - 0.02, apseR - 0.02, 1.3, 28, 1, true, Math.PI / 2, Math.PI),
      new THREE.MeshBasicMaterial({ map: mosaic(), side: THREE.BackSide, color: new THREE.Color(0.75, 0.66, 0.5) }));
    band.position.set(0, 2.9, z0 - 0.6); band.layers.set(NOINK); this.root.add(band);

    // ---- the dais with two steps, red drapes between the last columns ----
    const { x0: dx0, x1: dx1, z0: dz0, z1: dz1, y: dy } = DAIS;
    fix.add(boxGeo(V(dx0, 0, dz0 - 4), V(dx1, dy, dz1), 1.5), columnM);
    fix.add(boxGeo(V(dx0 + 0.3, 0, dz1), V(dx1 - 0.3, dy / 2, dz1 + 0.45), 1.5), columnM);
    for (const s of [-1, 1]) {
      const xd = s * (col - 0.45);
      const g = s < 0 ? quad(V(xd, 0.6, -16.6), V(xd, 0.6, -12.2), V(xd, 5.6, -12.2), V(xd, 5.6, -16.6), 1, 1) : quad(V(xd, 0.6, -12.2), V(xd, 0.6, -16.6), V(xd, 5.6, -16.6), V(xd, 5.6, -12.2), 1, 1);
      fix.add(g, drapeM);
    }
    // tall candle stands at the dais corners, hanging lamp rings over the nave
    for (const [x, z, y0] of [[-3.4, -12.0, dy], [3.4, -12.0, dy], [-2.3, -16.4, dy], [2.3, -16.4, dy]] as const) {
      deco.add(cyl(0.22, 0.28, 0.12, 12), iron, at(x, y0 + 0.06, z));
      deco.add(cyl(0.04, 0.05, 1.7), iron, at(x, y0 + 0.95, z));
      deco.add(cyl(0.12, 0.08, 0.08, 10), goldM, at(x, y0 + 1.82, z));
      deco.add(cyl(0.06, 0.06, 0.32), wax, at(x, y0 + 2.0, z));
      this.flame(x, y0 + 2.3, z, 0.12, 0.24, 3.0);
      this.glow(x, y0 + 2.3, z, 1.5, 0.35);
    }
    for (const z of [-4.5, -10.5]) {
      const y = 5.2;
      fix.add(new THREE.TorusGeometry(0.9, 0.04, 8, 32), iron, at(0, y, z, Math.PI / 2));
      for (const s of [-1, 1]) fix.add(cyl(0.012, 0.012, h - y), iron, at(s * 0.6, y + (h - y) / 2, z, 0, 0, s * 0.12));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, cx = 0.9 * Math.cos(a), cz = z + 0.9 * Math.sin(a);
        fix.add(cyl(0.06, 0.035, 0.12, 8), goldM, at(cx, y + 0.02, cz));
        this.flame(cx, y + 0.14, cz, 0.07, 0.14, 2.6);
      }
      this.glow(0, y + 0.1, z, 3.2, 0.25);
    }

    // ---- synod dressing: the cathedra on the dais, the corpse's throne on the floor (+ footstools), benches ----
    const throne = (b: Batch, [x, y, z]: V3, yaw: number, tall: number, cushion: THREE.Material) => {
      const R = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), V(1, 1, 1));
      const add = (g: THREE.BufferGeometry, m: THREE.Material, l?: THREE.Matrix4) => b.add(g, m, l ? R.clone().multiply(l) : R);
      // local frame: seat front edge at z = 0, back at z = -0.62
      add(boxGeo(V(-0.42, 0, -0.62), V(0.42, SEAT - 0.06, -0.06)), wood);
      add(boxGeo(V(-0.4, SEAT - 0.06, -0.6), V(0.4, SEAT, -0.08)), cushion);
      add(boxGeo(V(-0.46, 0, -0.74), V(0.46, tall, -0.6)), wood);
      add(boxGeo(V(-0.4, SEAT + 0.05, -0.6), V(0.4, tall - 0.12, -0.585)), cushion);
      for (const s of [-1, 1]) {
        add(boxGeo(V(s * 0.42 - 0.06, SEAT, -0.62), V(s * 0.42 + 0.06, SEAT + 0.3, -0.04)), wood);
        add(cyl(0.07, 0.07, 0.08, 10), goldM, at(s * 0.42, SEAT + 0.34, -0.06));
        add(cyl(0.06, 0.06, 0.1, 10), goldM, at(s * 0.4, tall + 0.05, -0.67));
      }
      add(boxGeo(V(-0.5, tall - 0.1, -0.76), V(0.5, tall + 0.0, -0.58)), goldM);
      // footstool in front of the seat
      add(boxGeo(V(-0.34, 0, 0.0), V(0.34, SEAT - 0.12, 0.36)), cushion);
    };
    throne(sy, CATHEDRA, 0, 2.3, red);
    throne(sy, THRONE, 0.5, 1.75, lam("basGreen", () => ({ color: "#2f5d5a" })));
    for (const xb of [BENCH.xL, BENCH.xR]) {
      sy.add(boxGeo(V(xb - 0.24, BENCH.top - 0.07, BENCH.z0), V(xb + 0.24, BENCH.top, BENCH.z1)), wood);
      for (const z of [BENCH.z0 + 0.3, (BENCH.z0 + BENCH.z1) / 2, BENCH.z1 - 0.3]) sy.add(boxGeo(V(xb - 0.05, 0, z - 0.2), V(xb + 0.05, BENCH.top - 0.07, z + 0.2)), wood);
      sy.add(boxGeo(V(xb - 0.24, 0, BENCH.z0), V(xb + 0.24, 0.12, BENCH.z1)), cream); // footboard (the seated cards' feet)
    }
    // a lectern with an open book for the notary
    sy.add(cyl(0.05, 0.08, 1.05), wood, at(2.6, 0.52, -11.0));
    sy.add(boxGeo(V(2.35, 1.05, -11.2), V(2.85, 1.1, -10.8)), wood);
    sy.add(boxGeo(V(2.38, 1.1, -11.15), V(2.82, 1.13, -10.85)), cream);

    // ---- St Peter's dressing: the sarcophagus on a step, its lid, candle stands ----
    const [sx, , sz] = SARC;
    pe.add(boxGeo(V(sx - 1.5, 0, sz - 0.8), V(sx + 1.5, 0.18, sz + 0.8), 1), columnM);
    pe.add(boxGeo(V(sx - 1.2, 0.18, sz - 0.55), V(sx + 1.2, SARC_TOP, sz + 0.55), 1), sarcM);
    pe.add(boxGeo(V(sx - 1.05, SARC_TOP - 0.02, sz - 0.42), V(sx + 1.05, SARC_TOP + 0.001, sz + 0.42)), lam("basHollow", () => ({ color: "#3a3030" })));
    for (const s of [-1, 1]) for (const zz of [-1, 1]) {
      const x = sx + s * 1.8, z = sz + zz * 0.9;
      pe.add(cyl(0.16, 0.2, 0.1, 10), goldM, at(x, 0.05, z));
      pe.add(cyl(0.035, 0.045, 1.3), goldM, at(x, 0.7, z));
      pe.add(cyl(0.05, 0.05, 0.28), wax, at(x, 1.49, z));
      this.flame(x, 1.75, z, 0.1, 0.2, 2.8);
    }
    const lidG = boxGeo(V(-1.25, 0, -0.6), V(1.25, 0.16, 0.6), 1);
    this.lid = new THREE.Mesh(lidG, sarcM); this.lid.castShadow = true; this.lid.receiveShadow = true;
    this.peter.add(this.lid);

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
    sy.build(this.synod, true);
    pe.build(this.peter, true);
    this.root.add(this.synod, this.peter);

  }

  /** mode + sarcophagus lid (0 = slid fully off to +x, 1 = closed); `night` lights the candles and darkens the windows */
  pose(mode: BasilicaMode, lid = 0, night = true, jolt = 0) {
    this.synod.visible = mode === "synod";
    this.peter.visible = mode === "peter";
    const [sx, , sz] = SARC, k = Math.max(0, Math.min(1, lid));
    // open: leaning against the +x end of the chest; closed: on top. The lid swings up and over between the two.
    const e = k * k * (3 - 2 * k);
    this.lid.position.set(sx + 2.55 * (1 - e), SARC_TOP * e + 0.05 * (1 - e) + 0.5 * Math.sin(Math.PI * e), sz);
    this.lid.rotation.z = 1.35 * (1 - e) + 0.12 * jolt;
    this.lid.position.y += 0.16 * jolt;
    if (night) this.windows.color.setRGB(0.12, 0.16, 0.42); else this.windows.color.setRGB(2.2, 2.05, 1.7);
    this.setFlames(true);
  }
}
