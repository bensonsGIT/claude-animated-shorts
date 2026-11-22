// Frankenstein sets. Floor y = 0 everywhere; cameras mostly look toward -z. Each set is a Room shown one at a time.
// Interiors: the Ingolstadt garret (candle, rain on the window, the long table), the De Lacey cottage inside, Justine's
// barn, the prison cell, the Orkney hut (moonlit casement), the ship's cabin; the inn bedroom is the East of Eden bedroom.
// Exteriors (own sky dome + backdrop): the cottage and hovel, the river in the woods (day or night), the glacier, the Arctic.
// Every layer on a wall stands >= 4 cm proud of the layer behind it (no coplanar faces). Roofs are double-sided with soffits.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, beam, grassHD } from "../../engine/paint";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import { shell, holedWall, doorTex, windowUnit, doorUnit, brassK } from "../dorian/rooms";
import type { V3 } from "./story";

const ink = "#141018";
export const plaster = (key: string, a: string, b: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = a; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? b : "rgba(0,0,0,0.05)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 26, 4 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
});
export const stone = (key: string, cols: string[], mortar: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
  for (let y = 0, row = 0; y < 512; y += 64, row++) for (let x = (row % 2) * -48; x < 512; x += 96) {
    g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x + 4, y + 4, 88, 56);
    g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, 88, 56);
  }
});
export const skyDome = (root: THREE.Object3D, key: string, stops: [number, string][], r = 140, stars = false) => {
  const t = ctex(key, 256, 512, (g, rr) => {
    const gr = g.createLinearGradient(0, 0, 0, 512); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    if (stars) for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(255,255,240,0.85)"; g.fillRect(rr() * 256, rr() * 220, 1.5, 1.5); }
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -2; dome.layers.set(NOINK); root.add(dome);
};
export const backdrop = (root: THREE.Object3D, tex: THREE.Texture, w: number, h: number, z: number, landFrac = 830 / 1024) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, alphaTest: 0.02 }));
  m.position.set(0, h * landFrac - h / 2 - 0.5, z); m.layers.set(NOINK); root.add(m);
};
export const ridgeTex = (key: string, layers: [number, number, number, string, string | null][], ground: string | null) => ctex(key, 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  for (const [y0, amp, n, col, snow] of layers) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) pts.push([(i / n) * 2048, y0 - (i % 2 ? amp * (0.55 + 0.45 * Math.sin(i * 2.3 + y0)) : amp * 0.12)]);
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 1024); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(2048, 1024); g.fill();
    if (snow) { g.fillStyle = snow; for (let i = 1; i < n; i += 2) { const [x, y] = pts[i], [xa, ya] = pts[i - 1], [xb, yb] = pts[i + 1], k = 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (xa - x) * k, y + (ya - y) * k); g.lineTo(x, y + 30); g.lineTo(x + (xb - x) * k, y + (yb - y) * k); g.fill(); } }
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  }
  if (ground) { g.fillStyle = ground; g.fillRect(0, 850, 2048, 174); }
  void r;
});
const pine = (b: Batch, x: number, z: number, s: number, needle: THREE.Material, trunk: THREE.Material, snow?: THREE.Material) => {
  b.add(cyl(0.12 * s, 0.16 * s, 1.2 * s, 7), trunk, at(x, 0.6 * s, z));
  for (let k = 0; k < 3; k++) b.add(new THREE.ConeGeometry((1.3 - 0.32 * k) * s, 1.6 * s, 9), needle, at(x, (1.4 + 0.85 * k) * s, z));
  if (snow) b.add(new THREE.ConeGeometry(0.45 * s, 0.6 * s, 9), snow, at(x, 3.25 * s, z));
};
const tree = (b: Batch, x: number, z: number, s: number, leaf: THREE.Material, trunk: THREE.Material) => {
  b.add(cyl(0.16 * s, 0.24 * s, 2.6 * s, 8), trunk, at(x, 1.3 * s, z));
  b.add(new THREE.SphereGeometry(1.4 * s, 12, 9), leaf, at(x, 3.2 * s, z)); b.add(new THREE.SphereGeometry(1.0 * s, 12, 9), leaf, at(x + 0.8 * s, 2.8 * s, z + 0.3 * s));
};
/** an animated texture strip (rain on the panes, running water) */
const flowTex = (key: string, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  const t = ctex(key, 256, 256, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

// ================= the Ingolstadt garret =================
export const GARRET = { x0: -2.8, x1: 2.8, z0: -3.4, z1: 3.6, h: 2.9 };
export const G_TABLE = { x0: -0.45, x1: 0.45, z0: -3.0, z1: -0.3, top: 0.85 };
export const G_BENCH_CANDLE: V3 = [-1.3, 0.95, -3.1];
export const G_WIN = { x: 1.55, y0: 1.0, w: 1.0, h: 1.3 };
export class Garret extends Room {
  private rain: THREE.Texture;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = GARRET;
    const wall = lam("gaWall", () => ({ map: plaster("gaPlaster", "#7a6e5c", "#857864") }));
    const floor = lam("gaFloor", () => ({ map: planksHD(), color: "#8a7060" }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("gaCeil", () => ({ color: "#5a4a3a" })), false);
    const { x: wx, y0: wy0, w: ww, h: wh } = G_WIN;
    holedWall(b, x0, x1, z0, h, wx - ww / 2, wx + ww / 2, wy0, wy0 + wh, wall);
    const night = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: ctex("gaNight", 128, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#0e1428"); gr.addColorStop(1, "#1e2440"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.fillStyle = "#0a0c16"; for (let i = 0; i < 4; i++) g.fillRect(i * 34, 80 - (i % 2) * 14, 30, 60);
    }) }));
    night.position.set(wx, wy0 + wh / 2, z0 - 1.0); night.layers.set(NOINK); this.root.add(night);
    this.rain = flowTex("gaRain", (g, r) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(190,210,240,0.55)"; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 18 + r() * 14); g.stroke(); } });
    this.rain.repeat.set(1.5, 1.5);
    const rainM = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: this.rain, transparent: true, depthWrite: false }));
    rainM.position.set(wx, wy0 + wh / 2, z0 - 0.06); rainM.layers.set(NOINK); this.root.add(rainM);
    const frame = lam("gaFrame", () => ({ color: "#5a4a3a" }));
    windowUnit(deco, wx, wy0, ww, wh, z0, { frame, cols: 2, rows: 3, sill: frame });
    // the long deal table (along z) with the sheet hanging over its edges
    const deal = lam("gaDeal", () => ({ map: beam(), color: "#a88a68" })), cloth = lam("gaCloth", () => ({ color: "#e4ddcc" }));
    const { x0: t0, x1: t1, z0: tz0, z1: tz1, top } = G_TABLE;
    deco.add(boxGeo(V(t0, top - 0.06, tz0), V(t1, top, tz1)), deal);
    for (const [x, z] of [[t0 + 0.06, tz0 + 0.06], [t1 - 0.06, tz0 + 0.06], [t0 + 0.06, tz1 - 0.06], [t1 - 0.06, tz1 - 0.06]] as const) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, top - 0.06, z + 0.04)), deal);
    deco.add(boxGeo(V(t0 - 0.03, top, tz0 + 0.6), V(t1 + 0.03, top + 0.01, tz1 + 0.03)), cloth);
    for (const x of [t0 - 0.03, t1 + 0.02]) deco.add(boxGeo(V(x, top - 0.35, tz0 + 0.6), V(x + 0.01, top, tz1 + 0.03)), cloth);
    // the workbench along the back wall, left: jars, a skull, the candle
    deco.add(boxGeo(V(-2.4, 0.88, z0), V(-0.7, 0.93, z0 + 0.55)), deal);
    for (const x of [-2.35, -0.75]) deco.add(boxGeo(V(x - 0.04, 0, z0 + 0.45), V(x + 0.04, 0.88, z0 + 0.53)), deal);
    const glass = (c: string) => lam(`gaJar${c}`, () => ({ color: c, transparent: true, opacity: 0.7 }));
    for (const [x, c, hh] of [[-2.15, "#8ab0a0", 0.3], [-1.9, "#c8b07a", 0.22], [-1.65, "#9a8ac0", 0.26]] as const) deco.add(cyl(0.08, 0.08, hh, 12), glass(c), at(x, 0.93 + hh / 2, z0 + 0.25));
    const bone = lam("gaBone", () => ({ color: "#e8e0c8" }));
    deco.add(new THREE.SphereGeometry(0.1, 12, 10), bone, at(-1.0, 1.03, z0 + 0.3)); deco.add(boxGeo(V(-1.05, 0.93, z0 + 0.36), V(-0.95, 0.98, z0 + 0.42)), bone);
    deco.add(cyl(0.022, 0.022, 0.2, 8), lam("gaWax", () => ({ color: "#f0e6cc" })), at(...G_BENCH_CANDLE));
    this.flame(G_BENCH_CANDLE[0], G_BENCH_CANDLE[1] + 0.15, G_BENCH_CANDLE[2], 0.05, 0.1, 3); this.glow(G_BENCH_CANDLE[0], G_BENCH_CANDLE[1] + 0.15, G_BENCH_CANDLE[2], 1.2, 0.45);
    // an anatomy chart (a drawn skeleton, no lettering) pinned on the back wall
    const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), lam("gaChart", () => ({ map: ctex("gaChartT", 140, 200, (g) => {
      g.fillStyle = "#e8dcb8"; g.fillRect(0, 0, 140, 200); g.strokeStyle = "#5a4030"; g.lineWidth = 3;
      g.beginPath(); g.arc(70, 34, 16, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(70, 50); g.lineTo(70, 120); g.stroke();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(70, 66 + i * 9, 24 - i * 2, 4, 0, 0, Math.PI * 2); g.stroke(); }
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(70, 56); g.lineTo(70 + s * 36, 100); g.stroke(); g.beginPath(); g.moveTo(70, 120); g.lineTo(70 + s * 22, 186); g.stroke(); }
    }) })));
    chart.position.set(-1.55, 1.85, z0 + 0.05); this.root.add(chart);
    // shelves on the left wall with jars and bones
    const shelf = lam("gaShelf", () => ({ color: "#4a3a2a" }));
    for (const y of [1.0, 1.5, 2.0]) {
      deco.add(boxGeo(V(x0, y, -2.6), V(x0 + 0.32, y + 0.04, -1.2)), shelf);
      for (let i = 0; i < 4; i++) { const z = -2.45 + i * 0.36; if ((i + y * 2) % 2 < 1) deco.add(cyl(0.07, 0.07, 0.22, 10), glass(["#8ab0a0", "#c8b07a", "#9a8ac0"][i % 3]), at(x0 + 0.16, y + 0.15, z)); else deco.add(cyl(0.025, 0.025, 0.28, 6), bone, at(x0 + 0.16, y + 0.06, z, Math.PI / 2, 0, 0)); }
    }
    // the door on the left wall (Victor runs out through it)
    const dg = new THREE.Group(), db = new Batch();
    doorUnit(db, 0, 0, 0.95, 2.1, 0, { frame: lam("gaCasing", () => ({ color: "#4a3a2a" })), leaf: lam("gaDoor", () => ({ map: doorTex("gaDoorT", "#5a4632", "#3e3022") })), knob: brassK() });
    db.build(dg, true); dg.position.set(x0 + 0.01, 0, 0.9); dg.rotation.y = Math.PI / 2; this.root.add(dg);
    this.glow(wx, wy0 + wh / 2, z0 + 0.1, 1.6, 0.18);
    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(t: number) { this.rain.offset.y = -t * 1.6; }
}

