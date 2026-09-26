"""Gentle soundtrack for the Mochi reel: music box + marimba + soft bass,
120 BPM so every cut lands on a beat. Writes audio.wav (15 s, 44.1 kHz stereo)."""
import numpy as np, wave

SR, DUR = 44100, 15.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def hz(n): return 440.0 * 2 ** ((n - 69) / 12)

def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)

def env(n, a=0.004, d=1.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def musicbox(note, dur=1.6):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(note)
    s = np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*2*f*t)*np.exp(-t/.25) + .08*np.sin(2*np.pi*5.4*f*t)*np.exp(-t/.05)
    return s * env(n, .002, .55)

def marimba(note, dur=.9):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(note)
    s = np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*4*f*t)*np.exp(-t/.04)
    return s * env(n, .003, .28)

def bass(note, dur=.9):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(note)
    s = np.sin(2*np.pi*f*t) + .2*np.sin(2*np.pi*2*f*t)
    return s * np.minimum(1, t/.02) * np.exp(-t/.45)

def pon(dur=.35):  # soft kick
    n = int(SR*dur); t = np.arange(n)/SR
    f = 55 + 70*np.exp(-t/.04)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t/.12)

def lowpass(x, k):
    return np.convolve(x, np.ones(k)/k, mode='same')

def shaker(dur=.08):
    n = int(SR*dur); t = np.arange(n)/SR
    x = rng.standard_normal(n); x = x - lowpass(x, 6)
    return x * np.minimum(1, t/.01) * np.exp(-t/.025)

def whoosh(dur=.45, up=True):
    n = int(SR*dur); t = np.arange(n)/SR
    x = rng.standard_normal(n)
    x = lowpass(x, 18) - lowpass(x, 60)
    shape = np.sin(np.pi * np.clip(t/dur, 0, 1)) ** 2
    return x * shape

def sweep(f0, f1, dur, decay=.08, a=.003):
    n = int(SR*dur); t = np.arange(n)/SR
    f = f0 * (f1/f0) ** (t/dur)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, a, decay)

def boing(dur=.7):
    n = int(SR*dur); t = np.arange(n)/SR
    f = 240 * (1 + .45*np.exp(-t/.12)*np.sin(2*np.pi*9*t)) + 120*np.exp(-t/.05)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, .004, .22)

# ---------------- music ----------------
T0, BEAT = 0.5, 0.5
# bar = 4 beats = 2 s. Chords as MIDI notes (F major, soft & sweet)
CH = {
 'F':  [53, 57, 60, 64], 'Am': [57, 60, 64, 67], 'Bb': [58, 62, 65, 69],
 'C':  [60, 64, 67, 70], 'Dm': [50, 53, 57, 60], 'Gm': [55, 58, 62, 65], 'Fmaj9': [53, 57, 60, 64, 67],
}
BARS = ['F', 'Am', 'Bb', 'C', 'F', 'Gm', 'Fmaj9']
ROOT = {'F': 41, 'Am': 45, 'Bb': 46, 'C': 48, 'Dm': 38, 'Gm': 43, 'Fmaj9': 41}
# music-box melody, one list per bar: (beat offset, note)
MEL = [
 [(0, 72), (1, 76), (1.5, 77), (2, 79), (3, 76)],
 [(0, 76), (1, 72), (2, 74), (2.5, 76), (3, 79)],
 [(0, 77), (.5, 76), (1, 74), (2, 77), (3, 81)],
 [(0, 79), (1, 76), (2, 74), (3, 72), (3.5, 74)],
 [(0, 76), (1, 77), (1.5, 79), (2, 84), (3, 81)],
 [(0, 79), (1, 77), (2, 74), (3, 76), (3.5, 77)],
 [(0, 76), (1, 79), (2, 84), (3, 88)],
]
for b, name in enumerate(BARS):
    bt = T0 + b * 4 * BEAT
    ch = CH[name]
    # marimba arpeggio in 8ths
    arp = ch + [c + 12 for c in ch]
    for i in range(8):
        n = arp[[0, 2, 1, 3, 2, 4, 3, 5][i] % len(arp)] + 12
        put(marimba(n), bt + i * BEAT / 2, .10 if i % 2 else .13, pan=-.35 + .1 * (i % 3))
    # soft pad (sustained, slow attack)
    for c in ch:
        n = int(SR * 2.1); t = np.arange(n)/SR
        pad = (np.sin(2*np.pi*hz(c)*t) + .3*np.sin(2*np.pi*hz(c)*2.003*t)) * np.minimum(1, t/.35) * np.exp(-t/1.6)
        put(pad, bt, .025, pan=.2)
    # bass on 1 and 3 (+ pickup)
    put(bass(ROOT[name]), bt, .32); put(bass(ROOT[name] + 7), bt + 2*BEAT, .24)
    put(bass(ROOT[name] + 12), bt + 3.5*BEAT, .12)
    # soft pulse
    for k in range(4):
        put(pon(), bt + k*BEAT, .26 if k % 2 == 0 else .14)
        put(shaker(), bt + k*BEAT + BEAT/2, .035, pan=.4)
    for off, n in MEL[b]:
        put(musicbox(n), bt + off*BEAT, .17, pan=.25)
# final chord at 14.5
for i, c in enumerate([53, 60, 64, 67, 72, 76, 79, 84]):
    put(musicbox(c, 1.0), 14.5 + i * .025, .11, pan=-.3 + i * .08)

