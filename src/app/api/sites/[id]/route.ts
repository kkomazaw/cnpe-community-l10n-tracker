// API Route: /api/sites/[id]
// GET: サイト詳細取得
// PUT: サイト更新 (Phase 2)
// DELETE: サイト削除 (Phase 2)

import { NextRequest, NextResponse } from 'next/server';
import { siteRepository } from '@/lib/repositories/site.repository';
import { handleApiError, createApiResponse } from '@/lib/utils/errors';
import { AppError } from '@/lib/utils/errors';

/**
 * GET /api/sites/:id
 * サイト詳細を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const site = await siteRepository.findByIdOrThrow(params.id);

    return NextResponse.json(createApiResponse(site));
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
