// The Campion district, Western Australia, 1932: a red-dirt track along x (z -1.5..1.5), a bare stubble paddock on the
// near side (z > 1.5), a wire fence at z = -1.6 and the wheat field behind it (instanced stalk tufts), a weatherboard
// farmhouse with a corrugated-iron roof and a water tank, the dam (an earth tank) with reeds, a windmill pump and gum
// trees around x = 19, a flat painted horizon, a sky dome (blue by day, peach at golden hour) and the army truck.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, roofHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

/** the dam's centre (water surface y = -0.06, radius 4.2) and the windmill */
export const DAM: V3 = [19, 0, -8];
export const MILL: V3 = [24.5, 0, -12];
/** the Lewis gun on its tripod by the dam (muzzle toward -z) */
export const AMBUSH_GUN: V3 = [17.2, 0, -2.6];
/** the fence post that topples in shot 2 */
export const FALL_POST: V3 = [3.6, 0, -1.6];
export const FIELD_Z = -1.9;

const redDirt = () => ctex("emuDirt", 512, 512, (g, r) => {
  g.fillStyle = "#b8643a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,74,40,0.5)" : "rgba(214,140,92,0.45)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 6, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(120,58,30,0.55)"; g.lineWidth = 5; const y = 130 + (i % 2) * 250 + r() * 20; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + (r() - 0.5) * 30); g.stroke(); } // ruts
});
const stubble = () => ctex("emuStubble", 512, 512, (g, r) => {
  g.fillStyle = "#c89a58"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.strokeStyle = r() < 0.5 ? "rgba(150,110,56,0.6)" : "rgba(230,196,120,0.6)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 6 - r() * 8); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(170,90,50,0.4)"; g.beginPath(); g.arc(r() * 512, r() * 512, 3 + r() * 6, 0, Math.PI * 2); g.fill(); }
});
const wheatGround = () => ctex("emuWheatGround", 256, 256, (g, r) => {
  g.fillStyle = "#c8a04a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(160,120,40,0.5)" : "rgba(236,204,110,0.5)"; g.fillRect(r() * 256, r() * 256, 2, 5); }
});
/** one wheat tuft: stalks with heavy heads, transparent around (alpha-tested), 256 x 256 */
const wheatTuft = () => ctex("emuWheatTuft", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) {
    const x0 = 60 + r() * 136, lean = (r() - 0.5) * 60, top = 30 + r() * 60, x1 = x0 + lean;
    g.strokeStyle = r() < 0.5 ? "#c09440" : "#d8b058"; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, 256); g.quadraticCurveTo(x0 + lean * 0.3, 140, x1, top); g.stroke();
    g.fillStyle = r() < 0.5 ? "#e8c068" : "#d4a64c"; g.beginPath(); g.ellipse(x1, top - 4, 9, 22, lean / 200, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#5a3e1e"; g.lineWidth = 2.5; g.stroke();
  }
});
const weatherboard = () => ctex("emuBoards", 256, 256, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ece2c8" : "#e2d6b8"; g.fillRect(0, i * 32, 256, 32); g.fillStyle = "#a89a7a"; g.fillRect(0, i * 32 + 28, 256, 4); }
});
/** the flat horizon: red earth, low blue-grey scrub, a few far gums and a far farmhouse (transparent sky) */
const horizon = () => ctex("emuHorizon", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const ink = "#141018";
  g.fillStyle = "#8a9aa8"; g.beginPath(); g.moveTo(0, 1024);
  for (let x = 0; x <= 2048; x += 32) g.lineTo(x, 790 - 14 * Math.sin(x / 210) - 8 * Math.sin(x / 60));
  g.lineTo(2048, 1024); g.fill();
  for (let x = 0; x < 2048; x += 18 + r() * 30) { g.fillStyle = r() < 0.5 ? "#6a7a5a" : "#7a8a64"; g.beginPath(); g.ellipse(x, 806 + r() * 6, 14 + r() * 14, 10 + r() * 8, 0, 0, Math.PI * 2); g.fill(); }
  for (const x of [260, 300, 980, 1500, 1540, 1820]) { g.strokeStyle = "#e8e2d4"; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 812); g.lineTo(x + 4, 740); g.stroke(); g.fillStyle = "#6a7a52"; g.beginPath(); g.ellipse(x + 4, 724, 34, 26, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke(); }
  g.fillStyle = "#d8c8a8"; g.fillRect(1180, 776, 70, 30); g.fillStyle = "#8a8a90"; g.beginPath(); g.moveTo(1170, 776); g.lineTo(1215, 756); g.lineTo(1260, 776); g.fill();
  g.fillStyle = "#c89a50"; g.fillRect(0, 812, 2048, 212);
  g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 812); g.lineTo(2048, 812); g.stroke();
});
const skyTex = (golden: boolean) => ctex(golden ? "emuSkyGold" : "emuSkyDay", 64, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  if (golden) { gr.addColorStop(0, "#5a5a9a"); gr.addColorStop(0.3, "#b87a8a"); gr.addColorStop(0.45, "#f0a868"); gr.addColorStop(0.5, "#ffd08a"); gr.addColorStop(1, "#ffd08a"); }
  else { gr.addColorStop(0, "#2f6cc8"); gr.addColorStop(0.3, "#3f86d8"); gr.addColorStop(0.44, "#8ab8ec"); gr.addColorStop(0.5, "#d4e4f2"); gr.addColorStop(1, "#d4e4f2"); }
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
});