// ================= the cottage and the hovel (outdoor) =================
export const COTTAGE = { x0: -4.2, x1: 2.6, z0: -9.6, z1: -7.0, h: 2.7, ridge: 4.3 };
export const HOVEL = { x0: 0.6, x1: 2.6, z0: -7.0, z1: -5.5 };
export const CHINK: V3 = [1.55, 1.35, -6.97];
export const LOG: V3 = [1.6, 0, -4.4];
export class Cottage extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const grass = lam("ctGrass", () => ({ map: grassHD(), color: "#aab894" })), snow = lam("ctSnow", () => ({ color: "#eef2f6" }));
    b.add(quad(V(-80, 0, 50), V(80, 0, 50), V(80, 0, -90), V(-80, 0, -90), 50, 44), grass);
    for (let i = 0; i < 26; i++) { const x = Math.sin(i * 12.9) * 14, z = -2 - Math.abs(Math.sin(i * 7.3)) * 26; deco.add(cyl(0.6 + (i % 3) * 0.4, 0.6 + (i % 3) * 0.4, 0.02, 14), snow, at(x, 0.012 + 0.001 * i, z)); }
    // the cottage: rough stone walls, a thatched gable roof (double-sided) with soffits
    const st = lam("ctStone", () => ({ map: stone("ctStoneT", ["#9a9488", "#8a8478", "#a8a294", "#7e786e"], "#5a5650") }));
    const { x0, x1, z0, z1, h, ridge } = COTTAGE, zm = (z0 + z1) / 2;
    b.add(boxGeo(V(x0, 0, z0), V(x1, h, z1), 1.2), st);
    const thatch = lam("ctThatch", () => ({ color: "#b89a5a", side: THREE.DoubleSide })), thatch2 = lam("ctThatch2", () => ({ color: "#9a7e44" }));
    for (const s of [-1, 1]) {
      const ze = s > 0 ? z1 + 0.5 : z0 - 0.5;
      b.add(s > 0 ? quad(V(x0 - 0.4, h - 0.2, ze), V(x1 + 0.4, h - 0.2, ze), V(x1 + 0.4, ridge, zm), V(x0 - 0.4, ridge, zm), 3, 1.5)
        : quad(V(x1 + 0.4, h - 0.2, ze), V(x0 - 0.4, h - 0.2, ze), V(x0 - 0.4, ridge, zm), V(x1 + 0.4, ridge, zm), 3, 1.5), thatch);
      deco.add(boxGeo(V(x0 - 0.4, h - 0.26, Math.min(ze, s > 0 ? z1 : z0)), V(x1 + 0.4, h - 0.2, Math.max(ze, s > 0 ? z1 : z0))), thatch2);
    }
    for (const x of [x0, x1]) { const gT = new THREE.BufferGeometry(); gT.setAttribute("position", new THREE.Float32BufferAttribute(x === x1 ? [x, h, z1, x, h, z0, x, ridge, zm] : [x, h, z0, x, h, z1, x, ridge, zm], 3)); gT.computeVertexNormals(); b.add(gT, st); }
    deco.add(boxGeo(V(-3.2, h, zm - 0.3), V(-2.6, ridge + 0.8, zm + 0.3)), st); // chimney
    const casing = lam("ctCasing", () => ({ color: "#6a5440" })), knob = brassK();
    doorUnit(deco, -2.9, 0, 0.9, 2.0, z1, { frame: casing, leaf: lam("ctDoor", () => ({ map: doorTex("ctDoorT", "#6a4a32", "#4a3222") })), knob });
    const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.55) });
    windowUnit(deco, -1.2, 1.0, 0.8, 0.9, z1, { frame: casing, glass: warm, cols: 2, rows: 2, shutter: lam("ctShutter", () => ({ color: "#4a5a42" })) });
    // the hovel: a plank lean-to against the cottage's front wall (back = the cottage wall), the bright chink in it
    const plank = lam("ctPlank", () => ({ map: beam(), color: "#8a7258" }));
    const { x0: h0, x1: h1, z1: hz1 } = HOVEL;
    deco.add(boxGeo(V(h1 - 0.08, 0, z1 + 0.02), V(h1, 1.95, hz1)), plank);
    const rp = new THREE.BufferGeometry(); rp.setAttribute("position", new THREE.Float32BufferAttribute([h0, 2.05, z1 + 0.02, h1 + 0.1, 2.05, z1 + 0.02, h1 + 0.1, 1.6, hz1 + 0.2, h0, 2.05, z1 + 0.02, h1 + 0.1, 1.6, hz1 + 0.2, h0, 1.6, hz1 + 0.2], 3)); rp.computeVertexNormals();
    deco.add(rp, lam("ctHovelRoof", () => ({ map: beam(), color: "#7a6248", side: THREE.DoubleSide })));
    for (const x of [h0 + 0.05, h1 - 0.05]) deco.add(boxGeo(V(x - 0.05, 0, hz1 + 0.05), V(x + 0.05, 1.62, hz1 + 0.15)), plank);
    deco.add(boxGeo(V(h0 + 0.1, 0, z1 + 0.04), V(h1 - 0.1, 0.12, z1 + 1.2)), lam("ctStraw", () => ({ color: "#c8a860" })));
    const chink = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.2, 1.2) }));
    chink.position.set(...CHINK); chink.layers.set(NOINK); this.root.add(chink); this.glow(CHINK[0], CHINK[1], CHINK[2] + 0.05, 0.35, 0.5);
    // a log to sit on, the woodpile, pines
    const bark = lam("ctBark", () => ({ color: "#5a4030" }));
    deco.add(cyl(0.3, 0.3, 1.4, 10), bark, at(LOG[0], 0.3, LOG[2] - 0.2, 0, 0, Math.PI / 2));
    for (let i = 0; i < 6; i++) deco.add(cyl(0.1, 0.1, 0.7, 8), bark, at(-3.8 + (i % 3) * 0.22, 0.12 + Math.floor(i / 3) * 0.2, z1 + 0.5, Math.PI / 2, 0, 0));
    const needle = lam("ctPine", () => ({ color: "#2e5a44" }));
    for (const [x, z, s] of [[-7, -8, 1.4], [5.5, -9, 1.2], [7, -14, 1.6], [-9, -15, 1.5], [3.5, -15, 1.1], [-5.5, -4, 1.0], [6, -3, 1.2]] as const) pine(deco, x, z, s, needle, bark, snow);
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "ctSky", [[0, "#3a6ac0"], [0.38, "#8ab4e0"], [0.5, "#dce8f2"], [1, "#dce8f2"]]);
    backdrop(this.root, ridgeTex("ctHills", [[620, 200, 14, "#8a98b8", "#eef2f8"], [760, 90, 20, "#6a8060", null]], "#8aa070"), 260, 130, -80);
  }
}

