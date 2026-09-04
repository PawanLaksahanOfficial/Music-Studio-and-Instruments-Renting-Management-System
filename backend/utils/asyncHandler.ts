import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * middleware. Express 4 does not await handlers, so without this an async
 * throw becomes an unhandled rejection and the request hangs.
 */
export const asyncHandler =
    <Req extends Request = Request>(fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
        Promise.resolve(fn(req as Req, res, next)).catch(next);
    };
