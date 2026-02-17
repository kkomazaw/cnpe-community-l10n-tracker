// Analysis関連の型定義

import { Analysis } from '@prisma/client';

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

export interface AnalysisWithMetadata extends Omit<Analysis, 'missingContentFiles' | 'missingI18nKeys' | 'extraI18nKeys'> {
  missingContentFiles: string[];
  missingI18nKeys: string[];
  extraI18nKeys: string[];
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
