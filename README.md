# AI Support Platform

A complete, enterprise-grade, multi-business **AI Customer Support Platform** with **LangChain**, **Google Gemini**, and **Grounded Retrieval-Augmented Generation (RAG)**.

This platform empowers businesses to upload their verified documents (PDF, DOCX, TXT) and deploy an intelligent AI assistant that answers customer inquiries factually from their knowledge base while strictly eliminating AI hallucinations. When supporting evidence is insufficient, ambiguous, or missing, the system returns a controlled fallback response and logs the question for business review.

---

## 1. Features

- **Multi-Tenant Business Isolation:** Every user, document, chunk, conversation, message, unanswered question, and API key is strictly scoped to the authenticated business.
- **LangChain Ingestion Pipeline:** 
  - Supports PDF, DOCX, and TXT formats with size and mime-type validation.
  - Text extraction and normalization with page tracking.
  - Overlapping chunking powered by LangChain's `RecursiveCharacterTextSplitter`.
  - Document replacement with chunk invalidation and document deletion with vector cleanup.
- **Grounded Gemini RAG Engine:**
  - Integrated via `@langchain/google-genai` and `@langchain/core`.
  - Bounded prompt templates explicitly treating retrieved excerpts as untrusted user data (protecting against prompt-injection attacks).
  - Pre-generation evidence sufficiency evaluation (token coverage, relevance thresholds) to prevent hallucinated answers.
  - Detailed source citations with document titles, page numbers, snippets, and confidence scores.
- **Dual Retrieval Architecture:**
  - **Keyword Retrieval:** Native MongoDB full-text index and term frequency matching (zero external infrastructure required).
  - **Vector Retrieval:** Semantic embeddings using Gemini `text-embedding-004` (768 dimensions) compatible with MongoDB Atlas Vector Search.
  - **Hybrid Search:** Reciprocal Rank Fusion / weighted scoring combining lexical and semantic search.
- **Business Integration REST API (`/api/v1/integrations/...`):**
  - Cryptographically secure API keys generated with `aisp_live_` prefixes.
  - Secrets hashed using SHA-256 HMAC and server-side peppers (raw secret displayed only once upon generation).
  - Constant-time secret verification (`crypto.timingSafeEqual`).
  - Key revocation, rotation, per-key usage tracking, and rate limiting.
- **Interactive AI Playground:** Test your knowledge assistant in real time, inspect citations, and verify fallback behavior before publishing.
- **Unanswered Questions Tracker:** Automatic recording of customer inquiries where evidence was insufficient, enabling owners to mark items resolved with review notes.
- **Full-Stack SaaS Interface:** Built with Next.js (App Router), TypeScript, Tailwind CSS, and Lucide icons. Includes responsive sidebar navigation, analytics charts (Recharts), and confirmation modals.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Analytics Charts:** Recharts
- **Validation:** Zod

### Backend
- **Runtime:** Node.js (>= 18)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database & ODM:** MongoDB Atlas / MongoDB Server, Mongoose
- **Security:** Helmet, CORS, Cookie-Parser, Express-Rate-Limit, Bcryptjs, JSONWebToken, Crypto HMAC
- **File Parsing:** Multer, `pdf-parse`, `mammoth` (DOCX), plain text
- **Testing:** Vitest, Supertest

### AI & RAG
- **Orchestration:** LangChain (`@langchain/core`, `@langchain/textsplitters`, `@langchain/google-genai`)
- **Direct API:** `@google/genai`
- **LLM Models:** Google Gemini 2.0 Flash (`gemini-2.0-flash`)
- **Embedding Models:** Google `text-embedding-004` (768 dimensions)

---

## 3. Project Structure

```text
aiSupportPlatform/
├── frontend/                     # Next.js Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/         # Landing page (/), /login, /register, /chat/[slug]
│   │   │   └── dashboard/        # Authenticated workspace (/dashboard, /documents, etc.)
│   │   ├── components/           # Reusable UI (Sidebar, Navbar, ConfirmModal, etc.)
│   │   └── lib/                  # API client, Auth Context, utilities
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/                      # Express.js Application
│   ├── src/
│   │   ├── config/               # Database and validated environment variables
│   │   ├── models/               # Mongoose schemas (User, Business, Document, etc.)
│   │   ├── routes/               # Express REST routes (/api/v1/...)
│   │   ├── controllers/          # Request handlers
│   │   ├── services/
│   │   │   ├── ai/               # LangChain RAG, chunking, retrieval, Gemini services
│   │   │   ├── auth/             # Registration, login, JWT issuance
│   │   │   ├── documents/        # File ingestion, chunking, replace, and delete
│   │   │   ├── integrations/     # API key hashing, validation, usage telemetry
│   │   │   └── analytics/        # Database-driven metrics and charts
│   │   ├── middleware/           # Auth, API key, rate-limiting, upload filters
│   │   ├── utils/                # Crypto, structured logging, standardized responses
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── tests/                    # Vitest automated test suite (22 tests)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── package.json                  # Root development scripts
└── README.md
```

