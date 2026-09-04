import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'coverage'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            // `any` erases the type safety this codebase is trying to gain.
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // Logging goes through pino so it is structured and redacted.
            'no-console': ['error', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'smart'],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    {
        // Scripts and tests legitimately print to the console.
        files: ['scripts/**/*.ts', 'tests/**/*.ts', 'config/env.ts'],
        rules: { 'no-console': 'off' },
    }
);
