# Vercel デプロイガイド

このガイドでは、L10N TrackerをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（[vercel.com](https://vercel.com)）
- GitHub Personal Access Token（repo権限付き）

---

## デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# まだGitリポジトリを初期化していない場合
git init
git add .
git commit -m "Initial commit"

# GitHubに新しいリポジトリを作成し、プッシュ
git remote add origin https://github.com/YOUR_USERNAME/cnpe-community-l10n-tracker.git
git branch -M main
git push -u origin main
```

### 2. Vercelプロジェクトのセットアップ

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリをインポート
   - リポジトリ一覧から `cnpe-community-l10n-tracker` を選択
   - 「Import」をクリック

### 3. プロジェクト設定

**Framework Preset**: Next.js（自動検出されます）

**Build Settings**:
- Build Command: `prisma generate && next build`
- Output Directory: `.next` （デフォルト）
- Install Command: `npm install` （デフォルト）

**Root Directory**: `./` （デフォルト）

### 4. 環境変数の設定

「Environment Variables」セクションで以下を追加：

| Name | Value | Environment |
|------|-------|-------------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx` | Production, Preview, Development |
| `DATABASE_URL` | （自動設定、次のステップで追加） | Production, Preview, Development |

**GITHUB_TOKEN の取得方法**:
1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token」→「Generate new token (classic)」
3. スコープ: `repo` (or `public_repo` for public repos only)
4. トークンをコピーして Vercel に貼り付け

### 5. Vercel Postgres の追加

1. Vercel ダッシュボードでプロジェクトを選択
2. 「Storage」タブをクリック
3. 「Create Database」→「Postgres」を選択
4. データベース名を入力（例: `l10n-tracker-db`）
5. リージョンを選択（推奨: アプリと同じリージョン）
6. 「Create」をクリック

**自動設定される環境変数**:
```
DATABASE_URL
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
```

> **重要**: Prisma では `DATABASE_URL` または `POSTGRES_PRISMA_URL` を使用してください。

### 6. データベースマイグレーション

Vercel Postgresを追加した後、データベースのテーブルを作成する必要があります。

**オプション A: Vercel CLI を使用**

```bash
# Vercel CLI をインストール（まだの場合）
npm install -g vercel

# ログイン
vercel login

# プロジェクトにリンク
vercel link

# 本番環境変数をプル
vercel env pull .env.production

# データベースマイグレーション
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

**オプション B: Vercel ダッシュボードから SQL を実行**

1. Storage → Postgres → Query タブ
2. 以下のSQLを実行:

```sql
-- Site table
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "contentPath" TEXT NOT NULL,
    "i18nPath" TEXT NOT NULL,
    "configPath" TEXT,
    "baseLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Site_repoOwner_repoName_idx" ON "Site"("repoOwner", "repoName");

-- Language table
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Language_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Language_siteId_code_key" ON "Language"("siteId", "code");
CREATE INDEX "Language_siteId_idx" ON "Language"("siteId");

-- Analysis table
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "totalContentFiles" INTEGER NOT NULL,
    "translatedContentFiles" INTEGER NOT NULL,
    "contentCompletionRate" DOUBLE PRECISION NOT NULL,
    "missingContentFiles" TEXT NOT NULL,
    "totalI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "translatedI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "i18nCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "missingI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "extraI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    CONSTRAINT "Analysis_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Analysis_siteId_languageCode_idx" ON "Analysis"("siteId", "languageCode");
CREATE INDEX "Analysis_analyzedAt_idx" ON "Analysis"("analyzedAt");
```

**オプション C: Prisma Migrate（推奨）**

`package.json` に以下のスクリプトを追加済みです:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Vercel の Build Settings で:
- Build Command: `npm run vercel-build`

これで自動的にマイグレーションが実行されます。

### 7. デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドとデプロイが完了するまで待つ（2-3分）
3. デプロイ完了後、生成されたURLにアクセス

**デプロイURL例**: `https://your-project.vercel.app`

### 8. 動作確認

1. デプロイされたURLにアクセス
2. `/ja` または `/en` にアクセス
3. サイト登録フォームで CNPE Community を登録
4. 分析を実行して結果を確認

---

## 継続的デプロイ

Vercelは自動的にGitHubリポジトリと連携されます：

- **Production デプロイ**: `main` ブランチへのプッシュ
- **Preview デプロイ**: プルリクエスト作成時

### カスタムドメインの設定（オプション）

1. Vercel ダッシュボード → Settings → Domains
2. カスタムドメインを追加（例: `l10n-tracker.yourdomain.com`）
3. DNS設定を更新（Vercelが指示を表示）

---

## トラブルシューティング

### エラー: "GITHUB_TOKEN environment variable is not set"

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercel ダッシュボード → Settings → Environment Variables
2. `GITHUB_TOKEN` を追加
3. 再デプロイ

### エラー: "Can't reach database server"

**原因**: DATABASE_URL が設定されていない、または間違っている

**解決策**:
1. Vercel Postgres が正しく追加されているか確認
2. Environment Variables で `DATABASE_URL` または `POSTGRES_PRISMA_URL` が存在するか確認
3. 再デプロイ

### エラー: "Prisma Client could not be initialized"

**原因**: データベーステーブルが作成されていない

**解決策**:
- 上記「6. データベースマイグレーション」を実行
- または `vercel-build` スクリプトを使用

### ビルドが失敗する

**原因**: 型エラーまたは依存関係の問題

**解決策**:
```bash
# ローカルで確認
npm run type-check
npm run build

# 問題があればログを確認して修正
```

---

## ローカル開発（PostgreSQL使用）

ローカル開発でもPostgreSQLを使いたい場合：

```bash
# Docker で PostgreSQL を起動
docker run --name l10n-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=l10n_tracker -p 5432:5432 -d postgres:15

# .env.local を更新
DATABASE_URL=postgresql://postgres:password@localhost:5432/l10n_tracker

# マイグレーション実行
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

---

## セキュリティのベストプラクティス

1. **GitHub Token の権限を最小化**
   - Public リポジトリのみの場合: `public_repo` スコープのみ
   - Private リポジトリの場合: `repo` スコープ

2. **環境変数の管理**
   - `.env.local` を `.gitignore` に追加済み
   - 本番環境の環境変数は Vercel ダッシュボードでのみ管理

3. **データベースのバックアップ**
   - Vercel Postgres は自動バックアップ対応
   - 重要なデータは定期的にエクスポート

---

## コスト

**Vercel**:
- Hobby プラン: 無料
  - 100GB 帯域幅/月
  - サーバーレス関数実行時間: 100時間/月
- Pro プラン: $20/月（チーム利用の場合）

**Vercel Postgres**:
- Hobby プラン: 無料
  - 256 MB ストレージ
  - 60時間の計算時間/月
- Pro プラン: $24/月
  - 8 GB ストレージ
  - 100時間の計算時間/月

個人利用や小規模チームであれば無料プランで十分です。

---

## 次のステップ

- [Vercel Analytics](https://vercel.com/docs/analytics) でアクセス解析
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) で定期分析の自動実行
- [カスタムドメイン設定](https://vercel.com/docs/projects/domains/add-a-domain)

---

**デプロイ完了！** 🎉

問題があれば、[GitHub Issues](https://github.com/YOUR_USERNAME/cnpe-community-l10n-tracker/issues) で報告してください。
