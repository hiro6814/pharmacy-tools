#!/usr/bin/env node
/**
 * add_verified_fields.js
 * drugs-master.js に verified / highAlert フィールドを一括追加する移行スクリプト
 * 実行: node scripts/add_verified_fields.js
 */
const fs   = require('fs');
const path = require('path');

const MASTER_PATH = path.join(__dirname, '../shared/drugs-master.js');

// ── highAlert 判定ルール ────────────────────────────────────────
const HIGH_ALERT_CATEGORIES = new Set([
  '強心配糖体',
  '強オピオイド鎮痛薬',
  '弱オピオイド鎮痛薬',
  '免疫抑制薬',
]);

const HIGH_ALERT_GENERICS = [
  // 抗凝固薬
  'ワルファリン',
  // SU薬（低血糖リスク）
  'グリメピリド', 'グリクラジド', 'グリベンクラミド', 'アセトヘキサミド',
  // 狭域治療域
  'テオフィリン', 'アミノフィリン',
  // 免疫抑制薬
  'タクロリムス', 'シクロスポリン', 'ミコフェノール酸モフェチル', 'アザチオプリン',
  'メトトレキサート',
  // リチウム
  '炭酸リチウム',
  // 抗がん剤（後でPhase 2で追加予定）
  'カペシタビン', 'テガフール', 'メルカプトプリン', 'ヒドロキシウレア',
  'チオグアニン', 'エトポシド',
];

function isHighAlert(d) {
  if (HIGH_ALERT_CATEGORIES.has(d.category)) return true;
  return HIGH_ALERT_GENERICS.some(g => d.generic.includes(g));
}

// ── verified 判定 ────────────────────────────────────────────────
function getVerified(d) {
  if (!d.features.includes('crush')) return undefined; // renal は別途
  const src = d.source || '';
  if (src.includes('要確認')) return 'unverified';
  return 'confirmed';
}

// ── main ─────────────────────────────────────────────────────────
const raw = fs.readFileSync(MASTER_PATH, 'utf8');
const { DRUG_MASTER } = require(MASTER_PATH);

let stats = { confirmed: 0, unverified: 0, highAlert: 0, renal: 0 };

// JS ソースを行ごとに処理し、各エントリに新フィールドを注入
// アプローチ: DRUG_MASTER を変換して再シリアライズ
function serializeEntry(e) {
  const lines = ['  {'];
  lines.push(`    id: ${JSON.stringify(e.id)},`);
  lines.push(`    generic: ${JSON.stringify(e.generic)},`);
  lines.push(`    brand: ${JSON.stringify(e.brand)},`);
  lines.push(`    category: ${JSON.stringify(e.category)},`);
  lines.push(`    form: ${JSON.stringify(e.form)},`);
  lines.push(`    features: ${JSON.stringify(e.features)},`);

  // ── crush データ ──
  if (e.features.includes('crush')) {
    lines.push(`    crush: ${JSON.stringify(e.crush ?? '')}, crushNote: ${JSON.stringify(e.crushNote ?? '')},`);
    lines.push(`    susp: ${JSON.stringify(e.susp ?? '')}, suspNote: ${JSON.stringify(e.suspNote ?? '')},`);
    lines.push(`    source: ${JSON.stringify(e.source ?? '')},`);
    lines.push(`    verified: ${JSON.stringify(e.verified ?? 'unverified')},`);
  }

  // ── highAlert (crush/renal 両方) ──
  lines.push(`    highAlert: ${e.highAlert ? 'true' : 'false'},`);

  // ── 新フィールド（空でも明示的に記載）──
  if (e.features.includes('crush')) {
    if (e.hepatic !== undefined)      lines.push(`    hepatic: ${JSON.stringify(e.hepatic)}, hepaticNote: ${JSON.stringify(e.hepaticNote ?? '')},`);
    if (e.ge !== undefined)           lines.push(`    ge: ${e.ge ? 'true' : 'false'}, geNote: ${JSON.stringify(e.geNote ?? '')},`);
    if (e.pmda !== undefined)         lines.push(`    pmda: ${JSON.stringify(e.pmda)},`);
    if (e.verifiedDate !== undefined) lines.push(`    verifiedDate: ${JSON.stringify(e.verifiedDate)},`);
  }

  // ── renal データ ──
  if (e.features.includes('renal') && e.norm !== undefined) {
    lines.push(`    ja: ${JSON.stringify(e.ja)},`);
    lines.push(`    en: ${JSON.stringify(e.en)},`);
    lines.push(`    cls: ${JSON.stringify(e.cls)},`);
    lines.push(`    norm: ${JSON.stringify(e.norm)},`);
    const adjStr = (e.adj || []).map(a =>
      ` {r:${JSON.stringify(a.r)},lo:${a.lo},hi:${a.hi},d:${JSON.stringify(a.d)},n:${JSON.stringify(a.n)}}`
    ).join(',\n    ');
    lines.push(`    adj:[\n    ${adjStr}\n    ],`);
    const hd = e.hd;
    if (hd) lines.push(`    hd:{dd:${JSON.stringify(hd.dd)},nd:${JSON.stringify(hd.nd)},t:${JSON.stringify(hd.t)},n:${JSON.stringify(hd.n)}},`);
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

// フィールドを付与
const updated = DRUG_MASTER.map(d => {
  const entry = { ...d };

  // verified
  if (d.features.includes('crush')) {
    const src = d.source || '';
    if (!d.verified) {
      entry.verified = src.includes('要確認') ? 'unverified' : 'confirmed';
    }
    if (entry.verified === 'confirmed') stats.confirmed++;
    else stats.unverified++;
  } else {
    stats.renal++;
    if (!d.verified) entry.verified = 'confirmed';
  }

  // highAlert
  if (d.highAlert === undefined) {
    entry.highAlert = isHighAlert(d);
  }
  if (entry.highAlert) stats.highAlert++;

  return entry;
});

// 出力
const out = [
  '// shared/drugs-master.js — 統合薬剤DB',
  '// crush・renal 両データを一括収載',
  'const DRUG_MASTER = [',
  '',
  updated.map(serializeEntry).join('\n'),
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
console.log('✅ drugs-master.js updated');
console.log(`   confirmed: ${stats.confirmed}`);
console.log(`   unverified: ${stats.unverified}`);
console.log(`   highAlert: ${stats.highAlert}`);
console.log(`   renal: ${stats.renal}`);
