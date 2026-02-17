# L10N管理アプリケーション - 詳細要件定義書 (ヒアリング結果版)

## ヒアリング実施日
2026年2月16日

---

## 1. プロジェクト概要

### 1.1 目的
GitHubリポジトリでメンテナンスされている多言語Webサイトのローカライゼーション(L10N)状況を可視化し、翻訳の進捗を追跡・管理するデスクトップアプリケーションを開発する。

### 1.2 利用形態
- **対象ユーザー**: 個人利用
- **デプロイ環境**: ローカル環境のみ (Docker Compose)
- **認証**: シンプルな環境変数ベース (GitHub Personal Access Token)

### 1.3 対象サイト
- **初期対象**: [Cloud-Native-Platform-Engineering/cnpe-community](https://github.com/Cloud-Native-Platform-Engineering/cnpe-community)
- **サイトジェネレーター**: Hugo (初期対応)
- **将来対応**: Docusaurus, VuePress, Jekyll等への拡張を想定した設計

### 1.4 サポート言語
現在7言語をサポート: en(英語), ja(日本語), ko(韓国語), zh(中国語), de(ドイツ語), es(スペイン語), fr(フランス語)

---

## 2. 機能要件

### 2.1 Phase 1 (MVP) - 必須機能

#### 2.1.1 サイト管理
- **単一サイト管理**
  - 1つのGitHubリポジトリを登録・分析
  - 設定項目:
    - サイト名
    - リポジトリURL (owner/repo形式)
    - ブランチ名 (デフォルト: main)
    - コンテンツディレクトリパス (例: `website/content`)
    - i18nディレクトリパス (例: `website/i18n`)
    - ベース言語 (例: en)

#### 2.1.2 コンテンツファイル分析
- **分析対象**: `content/{lang}/` ディレクトリ配下のMarkdownファイル
- **分析内容**:
  - ベース言語(en)のファイル一覧を取得
  - 各対象言語のファイル存在チェック
  - ファイル単位の翻訳完了/未完了ステータス
  - 言語別の翻訳完了率 (%) の算出

- **分析粒度**:
  - ファイルの存在チェックのみ (Phase 1)
  - ファイルサイズ比較、更新日時比較はPhase 2で実装

#### 2.1.3 i18n翻訳ファイル分析
- **分析対象**: `i18n/{lang}.toml` (またはYAML/JSON)
- **分析内容**:
  - ベース言語(en)の翻訳キー一覧を取得
  - 各対象言語の翻訳キー存在チェック
  - 未翻訳キーのリスト化
  - 余剰キー(ベース言語にないキー)の検出

#### 2.1.4 ダッシュボード - 主要表示
- **優先表示情報**: 未翻訳ファイルリスト (何を翻訳すればいいかが一目でわかる)
- **追加表示情報**:
  - 言語別の翻訳完了率 (%)
  - 言語別の翻訳済み/未翻訳ファイル数
  - i18n未翻訳キーリスト
  - ディレクトリ構造での翻訳状況表示 (ツリービュー)

- **UIデザイン**:
  - シンプルで直感的
  - レスポンシブデザイン (デスクトップ最適化)
  - 日英切り替え可能なUI

#### 2.1.5 レポート出力
- **CSV形式**:
  - 言語別の翻訳状況サマリー
  - 未翻訳ファイル一覧
  - i18n未翻訳キー一覧
  - Excelで開いて確認・共有可能

#### 2.1.6 GitHub連携
- **GitHub API統合**:
  - リポジトリコンテンツの取得 (GitHub Contents API)
  - ツリー構造の再帰取得 (Git Trees API)
  - Personal Access Token認証 (環境変数 `.env` で管理)

- **データ更新**:
  - 手動更新ボタン
  - 更新日時の記録

### 2.2 Phase 2 - 拡張機能

#### 2.2.1 複数サイト管理
- 複数のGitHubリポジトリを登録
- サイト切り替え機能
- サイトごとの設定管理

#### 2.2.2 更新日時比較 (古い翻訳の検出)
- ベース言語のファイル最終更新日時を取得 (GitHub Commits API)
- 翻訳ファイルの最終更新日時と比較
- ベース言語が更新されているが翻訳版が古いファイルを検出
- "更新が必要なファイル" リストとして表示

#### 2.2.3 自動更新スケジューラ (オプション)
- 定期的な自動分析 (例: 1日1回)
- バックグラウンド実行
- 更新履歴の保存

#### 2.2.4 詳細な差分分析 (オプション)
- Markdownコンテンツの内容比較
- 追加/削除されたセクションの検出
- ファイルサイズの比較

### 2.3 対象外機能 (実装しない)

以下の機能は個人利用のため不要:
- 通知機能 (メール/Slack通知)
- タスク管理機能 (担当者アサイン、期限管理)
- ユーザー認証・権限管理
- マルチユーザー対応

---

## 3. 技術要件

### 3.1 技術スタック

#### 3.1.1 フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**: Tailwind CSS + shadcn/ui
- **状態管理**: React Context API / Zustand
- **データ可視化**: Recharts (進捗率グラフ)
- **国際化**: next-intl (日英切り替え)

#### 3.1.2 バックエンド
- **ランタイム**: Node.js 20+
- **フレームワーク**: Next.js API Routes
- **ORM**: Prisma
- **データベース**: SQLite (ローカルファイル)
- **GitHub連携**: Octokit (GitHub REST API SDK)

#### 3.1.3 開発環境
- **コンテナ**: Docker + Docker Compose
- **パッケージマネージャー**: npm または pnpm
- **Linter/Formatter**: ESLint + Prettier
- **型チェック**: TypeScript strict mode

#### 3.1.4 環境変数管理
```env
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
DATABASE_URL=file:./data/l10n-tracker.db
```

### 3.2 システムアーキテクチャ

```
┌─────────────────────────────────────────┐
│   Next.js Frontend (React UI)           │
│   - ダッシュボード                       │
│   - サイト設定画面                       │
│   - レポート表示・CSV出力                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Next.js API Routes (Backend)          │
│   - /api/sites                          │
│   - /api/analyze                        │
│   - /api/export                         │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼─────┐ ┌──▼──────┐ ┌─▼────────────┐
│  SQLite   │ │ Prisma  │ │ GitHub API   │
│ (ローカル) │ │   ORM   │ │  (Octokit)   │
└───────────┘ └─────────┘ └──────────────┘
```

### 3.3 データモデル

#### 3.3.1 主要エンティティ

**Site**
```prisma
model Site {
  id            String   @id @default(cuid())
  name          String
  repoOwner     String
  repoName      String
  branch        String   @default("main")
  contentPath   String   // 例: "website/content"
  i18nPath      String   // 例: "website/i18n"
  baseLanguage  String   @default("en")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  languages     Language[]
  analyses      Analysis[]
}
```

**Language**
```prisma
model Language {
  id            String   @id @default(cuid())
  siteId        String
  code          String   // 例: "ja", "ko"
  name          String   // 例: "日本語", "한국어"
  weight        Int      @default(0)

  site          Site     @relation(fields: [siteId], references: [id])

  @@unique([siteId, code])
}
```

**Analysis** (分析結果)
```prisma
model Analysis {
  id                String   @id @default(cuid())
  siteId            String
  languageCode      String
  totalFiles        Int
  translatedFiles   Int
  completionRate    Float    // 0.0 - 100.0
  missingFiles      Json     // 未翻訳ファイルのパス配列
  i18nMissingKeys   Json     // 未翻訳i18nキー配列
  analyzedAt        DateTime @default(now())

  site              Site     @relation(fields: [siteId], references: [id])
}
```

### 3.4 ディレクトリ構成 (Next.js)

```
cnpe-community-l10n-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # 多言語ルーティング
│   │   │   ├── page.tsx        # ダッシュボード
│   │   │   ├── settings/       # サイト設定
│   │   │   └── layout.tsx
│   │   ├── api/                # API Routes
│   │   │   ├── analyze/
│   │   │   ├── export/
│   │   │   └── sites/
│   │   └── layout.tsx
│   ├── components/             # Reactコンポーネント
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   ├── Dashboard.tsx
│   │   ├── LanguageProgressCard.tsx
│   │   ├── MissingFilesList.tsx
│   │   └── ...
│   ├── lib/                    # ユーティリティ
│   │   ├── github.ts           # GitHub API クライアント
│   │   ├── analyzer.ts         # L10N分析ロジック
│   │   ├── prisma.ts           # Prisma クライアント
│   │   └── csv-export.ts       # CSV出力
│   └── types/                  # TypeScript型定義
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── messages/                   # 国際化メッセージ
│   ├── en.json
│   └── ja.json
├── data/                       # SQLiteファイル配置
├── .env.local                  # 環境変数
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 4. 非機能要件

### 4.1 パフォーマンス
- 1サイトの分析処理時間: 30秒以内 (100ファイル規模)
- ダッシュボードの初期表示: 3秒以内
- GitHub API Rate Limit対策: キャッシング (分析結果をDBに保存)

### 4.2 ユーザビリティ
- **直感的なUI**: 初回利用でも迷わず使える
- **レスポンシブ**: デスクトップ環境に最適化
- **多言語UI**: 日本語/英語の切り替え
- **エラーハンドリング**: わかりやすいエラーメッセージ

### 4.3 セキュリティ
- GitHub Personal Access Tokenは `.env.local` で管理
- Gitリポジトリにトークンをコミットしない (`.gitignore` 設定)
- トークンは read:org, repo スコープのみ推奨

### 4.4 拡張性
- 将来的に他のSSG (Docusaurus, VuePress等) に対応可能な設計
- サイトタイプごとにアナライザーを切り替える抽象化層を用意
- プラグイン方式での拡張を想定

---

## 5. GitHub API 利用計画

### 5.1 使用するAPIエンドポイント

**Phase 1 (MVP):**
```
# ディレクトリツリー取得
GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1

# ファイル内容取得 (i18nファイル用)
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
```

**Phase 2:**
```
# コミット履歴取得 (更新日時比較用)
GET /repos/{owner}/{repo}/commits?path={file_path}&page=1&per_page=1
```

### 5.2 Rate Limit対策
- **認証済みリクエスト**: 5000リクエスト/時間
- **キャッシング**: 分析結果をDBに保存し、頻繁なAPI呼び出しを避ける
- **差分更新**: 全ファイル再取得ではなく、変更があったファイルのみ更新 (Phase 2)

---

## 6. 開発フェーズ

### Phase 1 (MVP) - 2-3週間
- [x] プロジェクトセットアップ (Next.js + Prisma + SQLite)
- [x] サイト登録機能
- [x] コンテンツファイル分析エンジン
- [x] i18n分析エンジン
- [x] ダッシュボードUI (未翻訳リスト中心)
- [x] CSV出力機能
- [x] 日英UI切り替え

### Phase 2 - 追加機能
- [ ] 複数サイト管理
- [ ] 更新日時比較 (古い翻訳検出)
- [ ] 自動更新スケジューラ
- [ ] 詳細な差分分析

### Phase 3 - 将来的な拡張
- [ ] Docusaurus/VuePress対応
- [ ] ファイル内容の差分表示
- [ ] 翻訳品質スコアリング

---

## 7. 成功指標 (KPI)

- **可視化の実現**: L10N状況が一目でわかるダッシュボード
- **翻訳漏れの削減**: 未翻訳ファイルリストにより翻訳すべきファイルが明確化
- **効率化**: 手動での進捗確認が不要になる
- **拡張性**: 将来的に複数サイト・他フレームワークへの対応が容易

---

## 8. 画面遷移図

```
┌─────────────────────────────────────┐
│  ダッシュボード (トップページ)        │
│  - 言語別進捗率グラフ                │
│  - 未翻訳ファイルリスト ★最重要      │
│  - i18n未翻訳キーリスト              │
│  - 手動更新ボタン                    │
│  - CSV出力ボタン                     │
└─────────────┬───────────────────────┘
              │
              ├─→ [サイト設定]
              │    - リポジトリ情報
              │    - ベース言語設定
              │    - 対象言語管理
              │
              └─→ [言語選択] 日本語 ⇄ English
```

---

## 9. MVP機能の詳細仕様

### 9.1 ダッシュボード画面

**レイアウト:**
```
┌──────────────────────────────────────────────────┐
│ [Logo] L10N Tracker          [更新] [CSV] [⚙️]   │
├──────────────────────────────────────────────────┤
│                                                  │
│  📊 翻訳進捗サマリー                              │
│  ┌────────────┬────────────┬────────────┐       │
│  │ 日本語     │ 韓国語     │ 中国語     │       │
│  │ 34.1%      │ 22.0%      │ 22.0%      │       │
│  │ 14/41 files│ 9/41 files │ 9/41 files │       │
│  └────────────┴────────────┴────────────┘       │
│                                                  │
│  ❌ 未翻訳ファイル (日本語)                       │
│  ┌──────────────────────────────────────┐       │
│  │ □ blog/2024-10-30-paap-mindset.md    │       │
│  │ □ blog/2025-01-29-composable.md      │       │
│  │ □ resources/tools/_index.md          │       │
│  │ ... (全27件)                          │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  🔤 i18n未翻訳キー (日本語)                       │
│  ┌──────────────────────────────────────┐       │
│  │ □ ui_select_all                      │       │
│  │ □ ui_deselect_all                    │       │
│  └──────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

### 9.2 CSV出力フォーマット

**ファイル名**: `l10n-report_{site-name}_{date}.csv`

**内容例:**
```csv
Language,Total Files,Translated Files,Completion Rate (%),Missing Files Count
Japanese,41,14,34.1,27
Korean,41,9,22.0,32
Chinese,41,9,22.0,32
...

Missing Files (Japanese):
blog/2024-10-30-paap-mindset.md
blog/2025-01-29-composable.md
...

i18n Missing Keys (Japanese):
ui_select_all
ui_deselect_all
...
```

---

## 10. 環境構築手順

### 10.1 前提条件
- Docker Desktop インストール済み
- GitHub Personal Access Token取得済み (repo, read:org スコープ)

### 10.2 起動手順
```bash
# 1. リポジトリクローン
git clone <this-repo>
cd cnpe-community-l10n-tracker

# 2. 環境変数設定
cp .env.example .env.local
# .env.localにGITHUB_TOKENを設定

# 3. Docker起動
docker-compose up -d

# 4. ブラウザでアクセス
open http://localhost:3000
```

---

## 11. ヒアリング結果サマリー

| 項目 | 決定内容 |
|------|---------|
| 利用形態 | 個人利用 |
| デプロイ先 | ローカルのみ (Docker) |
| フロントエンド | React (Next.js) |
| データベース | SQLite |
| UI言語 | 日英切り替え |
| GitHub認証 | 環境変数 (.env) |
| MVP機能 | コンテンツ+i18n分析、未翻訳リスト、CSV出力 |
| Phase 2機能 | 複数サイト、更新日時比較 |
| 通知機能 | 不要 |
| タスク管理 | 不要 |
| 主要表示 | 未翻訳ファイルリスト |
| 将来対応 | Hugo以外のSSGも (拡張性重視) |

---

## 12. 次のステップ

1. ✅ 要件定義完了
2. ⏭️ 技術設計書の作成
3. ⏭️ プロジェクトセットアップ
4. ⏭️ MVP開発開始

---

**文書バージョン**: 2.0 (ヒアリング反映版)
**作成日**: 2026年2月16日
**最終更新日**: 2026年2月16日
**ヒアリング実施者**: Claude Code
