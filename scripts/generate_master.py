#!/usr/bin/env python3
"""
crushing-checker と renal-pwa の薬剤DBから
shared/drugs-master.js, crush-data.js, renal-data.js を生成するスクリプト
"""
import re, json, os

# ── カテゴリ → 短縮コードのマッピング ──
CAT_CODE = {
    "Ca拮抗薬":                         "ca",
    "Ca拮抗薬（非DHP系）":              "cand",
    "ARB":                              "arb",
    "ACE阻害薬":                        "ace",
    "β遮断薬":                          "bb",
    "利尿薬":                           "diu",
    "利尿薬（ループ）":                 "diul",
    "利尿薬（チアジド類似）":           "diuts",
    "利尿薬（チアジド）":               "diutz",
    "MRA（利尿薬）":                    "mra",
    "バソプレシンV2受容体拮抗薬":       "avp",
    "抗血小板薬":                       "aplt",
    "抗凝固薬":                         "ac",
    "抗凝固薬（DOAC）":                 "doac",
    "スタチン":                         "stat",
    "コレステロール吸収阻害薬":         "cai",
    "コレステロール低下薬（陰イオン交換樹脂）": "bile_seq",
    "強心配糖体":                       "digi",
    "抗不整脈薬":                       "arr",
    "狭心症治療薬":                     "angn",
    "慢性心不全治療薬":                 "chf",
    "ARNi":                             "arni",
    "PPI":                              "ppi",
    "P-CAB":                            "pcab",
    "H2ブロッカー":                     "h2b",
    "消化管運動促進薬":                 "prok",
    "胃粘膜保護薬":                     "gmp",
    "胃粘膜保護薬（亜鉛含有）":        "gmpz",
    "止瀉薬":                           "antid",
    "緩下薬":                           "lax",
    "緩下薬/制酸薬":                    "laxac",
    "便秘治療薬（PAMORA）":             "pamr",
    "便秘型IBS治療薬":                  "ibs",
    "ビグアナイド薬":                   "bgu",
    "SU薬":                             "su",
    "DPP-4阻害薬":                      "dpp4",
    "SGLT2阻害薬":                      "sglt2",
    "チアゾリジン薬":                   "tzd",
    "α-GI薬":                           "agi",
    "甲状腺ホルモン薬":                 "thyr",
    "抗甲状腺薬":                       "atg",
    "リン吸着薬":                       "pba",
    "リン吸着薬/Ca補給":               "pbca",
    "活性型ビタミンD3":                 "vitd",
    "ビスフォスフォネート":             "bpn",
    "解熱鎮痛薬":                       "apn",
    "NSAIDs":                           "nsaid",
    "NSAIDs（COX-2選択的）":            "cox2",
    "弱オピオイド鎮痛薬":              "wopi",
    "強オピオイド鎮痛薬":              "sopi",
    "α1遮断薬":                         "a1b",
    "5α還元酵素阻害薬":                 "a5r",
    "抗コリン薬（過活動膀胱）":        "oabac",
    "β3受容体作動薬（過活動膀胱）":    "b3ag",
    "抗コリン薬（消化器）":            "giac",
    "プロスタグランジンE1誘導体":       "pge1",
    "パーキンソン病治療薬":             "pd",
    "パーキンソン病治療薬（COMT阻害薬）": "pdcomt",
    "パーキンソン病治療薬（抗コリン薬）": "pdac",
    "パーキンソン病治療薬（ノルエピネフリン前駆体）": "pdne",
    "認知症治療薬":                     "dem",
    "神経障害性疼痛治療薬":             "nrp",
    "定型抗精神病薬":                   "tap",
    "非定型抗精神病薬":                 "aap",
    "SSRI":                             "ssri",
    "SNRI":                             "snri",
    "NaSSA":                            "nassa",
    "三環系抗うつ薬":                   "tca",
    "セロトニンモジュレーター":         "smod",
    "セロトニン1A受容体作動薬":         "5ht1a",
    "ベンゾジアゼピン系":               "bz",
    "ベンゾジアゼピン系睡眠薬":        "bzs",
    "非ベンゾジアゼピン系":             "nbz",
    "非ベンゾジアゼピン系睡眠薬":      "nbzs",
    "チエノジアゼピン系":               "tbz",
    "バルビツール酸系":                 "barb",
    "オレキシン受容体拮抗薬":          "orx",
    "メラトニン受容体作動薬":          "mlt",
    "抗てんかん薬":                     "aed",
    "ペニシリン系":                     "pcn",
    "ペニシリン系配合剤":              "pcnc",
    "セフェム系":                       "ceph",
    "セフェム系（第2世代）":           "ceph2",
    "セフェム系（第3世代）":           "ceph3",
    "ペネム系":                         "pnm",
    "マクロライド系":                   "mac",
    "ニューキノロン系":                 "fq",
    "テトラサイクリン系":              "tet",
    "ニトロイミダゾール系":            "nitr",
    "リンコマイシン系":                "linc",
    "トリアゾール系抗真菌薬":          "azl",
    "サルファ剤配合":                   "sulfa",
    "抗結核薬":                         "tb",
    "去痰薬":                           "exp",
    "キサンチン系気管支拡張薬":        "xan",
    "ロイコトリエン受容体拮抗薬":      "ltra",
    "抗ヒスタミン薬（第1世代）":       "ah1",
    "抗ヒスタミン薬（第2世代）":       "ah2",
    "キサンチンオキシダーゼ阻害薬":   "xoi",
    "痛風発作治療薬":                   "gout",
    "副腎皮質ステロイド":              "cs",
    "副腎皮質ステロイド（外用）":      "csext",
    "免疫抑制薬":                       "imm",
    "炎症性腸疾患治療薬":              "ibd",
    "炭酸脱水酵素阻害薬":             "carz",
    "めまい治療薬":                     "vert",
    "筋弛緩薬（中枢性）":              "mrel",
    "胆汁酸製剤":                       "bile",
    "蛋白分解酵素阻害薬":              "pi",
}

