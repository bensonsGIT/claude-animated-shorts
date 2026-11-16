// The Royal Mint inside the Tower of London, 1696-99: grey ashlar walls, oak ceiling beams, tall round-headed windows
// on the back wall, a screw coining press (iron frame, screw, a long fly-bar with lead balls that swings on every
// strike), a furnace glowing at the back right, a table of coin piles, and the Warden's desk front right with candles
// and the case papers that pile up over "months". Floor y = 0, x across (-7..7), z (-8 back wall .. 6), ceiling 5.2 m.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "../../engine/build";
import { ctex, planksHD, stoneHD, beam } from "../../engine/paint";
import { twoTone } from "../../engine/shade";
import { NOINK } from "../../engine/ink";
import { Room, cyl, at } from "../../engine/hall";
import type { V3 } from "./story";

export const MINT = { x0: -7, x1: 7, z0: -8, z1: 6, h: 5.2 };
export const PRESS: V3 = [-2.6, 0, -4.6];
export const WDESK = { x0: 0.7, x1: 2.6, z0: -1.75, z1: -0.95, top: 0.86 };
export const COINS = { x: 3.4, z: -4.6, top: 0.86 };
/** strike times of the press (s); the fly-bar swings round to each */
export type MintMode = "day" | "night";

export class Mint extends Room {
  private bar = new THREE.Group();
  private piles: THREE.Mesh[] = [];
  private panes: THREE.MeshBasicMaterial[] = [];
  private grow: (t: number) => number = () => 0;
  private strike: (t: number) => number = () => 0;
  private candles = new THREE.Group();

