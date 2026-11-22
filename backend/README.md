# SkillsPass Rwanda: Backend API

Backend for **SkillsPass Rwanda**, a skills portfolio and verification platform for informal workers in Rwanda.
Workers build a profile and get their main skill verified through three references. Employers search the
verified workers, message them, record completed jobs and rate the work.

This is the MVP described in the project's Software Requirements Specification (SRS). Payments, job posting,
push notifications and analytics are Phase 2 and are not included.

- **Interactive API docs:** run the server and open <http://localhost:4000/api/docs>
- **OpenAPI file:** [docs/openapi.yaml](docs/openapi.yaml) (also served as JSON at `/api/openapi.json`)

## Stack

| | |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Web framework | Express 4 |
| Database | PostgreSQL 16 via Prisma 6 |
| Validation | Zod |
| Auth | SMS OTP (no passwords), JWT access tokens, rotating refresh tokens, TOTP for admins |
| Images | `multer` + `sharp` (WebP, under 500 KB) |
| Tests | Vitest + Supertest, against a real PostgreSQL test database |

## Quick start

### 1. Prerequisites
- Node.js 22 or newer
- PostgreSQL 16 running locally (a user that can create databases, e.g. `postgres`)

### 2. Install and configure
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and set the password in `DATABASE_URL`. Then replace the placeholder secrets with random ones:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # DATA_ENCRYPTION_KEY (64 hex chars)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # PHONE_HASH_KEY
```

> `DATA_ENCRYPTION_KEY` and `PHONE_HASH_KEY` protect phone numbers in the database. **If you change them after
> users exist, nobody can log in and existing numbers cannot be decrypted.** Keep them safe and never commit `.env`.

### 3. Create the database and seed it
```bash
npx prisma migrate dev     # creates the "skillspass" database if needed and applies all migrations
npm run prisma:seed        # skill types + a development admin account
```

### 4. Run
```bash
npm run dev                # http://localhost:4000, restarts on changes
```
Check it: `curl http://localhost:4000/api/health` returns `{"status":"ok"}`.

### Trying the API by hand
With the default `SMS_PROVIDER=console`, OTP codes are **printed in the server console** instead of being texted.

```bash
# 1. Start sign-up. Watch the server console for "[SMS -> +250788123456] Your SkillsPass code is 123456"
curl -X POST localhost:4000/api/auth/register -H "content-type: application/json" \
  -d '{"role":"WORKER","phone":"0788123456","name":"Jean Mugabo","region":"Kigali","city":"Gasabo"}'

# 2. Confirm with the code: returns accessToken + refreshToken
curl -X POST localhost:4000/api/auth/register/verify -H "content-type: application/json" \
  -d '{"phone":"0788123456","code":"123456"}'

# 3. Use the token
curl localhost:4000/api/workers/me -H "authorization: Bearer <accessToken>"
```
In Swagger UI (`/api/docs`) click **Authorize** and paste the access token to try every endpoint from the browser.

## The development admin

The seed creates an admin so you can exercise the verification workflow:

- Phone: `+250780000000`
- Admins sign in with the SMS code **and** an authenticator code (NFR 10). A mistyped authenticator code does not
  use up the SMS code, so you can correct it and try again (5 tries per SMS code). The first time you seed, the console
  prints a secret key and an `otpauth://` URL. Add the secret to an authenticator app (Google Authenticator, etc.).
- Lost the secret? Reset it, then seed again to get a new one:
  ```sql
  UPDATE "Admin" SET "totpSecretEncrypted" = NULL, "secondFactorEnabled" = false;
  ```
  ```bash
  npm run prisma:seed
  ```

Never seed this admin in production. Create real admins deliberately.

## Demo data

For a presentation, add a ready-made set of accounts so every screen has something to show:

```bash
npm run seed:demo              # adds the demo data (does nothing if it is already there)
npm run seed:demo -- --reset   # removes the demo accounts and adds them again, back to the starting state
```

It needs the development admin from `npm run prisma:seed` and refuses to run in production. It only ever touches
its own accounts (phone numbers `+250788100001` to `+250788100011` and `+250788200001` to `+250788200003`), so other
data in the database is left alone. The pictures are generated artwork, not real people.

| Sign in as | Phone | What you see |
|---|---|---|
| Worker: Jean Bosco Niyonzima | `+250788100001` | Verified electrician, 3 reviews, a finished job to confirm, 2 unread messages |
| Employer: Inzozi Builders | `+250788200001` | 2 favorites, a running job, a confirmed job to rate, 1 unread reply |
| Staff: Admin Alice | `+250780000000` | Verification queue, a flagged skill (needs the authenticator code from the first seed) |

