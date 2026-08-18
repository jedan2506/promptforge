export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'unauthorized') => new AppError(401, 'unauthorized', msg);
export const forbidden = (msg = 'forbidden') => new AppError(403, 'forbidden', msg);
export const notFound = (msg = 'not found') => new AppError(404, 'not_found', msg);
export const conflict = (msg: string, details?: unknown) => new AppError(409, 'conflict', msg, details);
export const rateLimited = (msg = 'rate limited') => new AppError(429, 'rate_limited', msg);
