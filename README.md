# 🛡️ Autonomous Scam Hunter AI

> AI-powered full-stack cybersecurity platform for detecting, classifying, and investigating digital scams.

---

## Features

- **AI Analysis** — Groq LLM (Llama3) generates scam summaries, technical breakdowns, and recommendations
- **OCR** — Upload screenshots; EasyOCR extracts text automatically
- **Threat Intelligence** — VirusTotal, URLScan, AbuseIPDB integration
- **Entity Extraction** — URLs, emails, phones, UPI IDs, crypto wallets
- **10 Scam Types** — Phishing, UPI Fraud, Job Scam, Lottery, Investment, Romance, Crypto, Delivery, Tech Support, Government
- **Risk Scoring** — 0–100 score → Safe / Medium / High / Critical
- **PDF Reports** — Downloadable investigation reports via ReportLab
- **Admin Dashboard** — User and analysis management
- **JWT Auth** — Secure login/register with bcrypt passwords

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.12, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| AI | Groq API (Llama3-8b) |
| OCR | EasyOCR, OpenCV, Pillow |
| Threat Intel | VirusTotal API, URLScan API, AbuseIPDB API |
| Reports | ReportLab PDF |
| Deploy | Docker, docker-compose |

---

## Quick Start

### 1. Clone & configure

```bash
git clone <repo>
cd scam-hunter

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and fill in API keys

# Frontend environment  
cp frontend/.env.example frontend/.env
```

### 2. Run with Docker (recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### 3. Run locally (development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL locally, then:
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT secret key (min 32 chars) | ✅ |
| `GROQ_API_KEY` | Groq API key for LLM | Recommended |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key | Optional |
| `URLSCAN_API_KEY` | URLScan.io API key | Optional |
| `ABUSEIPDB_API_KEY` | AbuseIPDB API key | Optional |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login → JWT token
- `GET /api/auth/me` — Current user
- `PUT /api/auth/me` — Update profile

### Analysis
- `POST /api/analysis/text` — Analyze text/SMS/email/URL
- `POST /api/analysis/image` — Analyze screenshot (OCR)
- `GET /api/analysis/dashboard` — Dashboard statistics
- `GET /api/analysis/history` — Analysis history
- `GET /api/analysis/{id}` — Single analysis
- `DELETE /api/analysis/{id}` — Delete analysis

### Reports
- `POST /api/reports/{id}/generate` — Generate PDF
- `GET /api/reports/{id}/download` — Download PDF
- `GET /api/reports/` — List reports

### Admin (admin only)
- `GET /api/admin/stats` — System statistics
- `GET /api/admin/users` — All users
- `DELETE /api/admin/users/{id}` — Delete user
- `GET /api/admin/analyses` — All analyses
- `DELETE /api/admin/analyses/{id}` — Delete analysis

Full interactive docs at: `http://localhost:8000/api/docs`

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Overview & charts |
| `/analyzer` | Run new analysis |
| `/history` | Previous analyses |
| `/history/:id` | Analysis detail |
| `/reports` | Download PDF reports |
| `/profile` | Account settings |
| `/admin` | Admin panel (admin only) |

---

## Creating an Admin User

After registering normally, run in your database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Or via the backend container:
```bash
docker exec -it scam-hunter_backend_1 python -c "
import asyncio
from app.database.connection import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import update

async def make_admin():
    async with AsyncSessionLocal() as db:
        await db.execute(update(User).where(User.email == 'your@email.com').values(is_admin=True))
        await db.commit()

asyncio.run(make_admin())
"
```

---

## API Keys Setup

### Groq (AI analysis)
1. Visit https://console.groq.com
2. Create API key
3. Add to `GROQ_API_KEY`

### VirusTotal (URL threat intel)
1. Visit https://www.virustotal.com/gui/join-us
2. Get API key from profile
3. Add to `VIRUSTOTAL_API_KEY`

### URLScan.io
1. Visit https://urlscan.io/user/signup
2. Get API key
3. Add to `URLSCAN_API_KEY`

### AbuseIPDB
1. Visit https://www.abuseipdb.com/register
2. Get API key
3. Add to `ABUSEIPDB_API_KEY`

> All threat intel APIs are optional. The system works without them using rule-based analysis.

---

## Project Structure

```
scam-hunter/
├── backend/
│   ├── app/
│   │   ├── ai/            # Groq AI service
│   │   ├── api/routes/    # FastAPI routers
│   │   ├── core/          # Config, security, JWT
│   │   ├── database/      # DB connection
│   │   ├── models/        # SQLAlchemy models
│   │   ├── ocr/           # EasyOCR service
│   │   ├── reports/       # PDF generation
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Text extraction
│   │   └── main.py        # App entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI
│   │   ├── context/       # Auth context
│   │   ├── layouts/       # App shell
│   │   ├── pages/         # Route pages
│   │   └── services/      # API client
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## Cybercrime Reporting (India)
- Website: https://cybercrime.gov.in
- Helpline: **1930**

---

*Built with ❤️ to protect people from digital fraud.*
