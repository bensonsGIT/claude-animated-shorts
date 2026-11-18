# Shared setup for cb_voice.py / cb_regen.py: spec (argv[1]), Chatterbox, Whisper, MMS aligner and helpers.
import difflib, json, os, re, sys, time
import numpy as np, soundfile as sf, torch, torchaudio

spec = json.load(open(sys.argv[1])); OUT = sys.argv[2] if len(sys.argv) > 2 else None
if OUT: os.makedirs(OUT, exist_ok=True)
EX, CFG = spec.get("exaggeration", 0.5), spec.get("cfg", 0.5)
SUBS, TRIES = spec.get("subs", {}), spec.get("tries", 6)
NUMW = set("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen "
           "nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand".split())

# another Chatterbox job on the same GPU roughly quintuples every take (East of Eden: 20 s -> 110 s per take)
try:
    import subprocess as _sp
    _others = [l for l in _sp.run(["pgrep", "-fl", "cb_voice|cb_regen|cb_name_test"], capture_output=True, text=True).stdout.splitlines() if str(os.getpid()) not in l.split()[0]]
    if _others: print("WARNING: another voice job is running and will share the GPU (takes ~5x slower):\n  " + "\n  ".join(_others), flush=True)
except Exception:
    pass
dev = "mps" if torch.backends.mps.is_available() else "cpu"
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": k.get("map_location", torch.device(dev))})
from chatterbox.tts import ChatterboxTTS
from transformers import pipeline as hf_pipeline

tts = ChatterboxTTS.from_pretrained(device=dev); SR = tts.sr
asr = hf_pipeline("automatic-speech-recognition", model="openai/whisper-small.en", device="cpu")
bundle = torchaudio.pipelines.MMS_FA; aligner = bundle.get_model(with_star=False); DICT = bundle.get_dict(star=None)

letters = lambda w: re.sub(r"[^a-z']", "", w.lower())
tw = lambda text: [x for x in (letters(p) for p in re.split(r"[\s\-]+", text)) if x]  # aligner words (hyphens split)
canon = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("-", " ")).split()
FUZZY = {t for w in spec.get("fuzzy", []) for t in canon(w)}  # lower-cased like the transcript (a raw "Adam" never matched "adam")
for d, s in SUBS.items():
    FUZZY.update(canon(d)); FUZZY.update(canon(s))


# Whisper writes amounts as "$15,000" / "20%": the unit word then has no match, so treat it as part of the number
UNITW = set("dollars dollar pounds pound cents percent miles mile acres acre tons ton feet foot yards".split())
# sound-alikes Whisper picks over the script word (East of Eden: "profit" -> "prophet" on all 6 takes, ~11 min of
# retries on a correct take). A swap between two words of one group counts as heard.
HOMOPHONES = [{"profit", "prophet"}, {"sun", "son"}, {"knight", "night"}, {"sole", "soul"}, {"whole", "hole"}, {"heir", "air"},
              {"mourning", "morning"}, {"principal", "principle"}, {"rite", "right", "write"}, {"peace", "piece"}, {"reign", "rain"},
              {"pray", "prey"}, {"altar", "alter"}, {"aloud", "allowed"}, {"council", "counsel"}, {"cell", "sell"}, {"wait", "weight"},
              {"tale", "tail"}, {"mussel", "muscle"}, {"base", "bass"}, {"bear", "bare"}, {"steal", "steel"}, {"board", "bored"}]


def is_fuzzy(tok):
    return tok in FUZZY or tok.isdigit() or tok in NUMW or tok in UNITW


def same_sound(exp, got):
    return len(exp) == len(got) and all(e == g or any(e in h and g in h for h in HOMOPHONES) for e, g in zip(exp, got))


def heard_ok(heard, display):
    """script vs Whisper, word level: any insertion/deletion, or a substitution of a non-fuzzy word, fails"""
    e, h = canon(display), canon(heard)
    for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, e, h, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        exp, got = e[a0:a1], h[b0:b1]
        if exp and got and op == "replace" and all(is_fuzzy(t) for t in exp):  # a name / number spelled differently
            continue
        if op == "replace" and same_sound(exp, got):  # a sound-alike (profit / prophet)
            continue
        return False
    return True


def trim(y, thr=0.012, pad=0.04):
    a = np.abs(y); k = np.convolve(a, np.ones(240) / 240, mode="same")
    idx = np.where(k > thr * a.max() / 0.5)[0]
    return y[max(0, idx[0] - int(pad * SR)):min(len(y), idx[-1] + int(pad * SR))] if len(idx) else y


def align(y, words):
    wav = torchaudio.functional.resample(torch.tensor(y, dtype=torch.float32)[None], SR, bundle.sample_rate)
    with torch.inference_mode():
        em, _ = aligner(wav)
    toks = [DICT[c] for w in words for c in w if c in DICT]
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    r = wav.shape[1] / em.shape[1] / bundle.sample_rate
    out, i = [], 0
    for w in words:
        n = len([c for c in w if c in DICT]); sp = spans[i:i + n]; i += n
        out.append((sp[0].start * r, sp[-1].end * r, float(np.mean([s.score for s in sp]))))
    return out


def transcribe(y):
    seg = torchaudio.functional.resample(torch.tensor(y, dtype=torch.float32)[None], SR, 16000)[0].numpy()
    return asr({"raw": seg, "sampling_rate": 16000})["text"].strip()