// ================= the De Lacey cottage, inside =================
export const INSIDE = { x0: -2.6, x1: 2.6, z0: -3.0, z1: 3.4, h: 3.0 };
export const HEARTH: V3 = [-1.3, 0, -3.0];
export const IN_DOOR = { x0: 1.35, x1: 2.35, h: 2.7 };
export class CottageIn extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = INSIDE;
    const wall = lam("ciWall", () => ({ map: plaster("ciPlaster", "#a89878", "#b4a484") }));
    const floor = lam("ciFloor", () => ({ map: stone("ciFlags", ["#8a8478", "#7e786e", "#948e82"], "#5a5650") }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("ciCeil", () => ({ map: beam(), color: "#6a5440" })), false);
    holedWall(b, x0, x1, z0, h, IN_DOOR.x0, IN_DOOR.x1, 0, IN_DOOR.h, wall);
    const dusk = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ map: ctex("ciDusk", 128, 160, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#4a5a8a"); gr.addColorStop(0.55, "#a8a8c0"); gr.addColorStop(0.56, "#e8eef4"); gr.addColorStop(1, "#c8d0dc"); g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
      g.fillStyle = "#2a3a30"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10 + i * 34, 90); g.lineTo(24 + i * 34, 40); g.lineTo(38 + i * 34, 90); g.fill(); }
    }) }));
    dusk.position.set((IN_DOOR.x0 + IN_DOOR.x1) / 2, 1.5, z0 - 1.4); dusk.layers.set(NOINK); this.root.add(dusk);
    doorUnit(deco, (IN_DOOR.x0 + IN_DOOR.x1) / 2, 0, IN_DOOR.x1 - IN_DOOR.x0, IN_DOOR.h, z0, { frame: lam("ciCasing", () => ({ color: "#5a4430" })), knob: brassK() });
    // the open door leaf swung back against the wall
    deco.add(boxGeo(V(IN_DOOR.x1 + 0.12, 0, z0 + 0.05), V(IN_DOOR.x1 + 0.17, IN_DOOR.h - 0.05, z0 + 1.0)), lam("ciDoorLeaf", () => ({ map: doorTex("ciDoorT", "#6a4a32", "#4a3222") })));
    // the hearth: stone surround, fire, a pot on a crane
    const st = lam("ciHearth", () => ({ map: stone("ciHearthT", ["#7a746a", "#6a645a"], "#3a3632") })), soot = lam("ciSoot", () => ({ color: "#140e10" }));
    const [hx] = HEARTH;
    deco.add(boxGeo(V(hx - 0.8, 0, z0), V(hx - 0.5, 1.3, z0 + 0.4)), st); deco.add(boxGeo(V(hx + 0.5, 0, z0), V(hx + 0.8, 1.3, z0 + 0.4)), st);
    deco.add(boxGeo(V(hx - 0.8, 1.0, z0), V(hx + 0.8, 1.3, z0 + 0.4)), st); deco.add(boxGeo(V(hx - 0.9, 1.3, z0), V(hx + 0.9, 1.38, z0 + 0.48)), st);
    deco.add(boxGeo(V(hx - 0.5, 0, z0), V(hx + 0.5, 1.0, z0 + 0.12)), soot);
    for (const [x, y] of [[-0.18, 0.18], [0.05, 0.14], [0.2, 0.2]] as const) this.flame(hx + x, y + 0.1, z0 + 0.25, 0.26, 0.34, 2.6);
    this.glow(hx, 0.35, z0 + 0.45, 1.8, 0.55);
    deco.add(new THREE.SphereGeometry(0.16, 12, 10), lam("ciPot", () => ({ color: "#2a2a30" })), at(hx + 0.1, 0.6, z0 + 0.25));
    // the table, a bench behind it, De Lacey's chair by the fire
    const oak = lam("ciOak", () => ({ map: beam(), color: "#9a7a58" }));
    deco.add(boxGeo(V(0.0, 0.7, -2.1), V(1.3, 0.75, -1.3)), oak);
    for (const [x, z] of [[0.06, -2.05], [1.24, -2.05], [0.06, -1.35], [1.24, -1.35]] as const) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.7, z + 0.04)), oak);
    deco.add(new THREE.SphereGeometry(0.1, 10, 8), lam("ciBread", () => ({ color: "#c88a4a" })), at(0.4, 0.8, -1.7));
    const cw = lam("ciChair", () => ({ color: "#5a4030" })), cx = -1.35, cz = -1.75;
    deco.add(boxGeo(V(cx - 0.24, 0.44, cz - 0.24), V(cx + 0.24, 0.5, cz + 0.22)), cw);
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.18], [0.2, 0.18]] as const) deco.add(boxGeo(V(cx + dx - 0.025, 0, cz + dz - 0.025), V(cx + dx + 0.025, 0.44, cz + dz + 0.025)), cw);
    deco.add(boxGeo(V(cx - 0.24, 0.5, cz - 0.28), V(cx + 0.24, 1.05, cz - 0.22)), cw);
    // a little window on the left wall area: a shelf of crocks instead (keeps the wall solid)
    deco.add(boxGeo(V(x0, 1.5, -1.0), V(x0 + 0.3, 1.54, 0.4)), oak);
    for (let i = 0; i < 4; i++) deco.add(cyl(0.08, 0.1, 0.2, 10), lam(`ciCrock${i % 2}`, () => ({ color: i % 2 ? "#a86a3a" : "#d8c8a8" })), at(x0 + 0.15, 1.64, -0.85 + i * 0.35));
    b.build(this.root, false); deco.build(this.root, true);
  }
}

