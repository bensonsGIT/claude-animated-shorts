// "The Bridge That Fell for a Song": our original 67 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT } from "./story";
import { Captions } from "./Captions";

export const TychoShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  Captions,
});

export const short = { id: "TychoShort", component: TychoShort, frames: TOTAL };
