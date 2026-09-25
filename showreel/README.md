# Tomokazu Motomura — Showreel 2026

救急医療・ドクターヘリ・災害医療を伝える 15秒 / 1920×1080 / 60fps のショーリール。

- `showreel.mp4` — 完成動画（H.264 + AAC）
- `index.html` + `reel.js` — アニメーション本体。`python3 -m http.server` で配信し、ブラウザで開いて ▶ PLAY でリアルタイム再生
- `img/` — 使用素材（ドクターヘリ写真、EMERGENCY レーン、HOKUSOH HEMS、ポートレート、Motomura creative ポスター、Hokusoh Shock & Trauma Center）
- `audio.py` — サウンドトラックを数式で合成（全ヒットが映像のカットに同期）
- `render.mjs` — Playwright で1フレームずつ描画し、4サンプルのモーションブラーを掛けて ffmpeg へ出力

## 構成
| 時間 | シーン |
|---|---|
| 0.0–1.5 | VITALS — 心電図が走り、最後のスパイクが画面を赤に染める |
| 1.5–3.5 | EMERGENCY / MEDICINE → EMERGENCY レーンから空のドクターヘリへティルトアップ「一秒でも早く、医療を届ける。」 |
| 3.5–5.0 | THREE PILLARS — 回転する3D十字と、救急医療／ドクターヘリ／災害医療 |
| 5.0–7.0 | DOCTOR-HELI — JA6790 → ANYTIME. → ANYWHERE. → HOKUSOH HEMS |
| 7.0–8.5 | ON THE FRONT LINE — 粒子の球体が弾け、ポートレートに再集結 |
| 8.5–10.5 | DISASTER MEDICINE — ポスター3点がビートごとに飛び込み扇状に展開 |
| 10.5–11.5 | TEAM — Hokusoh Shock & Trauma Center「チームで、命をつなぐ。」 |
| 11.5–12.0 | REWIND — RGBずれのストロボ・リキャップ |
| 12.0–15.0 | END CARD — Tomokazu Motomura / Flight Doctor / Emergency Physician と落款 |

## 再レンダリング
```sh
pip install numpy imageio-ffmpeg
python3 audio.py audio.wav
node render.mjs "$(python3 -c 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())')" showreel.mp4 audio.wav
```
氏名は `reel.js` 冒頭の `NAME` / `NAME_EN` で変更できます。

フォント: Unbounded, Dela Gothic One, Noto Sans JP, JetBrains Mono（いずれも SIL Open Font License）
