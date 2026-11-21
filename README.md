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