# ---------------- sound design ----------------
def put_pan(sig, t, gain, p0, p1):
    """place a mono signal with a pan that travels p0 -> p1 (stereo movement)"""
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain; p = np.linspace(p0, p1, len(sig))
    L[i:i + len(sig)] += sig * np.sqrt((1 - p) / 2); R[i:i + len(sig)] += sig * np.sqrt((1 + p) / 2)

def swoosh(dur=.42, f0=400, f1=3500):
    """airy noise swoosh with a moving band (simple resonator sweep)"""
    n = int(SR * dur); t = np.arange(n) / SR
    x = rng.standard_normal(n); y = np.zeros(n); y1 = y2 = 0.0
    f = f0 * (f1 / f0) ** (t / dur); r = .985
    for k in range(n):
        c = 2 * r * np.cos(2 * np.pi * f[k] / SR)
        v = x[k] * (1 - r) + c * y1 - r * r * y2; y2, y1 = y1, v; y[k] = v
    y /= np.abs(y).max() + 1e-9
    return y * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5

def shimmer(notes, t, gain=.06, spread=.03, pan0=-.5):
    for i, c in enumerate(notes):
        put(musicbox(c, 1.4), t + i * spread, gain, pan=pan0 + i * (1 - pan0) / max(1, len(notes) - 1) * .9)

def shutter():
    n = int(SR * .12); out = np.zeros(n)
    for off, g in [(0, 1.0), (int(SR * .045), .7)]:
        m = int(SR * .02); b = rng.standard_normal(m); b = b - lowpass(b, 3)
        out[off:off + m] += b * np.exp(-np.arange(m) / SR / .004) * g
    tone = sweep(1400, 900, .05, decay=.012)
    out[:len(tone)] += tone * .4
    return out

def stretch(dur=.5):  # びよーん: rising rubbery glide with vibrato
    n = int(SR * dur); t = np.arange(n) / SR
    f = 180 * (4.5 ** (t / dur)) * (1 + .06 * np.sin(2 * np.pi * 14 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.minimum(1, t / .03) * np.minimum(1, (dur - t) / .06 + .0)

def soft_boom(dur=.9):
    n = int(SR * dur); t = np.arange(n) / SR
    f = 42 + 60 * np.exp(-t / .08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .3)

# F-major pentatonic, climbs with every recipe card
PENTA = [72, 74, 77, 79, 81, 84, 86]

put(sweep(1300, 480, .5, decay=.8, a=.05), 0.0, .06)             # slide-down as mochi falls
put(boing(), .5, .30); put(pon(), .5, .35)                        # ぽよん!
shimmer([77, 81, 84], .95, .05)                                   # face appears
put(stretch(.45), 2.05, .12, pan=0)                               # びよーん (mochi stretches)
put_pan(swoosh(.5, 300, 4200), 2.12, .30, -.8, .8)                # into iris
put(soft_boom(), 2.5, .45)
for i in range(16):                                               # wood ticks while counting
    tt = 2.66 + 1.1 * (1 - (1 - i / 16) ** 1.6)
    put(sweep(1800 + i * 60, 1700 + i * 60, .03, decay=.01), tt, .05)
put(soft_boom(), 3.8, .4); shimmer([84, 88, 91, 96, 100], 3.8, .08, .04)   # −19KG キラーン
for i in range(7):                                                # recipe cards
    t = 4.5 + i * .5; d = 1 if i % 2 == 0 else -1
    put_pan(swoosh(.3, 500, 5000), t - .16, .26, -.8 * d, .8 * d)  # whip travels across the stereo field
    put(shutter(), t - .01, .22, pan=.1)                          # camera shutter = the photo "snap"
    put(marimba(PENTA[i] + 12, .6), t + .06, .16, pan=-.2 * d)    # pop-in, tuned & rising
    put(sweep(380, 950, .08, decay=.035), t + .06, .10)
put_pan(swoosh(.55, 250, 3800), 7.8, .30, .8, -.8)                # slats into the feed
for i in range(6):                                                # tiles landing (soft cascade)
    put(marimba(PENTA[(i * 2) % 7] + 12, .4), 8.05 + i * .06, .07, pan=-.6 + i * .24)
for i in range(6):                                                # hearts plinks
    put(musicbox(91 + [0, 4, 7, 12, 7, 4][i], .5), 9.35 + i * .13, .04, pan=(-1)**i * .5)
for t, d in [(10.5, 1), (11.0, -1), (11.5, 1)]:                   # habit cuts
    put_pan(swoosh(.32, 450, 4500), t - .18, .24, -.7 * d, .7 * d)
    put(shutter(), t - .01, .14)
shimmer([79, 84, 88], 11.55, .05)                                 # 健康美人 sparkle
put(stretch(.45), 12.1, .10); put_pan(swoosh(.6, 200, 3000), 12.1, .28, 0, 0)   # mochi-blob wipe
put(soft_boom(), 12.55, .35)
put(sweep(2400, 1600, .03, decay=.012), 14.05, .12)               # follow tap
shimmer([84, 88, 91, 96, 100], 14.08, .07, .05)

# ---------------- reverb + master ----------------
def reverb(x, secs=1.6, mix=.22):
    n = int(SR * secs); t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / .45); ir = lowpass(ir, 4); ir /= np.sqrt((ir**2).sum())
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
    return x + mix * wet
L, R = reverb(L), reverb(R)
st = np.stack([L, R], 1)
st = np.tanh(st * 1.2)                                     # gentle glue
fade = np.ones(N); fo = int(SR * .5); fade[-fo:] = np.linspace(1, 0, fo) ** 2
st *= fade[:, None]
st *= 0.89 / np.abs(st).max()
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', st.shape)
