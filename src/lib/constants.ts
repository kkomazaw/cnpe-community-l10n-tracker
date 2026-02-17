// Supported locales
export const LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

// Default locale
export const DEFAULT_LOCALE: Locale = 'ja';

// Language names
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
};

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
