// TOMLパーサー

import * as TOML from '@iarna/toml';

export interface ParsedI18n {
  [key: string]: string | ParsedI18n;
}

/**
 * TOML文字列をパースしてフラットなキー・バリューに変換
 */
export function parseToml(content: string): Record<string, string> {
  try {
    const parsed = TOML.parse(content) as ParsedI18n;
    return flattenObject(parsed);
  } catch (error) {
    throw new Error(`Failed to parse TOML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ネストされたオブジェクトをフラット化
 * 例: { a: { b: "value" } } -> { "a.b": "value" }
 */
function flattenObject(obj: ParsedI18n, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // ネストされたオブジェクトを再帰的にフラット化
      Object.assign(result, flattenObject(value as ParsedI18n, newKey));
    } else {
      // プリミティブ値は文字列に変換
      result[newKey] = String(value);
    }
  }

  return result;
}

/**
 * TOMLファイルからキー一覧を取得
 */
export function extractTomlKeys(content: string): string[] {
  const parsed = parseToml(content);
  return Object.keys(parsed);
}
