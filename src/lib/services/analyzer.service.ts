// AnalyzerService: L10N分析ロジック

import { getGitHubService } from './github.service';
import { siteRepository } from '../repositories/site.repository';
import { analysisRepository } from '../repositories/analysis.repository';
import { parseI18nFile, isSupportedI18nFile } from '../utils/parsers';
import { AppError } from '../utils/errors';
import type { SiteWithLanguages } from '../types/site.types';
import type { AnalysisResult } from '../types/analysis.types';
import type { GitHubFileTree } from '../types/github.types';

/**
 * L10N分析サービス
 */
export class AnalyzerService {
  private githubService = getGitHubService();

  /**
   * サイト全体のL10N分析を実行
   */
  async analyzeSite(siteId: string): Promise<AnalysisResult[]> {
    const startTime = Date.now();

    // サイト情報を取得
    const site = await siteRepository.findByIdOrThrow(siteId);

    // リポジトリのツリー構造を取得
    const tree = await this.githubService.getRepositoryTree(
      site.repoOwner,
      site.repoName,
      site.branch
    );

    // 各言語を分析
    const results: AnalysisResult[] = [];
    for (const language of site.languages) {
      if (language.code === site.baseLanguage) {
        // 基準言語はスキップ
        continue;
      }

      try {
        const result = await this.analyzeLanguage(site, language.code, tree);
        result.durationMs = Date.now() - startTime;
        results.push(result);

        // データベースに保存
        await analysisRepository.create(siteId, result);
      } catch (error) {
        console.error(`Failed to analyze language ${language.code}:`, error);
        results.push({
          languageCode: language.code,
          totalContentFiles: 0,
          translatedContentFiles: 0,
          contentCompletionRate: 0,
          missingContentFiles: [],
          totalI18nKeys: 0,
          translatedI18nKeys: 0,
          i18nCompletionRate: 0,
          missingI18nKeys: [],
          extraI18nKeys: [],
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 古い分析結果を削除（最新10件を保持）
    await analysisRepository.deleteOldAnalyses(siteId, 10);

    return results;
  }

  /**
   * 特定言語の分析を実行
   */
  private async analyzeLanguage(
    site: SiteWithLanguages,
    languageCode: string,
    tree: GitHubFileTree
  ): Promise<AnalysisResult> {
    // コンテンツファイル分析
    const contentAnalysis = await this.analyzeContentFiles(
      site,
      languageCode,
      tree
    );

    // i18n分析
    const i18nAnalysis = await this.analyzeI18nFiles(
      site,
      languageCode
    );

    return {
      languageCode,
      ...contentAnalysis,
      ...i18nAnalysis,
    };
  }

  /**
   * コンテンツファイルの分析
   */
  private async analyzeContentFiles(
    site: SiteWithLanguages,
    languageCode: string,
    tree: GitHubFileTree
  ): Promise<{
    totalContentFiles: number;
    translatedContentFiles: number;
    contentCompletionRate: number;
    missingContentFiles: string[];
  }> {
    // 基準言語のコンテンツファイルを取得
    const baseFiles = this.extractContentFiles(
      tree,
      site.contentPath,
      site.baseLanguage
    );

    // 対象言語のコンテンツファイルを取得
    const targetFiles = this.extractContentFiles(
      tree,
      site.contentPath,
      languageCode
    );

    // 対象言語に存在しないファイルを特定
    const missingFiles = baseFiles.filter(
      (baseFile) => !targetFiles.includes(baseFile)
    );

    const totalFiles = baseFiles.length;
    const translatedFiles = totalFiles - missingFiles.length;
    const completionRate = totalFiles > 0 ? (translatedFiles / totalFiles) * 100 : 0;

    return {
      totalContentFiles: totalFiles,
      translatedContentFiles: translatedFiles,
      contentCompletionRate: Math.round(completionRate * 100) / 100,
      missingContentFiles: missingFiles,
    };
  }

  /**
   * i18nファイルの分析
   */
  private async analyzeI18nFiles(
    site: SiteWithLanguages,
    languageCode: string
  ): Promise<{
    totalI18nKeys: number;
    translatedI18nKeys: number;
    i18nCompletionRate: number;
    missingI18nKeys: string[];
    extraI18nKeys: string[];
  }> {
    try {
      // i18nファイルのパスを構築
      const baseI18nPath = this.buildI18nFilePath(site.i18nPath, site.baseLanguage);
      const targetI18nPath = this.buildI18nFilePath(site.i18nPath, languageCode);

      // 基準言語のi18nファイルを取得してパース
      const baseContent = await this.githubService.getFileContent(
        site.repoOwner,
        site.repoName,
        baseI18nPath,
        site.branch
      );
      const baseKeys = parseI18nFile(baseContent.content, baseI18nPath);

      // 対象言語のi18nファイルを取得してパース
      let targetKeys: Record<string, string> = {};
      try {
        const targetContent = await this.githubService.getFileContent(
          site.repoOwner,
          site.repoName,
          targetI18nPath,
          site.branch
        );
        targetKeys = parseI18nFile(targetContent.content, targetI18nPath);
      } catch (error) {
        // ファイルが存在しない場合は空とみなす
        console.warn(`i18n file not found for ${languageCode}: ${targetI18nPath}`);
      }

      // キーの比較
      const baseKeySet = new Set(Object.keys(baseKeys));
      const targetKeySet = new Set(Object.keys(targetKeys));

      const missingKeys = Array.from(baseKeySet).filter(
        (key) => !targetKeySet.has(key)
      );
      const extraKeys = Array.from(targetKeySet).filter(
        (key) => !baseKeySet.has(key)
      );

      const totalKeys = baseKeySet.size;
      const translatedKeys = totalKeys - missingKeys.length;
      const completionRate = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

      return {
        totalI18nKeys: totalKeys,
        translatedI18nKeys: translatedKeys,
        i18nCompletionRate: Math.round(completionRate * 100) / 100,
        missingI18nKeys: missingKeys,
        extraI18nKeys: extraKeys,
      };
    } catch (error) {
      console.error('Failed to analyze i18n files:', error);
      return {
        totalI18nKeys: 0,
        translatedI18nKeys: 0,
        i18nCompletionRate: 0,
        missingI18nKeys: [],
        extraI18nKeys: [],
      };
    }
  }

  /**
   * ツリーからコンテンツファイル（.md）を抽出
   * contentPath/languageCode/ 配下のファイルを取得
   */
  private extractContentFiles(
    tree: GitHubFileTree,
    contentPath: string,
    languageCode: string
  ): string[] {
    const languageContentPath = `${contentPath}/${languageCode}/`;

    return tree.tree
      .filter((item) => {
        return (
          item.type === 'blob' &&
          item.path.startsWith(languageContentPath) &&
          item.path.endsWith('.md')
        );
      })
      .map((item) => {
        // 言語ディレクトリ以降の相対パスを返す
        return item.path.substring(languageContentPath.length);
      })
      .sort();
  }

  /**
   * i18nファイルパスを構築
   * i18nPath/languageCode.{toml|yaml|yml} の形式
   */
  private buildI18nFilePath(i18nPath: string, languageCode: string): string {
    // サポートされている拡張子で試行
    const extensions = ['toml', 'yaml', 'yml'];

    // デフォルトはTOML（Hugoの標準）
    return `${i18nPath}/${languageCode}.${extensions[0]}`;
  }
}

/**
 * シングルトンインスタンス
 */
export const analyzerService = new AnalyzerService();
