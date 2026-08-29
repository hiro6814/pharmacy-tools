// ============================================================
// drug-search.js — 薬品検索・オートコンプリートの共有モジュール
// crushing-checker / renal / substitution-checker / compatibility-checker
// の4アプリで使う。ビルドなし構成のためグローバル関数として提供する。
//
// candidate = {
//   id, label, sublabel?, meta?,
//   searchText?,   // string | string[]。省略時は label+sublabel から生成。
//                  // 検索のたびに正規化されるので生文字列でよい。
//   _nsearch?,     // 事前に drugSearchNormalize 済みの文字列（大規模データ対策）。
//                  // 存在すればこれをそのまま使い、毎キー入力での再正規化を避ける。
// }
//
// createDrugSearch オプション対応表（このコメントが正）：
//   input, dropdown       : 必須。id文字列 or DOM要素
//   getCandidates()       : 必須。candidate[] を返す関数。呼び出しのたびに評価する
//                            （crushing-checkerのように実行時に増減するデータに対応するため、
//                            アプリ側が独自にキャッシュしたい場合はgetCandidates内で行う）
//   onSelect(candidate)   : 必須。候補選択時に呼ばれる
//   minChars = 1          : 空文字は常に非表示。非空クエリはこの文字数から発火
//   maxResults = 12
//   debounceMs = 0        : substitution-checkerのみ120程度（18,501件の全走査対策）
//   closeOnOutsideClick = true
//   renderItem(candidate, rawQuery) : 省略時デフォルト描画。data-index付与必須、
//                            onclick属性への文字列連結は禁止（XSS温床を作らないため）
//   emptyMessage           : string | (rawQuery) => string
//   mutateInputToKatakana = false : substitution-checkerのみtrue。IME変換中は書き換え・検索とも一時停止
//   onShow(dropdownEl), onHide(dropdownEl) : 省略時 style.display のみ。
//                            アプリのCSS方式（.hidden!important / .open 等）に合わせて渡す
// ============================================================

