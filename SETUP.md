# Setup Instructions - GST Compliance SaaS

> **For the fullest, copy‑paste runnable guide (Docker and non‑Docker paths, seeding, testing, troubleshooting), see [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md) — that is the authoritative in‑depth reference.** This file is the quick start for the **finished** project.

**Repository:** https://github.com/guptaumang769/gst-compliance-saas.git

**Stack:** Express + Prisma + PostgreSQL 15 + Redis (backend, port **5000**) · React 18 + Vite (frontend, dev port **5173**) · Docker Compose for infra.

---

## ✅ Prerequisites

Install these before you start:

- [ ] **Node.js 20 LTS** — check: `node --version` → `v20.x.x` (the backend pins `"node": "20.x"`)
- [ ] **npm 10+** — check: `npm --version` (ships with Node 20)
- [ ] **Docker Desktop** — check: `docker --version` (24.x+)
- [ ] **Docker Compose v2** — check: `docker compose version`
- [ ] **Git** — check: `git --version`

Install links:
- Node.js: https://nodejs.org/ (or `brew install node@20`)
- Docker Desktop: https://www.docker.com/products/docker-desktop

> Prefer to run Postgres/Redis **without** Docker (Homebrew)? See Path B in [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md#path-b--manual-no-docker-for-the-app).

---

## 🚀 Quick Start

### Step 1: Clone the repository

```bash
git clone https://github.com/guptaumang769/gst-compliance-saas.git
cd gst-compliance-saas
```

(If you already have the repo, just `cd` into it.)

---

### Step 2: Start infrastructure (PostgreSQL + Redis)

From the repo root, start **only** the database and cache in Docker (you'll run the app itself on the host for hot reload):

```bash
docker compose up -d postgres redis

# Verify both containers are healthy
docker ps
# Expect: gst_saas_db (0.0.0.0:5432->5432) and gst_saas_redis (0.0.0.0:6379->6379)
```

The compose file creates database **`gst_saas`** with user **`postgres`** / password **`postgres123`** — this matches the default `DATABASE_URL` in `.env.example`, so no editing is required.

```bash
# Optional sanity check
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"
```

> You *can* run the whole stack (`docker compose up -d`, which also builds the `backend` and `frontend` containers in **production** mode, frontend on **http://localhost:80**), but for development prefer infra‑only + host app as shown here.

---

### Step 3: Backend — install & configure

```bash
cd backend
npm install                 # ~2-3 min the first time
cp .env.example .env        # create your local env file
```

**Minimum env vars to boot** (edit `backend/.env`) — everything else in `.env.example` is optional:

```bash
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/gst_saas
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
PORT=5000
```

Generate a strong secret:

```bash
openssl rand -base64 32   # paste the output into JWT_SECRET
```

Optional integrations (Email/SMTP, AWS S3, Razorpay, Sentry) are all safe to leave blank for a local demo — the app boots without them. For example, **logo upload falls back to local disk** when S3 is not configured. See the table in [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md#optional--external-integrations-app-runs-without-them) for exactly what degrades if unset.

---

### Step 4: Database — generate client, migrate & seed

Still inside `backend/`:

```bash
npx prisma generate         # generate the Prisma client from prisma/schema.prisma
npx prisma migrate dev      # create the schema in your DB (prompts for a name on first run, e.g. "init")
npm run seed                # load demo data (customers, suppliers, invoices, products, demo user)
```

**🔑 Demo login (created by the seed):**

| Field | Value |
|-------|-------|
| **Email** | `demo@gstsaas.test` |
| **Password** | `Demo@1234` |

> These credentials only work **after** `npm run seed` completes successfully.

Handy DB browser: `npx prisma studio` → http://localhost:5555

---

### Step 5: Run the backend

```bash
# from backend/
npm run dev
# 🚀 Server: http://localhost:5000
# 📊 Health: http://localhost:5000/health
```

Confirm it's up:

```bash
curl http://localhost:5000/health    # → {"status":"OK", ...}
```

---

### Step 6: Run the frontend

Open a **second** terminal:

```bash
cd frontend
npm install        # first time only
npm run dev
# ➜ Local: http://localhost:5173
```

The Vite dev server **proxies `/api` → `http://localhost:5000`** (see `frontend/vite.config.js`) and the API client defaults its base URL to `/api`, so **no extra config is needed** when both dev servers run.

Open **http://localhost:5173** and log in with **`demo@gstsaas.test` / `Demo@1234`**.

---

## 🧪 Running Tests

### Backend (Jest)

```bash
cd backend
npm test              # runs jest with --coverage (report written to backend/coverage/)
npm run test:watch    # watch mode while iterating
npm test -- gst-calculator.test.js   # run a single suite
```

### Frontend (build & lint)

```bash
cd frontend
npm run lint          # ESLint over src/
npm run build         # production build into frontend/dist (catches build-time errors)
npm run preview       # optional: serve the built bundle locally
```

---

## 📇 URLs Reference

| Service | URL |
|---------|-----|
| Frontend (Vite dev) | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Backend health check | http://localhost:5000/health |
| API index (route list) | http://localhost:5000/api |
| Prisma Studio | http://localhost:5555 |

---

## 🛠️ Useful Commands Reference

### Docker (infra)
```bash
docker compose up -d postgres redis   # start DB + cache
docker compose down                   # stop everything
docker compose logs -f postgres       # follow DB logs
docker compose restart postgres redis # restart infra
```

### Backend (`cd backend`)
```bash
npm run dev             # development (nodemon auto-reload)
npm start               # production (node src/index.js)
npm run prisma:generate # prisma generate
npm run prisma:migrate  # prisma migrate dev
npm run prisma:studio   # prisma studio (DB browser)
npm run seed            # seed demo data
npm test                # jest --coverage
```

### Frontend (`cd frontend`)
```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # production build → frontend/dist
npm run preview   # serve the built bundle
npm run lint      # ESLint
```

---

## 🐛 Troubleshooting

### Docker containers won't start / ports in use
```bash
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :5000   # backend
lsof -i :5173   # frontend
kill -9 <PID>   # free the port
```
If a port is occupied, free it or change it (backend via `PORT=5001` in `.env`; frontend via `npm run dev -- --port 5174`).

### Cannot connect to database
```bash
docker ps                         # is gst_saas_db running?
docker compose up -d postgres redis   # start infra if not
docker logs gst_saas_db           # inspect DB logs
psql "$DATABASE_URL" -c "SELECT 1;"   # test the connection string directly
```
Confirm `DATABASE_URL` host/port/user/password match the running server (Docker default is `postgres:postgres123`).

### Prisma errors
```bash
npx prisma generate        # regenerate the client after schema changes
npx prisma migrate dev     # create + apply a new migration
npx prisma migrate reset   # reset a throwaway local DB (destroys local data)
```

### "Module not found" after pulling changes
```bash
rm -rf node_modules package-lock.json
npm install
```
Run this in whichever package (`backend/` or `frontend/`) reports the error.

### Node version mismatch
The backend expects Node 20. With `nvm`:
```bash
nvm install 20 && nvm use 20
rm -rf backend/node_modules backend/package-lock.json
cd backend && npm install
```

---

## 📞 Need Help?

- **Authoritative setup & testing guide:** [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md)
- **Acceptance test plan:** [`USER-ACCEPTANCE-TEST-PLAN.md`](USER-ACCEPTANCE-TEST-PLAN.md)
- **End-to-end product walkthrough:** [`END-TO-END-USER-WORKFLOW.md`](END-TO-END-USER-WORKFLOW.md)
- **Overview & status:** [`README.md`](README.md) · [`PHASE-STATUS-AND-PLAN.md`](PHASE-STATUS-AND-PLAN.md)

---

## ⚡ TL;DR — 5-line local run

```bash
docker compose up -d postgres redis                              # 1. infra
cd backend && npm install && cp .env.example .env               # 2. deps + env (set JWT_SECRET)
npx prisma generate && npx prisma migrate dev && npm run seed    # 3. db + demo data
npm run dev                                                      # 4. backend → http://localhost:5000
cd ../frontend && npm install && npm run dev                     # 5. frontend → http://localhost:5173
```

Then open **http://localhost:5173** and log in with **`demo@gstsaas.test` / `Demo@1234`**.
