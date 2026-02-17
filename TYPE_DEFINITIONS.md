# TypeScript 型定義一覧

## 1. 共通型定義

### 1.1 API Response Types

```typescript
// src/lib/types/api.types.ts

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'SITE_NOT_FOUND'
  | 'GITHUB_API_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ANALYSIS_FAILED'
  | 'INTERNAL_ERROR';
```

---

## 2. Site関連の型定義

```typescript
// src/lib/types/site.types.ts

export interface SiteCreateInput {
  name: string;
  repoOwner: string;
  repoName: string;
  branch?: string;
  contentPath: string;
  i18nPath: string;
  configPath?: string;
  baseLanguage?: string;
  languages: LanguageInput[];
}

export interface LanguageInput {
  code: string;
  name: string;
  nativeName?: string;
  weight?: number;
}

export interface SiteUpdateInput {
  name?: string;
  branch?: string;
  contentPath?: string;
  i18nPath?: string;
  configPath?: string;
}

export interface SiteWithLanguages {
  id: string;
  name: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  contentPath: string;
  i18nPath: string;
  configPath: string | null;
  baseLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  languages: Language[];
}

export interface Language {
  id: string;
  siteId: string;
  code: string;
  name: string;
  nativeName: string | null;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Analysis関連の型定義

```typescript
// src/lib/types/analysis.types.ts

export interface AnalysisResult {
  languageCode: string;

  // コンテンツファイル分析結果
  totalContentFiles: number;
  translatedContentFiles: number;
  contentCompletionRate: number; // 0-100
  missingContentFiles: string[];

  // i18n分析結果
  totalI18nKeys: number;
  translatedI18nKeys: number;
  i18nCompletionRate: number; // 0-100
  missingI18nKeys: string[];
  extraI18nKeys: string[];

  // メタ情報
  durationMs?: number;
  errorMessage?: string;
}

export interface AnalysisWithMetadata extends AnalysisResult {
  id: string;
  siteId: string;
  analyzedAt: Date;
}

export interface LanguageAnalysisSummary {
  languageCode: string;
  languageName: string;
  contentCompletionRate: number;
  i18nCompletionRate: number;
  totalMissingFiles: number;
  totalMissingKeys: number;
  lastAnalyzedAt: Date | null;
}

export interface SiteAnalysisSummary {
  siteId: string;
  siteName: string;
  totalLanguages: number;
  averageContentCompletionRate: number;
  averageI18nCompletionRate: number;
  languages: LanguageAnalysisSummary[];
  lastAnalyzedAt: Date | null;
}
```

---

## 4. GitHub関連の型定義

```typescript
// src/lib/types/github.types.ts

export interface GitHubFileTree {
  sha: string;
  tree: GitHubTreeItem[];
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface GitHubFileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}
```

---

## 5. Export関連の型定義

```typescript
// src/lib/types/export.types.ts

export type ExportFormat = 'csv' | 'json' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  includeDetails?: boolean;
  languageCodes?: string[];
}

export interface CSVRow {
  language: string;
  totalFiles: number;
  translatedFiles: number;
  completionRate: string;
  missingFilesCount: number;
  i18nCompletionRate: string;
}

export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
}
```

---

## 6. UI Component Props型定義

```typescript
// src/lib/types/component.types.ts

export interface DashboardProps {
  siteId: string;
  analyses: AnalysisWithMetadata[];
  languages: Language[];
}

export interface LanguageProgressCardProps {
  analysis: AnalysisWithMetadata;
  languageName: string;
}

export interface MissingFilesListProps {
  analyses: AnalysisWithMetadata[];
  languages: Language[];
  onFileSelect?: (file: string, languageCode: string) => void;
}

export interface I18nKeysListProps {
  analyses: AnalysisWithMetadata[];
  languages: Language[];
  showExtraKeys?: boolean;
}

export interface DirectoryTreeProps {
  files: string[];
  translatedFiles: string[];
  baseDirectory: string;
}

export interface ProgressChartProps {
  data: Array<{
    language: string;
    contentRate: number;
    i18nRate: number;
  }>;
}

export interface SiteFormProps {
  initialData?: SiteWithLanguages;
  onSubmit: (data: SiteCreateInput) => Promise<void>;
  onCancel?: () => void;
}

export interface LanguageManagerProps {
  siteId: string;
  languages: Language[];
  onUpdate: (languages: LanguageInput[]) => Promise<void>;
}
```

---

## 7. Parser関連の型定義

```typescript
// src/lib/types/parser.types.ts

export interface I18nFile {
  [key: string]: string | I18nFile;
}

export interface ParsedI18n {
  keys: string[];
  values: Record<string, string>;
}

export interface HugoConfig {
  baseURL?: string;
  title?: string;
  defaultContentLanguage?: string;
  languages?: Record<string, HugoLanguageConfig>;
}

export interface HugoLanguageConfig {
  languageName?: string;
  weight?: number;
  contentDir?: string;
  [key: string]: unknown;
}
```

---

## 8. Service関連の型定義

```typescript
// src/lib/types/service.types.ts

export interface AnalyzeOptions {
  forceRefresh?: boolean;
  languageCodes?: string[];
}

export interface GitHubServiceConfig {
  token: string;
  timeout?: number;
  retryCount?: number;
}

