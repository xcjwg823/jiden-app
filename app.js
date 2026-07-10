// じぶん自伝メーカー — すべてローカル完結（外部API・通信なし）
const STORAGE_KEY = "jiden_state_v1";
const TOTAL_APPROX = Object.keys(QUESTIONS).length;

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 破損データは無視して初期化 */ }
  return { currentId: FIRST_QUESTION_ID, history: [], answers: {}, finished: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (state.finished || state.currentId === null) {
    renderFinish(app);
    return;
  }

  const q = QUESTIONS[state.currentId];
  const answeredCount = state.history.length;
  const pct = Math.min(100, Math.round((answeredCount / TOTAL_APPROX) * 100));

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";
  progressWrap.innerHTML = `
    <div class="progress-bar"><div style="width:${pct}%"></div></div>
    <div class="progress-label">${answeredCount + 1}問目（目安 ${pct}%）</div>
  `;
  app.appendChild(progressWrap);

  const card = document.createElement("div");
  card.className = "card";

  const chapterLabel = document.createElement("span");
  chapterLabel.className = "chapter-label";
  chapterLabel.textContent = q.chapter;
  card.appendChild(chapterLabel);

  const qText = document.createElement("p");
  qText.className = "question-text";
  qText.textContent = q.text;
  card.appendChild(qText);

  const existingAnswer = state.answers[state.currentId];

  if (q.type === "yesno") {
    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const yesBtn = document.createElement("button");
    yesBtn.className = "btn-yes";
    yesBtn.textContent = "はい";
    yesBtn.onclick = () => answerYesNo(true);
    const noBtn = document.createElement("button");
    noBtn.className = "btn-no";
    noBtn.textContent = "いいえ";
    noBtn.onclick = () => answerYesNo(false);
    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    card.appendChild(btnRow);
  } else {
    const textarea = document.createElement("textarea");
    textarea.placeholder = q.placeholder || "自由に書いてください（あとで編集できます）";
    textarea.value = existingAnswer ? existingAnswer.value : "";
    card.appendChild(textarea);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn-primary";
    nextBtn.textContent = "次へ";
    nextBtn.onclick = () => answerText(textarea.value.trim());
    const skipBtn = document.createElement("button");
    skipBtn.className = "btn-secondary";
    skipBtn.textContent = "スキップ";
    skipBtn.onclick = () => answerText("");
    btnRow.appendChild(nextBtn);
    btnRow.appendChild(skipBtn);
    card.appendChild(btnRow);
  }

  if (state.history.length > 0) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.textContent = "← 前の質問に戻る";
    backBtn.onclick = goBack;
    card.appendChild(backBtn);
  }

  app.appendChild(card);
}

function answerYesNo(yes) {
  const q = QUESTIONS[state.currentId];
  state.answers[state.currentId] = {
    chapter: q.chapter,
    question: q.text,
    value: yes ? "はい" : "いいえ"
  };
  state.history.push(state.currentId);
  state.currentId = yes ? q.yesNext : q.noNext;
  finalizeStep();
}

function answerText(value) {
  const q = QUESTIONS[state.currentId];
  state.answers[state.currentId] = {
    chapter: q.chapter,
    question: q.text,
    value: value
  };
  state.history.push(state.currentId);
  state.currentId = q.next;
  finalizeStep();
}

function finalizeStep() {
  if (state.currentId === null) state.finished = true;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  if (state.history.length === 0) return;
  const prevId = state.history.pop();
  state.currentId = prevId;
  state.finished = false;
  saveState();
  render();
}

