# Week 2 実装完了レポート

## 完了日時
2026年2月17日

## 実装内容

### ✅ 1. TOML/YAMLパーサー実装

#### 1.1 TOMLパーサー
**ファイル:** `src/lib/utils/parsers/toml-parser.ts`

**実装内容:**
- `parseToml()` - TOML文字列をパースしてフラットなキー・バリューに変換
- `flattenObject()` - ネストされたオブジェクトをドット記法でフラット化
- `extractTomlKeys()` - TOMLファイルからキー一覧を取得

**使用ライブラリ:** `@iarna/toml`

**例:**
```typescript
const content = `
[menu]
home = "ホーム"
about = "概要"
`;

parseToml(content);
// → { "menu.home": "ホーム", "menu.about": "概要" }
```

---

#### 1.2 YAMLパーサー
**ファイル:** `src/lib/utils/parsers/yaml-parser.ts`

**実装内容:**
- `parseYaml()` - YAML文字列をパースしてフラットなキー・バリューに変換
- `flattenObject()` - ネストされたオブジェクトをドット記法でフラット化
- `extractYamlKeys()` - YAMLファイルからキー一覧を取得

**使用ライブラリ:** `js-yaml`

**例:**
```typescript
const content = `
menu:
  home: "ホーム"
  about: "概要"
`;

parseYaml(content);
// → { "menu.home": "ホーム", "menu.about": "概要" }
```

---

#### 1.3 統合パーサー
**ファイル:** `src/lib/utils/parsers/index.ts`

**実装内容:**
- `parseI18nFile()` - ファイル拡張子を自動検出してパース
- `extractI18nKeys()` - ファイル拡張子を自動検出してキー一覧取得
- `isSupportedI18nFile()` - サポートされているi18nファイルかチェック

**サポートフォーマット:**
- `.toml` - TOML形式（Hugoの標準）
- `.yaml` - YAML形式
- `.yml` - YAML形式（短縮）

**使い方:**
```typescript
import { parseI18nFile } from '@/lib/utils/parsers';

const keys = parseI18nFile(content, 'ja.toml');
// 拡張子に応じて自動的にTOML/YAMLパーサーを選択
```

---

### ✅ 2. AnalyzerService実装

**ファイル:** `src/lib/services/analyzer.service.ts`

**主要メソッド:**

#### 2.1 `analyzeSite(siteId)`
- サイト全体のL10N分析を実行
- 各言語を順次分析
- 分析結果をデータベースに保存
- 古い分析結果を自動削除（最新10件保持）

**処理フロー:**
1. サイト情報を取得
2. GitHubリポジトリのツリー構造を取得
3. 各言語（基準言語以外）を分析
4. 分析結果をデータベースに保存
5. 古い履歴を削除

---

#### 2.2 `analyzeLanguage(site, languageCode, tree)`
- 特定言語の分析を実行
- コンテンツファイル分析とi18n分析を実施

**戻り値:**
```typescript
{
  languageCode: string;
  totalContentFiles: number;
  translatedContentFiles: number;
  contentCompletionRate: number; // 0-100
  missingContentFiles: string[];
  totalI18nKeys: number;
  translatedI18nKeys: number;
  i18nCompletionRate: number; // 0-100
  missingI18nKeys: string[];
  extraI18nKeys: string[];
  durationMs?: number;
  errorMessage?: string;
}
```

---

#### 2.3 `analyzeContentFiles(site, languageCode, tree)`
- コンテンツファイル（.md）の分析

**処理内容:**
1. 基準言語のMarkdownファイル一覧を取得
2. 対象言語のMarkdownファイル一覧を取得
3. 差分を計算して未翻訳ファイルを特定
4. 完成率を計算

**例:**
```
基準言語（en）: ["docs/intro.md", "docs/guide.md", "docs/api.md"]
対象言語（ja）: ["docs/intro.md", "docs/guide.md"]
→ 未翻訳: ["docs/api.md"]
→ 完成率: 66.67%
```

---

#### 2.4 `analyzeI18nFiles(site, languageCode)`
- i18nファイル（TOML/YAML）の分析

