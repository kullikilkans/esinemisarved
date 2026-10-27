# esinemisarved

Invoicing web app (homework): a musician issues invoices for gigs through two
companies. Next.js (App Router), Tailwind CSS, shadcn/ui, Prisma and PostgreSQL,
deployed on Render. The UI is in Estonian.

All data in `sample_data.json` is fictional test data.

## Render setup

1. **PostgreSQL**: New → Postgres, region Frankfurt.
2. **Web Service**: New → Web Service, connect this repo, branch `main`,
   region Frankfurt, runtime Node.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment variables:
     - `DATABASE_URL`: the database's *Internal Database URL*
     - `APP_PASSWORD`: the shared login password

On every start, `npm start` applies Prisma migrations, seeds the companies and
customers from `sample_data.json` (only when the tables are empty) and starts
Next.js on `PORT`.

## Project layout

- `prisma/schema.prisma`: data model; `prisma/migrations/`: SQL migrations
- `prisma/seed.mjs`: seed script
- `src/proxy.ts`: password check for every page and API route
- `src/app/(app)/`: the three sections ("Uus arve", "Arved", "Kliendid")
- `src/app/api/`: API routes
