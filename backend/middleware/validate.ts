import { RequestHandler } from 'express';
import { z, ZodType } from 'zod';

interface RequestSchemas {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

/**
 * Validates and normalizes request input with zod. Unknown body keys are stripped, which
 * prevents mass assignment. Parsed query values are exposed on `res.locals.query` because
 * `req.query` is read-only in Express 5. Validation errors become 400 responses.
 */
export const validate = (schemas: RequestSchemas): RequestHandler => (req, res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.query) res.locals.query = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    next();
};

/** Typed access to the query parsed by `validate({ query })`. */
export const getQuery = <T extends ZodType>(res: { locals: Record<string, unknown> }, _schema: T) =>
    res.locals.query as z.infer<T>;
