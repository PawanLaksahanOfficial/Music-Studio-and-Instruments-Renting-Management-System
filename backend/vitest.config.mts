import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globalSetup: ['./tests/globalSetup.ts'],
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        // Test files share one in-memory replica set; run them one at a time.
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 180_000,
    },
});
