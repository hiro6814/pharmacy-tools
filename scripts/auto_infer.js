#!/usr/bin/env node
/**
 * auto_infer.js
 * verified: "unverified" の crush 薬剤に製剤学的ルールを適用し
 * ルールと矛盾しない場合は verified: "inferred" に格上げする
 *
 * 実行: node scripts/auto_infer.js [--dry-run]
 */
const fs   = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const MASTER_PATH = path.join(__dirname, '../shared/drugs-master.js');

// ── 製剤学的ルール ────────────────────────────────────────────────
// 戻り値: { crush, susp } の期待値（undefined = 不問）
function inferredRule(d) {
  const form = d.form || '';
  const generic = d.generic || '';
  const cat = d.category || '';

  // ── 徐放製剤 ──────────────────────────────────────────────────
  if (/徐放/.test(form)) {
    return { crush: 'ng', susp: 'ng', reason: '徐放製剤は粉砕・懸濁不可（速放性リスク）' };
  }

  // ── 腸溶製剤 ──────────────────────────────────────────────────
  if (/腸溶/.test(form)) {
    return { crush: 'ng', susp: null, reason: '腸溶製剤は粉砕不可（胃で分解/刺激リスク）' };
  }

  // ── 外用 / 注射 ───────────────────────────────────────────────
  if (/外用/.test(form)) {
    return { crush: 'ng', susp: 'ng', reason: '外用製剤は経管投与不適' };
  }

  // ── 粉末剤（顆粒・散・細粒・ドライシロップ）──────────────────
  if (/顆粒|散$|細粒|ドライシロップ/.test(form)) {
    return { crush: 'ok', reason: '粉末剤は元から粉砕済みに相当' };
  }

  // ── OD錠（口腔内崩壊錠）──────────────────────────────────────
  if (/OD錠/.test(form)) {
    // OD錠は通常 crush: ok / susp: ok だが苦味・安定性で "cond" の場合あり
    return { crush_allowed: ['ok', 'cond'], susp_allowed: ['ok', 'cond'],
             reason: 'OD錠は崩壊性良好のため粉砕・懸濁は通常可〜条件付' };
  }

  // ── カプセル（硬カプセル・ソフトカプセル区別）────────────────
  if (/カプセル/.test(form)) {
    // ソフトカプセルは油性成分内包が多く懸濁が難しいことも
    const isSoft = /ソフト/.test(generic) || /ソフト/.test(form);
    if (isSoft) {
      return { crush: 'ng', reason: 'ソフトカプセルは内容物漏出・安定性の問題で粉砕不適' };
    }
    // 硬カプセル：カプセルを開けて内容物を服用可能が多い
    return { crush_allowed: ['ok', 'cond', 'ng'], reason: 'カプセル剤は個別評価' };
  }

  // ── ビスフォスフォネート系（食道刺激リスク）─────────────────
  if (cat === 'ビスフォスフォネート') {
    return { crush: 'ng', susp: 'ng', reason: 'ビスフォスフォネートは食道刺激リスクで粉砕・懸濁不可' };
  }

  // ── NSAIDs（通常錠）──────────────────────────────────────────
  if ((cat === 'NSAIDs' || cat === 'NSAIDs（COX-2選択的）') && /^錠/.test(form)) {
    // 大半は crush: ok or cond（胃刺激）
    return { crush_allowed: ['ok', 'cond'], reason: 'NSAIDs通常錠は粉砕可〜条件付が多い' };
  }

  // ── PPI（通常は腸溶顆粒含有で懸濁 cond）────────────────────
  if (cat === 'PPI') {
    return { crush: 'ng', reason: 'PPI錠は腸溶顆粒含有のため粉砕不可（製剤の例外あり）' };
  }

  // ── ルール未適用 ─────────────────────────────────────────────
  return null;
}

// ── ルールとデータが矛盾しないか確認 ─────────────────────────────
function isConsistent(d, rule) {
  if (!rule) return false; // ルールなし → 推定不可

  // 厳密一致ルール
  if (rule.crush !== undefined && rule.crush !== null) {
    if (d.crush !== rule.crush) return false;
  }
  if (rule.susp !== undefined && rule.susp !== null) {
    if (d.susp !== rule.susp) return false;
  }

  // 許容値リストルール
  if (rule.crush_allowed && !rule.crush_allowed.includes(d.crush)) return false;
  if (rule.susp_allowed  && !rule.susp_allowed.includes(d.susp))   return false;

  return true;
}

// ── main ─────────────────────────────────────────────────────────
const { DRUG_MASTER } = require(MASTER_PATH);

let upgraded = 0, skipped = 0, noRule = 0;
const log = [];

const updated = DRUG_MASTER.map(d => {
  if (!d.features.includes('crush')) return d;
  if (d.verified !== 'unverified') return d;

  const rule = inferredRule(d);
  if (!rule) { noRule++; return d; }

  if (isConsistent(d, rule)) {
    upgraded++;
    log.push(`  ✅ ${d.generic} (${d.form}) → inferred [${rule.reason}]`);
    return { ...d, verified: 'inferred', verifiedNote: rule.reason };
  } else {
    skipped++;
    log.push(`  ⚠️  ${d.generic} (${d.form}) crush=${d.crush} susp=${d.susp} — ルール矛盾: ${rule.reason}`);
    return d;
  }
});

console.log('── auto_infer.js ─────────────────────────────');
log.forEach(l => console.log(l));
console.log('──────────────────────────────────────────────');
console.log(`upgraded:  ${upgraded}`);
console.log(`skipped:   ${skipped} (ルール矛盾)`);
console.log(`no rule:   ${noRule}`);
console.log(`unchanged: ${DRUG_MASTER.filter(d => d.features.includes('crush') && d.verified !== 'unverified').length}`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] ファイル書き込みをスキップ');
  process.exit(0);
}

// シリアライズ（add_verified_fields.js と同じ関数）
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
  if (e.verifiedDate !== undefined) lines.push(`    verifiedDate: ${JSON.stringify(e.verifiedDate)},`);

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
console.log(`\n✅ drugs-master.js updated (${updated.length} entries)`);
