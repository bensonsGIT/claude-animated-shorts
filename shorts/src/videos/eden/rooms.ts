// East of Eden sets. Floor y = 0 everywhere; cameras mostly look toward -z. Each set is a Room shown one at a time.
// - Ranch: the Salinas valley: bean rows, the white Trask farmhouse with a porch, a windmill, fences, golden hills, a
//   sky dome; a rail spur with one iced boxcar (shown only for the lettuce shot).
// - Pass: the Sierra in snow: a trestle across a ravine, a locomotive + six boxcars, the snowslide that blocks the line.
// - Dining: the Trask dining room: table with the Thanksgiving turkey and candles, three chairs behind it, a window,
//   an iron stove in the corner (Cal burns the money in it).
// - Parlour: Kate's parlour: oxblood walls, a velvet settee, a red-shaded lamp, a door in the back wall.
// - Bedroom: Adam's bed under a moonlit window; with the bed hidden and two cradles shown it is the nursery of 1862.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD, roofHD, beam, planksHD } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

const ink = "#141018";
const shell = (b: Batch, x0: number, x1: number, z0: number, z1: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material | null, back = true, tile = 2) => {
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / tile, (z1 - z0) / tile), floor);
  b.add(boxGeo(V(x0 - 0.4, 0, z0), V(x0, h, z1), 2), wall);
  b.add(boxGeo(V(x1, 0, z0), V(x1 + 0.4, h, z1), 2), wall);
  b.add(boxGeo(V(x0 - 0.4, 0, z1), V(x1 + 0.4, h, z1 + 0.4), 2), wall);
  if (back) b.add(boxGeo(V(x0 - 0.4, 0, z0 - 0.4), V(x1 + 0.4, h, z0), 2), wall);
  if (ceil) b.add(boxGeo(V(x0 - 0.4, h, z0 - 0.4), V(x1 + 0.4, h + 0.3, z1 + 0.4), 0, true), ceil);
};
const skyDome = (root: THREE.Object3D, key: string, stops: [number, string][], r = 120) => {
  const t = ctex(key, 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -2; dome.layers.set(NOINK); root.add(dome);
  return dome.material as THREE.MeshBasicMaterial;
};
const backdrop = (root: THREE.Object3D, tex: THREE.Texture, w: number, h: number, z: number, landFrac = 830 / 1024) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, alphaTest: 0.02 }));
  m.position.set(0, h * landFrac - h / 2 - 0.5, z); m.layers.set(NOINK); root.add(m);
};
/** the back wall of a room with one rectangular hole (window or door) at x0..x1, y0..y1 */
const holedWall = (b: Batch, X0: number, X1: number, z: number, h: number, x0: number, x1: number, y0: number, y1: number, wall: THREE.Material) => {
  b.add(boxGeo(V(X0 - 0.4, 0, z - 0.4), V(x0, h, z), 2), wall);
  b.add(boxGeo(V(x1, 0, z - 0.4), V(X1 + 0.4, h, z), 2), wall);
  if (y0 > 0) b.add(boxGeo(V(x0, 0, z - 0.4), V(x1, y0, z), 2), wall);
  b.add(boxGeo(V(x0, y1, z - 0.4), V(x1, h, z), 2), wall);
};


