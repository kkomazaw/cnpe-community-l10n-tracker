// API Route: /api/sites
// GET: サイト一覧取得
// POST: サイト作成

import { NextRequest, NextResponse } from 'next/server';
import { siteRepository } from '@/lib/repositories/site.repository';
import { getGitHubService } from '@/lib/services/github.service';
import { SiteCreateSchema } from '@/lib/utils/validators/site-validator';
import { handleApiError, createApiResponse } from '@/lib/utils/errors';
import { ERROR_CODES } from '@/lib/constants';
import { AppError } from '@/lib/utils/errors';

/**
 * GET /api/sites
 * サイト一覧を取得
 */
export async function GET() {
  try {
    const sites = await siteRepository.findAll();

    return NextResponse.json(createApiResponse(sites));
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/sites
 * 新しいサイトを作成
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const validatedData = SiteCreateSchema.parse(body);

    // GitHubリポジトリの存在確認
    const githubService = getGitHubService();
    const repoExists = await githubService.checkRepository(
      validatedData.repoOwner,
      validatedData.repoName
    );

    if (!repoExists) {
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Repository not found: ${validatedData.repoOwner}/${validatedData.repoName}`,
        404
      );
    }

    // ブランチの存在確認
    const branchExists = await githubService.checkBranch(
      validatedData.repoOwner,
      validatedData.repoName,
      validatedData.branch || 'main'
    );

    if (!branchExists) {
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Branch not found: ${validatedData.branch}`,
        404
      );
    }

    // サイト作成
    const site = await siteRepository.create(validatedData);

    return NextResponse.json(createApiResponse(site), { status: 201 });
  } catch (error) {
    // Zodバリデーションエラー
    if (error instanceof Error && error.name === 'ZodError') {
      const errorResponse = handleApiError(
        new AppError(ERROR_CODES.VALIDATION_ERROR, error.message, 400, error)
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse = handleApiError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
