# L10N管理アプリケーション - 技術設計書

## 文書情報
- **バージョン**: 1.0
- **作成日**: 2026年2月16日
- **対象フェーズ**: Phase 1 (MVP)

---

## 1. システムアーキテクチャ

### 1.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Client)                    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Next.js Frontend (React)            │    │
│  │  - Server Components (RSC)                  │    │
│  │  - Client Components (interactivity)        │    │
│  │  - next-intl (i18n)                         │    │
│  └────────────────┬───────────────────────────┘    │
└───────────────────┼──────────────────────────────────┘
                    │ HTTP/JSON
┌───────────────────▼──────────────────────────────────┐
│              Next.js Server (Node.js)                 │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │         API Routes (/app/api/*)              │    │
│  │  - /api/sites                                │    │
│  │  - /api/analyze                              │    │
│  │  - /api/export                               │    │
│  └─────────────┬───────────────────────────────┘    │
│                │                                      │
│  ┌─────────────▼──────────┐  ┌──────────────────┐   │
│  │  Business Logic Layer   │  │  External APIs   │   │
│  │  - GitHubService        │──│  - GitHub API    │   │
│  │  - AnalyzerService      │  │  - Octokit       │   │
│  │  - ExportService        │  └──────────────────┘   │
│  └─────────────┬───────────┘                         │
│                │                                      │
│  ┌─────────────▼───────────────────────────────┐    │
│  │         Data Access Layer (Prisma)          │    │
│  │  - SiteRepository                           │    │
│  │  - AnalysisRepository                       │    │
│  └─────────────┬───────────────────────────────┘    │
└────────────────┼──────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────┐
│              SQLite Database                          │
│  - sites.db (file: ./data/l10n-tracker.db)           │
└───────────────────────────────────────────────────────┘
```

### 1.2 レイヤー分離

#### Presentation Layer (UI)
- **責務**: ユーザーインターフェース、ユーザー操作の受付
- **技術**: React Server Components + Client Components
- **配置**: `src/app/[locale]/`, `src/components/`

#### API Layer
- **責務**: HTTPリクエストの受付、レスポンス生成、バリデーション
- **技術**: Next.js API Routes
- **配置**: `src/app/api/`

#### Business Logic Layer
- **責務**: ビジネスロジック、L10N分析、GitHub連携
- **技術**: TypeScript Classes/Functions
- **配置**: `src/lib/services/`

#### Data Access Layer
- **責務**: データベース操作の抽象化
- **技術**: Prisma ORM
- **配置**: `src/lib/repositories/`, `src/lib/prisma.ts`

#### Data Layer
- **責務**: データの永続化
- **技術**: SQLite
- **配置**: `./data/l10n-tracker.db`

---

## 2. データベース設計

### 2.1 Prismaスキーマ定義

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// サイト情報
model Site {
  id            String   @id @default(cuid())
  name          String   @unique
  repoOwner     String
  repoName      String
  branch        String   @default("main")
  contentPath   String   // 例: "website/content"
  i18nPath      String   // 例: "website/i18n"
  configPath    String?  // 例: "website/config.toml"
  baseLanguage  String   @default("en")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  languages     Language[]
  analyses      Analysis[]

  @@index([repoOwner, repoName])
}

// 対象言語
model Language {
  id            String   @id @default(cuid())
  siteId        String
  code          String   // 例: "ja", "ko", "zh"
  name          String   // 例: "日本語", "한국어", "中文"
  nativeName    String?  // ネイティブ表記
  weight        Int      @default(0) // 表示順

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  site          Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, code])
  @@index([siteId])
}

// 分析結果
model Analysis {
  id                  String   @id @default(cuid())
  siteId              String
  languageCode        String

  // コンテンツファイル分析結果
  totalContentFiles   Int
  translatedContentFiles Int
  contentCompletionRate Float  // 0.0 - 100.0
  missingContentFiles Json     // string[] 未翻訳ファイルパス配列

  // i18n分析結果
  totalI18nKeys       Int      @default(0)
  translatedI18nKeys  Int      @default(0)
  i18nCompletionRate  Float    @default(0.0)
  missingI18nKeys     Json     // string[] 未翻訳キー配列
  extraI18nKeys       Json     // string[] 余剰キー配列

  // メタ情報
  analyzedAt          DateTime @default(now())
  durationMs          Int?     // 分析にかかった時間(ms)
  errorMessage        String?  // エラーがあった場合

  site                Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId, languageCode])
  @@index([analyzedAt])
}

// 分析履歴（オプション - Phase 2で使用）
model AnalysisHistory {
  id                String   @id @default(cuid())
  siteId            String
  languageCode      String
  snapshot          Json     // Analysis のスナップショット
  analyzedAt        DateTime @default(now())

  @@index([siteId, languageCode, analyzedAt])
}
```

### 2.2 データベースリレーション図

```
Site (1) ──────< (N) Language
  │
  └──────< (N) Analysis
```

### 2.3 インデックス戦略

- **Site**: `(repoOwner, repoName)` - リポジトリ検索の高速化
- **Language**: `(siteId)`, `(siteId, code)` - サイト別言語取得の高速化
- **Analysis**: `(siteId, languageCode)`, `(analyzedAt)` - 最新分析結果の取得高速化

---

## 3. API設計

### 3.1 APIエンドポイント一覧

| メソッド | エンドポイント | 説明 | Phase |
|---------|--------------|------|-------|
| GET     | `/api/sites` | サイト一覧取得 | MVP |
| POST    | `/api/sites` | サイト登録 | MVP |
| GET     | `/api/sites/:id` | サイト詳細取得 | MVP |
| PUT     | `/api/sites/:id` | サイト更新 | Phase 2 |
| DELETE  | `/api/sites/:id` | サイト削除 | Phase 2 |
| POST    | `/api/sites/:id/analyze` | L10N分析実行 | MVP |
| GET     | `/api/sites/:id/analysis` | 最新分析結果取得 | MVP |
| GET     | `/api/sites/:id/export` | CSV出力 | MVP |
| GET     | `/api/health` | ヘルスチェック | MVP |

### 3.2 API詳細仕様

#### 3.2.1 サイト登録

**Endpoint**: `POST /api/sites`

**Request Body**:
```json
{
  "name": "CNPE Community",
  "repoOwner": "Cloud-Native-Platform-Engineering",
  "repoName": "cnpe-community",
  "branch": "main",
  "contentPath": "website/content",
  "i18nPath": "website/i18n",
  "configPath": "website/config.toml",
  "baseLanguage": "en",
  "languages": [
    { "code": "ja", "name": "日本語", "weight": 1 },
    { "code": "ko", "name": "한국어", "weight": 2 },
    { "code": "zh", "name": "中文", "weight": 3 }
  ]
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "name": "CNPE Community",
    "createdAt": "2026-02-16T10:00:00Z"
  }
}
```

**Error Response**: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid repository URL",
    "details": { ... }
  }
}
```

#### 3.2.2 L10N分析実行

**Endpoint**: `POST /api/sites/:id/analyze`

**Request Body**: (なし)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "siteId": "clx1234567890",
    "results": [
      {
        "languageCode": "ja",
        "contentCompletionRate": 34.1,
        "totalContentFiles": 41,
        "translatedContentFiles": 14,
        "missingContentFilesCount": 27,
        "i18nCompletionRate": 85.7,
        "totalI18nKeys": 14,
        "translatedI18nKeys": 12,
        "missingI18nKeysCount": 2
      },
      // ... 他の言語
    ],
    "analyzedAt": "2026-02-16T10:05:00Z",
    "durationMs": 2450
  }
}
```

#### 3.2.3 最新分析結果取得

**Endpoint**: `GET /api/sites/:id/analysis`

**Query Parameters**:
- `languageCode` (optional): 特定言語のみ取得

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "clx9876543210",
        "languageCode": "ja",
        "totalContentFiles": 41,
        "translatedContentFiles": 14,
        "contentCompletionRate": 34.1,
        "missingContentFiles": [
          "blog/2024-10-30-paap-mindset.md",
          "blog/2025-01-29-composable.md",
          // ...
        ],
        "totalI18nKeys": 14,
        "translatedI18nKeys": 12,
        "i18nCompletionRate": 85.7,
        "missingI18nKeys": ["ui_select_all", "ui_deselect_all"],
        "extraI18nKeys": [],
        "analyzedAt": "2026-02-16T10:05:00Z"
      }
    ]
  }
}
```

#### 3.2.4 CSV出力

**Endpoint**: `GET /api/sites/:id/export?format=csv`

**Response**: `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="l10n-report_cnpe-community_2026-02-16.csv"

Language,Total Files,Translated Files,Completion Rate (%),Missing Files Count
Japanese,41,14,34.1,27
Korean,41,9,22.0,32
...
```

### 3.3 エラーコード定義

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `VALIDATION_ERROR` | 400 | リクエストパラメータ不正 |
| `SITE_NOT_FOUND` | 404 | サイトが存在しない |
| `GITHUB_API_ERROR` | 502 | GitHub API呼び出し失敗 |
| `RATE_LIMIT_EXCEEDED` | 429 | GitHub APIレート制限 |
| `ANALYSIS_FAILED` | 500 | 分析処理失敗 |
| `INTERNAL_ERROR` | 500 | サーバー内部エラー |

---

## 4. コンポーネント設計

### 4.1 ディレクトリ構成

```
src/
├── app/
│   ├── [locale]/                    # 多言語ルーティング
│   │   ├── page.tsx                 # ダッシュボード (Server Component)
│   │   ├── settings/
│   │   │   └── page.tsx             # サイト設定画面
│   │   ├── layout.tsx               # ルートレイアウト
│   │   └── loading.tsx              # ローディングUI
│   ├── api/                         # API Routes
│   │   ├── sites/
│   │   │   ├── route.ts             # GET /api/sites, POST /api/sites
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET /api/sites/:id
│   │   │       ├── analyze/
│   │   │       │   └── route.ts     # POST /api/sites/:id/analyze
│   │   │       ├── analysis/
│   │   │       │   └── route.ts     # GET /api/sites/:id/analysis
│   │   │       └── export/
│   │   │           └── route.ts     # GET /api/sites/:id/export
│   │   └── health/
│   │       └── route.ts             # GET /api/health
│   ├── layout.tsx                   # グローバルレイアウト
│   └── globals.css                  # グローバルCSS
│
├── components/
│   ├── ui/                          # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── LanguageProgressCard.tsx # 言語別進捗カード
│   │   ├── MissingFilesList.tsx     # 未翻訳ファイルリスト
│   │   ├── I18nKeysList.tsx         # i18n未翻訳キー
│   │   ├── DirectoryTree.tsx        # ディレクトリツリー表示
│   │   └── ProgressChart.tsx        # 進捗グラフ (Recharts)
│   ├── settings/
│   │   ├── SiteForm.tsx             # サイト登録/編集フォーム
│   │   └── LanguageManager.tsx      # 言語管理
│   ├── layout/
│   │   ├── Header.tsx               # ヘッダー
│   │   ├── Sidebar.tsx              # サイドバー (Phase 2)
│   │   └── LanguageSwitcher.tsx     # UI言語切り替え
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── services/
│   │   ├── github.service.ts        # GitHub API クライアント
│   │   ├── analyzer.service.ts      # L10N分析ロジック
│   │   ├── export.service.ts        # CSV出力ロジック
│   │   └── site.service.ts          # サイト管理ロジック
│   ├── repositories/
│   │   ├── site.repository.ts       # Site CRUD
│   │   ├── language.repository.ts   # Language CRUD
│   │   └── analysis.repository.ts   # Analysis CRUD
│   ├── utils/
│   │   ├── parsers/
│   │   │   ├── toml-parser.ts       # TOML解析
│   │   │   ├── yaml-parser.ts       # YAML解析
│   │   │   └── json-parser.ts       # JSON解析
│   │   ├── validators/
│   │   │   └── site-validator.ts    # バリデーション
│   │   └── helpers.ts               # ヘルパー関数
│   ├── types/
│   │   ├── site.types.ts
│   │   ├── analysis.types.ts
│   │   └── github.types.ts
│   ├── prisma.ts                    # Prisma Client シングルトン
│   └── constants.ts                 # 定数定義
│
├── messages/                        # 国際化メッセージ
│   ├── en.json
│   └── ja.json
│
└── middleware.ts                    # Next.js middleware (i18n routing)
```

### 4.2 主要コンポーネント設計

#### 4.2.1 Dashboard Page (Server Component)

```tsx
// src/app/[locale]/page.tsx
import { getSiteWithLatestAnalysis } from '@/lib/services/site.service';
import { LanguageProgressCard } from '@/components/dashboard/LanguageProgressCard';
import { MissingFilesList } from '@/components/dashboard/MissingFilesList';
import { I18nKeysList } from '@/components/dashboard/I18nKeysList';

export default async function DashboardPage() {
  // サーバーサイドでデータ取得
  const siteData = await getSiteWithLatestAnalysis();

  if (!siteData) {
    return <EmptyState />;
  }

  return (
    <div className="container mx-auto p-6">
      <Header />

      {/* 言語別進捗サマリー */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {siteData.analyses.map((analysis) => (
          <LanguageProgressCard key={analysis.languageCode} analysis={analysis} />
        ))}
      </section>

      {/* 未翻訳ファイルリスト (最優先表示) */}
      <section className="mb-8">
        <MissingFilesList analyses={siteData.analyses} />
      </section>

      {/* i18n未翻訳キー */}
      <section>
        <I18nKeysList analyses={siteData.analyses} />
      </section>
    </div>
  );
}
```

#### 4.2.2 LanguageProgressCard (Client Component)

```tsx
// src/components/dashboard/LanguageProgressCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Analysis } from '@/lib/types/analysis.types';