/** the army truck: a 1930s flatbed (cab at +x), khaki-green, a Lewis gun on a tripod in the bed. Origin = ground under
 *  the middle of the bed; bed floor at y 0.95. */
export const TRUCK_BED = 0.95;
const truckGroup = () => {
  const root = new THREE.Group(), body = new THREE.Group(), b = new Batch();
  const olive = lam("emuTruck", () => ({ color: "#94a060" })), dark = lam("emuTruckDark", () => ({ color: "#2a2a2e" })), glass = lam("emuGlass", () => ({ color: "#2a3a5a" }));
  const tyre = lam("emuTyre", () => ({ color: "#1e1e22" })), hub = lam("emuHub", () => ({ color: "#8a8a6a" })), wood = lam("emuBed", () => ({ map: beam() }));
  b.add(boxGeo(V(-2.3, 0.62, -0.85), V(2.3, 0.8, 0.85)), dark); // chassis
  b.add(boxGeo(V(-2.3, 0.8, -0.95), V(0.6, TRUCK_BED, 0.95)), wood); // bed floor
  for (const s of [-1, 1]) b.add(boxGeo(V(-2.3, TRUCK_BED, s * 0.95 - 0.05), V(0.6, TRUCK_BED + 0.35, s * 0.95 + 0.05)), wood);
  b.add(boxGeo(V(-2.35, TRUCK_BED, -0.95), V(-2.25, TRUCK_BED + 0.35, 0.95)), wood);
  b.add(boxGeo(V(0.6, 0.8, -0.8), V(1.6, 2.05, 0.8)), olive); // cab
  b.add(boxGeo(V(1.55, 1.45, -0.62), V(1.62, 1.9, 0.62)), glass); // windscreen
  for (const s of [-1, 1]) b.add(boxGeo(V(0.75, 1.45, s * 0.8 - 0.02), V(1.45, 1.9, s * 0.8 + 0.02)), glass);
  b.add(boxGeo(V(0.55, 2.05, -0.86), V(1.68, 2.12, 0.86)), olive); // roof
  b.add(boxGeo(V(1.6, 0.8, -0.5), V(2.6, 1.5, 0.5)), olive); // bonnet
  b.add(boxGeo(V(2.6, 0.78, -0.48), V(2.66, 1.48, 0.48)), dark); // radiator grille
  for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.13, 10, 8), lam("emuLamp", () => ({ color: "#f2ead2" })), at(2.62, 1.38, s * 0.42));
  for (const [x, s] of [[2.0, -1], [2.0, 1], [-1.5, -1], [-1.5, 1]] as const) {
    b.add(cyl(0.46, 0.46, 0.26, 18), tyre, at(x, 0.46, s * 0.86, Math.PI / 2, 0, 0));
    b.add(cyl(0.2, 0.2, 0.28, 12), hub, at(x, 0.46, s * 0.86, Math.PI / 2, 0, 0));
    b.add(new THREE.CylinderGeometry(0.58, 0.58, 0.32, 16, 1, false, 0, Math.PI), olive, at(x, 0.5, s * 0.86, Math.PI / 2, 0, 0)); // mudguard
  }
  // the Lewis gun on a tripod at the front of the bed, firing over the cab's side
  const gx = -0.1;
  for (const a of [0, 2.1, 4.2]) b.add(cyl(0.025, 0.025, 1.0, 6), dark, at(gx + 0.25 * Math.cos(a), TRUCK_BED + 0.42, 0.25 * Math.sin(a), 0.35 * Math.sin(a), 0, -0.35 * Math.cos(a)));
  b.add(cyl(0.07, 0.07, 1.25, 10), dark, at(gx + 0.2, TRUCK_BED + 0.95, 0, 0, 0, Math.PI / 2 - 0.08));
  b.add(cyl(0.2, 0.2, 0.06, 18), dark, at(gx + 0.1, TRUCK_BED + 1.08, 0));
  b.add(boxGeo(V(gx - 0.6, TRUCK_BED + 0.88, -0.05), V(gx - 0.3, TRUCK_BED + 0.98, 0.05)), wood);
  b.build(body, true);
  root.add(body);
  return { root, body };
};
/** a Lewis gun on a tripod standing on the ground (muzzle toward -z) */
const tripodGun = (b: Batch, x: number, z: number) => {
  const dark = lam("emuTruckDark", () => ({ color: "#2a2a2e" })), wood = lam("emuBed", () => ({ map: beam() }));
  for (const a of [0.5, 2.6, 4.7]) b.add(cyl(0.025, 0.025, 1.0, 6), dark, at(x + 0.28 * Math.cos(a), 0.42, z + 0.28 * Math.sin(a), 0.4 * Math.sin(a), 0, -0.4 * Math.cos(a)));
  b.add(cyl(0.07, 0.07, 1.25, 10), dark, at(x, 0.9, z - 0.3, Math.PI / 2 - 0.06, 0, 0));
  b.add(cyl(0.2, 0.2, 0.06, 18), dark, at(x, 1.03, z - 0.1));
  b.add(boxGeo(V(x - 0.05, 0.82, z + 0.25), V(x + 0.05, 0.92, z + 0.55)), wood);
};

