# 技術設計サマリー

## 設計の重要ポイント

### 1. アーキテクチャの特徴

#### レイヤー分離の徹底
```
UI層 → API層 → ビジネスロジック層 → データアクセス層 → データ層
```

各レイヤーの責務を明確に分離することで:
- **保守性**: 変更の影響範囲を限定
- **テスタビリティ**: 各層を独立してテスト可能
- **拡張性**: 将来的な機能追加が容易

#### Next.js App Routerの活用
- **Server Components**: データ取得をサーバーサイドで実行し、初期表示を高速化
- **Client Components**: インタラクティブな部分のみクライアントで実行
- **API Routes**: バックエンドロジックをNext.js内で完結

---

### 2. データモデル設計の工夫

#### 正規化と柔軟性のバランス

**Site** ← 1:N → **Language**
- サイトごとに異なる言語セットを管理可能
- 将来的な言語追加・削除が容易

**Site** ← 1:N → **Analysis**
- 分析結果を時系列で保存 (Phase 2で履歴機能に拡張可能)
- 言語コードで紐付け (外部キーなしで柔軟性確保)

#### JSON型の活用
```prisma
missingContentFiles  Json  // string[]
missingI18nKeys      Json  // string[]
```

配列データをJSON型で保存することで:
- スキーマ変更なしで詳細データを保存
- クエリのシンプル化
- SQLiteの制約を回避

---

### 3. GitHub API連携の設計

#### 効率的なデータ取得

```typescript
// ツリー全体を一度に取得 (recursive=true)
await octokit.git.getTree({
  tree_sha: sha,
  recursive: 'true', // ← 複数回のAPI呼び出しを回避
});
```

**メリット**:
- API呼び出し回数の削減 (1回のみ)
- Rate Limitの節約
- 分析速度の向上

#### Rate Limit対策

```typescript
const rateLimit = await githubService.getRateLimit();
if (rateLimit.remaining < 100) {
  throw new AppError('RATE_LIMIT_LOW', '...');
}
```

- 分析前にRate Limitをチェック
- 結果をDBにキャッシュして再利用

---

### 4. 分析ロジックの設計

#### 2段階の分析

**Step 1: コンテンツファイル分析**
```typescript
// ベース言語のファイル一覧を取得
const baseFiles = extractContentFiles(tree, 'content/en/');

// 各言語のファイルと比較
const translatedFiles = extractContentFiles(tree, 'content/ja/');
const missingFiles = baseFiles.filter(f => !translatedFiles.includes(f));
```

**Step 2: i18n分析**
```typescript
// TOMLファイルを解析してキーを抽出
const baseKeys = Object.keys(parseToml(baseContent));
const langKeys = Object.keys(parseToml(langContent));

// 差分を計算
const missingKeys = baseKeys.filter(k => !langKeys.includes(k));
```

#### パーサーの抽象化
```typescript
interface Parser {
  parse(content: string): Record<string, any>;
}

class TomlParser implements Parser { ... }
class YamlParser implements Parser { ... }
class JsonParser implements Parser { ... }
```

将来的に異なるフォーマット (YAML, JSON) にも対応可能

---

### 5. UIコンポーネント設計

#### Server Components vs Client Components

**Server Components** (データ取得):
```tsx
// src/app/[locale]/page.tsx
export default async function DashboardPage() {
  const data = await getSiteWithLatestAnalysis(); // サーバーサイド
  return <Dashboard data={data} />;
}
```

**Client Components** (インタラクティブ):
```tsx
'use client';
export function MissingFilesList({ files }) {
  const [selected, setSelected] = useState([]);
  // ユーザー操作の処理
}
```

#### 再利用可能なコンポーネント設計

```
components/
├── ui/               ← 汎用UIコンポーネント (shadcn/ui)
├── dashboard/        ← ダッシュボード専用コンポーネント
├── settings/         ← 設定画面専用コンポーネント
└── shared/           ← 共通コンポーネント (LoadingSpinner等)
```

---

### 6. エラーハンドリング戦略

#### 統一的なエラークラス

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) { ... }
}
```

#### エラーコードの体系化

```typescript
type ErrorCode =
  | 'VALIDATION_ERROR'      // 400
  | 'SITE_NOT_FOUND'        // 404
  | 'GITHUB_API_ERROR'      // 502
  | 'RATE_LIMIT_EXCEEDED'   // 429
  | 'ANALYSIS_FAILED'       // 500
  | 'INTERNAL_ERROR';       // 500
```

#### API統一レスポンス

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

### 7. セキュリティ設計

#### 環境変数の安全な管理

```
.env.local        ← Git管理外 (実際のトークン)
.env.example      ← Git管理対象 (サンプル)
.gitignore        ← .env.local を除外
```

#### 最小権限の原則

GitHub Token:
- `repo` スコープのみ (または `public_repo`)
- 書き込み権限は不要

#### 入力バリデーション

```typescript
// Zodスキーマによるランタイムバリデーション
const SiteCreateSchema = z.object({
  name: z.string().min(1).max(100),
  repoOwner: z.string().min(1).max(100),
  // ...
});
```

---

### 8. パフォーマンス最適化

#### データベースインデックス

```prisma
model Site {
  @@index([repoOwner, repoName])  // リポジトリ検索
}

