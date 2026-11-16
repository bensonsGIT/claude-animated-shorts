// The great hall (1566 party + duel) and its far-right corner dressed as Tycho's study (instruments, star chart).
// Floor at y = 0, x across (-8..8), z along the hall (fireplace at z = -14, entrance at z = +10), ceiling at 7 m.
// Shell (floor, walls, ceiling) receives but never casts: the key light sits outside the room.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex, planksHD, stoneHD, beam } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Pen, fxFlame } from "./toon";

export const HALL = { x0: -8, x1: 8, z0: -14, z1: 10, h: 7 };
export const TABLE = { x: -3.2, w: 1.3, z0: -9, z1: 3, top: 0.8 };
export const BENCH = { far: -4.35, near: -2.05, top: 0.45 };
export const DESK: [number, number, number] = [5.2, 0, -11.2];

const flameTex = (s: number) => ctex(`flame${s}`, 128, 256, (g) => fxFlame(new Pen(g), s));
const glowTex = () => ctex("fireGlow", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,190,110,0.9)"); gr.addColorStop(0.4, "rgba(255,150,70,0.35)"); gr.addColorStop(1, "rgba(255,120,50,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** Dannebrog: red field, white Nordic cross (offset toward the hoist) */
const dannebrog = () => ctex("dannebrog", 256, 512, (g) => {
  g.fillStyle = "#c8102e"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#ffffff"; g.fillRect(96, 0, 52, 512); g.fillRect(0, 170, 256, 52);
  g.strokeStyle = "#241726"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 502);
});
/** the Brahe arms: argent, a pale sable (white field, one black upright stripe), gold fringe */
const braheArms = () => ctex("braheArms", 256, 512, (g) => {
  g.fillStyle = "#f2ede2"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#1e1a22"; g.fillRect(96, 0, 64, 470);
  g.fillStyle = "#d8b04a"; g.fillRect(0, 470, 256, 42);
  g.strokeStyle = "#241726"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 502);
});
/** parchment star chart: ruled circles, constellation dots and lines */
const starChart = () => ctex("starChart", 512, 512, (g, r) => {
  g.fillStyle = "#ead9b0"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#7a5a3a"; g.lineWidth = 4;
  for (const rr of [220, 160, 90]) { g.beginPath(); g.arc(256, 256, rr, 0, Math.PI * 2); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + 220 * Math.cos(a), 256 + 220 * Math.sin(a)); g.stroke(); }
  g.fillStyle = "#1f2a5a"; g.strokeStyle = "#1f2a5a"; g.lineWidth = 3;
  for (let c = 0; c < 6; c++) {
    const pts: [number, number][] = [];
    const cx = 256 + (r() - 0.5) * 300, cy = 256 + (r() - 0.5) * 300;
    for (let k = 0; k < 4; k++) pts.push([cx + (r() - 0.5) * 110, cy + (r() - 0.5) * 110]);
    g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
  }
  g.strokeStyle = "#241726"; g.lineWidth = 12; g.strokeRect(6, 6, 500, 500);
});

export const cyl = (r0: number, r1: number, h: number, n = 12) => new THREE.CylinderGeometry(r0, r1, h, n);
export const at = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(s, s, s));

type Flame = { s: THREE.Sprite; k: number; w: number; h: number; base: number };

/** a lit interior: owns its flame cards (flickered per frame) and additive glows */
export class Room {
  root = new THREE.Group();
  protected flames: Flame[] = [];
  private maps = [flameTex(-1), flameTex(0), flameTex(1)];

