// CSV エクスポートユーティリティ

import type { AnalysisWithMetadata } from '../types/analysis.types';
import type { SiteWithLanguages } from '../types/site.types';

/**
 * 分析結果をCSV形式に変換
 */
export function analysisToCSV(
  site: SiteWithLanguages,
  analyses: AnalysisWithMetadata[]
): string {
  const headers = [
    'Site Name',
    'Repository',
    'Language Code',
    'Language Name',
    'Analyzed At',
    'Total Content Files',
    'Translated Content Files',
    'Content Completion (%)',
    'Missing Content Files',
    'Total i18n Keys',
    'Translated i18n Keys',
    'i18n Completion (%)',
    'Missing i18n Keys',
    'Extra i18n Keys',
  ];

  const rows = analyses.map((analysis) => {
    const language = site.languages.find((l) => l.code === analysis.languageCode);

    return [
      site.name,
      `${site.repoOwner}/${site.repoName}`,
      analysis.languageCode,
      language?.name || analysis.languageCode,
      new Date(analysis.analyzedAt).toISOString(),
      analysis.totalContentFiles.toString(),
      analysis.translatedContentFiles.toString(),
      analysis.contentCompletionRate.toFixed(2),
      `"${analysis.missingContentFiles.join('; ')}"`,
      analysis.totalI18nKeys.toString(),
      analysis.translatedI18nKeys.toString(),
      analysis.i18nCompletionRate.toFixed(2),
      `"${analysis.missingI18nKeys.join('; ')}"`,
      `"${analysis.extraI18nKeys.join('; ')}"`,
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * 分析結果をCSVとしてエクスポート
 */
export function exportAnalysisToCSV(
  site: SiteWithLanguages,
  analyses: AnalysisWithMetadata[]
): void {
  const csv = analysisToCSV(site, analyses);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `l10n-analysis-${site.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;

  downloadCSV(filename, csv);
}
