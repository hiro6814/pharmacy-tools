#!/usr/bin/env python3
"""
substitution-checker用の薬剤マスタ生成スクリプト。

データ出所: 社会保険診療報酬支払基金「医薬品マスター」(Yファイル)
  https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu
  レイアウト説明書: https://shinryohoshu.mhlw.go.jp/shinryohoshu/file/spec/R08rec1.pdf (4) 医薬品マスター

医薬品マスターの列定義(1-indexed, レイアウト説明書より):
  3  医薬品コード(9桁)
  5  漢字名称(品名+規格名)
 28  剤形 (1:内用薬 3:その他 4:注射薬 6:外用薬 8:歯科用薬剤)
 31  廃止年月日 (99999999=現行有効)
 32  薬価基準収載医薬品コード(12桁) — 実データで確認済みの意味付け:
       先頭4桁 = 薬効分類コード
       先頭7桁 = 同一成分(同一剤形内、規格違いを含む)
       先頭9桁 = 同一成分・同一規格(メーカー違いのみ異なる) ※重複排除キーに使用
 34  経過措置年月日 (0=なし)
 35  基本漢字名称(品名のみ、規格を含まない)
 38  一般名処方の標準的な記載 ("【般】"付き。一般名処方マスタ対象外の品目は空欄)

薬価改定の都度(目安: 年1〜2回)、本スクリプトを再実行して zaiyaku-master.js を再生成し、
substitution-checker/ を wrangler deploy し直すこと。
"""
import csv
import io
import json
import re
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

DOWNLOAD_MENU_URL = "https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu"
REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "web" / "substitution-checker" / "zaiyaku-master.js"
EXISTING_MASTER_PATH = REPO_ROOT / "web" / "shared" / "drugs-master.js"

FORM_LABELS = {
    "1": "内服薬",
    "3": "その他",
    "4": "注射薬",
    "6": "外用薬",
    "8": "歯科用薬剤",
}


