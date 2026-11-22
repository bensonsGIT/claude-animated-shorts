// "Why Ivan Gave God Back His Ticket | The Grand Inquisitor, Dostoevsky": ~94 s short.
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, glareAt, blackAt, shotAt } from "./story";
import { Captions } from "./Captions";

export const InquisitorShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const glare = glareAt(f), dark = blackAt(f), s = shotAt(f);
    // reference grade: motivated interiors with darker corners; warm/cool per set
    const out = s.set === "square" || s.set === "desert";
    const vig = out ? 0.22 : s.set === "void" ? 0.55 : 0.44;
    const cast = s.set === "prison" ? "rgba(30,40,100,0.14)" : out ? "rgba(255,200,140,0.06)" : "rgba(255,160,90,0.09)";
    return (
      <>
        <AbsoluteFill style={{ background: cast, mixBlendMode: "soft-light" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 62% at 50% 42%, rgba(0,0,0,0) 55%, rgba(18,8,28,${vig}) 100%)`, mixBlendMode: "multiply" }} />
        {glare > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 45% 42%, #ffffff 0%, #fff6e8 55%, #f0e0d0 100%)", opacity: glare }} /> : null}
        {dark > 0 ? <AbsoluteFill style={{ background: "#000", opacity: dark }} /> : null}
      </>
    );
  },
  Captions,
});

export const short = { id: "InquisitorShort", component: InquisitorShort, frames: TOTAL };
