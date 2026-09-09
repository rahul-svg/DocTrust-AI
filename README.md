# DocTrust AI

AI-powered document verification system built with MERN stack and Python FastAPI AI service.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **AI Service**: Node.js + Express + OCR + ML

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your values
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

See `.env.example` in each service directory. Never commit real secrets.

## Project Structure

```
doctrust-ai/
├── client/       # React frontend
├── server/       # Node.js + Express backend
└── ai-service/   # Node.js + Express AI service
```
