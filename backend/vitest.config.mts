import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.ts'],
        // An in-memory MongoDB replica set takes a moment to spin up on first run.
        testTimeout: 30_000,
        hookTimeout: 60_000,
        setupFiles: ['tests/setup.ts'],
        // Integration tests share one database, so they must not run concurrently.
        fileParallelism: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['services/**', 'utils/**', 'middleware/**'],
        },
    },
});
