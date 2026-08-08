# DocTrust AI

AI-powered document verification system built with a **MERN stack** and a separate **Python AI service**.

## 1. Project Overview

DocTrust AI allows users to upload documents and receive an AI-assisted verification result.

### Main Goals

* Upload PDF and image documents
* Extract text using OCR
* Identify/classify document types
* Extract important fields
* Validate extracted information
* Detect anomalies or possible tampering
* Generate an AI-based confidence score
* Store verification history
* Provide a dashboard for verification results

## 2. Technology Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* Axios
* Tailwind CSS

### Main Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* JWT Authentication
* Multer for file uploads

### AI Service

* Python
* FastAPI
* OCR
* Python ML/AI libraries
* LLM integration
* Document analysis
* Verification engine

## 3. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │ React + TypeScript   │
                    │     Frontend         │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │ Node.js + Express    │
                    │    Main Backend      │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
          ┌──────────────┐          ┌──────────────┐
          │   MongoDB    │          │ Python AI    │
          │              │          │   Service    │
          └──────────────┘          │   FastAPI    │
                                    └──────┬───────┘
                                           │
                                ┌──────────┼──────────┐
                                ▼          ▼          ▼
                              OCR        AI/ML     Verification
```

## 4. Project Structure

```text
doctrust-ai/
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.ts
│   └── package.json
│
├── ai-service/                     # Python AI service
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── ocr.py
│   │   │   ├── document_classifier.py
│   │   │   ├── field_extractor.py
│   │   │   ├── verifier.py
│   │   │   └── ai_analyzer.py
│   │   ├── models/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env
│
├── docs/
│   └── architecture.md
│
├── .gitignore
└── README.md
```

## 5. Document Verification Workflow

```text
User
  │
  ▼
Upload Document
  │
  ▼
React Frontend
  │
  ▼
Node.js API
  │
  ├── Validate file
  ├── Authenticate user
  └── Forward document
          │
          ▼
    Python AI Service
          │
          ├── OCR
          ├── Text Extraction
          ├── Document Classification
          ├── Field Extraction
          ├── Data Validation
          ├── AI Analysis
          ├── Anomaly Detection
          └── Confidence Score
          │
          ▼
    Verification Result
          │
          ▼
      Node.js API
          │
          ├── Save result → MongoDB
          └── Return response
          │
          ▼
    React Dashboard
```

## 6. Core Features

### Authentication (Core Feature)

* User registration
* Login
* JWT authentication
* Protected routes
* Logout

### Document Management

* Upload document
* PDF support
* Image support
* File size validation
* File type validation
* Document history
* Delete document

### OCR

Extract text from:

* PDF
* JPG/JPEG
* PNG

### Document Classification

The AI service identifies the document type.

Example:

```json
{
  "documentType": "identity_document",
  "confidence": 0.96
}
```

### Field Extraction

Example:

```json
{
  "name": "John Doe",
  "dateOfBirth": "01-01-2000",
  "documentNumber": "XXXXXX"
}
```

### Verification (Core Feature)

The verification engine checks:

* Required fields
* Field formats
* Missing information
* Data consistency
* Duplicate information
* Suspicious patterns
* Possible tampering indicators

### AI Analysis

Example:

```json
{
  "status": "verified",
  "confidence": 94,
  "documentQuality": "Good",
  "tamperingDetected": false,
  "issues": []
}
```

## 7. API Design

### Node.js APIs

#### Authentication (API Endpoints)

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

#### Documents

```text
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
```

#### Verification (API Endpoints)

```text
POST /api/documents/:id/verify
GET  /api/verifications/:id
GET  /api/verifications
```

### Python AI APIs

```text
GET  /health
POST /verify
POST /ocr
POST /classify
```

## 8. Python AI Service

Use **FastAPI** for the AI service.

Example:

```python
from fastapi import FastAPI, UploadFile, File

app = FastAPI()


@app.get("/health")
def health_check():
    return {
        "status": "AI service running"
    }


@app.post("/verify")
async def verify_document(file: UploadFile = File(...)):
    # Validate file
    # Extract text
    # Classify document
    # Extract fields
    # Run AI analysis
    # Generate verification result

    return {
        "status": "verified",
        "confidence": 95,
        "issues": []
    }
```

## 9. Example Verification Response

```json
{
  "documentId": "65f123abc",
  "documentType": "identity_document",
  "status": "verified",
  "confidence": 95,
  "extractedData": {
    "name": "John Doe",
    "dateOfBirth": "01-01-2000",
    "documentNumber": "XXXXXX"
  },
  "aiAnalysis": {
    "documentQuality": "Good",
    "tamperingDetected": false,
    "dataConsistency": true
  },
  "issues": []
}
```

## 10. Environment Variables

### Node.js Server

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/doctrust
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8000
```

### Python AI Service

```env
PORT=8000
AI_API_KEY=your_ai_api_key
```

Never commit real secrets to Git.

## 11. Local Development

### Create Project

```bash
mkdir doctrust-ai
cd doctrust-ai

mkdir client server ai-service
```

### Frontend (Setup)

```bash
npm create vite@latest client -- --template react-ts

cd client
npm install
npm install axios react-router-dom
cd ..
```

### Backend

