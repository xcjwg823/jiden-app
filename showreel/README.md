# 本村友一 / TOMOKAZU MOTOMURA — Motion Showreel 2026

15秒 / 1920×1080 / 60fps / 120BPM のモーショングラフィックス・ショーリール。

- `showreel.mp4` — 完成動画（H.264 + AAC）
- `index.html` + `reel.js` — アニメーション本体。`python3 -m http.server` で配信し、ブラウザで開いて ▶ PLAY でリアルタイム再生
- `img/` — 使用素材（ドクターヘリ写真、ポートレート（絵画／デ・ステイル）、Motomura creative ポスター3点）
- `audio.py` — サウンドトラックを数式で合成（全ヒットが映像のカットに同期）
- `render.mjs` — Playwright で1フレームずつ描画し、4サンプルのモーションブラーを掛けて ffmpeg へ出力

## 構成
| 時間 | シーン |
|---|---|
| 0.0–1.5 | IGNITION — 点 → 予備動作 → 線 → 画面を満たす |
| 1.5–3.5 | KINETIC TYPE — MOTION / DESIGN、ドクターヘリの実写に「動きで、伝える。」 |
| 3.5–5.5 | EASING / MORPH — ベジェ曲線と連動する図形モーフ |
| 5.5–7.5 | 3D / PARTICLES — 9,216点の球体が爆発し、ポートレートのモザイクに再集結して写真へ |
| 7.5–9.0 | PORTRAIT — 絵画がタイルごとに裏返りデ・ステイル版へ |
| 9.0–11.5 | KEY VISUAL — Motomura creative ポスターがビートごとに飛び込み、扇状に展開 |
| 11.5–12.0 | REWIND — RGBずれのストロボ・リキャップ |
| 12.0–15.0 | END CARD — 氏名と落款（はんこ）が押される |

## 再レンダリング
```sh
pip install numpy imageio-ffmpeg
python3 audio.py audio.wav
node render.mjs "$(python3 -c 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())')" showreel.mp4 audio.wav
```
氏名は `reel.js` 冒頭の `NAME` / `NAME_EN` で変更できます。

フォント: Unbounded, Dela Gothic One, Noto Sans JP, JetBrains Mono（いずれも SIL Open Font License）
