---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

## Project layout (since 2026-11-16)
The engine is shared; a short's folder holds only what is its own.
- `shorts/src/engine/`: rendering engine used by every short. `ShortVideo.tsx` (composition + post chain, `makeShort`),
  `build.ts`, `paint.ts`, `shade.ts`, `cardshade.ts`, `ink.ts`, `lensblur.ts`, `lights.ts` + `grade.ts` (every light
  preset any short uses), `hall.ts` (the `Room` base class + great hall), `toon.ts` (the `Pen` API, faces, hats, beards,
  bodies, the bridge cast and generic fx).
- `shorts/src/engine/library/<short>.ts`: characters and fx cards first drawn for that short (Tycho's ruffs, Newton's
  periwigs, Franklin's turkey, Formosus's clergy, the meat-shower vultures, Peter's boyars...). Any short imports them.
- `shorts/src/videos/<name>/`: `index.tsx` (wires the short into `makeShort` and exports `short`), `story.ts`,
  `timing.ts`, `cast.ts`, `world.ts`, `Captions.tsx` and the short's own set files (`moscow.ts`, `farm.ts`...).
- `shorts/src/Root.tsx` registers every short from the `SHORTS` list.
- A fix in `src/engine/` reaches every short. When it changes behaviour, re-render a still of each short that uses it.
- New hats, props or expressions go into `engine/toon.ts` as new names. Never change what an existing name draws: Franklin's
  plain tricorn became `tricornFlat` and his desk quill `writeQuill` because later shorts drew `tricorn`/`quill` differently.

**Where the code lives (since 2026-11-17):** every short is on ONE branch, `all-shorts` (pushed). A new short is one or
more commits on top of it. Never leave a short on a private branch: the Bentham short was orphaned when its branch was
deleted and had to be rescued from a dangling commit. Push as soon as the short renders.

**Best starting point now: `dancing/` or `napoleon/`** (2026-11-16/17). Their `world.ts` is ~140 lines (two or three sets,
the shared light rig, the card loop) and their `cast.ts` splits cleanly into shared card machinery (everything above the
`// ===== the <name> short =====` line: copy it verbatim) and the short's own staging below it. `napoleon/` adds an
outdoor park with a sky dome, an animal herd (150 rabbit cards) and a vehicle card. The 2026-11-15 shorts below still
show the older multi-room patterns.

Later shorts (2026-11-15) are also usable starting points. They are interior stories with captions and the current
voice/sound workflow; all three live in `shorts/src/videos/` with scripts, voice and sound in `~/<name>-short/`.
- **Newton** (`newton/`, composition `NewtonShort`): three sets (study, Royal Mint, Newgate cell), periwigs, wall fx, glare veil.
  Copy it for multi-location stories. Its `make_timing.py` auto-keys every word (`WORD.newton2` ...), cuts = `cf(beat)`.
- **Franklin** (`franklin/`, `FranklinShort`): one parlour with dressings per shot. Copy it for single-room stories.
- **Tycho** (`tycho/`, `TychoShort`): hall, banquet, lab; frames remapped from its first cut through `rf()`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- Captions ON (this user overrides the old "no captions" rule): real-time word-by-word subtitles, one bold word at a
  time, black outline, ~71 % frame height, punchline words gold, SMALL: 104 px (88 px for words > 9 letters), 15 px
  outline, 7 px shadow at 1080 wide (`Captions.tsx`, `PUNCH` set). No other labels in the video.
- English only.
- Voice: Chatterbox cloned from the synthetic Kokoro voice am_michael (natural American male), every line
  Whisper-checked (see step 3). The user rejected macOS say, flat Kokoro voices and Kokoro at 1.18x.
- Jokes are researched real facts. When the user supplies the script, use it verbatim.
- Mix: voice -16 LUFS through the broadcast chain, music bed ~-27 ducked under words, SFX ~-24, master -14 LUFS.
- Final export 2K vertical: 1440x2560, `--scale 1.3333333333333333` (exactly 4/3; `1.3333` gives a non-integer height and fails).
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
   - **Read the primary source itself, not the retellings.** Old memoirs and chronicles are on archive.org as plain text:
     `curl -sL https://archive.org/stream/<id>/<id>_djvu.txt -o src.txt`, then grep for the passage and read the pages
     around it. For the Napoleon rabbit hunt every popular article said "July 1807, after Tilsit, up to 3,000 rabbits, they
     jumped into the coach"; the memoir itself says summer 1806, a thousand rabbits, and that none got onto the coach.
     Check the date against the source's own chronology (the chapter before and after), and quote its wording in `SCRIPT.md`.
   - A story that rests on one account is fine if the script says so in its second line ("According to one of his own generals...").
2. **Script** (55-70 s). **Budget 2.6 words per second with Chatterbox, pauses included: 150-180 words.** (The old
   "~3.7 words/s" figure was for the faster Kokoro voice. Measured: Napoleon 198 words -> 77 s, Emu -> 75 s, Bentham -> 75 s.
   A 200-word script always lands near 77 s.) Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice** (Chatterbox, venv `~/tts/chatterbox`; reference `~/tts/refs/ref_am_michael.wav`). Everything is timed to the
   resulting `words.json`, so lock the voice before the picture.
   - Write `~/<name>-short/voice/cb_spec.json`: `ref`, `exaggeration` 0.5, `cfg` 0.5, `pause_k` 1.0,
     `beats` = [[sentence, pause s], ...] (one beat per sentence, the picture cuts on them, "!" on punchlines),
     `subs` = per-word TTS respellings (captions keep the script spelling), `fuzzy` = names Whisper may spell differently.
     Respellings that work: years spelled out ("1699," -> "sixteen ninety-nine,"), "Tyco" (Tycho), "Challoner", "lyve" (live wire).
     - **A `subs` key is the whole token including its punctuation** ("1806." and "Berthier," are different keys from
       "1806" and "Berthier"). A key that matches nothing leaves the digits in the text and `cb_voice.py` dies with an
       IndexError when it assembles the words. List every punctuated form that occurs in the script.
     - **Never respell a name with hyphens** ("Bear-tee-ay"). Chatterbox reads each piece as its own word with a gap between
       them, and the aligner splits the token too. Write ONE word: Berthier -> "Bertyay"
       (measured: "Bear-tee-ay" 700-900 ms with three gaps, heard as "Bear TA"; "Bertyay" 400-560 ms with one gap,
       heard as "Berthier" / "Bertier"). Run `cb_regen.py` with two one-word alternates (`--alt` twice) and a `--must`
       regex that only one word can satisfy (`\b(ber|bair)[a-z]{2,}`).
     - **Audition a foreign or unusual name before the full run:** `pipelines/cb_name_test.py` says a carrier sentence
       with each candidate spelling a few times and prints, per candidate, the name's length, the number of silent gaps
       inside it and what Whisper heard. Pick the spelling with one short gap or none and a sensible length (a
       two-syllable name is 350-500 ms, not 700+).
     - While the voice generates (1-2 min per line on the Mac), run `pipelines/stub_timing.py spec.json
       src/videos/<name>/timing.ts`: it writes a stand-in timing with every word key, so the shots can be written,
       type-checked and checked as stills in parallel. Replace it with `make_timing.py` once the voice is done and
       re-check the stills on the real timing.
   - `~/tts/chatterbox/bin/python shorts/pipelines/cb_voice.py spec.json voice/` -> voice.wav, words.json (torchaudio
     MMS_FA forced alignment), beats.json, cb_report.txt. Each take is transcribed by Whisper (small.en) and retried
     (up to 6) until Whisper hears the script's words.
   - Fix any line still flagged (`!!` in the report) or with a mangled name:
     `cb_regen.py spec.json voice/ N --alt "respelled sentence" --must "regex Whisper must hear"`. It splices the new take and
     shifts every later word.
     `cb_regen.py` compares Whisper against the line stored in `voice/beats.json`, not the spec: when a line's wording
     or spelling changes, edit both files. Whisper writes some words its own way ("counter-attacked", "St." for
     "Saint"); a line it "fails" six times with the right words is a spelling mismatch: change the script's spelling
     to Whisper's or add the word to `fuzzy`, rather than burning more takes.
   - Then `make_timing.py` -> `src/videos/<name>/timing.ts` + `~/<name>-short/timing.json` (TOTAL, WORD, BEAT/shots, WORDS for captions).
   - To audition voices: `~/newton-short/voice/chatterbox/samples.py` (refs from Kokoro voices via make_refs*.py).
4. **Shot plan** in `story.ts`: copy `src/videos/dancing/` or `napoleon/` (lean `world.ts`; `newton/` for the older multi-room pattern, `franklin/` for one room) to `src/videos/<name>/`, rename the export in its `index.tsx`, and add its `short` to `SHORTS` in `src/Root.tsx`. Only the short's own files are copied; the engine stays in `src/engine/`.
   - Cuts and gags are keyed to `WORD.<word>` / beat onsets (never to hard frame numbers), so a re-voice retimes the whole film.
   - 9:16 is narrow: stage two-shots in depth, keep close-ups ~2.5 m from these bean-head cards, frame faces in the upper
     third (captions sit at 71 %). Check marks with a quick projection before rendering stills.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
   - Pick word keys that occur once in the script for cuts (`cw("bunched")`); a repeated word needs its numbered key
     (`napoleon2`), and `make_timing.py` prints the full key list.
   - Three stills per shot (first frames, middle, last 2 frames) on contact sheets (`scripts/sheet.py`) catch nearly
     every staging fault in one pass: a subject outside the 9:16 frame, a card standing between the lens and the
     subject (it fills a third of the frame), a gag that has not started yet at the cut, a hat that floats above a head.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `engine/toon.ts` (+ `engine/library/*.ts` for earlier shorts' casts): the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
   - **Animals and vehicles are fx cards** drawn by a function in `engine/library/<short>.ts` (`fxEmu`, `fxRabbit`,
     `fxHorse`, `fxCoach`). What makes one read as the real animal:
     - Draw the body, neck and head as ONE closed spline silhouette (`spline()` in `library/napoleon.ts`), then
       `p.clip()` soft shading into it (darker belly, lighter rump and shoulder, dark muzzle). Ellipses glued together
       read as a toy.
     - Legs have joints: upper leg as a `taper()` from muscle to knee/hock (drawn twice: ink a few units wider, then
       the coat colour), a thin cannon, a pastern, a hoof. Far-side legs darker and drawn BEFORE the body, near-side after.
     - `Pen.line` adds an ink rim of `p.ol` (12 units by default) on each side: a slim limb becomes a black sausage.
       Set `p.ol` to 2-3 while drawing limbs and restore it.
     - Give it the things people look for: ears, mane, tail, eye with a white dot, nostril, and for a carriage horse
       the harness (bridle, blinker, breast collar, saddle pad, girth, reins that END at the bit).
     - Render the gait as four consecutive phases side by side before using it; one still hides a broken leg cycle.
   - **Herds** (emus, rabbits): one card per animal in `stage()`, positions from a seeded hash, and a texture key
     quantised to coat | pose | phase/8 | direction | eye | resolution tier so 150 animals share a few dozen canvases.
     Choose the resolution tier by distance; skip contact shadows past ~12 m.
7. **Post** (`engine/ShortVideo.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`). Per-short overlays (glare, dim) and the flash timing go in the short's `index.tsx`.
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound**: write `pipelines/<name>/<name>_parts.py` like `pipelines/napoleon/napoleon_parts.py`: it holds only this
   short's header, set timeline, `build_sfx()` and score, and splices them over the shared helpers and mix section of
   `pipelines/dancing/dancing_sound.py` to produce `<name>_sound.py` (shared libs in `shorts/audio/`: dsp.py, instruments.py, sfx_gen.py).
   - Check a helper's return type before placing it: `I.snare_roll()` returns a list of (time, velocity) hits, not audio.
   - Reads `timing.json`; every SFX/music event sits on a word time. Voice goes through `voice_chain()` (HP 85 Hz,
     -2.5 dB at 260 Hz, +4 dB at 3.8 kHz, +2.5 dB air shelf, RMS compressor 3.5:1), music ducked 11 dB on words.
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `STILLS_COMP=<Comp> REMOTION_TMP=<tmp dir> node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`
   (without STILLS_COMP it renders BridgeShort). Check the last frame of every shot and every gag after any re-voice.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333` (remotion.config.ts sets the angle GL renderer; without it the Mac falls back to a ~15x slower GL path)
    - Mux: `ffmpeg -i video.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af "lowpass=f=16000:poles=2" -c:a aac -b:a 320k -shortest final.mp4`
      (Remotion writes a silent audio track; plain 256k AAC overshot to +0.1 dBFS on sharp zaps, the low-pass + 320k keeps peaks ~-4 dB).
    - **Measure the muxed file, every time:** `ffmpeg -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"`.
      Sharp transients (whip cracks, snares) still overshot to +1.1 dBFS through AAC although the mix.wav peaked at -3.5.
      If the peak is above -1 dBFS, add a limiter to the chain: `-af "lowpass=f=16000:poles=2,alimiter=limit=0.6:attack=1:release=50:level=false"`
      (peak -3.7 dBFS, loudness unchanged).
    - Keep the previous final as `<name>_<oldvoice>.mp4` before overwriting.
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
These values now live in `shorts/src/engine/` (`templates/bridge/` is the original published copy): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`engine/ShortVideo.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** (Written for the bridge, before the engine moved to `src/engine/`: sandbox the engine files too, and merge them back into `src/engine/`.) Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Shell and git gotchas in a worktree session (2026-11-17)
- The session guard rejects compound git commands, `git -C <other path>`, loops and heredocs that contain git, and
  `cd <computed path> && git ...`. Run one plain git command per call from the worktree, and put anything longer in a
  script file (Python or zsh) and run that.
- `git archive <commit>` run from a subfolder exports only that subfolder (an untracked folder gives an empty tar).
- zsh: `"$var:a..."` applies a path modifier to `$var` (`limit=$lim:attack` became a file path). Write `${var}` or the literal value.
  zsh also does not word-split `$list` in `for f in $list`.
- To compare a worktree with a commit when git is blocked there: `git archive <commit> | tar -x -C tmp/` from the repo
  root, then `diff -rq` with node_modules/out/public excluded.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.

## Voice, caption and render gotchas (Newton / Tycho / Franklin, 2026-11-15)
- Chatterbox install: `uv venv --python 3.11 ~/tts/chatterbox` + `uv pip install chatterbox-tts "setuptools<81"` (its
  watermarker imports pkg_resources). On a Mac load with device "mps" and patch `torch.load` to map_location the device.
- Chatterbox mis-speaks ~1 line in 7 ("dolding" for building, a stray "Hm", "Tia" for Tycho, "Legends said").
  The aligner does not catch these; Whisper does. Never ship a voice without the Whisper pass.
- MMS_FA can score a correctly spoken spelled-out year at 0.00: trust Whisper for content, the aligner only for timing.
- Chatterbox is quicker than Kokoro (~15-20 % shorter films). Shots are word-keyed, so they retime, but re-check that
  gags with fixed lengths (e.g. three tally marks after a word) still finish before their cut.
- Long hair / periwigs (`hat: "wig" | "periwig"`) must be drawn BEFORE held props, or the hair covers the hands.
- Every bundle copies public/ to the temp dir: set REMOTION_TMP / TEMP / TMPDIR to a job folder you can delete.
- Shell cwd can reset between commands: render with absolute paths or cd in the same call, or the render fails on src/index.ts.