// ================= the river in the woods (day) / the woods near Geneva (night) =================
export const RIVER = { z0: -6.2, z1: -4.0 };
export class River extends Room {
  private water: THREE.Texture; private sky: THREE.Group; private nightSky: THREE.Group;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const grass = lam("rvGrass", () => ({ map: grassHD(), color: "#9aae80" }));
    b.add(quad(V(-80, 0, 50), V(80, 0, 50), V(80, 0, RIVER.z1), V(-80, 0, RIVER.z1), 50, 18), grass);
    b.add(quad(V(-80, 0, RIVER.z0), V(80, 0, RIVER.z0), V(80, 0, -90), V(-80, 0, -90), 50, 26), grass);
    const bank = lam("rvBank", () => ({ color: "#6a5440" }));
    b.add(boxGeo(V(-80, -0.6, RIVER.z1 - 0.15), V(80, 0, RIVER.z1)), bank); b.add(boxGeo(V(-80, -0.6, RIVER.z0), V(80, 0, RIVER.z0 + 0.15)), bank);
    this.water = flowTex("rvWater", (g, r) => {
      g.fillStyle = "#3a7ab8"; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 50; i++) { g.strokeStyle = r() < 0.5 ? "rgba(255,255,255,0.55)" : "rgba(20,60,110,0.4)"; g.lineWidth = 3 + r() * 4; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 40, y + 4 - r() * 8); g.stroke(); }
    });
    this.water.repeat.set(30, 1.5);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(160, RIVER.z1 - RIVER.z0 - 0.3), lam("rvWaterM", () => ({ map: this.water })));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -0.25, (RIVER.z0 + RIVER.z1) / 2); this.root.add(water);
    for (let i = 0; i < 12; i++) deco.add(new THREE.DodecahedronGeometry(0.2 + (i % 3) * 0.12, 0), lam("rvRock", () => ({ color: "#7a7a80" })), at(-6 + i * 1.1, -0.2, RIVER.z0 + 0.3 + (i % 4) * 0.5, i, i * 2, 0));
    const leaf = lam("rvLeaf", () => ({ color: "#4f7a34" })), trunk = lam("rvTrunk", () => ({ color: "#4a3426" })), cyp = lam("rvCypress", () => ({ color: "#1e4030" }));
    for (const [x, z, s] of [[-4.5, -2.0, 1.1], [4.2, -1.5, 1.2], [-6, -9, 1.5], [3, -10, 1.4], [8, -8, 1.3], [-9, -2, 1.3], [7, 1, 1.2], [-3, -12, 1.6]] as const) tree(deco, x, z, s, leaf, trunk);
    deco.add(new THREE.ConeGeometry(0.55, 3.4, 10), cyp, at(-1.9, 1.7, -2.6)); deco.add(cyl(0.1, 0.12, 0.4, 7), trunk, at(-1.9, 0.2, -2.6));
    b.build(this.root, false); deco.build(this.root, true);
    this.sky = new THREE.Group(); this.nightSky = new THREE.Group();
    skyDome(this.sky, "rvSky", [[0, "#2a6ad0"], [0.38, "#7ab0ea"], [0.5, "#d8e8f6"], [1, "#d8e8f6"]]);
    skyDome(this.nightSky, "rvSkyN", [[0, "#060a1c"], [0.4, "#141c3a"], [0.5, "#26305a"], [1, "#1a2240"]], 140, true);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(3, 24), new THREE.MeshBasicMaterial({ color: "#f4f0dc", fog: false })); moon.position.set(20, 30, -110); moon.layers.set(NOINK); this.nightSky.add(moon);
    this.root.add(this.sky, this.nightSky);
    backdrop(this.root, ridgeTex("rvHills", [[640, 160, 12, "#7a8ab0", "#eef2f8"], [760, 70, 18, "#5a7a4a", null]], "#6a8a50"), 260, 130, -80);
  }
  pose(t: number, night: boolean) { this.water.offset.x = -t * 0.35; this.sky.visible = !night; this.nightSky.visible = night; }
}

