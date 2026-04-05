# Railway Deploy

Deploy this repo as two separate Railway services.

## Service 1: Backend

- Service type: GitHub repo service
- Root directory: `backend`
- Builder: `Nixpacks`
- Start command: auto from `backend/nixpacks.toml`
- Healthcheck path: `/api/health`

Variables to set on the backend service:

- `DATABASE_URL` from Railway Postgres
- `REDIS_URL` from Railway Redis
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4o-mini`
- `SECRET_KEY`
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=1440`
- `REFRESH_TOKEN_EXPIRE_DAYS=14`
- `ENVIRONMENT=production`
- `DEBUG=false`
- `FRONTEND_ORIGIN=https://<your-frontend-domain>`

## Service 2: Frontend

- Service type: GitHub repo service
- Root directory: `frontend`
- Builder: `Nixpacks`
- Start command: auto from `frontend/nixpacks.toml`

Variables to set on the frontend service:

- `VITE_API_URL=https://<your-backend-domain>/api`
- `VITE_ENABLE_BILLING=false`

## Railway resources

Create and attach:

- one PostgreSQL service to the backend
- one Redis service to the backend

Do not attach Postgres or Redis to the frontend service.

## Important

- The repository root is not the deploy root.
- If Railway logs show it is building from repo root, the service root directory is wrong.
- Backend must point to `backend`.
- Frontend must point to `frontend`.
