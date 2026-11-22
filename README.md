# SkillsPass Rwanda

A skills portfolio and verification platform that lets informal workers in Rwanda document and verify their skills,
and lets employers find verified workers. Built for the African Leadership University Introduction to Software
Engineering project.

| Folder | Contents |
|---|---|
| [backend/](backend/) | The API (Node.js, TypeScript, Express, PostgreSQL). Start with [backend/README.md](backend/README.md). |
| [frontend/](frontend/) | The web app (React, TanStack Start) for workers, employers and staff. Start with [frontend/README.md](frontend/README.md). |

The API is documented interactively at `/api/docs` once the server is running, and in
[backend/docs/openapi.yaml](backend/docs/openapi.yaml).

## Run everything locally

1. Make sure PostgreSQL is running, then set up and start the API (port 4000): follow [backend/README.md](backend/README.md).
2. In another terminal: `cd frontend && npm install && npm run dev` (port 3000).
3. Open <http://localhost:3000>. The API prints SMS codes in its console while `SMS_PROVIDER=console`.

## Demo walkthrough

Add the demo data (see [backend/README.md](backend/README.md#demo-data)): `npm run prisma:seed` once, then
`npm run seed:demo` in `backend/`. Keep the backend console visible, because it prints the SMS codes. If port 3000 is
busy, Vite uses the next free one and prints it.

1. **Worker** (`+250788100001`, Jean Bosco Niyonzima). Sign in and show the profile: verified skill, "Employers can find
   you", the work photos. Open **Jobs** and confirm the finished job. Open **Messages** (unread badge) and reply.
2. **Employer** (`+250788200001`, Inzozi Builders), on a laptop. Search, filter by skill, open Eric Habimana (reviews, shared
   phone), favorite someone. In **Jobs**, rate the finished plumbing job. In **Messages**, see Jean's reply from step 1.
3. **Staff** (`+250780000000`). Sign in with the SMS code and the authenticator code. Open Olivier Mugisha's round, call
   the references (record two confirmations) and watch the skill become Verified. Clear the flagged skill.
4. **A new worker.** Register with any Rwandan mobile number, choose a skill, and show that the profile is not visible to
   employers yet, then that the Verify tab asks for three references.

Run `npm run seed:demo -- --reset` in `backend/` between demos to start from the same state.

