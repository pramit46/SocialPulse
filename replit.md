# Social Media Analytics Dashboard — Project Status (sync with codebase)

## Overview (current)
This repository contains a full‑stack social media analytics application for monitoring Bangalore airport and major Indian airlines. The stack is a React (TypeScript) frontend + Express (TypeScript) backend running inside a dev container (Ubuntu 24.04.2 LTS).

Important: the file contents below reflect the current code — the project no longer uses separate Hugging Face models for sentiment/chat/embeddings. It uses a local LLM integration (Ollama) via a single server-side LLM service.

## Quick summary (keep this as the ground-truth)
- Frontend: React 18 + TypeScript, Vite for dev and build.
- Backend: Node.js + Express (TypeScript), REST API endpoints for social events, analytics, settings, data collection, and LLM query routing.
- LLM Integration: Local Ollama service (OllamaLLMService). Code uses one LLM service class and a single configured model (example: `deepseek-r1:8b`) for intent parsing, chat responses and embeddings — not separate cloud models per task.
- Vector DB: ChromaDB in persistent mode (expected at `./shared/chroma_db`); code falls back to in-memory storage when the client cannot connect.
- Data collection: Twitter API v2, Reddit API, RSS news feeds. Posts are cleaned, tagged for airport/airline mentions and optionally stored in MongoDB. Embeddings inserted into ChromaDB for semantic search.
- Storage: In-memory Maps for rapid prototyping; Drizzle ORM configured for PostgreSQL (schema + migrations available).
- Logging: Winston-based server logging writing to `logs/` (e.g., `logs/error.log`, `logs/combined.log`).
- Config: Local config files under `config/` (secrets stored as base64-encoded values). Note: `config/*` is in `.gitignore`.
- Dev environment: runs in container; use the repo's npm scripts (install, build, start).

## Recent / Relevant changes (as in code)
- LLM routing changed to a single local service (OllamaLLMService) — the code expects an Ollama host/token and a single model name used across functions (intent, chat, sentiment, embeddings).
- Previously referenced Hugging Face model names in docs/examples were not matching current code; documentation files updated to reflect the local Ollama approach.
- ChromaDB usage: persistent local ChromaDB is expected (path `./shared/chroma_db`), but the code will silently fall back to in-memory if it cannot connect.
- Logging has been added across server modules; logs are written under `logs/`.
- Config secrets are base64-encoded and decoded at runtime by services (see `config/` files). These files are intentionally ignored from git.

## Developer notes / troubleshooting
- If you see "ChromaDB not available, using in-memory storage for embeddings":
  - Verify the ChromaDB process is running and the configured path/endpoint matches the code (check `server/llm-service.ts` and `server/routes.ts` initialization).
  - Ensure `./shared/chroma_db` exists and is writable in the container.
- LLM usage:
  - The server uses `OllamaLLMService` (check `server/llm-service.ts`). Confirm Ollama daemon is running (default: `http://localhost:11434`) and that the configured token/URL are correct.
  - The code currently expects a single model configured in the service (e.g. `deepseek-r1:8b`). If you plan to switch to external providers, update the LLM service and config accordingly.
- Running an integration test (Reddit, Twitter):
  - Provide API credentials via the service `setCredentials` or the base64 config files in `config/`.
  - For local TypeScript scripts, run via `npx ts-node` after installing `ts-node` and `typescript` dev deps.

## How to run locally (dev container, Ubuntu 24.04.2 LTS)
```bash
cd /workspaces/SocialPulse
npm install
# build front + backend (project scripts may vary)
npm run build
npm start
# open in host browser:
$BROWSER http://localhost:5000
```

## Where to look in the codebase
- Server LLM service: `server/llm-service.ts` (OllamaLLMService)
- ChromaDB init + routes: `server/routes.ts`
- Data collection: `server/data-collection.ts`
- Logging: `server/logger.ts` (Winston config) and `logs/` directory
- Configs: `config/` (base64-encoded secrets; ignored by git)
- Frontend Aerobot chat UI: `client/src/pages/aerobot.tsx` (sample queries + mock responses preserved)

---

This file is intended to be the up‑to‑date project snapshot for Replit / quick onboarding. Update again if you change LLM provider, ChromaDB path, or config storage