# ELVI Frontend

React 19 + TypeScript + Vite admin SPA.

## Structure

```
pages/        One file per route. Data fetching, form state and the page's
              own layout live here.
components/   Shared UI: Modal (focus-trapped, Escape-closes), ConfirmDialog,
              form primitives and formatters in ui.tsx, AdminLayout (the
              sidebar shell), QRCode/QRScanner.
hooks/        usePagedQuery — server-side paging, debounced search and
              filters for every list page.
services/     httpClient.ts (the axios instance, auth header injection,
              normalised ApiError) and api.ts (one typed function per
              endpoint).
styles/       tokens.css (design tokens as CSS custom properties — supports
              :hover/:focus-visible and dark mode, which inline styles
              cannot), base.css, components.css, layout.css.
utils/        format.ts (currency/date formatting), passwordPolicy.ts,
              qrDownload.ts — split out of component files so files that
              export a component export only components, which React Fast
              Refresh requires.
```

## Data flow

Every list page uses `usePagedQuery`, which pages, searches and filters on
the server rather than downloading a full collection into the browser. Money
values shown before a save (rental quotes, invoice previews, booking
estimates) are always fetched from the server — the UI never invents a total
client-side, matching the backend's rule that pricing is server-authoritative.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if the API isn't at
the default `http://localhost:5000/api`.

## Scripts

```bash
npm run dev         # Vite dev server, http://localhost:5173
npm run build        # tsc -b && vite build -> dist/
npm run preview       # serve the production build locally
npm run typecheck
npm run lint / lint:fix
npm test              # vitest + Testing Library (jsdom)
```

## Testing

Component tests use `@testing-library/react` + `jsdom`. `Modal.test.tsx`
covers the accessibility behaviour the previous bare-div modals lacked
(dialog semantics, Escape-to-close, backdrop click, initial focus landing on
the first real field rather than the header's close button). Utility tests
cover `format.ts` and `passwordPolicy.ts` (which mirrors the backend's Zod
password rule, so the UI can reject an invalid password before a round trip).

## Theming

`ThemeToggle` cycles system → light → dark, setting `data-theme` on
`<html>`, which `styles/tokens.css` reads. Charts on the Statistics page pull
their colors from the same CSS custom properties at render time, so they
match the active theme instead of being hard-coded.
