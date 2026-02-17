// SiteRepository - サイトデータアクセス層

import { prisma } from '../prisma';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants';
import type { SiteCreateInput, SiteUpdateInput, SiteWithLanguages } from '../types/site.types';

export class SiteRepository {
  /**
   * 全サイト取得
   */
  async findAll(): Promise<SiteWithLanguages[]> {
    return await prisma.site.findMany({
      include: {
        languages: {
          orderBy: { weight: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * IDでサイト取得
   */
  async findById(id: string): Promise<SiteWithLanguages | null> {
    return await prisma.site.findUnique({
      where: { id },
      include: {
        languages: {
          orderBy: { weight: 'asc' },
        },
      },
    });
  }

  /**
   * IDでサイト取得（存在しない場合はエラー）
   */
  async findByIdOrThrow(id: string): Promise<SiteWithLanguages> {
    const site = await this.findById(id);
    if (!site) {
      throw new AppError(
        ERROR_CODES.SITE_NOT_FOUND,
        `Site not found: ${id}`,
        404
      );
    }
    return site;
  }

  /**
   * 名前でサイト取得
   */
  async findByName(name: string): Promise<SiteWithLanguages | null> {
    return await prisma.site.findUnique({
      where: { name },
      include: {
        languages: {
          orderBy: { weight: 'asc' },
        },
      },
    });
  }

  /**
   * サイト作成
   */
  async create(input: SiteCreateInput): Promise<SiteWithLanguages> {
    const { languages, ...siteData } = input;

    // 同名のサイトが存在しないかチェック
    const existing = await this.findByName(input.name);
    if (existing) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Site with name "${input.name}" already exists`,
        400
      );
    }

    return await prisma.site.create({
      data: {
        ...siteData,
        languages: {
          create: languages,
        },
      },
      include: {
        languages: {
          orderBy: { weight: 'asc' },
        },
      },
    });
  }

  /**
   * サイト更新
   */
  async update(id: string, input: SiteUpdateInput): Promise<SiteWithLanguages> {
    // サイトの存在確認
    await this.findByIdOrThrow(id);

    // 名前変更の場合、重複チェック
    if (input.name) {
      const existing = await this.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Site with name "${input.name}" already exists`,
          400
        );
      }
    }

    return await prisma.site.update({
      where: { id },
      data: input,
      include: {
        languages: {
          orderBy: { weight: 'asc' },
        },
      },
    });
  }

  /**
   * サイト削除
   */
  async delete(id: string): Promise<void> {
    // サイトの存在確認
    await this.findByIdOrThrow(id);

    await prisma.site.delete({
      where: { id },
    });
  }

  /**
   * サイト数取得
   */
  async count(): Promise<number> {
    return await prisma.site.count();
  }
}

// シングルトンインスタンス
export const siteRepository = new SiteRepository();
