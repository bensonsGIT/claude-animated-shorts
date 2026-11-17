// "Arrested, and Nobody Says Why | The Trial, Kafka": ~66 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, blackAt } from "./story";
import { Captions } from "./Captions";

export const TrialShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const k = blackAt(f);
    return k > 0 ? <AbsoluteFill style={{ background: "#000", opacity: k }} /> : null;
  },
  Captions,
});

export const short = { id: "TrialShort", component: TrialShort, frames: TOTAL };
