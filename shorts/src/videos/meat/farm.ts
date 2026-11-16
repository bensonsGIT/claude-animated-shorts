// The Crouch farm, Bath County, Kentucky, 3 March 1876: a log cabin, a dirt yard with the soap kettle on its tripod
// over a fire, split-rail fences, a field running back to the woods, and a painted backdrop of rolling hills and a
// clear blue sky. Ground y = 0; the yard is around the origin, the cabin behind it (z < -6), the field to the right.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, grassHD, roofHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

/** the soap kettle (centre of its rim) */
export const KETTLE: V3 = [1.0, 0.62, -2.6];
/** the fence post where the big chunk lands (top centre) */
export const POST: V3 = [-1.6, 1.12, -0.6];

const dirt = () => ctex("farmDirt", 512, 512, (g, r) => {
  g.fillStyle = "#a88a62"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(130,104,70,0.5)" : "rgba(196,170,128,0.5)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 6, 0, Math.PI * 2); g.fill(); }
});
const logs = () => ctex("farmLogs", 512, 512, (g, r) => {
  for (let i = 0; i < 8; i++) {
    const y = i * 64, c = ["#8a6040", "#7e5638", "#94684a"][i % 3];
    g.fillStyle = c; g.fillRect(0, y, 512, 64);
    g.fillStyle = "rgba(255,230,190,0.18)"; g.fillRect(0, y + 8, 512, 10);
    g.fillStyle = "#4a3020"; g.fillRect(0, y + 58, 512, 6);
    for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(60,36,20,0.4)"; g.lineWidth = 2; const x = r() * 512; g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x + 40, y + 24 + r() * 20); g.stroke(); }
  }
});
/** hills, woods and a clear blue sky (no clouds: "a clear blue sky") */
const hills = () => ctex("farmHills", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024); // sky comes from the dome; only the land is painted here
  const ink = "#141018";
  const ridge = (y0: number, amp: number, f: number, col: string, ph: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 1024);
    for (let x = 0; x <= 2048; x += 32) g.lineTo(x, y0 - amp * Math.sin(x / f + ph) - amp * 0.4 * Math.sin(x / (f * 0.37) + ph * 2));
    g.lineTo(2048, 1024); g.fill();
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath();
    for (let x = 0; x <= 2048; x += 32) { const y = y0 - amp * Math.sin(x / f + ph) - amp * 0.4 * Math.sin(x / (f * 0.37) + ph * 2); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  };
  ridge(640, 60, 300, "#7a9ab8", 0.5);
  ridge(720, 50, 220, "#5f8a5a", 2.0);
  // a tree line
  for (let x = 0; x < 2048; x += 26 + r() * 20) { g.fillStyle = r() < 0.5 ? "#3f6a3a" : "#4f7a44"; g.beginPath(); g.ellipse(x, 770 + r() * 10, 22 + r() * 14, 34 + r() * 20, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke(); }
  ridge(830, 24, 400, "#8ab060", 1.0);
  // a distant barn
  g.fillStyle = "#a83a2a"; g.fillRect(1480, 760, 90, 60); g.beginPath(); g.moveTo(1470, 760); g.lineTo(1525, 725); g.lineTo(1580, 760); g.fill();
  g.strokeStyle = ink; g.lineWidth = 5; g.strokeRect(1480, 760, 90, 60);
});

