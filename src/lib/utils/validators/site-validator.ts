// Site バリデーションスキーマ

import { z } from 'zod';

// Language Schema
export const LanguageSchema = z.object({
  code: z.string().length(2, 'Language code must be 2 characters'),
  name: z.string().min(1, 'Language name is required'),
  nativeName: z.string().optional(),
  weight: z.number().int().min(0).default(0),
});

// Site Create Schema
export const SiteCreateSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100),
  repoOwner: z.string().min(1, 'Repository owner is required').max(100),
  repoName: z.string().min(1, 'Repository name is required').max(100),
  branch: z.string().min(1).max(100).default('main'),
  contentPath: z.string().min(1, 'Content path is required'),
  i18nPath: z.string().min(1, 'i18n path is required'),
  configPath: z.string().optional(),
  baseLanguage: z.string().length(2, 'Base language code must be 2 characters').default('en'),
  languages: z
    .array(LanguageSchema)
    .min(1, 'At least one language is required')
    .refine(
      (languages) => {
        const codes = languages.map((l) => l.code);
        return new Set(codes).size === codes.length;
      },
      {
        message: 'Language codes must be unique',
      }
    ),
});

// Site Update Schema
export const SiteUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  branch: z.string().min(1).max(100).optional(),
  contentPath: z.string().min(1).optional(),
  i18nPath: z.string().min(1).optional(),
  configPath: z.string().optional(),
});

// 型推論
export type SiteCreateInput = z.infer<typeof SiteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof SiteUpdateSchema>;
export type LanguageInput = z.infer<typeof LanguageSchema>;
