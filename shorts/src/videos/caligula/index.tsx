// "Caligula Marched His Army to the Beach to Fight the Sea" (Gaul, AD 40, after Suetonius and Cassius Dio).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras
// (overlay: the blackout when the torches go out; flashes: the hook + lightning).
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { AbsoluteFill } from "remotion";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, LIGHTNING, wf, cf } from "./story";
import { Captions } from "./Captions";

export const CaligulaShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: (f) => Math.max(hookFlash(FLASH_AT)(f), ...LIGHTNING.map((a) => (f >= a && f < a + 5 ? [0.85, 0.2, 0.7, 0.3, 0.1][f - a] : 0))),
  // the torches go out: black from "killed" to the end of the corridor shot
  overlay: (f) => { const a = wf("killed") + 1, b = cf(13); const k = f < a || f >= b ? 0 : Math.min(1, (f - a + 1) / 5); return k > 0 ? <AbsoluteFill style={{ background: "#000", opacity: k }} /> : null; },
  Captions,
});

export const short = { id: "CaligulaShort", component: CaligulaShort, frames: TOTAL };
