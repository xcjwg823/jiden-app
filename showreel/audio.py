"""Procedural soundtrack for the showreel — 15s, 120 BPM, every hit synced to the picture.
usage: python3 audio.py out.wav
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)       # dry bus
RV = np.zeros(N)                       # reverb send (mono)


def t_(d): return np.arange(int(SR * d)) / SR


def add(sig, at, gain=1.0, pan=0.0, verb=0.0):
    i = int(at * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))
    RV[i:i + len(sig)] += sig * verb


def env(n, a, d):  # attack/decay exponential envelope
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)


def lp(x, cutoff):  # one-pole low-pass (cutoff may be an array)
    c = np.broadcast_to(np.exp(-2 * np.pi * np.asarray(cutoff) / SR), x.shape)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - c[i]) * x[i] + c[i] * s; y[i] = s
    return y


def hp(x, cutoff): return x - lp(x, cutoff)


def noise(d): return rng.uniform(-1, 1, int(SR * d))


# ---------- instruments ----------
def kick(d=0.45, f0=150, f1=42, click=0.6):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s[:240] += noise(240 / SR) * np.linspace(click, 0, 240)
    return np.tanh(s * 1.6)


def hat(d=0.06):
    return hp(noise(d), 7000) * env(int(SR * d), 0.0005, 0.018)


def clap():
    n = noise(0.3); e = np.zeros(len(n))
    for o in (0, 0.011, 0.022):
        k = int(o * SR); e[k:] += env(len(n) - k, 0.0005, 0.012 if o < 0.02 else 0.09)
    return hp(lp(n * e, 3500), 700) * 1.4


def sub_drop(d=2.2):
    t = t_(d); f = 32 + 60 * np.exp(-t * 3)
    return np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6))


def pluck(freq, d=0.35, bright=4000, wave='saw'):
    t = t_(d)
    s = 2 * ((t * freq) % 1) - 1 if wave == 'saw' else np.sin(2 * np.pi * freq * t)
    s = s + 0.5 * (2 * ((t * freq * 1.006) % 1) - 1) if wave == 'saw' else s
    return lp(s, bright * np.exp(-t * 14) + 180) * env(len(t), 0.002, d / 3)


def bell(freq, d=0.6):
    t = t_(d)
    return (np.sin(2 * np.pi * freq * t + 2.2 * np.sin(2 * np.pi * freq * 3.5 * t) * np.exp(-t * 9))
            * env(len(t), 0.001, 0.18))


def whoosh(d, up=True, lo=300, hi=6000):
    t = t_(d); x = t / d
    sweep = (lo + (hi - lo) * x ** 2) if up else (hi - (hi - lo) * np.sqrt(x))
    s = lp(noise(d), sweep); s = hp(s, sweep * 0.3)
    return s * np.sin(np.pi * x) ** (1.5 if up else 0.7) * 2.2


def riser(d):
    t = t_(d); x = t / d
    n = hp(lp(noise(d), 800 + 9000 * x ** 2), 400)
    f = 200 + 1400 * x ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (n + tone) * x ** 2.2


def tick():
    return hp(noise(0.012), 3000) * env(int(SR * 0.012), 0.0002, 0.003)


def pad(freqs, d):
    t = t_(d); s = np.zeros(len(t))
    for f in freqs:
        for det in (-0.004, 0, 0.005):
            s += 2 * ((t * f * (1 + det) + rng.random()) % 1) - 1
    s = lp(s / len(freqs) / 3, 1400)
    return s * np.minimum(1, t / 0.04) * np.exp(-t / 1.4)


midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- arrangement ----------
B = 0.5  # beat
# (0) vitals: ECG monitor beeps on each R-wave, then a long alarm tone into the drop
def beep(d=0.09, f=1000):
    t = t_(d); return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.01)
add(bell(midi(88)), 0.05, 0.2, verb=0.5)
for x in (0.5, 1.0): add(beep(), x, 0.35, verb=0.3)
add(beep(0.24, 1000), 1.27, 0.4, verb=0.5)
add(riser(0.7), 0.8, 0.6, verb=0.3)

# groove: 1.5 → 11.5
chords = [(57, [69, 72, 76]), (53, [69, 72, 77]), (48, [67, 72, 76]), (55, [67, 71, 74])]  # Am F C G
t = 1.5
while t < 11.49:
    b = round((t - 1.5) / B)
    add(kick(), t, 0.95)
    if b % 2 == 1: add(clap(), t, 0.55, verb=0.35)
    add(hat(), t + B / 2, 0.35, pan=0.35)
    add(hat(0.03), t + B * 0.75, 0.18, pan=-0.35)
    root, _ = chords[int((t - 1.5) // 2) % 4]
    for k, off in enumerate((0, 0.25)):  # side-chained 8th-note bass
        add(pluck(midi(root - 12 + (12 if k else 0)), 0.22, 900), t + off + 0.03, 0.42)
    t += B
for bar in range(5):
    root, ch = chords[bar % 4]
    add(pad([midi(m) for m in ch], 2.0), 1.5 + bar * 2, 0.16, verb=0.6)

# (1) type hits
for x in (1.5, 2.0): add(whoosh(0.3, False, 400, 8000), x, 0.35)
for i in range(4): add(bell(midi(76 + [0, 3, 7, 12][i])), 2.5 + i * 0.055, 0.14, pan=-0.4 + i * 0.25, verb=0.4)
for i in range(4): add(bell(midi(79 + [0, 3, 7, 12][i])), 3.0 + i * 0.055, 0.14, pan=0.4 - i * 0.25, verb=0.4)
rotor = lp(noise(1.0), 300) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t_(1.0))) ** 4 * np.minimum(1, t_(1.0) / 0.05)
add(rotor, 2.5, 0.9, verb=0.2)
add(whoosh(0.3, True), 3.22, 0.5)
# (2) three pillars: a hit + spin per pillar, riser into the heli montage
for i, x in enumerate((3.5, 4.0, 4.5)):
    add(bell(midi([81, 84, 88][i]), 0.5), x, 0.3, pan=(-0.4, 0.4, -0.4)[i], verb=0.5)
    add(whoosh(0.42, False, 300, 5000), x, 0.3, pan=(-0.4, 0.4, -0.4)[i])
add(riser(0.3), 4.7, 0.55)
# (3) doctor-heli montage: impact, rotor bed, a whip per cut
add(sub_drop(0.8), 5.0, 0.55)
add(kick(0.4, 160, 45, 0.8), 5.0, 0.6)
rotor2 = lp(noise(2.0), 260) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * t_(2.0))) ** 4
add(rotor2 * np.minimum(1, (2.0 - t_(2.0)) / 0.2), 5.0, 1.0, verb=0.2)
for i, x in enumerate((5.5, 6.0, 6.5)): add(whoosh(0.2, False, 700, 11000), x - 0.03, 0.45, pan=(-0.6, 0.6, -0.6)[i])
# (4) front line: globe, burst, portrait resolves
add(sub_drop(0.8), 7.0, 0.45)
add(bell(midi(64), 0.4), 7.4, 0.2, verb=0.6)
add(noise(1.0) * env(SR, 0.001, 0.25), 7.75, 0.5, verb=0.6)
add(sub_drop(1.0), 7.75, 0.5)
add(whoosh(0.3, True, 2000, 14000), 7.8, 0.3, verb=0.5)
for i, m in enumerate((76, 79, 84, 88)): add(bell(midi(m), 0.6), 8.08 + i * 0.04, 0.12, pan=-0.4 + i * 0.27, verb=0.7)
add(whoosh(0.2, True), 8.32, 0.4)
# (5) disaster medicine: a slam per poster, then the fan-out and push-in
for i, x in enumerate((8.5, 9.0, 9.5)):
    add(whoosh(0.2, False, 600, 10000), x - 0.05, 0.45, pan=(0, 0.6, -0.6)[i])
    add(kick(0.3, 110, 55, 0.2), x + 0.02, 0.5)
    for m in chords[i % 4][1]: add(pluck(midi(m), 0.3, 5000), x, 0.12, verb=0.4)
for i in range(3): add(whoosh(0.25, False, 500, 8000), 10.0 + i * 0.06, 0.3, pan=(-0.6, 0.6, 0)[i])
add(riser(0.4), 10.1, 0.5)
# (6) team: warm chord as the sleeve reveals
for m in (69, 72, 76, 81): add(bell(midi(m), 0.9), 10.5, 0.1, verb=0.9)
# (6) rewind: snare roll + riser
for i in range(16):
    x = 11.5 + i * 0.5 / 16
    add(clap(), x, 0.15 + 0.35 * i / 16, pan=((i % 2) - 0.5) * 0.4)
add(riser(0.5), 11.5, 0.9)
# (7) impact + end card
add(kick(0.8, 180, 38, 1.0), 12.0, 1.2)
add(sub_drop(2.8), 12.0, 0.9)
add(lp(noise(2.5), 6000) * env(int(SR * 2.5), 0.002, 0.5), 12.0, 0.45, verb=1.0)
add(pad([midi(m) for m in (57, 64, 67, 71, 72, 76)], 3.0), 12.0, 0.3, verb=0.9)
for i, m in enumerate((81, 84, 88, 91)): add(bell(midi(m), 0.8), 12.08 + i * 0.07, 0.12, pan=-0.3 + i * 0.2, verb=0.8)
add(whoosh(0.2, True, 300, 3000), 13.3, 0.4)
add(kick(0.35, 120, 50, 0.3), 13.5, 0.9)
wood = lp(hp(noise(0.08), 900), 2500) * env(int(SR * 0.08), 0.0003, 0.015)
add(wood, 13.5, 1.4, verb=0.5)
add(bell(midi(69), 1.2), 13.5, 0.18, verb=1.0)

# ---------- mix ----------
# sidechain duck from the kick grid
duck = np.ones(N); tt = np.arange(N) / SR
for x in np.arange(1.5, 11.5, B):
    m = tt >= x; duck[m] *= 1 - 0.45 * np.exp(-(tt[m] - x) / 0.09)
# reverb: exponentially decaying noise IR, FFT convolution
ir_t = np.arange(int(SR * 1.8)) / SR
irL = rng.normal(size=len(ir_t)) * np.exp(-ir_t / 0.45); irR = rng.normal(size=len(ir_t)) * np.exp(-ir_t / 0.45)
M = 1 << int(np.ceil(np.log2(N + len(ir_t))))
F = np.fft.rfft(RV, M)
wetL = np.fft.irfft(F * np.fft.rfft(irL, M), M)[:N]; wetR = np.fft.irfft(F * np.fft.rfft(irR, M), M)[:N]
wetL = lp(wetL, 5000); wetR = lp(wetR, 5000)
wet = 0.22 / np.max(np.abs(np.concatenate([wetL, wetR])) + 1e-9)
L = (L + wetL * wet * 1.2) * duck; R = (R + wetR * wet * 1.2) * duck
fade = np.minimum(1, np.maximum(0, (DUR - tt) / 0.6))
out = np.stack([L, R], 1) * fade[:, None]
out = np.tanh(out * 1.25) / np.tanh(1.25)
out *= 0.93 / np.max(np.abs(out))
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote', sys.argv[1])
