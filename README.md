# SkillsPass Rwanda

A skills portfolio and verification platform for informal workers in Rwanda. Workers build a profile with photos of
their work and get their main skill verified by three references. Employers search the verified workers, message them,
record completed jobs and rate the work. Staff verify the references by phone.

Built by Gary Murasira for the African Leadership University *Introduction to Software Engineering* project. It
implements the MVP in the project's Software Requirements Specification (SRS).

**Live demo:** <https://skills-pass-rwanda.vercel.app>
(the API runs on Render's free plan, so the first request after a quiet period can take up to a minute)

---

## Contents

1. [Try the live demo](#1-try-the-live-demo)
2. [What it does](#2-what-it-does)
3. [Run it on your own computer, step by step](#3-run-it-on-your-own-computer-step-by-step)
4. [Sign in and try every role](#4-sign-in-and-try-every-role)
5. [Run the tests](#5-run-the-tests)
6. [Configuration](#6-configuration)
7. [Deploy it](#7-deploy-it)
8. [Project layout](#8-project-layout)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Try the live demo

Open <https://skills-pass-rwanda.vercel.app>. You do not need a phone: the live demo runs in **demo mode**, which
shows the sign-in code on screen in a yellow card ("DEMO MODE") instead of texting it. Tap **Use this code** to sign in.

| Role | Phone number to enter | What you see |
|---|---|---|
| Worker (Jean Bosco Niyonzima) | `0788100001` | Verified electrician, 3 reviews, a finished job to confirm, 2 unread messages |
| Employer (Inzozi Builders) | `0788200001` | 2 favorites, a running job, a finished job to rate, 1 unread reply |
| New worker | any valid Rwandan mobile number, for example `0788300010` | Register, choose a skill, add a photo and bio, then give 3 references |

The staff (verifier) screens need an authenticator-app code that only the project owner holds, so they are shown in
the demo video. To use them yourself, run the project locally (section 3) and follow section 4.

Demo mode is for demonstration only: while it is on, anyone who knows a phone number can sign in as that account.

## 2. What it does

| Who | Can |
|---|---|
| **Worker** | Register with a phone number and an SMS code (no passwords). Choose one main skill with years of experience, add other skills, a profile photo, up to 12 work photos and a bio (300 characters). Submit three references to get the main skill verified. Reply to employers, confirm finished jobs, see ratings. |
| **Employer** | Register a company. Search verified workers by skill, location and minimum rating. View profiles, portfolios and reviews. Save favorites, message workers, mark a job completed and rate the worker once the worker confirms it. |
| **Staff (admin)** | Sign in with an SMS code **and** an authenticator code. See the verification queue, record each reference as Confirmed, Not confirmed or Unreachable, and review flagged skills. |

Also: Kinyarwanda, English and French everywhere; installable on a phone (web app manifest); photos compressed to
under 500 KB; phone numbers encrypted in the database and hidden unless the worker chooses to share them.

**Main rules from the SRS:** a worker is visible to employers only when the profile is complete and the main skill is
verified (BR 1). A skill is verified when 2 of 3 references confirm. Employers can only message visible workers, and
workers can only reply (BR 2). A rating needs a job that the worker has confirmed, once per job (BR 3).

## 3. Run it on your own computer, step by step

You will run **three things**: a PostgreSQL database, the backend API (port 4000) and the frontend web app (port 3000).
Follow the steps in order. Commands work in Windows PowerShell, macOS Terminal and Linux, except where noted.

### Step 1. Install the tools

| Tool | Version | Check it |
|---|---|---|
| [Git](https://git-scm.com/downloads) | any recent | `git --version` |
| [Node.js](https://nodejs.org) (includes npm) | **22 or newer** | `node -v` |
| [PostgreSQL](https://www.postgresql.org/download/) | **16 or newer** | `psql --version` |

When you install PostgreSQL, **write down the password** you set for the `postgres` user and make sure the PostgreSQL
service is running. The default port is 5432.

### Step 2. Get the code

```bash
git clone https://github.com/garymurasira/SkillsPass-Rwanda.git
cd SkillsPass-Rwanda
```

### Step 3. Set up the backend

Open a terminal in the project folder, then:

```bash
cd backend
npm install
```

Create the settings file by copying the example:

```bash
# macOS / Linux / Git Bash
cp .env.example .env
# Windows PowerShell
copy .env.example .env
```

Open `backend/.env` in a text editor and change **two things**:

1. **`DATABASE_URL`**: replace `YOUR_PASSWORD` with your PostgreSQL password:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/skillspass"
   ```
   (the database named `skillspass` is created for you in step 4)
2. **The four secrets.** Run each command, copy the line it prints, and paste it after the matching name in `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # use for JWT_ACCESS_SECRET
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # run again: use for JWT_REFRESH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # use for DATA_ENCRYPTION_KEY
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # use for PHONE_HASH_KEY
   ```

Leave everything else as it is. `SMS_PROVIDER=console` means sign-in codes are **printed in the backend terminal**
instead of being texted, so you need no SMS account.

> Keep `DATA_ENCRYPTION_KEY` and `PHONE_HASH_KEY` unchanged once you have created accounts. They protect phone numbers
> in the database, and changing them makes existing accounts unusable. Never commit `.env`.

### Step 4. Create the database and add the starting data

Still in `backend/`:

```bash
npx prisma migrate dev     # creates the "skillspass" database and its tables
npm run prisma:seed        # adds the skill list and a staff (admin) account
npm run seed:demo          # adds demo workers, employers, jobs and messages (optional but recommended)
```

The `prisma:seed` command prints an **authenticator secret key** the first time it runs. **Copy it**; you need it to
sign in as staff (section 4).

### Step 5. Start the backend

```bash
npm run dev
```

Leave this terminal open. You should see `SkillsPass API listening on port 4000`. Check it in a browser:
<http://localhost:4000/api/health> shows `{"status":"ok"}`. Interactive API documentation is at
<http://localhost:4000/api/docs>.

### Step 6. Set up and start the frontend

Open a **second terminal** in the project folder:

```bash
cd frontend
npm install
npm run dev
```

You should see `Local: http://localhost:3000/`. The frontend finds the backend at `http://localhost:4000/api` by
default. Only if your backend runs somewhere else, copy `frontend/.env.example` to `frontend/.env.local` and change
`VITE_API_URL`.

### Step 7. Open the app

Go to <http://localhost:3000>. If port 3000 is busy, the dev server uses the next free port and prints it.
Continue with section 4 to sign in.

## 4. Sign in and try every role

There are no passwords. You type a phone number, then a 6-digit code.

**Where the code appears (local setup):** in the **backend terminal**, as a line like
`[SMS -> +250788100001] Your SkillsPass code is 482913. It expires in 5 minutes.`

**Easier for demos, no terminal needed:** open `backend/.env`, add the line `DEMO_MODE=true`, and restart the
backend (`Ctrl+C`, then `npm run dev`). The code then appears on the sign-in screen in a yellow card with a
**Use this code** button.

| Role | Phone | Notes |
|---|---|---|
| Worker (Jean Bosco Niyonzima) | `0788100001` | Needs `npm run seed:demo` (step 4) |
| Employer (Inzozi Builders) | `0788200001` | Needs `npm run seed:demo` |
| Staff (Admin Alice) | `0780000000` | Sign in at <http://localhost:3000/admin/login>. Needs the SMS code **and** an authenticator code (below) |
| A new account | any Rwandan mobile number | Use the **Register** buttons on the home page |

**Staff authenticator code.** Install an authenticator app on your phone (Google Authenticator, Microsoft
Authenticator or Authy). Add an account with **Enter a setup key**, paste the secret key printed by
`npm run prisma:seed`, choose **time-based**, and save. The app then shows a 6-digit code that changes every 30
seconds; type the current one on the staff sign-in page. If you lost the secret, see "The development admin" in
[backend/README.md](backend/README.md#the-development-admin).

**A suggested walkthrough (about 5 minutes):**

1. **Worker** (`0788100001`): look at the profile (verified skill, work photos), open **Jobs** and confirm the finished
   job, open **Messages** and reply.
2. **Employer** (`0788200001`, use a second browser window or a private window): search by skill, open a worker
   (reviews, shared phone number), save a favorite. In **Jobs**, rate the finished job.
3. **Staff** (`0780000000`): open Olivier Mugisha's verification round, record two references as Confirmed, and watch
   the skill become Verified.
4. **A new worker:** register with any Rwandan mobile number, choose a skill, and see that the profile is hidden from
   employers until it has a photo, a bio and a verified skill. The **Verify** tab is where the three references are
   submitted.

To put the demo data back in its starting state: `npm run seed:demo -- --reset` in `backend/`
(on PowerShell write it as `npm run seed:demo "--" --reset`).

## 5. Run the tests

```bash
cd backend && npm test      # about 1.5 minutes; creates a separate "skillspass_test" database automatically
cd frontend && npm test     # about 30 seconds; needs no backend
```

Both also have `npm run typecheck` and `npm run lint`.

## 6. Configuration

Every setting is an environment variable in `backend/.env`. The server checks them at startup and refuses to start
if one is wrong. The full list is in [backend/README.md](backend/README.md#configuration). The ones you may change:

| Variable | Use it to |
|---|---|
| `SMS_PROVIDER` | `console` (default, prints codes), `pindo` (real SMS via [Pindo](https://pindo.io)) or `esms` (eSMS Africa; a key starting `esms_test_` is a free sandbox that sends nothing) |
| `DEMO_MODE` | `true` shows the sign-in code on screen (demonstrations only, never for real users) |
| `STORAGE_DRIVER` | `local` (photos in `backend/uploads`, default) or `s3` (any S3-compatible bucket, needed on hosts that wipe their disk) |
| `ENABLE_DOCS` | `true` / `false` for the API documentation page |

## 7. Deploy it

[DEPLOY.md](DEPLOY.md) explains the hosting used for the live demo: PostgreSQL on Neon, photos in a Supabase
(S3-compatible) bucket, the API on Render (configured by [render.yaml](render.yaml)) and the web app on Vercel.

## 8. Project layout

| Folder | Contents |
|---|---|
| [backend/](backend/) | The API: Node.js, TypeScript, Express, Prisma, PostgreSQL. Details in [backend/README.md](backend/README.md) |
| [frontend/](frontend/) | The web app: React, TanStack Start, Tailwind. Details in [frontend/README.md](frontend/README.md) |
| [DEPLOY.md](DEPLOY.md), [render.yaml](render.yaml) | Deployment guide and Render configuration |

The API contract is in [backend/docs/openapi.yaml](backend/docs/openapi.yaml) and is served interactively at
`/api/docs` while the backend runs.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `node -v` shows a version below 22 | Install Node.js 22 or newer from <https://nodejs.org>, then reopen the terminal |
| Backend says `Invalid environment configuration` | A value in `backend/.env` is missing or malformed. The message names the variable. Check the four secrets are filled in and `DATA_ENCRYPTION_KEY` is exactly 64 hex characters |
| `Authentication failed against database server` | The password in `DATABASE_URL` is wrong |
| `Can't reach database server at localhost:5432` | PostgreSQL is not running. Start the PostgreSQL service |
| `npx prisma migrate dev` fails or asks for confirmation | Run it in a normal interactive terminal. If the database already exists with tables, use `npx prisma migrate deploy` |
| The page loads but sign-in says it cannot connect | The backend is not running, or `VITE_API_URL` points to the wrong address. Check <http://localhost:4000/api/health> |
| No sign-in code appears | Look in the **backend** terminal (not the browser). Or set `DEMO_MODE=true` as described in section 4 |
| "Please wait before asking for another code" | Codes can be requested once a minute. Wait, or use `DEMO_MODE=true` (5 seconds) |
| Too many requests / rate limited | Sign-in is limited to 40 requests per 15 minutes per address. Restart the backend to reset it |
| Staff sign-in says the authenticator code is wrong | The code changes every 30 seconds. Type the current one, and make sure your phone's clock is set to automatic |
| Photos do not appear | Photos are stored in `backend/uploads`; keep the backend running. Photos need a real JPEG, PNG or WebP file |
| Tests cannot connect to the database | PostgreSQL must be running, and the user in `DATABASE_URL` must be allowed to create databases |
| On Windows, `npm run seed:demo -- --reset` ignores `--reset` | Write it as `npm run seed:demo "--" --reset` (PowerShell) or run it in Git Bash |
