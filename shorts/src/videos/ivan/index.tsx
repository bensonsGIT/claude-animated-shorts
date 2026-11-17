// "A Judge Was Killed by His Curtains" (The Death of Ivan Ilych, Tolstoy, 1886).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras (the hook flash).
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT } from "./story";
import { Captions } from "./Captions";

export const IvanShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  Captions,
});

export const short = { id: "IvanShort", component: IvanShort, frames: TOTAL };