// ================= Justine's barn and the prison cell =================
export const BARN = { x0: -2.4, x1: 2.4, z0: -2.6, z1: 3.0, h: 2.8 };
export const HAY: V3 = [-0.1, 0.42, -0.5];
export class Barn extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = BARN;
    const boards = lam("bnBoards", () => ({ map: ctex("bnBoardsT", 512, 512, (g, r) => {
      for (let x = 0; x < 512; x += 64) { g.fillStyle = ["#6a5440", "#5e4a38", "#725a44"][Math.floor(r() * 3)]; g.fillRect(x, 0, 64, 512); g.fillStyle = "#1a1410"; g.fillRect(x, 0, 4, 512); }
      for (let i = 0; i < 80; i++) { g.strokeStyle = "rgba(0,0,0,0.12)"; g.beginPath(); const x = r() * 512; g.moveTo(x, 0); g.lineTo(x + r() * 6, 512); g.stroke(); }
    }) }));
    shell(b, x0, x1, z0, z1, h, boards, lam("bnFloor", () => ({ color: "#6a5a3a" })), lam("bnCeil", () => ({ map: beam(), color: "#4a3a2a" })), true, 2.4);
    const hay = lam("bnHay", () => ({ color: "#d8b860" })), hay2 = lam("bnHay2", () => ({ color: "#c8a44a" }));
    // a broad bed of hay under Justine (flat top at HAY.y), more heaped behind
    deco.add(boxGeo(V(-1.1, 0, -2.3), V(0.9, HAY[1], 0.6)), hay);
    for (let i = 0; i < 9; i++) deco.add(new THREE.SphereGeometry(0.45 + (i % 3) * 0.15, 12, 9), i % 2 ? hay : hay2, at(-2.0 + i * 0.5, 0.3, -2.25 + (i % 2) * 0.2, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.2, 0.8, 1)));
    // moonlight through gaps between the boards: thin bright strips on the back wall
    for (const x of [-1.6, -0.4, 1.2]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.85, 1.4) })); s.position.set(x, 1.6, z0 + 0.02); s.layers.set(NOINK); this.root.add(s); }
    deco.add(boxGeo(V(x0, 0, -1.0), V(x0 + 0.1, 1.1, 1.4)), lam("bnRail", () => ({ map: beam() })));
    this.glow(-0.4, 1.6, z0 + 0.2, 2.2, 0.2);
    b.build(this.root, false); deco.build(this.root, true);
  }
}
export const CELL = { x0: -2.0, x1: 2.0, z0: -2.4, z1: 3.0, h: 2.8 };
export const STOOL: V3 = [0.2, 0, -1.4];
export const CELL_CANDLE: V3 = [0.75, 0.02, -1.25];
export class Cell extends Room {
  private candle: number; private candleGlow: THREE.Sprite;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = CELL;
    const st = lam("ceStone", () => ({ map: stone("ceStoneT", ["#6a6670", "#5e5a64", "#74707a"], "#3a3640") }));
    shell(b, x0, x1, z0, z1, h, st, lam("ceFloor", () => ({ map: stone("ceFlags", ["#5a5660", "#4e4a54"], "#2a2830") })), st, false);
    holedWall(b, x0, x1, z0, h, -0.4, 0.4, 1.9, 2.4, st);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: "#1a2448" })); sky.position.set(0, 2.15, z0 - 0.6); sky.layers.set(NOINK); this.root.add(sky);
    const iron = lam("ceIron", () => ({ color: "#2a2a30" }));
    for (const x of [-0.26, -0.09, 0.09, 0.26]) deco.add(cyl(0.02, 0.02, 0.5, 6), iron, at(x, 2.15, z0 - 0.2));
    const wood = lam("ceStool", () => ({ color: "#5a4636" }));
    deco.add(cyl(0.2, 0.2, 0.05, 14), wood, at(STOOL[0], 0.45, STOOL[2]));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; deco.add(cyl(0.025, 0.03, 0.45, 6), wood, at(STOOL[0] + 0.13 * Math.cos(a), 0.22, STOOL[2] + 0.13 * Math.sin(a), 0.12 * Math.sin(a), 0, -0.12 * Math.cos(a))); }
    deco.add(cyl(0.025, 0.025, 0.14, 8), lam("ceWax", () => ({ color: "#efe4c8" })), at(CELL_CANDLE[0], 0.07, CELL_CANDLE[2]));
    this.candle = this.flames.length; this.flame(CELL_CANDLE[0], 0.2, CELL_CANDLE[2], 0.05, 0.1, 3);
    this.glow(CELL_CANDLE[0], 0.2, CELL_CANDLE[2], 1.0, 0.45); this.candleGlow = this.glows[this.glows.length - 1];
    deco.add(boxGeo(V(x0 + 0.05, 0, -2.2), V(x0 + 0.8, 0.4, -0.5)), lam("ceCot", () => ({ color: "#4a4038" })));
    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(lit: number) { this.flames[this.candle].s.visible = lit > 0.05; this.candleGlow.material.opacity = 0.45 * lit; }
}

