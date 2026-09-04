import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

interface ErrorBody {
    message: string;
    details?: unknown;
    stack?: string;
}

/**
 * Single place where an error becomes a response. Anything not explicitly
 * recognised is reported as a generic 500 — internal messages and stack
 * traces must never leak to a client in production.
 */
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details: unknown;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation failed';
        details = err.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
    } else if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = 'Validation failed';
        details = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
    } else if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid value for '${err.path}'`;
    } else if (isDuplicateKeyError(err)) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0];
        message = field ? `A record with that ${field} already exists` : 'Duplicate value';
    }

    const log = statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
    log({ err, statusCode, method: req.method, url: req.originalUrl }, message);

    const body: ErrorBody = { message };
    if (details !== undefined) body.details = details;
    if (!env.isProduction && err instanceof Error) body.stack = err.stack;

    res.status(statusCode).json(body);
};

interface DuplicateKeyError {
    code: number;
    keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
    typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
