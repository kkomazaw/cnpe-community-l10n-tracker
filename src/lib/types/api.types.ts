// API Response関連の型定義

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'SITE_NOT_FOUND'
  | 'GITHUB_API_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ANALYSIS_FAILED'
  | 'INTERNAL_ERROR';
