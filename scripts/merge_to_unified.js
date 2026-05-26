#!/usr/bin/env node
/**
 * crush-data.js と renal-data.js のデータを drugs-master.js に統合する
 * 実行: node scripts/merge_to_unified.js
 */
const path = require('path');
const fs   = require('fs');

const root = path.join(__dirname, '..');
const { DRUG_MASTER } = require(path.join(root, 'shared/drugs-master.js'));
const { CRUSH_DATA }  = require(path.join(root, 'crushing-checker/crush-data.js'));
const { RENAL_DRUGS } = require(path.join(root, 'renal/renal-data.js'));

// renal データを id → entry でインデックス
const renalMap = Object.fromEntries(RENAL_DRUGS.map(d => [d.id, d]));

// crush エントリをマージ
const crushEntries = DRUG_MASTER
  .filter(d => d.features.includes('crush'))
  .map(entry => {
    const e = { ...entry };
    if (CRUSH_DATA[e.id]) {
      const c = CRUSH_DATA[e.id];
      e.crush     = c.crush;
      e.crushNote = c.crushNote;
      e.susp      = c.susp;
      e.suspNote  = c.suspNote;
      e.source    = c.source;
    }
    return e;
  });

// renal エントリ: RENAL_DRUGS を正規ソースとして全件使用
// （drugs-master.js に未登録だった薬剤も包含）
const masterRenalMap = Object.fromEntries(
  DRUG_MASTER.filter(d => d.features.includes('renal')).map(d => [d.id, d])
);
const renalEntries = RENAL_DRUGS.map(r => {
  const base = masterRenalMap[r.id] || {
    id:       r.id,
    generic:  r.ja[0],
    brand:    r.ja.slice(1).join(' / '),
    category: r.cls,
    form:     '注射',
    features: ['renal'],
  };
  return {
    ...base,
    ja:   r.ja,
    en:   r.en,
    cls:  r.cls,
    norm: r.norm,
    adj:  r.adj,
    hd:   r.hd,
    capd: r.capd,
    hdf:  r.hdf,
    chdf: r.chdf,
    pi:   r.pi,
    jsnp: r.jsnp,
    caut: r.caut,
  };
});

const merged = [...crushEntries, ...renalEntries];

// 統計
const crushCount = merged.filter(d => d.features.includes('crush')).length;
const renalCount = merged.filter(d => d.features.includes('renal')).length;
const crushMissing = merged.filter(d => d.features.includes('crush') && !d.crush).length;
const renalMissing = merged.filter(d => d.features.includes('renal') && !d.norm).length;
console.log(`Total: ${merged.length} drugs`);
console.log(`Crush: ${crushCount} (missing data: ${crushMissing})`);
console.log(`Renal: ${renalCount} (missing data: ${renalMissing})`);

// JS出力用シリアライザ
function serializeValue(v, indent) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    // adj配列など複雑な配列は複数行
    if (typeof v[0] === 'object') {
      const inner = v.map(item => `\n${indent}  ` + serializeValue(item, indent + '  ')).join(',');
      return `[${inner}\n${indent}]`;
    }
    return '[' + v.map(x => serializeValue(x, indent)).join(', ') + ']';
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 0) return '{}';
    const pairs = keys.map(k => `${k}:${serializeValue(v[k], indent + '  ')}`);
    return '{' + pairs.join(', ') + '}';
  }
  return String(v);
}

function entryToJS(e) {
  const lines = ['  {'];
  // 基本フィールド
  lines.push(`    id: ${JSON.stringify(e.id)},`);
  lines.push(`    generic: ${JSON.stringify(e.generic)},`);
  lines.push(`    brand: ${JSON.stringify(e.brand)},`);
  lines.push(`    category: ${JSON.stringify(e.category)},`);
  lines.push(`    form: ${JSON.stringify(e.form)},`);
  lines.push(`    features: ${JSON.stringify(e.features)},`);

  // crush データ
  if (e.features.includes('crush') && e.crush !== undefined) {
    lines.push(`    crush: ${JSON.stringify(e.crush)}, crushNote: ${JSON.stringify(e.crushNote || '')},`);
    lines.push(`    susp: ${JSON.stringify(e.susp)}, suspNote: ${JSON.stringify(e.suspNote || '')},`);
    lines.push(`    source: ${JSON.stringify(e.source || '')},`);
  }

  // renal データ
  if (e.features.includes('renal') && e.norm !== undefined) {
    lines.push(`    ja: ${JSON.stringify(e.ja)},`);
    lines.push(`    en: ${JSON.stringify(e.en)},`);
    lines.push(`    cls: ${JSON.stringify(e.cls)},`);
    lines.push(`    norm: ${JSON.stringify(e.norm)},`);
    // adj は複数行
    const adjStr = e.adj.map(a =>
      ` {r:${JSON.stringify(a.r)},lo:${a.lo},hi:${a.hi},d:${JSON.stringify(a.d)},n:${JSON.stringify(a.n)}}`
    ).join(',\n    ');
    lines.push(`    adj:[\n    ${adjStr}\n    ],`);
    // hd/capd/hdf/chdf
    const hd = e.hd;
    lines.push(`    hd:{dd:${JSON.stringify(hd.dd)},nd:${JSON.stringify(hd.nd)},t:${JSON.stringify(hd.t)},n:${JSON.stringify(hd.n)}},`);
    lines.push(`    capd:{d:${JSON.stringify(e.capd.d)},n:${JSON.stringify(e.capd.n)}},`);
    lines.push(`    hdf:{d:${JSON.stringify(e.hdf.d)},n:${JSON.stringify(e.hdf.n)}},`);
    lines.push(`    chdf:{d:${JSON.stringify(e.chdf.d)},n:${JSON.stringify(e.chdf.n)}},`);
    lines.push(`    pi:${JSON.stringify(e.pi)},`);
    if (e.jsnp) lines.push(`    jsnp:${JSON.stringify(e.jsnp)},`);
    lines.push(`    caut:${JSON.stringify(e.caut)},`);
  }

  lines.push('  },');
  return lines.join('\n');
}

const out = [
  '// shared/drugs-master.js — 統合薬剤DB',
  '// crush・renal 両データを一括収載',
  'const DRUG_MASTER = [',
  '',
  merged.map(entryToJS).join('\n'),
  '];',
  '',
  '// 後方互換: renal アプリ用エイリアス',
  'const RENAL_DATA = Object.fromEntries(',
  '  DRUG_MASTER.filter(d=>d.features.includes("renal")).map(d=>[d.id,d])',
  ');',
  '',
  'if (typeof module !== "undefined") module.exports = { DRUG_MASTER, RENAL_DATA };',
].join('\n');

const outPath = path.join(root, 'shared/drugs-master.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`\nWritten: ${outPath}`);
console.log('Line count:', out.split('\n').length);