function drugSearchNormalize(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[ａ-ｚＡ-Ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

function drugSearchEscapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 正規化で文字列長が変わるケース（空白除去等）はインデックスがズレるため、
// 長さが変わらない場合のみハイライトし、それ以外はプレーン表示にフォールバックする。
function drugSearchHighlight(text, rawQuery) {
  if (!text) return '';
  if (!rawQuery) return drugSearchEscapeHtml(text);
  const nt = drugSearchNormalize(text);
  const nq = drugSearchNormalize(rawQuery);
  if (!nq || nt.length !== String(text).length) return drugSearchEscapeHtml(text);
  const i = nt.indexOf(nq);
  if (i === -1) return drugSearchEscapeHtml(text);
  return drugSearchEscapeHtml(text.slice(0, i)) +
    '<mark style="background:#e0e7ff;color:#3730a3;border-radius:2px;padding:0 1px">' +
    drugSearchEscapeHtml(text.slice(i, i + nq.length)) +
    '</mark>' + drugSearchEscapeHtml(text.slice(i + nq.length));
}

function drugSearchCandidateHaystack(c) {
  if (c._nsearch !== undefined) return c._nsearch;
  if (c.searchText != null) {
    return drugSearchNormalize(Array.isArray(c.searchText) ? c.searchText.join(' ') : c.searchText);
  }
  return drugSearchNormalize([c.label, c.sublabel].filter(Boolean).join(' '));
}

function drugSearchFilter(candidates, rawQuery, opts) {
  opts = opts || {};
  const maxResults = opts.maxResults || 12;
  const nq = drugSearchNormalize(rawQuery);
  if (!nq) return [];
  const out = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (drugSearchCandidateHaystack(c).indexOf(nq) !== -1) {
      out.push(c);
      if (out.length >= maxResults) break;
    }
  }
  return out;
}

function createDrugSearch(opts) {
  const input = typeof opts.input === 'string' ? document.querySelector(opts.input) : opts.input;
  const dropdown = typeof opts.dropdown === 'string' ? document.querySelector(opts.dropdown) : opts.dropdown;
  const getCandidates = opts.getCandidates;
  const onSelect = opts.onSelect;
  const minChars = opts.minChars != null ? opts.minChars : 1;
  const maxResults = opts.maxResults || 12;
  const debounceMs = opts.debounceMs || 0;
  const closeOnOutsideClick = opts.closeOnOutsideClick !== false;
  const renderItem = opts.renderItem || defaultRenderItem;
  const emptyMessage = opts.emptyMessage;
  const mutateInputToKatakana = !!opts.mutateInputToKatakana;
  const onShow = opts.onShow || function (dd) { dd.style.display = 'block'; };
  const onHide = opts.onHide || function (dd) { dd.style.display = 'none'; };

  let composing = false;
  let focusIdx = -1;
  let currentHits = [];
  let debounceTimer = null;
  let isOpen = false;

  function defaultRenderItem(c, q) {
    const sub = c.sublabel ? `<div class="dd-sub">${drugSearchHighlight(c.sublabel, q)}</div>` : '';
    return `<div class="dd-item" data-index="${c._idx}">
      <div class="dd-main">${drugSearchHighlight(c.label, q)}</div>${sub}
    </div>`;
  }

  function show() { isOpen = true; onShow(dropdown); }
  function hide() { isOpen = false; focusIdx = -1; onHide(dropdown); }

  function updateFocusClasses() {
    const items = dropdown.querySelectorAll('[data-index]');
    items.forEach(el => el.classList.remove('focused'));
    if (focusIdx >= 0 && items[focusIdx]) items[focusIdx].classList.add('focused');
  }

  function render(hits, rawQuery) {
    currentHits = hits;
    focusIdx = -1;
    if (!hits.length) {
      dropdown.innerHTML = emptyMessage
        ? (typeof emptyMessage === 'function' ? emptyMessage(rawQuery) : emptyMessage)
        : `<div class="no-result">「${drugSearchEscapeHtml(rawQuery)}」は見つかりません。</div>`;
    } else {
      dropdown.innerHTML = hits.map((c, i) => { c._idx = i; return renderItem(c, rawQuery); }).join('');
    }
    show();
  }

  function runSearch() {
    const q = input.value.trim();
    if (!q || q.length < minChars) { hide(); return; }
    const hits = drugSearchFilter(getCandidates(), q, { maxResults });
    render(hits, q);
  }

  function scheduleSearch() {
    if (composing) return;
    if (!debounceMs) { runSearch(); return; }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, debounceMs);
  }

  function pick(idx) {
    const c = currentHits[idx];
    if (!c) return;
    hide();
    onSelect(c);
  }

  function onInput() {
    if (mutateInputToKatakana && !composing) {
      const before = input.value;
      const after = before.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
      if (after !== before) {
        const pos = input.selectionStart;
        input.value = after;
        try { input.setSelectionRange(pos, pos); } catch (e) {}
      }
    }
    scheduleSearch();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { hide(); return; }
    if (!isOpen || !currentHits.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, currentHits.length - 1);
      updateFocusClasses();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, 0);
      updateFocusClasses();
    } else if (e.key === 'Enter') {
      if (focusIdx === -1) return; // 未選択時のEnterは何もしない（renalの既存仕様を踏襲）
      e.preventDefault();
      pick(focusIdx);
    }
  }

  function onCompositionStart() { composing = true; }
  function onCompositionEnd() { composing = false; onInput(); }

  function onMousedown(e) {
    const item = e.target.closest('[data-index]');
    if (!item) return;
    e.preventDefault(); // 入力欄のフォーカスを奪わない
    pick(Number(item.dataset.index));
  }

  function onDocClick(e) {
    if (!closeOnOutsideClick || !isOpen) return;
    if (input.contains(e.target) || dropdown.contains(e.target)) return;
    hide();
  }

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKeydown);
  input.addEventListener('compositionstart', onCompositionStart);
  input.addEventListener('compositionend', onCompositionEnd);
  dropdown.addEventListener('mousedown', onMousedown);
  document.addEventListener('click', onDocClick);

  return {
    close: hide,
    refresh: runSearch,
    destroy() {
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKeydown);
      input.removeEventListener('compositionstart', onCompositionStart);
      input.removeEventListener('compositionend', onCompositionEnd);
      dropdown.removeEventListener('mousedown', onMousedown);
      document.removeEventListener('click', onDocClick);
    },
  };
}