Other cases are in the data for the admin screens and the worker's Verify tab: a verification in progress (Olivier
Mugisha), a brand-new profile that isn't visible yet (Grace Uwimana), a skill flagged for review (Vestine
Nyirahabimana) and a failed verification that can be tried again (Samuel Tuyishime). Sign in with the phone number
and read the SMS code from the server console.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-restart |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm test` | Run all tests (creates and migrates a `skillspass_test` database automatically) |
| `npm run typecheck` | TypeScript check without emitting |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | Create/apply migrations during development |
| `npx prisma migrate deploy` | Apply migrations in production (create the database first) |
| `npm run prisma:seed` | Seed skill types and the dev admin (safe to re-run) |
| `npm run seed:demo` | Add demo workers, employers, jobs and messages (see "Demo data") |
| `npx prisma studio` | Browse the database in a web UI |

## Configuration

All settings are environment variables, checked at startup (the server refuses to start if one is invalid).

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `development`, `test` or `production` | `development` |
| `PORT` | HTTP port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing / hashing secrets (32+ chars) | required |
| `DATA_ENCRYPTION_KEY` | 64 hex chars; AES-256-GCM key for phone numbers at rest | required |
| `PHONE_HASH_KEY` | Key for the phone-number lookup hash and OTP hashes | required |
| `UPLOAD_DIR` | Where photos are stored | `uploads` |
| `SMS_PROVIDER` | `console` (prints OTPs) or `pindo` (real SMS) | `console` |
| `PINDO_API_TOKEN` / `PINDO_SENDER_ID` | Pindo token and sender ID (max 11 chars); required when `SMS_PROVIDER=pindo` | none |
| `ENABLE_DOCS` | `true` / `false`; Swagger UI at `/api/docs` | on, except in production |

## Project layout

```
backend/
├── docs/openapi.yaml        API contract (served at /api/docs)
├── prisma/
│   ├── schema.prisma        Data model
│   ├── migrations/          SQL migrations (some include hand-written constraints and indexes)
│   ├── seed.ts              Skill types + dev admin
│   └── skill-types.ts       The skill dropdown options (Kinyarwanda, English, French)
├── src/
│   ├── app.ts / server.ts   Express app and entry point
│   ├── routes.ts            Mounts the modules under /api
│   ├── config/env.ts        Validated environment
│   ├── shared/              Errors, crypto, TOTP, images, storage, SMS, Prisma client
│   └── modules/
│       ├── auth/            Register, login (OTP), tokens, role middleware
│       ├── profile/         Worker + employer profiles, skills, photos, phone change
│       ├── verification/    Reference submission, admin results, 2-of-3 rule
│       ├── search/          Employer search, worker view, favorites
│       ├── jobs-ratings/    Job completion workflow, ratings
│       └── messaging/       Threads, conversation list, unread badge
└── tests/                   One test file per module + OpenAPI consistency
```

It is a **modular monolith** matching the SRS component diagram: one deployable app, six modules. Modules talk
through plain function calls. The one rule shared across modules lives in
[`profile/visibility.ts`](src/modules/profile/visibility.ts) (see BR 1 below), so Search, Favorites, Jobs and
Messaging cannot disagree about who is visible.

## How the main flows work

**Sign-up / sign-in.** `register` validates and texts an OTP but creates nothing; `register/verify` creates the
account. Login is `login` then `login/verify`. OTPs last 5 minutes, are single use, allow 5 wrong guesses and one
request per minute per number. Access tokens last 15 minutes; refresh tokens last 30 days, work once, and reuse of
an old one revokes the user's sessions.

**Becoming visible to employers.** A worker needs a complete profile (main skill, photo, bio) **and** a verified
main skill:

1. Worker sets a main skill and submits 3 references (`POST /workers/me/references`).
2. An admin phones each reference and records `CONFIRMED`, `NOT_CONFIRMED` or `UNREACHABLE`.
3. At 2 confirmations the skill becomes `VERIFIED`. When 2 confirmations are no longer possible it becomes
   `NOT_VERIFIED` and the worker can submit a fresh set (the old round stays as history).

**Hiring.** Employer searches (`GET /workers`), messages the worker, then records a job. The employer marks it
completed, the worker confirms, and only then can the employer rate it. Each rating updates the worker's stored
average, which search uses.

## Business rules and where they are enforced

| Rule | Enforced in | Tested in |
|---|---|---|
| **BR 1** Visible only if profile complete and main skill verified | `profile/visibility.ts`, used by search, favorites, jobs, messaging | `search`, `profile`, `verification` tests |
| **BR 2** Only visible workers can be contacted | `messaging/messages.service.ts`, `jobs-ratings/jobs.service.ts` | `messaging`, `jobs` tests |
| **BR 3** Rate only after confirmed completion, once per job | `jobs-ratings/ratings.service.ts` + unique `Rating.jobId` | `jobs` tests |
| **BR 4** Edits and verification (years keep status + flag; new main skill resets; new phone needs OTP) | `profile/skills.service.ts`, `profile/phone.service.ts` | `profile` tests |
| **BR 5** Phone hidden unless the worker shares it | `search/search.service.ts` (`shareContact`) | `search` tests |

Some rules are also enforced by the database itself (migration SQL): one main skill per worker, ratings 1 to 5,
one unfinished job per employer/worker pair.

## Errors

Every error is JSON with a stable `code` the frontend translates into Kinyarwanda, English or French:

```json
{ "error": { "code": "PHONE_TAKEN" } }
```
Validation failures use `VALIDATION_ERROR` plus field `details`. The full list of codes is in the API docs, and a
test fails if a code exists in the code base but not in the docs.

## Testing

```bash
npm test
```
Tests run against a real PostgreSQL database named `skillspass_test`, created automatically using the credentials in
your `.env` (your development data is never touched). They cover each module, concurrency cases (double
submissions, simultaneous ratings and admin results), the privacy rules, and a performance check with 5,000
workers against the 2-second search target. The suite takes about 1.5 minutes.

`tests/openapi.test.ts` compares `docs/openapi.yaml` with the routes the server really exposes, in both directions.
**If you add, remove or rename an endpoint, update the YAML or this test fails.**

## Security notes

- Phone numbers are encrypted at rest (AES-256-GCM); a keyed hash is used for lookups. Reference phone numbers are
  encrypted too and shown only to admins.
- No endpoint returns another user's phone number unless the worker enabled `shareContact`.
- Uploaded images are decoded and re-encoded (so a non-image is rejected), stripped of EXIF/GPS data, renamed with
  random IDs, and size-limited.
- Rate limits: auth endpoints 40 requests / 15 min per IP; messages 30 / min per user.
- Behind HTTPS only in production (NFR 7): terminate TLS at your reverse proxy or host.

## Known limitations and next steps

- **SMS:** set `SMS_PROVIDER=pindo` (with `PINDO_API_TOKEN` and `PINDO_SENDER_ID`) to send real OTPs through
  [Pindo](https://docs.pindo.ai/docs/messaging/overview). `PindoTest` is only Pindo's sample sender: register your own
  sender ID (for example `SkillsPass`) before launch. If sending fails the API returns `502 SMS_SEND_FAILED` and the
  code is discarded so the user can retry immediately.
- **File storage:** photos go to local disk. For production implement `FileStorage` in
  [`shared/storage.ts`](src/shared/storage.ts) for S3-compatible object storage.
- **Rate limiting** is in memory, so it resets on restart and is per instance. Use a shared store (e.g. Redis) when
  running more than one instance.
- **Messaging** is polling-based (`?after=cursor`), as the SRS describes "API-based" messaging. WebSockets could be
  added later without changing the data model.
- **Backups, uptime and recovery** (NFR 16 to 18) are deployment concerns: schedule daily PostgreSQL backups to a
  separate location.
- Admin accounts must be created manually (there is no admin sign-up by design) and admins cannot yet enrol their
  own authenticator; the seed does this for the dev admin.
- No manual "mark verified" override: a skill is verified only through recorded reference results, so there is
  always an audit trail (who recorded what, and when).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Invalid environment configuration` on start | A variable in `.env` is missing or malformed; the message names it. |
| `Authentication failed against database server` | The password in `DATABASE_URL` is wrong. |
| `prisma migrate dev` says the environment is non-interactive | It refused to run because a change needs confirmation. Run it in a normal terminal, or write the migration SQL and apply it with `npx prisma migrate deploy`. |
| Cannot log in after changing `.env` keys | `DATA_ENCRYPTION_KEY` / `PHONE_HASH_KEY` must stay the same once users exist. |
| Tests fail to connect | PostgreSQL must be running and the `.env` user must be allowed to create databases. |
| Photo uploads return 400 `INVALID_IMAGE` | The file is not a real JPEG, PNG or WebP image. |
