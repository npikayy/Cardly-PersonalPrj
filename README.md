# Cardly Personal

Cardly Personal is a personal contact-management app for turning business-card images into searchable contacts. It includes account auth, email OTP verification, OCR review, manual contact entry, saved contact details, business-card image preview, and a public digital contact card.

## Features

- Email/password authentication with OTP account verification.
- Upload one or two business-card images.
- Store original card images with Cloudinary.
- Run OCR, review extracted fields, edit context, then save to contacts.
- Manage saved contacts with search, detail pages, notes, tags, highlights, QR data, and original card images.
- Add contacts manually without OCR.
- Create a public digital card at `/card/:slug`.
- Switch the app language between Vietnamese and English.
- Separate frontend routes for app pages:
  - `/contacts`
  - `/contacts/new`
  - `/contacts/:contactId`
  - `/ocr`
  - `/digital`
  - `/card/:slug`

## Tech Stack

Backend:

- FastAPI
- MongoDB with Beanie/Motor
- Cloudinary for uploaded image storage
- PaddleOCR/OpenCV processing flow
- Gemini-powered extraction/enrichment
- SMTP for OTP emails

Frontend:

- React
- Vite
- Lucide React icons
- Plain CSS with responsive layouts

## Project Structure

```text
.
├── src/
│   ├── auth/          # Auth, OTP, JWT, SMTP email
│   ├── common/        # Shared models/enums/helpers
│   ├── documents/     # Uploads, contacts, reviews, digital card APIs
│   ├── processing/    # OCR, preprocessing, enrichment
│   ├── config.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vercel.json
├── requirements/
│   └── base.txt
├── docs/
│   └── DEPLOYMENT.md
├── Dockerfile
└── render.yaml
```

## Local Setup

### 1. Backend Environment

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements\base.txt
```

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Fill the required values in `.env`:

```env
MONGODB_URL=
PUBLIC_BASE_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET=
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

Run backend:

```powershell
uvicorn src.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

API docs in local mode:

```text
http://127.0.0.1:8000/docs
```

### 2. Frontend Environment

Install frontend dependencies:

```powershell
cd frontend
npm install
```

Create frontend env file:

```powershell
Copy-Item .env.example .env
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Run frontend:

```powershell
npm run dev
```

Frontend runs at:

```text
http://127.0.0.1:5173
```

## Common Commands

Backend checks:

```powershell
python -m compileall -q src
ruff check src
```

Frontend build:

```powershell
cd frontend
npm run build
```

## Main API Routes

Auth:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Documents and OCR:

```text
GET    /api/v1/documents
POST   /api/v1/documents
DELETE /api/v1/documents
GET    /api/v1/documents/{processing_id}/image
POST   /api/v1/documents/{processing_id}/ocr
PATCH  /api/v1/documents/{processing_id}/review
POST   /api/v1/documents/{processing_id}/confirm
DELETE /api/v1/documents/{processing_id}
```

Contacts:

```text
GET    /api/v1/documents/contacts
POST   /api/v1/documents/contacts
DELETE /api/v1/documents/contacts/{contact_id}
```

Digital card:

```text
GET /api/v1/documents/digital-card
PUT /api/v1/documents/digital-card
GET /api/v1/documents/digital-cards/{slug}/public
```

Health:

```text
GET /api/v1/health
GET /api/v1/health/db
```

## Deployment

Deployment configuration is included:

- `Dockerfile` for backend Docker hosting.
- `render.yaml` for Render backend + static frontend.
- `frontend/vercel.json` for Vercel static frontend routing.

Recommended order:

1. Deploy backend first.
2. Copy backend URL.
3. Set frontend `VITE_API_BASE_URL=https://your-backend-domain/api/v1`.
4. Deploy frontend.
5. Copy frontend URL.
6. Set backend `PUBLIC_BASE_URL=https://your-frontend-domain`.
7. Set backend `CORS_ORIGINS=https://your-frontend-domain`.
8. Redeploy backend.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment checklist.

## Notes

- Do not commit `.env`.
- Cloudinary is required for image upload and preview.
- SMTP credentials are required for OTP registration emails.
- Production frontend routes must rewrite to `index.html` because the app uses client-side routing.
- The OCR queue intentionally hides processed or confirmed scans; saved contacts remain in the contacts page.
