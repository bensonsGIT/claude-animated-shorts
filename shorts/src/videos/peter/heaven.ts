// The imagined gate of heaven (shot 15): a floor of white cloud, cloud banks all round, a tall golden barred gate with
// an arch at z = -5, and a bright glow behind it. No saint is shown. Floor y = 0; the gate is centred on x = 0.
import * as THREE from "three";
import { Batch, boxGeo, lam, quad, V } from "./build";
import { ctex } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { Room, cyl, at } from "./hall";
import type { V3 } from "./story";

export const GATE: V3 = [0, 0, -5];

const cloudFloor = () => ctex("hvFloor", 512, 512, (g, r) => {
  g.fillStyle = "#f6f4f0"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(214,220,236,${0.35 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 40, 8 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
});

export class Heaven extends Room {
  private halo: THREE.Sprite;
  constructor() {
    super();
    const b = new Batch(), deco = new Batch();
    const floor = twoTone(new THREE.MeshLambertMaterial({ map: cloudFloor() }));
    const puff = lam("hvPuff", () => ({ color: "#fbfaf6" }));
    const puff2 = lam("hvPuff2", () => ({ color: "#eef0f8" }));
    const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#f0c450", specular: "#fff6d0", shininess: 90 }), 0.2);
    b.add(quad(V(-80, 0, 60), V(80, 0, 60), V(80, 0, -80), V(-80, 0, -80), 24, 24), floor);
    // cloud banks: clusters of squashed spheres, low in front, tall behind the gate
    const bank = (x: number, z: number, s: number, n: number, seed: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.sin(seed * 12.9 + i * 78.2) * 43758.5, f = a - Math.floor(a), g2 = Math.sin(seed * 3.1 + i * 9.7) * 9123.4, h = g2 - Math.floor(g2);
        deco.add(new THREE.SphereGeometry(s * (0.6 + 0.5 * f), 14, 10), i % 3 ? puff : puff2, at(x + (f - 0.5) * 3 * s, s * (0.1 + 0.35 * h), z + (h - 0.5) * 2 * s).scale(V(1.3, 0.8, 1)));
      }
    };
    for (const [x, z, s, n] of [[-5, -7, 1.6, 9], [5, -7, 1.6, 9], [-9, -12, 2.4, 10], [9, -12, 2.4, 10], [-3.5, -15, 3.0, 8], [3.5, -15, 3.0, 8],
      [-7, -1, 1.2, 7], [7, 0, 1.2, 7], [-12, 4, 2.0, 8], [12, 5, 2.0, 8], [0, -24, 4.5, 10]] as const) bank(x, z, s, n, x * 7 + z);
    // the gate: two fluted pillars with ball finials, a half-round arch, vertical bars, a cross bar
    const [gx, , gz] = GATE, H = 4.6, R = 1.55;
    for (const s of [-1, 1]) {
      deco.add(cyl(0.3, 0.36, H, 16), gold, at(gx + s * (R + 0.3), H / 2, gz));
      deco.add(boxGeo(V(gx + s * (R + 0.3) - 0.45, 0, gz - 0.45), V(gx + s * (R + 0.3) + 0.45, 0.35, gz + 0.45)), gold);
      deco.add(new THREE.SphereGeometry(0.34, 14, 10), gold, at(gx + s * (R + 0.3), H + 0.3, gz));
    }
    deco.add(new THREE.TorusGeometry(R, 0.11, 8, 28, Math.PI), gold, at(gx, H - 0.2, gz));
    for (let i = -6; i <= 6; i++) {
      const x = gx + (i / 6.5) * R, top = H - 0.2 + Math.sqrt(Math.max(0, R * R - (x - gx) ** 2));
      deco.add(cyl(0.035, 0.035, top, 8), gold, at(x, top / 2, gz));
    }
    for (const y of [1.0, 2.6]) deco.add(boxGeo(V(gx - R, y - 0.05, gz - 0.05), V(gx + R, y + 0.05, gz + 0.05)), gold);
    deco.add(new THREE.TorusGeometry(0.45, 0.06, 8, 24), gold, at(gx, 1.8, gz + 0.02));
    b.build(this.root, false);
    deco.build(this.root, true);
    // sky dome: pale gold low, soft blue overhead
    const skyTex = ctex("hvSky", 64, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#8fb8ec"); gr.addColorStop(0.35, "#c8dcf4"); gr.addColorStop(0.5, "#fff2cf"); gr.addColorStop(1, "#fff6e0");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(110, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -2; dome.layers.set(NOINK); this.root.add(dome);
    // the light behind the gate: an additive glow sprite whose strength pulses on "Nicholas"
    this.glow(gx, 2.4, gz - 1.2, 9, 0.85);
    this.halo = this.glows[this.glows.length - 1];
  }
  /** k 0..1: extra pulse of the glow */
  pulse(k: number) {
    const m = this.halo.material as THREE.SpriteMaterial;
    m.opacity = 0.85 + 0.15 * k; this.halo.scale.setScalar(9 + 5 * k);
  }
}
