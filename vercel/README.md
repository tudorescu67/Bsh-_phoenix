# Vercel Setup Folder

Acest folder contine fisiere pregatite pentru deploy-ul dashboard-ului pe Vercel.

## Ce ai aici

- `frontend.vercel.json` - config Vercel pentru SPA (React/Vite)
- `env.production.example` - variabile de mediu recomandate pentru frontend

## Cum il folosesti rapid

1. In Vercel, seteaza `Root Directory` pe `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Copiaza continutul din `env.production.example` in variabilele de mediu din Vercel.
5. Daca vrei rewrite SPA, copiaza `frontend.vercel.json` in `frontend/vercel.json`.

Backend-ul ramane pe VPS, iar frontend-ul pe Vercel.
