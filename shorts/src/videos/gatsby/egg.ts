// West Egg and the bay, summer 1922 (one outdoor set, several places far apart, one sky dome switched per light):
// - Gatsby's lawn (x -12..12, z -10..21): the mansion facade at z = -14 (cream stone, a tower on the left, ch. 1) with
//   windows that switch on one by one, a terrace (top y TERR_Y) in front, strings of coloured lanterns across the lawn
//   (switch off one by one), a band stand, a garden wall on the right (x = 9) with an iron gate that swings open, and a
//   sea wall at z = 21.5.
// - the bay (z > 21.5, water y WATER_Y) with Gatsby's dock running out to z = 34 at x = 0; the far (East Egg) shore from
//   z = 50 with Daisy's red-and-white Georgian house and her dock, the GREEN LIGHT at its end (HDR, blooms).
// - the marble pool at x = -40 with the pool house wall behind it (z = -6, faces +z): Wilson's shadow lands there.
// - the flashback spot at x = 40: a big shade tree on a summer lawn (Louisville, 1917).
// - the graveyard at x = 150: wet grass, headstones, the open grave and Gatsby's coffin, an empty flower stand.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD, stoneHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const TERR_Y = 0.6;
export const WATER_Y = -0.55;
export const DOCK = { x: 0, z0: 21.5, z1: 34, y: 0.15, w: 1.6 };
export const GREEN: V3 = [14, 1.75, 44];
export const DAISY_DOCK = { a: [21, 53] as [number, number], b: [14.4, 44.6] as [number, number] };
export const GATE: V3 = [9, 0, 3];
export const POOL = { x: -40, z: 0, w: 9, d: 5, y: -0.2 };
export const POOL_WALL_Z = -6.2;
export const TREE: V3 = [46, 0, -2];
export const GRAVE: V3 = [152, 0, -1.5];
export const LANTERN_N = 48;
export const WINDOW_N = 26;

