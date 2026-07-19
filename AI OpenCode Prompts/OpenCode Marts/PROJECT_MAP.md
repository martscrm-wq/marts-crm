# PROJECT_MAP: Marts AI Platform

---

## [TECH_STACK]

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Runtime** | Python | 3.14.6 | Latest stable, deferred annotations (PEP 649), free-threaded support |
| **API Framework** | FastAPI | 0.138.0 | Async-native, auto OpenAPI/Swagger, Pydantic v2 integration |
| **ASGI Server** | Uvicorn | 0.34.x | Production-grade, uvloop-backed |
| **ORM** | SQLAlchemy | 2.0.51 | Async support, mature, migration via Alembic |
| **DB** | PostgreSQL | 18.4 | 64-bit XID, AIO subsystem, native UUIDv7 |
| **DB Driver** | asyncpg | 0.30.x | Native PostgreSQL async protocol |
| **Frontend** | Next.js | 16.2.9 | App Router, RSC, Turbopack stable, RTL support |
| **UI Layer** | React | 19.2 | Server Components, Actions, useActionState, Compiler |
| **Auth** | JWT (python-jose) + OAuth2 | latest | Stateless auth, refresh token rotation |
| **AI SDK** | openai | 2.43.0 | Responses API, GPT-5.5, streaming |
| **Messaging** | twilio | 9.10.9 | WhatsApp Business API, SMS |
| **Social APIs** | facebook-sdk, python-instagram | latest | Meta Graph API |
| **Logging** | structlog | 25.x | Structured async logging, JSON output |
| **Validation** | Pydantic | 2.10.x | v2 core (Rust), integrated with FastAPI |
| **Testing** | pytest + httpx | latest | Async test support |
| **CI/CD** | Docker + Compose | latest | Containerized dev/prod parity |
| **I18n** | next-intl (FE) + Babel (BE) | latest | Full RTL + Arabic/French/English |

---

## [ARCHITECTURE]

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 (Frontend)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Dashboard│ │ Agents   │ │ Analytics│ │ Unified Inbox│ │
│  │ (RSC)    │ │ (RSC+CSR)│ │ (RSC)    │ │ (CSR+WS)    │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Shared UI (components/, lib/)              │ │
│  │  [RTL Layout, Charts, Forms, DataTable, I18n]       │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/2 (REST) + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI 0.138 (Backend)                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              API Gateway / Reverse Proxy              │ │
│  │  [JWT Middleware | Rate Limit | CORS | Logging]      │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ /auth  │ │ /users   │ │ /agents  │ │ /dashboard    │ │
│  │ /billing│ │ /inbox   │ │ /cms     │ │ /analytics    │ │
│  │ /autom │ │ /assistant│ │          │ │               │ │
│  └────────┘ └──────────┘ └──────────┘ └───────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Core Layer (core/)                          │ │
│  │  [config, db, security, cache, logging, exceptions]  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ asyncpg (async)
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL 18.4                              │
│  [marts_db: users, agents, conversations, tickets,       │
│   analytics, cms_pages, inbox_messages, subscriptions]   │
└──────────────────────────────────────────────────────────┘
```

### Domain Modules (Backend `app/modules/`)

```
app/
├── core/           # Config, DB session, security, logging, caching
├── modules/
│   ├── auth/       # JWT issuance, OAuth2, refresh tokens
│   ├── users/      # User CRUD, RBAC, profiles
│   ├── agents/     # AI agent CRUD, training, deployment
│   ├── dashboard/  # Admin stats, live KPIs
│   ├── analytics/  # Predictive analytics, BI reports
│   ├── automation/ # Workflows, CV screening, smart tickets
│   ├── assistant/  # Executive AI assistant (text/voice)
│   ├── inbox/      # Unified messaging (WhatsApp/Meta/Telegram)
│   ├── cms/        # Website builder, SEO, content management
│   └── billing/    # Subscriptions, invoices, payments
├── integrations/   # OpenAI, Twilio, Meta, Google Calendar clients
└── main.py         # FastAPI app factory
```

### Frontend Structure (Next.js `src/`)

```
src/
├── app/            # App Router (page.tsx per route)
│   ├── (auth)/     # Login, register, forgot-password
│   ├── (dashboard) # Protected routes layout
│   │   ├── admin/  # Admin dashboard
│   │   ├── agents/ # Agent management
│   │   ├── inbox/  # Unified inbox
│   │   ├── analytics/
│   │   ├── cms/
│   │   └── settings/
│   └── api/        # Next.js API routes (proxy to FastAPI)
├── components/     # Shared UI components
│   ├── ui/         # Primitive components (Button, Card, etc.)
│   ├── forms/      # Form components
│   ├── charts/     # Chart wrappers
│   └── layout/     # Sidebar, header, RTL provider
├── lib/            # Utilities, API client, i18n
└── middleware.ts   # Auth middleware, i18n routing
```

---

## [SYSTEM_FLOW]

### Data Flow: User → Frontend → API → AI → Response

```
User Request
    │
    ▼
