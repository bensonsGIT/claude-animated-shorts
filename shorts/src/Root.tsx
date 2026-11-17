import { Composition, staticFile } from "remotion";
import {
  CaptionedVideo,
  calculateCaptionedVideoMetadata,
  captionedVideoSchema,
} from "./CaptionedVideo";
import { short as bridge } from "./videos/bridge";
import { short as tycho } from "./videos/tycho";
import { short as newton } from "./videos/newton";
import { short as franklin } from "./videos/franklin";
import { short as formosus } from "./videos/formosus";
import { short as meat } from "./videos/meat";
import { BenthamShort, BENTHAM_FRAMES } from "./videos/bentham/Bridge";
import { short as peter } from "./videos/peter";
import { short as emu } from "./videos/emu";
import { short as wombat } from "./videos/wombat";
import { short as gatsby } from "./videos/gatsby";
import { short as crime } from "./videos/crime";
import { short as dancing } from "./videos/dancing";
import { short as napoleon } from "./videos/napoleon";
import { short as caligula } from "./videos/caligula";
import { short as gambler } from "./videos/gambler";
import { short as ivan } from "./videos/ivan";

/** the Bentham short predates the shared engine (its folder carries its own copy) and exports a component + frame count */
const bentham = { id: "BenthamShort", component: BenthamShort, frames: BENTHAM_FRAMES };

/** every short: 1080x1920 at 30 fps. A new short adds its folder's `short` here. */
const SHORTS = [bridge, tycho, newton, franklin, formosus, meat, bentham, peter, emu, wombat, gatsby, crime, dancing, napoleon, caligula, gambler, ivan];

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        calculateMetadata={calculateCaptionedVideoMetadata}
        schema={captionedVideoSchema}
        width={1080}
        height={1920}
        defaultProps={{
          src: staticFile("sample-video.mp4"),
        }}
      />
      {SHORTS.map((s) => (
        <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.frames} fps={30} width={1080} height={1920} />
      ))}
    </>
  );
};
