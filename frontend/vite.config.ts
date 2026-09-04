import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                // Splits the largest third-party libraries into their own chunks
                // so a change to app code does not invalidate their cache entry.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    if (/react-dom|\/react\/|react-router-dom/.test(id)) return 'vendor';
                    if (id.includes('recharts')) return 'charts';
                    if (id.includes('jspdf')) return 'pdf';
                    return undefined;
                },
            },
        },
    },
});
