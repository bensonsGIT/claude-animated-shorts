// Real-time word-by-word subtitles, timed to the narration (timing.ts WORDS, the TTS's own word timestamps).
// House style of the reference channel: one bold white word, thick black outline, centred at ~71 % of the frame
// height (reference band 60-74 %, low end of it clears the faces in close-ups); each word pops in. Punchline words are gold. Pixel sizes are at 1080x1920 (they scale with --scale).
// Off with inputProps { captions: false }.
import React, { useEffect } from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont, TheBoldFont } from "../../load-font";
import { WORDS } from "./timing";

const PUNCH = new Set(["ticket", "tears", "freely", "lie!", "secret", "argument", "plagiarism!", "earned"]);
const HOLD = 0.6; // keep a word up across gaps shorter than this; clear it in longer pauses
const clean = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}?!']+$/gu, "");

export const captionsOn = () => (getInputProps() as { captions?: boolean }).captions !== false;

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => { loadFont(); }, []);
  const t = f / fps;
  let i = -1;
  for (let k = 0; k < WORDS.length && WORDS[k].s <= t; k++) i = k;
  if (i < 0) return null;
  const w = WORDS[i], next = WORDS[i + 1];
  const until = next && next.s - w.e < HOLD ? next.s : w.e + 0.25;
  if (t >= until) return null;
  const text = clean(w.w);
  if (!text) return null;
  const age = (t - w.s) * fps; // frames since the word started
  const pop = age < 4 ? 0.72 + 0.34 * Math.sin(((age + 1) / 5) * (Math.PI / 2)) : 1; // overshoot then settle
  const gold = PUNCH.has(text.toLowerCase());
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: "71%", transform: `translateY(-50%) scale(${pop})`, maxWidth: "88%", textAlign: "center",
        fontFamily: TheBoldFont, fontSize: text.length > 9 ? 88 : 104, lineHeight: 1, letterSpacing: 1,
        color: gold ? "#ffd84a" : "#ffffff", WebkitTextStroke: "15px #0b0a0c", paintOrder: "stroke fill",
        textShadow: "0 7px 0 rgba(11,10,12,0.55)",
      }}>{text}</div>
    </AbsoluteFill>
  );
};
