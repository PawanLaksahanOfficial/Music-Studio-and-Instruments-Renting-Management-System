import mongoose from 'mongoose';

/**
 * Runs `fn` inside a MongoDB transaction (requires a replica set, e.g. MongoDB Atlas).
 * Every Mongoose operation awaited inside `fn` joins the transaction automatically
 * (transactionAsyncLocalStorage), and transient write conflicts are retried by the driver.
 * Any error thrown aborts the transaction and is re-thrown.
 */
export const withTransaction = <T>(fn: () => Promise<T>): Promise<T> => mongoose.connection.transaction(fn);