// ---------------- doors + windows (detail pass, Ben 2026-11-18: "make doors and windows more detailed") ----------------
/** painted panel door: stiles + rails, four raised panels (two tall, two short), bevel light/shade lines */
const doorTex = (key: string, col: string, dark: string) => ctex(key, 256, 512, (g, r) => {
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
/** window glass: sky reflection by day (blue to pale with two diagonal glints), dark blue by night */
const glassTex = (key: string, night = false) => ctex(key, 128, 192, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 192);
  if (night) { gr.addColorStop(0, "#1a2448"); gr.addColorStop(1, "#0c1020"); } else { gr.addColorStop(0, "#5a8ac8"); gr.addColorStop(0.6, "#9ac0e6"); gr.addColorStop(1, "#4a6a98"); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 192);
  g.fillStyle = night ? "rgba(255,230,160,0.08)" : "rgba(255,255,255,0.35)";
  for (const [x, w] of [[20, 26], [60, 10]]) { g.beginPath(); g.moveTo(x, 192); g.lineTo(x + w, 192); g.lineTo(x + w + 90, 0); g.lineTo(x + 90, 0); g.fill(); }
});
type WinOpts = { frame: THREE.Material; glass?: THREE.Material | null; cols?: number; rows?: number; shutter?: THREE.Material; sill?: THREE.Material; head?: boolean };
/** a window on a wall whose face is the plane z, built out toward +z: glass, sash bars, casing, sill, header, shutters */
const windowUnit = (b: Batch, x: number, y0: number, w: number, h: number, z: number, o: WinOpts) => {
  const { frame, glass = null, cols = 2, rows = 2, shutter, sill = frame, head = true } = o;
  const c = 0.09, bar = 0.035;
  if (glass) b.add(boxGeo(V(x - w / 2, y0, z - 0.02), V(x + w / 2, y0 + h, z + 0.01)), glass);
  // casing (four sides), standing proud of the wall
  b.add(boxGeo(V(x - w / 2 - c, y0 - 0.02, z), V(x - w / 2, y0 + h + 0.02, z + 0.06)), frame);
  b.add(boxGeo(V(x + w / 2, y0 - 0.02, z), V(x + w / 2 + c, y0 + h + 0.02, z + 0.06)), frame);
  b.add(boxGeo(V(x - w / 2 - c, y0 + h, z), V(x + w / 2 + c, y0 + h + c, z + 0.06)), frame);
  if (head) b.add(boxGeo(V(x - w / 2 - c - 0.05, y0 + h + c, z), V(x + w / 2 + c + 0.05, y0 + h + c + 0.06, z + 0.1)), frame);
  // sill: a deeper ledge with a small apron under it
  b.add(boxGeo(V(x - w / 2 - c - 0.06, y0 - 0.07, z), V(x + w / 2 + c + 0.06, y0, z + 0.14)), sill);
  b.add(boxGeo(V(x - w / 2 - 0.02, y0 - 0.16, z), V(x + w / 2 + 0.02, y0 - 0.07, z + 0.04)), frame);
  // sash: meeting rail across the middle + muntins
  for (let i = 1; i < cols; i++) { const xx = x - w / 2 + (w * i) / cols; b.add(boxGeo(V(xx - bar / 2, y0, z + 0.01), V(xx + bar / 2, y0 + h, z + 0.04)), frame); }
  for (let j = 1; j < rows; j++) { const yy = y0 + (h * j) / rows, k = j === rows / 2 ? 1.6 : 1; b.add(boxGeo(V(x - w / 2, yy - (bar * k) / 2, z + 0.01), V(x + w / 2, yy + (bar * k) / 2, z + 0.04)), frame); }
  // shutters: louvred boards either side
  if (shutter) for (const sd of [-1, 1]) {
    const sx0 = sd < 0 ? x - w / 2 - c - w * 0.46 : x + w / 2 + c, sx1 = sx0 + w * 0.46;
    b.add(boxGeo(V(sx0, y0 - 0.02, z), V(sx1, y0 + h + 0.02, z + 0.04)), shutter);
    for (let yy = y0 + 0.08; yy < y0 + h - 0.04; yy += 0.11) b.add(boxGeo(V(sx0 + 0.04, yy, z + 0.04), V(sx1 - 0.04, yy + 0.035, z + 0.065)), frame);
  }
};
/** a door on a wall face at z (built toward +z): casing with a header, optional transom light, the leaf, a brass knob */
const doorUnit = (b: Batch, x: number, y0: number, w: number, h: number, z: number, o: { frame: THREE.Material; leaf?: THREE.Material | null; knob: THREE.Material; transom?: THREE.Material }) => {
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

// ================= the ranch =================
/** golden Salinas hills: tawny grass ridges, oak dots, blue Gabilan range behind */
const valleyHills = () => ctex("edHills", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const ridge = (y0: number, amp: number, f: number, col: string, ph: number) => {
    const y = (x: number) => y0 - amp * Math.sin(x / f + ph) - amp * 0.4 * Math.sin(x / (f * 0.37) + ph * 2);
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 1024); for (let x = 0; x <= 2048; x += 32) g.lineTo(x, y(x)); g.lineTo(2048, 1024); g.fill();
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= 2048; x += 32) { if (x) g.lineTo(x, y(x)); else g.moveTo(x, y(x)); } g.stroke();
    return y;
  };
  ridge(600, 90, 260, "#8a9ac0", 0.7);
  const y2 = ridge(720, 60, 200, "#d8b060", 2.0);
  for (let i = 0; i < 26; i++) { const x = r() * 2048; g.fillStyle = "#5a7a3a"; g.beginPath(); g.ellipse(x, y2(x) + 30 + r() * 40, 14 + r() * 10, 10 + r() * 6, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke(); }
  ridge(830, 22, 380, "#c8a050", 1.0);
});
export const RANCH = { house: [-6.5, 0, -12] as V3, porchZ: -8.6, door: [-6.5, 0, -8.9] as V3, mill: [6, 0, -14] as V3 };
export class Ranch extends Room {
  private car = new THREE.Group();
  private sky: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), car = new Batch();
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: grassHD(), color: "#9aae80" }));
    const soil = lam("edSoil", () => ({ color: "#8a6a48" }));
    const bean = lam("edBean", () => ({ color: "#5a9a3a" })), bean2 = lam("edBean2", () => ({ color: "#4a8a34" }));
    const white = lam("edHouse", () => ({ color: "#f2ece0" })), trim = lam("edTrim", () => ({ color: "#5a6a7a" }));
    const roofM = lam("edRoof", () => ({ map: roofHD("#6a5a52"), side: THREE.DoubleSide }));
    const wood = lam("edWood", () => ({ map: beam() })), dark = lam("edDark", () => ({ color: "#3a2a20" }));
    const leaf = lam("edLeaf", () => ({ color: "#4f7a34" }));
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#5a5e68", specular: "#9a9a9a", shininess: 40 }), 0.15);
    b.add(quad(V(-70, 0, 40), V(70, 0, 40), V(70, 0, -70), V(-70, 0, -70), 46, 36), grass);
    // the bean field: dark soil strip with rows of round bushes, right of the yard and running back
    b.add(quad(V(-1.5, 0.01, -2.5), V(16, 0.01, -2.5), V(16, 0.01, -40), V(-1.5, 0.01, -40), 6, 12), soil);
    for (let x = -1; x <= 15.5; x += 1.1) for (let z = -3.2; z > -39; z -= 0.9) {
      const k = Math.sin(x * 12.9 + z * 78.2) * 43758.5; const n = k - Math.floor(k);
      deco.add(new THREE.SphereGeometry(0.32 + 0.1 * n, 8, 6), n < 0.5 ? bean : bean2, at(x + 0.1 * n, 0.2, z, 0, 0, 0));
    }
    // a strip of field in front of the hook mark (the camera looks over it)
    for (let x = -4; x <= 4; x += 1.1) for (const z of [-1.4, -2.3]) deco.add(new THREE.SphereGeometry(0.3, 8, 6), bean, at(x, 0.18, z));
    // the farmhouse: two storeys, white clapboard, gable roof, porch with posts, door + windows
    const [hx, , hz] = RANCH.house, w = 4, d = 3, hW = 5.2;
    b.add(boxGeo(V(hx - w, 0, hz - d), V(hx + w, hW, hz + d), 1.4), white);
    const ridgeY = hW + 2.2;
    for (const s of [-1, 1]) {
      const zE = hz + s * (d + 0.5);
      b.add(s > 0 ? quad(V(hx - w - 0.4, hW - 0.2, zE), V(hx + w + 0.4, hW - 0.2, zE), V(hx + w + 0.4, ridgeY, hz), V(hx - w - 0.4, ridgeY, hz), 3, 1.5)
        : quad(V(hx + w + 0.4, hW - 0.2, zE), V(hx - w - 0.4, hW - 0.2, zE), V(hx - w - 0.4, ridgeY, hz), V(hx + w + 0.4, ridgeY, hz), 3, 1.5), roofM);
    }
    for (const s of [-1, 1]) {
      const x = hx + s * w, gT = new THREE.BufferGeometry();
      gT.setAttribute("position", new THREE.Float32BufferAttribute(s > 0 ? [x, hW, hz + d, x, hW, hz - d, x, ridgeY, hz] : [x, hW, hz - d, x, hW, hz + d, x, ridgeY, hz], 3)); gT.computeVertexNormals();
      b.add(gT, white);
    }
    // soffits: boards under the eaves so the roof reads solid from below
    for (const s of [-1, 1]) b.add(boxGeo(V(hx - w - 0.4, hW - 0.24, Math.min(hz + s * d, hz + s * (d + 0.5))), V(hx + w + 0.4, hW - 0.18, Math.max(hz + s * d, hz + s * (d + 0.5)))), trim);
    const fz = hz + d;
    const knob = twoTone(new THREE.MeshPhongMaterial({ color: "#d8b04a", specular: "#fff0c0", shininess: 80 }), 0.2);
    const casing = lam("edCasing", () => ({ color: "#f8f4ea" })), shutterM = lam("edShutter", () => ({ color: "#3a6a52" }));
    const glassD = lam("edGlass", () => ({ map: glassTex("edGlassD") }));
    doorUnit(deco, hx, 0.2, 1.05, 2.15, fz, { frame: casing, leaf: lam("edDoor", () => ({ map: doorTex("edDoorT", "#8a3a2a", "#6a2a1e") })), knob, transom: glassD });
    for (const [x, y] of [[-2.6, 1.0], [2.2, 1.0], [-2.6, 3.4], [0, 3.4], [2.2, 3.4]] as const) windowUnit(deco, hx + x, y, 0.82, 1.3, fz, { frame: casing, glass: glassD, cols: 2, rows: 4, shutter: shutterM, sill: trim });
    // porch: deck 0.2 high, 1.6 deep, roof on four posts
    deco.add(boxGeo(V(hx - w, 0, fz), V(hx + w, 0.2, fz + 1.6)), wood);
    for (const x of [-3.8, -1.3, 1.3, 3.8]) deco.add(boxGeo(V(hx + x - 0.07, 0.2, fz + 1.45), V(hx + x + 0.07, 2.7, fz + 1.59)), white);
    deco.add(boxGeo(V(hx - w - 0.1, 2.7, fz), V(hx + w + 0.1, 2.85, fz + 1.75)), trim);
    // windmill: lattice tower + wheel
    const [mx, , mz] = RANCH.mill;
    for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
      const a = V(mx + dx, 0, mz + dz), c = V(mx + dx * 0.15, 8, mz + dz * 0.15), mid = a.clone().add(c).multiplyScalar(0.5);
      deco.add(cyl(0.06, 0.06, a.distanceTo(c), 6), iron, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
    }
    for (let i = 0; i < 12; i++) deco.add(boxGeo(V(-0.08, 0, -0.02), V(0.08, 1.4, 0.02)), iron, at(mx, 8.2, mz + 0.4, 0, 0, (i / 12) * Math.PI * 2));
    deco.add(boxGeo(V(mx - 0.05, 8.1, mz - 1.6), V(mx + 0.05, 8.4, mz + 0.2)), iron);
    // fences along the yard
    const rail = (a: THREE.Vector3, c: THREE.Vector3) => { const mid = a.clone().add(c).multiplyScalar(0.5); deco.add(cyl(0.05, 0.05, a.distanceTo(c), 6), wood, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1))); };
    const fence = (pts: [number, number][]) => { for (const [x, z] of pts) deco.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 1.1, z + 0.07)), wood); for (let i = 0; i + 1 < pts.length; i++) for (const y of [0.45, 0.9]) rail(V(pts[i][0], y, pts[i][1]), V(pts[i + 1][0], y, pts[i + 1][1])); };
    fence([[-16, -6], [-13, -6], [-10, -6]]); fence([[-3, -6], [-2, -4], [-2, -2]]);
    // oaks
    const tree = (x: number, z: number, s: number) => { deco.add(cyl(0.18 * s, 0.26 * s, 3 * s, 8), dark, at(x, 1.5 * s, z)); deco.add(new THREE.SphereGeometry(1.7 * s, 12, 9), leaf, at(x, 3.8 * s, z)); deco.add(new THREE.SphereGeometry(1.2 * s, 12, 9), leaf, at(x + 1 * s, 3.3 * s, z + 0.4 * s)); };
    for (const [x, z, s] of [[-13, -14, 1.3], [-16, -4, 1.1], [18, -20, 1.4], [-22, -26, 1.5], [10, -30, 1.2]] as const) tree(x, z, s);
    // the rail spur + one iced boxcar, door open toward the camera (lettuce shot only)
    const tie = lam("edTie", () => ({ color: "#4a3a2a" })), steel = lam("edRail", () => ({ color: "#6a6a72" }));
    for (let x = -14; x <= 14; x += 0.7) car.add(boxGeo(V(x - 0.12, 0, -4.4), V(x + 0.12, 0.08, -2.6)), tie);
    for (const z of [-3.9, -3.1]) car.add(boxGeo(V(-14, 0.08, z - 0.04), V(14, 0.16, z + 0.04)), steel);
    const red = lam("edCar", () => ({ color: "#a8402e" })), red2 = lam("edCar2", () => ({ color: "#7a2e22" }));
    const [c0, c1] = [-2.2, 3.4];
    car.add(boxGeo(V(c0, 0.75, -4.7), V(c1, 3.3, -2.5)), red);
    car.add(boxGeo(V(c0 - 0.05, 3.3, -4.75), V(c1 + 0.05, 3.42, -2.45)), red2);
    car.add(boxGeo(V(0.0, 0.85, -2.5), V(1.4, 2.95, -2.44)), lam("edCarIn", () => ({ color: "#1a1418" })));
    const plank = lam("edCarDoor", () => ({ map: beam() })), ironD = lam("edCarIron", () => ({ color: "#2a2a30" }));
    car.add(boxGeo(V(-1.5, 0.8, -2.44), V(-0.05, 3.0, -2.38)), plank);
    for (const [a1, a2] of [[[-1.45, 0.9], [-0.1, 1.9]], [[-1.45, 1.9], [-0.1, 2.9]]] as const) {
      const p0 = V(a1[0], a1[1], -2.36), p1 = V(a2[0], a2[1], -2.36), mid = p0.clone().add(p1).multiplyScalar(0.5);
      car.add(boxGeo(V(-p0.distanceTo(p1) / 2, -0.05, -0.01), V(p0.distanceTo(p1) / 2, 0.05, 0.01)), ironD, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.atan2(p1.y - p0.y, p1.x - p0.x)), V(1, 1, 1)));
    }
    for (const y of [0.85, 1.9, 2.95]) car.add(boxGeo(V(-1.5, y - 0.04, -2.37), V(-0.05, y + 0.04, -2.35)), ironD);
    car.add(boxGeo(V(-2.2, 3.05, -2.47), V(3.4, 3.12, -2.36)), ironD);
    car.add(boxGeo(V(-0.25, 1.6, -2.36), V(-0.18, 2.1, -2.3)), ironD);
    // ventilator hatches on the roof edge (an ice reefer)
    for (const x of [c0 + 0.4, c1 - 0.7]) car.add(boxGeo(V(x, 3.42, -4.2), V(x + 0.3, 3.55, -3.0)), red2);
    for (const [x, y] of [[0.15, 0.9], [0.6, 0.9], [0.15, 1.35], [0.95, 0.9]] as const) car.add(boxGeo(V(x, y, -2.75), V(x + 0.42, y + 0.42, -2.52)), lam("edIce", () => ({ color: "#dff0fa" })));
    for (const x of [c0 + 0.6, c1 - 0.6]) for (const z of [-4.5, -2.7]) car.add(cyl(0.38, 0.38, 0.12, 14), iron, at(x, 0.42, z, Math.PI / 2));
    b.build(this.root, false); deco.build(this.root, true); car.build(this.car, true); this.root.add(this.car);
    this.sky = skyDome(this.root, "edSky", [[0, "#0f5fd8"], [0.3, "#2a7ae8"], [0.44, "#7ab6f2"], [0.5, "#d8e8f6"], [1, "#d8e8f6"]]);
    backdrop(this.root, valleyHills(), 260, 130, -80);
    this.skies = { day: this.sky.map!, golden: ctex("edSkyG", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#5a6ab0"); gr.addColorStop(0.3, "#c890a0"); gr.addColorStop(0.45, "#ffc47c"); gr.addColorStop(0.5, "#ffd8a0"); gr.addColorStop(1, "#ffd8a0"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); }) };
  }
  private skies: Record<"day" | "golden", THREE.Texture>;
  pose(golden: boolean, boxcar: boolean) { this.sky.map = golden ? this.skies.golden : this.skies.day; this.car.visible = boxcar; }
}

