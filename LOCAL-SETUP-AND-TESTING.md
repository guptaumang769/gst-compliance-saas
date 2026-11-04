# 🖥️ Local Setup & Testing Guide — GST Compliance SaaS

> **This is the authoritative guide for running and testing the entire app on a single macOS laptop.**
> Everything here is copy‑paste runnable. If anything conflicts with older docs (`README.md`, `SETUP.md`), trust this file.

**Stack:** Express + Prisma + PostgreSQL 15 + Redis (backend, port **5000**) · React 18 + Vite (frontend, dev port **5173**) · Docker Compose available.

---

## 1. Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| **Node.js** | 20 LTS | `node --version` → `v20.x.x` | https://nodejs.org (or `brew install node@20`) |
| **npm** | 10+ | `npm --version` → `10.x.x` | ships with Node 20 |
| **Git** | 2.x+ | `git --version` | `brew install git` |
| **Docker Desktop** | 24+ | `docker --version` | https://www.docker.com/products/docker-desktop |
| **Docker Compose** | v2+ | `docker compose version` | ships with Docker Desktop |

You need **either** Docker Desktop (recommended — Path A) **or** locally‑installed PostgreSQL 15 + Redis (Path B). You do **not** need both.

Quick check of everything at once:

```bash
node --version && npm --version && git --version && docker --version && docker compose version
```

> **Node version note:** the backend `package.json` pins `"node": "20.x"`. If you use `nvm`, run `nvm install 20 && nvm use 20` before installing dependencies.

---

## 2. Get the code

```bash
git clone https://github.com/guptaumang769/gst-compliance-saas.git
cd gst-compliance-saas
```

(If you already have the repo, just `cd` into it.)

---

## 3. Choose a setup path

- **Path A — Fastest: Docker Compose for infra.** Postgres + Redis run in containers; you run the Node backend and Vite frontend directly on your laptop (best for development with hot reload).
- **Path B — Manual: local Postgres + Redis via Homebrew.** No Docker at all.

