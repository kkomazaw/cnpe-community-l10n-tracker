import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// サポートされているロケール
export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ locale }) => {
  // ロケールのバリデーション
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
