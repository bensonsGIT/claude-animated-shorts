// "He Didn't Cry at the Funeral | The Stranger, Camus": ~66 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, glareAt, heatAt } from "./story";
import { Captions } from "./Captions";

export const StrangerShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const glare = glareAt(f), heat = heatAt(f);
    return (
      <>
        {heat > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 20%, #fff6d8 0%, #ffd890 60%, #ffb860 100%)", opacity: heat, mixBlendMode: "screen" }} /> : null}
        {glare > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 62% 22%, #ffffff 0%, #fffbea 45%, #fff0c8 100%)", opacity: glare }} /> : null}
      </>
    );
  },
  Captions,
});

export const short = { id: "StrangerShort", component: StrangerShort, frames: TOTAL };