---

## 4. Prerequisites

1. **Node.js:** v18.0.0 or higher (v20+ or v22+ recommended).
2. **MongoDB:** A running MongoDB Atlas cluster or local MongoDB instance (`mongodb://127.0.0.1:27017/ai_support_platform`).
3. **Google Gemini API Key:** (Optional for initial development and tests; required for live Gemini answer generation). Obtain from [Google AI Studio](https://aistudio.google.com/).

---

## 5. Installation & Setup

### 1. Clone & Install Dependencies

From the repository root:

```bash
# Install root, backend, and frontend dependencies
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Backend Environment

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Review and adjust `backend/.env`:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_support_platform

JWT_SECRET=your-32-char-random-jwt-secret-key-here!
JWT_EXPIRES_IN=7d
AUTH_SESSION_SECRET=your-session-secret-key
API_KEY_PEPPER=your-pepper-string-for-api-keys

GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

UPLOAD_MAX_FILE_SIZE_MB=10
UPLOAD_STORAGE_PATH=./uploads

RAG_RETRIEVAL_MODE=keyword
RAG_MIN_RELEVANCE_SCORE=0.35
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=120
RAG_MAX_RETRIEVED_CHUNKS=5

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Configure Frontend Environment

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 6. Running the Applications

### Start the Backend Server (Express + TypeScript)

```bash
npm run dev:backend
# Or from inside backend/: npm run dev
```
The backend starts on `http://localhost:5000`. Health check is available at `http://localhost:5000/api/health`.

### Start the Frontend Application (Next.js)

```bash
npm run dev:frontend
# Or from inside frontend/: npm run dev
```
The frontend starts on `http://localhost:3000`.

---

## 7. RAG Pipeline & LangChain Architecture

The AI retrieval pipeline is isolated under `backend/src/services/ai/`:

1. **`document-loader.service.ts`:**
   - Extracts raw text from PDF (`pdf-parse`), DOCX (`mammoth`), and TXT.
   - Normalizes text (removes null bytes, excessive line breaks) and tracks page numbers.
2. **`chunking.service.ts`:**
   - Employs LangChain's `RecursiveCharacterTextSplitter`.
   - Generates chunks with configurable `chunkSize` (default: 800) and `chunkOverlap` (default: 120).
   - Preserves document ID, title, filename, and page numbers.
3. **`embedding.service.ts`:**
   - Uses `@langchain/google-genai` `GoogleGenerativeAIEmbeddings` with `text-embedding-004` (768 dimensions).
   - Provides deterministic offline vectors during testing or when the API key is not yet set.
4. **`retrieval.service.ts`:**
   - Enforces business boundary checks (never queries across businesses).
   - Retrieves only chunks from documents in `status: "ready"`.
   - Supports `keyword`, `vector`, and `hybrid` retrieval modes.
5. **`evidence.service.ts`:**
   - Computes relevance score cutoffs and keyword correlation ratios.
   - Rejects queries where supporting evidence is missing or irrelevant before calling Gemini.
6. **`gemini.service.ts`:**
   - Formulates prompts using LangChain `PromptTemplate`.
   - Enforces grounding: uploaded excerpts are treated strictly as **untrusted data**.
   - Defends against prompt injections (e.g., "ignore previous instructions").
   - Implements a 15-second timeout and separates infrastructure errors from unsupported questions.
7. **`rag.service.ts`:**
   - Coordinates the entire pipeline, creates conversation sessions, logs user messages, and records unsupported questions in `UnansweredQuestion`.

---

## 8. MongoDB Atlas Vector Search Setup (Optional)

To enable MongoDB Atlas Vector Search:

1. Create a search index on the `documentchunks` collection with the definition:
```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "dimensions": 768,
        "similarity": "cosine",
        "type": "knnVector"
      },
      "businessId": {
        "type": "token"
      }
    }
  }
}
```
2. Set `RAG_RETRIEVAL_MODE=vector` or `RAG_RETRIEVAL_MODE=hybrid` in `backend/.env`.
3. If no Atlas search index is present, the platform automatically falls back to keyword retrieval without interruption.

---

## 9. Business Integration REST API

External websites, mobile applications, and backend systems can query the assistant using an API key.

### Authentication
Include the API key in the `Authorization` header:
```text
Authorization: Bearer aisp_live_...
```
Or via the `x-api-key` header:
```text
x-api-key: aisp_live_...
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/integrations/chat` | Send a question and receive a grounded answer with sources |
| `POST` | `/api/v1/integrations/conversations` | Create a new integration conversation |
| `GET` | `/api/v1/integrations/conversations/:id` | Fetch conversation history and messages |
| `POST` | `/api/v1/integrations/keys` | Create an API key (Owner only) |
| `GET` | `/api/v1/integrations/keys` | List API keys (Owner only) |
| `DELETE` | `/api/v1/integrations/keys/:id` | Revoke an API key (Owner only) |
| `POST` | `/api/v1/integrations/keys/:id/rotate` | Rotate an API key (Owner only) |
| `GET` | `/api/v1/integrations/usage` | Fetch API usage logs and response times (Owner only) |

### Example Request

```bash
curl -X POST http://localhost:5000/api/v1/integrations/chat \
  -H "Authorization: Bearer aisp_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your refund policy?",
    "conversationId": null
  }'
```

### Example Grounded Response

```json
{
  "success": true,
  "data": {
    "answer": "You can request a full refund within 30 days of purchase with your original receipt.",
    "answered": true,
    "sources": [
      {
        "documentId": "65f011111111111111111111",
        "documentTitle": "Return Policy 2026.pdf",
        "chunkIndex": 0,
        "page": 2,
        "snippet": "Customers may request a refund within 30 days of purchase...",
        "relevanceScore": 0.88
      }
    ],
    "confidence": 0.88,
    "conversationId": "65f022222222222222222222"
  }
}
```

### Example Fallback Response (Unsupported Question)

```json
{
  "success": true,
  "data": {
    "answer": "I couldn't find this information in the business's available documents. Please contact the business for confirmation.",
    "answered": false,
    "sources": [],
    "confidence": 0.1,
    "conversationId": "65f022222222222222222222"
  }
}
```

---

## 10. Verification & Automated Testing

The automated test suite covers all 22 required test cases:

```bash
# Run all backend tests
npm run test:backend

# Type-check backend
npm run lint:backend

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

### Verified Test Suite Summary (22/22 Passing):
1. Business owner registration and login.
2. Unauthorized requests are rejected with 401.
3. Protected dashboard endpoints require authentication.
4. Valid PDF, DOCX, and TXT parsing.
5. Malformed and unsupported file uploads are rejected.
6. Text extraction and chunking preserve document metadata.
7. Relevant chunks are retrieved for a question.
8. Retrieval strictly excludes other businesses' documents.
9. Supported answers include valid source citations.
10. Unknown questions are recorded without invented business claims.
11. Gemini errors, timeouts, and quota failures are handled safely.
12. Document replacement invalidates old indexed chunks.
13. Document deletion removes or invalidates associated indexed content.
14. API keys are generated, validated, revoked, and rotated.
15. Cross-business conversation access is denied.
16. Rate limits are enforced on integration routes.
17. Dashboard statistics match persisted database records.
18. Public chat cannot access owner-only functionality.
19. Prompt injection in retrieved content does not override the answering policy.
20. Semantic retrieval fails safely when vector search is misconfigured.
21. Keyword fallback works when explicitly enabled.
22. Unsupported questions and infrastructure errors receive distinct statuses.

---

## 11. Security Architecture

- **Password Hashing:** Bcrypt with 12 salt rounds.
- **API Key Security:** Identifiable prefix `aisp_live_`, 32-byte cryptographically secure random secret, hashed with HMAC-SHA256 and server pepper. Plaintext secret is shown only once and never stored.
- **Constant-Time Verification:** Key comparisons use `crypto.timingSafeEqual` to prevent timing attacks.
- **Tenant Isolation:** Every Mongoose query is scoped by `businessId`.
- **Untrusted Context Isolation:** Document content is delimited and marked untrusted in the LangChain prompt template.
- **Browser Protection:** Privileged keys are never exposed in browser JavaScript; public customer chat uses scoped public tokens or server proxy routes.

---

## 12. License

MIT

