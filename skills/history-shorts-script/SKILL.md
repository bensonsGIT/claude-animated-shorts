---
name: "history-shorts-script"
description: "Use when Ben asks for a script, topic ideas, or a shot plan for his animated 3D short-form history videos (YouTube Shorts/TikTok/Reels built in Remotion + three.js in ~/claude-animated-shorts/shorts, cartoon-card characters in a 3D world, Chatterbox voice, word-by-word captions)."
---

# History Shorts Script Generator (Remotion pipeline)

Produces the pre-production package for one ~55-70 s vertical (1440x2560) history short, ready for the Remotion build:
fact-checked script, voice spec, cast + set plan, word-keyed shot list, sound cues and posting copy.

Downstream (do NOT do it here unless Ben says "just do it" after approving the script): the repo skill
`~/claude-animated-shorts/SKILL.md` (cartoon-3d-short) builds it: Chatterbox voice (`shorts/pipelines/cb_voice.py`) →
`make_timing.py` → `story.ts` shots in a copied composition → synthesized sound → render at `--scale 1.3333333333333333` → mux.
All shorts live on the repo branch `all-shorts`; the repo SKILL.md holds the build lessons (voice, animal cards, limiter).
There is no image/video-generation model, no ElevenLabs and no CapCut: every picture is drawn in code, so the shot list
must describe things the toon/set system can draw.

## 1. Topic
- If Ben names a person/fact or supplies a script, use it (his script verbatim; extra bizarre REAL details are welcome — mark them *(added)*).
- If not, propose 3 options: famous historical figure + one bizarre, verifiable fact + a twist ending. Prefer stories with a
  visible physical cause and effect and few locations (each new location = a new set to build). Let him pick before writing.