function renderFinish(app) {
  const card = document.createElement("div");
  card.className = "card finish-card";

  const h2 = document.createElement("h2");
  h2.textContent = "おつかれさまでした！";
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "すべての質問に答え終わりました。下に回答のまとめがあります。見直したい場合は「前の質問に戻る」から編集できます。";
  card.appendChild(p);

  if (state.history.length > 0) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.textContent = "← 前の質問に戻って編集する";
    backBtn.onclick = goBack;
    card.appendChild(backBtn);
  }

  // 章ごとにまとめる（history の順序＝実際に答えた順序）
  const chapters = [];
  const byChapter = {};
  state.history.forEach((id) => {
    const a = state.answers[id];
    if (!a) return;
    if (!byChapter[a.chapter]) {
      byChapter[a.chapter] = [];
      chapters.push(a.chapter);
    }
    byChapter[a.chapter].push(a);
  });

  chapters.forEach((chTitle) => {
    const sec = document.createElement("div");
    sec.className = "summary-chapter";
    const h3 = document.createElement("h3");
    h3.textContent = chTitle;
    sec.appendChild(h3);
    byChapter[chTitle].forEach((a) => {
      const qa = document.createElement("div");
      qa.className = "summary-qa";
      const qEl = document.createElement("p");
      qEl.className = "summary-q";
      qEl.textContent = "Q. " + a.question;
      const aEl = document.createElement("p");
      aEl.className = "summary-a";
      aEl.textContent = a.value ? a.value : "（未回答）";
      qa.appendChild(qEl);
      qa.appendChild(aEl);
      sec.appendChild(qa);
    });
    card.appendChild(sec);
  });

  const exportRow = document.createElement("div");
  exportRow.className = "export-row";

  if (navigator.share) {
    const shareBtn = document.createElement("button");
    shareBtn.className = "btn-primary";
    shareBtn.textContent = "メモアプリなどに送る（共有）";
    shareBtn.onclick = async () => {
      try {
        await navigator.share({ title: "わたしの自伝", text: buildMarkdown() });
      } catch (e) {
        // ユーザーが共有をキャンセルした場合は何もしない
      }
    };
    exportRow.appendChild(shareBtn);

    const shareHint = document.createElement("p");
    shareHint.className = "summary-q";
    shareHint.textContent = "共有シートが開いたら「メモ」を選ぶと、そのままメモアプリに新規保存されます";
    exportRow.appendChild(shareHint);
  }

  const mdBtn = document.createElement("button");
  mdBtn.className = navigator.share ? "btn-secondary" : "btn-primary";
  mdBtn.textContent = "自伝の原稿をMarkdownでダウンロード";
  mdBtn.onclick = () => downloadFile(buildMarkdown(), "自伝の原稿.md", "text/markdown");

  const txtBtn = document.createElement("button");
  txtBtn.className = "btn-secondary";
  txtBtn.textContent = "テキスト(.txt)でダウンロード";
  txtBtn.onclick = () => downloadFile(buildMarkdown(), "自伝の原稿.txt", "text/plain");

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn-secondary";
  copyBtn.textContent = "クリップボードにコピー";
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      showToast("コピーしました");
    } catch (e) {
      showToast("コピーに失敗しました。手動で選択してください");
    }
  };

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn-danger";
  resetBtn.textContent = "最初からやり直す（回答を全て消去）";
  resetBtn.onclick = () => {
    if (confirm("これまでの回答をすべて消去して最初からやり直します。よろしいですか？")) {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      render();
    }
  };

  exportRow.appendChild(mdBtn);
  exportRow.appendChild(txtBtn);
  exportRow.appendChild(copyBtn);
  exportRow.appendChild(resetBtn);
  card.appendChild(exportRow);

  app.appendChild(card);
}

function buildMarkdown() {
  const lines = [];
  lines.push("# わたしの自伝");
  lines.push("");
  lines.push("_このドキュメントは「じぶん自伝メーカー」の回答をもとに自動でまとめたものです。読みやすいように、あとから加筆・修正してください。_");
  lines.push("");

  const chapters = [];
  const byChapter = {};
  state.history.forEach((id) => {
    const a = state.answers[id];
    if (!a) return;
    if (!byChapter[a.chapter]) {
      byChapter[a.chapter] = [];
      chapters.push(a.chapter);
    }
    byChapter[a.chapter].push(a);
  });

  chapters.forEach((chTitle) => {
    lines.push(`## ${chTitle}`);
    lines.push("");
    byChapter[chTitle].forEach((a) => {
      if (!a.value) return;
      lines.push(a.value);
      lines.push("");
    });
  });

  return lines.join("\n");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast("ダウンロードしました");
}

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* オフライン機能なしでも動作は継続 */ });
  });
}