// ================= the Sierra pass =================
const peaks = () => ctex("edPeaks", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const range = (y0: number, n: number, amp: number, col: string, snow: string, seed: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) { const x = (i / n) * 2048; pts.push([x, y0 - (i % 2 ? amp * (0.6 + 0.4 * Math.sin(i * seed)) : amp * 0.15)]); }
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 1024); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(2048, 1024); g.fill();
    g.fillStyle = snow;
    for (let i = 1; i < n; i += 2) { const [x, y] = pts[i], [xa, ya] = pts[i - 1], [xb, yb] = pts[i + 1], k = 0.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (xa - x) * k, y + (ya - y) * k); g.lineTo(x, y + (ya - y) * k * 0.8 + 20); g.lineTo(x + (xb - x) * k, y + (yb - y) * k); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  };
  range(640, 14, 380, "#7a8ab8", "#f4f8ff", 1.7);
  range(760, 18, 220, "#5a6a98", "#eef4ff", 2.9);
  for (let i = 0; i < 60; i++) { const x = r() * 2048, y = 800 + r() * 60; g.fillStyle = "#2e4a3e"; g.beginPath(); g.moveTo(x, y - 50); g.lineTo(x + 16, y); g.lineTo(x - 16, y); g.fill(); }
  g.fillStyle = "#eef4fc"; g.fillRect(0, 840, 2048, 184);
});
/** train runs along +x on the trestle deck (y = DECK); its nose is at x = NOSE when stopped */
export const PASS = { deck: 3.0, z: -8, nose: 6.0, slide: 9.5 };
export class Pass extends Room {
  train = new THREE.Group();
  private slide = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), tr = new Batch(), sl = new Batch();
    const snow = lam("edSnow", () => ({ color: "#eef3fa" })), rock = lam("edRock", () => ({ color: "#6a6a78" }));
    const timber = lam("edTimber", () => ({ map: beam() })), steel = lam("edRail2", () => ({ color: "#5a5a62" }));
    const { deck, z } = PASS;
    // snowy banks either side of a ravine (x < -16 and x > 8 the ground rises to deck height)
    b.add(quad(V(-80, -4, 40), V(80, -4, 40), V(80, -4, -80), V(-80, -4, -80), 20, 20), snow);
    b.add(boxGeo(V(-80, -4, -40), V(-14, deck, 20)), snow);
    b.add(boxGeo(V(8, -4, -40), V(80, deck, 20)), snow);
    for (let i = 0; i < 14; i++) deco.add(new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.5, 0), rock, at(-12 + i * 1.5, -3.4, z + 3 + (i % 4) * 1.6, i, i * 2, 0));
    // the trestle: timber bents every 3 m between the banks, deck with ties and rails
    for (let x = -14; x <= 8; x += 3) for (const dz of [-1.1, 1.1]) deco.add(boxGeo(V(x - 0.15, -4, z + dz - 0.15), V(x + 0.15, deck, z + dz + 0.15)), timber);
    for (let x = -14; x <= 8; x += 3) deco.add(boxGeo(V(x - 0.1, -1, z - 1.2), V(x + 0.1, -0.7, z + 1.2)), timber);
    b.add(boxGeo(V(-80, deck - 0.3, z - 1.4), V(80, deck, z + 1.4)), timber);
    for (const dz of [-0.72, 0.72]) b.add(boxGeo(V(-80, deck, z + dz - 0.05), V(80, deck + 0.12, z + dz + 0.05)), steel);
    // pines on the banks
    const pine = lam("edPine", () => ({ color: "#2e5a44" }));
    for (const [x, zz, s] of [[-20, -16, 1.4], [-26, -12, 1.1], [14, -15, 1.3], [20, -11, 1.0], [-18, 2, 1.2], [16, 4, 1.5], [24, -2, 1.1]] as const) {
      deco.add(new THREE.ConeGeometry(1.6 * s, 4.5 * s, 9), pine, at(x, deck + 2.3 * s, zz)); deco.add(new THREE.ConeGeometry(1.0 * s, 2.4 * s, 9), snow, at(x, deck + 4.2 * s, zz));
    }
    // the train (built with its nose at x = 0, moved by pose()): locomotive + tender + six reefer boxcars
    const black = twoTone(new THREE.MeshPhongMaterial({ color: "#26262c", specular: "#8a8a8a", shininess: 50 }), 0.15);
    const red = lam("edCar", () => ({ color: "#a8402e" })), cream = lam("edReefer", () => ({ color: "#e8dcc0" })), roofC = lam("edCar2", () => ({ color: "#7a2e22" }));
    const y0 = deck + 0.12;
    tr.add(cyl(0.85, 0.85, 4.4, 16), black, at(-2.4, y0 + 1.8, z, 0, 0, Math.PI / 2));
    tr.add(boxGeo(V(-6.2, y0 + 0.8, z - 1.2), V(-4.4, y0 + 3.4, z + 1.2)), black);
    tr.add(cyl(0.32, 0.42, 1.2, 12), black, at(-0.9, y0 + 3.0, z));
    tr.add(new THREE.ConeGeometry(1.2, 1.2, 4), lam("edCow", () => ({ color: "#c8343c" })), at(0.1, y0 + 0.7, z, 0, Math.PI / 4, Math.PI / 2));
    tr.add(boxGeo(V(-6.6, y0 + 0.5, z - 1.1), V(-0.2, y0 + 0.9, z + 1.1)), black);
    for (let i = 0; i < 4; i++) for (const dz of [-1.05, 1.05]) tr.add(cyl(0.55, 0.55, 0.14, 16), lam("edWheel", () => ({ color: "#c8343c" })), at(-1.4 - i * 1.3, y0 + 0.55, z + dz, Math.PI / 2));
    tr.add(boxGeo(V(-9.4, y0 + 0.5, z - 1.2), V(-6.8, y0 + 2.4, z + 1.2)), black);
    for (let k = 0; k < 6; k++) {
      const x1 = -9.8 - k * 4.8, x0 = x1 - 4.4;
      tr.add(boxGeo(V(x0, y0 + 0.6, z - 1.3), V(x1, y0 + 3.1, z + 1.3)), k % 2 ? red : cream);
      tr.add(boxGeo(V(x0 - 0.05, y0 + 3.1, z - 1.35), V(x1 + 0.05, y0 + 3.22, z + 1.35)), roofC);
      tr.add(boxGeo(V(x0 + 1.6, y0 + 0.7, z + 1.3), V(x0 + 2.8, y0 + 2.8, z + 1.36)), lam("edDoorC", () => ({ color: "#5a2a20" })));
      for (const xx of [x0 + 0.7, x1 - 0.7]) for (const dz of [-1.2, 1.2]) tr.add(cyl(0.4, 0.4, 0.12, 14), black, at(xx, y0 + 0.4, z + dz, Math.PI / 2));
    }
    // the snowslide: a heap across the rails at x = slide (scaled up from nothing by pose())
    for (let i = 0; i < 9; i++) sl.add(new THREE.SphereGeometry(1.4 + (i % 3) * 0.5, 12, 9), snow, at((i - 4) * 0.9, (i % 2) * 0.6, (i % 3 - 1) * 1.1));
    b.build(this.root, false); deco.build(this.root, true); tr.build(this.train, true); sl.build(this.slide, true);
    this.root.add(this.train, this.slide);
    this.slide.position.set(PASS.slide, deck + 0.4, z);
    skyDome(this.root, "edSkyP", [[0, "#4a6ab8"], [0.36, "#8aaee0"], [0.48, "#d8e6f6"], [0.5, "#eef4fc"], [1, "#eef4fc"]], 150);
    backdrop(this.root, peaks(), 300, 150, -100, 840 / 1024);
  }
  /** nose x of the train, the slide 0..1 (fall + spread) */
  pose(nose: number, slide: number) {
    this.train.position.x = nose;
    const s = Math.max(0.001, slide);
    this.slide.visible = slide > 0;
    this.slide.scale.set(s, s, s);
    this.slide.position.y = PASS.deck + 0.4 + 14 * (1 - Math.min(1, slide * 1.6)) ** 2;
  }
}

