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

Later shorts (2026-11-15) are the better starting point now. They are interior stories with captions and the current
voice/sound workflow; all three live in `shorts/src/videos/` with scripts, voice and sound in `/Users/benson/couch.potato.history/<name>-short/` (the home for every short's project folder since 2026-11-18; older notes say `~/<name>-short`).
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
- Voice: Ben's own ElevenLabs narration (he sends the mp3; step 3). Before 2026-11-22: Chatterbox cloned from the
  synthetic Kokoro voice am_michael, Whisper-checked. The user rejected macOS say, flat Kokoro voices and Kokoro at 1.18x.
- Jokes are researched real facts. When the user supplies the script, use it verbatim.
- Mix: voice -16 LUFS through the broadcast chain, music bed ~-27 ducked under words, SFX ~-24, master -14 LUFS.
- Final export 2K vertical: 1440x2560, `--scale 1.3333333333333333` (exactly 4/3; `1.3333` gives a non-integer height and fails).
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice: Ben's own ElevenLabs narration (since 2026-11-22: "wait for my file from now on").** Never generate a
   Chatterbox voice for a new short. Everything is timed to `words.json`, so build on a provisional timing and swap his
   narration in when it arrives (the shots are word-keyed and retime on their own).
   - Write `<short folder>/voice/cb_spec.json` with `beats` (the script lines, display spelling) and `fuzzy` (names, the
     author, numbers/units Whisper writes as digits, homophones). Hand Ben the voice script (the numbered lines).
   - Provisional: `python3 shorts/pipelines/prov_voice.py voice/cb_spec.json prov/` → words.json + beats.json paced like
     his reads (~2.4 words/s), then `make_timing.py` on `prov/` (it does not write timing.json for a provisional voice).
   - His mp3: `~/tts/chatterbox/bin/python shorts/pipelines/ext_voice.py voice/cb_spec.json <mp3> voice/` → voice.wav,
     words.json (script spelling, MMS_FA forced alignment), beats.json, plus Whisper's diff against the script. Only
     digit/spelling differences are fine; a real wording change means re-check the line with Ben. Any earlier voice files
     are kept as `*_chatterbox`. **No atempo**: his pace is the pace.
   - Then `make_timing.py` → `src/videos/<name>/timing.ts` + timing.json, `mkshots.py` → shots.json, the sound script, a
     still at every shot end + gag (fixed-length gags can drift with his longer pauses: Dorian's knife white-out grew from
     0.47 s to 0.67 s), render, mux, QA. A swap on a finished short takes ~10 min.
   - The old Chatterbox pipeline (`cb_voice.py`, `cb_regen.py`, `cb_name_test.py`, the am_michael reference) stays in
     `shorts/pipelines/` for re-voicing an old short only if Ben asks.
4. **Shot plan** in `story.ts`: copy `src/videos/newton/` (or `franklin/` for one room) to `src/videos/<name>/`, rename the export in its `index.tsx`, and add its `short` to `SHORTS` in `src/Root.tsx`. Only the short's own files are copied; the engine stays in `src/engine/`.
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
7. **Post** (`engine/ShortVideo.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`). Per-short overlays (glare, dim) and the flash timing go in the short's `index.tsx`.
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound**: copy `~/newton-short/audio/newton_sound.py` (shared libs in `shorts/audio/`: dsp.py, instruments.py, sfx_gen.py).
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
    - Keep the previous final as `<name>_<oldvoice>.mp4` before overwriting.
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Fast path (workflow review after East of Eden, 2026-11-18: "try to cut down on total time")
Where the time went on East of Eden (88 s, 24 lines): voice 67 min (39 min of it retries, with another session's voice
job sharing the GPU), 4 fix rounds after delivery that Ben had to point out (flat lighting, see-through roof, plain
doors/windows, flickering curtains), each a code fix + stills + a full render. Renders themselves were only ~2 min.
1. **Voice = Ben's file.** Give him the voice script the moment the script is locked and build on `prov_voice.py` timing;
   swap his mp3 in with `ext_voice.py` (~1 min) when it arrives. (The Chatterbox notes on GPU contention and retries only
   matter when re-voicing an old short with `cb_voice.py`.)
2. **Build while waiting for Ben's mp3**, on the provisional timing (lit skill step 10), and check stills in big batches.
3. **Pre-final checklist** (every item below was a fix round Ben had to ask for; do them before the first 2K render):
   - Light: each interior has a motivated light plan (`lightPlan()` pools, base < 0.6, vignette); golden only for
     sunsets; measure with `shorts/scripts/look_metrics.py` against `references/frames` (target p50 ~.35-.45 interiors).
   - Roofs and overhangs double-sided with soffits; check every low exterior still for sky through eaves.
   - Doors and windows built with `windowUnit()` / `doorUnit()` (casing, sill, panes, panels, knob), never flat boxes.
   - **No coplanar or nested faces**: anything layered on a wall (curtains, frames, casings, sills, signs, rugs) stands
     >= 4 cm in front of every layer behind it, and no two boxes share a face plane (the curtains' front face sat at
     the sill's front face: z-fighting shimmer at 6 s). Render 3 consecutive frames of each interior shot and look at
     them side by side; an automatic frame-diff detector was tried and drowned in h264/ink noise.
   - Seated people on visible seats, nobody inside furniture, faces above tabletops (raised seat marks).
4. **One full render, then QA, then deliver.** Re-render after each fix round (2 min) rather than patching segments.

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

## Motivated interior light (East of Eden, 2026-11-18: Ben "the colors and lighting seem flat")
Measured against the reference samples (`references/frames`, 38 frames): ours had median luma 0.58 vs 0.33, rooms lit
evenly wall to wall, no corner darkening, no warm/cool split. The reference lights rooms from their sources (bulbs,
windows, fires, lamps) and lets the rest fall off into dark, with warm practicals against a cool ambient.
- `engine/shade.ts` has `TONE.uBaseK` (scales the whole two-tone light) and 3 light pools `uPoolPos/uPoolCol/uPoolR`
  (view-space centre, HDR colour, radius; soft falloff, a little N.L). Defaults (1, black) leave every other short
  unchanged. Plain three.js point lights do nothing: two-tone overwrites `directDiffuse`.
- Per set, in the short's `world.ts` (see `videos/eden/world.ts` `lightPlan()`): interiors base 0.36-0.56, pools at
  the window / candles / stove / lamp / moon, positions in world space converted with `cam.matrixWorldInverse` every
  frame; animate the colour for flicker or a lamp going out. Exteriors keep base 1 and no pools.
- Tint the cards a little toward the main pool colour (`CHAR.uCharTint`), but guard against a zero pool (a lamp at 0
  divided the tint by 0 and turned Kate into a black silhouette).
- `index.tsx` overlay: an elliptical multiply vignette (interiors ~0.5, exteriors ~0.22, clear to 55 % radius) plus a
  soft-light tint per set (red-violet parlour, blue night, warm day). Stronger vignettes pulled the highlights down
  (p98 .86 vs reference .905).
- Golden light turns green fields and interiors purple; use day/sun and keep golden for real sunsets.
- Measure: `~/tts/chatterbox/bin/python shorts/scripts/look_metrics.py "references/frames/*.jpg" "<our stills glob>"` (p2/p50/p98, saturation, colourfulness, local
  contrast, shade/lit). Result: p50 .58 → .47. What is still missing vs the reference is set dressing and texture
  (posters, patterned floors, props), not light.

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
- 2K renders with the angle GL renderer run ~22 fps: **~2 min for 88 s** (East of Eden, measured; the old "~10 min"
  was the pre-angle figure). A full re-render is cheap: never skip one to save time. Stills at 0.5 take ~1 s each after
  a ~40 s bundle, so put every frame you need into ONE stills call.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

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
- **Roof planes are single quads: the underside is invisible.** A camera low enough to see under the eaves looks
  straight through the roof to the sky (East of Eden farmhouse, Ben spotted it at 10 s). Give roof materials
  `side: THREE.DoubleSide` and add a soffit board under each overhang (`eden/rooms.ts` Ranch). Check every low or
  wide exterior still for sky showing through eaves, gables or porch roofs.
- **Doors and windows need real joinery** (Ben, East of Eden: "make doors and windows more detailed"). Flat dark
  boxes read as holes. `videos/eden/rooms.ts` has reusable `windowUnit()` (glass with a sky-reflection texture,
  casing, header, deep sill + apron, meeting rail + muntin grid, optional louvred shutters) and `doorUnit()`
  (painted raised-panel leaf from `doorTex()`, casing, header + cornice, brass knob + escutcheon, optional transom
  light). Both build out toward +z from a wall face; rotate a Group for side walls. Interior windows over a view pane
  pass `glass: null`. Use them (or copy them into a new short) for every building, room and vehicle door.

## Voice, caption and render gotchas (Newton / Tycho / Franklin, 2026-11-15)
- (Legacy voice, only for re-voicing old shorts) Chatterbox install: `uv venv --python 3.11 ~/tts/chatterbox` + `uv pip install chatterbox-tts "setuptools<81"` (its
  watermarker imports pkg_resources). On a Mac load with device "mps" and patch `torch.load` to map_location the device.
- Chatterbox mis-speaks ~1 line in 7 ("dolding" for building, a stray "Hm", "Tia" for Tycho, "Legends said").
  The aligner does not catch these; Whisper does. Never ship a voice without the Whisper pass.
- MMS_FA can score a correctly spoken spelled-out year at 0.00: trust Whisper for content, the aligner only for timing.
- Chatterbox is quicker than Kokoro (~15-20 % shorter films). Shots are word-keyed, so they retime, but re-check that
  gags with fixed lengths (e.g. three tally marks after a word) still finish before their cut.
- Long hair / periwigs (`hat: "wig" | "periwig"`) must be drawn BEFORE held props, or the hair covers the hands.
- Every bundle copies public/ to the temp dir: set REMOTION_TMP / TEMP / TMPDIR to a job folder you can delete.
- Shell cwd can reset between commands: render with absolute paths or cd in the same call, or the render fails on src/index.ts.
