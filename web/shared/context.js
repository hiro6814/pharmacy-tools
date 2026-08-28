// web/shared/context.js — アプリ間の「作業コンテキスト」共有ヘルパー
//
// 患者の氏名・生年月日等の個人情報は一切扱わない。保存するのは
// 「選択中の薬剤名」「CCr値」等、直前の画面での作業内容のみ。
// sessionStorageを使うため、タブを閉じれば自動的に消える
// （複数患者を連続して扱う実務での取り違え防止のため、TTLも設ける）。
//
// 読み書き対応表:
//   crushing-checker       書く: selectedDrug          読む: selectedDrug
//   renal                  書く: selectedDrug, ccr      読む: selectedDrug, ccr
//   compatibility-checker  書く: selectedDrug          読む: selectedDrug
//   substitution-checker   書く: selectedDrug          読む: selectedDrug
// 全アプリに強制はしない。各アプリは自分が使うフィールドだけを読み書きする。

const PHARMACY_CONTEXT_KEY = 'pharmacy-tools:context';
const PHARMACY_CONTEXT_TTL_MS = 15 * 60 * 1000; // 15分

function pharmacyContextSet(patch) {
  try {
    const current = pharmacyContextGet() || {};
    const next = Object.assign({}, current, patch, {
      version: 1,
      timestamp: Date.now(),
    });
    sessionStorage.setItem(PHARMACY_CONTEXT_KEY, JSON.stringify(next));
  } catch (e) {}
}

function pharmacyContextGet() {
  try {
    const raw = sessionStorage.getItem(PHARMACY_CONTEXT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.timestamp) return null;
    if (Date.now() - data.timestamp > PHARMACY_CONTEXT_TTL_MS) {
      sessionStorage.removeItem(PHARMACY_CONTEXT_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function pharmacyContextClear() {
  try { sessionStorage.removeItem(PHARMACY_CONTEXT_KEY); } catch (e) {}
}

// sessionStorageから読んだ薬剤名は、実在する薬剤マスタと照合してからのみ使う
// （自由文字列を直接検索欄にセットしない）。マスタ配列と検索対象フィールド名を渡す。
function pharmacyContextResolveDrug(drugName, masterArray, fieldNames) {
  if (!drugName || !Array.isArray(masterArray)) return null;
  const fields = fieldNames || ['generic', 'brand', 'ja', 'en', 'drugA'];
  for (const entry of masterArray) {
    for (const f of fields) {
      if (entry[f] && String(entry[f]) === drugName) return entry;
    }
  }
  return null;
}

// 「前の画面から引き継ぎました」バナーを表示する。
// containerEl の先頭に挿入し、閉じるボタンでコンテキストをクリアする。
function pharmacyContextShowBanner(containerEl, message, onClear) {
  if (!containerEl) return;
  const banner = document.createElement('div');
  banner.style.cssText =
    'background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca;' +
    'font-size:12px;border-radius:10px;padding:8px 12px;margin-bottom:10px;' +
    'display:flex;align-items:center;justify-content:space-between;gap:8px;';
  const text = document.createElement('span');
  text.textContent = message;
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '×';
  clearBtn.title = '引き継ぎを取り消す';
  clearBtn.style.cssText =
    'background:none;border:none;color:#4338ca;cursor:pointer;font-size:14px;' +
    'line-height:1;padding:2px 6px;';
  clearBtn.addEventListener('click', function () {
    pharmacyContextClear();
    banner.remove();
    if (typeof onClear === 'function') onClear();
  });
  banner.appendChild(text);
  banner.appendChild(clearBtn);
  containerEl.insertBefore(banner, containerEl.firstChild);
}
