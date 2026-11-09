# Zero-Trust Enterprise AI Business Automation Platform

A dual-tier enterprise architecture built on a **Zero-Trust AI Execution Model**, featuring LangGraph finite state machines, cryptographic Human-in-the-Loop (HITL) approval gateways, prompt injection firewalls, and tamper-evident SHA-256 audit log chains.

---

## Architecture Overview

```
AI Based Web/
├── .gitignore                    # Master multi-tier Git ignore configuration
├── docker-compose.yml            # Container orchestration for Backend and Frontend
├── package.json                  # Root monorepo workspace scripts
│
├── frontend/                     # Next.js (App Router, React 19, Tailwind CSS)
│   ├── .env.example              # Dedicated frontend environment template
│   ├── .env                      # Local frontend environment values
│   ├── Dockerfile                # Standalone multi-stage production Docker build
│   ├── package.json              # Web client dependencies
│   ├── next.config.mjs           # Next.js config with reverse-proxy rewrites
│   ├── app/                      # App router pages (dashboard, runs, approvals, audit)
│   ├── components/               # Base UI, dashboard, agent visualizers & HITL modal
│   ├── lib/                      # API client, Supabase SSR, and config
│   └── types/                    # Shared TypeScript schemas
│
└── backend/                      # Node.js + Express API & LangGraph State Machine
    ├── .env.example              # Dedicated backend environment template
    ├── .env                      # Local backend environment values
    ├── Dockerfile                # Hardened Alpine container for AI execution engine
    ├── package.json              # Backend engine dependencies
    ├── db/                       # DDL PostgreSQL schema & migrations
    └── src/
        ├── index.ts              # Express server with Helmet & dynamic CORS
        ├── config/               # Zod runtime environment validation (no hardcoding)
        ├── agent/                # LangGraph state machine, nodes & checkpointer
        ├── security/             # Firewall, HMAC-SHA256 JWT service & audit engine
        ├── tools/                # Type-safe sandboxed agent tools
        ├── middleware/           # Supabase auth token verification & error handler
        └── routes/               # Express REST routers (/api/v1/...)
```

---

## Decoupled Environment Variable Configurations

### Backend (`backend/.env`)
- `PORT`: HTTP port for Express API (default: `4000`)
- `NODE_ENV`: Runtime environment (`development` | `production`)
- `CORS_ORIGIN`: Allowed origins for CORS (default: `http://localhost:3000`)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for backend admin checkpointer)
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API Key for structured execution planning
- `OPENAI_MODEL`: OpenAI model (default: `gpt-4o-2024-08-06`)
- `APPROVAL_JWT_SECRET`: HMAC secret for minting cryptographic HITL approval tokens (min 32 chars)
- `APPROVAL_TOKEN_TTL_SECONDS`: Approval token validity window (default: `86400`)
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL for distributed rate limiting
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token
- `FIREWALL_STRICT_MODE`: Enable prompt injection filtering (default: `true`)
- `FIREWALL_ENTROPY_THRESHOLD`: Maximum Shannon entropy threshold (default: `5.5`)

### Frontend (`frontend/.env`)
- `NEXT_PUBLIC_APP_URL`: Public web application URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_BACKEND_API_URL`: Backend API Gateway URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for authentication
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key

---

## Running with Docker

Run both backend and frontend containerized:
```bash
docker compose up --build
```

Access:
- Frontend Web App: `http://localhost:3000`
- Backend API & Health Check: `http://localhost:4000/health`

