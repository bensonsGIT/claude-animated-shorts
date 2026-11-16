// Moscow, 1698-1705: a timber city wall (log palisade) across the road at z = -8 with a gate tower and its open plank
// doors; OUTSIDE (z > -8) a mud road, the toll booth where peasants pay their kopek; INSIDE (z < -8) a street of log
// izbas, a cart, the tax clerk's table, and a white church with onion domes at the end of the street. Ground y = 0.
// Painted backdrops: the city's domes beyond the far end (z = -95), fields and woods beyond the gate (z = +95).
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD, roofHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const WALL_Z = -8;
/** the toll booth's counter (outside the gate, right of the road) */
export const BOOTH: V3 = [3.3, 0, -5.4];
/** the tax clerk's table inside (left of the road) and the cart the policeman hides behind */
export const CLERK: V3 = [-1.9, 0, -14.2];
export const CART: V3 = [2.2, 0, -17.5];

const mudTex = () => ctex("mosMud", 512, 512, (g, r) => {
  g.fillStyle = "#8a6e4e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? "rgba(100,78,52,0.55)" : "rgba(170,146,110,0.5)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 7, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = "rgba(70,52,34,0.6)"; g.lineWidth = 5; const x = 120 + r() * 40 + (i % 2) * 230; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 30, 512); g.stroke(); } // cart ruts
});
const logTex = () => ctex("mosLogs", 512, 512, (g, r) => {
  for (let i = 0; i < 8; i++) {
    const y = i * 64, c = ["#9a6e48", "#8a6040", "#a47650"][i % 3];
    g.fillStyle = c; g.fillRect(0, y, 512, 64);
    g.fillStyle = "rgba(255,230,190,0.2)"; g.fillRect(0, y + 8, 512, 10);
    g.fillStyle = "#4a3020"; g.fillRect(0, y + 58, 512, 6);
    for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(60,36,20,0.4)"; g.lineWidth = 2; const x = r() * 512; g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x + 40, y + 24 + r() * 20); g.stroke(); }
  }
});
const plaster = () => ctex("mosPlaster", 256, 256, (g, r) => {
  g.fillStyle = "#f2ece0"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(200,190,170,${0.2 + r() * 0.3})`; g.fillRect(r() * 256, r() * 256, 3 + r() * 6, 2); }
});
/** the city beyond the street: hills, a skyline of roofs, onion domes and tent towers (seen looking -z) */
const cityBack = () => ctex("mosCity", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const ink = "#141018";
  g.fillStyle = "#8fa6c0"; g.beginPath(); g.moveTo(0, 1024);
  for (let x = 0; x <= 2048; x += 32) g.lineTo(x, 700 - 50 * Math.sin(x / 300) - 20 * Math.sin(x / 80));
  g.lineTo(2048, 1024); g.fill();
  const dome = (x: number, y: number, w: number, col: string) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w * 0.5, y);
    g.bezierCurveTo(x - w * 0.75, y - w * 0.5, x - w * 0.1, y - w * 0.7, x, y - w * 1.15);
    g.bezierCurveTo(x + w * 0.1, y - w * 0.7, x + w * 0.75, y - w * 0.5, x + w * 0.5, y); g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 5; g.stroke();
    g.beginPath(); g.moveTo(x, y - w * 1.15); g.lineTo(x, y - w * 1.6); g.moveTo(x - w * 0.18, y - w * 1.42); g.lineTo(x + w * 0.18, y - w * 1.42); g.stroke();
  };
  for (let x = -20; x < 2048; x += 60 + r() * 50) {
    const w = 50 + r() * 80, h = 40 + r() * 70, c = ["#b89a78", "#a88a68", "#c8b498", "#9a7a5a"][Math.floor(r() * 4)];
    g.fillStyle = c; g.fillRect(x, 830 - h, w, h); g.strokeStyle = ink; g.lineWidth = 5; g.strokeRect(x, 830 - h, w, h);
    g.fillStyle = "#6a4a3a"; g.beginPath(); g.moveTo(x - 6, 830 - h); g.lineTo(x + w / 2, 830 - h - w * 0.35); g.lineTo(x + w + 6, 830 - h); g.fill(); g.stroke();
  }
  for (const [x, w, h, c] of [[260, 70, 230, "#e8e2d4"], [720, 90, 300, "#f2ece0"], [1180, 60, 200, "#e8e2d4"], [1640, 80, 260, "#d8c8b0"]] as const) {
    g.fillStyle = c; g.fillRect(x - w / 2, 830 - h, w, h); g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(x - w / 2, 830 - h, w, h);
    dome(x, 830 - h, w * 0.95, ["#e2b84a", "#3a6ab8", "#2f8a5a", "#e2b84a"][Math.floor(x / 500) % 4]);
  }
  // a red-brick Kremlin wall + tent tower far right
  g.fillStyle = "#b8463a"; g.fillRect(1300, 760, 748, 70); g.strokeStyle = ink; g.lineWidth = 5; g.strokeRect(1300, 760, 748, 70);
  for (let x = 1300; x < 2048; x += 34) { g.fillStyle = "#b8463a"; g.beginPath(); g.moveTo(x, 760); g.lineTo(x + 8, 742); g.lineTo(x + 18, 742); g.lineTo(x + 26, 760); g.fill(); g.stroke(); }
  g.fillStyle = "#b8463a"; g.fillRect(1880, 600, 70, 230); g.strokeRect(1880, 600, 70, 230);
  g.fillStyle = "#3a7a5a"; g.beginPath(); g.moveTo(1870, 600); g.lineTo(1915, 470); g.lineTo(1960, 600); g.fill(); g.stroke();
  g.fillStyle = "#6a8a50"; g.fillRect(0, 828, 2048, 196); g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 828); g.lineTo(2048, 828); g.stroke();
});
/** fields, a birch wood and a far village beyond the gate (seen looking +z) */
const fieldBack = () => ctex("mosField", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const ink = "#141018";
  const ridge = (y0: number, amp: number, f: number, col: string, ph: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 1024);
    for (let x = 0; x <= 2048; x += 32) g.lineTo(x, y0 - amp * Math.sin(x / f + ph));
    g.lineTo(2048, 1024); g.fill(); g.strokeStyle = ink; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x <= 2048; x += 32) { const y = y0 - amp * Math.sin(x / f + ph); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  };
  ridge(660, 50, 320, "#8aa6c4", 0.3);
  ridge(740, 40, 240, "#6a9a5a", 1.7);
  for (let x = 0; x < 2048; x += 22 + r() * 18) { g.fillStyle = r() < 0.5 ? "#4f7a44" : "#5f8a4a"; g.beginPath(); g.ellipse(x, 780 + r() * 10, 18 + r() * 10, 40 + r() * 20, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
    if (r() < 0.4) { g.fillStyle = "#f4f0e6"; g.fillRect(x - 2, 790, 5, 40); } }
  ridge(840, 18, 400, "#b8b060", 1.0);
});

export class Moscow extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const mud = twoTone(new THREE.MeshLambertMaterial({ map: mudTex() }));
    const wood = lam("mosWood", () => ({ map: beam() }));
    const logM = lam("mosLog", () => ({ map: logTex() }));
    const pale = lam("mosPale", () => ({ color: "#9a7450" }));
    const paleTop = lam("mosPaleTop", () => ({ color: "#7a5a3a" }));
    const roofG = lam("mosRoofG", () => ({ map: roofHD("#3f7a5a") }));
    const roofB = lam("mosRoofB", () => ({ map: roofHD("#7a6a5a") }));
    const white = lam("mosWhite", () => ({ map: plaster() }));
    const trim = lam("mosTrim", () => ({ color: "#f4f0e6" }));
    const blue = lam("mosBlue", () => ({ color: "#3a6ab8" }));
    const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e2b84a", specular: "#fff0c0", shininess: 80 }), 0.2);
    const dark = lam("mosDark", () => ({ color: "#3a2a20" }));
    const win = lam("mosWin", () => ({ color: "#2a3a5a" }));
    const leaf = lam("mosLeaf", () => ({ color: "#5d8a3a" }));
    const birch = lam("mosBirch", () => ({ color: "#ece8de" }));
    const cloth = lam("mosCloth", () => ({ color: "#2f5a3c" }));
    const hay = lam("mosHay", () => ({ color: "#d8b860" }));
    // ground: grass everywhere, the mud road along z (x -2.3..2.3) through the gate
    b.add(quad(V(-90, 0, 90), V(90, 0, 90), V(90, 0, -90), V(-90, 0, -90), 60, 60), grass);
    b.add(quad(V(-2.3, 0.01, 60), V(2.3, 0.01, 60), V(2.3, 0.01, -55), V(-2.3, 0.01, -55), 2, 50), mud);
    b.add(quad(V(-9, 0.008, -9), V(9, 0.008, -9), V(9, 0.008, -46), V(-9, 0.008, -46), 8, 16), mud); // the street inside is all mud
    // palisade: vertical logs with sharpened tops, x |x| > 2.4, a walkway rail behind
    const Z = WALL_Z, PH = 4.2;
    for (let x = -40; x <= 40; x += 0.38) {
      if (Math.abs(x) < 2.5) continue;
      const h = PH + 0.15 * Math.sin(x * 7.3);
      deco.add(cyl(0.19, 0.2, h, 8), pale, at(x, h / 2, Z));
      deco.add(new THREE.ConeGeometry(0.19, 0.42, 8), paleTop, at(x, h + 0.21, Z));
    }
    b.add(boxGeo(V(-40, 2.9, Z - 0.42), V(-2.5, 3.05, Z - 0.2)), wood);
    b.add(boxGeo(V(2.5, 2.9, Z - 0.42), V(40, 3.05, Z - 0.2)), wood);
    // gate tower: two log pillars, a lintel block, an upper room with a window, a green tent roof + gilt finial
    b.add(boxGeo(V(-3.0, 0, Z - 1.1), V(-1.6, 6.4, Z + 1.1), 1.2), logM);
    b.add(boxGeo(V(1.6, 0, Z - 1.1), V(3.0, 6.4, Z + 1.1), 1.2), logM);
    b.add(boxGeo(V(-1.6, 3.6, Z - 1.1), V(1.6, 6.4, Z + 1.1), 1.2), logM);
    b.add(boxGeo(V(-3.25, 6.4, Z - 1.35), V(3.25, 6.6, Z + 1.35)), wood);
    const tent = new THREE.ConeGeometry(3.9, 4.2, 4, 1); tent.rotateY(Math.PI / 4);
    deco.add(tent, roofG, at(0, 8.7, Z));
    deco.add(new THREE.SphereGeometry(0.28, 12, 10), gold, at(0, 10.9, Z));
    deco.add(cyl(0.035, 0.035, 0.9, 6), gold, at(0, 11.5, Z));
    deco.add(boxGeo(V(-0.3, 11.65, Z - 0.03), V(0.3, 11.72, Z + 0.03)), gold);
    for (const zf of [Z + 1.11, Z - 1.11]) {
      deco.add(boxGeo(V(-0.6, 4.4, zf - 0.03), V(0.6, 5.5, zf + 0.03)), win);
      deco.add(boxGeo(V(-0.75, 4.25, zf - 0.05), V(0.75, 4.4, zf + 0.05)), trim);
      deco.add(boxGeo(V(-0.75, 5.5, zf - 0.05), V(0.75, 5.75, zf + 0.05)), trim);
      // an icon over the gateway (gold frame, blue field)
      deco.add(boxGeo(V(-0.45, 3.75, zf - 0.04), V(0.45, 4.15, zf + 0.04)), gold);
    }
    // open plank doors swung back against the inside of the pillars
    for (const s of [-1, 1]) deco.add(boxGeo(V(-0.08, 0.05, 0), V(0.08, 3.5, 1.55)), wood, at(s * 1.62, 0, Z - 1.1, 0, s * 0.35, 0).multiply(new THREE.Matrix4().makeTranslation(0, 0, -1.6)));
    // toll booth outside, right of the road: plank hut, gable roof, a counter window facing the road
    const [bx, , bz] = BOOTH;
    b.add(boxGeo(V(bx, 0, bz - 0.9), V(bx + 1.6, 0.95, bz + 0.9), 1), wood);
    b.add(boxGeo(V(bx, 1.75, bz - 0.9), V(bx + 1.6, 2.4, bz + 0.9), 1), wood);
    for (const dz of [-0.9, 0.78]) b.add(boxGeo(V(bx, 0.95, bz + dz), V(bx + 1.6, 1.75, bz + dz + 0.12)), wood);
    b.add(boxGeo(V(bx + 1.48, 0.95, bz - 0.9), V(bx + 1.6, 1.75, bz + 0.9)), wood);
    b.add(boxGeo(V(bx - 0.25, 0.92, bz - 0.95), V(bx + 0.1, 1.0, bz + 0.95)), wood); // counter
    for (const s of [-1, 1]) { // both roof slopes face outward (the far one wound the other way)
      const g = s > 0 ? quad(V(bx - 0.3, 2.4, bz + 1.15), V(bx + 1.9, 2.4, bz + 1.15), V(bx + 1.9, 3.1, bz), V(bx - 0.3, 3.1, bz))
        : quad(V(bx + 1.9, 2.4, bz - 1.15), V(bx - 0.3, 2.4, bz - 1.15), V(bx - 0.3, 3.1, bz), V(bx + 1.9, 3.1, bz));
      b.add(g, roofB);
    }
    deco.add(boxGeo(V(bx - 0.2, 0.0, bz + 1.0), V(bx + 0.4, 0.5, bz + 1.5)), wood); // a toll chest
    deco.add(boxGeo(V(bx - 0.22, 0.5, bz + 0.98), V(bx + 0.42, 0.56, bz + 1.52)), dark);
    // a striped toll barrier pole raised beside the booth
    deco.add(cyl(0.06, 0.06, 3.6, 8), trim, at(bx - 0.6, 2.2, bz + 1.6, 0, 0, 0.9));
    // the street inside: log izbas both sides, gables to the street, carved white window frames
    const izba = (x: number, z: number, s: number) => {
      const w = 2.6, d = 2.2, h = 2.8, x0 = x - (s < 0 ? w : 0) * 1, cx = x0 + w / 2;
      b.add(boxGeo(V(x0, 0, z - d), V(x0 + w, h, z + d), 1.4), logM);
      const ridge = h + 1.6, fx = s < 0 ? x0 + w : x0;
      for (const zz of [-1, 1]) {
        const g = zz > 0 ? quad(V(x0 - 0.3, h - 0.1, z + d + 0.4), V(x0 + w + 0.3, h - 0.1, z + d + 0.4), V(x0 + w + 0.3, ridge, z), V(x0 - 0.3, ridge, z), 2, 1.4)
          : quad(V(x0 + w + 0.3, h - 0.1, z - d - 0.4), V(x0 - 0.3, h - 0.1, z - d - 0.4), V(x0 - 0.3, ridge, z), V(x0 + w + 0.3, ridge, z), 2, 1.4);
        b.add(g, roofB);
      }
      for (const e of [x0, x0 + w]) {
        const gT = new THREE.BufferGeometry(), sgn = e === x0 ? -1 : 1;
        const pts = sgn > 0 ? [e, h, z + d, e, h, z - d, e, ridge, z] : [e, h, z - d, e, h, z + d, e, ridge, z];
        gT.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); gT.computeVertexNormals();
        b.add(gT, logM);
      }
      for (const dz of [-1.0, 1.0]) {
        const xf = fx + (s < 0 ? 0.02 : -0.02);
        deco.add(boxGeo(V(Math.min(xf, xf - s * 0.04), 1.0, z + dz - 0.4), V(Math.max(xf, xf - s * 0.04), 1.8, z + dz + 0.4)), win);
        deco.add(boxGeo(V(Math.min(xf, xf - s * 0.08), 0.88, z + dz - 0.52), V(Math.max(xf, xf - s * 0.08), 1.0, z + dz + 0.52)), trim);
        deco.add(boxGeo(V(Math.min(xf, xf - s * 0.08), 1.8, z + dz - 0.52), V(Math.max(xf, xf - s * 0.08), 2.05, z + dz + 0.52)), trim);
        for (const ee of [-1, 1]) deco.add(boxGeo(V(Math.min(xf, xf - s * 0.06), 1.0, z + dz + ee * 0.46 - 0.06), V(Math.max(xf, xf - s * 0.06), 1.8, z + dz + ee * 0.46 + 0.06)), blue);
      }
      void cx;
    };
    for (let z = -12.5; z > -44; z -= 5.6) { izba(-4.6, z, -1); izba(4.6, z - 1.8, 1); }
    // izbas outside the wall too (a suburb), so the wides through the gate are not empty
    for (const [x, z, s] of [[-6.5, -2, -1], [7.2, 0.5, 1], [-7.5, 6.5, -1], [8.0, 9.5, 1]] as const) izba(x, z, s);
    // the cart (the policeman hides behind it): a plank bed, two big wheels, shafts, hay
    const [kx, , kz] = CART;
    deco.add(boxGeo(V(kx - 0.6, 0.6, kz - 1.0), V(kx + 0.6, 0.72, kz + 1.0)), wood);
    for (const s of [-1, 1]) deco.add(boxGeo(V(kx + s * 0.6 - 0.04, 0.72, kz - 1.0), V(kx + s * 0.6 + 0.04, 1.05, kz + 1.0)), wood);
    deco.add(boxGeo(V(kx - 0.56, 0.72, kz - 0.95), V(kx + 0.56, 1.25, kz + 0.95)), hay);
    for (const s of [-1, 1]) deco.add(new THREE.TorusGeometry(0.48, 0.05, 6, 20), dark, at(kx + s * 0.7, 0.5, kz, 0, Math.PI / 2, 0));
    for (const s of [-1, 1]) deco.add(cyl(0.035, 0.035, 2.2, 6), wood, at(kx + s * 0.4, 0.55, kz + 1.9, Math.PI / 2 - 0.15, 0, 0));
    // the clerk's table with a ledger and a strongbox
    const [tx, , tz] = CLERK;
    deco.add(boxGeo(V(tx - 0.6, 0.78, tz - 0.4), V(tx + 0.6, 0.86, tz + 0.4)), wood);
    for (const [ox, oz] of [[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]]) deco.add(boxGeo(V(tx + ox - 0.04, 0, tz + oz - 0.04), V(tx + ox + 0.04, 0.78, tz + oz + 0.04)), dark);
    deco.add(boxGeo(V(tx - 0.58, 0.86, tz - 0.38), V(tx + 0.58, 0.88, tz + 0.38)), cloth);
    deco.add(boxGeo(V(tx - 0.4, 0.88, tz - 0.2), V(tx - 0.02, 0.94, tz + 0.12)), lam("mosLedger", () => ({ color: "#efe2bf" })));
    deco.add(boxGeo(V(tx + 0.12, 0.88, tz - 0.25), V(tx + 0.5, 1.12, tz + 0.05)), dark);
    // the church at the end of the street: white walls, a drum, one big gold onion and four blue ones
    const cz = -50, ch = 7;
    b.add(boxGeo(V(-4, 0, cz - 4), V(4, ch, cz + 4), 2), white);
    b.add(boxGeo(V(-4.2, ch, cz - 4.2), V(4.2, ch + 0.4, cz + 4.2)), trim);
    const onion = (x: number, y: number, z: number, r: number, mat: THREE.Material) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16, rr = r * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : Math.max(0.02, (1 - t) / 0.45) ** 1.4); pts.push(new THREE.Vector2(Math.max(0.01, rr), t * r * 2.3)); }
      deco.add(new THREE.LatheGeometry(pts, 16), mat, at(x, y, z));
      deco.add(cyl(0.04 * r, 0.04 * r, 1.0 * r, 6), gold, at(x, y + r * 2.3 + 0.5 * r, z));
      deco.add(boxGeo(V(x - 0.3 * r, y + r * 2.75, z - 0.03), V(x + 0.3 * r, y + r * 2.82, z + 0.03)), gold);
    };
    deco.add(cyl(1.5, 1.5, 3, 16), white, at(0, ch + 1.9, cz));
    onion(0, ch + 3.4, cz, 1.8, gold);
    for (const [ox, oz] of [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]]) { deco.add(cyl(0.7, 0.7, 1.6, 12), white, at(ox, ch + 1.2, cz + oz)); onion(ox, ch + 2.0, cz + oz, 0.85, blue); }
    for (let i = 0; i < 3; i++) deco.add(boxGeo(V(-2.6 + i * 2.1, 2.2, cz + 4.0), V(-1.8 + i * 2.1, 4.4, cz + 4.06)), win);
    deco.add(boxGeo(V(-0.9, 0, cz + 4.0), V(0.9, 3.0, cz + 4.06)), dark);
    // birches and a few trees round the walls
    const tree = (x: number, z: number, s: number, bir = false) => {
      deco.add(cyl(0.13 * s, 0.18 * s, 3.4 * s, 8), bir ? birch : dark, at(x, 1.7 * s, z));
      deco.add(new THREE.SphereGeometry(1.2 * s, 12, 9), leaf, at(x, 3.9 * s, z).scale(V(1, 1.3, 1)));
    };
    for (const [x, z, s, bb] of [[-11, 3, 1.2, 1], [12, -2, 1.3, 1], [-14, 14, 1.4, 0], [15, 18, 1.2, 1], [-12, -20, 1.3, 0], [11, -30, 1.2, 1], [-16, -6, 1.1, 1], [18, 6, 1.3, 0]] as const) tree(x, z, s, !!bb);
    b.build(this.root, false);
    deco.build(this.root, true);
    // sky dome + the two painted backdrops (unlit, no fog)
    const skyTex = ctex("mosSky", 64, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#2f6cc8"); gr.addColorStop(0.3, "#3f7fd6"); gr.addColorStop(0.44, "#86b4ec"); gr.addColorStop(0.5, "#c8def4"); gr.addColorStop(1, "#c8def4");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -2; dome.layers.set(NOINK); this.root.add(dome);
    for (const [tex, z, ry, top] of [[cityBack(), -95, 0, 828], [fieldBack(), 95, Math.PI, 840]] as const) {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(260, 130), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, alphaTest: 0.02 }));
      back.position.set(0, 130 * (top / 1024) - 65 - 0.4, z); back.rotation.y = ry; back.layers.set(NOINK); this.root.add(back);
    }
  }
}
