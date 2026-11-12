# Ops_pilot

> Autonomous AI Business Operations Platform for Automotive Logistics, Inventory Depletion & Customer Fulfillment.

OpsPilot is an enterprise-grade autonomous operations assistant designed with Apple VisionOS / macOS Sonoma frosted glassmorphic UI, real-time deterministic tool execution, and Google Gemini neural planning.

---

## ✨ Features

- **Translucent Frosted Glass UI**: VisionOS-inspired ambient mesh lighting, 20px frosted backdrop blurs, floating capsule navigation, and zero-clutter tactile controls.
- **Natural-Language Business Intake (`/requests`)**: Submit arbitrary operations directives decomposed by Google Gemini into deterministic multi-tool workflows.
- **Human-in-the-Loop Approval Gate (`/approvals`)**: Sensitive financial orders and external customer messages pause at cryptographic authorization checkpoints.
- **Visual Execution Timeline (`/runs/[id]`)**: Step-by-step visual execution graph with real-time tool inputs/outputs, latency metrics, and verification states.
- **Agent Orchestration Ledger (`/runs`)**: Full operational telemetry, failure rates, duration statistics, and active workflow monitoring.
- **Customer Communications & Drafts Hub (`/drafts`)**: Staging desk for agent-prepared fulfillment emails with inline refinement and 1-click dispatch.
- **Core Domain Management**: Real-time management of Orders, Inventory, Customers, and Performance Analytics.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Bundler**: Turbopack (`next dev --turbopack`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom glassmorphism plugins
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Cookies)
- **AI Engine**: [Google Gemini](https://ai.google.dev/) (Adaptive Dual-Tier Planner with deterministic fallback)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/MUHAMMADHAMZAQAMAR/Ops_pilot.git
cd Ops_pilot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and set your credentials:
```bash
cp .env.example .env.local
```

Required variables:
```env
PORT=3000
NEXT_PUBLIC_PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup
Execute the migration and seed scripts in your Supabase SQL editor:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
MIT