  constructor() {
    super();
    const shell = new Batch(), fix = new Batch(), deco = new Batch();
    const { x0, x1, z0, z1, h } = MINT;
    const wall = lam("mintWall", () => ({ map: stoneHD("mintWall", ["#aeaab0", "#a29ea6", "#b8b4b9", "#9a96a0", "#aaa6ad"], "#74707c") }));
    const flags = lam("mintFlags", () => ({ map: stoneHD("mintFlags", ["#8f877d", "#857d74", "#99918a", "#7d766e"], "#4e4842") }));
    const oak = lam("mintOak", () => ({ map: beam() }));
    const dark = lam("mintDark", () => ({ color: "#4a2e22" }));
    const ceil = lam("mintCeil", () => ({ color: "#5a3a2a" }));
    const planks = lam("mintPlanks", () => ({ map: planksHD() }));
    const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 50 }), 0.15);
    const lead = twoTone(new THREE.MeshPhongMaterial({ color: "#6a6e78", specular: "#c0c0c0", shininess: 40 }), 0.15);
    const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e2b84a", specular: "#fff0c0", shininess: 80 }), 0.2);
    const silver = twoTone(new THREE.MeshPhongMaterial({ color: "#c9ccd4", specular: "#ffffff", shininess: 80 }), 0.2);
    const sack = lam("mintSack", () => ({ color: "#b89a6a" }));
    const brick = lam("mintBrick", () => ({ color: "#8a4a34" }));
    const soot = lam("mintSoot", () => ({ color: "#2a1a18" }));
    const wax = lam("mintWax", () => ({ color: "#f5ecd6" }));
    const brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d1a84a", specular: "#fff0c0", shininess: 70 }), 0.2);
    const cloth = lam("mintCloth", () => ({ color: "#2f5a3c" }));
    const paper = lam("mintPaper", () => ({ map: ctex("mintPaperStack", 128, 128, (g) => {
      g.fillStyle = "#f2e8cf"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#b8a682"; g.lineWidth = 2;
      for (let y = 4; y < 128; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y + ((y * 7) % 3) - 1); g.stroke(); }
    }) }));

    // ---- shell ----
    shell.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), (x1 - x0) / 2.5, (z1 - z0) / 2.5), flags);
    shell.add(boxGeo(V(x0 - 0.6, 0, z0), V(x0, h, z1), 2.5), wall);
    shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.6, h, z1), 2.5), wall);
    shell.add(boxGeo(V(x0 - 0.6, 0, z1), V(x1 + 0.6, h, z1 + 0.6), 2.5), wall);
    // back wall with three window openings (x = -4.5, 0, 4.5; y 1.6..3.9, 1.2 wide) + round heads as a dark arch stone
    const WX = [-4.5, 0, 4.5], wy0 = 1.6, wy1 = 3.9, ww = 0.6;
    let xa = x0 - 0.6;
    for (const wx of WX) {
      shell.add(boxGeo(V(xa, 0, z0 - 0.6), V(wx - ww, h, z0), 2.5), wall);
      shell.add(boxGeo(V(wx - ww, 0, z0 - 0.6), V(wx + ww, wy0, z0), 2.5), wall);
      shell.add(boxGeo(V(wx - ww, wy1, z0 - 0.6), V(wx + ww, h, z0), 2.5), wall);
      xa = wx + ww;
      const pm = new THREE.MeshBasicMaterial({ map: ctex("mintLeaded", 256, 512, (g) => {
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 512); g.strokeStyle = "#7a7a8a"; g.lineWidth = 6;
        for (let i = -512; i < 768; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 512, 512); g.stroke(); g.beginPath(); g.moveTo(i + 512, 0); g.lineTo(i, 512); g.stroke(); }
        g.lineWidth = 12; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 512); g.stroke();
      }) });
      this.panes.push(pm);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(2 * ww, wy1 - wy0), pm);
      pane.position.set(wx, (wy0 + wy1) / 2, z0 - 0.3); pane.layers.set(NOINK); this.root.add(pane);
      fix.add(boxGeo(V(wx - ww - 0.12, wy0 - 0.12, z0), V(wx + ww + 0.12, wy0, z0 + 0.22)), lam("mintSill", () => ({ color: "#c9c2b4" })));
      fix.add(new THREE.TorusGeometry(ww + 0.06, 0.1, 6, 20, Math.PI), lam("mintSill", () => ({ color: "#c9c2b4" })), at(wx, wy1, z0 + 0.04));
    }
    shell.add(boxGeo(V(xa, 0, z0 - 0.6), V(x1 + 0.6, h, z0), 2.5), wall);
    shell.add(boxGeo(V(x0 - 0.6, h, z0 - 0.6), V(x1 + 0.6, h + 0.4, z1 + 0.6), 0, true), ceil);
    for (let z = z0 + 1.6; z < z1; z += 2.6) shell.add(boxGeo(V(x0, h - 0.45, z - 0.16), V(x1, h, z + 0.16), 2), oak);

    // ---- the screw press: stone block, two iron cheeks, crosshead, screw, die, the fly-bar on top ----
    const [px, , pz] = PRESS;
    deco.add(boxGeo(V(px - 0.9, 0, pz - 0.7), V(px + 0.9, 0.7, pz + 0.7), 1), lam("mintBlock", () => ({ color: "#8a8478" })));
    for (const s of [-1, 1]) deco.add(boxGeo(V(px + s * 0.62 - 0.14, 0.7, pz - 0.2), V(px + s * 0.62 + 0.14, 2.45, pz + 0.2)), iron);
    deco.add(boxGeo(V(px - 0.85, 2.45, pz - 0.26), V(px + 0.85, 2.78, pz + 0.26)), iron);
    deco.add(cyl(0.09, 0.09, 1.45, 14), iron, at(px, 1.72, pz));
    for (let i = 0; i < 9; i++) deco.add(new THREE.TorusGeometry(0.1, 0.022, 6, 14), iron, at(px, 1.15 + i * 0.13, pz, Math.PI / 2 - 0.15));
    deco.add(cyl(0.2, 0.2, 0.12, 16), iron, at(px, 0.95, pz));
    deco.add(cyl(0.16, 0.16, 0.1, 16), lead, at(px, 0.75, pz));
    // fly-bar: a long iron bar through the screw head with a lead ball on each end (rotates per frame)
    const fb = new Batch();
    fb.add(cyl(0.12, 0.12, 0.26, 14), iron, at(0, 0, 0));
    fb.add(cyl(0.05, 0.05, 3.6, 10), iron, at(0, 0.06, 0, 0, 0, Math.PI / 2));
    for (const s of [-1, 1]) fb.add(new THREE.SphereGeometry(0.2, 14, 10), lead, at(s * 1.85, 0.06, 0));
    fb.build(this.bar, true);
    this.bar.position.set(px, 2.95, pz); this.root.add(this.bar);
    // blanks + struck coins in trays beside the press
    for (const s of [-1, 1]) {
      deco.add(boxGeo(V(px + s * 1.2 - 0.3, 0, pz + 0.3), V(px + s * 1.2 + 0.3, 0.55, pz + 0.8)), oak);
      for (let i = 0; i < 9; i++) deco.add(cyl(0.05, 0.05, 0.012, 12), s < 0 ? silver : gold, at(px + s * 1.2 - 0.18 + (i % 3) * 0.18, 0.56 + 0.006, pz + 0.42 + Math.floor(i / 3) * 0.16));
    }

    // ---- furnace at the back right ----
    const fx0 = 4.6, fz0 = z0;
    deco.add(boxGeo(V(fx0, 0, fz0), V(fx0 + 2.2, 2.0, fz0 + 1.4), 1), brick);
    deco.add(boxGeo(V(fx0 + 0.3, 2.0, fz0), V(fx0 + 1.9, 4.2, fz0 + 0.9), 1), brick);
    fix.add(boxGeo(V(fx0 + 0.6, 0.5, fz0 + 1.39), V(fx0 + 1.6, 1.3, fz0 + 1.41)), soot);
    this.flame(fx0 + 0.85, 0.85, fz0 + 1.45, 0.5, 0.75, 3.4);
    this.flame(fx0 + 1.25, 0.8, fz0 + 1.45, 0.45, 0.65, 3.2);
    this.glow(fx0 + 1.1, 0.95, fz0 + 1.6, 3.4, 0.55);

    // ---- the coin table: piles of gold and silver, two sacks ----
    const { x: cx, z: cz, top } = COINS;
    deco.add(boxGeo(V(cx - 0.9, top - 0.07, cz - 0.5), V(cx + 0.9, top, cz + 0.5), 1.5), planks);
    for (const [ox, oz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) deco.add(boxGeo(V(cx + ox - 0.05, 0, cz + oz - 0.05), V(cx + ox + 0.05, top - 0.07, cz + oz + 0.05)), dark);
    for (let i = 0; i < 11; i++) {
      const n = 3 + ((i * 7) % 6), x = cx - 0.7 + (i % 6) * 0.25, z = cz - 0.25 + Math.floor(i / 6) * 0.38;
      deco.add(cyl(0.065, 0.065, n * 0.016, 14), i % 3 ? gold : silver, at(x, top + (n * 0.016) / 2, z));
    }
    for (const s of [-1, 1]) deco.add(new THREE.SphereGeometry(0.3, 12, 10), sack, at(cx + s * 1.25, 0.28, cz + 0.2, 0, 0, 0, 1).scale(V(1, 1.15, 1)));

    // ---- the Warden's desk: green baize, candles, ledgers, ink, and the case papers (scaled per frame) ----
    const D = WDESK;
    deco.add(boxGeo(V(D.x0, D.top - 0.07, D.z0), V(D.x1, D.top, D.z1), 1.5), oak);
    deco.add(boxGeo(V(D.x0 + 0.08, D.top, D.z0 + 0.06), V(D.x1 - 0.08, D.top + 0.004, D.z1 - 0.06)), cloth);
    deco.add(boxGeo(V(D.x0, 0, D.z1 - 0.06), V(D.x1, D.top - 0.07, D.z1 - 0.02)), dark); // modesty panel toward the lens
    for (const x of [D.x0 + 0.06, D.x1 - 0.06]) deco.add(boxGeo(V(x - 0.05, 0, D.z0 + 0.03), V(x + 0.05, D.top - 0.07, D.z1 - 0.03)), dark);
    deco.add(cyl(0.045, 0.05, 0.07), lam("mintInk", () => ({ color: "#22202a" })), at(D.x0 + 0.35, D.top + 0.035, D.z0 + 0.25));
    deco.add(boxGeo(V(D.x0 + 0.33, D.top + 0.06, D.z0 + 0.24), V(D.x0 + 0.34, D.top + 0.32, D.z0 + 0.26)), wax);
    for (const [x, c] of [[D.x1 - 0.5, "#7a2a2a"], [D.x1 - 0.35, "#2a4a6a"]] as const) deco.add(boxGeo(V(x, D.top, D.z0 + 0.08), V(x + 0.12, D.top + 0.3, D.z0 + 0.38)), lam(`mintLedger${c}`, () => ({ color: c })));
    const cb = new Batch();
    for (const x of [D.x0 + 0.12, D.x1 - 0.12]) {
      cb.add(cyl(0.07, 0.08, 0.03), brass, at(x, D.top + 0.015, D.z0 + 0.12));
      cb.add(cyl(0.022, 0.026, 0.16), brass, at(x, D.top + 0.11, D.z0 + 0.12));
      cb.add(cyl(0.03, 0.03, 0.15), wax, at(x, D.top + 0.265, D.z0 + 0.12));
      this.flame(x, D.top + 0.39, D.z0 + 0.12, 0.09, 0.18, 2.8);
    }
    this.glow((D.x0 + D.x1) / 2, D.top + 0.4, D.z0 + 0.15, 2.2, 0.4);
    cb.build(this.candles, true); this.root.add(this.candles);
    // case-paper piles (unit boxes scaled per frame)
    for (const [x, z] of [[D.x0 + 0.2, D.z0 + 0.5], [D.x0 + 0.45, D.z0 + 0.3], [D.x1 - 0.22, D.z0 + 0.5], [D.x1 - 0.45, D.z0 + 0.32]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.28).translate(0, 0.5, 0), paper);
      m.position.set(x, D.top, z); m.rotation.y = (x * 7) % 0.4 - 0.2; m.castShadow = m.receiveShadow = true;
      this.piles.push(m); this.root.add(m);
    }
    // a wall rack of dies and tongs by the press (silhouettes for the wides)
    fix.add(boxGeo(V(x0, 1.9, -6.2), V(x0 + 0.08, 2.0, -3.2)), oak);
    for (let i = 0; i < 6; i++) fix.add(boxGeo(V(x0 + 0.08, 1.2, -6.0 + i * 0.5), V(x0 + 0.12, 1.95, -5.95 + i * 0.5)), iron);

    shell.build(this.root, false);
    fix.build(this.root, false);
    deco.build(this.root, true);
  }

  /** day: bright leaded windows, candles out; night: blue-black windows, candles lit. grow(t): paper pile height 0..1,
   *  strike(t): fly-bar angle (rad) at story time t */
  pose(m: MintMode, grow: (t: number) => number, strike: (t: number) => number) {
    for (const p of this.panes) p.color.set(m === "day" ? new THREE.Color(2.0, 1.95, 1.8) : new THREE.Color(0.05, 0.06, 0.14));
    this.candles.visible = m === "night";
    this.flames.forEach((f, i) => { f.s.visible = i < 2 || m === "night"; }); // 0-1 furnace, 2-3 desk candles
    this.glows.forEach((g, i) => { g.visible = i === 0 || m === "night"; });
    this.grow = grow; this.strike = strike;
  }

  update(t: number) {
    super.update(t);
    this.bar.rotation.y = this.strike(t);
    const g = this.grow(t);
    this.piles.forEach((p, i) => { const hgt = 0.02 + g * (0.16 + 0.07 * ((i * 5) % 3)); p.scale.set(1, hgt, 1); p.visible = g > 0 || i < 2; });
  }
}
