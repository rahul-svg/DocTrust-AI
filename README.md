# DocTrust AI

AI-powered document verification. Upload a PDF or image, and the system extracts its
text, classifies the document, pulls out the fields that matter, runs it through a
verification rule engine, and returns a confidence-scored result.

Built entirely on **Node.js + TypeScript**: a React frontend, an Express main backend,
and a separate Express AI service.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Router + Axios
- **Backend**: Node.js + Express + TypeScript + MongoDB (Mongoose) + JWT + Multer
- **AI Service**: Node.js + Express + TypeScript + Tesseract.js + pdf-parse + LangChain.js

## How It Works

```text
Upload → OCR → Classification → Field Extraction → Verification Rules
                                                          ↓
Dashboard ← Stored Result ← Confidence Score ← Anomaly Detection
```

1. **OCR** — `pdf-parse` for PDFs, Tesseract.js for JPG/PNG.
2. **Classification** — an LLM identifies the document type (passport, invoice,
   bank statement, and so on).
3. **Field extraction** — type-specific fields are pulled from the text.
4. **Verification engine** — deterministic rules check required fields, field
   formats, cross-field date consistency and duplicated values, producing a
   report of findings with severity and category.
5. **Anomaly detection** — heuristic tampering signals: OCR garble, placeholder
   values, fabricated-looking identifiers.
6. **Confidence score** — blends classification confidence, field coverage and
   document quality, minus penalties for findings and anomaly risk.

AI results are **decision support, not proof of authenticity**. Anomalies are
indicators for review, and high-risk decisions should include human review.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- An OpenAI API key (optional — see note below)

### 1. AI Service

```bash
cd ai-service
npm install
cp .env.example .env    # fill in your values
npm run dev             # http://localhost:8000
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env    # fill in your values
npm run dev             # http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

The frontend talks to the backend, and the backend forwards documents to the AI
service, so start them in that order.

> **Without `OPENAI_API_KEY`** the AI service still runs: OCR, the verification
> rule engine, anomaly detection and confidence scoring all work. Classification
> and field extraction degrade gracefully, returning `unknown` and no fields
> rather than failing.

## Environment Variables

Each service has a `.env.example` — copy it to `.env` and fill it in.
Never commit real secrets.

**server**

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `AI_SERVICE_URL` | Base URL of the AI service |

**ai-service**

| Variable | Purpose |
| --- | --- |
| `PORT` | AI service port (default 8000) |
| `OPENAI_API_KEY` | Enables classification and field extraction |

**client**

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API base URL (default `http://localhost:5000/api`) |

## API

### Backend (`http://localhost:5000/api`)

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me

POST   /documents/upload
GET    /documents
GET    /documents/:id
DELETE /documents/:id
POST   /documents/:id/verify

GET    /verifications
GET    /verifications/:id
```

All document and verification routes require a `Bearer` token.

### AI Service (`http://localhost:8000`)

```text
GET  /health
POST /ocr        # multipart file → extracted text
POST /classify   # { text } → document type + confidence
POST /verify     # multipart file → full analysis result
```

## Screens

| Route | Purpose |
| --- | --- |
| `/dashboard` | Counts, average confidence, outcome breakdown, confidence distribution, recent activity |
| `/documents` | Document list with upload, analyse and delete |
| `/documents/:id` | Document details and its verification runs |
| `/upload` | Drag-and-drop upload (PDF, JPG, PNG — max 10 MB) |
| `/verifications` | Verification history |
| `/verifications/:id` | Full verification result |

## Project Structure

```text
doctrust-ai/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Navbar, ConfidenceGauge, VerificationDetails
│       ├── pages/           # Dashboard, Documents, Upload, Verifications
│       ├── services/        # API clients
│       ├── hooks/           # useAuth
│       ├── types/
│       └── utils/           # Shared status/severity styling
│
├── server/                  # Express main backend
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/          # User, Document, Verification
│       ├── services/        # AI service client
│       ├── middleware/      # Auth, error handling
│       └── config/          # DB, Multer
│
└── ai-service/              # Express AI service
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/        # ocr, documentClassifier, fieldExtractor,
        │                    # verifier, anomalyDetector, confidenceScorer,
        │                    # aiAnalyzer
        └── utils/
```

## Development Status

| Phase | Status |
| --- | --- |
| 1 — Project setup | Done |
| 2 — Authentication | Done |
| 3 — Document upload | Done |
| 4 — OCR | Done |
| 5 — AI analysis | Done |
| 6 — Verification engine | Done |
| 7 — Dashboard | Done |
| 8 — Testing & deployment | Not started |

See [DocTrust-AI.md](DocTrust-AI.md) for the full specification and roadmap.

## Security Notes

Document verification handles sensitive material. Before production use:
validate and scan uploads, encrypt stored data, avoid logging document
contents, serve over HTTPS, protect API keys, and define retention and
deletion policies.
