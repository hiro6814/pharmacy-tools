#!/usr/bin/env node
/**
 * add_phase2_drugs.js
 * Phase 2-A/B/C/D の薬剤を drugs-master.js に追加する
 * 実行: node scripts/add_phase2_drugs.js
 */
const fs   = require('fs');
const path = require('path');

const MASTER_PATH = path.join(__dirname, '../shared/drugs-master.js');

// ── Phase 2 追加薬剤 ──────────────────────────────────────────────
const NEW_DRUGS = [

  // ════════════════════════════════════════════
  // 2-A: 経口抗がん剤（highAlert: true 必須）
  // ════════════════════════════════════════════
  {
    id: "onc001",
    generic: "カペシタビン",
    brand: "ゼローダ",
    category: "経口抗がん剤（フッ化ピリミジン系）",
    form: "錠",
    features: ["crush"],
    crush: "ng", crushNote: "細胞毒性薬のため粉砕禁忌。暴露防止のため開封・粉砕は行わないこと。",
    susp: "ng", suspNote: "懸濁不可。細胞毒性薬の粉塵・液滴への暴露リスクあり。",
    source: "IF・ASHP Guidelines",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc002",
    generic: "テガフール・ギメラシル・オテラシルカリウム",
    brand: "ティーエスワン（TS-1）",
    category: "経口抗がん剤（フッ化ピリミジン系）",
    form: "カプセル/顆粒",
    features: ["crush"],
    crush: "ng", crushNote: "細胞毒性薬。カプセル開封・粉砕は職業暴露リスクあり。顆粒剤への変更を検討。",
    susp: "ng", suspNote: "懸濁不可。細胞毒性薬の取り扱い注意。",
    source: "IF・添付文書",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc003",
    generic: "メルカプトプリン水和物",
    brand: "ロイケリン",
    category: "経口抗がん剤（代謝拮抗薬）",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕は可能だが必ず手袋・マスク着用。粉塵吸入・皮膚接触を避ける。妊婦は取り扱い禁止。",
    susp: "cond", suspNote: "懸濁可能だが職業暴露管理を徹底する。水で懸濁し速やかに投与。",
    source: "IF・ASHP",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc004",
    generic: "ヒドロキシカルバミド（ヒドロキシウレア）",
    brand: "ハイドレア",
    category: "経口抗がん剤（その他）",
    form: "カプセル",
    features: ["crush"],
    crush: "cond", crushNote: "カプセル開封は可能だが粉塵吸入・皮膚接触を厳重に避ける。手袋・マスク必須。",
    susp: "cond", suspNote: "懸濁可能だが暴露管理を徹底する。",
    source: "IF・ASHP",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc005",
    generic: "テモゾロミド",
    brand: "テモダール",
    category: "経口抗がん剤（アルキル化薬）",
    form: "カプセル",
    features: ["crush"],
    crush: "ng", crushNote: "催奇形性・変異原性あり。カプセル開封・粉砕は絶対禁忌。",
    susp: "ng", suspNote: "懸濁不可。高度な暴露リスクのため代替投与経路を検討。",
    source: "IF・添付文書",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc006",
    generic: "イマチニブメシル酸塩",
    brand: "グリベック",
    category: "経口抗がん剤（分子標的薬・BCR-ABL阻害薬）",
    form: "錠/カプセル",
    features: ["crush"],
    crush: "cond", crushNote: "錠剤粉砕は可能。粉塵吸入を避ける。水100mLに分散させて服用（リンゴジュース可）。",
    susp: "ok", suspNote: "水またはリンゴジュース100mLに分散。調製後速やかに服用。",
    source: "添付文書・メーカー確認",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc007",
    generic: "ゲフィチニブ",
    brand: "イレッサ",
    category: "経口抗がん剤（分子標的薬・EGFR阻害薬）",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可能。水懸濁液として経管投与可（添付文書記載）。",
    susp: "ok", suspNote: "水懸濁液を経鼻胃管または胃瘻チューブ経由で投与可能。",
    source: "添付文書",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc008",
    generic: "エルロチニブ塩酸塩",
    brand: "タルセバ",
    category: "経口抗がん剤（分子標的薬・EGFR阻害薬）",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可。水100mLに懸濁し経管投与可能（添付文書記載）。空腹時投与が重要。",
    susp: "ok", suspNote: "水100mL懸濁液として投与可。空腹時（食前1時間・食後2時間以上空けた状態）を維持。",
    source: "添付文書",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc009",
    generic: "レナリドミド水和物",
    brand: "レブラミド",
    category: "経口抗がん剤（免疫調整薬）",
    form: "カプセル",
    features: ["crush"],
    crush: "ng", crushNote: "催奇形性が極めて強い。カプセル開封・粉砕は絶対禁忌。REVMATE管理下でのみ処方可能。",
    susp: "ng", suspNote: "懸濁不可。催奇形性リスクのため代替薬を検討すること。",
    source: "REVMATE・添付文書",
    verified: "confirmed",
    highAlert: true,
  },
  {
    id: "onc010",
    generic: "ソラフェニブトシル酸塩",
    brand: "ネクサバール",
    category: "経口抗がん剤（分子標的薬・マルチキナーゼ阻害薬）",
    form: "錠",
    features: ["crush"],
    crush: "ng", crushNote: "製剤の完全性を破損するため粉砕不可。生物学的利用能が変化する可能性あり。",
    susp: "ng", suspNote: "懸濁不可。",
    source: "IF・メーカー",
    verified: "confirmed",
    highAlert: true,
  },

  // ════════════════════════════════════════════
  // 2-B: HIV・B型肝炎治療薬
  // ════════════════════════════════════════════
  {
    id: "hbv001",
    generic: "エンテカビル水和物",
    brand: "バラクルード",
    category: "抗B型肝炎ウイルス薬（核酸アナログ）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。空腹時投与（食後2時間以上・食前1時間以上）を維持する。",
    susp: "ok", suspNote: "崩壊・懸濁可能。食事の影響を受けるため空腹時投与を厳守。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hbv002",
    generic: "テノホビルジソプロキシルフマル酸塩",
    brand: "ビリアード",
    category: "抗B型肝炎ウイルス薬（核酸アナログ）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。食事と一緒に服用。",
    susp: "ok", suspNote: "懸濁可能。食事と同時投与推奨。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hbv003",
    generic: "テノホビルアラフェナミドフマル酸塩",
    brand: "ベムリディ",
    category: "抗B型肝炎ウイルス薬（核酸アナログ）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。食事と一緒に服用することで吸収が向上する。",
    susp: "ok", suspNote: "懸濁可能。食事と同時投与推奨。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hbv004",
    generic: "ラミブジン",
    brand: "エピビル",
    category: "抗B型肝炎ウイルス薬（核酸アナログ）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。食事の影響を受けない。",
    susp: "ok", suspNote: "水に溶解・懸濁可能。内用液製剤もある。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hiv001",
    generic: "ドルテグラビルナトリウム",
    brand: "テビケイ",
    category: "抗HIV薬（インテグラーゼ阻害薬）",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "分散液として投与可能（水5mLに分散、60分以内に投与）。HIV取り扱いに準じた暴露対策を行う。",
    susp: "cond", suspNote: "水5mLに分散して投与可能。調製後60分以内に投与。",
    source: "添付文書・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hiv002",
    generic: "エファビレンツ",
    brand: "ストックリン",
    category: "抗HIV薬（NNRTI）",
    form: "カプセル/錠",
    features: ["crush"],
    crush: "cond", crushNote: "カプセルを開封し内容物を投与可能。精神神経系副作用のため就寝前投与を厳守。",
    susp: "cond", suspNote: "カプセル内容物を懸濁可能。苦味あり。就寝前投与を維持。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "hiv003",
    generic: "アバカビル硫酸塩",
    brand: "ザイアジェン",
    category: "抗HIV薬（NRTI）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。HLA-B*5701陽性患者では過敏症反応（アバカビル過敏症）に注意。",
    susp: "ok", suspNote: "懸濁可能。内用液製剤もある。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },

  // ════════════════════════════════════════════
  // 2-C: 透析患者頻用薬（カルシウム受容体関連）
  // ════════════════════════════════════════════
  {
    id: "casr001",
    generic: "シナカルセト塩酸塩",
    brand: "レグパラ",
    category: "カルシウム受容体作動薬（カルシミメティクス）",
    form: "錠",
    features: ["crush"],
    crush: "ng", crushNote: "フィルムコーティング錠で粉砕不可。コーティング除去で苦味強く服薬困難となる。代替薬（エボカルセト）検討。",
    susp: "ng", suspNote: "懸濁不可。コーティング剥離で安定性・服薬性ともに問題あり。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "casr002",
    generic: "エボカルセト",
    brand: "オルケディア",
    category: "カルシウム受容体作動薬（カルシミメティクス）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。シナカルセトと比較し経管投与が容易。",
    susp: "ok", suspNote: "崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },

  // ════════════════════════════════════════════
  // 2-D: 骨粗鬆症追加（ビスフォスフォネート・SERM）
  // ════════════════════════════════════════════
  {
    id: "bpn003",
    generic: "ミノドロン酸水和物",
    brand: "リカルボン / ボノテオ",
    category: "ビスフォスフォネート",
    form: "錠",
    features: ["crush"],
    crush: "ng", crushNote: "食道潰瘍・粘膜刺激リスクあり。粉砕不可。コーティングが保護機能を担っている。",
    susp: "ng", suspNote: "懸濁不可。消化管粘膜刺激が著しい。",
    source: "IF",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "bpn004",
    generic: "イバンドロン酸ナトリウム水和物",
    brand: "ボンビバ",
    category: "ビスフォスフォネート",
    form: "錠",
    features: ["crush"],
    crush: "ng", crushNote: "食道刺激リスクのため粉砕不可。月1回投与製剤のため服薬支援を工夫する。",
    susp: "ng", suspNote: "懸濁不可。",
    source: "IF",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "serm001",
    generic: "ラロキシフェン塩酸塩",
    brand: "エビスタ",
    category: "SERM（選択的エストロゲン受容体調節薬）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。静脈血栓塞栓症リスクについて服薬指導を継続する。",
    susp: "ok", suspNote: "崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "serm002",
    generic: "バゼドキシフェン酢酸塩",
    brand: "ビビアント",
    category: "SERM（選択的エストロゲン受容体調節薬）",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。",
    susp: "ok", suspNote: "崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },

  // ════════════════════════════════════════════
  // 追加: 重要な抗てんかん薬（新規）
  // ════════════════════════════════════════════
  {
    id: "aed_new001",
    generic: "ラモトリギン",
    brand: "ラミクタール",
    category: "抗てんかん薬",
    form: "錠/OD錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可能だが均一分散を確認する。治療域が狭いため投与量管理を徹底。",
    susp: "ok", suspNote: "水に崩壊・懸濁可能（OD錠）。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "aed_new002",
    generic: "レベチラセタム",
    brand: "イーケプラ",
    category: "抗てんかん薬",
    form: "錠/OD錠/ドライシロップ",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。内用液・ドライシロップ製剤もある。",
    susp: "ok", suspNote: "水に崩壊・懸濁良好。内用液製剤への切り替えも容易。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "aed_new003",
    generic: "ペランパネル水和物",
    brand: "フィコンパ",
    category: "抗てんかん薬",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可能。CYP3A4誘導剤との相互作用注意。",
    susp: "ok", suspNote: "崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },

  // ════════════════════════════════════════════
  // 追加: 重要な循環器系薬（新規）
  // ════════════════════════════════════════════
  {
    id: "arr_new001",
    generic: "アミオダロン塩酸塩",
    brand: "アンカロン",
    category: "抗不整脈薬",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可能だが光毒性・職業暴露に注意（甲状腺毒性物質含有）。遮光・手袋着用。",
    susp: "cond", suspNote: "懸濁可能だが安定性に注意。遮光容器使用推奨。調製後速やかに投与。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "chf_new001",
    generic: "サクビトリル バルサルタンナトリウム水和物",
    brand: "エンレスト",
    category: "ARNi",
    form: "錠",
    features: ["crush"],
    crush: "cond", crushNote: "粉砕可能だが均一分散を確認する。ACE阻害薬と併用禁忌（血管浮腫リスク）。",
    susp: "ok", suspNote: "水に崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
  {
    id: "ifk001",
    generic: "イバブラジン塩酸塩",
    brand: "コララン",
    category: "慢性心不全治療薬",
    form: "錠",
    features: ["crush"],
    crush: "ok", crushNote: "粉砕可能。",
    susp: "ok", suspNote: "崩壊・懸濁可能。",
    source: "IF・メーカー確認",
    verified: "confirmed",
    highAlert: false,
  },
];

// ── main ─────────────────────────────────────────────────────────
const { DRUG_MASTER } = require(MASTER_PATH);

// IDの重複チェック
const existingIds = new Set(DRUG_MASTER.map(d => d.id));
const toAdd = NEW_DRUGS.filter(d => {
  if (existingIds.has(d.id)) {
    console.log(`SKIP (already exists): ${d.id} ${d.generic}`);
    return false;
  }
  return true;
});

console.log(`追加予定: ${toAdd.length}剤`);

const merged = [...DRUG_MASTER, ...toAdd];

// シリアライズ
function serializeEntry(e) {
  const lines = ['  {'];
  lines.push(`    id: ${JSON.stringify(e.id)},`);
  lines.push(`    generic: ${JSON.stringify(e.generic)},`);
  lines.push(`    brand: ${JSON.stringify(e.brand)},`);
  lines.push(`    category: ${JSON.stringify(e.category)},`);
  lines.push(`    form: ${JSON.stringify(e.form)},`);
  lines.push(`    features: ${JSON.stringify(e.features)},`);

  if (e.features.includes('crush')) {
    lines.push(`    crush: ${JSON.stringify(e.crush ?? '')}, crushNote: ${JSON.stringify(e.crushNote ?? '')},`);
    lines.push(`    susp: ${JSON.stringify(e.susp ?? '')}, suspNote: ${JSON.stringify(e.suspNote ?? '')},`);
    lines.push(`    source: ${JSON.stringify(e.source ?? '')},`);
    lines.push(`    verified: ${JSON.stringify(e.verified ?? 'unverified')},`);
    if (e.verifiedNote) lines.push(`    verifiedNote: ${JSON.stringify(e.verifiedNote)},`);
  }

  lines.push(`    highAlert: ${e.highAlert ? 'true' : 'false'},`);

  if (e.hepatic !== undefined)      lines.push(`    hepatic: ${JSON.stringify(e.hepatic)}, hepaticNote: ${JSON.stringify(e.hepaticNote ?? '')},`);
  if (e.ge !== undefined)           lines.push(`    ge: ${e.ge ? 'true' : 'false'}, geNote: ${JSON.stringify(e.geNote ?? '')},`);
  if (e.pmda !== undefined)         lines.push(`    pmda: ${JSON.stringify(e.pmda)},`);

  if (e.features.includes('renal') && e.norm !== undefined) {
    lines.push(`    ja: ${JSON.stringify(e.ja)},`);
    lines.push(`    en: ${JSON.stringify(e.en)},`);
    lines.push(`    cls: ${JSON.stringify(e.cls)},`);
    lines.push(`    norm: ${JSON.stringify(e.norm)},`);
    const adjStr = (e.adj || []).map(a =>
      ` {r:${JSON.stringify(a.r)},lo:${a.lo},hi:${a.hi},d:${JSON.stringify(a.d)},n:${JSON.stringify(a.n)}}`
    ).join(',\n    ');
    lines.push(`    adj:[\n    ${adjStr}\n    ],`);
    if (e.hd)   lines.push(`    hd:{dd:${JSON.stringify(e.hd.dd)},nd:${JSON.stringify(e.hd.nd)},t:${JSON.stringify(e.hd.t)},n:${JSON.stringify(e.hd.n)}},`);
    if (e.capd) lines.push(`    capd:{d:${JSON.stringify(e.capd.d)},n:${JSON.stringify(e.capd.n)}},`);
    if (e.hdf)  lines.push(`    hdf:{d:${JSON.stringify(e.hdf.d)},n:${JSON.stringify(e.hdf.n)}},`);
    if (e.chdf) lines.push(`    chdf:{d:${JSON.stringify(e.chdf.d)},n:${JSON.stringify(e.chdf.n)}},`);
    if (e.pi)   lines.push(`    pi:${JSON.stringify(e.pi)},`);
    if (e.jsnp) lines.push(`    jsnp:${JSON.stringify(e.jsnp)},`);
    if (e.caut) lines.push(`    caut:${JSON.stringify(e.caut)},`);
    lines.push(`    verified: ${JSON.stringify(e.verified ?? 'confirmed')},`);
  }

  lines.push('  },');
  return lines.join('\n');
}

const out = [
  '// shared/drugs-master.js — 統合薬剤DB',
  '// crush・renal 両データを一括収載',
  'const DRUG_MASTER = [',
  '',
  merged.map(serializeEntry).join('\n'),
  '];',
  '',
  '// 後方互換: renal アプリ用エイリアス',
  'const RENAL_DATA = Object.fromEntries(',
  '  DRUG_MASTER.filter(d=>d.features.includes("renal")).map(d=>[d.id,d])',
  ');',
  '',
  'if (typeof module !== "undefined") module.exports = { DRUG_MASTER, RENAL_DATA };',
].join('\n');

fs.writeFileSync(MASTER_PATH, out, 'utf8');
console.log(`✅ drugs-master.js updated: ${merged.length}剤（+${toAdd.length}剤追加）`);
toAdd.forEach(d => console.log(`  + ${d.id}: ${d.generic}（${d.category}）`));