**処理内容:**
1. 基準言語のi18nファイルを取得してパース
2. 対象言語のi18nファイルを取得してパース
3. キーの差分を計算
   - 未翻訳キー（基準言語にあるが対象言語にない）
   - 余分なキー（対象言語にあるが基準言語にない）
4. 完成率を計算

**例:**
```
基準言語（en.toml）: ["menu.home", "menu.about", "menu.contact"]
対象言語（ja.toml）: ["menu.home", "menu.about", "menu.extra"]
→ 未翻訳: ["menu.contact"]
→ 余分なキー: ["menu.extra"]
→ 完成率: 66.67%
```

---

#### 2.5 `extractContentFiles(tree, contentPath, languageCode)`
- GitHubツリーからコンテンツファイルを抽出

**処理内容:**
- `contentPath/languageCode/` 配下の `.md` ファイルを抽出
- 言語ディレクトリ以降の相対パスを返す

**例:**
```
ツリー: "website/content/en/docs/intro.md"
contentPath: "website/content"
languageCode: "en"
→ 抽出結果: "docs/intro.md"
```

---

#### 2.6 `buildI18nFilePath(i18nPath, languageCode)`
- i18nファイルパスを構築

**パス形式:** `{i18nPath}/{languageCode}.toml`

**例:**
```
i18nPath: "website/i18n"
languageCode: "ja"
→ "website/i18n/ja.toml"
```

---

### ✅ 3. 分析API実装

#### 3.1 `POST /api/sites/:id/analyze`
**ファイル:** `src/app/api/sites/[id]/analyze/route.ts`

**機能:**
- サイトのL10N分析を実行
- 全言語の分析結果を返す

**リクエスト:**
```bash
POST /api/sites/:id/analyze
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "languageCode": "ja",
        "totalContentFiles": 41,
        "translatedContentFiles": 14,
        "contentCompletionRate": 34.15,
        "missingContentFiles": ["docs/advanced.md", "..."],
        "totalI18nKeys": 25,
        "translatedI18nKeys": 20,
        "i18nCompletionRate": 80.0,
        "missingI18nKeys": ["menu.contact", "..."],
        "extraI18nKeys": [],
        "durationMs": 1523
      },
      {
        "languageCode": "ko",
        "totalContentFiles": 41,
        "translatedContentFiles": 9,
        "contentCompletionRate": 21.95,
        "missingContentFiles": ["..."],
        "totalI18nKeys": 25,
        "translatedI18nKeys": 15,
        "i18nCompletionRate": 60.0,
        "missingI18nKeys": ["..."],
        "extraI18nKeys": [],
        "durationMs": 1523
      }
    ],
    "summary": {
      "totalLanguages": 2,
      "analyzedAt": "2026-02-17T00:00:00.000Z",
      "durationMs": 1523
    }
  }
}
```

---

#### 3.2 `GET /api/sites/:id/analysis`
**ファイル:** `src/app/api/sites/[id]/analysis/route.ts`

**機能:**
- サイトの分析結果を取得
- クエリパラメータで柔軟な取得が可能

**クエリパラメータ:**
- `language` - 特定言語の分析結果のみ取得（オプション）
- `history` - 履歴を取得（デフォルト: false）
- `limit` - 履歴取得時の件数制限（デフォルト: 10）

**例1: 全言語の最新分析結果を取得**
```bash
GET /api/sites/:id/analysis
```

**例2: 特定言語の最新分析結果を取得**
```bash
GET /api/sites/:id/analysis?language=ja
```

