// Australian bush (Tasmania-ish open eucalypt woodland): dry grass ground with bare dirt patches, tussocks (instanced
// crossed cards), a big flat-topped boulder (the latrine rock, ROCK), a fallen log (LOG), a wombat burrow in a dirt mound
// (BURROW), white-trunked gum trees, a painted horizon and a sky dome for day, dusk and a starry moonlit night.
// The poo cubes are real little boxes (lit and inked like the set): pose() places them from the story.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../../engine/build";
import { ctex } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

/** the latrine boulder: centre on the ground, flat top at y ROCK_TOP */
export const ROCK: V3 = [0, 0, 0];
export const ROCK_TOP = 0.52;
/** the fallen log along x: centre, radius (top of the log at y 2 * LOG_R) */
export const LOG: V3 = [-2.6, 0, -1.6];
export const LOG_R = 0.24;
/** burrow mound centre; the hole faces +z */
export const BURROW: V3 = [2.4, 0, -2.2];
export const CUBE = 0.11;

const ground = () => ctex("wbGround", 512, 512, (g, r) => {
  g.fillStyle = "#a89a62"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,104,70,0.45)" : "rgba(120,130,70,0.4)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 22, 4 + r() * 12, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 2600; i++) { g.strokeStyle = r() < 0.5 ? "rgba(196,180,120,0.7)" : "rgba(130,120,70,0.6)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y - 5 - r() * 7); g.stroke(); }
});
const dirt = () => ctex("wbDirt", 256, 256, (g, r) => {
  g.fillStyle = "#9a7448"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,86,52,0.6)" : "rgba(186,146,98,0.5)"; g.beginPath(); g.arc(r() * 256, r() * 256, 1 + r() * 4, 0, Math.PI * 2); g.fill(); }
});
const rockTex = () => ctex("wbRock", 256, 256, (g, r) => {
  g.fillStyle = "#8e8a84"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,106,100,0.6)" : "rgba(170,166,156,0.5)"; g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 10, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(150,170,110,0.55)"; g.beginPath(); g.arc(r() * 256, r() * 256, 4 + r() * 8, 0, Math.PI * 2); g.fill(); } // lichen
});
const barkTex = () => ctex("wbLog", 256, 128, (g, r) => {
  g.fillStyle = "#7a6248"; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 40; i++) { g.strokeStyle = r() < 0.5 ? "#5a4632" : "#9a8064"; g.lineWidth = 3; const y = r() * 128; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + (r() - 0.5) * 10); g.stroke(); }
});
/** one tussock: tufts of thin grass blades, transparent around (alpha-tested), 256 x 256 */
const tussock = () => ctex("wbTussock", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    const x0 = 100 + r() * 56, lean = (r() - 0.5) * 170, top = 40 + r() * 110;
    g.strokeStyle = ["#b8aa62", "#9a9a52", "#c8ba78", "#7a8448"][i % 4]; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x0, 256); g.quadraticCurveTo(x0 + lean * 0.2, 150, x0 + lean, top); g.stroke();
  }
});
/** the horizon: low rolling blue hills and a line of far gums (transparent sky) */
const horizon = (night: boolean) => ctex(night ? "wbHorizonN" : "wbHorizon", 2048, 1024, (g, r) => {
  g.clearRect(0, 0, 2048, 1024);
  const hill = night ? "#26304e" : "#7f92a6", trees = night ? "#1c2440" : "#5f7256", fl = night ? "#2a3048" : "#9a9060";
  g.fillStyle = hill; g.beginPath(); g.moveTo(0, 1024);
  for (let x = 0; x <= 2048; x += 32) g.lineTo(x, 740 - 40 * Math.sin(x / 300) - 16 * Math.sin(x / 90));
  g.lineTo(2048, 1024); g.fill();
  for (let x = 0; x < 2048; x += 14 + r() * 26) { g.fillStyle = trees; g.beginPath(); g.ellipse(x, 790 - r() * 30, 20 + r() * 20, 24 + r() * 26, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = fl; g.fillRect(0, 812, 2048, 212);
});
const skyTex = (k: "day" | "golden" | "moon") => ctex("wbSky" + k, 512, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  if (k === "golden") { gr.addColorStop(0, "#4a4a8a"); gr.addColorStop(0.3, "#b07890"); gr.addColorStop(0.45, "#f0a868"); gr.addColorStop(0.5, "#ffd08a"); gr.addColorStop(1, "#ffd08a"); }
  else if (k === "moon") { gr.addColorStop(0, "#070a22"); gr.addColorStop(0.3, "#0e1440"); gr.addColorStop(0.47, "#2a3a72"); gr.addColorStop(0.5, "#33467e"); gr.addColorStop(1, "#33467e"); }
  else { gr.addColorStop(0, "#2f6cc8"); gr.addColorStop(0.3, "#3f86d8"); gr.addColorStop(0.44, "#8ab8ec"); gr.addColorStop(0.5, "#d4e4f2"); gr.addColorStop(1, "#d4e4f2"); }
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  if (k === "moon") for (let i = 0; i < 420; i++) {
    const y = r() * 470, a = 0.35 + 0.65 * r() * (1 - y / 520);
    g.fillStyle = `rgba(255,250,230,${a})`; g.fillRect(r() * 512, y, r() < 0.12 ? 2 : 1, r() < 0.12 ? 2 : 1);
  }
});
const moonTex = () => ctex("wbMoon", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,248,220,0.55)"); gr.addColorStop(1, "rgba(255,248,220,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(128, 128, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(200,190,160,0.5)"; for (const [x, y, s] of [[118, 120, 8], [140, 136, 6], [124, 146, 5]]) { g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); }
});

export type CubeAt = { p: V3; r?: [number, number, number]; s?: number };
/** a pool of real little poo cubes (lit + inked like the set); p = the centre of the cube's bottom face */
export class Cubes {
  private ms: THREE.Mesh[] = [];
  constructor(root: THREE.Object3D, n = 24) {
    const poo = lam("wbPoo", () => ({ color: "#6a4a2e" }));
    const cg = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(cg, poo); m.castShadow = true; m.receiveShadow = true; m.visible = false;
      this.ms.push(m); root.add(m);
    }
  }
  set(cubes: CubeAt[]) {
    this.ms.forEach((m, i) => {
      const c = cubes[i];
      m.visible = !!c;
      if (!c) return;
      const s = c.s ?? 1;
      m.position.set(c.p[0], c.p[1] + (CUBE * s) / 2, c.p[2]);
      m.rotation.set(...(c.r ?? [0, 0, 0]));
      m.scale.setScalar(s);
    });
  }
}

