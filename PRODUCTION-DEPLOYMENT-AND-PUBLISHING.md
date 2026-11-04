# 🚀 Production Deployment & Publishing Guide — GST Compliance SaaS

> **This is deliverable "D": how to take the app from a laptop demo to a real, publicly reachable product** — deploy the backend + frontend, provision a managed database, turn the local mocks/stubs into real GSTN/third‑party integrations, harden for production, and publish the mobile app to Google Play and the Apple App Store.
>
> Written **Windows‑author‑first** (PowerShell). macOS/Linux equivalents are given where they differ trivially.
>
> **Honesty first:** this repo ships several **local mocks/stubs** (E‑Invoice IRN/QR, GST auto‑filing, E‑Way Bill number, WhatsApp automation, LLM features). They exist so the full UX is demoable offline. **They do not talk to the real GST system.** Section 6 explains exactly what credentials each one needs and where to plug them in. Do **not** advertise those features as "live GST filing" until you have completed a real GSP/IRP integration and tested it in the provider's sandbox.
>
> **Related docs:** [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md) (run it locally) · [`PHASE-STATUS-AND-PLAN.md`](PHASE-STATUS-AND-PLAN.md) (what's real vs mock) · [`docs/07-DEVOPS-HOSTING-GUIDE.md`](docs/07-DEVOPS-HOSTING-GUIDE.md) (detailed AWS EC2/EKS + RDS walkthrough — complements this doc) · [`mobile/SETUP-AND-TESTING.md`](mobile/SETUP-AND-TESTING.md).

---

## Table of Contents

1. [Architecture recap & what must change for production](#1-architecture-recap--what-must-change-for-production)
2. [Provision managed PostgreSQL + run migrations](#2-provision-managed-postgresql--run-migrations)
3. [Deploy the backend](#3-deploy-the-backend)
   - [Path A — Docker on a VPS (Nginx + Let's Encrypt + PM2/systemd)](#path-a--docker-on-a-vps-nginx--lets-encrypt--pm2systemd)
   - [Path B — Managed PaaS (Render / Railway)](#path-b--managed-paas-render--railway)
   - [Full backend env var list](#full-backend-env-var-list)
4. [Build & host the frontend](#4-build--host-the-frontend)
5. [Turning the STUB/MOCK integrations into REAL ones](#5-turning-the-stubmock-integrations-into-real-ones)
6. [Production hardening checklist](#6-production-hardening-checklist)
7. [Mobile publishing (EAS → Google Play & Apple App Store)](#7-mobile-publishing-eas--google-play--apple-app-store)
8. [Go‑live checklist](#8-go-live-checklist)

---

## 1. Architecture recap & what must change for production

**The stack** (unchanged from local):

```
[ Web browser ]        [ Mobile app (Expo) ]
       │                        │
       ▼                        ▼
  Frontend (React/Vite static)  │
       │  calls /api            │ calls https://api.yourdomain.com/api
       └──────────┬─────────────┘
                  ▼
        Backend (Node/Express, port 5000)
                  │
     ┌────────────┼───────────────┐
     ▼            ▼               ▼
 PostgreSQL     Redis         S3 / object store
 (managed)   (optional)    (PDFs, logos, uploads)
```

**What must change when going from laptop → production:**

| Concern | Local (dev) | Production |
|---------|-------------|------------|
| `NODE_ENV` | `development` | **`production`** (hides stack traces, enables prod behaviour) |
| Secrets | `.env` file on disk | **Secret manager / platform env vars**, never committed |
| Transport | `http://localhost` | **HTTPS only** (TLS termination at Nginx/PaaS) |
| CORS | permissive localhost list | **`ALLOWED_ORIGINS` = your real web origin(s) only** |
| Database | local Docker Postgres | **Managed PostgreSQL** with backups |
| Migrations | `prisma migrate dev` | **`prisma migrate deploy`** (applies committed migrations, no prompts) |
| File storage | local disk fallback | **S3** (or compatible) so files survive redeploys/multi‑instance |
| Tokens | 7‑day JWT in localStorage | short‑lived JWT + HTTPS‑only handling; rotate `JWT_SECRET` |
| Mocks/stubs | mock IRN/EWB/filing | **real GSP/IRP integrations** (Section 5) before claiming GST compliance |
| Logging/errors | console | **Sentry + structured logs**, monitoring/alerts |

> The backend already ships production‑friendly middleware: `helmet`, `cors` driven by `ALLOWED_ORIGINS`, `express-rate-limit`, and a graceful `SIGTERM` shutdown. Your job is to configure them correctly, not to add them.

---

## 2. Provision managed PostgreSQL + run migrations

Use a **managed** Postgres so you get automated backups, patching and failover. Any of these work: **AWS RDS**, **Render PostgreSQL**, **Railway Postgres**, **Neon**, **Supabase**, **DigitalOcean Managed Databases**. (For a detailed AWS RDS walkthrough, see [`docs/07-DEVOPS-HOSTING-GUIDE.md` §8](docs/07-DEVOPS-HOSTING-GUIDE.md).)

**You'll get a connection string** shaped like:

```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

> Managed Postgres almost always requires TLS — keep `?sslmode=require` on the URL.

### Apply the committed migration

The repo now commits the initial migration at **`backend/prisma/migrations/0001_init/`**. In production you **do not** run `migrate dev` — you run `migrate deploy`, which applies exactly the committed migrations with no prompts and no drift detection surprises.

Run this **once at first deploy and again on every release that adds a migration**, from a machine (or CI job, or the container) that can reach the DB:

Windows (PowerShell), pointing at the production DB:
```powershell
cd backend
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
npx prisma generate          # build the client for this environment
npx prisma migrate deploy    # apply committed migrations (0001_init + any later ones)
```

macOS/Linux:
```bash
cd backend
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
npx prisma generate
npx prisma migrate deploy
```

> **Do NOT run `npm run seed` in production** — the seed creates the throwaway `demo@gstsaas.test` account and sample data. Production should start empty (or with only real onboarding data). If you seeded by accident, delete the demo user/business before going live.

**Verify:**
```powershell
npx prisma migrate status    # should report "Database schema is up to date"
```

---

## 3. Deploy the backend

Two concrete, supported paths. Pick **A** if you want full control / lowest long‑run cost; pick **B** for the fastest path with the platform managing TLS, restarts and logs.

### Path A — Docker on a VPS (Nginx + Let's Encrypt + PM2/systemd)

Target: a plain Ubuntu VPS (DigitalOcean Droplet, Hetzner, Linode, AWS Lightsail/EC2, etc.) with a domain pointed at it (`api.yourdomain.com`).

The repo already contains a `backend/Dockerfile` and a `docker-compose.yml`. There are **two common shapes**; both are fine:

#### A1. Run the backend as a Docker container

On the VPS (Ubuntu):
```bash
# Install Docker (once)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out/in afterwards

# Get the code
git clone https://github.com/guptaumang769/gst-compliance-saas.git
cd gst-compliance-saas

# Create the production env file (see the full var list below) — DO NOT commit it
nano backend/.env.production

# Build & run just the backend container, using the managed DB (not a DB container)
docker build -t gst-backend ./backend
docker run -d --name gst-backend \
  --restart unless-stopped \
  --env-file backend/.env.production \
  -p 127.0.0.1:5000:5000 \
  gst-backend
```

> Bind to `127.0.0.1:5000` (not `0.0.0.0`) so the API is only reachable **through Nginx**, which terminates TLS.

Apply migrations from inside the container (first deploy + each release with a new migration):
```bash
docker exec -it gst-backend npx prisma migrate deploy
```

#### A2. (Alternative) Run the backend directly with PM2 or systemd

If you prefer not to containerise the app itself:

**PM2:**
```bash
cd backend
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
sudo npm install -g pm2
pm2 start src/index.js --name gst-backend --env production
pm2 save
pm2 startup           # prints a command to enable start-on-boot — run it
```

**systemd** (`/etc/systemd/system/gst-backend.service`):
```ini
[Unit]
Description=GST Compliance SaaS API
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/gst-compliance-saas/backend
EnvironmentFile=/home/ubuntu/gst-compliance-saas/backend/.env.production
ExecStart=/usr/bin/node src/index.js
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gst-backend
sudo systemctl status gst-backend
```

#### A3. Nginx reverse proxy + Let's Encrypt TLS

Install Nginx + Certbot:
```bash
sudo apt update && sudo apt install -y nginx
sudo snap install --classic certbot || sudo apt install -y certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/gst-api`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/gst-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain + install a free TLS cert and auto-configure HTTPS (adds the 443 server block + redirect)
sudo certbot --nginx -d api.yourdomain.com
# Certbot installs a systemd timer for auto-renewal; verify with:
sudo certbot renew --dry-run
```

Your API is now live at **`https://api.yourdomain.com`** with automatic HTTP→HTTPS redirect.

### Path B — Managed PaaS (Render / Railway)

Fastest path; the platform builds from your repo, injects env vars, manages TLS and restarts.

**Render (web service):**
1. Push the repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. **Root Directory:** `backend`
4. **Build Command:** `npm ci && npx prisma generate`
5. **Start Command:** `npx prisma migrate deploy && node src/index.js`
   *(runs the committed migrations on each deploy, then starts the API)*
6. Add all env vars from the [full list](#full-backend-env-var-list) (Render → Environment). Add a **Render PostgreSQL** instance and paste its Internal Connection String into `DATABASE_URL`.
7. Deploy. Render gives you `https://your-service.onrender.com` (custom domains supported).

**Railway:**
1. Railway → **New Project → Deploy from GitHub repo**.
2. Add a **PostgreSQL** plugin; Railway injects `DATABASE_URL`.
3. Set the service **Root Directory** to `backend`, **Start Command** to `npx prisma migrate deploy && node src/index.js`.
4. Add the remaining env vars in the service **Variables** tab.
5. Generate a public domain under **Settings → Networking**.

> On any PaaS, prefer running `prisma migrate deploy` as part of the start/release command (or a release phase) so schema changes are applied automatically on each deploy. Never use `migrate dev` in production.

### Full backend env var list

Set these in `.env.production` (Path A) or the platform's env/secret UI (Path B). **Required to boot** are marked ✅; the rest enable specific integrations.

```bash
# ── Core (✅ required) ─────────────────────────────
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require   # ✅
JWT_SECRET=<64+ char random string>                                       # ✅  rotate from dev
JWT_EXPIRES_IN=7d

# ── CORS / URLs (✅ set to your real origins) ──────
ALLOWED_ORIGINS=https://app.yourdomain.com                # comma-separated; NO trailing slash
FRONTEND_URL=https://app.yourdomain.com

# ── Cache (optional) ──────────────────────────────
REDIS_URL=redis://:<password>@<host>:6379

# ── File storage (recommended in prod: use S3) ────
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1
S3_BUCKET_NAME=gst-saas-documents-<unique>

# ── Email (choose SMTP or SendGrid) ───────────────
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey                 # literally "apikey" for SendGrid
EMAIL_PASSWORD=<sendgrid-api-key> # or your SMTP password
EMAIL_FROM=noreply@yourdomain.com

# ── Payments (Razorpay LIVE keys) ─────────────────
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# ── Error monitoring ──────────────────────────────
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456

# ── GST / e-invoice / GSP integrations (Section 5) ─
# These are the hooks you fill in when you replace the local mocks with a
# real GSTN-authorised provider. Names are indicative — match them to whatever
# the real provider module in backend/src/services/ expects.
GST_API_BASE_URL=
GST_API_KEY=
GSP_CLIENT_ID=
GSP_CLIENT_SECRET=
GSP_USERNAME=
GSP_PASSWORD=
EINVOICE_ENV=sandbox              # sandbox | production
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

> ⚠️ **Never commit `.env*`.** `backend/.gitignore` already ignores env files — keep it that way. Rotate any secret that has ever been shared in plaintext (Slack, email, screenshots).

---

## 4. Build & host the frontend

The frontend is a **static** Vite/React build. Build it once and serve the files from any static host or CDN.

### Build (point it at the production API)

Vite reads `VITE_API_URL` at **build time**. Set it to your live API base (including `/api` if that's what the client expects — the app defaults to `/api`, so with a same‑origin reverse proxy you can leave it unset; when the API is on a different host, set the full URL).

Windows (PowerShell):
```powershell
cd frontend
npm ci
$env:VITE_API_URL = "https://api.yourdomain.com/api"
npm run build            # outputs static files to frontend/dist
```

macOS/Linux:
```bash
cd frontend
npm ci
VITE_API_URL="https://api.yourdomain.com/api" npm run build
```

### Host the `dist/` output — pick one

**Netlify / Vercel (easiest):**
- Connect the repo, set **Base directory** = `frontend`, **Build command** = `npm run build`, **Publish/Output directory** = `dist`.
- Add env var `VITE_API_URL=https://api.yourdomain.com/api`.
- Add an SPA fallback so client‑side routes work: Netlify `_redirects` file with `/* /index.html 200`, or Vercel handles SPA automatically.

**Nginx on the same VPS (Path A):**
```bash
sudo mkdir -p /var/www/gst-web
sudo cp -r frontend/dist/* /var/www/gst-web/
```
Nginx server block for the web app (with SPA fallback + TLS via Certbot):
```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/gst-web;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }
}
```
```bash
sudo certbot --nginx -d app.yourdomain.com
```

> **CORS reminder:** whatever origin the web app is served from (`https://app.yourdomain.com`) **must** appear in the backend's `ALLOWED_ORIGINS`. If you serve web + API from the **same** domain via one Nginx (web at `/`, API proxied at `/api`), you avoid cross‑origin calls entirely.

---

## 5. Turning the STUB/MOCK integrations into REAL ones

This is the most important section for GST correctness. **Today these features are simulated.** Below is what each needs, where to plug it in, and how to test safely in a sandbox first.

> **General rule:** every GSTN‑facing integration goes through a **GSP (GST Suvidha Provider)** or an **authorised IRP (Invoice Registration Portal)**. You must first sign a contract with a GSP/ASP (e.g. ClearTax, Masters India, IRIS, Cygnet, TaxPro, etc.), get **sandbox** credentials, build against sandbox, get certified, then flip to **production** credentials. Never point at production until sandbox passes.

### 5.1 E‑Invoice via an authorised GSP/IRP (replace the local mock)

- **Today:** `backend/src/services/eInvoiceProvider.js` fabricates the IRN, AckNo and signed QR locally.
- **Credentials needed:** GSP/IRP **client ID + secret**, GSTIN‑linked **API username/password**, and the IRP **base URL** (sandbox vs production). Access tokens are typically obtained via an auth call and cached until expiry.
- **Where to plug in:** keep the same module boundary — replace the body of `eInvoiceProvider.js` (or add a real provider selected by `EINVOICE_ENV`) so the rest of the app (Invoices page action, PDF QR embedding) is unchanged. Implement:
  1. **Auth** → get/refresh access token.
  2. **Generate IRN** → build the IRP JSON payload from the invoice, POST it, receive `Irn`, `AckNo`, `AckDt`, `SignedQRCode`.
  3. **Render QR** → the IRP returns a signed QR string; render it (the app already uses `qrcode`) and embed on the PDF.
  4. **Cancel IRN** → call the cancel endpoint within the allowed window (24h) with a reason code.
- **Env:** `GSP_CLIENT_ID`, `GSP_CLIENT_SECRET`, `GSP_USERNAME`, `GSP_PASSWORD`, `GST_API_BASE_URL`, `EINVOICE_ENV=sandbox`.
- **Test in sandbox:** use the GSP's sandbox GSTIN + test invoices; confirm the returned IRN validates and the signed QR scans. Only then set `EINVOICE_ENV=production`.

### 5.2 GSTR auto‑filing with DSC (replace the SIMULATED stub)

- **Today:** `/gst-filing/file` returns a **SIMULATED** response.
- **Credentials/hardware needed:** a **GSP** for the filing APIs, **plus** one of the authentication methods GSTN accepts to sign/submit a return:
  - **DSC (Digital Signature Certificate)** — a Class‑2/Class‑3 certificate on a hardware token (mandatory for companies/LLPs). Signing usually happens client‑side via GSTN's DSC utility/emSigner; the signed payload is then submitted through the GSP.
  - **EVC (Electronic Verification Code)** — OTP to the authorised signatory's registered mobile/email (allowed for some taxpayer types).
- **Flow:** generate GSTR‑1/3B JSON (the app already does) → push to GSTN via GSP (`SAVE`) → **file** with DSC/EVC (`SUBMIT`/`FILE`) → store the returned **ARN**.
- **Where to plug in:** the GST filing controller/service that currently returns SIMULATED. Add a GSP client and a signing step; store the ARN on the `GSTReturn` record.
- **Test in sandbox:** GSTN provides a filing sandbox via the GSP; validate the JSON is accepted and an ARN is returned before enabling in production. **Do not** enable real filing for customers until certified.

### 5.3 E‑Way Bill (register real EWB numbers)

- **Today:** EWB number + validity are generated locally.
- **Needed:** NIC E‑Way Bill API access **through a GSP**, with EWB API credentials.
- **Where to plug in:** the E‑Way Bill service that currently mints the mock number — replace with the GSP EWB `generate`/`cancel` calls; store the real EWB number, validity and Part‑B (vehicle) updates.
- **Test in sandbox** first; confirm the number is valid on the NIC portal.

### 5.4 WhatsApp Business Cloud API (automated/templated sends)

- **Today:** a real `wa.me` deep link (works with no credentials, but requires the user to tap send).
- **Needed for automation:** a **Meta WhatsApp Business** account, a **verified business + phone number**, **`WHATSAPP_API_TOKEN`** and **`WHATSAPP_PHONE_NUMBER_ID`**, and **pre‑approved message templates** (utility/transactional).
- **Where to plug in:** add a WhatsApp service that calls the Cloud API `/{phone-number-id}/messages` endpoint; keep the `wa.me` link as the no‑cost fallback.
- **Test:** use Meta's test number + a test template before submitting templates for approval.

### 5.5 Real email & payments (already integrated — just add keys)

- **Email:** set `EMAIL_*` (SMTP) or use SendGrid (`EMAIL_HOST=smtp.sendgrid.net`, `EMAIL_USER=apikey`, `EMAIL_PASSWORD=<api-key>`). Verify your sending domain (SPF/DKIM) to avoid spam folders.
- **Payments (Razorpay):** switch test keys (`rzp_test_…`) to **live** keys (`rzp_live_…`), set `RAZORPAY_WEBHOOK_SECRET`, and register the production webhook URL (`https://api.yourdomain.com/api/webhooks/...`) in the Razorpay dashboard. Test with a live ₹1 transaction, then refund.

### 5.6 LLM features (optional future)

- The **chatbot** and **Insights** are deliberately **rules/FAQ based (no LLM)** and fully functional offline. If you later want natural‑language answers, wire an LLM provider behind the existing chatbot/insights service — but that is **not required** for production and adds cost + privacy considerations (don't send PII/financial data to a third‑party model without consent).

---

## 6. Production hardening checklist

Work through this before opening to real users. Several items are already wired in code — your job is to configure/verify.

**Transport & app security**
- [ ] **HTTPS everywhere** (TLS at Nginx/PaaS; HTTP→HTTPS redirect). No plaintext.
- [ ] `NODE_ENV=production` set (hides stack traces in error responses).
- [ ] **`helmet`** enabled (already in `src/index.js`) — verify security headers with a scan.
- [ ] **CORS** locked to real origins via `ALLOWED_ORIGINS` (no `*`, no localhost).
- [ ] **Rate limiting** (`express-rate-limit` is a dependency) applied to auth + write endpoints; tune limits.
- [ ] Tokens/cookies handled over HTTPS only; **rotate `JWT_SECRET`** from the dev value; keep JWT lifetimes short and consider refresh tokens.

**Secrets & access**
- [ ] All secrets in a **secret manager / platform env**, never in git. Confirm `.env*` is git‑ignored.
- [ ] **Least‑privilege** IAM for S3 (only the app's bucket, only needed actions), DB users scoped to the app DB.
- [ ] Restrict DB network access (private networking / security group; no public 5432 to the world).
- [ ] SSH restricted to your IP; no root login; keys not passwords.

**Data protection & compliance**
- [ ] **Automated DB backups** enabled (managed Postgres) + a **tested restore**. Document retention (e.g. 7–30 days).
- [ ] **Data retention & PII policy**: GST/financial records are sensitive — define how long you keep them, who can access them, and honour deletion requests where legally allowed (some records are statutorily retained).
- [ ] **Audit logs** (the app has an Audit Log) retained and reviewed; admin actions traceable.
- [ ] Encrypt data at rest (managed DB + S3 SSE) and in transit (TLS).

**Reliability & observability**
- [ ] **Sentry** (`SENTRY_DSN`) capturing backend (and optionally frontend) errors, with alerting.
- [ ] Structured logs shipped somewhere durable (platform logs / CloudWatch / Loki); avoid logging secrets or full PII.
- [ ] **Health checks** wired to the platform/load balancer (`/health` already exists).
- [ ] Graceful shutdown on deploy (already handled via `SIGTERM`).
- [ ] Dependency hygiene: `npm audit` in CI; patch criticals.

**GST correctness (the big one)**
- [ ] The 🟡 mock/stub features (E‑Invoice, auto‑filing, E‑Way Bill, WhatsApp automation) are either **connected to a real GSP/IRP and sandbox‑tested**, or **clearly disabled/labelled "demo"** in the UI. Never let a user believe a return was filed when it was simulated.

---

## 7. Mobile publishing (EAS → Google Play & Apple App Store)

The mobile app is an **Expo (managed) React Native** app in `mobile/`. **EAS (Expo Application Services)** builds the native binaries **in the cloud**, so you can build **both Android and iOS from a Windows PC** — no local Mac or Xcode needed. You **do still need paid developer accounts** to distribute.

> Full local dev/testing of the mobile app is in [`mobile/SETUP-AND-TESTING.md`](mobile/SETUP-AND-TESTING.md). This section is about **releasing** it.

### 7.1 Accounts & costs (get these first)

| What | Cost | Needed for |
|------|------|-----------|
| **Expo account** | Free | EAS builds/submits |
| **Google Play Console** | **$25 one‑time** | Publishing to the Play Store |
| **Apple Developer Program** | **$99 / year** | Publishing to the App Store / TestFlight |
| **Privacy policy URL** | Free (host a page) | **Required** by both stores |

> **macOS/hardware caveat for iOS:** EAS **cloud** build removes the need for a local Mac to compile the `.ipa`. However, an **Apple Developer Program membership ($99/yr) is still mandatory** to sign and distribute iOS apps. You can do the entire flow (build + submit) from Windows via EAS; you cannot ship iOS without the Apple account.

### 7.2 Install the CLI and log in

Windows (PowerShell):
```powershell
npm install -g eas-cli
eas --version
eas login            # use your Expo account
```

### 7.3 Configure the project

From the `mobile/` folder:
```powershell
cd mobile
eas build:configure
```
This creates/updates `eas.json` and sets the Android/iOS project IDs. Make sure `app.json` has correct **name**, **version**, and unique **bundle identifiers**:

- Android: `expo.android.package` — e.g. `com.yourcompany.gstcompliance`
- iOS: `expo.ios.bundleIdentifier` — e.g. `com.yourcompany.gstcompliance`
- App **icon** (`assets/icon.png`, 1024×1024) and **splash** (`assets/splash.png`) — defaults exist; replace with your branding.
- Bump `expo.version` (user‑facing, e.g. `1.0.0`) and let EAS auto‑increment the native build number on each build.

### 7.4 Point the app at the PRODUCTION API

The app reads its API base URL from `mobile/src/config.js` (`DEFAULT_API_BASE_URL`), overridable by `expo.extra.apiBaseUrl` in `app.json`. For a store build it **must** point at your HTTPS backend (localhost/LAN IPs won't exist on users' phones):

```json
// mobile/app.json  → expo.extra
"extra": {
  "apiBaseUrl": "https://api.yourdomain.com/api"
}
```
(or set `DEFAULT_API_BASE_URL = 'https://api.yourdomain.com/api'` in `src/config.js`). Rebuild after changing it.

### 7.5 Sample `eas.json` (development / preview / production profiles)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "you@yourdomain.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

- **development** → dev client for on‑device debugging.
- **preview** → shareable **APK** (Android) / internal build (iOS) for testers, no store needed.
- **production** → **AAB** for Play Store, signed IPA for App Store; `autoIncrement` bumps the build number.

### 7.6 Build the binaries (from Windows)

```powershell
# Android App Bundle (.aab) for the Play Store
eas build -p android --profile production

# iOS (.ipa) — cloud build; EAS walks you through Apple credentials
eas build -p ios --profile production
```
- For **Android** signing, let EAS **manage the keystore** (recommended) — it stores it securely so future builds match.
- For **iOS**, log in with your **Apple Developer** account when prompted; EAS creates/manages the distribution certificate and provisioning profile in the cloud.
- Each build finishes with a downloadable artifact URL and appears in your Expo dashboard.

Quick shareable test build (no store):
```powershell
eas build -p android --profile preview   # produces an installable .apk link
```

### 7.7 Submit to the stores

```powershell
# Google Play (needs a Play Console service-account JSON — see below)
eas submit -p android --profile production --latest

# Apple App Store / TestFlight
eas submit -p ios --profile production --latest
```

**Google Play one‑time setup:**
1. Create the app in **Play Console**, pay the **$25** one‑time fee.
2. Create a **service account** (Google Cloud) with Play access, download its JSON key, and reference it in `eas.json` (`serviceAccountKeyPath`).
3. First upload can also be done manually in Play Console; thereafter `eas submit` automates it. Start on the **internal testing** track, then promote to production.

**Apple App Store one‑time setup:**
1. Enrol in the **Apple Developer Program ($99/yr)**.
2. Create the app record in **App Store Connect** (get the `ascAppId`), note your **Apple Team ID**.
3. `eas submit -p ios` uploads the build; distribute via **TestFlight** first, then submit for **App Review**.

### 7.8 Store listing requirements (both stores)

- **Privacy policy URL** (mandatory) — host a page describing what data you collect (auth email, business/GST data) and how it's used/stored.
- **App icon, screenshots, description, category, content rating**.
- **Data safety (Play)** / **App Privacy (Apple)** questionnaires — answer honestly (the app stores an auth token and shows business financial data fetched from your API).
- Because this app handles financial/GST data, expect review questions about data handling — have your privacy policy and backend security story ready (Section 6).

### 7.9 Over‑the‑air (OTA) updates

For JS‑only changes you can ship without a new store review using EAS Update:
```powershell
eas update --branch production --message "Fix invoice list formatting"
```
Native changes (new native deps, permissions, icon/splash, version) still require a new `eas build` + store submission.

---

## 8. Go‑live checklist

- [ ] Managed Postgres provisioned; `prisma migrate deploy` run; `migrate status` clean; **demo seed NOT present**.
- [ ] Backend deployed (Path A or B) behind **HTTPS**; `/health` returns OK over `https://`.
- [ ] All backend env vars set; `NODE_ENV=production`; `JWT_SECRET` rotated; `ALLOWED_ORIGINS` = real web origin.
- [ ] Frontend built with `VITE_API_URL` = production API; hosted with SPA fallback + HTTPS.
- [ ] S3 (or compatible) configured so PDFs/logos/uploads persist across redeploys.
- [ ] Email + Razorpay **live** keys set and test‑verified; webhooks registered.
- [ ] Sentry receiving errors; backups enabled + a **restore tested**; rate limiting on.
- [ ] Every 🟡 mock/stub is either wired to a **real GSP/IRP (sandbox‑tested)** or clearly labelled "demo/simulated" in the UI.
- [ ] Mobile: `app.json` bundle IDs/version/icon set; API URL = production; `eas build` + `eas submit` succeeded; privacy policy live; internal testing done before production release.

---

**Owner:** Software Engineer (You)  
**Last Updated:** July 30, 2026  
**See also:** [`LOCAL-SETUP-AND-TESTING.md`](LOCAL-SETUP-AND-TESTING.md) · [`PHASE-STATUS-AND-PLAN.md`](PHASE-STATUS-AND-PLAN.md) · [`docs/07-DEVOPS-HOSTING-GUIDE.md`](docs/07-DEVOPS-HOSTING-GUIDE.md) · [`mobile/SETUP-AND-TESTING.md`](mobile/SETUP-AND-TESTING.md)