// ================= dining room =================
export const DINING = { x0: -3.6, x1: 3.6, z0: -3.6, z1: 4.2, h: 3.2 };
export const TABLE = { x0: -1.5, x1: 1.5, z0: -1.75, z1: -0.75, top: 0.74 };
export const SEAT_Z = -2.1;
export const STOVE: V3 = [2.75, 0, -2.6];
const paper = (key: string, a: string, b2: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = a; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = b2; g.fillRect(x + 28, 0, 8, 512); for (let y = 16; y < 512; y += 64) { g.beginPath(); g.arc(x + 32, y + (x % 128 ? 32 : 0), 7, 0, Math.PI * 2); g.fill(); } }
  for (let i = 0; i < 200; i++) { g.fillStyle = "rgba(0,0,0,0.03)"; g.fillRect(r() * 512, r() * 512, 20, 20); }
});
const dusk = (key: string, night: boolean) => ctex(key, 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256);
  if (night) { gr.addColorStop(0, "#0c1430"); gr.addColorStop(1, "#28305a"); } else { gr.addColorStop(0, "#f0a060"); gr.addColorStop(0.7, "#ffd8a0"); gr.addColorStop(1, "#c89a60"); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = night ? "#0a0c1a" : "#8a6a48"; g.beginPath(); g.moveTo(0, 200); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 190 - 20 * Math.sin(x / 40)); g.lineTo(256, 256); g.lineTo(0, 256); g.fill();
  if (night) { g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(190, 60, 16, 0, Math.PI * 2); g.fill(); }
});
export class Dining extends Room {
  private pane: THREE.MeshBasicMaterial; private views: THREE.Texture[];
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = DINING;
    const wall = lam("dnWall", () => ({ map: paper("dnPaper", "#8a9a6a", "#7a8a5a") }));
    const dado = lam("dnDado", () => ({ color: "#5a3a26" })), floor = lam("dnFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("dnCeil", () => ({ color: "#efe6d2" })), false);
    holedWall(b, x0, x1, z0, h, -1.0, 1.0, 1.1, 2.5, wall);
    for (const [a, c] of [[x0, -1.0], [1.0, x1]]) b.add(boxGeo(V(a, 0, z0), V(c, 0.95, z0 + 0.04)), dado);
    this.views = [dusk("dnViewG", false), dusk("dnViewN", true)];
    this.pane = new THREE.MeshBasicMaterial({ map: this.views[0] });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), this.pane); pane.position.set(0, 1.8, z0 - 0.3); pane.layers.set(NOINK); this.root.add(pane);
    const frame = lam("dnFrame", () => ({ color: "#f4f0e8" }));
    windowUnit(deco, 0, 1.1, 2.0, 1.4, z0, { frame, cols: 3, rows: 2, sill: lam("dnSill", () => ({ color: "#e8e0d0" })) });
    // the curtain rod with finials
    const rod = twoTone(new THREE.MeshPhongMaterial({ color: "#c8a04a", specular: "#fff0c0", shininess: 70 }), 0.2);
    deco.add(cyl(0.02, 0.02, 3.0, 8), rod, at(0, 2.88, z0 + 0.25, 0, 0, Math.PI / 2));
    for (const sx of [-1.5, 1.5]) deco.add(new THREE.SphereGeometry(0.045, 10, 8), rod, at(sx, 2.88, z0 + 0.25));
    // curtains
    for (const x of [-1.25, 1.25]) deco.add(boxGeo(V(x - 0.28, 0.85, z0 + 0.2), V(x + 0.28, 2.82, z0 + 0.3)), lam("dnCurtain", () => ({ color: "#8a2a2a" })));
    // the table with a white cloth, turkey, candles, plates
    const { x0: tx0, x1: tx1, z0: tz0, z1: tz1, top } = TABLE;
    const oak = lam("dnOak", () => ({ color: "#6a3e24" })), cloth = lam("dnCloth", () => ({ color: "#e6dcc6" }));
    deco.add(boxGeo(V(tx0, top - 0.05, tz0), V(tx1, top, tz1)), cloth);
    deco.add(boxGeo(V(tx0, top - 0.32, tz1 - 0.02), V(tx1, top - 0.05, tz1 + 0.02)), cloth);
    for (const [x, zz] of [[tx0 + 0.1, tz0 + 0.1], [tx1 - 0.1, tz0 + 0.1], [tx0 + 0.1, tz1 - 0.1], [tx1 - 0.1, tz1 - 0.1]]) deco.add(boxGeo(V(x - 0.05, 0, zz - 0.05), V(x + 0.05, top - 0.05, zz + 0.05)), oak);
    const roast = lam("dnRoast", () => ({ color: "#b8642e" })), plate = lam("dnPlate", () => ({ color: "#fbfaf4" }));
    deco.add(new THREE.SphereGeometry(0.2, 14, 10), roast, at(0.55, top + 0.12, (tz0 + tz1) / 2, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.3, 0.8, 1)));
    for (const dx of [-0.14, 0.14]) deco.add(cyl(0.03, 0.02, 0.18, 8), lam("dnLeg", () => ({ color: "#e8c88a" })), at(0.55 + 0.26, top + 0.14, (tz0 + tz1) / 2 + dx, 0, 0, -1.1));
    deco.add(cyl(0.3, 0.3, 0.02, 20), plate, at(0.55, top + 0.01, (tz0 + tz1) / 2));
    for (const x of [-0.9, 0, 0.9]) deco.add(cyl(0.14, 0.14, 0.015, 16), plate, at(x, top + 0.01, tz0 + 0.25));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2), wax = lam("dnWax", () => ({ color: "#f5ecd6" }));
    for (const x of [-0.6, -1.1]) { deco.add(cyl(0.05, 0.07, 0.06, 10), brass, at(x, top + 0.03, (tz0 + tz1) / 2)); deco.add(cyl(0.022, 0.022, 0.26, 8), wax, at(x, top + 0.19, (tz0 + tz1) / 2)); this.flame(x, top + 0.38, (tz0 + tz1) / 2, 0.06, 0.12, 3); }
    // three chairs behind the table (Cal left, Adam centre, Aron right) + one at the left end
    const chairM = lam("dnChair", () => ({ color: "#4a2a1a" }));
    const chair = (x: number, zz: number) => {
      deco.add(boxGeo(V(x - 0.24, 0.6, zz - 0.24), V(x + 0.24, 0.66, zz + 0.24)), chairM);
      for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) deco.add(boxGeo(V(x + dx - 0.025, 0, zz + dz - 0.025), V(x + dx + 0.025, 0.6, zz + dz + 0.025)), chairM);
      deco.add(boxGeo(V(x - 0.24, 0.66, zz - 0.28), V(x + 0.24, 1.05, zz - 0.22)), chairM);
    };
    for (const x of [-0.9, 0, 0.9]) chair(x, SEAT_Z);
    // the iron stove in the right corner, with a glowing door
    const [sx, , sz] = STOVE;
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#2a2a30", specular: "#8a8a8a", shininess: 40 }), 0.15);
    deco.add(boxGeo(V(sx - 0.4, 0.15, sz - 0.4), V(sx + 0.4, 1.0, sz + 0.4)), iron);
    deco.add(cyl(0.09, 0.09, 2.2, 10), iron, at(sx, 2.1, sz - 0.1));
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.4, 0.5) }));
    door.position.set(sx - 0.41, 0.58, sz); door.rotation.y = -Math.PI / 2; door.layers.set(NOINK); this.root.add(door);
    this.flame(sx - 0.45, 0.6, sz, 0.3, 0.32, 2.6);
    this.glow(sx - 0.6, 0.6, sz, 1.6, 0.5);
    // sideboard on the left wall
    deco.add(boxGeo(V(x0, 0, -2.6), V(x0 + 0.55, 0.95, -0.6)), oak);
    b.build(this.root, false); deco.build(this.root, true);
  }
  pose(night: boolean) { this.pane.map = this.views[night ? 1 : 0]; }
}