interface Props {
  analysis: Analysis;
}

export function LanguageProgressCard({ analysis }: Props) {
  const { languageCode, contentCompletionRate, translatedContentFiles, totalContentFiles } = analysis;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getLanguageName(languageCode)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">
          {contentCompletionRate.toFixed(1)}%
        </div>
        <Progress value={contentCompletionRate} className="mb-2" />
        <div className="text-sm text-muted-foreground">
          {translatedContentFiles}/{totalContentFiles} files
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4.2.3 MissingFilesList (Client Component)

```tsx
// src/components/dashboard/MissingFilesList.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import type { Analysis } from '@/lib/types/analysis.types';

interface Props {
  analyses: Analysis[];
}

export function MissingFilesList({ analyses }: Props) {
  const [selectedLang, setSelectedLang] = useState(analyses[0]?.languageCode || 'ja');

  const currentAnalysis = analyses.find(a => a.languageCode === selectedLang);
  const missingFiles = currentAnalysis?.missingContentFiles || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>未翻訳ファイル</CardTitle>
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          {analyses.map(a => (
            <option key={a.languageCode} value={a.languageCode}>
              {getLanguageName(a.languageCode)}
            </option>
          ))}
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {missingFiles.length === 0 ? (
            <p className="text-muted-foreground">全てのファイルが翻訳済みです</p>
          ) : (
            <ul className="space-y-1">
              {missingFiles.map((file) => (
                <li key={file} className="flex items-center gap-2 p-2 hover:bg-accent rounded">
                  <input type="checkbox" className="rounded" />
                  <code className="text-sm">{file}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. ビジネスロジック設計

### 5.1 GitHubService

```typescript
// src/lib/services/github.service.ts
import { Octokit } from '@octokit/rest';
import type { GitHubFileTree, GitHubFileContent } from '@/lib/types/github.types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * リポジトリのツリー構造を再帰的に取得
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<GitHubFileTree> {
    try {
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const sha = refData.object.sha;

      const { data: treeData } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: 'true', // 再帰的に取得
      });

      return {
        sha,
        tree: treeData.tree.map(item => ({
          path: item.path || '',
          mode: item.mode || '',
          type: item.type || '',
          sha: item.sha || '',
          size: item.size,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to fetch repository tree: ${error.message}`);
    }
  }

  /**
   * 特定ファイルの内容を取得
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string = 'main'
  ): Promise<GitHubFileContent> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        path: data.path,
        content,
        sha: data.sha,
        size: data.size,
      };
    } catch (error) {
      throw new Error(`Failed to fetch file content: ${error.message}`);
    }
  }

  /**
   * Rate Limit情報を取得
   */
  async getRateLimit() {
    const { data } = await this.octokit.rateLimit.get();
    return data.rate;
  }
}
```

### 5.2 AnalyzerService

```typescript
// src/lib/services/analyzer.service.ts
import { GitHubService } from './github.service';
import { parseToml } from '@/lib/utils/parsers/toml-parser';
import type { Site, Language } from '@prisma/client';
import type { AnalysisResult } from '@/lib/types/analysis.types';

export class AnalyzerService {
  constructor(private githubService: GitHubService) {}

  /**
   * サイト全体のL10N分析を実行
   */
  async analyzeSite(
    site: Site & { languages: Language[] }
  ): Promise<AnalysisResult[]> {
    const startTime = Date.now();

    try {
      // 1. GitHubからリポジトリツリーを取得
      const tree = await this.githubService.getRepositoryTree(
        site.repoOwner,
        site.repoName,
        site.branch
      );

      // 2. ベース言語のファイルリストを抽出
      const baseFiles = this.extractContentFiles(tree, site.contentPath, site.baseLanguage);

      // 3. 各言語の分析を実行
      const results: AnalysisResult[] = [];

      for (const language of site.languages) {
        const result = await this.analyzeLanguage(
          site,
          language,
          tree,
          baseFiles
        );
        results.push(result);
      }

      const durationMs = Date.now() - startTime;

      return results.map(r => ({ ...r, durationMs }));
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * 単一言語の分析
   */
  private async analyzeLanguage(
    site: Site,
    language: Language,
    tree: GitHubFileTree,
    baseFiles: string[]
  ): Promise<AnalysisResult> {
    // コンテンツファイル分析
    const translatedFiles = this.extractContentFiles(tree, site.contentPath, language.code);
    const missingFiles = baseFiles.filter(file => !translatedFiles.includes(file));

    // i18n分析
    const i18nResult = await this.analyzeI18n(site, language.code);

    return {
      languageCode: language.code,
      totalContentFiles: baseFiles.length,
      translatedContentFiles: translatedFiles.length,
      contentCompletionRate: (translatedFiles.length / baseFiles.length) * 100,
      missingContentFiles: missingFiles,
      totalI18nKeys: i18nResult.totalKeys,
      translatedI18nKeys: i18nResult.translatedKeys,
      i18nCompletionRate: i18nResult.completionRate,
      missingI18nKeys: i18nResult.missingKeys,
      extraI18nKeys: i18nResult.extraKeys,
    };
  }

  /**
   * コンテンツディレクトリからMarkdownファイルを抽出
   */
  private extractContentFiles(
    tree: GitHubFileTree,
    contentPath: string,
    languageCode: string
  ): string[] {
    const langContentPath = `${contentPath}/${languageCode}/`;

    return tree.tree
      .filter(item =>
        item.type === 'blob' &&
        item.path.startsWith(langContentPath) &&
        item.path.endsWith('.md')
      )
      .map(item => item.path.replace(langContentPath, ''));
  }

  /**
   * i18nファイルの分析
   */
  private async analyzeI18n(site: Site, languageCode: string): Promise<{
    totalKeys: number;
    translatedKeys: number;
    completionRate: number;
    missingKeys: string[];
    extraKeys: string[];
  }> {
    try {
      // ベース言語のi18nファイルを取得
      const baseI18nPath = `${site.i18nPath}/${site.baseLanguage}.toml`;
      const baseContent = await this.githubService.getFileContent(
        site.repoOwner,
        site.repoName,
        baseI18nPath,
        site.branch
      );
      const baseKeys = Object.keys(parseToml(baseContent.content));

      // 対象言語のi18nファイルを取得
      const langI18nPath = `${site.i18nPath}/${languageCode}.toml`;
      const langContent = await this.githubService.getFileContent(
        site.repoOwner,
        site.repoName,
        langI18nPath,
        site.branch
      );
      const langKeys = Object.keys(parseToml(langContent.content));

      // 差分計算
      const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
      const extraKeys = langKeys.filter(key => !baseKeys.includes(key));

      return {
        totalKeys: baseKeys.length,
        translatedKeys: baseKeys.length - missingKeys.length,
        completionRate: ((baseKeys.length - missingKeys.length) / baseKeys.length) * 100,
        missingKeys,
        extraKeys,
      };
    } catch (error) {
      // i18nファイルが存在しない場合は空として扱う
      return {
        totalKeys: 0,
        translatedKeys: 0,
        completionRate: 0,
        missingKeys: [],
        extraKeys: [],
      };
    }
  }
}
```

### 5.3 ExportService

```typescript
// src/lib/services/export.service.ts
import type { Analysis } from '@prisma/client';

export class ExportService {
  /**
   * CSV形式でエクスポート
   */
  generateCSV(analyses: Analysis[], siteName: string): string {
    const date = new Date().toISOString().split('T')[0];
    let csv = '';

    // ヘッダー
    csv += 'Language,Total Files,Translated Files,Completion Rate (%),Missing Files Count,i18n Completion Rate (%)\n';

    // サマリーデータ
    for (const analysis of analyses) {
      csv += `${analysis.languageCode},`;
      csv += `${analysis.totalContentFiles},`;
      csv += `${analysis.translatedContentFiles},`;
      csv += `${analysis.contentCompletionRate.toFixed(1)},`;
      csv += `${(analysis.missingContentFiles as string[]).length},`;
      csv += `${analysis.i18nCompletionRate.toFixed(1)}\n`;
    }

    csv += '\n';

    // 未翻訳ファイル詳細
    for (const analysis of analyses) {
      csv += `\nMissing Files (${analysis.languageCode}):\n`;
      const missingFiles = analysis.missingContentFiles as string[];
      for (const file of missingFiles) {
        csv += `${file}\n`;
      }
    }

    csv += '\n';

    // 未翻訳i18nキー詳細
    for (const analysis of analyses) {
      csv += `\ni18n Missing Keys (${analysis.languageCode}):\n`;
      const missingKeys = analysis.missingI18nKeys as string[];
      for (const key of missingKeys) {
        csv += `${key}\n`;
      }
    }

    return csv;
  }

  /**
   * CSVファイル名を生成
   */
  generateFilename(siteName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const safeName = siteName.toLowerCase().replace(/\s+/g, '-');
    return `l10n-report_${safeName}_${date}.csv`;
  }
}
```

---

## 6. セキュリティ設計

### 6.1 環境変数管理

```bash
# .env.local (Git管理外)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=file:./data/l10n-tracker.db
NODE_ENV=development
```

```bash
# .env.example (Git管理対象)
GITHUB_TOKEN=your_github_personal_access_token_here
DATABASE_URL=file:./data/l10n-tracker.db
NODE_ENV=development
```

### 6.2 GitHub Token権限

最小権限の原則に従い、以下のスコープのみを付与:
- `repo` (publicリポジトリの場合は `public_repo` のみ)
- `read:org` (組織リポジトリの場合)

### 6.3 入力バリデーション

```typescript
// src/lib/utils/validators/site-validator.ts
import { z } from 'zod';

export const SiteCreateSchema = z.object({
  name: z.string().min(1).max(100),
  repoOwner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(100),
  branch: z.string().min(1).max(100).default('main'),
  contentPath: z.string().min(1),
  i18nPath: z.string().min(1),
  configPath: z.string().optional(),
  baseLanguage: z.string().length(2),
  languages: z.array(z.object({
    code: z.string().length(2),
    name: z.string().min(1),
    weight: z.number().int().min(0).default(0),
  })).min(1),
});

export type SiteCreateInput = z.infer<typeof SiteCreateSchema>;
```

### 6.4 エラーハンドリング

```typescript
// src/lib/utils/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // 予期しないエラー
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}
```

---

## 7. パフォーマンス最適化

### 7.1 キャッシング戦略

```typescript
// 分析結果のキャッシュ（DB保存）
// - 同じサイトを短時間に何度も分析しない
// - 最新の分析結果をDBから取得して表示

// Next.js のキャッシュ活用
export const revalidate = 300; // 5分間キャッシュ
```

### 7.2 データベースクエリ最適化

```typescript
// Prisma のinclude を使った効率的なデータ取得
const site = await prisma.site.findUnique({
  where: { id: siteId },
  include: {
    languages: true,
    analyses: {
      orderBy: { analyzedAt: 'desc' },
      take: 1, // 最新の分析結果のみ
    },
  },
});
```

### 7.3 GitHub API呼び出しの最適化

```typescript
// ツリー全体を一度に取得（recursive=true）
// → 複数回のAPI呼び出しを避ける

// Rate Limit監視
const rateLimit = await githubService.getRateLimit();
if (rateLimit.remaining < 100) {
  throw new AppError('RATE_LIMIT_LOW', 'GitHub API rate limit is low');
}
```

---

## 8. 国際化 (i18n) 設計

### 8.1 next-intl設定

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'ja',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### 8.2 メッセージファイル

```json
// messages/ja.json
{
  "dashboard": {
    "title": "ダッシュボード",
    "missingFiles": "未翻訳ファイル",
    "completionRate": "翻訳完了率",
    "analyze": "分析を実行",
    "export": "CSV出力"
  },
  "languages": {
    "ja": "日本語",
    "ko": "韓国語",
    "zh": "中国語"
  }
}
```

```json
// messages/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "missingFiles": "Missing Files",
    "completionRate": "Completion Rate",
    "analyze": "Run Analysis",
    "export": "Export CSV"
  },
  "languages": {
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese"
  }
}
```

---

## 9. テスト戦略

### 9.1 テストレベル

| レベル | 対象 | ツール | Phase |
|--------|------|--------|-------|
| Unit Test | ビジネスロジック、Utils | Jest | MVP |
| Integration Test | API Routes | Jest + Supertest | Phase 2 |
| E2E Test | UI フロー | Playwright | Phase 2 |

### 9.2 テスト例

```typescript
// __tests__/services/analyzer.service.test.ts
import { AnalyzerService } from '@/lib/services/analyzer.service';
import { GitHubService } from '@/lib/services/github.service';

describe('AnalyzerService', () => {
  it('should analyze content files correctly', async () => {
    const mockGitHubService = {
      getRepositoryTree: jest.fn().mockResolvedValue({
        tree: [
          { path: 'content/en/page1.md', type: 'blob' },
          { path: 'content/ja/page1.md', type: 'blob' },
        ],
      }),
    };

    const analyzer = new AnalyzerService(mockGitHubService as any);
    // テストロジック
  });
});
```

---

## 10. Docker環境設計

### 10.1 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 10.2 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - DATABASE_URL=file:/app/data/l10n-tracker.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  # Phase 2: Redis for caching (optional)
  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"
```

---

## 11. 開発ワークフロー

### 11.1 開発環境セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# .env.local を編集してGITHUB_TOKENを設定

# 3. データベース初期化
npx prisma migrate dev --name init
npx prisma generate

# 4. 開発サーバー起動
npm run dev
```

### 11.2 開発コマンド

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## 12. Phase 1 実装優先順位

1. **Week 1**:
   - プロジェクトセットアップ (Next.js + Prisma + Docker)
   - データベーススキーマ実装
   - GitHubService基本実装

2. **Week 2**:
   - AnalyzerService実装 (コンテンツ + i18n)
   - API Routes実装 (/api/sites, /api/analyze)
   - Repository層実装

3. **Week 3**:
   - ダッシュボードUI実装
   - 未翻訳ファイルリスト表示
   - CSV出力機能

4. **Week 4**:
   - 国際化対応 (日英切り替え)
   - エラーハンドリング
   - テスト・バグ修正

---

**文書バージョン**: 1.0
**作成日**: 2026年2月16日
**対象**: Phase 1 (MVP)
