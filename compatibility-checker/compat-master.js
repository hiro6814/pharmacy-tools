// compatibility-checker/compat-master.js — ICU配合変化データベース
// Phase 5a MVP: ICU頻用薬剤 配合変化データ
// result: "ng"(配合禁忌) / "caution"(注意) / "ok"(通常問題なし)

const COMPAT_DATA = [

  // ══════════════════════════════════════════
  // バンコマイシン
  // ══════════════════════════════════════════
  {
    id:"c001", drugA:"バンコマイシン", drugB:"ピペラシリン/タゾバクタム",
    result:"ng",
    note:"白色沈殿形成。同一ライン同時投与禁忌。別ルートまたは逐次投与（生食20mLでフラッシュ）。",
    source:"PMDA IF・Trissel's",verified:"confirmed",
  },
  {
    id:"c002", drugA:"バンコマイシン", drugB:"セフトリアキソン",
    result:"ng",
    note:"pH依存性の沈殿形成。特に濃度が高い場合は禁忌。別ルート推奨。",
    source:"PMDA IF・Trissel's",verified:"confirmed",
  },
  {
    id:"c003", drugA:"バンコマイシン", drugB:"フロセミド",
    result:"caution",
    note:"混合で沈殿形成リスクあり（pH差）。腎毒性・耳毒性の相加的増強にも注意。別々に投与推奨。",
    source:"Trissel's・各IF",verified:"confirmed",
  },
  {
    id:"c004", drugA:"バンコマイシン", drugB:"ヘパリン",
    result:"caution",
    note:"高濃度では沈殿形成リスクあり。フラッシュを行いながら逐次投与を基本とする。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c005", drugA:"バンコマイシン", drugB:"フェノバルビタール",
    result:"ng",
    note:"白色沈殿形成。同一ラインでの投与禁忌。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c006", drugA:"バンコマイシン", drugB:"メロペネム",
    result:"ok",
    note:"通常の濃度範囲では配合変化なし。両薬剤は別々のラインが理想だが同一ラインでの使用例あり。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c007", drugA:"バンコマイシン", drugB:"ゲンタマイシン",
    result:"caution",
    note:"腎毒性・耳毒性の相加的増強（薬理学的相互作用）。配合変化はないが投与中は腎機能・TDMを密に監視。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c008", drugA:"バンコマイシン", drugB:"アミカシン",
    result:"caution",
    note:"腎毒性・耳毒性の相加的増強。TDM管理を厳重に。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c009", drugA:"バンコマイシン", drugB:"ミダゾラム",
    result:"ok",
    note:"通常濃度では配合変化の報告なし。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c010", drugA:"バンコマイシン", drugB:"リネゾリド",
    result:"caution",
    note:"同一ラインでの配合は避けること（製剤pH差・安定性懸念）。逐次投与の場合はフラッシュを行う。",
    source:"各IF",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // セフトリアキソン
  // ══════════════════════════════════════════
  {
    id:"c020", drugA:"セフトリアキソン", drugB:"カルシウム含有輸液",
    result:"ng",
    note:"セフトリアキソン-カルシウム塩の沈殿形成。新生児での死亡例あり。リンゲル液・ラクテック・カルシウム製剤との同時投与は絶対禁忌。48時間以上の間隔が必要（新生児）。",
    source:"PMDA安全性情報・FDA警告",verified:"confirmed",
  },
  {
    id:"c021", drugA:"セフトリアキソン", drugB:"乳酸リンゲル液",
    result:"ng",
    note:"カルシウム含有による沈殿形成。5%ブドウ糖液または生理食塩水で溶解すること。",
    source:"PMDA IF",verified:"confirmed",
  },
  {
    id:"c022", drugA:"セフトリアキソン", drumgB:"酢酸リンゲル液",
    drugB:"酢酸リンゲル液",
    result:"ng",
    note:"カルシウム含有による沈殿形成リスク。生食または5%ブドウ糖液を使用する。",
    source:"PMDA IF",verified:"confirmed",
  },
  {
    id:"c023", drugA:"セフトリアキソン", drugB:"フルコナゾール",
    result:"caution",
    note:"沈殿形成の報告あり。同一ラインでの同時投与は避けること。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c024", drugA:"セフトリアキソン", drugB:"バンコマイシン",
    result:"ng",
    note:"pH差による沈殿形成（→バンコマイシン側にも記載）。別ルート推奨。",
    source:"PMDA IF・Trissel's",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // カテコラミン・アルカリ性薬剤
  // ══════════════════════════════════════════
  {
    id:"c030", drugA:"ドパミン", drugB:"重炭酸ナトリウム（炭酸水素Na）",
    result:"ng",
    note:"アルカリ性環境でドパミンが分解（酸化）。変色（黄→褐色）が指標。同一ラインでの投与禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c031", drugA:"ノルアドレナリン", drugB:"重炭酸ナトリウム（炭酸水素Na）",
    result:"ng",
    note:"アルカリ条件でノルアドレナリンが分解・不活化。同一ライン禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c032", drugA:"アドレナリン", drugB:"重炭酸ナトリウム（炭酸水素Na）",
    result:"ng",
    note:"アルカリ条件でアドレナリンが急速に分解・失活。緊急時も別ルート確保が必要。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c033", drugA:"ドブタミン", drugB:"重炭酸ナトリウム（炭酸水素Na）",
    result:"ng",
    note:"アルカリ性条件で分解。同一ライン投与禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c034", drugA:"ドパミン", drugB:"フロセミド",
    result:"ng",
    note:"フロセミドはアルカリ性（pH8-9）のため混合でドパミン沈殿・分解リスク。別ラインで投与。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c035", drugA:"ノルアドレナリン", drugB:"フロセミド",
    result:"caution",
    note:"pH差による配合変化リスク。別々に投与することが望ましい。",
    source:"各IF",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // フロセミド（アルカリ性）
  // ══════════════════════════════════════════
  {
    id:"c040", drugA:"フロセミド", drugB:"ミダゾラム",
    result:"ng",
    note:"pH差（フロセミド: アルカリ性 / ミダゾラム: 酸性）による沈殿形成。同一ライン投与禁忌。",
    source:"各IF・Trissel's",verified:"confirmed",
  },
  {
    id:"c041", drugA:"フロセミド", drugB:"ハロペリドール",
    result:"ng",
    note:"白色沈殿形成。同一ライン投与禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c042", drugA:"フロセミド", drugB:"ゲンタマイシン",
    result:"caution",
    note:"同一ラインでの沈殿リスク（pH差）＋耳毒性の相加的増強（薬理学的）。別ラインで投与し聴力監視を行う。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c043", drugA:"フロセミド", drugB:"アミカシン",
    result:"caution",
    note:"耳毒性の相加的増強。聴力・TDM監視を徹底。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c044", drugA:"フロセミド", drugB:"ニカルジピン",
    result:"ng",
    note:"白色沈殿形成。同一ライン禁忌。別ルートで投与すること。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c045", drugA:"フロセミド", drugB:"ジアゼパム",
    result:"ng",
    note:"白色沈殿形成。同一ライン禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c046", drugA:"フロセミド", drugB:"ドパミン",
    result:"ng",
    note:"pH差によるドパミン分解（→ドパミン側にも記載）。同一ライン禁忌。",
    source:"各IF",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // アンホテリシンB
  // ══════════════════════════════════════════
  {
    id:"c050", drugA:"アンホテリシンB", drugB:"生理食塩水",
    result:"ng",
    note:"電解質により乳剤が不安定化・沈殿形成。必ず5%ブドウ糖液で溶解・希釈すること。",
    source:"PMDA IF",verified:"confirmed",
  },
  {
    id:"c051", drugA:"アンホテリシンB", drugB:"カルシウム含有輸液",
    result:"ng",
    note:"電解質による沈殿形成。5%ブドウ糖液以外は使用不可。",
    source:"PMDA IF",verified:"confirmed",
  },
  {
    id:"c052", drugA:"アンホテリシンB", drugB:"フルコナゾール",
    result:"caution",
    note:"拮抗作用（薬理学的）。アンホテリシンBの抗真菌効果がフルコナゾールにより減弱する可能性。同時投与は治療上の必要性を慎重に評価する。",
    source:"各IF",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // ヘパリン
  // ══════════════════════════════════════════
  {
    id:"c060", drugA:"ヘパリン", drugB:"ゲンタマイシン",
    result:"caution",
    note:"沈殿形成の報告あり。同一ラインでの混合は避けること。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c061", drugA:"ヘパリン", drugB:"ハロペリドール",
    result:"ng",
    note:"白色沈殿形成。同一ライン禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c062", drugA:"ヘパリン", drumgB:"ニカルジピン",
    drugB:"ニカルジピン",
    result:"caution",
    note:"沈殿形成リスクあり。できるだけ別ラインで投与する。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c063", drugA:"ヘパリン", drugB:"ドパミン",
    result:"ok",
    note:"通常濃度では配合変化の報告なし。",
    source:"Trissel's",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // ミダゾラム・鎮静薬
  // ══════════════════════════════════════════
  {
    id:"c070", drugA:"ミダゾラム", drugB:"フェンタニル",
    result:"ok",
    note:"通常濃度での混合は問題なし。ICUでの鎮痛鎮静管理に広く使用されている。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c071", drugA:"ミダゾラム", drugB:"プロポフォール",
    result:"caution",
    note:"同一シリンジでの混合は避けること（乳剤の安定性）。別々に投与する。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c072", drugA:"ミダゾラム", drugB:"モルヒネ",
    result:"ok",
    note:"通常濃度での混合は問題なし。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c073", drugA:"ミダゾラム", drugB:"ドパミン",
    result:"ok",
    note:"通常濃度では配合変化の報告なし。",
    source:"Trissel's",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // プロポフォール
  // ══════════════════════════════════════════
  {
    id:"c080", drugA:"プロポフォール", drugB:"アミノ酸輸液",
    result:"ng",
    note:"乳剤の不安定化・凝集。同一ラインでの混合禁忌。別ルートで投与する。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c081", drugA:"プロポフォール", drugB:"アルブミン製剤",
    result:"caution",
    note:"乳剤の安定性低下の可能性あり。混合は避けること。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c082", drugA:"プロポフォール", drugB:"フェンタニル",
    result:"ok",
    note:"Yサイトでの投与は通常問題なし（混合はしない）。",
    source:"Trissel's",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // フルコナゾール
  // ══════════════════════════════════════════
  {
    id:"c090", drugA:"フルコナゾール", drugB:"セフトリアキソン",
    result:"caution",
    note:"沈殿形成の報告あり。同一ラインでの同時投与は避けること。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c091", drugA:"フルコナゾール", drugB:"ジゴキシン",
    result:"caution",
    note:"フルコナゾールによりジゴキシン血中濃度が上昇（CYP3A4・P-gp阻害）。TDM管理を行う（薬理学的相互作用）。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c092", drugA:"フルコナゾール", drugB:"ワルファリン",
    result:"caution",
    note:"CYP2C9阻害によりワルファリン効果が著明に増強。PT-INRを頻回に確認し用量調整が必要（薬理学的相互作用）。",
    source:"各IF",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // シプロフロキサシン
  // ══════════════════════════════════════════
  {
    id:"c100", drugA:"シプロフロキサシン", drugB:"カルシウム含有輸液",
    result:"caution",
    note:"キレート形成によりシプロフロキサシン効果が低下（薬理学的）。同時投与は避けること。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c101", drugA:"シプロフロキサシン", drugB:"ピペラシリン/タゾバクタム",
    result:"caution",
    note:"混合で沈殿形成リスクあり。Yサイトでの同時投与を避け、別々に投与する。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c102", drugA:"シプロフロキサシン", drugB:"ヘパリン",
    result:"caution",
    note:"沈殿形成の報告あり。投与前後にフラッシュを行う。",
    source:"Trissel's",verified:"confirmed",
  },

  // ══════════════════════════════════════════
  // その他の重要な組み合わせ
  // ══════════════════════════════════════════
  {
    id:"c110", drugA:"ジゴキシン", drugB:"カルシウム製剤",
    result:"caution",
    note:"高カルシウム血症によりジゴキシン毒性が増強（薬理学的相互作用）。静注カルシウムは緩徐に投与し心電図を監視する。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c111", drugA:"ジゴキシン", drugB:"アミオダロン",
    result:"caution",
    note:"アミオダロンによりジゴキシン血中濃度が有意に上昇（P-gp阻害）。ジゴキシン用量を50%減量し頻回にTDMを行う（薬理学的相互作用）。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c112", drugA:"モルヒネ", drugB:"生理食塩水",
    result:"ok",
    note:"通常濃度での配合変化なし。標準的な希釈溶媒として使用可能。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c113", drugA:"フェンタニル", drugB:"ミダゾラム",
    result:"ok",
    note:"通常濃度での混合は問題なし（→ミダゾラム側にも記載）。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c114", drugA:"ニカルジピン", drugB:"重炭酸ナトリウム（炭酸水素Na）",
    result:"ng",
    note:"アルカリ性環境でニカルジピンが分解。同一ライン禁忌。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c115", drugA:"ニカルジピン", drugB:"生理食塩水",
    result:"ok",
    note:"通常の希釈溶媒として使用可能（0.1mg/mL以下に希釈）。",
    source:"各IF",verified:"confirmed",
  },
  {
    id:"c116", drugA:"アシクロビル", drugB:"ドパミン",
    result:"caution",
    note:"沈殿形成の報告あり。別ラインで投与することが望ましい。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c117", drugA:"タゾバクタム/ピペラシリン", drugB:"バンコマイシン",
    result:"ng",
    note:"白色沈殿（→バンコマイシン側c001にも記載）。別ライン必須。",
    source:"PMDA IF・Trissel's",verified:"confirmed",
  },
  {
    id:"c118", drugA:"メロペネム", drugB:"フルコナゾール",
    result:"ok",
    note:"通常濃度での配合変化の報告なし。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c119", drugA:"ドパミン", drugB:"ドブタミン",
    result:"ok",
    note:"両薬剤は混合可能。ICUでの併用は一般的。",
    source:"Trissel's",verified:"confirmed",
  },
  {
    id:"c120", drugA:"ノルアドレナリン", drugB:"ドブタミン",
    result:"ok",
    note:"混合可能。ショック管理での併用例多数。",
    source:"Trissel's",verified:"confirmed",
  },
];

if (typeof module !== "undefined") module.exports = { COMPAT_DATA };