model Analysis {
  @@index([siteId, languageCode])  // サイト別・言語別取得
  @@index([analyzedAt])            // 最新結果取得
}
```

#### キャッシング戦略

**レベル1: データベースキャッシュ**
- 分析結果をDBに保存
- 同じサイトを短時間に再分析しない

**レベル2: Next.jsキャッシュ (オプション)**
```typescript
export const revalidate = 300; // 5分間キャッシュ
```

**レベル3: Redisキャッシュ (Phase 2)**
- GitHub APIレスポンスのキャッシュ
- セッションデータの保存

---

### 9. 国際化 (i18n) 設計

#### next-intlの活用

```typescript
// middleware.ts
export default createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'ja',
});
```

#### ルーティング

```
/ja          → 日本語ダッシュボード
/ja/settings → 日本語設定画面
/en          → 英語ダッシュボード
/en/settings → 英語設定画面
```

#### メッセージ管理

```json
// messages/ja.json
{
  "dashboard": {
    "title": "ダッシュボード",
    "missingFiles": "未翻訳ファイル"
  }
}
```

```json
// messages/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "missingFiles": "Missing Files"
  }
}
```

---

### 10. 拡張性の確保

#### プラグイン方式のアナライザー

```typescript
interface SiteAnalyzer {
  analyzeSite(site: Site): Promise<AnalysisResult[]>;
}

class HugoAnalyzer implements SiteAnalyzer { ... }
class DocusaurusAnalyzer implements SiteAnalyzer { ... } // Phase 2

// Factory Pattern
function createAnalyzer(siteType: string): SiteAnalyzer {
  switch (siteType) {
    case 'hugo': return new HugoAnalyzer();
    case 'docusaurus': return new DocusaurusAnalyzer();
  }
}
```

#### 設定の外部化

```prisma
model Site {
  siteType      String?  // "hugo", "docusaurus", etc.
  config        Json?    // サイトタイプ固有の設定
}
```

---

### 11. テスト戦略

#### テストピラミッド

```
        /\
       /  \   E2E Tests (少)
      /____\
     /      \  Integration Tests (中)
    /________\
   /          \ Unit Tests (多)
  /__________\
```

#### ユニットテスト例

```typescript
describe('AnalyzerService', () => {
  it('should calculate completion rate correctly', () => {
    const baseFiles = ['a.md', 'b.md', 'c.md'];
    const translatedFiles = ['a.md', 'b.md'];

    const rate = calculateCompletionRate(translatedFiles, baseFiles);

    expect(rate).toBe(66.7);
  });
});
```

---

### 12. 開発ワークフロー

#### Git Branch戦略

```
main          ← 本番環境 (Phase 1完成後)
  └── develop ← 開発環境
       ├── feature/setup
       ├── feature/github-service
       ├── feature/analyzer
       └── feature/dashboard-ui
```

#### コミットメッセージ規約

```
feat: GitHub APIクライアント実装
fix: 分析結果のキャッシュバグ修正
docs: API仕様ドキュメント追加
refactor: AnalyzerServiceのリファクタリング
test: AnalyzerServiceのユニットテスト追加
```

---

## 設計上の重要な決定事項

### ✅ 採用した技術・パターン

| 項目 | 採用理由 |
|------|---------|
| **Next.js App Router** | Server Components活用、API Routesで完結、最新のベストプラクティス |
| **SQLite** | セットアップ簡単、個人利用に十分、ファイルベースで可搬性高い |
| **Prisma ORM** | TypeScript完全サポート、スキーマ駆動開発、マイグレーション管理 |
| **shadcn/ui** | カスタマイズ容易、コピペベース、依存関係最小 |
| **next-intl** | App Router対応、型安全、SSR/SSG両対応 |
| **Octokit** | GitHub公式SDK、型定義完備、認証・Rate Limit処理組み込み |

### ❌ 採用しなかった技術・理由

| 技術 | 不採用理由 |
|------|----------|
| **PostgreSQL** | 個人利用にはオーバースペック、Dockerセットアップ複雑化 |
| **tRPC** | Next.js API Routesで十分、学習コスト不要 |
| **SWR/React Query** | Server Components主体のためクライアント状態管理最小限 |
| **Tailwind UI** | 有料、shadcn/uiで十分 |

---

## 次のステップ: 実装フェーズへ

### Week 1: 基盤構築
1. Next.jsプロジェクト初期化
2. Prismaセットアップ
3. Docker環境構築
4. shadcn/ui導入

### Week 2: コアロジック実装
1. GitHubService実装
2. AnalyzerService実装
3. Repository層実装
4. API Routes実装

### Week 3: UI実装
1. ダッシュボード画面
2. 未翻訳ファイルリスト
3. 進捗グラフ
4. サイト設定画面

### Week 4: 仕上げ
1. CSV出力機能
2. 国際化対応
3. エラーハンドリング
4. テスト・バグ修正

---

**準備完了: 実装フェーズに移行できます**

---

**文書作成日**: 2026年2月16日
