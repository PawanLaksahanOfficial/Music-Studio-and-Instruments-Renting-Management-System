import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
        port: 5173,
        // Proxy API calls in development so the session cookie is first-party (same origin).
        proxy: {
            '/api': { target: 'http://localhost:5000', changeOrigin: true },
        },
    },
    build: {
        // Routes, charts, the PDF exporter and the camera scanner are split by their dynamic
        // imports; forcing manual chunk groups would pull shared helpers (and those heavy
        // libraries) into the entry. The PDF library is only fetched when exporting.
        chunkSizeWarningLimit: 900,
    },
});
