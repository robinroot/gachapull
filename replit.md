# GachaPull - Pokemon & One Piece Card Gacha

## Overview

Full-featured gacha card website with Pokemon and One Piece cards. Built as a pnpm monorepo with Node.js + Express backend and React + Vite frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
- **Auth**: JWT (stored in localStorage as `gacha_token`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run reset-admin` — check/reset admin user in DB

## Running Workflows

- **API Server**: `pnpm --filter @workspace/api-server run dev` — runs on port 8080, serves `/api` prefix
- **Frontend**: `pnpm --filter @workspace/gacha-web run dev` — serves root `/`
- Shared proxy routes all traffic via `localhost:80`

## Project Structure

```
artifacts/
├── api-server/          # Express + TypeScript API (port 8080, /api prefix)
│   └── src/
│       ├── routes/      # auth, cards, packs, gacha, collection, wallet, payments, leaderboard, admin
│       └── middlewares/ # JWT auth middleware
└── gacha-web/           # React + Vite frontend
    └── src/
        ├── pages/       # home, login, register, packs, pack-detail, gacha, collection, leaderboard, history, dashboard, wallet
        ├── pages/admin/ # dashboard, cards, packs, users, transactions, coin-packages, settings
        └── lib/         # auth context (auth.tsx), helpers (helpers.ts)

lib/
├── db/                  # Drizzle ORM schema + db client (@workspace/db)
│   └── src/schema/      # users, cards, packs, cardPacks, gachaPulls, userCollection, userCoins, coinTransactions, paymentTransactions, coinPackages, paymentSettings
├── api-spec/            # OpenAPI spec + codegen config
└── api-client-react/    # Generated React Query hooks + Zod schemas

scripts/                 # Utility scripts
```

## Database Schema

Tables: users, cards, packs, card_packs (junction), gacha_pulls, user_collection, user_coins, coin_transactions, payment_transactions, coin_packages, payment_settings

## Seeded Data

- 30 cards: 15 Pokemon + 15 One Piece, rarities: common/rare/super_rare/ultra_rare/legendary
- 4 packs: Pokemon Base Set (100 coins), Pokemon Legendary (500 coins), One Piece Grand Line (150 coins), One Piece Emperor (750 coins)
- 6 coin packages: Starter 100/$0.99, Basic 500/$4.99, Value 1200/$9.99, Pro 3000/$24.99, Elite 6500/$49.99, Legendary 15000/$99.99
- Admin user: admin@gachapull.com / Admin@123456 (9999 coins, role: admin)

## API Key Patterns

- Gacha pull: POST /api/gacha/pull with body `{packId, pullCount}` (NOT `quantity`)
- Pull response: `{cards: [{card: {...}, isNew}], coinsSpent, coinsRemaining}`
- History: `{pulls: [...], total, page, limit}` — use `.pulls`
- Leaderboard: `[{rank, user, totalSpentUsd, totalPulls, topCard}]` — plain array
- Wallet: `{balance, totalEarned, totalSpent}`
- Wallet transactions: `{transactions: [...]}` — use `.transactions`
- Collection: plain array `[{card, count, firstObtainedAt}]`
- Dashboard: `{coinsBalance, totalPulls, collectionCount, legendaryCount, totalSpentUsd, recentPulls}`
- Admin users: `{users: [...], total, page, limit}` — use `.users`
- Admin transactions: `{transactions: [...]}` — use `.transactions`
- Cards: `{cards: [...], total, page, limit}` — use `.cards`
- Admin settings: nested `{stripe: {}, midtrans: {}, usdt: {}, nowpayments: {}}` 

## Auth Flow

1. POST /api/auth/login -> `{user, token}`
2. `login(token)` in auth.tsx immediately stores to `localStorage.setItem("gacha_token", token)` THEN calls `setToken()` and `refetch()`  
3. `setAuthTokenGetter` reads from `localStorage.getItem("gacha_token")` for all API requests
4. Admin check: `user.role === "admin"` in AdminLayout

## Important Notes

- `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api"` — orval regenerates with extra exports
- JWT stored as `gacha_token` in localStorage
- bcrypt (native) is used for password hashing in api-server; bcryptjs (pure JS) used in scripts package for compatibility
- Admin settings PUT accepts nested object: `{stripe: {...}, midtrans: {...}, usdt: {...}, nowpayments: {...}}`
