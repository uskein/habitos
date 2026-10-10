/**
 * Códigos de error canónicos — CONTRATOS_API.md §1.
 * El mismo código mapea al HTTP futuro en Fase 2.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_HTTP_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export interface AppErrorDetail {
  path: string;
  message: string;
}

/** Error lanzado por repositorios locales y (futuro) cliente HTTP. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details: AppErrorDetail[];

  constructor(code: ErrorCode, message: string, details: AppErrorDetail[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}
