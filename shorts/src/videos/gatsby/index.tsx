// "He Threw Giant Parties for One Woman" (The Great Gatsby, F. Scott Fitzgerald, 1925).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras
// (overlay: a sepia wash over the 1917-19 flashback, rain streaks over the funeral).
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, SEPIA, RAIN } from "./story";
import { Captions } from "./Captions";

const overlay = (f: number) => {
  const ls = layersAt(f);
  const sep = ls.reduce((a, l) => a + (SEPIA.has(l.id) ? (ls.length > 1 ? (l === ls[0] ? 1 - ls[1].alpha : l.alpha) : 1) : 0), 0);
  const rain = ls.reduce((a, l) => a + (RAIN.has(l.id) ? (ls.length > 1 ? (l === ls[0] ? 1 - ls[1].alpha : l.alpha) : 1) : 0), 0);
  return (
    <>
      {sep > 0.001 && <AbsoluteFill style={{ background: "#b08a5a", mixBlendMode: "color", opacity: 0.62 * sep }} />}
      {sep > 0.001 && <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(60,36,20,0.55) 100%)", opacity: sep }} />}
      {rain > 0.001 && <AbsoluteFill style={{ opacity: 0.55 * rain,
        backgroundImage: "repeating-linear-gradient(103deg, rgba(220,230,240,0) 0px, rgba(220,230,240,0) 46px, rgba(225,235,245,0.55) 47px, rgba(220,230,240,0) 49px)",
        backgroundSize: "100% 260px", backgroundPosition: `${(f * 9) % 1080}px ${(f * 61) % 260}px` }} />}
      {rain > 0.001 && <AbsoluteFill style={{ opacity: 0.4 * rain,
        backgroundImage: "repeating-linear-gradient(100deg, rgba(220,230,240,0) 0px, rgba(220,230,240,0) 83px, rgba(225,235,245,0.5) 84px, rgba(220,230,240,0) 86px)",
        backgroundSize: "100% 410px", backgroundPosition: `${(f * 5 + 300) % 1080}px ${(f * 43) % 410}px` }} />}
    </>
  );
};

export const GatsbyShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay,
  Captions,
});

export const short = { id: "GatsbyShort", component: GatsbyShort, frames: TOTAL };
