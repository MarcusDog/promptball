export interface AppErrorOptions {
  cause?: unknown;
  userMessage?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: string;
  readonly userMessage?: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.userMessage = options.userMessage;
    this.details = options.details;
  }
}

export class ProviderError extends AppError {
  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(code, message, options);
    this.name = "ProviderError";
  }
}

export class DatabaseError extends AppError {
  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(code, message, options);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(code, message, options);
    this.name = "ValidationError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}
