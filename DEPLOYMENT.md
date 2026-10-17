# QueueBite deployment

The repository contains a Vite/React frontend and an Express API. Deploy the frontend and API as separate services.

## Render API

1. Create a Render **Blueprint** from this GitHub repository using `render.yaml`, or create a Node web service manually.
2. For a manual service, use `backend` as the root directory, `npm ci` as the build command, `npm start` as the start command, and `/health` as the health check path.
3. Set the environment variables shown in `render.yaml`. `SUPABASE_SERVICE_ROLE_KEY` is secret and must only be stored in Render, never in Vercel or browser code.
4. Apply `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/002_functions_rls.sql` to the Supabase project, then run `supabase/seed.sql`.
5. After the Vercel frontend is deployed, set `FRONTEND_ORIGIN` in Render to its exact origin, such as `https://your-project.vercel.app`. For multiple approved origins, separate them with commas.

The Render service exposes `/health` and the API under `/api/v1`.

## Vercel frontend

1. Import this GitHub repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add the environment variable `VITE_API_BASE` with the Render API base URL, for example `https://queuebite-api.onrender.com/api/v1`.
5. Deploy. `frontend/vercel.json` routes client-side URLs such as `/menu` and `/admin` back to the React app.

The local Vite setup still uses `/api/v1` and proxies API requests to `http://localhost:5000`.

## Before making the app public

The current login routes contain demo credentials (`admin` / `admin123` and `staff123`) and are not production authentication. Replace them with real authenticated accounts and short-lived signed sessions before exposing the admin or staff features publicly. The current API also has an in-memory fallback when Supabase is unavailable; that data is temporary and is not suitable for persistent orders. Configure Supabase and verify the production authentication flow before accepting real users or orders.