def extract_crush_db(html_path):
    """crushing-checker の drugDB を抽出"""
    with open(html_path, encoding='utf-8') as f:
        content = f.read()
    # drugDB の開始〜終了を抽出
    m = re.search(r'let drugDB\s*=\s*\[(.*?)\];\s*(?://|function|const|let|var|\n\n)', content, re.DOTALL)
    if not m:
        raise ValueError("drugDB not found")
    raw = '[' + m.group(1) + ']'
    # JS → JSON変換（簡易）
    raw = re.sub(r'//[^\n]*', '', raw)             # コメント除去
    raw = re.sub(r',\s*\]', ']', raw)              # trailing comma
    raw = re.sub(r',\s*\}', '}', raw)              # trailing comma in obj
    raw = re.sub(r'(\w+):', r'"\1":', raw)          # key クォート
    raw = re.sub(r'"\s*"(\w+)":', r'" "\1":', raw)  # 二重変換修正
    # キーが既にクォートされている場合の修正
    raw = re.sub(r'"(\w+)":', r'"\1":', raw)
    try:
        return json.loads(raw)
    except Exception as e:
        print(f"JSON parse error: {e}")
        # フォールバック: 正規表現でフィールド抽出
        return extract_crush_db_regex(content)

def extract_crush_db_regex(content):
    """正規表現による薬剤エントリ抽出（フォールバック）"""
    entries = []
    pattern = re.compile(
        r'\{\s*id:\s*(\d+),\s*generic:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*form:\s*"([^"]+)",\s*'
        r'crush:\s*"([^"]+)",\s*crushNote:\s*"([^"]*)",\s*susp:\s*"([^"]+)",\s*suspNote:\s*"([^"]*)",\s*source:\s*"([^"]*)"'
    )
    for m in pattern.finditer(content):
        entries.append({
            "id": int(m.group(1)),
            "generic": m.group(2),
            "brand": m.group(3),
            "category": m.group(4),
            "form": m.group(5),
            "crush": m.group(6),
            "crushNote": m.group(7),
            "susp": m.group(8),
            "suspNote": m.group(9),
            "source": m.group(10),
        })
    return entries

def extract_renal_db(html_path):
    """renal-pwa の薬剤配列を抽出（各エントリのidと基本情報のみ）"""
    with open(html_path, encoding='utf-8') as f:
        content = f.read()
    ids = re.findall(r"\{id:'([^']+)'", content)
    jas = re.findall(r"ja:\[([^\]]+)\]", content)
    ens = re.findall(r"en:\[([^\]]+)\]", content)
    clss = re.findall(r"cls:'([^']+)'", content)
    entries = []
    for i, rid in enumerate(ids):
        ja = [x.strip().strip("'") for x in jas[i].split(',')] if i < len(jas) else []
        en = [x.strip().strip("'") for x in ens[i].split(',')] if i < len(ens) else []
        cls = clss[i] if i < len(clss) else ""
        entries.append({"id": rid, "ja": ja, "en": en, "cls": cls})
    return entries

