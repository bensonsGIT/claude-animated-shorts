// "The Man Who Put a Needle in His Eye" (Isaac Newton): 61 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT } from "./story";
import { Captions } from "./Captions";

export const NewtonShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  Captions,
});

export const short = { id: "NewtonShort", component: NewtonShort, frames: TOTAL };
