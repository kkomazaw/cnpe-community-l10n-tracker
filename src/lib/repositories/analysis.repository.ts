// AnalysisRepository - 分析結果データアクセス層

import { prisma } from '../prisma';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants';
import type { AnalysisResult, AnalysisWithMetadata } from '../types/analysis.types';
import type { Analysis } from '@prisma/client';

export class AnalysisRepository {
  /**
   * 分析結果を保存
   */
  async create(siteId: string, result: AnalysisResult): Promise<Analysis> {
    return await prisma.analysis.create({
      data: {
        siteId,
        languageCode: result.languageCode,
        totalContentFiles: result.totalContentFiles,
        translatedContentFiles: result.translatedContentFiles,
        contentCompletionRate: result.contentCompletionRate,
        missingContentFiles: JSON.stringify(result.missingContentFiles),
        totalI18nKeys: result.totalI18nKeys,
        translatedI18nKeys: result.translatedI18nKeys,
        i18nCompletionRate: result.i18nCompletionRate,
        missingI18nKeys: JSON.stringify(result.missingI18nKeys),
        extraI18nKeys: JSON.stringify(result.extraI18nKeys),
        durationMs: result.durationMs,
        errorMessage: result.errorMessage,
      },
    });
  }

  /**
   * サイトの最新分析結果を取得
   */
  async findLatestBySiteId(siteId: string): Promise<AnalysisWithMetadata[]> {
    const analyses = await prisma.analysis.findMany({
      where: { siteId },
      orderBy: { analyzedAt: 'desc' },
      take: 100, // 言語数分取得
    });

    // 言語ごとに最新のものだけを抽出
    const latestByLanguage = new Map<string, Analysis>();
    for (const analysis of analyses) {
      if (!latestByLanguage.has(analysis.languageCode)) {
        latestByLanguage.set(analysis.languageCode, analysis);
      }
    }

    return Array.from(latestByLanguage.values()).map((a) => this.parseAnalysis(a));
  }

  /**
   * 特定言語の最新分析結果を取得
   */
  async findLatestByLanguage(
    siteId: string,
    languageCode: string
  ): Promise<AnalysisWithMetadata | null> {
    const analysis = await prisma.analysis.findFirst({
      where: {
        siteId,
        languageCode,
      },
      orderBy: { analyzedAt: 'desc' },
    });

    return analysis ? this.parseAnalysis(analysis) : null;
  }

  /**
   * サイトの分析履歴を取得
   */
  async findHistoryBySiteId(
    siteId: string,
    limit: number = 10
  ): Promise<AnalysisWithMetadata[]> {
    const analyses = await prisma.analysis.findMany({
      where: { siteId },
      orderBy: { analyzedAt: 'desc' },
      take: limit,
    });

    return analyses.map((a) => this.parseAnalysis(a));
  }

  /**
   * 古い分析結果を削除（最新N件を残す）
   */
  async deleteOldAnalyses(siteId: string, keepCount: number = 100): Promise<number> {
    // 最新N件のIDを取得
    const recentAnalyses = await prisma.analysis.findMany({
      where: { siteId },
      orderBy: { analyzedAt: 'desc' },
      take: keepCount,
      select: { id: true },
    });

    const recentIds = recentAnalyses.map((a) => a.id);

    // それ以外を削除
    const result = await prisma.analysis.deleteMany({
      where: {
        siteId,
        id: {
          notIn: recentIds,
        },
      },
    });

    return result.count;
  }

  /**
   * JSON文字列をパース
   */
  private parseAnalysis(analysis: Analysis): AnalysisWithMetadata {
    return {
      ...analysis,
      missingContentFiles: this.parseJsonArray(analysis.missingContentFiles),
      missingI18nKeys: this.parseJsonArray(analysis.missingI18nKeys),
      extraI18nKeys: this.parseJsonArray(analysis.extraI18nKeys),
    };
  }

  /**
   * JSON文字列を配列にパース
   */
  private parseJsonArray(jsonString: string): string[] {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

// シングルトンインスタンス
export const analysisRepository = new AnalysisRepository();
