# Field Notes: a three-tier Node.js app

| Tier | Folder | Tech | Runs on |
|---|---|---|---|
| Frontend | `frontend/` | React (Create React App) | AWS Amplify |
| Backend | `backend/` | Node.js + Express, port 5000 | EC2 behind nginx |
| Database | n/a | PostgreSQL (`pg`), table created on startup | Amazon RDS |

## Environment variables

- Backend: `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), `FRONTEND_URL`, `PORT`.
- Frontend: `REACT_APP_API_URL`, the public address of the backend (no trailing slash). It is baked in at build time.

## Run locally

```bash
# terminal 1
cd backend && cp .env.example .env   # edit DATABASE_URL
npm install && npm start

# terminal 2
cd frontend && cp .env.example .env
npm install && npm start
```

## API

- `GET /` and `GET /health`: health checks
- `GET /api/notes`, `POST /api/notes`
- `PATCH /api/notes/:id/toggle`, `DELETE /api/notes/:id`
