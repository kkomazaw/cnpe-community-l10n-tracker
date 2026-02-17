import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // サポートされているロケールのリスト
  locales,

  // デフォルトロケール
  defaultLocale,

  // ロケールプレフィックスを常に表示
  localePrefix: 'always',
});

export const config = {
  // API routesは除外
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