// ================= the glacier (Mer de Glace) =================
export class Glacier extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const ice = lam("glIce", () => ({ map: ctex("glIceT", 512, 512, (g, r) => {
      g.fillStyle = "#e4eef8"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(120,160,210,0.35)"; g.lineWidth = 2 + r() * 3; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + 60 + r() * 80, y + 10 - r() * 20); g.stroke(); }
    }) }));
    b.add(quad(V(-90, 0, 50), V(90, 0, 50), V(90, 0, -100), V(-90, 0, -100), 40, 30), ice);
    const crev = lam("glCrevasse", () => ({ color: "#3a6aa8" }));
    for (const [x, z, w, rot] of [[-3.5, -5, 3.2, 0.2], [3.8, -7, 4.0, -0.3], [-1.0, -11, 5.0, 0.1], [5.5, -2.5, 2.4, 0.5], [-6, -1.5, 2.8, -0.4]] as const)
      deco.add(boxGeo(V(-w / 2, 0.005, -0.12), V(w / 2, 0.012, 0.12)), crev, at(x, 0, z, 0, rot, 0));
    const rock = lam("glRock", () => ({ color: "#6a6a74" }));
    deco.add(new THREE.DodecahedronGeometry(0.9, 0), rock, at(2.4, 0.55, -3.4, 0.3, 0.8, 0));
    for (let i = 0; i < 8; i++) deco.add(new THREE.DodecahedronGeometry(0.3 + (i % 3) * 0.2, 0), rock, at(-7 + i * 2.1, 0.2, -6 - (i % 3) * 3, i, i * 2, 0));
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "glSky", [[0, "#2a5ac0"], [0.36, "#7aa6e6"], [0.5, "#e6eef8"], [1, "#e6eef8"]]);
    backdrop(this.root, ridgeTex("glPeaks", [[560, 380, 14, "#8a9ac8", "#f6f9ff"], [720, 220, 18, "#6a7aa8", "#eef4ff"]], "#e4eef8"), 300, 150, -100, 850 / 1024);
  }
}

