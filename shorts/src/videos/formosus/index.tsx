// "The Pope Who Put a Corpse on Trial" (the Cadaver Synod, 897): ~60 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT } from "./story";
import { Captions } from "./Captions";

export const FormosusShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  Captions,
});

export const short = { id: "FormosusShort", component: FormosusShort, frames: TOTAL };
