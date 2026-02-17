// API Route: /api/sites/[id]/analysis
// GET: 分析結果取得

import { NextRequest, NextResponse } from 'next/server';
import { analysisRepository } from '@/lib/repositories/analysis.repository';
import { siteRepository } from '@/lib/repositories/site.repository';
import { handleApiError, createApiResponse, AppError } from '@/lib/utils/errors';

/**
 * GET /api/sites/:id/analysis
 * サイトの最新分析結果を取得
 *
 * Query Parameters:
 * - language: 特定言語の分析結果のみ取得（オプション）
 * - history: 履歴を取得するか（オプション、デフォルト: false）
 * - limit: 履歴取得時の件数制限（オプション、デフォルト: 10）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language');
    const isHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // サイトの存在確認
    await siteRepository.findByIdOrThrow(params.id);

    if (isHistory) {
      // 分析履歴を取得
      const history = await analysisRepository.findHistoryBySiteId(params.id, limit);
      return NextResponse.json(createApiResponse(history));
    }

    if (languageCode) {
      // 特定言語の最新分析結果を取得
      const result = await analysisRepository.findLatestByLanguage(
        params.id,
        languageCode
      );

      if (!result) {
        throw new AppError(
          'SITE_NOT_FOUND',
          `No analysis found for language: ${languageCode}`,
          404
        );
      }

      return NextResponse.json(createApiResponse(result));
    }

    // 全言語の最新分析結果を取得
    const results = await analysisRepository.findLatestBySiteId(params.id);

    return NextResponse.json(createApiResponse(results));
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
