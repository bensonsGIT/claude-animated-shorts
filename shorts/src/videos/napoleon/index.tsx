// "Napoleon Was Ambushed by a Thousand Bunnies" (Berthier's rabbit shoot, summer 1806, after Thiébault's memoirs).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras
// (no overlays).
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT } from "./story";
import { Captions } from "./Captions";

export const NapoleonShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  Captions,
});

export const short = { id: "NapoleonShort", component: NapoleonShort, frames: TOTAL };
