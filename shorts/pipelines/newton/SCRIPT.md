# The Man Who Put a Needle in His Eye — Isaac Newton short

69.3 s vertical (1440x2560), Kokoro bm_lewis (British) at normal speed 1.0x (pauses 1.0), word-by-word captions, synthesized score + SFX.
Composition `NewtonShort` in `claude-animated-shorts/.claude/worktrees/newton-short/shorts/src/videos/newton/`
(branch `worktree-newton-short`).

## Facts (all from the user's script; checked)
- **The bodkin, c. 1665-66:** Newton's notebook (Cambridge University Library, MS Add. 3975, "Of Colours"): "I tooke a bodkin
  & put it betwixt my eye & the bone as neare to the backside of my eye as I could: & pressing my eye with the end of it
  ... there appeared severall white darke & coloured circles". He drew the eye, the bodkin and the circles beside it. He was ~23.
- **The sun:** Newton to John Locke, 30 June 1691: he looked at the sun's image in a looking-glass, and had to shut
  himself up in a darkened room for three days to recover his eyes.
- **The Royal Mint:** Warden from 1696 (Master from 1699/1700); the Mint was inside the Tower of London. Coining /
  clipping was high treason, punished by hanging.
- **William Chaloner:** coiner and fraudster; in 1697 he told Parliament the Mint itself was incompetent and corrupt and
  offered to fix it. Newton spent ~18 months building the case (witnesses, depositions). Convicted at the Old Bailey in
  March 1699; from Newgate he wrote to Newton: "O dear Sir nobody can save me but you O God my God I shall be murdered
  unless you save me". Newton did not reply. Hanged at Tyburn, 22 March 1699.
- Sources: Westfall, *Never at Rest* (1980); Levenson, *Newton and the Counterfeiter* (2009); CUL MS Add. 3975.

## Script (verbatim from the user; "!" on punchlines for delivery)
1. A young man once slid a needle behind his own eyeball, on purpose!
2. He wanted to know how we see color, so he pressed on the back of his eye.
3. He saw rings of white, dark and color, and sketched it all in his notebook.
4. That man was Isaac Newton, one of the greatest scientists in history!
5. Later, he stared at the sun's reflection until he had to hide in a dark room for days!
6. Decades later, he took a job at England's Royal Mint.
7. His mission: hunt counterfeiters, a crime punished as high treason.
8. The slipperiest was William Chaloner, who accused the Mint itself of fraud!
9. Newton spent months building the case against him.
10. In March 1699, Chaloner was condemned to hang.
11. He wrote Newton a letter begging for mercy.
12. Newton was unmoved.
13. Mercy was never his specialty.
14. Neither was caution!

"Chaloner" is pinned to /ʧˈalənə/ (CHAL-uh-ner) in gen_voice.py; "1699" is read "sixteen ninety-nine".

## Shots (13; cuts 3 frames before each beat's first word)
| # | set / light | picture |
|---|---|---|
| 1 | study, candle | MS young Newton, bodkin raised -> CU on "behind" as it slides under the face; deadpan smile on "purpose" |
| 2 | study | CU; whistle-face on "color"; squeeze + kick on "pressed" |
| 3 | study | rings of white/dark/colour bloom behind his head -> notebook insert, the eye+bodkin sketch draws itself |
| 4 | study, shuttered (white flash in) | pin-hole beam -> prism -> rainbow fan onto a white board; Newton proud, roll on "history" |
| 5 | study, sunlit | Newton stares into a looking glass, glare burst + warm veil builds |
| 6 | study, dark (cut on "hide") | shutters slammed; dazed on the bed, after-image dots, three chalk tallies on "days" |
| 7 | Royal Mint (xfade) | wide: screw press strikes x3, furnace, coin table, minters; glide in to Warden Newton |
| 8 | Mint | magnifier; the coin turns dull grey on "counterfeiters", cracks in two on "treason" (kick + punch) |
| 9 | Mint | Chaloner (peacock coat, dark periwig) smirks -> points at the Mint on "accused"; Newton gasps on "fraud" |
| 10 | Mint at night | Newton writing; paper piles grow over "months ... him" |
| 11 | Newgate cell (xfade) | noose shadow on the wall on "hang" -> CU, Chaloner holds up his begging letter |
| 12 | Mint desk (xfade) | Newton reads it. Unmoved (punch-in) |
| 13 | Mint desk | letter slapped onto the pile on "never" -> CU on "Neither": he holds the bodkin up again, grinning |

## Pipeline (to retime / redo)
1. `shorts/.venv-tts/bin/python ~/newton-short/voice/gen_voice.py bm_lewis 1.0 1.0` -> voice.wav, words.json, beats.json
2. `python3 ~/newton-short/voice/make_timing.py` -> src/videos/newton/timing.ts + ~/newton-short/timing.json
3. `python3 ~/newton-short/audio/newton_sound.py` -> audio/mix.wav (+ stems, cues.md)
4. `npx remotion render src/index.ts NewtonShort out/newton/video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333`
5. `ffmpeg -i video.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k newton_short.mp4`