  /** a flame card (unlit, HDR so the bloom picks up its core) */
  protected flame(x: number, y: number, z: number, w: number, hgt: number, hdr: number) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.maps[1], color: new THREE.Color(hdr, hdr * 0.72, hdr * 0.42), transparent: true,
      depthWrite: false, fog: false }));
    s.position.set(x, y, z); s.scale.set(w, hgt, 1); s.layers.set(NOINK); s.renderOrder = 4;
    this.root.add(s);
    this.flames.push({ s, k: this.flames.length * 1.618, w, h: hgt, base: y });
  }

  protected glow(x: number, y: number, z: number, size: number, a: number) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(1, 1, 1), transparent: true, opacity: a,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.position.set(x, y, z); s.scale.set(size, size, 1); s.layers.set(NOINK); s.renderOrder = 5;
    this.root.add(s);
    this.glows.push(s);
  }
  protected glows: THREE.Sprite[] = [];
  /** show / hide every flame and glow of this room (candles out by day) */
  setFlames(on: boolean) { for (const f of this.flames) f.s.visible = on; for (const g of this.glows) g.visible = on; }

  /** deterministic per-frame flicker: lean frame + height wobble per flame */
  update(t: number) {
    for (const f of this.flames) {
      const n = Math.sin(t * 9.1 + f.k) * 0.5 + Math.sin(t * 15.7 + f.k * 2.3) * 0.5;
      (f.s.material as THREE.SpriteMaterial).map = this.maps[n < -0.35 ? 0 : n > 0.35 ? 2 : 1];
      const hk = 1 + 0.12 * n;
      f.s.scale.set(f.w * (1 - 0.05 * n), f.h * hk, 1);
      f.s.position.y = f.base + (f.h * (hk - 1)) / 2;
    }
  }
}

