// "Peter the Great Shaved His Guests, Then Taxed Beards" (1698-1772): ~72 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, glareAt } from "./story";
import { Captions } from "./Captions";

export const PeterShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const glare = glareAt(f);
    return glare > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 42%, #ffffff 0%, #fff4d0 45%, #ffe2a0 100%)", opacity: glare }} /> : null;
  },
  Captions,
});

export const short = { id: "PeterShort", component: PeterShort, frames: TOTAL };
