# Cardly Personal

Cardly Personal is a personal contact-management app for turning business-card images and QR links into searchable contacts. It includes account auth, email OTP verification, OCR review, manual contact entry, saved contact details, business-card image preview, QR contact sharing, QR bundles, and a public digital contact card.

## Features

- Email/password authentication with OTP account verification.
- Upload one or two business-card images.
- Store original card images with Cloudinary.
- Run OCR with progress feedback, review extracted fields, edit context, then save to contacts.
- Keep unfinished OCR reviews available in the scan queue until they are saved or deleted.
- Manage saved contacts with search, detail pages, edit/delete actions, notes, highlights, QR data, and original card images.
- Add contacts manually without OCR.
- Add contacts by scanning a Cardly QR code from a digital card, shared contact, or contact bundle.
- Generate downloadable QR codes for individual contacts.
- Select multiple contacts and generate a downloadable QR bundle for sharing many contacts at once.
- Open public contact bundle pages at `/bundle/:bundleId`.
- Create a public digital card at `/card/:slug` with avatar, position, company, bio, contact channels, and downloadable QR.
- Download QR codes as images with the Cardly logo in the center.
- Switch the app language between Vietnamese and English.
- Separate frontend routes for app pages:
  - `/contacts`
  - `/contacts/new`
  - `/contacts/qr`
  - `/contacts/:contactId`
  - `/ocr`
  - `/digital`
  - `/card/:slug`
  - `/contact/:contactId`
  - `/bundle/:bundleId`

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
- HeroUI
- Tailwind CSS
- Lucide React icons

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
OCR_LANGUAGE=vi
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
GET    /api/v1/documents/contacts/{contact_id}/public
POST   /api/v1/documents/contacts/from-digital-qr
DELETE /api/v1/documents/contacts/{contact_id}
```

Contact bundles:

```text
GET    /api/v1/documents/contact-bundles
POST   /api/v1/documents/contact-bundles
GET    /api/v1/documents/contact-bundles/{bundle_id}/public
DELETE /api/v1/documents/contact-bundles/{bundle_id}
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
