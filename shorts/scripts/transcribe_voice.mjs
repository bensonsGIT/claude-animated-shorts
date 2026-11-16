import path from "node:path";
import { writeFileSync } from "node:fs";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
} from "@remotion/install-whisper-cpp";

const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
const MODEL = "base.en";

await installWhisperCpp({ to: WHISPER_PATH, version: "1.6.0" });
await downloadWhisperModel({ folder: WHISPER_PATH, model: MODEL });

const result = await transcribe({
  inputPath: process.argv[2],
  model: MODEL,
  tokenLevelTimestamps: true,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: "1.6.0",
  printOutput: false,
  translateToEnglish: false,
  language: "en",
  splitOnWord: true,
});

const words = [];
for (const item of result.transcription) {
  for (const tok of item.tokens ?? []) {
    const text = tok.text.trim();
    if (!text || text.startsWith("[_")) continue; // skip special/silence tokens
    words.push({ w: text, s: tok.offsets.from / 1000, e: tok.offsets.to / 1000 });
  }
}

writeFileSync(process.argv[3], JSON.stringify(words, null, 2));
console.log(`wrote ${words.length} words to ${process.argv[3]}`);
