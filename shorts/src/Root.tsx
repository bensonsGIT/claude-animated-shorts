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
import { short as peter } from "./videos/peter";
import { short as stranger } from "./videos/stranger";
import { short as trial } from "./videos/trial";

/** every short: 1080x1920 at 30 fps. A new short adds its folder's `short` here. */
const SHORTS = [bridge, tycho, newton, franklin, formosus, meat, peter, stranger, trial];

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