Next.js (RSC renders or Client Component)
    │
    ├── Static/SSG → Direct cache response
    └── Dynamic → fetch('/api/v1/...') → FastAPI
                        │
                        ▼
              JWT Middleware (validate token)
                        │
                        ▼
              Route Handler (module)
                        │
                        ├── DB Query (SQLAlchemy async)
                        ├── External API (OpenAI, Twilio)
                        └── Cache (Redis optional)
                        │
                        ▼
              Response (Pydantic validated)
```

### Authentication Flow

```
Login → POST /api/v1/auth/token
    → Validate credentials
    → Return { access_token (15m), refresh_token (7d) }
    → Frontend stores in httpOnly cookie
    → middleware.ts checks token on every request
    → Refresh flow: POST /api/v1/auth/refresh
```

### AI Agent Interaction Flow

```
User sends message → Inbox receives
    → Route to correct agent based on channel
    → Agent builds prompt with system instructions + training data
    → OpenAI API call (streaming)
    → Response sent back to channel
    → Logged in conversations table
    → Analytics event emitted
```

---

## [ERD - Key Tables]

```
users
├── id: UUID PK
├── email: VARCHAR(255) UNIQUE
├── password_hash: VARCHAR(255)
├── role: ENUM(admin, staff, client)
├── locale: ENUM(ar, en, fr)
├── is_active: BOOLEAN
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

roles
├── id: UUID PK
├── name: VARCHAR(100) UNIQUE
└── permissions: JSONB

agents
├── id: UUID PK
├── name: VARCHAR(255)
├── description: TEXT
├── domain: ENUM(store, realestate, medical, custom)
├── locale: ENUM(ar, en, fr)
├── system_prompt: TEXT
├── settings: JSONB (channel integrations)
├── is_active: BOOLEAN
├── created_by: UUID FK → users
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

agent_training_data
├── id: UUID PK
├── agent_id: UUID FK → agents
├── file_type: ENUM(pdf, txt, csv)
├── file_path: VARCHAR(500)
├── content_hash: VARCHAR(64)
├── created_at: TIMESTAMPTZ
└── processed: BOOLEAN

conversations
├── id: UUID PK
├── agent_id: UUID FK → agents
├── customer_id: UUID FK → customers
├── channel: ENUM(whatsapp, facebook, instagram, telegram, web)
├── status: ENUM(active, waiting, closed)
├── metadata: JSONB
├── created_at: TIMESTAMPTZ
└── closed_at: TIMESTAMPTZ

messages
├── id: UUID PK
├── conversation_id: UUID FK → conversations
├── role: ENUM(user, assistant, system)
├── content: TEXT
├── metadata: JSONB
├── created_at: TIMESTAMPTZ
└── tokens_used: INTEGER

customers
├── id: UUID PK
├── name: VARCHAR(255)
├── phone: VARCHAR(50)
├── email: VARCHAR(255)
├── metadata: JSONB
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

subscriptions
├── id: UUID PK
├── customer_id: UUID FK → customers
├── plan: ENUM(free, basic, pro, enterprise)
├── status: ENUM(active, cancelled, expired)
├── start_date: DATE
├── end_date: DATE
├── stripe_customer_id: VARCHAR(255)
└── created_at: TIMESTAMPTZ

tickets
├── id: UUID PK
├── customer_id: UUID FK → customers
├── assigned_to: UUID FK → users
├── subject: VARCHAR(255)
├── description: TEXT
├── priority: ENUM(low, medium, high, critical)
├── status: ENUM(open, in_progress, resolved, closed)
├── category: VARCHAR(100)
├── created_at: TIMESTAMPTZ
└── resolved_at: TIMESTAMPTZ

