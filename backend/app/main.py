from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.github import router as github_router
from app.api.repositories import router as repositories_router
from app.api.ingestion import router as ingestion_router
from app.api.rag import router as rag_router
from app.api.code_search import router as code_search_router
from app.api.graph import router as graph_router
from app.api.agents import router as agents_router
from app.api.autonomous import router as autonomous_router


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="CodeAware AI",
    description=(
        "Autonomous Code Intelligence Platform — "
        "clone repositories, search code with natural language, "
        "visualise dependency graphs, and run specialist AI agents."
    ),
    version="1.0.0",
    contact={
        "name": "CodeAware AI",
        "url": "http://localhost:5173",
    },
    license_info={
        "name": "MIT",
    },
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(github_router)
app.include_router(repositories_router)
app.include_router(ingestion_router)
app.include_router(rag_router)
app.include_router(code_search_router)
app.include_router(graph_router)
app.include_router(agents_router)
app.include_router(autonomous_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "success": True,
        "name": "CodeAware AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "version": "1.0.0",
    }