Do **one** of them, then continue to [Section 5 — Backend setup](#5-backend-setup).

---

### Path A — Fastest: Docker Compose (recommended)

The repo's `docker-compose.yml` defines `postgres`, `redis`, `backend`, and `frontend`. For local development you only want the **infra** (Postgres + Redis) in Docker, and you run the app on the host so you get hot reload.

```bash
# From the repo root — start ONLY the database + cache
docker compose up -d postgres redis

# Verify both containers are healthy
docker ps
# Expect: gst_saas_db (0.0.0.0:5432->5432) and gst_saas_redis (0.0.0.0:6379->6379)
```

The compose file creates a database named **`gst_saas`** with user **`postgres`** / password **`postgres123`** — this exactly matches the default `DATABASE_URL` in `.env.example`, so no editing is needed.

Sanity‑check the DB connection:

```bash
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"
# Should print a row with "1"
```

> **Tip:** You *can* run the whole stack (`docker compose up -d`) including the backend/frontend containers, but those build in **production** mode (frontend served on **http://localhost:80**, no hot reload). For active development, prefer infra‑only + host app as described above.

Now skip to [Section 5 — Backend setup](#5-backend-setup).

---

### Path B — Manual (no Docker for the app)

Install and start PostgreSQL 15 and Redis with Homebrew:

```bash
# PostgreSQL 15
brew install postgresql@15
brew services start postgresql@15

# Redis
brew install redis
brew services start redis
```

Make sure `psql` is on your PATH (Homebrew keg‑only formula):

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Create the database and (optionally) match the default credentials:

```bash
# Create the gst_saas database
createdb gst_saas

# OPTION 1 (simplest): use your macOS username with no password.
#   Then set DATABASE_URL to: postgresql://$(whoami)@localhost:5432/gst_saas

# OPTION 2 (match .env.example / Docker defaults): create a postgres role
psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres123';" 2>/dev/null || \
psql -d postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres123';"
```

Verify Redis:

```bash
redis-cli ping   # → PONG
```

Now continue to [Section 5 — Backend setup](#5-backend-setup) and set `DATABASE_URL` to whatever role/password you chose above.

---

## 5. Backend setup

```bash
cd backend
npm install                 # ~2-3 min the first time
cp .env.example .env        # create your local env file
```

### Minimum env vars to boot locally

Open `backend/.env` and make sure these four are set. **Everything else is optional** (see below) — the app boots fine without them.

```bash
# REQUIRED to boot
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/gst_saas
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
PORT=5000
```

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 32
# copy the output into JWT_SECRET in backend/.env
```

> For **Path B Option 1** (macOS user, no password) set instead:
> `DATABASE_URL=postgresql://YOUR_MAC_USERNAME@localhost:5432/gst_saas`

A couple of extra vars are helpful locally (already present in `.env.example`, safe defaults):

```bash
NODE_ENV=development
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Optional / external integrations (app runs without them)

Leave these blank/default for a local demo. Here's what degrades if unset:

| Integration | Env vars | What you lose if unset |
|-------------|----------|------------------------|
| **SMTP / Email** (Gmail or SendGrid) | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Email‑sending features: email verification, password‑reset emails, and "send invoice by email". The rest of the app works; you can still verify accounts via the seeded demo user. |
| **AWS S3** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME` | Remote logo storage. **Logo upload falls back to local disk**, so the feature still works locally. |
| **Razorpay** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Live subscription checkout / payment capture. Plans and usage still display; you just can't complete a real payment. |
| **Sentry** | `SENTRY_DSN` | Error reporting to Sentry. Errors still log to the console. |
| **GST Portal API** | `GST_API_BASE_URL`, `GST_API_KEY` | Live GSTIN lookup / direct filing. GSTIN **format** validation and all return generation still work offline. |

---

## 6. Database: migrate & seed

Still inside `backend/`:

```bash
# 1. Generate the Prisma client from schema.prisma
npx prisma generate

# 2. Create the schema in your database (development)
npx prisma migrate dev
#   - First run will prompt for a migration name (e.g. "init") and create all tables.
#   - Re-run this any time schema.prisma changes.

# 3. Seed demo data (customers, suppliers, invoices, products, demo user)
npm run seed
```

> **Production‑style migrate:** in a non‑dev environment you'd run `npx prisma migrate deploy` (applies committed migrations without prompting). For local dev, use `migrate dev`.

### 🔑 Demo login credentials

After running `npm run seed`, log in with:

| Field | Value |
|-------|-------|
| **Email** | `demo@gstsaas.test` |
| **Password** | `Demo@1234` |

> These credentials only work **after** `npm run seed` has run successfully. If login fails, re‑run the seed and confirm it completed without errors.

Handy DB inspection tool:

```bash
npx prisma studio     # opens a DB browser at http://localhost:5555
```

---

## 7. Run the app

Open **two** terminals.

**Terminal 1 — backend** (from `backend/`):

```bash
npm run dev
# 🚀 Server: http://localhost:5000
# 📊 Health: http://localhost:5000/health
```

Confirm it's up:

```bash
curl http://localhost:5000/health    # → {"status":"OK", ...}
```

**Terminal 2 — frontend** (from the repo root):

```bash
cd frontend
npm install        # first time only
npm run dev
# ➜ Local: http://localhost:5173
```

### URLs

| Service | URL |
|---------|-----|
| Frontend (Vite dev) | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Backend health check | http://localhost:5000/health |
| API index (route list) | http://localhost:5000/api |
| Prisma Studio | http://localhost:5555 |

### How the frontend talks to the backend

The Vite dev server **proxies `/api` → `http://localhost:5000`** (see `frontend/vite.config.js`), and the API client defaults its base URL to `/api` when `VITE_API_URL` is unset (`frontend/src/services/api.js`). So with both dev servers running, **no extra config is needed**.

If you ever run the backend on a different host/port, set an env var before starting the frontend:

```bash
VITE_API_URL=http://localhost:5000 npm run dev
```

---

## 8. Testing

### Backend tests — unit vs integration

The backend now has **two** distinct test tiers:

| Command | What it runs | Needs a running server / DB? |
|---------|--------------|------------------------------|
| `npm test` | **Jest unit suite** — pure logic (GST calculator, invoice-number generator, report builders, validators, etc.) with coverage. | No. Runs standalone. |
| `npm run test:integration` | **Server-hitting scripts** in `backend/tests/integration/` that call the live API over HTTP. | **Yes** — backend must be running and the DB seeded. |

**Run the unit suite (fast, no server needed):**

macOS / Linux:
```bash
cd backend
npm test                      # jest with coverage (configured in package.json)
```

Windows (PowerShell):
```powershell
cd backend
npm test
```

The `test` script includes `--coverage`, so a coverage summary prints after the run and a full report is written to `backend/coverage/`.

Run a single suite while iterating:

```bash
npm test -- invoice-number-generator.test.js
npm run test:watch            # watch mode
```

**Run the integration suite (needs the server up + DB seeded):**

Open one terminal for the API and a second for the tests.

Windows (PowerShell):
```powershell
# Terminal 1 — from backend/ (DB already migrated + seeded)
npm run dev

# Terminal 2 — from backend/
npm run test:integration
```

macOS / Linux is identical (`npm run dev` in one shell, `npm run test:integration` in another).

> The integration scripts were moved out of the unit tree into `backend/tests/integration/` so that plain `npm test` stays fast and hermetic (no network, no DB) while `npm run test:integration` exercises the real endpoints end-to-end. Unit suites live in `backend/tests/` (GST calculator, invoice-number generator, report service, validation, etc.).

### Frontend build & lint

```bash
cd frontend
npm run lint        # ESLint over src/
npm run build       # production build into frontend/dist (catches build-time errors)
npm run preview     # optional: serve the built bundle locally
```

### ✅ Manual smoke‑test checklist

With the seed loaded and both servers running, walk through this end‑to‑end at http://localhost:5173:

- [ ] **Log in** with `demo@gstsaas.test` / `Demo@1234`
- [ ] **Dashboard** loads (revenue, tax, counts, charts)
- [ ] **Create a customer** (try a B2B one with a valid 15‑digit GSTIN)
- [ ] **Create an invoice** with 1–2 line items and confirm CGST/SGST or IGST is calculated
- [ ] **Download the invoice PDF**
- [ ] **Generate a GSTR‑1** for the current period and view the structured tables
- [ ] **Open Reports** (Sales/Purchase register, tax‑rate & HSN summaries) and try a CSV export
- [ ] **Add a Product** in the Product/Service master (HSN + default GST rate)
- [ ] **Invite a team member** (Owner → invite an Accountant/Viewer) and confirm it appears in the audit log

---

## ⭐ New Features (This Round) — Setup & Windows Testing

> **This whole section is written Windows-first (PowerShell).** macOS/Linux commands are identical unless noted. Everywhere below, the web app is **http://localhost:5173**, the API is **http://localhost:5000**, and you log in with **`demo@gstsaas.test` / `Demo@1234`** (valid only after `npm run seed`).
>
> **Honesty note:** several of these features run as a **local mock/stub** so you can demo the full flow offline. Each one below is clearly labelled **✅ Fully functional locally** or **🟡 Local mock/stub**. Nothing here files anything with the real GST system. See `PRODUCTION-DEPLOYMENT-AND-PUBLISHING.md` for how to turn the mocks into real integrations.

### 0. One-time prerequisites for this round

**New npm dependencies** — already declared in `backend/package.json`, so a normal `npm install` pulls them in. No manual install needed. For reference they are:

| Package | Used by |
|---------|---------|
| `qrcode` | E-Invoice signed-QR image generation |
| `csv-parse` | Bank-statement + bulk-import CSV parsing |

Because the Prisma schema grew (E-Way Bill, E-Invoice/IRN, TDS/TCS, inventory, bank reconciliation, insights, terms tables), re-sync your database once after pulling this round:

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate dev      # applies the committed 0001_init migration (+ any new ones)
npm run seed                # refresh demo data
```

> **Committed migration:** the initial Prisma migration is now checked in at `backend/prisma/migrations/0001_init/`. Locally you can keep using `npx prisma migrate dev`; in production you run `npx prisma migrate deploy` against that same committed migration (see the production doc).

---

### 1. Loose ends (roles, insights-driven notifications, code-splitting) — ✅ Fully functional locally

**What changed**
- Web **Team roles** are now aligned to the backend enum **`OWNER` / `ACCOUNTANT` / `VIEWER`** (no more mismatched labels).
- **Notifications** in the top bar are now driven by the real **Insights** engine (see feature 8) instead of placeholder data.
- The web bundle is **code-split** (route-level lazy loading), so the first paint is smaller.

**Test on Windows**
1. Log in and open **Team** (`/team`). Confirm the role dropdown offers exactly **Owner / Accountant / Viewer**.
2. Invite a member as **Viewer**, then confirm read-only guards (Viewer can't see create/edit buttons).
3. Click the **bell / notifications** icon in the header — entries should mirror what appears on **Insights** (`/insights`).
4. Confirm code-splitting is working: in the browser DevTools **Network** tab, navigate between pages and watch separate `*.js` chunks load on demand.

---

### 2. E-Way Bill generation (`/eway-bills`) — ✅ Fully functional locally (mock EWB number)

Create an e-way bill, generate a **mock EWB number + validity**, cancel it, or create one directly from an invoice. The EWB number is generated locally — it is **not** registered with the NIC E-Way Bill portal.

**Test on Windows**
1. Go to **E-Way Bills** (`/eway-bills`) → **New E-Way Bill**.
2. Fill transporter / vehicle / distance / value fields and save.
3. Click **Generate** → a mock 12-digit EWB number and a validity date appear.
4. Click **Cancel** on that row → status flips to cancelled.
5. From **Invoices** (`/invoices`), use the row action **Create E-Way Bill** to prefill an EWB from an existing invoice, then generate.

---

### 3. E-Invoice / IRN + QR (action on Invoices page) — 🟡 Local mock/stub provider

Generates an **IRN**, **AckNo**, and a **signed QR image** from an invoice, and can cancel an IRN. This is powered by a **local mock provider** at `backend/src/services/eInvoiceProvider.js` — it fabricates the IRN/QR so you can see the full UX offline.

> ⚠️ **This does NOT file a real e-invoice.** Real IRN generation requires a **GSTN-authorised IRP/GSP integration** (auth token, signed payload, sandbox → production). See `PRODUCTION-DEPLOYMENT-AND-PUBLISHING.md` → *E-Invoice via GSP/IRP* for exactly what to swap in and where.

**Test on Windows**
1. Open **Invoices** (`/invoices`) and pick a B2B invoice (customer with a GSTIN).
2. Use the row action **Generate E-Invoice / IRN**.
3. Confirm an **IRN**, **AckNo**, **AckDate** and a **QR code image** appear (the QR renders via the `qrcode` package).
4. Download the invoice PDF and confirm the signed QR is embedded.
5. Use **Cancel IRN** and confirm the status updates.

---

### 4. TDS/TCS management (`/tds-tcs`) — ✅ Fully functional locally

Record TDS/TCS entries and view a **monthly summary**.

**Test on Windows**
1. Open **TDS / TCS** (`/tds-tcs`).
2. Add a TDS entry (section, rate, deductee, amount) and a TCS entry.
3. Switch the month/period selector and confirm the **monthly summary** totals recompute.

---

### 5. Inventory (`/inventory`) — ✅ Fully functional locally

Track **product stock**, make **stock adjustments**, see **low-stock** items, and review **stock movements**.

**Test on Windows**
1. Open **Inventory** (`/inventory`). Products from the master appear with current stock.
2. Click **Adjust stock** on a product, enter +10 (stock-in) and save.
3. Enter a negative adjustment (or create an invoice that consumes stock) and confirm the **movements** list logs each change.
4. Set a reorder level higher than current stock and confirm the item shows in **Low stock**.

---

### 6. Bank reconciliation (`/bank-reconciliation`) — ✅ Fully functional locally

Import a **bank-statement CSV**, auto-match rows to invoices/purchases, manually match or ignore, and see a summary.

**CSV format** — columns exactly: `date,description,amount,type`
- `date` — `YYYY-MM-DD`
- `description` — free text
- `amount` — positive number
- `type` — `credit` (money in) or `debit` (money out)

**Sample CSV you can paste** (save as `bank-statement.csv`):
```csv
date,description,amount,type
2026-07-03,NEFT ACME TRADERS INV-202607-0001,11800,credit
2026-07-08,UPI OFFICE RENT JULY,25000,debit
2026-07-12,IMPS GLOBEX PVT LTD,23600,credit
2026-07-19,CARD SWIPE STATIONERY,1450,debit
```

**Test on Windows**
1. Create the file with PowerShell (or paste into Notepad and save):
   ```powershell
   cd $HOME\Downloads
   @"
   date,description,amount,type
   2026-07-03,NEFT ACME TRADERS INV-202607-0001,11800,credit
   2026-07-08,UPI OFFICE RENT JULY,25000,debit
   2026-07-12,IMPS GLOBEX PVT LTD,23600,credit
   2026-07-19,CARD SWIPE STATIONERY,1450,debit
   "@ | Set-Content -Encoding utf8 bank-statement.csv
   ```
2. Open **Bank Reconciliation** (`/bank-reconciliation`) → **Import statement** → choose `bank-statement.csv`.
3. Confirm rows import and the engine **auto-matches** the ones whose amount/description line up with invoices/purchases.
4. For an unmatched row, **manually match** it to an invoice, or **ignore** it.
5. Check the **summary** (matched vs unmatched vs ignored totals).

---

### 7. Financial statements (`/financials`) — ✅ Fully functional locally (simplified)

A **simplified P&L** plus an **indicative Balance Sheet**, generated from your transactions. Both carry an on-screen **disclaimer** that they are indicative, not audited statutory accounts.

**Test on Windows**
1. Open **Financials** (`/financials`).
2. Pick a period and confirm the **P&L** (income − expenses) and the **indicative Balance Sheet** render.
3. Confirm the disclaimer banner is visible.

---

### 8. Insights (`/insights` + dashboard widget + notifications) — ✅ Fully functional locally (rules-based, no LLM)

A **rules-based** insights engine (e.g. upcoming filing due dates, ITC at risk, low stock, overdue payments). It powers the **Insights page**, a **dashboard widget**, and the **header notifications**. **No LLM / external AI is involved.**

**Test on Windows**
1. Open **Insights** (`/insights`) and review the generated cards.
2. Go to **Dashboard** (`/dashboard`) and confirm the **Insights widget** shows the top items.
3. Click the header **bell** and confirm notifications match the insights.

---

### 9. Business Admin panel (`/admin`) — ✅ Fully functional locally

A **business-scoped** admin panel: account overview, recent activity, and system health. **This is not a platform super-admin** — it only shows data for the logged-in business.

**Test on Windows**
1. Log in as the **Owner** and open **Admin** (`/admin`).
2. Confirm account overview (plan, usage), activity feed (from the audit log), and system-health indicators render.
3. Log in as a **Viewer/Accountant** and confirm access is restricted as designed.

---

### 10. GST auto-filing STUB (`/gst-filing/file`) — 🟡 Stub (returns SIMULATED)

An endpoint/action that **simulates** filing a GST return. It returns a clearly **SIMULATED** response and does not contact the GST portal.

> ⚠️ **Real filing needs a GSP + DSC** (Digital Signature Certificate) or EVC. See `PRODUCTION-DEPLOYMENT-AND-PUBLISHING.md` → *GSTR auto-filing with DSC*.

**Test on Windows**
1. Generate a GSTR-1/3B as usual, then trigger the **file** action.
2. Confirm the response/UI clearly says **SIMULATED** and no real submission occurs.

---

### 11. WhatsApp share (invoice) — ✅ Fully functional locally (wa.me link only)

Generates a real **`wa.me`** deep link for an invoice — opens WhatsApp with a prefilled message. **No API credentials needed.**

> The full **WhatsApp Business Cloud API** (templated/automated sends) is a separate integration — see the production doc.

**Test on Windows**
1. On **Invoices** (`/invoices`), use the **Share on WhatsApp** action for an invoice.
2. Confirm it opens a `https://wa.me/...?text=...` link with the invoice summary prefilled.

---

### 12. GST chatbot (floating helper) — ✅ Fully functional locally (rules/FAQ, no LLM)

A floating helper that answers common GST questions from a **rules/FAQ** knowledge base. **No LLM / external AI.**

**Test on Windows**
1. Click the floating **chat** button (bottom-right on any page).
2. Ask a seeded FAQ (e.g. "What is GSTR-1?" or "When is GSTR-3B due?") and confirm a canned answer appears.

---

### 13. Bulk CSV import (customers / suppliers / products) — ✅ Fully functional locally

Import many records at once from a CSV, with **downloadable CSV templates** in the UI so the columns are always correct.

**Test on Windows**
1. On **Customers** (`/customers`), **Suppliers**, or **Products** (`/products`), click **Bulk import**.
2. Click **Download template** first (gives you the exact header row).
3. Fill a few rows, save the file, then upload it.
4. Confirm the new records appear and any row-level validation errors are reported.

> Example customer template (download the real one from the UI to get the authoritative columns):
> ```csv
> customerName,gstin,email,phone,billingAddress,city,state,pincode
> Acme Traders,27AABCU9603R1ZM,acme@example.com,9876543210,12 MG Road,Pune,Maharashtra,411001
> ```

---

### 14. Invoice Terms & Conditions — ✅ Fully functional locally

A business-level **`defaultTerms`** setting plus **per-invoice T&C**, both rendered on the invoice PDF.

**Test on Windows**
1. Open **Settings** (`/settings`) → set **Default Terms & Conditions** and save.
2. Create a new invoice — confirm the default T&C prefills; optionally override it for that invoice.
3. Download the invoice PDF and confirm the T&C text renders on it.

---

## 9. Troubleshooting

<details open>
<summary><b>Postgres: "connection refused" / ECONNREFUSED 5432</b></summary>

- Docker path: is the container up? `docker ps` — if not, `docker compose up -d postgres redis`.
- Homebrew path: `brew services list` → start with `brew services start postgresql@15`.
- Confirm `DATABASE_URL` host/port/user/password match your actual server (Docker default is `postgres:postgres123`).
- Test directly: `psql "$DATABASE_URL" -c "SELECT 1;"`.
</details>

<details>
<summary><b>Prisma migrate errors</b></summary>

- **"database gst_saas does not exist"** → create it (`createdb gst_saas`, or it's auto‑created by the Docker container).
- **Auth failed / role missing** → your `DATABASE_URL` credentials don't match the DB (see Path B).
- **Drift / can't apply migration** on a throwaway local DB: reset it (destroys local data): `npx prisma migrate reset`.
- Migration created but client stale → `npx prisma generate`.
</details>

<details>
<summary><b>Port already in use (5000 / 5173 / 5432 / 6379)</b></summary>

```bash
lsof -i :5000     # backend
lsof -i :5173     # frontend
lsof -i :5432     # postgres
lsof -i :6379     # redis
kill -9 <PID>     # free the port
```
Or change the port: backend via `PORT=5001` in `.env`; frontend via `npm run dev -- --port 5174` (remember to update `VITE_API_URL`/proxy if you change the backend port).
</details>

<details>
<summary><b>CORS errors in the browser console</b></summary>

- Prefer the Vite proxy (`/api`) rather than pointing the frontend straight at `http://localhost:5000`.
- If you do call the backend directly, add the frontend origin to `ALLOWED_ORIGINS` in `backend/.env` (e.g. `http://localhost:5173`) and restart the backend.
</details>

<details>
<summary><b>Missing env / app won't boot</b></summary>

- Ensure `backend/.env` exists (`cp .env.example .env`) and `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` are set.
- A missing `JWT_SECRET` will break login/token signing — set it and restart.
</details>

<details>
<summary><b>Changed schema.prisma — now what?</b></summary>

```bash
cd backend
npx prisma migrate dev     # create + apply a new migration
npx prisma generate        # regenerate the client so code sees new fields
```
Restart `npm run dev` afterwards.
</details>

<details>
<summary><b>Node version mismatch</b></summary>

The backend expects Node 20. If `npm install` warns about the engine or native modules fail (`bcrypt`, `prisma`):
```bash
nvm install 20 && nvm use 20
rm -rf backend/node_modules backend/package-lock.json
cd backend && npm install
```
</details>

<details>
<summary><b>"Module not found" after pulling changes</b></summary>

```bash
rm -rf node_modules package-lock.json
npm install
```
Run in whichever package (`backend/` or `frontend/`) reports the error.
</details>

---

## 10. TL;DR — 5‑line local run

```bash
docker compose up -d postgres redis                                   # 1. infra
cd backend && npm install && cp .env.example .env                     # 2. deps + env (set JWT_SECRET)
npx prisma generate && npx prisma migrate dev && npm run seed         # 3. db + demo data
npm run dev                                                           # 4. backend → http://localhost:5000
cd ../frontend && npm install && npm run dev                          # 5. frontend → http://localhost:5173
```

Then open **http://localhost:5173** and log in with **`demo@gstsaas.test` / `Demo@1234`**.