const navySky = (stars: boolean, key: string, top: string, mid: string, hor: string) => ctex(key, 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, top); gr.addColorStop(0.35, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  if (stars) for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,250,230,${0.4 + 0.6 * r()})`; const s = r() < 0.08 ? 2 : 1; g.fillRect(r() * 512, r() * 220, s, s); }
});
const overcast = () => ctex("eggSkyRain", 512, 512, (g, r) => {
  g.fillStyle = "#aeb4ba"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,146,156,0.4)" : "rgba(196,200,206,0.4)"; g.beginPath(); g.ellipse(r() * 512, r() * 256, 40 + r() * 80, 12 + r() * 20, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#c4c8cc"; g.fillRect(0, 256, 512, 256);
});
const moonTex = () => ctex("eggMoon", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(0.45, "rgba(255,250,230,1)"); gr.addColorStop(0.5, "rgba(255,250,230,0.25)"); gr.addColorStop(1, "rgba(255,250,230,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const glowTex = () => ctex("eggGlow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** distant Long Island shore: dark tree line with a few lit houses (transparent above) */
const shoreTex = (night: boolean) => ctex(night ? "eggShoreN" : "eggShoreD", 2048, 256, (g, r) => {
  g.clearRect(0, 0, 2048, 256);
  const tree = night ? "#1e2a3a" : "#4a6a4a", tree2 = night ? "#26324a" : "#5a7a52";
  for (let x = 0; x < 2048; x += 14 + r() * 26) { g.fillStyle = r() < 0.5 ? tree : tree2; g.beginPath(); g.ellipse(x, 170 + r() * 10, 18 + r() * 22, 30 + r() * 26, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = tree; g.fillRect(0, 175, 2048, 81);
  if (night) for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(255,214,140,0.95)"; g.fillRect(r() * 2048, 168 + r() * 30, 4, 3); }
});
const flagstones = () => ctex("eggFlags", 512, 512, (g, r) => {
  g.fillStyle = "#cfc4ae"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = ["#d8cdb6", "#c8bca4", "#e0d6c2"][Math.floor(r() * 3)]; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
});
const planks = () => ctex("eggPlanks", 256, 256, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = ["#8a6a4a", "#7a5c40", "#94704e"][Math.floor(r() * 3)]; g.fillRect(i * 32, 0, 32, 256); g.fillStyle = "#3a2a20"; g.fillRect(i * 32, 0, 3, 256); }
});
const brickTex = () => ctex("eggBrick", 256, 256, (g) => {
  g.fillStyle = "#b8584a"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#e8dccc"; for (let y = 0; y < 256; y += 16) g.fillRect(0, y, 256, 2);
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) g.fillRect(x, y, 2, 16);
});
const tileTex = () => ctex("eggPoolTile", 256, 256, (g) => {
  g.fillStyle = "#7ac8d8"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#5aa8c0"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); }
});

type Lamp = { m: THREE.Mesh; col: THREE.Color };

export class Egg extends Room {
  private dome: THREE.Mesh;
  private skies = { night: navySky(true, "eggSkyN", "#05081c", "#0e1838", "#24345e"), day: navySky(false, "eggSkyD", "#3f7fd0", "#78aee6", "#d0e2f0"),
    golden: navySky(false, "eggSkyG", "#6a5a9a", "#e8a07a", "#ffd08a"), rain: overcast() };
  private moon: THREE.Sprite;
  private shores: THREE.Mesh[] = [];
  private shoreTex = { night: shoreTex(true), day: shoreTex(false) };
  private windows: THREE.Mesh[] = [];
  private winLit = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.95, 0.32) });
  private winDark = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1a2036") });
  private winDay = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5a6a8a") });
  private lamps: Lamp[] = [];
  private lampOff = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2a2a34") });
  private green: THREE.Sprite; private greenCore: THREE.Mesh;
  private gateL = new THREE.Group(); private gateR = new THREE.Group();
  private daisyWins: THREE.Mesh[] = [];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const water = twoTone(new THREE.MeshLambertMaterial({ color: "#2a4a6a" }));
    const flags = twoTone(new THREE.MeshLambertMaterial({ map: flagstones() }));
    const stoneM = lam("eggStone", () => ({ map: stoneHD("eggStoneHD", ["#e8dcc4", "#e0d2b8", "#ece2cc", "#d8caae"], "#b4a68c") }));
    const roofM = lam("eggRoof", () => ({ color: "#5a5e78" }));
    const trim = lam("eggTrim", () => ({ color: "#f4eee2" }));
    const wood = lam("eggPlanksM", () => ({ map: planks() }));
    const post = lam("eggPost", () => ({ color: "#5a4030" }));
    const iron = lam("eggIron", () => ({ color: "#26242c" }));
    const brick = lam("eggBrickM", () => ({ map: brickTex() }));
    const ivy = lam("eggIvy", () => ({ color: "#4a7a3a" }));
    const hedge = lam("eggHedge", () => ({ color: "#3e6e36" })), hedge2 = lam("eggHedge2", () => ({ color: "#4a7e40" }));
    const bark = lam("eggBark", () => ({ color: "#6a4a34" }));
    const marble = lam("eggMarble", () => ({ color: "#f2eee6" }));
    const tile = twoTone(new THREE.MeshLambertMaterial({ map: tileTex() }));
    const poolWater = twoTone(new THREE.MeshLambertMaterial({ color: "#4ab0cc", transparent: true, opacity: 0.88 }));
    const greyStone = lam("eggGrave", () => ({ color: "#9a9a9e" })), dirt = lam("eggDirt", () => ({ color: "#5a4234" }));
    const coffin = lam("eggCoffin", () => ({ color: "#4a2e22" })), brass = lam("eggBrass", () => ({ color: "#d9b04a" }));
    const white = lam("eggWhite", () => ({ color: "#f4f0e8" })), canvas = lam("eggAwning", () => ({ color: "#d84a4a" }));

    // ---- ground: lawns everywhere on the land, the bay between z 21.5 and 50 ----
    // ground with a hole for the pool basin
    const holed = (y: number, X0: number, X1: number, Z0: number, Z1: number, hx0: number, hx1: number, hz0: number, hz1: number, m: THREE.Material, t: number) => {
      const q = (a: number, c: number, d: number, e: number) => b.add(quad(V(a, y, e), V(c, y, e), V(c, y, d), V(a, y, d), (c - a) / t, (e - d) / t), m);
      q(X0, X1, Z0, hz0); q(X0, X1, hz1, Z1); q(X0, hx0, hz0, hz1); q(hx1, X1, hz0, hz1);
    };
    holed(0, -260, 260, -260, 21.5, POOL.x - POOL.w / 2, POOL.x + POOL.w / 2, POOL.z - POOL.d / 2, POOL.z + POOL.d / 2, grass, 3.2);
    b.add(quad(V(-260, 0, 260), V(260, 0, 260), V(260, 0, 50), V(-260, 0, 50), 160, 60), grass);
    b.add(quad(V(-260, WATER_Y, 50), V(260, WATER_Y, 50), V(260, WATER_Y, 21.5), V(-260, WATER_Y, 21.5)), water);
    // sea walls (stone) along both shores
    deco.add(boxGeo(V(-260, WATER_Y - 0.4, 21.3), V(260, 0.05, 21.7)), stoneM);
    deco.add(boxGeo(V(-260, WATER_Y - 0.4, 49.8), V(260, 0.05, 50.2)), stoneM);

    // ---- the mansion: facade at z -14, three storeys, a tower on the left, a raw-ivy beard ----
    const fz = -14, mx0 = -13, mx1 = 13, mh = 10.5;
    b.add(boxGeo(V(mx0, 0, fz - 10), V(mx1, mh, fz), 2.5), stoneM);
    const roof = new THREE.ConeGeometry(1, 1, 4, 1); roof.rotateY(Math.PI / 4); roof.scale((mx1 - mx0) * 0.72, 3.6, 10 * 0.72);
    deco.add(roof, roofM, at(0, mh + 1.8, fz - 5));
    // tower (left)
    b.add(boxGeo(V(-17.5, 0, fz - 6), V(-12.5, mh + 5.5, fz + 0.6), 2.5), stoneM);
    const tRoof = new THREE.ConeGeometry(3.9, 5.5, 4, 1); tRoof.rotateY(Math.PI / 4);
    deco.add(tRoof, roofM, at(-15, mh + 8.25, fz - 2.7));
    for (const x of [-16, -14]) for (const y of [2.2, 5.6, 9.0, 12.6]) this.win(x - 0.45, x + 0.45, y, y + 1.6, fz + 0.62);
    // cornices + string courses
    for (const y of [3.6, 7.1]) fix.add(boxGeo(V(mx0, y, fz), V(mx1, y + 0.2, fz + 0.18)), trim);
    fix.add(boxGeo(V(mx0 - 0.2, mh - 0.1, fz - 10.2), V(mx1 + 0.2, mh + 0.25, fz + 0.3)), trim);
    // windows: three storeys x 7 bays (the centre ground bay is the door)
    for (const [y0, y1] of [[1.0, 3.0], [4.4, 6.4], [7.8, 9.6]]) for (let i = 0; i < 7; i++) {
      const x = -9.6 + i * 3.2;
      if (y0 === 1.0 && i === 3) continue;
      this.win(x - 0.62, x + 0.62, y0, y1, fz + 0.02);
      fix.add(boxGeo(V(x - 0.8, y0 - 0.15, fz), V(x + 0.8, y0, fz + 0.2)), trim);
    }
    // the door: tall double door under a pediment
    this.win(-0.9, 0.9, 1.0, 3.6, fz + 0.02);
    fix.add(new THREE.ConeGeometry(1.6, 0.7, 3, 1).rotateZ(0).rotateY(Math.PI / 2).scale(1, 1, 0.25), trim, at(0, 4.0, fz + 0.12));
    // ivy patches climbing the facade
    for (let i = 0; i < 26; i++) { const x = mx0 + 0.5 + ((i * 7.3) % (mx1 - mx0 - 1)), y = 0.5 + ((i * 3.1) % 4.2); deco.add(new THREE.SphereGeometry(0.55 + 0.25 * Math.sin(i), 8, 6), ivy, at(x, y, fz + 0.12).scale(V(1.1, 1.3, 0.3))); }
    // terrace: flagstones raised TERR_Y, balustrade with a gap for steps in the middle
    b.add(boxGeo(V(-12, 0, fz), V(12, TERR_Y, fz + 4.5)), stoneM);
    b.add(quad(V(-12, TERR_Y + 0.005, fz + 4.5), V(12, TERR_Y + 0.005, fz + 4.5), V(12, TERR_Y + 0.005, fz), V(-12, TERR_Y + 0.005, fz), 8, 2), flags);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(-2, 0, fz + 4.5 + k * 0.3), V(2, TERR_Y - k * 0.2, fz + 4.8 + k * 0.3)), stoneM);
    for (const [x0, x1] of [[-12, -2.2], [2.2, 12]]) {
      deco.add(boxGeo(V(x0, TERR_Y + 0.85, fz + 4.3), V(x1, TERR_Y + 1.0, fz + 4.6)), trim);
      for (let x = x0 + 0.2; x < x1; x += 0.35) deco.add(cyl(0.06, 0.08, 0.85, 6), trim, at(x, TERR_Y + 0.42, fz + 4.45));
    }
    // urns on the terrace corners
    for (const x of [-11.6, -2.4, 2.4, 11.6]) { deco.add(cyl(0.35, 0.2, 0.6, 10), trim, at(x, TERR_Y + 1.3, fz + 4.45)); deco.add(new THREE.SphereGeometry(0.45, 8, 6), hedge, at(x, TERR_Y + 1.8, fz + 4.45)); }

    // ---- lawn dressing: clipped hedges, a band stand with a striped awning, lantern strings on poles ----
    for (let x = -12; x <= 12; x += 1.4) if (Math.abs(x) > 2.3) deco.add(boxGeo(V(x - 0.65, 0, fz + 4.7), V(x + 0.65, 0.7, fz + 5.3)), x % 2.8 ? hedge : hedge2);
    deco.add(boxGeo(V(-9.5, 0, -6.5), V(-5.5, 0.5, -3.5)), wood); // band stand
    for (const [x, z] of [[-9.4, -6.4], [-5.6, -6.4], [-9.4, -3.6], [-5.6, -3.6]]) deco.add(cyl(0.06, 0.06, 2.4, 6), trim, at(x, 1.7, z));
    deco.add(boxGeo(V(-9.7, 2.9, -6.7), V(-5.3, 3.0, -3.3)), canvas);
    // music stands on the band stand
    for (let i = 0; i < 4; i++) { deco.add(cyl(0.02, 0.02, 1.0, 4), iron, at(-9 + i * 1.0, 1.0, -5.2)); deco.add(boxGeo(V(-9.2 + i, 1.4, -5.25), V(-8.8 + i, 1.7, -5.15)), white); }
    // the coupe tower table
    deco.add(boxGeo(V(3.4, 0.74, -6.0), V(5.6, 0.8, -4.6)), white);
    for (const [x, z] of [[3.5, -5.9], [5.5, -5.9], [3.5, -4.7], [5.5, -4.7]]) deco.add(cyl(0.04, 0.04, 0.74, 5), iron, at(x, 0.37, z));
    // poles + lanterns: 4 strings across the lawn (x -11..11) at z = -8, -2, 4, 10
    const lampCols = ["#ff5a4a", "#ffd24a", "#4ad2ff", "#6aff8a", "#ff8ad8", "#ffa24a"];
    let li = 0;
    for (const z of [-8, -2, 4, 10]) {
      for (const x of [-11, 11]) deco.add(cyl(0.07, 0.09, 4.2, 6), post, at(x, 2.1, z));
      for (let k = 0; k < 12; k++) {
        const u = (k + 0.5) / 12, x = -11 + 22 * u, y = 4.0 - 1.1 * 4 * u * (1 - u);
        const c = new THREE.Color(lampCols[(k + li) % lampCols.length]).multiplyScalar(2.2);
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: c }));
        m.position.set(x, y, z); m.layers.set(NOINK); this.root.add(m); this.lamps.push({ m, col: c });
      }
      for (let k = 0; k < 24; k++) { const u0 = k / 24, u1 = (k + 1) / 24; const p0 = V(-11 + 22 * u0, 4.0 - 4.4 * u0 * (1 - u0), z), p1 = V(-11 + 22 * u1, 4.0 - 4.4 * u1 * (1 - u1), z); const mid = p0.clone().add(p1).multiplyScalar(0.5); fix.add(cyl(0.012, 0.012, p0.distanceTo(p1), 3), iron, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize()), V(1, 1, 1))); }
      li += 3;
    }

    // ---- garden wall on the right with the iron gate (opening z 2..4 at x = 9) ----
    for (const [z0, z1] of [[-9.5, 2], [4, 21]]) deco.add(boxGeo(V(9, 0, z0), V(9.5, 1.6, z1)), stoneM);
    for (const z of [2, 4]) { deco.add(boxGeo(V(8.9, 0, z - 0.3), V(9.6, 2.2, z + 0.3)), stoneM); deco.add(new THREE.SphereGeometry(0.3, 8, 6), trim, at(9.25, 2.45, z)); }
    const gateBars = (g: THREE.Group, dir: number) => {
      const gb = new Batch();
      for (let k = 0; k < 6; k++) gb.add(cyl(0.025, 0.025, 1.8, 4), iron, at(0, 0.95, dir * (0.12 + k * 0.16)));
      for (const y of [0.25, 1.75]) gb.add(boxGeo(V(-0.03, y - 0.04, dir > 0 ? 0 : -0.95), V(0.03, y + 0.04, dir > 0 ? 0.95 : 0)), iron);
      gb.build(g, true);
    };
    gateBars(this.gateL, 1); gateBars(this.gateR, -1);
    this.gateL.position.set(9.25, 0, 2.05); this.gateR.position.set(9.25, 0, 3.95);
    this.root.add(this.gateL, this.gateR);
    // gravel drive outside the gate
    b.add(quad(V(9.6, 0.004, 4.5), V(30, 0.004, 4.5), V(30, 0.004, 1.5), V(9.6, 0.004, 1.5), 6, 1), flags);

    // ---- Gatsby's dock: planks on posts from the sea wall to z 34, a mooring post at the end ----
    const { x: dx, z0: dz0, z1: dz1, y: dy, w: dw } = DOCK;
    deco.add(boxGeo(V(dx - dw / 2, dy - 0.12, dz0), V(dx + dw / 2, dy, dz1), 0), wood);
    for (let z = dz0 + 1; z <= dz1; z += 2.5) for (const s of [-1, 1]) deco.add(cyl(0.1, 0.1, 1.8, 6), post, at(dx + s * (dw / 2 - 0.05), dy - 0.6, z));
    for (const s of [-1, 1]) deco.add(cyl(0.12, 0.12, 0.9, 8), post, at(dx + s * 0.55, dy + 0.45, dz1 - 0.2));

    // ---- the far shore: Daisy's red-and-white Georgian house, lawn down to the water, her dock + the green light ----
    const hx = 30, hz = 66;
    b.add(boxGeo(V(hx - 9, 0, hz - 6), V(hx + 9, 8, hz + 4)), brick);
    const dRoof = new THREE.ConeGeometry(1, 1, 4, 1); dRoof.rotateY(Math.PI / 4); dRoof.scale(18 * 0.72, 3, 10 * 0.72);
    deco.add(dRoof, roofM, at(hx, 9.5, hz - 1));
    fix.add(boxGeo(V(hx - 9.1, 7.8, hz - 6.1), V(hx + 9.1, 8.1, hz + 4.15)), trim);
    for (const y of [1.2, 4.6]) for (let i = 0; i < 5; i++) { const x = hx - 7 + i * 3.5; const m = this.win(x - 0.55, x + 0.55, y, y + 1.8, hz + 4.05, true); this.daisyWins.push(m); fix.add(boxGeo(V(x - 0.75, y - 0.15, hz + 4), V(x + 0.75, y + 1.95, hz + 4.08)), trim); }
    for (let i = 0; i < 4; i++) deco.add(cyl(0.25, 0.25, 6.5, 10), trim, at(hx - 3 + i * 2, 3.25, hz + 4.8)); // portico columns
    deco.add(boxGeo(V(hx - 4, 6.5, hz + 4), V(hx + 4, 6.9, hz + 5.4)), trim);
    {
      const [ax, az] = DAISY_DOCK.a, [bx, bz] = DAISY_DOCK.b, len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
      const dg = new Batch();
      dg.add(boxGeo(V(-0.7, dy - 0.12, 0), V(0.7, dy, len)), wood);
      for (let z = 1; z <= len; z += 2.5) for (const s of [-1, 1]) dg.add(cyl(0.1, 0.1, 1.8, 6), post, at(s * 0.65, dy - 0.6, z));
      dg.add(cyl(0.06, 0.08, 1.6, 6), iron, at(0, dy + 0.8, len - 0.3)); // the light's post
      const dock = new THREE.Group(); dg.build(dock, true); dock.position.set(ax, 0, az); dock.rotation.y = ang; this.root.add(dock);
    }
    this.greenCore = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 4.2, 1.2) }));
    this.greenCore.position.set(...GREEN); this.greenCore.layers.set(NOINK); this.root.add(this.greenCore);
    this.green = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(0.25, 1.6, 0.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.green.position.set(...GREEN); this.green.scale.set(1, 1, 1); this.green.layers.set(NOINK); this.green.renderOrder = 5; this.root.add(this.green);
    // far-shore trees
    const tree = (x: number, z: number, s: number) => {
      deco.add(cyl(0.18 * s, 0.28 * s, 3.5 * s, 7), bark, at(x, 1.75 * s, z));
      for (let i = 0; i < 4; i++) deco.add(new THREE.SphereGeometry(1.5 * s, 9, 7), i % 2 ? hedge : hedge2, at(x + Math.cos(i * 1.9) * 1.1 * s, (4 + 0.6 * (i % 2)) * s, z + Math.sin(i * 1.9) * 0.9 * s));
    };
    for (const [x, z, s] of [[12, 62, 1.3], [46, 60, 1.4], [6, 75, 1.5], [54, 74, 1.6], [-10, 60, 1.4], [-24, 66, 1.5], [70, 62, 1.4], [-18, -6, 1.5], [17, -4, 1.4], [-24, 10, 1.6], [20, 16, 1.3], [-20, 18, 1.3]] as const) tree(x, z, s);

    // ---- the pool (x = -40): marble coping, tiled basin, water, the pool house wall behind with an awning ----
    {
      const { x, z, w, d, y } = POOL;
      holed(0.006, x - w / 2 - 2.5, x + w / 2 + 2.5, POOL_WALL_Z, z + d / 2 + 3, x - w / 2, x + w / 2, z - d / 2, z + d / 2, flags, 2);
      b.add(quad(V(x - w / 2, -1.6, z + d / 2), V(x + w / 2, -1.6, z + d / 2), V(x + w / 2, -1.6, z - d / 2), V(x - w / 2, -1.6, z - d / 2), 4, 2), tile);
      for (const [a, c] of [[V(x - w / 2, -1.6, z - d / 2), V(x + w / 2, 0.01, z - d / 2 + 0.01)], [V(x - w / 2, -1.6, z + d / 2 - 0.01), V(x + w / 2, 0.01, z + d / 2)],
        [V(x - w / 2, -1.6, z - d / 2), V(x - w / 2 + 0.01, 0.01, z + d / 2)], [V(x + w / 2 - 0.01, -1.6, z - d / 2), V(x + w / 2, 0.01, z + d / 2)]] as const) b.add(boxGeo(a, c, 1), tile);
      const wm = new THREE.Mesh(quad(V(x - w / 2, y, z + d / 2), V(x + w / 2, y, z + d / 2), V(x + w / 2, y, z - d / 2), V(x - w / 2, y, z - d / 2)), poolWater);
      wm.receiveShadow = true; this.root.add(wm);
      for (const s of [-1, 1]) { deco.add(boxGeo(V(x - w / 2 - 0.4, 0, z + s * d / 2 - (s < 0 ? 0.4 : 0)), V(x + w / 2 + 0.4, 0.12, z + s * d / 2 + (s > 0 ? 0.4 : 0))), marble); deco.add(boxGeo(V(x + s * w / 2 - (s < 0 ? 0.4 : 0), 0, z - d / 2), V(x + s * w / 2 + (s > 0 ? 0.4 : 0), 0.12, z + d / 2)), marble); }
      // the pool house: a cream wall with a door and an awning, potted palms, a deck chair
      b.add(boxGeo(V(x - 8, 0, POOL_WALL_Z - 3), V(x + 8, 4.2, POOL_WALL_Z), 2.5), stoneM);
      fix.add(boxGeo(V(x - 8.2, 4.2, POOL_WALL_Z - 3.2), V(x + 8.2, 4.45, POOL_WALL_Z + 0.2)), trim);
      this.win(x + 4.4, x + 5.6, 0.0, 2.4, POOL_WALL_Z + 0.02, false, "#4a3a3a");
      deco.add(boxGeo(V(x + 3.8, 2.6, POOL_WALL_Z), V(x + 6.2, 2.7, POOL_WALL_Z + 1.2)), canvas);
      for (const px of [x - 6.5, x + 7]) { deco.add(cyl(0.35, 0.28, 0.6, 10), brick, at(px, 0.3, POOL_WALL_Z + 0.8)); for (let i = 0; i < 5; i++) deco.add(boxGeo(V(-0.06, 0, -0.9), V(0.06, 0.04, 0.9)), hedge, at(px, 1.4, POOL_WALL_Z + 0.8, 0.5, i * 1.25, 0)); deco.add(cyl(0.06, 0.08, 1.4, 6), bark, at(px, 1.0, POOL_WALL_Z + 0.8)); }
    }

    // ---- the flashback tree (x = 46): a broad shade tree, a white bench ----
    {
      const [tx, , tz] = TREE;
      deco.add(cyl(0.45, 0.7, 5, 10), bark, at(tx, 2.5, tz));
      for (let i = 0; i < 7; i++) deco.add(new THREE.SphereGeometry(2.4, 10, 8), i % 2 ? hedge : hedge2, at(tx + Math.cos(i * 0.9) * 2.4, 5.6 + 0.8 * Math.sin(i * 1.7), tz + Math.sin(i * 0.9) * 1.8));
      deco.add(boxGeo(V(tx - 1.6, 0.42, tz + 1.4), V(tx + 0.4, 0.5, tz + 1.9)), white);
      for (const x of [tx - 1.5, tx + 0.3]) deco.add(boxGeo(V(x - 0.05, 0, tz + 1.45), V(x + 0.05, 0.42, tz + 1.85)), white);
      // a flower arch for the wedding (shot 6)
      for (let i = 0; i < 14; i++) { const a = (i / 13) * Math.PI; deco.add(new THREE.SphereGeometry(0.28, 8, 6), i % 2 ? white : lam("eggRose", () => ({ color: "#f2b0c0" })), at(tx + 4 + 1.6 * Math.cos(a), 2.4 * Math.sin(a), tz + 4.5)); }
      for (const s of [-1, 1]) deco.add(cyl(0.05, 0.05, 2.4, 5), white, at(tx + 4 + s * 1.6, 1.2, tz + 4.5));
    }

    // ---- the graveyard (x = 152): headstones, the open grave, the coffin on its straps, an empty flower stand ----
    {
      const [gx, , gz] = GRAVE;
      b.add(boxGeo(V(gx - 1.2, -0.05, gz - 0.5), V(gx + 1.2, 0.0, gz + 0.5)), dirt);
      deco.add(boxGeo(V(gx - 1.6, 0, gz - 1.1), V(gx + 1.6, 0.35, gz - 0.6)), dirt); // the dug earth
      deco.add(boxGeo(V(gx - 1.0, 0.05, gz - 0.32), V(gx + 1.0, 0.55, gz + 0.32)), coffin);
      deco.add(boxGeo(V(gx - 1.02, 0.55, gz - 0.34), V(gx + 1.02, 0.62, gz + 0.34)), coffin);
      for (const x of [gx - 0.8, gx + 0.8]) deco.add(boxGeo(V(x - 0.06, 0.3, gz + 0.32), V(x + 0.06, 0.36, gz + 0.36)), brass);
      for (const s of [-1, 1]) deco.add(boxGeo(V(gx - 1.4, 0.02, gz + s * 0.45 - 0.05), V(gx + 1.4, 0.06, gz + s * 0.45 + 0.05)), lam("eggStrap", () => ({ color: "#3a3a40" })));
      // the empty flower stand: a wire tripod with an empty ring on top, by the head of the coffin
      const fsx = gx + 1.75, fsz = gz + 0.4;
      for (const a of [0, 2.1, 4.2]) deco.add(cyl(0.012, 0.012, 1.1, 4), iron, at(fsx + 0.15 * Math.cos(a), 0.5, fsz + 0.15 * Math.sin(a), 0.14 * Math.sin(a), 0, -0.14 * Math.cos(a)));
      deco.add(new THREE.TorusGeometry(0.22, 0.02, 6, 20), iron, at(fsx, 1.05, fsz, Math.PI / 2, 0, 0));
      // headstones in rows behind
      for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) {
        const x = gx - 7 + i * 2.4 + (r % 2) * 1.1, z = gz - 4 - r * 3.2, h = 0.7 + 0.35 * Math.abs(Math.sin(i * 3 + r));
        if (Math.abs(x - gx) < 1.4 && r === 0) continue;
        deco.add(boxGeo(V(x - 0.35, 0, z - 0.1), V(x + 0.35, h, z + 0.1)), greyStone);
        deco.add(cyl(0.35, 0.35, 0.2, 10, ), greyStone, at(x, h, z, Math.PI / 2, 0, 0));
      }
      for (const [x, z, s] of [[gx - 9, gz - 12, 1.6], [gx + 8, gz - 10, 1.5], [gx + 2, gz - 18, 1.8]] as const) tree(x, z, s);
    }

    b.build(this.root, false);
    deco.build(this.root, true);
    fix.build(this.root, false);
    // ---- sky dome, moon, distant shore ring ----
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(240, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.night, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), fog: false, depthWrite: false, transparent: true }));
    this.moon.scale.set(16, 16, 1); this.moon.layers.set(NOINK); this.moon.renderOrder = -1; this.root.add(this.moon);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2, r = 200;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(330, 41), new THREE.MeshBasicMaterial({ map: this.shoreTex.night, transparent: true, alphaTest: 0.05, fog: false }));
      m.position.set(r * Math.sin(a), 12, r * Math.cos(a)); m.rotation.y = a + Math.PI; m.layers.set(NOINK); this.root.add(m); this.shores.push(m);
    }
  }

  /** a window pane (upright quad facing +z); lit ones are tracked so pose() can switch them */
  private win(x0: number, x1: number, y0: number, y1: number, z: number, daisy = false, col?: string) {
    const m = new THREE.Mesh(quad(V(x0, y0, z), V(x1, y0, z), V(x1, y1, z), V(x0, y1, z)), col ? new THREE.MeshBasicMaterial({ color: col }) : this.winDark);
    m.layers.set(NOINK); this.root.add(m);
    if (!col && !daisy) this.windows.push(m);
    return m;
  }

  /** per-shot pose. light picks sky + moon; lit = windows on (0..1, in pop order); lamps = lanterns on (0..1);
   *  gate 0 shut .. 1 open; green = the green light's pulse (0 = off) */
  pose(light: string, o: { lit: number; lamps: number; gate: number; green: number; camPos?: THREE.Vector3 }) {
    const key = light === "golden" ? "golden" : light === "day" ? "day" : light === "lab" ? "rain" : "night";
    (this.dome.material as THREE.MeshBasicMaterial).map = this.skies[key];
    const night = key === "night";
    this.moon.visible = night;
    if (o.camPos) { this.moon.position.set(o.camPos.x + 50, o.camPos.y + 70, o.camPos.z + 120); this.dome.position.copy(o.camPos); }
    for (const s of this.shores) (s.material as THREE.MeshBasicMaterial).map = night ? this.shoreTex.night : this.shoreTex.day;
    const nOn = Math.round(o.lit * this.windows.length);
    this.windows.forEach((w, i) => { w.material = !night ? this.winDay : (i * 7) % this.windows.length < nOn ? this.winLit : this.winDark; });
    for (const w of this.daisyWins) w.material = night ? this.winLit : this.winDay;
    const nL = Math.round(o.lamps * this.lamps.length);
    this.lamps.forEach((l, i) => { l.m.visible = night || o.lamps > 0; (l.m.material as THREE.MeshBasicMaterial).color.copy((i * 5) % this.lamps.length < nL ? l.col : this.lampOff.color); });
    this.gateL.rotation.y = -1.3 * o.gate; this.gateR.rotation.y = 1.3 * o.gate;
    const g = Math.max(0, o.green);
    this.green.visible = this.greenCore.visible = g > 0;
    this.green.scale.setScalar(0.7 + 0.5 * g); (this.green.material as THREE.SpriteMaterial).opacity = Math.min(1, 0.5 + 0.5 * g);
  }
}
