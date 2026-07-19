# Marts AI Platform

Enterprise AI-powered business automation platform with intelligent agents, unified inbox, analytics, and more.

## Quick Start

```bash
# 1. Clone and enter directory
cd marts

# 2. Copy environment file
cp .env.example .env
# Edit .env with your keys (OpenAI, Twilio)

# 3. Start full stack with Docker
docker compose -f docker/docker-compose.yml up -d

# 4. Open in browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture

- **Backend:** Python 3.14 + FastAPI 0.138 + SQLAlchemy 2.0 async + PostgreSQL 18
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 + next-intl (RTL support)
- **Auth:** JWT (access + refresh tokens) with bcrypt
- **AI:** OpenAI Responses API (GPT-4o) for agent chat
- **Messaging:** Twilio WhatsApp Business API
- **Deploy:** Docker Compose

## Project Structure

```
backend/
├── app/
│   ├── core/           # Config, DB, security, logging
│   ├── modules/        # Domain modules (auth, users, agents, ...)
│   └── integrations/   # OpenAI, Twilio clients
├── alembic/            # DB migrations
└── tests/              # pytest suite

frontend/
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Shared UI
│   └── lib/            # API client, i18n
└── messages/           # Translation files (en, ar, fr)
```

## API Endpoints

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/v1/auth` | Register, login, refresh tokens |
| Users | `/api/v1/users` | Profile management, admin user list |
| Agents | `/api/v1/agents` | AI agent CRUD, training, chat |
| Dashboard | `/api/v1/dashboard` | Live KPI stats |
| Analytics | `/api/v1/analytics` | Events, agent performance |
| Automation | `/api/v1/automation` | CV screening, smart tickets |
| Assistant | `/api/v1/assistant` | Executive AI assistant |
| Inbox | `/api/v1/inbox` | Unified messaging inbox |
| CMS | `/api/v1/cms` | Website builder |
| Billing | `/api/v1/billing` | Subscriptions |

Full interactive docs at `http://localhost:8000/docs` (Swagger UI).

## Testing

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```
