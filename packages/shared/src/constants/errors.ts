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
  /** V2 */
  MILESTONE_IMAGE_LIMIT: 'MILESTONE_IMAGE_LIMIT',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  IMAGE_INVALID_TYPE: 'IMAGE_INVALID_TYPE',
  MOTIVATION_LIMIT: 'MOTIVATION_LIMIT',
  ACHIEVEMENT_SEED_IMMUTABLE: 'ACHIEVEMENT_SEED_IMMUTABLE',
  /** V2.1 */
  FREEZE_QUOTA_EXCEEDED: 'FREEZE_QUOTA_EXCEEDED',
  BACKUP_PASSWORD_INVALID: 'BACKUP_PASSWORD_INVALID',
  BACKUP_CORRUPT: 'BACKUP_CORRUPT',
  SHARE_RENDER_FAILED: 'SHARE_RENDER_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_HTTP_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  MILESTONE_IMAGE_LIMIT: 422,
  IMAGE_TOO_LARGE: 422,
  IMAGE_INVALID_TYPE: 422,
  MOTIVATION_LIMIT: 422,
  ACHIEVEMENT_SEED_IMMUTABLE: 409,
  FREEZE_QUOTA_EXCEEDED: 409,
  BACKUP_PASSWORD_INVALID: 401,
  BACKUP_CORRUPT: 422,
  SHARE_RENDER_FAILED: 500,
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