// ================= the Orkney hut =================
export const HUT = { x0: -2.4, x1: 2.4, z0: -2.8, z1: 3.2, h: 2.8 };
export const H_BENCH = { x0: -1.2, x1: -0.4, z0: -2.6, z1: -0.6, top: 0.8 };
export const H_WIN = { x: 0.95, y0: 1.25, w: 0.9, h: 1.05 };
export const H_LAMP: V3 = [-0.25, 0.85, -2.3];
export class Hut extends Room {
  private tools = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), tl = new Batch();
    const { x0, x1, z0, z1, h } = HUT;
    const st = lam("huStone", () => ({ map: stone("huStoneT", ["#7a766e", "#6a665e", "#848076"], "#4a4640") }));
    shell(b, x0, x1, z0, z1, h, st, lam("huFloor", () => ({ map: stone("huFlags", ["#6a665e", "#5e5a52"], "#3a3632") })), lam("huCeil", () => ({ map: beam(), color: "#4a3a2a" })), false);
    const { x: wx, y0: wy0, w: ww, h: wh } = H_WIN;
    holedWall(b, x0, x1, z0, h, wx - ww / 2, wx + ww / 2, wy0, wy0 + wh, st);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4), new THREE.MeshBasicMaterial({ map: ctex("huSea", 256, 256, (g, r) => {
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#0c1430"); gr.addColorStop(0.55, "#22305a"); gr.addColorStop(0.56, "#18203e"); gr.addColorStop(1, "#0c1226"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(70, 60, 16, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(230,230,200,0.5)"; g.lineWidth = 2; for (let i = 0; i < 16; i++) { const y = 150 + r() * 100; g.beginPath(); g.moveTo(40 + r() * 60, y); g.lineTo(80 + r() * 60, y); g.stroke(); }
    }) }));
    sea.position.set(wx, wy0 + wh / 2, z0 - 1.6); sea.layers.set(NOINK); this.root.add(sea);
    const frame = lam("huFrame", () => ({ color: "#5a4a38" }));
    windowUnit(deco, wx, wy0, ww, wh, z0, { frame, cols: 2, rows: 2, sill: frame });
    // the bench (along z): the sheeted form lies on it; instruments and the lamp
    const oak = lam("huOak", () => ({ map: beam(), color: "#8a7058" }));
    const { x0: b0, x1: b1, z0: bz0, z1: bz1, top } = H_BENCH;
    deco.add(boxGeo(V(b0, top - 0.06, bz0), V(b1, top, bz1)), oak);
    for (const [x, z] of [[b0 + 0.06, bz0 + 0.06], [b1 - 0.06, bz0 + 0.06], [b0 + 0.06, bz1 - 0.06], [b1 - 0.06, bz1 - 0.06]] as const) deco.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, top - 0.06, z + 0.04)), oak);
    // a side table with the instruments (swept off on "pieces")
    deco.add(boxGeo(V(-0.25, 0.8, -2.6), V(0.45, 0.85, -2.0)), oak);
    for (const [x, z] of [[-0.2, -2.55], [0.4, -2.55], [-0.2, -2.05], [0.4, -2.05]] as const) deco.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.8, z + 0.03)), oak);
    const glassM = lam("huGlass", () => ({ color: "#8ab0a0", transparent: true, opacity: 0.7 })), steel = lam("huSteel", () => ({ color: "#9a9aa4" }));
    for (const [x, z] of [[0.05, -2.45], [0.25, -2.2]] as const) tl.add(cyl(0.06, 0.06, 0.22, 10), glassM, at(x, 0.96, z));
    tl.add(boxGeo(V(0.0, 0.85, -2.15), V(0.3, 0.88, -2.08)), steel);
    tl.build(this.tools, true); this.root.add(this.tools);
    deco.add(cyl(0.07, 0.09, 0.14, 10), brassK(), at(H_LAMP[0], H_LAMP[1] + 0.07, H_LAMP[2]));
    this.flame(H_LAMP[0], H_LAMP[1] + 0.22, H_LAMP[2], 0.05, 0.1, 3); this.glow(H_LAMP[0], H_LAMP[1] + 0.25, H_LAMP[2], 1.3, 0.5);
    this.glow(wx, wy0 + wh / 2, z0 + 0.1, 1.6, 0.25);
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** swept 0 on the table .. 1 knocked to the floor */
  pose(swept: number) { this.tools.position.set(0.6 * swept, -0.8 * swept * swept, 0.4 * swept); this.tools.rotation.z = -1.4 * swept; }
}