def fetch_medicine_master_csv() -> tuple[str, bytes]:
    """支払基金の医薬品マスターZIPを取得し、(ファイル名, 生CSVバイト列)を返す。"""
    req = urllib.request.Request(DOWNLOAD_MENU_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
        cookie = resp.headers.get("Set-Cookie", "")

    m = re.search(r'jsessionid=([A-F0-9]+)', html)
    if not m:
        raise RuntimeError("jsessionidが取得できませんでした。ページ構成が変わった可能性があります。")
    jsessionid = m.group(1)

    zip_url = f"{DOWNLOAD_MENU_URL}/yFile;jsessionid={jsessionid}"
    req2 = urllib.request.Request(zip_url, headers={"User-Agent": "Mozilla/5.0", "Cookie": cookie})
    with urllib.request.urlopen(req2) as resp:
        zip_bytes = resp.read()

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        if len(names) != 1:
            raise RuntimeError(f"想定外のZIP構成です: {names}")
        csv_name = names[0]
        raw = zf.read(csv_name)
    return csv_name, raw


def parse_rows(raw_csv_bytes: bytes) -> list[dict]:
    text = raw_csv_bytes.decode("shift_jis", errors="replace")
    reader = csv.reader(io.StringIO(text))
    items = []
    for row in reader:
        if len(row) < 38:
            continue
        if row[27] not in FORM_LABELS:
            continue
        obsolete_date = row[30]
        if obsolete_date != "99999999":
            continue  # 廃止済み品目は除外

        drug_code = row[2]
        name_with_spec = row[4]
        base_name = row[34] or name_with_spec
        spec = name_with_spec[len(base_name):].strip() if name_with_spec.startswith(base_name) else ""
        yj_like_code = row[31]
        generic_raw = row[37].strip()
        generic = re.sub(r'^【般】', '', generic_raw) if generic_raw else ""

        items.append({
            "id": drug_code,
            "name": base_name,
            "spec": spec,
            "form": FORM_LABELS[row[27]],
            "formCode": row[27],
            "code12": yj_like_code,
            "yakkoBunrui": yj_like_code[:4] if len(yj_like_code) >= 4 else "",
            "ingredientKey": yj_like_code[:7] if len(yj_like_code) >= 7 else "",
            "regimenKey": yj_like_code[:9] if len(yj_like_code) >= 9 else "",
            "generic": generic,
            "isGeneric": row[16] == "1",
        })
    return items


def load_existing_master() -> list[dict]:
    """既存368件マスタをnode経由でJSON化して読み込む。"""
    result = subprocess.run(
        ["node", "-e",
         f"const {{DRUG_MASTER}} = require('{EXISTING_MASTER_PATH}'); console.log(JSON.stringify(DRUG_MASTER));"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


FORM_WORDS = [
    "ＯＤ錠", "Ｄ錠", "口腔内崩壊錠", "分散錠", "チュアブル錠", "徐放錠", "徐放カプセル", "カプセル", "錠", "散", "顆粒", "細粒",
    "ドライシロップ", "シロップ用", "シロップ", "注射液", "注射用", "静注液", "静注用", "静注", "筋注用", "点滴静注用", "点滴静注",
    "注", "軟膏", "クリーム", "ローション", "外用液", "貼付剤", "テープ", "パップ剤", "坐剤", "坐薬", "点眼液", "点鼻液", "点耳液",
    "吸入液", "吸入用", "エアゾール", "ゼリー", "ドライパウダー", "液",
]
_UNIT_TAIL_RE = re.compile(r'[0-9０-９．.]+\s*(mg|ｍｇ|g|ｇ|mL|ｍＬ|%|％|μg|μＧ|mcg|単位|万単位|億単位)?$')


def normalize_generic(name: str) -> str:
    """成分名から括弧注記・剤形・規格(数字+単位)を除去し、base ingredient名に正規化する。"""
    name = re.sub(r'[（(].*?[）)]', '', name)
    name = re.sub(r'[「『][^」』]*[」』]', '', name).strip()
    changed = True
    while changed:
        changed = False
        for w in FORM_WORDS:
            if name.endswith(w):
                name = name[: -len(w)].strip()
                changed = True
        m = _UNIT_TAIL_RE.search(name)
        if m and m.start() > 0:
            name = name[: m.start()].strip()
            changed = True
    return re.sub(r'\s+', '', name)


def annotate_confidence(items: list[dict], existing: list[dict]) -> tuple[int, int]:
    """既存368件マスタのcategoryと成分名一致するものに確信度「高」を付与。一致件数/不一致件数を返す。"""
    existing_by_generic = {}
    for d in existing:
        key = normalize_generic(d["generic"])
        existing_by_generic.setdefault(key, []).append(d)

    matched = 0
    unmatched = 0
    for item in items:
        key = normalize_generic(item["generic"]) if item["generic"] else normalize_generic(item["name"])
        hits = existing_by_generic.get(key)
        if hits:
            matched += 1
            item["confidence"] = "high"
            item["existingCategory"] = hits[0]["category"]
        else:
            unmatched += 1
            item["confidence"] = "reference"
            item["existingCategory"] = None
    return matched, unmatched


def write_output(items: list[dict], source_name: str) -> None:
    from datetime import date
    generated_at = date.today().isoformat()
    js = (
        f"// substitution-checker/zaiyaku-master.js — 自動生成ファイル\n"
        f"// 出所: 社会保険診療報酬支払基金 医薬品マスター ({source_name})\n"
        f"// 取得元: https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu (Yファイル)\n"
        f"// 生成日: {generated_at}\n"
        f"// 再生成方法: python3 scripts/build_zaiyaku_master.py\n"
        f"// 次回更新目安: 次期薬価改定時(年1〜2回)\n"
        f"const ZAIYAKU_MASTER_GENERATED_AT = \"{generated_at}\";\n"
        f"const ZAIYAKU_MASTER_SOURCE = \"{source_name}\";\n"
        f"const ZAIYAKU_MASTER = {json.dumps(items, ensure_ascii=False, separators=(',', ':'))};\n"
        f"if (typeof module !== \"undefined\") module.exports = {{ ZAIYAKU_MASTER, ZAIYAKU_MASTER_GENERATED_AT, ZAIYAKU_MASTER_SOURCE }};\n"
    )
    OUT_PATH.write_text(js, encoding="utf-8")


def main():
    print("医薬品マスターを取得中...", file=sys.stderr)
    source_name, raw = fetch_medicine_master_csv()
    print(f"取得完了: {source_name} ({len(raw)} bytes)", file=sys.stderr)

    items = parse_rows(raw)
    print(f"パース完了: {len(items)} 件 (廃止品目・対象外区分を除外後)", file=sys.stderr)

    existing = load_existing_master()
    matched, unmatched = annotate_confidence(items, existing)
    print(f"既存368件マスタとの突合: 一致 {matched} 件 / 不一致(参考扱い) {unmatched} 件", file=sys.stderr)

    write_output(items, source_name)
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"出力完了: {OUT_PATH} ({size_kb:.0f} KB)", file=sys.stderr)


if __name__ == "__main__":
    main()
