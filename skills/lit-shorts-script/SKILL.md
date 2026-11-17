---
name: "lit-shorts-script"
description: "Use when Ben asks for a script, topic ideas, or a shot plan for animated 3D short-form videos retelling classic novel plots (Remotion + three.js pipeline, cartoon-card characters, Chatterbox voice)."
---

# Classic Lit Shorts Script Generator (Remotion pipeline)

Sister skill to history-shorts-script. Produces the pre-production package for one ~55-70 s vertical (1440x2560) short that
retells a classic novel's plot as a deadpan, twist-driven story: plot-checked script, voice spec, cast + set plan,
word-keyed shot list, sound cues and posting copy.

Downstream (do NOT do it here unless Ben says "just do it" after approving the script): the repo skill
`~/claude-animated-shorts/SKILL.md` (cartoon-3d-short) builds it: Chatterbox voice (`shorts/pipelines/cb_voice.py`) →
`make_timing.py` → `story.ts` shots in a copied composition → synthesized sound → render at `--scale 1.3333333333333333` → mux.
Every picture is drawn in code, so the shot list must describe things the toon/set system can draw.

## 1. Topic
- If Ben names a book (e.g. Crime and Punishment, East of Eden, The Great Gatsby), use it. If he supplies a script, use it verbatim.
- If not, propose 3 options: classic novel + the single strangest or most gripping plot thread + the twist/ending it builds to.
  Prefer plots with a clear physical cause and effect, 2-4 main characters and few locations. Let him pick before writing.
- One short = one thread. Don't cram a 600-page novel in; pick the spine (e.g. Gatsby: the green light → the party → the car → the pool).
- Spoilers are the point: tell the ending, but flag it in the description ("spoilers for a 100-year-old book").
- Done so far (don't repeat): The Great Gatsby, Crime and Punishment.

## 2. Research (always, before writing)
- Check every plot point against the text or at least 2 reliable study sources (LitCharts, SparkNotes, publisher/university
  pages, Britannica). Get names, places, order of events and who did what exactly right.
- Never invent scenes, dialogue or motives. If something is an interpretation (e.g. "Gatsby never loved Daisy, only the idea"),
  say it as one ("Some readers think…") or cut it.
- Note the publication year and whether the book is public domain in the US (published 1930 or earlier is PD as of 2026;
  check the exact year).

## 3. Copyright rules
- Narrate in Ben's own words: summarize, never reproduce passages.
- Copyrighted books (e.g. East of Eden, 1952): no quotations at all in the script, captions or description.
- Public-domain books: at most one short famous line (under 15 words), and only if it lands a beat.
- Base character looks on the book's descriptions, never on film/TV adaptations (no actor likenesses, no movie posters,
  costumes or logos).
- Title and description name the book and author; never imply an official adaptation.

## 4. Script rules
- 12-16 numbered lines, **150-180 words**. Chatterbox runs 2.6 words per second with pauses: 150 words ≈ 58 s,
  180 ≈ 70 s (measured: 198 words → 77 s, 178 → 67.5 s; over 180 always overruns 70 s). Count the words and give the
  estimate as words ÷ 2.6. One sentence per line = one voice beat; the picture cuts on beats. English only. No questions
  to the viewer. Never open with "Did you know".
- **A hard-to-pronounce name is spoken ONCE**, where the character is introduced; later lines use a role ("the student",
  "the detective"). Each line is voiced separately, so a respelled name comes out a little different every time.
- Give each shot a cut word that occurs only once in the script, and spell compound words the way Whisper writes them
  ("counter-attacked"), or the voice check burns retries on a correct take.
