from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.logging_ import setup_logging, get_logger
from app.core.database import engine, Base
from app.modules.users.models import User
from app.modules.agents.models import Agent, AgentTrainingData, Conversation, Message
from app.modules.inbox.models import InboxMessage
from app.modules.customers.models import Customer, Subscription
from app.modules.tickets.models import Ticket
from app.modules.analytics.models import AnalyticsEvent
from app.modules.cms.models import CmsSite, CmsPage, AutomationRule
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.agents.router import router as agents_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.analytics.router import router as analytics_router
from app.modules.automation.router import router as automation_router
from app.modules.assistant.router import router as assistant_router
from app.modules.inbox.router import router as inbox_router
from app.modules.cms.router import router as cms_router
from app.modules.billing.router import router as billing_router

settings = get_settings()
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Marts AI Platform")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_v1_prefix
app.include_router(auth_router, prefix=prefix)
app.include_router(users_router, prefix=prefix)
app.include_router(agents_router, prefix=prefix)
app.include_router(dashboard_router, prefix=prefix)
app.include_router(analytics_router, prefix=prefix)
app.include_router(automation_router, prefix=prefix)
app.include_router(assistant_router, prefix=prefix)
app.include_router(inbox_router, prefix=prefix)
app.include_router(cms_router, prefix=prefix)
app.include_router(billing_router, prefix=prefix)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc, path=str(request.url))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
