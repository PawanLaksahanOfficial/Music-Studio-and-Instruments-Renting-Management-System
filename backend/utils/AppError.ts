/** An expected, client-facing error. Its message is safe to return in the API response. */
export class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: unknown;

    constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Please sign in to continue') => new AppError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'You do not have permission to perform this action', code = 'FORBIDDEN') =>
    new AppError(403, message, code);
export const notFound = (resource = 'Resource') => new AppError(404, `${resource} not found`, 'NOT_FOUND');
export const conflict = (message: string, details?: unknown) => new AppError(409, message, 'CONFLICT', details);
