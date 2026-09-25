/* ============================================================
   CHAOS LAYER — information overload, drawn over every scene.
   Professional facts only (sourced from the owner's Notion);
   no family, address, contact or other personal data.
   ============================================================ */
(() => {
'use strict';
const W = 1920, H = 1080, TAU = Math.PI * 2;
const C = { ink: '#0A0A0C', cream: '#F3EEE3', red: '#FF3B1F', blue: '#2B3BFF', yellow: '#FFD23F' };
const JP = '"Noto Sans JP"', MONO = '"JetBrains Mono", "Noto Sans JP"', DISP = 'Unbounded', DELA = '"Dela Gothic One"';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const outExpo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
const outBack = (x, s = 2.2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const hash = (a, b = 0) => {
  let h = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(b + 0x632BE59B, 0xC2B2AE35);
  h ^= h >>> 13; h = Math.imul(h, 0x27D4EB2F); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/* ---------------- content ---------------- */
const POPUPS = [
  ['CAREER.exe', ['2002 佐賀医科大学 医学部 卒業', '2003 健和会大手町病院', '2006 佐賀大学 救命救急センター', '2009 日本医科大学千葉北総病院', '2010 助教 → 現在 講師', '2026 千葉大学 災害治療学研究所', '　　 客員准教授']],
  ['FLIGHT_DOCTOR.log', ['since 2009.08', 'DOCTOR-HELI', 'RAPID RESPONSE CAR', '空と陸から、現場へ。', '病院前診療の第一線']],
  ['DMAT.sys', ['日本DMATインストラクター 2008〜', '統括DMAT', '千葉県DMAT部会 会長', '千葉県災害医療コーディネーター', '印旛地区 災害医療コーディネーター']],
  ['NOTO_2024.txt', ['令和6年能登半島地震', '石川県庁 DMAT調整本部', '搬送調整班／ドクターヘリ調整部', '活動 37日間', 'DH搬送 87件', '空路搬送 合計 713件', 'CH-47 大型ヘリ搬送調整']],
  ['KUMAMOTO_2016.pdf', ['Aeromedical Transport Operations', 'Using Helicopters during the', '2016 Kumamoto Earthquake', 'in Japan', 'J Nippon Med Sch 85(2), 2018']],
  ['D-CALL_NET.app', ['救急自動通報システム', '事故の瞬間 → ドクターヘリ起動', '日臨救急医会誌 21:513–8', 'MCPC award 2015', 'モバイルパブリック賞']],
  ['LIVE119.mp4', ['社会実装された動画救急通報', '日臨救急医会誌 2025;28:841-2', 'スマホ119 × 通信医学']],
  ['AirMED2026.mp3', ['World Congress of', 'Air Medical Services — Munich', '"The Role of Doctor-Heli in', ' Natural Disaster Response', ' and Management in Japan"']],
  ['QUOTE.txt', ['"We should build the network', ' before we need the network."']],
  ['AWARDS!!!.zip', ['2015 最優秀演題賞（日本外傷学会）', '2014 MCPC award 特別賞', '2015 MCPC モバイルパブリック賞', '2016 ベスト・プレゼンテーション賞', '2016 ベスト・ペーパー賞']],
  ['LICENSE.db', ['救急科専門医・指導医', '外傷専門医', '社会医学系専門医・指導医', '航空医療学会 認定指導者', '医学博士 MD, PhD']],
  ['INSTRUCTOR.ini', ['JATEC 2007〜', 'Emergo Train System 国際上級 2007〜', 'MCLS 2013–2021', '日本DMAT 2008〜', '千葉県DMAT 2013〜']],
  ['WG_LEADER.doc', ['4学会合同', '救急医学会・臨床救急医学会', '災害医学会・航空医療学会', '災害時ドクターヘリ運用WG長']],
  ['J-HERO.org', ['日本災害救急教育推進機構', '（設立準備中）', '「誰でもHEROになれる社会」', 'BASIC→STANDARD→ADVANCE→MASTER']],
  ['KODOMO_QQ.app', ['こどもQQ', 'こどもきゅうきゅうのかい', '自助・共助を、こどもから。', '夏休みドクターヘリ勉強会']],
  ['MEDIA.credits', ['医療監修・指導', 'コード・ブルー', 'ナイトドクター', 'ラジエーションハウス', '君と世界が終わる日に']],
  ['JOSO_2015.pdf', ['茨城県常総市豪雨災害における', '航空医療体制構築と', 'ドクターヘリ活動', '日本航空医療学会雑誌 19(3) 2018']],
  ['TEACHING.ppt', ['医学生（4〜6年）講義', '救急・外傷・血液浄化', '医学生災害チーム EggMAT', '若手災害チーム PiyoMAT']],
  ['SPECIALTY.cfg', ['外傷医療', '災害医療', '病院前医療', '通信医学', '医工学連携（交通事故実態調査）']],
  ['JAPAN_HEMS.csv', ['2001〜 ドクターヘリ', '57機 / 47都道府県', '300km則', '10ブロック制', '医師同乗 必須']],
  ['BK117-D3.txt', ['機体更新で', '医療用座席 4席', '研修医・救命士のOJTに活用']],
  ['SOCIETY.xls', ['日本救急医学会 評議員', '日本外傷学会 評議員', '日本航空医療学会 評議員', '日本災害医学会 評議員', '日本臨床救急医学会 評議員']],
  ['CHAIR_2024.evt', ['日本臨床救急医学会 2024', 'シンポジウム「洋上救急の実態」', '座長']],
  ['JAAM_2021.pptx', ['日本救急医学会 2021', 'D-Call Netによる', 'ドクターヘリ実出動（2015–21）']],
  ['LESS_IS_MORE.md', ['病院前診療の Less is More', '現場滞在時間 × 搬送距離', '介入量の最適化']],
  ['SIMULATION.run', ['ドクターヘリ外傷シミュレーション', '災害時本部運営シミュレーション', '洋上サバイバル訓練']],
  ['TRAFFIC.doc', ['交通事故実態調査 2009〜', '医工連携', '自動運転時代の救急医療へ']],
  ['25TH.evt', ['ドクターヘリ事業', '25周年記念']],
  ['NOW.txt', ['勤続18年', '病院前救急の第一線', '空と陸から命を救う']],
];
const TICKERS = [
  { t0: 0.3, y: 34, rot: 0, h: 40, bg: C.ink, fg: C.cream, size: 20, sp: -520, font: MONO,
    s: 'EMERGENCY MEDICINE • TRAUMA • DISASTER MEDICINE • PREHOSPITAL CARE • DOCTOR-HELI • HEMS • RAPID RESPONSE CAR • D-CALL NET • LIVE119 • AirMED2026 MUNICH • WE SHOULD BUILD THE NETWORK BEFORE WE NEED THE NETWORK • ' },
  { t0: 0.9, y: 1046, rot: 0, h: 44, bg: C.red, fg: C.cream, size: 24, sp: 600, font: JP,
    s: '救命救急センター ／ フライトドクター ／ ドクターヘリ ／ ラピッドレスポンスカー ／ 統括DMAT ／ 千葉県DMAT部会 会長 ／ 医学博士 ／ 講師 ／ 客員准教授 ／ 災害医療コーディネーター ／ 4学会合同WG長 ／ ' },
  { t0: 1.5, y: 250, rot: -0.06, h: 56, bg: C.yellow, fg: C.ink, size: 32, sp: -900, font: JP,
    s: 'DH搬送 87件！！ 空路搬送 713件！！ 37日間！！ 57機！！ 47都道府県！！ 300km！！ 10ブロック！！ 勤続18年！！ 2001〜！！ 2009〜！！ ' },
  { t0: 2.5, y: 830, rot: 0.05, h: 50, bg: C.blue, fg: C.cream, size: 28, sp: 800, font: JP,
    s: '阪神・淡路 1995 → 東日本 2011 → 常総 2015 → 熊本 2016 → 能登 2024 → そして次の災害へ → ' },
  { t0: 3.5, y: 150, rot: 0.03, h: 0, bg: null, fg: C.red, size: 30, sp: 700, font: JP,
    s: 'Aeromedical Transport Operations Using Helicopters during the 2016 Kumamoto Earthquake in Japan ／ ドクターヘリを起動する救急自動通報システム（D-Call Net）の開発と試験運用 ／ 茨城県常総市豪雨災害における航空医療体制構築とドクターヘリ活動 ／ 社会実装された動画救急通報（Live119）の実態 ／ ' },
  { t0: 5.0, y: 940, rot: -0.025, h: 40, bg: C.cream, fg: C.ink, size: 22, sp: -650, font: JP,
    s: '日本救急医学会 専門医・指導医・評議員 ● 日本外傷学会 専門医・評議員 ● 日本航空医療学会 認定指導者・評議員 ● 日本災害医学会 評議員 ● 社会医学系専門医・指導医 ● 日本臨床救急医学会 評議員・国際委員会 ● ' },
  { t0: 7.0, y: 420, rot: 0.09, h: 60, bg: C.red, fg: C.yellow, size: 36, sp: -1100, font: DELA,
    s: '最優秀演題賞！ MCPC award！ ベスト・プレゼンテーション賞！ ベスト・ペーパー賞！ 医療監修！ コード・ブルー！ ナイトドクター！ ' },
  { t0: 8.5, y: 660, rot: -0.07, h: 52, bg: C.ink, fg: C.yellow, size: 30, sp: 950, font: JP,
    s: 'J-HERO 誰でもHEROになれる社会 ★ こどもQQ ★ 自助・共助 ★ エマルゴ ★ EggMAT ★ PiyoMAT ★ BASIC → STANDARD → ADVANCE → MASTER ★ ' },
];
const QUESTIONS = [
  'ドクターヘリは日本に何機ありますか？', 'ドクターヘリはいつから日本で始まったのですか？', 'なぜ救急車ではなくヘリが必要なのですか？',
  'ドクターヘリと消防ヘリの違いは？', '要請は誰が・どうやって出すのですか？', '出動までに何分くらいかかりますか？', '夜や悪天候では飛べますか？',
  '年間で何件くらい出動していますか？', '一番多い出動理由は何ですか？', 'ドクターヘリに乗る医師は何人いますか？', '看護師さんの役割は？',
  'ヘリに乗れる医師の条件は？', '千葉県ならではの出動パターンは？', '海・山・高速道路、どこが一番多い？', '成田空港関連の出動はありますか？',
  '現場で最初に見るポイントは？', '「これは命が危ない」と判断する瞬間は？', '現場で最も難しい判断は？', '搬送先を即決する基準は？',
  '時間と安全、どちらを優先しますか？', '災害医療と通常救急の一番の違いは？', '多数傷病者発生時、最初にすることは？', 'ドクターヘリは災害時どう動きますか？',
  '地震・水害・事故で役割は変わりますか？', '医師でも怖いと感じることは？', 'ヘリはうるさくて危なくないの？', 'どうしてヘリは赤いの？',
  '医師は空が怖くないの？', 'ヘリが来るとき、近くにいたらどうすればいい？', '子どももヘリに乗ることはある？',
];
const STICKERS = [['18', '年'], ['57', '機'], ['87', 'DH搬送'], ['713', '空路搬送'], ['37', '日間'], ['2001', '〜'], ['300', 'km則'], ['10', 'ブロック'],
  ['100', '問'], ['4', '学会'], ['MD', 'PhD'], ['1995', '阪神'], ['2011', '東日本'], ['2016', '熊本'], ['2024', '能登'], ['24', 'HOURS'],
  ['DMAT', '統括'], ['HERO', 'J-HERO'], ['QQ', 'こども'], ['119', 'LIVE'], ['4', '席']];
const TATE = '救命救急　災害医療　ドクターヘリ　病院前診療　外傷医療　搬送調整　';

/* ---------------- helpers ---------------- */
const wcache = new Map();
function textW(ctx, s) {
  const k = ctx.font + '|' + s;
  if (!wcache.has(k)) wcache.set(k, ctx.measureText(s).width);
  return wcache.get(k);
}
function ticker(ctx, T, t, k) {
  const p = outExpo(prog(t, T.t0, T.t0 + 0.35));
  if (p <= 0) return;
  ctx.save(); ctx.translate(W / 2, T.y); ctx.rotate(T.rot);
  ctx.beginPath(); ctx.rect(-W * p, -T.h / 2 - 40, W * 2 * p, T.h + 80); ctx.clip();
  if (T.bg) { ctx.fillStyle = T.bg; ctx.fillRect(-W, -T.h / 2, W * 2, T.h); }
  ctx.font = `${T.font === DELA ? 400 : T.font === MONO ? 500 : 700} ${T.size}px ${T.font}`;
  ctx.fillStyle = T.fg; ctx.textBaseline = 'middle';
  const w = textW(ctx, T.s);
  let x = (((t - T.t0) * T.sp) % w + w) % w - w - W;
  for (; x < W; x += w) ctx.fillText(T.s, x, 2);
  ctx.restore(); ctx.textBaseline = 'alphabetic';
}
function popup(ctx, i, t0, t) {
  const age = t - t0, life = 1.55;
  if (age < 0 || age > life) return;
  const [title, lines] = POPUPS[i % POPUPS.length];
  const r = k => hash(i * 7 + 3, k);
  ctx.font = `700 18px ${JP}`;
  let mw = textW(ctx, title) + 90;
  for (const l of lines) mw = Math.max(mw, textW(ctx, l) + 44);
  const w = Math.min(560, mw), h = 38 + lines.length * 27 + 18;
  const x = 20 + r(1) * (W - w - 40), y = 70 + r(2) * (H - h - 150);
  const pin = outBack(prog(age, 0, 0.16)), pout = prog(age, life - 0.12, life);
  const s = pin * (1 - pout * pout);
  if (s <= 0.01) return;
  const theme = [[C.red, C.cream], [C.blue, C.cream], [C.ink, C.cream], [C.yellow, C.cream]][i % 4];
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((r(3) - 0.5) * 0.14); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = C.ink; ctx.fillRect(10, 10, w, h);
  ctx.fillStyle = theme[1]; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = theme[0]; ctx.fillRect(0, 0, w, 34);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = theme[0] === C.yellow ? C.ink : C.cream;
  ctx.font = `500 16px ${MONO}`; ctx.fillText('■ ' + title, 12, 23);
  for (let b = 0; b < 3; b++) ctx.fillRect(w - 26 - b * 22, 11, 13, 13);
  ctx.fillStyle = C.ink; ctx.font = `700 18px ${JP}`;
  const typed = Math.floor(prog(age, 0.08, 0.5) * 60);
  let used = 0;
  lines.forEach((l, j) => {
    const n = Math.max(0, Math.min(l.length, typed - used)); used += l.length * 0.35;
    if (n > 0) ctx.fillText(l.slice(0, n), 20, 60 + j * 27);
  });
  ctx.restore();
}
function sticker(ctx, i, t0, t) {
  const age = t - t0;
  if (age < 0 || age > 1.3) return;
  const [big, small] = STICKERS[i % STICKERS.length];
  const x = 140 + hash(i, 11) * (W - 280), y = 140 + hash(i, 12) * (H - 300);
  const s = outBack(prog(age, 0, 0.18), 3) * (1 - prog(age, 1.15, 1.3));
  if (s <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i, 13) - 0.5) * 0.8 + age * 0.6); ctx.scale(s, s);
  const R = 92;
  ctx.beginPath();
  for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, rr = k % 2 ? R * 0.84 : R; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0); }
  ctx.closePath();
  ctx.fillStyle = C.ink; ctx.save(); ctx.translate(6, 6); ctx.fill(); ctx.restore();
  ctx.fillStyle = i % 3 === 0 ? C.red : C.yellow; ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = i % 3 === 0 ? C.cream : C.ink; ctx.textAlign = 'center';
  ctx.font = `800 ${big.length > 3 ? 40 : 58}px ${DISP}`; ctx.fillText(big, 0, 12);
  ctx.font = `700 20px ${JP}`; ctx.fillText(small, 0, 44);
  ctx.restore(); ctx.textAlign = 'left';
}
function qwall(ctx, t) {
  const p = outExpo(prog(t, 3.5, 3.9));
  if (p <= 0) return;
  const w = 440, x = W - w * p;
  ctx.fillStyle = 'rgba(10,10,12,0.82)'; ctx.fillRect(x, 0, w, H);
  ctx.fillStyle = C.red; ctx.fillRect(x, 0, 6, H);
  ctx.save(); ctx.beginPath(); ctx.rect(x, 0, w, H); ctx.clip();
  ctx.font = `700 17px ${JP}`;
  const lh = 30, total = QUESTIONS.length * lh, off = ((t - 3.5) * 160) % total;
  for (let rep = -1; rep <= 1; rep++) QUESTIONS.forEach((q, j) => {
    const y = 40 + j * lh - off + rep * total;
    if (y < -20 || y > H + 20) return;
    ctx.fillStyle = C.yellow; ctx.fillText(`Q.${String(j + 1).padStart(3, '0')}`, x + 20, y);
    ctx.fillStyle = C.cream; ctx.fillText(q, x + 88, y);
  });
  ctx.restore();
  ctx.font = `800 22px ${DISP}`; ctx.fillStyle = C.yellow; ctx.fillText('Q&A ×100', x + 20, H - 70);
}
function tate(ctx, t) {
  const p = outExpo(prog(t, 5.0, 5.3));
  if (p <= 0) return;
  const size = 58, x = 30 - (1 - p) * 120, chars = [...TATE], lh = size * 1.05, total = chars.length * lh;
  ctx.fillStyle = C.red; ctx.fillRect(x - 10, 0, size + 20, H);
  ctx.font = `400 ${size}px ${DELA}`; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
  const off = ((t - 5) * 260) % total;
  for (let rep = -1; rep <= 1; rep++) chars.forEach((ch, j) => {
    const y = j * lh + off - total + rep * total + size;
    if (y > -size && y < H + size) ctx.fillText(ch, x + size / 2, y);
  });
  ctx.textAlign = 'left';
}

/* ---------------- layer ---------------- */
// endCard: lighter chaos behind the name panel
function draw(ctx, t, endCard = false) {
  if (!endCard) for (let k = 0; k < TICKERS.length; k++) ticker(ctx, TICKERS[k], t, k);
  else { ticker(ctx, TICKERS[0], t, 0); ticker(ctx, TICKERS[1], t, 1); ticker(ctx, TICKERS[2], t, 2); ticker(ctx, TICKERS[3], t, 3); }
  if (!endCard) { qwall(ctx, t); tate(ctx, t); }
  const step = 0.14;
  for (let i = 0; i * step + 0.4 < Math.min(t, 14.6); i++) popup(ctx, i, 0.4 + i * step, t);
  for (let b = 0; b < 26; b++) sticker(ctx, b, 1.5 + b * 0.5, t);
}
window.CHAOS = { draw };
})();
