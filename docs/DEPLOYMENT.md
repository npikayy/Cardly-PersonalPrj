# Cardly Deployment

## Backend

Deploy the repository root as a Docker web service.

Start command is defined in `Dockerfile`:

```bash
uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

Required backend environment variables:

```bash
ENVIRONMENT=production
APP_VERSION=1.0.0
MONGODB_URL=
REDIS_URL=
PUBLIC_BASE_URL=https://your-frontend-domain
CORS_ORIGINS=https://your-frontend-domain
JWT_SECRET=
JWT_EXP=480
REFRESH_TOKEN_EXP=7
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
EMAIL_FROM_NAME=Cardly
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=cardly
```

Health check:

```bash
/api/v1/health
```

## Frontend

Deploy `frontend` as a static Vite app.

Build command:

```bash
npm ci && npm run build
```

Output directory:

```bash
dist
```

Required frontend environment variable:

```bash
VITE_API_BASE_URL=https://your-backend-domain/api/v1
```

SPA routes such as `/contacts`, `/ocr`, `/digital`, and `/card/:slug` must rewrite to `index.html`.

## Deployment Order

1. Deploy backend first.
2. Copy backend URL.
3. Set `VITE_API_BASE_URL` in frontend.
4. Deploy frontend.
5. Copy frontend URL.
6. Set backend `PUBLIC_BASE_URL` to the frontend URL.
7. Set backend `CORS_ORIGINS` to the frontend URL.
8. Redeploy backend.