export class Farm extends Room {
  private dome: THREE.Mesh;
  private skies = { day: skyTex(false), golden: skyTex(true) };
  private fan = new THREE.Group();
  private post = new THREE.Group();
  truck: { root: THREE.Group; body: THREE.Group };
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const dirt = twoTone(new THREE.MeshLambertMaterial({ map: redDirt() }));
    const stub = twoTone(new THREE.MeshLambertMaterial({ map: stubble() }));
    const wg = twoTone(new THREE.MeshLambertMaterial({ map: wheatGround() }));
    const boards = lam("emuBoardsM", () => ({ map: weatherboard() }));
    const iron = lam("emuIron", () => ({ map: roofHD("#9a9ca4", true) }));
    const wood = lam("emuWood", () => ({ map: beam() }));
    const post = lam("emuPost", () => ({ color: "#8a6a4a" }));
    const wire = lam("emuWire", () => ({ color: "#5a5a60" }));
    const tank = lam("emuTank", () => ({ color: "#a8aab0" }));
    const gumBark = lam("emuGumBark", () => ({ color: "#e8e2d4" }));
    const gumLeaf = lam("emuGumLeaf", () => ({ color: "#7a8a5a" })), gumLeaf2 = lam("emuGumLeaf2", () => ({ color: "#6a7a4c" }));
    const mud = lam("emuMud", () => ({ color: "#8a5a3a" }));
    const reed = lam("emuReed", () => ({ color: "#6a8a3a" }));
    const steel = lam("emuSteel", () => ({ color: "#8a8c94" }));
    // ground: stubble paddock everywhere, the red track along x, golden wheat ground behind the fence
    b.add(quad(V(-120, 0, 120), V(120, 0, 120), V(120, 0, -120), V(-120, 0, -120), 80, 80), stub);
    b.add(quad(V(-120, 0.01, 1.5), V(120, 0.01, 1.5), V(120, 0.01, -1.5), V(-120, 0.01, -1.5), 60, 1.5), dirt);
    b.add(quad(V(-120, 0.008, FIELD_Z), V(120, 0.008, FIELD_Z), V(120, 0.008, -90), V(-120, 0.008, -90), 80, 30), wg);
    // the wheat: crossed-plane tufts, instanced, skipping the yard and the dam
    const tuft = new THREE.PlaneGeometry(0.62, 0.95); tuft.translate(0, 0.47, 0);
    const t2 = tuft.clone(); t2.rotateY(Math.PI / 2);
    const tg = new THREE.BufferGeometry();
    {
      const merge = (a: THREE.BufferGeometry, c: THREE.BufferGeometry) => {
        const pa = [...(a.getAttribute("position").array as Float32Array), ...(c.getAttribute("position").array as Float32Array)];
        const na = [...(a.getAttribute("normal").array as Float32Array), ...(c.getAttribute("normal").array as Float32Array)];
        const ua = [...(a.getAttribute("uv").array as Float32Array), ...(c.getAttribute("uv").array as Float32Array)];
        const ia = [...(a.getIndex()!.array as Uint16Array), ...Array.from(c.getIndex()!.array as Uint16Array, (v) => v + a.getAttribute("position").count)];
        tg.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3)); tg.setAttribute("normal", new THREE.Float32BufferAttribute(na, 3));
        tg.setAttribute("uv", new THREE.Float32BufferAttribute(ua, 2)); tg.setIndex(ia);
      };
      merge(tuft, t2);
      tg.computeVertexNormals();
      const nrm = tg.getAttribute("normal") as THREE.BufferAttribute;
      for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0); // light the tufts like the ground
    }
    const wm = twoTone(new THREE.MeshLambertMaterial({ map: wheatTuft(), alphaTest: 0.5, side: THREE.DoubleSide }));
    const spots: THREE.Matrix4[] = [];
    let k = 0;
    for (let z = FIELD_Z - 0.25; z > -34; z -= 0.42) for (let x = -34; x < 34; x += 0.42) {
      k++;
      const jx = x + (Math.sin(k * 12.9) * 0.5) * 0.3, jz = z + (Math.sin(k * 78.2) * 0.5) * 0.3;
      if (jx > -17 && jx < -5 && jz > -17 && jz < -5) continue; // the yard
      if (Math.hypot(jx - DAM[0], jz - DAM[2]) < 7.5 || (jx > 12 && jz > -6)) continue; // the dam
      const s = 0.85 + 0.35 * (0.5 + 0.5 * Math.sin(k * 3.7));
      spots.push(new THREE.Matrix4().compose(V(jx, 0, jz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k * 1.3, 0)), V(s, s * (0.9 + 0.2 * Math.sin(k)), s)));
    }
    const wheat = new THREE.InstancedMesh(tg, wm, spots.length);
    spots.forEach((m, i) => wheat.setMatrixAt(i, m));
    wheat.layers.set(NOINK); wheat.receiveShadow = true; this.root.add(wheat);
    // wire fence along the field, a gate gap at x -3..-1; one post (FALL_POST) is a separate group that topples
    for (let x = -60; x <= 11; x += 2.4) { // the dam paddock (x > 11) is open
      if (x > -3.2 && x < -0.9) continue;
      if (Math.abs(x - FALL_POST[0]) < 0.1) continue;
      deco.add(cyl(0.06, 0.07, 1.2, 6), post, at(x, 0.6, -1.6));
    }
    for (const y of [0.45, 0.75, 1.05]) for (const [x0, x1] of [[-60, -3.2], [-0.9, 10.8]]) deco.add(cyl(0.008, 0.008, x1 - x0, 4), wire, at((x0 + x1) / 2, y, -1.6, 0, 0, Math.PI / 2));
    const pb = new Batch(); pb.add(cyl(0.06, 0.07, 1.2, 6), post, at(0, 0.6, 0)); pb.build(this.post, true);
    this.post.position.set(...FALL_POST); this.root.add(this.post);
    // gate: two big posts and a farm gate swung open
    for (const x of [-3.2, -0.9]) deco.add(boxGeo(V(x - 0.1, 0, -1.7), V(x + 0.1, 1.5, -1.5)), wood);
    for (let i = 0; i < 4; i++) deco.add(boxGeo(V(-3.1, 0.3 + i * 0.3, -1.65 - 0.0), V(-3.0, 0.38 + i * 0.3, 0.6)), wood);
    // the farmhouse: weatherboard walls, corrugated-iron hip roof, a veranda, a rainwater tank
    const hx = -11, hz = -11, w = 3.2, d = 2.3, h = 2.7;
    b.add(boxGeo(V(hx - w, 0, hz - d), V(hx + w, h, hz + d), 1.2), boards);
    const roof = new THREE.ConeGeometry(1, 1, 4, 1); roof.rotateY(Math.PI / 4); roof.scale((w + 0.6) * 1.414, 1.6, (d + 0.6) * 1.414);
    deco.add(roof, iron, at(hx, h + 0.8, hz));
    deco.add(boxGeo(V(hx - w, h - 0.2, hz + d), V(hx + w, h - 0.1, hz + d + 1.6)), iron); // veranda roof
    for (let i = 0; i < 5; i++) deco.add(cyl(0.05, 0.05, h - 0.2, 6), wood, at(hx - w + 0.2 + i * (2 * w - 0.4) / 4, (h - 0.2) / 2, hz + d + 1.5));
    for (const dx of [-1.6, 1.6]) deco.add(boxGeo(V(hx + dx - 0.45, 0.9, hz + d), V(hx + dx + 0.45, 1.8, hz + d + 0.04)), lam("emuWin", () => ({ color: "#2a3a5a" })));
    deco.add(boxGeo(V(hx - 0.45, 0, hz + d), V(hx + 0.45, 2.1, hz + d + 0.04)), lam("emuDoor", () => ({ color: "#6a2a24" })));
    deco.add(cyl(1.0, 1.0, 2.0, 18), tank, at(hx + w + 1.4, 1.3, hz + 0.5));
    deco.add(cyl(1.05, 1.05, 0.3, 18), wood, at(hx + w + 1.4, 0.15, hz + 0.5));
    // the dam: a sunken pond with a mud rim and reeds
    const [dx, , dz] = DAM;
    const water = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), twoTone(new THREE.MeshLambertMaterial({ color: "#5a7a8a" })));
    water.rotation.x = -Math.PI / 2; water.position.set(dx, 0.025, dz); // above the wheat ground (y 0.008)
    water.receiveShadow = true; this.root.add(water);
    deco.add(new THREE.TorusGeometry(4.45, 0.38, 6, 40), mud, at(dx, -0.06, dz, Math.PI / 2, 0, 0).scale(V(1, 1, 0.5)));
    b.add(quad(V(dx - 6.5, 0.015, dz + 6.5), V(dx + 6.5, 0.015, dz + 6.5), V(dx + 6.5, 0.015, dz - 6.5), V(dx - 6.5, 0.015, dz - 6.5), 4, 4), stub); // bare ground round the dam
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + Math.sin(i * 7) * 0.05, r = 4.5 + 0.6 * Math.abs(Math.sin(i * 3.3));
      if (Math.sin(a) > 0.55 && Math.cos(a) < 0.2 && Math.cos(a) > -0.6) continue; // a gap in the reeds on the near side
      for (let j = 0; j < 3; j++) deco.add(cyl(0.012, 0.025, 0.9 + 0.5 * Math.abs(Math.sin(i + j)), 4), reed, at(dx + r * Math.cos(a) + j * 0.06, 0.5, dz + r * Math.sin(a), 0.15 * Math.sin(i + j), 0, 0.15 * Math.cos(i * 2 + j)));
    }
    tripodGun(deco, AMBUSH_GUN[0], AMBUSH_GUN[2]);
    // the windmill pump: four-legged lattice tower, a fan of blades that turns, a tail vane
    const [mx, , mz] = MILL, TH = 7.5;
    for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
      const a = V(mx + ox, 0, mz + oz), c = V(mx + ox * 0.15, TH, mz + oz * 0.15), mid = a.clone().add(c).multiplyScalar(0.5);
      deco.add(cyl(0.05, 0.06, a.distanceTo(c), 6), steel, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
    }
    for (let y = 1.5; y < TH; y += 1.6) { const s = 0.8 * (1 - (y / TH) * 0.85); deco.add(boxGeo(V(mx - s, y, mz - s), V(mx + s, y + 0.05, mz + s)), steel); }
    const fb = new Batch();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; fb.add(boxGeo(V(-0.12, 0.25, -0.02), V(0.12, 1.6, 0.02)), steel, new THREE.Matrix4().makeRotationZ(a)); }
    fb.add(cyl(0.18, 0.18, 0.2, 10), steel, at(0, 0, 0, Math.PI / 2, 0, 0));
    fb.build(this.fan, true);
    this.fan.position.set(mx, TH + 0.2, mz + 0.4); this.root.add(this.fan);
    deco.add(boxGeo(V(mx - 0.04, TH, mz - 2.0), V(mx + 0.04, TH + 0.9, mz - 0.4)), steel); // tail vane
    // gum trees: white trunks, sparse olive crowns
    const gum = (x: number, z: number, s: number) => {
      deco.add(cyl(0.12 * s, 0.2 * s, 4 * s, 8), gumBark, at(x, 2 * s, z, 0, 0, 0.06));
      deco.add(cyl(0.06 * s, 0.1 * s, 1.8 * s, 6), gumBark, at(x + 0.5 * s, 3.6 * s, z, 0, 0, -0.5));
      for (let i = 0; i < 4; i++) deco.add(new THREE.SphereGeometry(0.9 * s, 10, 8), i % 2 ? gumLeaf : gumLeaf2, at(x + Math.cos(i * 1.9) * 0.9 * s, (4.2 + 0.4 * (i % 2)) * s, z + Math.sin(i * 1.9) * 0.7 * s).scale(V(1, 0.6, 1)));
    };
    for (const [x, z, s] of [[25, -4, 1.3], [13.5, -13, 1.1], [27, -16, 1.4], [-20, -8, 1.2], [-4, -14, 1.1], [8, -22, 1.3], [-28, -20, 1.5], [36, -6, 1.2], [-36, 6, 1.3], [30, 10, 1.2]] as const) gum(x, z, s);
    b.build(this.root, false);
    deco.build(this.root, true);
    // sky dome + the painted horizon on both sides
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    for (const [z, ry] of [[-110, 0], [110, Math.PI]] as const) {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(320, 160), new THREE.MeshBasicMaterial({ map: horizon(), fog: false, transparent: true, alphaTest: 0.02 }));
      back.position.set(0, 160 * (812 / 1024) - 80 - 0.3, z); back.rotation.y = ry; back.layers.set(NOINK); this.root.add(back);
    }
    this.truck = truckGroup();
    this.root.add(this.truck.root);
  }
  /** per-shot pose: golden-hour sky, the truck (visible, position, heading, body bounce/roll), the toppling post */
  pose(t: number, golden: boolean, truck: { on: boolean; x: number; z: number; yaw: number; bounce: number; roll: number }, postFall: number) {
    (this.dome.material as THREE.MeshBasicMaterial).map = golden ? this.skies.golden : this.skies.day;
    this.fan.rotation.z = -t * 2.2;
    const tr = this.truck;
    tr.root.visible = truck.on;
    tr.root.position.set(truck.x, 0, truck.z); tr.root.rotation.y = truck.yaw;
    tr.body.position.y = truck.bounce; tr.body.rotation.x = truck.roll;
    this.post.rotation.x = -1.45 * postFall;
  }
}
