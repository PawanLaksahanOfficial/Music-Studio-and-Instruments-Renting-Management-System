/**
 * Error carrying an HTTP status. Services throw these; the central error
 * middleware turns them into responses, so controllers never need try/catch.
 */
export class AppError extends Error {
    readonly statusCode: number;
    readonly details?: unknown;
    readonly isOperational = true;

    constructor(statusCode: number, message: string, details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace?.(this, AppError);
    }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, message, details);
export const unauthorized = (message = 'Unauthorized') => new AppError(401, message);
export const forbidden = (message = 'Forbidden') => new AppError(403, message);
export const notFound = (message: string) => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
