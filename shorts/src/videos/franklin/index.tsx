// "Franklin vs. the Turkey" (built on the bridge/Tycho engine): our original short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, flashAt, dimAt } from "./story";
import { Captions } from "./Captions";

export const FranklinShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: flashAt,
  overlay: (f) => {
    const dim = dimAt(f);
    return dim > 0 ? <AbsoluteFill style={{ background: "#07050a", opacity: dim }} /> : null;
  },
  Captions,
});

export const short = { id: "FranklinShort", component: FranklinShort, frames: TOTAL };
