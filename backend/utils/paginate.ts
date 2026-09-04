import { Model, QueryFilter, PopulateOptions } from 'mongoose';

export interface PageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface Paginated<T> {
    data: T[];
    meta: PageMeta;
}

interface PaginateOptions<T> {
    filter?: QueryFilter<T>;
    page: number;
    limit: number;
    sort?: Record<string, 1 | -1>;
    populate?: PopulateOptions | PopulateOptions[];
    select?: string;
}

/**
 * Page a collection instead of returning it whole. The count and the page are
 * fetched in parallel; `lean()` skips hydrating Mongoose documents, which is
 * a large win on list endpoints that only serialise to JSON.
 */
export const paginate = async <T>(
    model: Model<T>,
    { filter = {}, page, limit, sort = { createdAt: -1 }, populate, select }: PaginateOptions<T>
): Promise<Paginated<T>> => {
    let query = model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

    if (populate) query = query.populate(populate as PopulateOptions);
    if (select) query = query.select(select);

    const [data, total] = await Promise.all([
        query.lean<T[]>().exec(),
        model.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
        data,
        meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    };
};

/** Case-insensitive OR-match across fields, for list search boxes. */
export const searchFilter = <T>(search: string | undefined, fields: string[]): QueryFilter<T> => {
    if (!search?.trim()) return {};
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    return { $or: fields.map(f => ({ [f]: rx })) } as QueryFilter<T>;
};
