// 統合パーサー

import { parseToml, extractTomlKeys } from './toml-parser';
import { parseYaml, extractYamlKeys } from './yaml-parser';

/**
 * ファイル拡張子を取得
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * i18nファイルをパースしてキー・バリューのマップを返す
 * TOMLとYAMLの両方をサポート
 */
export function parseI18nFile(content: string, filename: string): Record<string, string> {
  const ext = getFileExtension(filename);

  switch (ext) {
    case 'toml':
      return parseToml(content);
    case 'yaml':
    case 'yml':
      return parseYaml(content);
    default:
      throw new Error(`Unsupported i18n file format: .${ext}`);
  }
}

/**
 * i18nファイルからキー一覧を取得
 */
export function extractI18nKeys(content: string, filename: string): string[] {
  const ext = getFileExtension(filename);

  switch (ext) {
    case 'toml':
      return extractTomlKeys(content);
    case 'yaml':
    case 'yml':
      return extractYamlKeys(content);
    default:
      throw new Error(`Unsupported i18n file format: .${ext}`);
  }
}

/**
 * サポートされているi18nファイル拡張子かチェック
 */
export function isSupportedI18nFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['toml', 'yaml', 'yml'].includes(ext);
}

// Re-export individual parsers for direct use if needed
export { parseToml, extractTomlKeys } from './toml-parser';
export { parseYaml, extractYamlKeys } from './yaml-parser';