**例3: 分析履歴を取得**
```bash
GET /api/sites/:id/analysis?history=true&limit=5
```

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "siteId": "clx456...",
      "languageCode": "ja",
      "totalContentFiles": 41,
      "translatedContentFiles": 14,
      "contentCompletionRate": 34.15,
      "missingContentFiles": ["docs/advanced.md"],
      "totalI18nKeys": 25,
      "translatedI18nKeys": 20,
      "i18nCompletionRate": 80.0,
      "missingI18nKeys": ["menu.contact"],
      "extraI18nKeys": [],
      "analyzedAt": "2026-02-17T00:00:00.000Z",
      "createdAt": "2026-02-17T00:00:00.000Z"
    }
  ]
}
```

---

## 動作確認

### ✅ 型チェック
```bash
npm run type-check
# → エラーなし
```

### ✅ ヘルスチェックAPI
```bash
curl http://localhost:3000/api/health
# → {"status":"healthy","database":"connected"}
```

### ⚠️ 実データテスト
実際のGitHubリポジトリを使った分析テストには、**GitHub Personal Access Token**が必要です。

**必要な設定:**
1. `.env.local` ファイルに `GITHUB_TOKEN` を設定
2. GitHub Settings → Developer settings → Personal access tokens
3. スコープ: `repo` または `public_repo`（公開リポジトリのみの場合）

---

## ファイル構成

```
src/
├── app/
│   └── api/
│       └── sites/
│           └── [id]/
│               ├── analyze/
│               │   └── route.ts         ✅ L10N分析実行API
│               └── analysis/
│                   └── route.ts         ✅ 分析結果取得API
└── lib/
    ├── services/
    │   └── analyzer.service.ts          ✅ L10N分析サービス
    └── utils/
        └── parsers/
            ├── index.ts                 ✅ 統合パーサー
            ├── toml-parser.ts           ✅ TOMLパーサー
            └── yaml-parser.ts           ✅ YAMLパーサー
```

---

## 実装統計

- **新規作成ファイル数**: 6ファイル
- **総コード行数**: 約450行
- **実装時間**: 約45分
- **型チェック**: ✅ パス
- **API動作確認**: ✅ 成功（ヘルスチェック）

---

## 実装のハイライト

### 1. 柔軟なパーサー設計
- TOML/YAML両対応
- 拡張子による自動判定
- フラット化によるキー比較の簡素化

### 2. 効率的なGitHub API利用
- `recursive=true` で全ファイルを一度に取得
- Rate Limit節約

### 3. 詳細な分析結果
- コンテンツファイル（Markdown）の分析
- i18nファイル（TOML/YAML）の分析
- 完成率の自動計算
- 未翻訳ファイル/キーの特定
- 余分なキーの検出

### 4. エラーハンドリング
- 言語ごとのエラーを個別に処理
- 一部の言語で失敗しても他の言語は継続

---

## 次のステップ: Week 3

### 実装予定機能

#### 1. ダッシュボードUI
- [ ] サイト一覧ページ
- [ ] サイト詳細ページ
- [ ] 分析実行ボタン
- [ ] 進捗状況の可視化（チャート）

#### 2. データビジュアライゼーション
- [ ] Recharts による進捗グラフ
- [ ] 言語ごとの完成率表示
- [ ] トレンド分析

#### 3. 国際化（i18n）
- [ ] next-intl 設定
- [ ] 日本語/英語対応
- [ ] 言語切り替えUI

---

## テスト手順（GitHub Token設定後）

### 1. GITHUB_TOKEN設定
```bash
# .env.local ファイルを編集
GITHUB_TOKEN=ghp_your_actual_token_here
```

### 2. サーバー起動
```bash
npm run dev
```

### 3. サイト登録
```bash
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CNPE Community",
    "repoOwner": "Cloud-Native-Platform-Engineering",
    "repoName": "cnpe-community",
    "branch": "main",
    "contentPath": "website/content",
    "i18nPath": "website/i18n",
    "baseLanguage": "en",
    "languages": [
      {"code": "ja", "name": "日本語", "nativeName": "日本語", "weight": 1},
      {"code": "ko", "name": "韓国語", "nativeName": "한국어", "weight": 2},
      {"code": "zh", "name": "中国語", "nativeName": "中文", "weight": 3}
    ]
  }'
```

### 4. 分析実行
```bash
# サイトIDを取得後
curl -X POST http://localhost:3000/api/sites/{SITE_ID}/analyze
```

### 5. 分析結果取得
```bash
curl http://localhost:3000/api/sites/{SITE_ID}/analysis
```

---

**Week 2 完了: L10N分析機能の実装が完了しました**

次: Week 3 - ダッシュボードUI実装とデータビジュアライゼーション
