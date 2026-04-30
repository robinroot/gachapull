# GachaPull - Pokemon & One Piece Card Gacha System

A full-featured gacha card website featuring Pokemon and One Piece cards, built with Node.js, Express, React, Vite, and PostgreSQL.

## Features

- Gacha pull system with card flip animation (single and 10x pulls)
- Card collection management with rarity filtering
- Leaderboard ranked by total USD spending
- Coin wallet system with purchase options
- Pull history tracking
- Admin dashboard with full management capabilities
- Payment gateway configuration (Stripe, Midtrans, USDT, NowPayments)

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) v9 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher

## Local Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd gachapull
pnpm install
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/gachapull
SESSION_SECRET=your-secret-key-here
PORT=8080
```

And create `.env` in `artifacts/gacha-web/`:

```env
VITE_API_URL=/api
```

### 3. Set up the database

Push the schema to PostgreSQL:

```bash
pnpm --filter @workspace/db run push
```

### 4. Seed initial data

Run the seed script to populate cards, packs, coin packages, and an admin user:

```bash
pnpm --filter @workspace/scripts run seed
```

This creates:
- 30 cards (15 Pokemon + 15 One Piece) across 5 rarity tiers
- 4 card packs (2 Pokemon + 2 One Piece)
- 6 coin packages for purchase
- Admin user: `admin@gachapull.com` / `Admin@123456` (9999 coins)

### 5. Start the development servers

In two separate terminals:

**API Server** (runs on port 8080):
```bash
pnpm --filter @workspace/api-server run dev
```

**Frontend** (runs on port 5173):
```bash
pnpm --filter @workspace/gacha-web run dev
```

Then open your browser at `http://localhost:5173`.

## Project Structure

```
artifacts/
├── api-server/          # Express + TypeScript API backend
│   └── src/
│       ├── routes/      # API route handlers (auth, gacha, admin, etc.)
│       ├── middlewares/ # JWT auth middleware
│       └── app.ts       # Express app setup
│
└── gacha-web/           # React + Vite frontend
    └── src/
        ├── pages/       # Page components (home, packs, gacha, admin, etc.)
        ├── components/  # Shared UI components
        └── lib/         # Utilities (auth context, helpers)

lib/
├── db/                  # Drizzle ORM schema + database client
│   └── src/schema/      # Table definitions
├── api-spec/            # OpenAPI specification
└── api-client-react/    # Generated React Query hooks

scripts/                 # Utility scripts (seed, admin reset)
```

## Admin Dashboard

Access the admin panel at `/admin` after logging in with an admin account.

Admin features:
- **Dashboard**: Platform stats (users, cards, packs, pulls, revenue)
- **Cards**: Add/edit/delete cards with rarity and franchise settings
- **Packs**: Manage card packs with pricing in coins and USD
- **Users**: View and manage user accounts, change roles
- **Transactions**: View payment transaction history
- **Coin Packages**: Configure purchasable coin bundles
- **Settings**: Configure payment gateway API keys (Stripe, Midtrans, USDT, NowPayments)

## Payment Gateways

Configure payment gateways from the Admin Settings page:

- **Stripe**: Add public key, secret key, and webhook secret
- **Midtrans**: Add server key, client key, and toggle production mode
- **USDT**: Configure wallet address and network (TRC20/ERC20)
- **NowPayments**: Add API key for cryptocurrency payments

## Card Rarities

| Rarity | Drop Rate |
|--------|-----------|
| Common | ~50% |
| Rare | ~30% |
| Super Rare | ~12% |
| Ultra Rare | ~6% |
| Legendary | ~2% |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gachapull.com | Admin@123456 |

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL, JWT
- **Frontend**: React 19, Vite, TypeScript, React Query, Tailwind CSS, shadcn/ui
- **Monorepo**: pnpm workspaces
- **API Contract**: OpenAPI 3.0 with code generation (Orval)
