// 質問バンク（すべて固定・ローカルのみ。AI/APIは一切使用しない）
// type: "text"（自由記述） / "yesno"（はい・いいえの分岐）
// yesno の場合は yesNext / noNext で分岐先を指定する
const QUESTIONS = {
  q1: {
    chapter: "第1章 生まれ・幼少期",
    type: "text",
    text: "いつ、どこで生まれましたか？（生年月日や出身地など、覚えている範囲で教えてください）",
    placeholder: "例：1977年◯月◯日、福岡県大川市生まれ…",
    next: "q2"
  },
  q2: {
    chapter: "第1章 生まれ・幼少期",
    type: "text",
    text: "子どものころ、どんな性格でしたか？",
    next: "q3"
  },
  q3: {
    chapter: "第1章 生まれ・幼少期",
    type: "text",
    text: "小さいころに一番覚えている思い出は何ですか？",
    next: "q4"
  },
  q4: {
    chapter: "第1章 生まれ・幼少期",
    type: "text",
    text: "名前の由来や、名付けにまつわるエピソードはありますか？",
    next: "q5"
  },
  q5: {
    chapter: "第2章 家族",
    type: "text",
    text: "どんな家族構成で育ちましたか？（両親・祖父母・きょうだいなど）",
    next: "q6"
  },
  q6: {
    chapter: "第2章 家族",
    type: "yesno",
    text: "きょうだいはいますか？",
    yesNext: "q7",
    noNext: "q8"
  },
  q7: {
    chapter: "第2章 家族",
    type: "text",
    text: "きょうだいとの関係や、思い出のエピソードを教えてください",
    next: "q8"
  },
  q8: {
    chapter: "第2章 家族",
    type: "text",
    text: "家族の中で、特に影響を受けた人は誰ですか？またその理由は？",
    next: "q9"
  },
  q9: {
    chapter: "第3章 学生時代",
    type: "text",
    text: "小学校時代、夢中になっていたことは何ですか？",
    next: "q10"
  },
  q10: {
    chapter: "第3章 学生時代",
    type: "text",
    text: "中学・高校時代に打ち込んだこと（部活・勉強・趣味など）はありますか？",
    next: "q11"
  },
  q11: {
    chapter: "第3章 学生時代",
    type: "text",
    text: "学生時代の恩師や、忘れられない先生はいますか？",
    next: "q12"
  },
  q12: {
    chapter: "第3章 学生時代",
    type: "text",
    text: "学生時代を一言で表すと？そのエピソードも教えてください",
    next: "q13"
  },
  q13: {
    chapter: "第4章 進路・仕事選び",
    type: "text",
    text: "今の仕事・専門分野を選んだきっかけは何ですか？",
    next: "q14"
  },
  q14: {
    chapter: "第4章 進路・仕事選び",
    type: "yesno",
    text: "進路を決めるうえで、迷ったり悩んだりしたことはありますか？",
    yesNext: "q15",
    noNext: "q16"
  },
  q15: {
    chapter: "第4章 進路・仕事選び",
    type: "text",
    text: "その迷いをどう乗り越えましたか？",
    next: "q16"
  },
  q16: {
    chapter: "第4章 進路・仕事選び",
    type: "text",
    text: "最初の仕事（職場）でのことで、覚えていることを教えてください",
    next: "q17"
  },
  q17: {
    chapter: "第5章 仕事人生",
    type: "text",
    text: "これまでのキャリアの中で、一番印象に残っている出来事は何ですか？",
    next: "q18"
  },
  q18: {
    chapter: "第5章 仕事人生",
    type: "yesno",
    text: "仕事で大きな転機（転職・異動・新しい挑戦など）はありましたか？",
    yesNext: "q19",
    noNext: "q20"
  },
  q19: {
    chapter: "第5章 仕事人生",
    type: "text",
    text: "その転機について詳しく教えてください",
    next: "q20"
  },
  q20: {
    chapter: "第5章 仕事人生",
    type: "text",
    text: "仕事を通じて、一番誇りに思っていることは何ですか？",
    next: "q21"
  },
  q21: {
    chapter: "第6章 転機・挫折",
    type: "yesno",
    text: "人生で大きな挫折や失敗をした経験はありますか？",
    yesNext: "q22",
    noNext: "q23"
  },
  q22: {
    chapter: "第6章 転機・挫折",
    type: "text",
    text: "その経験と、どう乗り越えたかを教えてください",
    next: "q23"
  },
  q23: {
    chapter: "第6章 転機・挫折",
    type: "text",
    text: "これまでの人生で「あの選択が転機だった」と思う出来事はありますか？",
    next: "q24"
  },
  q24: {
    chapter: "第7章 家族をつくる",
    type: "yesno",
    text: "結婚していますか？（していない場合は「いいえ」を選んでください）",
    yesNext: "q25",
    noNext: "q27"
  },
  q25: {
    chapter: "第7章 家族をつくる",
    type: "text",
    text: "パートナーとの出会いや、結婚のエピソードを教えてください",
    next: "q26"
  },
  q26: {
    chapter: "第7章 家族をつくる",
    type: "text",
    text: "お子さんはいますか？名前の由来や、子育てで大切にしていることを教えてください（いない場合は空欄で構いません）",
    next: "q28"
  },
  q27: {
    chapter: "第7章 家族をつくる",
    type: "text",
    text: "大切にしているパートナーシップや、友人・仲間との関係について教えてください",
    next: "q28"
  },
  q28: {
    chapter: "第7章 家族をつくる",
    type: "text",
    text: "家族に対して、これまで伝えられなかった気持ちがあれば教えてください",
    next: "q29"
  },
  q29: {
    chapter: "第8章 大切にしている価値観",
    type: "text",
    text: "人生で大切にしている言葉や、座右の銘はありますか？",
    next: "q30"
  },
  q30: {
    chapter: "第8章 大切にしている価値観",
    type: "text",
    text: "尊敬する人物や、生き方の手本にしている人はいますか？",
    next: "q31"
  },
  q31: {
    chapter: "第8章 大切にしている価値観",
    type: "text",
    text: "これまでの人生で、一番幸せだったと感じる瞬間は？",
    next: "q32"
  },
  q32: {
    chapter: "第8章 大切にしている価値観",
    type: "text",
    text: "逆に、一番つらかった時期はいつで、どう乗り越えましたか？",
    next: "q33"
  },
  q33: {
    chapter: "第9章 これから",
    type: "text",
    text: "これから挑戦したいこと、やってみたいことはありますか？",
    next: "q34"
  },
  q34: {
    chapter: "第9章 これから",
    type: "text",
    text: "将来の自分や家族、後世に伝えたいメッセージがあれば教えてください",
    next: "q35"
  },
  q35: {
    chapter: "第9章 これから",
    type: "text",
    text: "この自伝を読む人（家族や子孫）に、一言お願いします",
    next: null
  }
};

const FIRST_QUESTION_ID = "q1";