export class Bush extends Room {
  private dome: THREE.Mesh;
  private skies = { day: skyTex("day"), golden: skyTex("golden"), moon: skyTex("moon") };
  private backs: THREE.Mesh[] = [];
  private hz = { day: horizon(false), night: horizon(true) };
  private moon: THREE.Sprite;
  private cubes: Cubes;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const gnd = twoTone(new THREE.MeshLambertMaterial({ map: ground() }));
    const drt = twoTone(new THREE.MeshLambertMaterial({ map: dirt() }));
    const stone = lam("wbRockM", () => ({ map: rockTex() }));
    const bark = lam("wbLogM", () => ({ map: barkTex() }));
    const gumBark = lam("wbGumBark", () => ({ color: "#e6e0d2" }));
    const gumLeaf = lam("wbGumLeaf", () => ({ color: "#6f8452" })), gumLeaf2 = lam("wbGumLeaf2", () => ({ color: "#5d7046" }));
    const hole = lam("wbHole", () => ({ color: "#1a120c" }));
    b.add(quad(V(-120, 0, 120), V(120, 0, 120), V(120, 0, -120), V(-120, 0, -120), 90, 90), gnd);
    // bare trodden dirt round the rock and in front of the burrow
    for (const [x, z, r] of [[ROCK[0], ROCK[2], 1.6], [BURROW[0], BURROW[2] + 1.2, 1.3]] as const) {
      const disc = new THREE.CircleGeometry(r, 28); disc.rotateX(-Math.PI / 2); disc.translate(x, 0.008, z);
      b.add(disc, drt);
    }
    // the boulder: a squashed, flat-topped lump of stone, plus two small stones
    const boulder = new THREE.IcosahedronGeometry(1, 1);
    const pos = boulder.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), n = 1 + 0.08 * Math.sin(x * 5.1 + z * 3.3);
      pos.setXYZ(i, x * 0.72 * n, Math.min(y, 0.55) * 0.95, z * 0.6 * n);
    }
    boulder.computeVertexNormals();
    deco.add(boulder, stone, at(ROCK[0], 0, ROCK[2]));
    deco.add(new THREE.IcosahedronGeometry(0.22, 0), stone, at(ROCK[0] + 0.95, 0.08, ROCK[2] + 0.5, 0.3, 0.5, 0).scale(V(1, 0.6, 1)));
    deco.add(new THREE.IcosahedronGeometry(0.3, 0), stone, at(-1.5, 0.1, 1.4, 0.1, 1.2, 0).scale(V(1, 0.55, 0.8)));
    // the fallen log with a broken branch stub
    deco.add(cyl(LOG_R, LOG_R * 1.1, 3.6, 14), bark, at(LOG[0], LOG_R, LOG[2], 0, 0.15, Math.PI / 2));
    // the burrow: a dirt mound with a dark half-moon hole facing +z
    const [bx, , bz] = BURROW;
    const mound = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    deco.add(mound, drt, at(bx, 0, bz).scale(V(1.3, 0.45, 1.0)));
    const mouth = new THREE.CircleGeometry(0.3, 20, 0, Math.PI);
    deco.add(mouth, hole, at(bx, 0.0, bz + 0.92, -0.25, 0, 0).scale(V(1.15, 0.9, 1)));
    // tussocks: crossed cards, instanced, kept clear of the rock, the log and the burrow
    const tuft = new THREE.PlaneGeometry(0.7, 0.6); tuft.translate(0, 0.3, 0);
    const t2 = tuft.clone(); t2.rotateY(Math.PI / 2);
    const tg = mergeTwo(tuft, t2);
    const tm = twoTone(new THREE.MeshLambertMaterial({ map: tussock(), alphaTest: 0.5, side: THREE.DoubleSide }));
    const spots: THREE.Matrix4[] = [];
    for (let k = 0; k < 900; k++) {
      const a = k * 2.399, rr = 1.3 + Math.sqrt(k) * 1.15, x = rr * Math.cos(a), z = rr * Math.sin(a);
      if (Math.hypot(x - ROCK[0], z - ROCK[2]) < 1.5 || Math.hypot(x - BURROW[0], z - BURROW[2] - 0.9) < 1.6) continue;
      if (Math.abs(z - LOG[2]) < 0.6 && Math.abs(x - LOG[0]) < 2.2) continue;
      if (z > 2.2 && Math.abs(x) < 3) continue; // keep the near ground open for the lens
      const s = 0.7 + 0.6 * (0.5 + 0.5 * Math.sin(k * 3.7));
      spots.push(new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k * 1.3, 0)), V(s, s, s)));
    }
    const grass = new THREE.InstancedMesh(tg, tm, spots.length);
    spots.forEach((m, i) => grass.setMatrixAt(i, m));
    grass.layers.set(NOINK); grass.receiveShadow = true; this.root.add(grass);
    // gum trees: white trunks, a forked limb, sparse olive crowns
    const gum = (x: number, z: number, s: number) => {
      deco.add(cyl(0.14 * s, 0.24 * s, 5 * s, 8), gumBark, at(x, 2.5 * s, z, 0, 0, 0.05));
      deco.add(cyl(0.07 * s, 0.11 * s, 2.2 * s, 6), gumBark, at(x + 0.6 * s, 4.4 * s, z, 0, 0, -0.5));
      deco.add(cyl(0.06 * s, 0.1 * s, 2.0 * s, 6), gumBark, at(x - 0.5 * s, 4.6 * s, z + 0.1, 0, 0, 0.45));
      for (let i = 0; i < 5; i++) deco.add(new THREE.SphereGeometry(0.95 * s, 10, 8), i % 2 ? gumLeaf : gumLeaf2, at(x + Math.cos(i * 1.7) * 1.0 * s, (5.2 + 0.5 * (i % 2)) * s, z + Math.sin(i * 1.7) * 0.8 * s).scale(V(1, 0.6, 1)));
    };
    for (const [x, z, s] of [[-4.5, -6, 1.0], [5.5, -7.5, 1.2], [-9, -12, 1.3], [1.5, -14, 1.1], [10, -15, 1.4], [-15, -6, 1.2], [14, -4, 1.1],
      [-6, -22, 1.4], [7, -26, 1.5], [-20, -18, 1.4], [20, -20, 1.5], [-12, 5, 1.2], [13, 6, 1.3], [0, 12, 1.4], [-3, -32, 1.6]] as const) gum(x, z, s);
    b.build(this.root, false);
    deco.build(this.root, true);
    // sky dome, moon, painted horizon all round
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: this.skies.day, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2; this.dome.layers.set(NOINK); this.root.add(this.dome);
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), fog: false, depthWrite: false, transparent: true }));
    this.moon.scale.set(30, 30, 1); this.moon.layers.set(NOINK); this.moon.renderOrder = -1; this.root.add(this.moon);
    for (const [x, z, ry] of [[0, -110, 0], [0, 110, Math.PI], [-110, 0, Math.PI / 2], [110, 0, -Math.PI / 2]] as const) {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(320, 160), new THREE.MeshBasicMaterial({ map: this.hz.day, fog: false, transparent: true, alphaTest: 0.02 }));
      back.position.set(x, 160 * (812 / 1024) - 80 - 0.3, z); back.rotation.y = ry; back.layers.set(NOINK); this.root.add(back); this.backs.push(back);
    }
    this.cubes = new Cubes(this.root);
  }
  /** per-shot pose: the sky (day / golden / moon) and every visible poo cube */
  pose(light: string, cubes: CubeAt[], camPos?: THREE.Vector3) {
    const k = light === "golden" ? "golden" : light === "moon" ? "moon" : "day";
    (this.dome.material as THREE.MeshBasicMaterial).map = this.skies[k];
    for (const bk of this.backs) (bk.material as THREE.MeshBasicMaterial).map = k === "moon" ? this.hz.night : this.hz.day;
    this.moon.visible = k === "moon";
    if (camPos) this.moon.position.set(camPos.x - 40, camPos.y + 70, camPos.z - 100);
    this.cubes.set(cubes);
  }
}

/** two crossed planes as one geometry, normals pointing up (tufts lit like the ground) */
export const mergeTwo = (a: THREE.BufferGeometry, c: THREE.BufferGeometry) => {
  const tg = new THREE.BufferGeometry();
  const pa = [...(a.getAttribute("position").array as Float32Array), ...(c.getAttribute("position").array as Float32Array)];
  const ua = [...(a.getAttribute("uv").array as Float32Array), ...(c.getAttribute("uv").array as Float32Array)];
  const ia = [...(a.getIndex()!.array as Uint16Array), ...Array.from(c.getIndex()!.array as Uint16Array, (v) => v + a.getAttribute("position").count)];
  tg.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3)); tg.setAttribute("uv", new THREE.Float32BufferAttribute(ua, 2)); tg.setIndex(ia);
  const n = new Float32Array(pa.length); for (let i = 1; i < n.length; i += 3) n[i] = 1;
  tg.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
  return tg;
};
