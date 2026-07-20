import { HTTPException } from 'hono/http-exception';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class AppError extends HTTPException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    code: string,
    details?: unknown
  ) {
    super(status as Parameters<typeof HTTPException>[0], { message });
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(404, message, code);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(422, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Rate limit exceeded',
    details?: { limit: number; used: number; remaining: number; resetAt: string }
  ) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
    this.name = 'RateLimitError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, message, code);
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(500, message, code);
    this.name = 'InternalError';
  }
}
