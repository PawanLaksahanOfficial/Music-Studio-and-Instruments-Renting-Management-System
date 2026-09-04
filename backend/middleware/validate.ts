import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

interface Schemas {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

/**
 * Validates and *replaces* the request parts with their parsed output, so
 * handlers downstream receive coerced, stripped values rather than raw input.
 * Unknown keys are dropped by the schemas, which is what stops a client from
 * writing fields it has no business setting.
 */
export const validate =
    (schemas: Schemas) =>
    (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
            if (schemas.query) {
                // Express 5 exposes req.query as a getter, so assign onto the
                // existing object rather than replacing the reference.
                const parsedQuery = schemas.query.parse(req.query) as Record<string, unknown>;
                Object.keys(req.query).forEach(k => delete (req.query as Record<string, unknown>)[k]);
                Object.assign(req.query, parsedQuery);
            }
            if (schemas.body) req.body = schemas.body.parse(req.body);
            next();
        } catch (err) {
            next(err);
        }
    };
