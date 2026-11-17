// Strasbourg, summer 1518 (one outdoor set, three places far apart, one sky dome):
// - the lane at the origin: cobbles along z (x -3..3), tall half-timbered houses both sides with jettied upper floors and
//   steep gables, Frau Troffea's door on the left (DOOR), a well, and the cathedral's single red-sandstone spire at the end.
// - the horse-market square at x = 60: an open cobbled square ringed with houses, the raw wooden STAGE on trestles with
//   bunting, the musicians' bench, a hitching rail.
// - the road to the shrine at x = -80: green hills, a dirt road climbing along z, trees, and the little stone CHAPEL with
//   its bell-cote at the top of the road.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const DOOR: V3 = [-2.95, 0, -0.15];
export const WELL: V3 = [1.7, 0, -7];
export const SQ: V3 = [60, 0, 0];
export const STAGE = { x0: 55.5, x1: 64.5, z0: -7.5, z1: -2.5, top: 1.0 };
export const ROAD: V3 = [-80, 0, 0];
export const CHAPEL: V3 = [-80, 0, -34];

const cobbles = () => ctex("dcCobble", 512, 512, (g, r) => {
  g.fillStyle = "#8a8078"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 22) for (let x = (y / 22) % 2 ? 0 : 13; x < 512; x += 26) {
    g.fillStyle = ["#9a9088", "#847a72", "#a49a90", "#8e8478"][Math.floor(r() * 4)];
    g.beginPath(); g.ellipse(x + 12, y + 10, 11, 9, 0, 0, Math.PI * 2); g.fill();
  }
});
/** half-timbered wall: cream plaster between dark oak posts, rails and braces */
const timber = (key: string, plaster: string) => ctex(key, 256, 256, (g) => {
  g.fillStyle = plaster; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#3a2618"; g.lineCap = "square";
  g.lineWidth = 14; for (const x of [6, 128, 250]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.lineWidth = 12; for (const y of [6, 250]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.lineWidth = 10; g.beginPath(); g.moveTo(6, 250); g.lineTo(128, 128); g.lineTo(250, 250); g.moveTo(6, 6); g.lineTo(128, 128); g.lineTo(250, 6); g.stroke();
});
const dirt = () => ctex("dcDirt", 256, 256, (g, r) => {
  g.fillStyle = "#a88a62"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "rgba(130,100,70,0.5)" : "rgba(200,170,120,0.4)"; g.fillRect(r() * 256, r() * 256, 3, 3); }
});
const bunting = () => ctex("dcBunting", 512, 64, (g) => {
  g.clearRect(0, 0, 512, 64);
  for (let i = 0; i < 16; i++) { g.fillStyle = ["#c8303a", "#e8c23a", "#3a6ab0", "#f4efe4"][i % 4]; g.beginPath(); g.moveTo(i * 32, 4); g.lineTo(i * 32 + 28, 4); g.lineTo(i * 32 + 14, 56); g.closePath(); g.fill(); }
  g.fillStyle = "#3a2a20"; g.fillRect(0, 2, 512, 4);
});
const sky = (key: string, top: string, mid: string, hor: string, stars = false) => ctex(key, 128, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(0.36, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  if (stars) for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,250,230,${0.4 + 0.6 * r()})`; g.fillRect(r() * 128, r() * 220, 1, 1); }
});
const PLASTER = ["#f2e8d2", "#e8d8b8", "#f0dcc8", "#e2e0c8", "#f4e4c0"];

export class Town extends Room {
  private dome: THREE.Mesh;
  private skies = { day: sky("dcSkyD", "#3a7ad0", "#78b0e6", "#d4e4f0"), golden: sky("dcSkyG", "#5a6aa8", "#d8a088", "#ffd08a"), moon: sky("dcSkyM", "#05081c", "#121c3e", "#26345e", true) };
  private moon: THREE.Sprite;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), fix = new Batch();
    const cob = twoTone(new THREE.MeshLambertMaterial({ map: cobbles() }));
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const road = twoTone(new THREE.MeshLambertMaterial({ map: dirt() }));
    const oak = lam("dcOak", () => ({ color: "#4a3020" })), tile = lam("dcTile", () => ({ color: "#a84a3a" })), tile2 = lam("dcTile2", () => ({ color: "#8a3a30" }));
    const stone = lam("dcStone", () => ({ color: "#b8aa94" })), sand = lam("dcSand", () => ({ color: "#c8806a" })), sand2 = lam("dcSand2", () => ({ color: "#b06a58" }));
    const wood = lam("dcWood", () => ({ color: "#9a7a52" })), glass = new THREE.MeshBasicMaterial({ color: "#3a4a5a", side: THREE.DoubleSide });
    const walls = PLASTER.map((c, i) => lam(`dcTimber${i}`, () => ({ map: timber(`dcTimberT${i}`, c) })));
    const leaf = lam("dcLeaf", () => ({ color: "#4a7a3a" })), leaf2 = lam("dcLeaf2", () => ({ color: "#5a8a44" })), bark = lam("dcBark", () => ({ color: "#5a4030" }));

    // ground: cobbles round the lane and the square, grass + a dirt road round the shrine road
    b.add(quad(V(-40, 0, 140), V(140, 0, 140), V(140, 0, -140), V(-40, 0, -140), 90, 140), cob);
    b.add(quad(V(-260, 0, 260), V(-40, 0, 260), V(-40, 0, -260), V(-260, 0, -260), 70, 160), grass);
    b.add(quad(V(-82.2, 0.01, 30), V(-77.8, 0.01, 30), V(-77.8, 0.01, -40), V(-82.2, 0.01, -40), 2, 35), road);

    /** a half-timbered house: ground floor + jettied upper floors, a steep gable to the street; front faces `dir` (+x / -x / +z) */
    const house = (x: number, z: number, w: number, d: number, floors: number, dir: "x+" | "x-" | "z+", k: number) => {
      const m = walls[k % walls.length], h0 = 3.0, hf = 2.6, jet = 0.45;
      const g = new THREE.Group(), hb = new Batch();
      // build facing +z in local space: width along x, depth along -z
      hb.add(boxGeo(V(-w / 2, 0, -d), V(w / 2, h0, 0), 1.3), m);
      for (let f = 0; f < floors; f++) hb.add(boxGeo(V(-w / 2 - 0.05, h0 + f * hf, -d), V(w / 2 + 0.05, h0 + (f + 1) * hf, jet * (f + 1)), 1.3), m);
      const top = h0 + floors * hf, gz = jet * floors;
      const gable = new THREE.BufferGeometry();
      const gh = w * 0.85;
      gable.setAttribute("position", new THREE.Float32BufferAttribute([-w / 2 - 0.1, top, gz + 0.02, w / 2 + 0.1, top, gz + 0.02, 0, top + gh, gz + 0.02], 3));
      gable.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); gable.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
      hb.add(gable, m);
      for (const s of [-1, 1]) { // the two roof slopes
        const rf = new THREE.BoxGeometry(Math.hypot(w / 2 + 0.3, gh) + 0.2, 0.18, d + gz + 0.4);
        hb.add(rf, k % 2 ? tile : tile2, new THREE.Matrix4().compose(V(s * (w / 4 + 0.05), top + gh / 2, (gz - d) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -s * Math.atan2(gh, w / 2 + 0.3))), V(1, 1, 1)));
      }
      for (let f = 0; f <= floors; f++) for (let wx = -w / 2 + 0.9; wx < w / 2 - 0.5; wx += 1.3) {
        const y = f === 0 ? 1.0 : h0 + (f - 1) * hf + 0.8, z0 = f === 0 ? 0.02 : jet * f + 0.02;
        if (f === 0 && Math.abs(wx) < 0.7) continue;
        const wm = new THREE.Mesh(quad(V(wx - 0.32, y, z0), V(wx + 0.32, y, z0), V(wx + 0.32, y + 0.9, z0), V(wx - 0.32, y + 0.9, z0)), glass); g.add(wm);
        hb.add(boxGeo(V(wx - 0.4, y - 0.08, z0 - 0.02), V(wx + 0.4, y, z0 + 0.12)), oak);
      }
      hb.add(boxGeo(V(-0.5, 0, 0), V(0.5, 2.2, 0.06)), oak); // the door
      hb.build(g, true);
      g.position.set(x, 0, z); g.rotation.y = dir === "x+" ? Math.PI / 2 : dir === "x-" ? -Math.PI / 2 : 0;
      this.root.add(g);
    };
    // ---- the lane: houses both sides from z = 8 back to z = -46 ----
    let k = 0;
    for (const side of [-1, 1]) for (let z = 8; z > -46; ) {
      const w = 5 + ((k * 7) % 3), floors = 2 + (k % 2);
      house(side * 3, z - w / 2, w, 7, floors, side < 0 ? "x+" : "x-", k++);
      z -= w + 0.15;
    }
    // the well
    deco.add(cyl(0.7, 0.75, 0.8, 16), stone, at(WELL[0], 0.4, WELL[2]));
    for (const s of [-1, 1]) deco.add(boxGeo(V(WELL[0] + s * 0.6 - 0.06, 0, WELL[2] - 0.06), V(WELL[0] + s * 0.6 + 0.06, 2.0, WELL[2] + 0.06)), oak);
    deco.add(boxGeo(V(WELL[0] - 0.8, 2.0, WELL[2] - 0.5), V(WELL[0] + 0.8, 2.1, WELL[2] + 0.5)), tile);
    // the cathedral at the end of the lane: a broad red-sandstone front, one tall tower with its open spire
    const cz = -90;
    b.add(boxGeo(V(-12, 0, cz - 20), V(12, 30, cz)), sand);
    deco.add(new THREE.CircleGeometry(4, 24), sand2, at(0, 20, cz + 0.05));
    b.add(boxGeo(V(-11, 30, cz - 10), V(-3, 64, cz - 2)), sand2);
    const sp = new THREE.ConeGeometry(4.5, 36, 8, 1); deco.add(sp, sand, at(-7, 82, cz - 6));
    for (let i = 0; i < 4; i++) deco.add(cyl(0.8, 1.1, 10, 8), sand2, at(-7 + 3.4 * Math.cos(i * 1.57 + 0.78), 69, cz - 6 + 3.4 * Math.sin(i * 1.57 + 0.78)));
    for (let i = 0; i < 6; i++) deco.add(boxGeo(V(-10 + i * 4, 4, cz + 0.01), V(-8.6 + i * 4, 14, cz + 0.3)), sand2);

    // ---- the horse-market square (x = 60): houses round three sides, the stage, bunting, a hitching rail ----
    {
      const [sx, , sz] = SQ;
      for (let i = 0; i < 4; i++) house(sx - 12 + i * 7, sz - 14, 6.5, 6, 2 + (i % 2), "z+", k++);
      for (let i = 0; i < 3; i++) { house(sx - 15, sz - 6 + i * 6.5, 6, 6, 2, "x+", k++); house(sx + 15, sz - 6 + i * 6.5, 6, 6, 3 - (i % 2), "x-", k++); }
      const { x0, x1, z0, z1, top } = STAGE;
      deco.add(boxGeo(V(x0, top - 0.15, z0), V(x1, top, z1)), wood);
      for (let x = x0 + 0.3; x < x1; x += 1.4) for (const z of [z0 + 0.3, z1 - 0.3]) deco.add(boxGeo(V(x - 0.08, 0, z - 0.08), V(x + 0.08, top - 0.15, z + 0.08)), oak);
      for (let x = x0; x < x1; x += 0.9) fix.add(boxGeo(V(x, top - 0.16, z1 - 0.02), V(x + 0.04, top, z1 + 0.02)), oak); // plank seams
      for (const x of [x0 - 0.2, x1 + 0.2]) deco.add(cyl(0.08, 0.1, 5, 6), oak, at(x, 2.5, z0 + 0.2));
      const bm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.4, 0.5), new THREE.MeshBasicMaterial({ map: bunting(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
      bm.position.set((x0 + x1) / 2, 4.7, z0 + 0.2); bm.layers.set(NOINK); this.root.add(bm);
      const bm2 = bm.clone(); bm2.position.set((x0 + x1) / 2, 4.2, z0 + 0.3); this.root.add(bm2);
      deco.add(boxGeo(V(x1 - 2.4, top, z0 + 0.4), V(x1 - 0.4, top + 0.45, z0 + 0.9)), oak); // musicians' bench
      for (let x = sx - 10; x < sx - 4; x += 1.5) deco.add(cyl(0.07, 0.07, 1.1, 6), oak, at(x, 0.55, sz + 6));
      deco.add(boxGeo(V(sx - 10, 1.0, sz + 5.95), V(sx - 4, 1.08, sz + 6.05)), oak);
    }

    // ---- the road to the shrine (x = -80): trees along a dirt road, hills, the chapel at the top ----
    {
      const [rx] = ROAD;
      const tree = (x: number, z: number, s: number) => {
        deco.add(cyl(0.2 * s, 0.3 * s, 3 * s, 7), bark, at(x, 1.5 * s, z));
        for (let i = 0; i < 4; i++) deco.add(new THREE.SphereGeometry(1.4 * s, 9, 7), i % 2 ? leaf : leaf2, at(x + Math.cos(i * 1.9) * 1.0 * s, (3.6 + 0.5 * (i % 2)) * s, z + Math.sin(i * 1.9) * 0.8 * s));
      };
      for (let i = 0; i < 14; i++) tree(rx - 5.5 - (i % 2) * 3.5 + Math.sin(i * 3) * 1.0, 20 - i * 4.5, 1.0 + 0.3 * Math.sin(i * 1.7));
      for (const [x, z, s] of [[rx - 60, -120, 60], [rx + 40, -140, 70], [rx - 10, -160, 80]] as const) deco.add(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), leaf2, at(x, -2, z).scale(V(s, s * 0.45, s)));
      const [cx, , cz2] = CHAPEL;
      b.add(boxGeo(V(cx - 3, 0, cz2 - 5), V(cx + 3, 4.5, cz2)), stone);
      const r = new THREE.ConeGeometry(1, 1, 4, 1); r.rotateY(Math.PI / 4); r.scale(6 * 0.76, 2.6, 5 * 0.76);
      deco.add(r, tile2, at(cx, 5.8, cz2 - 2.5));
      deco.add(boxGeo(V(cx - 0.6, 4.5, cz2 - 0.6), V(cx + 0.6, 7.6, cz2)), stone); // the bell-cote
      deco.add(new THREE.SphereGeometry(0.3, 10, 8), lam("dcBell", () => ({ color: "#c9a24a" })), at(cx, 6.6, cz2 - 0.2));
      fix.add(boxGeo(V(cx - 0.8, 0, cz2), V(cx + 0.8, 2.6, cz2 + 0.04)), lam("dcChapelDoor", () => ({ color: "#2a1e18" })));
      deco.add(boxGeo(V(cx - 1.4, 0, cz2 + 1.4), V(cx + 1.4, 0.3, cz2 + 3.2)), stone); // the step where the statue stands
    }

    b.build(this.root, false); deco.build(this.root, true); fix.build(this.root, false);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    const mt = ctex("dcMoon", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(0.45, "rgba(255,250,230,1)"); gr.addColorStop(0.5, "rgba(255,250,230,0.2)"); gr.addColorStop(1, "rgba(255,250,230,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false, transparent: true }));
    this.moon.scale.set(16, 16, 1); this.moon.layers.set(NOINK); this.moon.renderOrder = -1; this.root.add(this.moon);
  }
  pose(light: string, camPos: THREE.Vector3) {
    const key = light === "golden" ? "golden" : light === "moon" ? "moon" : "day";
    (this.dome.material as THREE.MeshBasicMaterial).map = this.skies[key];
    this.dome.position.copy(camPos);
    this.moon.visible = key === "moon"; this.moon.position.set(camPos.x + 30, camPos.y + 60, camPos.z - 110);
  }
}
