// "He Killed to Prove He Was a Genius" (Crime and Punishment, Fyodor Dostoevsky, 1866).
// Rendered by engine/ShortVideo.tsx; this file only wires in the short's world, timeline and extras
// (overlay: snowfall over Siberia, a hot red fever wash with a vignette).
import { AbsoluteFill } from "remotion";
import { makeShort, hookFlash } from "../../engine/ShortVideo";
import { World, loadKit } from "./world";
import { TOTAL, SHOTS, layersAt, dofAt, FLASH_AT, SNOW, FEVER } from "./story";
import { Captions } from "./Captions";

const weight = (f: number, set: Set<number>) => {
  const ls = layersAt(f);
  return ls.reduce((a, l) => a + (set.has(l.id) ? (ls.length > 1 ? (l === ls[0] ? 1 - ls[1].alpha : l.alpha) : 1) : 0), 0);
};
const overlay = (f: number) => {
  const snow = weight(f, SNOW), fever = weight(f, FEVER);
  return (
    <>
      {fever > 0.001 && <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(255,120,60,0.0) 35%, rgba(150,30,30,0.55) 100%)", opacity: fever * (0.8 + 0.2 * Math.sin(f / 5)) }} />}
      {snow > 0.001 && <AbsoluteFill style={{ opacity: 0.85 * snow,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.95) 0 3px, rgba(255,255,255,0) 4px), radial-gradient(circle, rgba(255,255,255,0.8) 0 2px, rgba(255,255,255,0) 3px)",
        backgroundSize: "170px 190px, 110px 130px", backgroundPosition: `${(f * 1.3) % 170}px ${(f * 4) % 190}px, ${(f * 0.7 + 40) % 110}px ${(f * 2.6) % 130}px` }} />}
    </>
  );
};

export const CrimeShort = makeShort({
  loadKit,
  makeWorld: (kit) => new World(kit),
  shots: SHOTS,
  layersAt,
  dofAt,
  flashAt: hookFlash(FLASH_AT),
  overlay,
  Captions,
});

export const short = { id: "CrimeShort", component: CrimeShort, frames: TOTAL };
