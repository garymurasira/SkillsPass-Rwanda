# Deploying SkillsPass Rwanda

| Part | Host | Why |
|---|---|---|
| Database | [Neon](https://neon.tech) (free PostgreSQL) | No expiry on the free tier |
| Photos | [Cloudflare R2](https://developers.cloudflare.com/r2/) (or any S3-compatible bucket) | The API host's disk is wiped on restart |
| API | [Render](https://render.com) web service (`render.yaml`) | Runs the Express server |
| Web app | [Vercel](https://vercel.com) | Builds the TanStack Start app |

Do the steps in this order. Keep the secret values in a password manager, not in the repository.

## 1. Secrets
Make two keys once. The **same** two values must be used when seeding the database and on Render, because phone
numbers are encrypted and hashed with them.

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # DATA_ENCRYPTION_KEY (64 hex chars)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # PHONE_HASH_KEY
```

## 2. Database (Neon)
1. Create a project. Copy the **direct** connection string (turn the "Pooled connection" switch off). It ends with
   `?sslmode=require`. This is `DATABASE_URL`.

## 3. Photo bucket (Cloudflare R2)
1. R2 → Create bucket (e.g. `skillspass-photos`). Settings → **Public access** → allow the `r2.dev` URL. Copy it: `S3_PUBLIC_URL`.
2. R2 → Manage API tokens → create a token with **Object Read & Write** on that bucket. Copy the Access Key ID and Secret.
3. `S3_ENDPOINT` is `https://<account-id>.r2.cloudflarestorage.com` (shown on the R2 overview page).

## 4. Put the schema and demo data in Neon (run on your computer, in `backend/`)
PowerShell. Replace every `<...>`. `NODE_ENV` stays `development` here, because the seed scripts refuse to run in production.

```
$env:DATABASE_URL="<neon url>"; $env:DATA_ENCRYPTION_KEY="<key>"; $env:PHONE_HASH_KEY="<key>"
$env:JWT_ACCESS_SECRET="x"*32; $env:JWT_REFRESH_SECRET="y"*32
$env:STORAGE_DRIVER="s3"; $env:S3_ENDPOINT="<endpoint>"; $env:S3_BUCKET="<bucket>"
$env:S3_ACCESS_KEY_ID="<id>"; $env:S3_SECRET_ACCESS_KEY="<secret>"; $env:S3_PUBLIC_URL="<r2.dev url>"
npx prisma migrate deploy
$env:ADMIN_PHONE="+2507XXXXXXXX"   # a number you control: staff sign-in codes are texted to it
npm run prisma:seed        # skill types + the admin; prints the admin authenticator secret. Save it.
npm run seed:demo          # demo workers, employers, jobs, messages; photos are uploaded to the bucket
```

Close that terminal afterwards so the variables are gone.

## 5. API (Render)
1. Push the branch to GitHub. Render → New → **Blueprint** → pick the repo and branch. It reads `render.yaml`.
2. Fill in the variables marked "sync: false": `DATABASE_URL`, `DATA_ENCRYPTION_KEY`, `PHONE_HASH_KEY` (same values as step 4),
   `ESMS_API_KEY` (or the Pindo values if you use real SMS), and the five `S3_*` values.
3. Deploy. Open `https://<service>.onrender.com/api/health`; it should answer `ok`.

The free plan sleeps after about 15 minutes idle. The first request after that takes up to a minute.

## 6. Web app (Vercel)
1. New Project → import the repo. Set **Root Directory** to `frontend`. The framework is detected (the build uses Nitro).
2. Add the environment variable `VITE_API_URL` = `https://<service>.onrender.com/api` (include `/api`).
3. Deploy. This is the public URL to give graders.

## 7. Check it
- Landing page loads and the language switcher works.
- Sign in: with `DEMO_MODE=true` the code shows on screen; otherwise it is sent by the SMS provider you chose.
- Upload a profile photo and reload; the photo is still there after the API restarts.

## Things to know
- `SMS_PROVIDER=esms` with an `esms_test_` key simulates delivery: nothing reaches a phone. With `DEMO_MODE=true` the
  web app shows the code on screen, so the seeded demo accounts (fake numbers) can be used. Turn `DEMO_MODE` off after
  the demonstration. For real SMS, use `SMS_PROVIDER=pindo` or an `esms_live_` key.
- The admin is seeded on `ADMIN_PHONE` (step 4). Staff sign-in needs that phone's SMS code plus the authenticator code.
- The Pindo sender `PindoTest` is Pindo's sample sender. Register your own before a real launch.
