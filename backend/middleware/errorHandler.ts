import { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

const humanize = (field: string) => field.replace(/([A-Z])/g, ' $1').replace(/[._]/g, ' ').trim().toLowerCase();

interface ErrorBody {
    message: string;
    code: string;
    details?: unknown;
    requestId?: string;
}

const toErrorResponse = (err: unknown): { status: number; body: ErrorBody } => {
    if (err instanceof AppError) {
        return { status: err.statusCode, body: { message: err.message, code: err.code, details: err.details } };
    }
    if (err instanceof ZodError) {
        const details = err.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }));
        const first = details[0];
        const message = first ? `${first.path ? `${humanize(first.path)}: ` : ''}${first.message}` : 'Validation failed';
        return { status: 400, body: { message, code: 'VALIDATION_ERROR', details } };
    }
    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
        return { status: 400, body: { message: details[0]?.message ?? 'Validation failed', code: 'VALIDATION_ERROR', details } };
    }
    if (err instanceof mongoose.Error.CastError) {
        return { status: 400, body: { message: `Invalid value for ${humanize(err.path)}`, code: 'INVALID_VALUE' } };
    }

    const e = err as { code?: number; keyValue?: Record<string, unknown>; type?: string; status?: number; expose?: boolean; message?: string };
    if (e?.code === 11000) {
        const field = Object.keys(e.keyValue ?? {})[0];
        return { status: 409, body: { message: field ? `A record with this ${humanize(field)} already exists` : 'Duplicate record', code: 'DUPLICATE' } };
    }
    if (e?.type === 'entity.parse.failed') return { status: 400, body: { message: 'Malformed JSON body', code: 'MALFORMED_JSON' } };
    if (e?.type === 'entity.too.large') return { status: 413, body: { message: 'Request body is too large', code: 'PAYLOAD_TOO_LARGE' } };
    if (typeof e?.status === 'number' && e.status >= 400 && e.status < 500 && e.expose) {
        return { status: e.status, body: { message: e.message ?? 'Bad request', code: 'BAD_REQUEST' } };
    }

    // Unexpected error: never leak internals (stack traces, driver messages) to the client.
    return { status: 500, body: { message: 'Something went wrong on our side. Please try again.', code: 'INTERNAL_ERROR' } };
};

export const notFoundHandler: RequestHandler = req => {
    throw new AppError(404, `Route not found: ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND');
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const { status, body } = toErrorResponse(err);
    body.requestId = typeof req.id === 'string' ? req.id : undefined;

    if (status >= 500) {
        // pino-http includes res.err (with stack) in its request-completed log line.
        (res as typeof res & { err?: unknown }).err = err;
    }

    if (res.headersSent) return;
    res.status(status).json(body);
};
