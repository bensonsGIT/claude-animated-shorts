import { Composition, staticFile } from "remotion";
import {
  CaptionedVideo,
  calculateCaptionedVideoMetadata,
  captionedVideoSchema,
} from "./CaptionedVideo";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { TychoShort, TYCHO_FRAMES } from "./videos/tycho/Bridge";
import { NewtonShort, NEWTON_FRAMES } from "./videos/newton/Bridge";

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
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TychoShort"
        component={TychoShort}
        durationInFrames={TYCHO_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NewtonShort"
        component={NewtonShort}
        durationInFrames={NEWTON_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
