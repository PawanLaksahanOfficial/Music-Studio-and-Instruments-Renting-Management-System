import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
    export interface ProvidedContext {
        mongoUri: string;
    }
}

let replSet: MongoMemoryReplSet;

/** One single-node replica set for the whole run: transactions need a replica set. */
export async function setup(project: TestProject) {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    project.provide('mongoUri', replSet.getUri());
}

export async function teardown() {
    await replSet?.stop();
}
