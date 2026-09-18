import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend root directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.core.logging import setup_logging, get_logger
from app.core.middleware import RequestLoggingMiddleware
from app.core.exceptions import CodeAwareException
from app.db.database import init_db

# Routers
from app.api.auth import router as auth_router
from app.api.github import router as github_router
from app.api.repositories import router as repositories_router
from app.api.ingestion import router as ingestion_router
from app.api.rag import router as rag_router
from app.api.code_search import router as code_search_router
from app.api.graph import router as graph_router
from app.api.agents import router as agents_router
from app.api.deep_agent import router as deep_agent_router
from app.api.autonomous import router as autonomous_router
from app.api.security import router as security_router
from app.api.bugs import router as bugs_router
from app.api.impact import router as impact_router
from app.api.review import router as review_router
from app.api.architecture import router as architecture_router
from app.api.tests import router as tests_router
from app.api.chat import router as chat_router
from app.api.files import router as files_router
from app.api.git import router as git_router
from app.api.projects import router as projects_router
from app.api.system import router as system_router
from app.api.ollama import router as ollama_router
from app.api.health import router as health_router

setup_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting CodeAware AI ({settings.APP_ENV} mode)...")
    init_db()
    yield
    logger.info("Shutting down CodeAware AI...")


app = FastAPI(
    title="CodeAware AI",
    description=(
        "Autonomous Code Intelligence Platform — "
        "local-first developer intelligence with Ollama, MySQL, RAG, "
        "polyglot AST knowledge graphs, and multi-agent orchestration."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    contact={"name": "CodeAware AI", "url": "http://localhost:5173"},
    license_info={"name": "MIT"},
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request tracing & duration headers
app.add_middleware(RequestLoggingMiddleware)


# Global Exception Handlers
@app.exception_handler(CodeAwareException)
async def codeaware_exception_handler(request: Request, exc: CodeAwareException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "details": exc.details,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error occurred.",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred.",
        },
    )


# Wire Routers (Both with and without /api prefix for contract compatibility)
ROUTERS = [
    auth_router,
    github_router,
    repositories_router,
    ingestion_router,
    rag_router,
    code_search_router,
    graph_router,
    agents_router,
    deep_agent_router,
    autonomous_router,
    security_router,
    bugs_router,
    impact_router,
    review_router,
    architecture_router,
    tests_router,
    chat_router,
    files_router,
    git_router,
    projects_router,
    system_router,
    ollama_router,
    health_router,
]

for r in ROUTERS:
    # Include under root
    app.include_router(r)
    # Also include with /api prefix
    app.include_router(r, prefix="/api")


@app.get("/")
def root():
    return {
        "success": True,
        "name": "CodeAware AI",
        "version": settings.VERSION,
        "environment": settings.APP_ENV,
        "status": "running",
        "docs": "/docs",
    }