// ================= Kate's parlour =================
export const PARLOUR = { x0: -3.2, x1: 3.2, z0: -3.6, z1: 4.2, h: 3.2 };
export const SETTEE = { x0: -0.1, x1: 1.7, z: -1.5, seat: 0.45 };
export const PDOOR = { x0: -1.8, x1: -0.7, h: 2.3 };
export const LAMP: V3 = [2.55, 0, -2.4];
export class Parlour extends Room {
  private door = new THREE.Group();
  private lampGlow!: THREE.Sprite;
  private shade!: THREE.MeshBasicMaterial;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = PARLOUR;
    const wall = lam("pkWall", () => ({ map: paper("pkPaper", "#6a1a26", "#5a1420") })), floor = lam("pkFloor", () => ({ color: "#3a1a1a" }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("pkCeil", () => ({ color: "#2a1418" })), false);
    holedWall(b, x0, x1, z0, h, PDOOR.x0, PDOOR.x1, 0, PDOOR.h, wall);
    // dark hall behind the door
    const hall = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshBasicMaterial({ color: "#1a1014" }));
    hall.position.set((PDOOR.x0 + PDOOR.x1) / 2, 1.5, z0 - 1.6); hall.layers.set(NOINK); this.root.add(hall);
    b.add(boxGeo(V(PDOOR.x0 - 0.5, 0, z0 - 1.7), V(PDOOR.x1 + 0.5, 0.01, z0)), floor);
    // the door leaf, hinged at x0 (opened by pose())
    const pknob = twoTone(new THREE.MeshPhongMaterial({ color: "#d8b04a", specular: "#fff0c0", shininess: 80 }), 0.2);
    const dl = new Batch(), dw = PDOOR.x1 - PDOOR.x0;
    dl.add(boxGeo(V(0, 0, -0.03), V(dw, PDOOR.h, 0.03)), lam("pkDoor", () => ({ map: doorTex("pkDoorT", "#5a2418", "#3a160e") })));
    dl.add(new THREE.SphereGeometry(0.045, 10, 8), pknob, at(dw - 0.12, 1.0, 0.07));
    dl.add(boxGeo(V(dw - 0.15, 0.88, 0.03), V(dw - 0.09, 1.1, 0.045)), pknob);
    dl.build(this.door, true);
    doorUnit(deco, (PDOOR.x0 + PDOOR.x1) / 2, 0, dw, PDOOR.h, z0, { frame: lam("pkCasing", () => ({ color: "#2a1210" })), knob: pknob });
    this.door.position.set(PDOOR.x0, 0, z0 - 0.05); this.root.add(this.door);
    // rug
    b.add(quad(V(-1.6, 0.01, 1.2), V(2.4, 0.01, 1.2), V(2.4, 0.01, -2.6), V(-1.6, 0.01, -2.6), 1, 1), lam("pkRug", () => ({ color: "#4a2a4a" })));
    // the velvet settee: Kate sits on its front edge
    const velvet = lam("pkVelvet", () => ({ color: "#8a1a3a" })), wood = lam("pkWood", () => ({ color: "#2a1410" }));
    const { x0: s0, x1: s1, z: sz, seat } = SETTEE;
    deco.add(boxGeo(V(s0, 0.15, sz - 0.35), V(s1, seat, sz + 0.35)), velvet);
    deco.add(boxGeo(V(s0, seat, sz - 0.4), V(s1, 1.1, sz - 0.25)), velvet);
    for (const x of [s0, s1 - 0.15]) deco.add(boxGeo(V(x, seat, sz - 0.35), V(x + 0.15, 0.72, sz + 0.35)), velvet);
    for (const x of [s0 + 0.05, s1 - 0.05]) for (const z of [sz - 0.3, sz + 0.3]) deco.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.15, z + 0.03)), wood);
    // the red-shaded lamp on a stand
    const [lx, , lz] = LAMP;
    deco.add(cyl(0.2, 0.25, 0.05, 12), wood, at(lx, 0.03, lz)); deco.add(cyl(0.025, 0.025, 1.4, 6), wood, at(lx, 0.75, lz));
    this.shade = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.5, 0.4) });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 0.36, 16, 1, true), this.shade); sh.position.set(lx, 1.55, lz); sh.layers.set(NOINK); this.root.add(sh);
    this.glow(lx, 1.5, lz, 2.6, 0.75); this.lampGlow = this.glows[this.glows.length - 1];
    // a side table with a small bottle (the morphine is only ever this) and a gilt mirror
    deco.add(cyl(0.3, 0.3, 0.04, 16), wood, at(2.25, 0.68, -1.3)); deco.add(cyl(0.04, 0.06, 0.68, 8), wood, at(2.25, 0.34, -1.3));
    deco.add(cyl(0.04, 0.05, 0.14, 8), lam("pkBottle", () => ({ color: "#3a6a8a" })), at(2.32, 0.77, -1.3));
    const gilt = twoTone(new THREE.MeshPhongMaterial({ color: "#c8a04a", specular: "#fff0c0", shininess: 70 }), 0.2);
    deco.add(boxGeo(V(0.5, 1.5, z0 + 0.02), V(1.9, 2.6, z0 + 0.08)), gilt);
    deco.add(boxGeo(V(0.6, 1.6, z0 + 0.08), V(1.8, 2.5, z0 + 0.1)), lam("pkGlass", () => ({ color: "#4a3a4a" })));
    b.build(this.root, false); deco.build(this.root, true);
  }
  /** door 0 shut .. 1 open; lamp 0 out .. 1 lit */
  pose(door: number, lamp = 1) {
    this.door.rotation.y = (door * Math.PI) / 1.8;
    this.lampGlow.material.opacity = 0.75 * lamp;
    this.shade.color.setRGB(0.3 + 2.1 * lamp, 0.12 + 0.38 * lamp, 0.1 + 0.3 * lamp);
  }
}

