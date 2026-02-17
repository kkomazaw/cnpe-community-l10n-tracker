// YAMLパーサー

import * as yaml from 'js-yaml';

export interface ParsedI18n {
  [key: string]: string | ParsedI18n;
}

/**
 * YAML文字列をパースしてフラットなキー・バリューに変換
 */
export function parseYaml(content: string): Record<string, string> {
  try {
    const parsed = yaml.load(content) as ParsedI18n;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML structure: expected object');
    }
    return flattenObject(parsed);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * YAMLファイルからキー一覧を取得
 */
export function extractYamlKeys(content: string): string[] {
  const parsed = parseYaml(content);
  return Object.keys(parsed);
}