export interface CacheOptions {
  ttl?: number; // seconds
  key?: string;
}

export interface AnalyzerProgress {
  currentLanguage: string;
  completedLanguages: number;
  totalLanguages: number;
  currentStep: string;
}
```

---

## 9. Repository関連の型定義

```typescript
// src/lib/types/repository.types.ts

export interface FindOptions<T> {
  where?: Partial<T>;
  include?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}

export interface CreateOptions<T> {
  data: T;
  include?: Record<string, boolean>;
}

export interface UpdateOptions<T> {
  where: { id: string };
  data: Partial<T>;
  include?: Record<string, boolean>;
}

export interface DeleteOptions {
  where: { id: string };
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 10. Utility型定義

```typescript
// src/lib/types/utils.types.ts

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

export type PickRequired<T, K extends keyof T> =
  T & Required<Pick<T, K>>;

export type PickOptional<T, K extends keyof T> =
  Omit<T, K> & Partial<Pick<T, K>>;
```

---

## 11. Validation Schema型定義

```typescript
// src/lib/types/validation.types.ts
import { z } from 'zod';

// Site Creation Schema
export const SiteCreateSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100),
  repoOwner: z.string().min(1, 'Repository owner is required').max(100),
  repoName: z.string().min(1, 'Repository name is required').max(100),
  branch: z.string().min(1).max(100).default('main'),
  contentPath: z.string().min(1, 'Content path is required'),
  i18nPath: z.string().min(1, 'i18n path is required'),
  configPath: z.string().optional(),
  baseLanguage: z.string().length(2, 'Language code must be 2 characters'),
  languages: z.array(
    z.object({
      code: z.string().length(2),
      name: z.string().min(1),
      nativeName: z.string().optional(),
      weight: z.number().int().min(0).default(0),
    })
  ).min(1, 'At least one language is required'),
});

// Site Update Schema
export const SiteUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  branch: z.string().min(1).max(100).optional(),
  contentPath: z.string().min(1).optional(),
  i18nPath: z.string().min(1).optional(),
  configPath: z.string().optional(),
});

// Language Schema
export const LanguageSchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1),
  nativeName: z.string().optional(),
  weight: z.number().int().min(0).default(0),
});

// Export Schema
export const ExportOptionsSchema = z.object({
  format: z.enum(['csv', 'json', 'markdown']).default('csv'),
  includeDetails: z.boolean().default(true),
  languageCodes: z.array(z.string().length(2)).optional(),
});

// Infer types from schemas
export type SiteCreateInput = z.infer<typeof SiteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof SiteUpdateSchema>;
export type LanguageInput = z.infer<typeof LanguageSchema>;
export type ExportOptionsInput = z.infer<typeof ExportOptionsSchema>;
```

---

## 12. 国際化メッセージ型定義

```typescript
// src/lib/types/i18n.types.ts

export type Locale = 'en' | 'ja';

export interface Messages {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
  };
  dashboard: {
    title: string;
    missingFiles: string;
    i18nKeys: string;
    completionRate: string;
    analyze: string;
    export: string;
    lastAnalyzed: string;
  };
  site: {
    name: string;
    repository: string;
    branch: string;
    contentPath: string;
    i18nPath: string;
    baseLanguage: string;
    add: string;
    edit: string;
    delete: string;
  };
  languages: {
    ja: string;
    ko: string;
    zh: string;
    de: string;
    es: string;
    fr: string;
  };
  analysis: {
    running: string;
    completed: string;
    failed: string;
    totalFiles: string;
    translatedFiles: string;
    missingFiles: string;
  };
  errors: {
    validation: string;
    siteNotFound: string;
    githubApiError: string;
    rateLimitExceeded: string;
    analysisFailed: string;
    internalError: string;
  };
}
```

---

## 13. Environment Variables型定義

```typescript
// src/lib/types/env.types.ts

export interface EnvVariables {
  GITHUB_TOKEN: string;
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: string;
  NEXT_PUBLIC_API_URL?: string;
}

// Runtime validation
export function validateEnv(): EnvVariables {
  const requiredEnvVars = ['GITHUB_TOKEN', 'DATABASE_URL'];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: process.env.PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };
}
```

---

## 14. 使用例

### API Route での使用例

```typescript
// src/app/api/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SiteCreateSchema } from '@/lib/types/validation.types';
import type { ApiResponse } from '@/lib/types/api.types';
import type { SiteWithLanguages } from '@/lib/types/site.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = SiteCreateSchema.parse(body);

    // Business logic...
    const site: SiteWithLanguages = await createSite(validatedData);

    const response: ApiResponse<SiteWithLanguages> = {
      success: true,
      data: site,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }
}
```

### Component での使用例

```typescript
// src/components/dashboard/LanguageProgressCard.tsx
import type { LanguageProgressCardProps } from '@/lib/types/component.types';

export function LanguageProgressCard({ analysis, languageName }: LanguageProgressCardProps) {
  const { contentCompletionRate, translatedContentFiles, totalContentFiles } = analysis;

  return (
    <div>
      <h3>{languageName}</h3>
      <p>{contentCompletionRate.toFixed(1)}%</p>
      <p>{translatedContentFiles} / {totalContentFiles} files</p>
    </div>
  );
}
```

---

**文書バージョン**: 1.0
**作成日**: 2026年2月16日
