// API Route: /api/sites/[id]/analyze
// POST: L10N分析実行

import { NextRequest, NextResponse } from 'next/server';
import { analyzerService } from '@/lib/services/analyzer.service';
import { handleApiError, createApiResponse, AppError } from '@/lib/utils/errors';

/**
 * POST /api/sites/:id/analyze
 * サイトのL10N分析を実行
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startTime = Date.now();

    // L10N分析実行
    const results = await analyzerService.analyzeSite(params.id);

    const duration = Date.now() - startTime;

    return NextResponse.json(
      createApiResponse({
        results,
        summary: {
          totalLanguages: results.length,
          analyzedAt: new Date().toISOString(),
          durationMs: duration,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
