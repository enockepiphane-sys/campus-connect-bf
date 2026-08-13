# CampusLink

CampusLink is a TanStack Start + React application for connecting universities,
administrators, and students in Burkina Faso. The app uses Supabase for
authentication and data, Tailwind CSS for styling, and runs with Vite.

## Running locally on Replit

- Start the app with `npm run dev -- --host 0.0.0.0 --port 5000`.
- The Replit workflow is named `Start application`.
- Supabase environment variables are required for authenticated areas:
  `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or their `VITE_` variants).

## Project conventions

- Keep the existing TanStack Start and Supabase structure.
- Student imports use the Excel `.xlsx` workflow in the administrator area.
- Student imports must remain pre-inscriptions and must pass validation before
  they are inserted.