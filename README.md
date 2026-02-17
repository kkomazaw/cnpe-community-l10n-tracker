# L10N Tracker - Localization Management Application

GitHubリポジトリでメンテナンスされている多言語Webサイトのローカライゼーション(L10N)状況を可視化・追跡するアプリケーション

## 概要

このアプリケーションは、HugoなどのStatic Site Generatorで構築された多言語Webサイトの翻訳状況を自動分析し、未翻訳ファイルや翻訳の進捗を可視化します。

### 主な機能 (Phase 1 - MVP)

- ✅ GitHubリポジトリからのコンテンツ自動取得
- ✅ コンテンツファイル(Markdown)の翻訳状況分析
- ✅ i18n翻訳ファイル(TOML/YAML)の分析
- ✅ 言語別翻訳進捗率の可視化
- ✅ 未翻訳ファイルリストの表示
- ✅ CSV形式でのレポート出力
- ✅ 日英UI切り替え

### 対象サイト

- **初期対象**: [CNPE Community](https://github.com/Cloud-Native-Platform-Engineering/cnpe-community)
- **サポート**: Hugo (Phase 1), Docusaurus/VuePress等 (Phase 2以降)

---

## ドキュメント

プロジェクトの詳細は以下のドキュメントを参照してください:

| ドキュメント | 説明 |
|------------|------|
| [REQUIREMENTS.md](./docs/REQUIREMENTS.md) | 要件定義書 (初版) |
| [DETAILED_REQUIREMENTS.md](./docs/DETAILED_REQUIREMENTS.md) | 詳細要件定義書 (ヒアリング結果版) |
| [TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) | 技術設計書 (アーキテクチャ、API、コンポーネント) |
| [TYPE_DEFINITIONS.md](./docs/TYPE_DEFINITIONS.md) | TypeScript型定義一覧 |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | **Vercelデプロイガイド（クラウドホスティング）** |

---

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **i18n**: next-intl

### バックエンド
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL (Vercel Postgres) / SQLite (ローカル開発)

### インフラ
- **Deployment**: Vercel
- **Container**: Docker + Docker Compose (ローカル開発)
- **GitHub API**: Octokit

---

## クイックスタート

### 🚀 Vercelへデプロイ（推奨）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/cnpe-community-l10n-tracker)

1. 上記ボタンをクリック（またはVercelダッシュボードから手動インポート）
2. Vercel Postgresを追加
3. 環境変数 `GITHUB_TOKEN` を設定
4. デプロイ完了！

詳細は [DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。

---

### 💻 ローカル開発（Docker）

#### 前提条件

- Docker Desktop インストール済み
- GitHub Personal Access Token (repo スコープ)

#### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone <this-repo-url>
cd cnpe-community-l10n-tracker

# 2. 環境変数を設定
cp .env.example .env.local
# .env.local を編集して GITHUB_TOKEN を設定

# 3. Docker起動
docker-compose up -d

# 4. ブラウザでアクセス
open http://localhost:3000
```

---

### 🛠️ ローカル開発（手動セットアップ）

```bash
# 依存関係インストール
npm install

# データベース初期化（SQLite）
# .env.local で DATABASE_URL=file:./data/l10n-tracker.db を設定
npx prisma migrate dev --name init
npx prisma generate

# 開発サーバー起動
npm run dev
```

---

## プロジェクト構成

```
cnpe-community-l10n-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # 多言語ルーティング
│   │   │   ├── page.tsx        # ダッシュボード
│   │   │   └── settings/       # サイト設定
│   │   └── api/                # API Routes
│   │       ├── sites/
│   │       ├── analyze/
│   │       └── export/
│   ├── components/             # Reactコンポーネント
│   │   ├── ui/                 # shadcn/ui
│   │   ├── dashboard/          # ダッシュボード関連
│   │   └── settings/           # 設定画面関連
│   ├── lib/
│   │   ├── services/           # ビジネスロジック
│   │   │   ├── github.service.ts
│   │   │   ├── analyzer.service.ts
│   │   │   └── export.service.ts
│   │   ├── repositories/       # データアクセス層
│   │   ├── utils/              # ユーティリティ
│   │   └── types/              # TypeScript型定義
│   └── messages/               # 国際化メッセージ
│       ├── en.json
│       └── ja.json
├── prisma/
│   └── schema.prisma           # Prismaスキーマ
├── data/                       # SQLiteデータベース
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## API仕様

### エンドポイント一覧

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sites` | サイト一覧取得 |
| POST | `/api/sites` | サイト登録 |
| GET | `/api/sites/:id` | サイト詳細取得 |
| POST | `/api/sites/:id/analyze` | L10N分析実行 |
| GET | `/api/sites/:id/analysis` | 最新分析結果取得 |
| GET | `/api/sites/:id/export` | CSV出力 |

詳細は [TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md#3-api設計) を参照

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm run start

# Linter実行
npm run lint

# コードフォーマット
npm run format

# 型チェック
npm run type-check

# データベースマイグレーション
npm run db:migrate

# Prisma Client生成
npm run db:generate

# Prisma Studio起動
npm run db:studio

# テスト実行
npm test
```

---

## データベーススキーマ

主要なテーブル:

- **Site**: サイト情報 (リポジトリURL、ブランチ、パス設定等)
- **Language**: 対象言語 (コード、名前、表示順)
- **Analysis**: 分析結果 (翻訳率、未翻訳ファイル、i18nキー等)

詳細は [TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md#2-データベース設計) を参照

---

## 環境変数

### ローカル開発（SQLite）

```bash
# GitHub Personal Access Token (必須)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# データベースURL (必須)
DATABASE_URL=file:./data/l10n-tracker.db

# 環境 (任意)
NODE_ENV=development

# ポート (任意)
PORT=3000
```

### Vercelデプロイ（PostgreSQL）

```bash
# GitHub Personal Access Token (必須)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# データベースURL (自動設定)
# Vercel Postgresを追加すると自動的に設定されます
DATABASE_URL=postgres://username:password@hostname:5432/database?sslmode=require

# 環境 (自動設定)
NODE_ENV=production
```

詳細は [DEPLOYMENT.md](./docs/DEPLOYMENT.md#4-環境変数の設定) を参照してください。

---

## 開発ロードマップ

### ✅ Phase 1 (MVP) - 完了: 2026年2月17日

- [x] 要件定義・設計
- [x] プロジェクトセットアップ
- [x] データベース実装
- [x] GitHub連携実装
- [x] 分析エンジン実装 (コンテンツ + i18n)
- [x] ダッシュボードUI実装
- [x] CSV出力機能
- [x] 日英UI切り替え
- [x] Toast通知機能
- [x] サイト登録フォーム

### 🔜 Phase 2 - 拡張機能

- [ ] 複数サイト管理
- [ ] 更新日時比較 (古い翻訳検出)
- [ ] 自動更新スケジューラ
- [ ] 詳細な差分分析

### 🚀 Phase 3 - 将来機能

- [ ] Docusaurus/VuePress対応
- [ ] GitLab/Bitbucket対応
- [ ] 機械翻訳連携 (DeepL API)
- [ ] 翻訳メモリ機能

---

## 貢献

個人利用を想定しているため、外部からの貢献は現時点では受け付けていません。

---

## ライセンス

MIT License

---

## 作成者

Claude Code + kkomazaw

---

## 関連リンク

- [CNPE Community Website](https://cloudnativeplatforms.com/)
- [CNPE Community GitHub](https://github.com/Cloud-Native-Platform-Engineering/cnpe-community)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GitHub REST API](https://docs.github.com/en/rest)

---

**Last Updated**: 2026年2月17日 - Vercelデプロイ対応追加
