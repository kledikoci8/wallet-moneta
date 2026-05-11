# React Native Wallet — Project Documentation

A full-stack **personal finance / wallet** application: users sign in, record income and expenses, see balances and analytics, set **savings goals**, get **rule-based savings tips**, and chat with an **AI financial assistant (FinBot)** backed by Google Gemini. The product uses a **forest-green** visual theme and **Clerk** for authentication.

---

## Table of contents

1. [High-level architecture](#1-high-level-architecture)  
2. [Technology stack](#2-technology-stack)  
3. [Repository layout](#3-repository-layout)  
4. [Backend (API)](#4-backend-api)  
5. [Database schema](#5-database-schema)  
6. [Mobile app — navigation & auth](#6-mobile-app--navigation--auth)  
7. [Mobile app — screens & features](#7-mobile-app--screens--features)  
8. [Mobile app — reusable components](#8-mobile-app--reusable-components)  
9. [Mobile app — hooks & utilities](#9-mobile-app--hooks--utilities)  
10. [Styling & theming](#10-styling--theming)  
11. [Configuration & environment](#11-configuration--environment)  
12. [Scripts & how to run](#12-scripts--how-to-run)  
13. [Known implementation notes](#13-known-implementation-notes)

---

## 1. High-level architecture

| Layer | Role |
|--------|------|
| **Mobile (`mobile/`)** | Expo (React Native) app with Expo Router; talks to the REST API using `API_URL`; user identity from **Clerk**. |
| **Backend (`backend/`)** | Express (ES modules) on Node; **Neon** serverless Postgres via `@neondatabase/serverless`; optional **Gemini** for chat; optional **Upstash** for rate limiting (currently disabled in code). |
| **Database** | Tables created at startup if missing: `transactions`, `goals`. |

Data flow: the app sends `user_id` / `userId` (Clerk user id) on API calls; the server scopes queries by that id.

---

## 2. Technology stack

### Mobile

- **Expo SDK ~54**, **React Native ~0.81**, **React 19**
- **expo-router** (file-based routing, Stack, typed routes experiment)
- **@clerk/clerk-expo** + **expo-secure-store** + token cache
- **@react-navigation/native** / **bottom-tabs** / **elements** (via Expo)
- **react-native-safe-area-context**, **react-native-screens**, **react-native-gesture-handler**, **react-native-reanimated**
- **@expo/vector-icons** (Ionicons)
- **@react-native-community/datetimepicker**
- **react-native-svg** (charts / calendar visuals)
- **react-native-keyboard-aware-scroll-view** (where applicable)

### Backend

- **Express 4**, **dotenv**
- **@neondatabase/serverless** (SQL tagged templates)
- **@google/generative-ai** (Gemini for chat)
- **cron** (scheduled HTTPS ping in production)
- **@upstash/ratelimit** + **@upstash/redis** (middleware present; not mounted by default)

---

## 3. Repository layout

```
React Native Wallet 2/
├── backend/
│   ├── server.js                 # Express app entry, routes, listen
│   ├── package.json
│   ├── middleware/
│   │   └── rateLimiter.js      # Upstash rate limit (optional)
│   ├── routes/
│   │   ├── transactionsRoute.js
│   │   ├── goalsRoute.js
│   │   └── chatRoute.js
│   └── config/
│       ├── db.js               # Neon client + initDB (DDL)
│       ├── controllers/
│       │   ├── transactionsController.js
│       │   ├── goalsController.js
│       │   └── chatController.js
│       ├── cron.js             # Keep-alive ping job
│       └── upstash.js          # Redis rate limit client
├── mobile/
│   ├── app/
│   │   ├── _layout.jsx         # ClerkProvider, SafeScreen, Slot, StatusBar
│   │   ├── (auth)/             # Unauthenticated stack
│   │   └── (root)/             # Authenticated stack (headerShown: false)
│   ├── components/
│   ├── assets/styles/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── app.json
│   └── package.json
└── PROJECT_DOCUMENTATION.md    # This file
```

---

## 4. Backend (API)

**Base URL (typical dev):** `http://<host>:5001`  
**API prefix:** routes are mounted under `/api/...` except duplicate legacy mount noted below.

### Global (`server.js`)

- **`GET /api/health`** — plain text health check  
- **`GET /health`** — same idea, root path  
- **`POST`** bodies parsed as JSON (`express.json()`)
- **Rate limiter:** imported but **commented out** (`// app.use(rateLimiter)`)
- **Cron:** if `NODE_ENV === "production "` (note trailing space in source), starts a job that hits `process.env.API_URL` every 14 minutes (often used to wake idle hosts)
- **`initDB()`** runs before `app.listen`

### Transactions (`/api/transactions` and `/api/products`)

Both paths use **the same router** (`transactionsRoute.js`).

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/analytics/:userId` | `getAnalyticsByUserId` | Daily aggregates (current month style grouping) + monthly aggregates for last 6 months (income vs expense). |
| `GET` | `/summary/:userId` | `getSummaryByUserId` | Total balance, sum of positive amounts (income), sum of negative amounts (expenses). |
| `GET` | `/:userId` | `getTransactionsByUserId` | All transactions for user, newest first. |
| `POST` | `/` | `createTransaction` | Body: `title`, `amount`, `category`, `user_id`, optional `date` (ISO). Inserts with `created_at` set from `date` or now. |
| `DELETE` | `/:id` | `deleteTransaction` | Deletes by numeric `id`. |

**Mobile usage today:** fetches use `/api/transactions/...` (via `API_URL` which includes `/api`).

### Goals (`/api/goals`)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/tips/:userId` | `getSavingsTips` | Last 30 days spending by category, income/expense totals, savings rate, generated **tips** array. |
| `GET` | `/:userId` | `getGoalsByUserId` | List goals for user. |
| `POST` | `/` | `createGoal` | Create goal: `user_id`, `title`, `target_amount`, optional `deadline`, `category`, `icon`, `color`. |
| `PUT` | `/progress/:id` | `updateGoalProgress` | Body: `amount` — adds to `current_amount`, sets `completed` when target reached. |
| `PUT` | `/:id` | `updateGoal` | Partial update via `COALESCE` for provided fields. |
| `DELETE` | `/:id` | `deleteGoal` | Remove goal. |

### Chat (`/api/chat`)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/` | `chat` | Body: `userId`, `message`. Loads DB context (summary, recent txs, category spend, goals), builds system prompt, calls **Gemini 1.5 Flash**; on failure uses **keyword-based fallback** replies. |
| `GET` | `/suggestions/:userId` | `getSuggestions` | Returns 3 contextual **suggestion strings** for the chat UI (debt / overspend / healthy saver variants). |

---

## 5. Database schema

Defined in `backend/config/db.js` with `CREATE TABLE IF NOT EXISTS`.

### `transactions`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `SERIAL` | Primary key |
| `user_id` | `VARCHAR(255)` | Clerk user id |
| `title` | `VARCHAR(255)` | |
| `amount` | `DECIMAL(10,2)` | Positive = income, negative = expense (app convention) |
| `category` | `VARCHAR(255)` | |
| `created_at` | `DATE` | Default `CURRENT_DATE`; API can override with chosen date |

### `goals`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `SERIAL` | Primary key |
| `user_id` | `VARCHAR(255)` | |
| `title` | `VARCHAR(255)` | |
| `target_amount` | `DECIMAL(10,2)` | |
| `current_amount` | `DECIMAL(10,2)` | Default `0` |
| `deadline` | `DATE` | Nullable |
| `category` | `VARCHAR(100)` | |
| `icon` | `VARCHAR(50)` | Default `'flag'` |
| `color` | `VARCHAR(20)` | Default green hex |
| `created_at` | `TIMESTAMP` | Default `NOW()` |
| `completed` | `BOOLEAN` | Default `FALSE` |

---

## 6. Mobile app — navigation & auth

### Root (`mobile/app/_layout.jsx`)

- Wraps the app in **`ClerkProvider`** (with `tokenCache` for secure token storage).
- Wraps content in **`SafeScreen`**: a `View` with `paddingTop: useSafeAreaInsets().top` and `flex: 1` so notch/status bar spacing is applied **once** at the root.
- Renders **`Slot`** for child routes.
- **`StatusBar`** from `expo-status-bar` with `style="dark"`.

### Authenticated layout (`mobile/app/(root)/_layout.jsx`)

- Uses **`Stack`** from `expo-router/stack` with **`headerShown: false`** — each screen supplies its own header bar where needed.
- Redirects to sign-in if not loaded / not signed in (Clerk).

### Auth layout (`mobile/app/(auth)/_layout.jsx`)

- Stack for **`sign-in`** and **`sign-up`** flows.

### Auth screens

- **`sign-in.jsx`**, **`sign-up.jsx`** — Clerk-powered flows; styles in `assets/styles/auth.styles.js`.

---

## 7. Mobile app — screens & features

### Home — `app/(root)/index.jsx`

- **Welcome header:** app logo, “Welcome” + email local-part, shortcuts to **Goals** (flag) and **Analytics** (chart), **Add** (create transaction), **`SignOutButton`**.
- **`BalanceCard`:** total balance, income, expenses from `useTransactions` summary.
- **`FlatList`** of **`TransactionItem`** rows; pull-to-refresh; empty state **`NoTransactionsFound`**.
- **Floating chat button** (bottom-right) with subtle **pulse** animation → navigates to `/chat`.
- **Monthly loss check:** calls analytics endpoint; if current month net &lt; 0, shows **modal** (“Monthly Loss Alert”) with loss amount, tip, buttons to **View Analytics** or dismiss.
- **Loading:** **`PageLoader`** on initial load.

### Create transaction — `app/(root)/create.jsx`

- **Expense / Income** toggle (affects sign of posted amount).
- **Amount** + **title** inputs.
- **Date** picker (iOS modal spinner; Android default picker); max date = today.
- **Category chips:** Food & Drinks, Shopping, Transportation, Entertainment, Bills, Income, Other (names must match backend / `TransactionItem` icon map).
- **Save** → `POST /transactions` with `user_id`, `title`, `amount`, `category`, `date`.

### Analytics — `app/(root)/analytics.jsx`

- Custom header: back, title “Analytics”.
- **Income vs Expense:** **`IncomeExpenseChart`** (SVG bar chart from `monthlyData`).
- **Daily Profit/Loss:** toggle show/hide **`ProfitLossCalendar`** (month grid, per-day income/expense, modal detail, mini SVG indicators).

### Savings goals — `app/(root)/goals.jsx`

- Custom header: back, “Savings Goals”, add opens **create goal** modal.
- **Tabs:** “My Goals” vs “Saving Tips”.
- **Summary card** (totals / progress — see styles and JSX in file).
- **Goal list** with progress, colors/icons, actions (add money modal, etc.).
- **Tips tab:** cards from **`/goals/tips/:userId`** with priority styling.
- **RefreshControl**, **`PageLoader`** on first load.
- Modals: create goal (title, target, deadline, icon picker, color picker), add money to selected goal.

### FinBot chat — `app/(root)/chat.jsx`

- Custom header with bot avatar + “FinBot”.
- Fetches **`/chat/suggestions/:userId`** on mount.
- **Message list**, user vs bot bubbles, timestamps.
- **Typing indicator** (animated dots) while waiting for API.
- **`KeyboardAvoidingView`** (platform-specific behavior).
- **`POST /chat`** with `userId`, `message`.

---

## 8. Mobile app — reusable components

| Component | File | Purpose |
|-----------|------|---------|
| **SafeScreen** | `components/SafeScreen.jsx` | Applies top safe-area inset + background color to all routes. |
| **PageLoader** | `components/PageLoader.jsx` | Full-screen loading UI. |
| **SignOutButton** | `components/SignOutButton.jsx` | Clerk sign-out control. |
| **BalanceCard** | `components/BalanceCard.jsx` | Displays `summary.balance`, `summary.income`, `summary.expenses` (formatted). |
| **TransactionItem** | `components/TransactionItem.jsx` | Single transaction row: category icon map, title, category, signed amount, formatted date (`formatDate`), delete affordance calling `onDelete(id)`. |
| **NoTransactionsFound** | `components/NoTransactionsFound.jsx` | Empty list placeholder. |
| **IncomeExpenseChart** | `components/IncomeExpenseChart.jsx` | SVG grouped bar chart for monthly income vs expense; empty state when no `monthlyData`. |
| **ProfitLossCalendar** | `components/ProfitLossCalendar.jsx` | Calendar month view, merges `dailyData`, day modal, optional mini charts. |
| **GoalsCard** | `components/GoalsCard.jsx` | Compact goals preview (progress, top goals, navigate to `/goals`). **Note:** not imported on the home screen in the current tree; available for dashboards or future use. |

---

## 9. Mobile app — hooks & utilities

| Module | Purpose |
|--------|---------|
| **`hooks/useTransactions.js`** | For a given `userId`: state for `transactions`, `summary` (`balance`, `income`, `expenses` from API — note API uses `expenses` key), `IsLoading`; `loadData`, `deleteTransaction`. |
| **`lib/utils.js`** | **`formatDate(dateString)`** — long US locale string for transaction rows. |

---

## 10. Styling & theming

- **`constants/colors.js`** — **`COLORS`** exported from **`THEMES.forest`**: primary green `#2E7D32`, mint background `#E8F5E9`, text greens, `expense` red, `income` green, cards white, borders, etc.
- **Screen stylesheets** (StyleSheet):  
  `home.styles.js`, `create.styles.js`, `analytics.styles.js`, `goals.styles.js`, `chat.styles.js`, `auth.styles.js`  
- **Inline styles:** home `index.jsx` defines `alertStyles` (loss modal) and `floatingStyles` (FAB) locally.

**Layout convention:** root `SafeScreen` already pads the top safe area; stacked screen headers use **modest** `paddingTop` / `paddingBottom` (not a second full “status bar” offset).

---

## 11. Configuration & environment

### Mobile — `constants/api.js`

- Exports **`API_URL`** — must point at the backend **including `/api`** (e.g. `http://192.168.x.x:5001/api` for LAN device testing, or a deployed URL).

### Backend — typical `.env` keys

| Variable | Used for |
|----------|----------|
| **`DATABASE_URL`** | Neon Postgres connection string |
| **`PORT`** | Server port (default **5001** in code) |
| **`GEMINI_API_KEY`** | Google Generative AI (FinBot) |
| **`API_URL`** | Cron job HTTPS GET target (e.g. health URL on same deployment) |
| **Upstash** | Referenced in `config/upstash.js` for rate limiter when enabled |

---

## 12. Scripts & how to run

### Backend (`backend/`)

```bash
npm install
npm run dev    # nodemon server.js
npm start      # node server.js
```

Ensure Postgres is reachable and `DATABASE_URL` is set. For chat, set `GEMINI_API_KEY`.

### Mobile (`mobile/`)

```bash
npm install
npx expo start
```

Configure **`mobile/constants/api.js`** so the device/simulator can reach the backend (localhost vs machine LAN IP).

### Clerk

Clerk publishable keys and related Expo config are expected to be set up per Clerk’s Expo documentation (environment / `app.json` as in your local setup).

---

## 13. Known implementation notes

1. **`/api/products`** duplicates **`/api/transactions`** — likely legacy; clients use `transactions`.
2. **`NODE_ENV === "production "`** in `server.js` has a **trailing space**; production cron may not start unless the env string matches exactly.
3. **Rate limiter** is **off** by default in `server.js`.
4. **`GoalsCard`** is implemented but **not currently mounted** on the home screen (grep shows only its own file).
5. **`useTransactions`** initial `summary` uses `expense` key but API returns **`expenses`** — verify UI still receives correct props after mapping (BalanceCard uses `summary.expenses`).
6. **CORS:** `cors` is a backend dependency but not necessarily `app.use(cors())` in `server.js`; if the web build calls the API, you may need to enable CORS explicitly.
7. **Port conflicts:** if `EADDRINUSE` on 5001, stop the other Node process using that port.

---

This document reflects the codebase structure and behavior at the time of writing. For line-level behavior, refer to the source files named above.