def assign_crush_ids(entries):
    """crushing-checker 薬剤にカテゴリ+連番IDを割り当てる"""
    cat_counter = {}
    result = []
    for e in entries:
        cat = e.get("category", "")
        code = CAT_CODE.get(cat)
        if not code:
            code = "unk"
            print(f"WARNING: No code for category '{cat}' (id={e['id']})")
        cat_counter[code] = cat_counter.get(code, 0) + 1
        new_id = f"{code}{cat_counter[code]:03d}"
        result.append({**e, "new_id": new_id})
    return result

def generate_master_js(crush_entries, renal_entries, out_path):
    lines = ["// shared/drugs-master.js — 自動生成 by generate_master.py",
             "// 手動修正後は手動管理に切り替えること",
             "const DRUG_MASTER = ["]

    # crushing-checker 薬剤
    renal_ids = {e["id"] for e in renal_entries}
    for e in crush_entries:
        features = ["crush"]
        # renal側と重複する可能性（generic名で照合）は後で手動確認
        lines.append(f'  {{')
        lines.append(f'    id: "{e["new_id"]}",')
        lines.append(f'    generic: "{e["generic"]}",')
        lines.append(f'    brand: "{e["brand"]}",')
        lines.append(f'    category: "{e["category"]}",')
        lines.append(f'    form: "{e["form"]}",')
        lines.append(f'    features: {json.dumps(features, ensure_ascii=False)},')
        lines.append(f'  }},')

    # renal-pwa 薬剤
    for e in renal_entries:
        lines.append(f'  {{')
        lines.append(f'    id: "{e["id"]}",')
        generic = e["ja"][0] if e["ja"] else ""
        brand = " / ".join(e["ja"][1:]) if len(e["ja"]) > 1 else ""
        lines.append(f'    generic: "{generic}",')
        lines.append(f'    brand: "{brand}",')
        lines.append(f'    category: "{e["cls"]}",')
        lines.append(f'    form: "注射",')
        lines.append(f'    features: ["renal"],')
        lines.append(f'  }},')

    lines.append("];")
    lines.append("")
    lines.append("if (typeof module !== 'undefined') module.exports = { DRUG_MASTER };")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Written: {out_path}")

def generate_crush_data_js(crush_entries, out_path):
    lines = ["// crushing-checker/crush-data.js — 自動生成",
             "const CRUSH_DATA = {"]
    for e in crush_entries:
        nid = e["new_id"]
        crush = e.get("crush","")
        crushNote = e.get("crushNote","").replace('"', '\\"')
        susp = e.get("susp","")
        suspNote = e.get("suspNote","").replace('"', '\\"')
        source = e.get("source","").replace('"', '\\"')
        lines.append(f'  "{nid}": {{')
        lines.append(f'    crush: "{crush}", crushNote: "{crushNote}",')
        lines.append(f'    susp: "{susp}", suspNote: "{suspNote}",')
        lines.append(f'    source: "{source}",')
        lines.append(f'  }},')
    lines.append("};")
    lines.append("")
    lines.append("if (typeof module !== 'undefined') module.exports = { CRUSH_DATA };")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Written: {out_path}")

def main():
    base = os.path.expanduser("~")
    crush_html = f"{base}/crushing-checker/index.html"
    renal_html = f"{base}/renal-pwa/index.html"
    out_dir = os.path.expanduser("~/pharmacy-tools")

    print("Extracting crushing-checker DB...")
    crush_entries = extract_crush_db_regex(open(crush_html, encoding='utf-8').read())
    print(f"  {len(crush_entries)} entries extracted")

    print("Assigning category+serial IDs...")
    crush_entries = assign_crush_ids(crush_entries)

    print("Extracting renal-pwa DB...")
    renal_entries = extract_renal_db(renal_html)
    print(f"  {len(renal_entries)} entries extracted")

    print("Generating drugs-master.js...")
    generate_master_js(crush_entries, renal_entries, f"{out_dir}/shared/drugs-master.js")

    print("Generating crush-data.js...")
    generate_crush_data_js(crush_entries, f"{out_dir}/crushing-checker/crush-data.js")

    # ID対応表を出力（確認用）
    print("\n── ID対応表（crushing-checker） ──")
    for e in crush_entries[:20]:
        print(f"  {e['id']:3d} → {e['new_id']:12s}  {e['generic']}")
    print(f"  ... (全{len(crush_entries)}件)")

if __name__ == "__main__":
    main()
