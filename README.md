# Local development

1. Install Node.js 20+ (LTS recommended).
2. Run `npm install`.
3. Open `.env` in the project root.
4. Replace `MY_GEMINI_API_KEY` with a real Gemini API key from Google AI Studio.
5. Keep `DEV_AI_PROVIDER=false` for real AI responses.
6. Start with `npm run dev`.
7. Open http://localhost:3000 (the terminal may display 0.0.0.0:3000; that is the bind address).
8. Check `http://localhost:3000/api/provider-status`. You want `gemini: true` and `fallbackActive: false`.

If Gemini is not configured, the app now reports the configuration error instead of pretending the local fallback is a real AI response. Basic arithmetic such as `2+2`, `2+2 =`, and `what is 2+2?` is handled locally and safely.

# NEXA AI — One Intelligence. Every Possibility.

Production-ready, all-in-one AI universal workspace combining multimodal conversational intelligence, authoritative deep research, global dataset discovery, empirical data analysis with statistical profiling, file intelligence, and project workspaces.

---

## 1. Project Overview

**NEXA AI** is engineered as a unified universal AI workspace inspired by modern AI research platforms. It unifies:
- **AI Chat Workspace**: Real-time streaming conversational assistant with modular model routing, copyable syntax-highlighted code blocks, mathematical notation, and interactive tool calls.
- **Deep Research Engine**: Autonomous multi-step research planner and synthesizer with verified citations from official multilateral and intergovernmental institutions (IPCC, World Bank, NASA GISS, WHO, IMF).
- **Global Data Catalog**: Discovery index of worldwide authoritative datasets (World Bank WDI, NASA GISTEMP, WHO GHO, IMF WEO, NOAA Keeling Curve, Eurostat) with format filters, typed schemas, and 1-click import into analytical pipelines.
- **Data Analysis Workspace**: Deterministic CSV/JSON profiling calculating honest row/column counts, data types, missing value ratios, duplicate detection, IQR outlier analysis, and reactive SVG charts (Bar, Line, Area, Scatter, Pie).
- **File Intelligence & Multimodal**: File ingestion and vision analysis for CSV, JSON, TXT, MD, PDF, and image assets with on-demand summarization and document Q&A.
- **Project Workspaces**: Grouping of related conversations, files, research sessions, and datasets with archiving and lifecycle management.
- **Command Palette & Global Search**: Universal `⌘K` / `Ctrl+K` command interface for instantaneous keyboard navigation.

---

## 2. Architecture & Design

### Modular AI Provider Abstraction
```
AIProvider (Interface)
 ├── GeminiProvider (Google @google/genai SDK, gemini-3.8-flash)
 ├── OpenAICompatibleProvider (Custom endpoint / API key)
 └── DevFallbackProvider (Deterministic high-fidelity local emulation when API keys are absent)
```

- **Server-Side AI SDK Invocations**: All Gemini calls run exclusively on the Express backend (`server/providers/ai/gemini.ts`) using the modern `@google/genai` TypeScript SDK. The client communicates via Server-Sent Events (`/api/chat`).
- **Explicit provider status**: When `GEMINI_API_KEY` is missing, the app reports a clear configuration error by default. Set `DEV_AI_PROVIDER=true` only when you intentionally want the deterministic local demo fallback.

### Database Architecture
- **Prisma Schema (`prisma/schema.prisma`)**: Fully relational PostgreSQL specification with indexes, cascades, and relations across `User`, `Session`, `Conversation`, `Message`, `Project`, `ProjectMember`, `File`, `Dataset`, `DatasetSource`, `ToolExecution`, `ResearchSession`, and `ResearchSource`.
- **Runtime Store (`server/db/store.ts`)**: In-memory persistent repository conforming to the Prisma models, pre-seeded with authentic global datasets and a demo account for immediate prototyping.

---

## 3. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express, TypeScript (`tsx`), Server-Sent Events (SSE)
- **AI SDK**: `@google/genai` (Official Google GenAI SDK)
- **Database / ORM**: Prisma schema (PostgreSQL target) with modular data layer
- **Styling**: Obsidian glassmorphism (`#050505`), custom scrollbars, Plus Jakarta Sans, Instrument Serif

---

## 4. Environment Variables

Create a `.env` file based on `.env.example`:

```env
# GEMINI_API_KEY: Required for live Google Gemini models
GEMINI_API_KEY="your_gemini_api_key_here"

# OPENAI_API_KEY: Optional secondary AI provider
OPENAI_API_KEY=""

# DATABASE_URL: PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/nexa_ai"

# SESSION_SECRET: Secret for signing sessions/auth tokens
SESSION_SECRET="nexa-ai-super-secret-key-change-in-production"

# MAX_UPLOAD_SIZE: Max upload size in megabytes
MAX_UPLOAD_SIZE="25"

# DEV_AI_PROVIDER: Fallback AI mock mode when no external API key is active
DEV_AI_PROVIDER="false"
```

---

## 5. Local Setup & Development

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express backend + Vite middlewares)
npm run dev

# App runs on http://localhost:3000
```

---

## 6. Production Build & Deployment

```bash
# 1. Build frontend bundle
npm run build

# 2. Start full-stack production server
npm start
```

---

## 7. AI Model Abstraction Mapping

| Workspace Model Name | Routing / Capability | Speed Profile |
| :--- | :--- | :--- |
| **NEXA Auto** | Dynamic intent routing, balanced latency | Fast (4/5) |
| **NEXA Fast** | High-throughput streaming, quick edits | Ultra Fast (5/5) |
| **NEXA Reason** | Step-by-step logic, math & code formulation | Standard (3/5) |
| **NEXA Vision** | Multimodal perception, diagrams & images | Fast (4/5) |
| **NEXA Research** | Multi-source consensus, citations & grounding | Deep (2/5) |

---

## 8. Security & Integrity Principles

1. **No Hallucinated Statistics**: Data Analysis metrics (mean, median, IQR outliers, quality score, duplicate count) are calculated empirically from user-supplied data rows.
2. **Citation Transparency**: Deep Research separates consensus evidence from analytical inferences and uncertainty margins.
3. **No Client-Side Secrets**: All AI API tokens are securely managed server-side.
4. **Data Sovereignty**: Complete JSON data export and account purging available in Settings.
