// Site関連の型定義

import { Site, Language } from '@prisma/client';

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

export interface SiteWithLanguages extends Site {
  languages: Language[];
}
