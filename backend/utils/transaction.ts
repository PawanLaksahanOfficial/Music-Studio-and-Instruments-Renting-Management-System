import mongoose, { ClientSession } from 'mongoose';

/**
 * Runs `fn` inside a transaction, committing on success and aborting on any
 * throw. Requires a replica set (Atlas provides one).
 *
 * Multi-collection writes — a rental that also flips inventory status and
 * appends to customer history — must be all-or-nothing, or a failure halfway
 * through strands items as 'Rented' with no rental to return them against.
 */
export const withTransaction = async <T>(fn: (session: ClientSession) => Promise<T>): Promise<T> => {
    const session = await mongoose.startSession();
    try {
        let result: T;
        // withTransaction retries automatically on transient commit errors.
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result!;
    } finally {
        await session.endSession();
    }
};
