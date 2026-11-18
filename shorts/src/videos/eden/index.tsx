// "He Tried to Buy His Dad's Love With Beans | East of Eden, Steinbeck": ~85 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, glareAt, blackAt, shotAt } from "./story";
import { Captions } from "./Captions";

export const EdenShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const glare = glareAt(f), dark = blackAt(f), s = shotAt(f);
    // reference grade: corners darker than the centre (outdoors ~.86, motivated interiors deeper), warm/cool per set
    const inside = s.set !== "ranch" && s.set !== "pass";
    const vig = inside ? 0.5 : 0.22;
    const cast = s.set === "parlour" ? "rgba(60,10,40,0.18)" : s.set === "bedroom" || s.set === "nursery" || s.night ? "rgba(30,40,110,0.16)" : s.light === "golden" ? "rgba(255,150,80,0.1)" : "rgba(255,200,140,0.05)";
    return (
      <>
        <AbsoluteFill style={{ background: cast, mixBlendMode: "soft-light" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 62% at 50% 42%, rgba(0,0,0,0) 55%, rgba(18,8,28,${vig}) 100%)`, mixBlendMode: "multiply" }} />
        {glare > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 40% 45%, #ffffff 0%, #fff6dc 50%, #ffe6b0 100%)", opacity: glare }} /> : null}
        {dark > 0 ? <AbsoluteFill style={{ background: "#000", opacity: dark }} /> : null}
      </>
    );
  },
  Captions,
});

export const short = { id: "EdenShort", component: EdenShort, frames: TOTAL };