export class Hall extends Room {
  constructor() {
    super();
    const shell = new Batch(), deco = new Batch(), fix = new Batch(); // fix: wall-mounted, no shadows
    const { x0, x1, z0, z1, h } = HALL;
    const wall = lam("hallWall", () => ({ map: stoneHD("hallWall", ["#a7a6b0", "#9c9ba6", "#b1b0b9", "#94939e", "#a3a2ac"], "#6e6c78") }));
    const trim = lam("hallTrim", () => ({ map: stoneHD("hallTrim", ["#e0cba8", "#d6bf9b", "#e7d6b7", "#cdb592"], "#9b8364") }));
    const planks = lam("hallPlanks", () => ({ map: planksHD() }));
    const flags = lam("hallFlags", () => ({ map: stoneHD("hallFlags", ["#8f877d", "#857d74", "#99918a", "#7d766e"], "#4e4842") }));
    const wood = lam("wood", () => ({ map: beam() }));
    const panel = lam("hallPanel", () => ({ color: "#7a4430" }));
    const ceil = lam("hallCeil", () => ({ color: "#4f3022" }));
    const soot = lam("hallSoot", () => ({ color: "#2a1a18" }));
    const cloth = lam("hallCloth", () => ({ color: "#efe4cc" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 50 }), 0.15);
    const pewter = twoTone(new THREE.MeshPhongMaterial({ color: "#b4b6be", specular: "#ffffff", shininess: 60 }), 0.2);
    const wax = lam("hallWax", () => ({ color: "#f5ecd6" }));
    const bread = lam("hallBread", () => ({ color: "#d39a52" }));
    const apple = lam("hallApple", () => ({ color: "#c8343c" }));
    const grape = lam("hallGrape", () => ({ color: "#6a2f7a" }));
    const roast = lam("hallRoast", () => ({ color: "#b0602e" }));
    const globeM = lam("hallGlobe", () => ({ color: "#3f6fb5" }));

    // ---- shell ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.5, (z1 - z0) / 2.5), flags);
    shell.add(boxGeo(V(x0 - 0.6, 0, z0), V(x0, h, z1), 2.5), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.6, h, z1), 2.5), wall);
    shell.add(boxGeo(V(x0 - 0.6, 0, z0 - 0.6), V(x1 + 0.6, h, z0), 2.5), wall);
    shell.add(boxGeo(V(x0 - 0.6, 0, z1), V(x1 + 0.6, h, z1 + 0.6), 2.5), wall);
    shell.add(boxGeo(V(x0 - 0.6, h, z0 - 0.6), V(x1 + 0.6, h + 0.4, z1 + 0.6), 0, true), ceil);
    // wainscot panels + rail along both long walls and the far wall
    for (const s of [-1, 1]) {
      const xw = s < 0 ? x0 : x1;
      shell.add(boxGeo(V(Math.min(xw, xw - s * 0.08), 0, z0), V(Math.max(xw, xw - s * 0.08), 1.5, z1), 0), panel);
      shell.add(boxGeo(V(Math.min(xw, xw - s * 0.14), 1.5, z0), V(Math.max(xw, xw - s * 0.14), 1.62, z1), 0), wood);
    }
    // ceiling: cross beams every 3 m, two long purlins
    for (let z = z0 + 1.5; z < z1; z += 3) shell.add(boxGeo(V(x0, h - 0.55, z - 0.18), V(x1, h, z + 0.18), 2), wood);
    for (const x of [-4, 4]) shell.add(boxGeo(V(x - 0.16, h - 0.75, z0), V(x + 0.16, h - 0.55, z1), 2), wood);

    // ---- fireplace on the far wall ----
    fix.add(boxGeo(V(-2.5, 0, z0), V(2.5, 0.22, z0 + 0.9), 1), trim);
    for (const s of [-1, 1]) fix.add(boxGeo(V(s < 0 ? -2.5 : 1.75, 0.22, z0), V(s < 0 ? -1.75 : 2.5, 2.6, z0 + 0.65), 1), trim);
    fix.add(boxGeo(V(-2.75, 2.6, z0), V(2.75, 3.1, z0 + 0.9), 1), trim);
    fix.add(boxGeo(V(-2.1, 3.1, z0), V(2.1, 6.45, z0 + 0.5), 1.5), trim);
    fix.add(boxGeo(V(-1.75, 0.22, z0), V(1.75, 2.6, z0 + 0.08), 0), soot);
    for (const [x, r] of [[-0.35, 0.12], [0.3, 0.14], [0, 0.11]] as const)
      fix.add(cyl(r, r, 1.3), wood, at(x, 0.36 + (x === 0 ? 0.18 : 0), z0 + 0.42, 0, 0.3 * x, Math.PI / 2));
    this.flame(-0.45, 0.62, z0 + 0.45, 0.7, 1.3, 3.2);
    this.flame(0.15, 0.7, z0 + 0.4, 0.85, 1.6, 3.4);
    this.flame(0.55, 0.6, z0 + 0.48, 0.6, 1.1, 3.0);
    this.glow(0, 1.1, z0 + 0.9, 4.2, 0.55);

    // ---- banquet table, runner, benches ----
    const { x: tx, w: tw, z0: ta, z1: tb, top } = TABLE;
    deco.add(boxGeo(V(tx - tw / 2, top - 0.07, ta), V(tx + tw / 2, top, tb), 1.5), planks);
    deco.add(boxGeo(V(tx - 0.32, top, ta + 0.2), V(tx + 0.32, top + 0.006, tb - 0.2), 0), cloth);
    for (const z of [ta + 0.4, (ta + tb) / 2, tb - 0.4]) deco.add(boxGeo(V(tx - 0.08, 0, z - 0.08), V(tx + 0.08, top - 0.07, z + 0.08)), wood);
    deco.add(boxGeo(V(tx - 0.05, 0.12, ta + 0.4), V(tx + 0.05, 0.22, tb - 0.4)), wood);
    for (const bx of [BENCH.far, BENCH.near]) {
      deco.add(boxGeo(V(bx - 0.2, BENCH.top - 0.06, ta + 0.3), V(bx + 0.2, BENCH.top, tb - 0.3), 1), wood);
      for (const z of [ta + 0.6, (ta + tb) / 2, tb - 0.6]) deco.add(boxGeo(V(bx - 0.05, 0, z - 0.15), V(bx + 0.05, BENCH.top - 0.06, z + 0.15)), wood);
    }
    // candlesticks every 2 m down the runner, plates, goblets, food, and a roast at the centre
    for (let z = ta + 1; z < tb; z += 2) {
      deco.add(cyl(0.07, 0.08, 0.05), brass, at(tx, top + 0.025, z));
      deco.add(cyl(0.025, 0.03, 0.26), brass, at(tx, top + 0.18, z));
      deco.add(cyl(0.035, 0.035, 0.18), wax, at(tx, top + 0.4, z));
      this.flame(tx, top + 0.54, z, 0.09, 0.18, 2.6);
    }
    let k = 0;
    for (let z = ta + 0.7; z < tb - 0.3; z += 1.4) for (const sx of [-1, 1]) {
      const x = tx + sx * 0.42;
      deco.add(cyl(0.17, 0.15, 0.02, 16), pewter, at(x, top + 0.01, z));
      const gx = x + sx * 0.05, gz = z + 0.32;
      deco.add(cyl(0.05, 0.03, 0.09), brass, at(gx, top + 0.1, gz));
      deco.add(cyl(0.006, 0.006, 0.06), brass, at(gx, top + 0.03, gz));
      deco.add(cyl(0.04, 0.045, 0.01), brass, at(gx, top + 0.005, gz));
      const f = k++ % 3;
      if (f === 0) deco.add(new THREE.SphereGeometry(0.06, 10, 8), apple, at(x, top + 0.06, z));
      else if (f === 1) deco.add(new THREE.SphereGeometry(0.08, 10, 8), bread, at(x, top + 0.05, z, 0, 0, 0, 1).scale(V(1.4, 0.7, 1)));
      else for (let g = 0; g < 4; g++) deco.add(new THREE.SphereGeometry(0.03, 8, 6), grape, at(x + (g % 2) * 0.05 - 0.025, top + 0.04 + (g > 1 ? 0.04 : 0), z + (g % 2 ? 0.02 : -0.02)));
    }
    deco.add(cyl(0.34, 0.3, 0.03, 20), pewter, at(tx, top + 0.015, -5));
    deco.add(new THREE.SphereGeometry(0.25, 16, 12), roast, at(tx, top + 0.15, -5).scale(V(1, 0.6, 1.6)));

    // ---- chandeliers ----
    for (const z of [-6, 0]) {
      const y = 4.4;
      fix.add(new THREE.TorusGeometry(0.85, 0.05, 8, 32), iron, at(tx, y, z, Math.PI / 2));
      fix.add(boxGeo(V(tx - 0.02, y, z - 0.02), V(tx + 0.02, HALL.h - 0.55, z + 0.02)), iron);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, cx = tx + 0.85 * Math.cos(a), cz = z + 0.85 * Math.sin(a);
        fix.add(cyl(0.03, 0.03, 0.16), wax, at(cx, y + 0.1, cz));
        this.flame(cx, y + 0.26, cz, 0.08, 0.16, 2.6);
      }
    }

    // ---- wall torches ----
    for (const xw of [x0 + 0.12, x1 - 0.12]) for (const z of [-10, -4, 2, 8]) {
      const s = xw < 0 ? 1 : -1;
      fix.add(boxGeo(V(xw - 0.06, 2.3, z - 0.06), V(xw + 0.06, 2.42, z + 0.06)), iron);
      fix.add(cyl(0.045, 0.03, 0.55), wood, at(xw + s * 0.1, 2.6, z, 0, 0, -s * 0.25));
      this.flame(xw + s * 0.2, 2.98, z, 0.22, 0.46, 3.0);
    }

    // ---- banners ----
    const cloths = [dannebrog(), braheArms()];
    const banner = (xw: number, z: number, which: number) => {
      const w = 1.4, y0 = 2.5, y1 = 5.6, s = xw < 0 ? 1 : -1, x = xw + s * 0.02;
      const mat = twoTone(new THREE.MeshLambertMaterial({ map: cloths[which], side: THREE.DoubleSide }));
      const g = s < 0 ? quad(V(x, y0, z - w / 2), V(x, y0, z + w / 2), V(x, y1, z + w / 2), V(x, y1, z - w / 2)) : quad(V(x, y0, z + w / 2), V(x, y0, z - w / 2), V(x, y1, z - w / 2), V(x, y1, z + w / 2));
      shell.add(g, mat);
      fix.add(boxGeo(V(x - 0.04, y1, z - w / 2 - 0.12), V(x + 0.04, y1 + 0.08, z + w / 2 + 0.12)), wood);
    };
    banner(x1, -8, 0); banner(x1, -2, 1); banner(x1, 4, 0);
    banner(x0, -7, 1); banner(x0, -1, 0); banner(x0, 5, 1);

    // ---- study corner: desk, armillary sphere, globe, mural quadrant, star chart ----
    const [dx, , dz] = DESK;
    deco.add(boxGeo(V(dx - 0.8, 0.72, dz - 0.45), V(dx + 0.8, 0.8, dz + 0.45), 1.5), planks);
    for (const [ox, oz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) deco.add(boxGeo(V(dx + ox - 0.05, 0, dz + oz - 0.05), V(dx + ox + 0.05, 0.72, dz + oz + 0.05)), wood);
    const ac = V(dx - 0.35, 1.2, dz);
    deco.add(cyl(0.03, 0.05, 0.3), brass, at(ac.x, 0.95, ac.z));
    for (const [rx, ry] of [[0, 0], [Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [0.41, 0]] as const)
      deco.add(new THREE.TorusGeometry(0.26, 0.012, 6, 40), brass, at(ac.x, ac.y, ac.z, rx, ry, rx === 0.41 ? 0.41 : 0));
    deco.add(new THREE.SphereGeometry(0.04, 10, 8), brass, at(ac.x, ac.y, ac.z));
    deco.add(cyl(0.02, 0.02, 0.6), brass, at(ac.x, ac.y, ac.z, 0, 0, 0.41));
    deco.add(new THREE.SphereGeometry(0.2, 20, 14), globeM, at(dx + 0.4, 1.02, dz));
    deco.add(new THREE.TorusGeometry(0.22, 0.012, 6, 32), brass, at(dx + 0.4, 1.02, dz, 0, Math.PI / 2));
    deco.add(cyl(0.025, 0.06, 0.22), wood, at(dx + 0.4, 0.82, dz));
    // Tycho's mural quadrant: a quarter-circle brass arc and its radius bars on the right wall
    const qx = x1 - 0.15, qc = V(qx, 5.4, -12.6);
    fix.add(new THREE.TorusGeometry(2.4, 0.07, 8, 40, Math.PI / 2), brass, at(qc.x, qc.y, qc.z, 0, Math.PI / 2, Math.PI));
    for (const a of [Math.PI, (3 * Math.PI) / 2]) {
      const e = V(qx, qc.y + 2.4 * Math.sin(a), qc.z + 2.4 * Math.cos(a) * -1);
      const mid = qc.clone().add(e).multiplyScalar(0.5), len = qc.distanceTo(e);
      fix.add(boxGeo(V(-0.04, -len / 2, -0.04), V(0.04, len / 2, 0.04)), brass,
        new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), e.clone().sub(qc).normalize()), V(1, 1, 1)));
    }
    const chart = twoTone(new THREE.MeshLambertMaterial({ map: starChart() }));
    shell.add(quad(V(3.6, 2.0, z0 + 0.03), V(6.6, 2.0, z0 + 0.03), V(6.6, 5.0, z0 + 0.03), V(3.6, 5.0, z0 + 0.03)), chart);
    deco.add(new THREE.SphereGeometry(0.05, 8, 6), wax, at(dx - 0.6, 0.86, dz + 0.25));
    deco.add(cyl(0.035, 0.035, 0.16), wax, at(dx - 0.6, 0.9, dz + 0.25));
    this.flame(dx - 0.6, 1.04, dz + 0.25, 0.09, 0.18, 2.6);

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }
}
