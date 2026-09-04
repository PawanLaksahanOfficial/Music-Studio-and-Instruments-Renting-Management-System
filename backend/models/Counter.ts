import mongoose, { Schema, Model } from 'mongoose';

export interface ICounter {
    _id: string;
    seq: number;
}

const CounterSchema = new Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> =
    mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically allocates the next number in a named sequence.
 *
 * Replaces `Date.now()`-based ids, which collide whenever two records are
 * created in the same millisecond and give no auditable ordering. The
 * increment is a single findOneAndUpdate, so it is safe under concurrency.
 */
export const nextSequence = async (
    name: string,
    session?: mongoose.ClientSession
): Promise<number> => {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true, session }
    );
    return counter.seq;
};

/** e.g. formatId('PR', 42) → 'PR-000042' */
export const formatId = (prefix: string, seq: number, width = 6): string =>
    `${prefix}-${String(seq).padStart(width, '0')}`;

export default Counter;