// ================= the Arctic, and Walton's ship =================
export const SHIP = { x0: -9, x1: 3, z: -13, deck: 2.2 };
export const LANTERN: V3 = [2.2, 3.4, -11.6];
export class Arctic extends Room {
  raft = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), rb = new Batch();
    const ice = lam("arIce", () => ({ color: "#d4e0ee" })), sea = lam("arSea", () => ({ color: "#0c1222" }));
    b.add(quad(V(-120, 0, 50), V(120, 0, 50), V(120, 0, -3.0), V(-120, 0, -3.0), 30, 10), ice);
    b.add(quad(V(-120, -0.15, -3.0), V(120, -0.15, -3.0), V(120, -0.15, -40), V(-120, -0.15, -40), 30, 10), sea);
    b.add(quad(V(-120, 0, -40), V(120, 0, -40), V(120, 0, -150), V(-120, 0, -150), 30, 20), ice);
    for (let i = 0; i < 18; i++) deco.add(boxGeo(V(-1, -0.2, -0.7), V(1, 0.25, 0.7)), ice, at(-30 + i * 3.6 + Math.sin(i) * 2, 0, -4 - (i % 5) * 7 - Math.abs(Math.sin(i * 3)) * 6, 0, i * 0.7, 0, 0.6 + (i % 3) * 0.4));
    // the ship held in the ice: a dark hull, bulwark, three masts with yards, the stern lantern
    const hull = lam("arHull", () => ({ map: beam(), color: "#4a3a30" })), deckM = lam("arDeck", () => ({ map: beam(), color: "#8a7058" })), mastM = lam("arMast", () => ({ color: "#3a2e26" }));
    const { x0, x1, z, deck } = SHIP;
    b.add(boxGeo(V(x0, -0.6, z - 1.4), V(x1, deck, z + 1.4)), hull);
    const bow = new THREE.BufferGeometry(); bow.setAttribute("position", new THREE.Float32BufferAttribute([x1, -0.6, z - 1.4, x1 + 2.6, deck, z, x1, deck, z - 1.4, x1, -0.6, z + 1.4, x1, deck, z + 1.4, x1 + 2.6, deck, z, x1, -0.6, z - 1.4, x1, -0.6, z + 1.4, x1 + 2.6, deck, z], 3)); bow.computeVertexNormals(); b.add(bow, hull);
    deco.add(boxGeo(V(x0, deck, z - 1.3), V(x1, deck + 0.05, z + 1.3)), deckM);
    deco.add(boxGeo(V(x0, deck, z + 1.3), V(x1, deck + 0.6, z + 1.42)), hull);
    for (const [mx, mh] of [[-6.5, 8], [-2.5, 10], [1.2, 8.5]] as const) {
      deco.add(cyl(0.14, 0.18, mh, 8), mastM, at(mx, deck + mh / 2, z));
      for (const yy of [0.45, 0.75]) deco.add(cyl(0.06, 0.06, 4.2 - yy * 2, 6), mastM, at(mx, deck + mh * yy, z, Math.PI / 2, 0, 0));
    }
    deco.add(boxGeo(V(LANTERN[0] - 0.06, LANTERN[1] - 1.0, z + 1.36), V(LANTERN[0] + 0.06, LANTERN[1] + 0.1, z + 1.46)), mastM);
    this.flame(LANTERN[0], LANTERN[1], LANTERN[2], 0.14, 0.2, 3); this.glow(LANTERN[0], LANTERN[1], LANTERN[2], 3.0, 0.6);
    // the ice raft the creature springs onto (moved by pose)
    rb.add(boxGeo(V(-0.9, -0.15, -0.7), V(0.9, 0.12, 0.7)), ice);
    rb.build(this.raft, true); this.root.add(this.raft);
    b.build(this.root, false); deco.build(this.root, true);
    skyDome(this.root, "arSky", [[0, "#04060e"], [0.4, "#0e1630"], [0.5, "#1e2a50"], [1, "#141c36"]], 160, true);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(4, 24), new THREE.MeshBasicMaterial({ color: "#f4f0dc", fog: false })); moon.position.set(-30, 40, -130); moon.layers.set(NOINK); this.root.add(moon);
    backdrop(this.root, ridgeTex("arBergs", [[700, 160, 16, "#7a8ab0", "#dce6f4"]], null), 300, 140, -120);
  }
  pose(raft: V3) { this.raft.position.set(...raft); }
}

// ================= the ship's cabin =================
export const CABIN = { x0: -2.0, x1: 2.0, z0: -2.4, z1: 2.8, h: 2.8 };
export const BUNK = { x0: -2.0, x1: -1.15, z0: -2.35, z1: -0.25, top: 0.62 };
export const C_LANTERN: V3 = [0.3, 2.15, -1.3];
export class Cabin extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = CABIN;
    const wood = lam("cbWood", () => ({ map: beam(), color: "#8a6a50" }));
    shell(b, x0, x1, z0, z1, h, wood, lam("cbFloor", () => ({ map: planksHD(), color: "#7a6048" })), lam("cbCeil", () => ({ map: beam(), color: "#5a4636" })), false);
    holedWall(b, x0, x1, z0, h, 0.6, 1.3, 1.3, 1.9, wood);
    const view = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: ctex("cbView", 128, 96, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, "#0a1024"); gr.addColorStop(0.6, "#1e2a50"); gr.addColorStop(0.61, "#c8d4e6"); gr.addColorStop(1, "#9aa8c0"); g.fillStyle = gr; g.fillRect(0, 0, 128, 96);
    }) }));
    view.position.set(0.95, 1.6, z0 - 0.8); view.layers.set(NOINK); this.root.add(view);
    const frame = lam("cbFrame", () => ({ color: "#4a3626" }));
    windowUnit(deco, 0.95, 1.3, 0.7, 0.6, z0, { frame, cols: 2, rows: 2, sill: frame, head: false });
    // the bunk along the left wall (Victor is laid on it)
    const { x0: k0, x1: k1, z0: kz0, z1: kz1, top } = BUNK;
    deco.add(boxGeo(V(k0, 0, kz0), V(k1, top, kz1)), wood);
    deco.add(boxGeo(V(k0, top, kz0), V(k1 - 0.05, top + 0.04, kz1)), lam("cbBlanket", () => ({ color: "#6a4a4a" })));
    deco.add(boxGeo(V(k1 - 0.04, 0, kz0), V(k1 + 0.02, top + 0.22, kz1)), wood); // the bunk's front board
    deco.add(cyl(0.012, 0.012, 0.7, 6), lam("cbChain", () => ({ color: "#3a3a40" })), at(C_LANTERN[0], C_LANTERN[1] + 0.4, C_LANTERN[2]));
    deco.add(boxGeo(V(C_LANTERN[0] - 0.08, C_LANTERN[1] - 0.12, C_LANTERN[2] - 0.08), V(C_LANTERN[0] + 0.08, C_LANTERN[1] - 0.09, C_LANTERN[2] + 0.08)), brassK());
    this.flame(C_LANTERN[0], C_LANTERN[1], C_LANTERN[2], 0.07, 0.13, 3); this.glow(C_LANTERN[0], C_LANTERN[1], C_LANTERN[2], 1.6, 0.55);
    deco.add(boxGeo(V(1.2, 0, -2.3), V(1.95, 0.75, -1.5)), wood); // sea chest
    b.build(this.root, false); deco.build(this.root, true);
  }
}