- Avoid well-known myths (horned Viking helmets, short Napoleon, "medieval people never bathed", "let them eat cake").
- Done so far (don't repeat): Broughton bridge (1831), Tycho Brahe, Franklin's turkey, Newton (bodkin / Mint / Chaloner),
  Formosus (Cadaver Synod), Kentucky Meat Shower (1876), Bentham's auto-icon, Peter the Great's beard tax, the Great Emu War
  (1932), wombat cube poo, the Dancing Plague (1518), Napoleon and the rabbits (1806).
  Pitched but not made: the Falaise pig trial (1386; Ben dropped it), Byron's bear at Cambridge, Mike the headless chicken,
  Napoleon vs. the Mechanical Turk.
- Stories with animals in numbers (emus, rabbits) and one vehicle have worked well: the herd is the gag.

## 2. Research (always, before writing)
- Web search the fact. Confirm every claim in at least 2 independent reliable sources (university/museum sites, scholarly
  sources, news coverage of studies). Search "[fact] myth" too.
- If a detail rests on one historical account, attribute it in the script ("according to Kepler…", "Legend says…").
- Never invent dates, numbers, quotes, or details. If something can't be verified, cut it or mark it [CHECK].
- **Read the primary source itself when one exists.** Web articles copy each other: twenty sites agreeing is still one
  source. Memoirs, chronicles and old books are on archive.org as plain text
  (`curl -sL https://archive.org/stream/<id>/<id>_djvu.txt -o src.txt`, then grep for the passage and read the pages around it).
  Napoleon's rabbit hunt: every article said "July 1807, after Tilsit, up to 3,000 rabbits, they jumped into his coach";
  Thiébault's memoir says summer 1806, a thousand rabbits, and that none got onto the coach.
  - Date the event from the source's own chronology (what the chapter says before and after), not from the retellings.
  - Quote the source's wording in the Facts section, and list the popular embellishments you left out under "Not used".
  - Say who the witness was and whether they were there or had a grudge; put the attribution in line 2 of the script.

## 3. Script rules
- 12-16 numbered lines, **150-180 words** (Chatterbox runs 2.6 words per second with pauses: 150 words ≈ 58 s,
  180 ≈ 70 s. Measured: 198 words → 77 s, and the Emu and Bentham scripts → 75 s. Over 180 words always overruns 70 s).
  Count the words and give the estimate as words ÷ 2.6. One sentence per line = one voice beat;
  the picture cuts on beats. English only. No questions to the viewer. Never open with "Did you know".
- Put "!" on punchline lines (Chatterbox delivers them harder).
- **A hard-to-pronounce name (foreign, or one that needs a TTS respelling) is spoken ONCE**, where the person is introduced;
  every later line uses the title or role ("the marshal", "the pope", "his buyer"). The voice is generated line by line and
  says a respelled name differently each time; Ben noticed five different "Berthier"s. Easy names (Napoleon, Newton) can recur.
- Give each shot a cut word that occurs only once in the script (shots are keyed to words; a repeated word needs a
  numbered key). Avoid ending a line on a word the next line starts with.
- Spell compound words the way a transcriber would ("counter-attacked", not "counterattacked"): the voice check compares
  the script with Whisper's transcript, and a spelling mismatch burns retries on a correct take.
- Structure:
  1. **Hook** (line 1): the absurd fact in one line, before naming the person.
  2. **Setup** (1-2 lines): year, place, pride.
  3. **Reveal**: who it was.
  4. **Escalation** (3-5 lines): true details, each stranger than the last.
  5. **Deadpan beat** (optional): "Luckily… / Unluckily…" or a flat "The corpse stayed silent."
  6. **Twist** (1-2 lines).
  7. **Loop / callback line**: the last line echoes the first so the replay feels seamless.
- Never narrate what the viewer already sees; the narration adds the fact, the picture adds the gag.
- Violence is implied, never graphic (cut away, shadow on a wall, X-eyes, a poof).
- Never mention the style-reference channel by name anywhere (script, description, hashtags).

## 4. Voice spec (draft `cb_spec.json`)
Give the draft spec so the voice can be generated straight away:
```json
{ "ref": "~/tts/refs/ref_am_michael.wav", "exaggeration": 0.5, "cfg": 0.5, "pause_k": 1.0,
  "beats": [["<line 1>", 0.45], ["<line 2>", 0.35]],
  "subs": {"897": "eight ninety-seven", "Tiber": "Tyber"},
  "fuzzy": ["<names Whisper may spell differently>"] }
```
- Pause ~0.3-0.5 s, longer (0.6-0.9) before the twist.
- `subs` = TTS respellings only (captions keep the script spelling). Always spell out years ("sixteen ninety-nine").
  - **A key is the whole token with its punctuation.** If the script has "1806." and "Berthier," then those, with the full
    stop and the comma, are the keys ("1806" alone matches nothing and the voice run crashes). List every punctuated form.
  - **A respelling is ONE word, never hyphenated.** "Bear-tee-ay" was spoken as three separate chunks and Ben heard it;
    "Bertyay" came out as one continuous word. For a foreign or unusual name give two one-word candidates and note
    "audition with `pipelines/cb_name_test.py` before the full run".
  Known fixes: Tycho → "Tyco", Chaloner → "Challoner", live (wire) → "lyve", St. → "Saint", Berthier → "Bertyay",
  Formosus → "For-mo-sus" (hyphenated, from before the one-word rule: if it is ever re-voiced, try "Formosus" or "Formohsus").
- `fuzzy`: every proper name and regnal number (e.g. "the","sixth","vi" for "Stephen the Sixth").
- List the **PUNCH** words (gold captions): the 4-8 punchline words.

## 5. Cast (toon.ts cards)
Characters are flat 2D bean-head cards with plum ink in a 3D set, drawn in Canvas2D (`toon.ts` `Pen`). For each recurring person give:
- **Name / role, age, era** — based on real portraits where they exist.
- **Build** (adult / kid / stout), **skin, hair colour, facial hair**, **hat** (existing: hair, frizz, cap, tophat, bonnet,
  shako, wig, periwig, mitre, zucchetto, veil — or a new one to draw), **outfit** colours (coat, band/stock, buttons).
- **Signature prop** (existing: goblet, magnifier, hammer, rapier, quill, letter, needle/bodkin, scroll, shovel, candle, fist, bless — or new).
- **Expressions** needed (library: neutral, stern, grin, laugh, whistle, nervous, shock, relief, dazed, X-eyed dead — or new).
Secondary characters must differ clearly (hair colour, beard, coat colour) so the cards don't merge. Crowds: say how many and what kind.
- Existing hats also include: tricorn, bicorne, bicorne_plume, tudor, fur, furcap, slouch, peaked, brimhat, boater, cloche, battered.
  Existing props also include: fowling gun, whip, Lewis gun, pitchfork, point.
- **Animals and vehicles**: say which views are needed (side run, running at the camera, sitting, on its back) and what
  makes the animal recognisable (a horse needs an arched neck, mane, tail, jointed legs, hooves and harness; Ben sent the
  first horse back for looking like a toy). Existing: emu, rabbit (8 coats, 4 poses), carriage horse + coach, droshky, ox-wagon, vultures.

## 6. Sets and template
- Name each location and its **light preset** (day, golden, morning, sun, dark, night, moon).
- Reuse an existing set where it fits: great hall / banquet / lab (`tycho/`), parlour (`franklin/`), study / Royal Mint /
  prison cell (`newton/`), basilica / crypt / Tiber bank (`formosus/`), outback farm + dam / Parliament (`emu/`), frontier farm
  (`meat/`), Moscow / wharf (`peter/`), half-timbered town lane + square + council chamber (`dancing/`), French park with
  hutches, pavilion and drive / campaign tent with a map table (`napoleon/`). Mark new sets **NEW** with 2-3 key props.
- Recommend the template to copy: `dancing/` or `napoleon/` (leanest, current layout) for most stories; `franklin/` for one room.

## 7. Shot list (story.ts SHOTS)
One table row per shot, ~16-24 shots (several per beat is fine):

| # | set / light | picture (gag keyed **on "word"**) |
|---|---|---|

- Key every action to a spoken word (`on "dug up"`), never to seconds — shots retime automatically from `words.json`.
- Note crossfades at place/time changes (XFADE), white flash after the hook, impact shakes (KICKS).
- 9:16 is narrow (~0.8 m wide at 4 m): stage two-shots in depth, close-ups ~2.5 m from the card, faces in the upper third
  (captions sit at ~71 % height). Every hold gets a slow push-in (no frozen frames).
- **No on-screen text** except the burned-in captions — dates, names and numbers are spoken, not labelled.
  Text that is part of the world (a scroll, a sign) is fine but must not need reading.
- Last shot echoes shot 1's framing for the loop.
- A fast gag must still be on screen at the cut: say where the subject is at the END of the shot (the rabbits charging the
  lens had all run past it, leaving an empty lawn for the last frames).
- Never stand a second character between the lens and the subject; at 9:16 it fills a third of the frame.

## 8. Output format (save as `~/<name>-short/SCRIPT.md`, same layout as `~/formosus-short/SCRIPT.md`)
1. **Title** (under 60 characters, person + bizarre fact) and one-line spec (1440x2560, Chatterbox am_michael, captions, composition `<Name>Short`)
2. **Facts** — what's solid vs debated, *(added)* / legend flags, source links
3. **Script** — numbered lines, word count, estimated length
4. **Voice spec** (cb_spec.json draft) + PUNCH words
5. **Cast**
6. **Sets** + template to copy
7. **Shots** table
8. **Sound cues** — keyed to words: SFX on gags (whoosh on cuts, impact on reveals, splash, crack…), ambience per set,
   score mood per section, a sting or silence before the twist
9. **Pipeline** — the 5 commands with this short's paths (cb_voice → make_timing → <name>_sound.py → remotion render → ffmpeg mux).
   The mux line carries the limiter: `-af "lowpass=f=16000:poles=2,alimiter=limit=0.6:attack=1:release=50:level=false"`
10. **Description + hashtags**: 2-3 source links, #history #shorts + 1-2 topical tags. Add a **TikTok** version too (Ben
    asked for it): a short title line with one emoji, a 2-3 sentence description that names the source, and ~8 tags
    (#history #historytok #learnontiktok #funnyhistory #fyp + topical).
11. **Next episode idea** from the same figure or era

Keep commentary minimal; Ben wants concise, copy-paste-ready output.