- Put "!" on punchline lines (Chatterbox delivers them harder).
- Structure:
  1. **Hook** (line 1): the most absurd or shocking plot fact in one line, before naming the book.
  2. **Setup** (1-2 lines): place, era, who the hero is and what he wants.
  3. **Reveal**: "This is [Title], by [Author]." (or name it in the hook's follow-up line)
  4. **Escalation** (3-5 lines): plot turns, each worse or stranger than the last.
  5. **Deadpan beat** (optional): a flat one-liner ("Nobody came to the funeral.").
  6. **Twist / ending** (1-2 lines).
  7. **Loop / callback line**: the last line echoes the first so the replay feels seamless.
- Never narrate what the viewer already sees; the narration adds the plot, the picture adds the gag.
- Violence (murders in Crime and Punishment, the hit-and-run in Gatsby) is implied, never graphic: cut away, shadow on a
  wall, X-eyes, a poof.
- Keep it a retelling, not a lecture: at most one line of "why it matters", placed just before the loop.
- Never mention the style-reference channel by name anywhere.

## 5. Voice spec (draft `cb_spec.json`)
```json
{ "ref": "/Users/benson/tts/refs/ref_am_michael.wav", "exaggeration": 0.5, "cfg": 0.5, "pause_k": 1.0,
  "beats": [["<line 1>", 0.45], ["<line 2>", 0.35]],
  "subs": {"Raskolnikov,": "Raskolnikov,", "1866.": "eighteen sixty-six."},
  "fuzzy": ["<names Whisper may spell differently>"] }
```
- `ref` must be an absolute path (`~` is not expanded and the run crashes).
- Pause ~0.3-0.5 s, longer (0.6-0.9) before the twist.
- `subs` = TTS respellings only (captions keep the book's spelling). Spell out years.
  - **A key is the whole token with its punctuation** ("1866." and "Raskolnikov," are different keys from the bare word);
    a key that matches nothing crashes the voice run. List every punctuated form.
  - **A respelling is ONE word, never hyphenated** ("Ras-KOL-ni-kov" is spoken as separate chunks). For a foreign name give
    two one-word candidates plus the plain spelling, and audition them with `pipelines/cb_name_test.py` before the full run
    (the plain spelling often works: "Suetonius" did).
- `fuzzy`: every character name and the author's name.
- List the **PUNCH** words (gold captions): the 4-8 punchline words.

## 6. Cast (toon.ts cards)
Characters are flat 2D bean-head cards with plum ink in a 3D set, drawn in Canvas2D (`toon.ts` `Pen`). For each recurring character:
- **Name / role, age, era** — from the book's own descriptions (cite chapter if it's a key detail like Gatsby's pink suit).
- **Build, skin, hair colour, facial hair**, **hat** (existing: hair, frizz, cap, tophat, bonnet, shako, wig, periwig, mitre,
  zucchetto, veil, tricorn, bicorne, tudor, fur, slouch, brimhat, boater, cloche, bob, battered, laurel, galea — or a new
  one), **outfit** colours. Outfit extras: cuirass, cape, kilt, shield, toga drape, plaid, torc, specs, stock, beard styles.
- **Signature prop** (existing: goblet, magnifier, hammer, rapier, quill, letter, needle/bodkin, scroll, shovel, candle, fist,
  bless, point, whip, purse, coin, cloth, gladius — or new, e.g. axe shown only in shadow, green-light lamp, roadster).
- **Expressions** (library: neutral, stern, grin, laugh, whistle, nervous, shock, relief, dazed, X-eyed dead — or new).
Secondary characters must differ clearly (hair colour, beard, coat colour). Crowds: say how many and what kind.

## 7. Sets and template
- Name each location and its **light preset** (day, golden, morning, sun, dark, night, moon).
- Reuse existing sets where they fit: great hall / banquet / lab (`tycho/`), parlour (`franklin/`), study / Royal Mint /
  prison cell (`newton/`), basilica / crypt / Tiber bank (`formosus/`), Gatsby's lawn + mansion + bay with the dock
  light, the valley of ashes with Wilson's garage and the roadster (`gatsby/`), a St Petersburg canal street, the garret and
  other interiors, a Siberian convict camp in snow (`crime/`), park + tent (`napoleon/`), sea beach + cliff + lighthouse and Roman rooms (`caligula/`).
  Mark new sets **NEW** with 2-3 key props (e.g. Salinas valley farm).
- Recommend the template to copy: `caligula/` or `napoleon/` (leanest, current layout), `franklin/` for one room.

## 8. Shot list (story.ts SHOTS)
One table row per shot, ~16-24 shots:

| # | set / light | picture (gag keyed **on "word"**) |
|---|---|---|

- Key every action to a spoken word (`on "axe"`), never to seconds — shots retime from `words.json`.
- Note crossfades at place/time changes (XFADE), white flash after the hook, impact shakes (KICKS).
- 9:16 is narrow: stage two-shots in depth, close-ups ~2.5 m from the card, faces in the upper third (captions at ~71 %
  height). Every hold gets a slow push-in.
- **No on-screen text** except burned-in captions. Book covers, title cards and quotes are spoken, not shown.
- Last shot echoes shot 1's framing for the loop.
- A fast gag must still be on screen at the cut: say where the subject is at the END of the shot.
- Never stand a second character between the lens and the subject. Cards only have a front view: a crowd that leaves must
  walk toward the camera. The frame is only ~0.5 × the distance wide, so a car or boat card needs the camera far back.

## 9. Output format (save as `~/<book>-short/SCRIPT.md`, same layout as the history shorts)
1. **Title** (under 60 characters, book + hook) and one-line spec (1440x2560, Chatterbox am_michael, captions, composition `<Book>Short`)
2. **Plot notes**: what's in the text vs interpretation, chapter refs for key details, publication year + PD status, sources
3. **Script**: numbered lines, word count, estimated length
4. **Voice spec** (cb_spec.json draft) + PUNCH words
5. **Cast**
6. **Sets** + template to copy
7. **Shots** table
8. **Sound cues**: keyed to words; SFX on gags, ambience per set, score mood per section, sting or silence before the twist
9. **Pipeline**: the 5 commands with this short's paths (cb_voice → make_timing → <book>_sound.py → remotion render → ffmpeg mux).
   The mux line carries the limiter: `-af "lowpass=f=16000:poles=2,alimiter=limit=0.6:attack=1:release=50:level=false"`
10. **Description + hashtags**: spoiler note, book + author, 1-2 source links, #books #shorts + 1-2 tags (#booktok, #classics, author).
    Add a **TikTok** version too (Ben asks for it): a short title line with one emoji, a 2-3 sentence description, ~8 tags
    (#booktok #books #classicliterature #learnontiktok #fyp + book/author tags).
11. **Next episode idea**: same author or a book with a matching twist

Keep commentary minimal; Ben wants concise, copy-paste-ready output.