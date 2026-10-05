/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API base URL, e.g. https://api.example.com/api. Defaults to "/api" (Vite proxy / same origin). */
    readonly VITE_API_URL?: string;
    /** Read-only demo account shown as "Explore the demo" on the sign-in page (both must be set). */
    readonly VITE_DEMO_USERNAME?: string;
    readonly VITE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
