import Counter from '../models/Counter';

export type DocumentPrefix = 'PR' | 'SR' | 'INV';

/** Atomically increments and returns the counter for `key`. */
export const nextSequence = async (key: string): Promise<number> => {
    const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
    ).lean();
    return counter!.seq;
};

/** Human-friendly, collision-free document number such as "PR-2026-000123" (resets yearly). */
export const nextDocumentNumber = async (prefix: DocumentPrefix, now: Date = new Date()): Promise<string> => {
    const year = now.getUTCFullYear();
    const seq = await nextSequence(`${prefix}-${year}`);
    return `${prefix}-${year}-${String(seq).padStart(6, '0')}`;
};