analytics_events
├── id: UUID PK
├── event_type: VARCHAR(100)
├── entity_type: VARCHAR(50)
├── entity_id: UUID
├── data: JSONB
├── created_at: TIMESTAMPTZ
└── INDEX(entity_type, entity_id, created_at)

cms_sites
├── id: UUID PK
├── name: VARCHAR(255)
├── platform: ENUM(wordpress, shopify, custom)
├── domain: VARCHAR(255)
├── settings: JSONB
├── seo_settings: JSONB
├── created_by: UUID FK → users
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

cms_pages
├── id: UUID PK
├── site_id: UUID FK → cms_sites
├── title: VARCHAR(255)
├── slug: VARCHAR(255)
├── content: JSONB (blocks)
├── seo_meta: JSONB
├── status: ENUM(draft, published)
├── published_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

automation_rules
├── id: UUID PK
├── name: VARCHAR(255)
├── trigger: ENUM(message, time, event)
├── conditions: JSONB
├── actions: JSONB
├── is_active: BOOLEAN
├── created_by: UUID FK → users
└── created_at: TIMESTAMPTZ
```

---

## [ORPHANS & PENDING]

| Item | Status | Notes |
|------|--------|-------|
| Redis caching layer | PENDING | Optional; in-memory cache active |
| File storage (PDF training) | PENDING | Local FS used; migrate to S3 later |
| WebSocket for live chat | PENDING | REST polling in place |
| Voice interface (assistant) | PENDING | Text-only MVP |
| Mobile apps | PENDING | Out of scope for v1 |
| Multi-tenant isolation | PENDING | Single-tenant v1 |
| Stripe/Payment integration | PENDING | Manual billing v1 |
| Playwright E2E tests | PENDING | pytest unit tests only |
| Rate limiting middleware | PENDING | Add in M6 polish |
| CI/CD pipeline | PENDING | Manual deploy via Docker |

---

## [MILESTONES & VERIFIABLE GOALS]

### M1 — Foundation ✅ DONE
- [x] Project scaffolding: backend (FastAPI) + frontend (Next.js)
- [x] PostgreSQL schema via Alembic migration (001_initial_schema.py, 14 tables)
- [x] JWT auth (register, login, refresh, RBAC)
- [x] Core layer (config, database, security, logging, exceptions)
- [x] RTL layout + i18n (ar/en/fr) with next-intl
- [x] Auth pages (login, register) + Dashboard layout with sidebar
- [x] Docker Compose (PostgreSQL 18, backend, frontend)
- **Verification:** `pytest tests/` — 7 auth + agent tests; Swagger at `/docs`

### M2 — Core Domain ✅ DONE
- [x] User management (CRUD, profile, /me endpoint)
- [x] AI Agents CRUD (create, list, get, update, delete)
- [x] Training data upload (text + file upload with text extraction)
- [x] OpenAI integration (async streaming chat via Responses API)
- [x] Chat with agent endpoint
- **Verification:** `POST /agents/` + `POST /agents/{id}/chat` returns AI response

### M3 — Admin Dashboard + Analytics ✅ DONE
- [x] Live KPI endpoints (total users, agents, conversations, messages)
- [x] Analytics event listing + agent performance endpoint
- [x] Dashboard UI (4 stat cards, live data from API)
- [x] Admin page with real stats
- **Verification:** Dashboard page renders stats from `/dashboard/stats`

### M4 — Unified Inbox + Automation ✅ DONE
- [x] Inbox message model + list/mark-read endpoints
- [x] Twilio WhatsApp client integration
- [x] Automation router with CV screening endpoint
- [x] Smart ticketing (mockup via tickets table + routes)
- [x] Inbox UI page
- **Verification:** `GET /inbox/messages` returns messages; CV screen returns score

### M5 — Business Automation + Advanced ✅ DONE
- [x] CV screening pipeline (text extract → score → verdict)
- [x] Executive assistant chat endpoint
- [x] CMS site creation + page management
- [x] Billing/subscription management
- **Verification:** All routers registered at `/docs`

### M6 — Polish + Deploy ✅ DONE
- [x] Async logging (structlog) with JSON support
- [x] Global exception handler + health endpoint
- [x] Docker Compose for full stack (db + backend + frontend)
- [x] pytest test suite (7 tests: auth flow + agent CRUD + chat)
- [x] Documentation: Swagger at `/docs`, README, PROJECT_MAP
- **Verification:** `docker compose up` starts all 3 services