```bash
cd server

npm init -y

npm install express mongoose cors dotenv
npm install multer jsonwebtoken bcryptjs
npm install zod

npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/multer

cd ..
```

### Python AI Service (Setup)

```bash
cd ai-service

python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn python-multipart
```

Run:

```bash
uvicorn app.main:app --reload --port 8000
```

## 12. Git Workflow

Initialize Git:

```bash
git init
```

Create main branch:

```bash
git switch -c main
```

Initial commit:

```bash
git add .
git commit -m "Initial project setup"
```

Create feature branch:

```bash
git switch -c feature/document-upload
```

Push branch:

```bash
git push -u origin feature/document-upload
```

Recommended branches:

```text
main
develop

feature/authentication
feature/document-upload
feature/ocr-processing
feature/ai-verification
feature/document-classification
feature/dashboard

fix/document-upload
fix/ocr-processing
fix/verification-result
```

## 13. Development Roadmap

### Phase 1 — Project Setup

* [ ] Create Git repository
* [ ] Create React application
* [ ] Create Express application
* [ ] Create Python FastAPI service
* [ ] Configure MongoDB
* [ ] Configure environment variables
* [ ] Connect frontend → backend
* [ ] Connect backend → AI service

### Phase 2 — Authentication

* [ ] User model
* [ ] Registration
* [ ] Login
* [ ] JWT authentication
* [ ] Protected routes
* [ ] Authentication UI

### Phase 3 — Document Upload

* [ ] Upload UI
* [ ] Multer configuration
* [ ] File validation
* [ ] PDF support
* [ ] Image support
* [ ] Document model
* [ ] Document history

### Phase 4 — OCR

* [ ] Python OCR service
* [ ] PDF text extraction
* [ ] Image OCR
* [ ] Text preprocessing
* [ ] OCR API
* [ ] Connect Node.js → Python

### Phase 5 — AI Analysis

* [ ] Document classification
* [ ] Field extraction
* [ ] Data validation
* [ ] AI-powered analysis
* [ ] Confidence score
* [ ] Anomaly detection

### Phase 6 — Verification Engine

* [ ] Verification rules
* [ ] Required field validation
* [ ] Data consistency checks
* [ ] Suspicious pattern detection
* [ ] Verification status
* [ ] Verification report

### Phase 7 — Dashboard

* [ ] Dashboard
* [ ] Upload screen
* [ ] Verification result page
* [ ] Verification history
* [ ] Document details
* [ ] Confidence visualization
* [ ] Error/issue display

### Phase 8 — Testing & Deployment

* [ ] Backend unit tests
* [ ] Frontend unit tests
* [ ] Python tests
* [ ] API integration tests
* [ ] Docker configuration
* [ ] Production environment
* [ ] Security review
* [ ] Deployment

## 14. MVP

The first version should contain:

```text
Login
  ↓
Upload Document
  ↓
OCR
  ↓
AI Classification
  ↓
Field Extraction
  ↓
Verification
  ↓
Confidence Score
  ↓
Result Dashboard
```

After the MVP works, add:

* Advanced fraud detection
* Tampering detection
* Cross-document verification
* Admin dashboard
* Audit logs
* Advanced analytics

## 15. Learning Objectives

### Frontend (Learning Objectives)

* React
* TypeScript
* Components
* Hooks
* Routing
* API integration
* State management
* File upload
* Dashboard development

### Backend (Learning Objectives)

* Node.js
* Express
* REST APIs
* Middleware
* Authentication
* MongoDB
* Mongoose
* File handling
* Service-to-service communication

### Python / AI

* Python
* FastAPI
* OCR
* NLP
* Document processing
* Machine learning
* LLM integration
* Prompt engineering
* AI classification
* Confidence scoring

### Architecture

* Microservice communication
* REST APIs
* Separation of concerns
* Authentication
* Error handling
* Logging
* Testing
* Docker
* Deployment

## 16. Security Considerations

Document verification systems may process sensitive documents.

The production system should:

* Encrypt sensitive data
* Avoid logging document contents
* Validate uploaded file types
* Limit upload size
* Scan uploaded files
* Secure API endpoints
* Protect API keys
* Use HTTPS
* Apply authentication and authorization
* Define document retention/deletion policies
* Avoid storing unnecessary personal information

AI-generated results should be treated as **decision support**, not unquestionable proof of authenticity. High-risk verification decisions should include appropriate human review and additional validation.

## 17. Final Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     DocTrust AI                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  React + TypeScript                                    │
│          │                                              │
│          ▼                                              │
│  Node.js + Express                                      │
│       │          │                                      │
│       │          └──────────────► MongoDB               │
│       │                                                 │
│       ▼                                                 │
│  Python + FastAPI                                       │
│       │                                                 │
│       ├── OCR                                            │
│       ├── Document Classification                        │
│       ├── Field Extraction                               │
│       ├── AI Analysis                                    │
│       ├── Anomaly Detection                               │
│       └── Verification Engine                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 18. Project Goal

Build a production-style AI-enabled document verification platform that demonstrates:

### Tech Stack Demonstrated

React + TypeScript + Node.js + Express + MongoDB + Python + FastAPI + OCR + AI

The project should be developed incrementally, with each feature implemented, tested, and committed independently.
