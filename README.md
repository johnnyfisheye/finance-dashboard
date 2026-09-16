# Finance Dashboard

Personal finance tracker: transactions, income, expenses, budgets (save/spend/invest allocation), recurring items, goals, investments, net worth and reports.

Live: https://finance-dashboard-seven-azure.vercel.app

## Install as an app

The site is a Progressive Web App. It needs an internet connection but runs in its own window with no browser chrome.

**Mac (Safari):** open the site, then **File → Add to Dock**. Launch "Finance" from the Dock or Spotlight.

**iPhone / iPad (Safari):** open the site, tap **Share → Add to Home Screen**. It opens full screen and follows the system light/dark setting.

Sign in once; the session is kept between launches.

## Stack

Next.js 16 (App Router, `src/`), React 19, Tailwind v4 + shadcn (base-ui), Recharts, NextAuth v5 (credentials), Prisma 7 with the `pg` adapter on Supabase Postgres. Deployed on Vercel from `main`.

## Local development

```bash
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, seed credentials
npm install               # runs prisma generate
npm run db:migrate        # first time only
npm run db:seed           # creates the user (and demo data if SEED_DEMO_DATA=true)
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run db:studio`.

Read `AGENTS.md` before changing code: this Next.js version has breaking changes and the bundled docs in `node_modules/next/dist/docs/` are the reference.