// ================= bedroom / nursery =================
export const BEDROOM = { x0: -3.0, x1: 3.0, z0: -3.2, z1: 3.8, h: 3.0 };
export const BED = { x0: -1.0, x1: 1.0, z0: -3.15, z1: -0.9, top: 0.62 };
export class Bedroom extends Room {
  private bed = new THREE.Group(); private cradles = new THREE.Group();
  constructor() {
    super();
    const b = new Batch(), deco = new Batch(), bed = new Batch(), cr = new Batch();
    const { x0, x1, z0, z1, h } = BEDROOM;
    const wall = lam("bdWall", () => ({ map: paper("bdPaper", "#c8b89a", "#b8a88a") })), floor = lam("bdFloor", () => ({ map: planksHD() }));
    shell(b, x0, x1, z0, z1, h, wall, floor, lam("bdCeil", () => ({ color: "#e6dcc8" })), false);
    holedWall(b, x0, x1, z0, h, 1.3, 2.5, 1.0, 2.4, wall);
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#c8a04a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshBasicMaterial({ map: dusk("bdView", true) })); pane.position.set(1.9, 1.7, z0 - 0.3); pane.layers.set(NOINK); this.root.add(pane);
    const frame = lam("bdFrame", () => ({ color: "#f0ead8" }));
    windowUnit(deco, 1.9, 1.0, 1.2, 1.4, z0, { frame, cols: 2, rows: 4 });
    // a bedroom door on the left wall: casing + panelled leaf, facing +x
    const bdDoor = new THREE.Group(), bdb = new Batch();
    doorUnit(bdb, 0, 0, 0.95, 2.1, 0, { frame, leaf: lam("bdDoorL", () => ({ map: doorTex("bdDoorT", "#e8dcc4", "#c8b89a") })), knob: brass });
    bdb.build(bdDoor, true); bdDoor.position.set(x0 + 0.01, 0, -0.6); bdDoor.rotation.y = Math.PI / 2; this.root.add(bdDoor);
    // moonbeam
    this.glow(1.9, 1.7, z0 + 0.1, 2.2, 0.35);
    // the bed: brass head rail, white sheets, a quilt
    const { x0: b0, x1: b1, z0: bz0, z1: bz1, top } = BED;
    bed.add(boxGeo(V(b0, 0.3, bz0), V(b1, top, bz1)), lam("bdSheet", () => ({ color: "#f2efe6" })));
    bed.add(boxGeo(V(b0 - 0.02, 0.55, bz0 + 0.6), V(b1 + 0.02, top + 0.06, bz1 + 0.02)), lam("bdQuilt", () => ({ color: "#b8a890" })));
    for (const x of [b0, b1]) { bed.add(cyl(0.035, 0.035, 1.4, 8), brass, at(x, 0.7, bz0 + 0.05)); bed.add(cyl(0.03, 0.03, 0.8, 8), brass, at(x, 0.4, bz1)); }
    bed.add(cyl(0.03, 0.03, b1 - b0, 8), brass, at(0, 1.35, bz0 + 0.05, 0, 0, Math.PI / 2));
    bed.add(boxGeo(V(-0.6, top, bz0 + 0.1), V(0.6, top + 0.2, bz0 + 0.5)), lam("bdPillow", () => ({ color: "#fbfaf4" })));
    // nightstand with a candle
    const wood = lam("bdWood", () => ({ color: "#5a3a26" }));
    deco.add(boxGeo(V(-1.75, 0, -2.9), V(-1.2, 0.7, -2.4)), wood);
    deco.add(cyl(0.022, 0.022, 0.22, 8), lam("bdWax", () => ({ color: "#f5ecd6" })), at(-1.47, 0.81, -2.65));
    this.flame(-1.47, 0.98, -2.65, 0.06, 0.12, 3);
    // the nursery: two wooden cradles on rockers, an oil lamp
    const pine = lam("bdCradle", () => ({ color: "#c89a62" })), blanket = lam("bdBlanket", () => ({ color: "#e8e0f0" }));
    for (const x of [-0.65, 0.65]) {
      cr.add(boxGeo(V(x - 0.32, 0.25, -2.6), V(x + 0.32, 0.6, -1.8)), pine);
      cr.add(boxGeo(V(x - 0.28, 0.6, -2.55), V(x + 0.28, 0.62, -1.85)), blanket);
      for (const z of [-2.5, -1.9]) cr.add(new THREE.TorusGeometry(0.4, 0.03, 6, 16, Math.PI), pine, at(x, 0.42, z, 0, 0, Math.PI));
    }
    b.build(this.root, false); deco.build(this.root, true); bed.build(this.bed, true); cr.build(this.cradles, true);
    this.root.add(this.bed, this.cradles);
  }
  pose(nursery: boolean) { this.bed.visible = !nursery; this.cradles.visible = nursery; }
}
