import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wraps a handler so thrown errors reach the error middleware. */
export const handler = (fn: (req: Request, res: Response) => unknown): RequestHandler =>
  (req, res, next) => {
    try {
      const out = fn(req, res);
      if (out instanceof Promise) out.catch(next);
    } catch (e) {
      next(e);
    }
  };

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'The request body wasn’t valid JSON.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}

// ---- small validators ----

export function str(value: unknown, field: string, { min = 1, max = 5000 } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required.`);
  const v = value.trim();
  if (v.length < min) throw new HttpError(400, `${field} is too short.`);
  if (v.length > max) throw new HttpError(400, `${field} is too long (maximum ${max} characters).`);
  return v;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (!allowed.includes(value as T)) throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}.`);
  return value as T;
}
