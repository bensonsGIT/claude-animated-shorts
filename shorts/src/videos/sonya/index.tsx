// "The Murderer Who Could Only Tell One Person | Crime and Punishment, Dostoyevsky": ~85 s short (Raskolnikov's confession to Sonya).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras.
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, glareAt, blackAt, shotAt, greyOf, vigOf } from "./story";
import { Captions } from "./Captions";

export const SonyaShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay: (f) => {
    const glare = glareAt(f), dark = blackAt(f), s = shotAt(f);
    // his world greys and closes in shot by shot until Sonya kneels (shot 11); then warm
    const grey = greyOf(s.id), vig = vigOf(s.id);
    const warm = s.id >= 11 && s.id !== 13 && s.id !== 15 && s.id !== 16;
    const cast = warm ? "rgba(255,150,80,0.12)" : s.id === 16 || s.id === 7 ? "rgba(30,40,110,0.16)" : "rgba(60,80,130,0.1)";
    return (
      <>
        {grey > 0 ? <AbsoluteFill style={{ background: "#808080", mixBlendMode: "saturation", opacity: grey }} /> : null}
        <AbsoluteFill style={{ background: cast, mixBlendMode: "soft-light" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 62% at 50% 42%, rgba(0,0,0,0) 50%, rgba(14,8,22,${vig}) 100%)`, mixBlendMode: "multiply" }} />
        {glare > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: glare }} /> : null}
        {dark > 0 ? <AbsoluteFill style={{ background: "#000", opacity: dark }} /> : null}
      </>
    );
  },
  Captions,
});

export const short = { id: "SonyaShort", component: SonyaShort, frames: TOTAL };
