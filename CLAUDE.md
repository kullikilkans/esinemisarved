# CLAUDE.md

## Deployment

- This web app runs on Render, not on the local computer.
- Render deploys the app automatically from the `main` branch of this GitHub repo (https://github.com/kullikilkans/esinemisarved).

## Database

- The database is a Render PostgreSQL database.
- It is available only through the `DATABASE_URL` environment variable on Render.

## Rules

- Do not set up a local database or a local server.
- Before every push, run `npm run build` to make sure the app builds.
- After each finished task, commit and push to GitHub so that Render deploys the new version.