export class Farm extends Room {
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const grass = twoTone(new THREE.MeshLambertMaterial({ map: grassHD() }));
    const yard = twoTone(new THREE.MeshLambertMaterial({ map: dirt() }));
    const wood = lam("farmWood", () => ({ map: beam() }));
    const logM = lam("farmLog", () => ({ map: logs() }));
    const roofM = lam("farmRoof", () => ({ map: roofHD("#7a6a5a") }));
    const stone = lam("farmStone", () => ({ color: "#a8a096" }));
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#2e3038", specular: "#8a8a8a", shininess: 40 }), 0.15);
    const dark = lam("farmDark", () => ({ color: "#3a2a20" }));
    const leaf = lam("farmLeaf", () => ({ color: "#5d8a3a" }));
    const leaf2 = lam("farmLeaf2", () => ({ color: "#4a7a34" }));
    const soap = lam("farmSoap", () => ({ color: "#d8c89a" }));
    // ground: grass all round (winding: +y normal), a dirt yard in front of the cabin
    b.add(quad(V(-60, 0, 40), V(60, 0, 40), V(60, 0, -60), V(-60, 0, -60), 40, 33), grass);
    b.add(quad(V(-4.5, 0.01, 2.5), V(4.5, 0.01, 2.5), V(4.5, 0.01, -6.5), V(-4.5, 0.01, -6.5), 4, 4), yard);
    // the log cabin: 6 x 4.5 m, walls 2.6 m, gable roof, stone chimney, a door and a window
    const cx = -1.0, cz = -9.0, w = 3.0, d = 2.25, hW = 2.6;
    b.add(boxGeo(V(cx - w, 0, cz - d), V(cx + w, hW, cz + d), 1.4), logM);
    const ridgeY = hW + 1.7;
    for (const s of [-1, 1]) {
      const zEave = cz + s * (d + 0.5);
      const g = s > 0 ? quad(V(cx - w - 0.4, hW - 0.15, zEave), V(cx + w + 0.4, hW - 0.15, zEave), V(cx + w + 0.4, ridgeY, cz), V(cx - w - 0.4, ridgeY, cz), 3, 1.5)
        : quad(V(cx + w + 0.4, hW - 0.15, zEave), V(cx - w - 0.4, hW - 0.15, zEave), V(cx - w - 0.4, ridgeY, cz), V(cx + w + 0.4, ridgeY, cz), 3, 1.5);
      b.add(g, roofM);
    }
    for (const s of [-1, 1]) { // gable triangles
      const x = cx + s * w, gT = new THREE.BufferGeometry();
      const pts = s > 0 ? [x, hW, cz + d, x, hW, cz - d, x, ridgeY, cz] : [x, hW, cz - d, x, hW, cz + d, x, ridgeY, cz];
      gT.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); gT.computeVertexNormals();
      b.add(gT, logM);
    }
    b.add(boxGeo(V(cx + w, 0, cz - 0.5), V(cx + w + 0.8, ridgeY + 0.9, cz + 0.4), 1), stone);
    b.add(boxGeo(V(cx - 0.5, 0, cz + d), V(cx + 0.5, 2.0, cz + d + 0.06)), dark);
    b.add(boxGeo(V(cx + 1.4, 1.1, cz + d), V(cx + 2.3, 1.9, cz + d + 0.05)), lam("farmWin", () => ({ color: "#2a3a5a" })));
    b.add(boxGeo(V(cx - 0.7, 0, cz + d), V(cx + 0.7, 0.15, cz + d + 0.6)), wood);
    // split-rail fences: along the front of the yard (z = -0.6, with a gap for the gate) and down the right side
    const rail = (a: THREE.Vector3, c: THREE.Vector3) => {
      const mid = a.clone().add(c).multiplyScalar(0.5), len = a.distanceTo(c);
      deco.add(cyl(0.05, 0.05, len, 6), wood, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
    };
    const fenceLine = (pts: [number, number][]) => {
      for (const [x, z] of pts) deco.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 1.08, z + 0.07)), wood);
      for (let i = 0; i + 1 < pts.length; i++) for (const y of [0.45, 0.85]) rail(V(pts[i][0], y, pts[i][1]), V(pts[i + 1][0], y + 0.04, pts[i + 1][1]));
    };
    fenceLine([[-6.4, -0.6], [-4.0, -0.6], [-1.6, -0.6]]);
    fenceLine([[1.2, -0.6], [3.6, -0.6], [6.0, -0.6], [6.0, -3.0], [6.0, -5.4], [6.0, -7.8]]);
    deco.add(boxGeo(V(POST[0] - 0.09, 1.05, POST[2] - 0.09), V(POST[0] + 0.09, 1.1, POST[2] + 0.09)), wood);
    // the soap kettle: black iron pot on a tripod over a wood fire, a paddle, a tub of finished soap
    const [kx, ky, kz] = KETTLE;
    const pot = new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    deco.add(pot, iron, at(kx, ky, kz));
    deco.add(new THREE.TorusGeometry(0.42, 0.03, 6, 24), iron, at(kx, ky, kz, Math.PI / 2));
    deco.add(new THREE.CircleGeometry(0.4, 20), lam("farmLye", () => ({ color: "#b8a070" })), at(kx, ky - 0.04, kz, -Math.PI / 2));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4, fx = kx + 0.75 * Math.cos(a), fz = kz + 0.75 * Math.sin(a);
      rail(V(fx, 0, fz), V(kx, 1.45, kz));
    }
    deco.add(cyl(0.006, 0.006, 0.4), iron, at(kx, 1.25, kz));
    for (let i = 0; i < 5; i++) deco.add(cyl(0.05, 0.05, 0.7, 6), dark, at(kx + 0.15 * Math.cos(i), 0.06, kz + 0.15 * Math.sin(i), Math.PI / 2, i * 0.8, 0));
    this.flame(kx - 0.1, 0.18, kz + 0.1, 0.32, 0.42, 2.8);
    this.flame(kx + 0.12, 0.16, kz - 0.05, 0.26, 0.34, 2.6);
    deco.add(cyl(0.3, 0.26, 0.35, 14), wood, at(kx + 1.1, 0.175, kz + 0.3));
    deco.add(cyl(0.27, 0.27, 0.02, 14), soap, at(kx + 1.1, 0.34, kz + 0.3));
    // woodpile + chopping block by the cabin
    for (let i = 0; i < 12; i++) deco.add(cyl(0.08, 0.08, 0.9, 7), wood, at(-3.6 + (i % 4) * 0.17, 0.08 + Math.floor(i / 4) * 0.15, -5.6, Math.PI / 2, 0, 0));
    deco.add(cyl(0.25, 0.27, 0.45, 12), wood, at(-2.5, 0.22, -4.8));
    // trees round the yard and the field
    const tree = (x: number, z: number, s: number) => {
      deco.add(cyl(0.16 * s, 0.22 * s, 3.2 * s, 8), dark, at(x, 1.6 * s, z));
      deco.add(new THREE.SphereGeometry(1.4 * s, 12, 9), leaf, at(x, 3.8 * s, z));
      deco.add(new THREE.SphereGeometry(1.0 * s, 12, 9), leaf2, at(x + 0.8 * s, 3.2 * s, z + 0.4 * s));
    };
    for (const [x, z, s] of [[-7.5, -6, 1.2], [4.5, -12, 1.3], [9.5, -4, 1.1], [-10, -14, 1.4], [12, -16, 1.5], [-6, -20, 1.3], [7, -24, 1.2], [-13, -2, 1.1]] as const) tree(x, z, s);
    b.build(this.root, false);
    deco.build(this.root, true);
    // sky dome (clear blue, deeper overhead) for cameras looking up at the vultures
    const skyTex = ctex("farmSky", 64, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#2f6cc8"); gr.addColorStop(0.3, "#3f7fd6"); gr.addColorStop(0.44, "#86b4ec"); gr.addColorStop(0.5, "#c8def4"); gr.addColorStop(1, "#c8def4");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(95, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -2; dome.layers.set(NOINK); this.root.add(dome);
    // backdrop: hills and sky, unlit, no fog; tall enough to fill a camera tilted up
    const back = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), new THREE.MeshBasicMaterial({ map: hills(), fog: false, transparent: true, alphaTest: 0.02 }));
    back.position.set(0, 110 * (830 / 1024) - 55 - 0.5, -70); back.layers.set(NOINK); this.root.add(back);
  }
}
