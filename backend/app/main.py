from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.repositories import router as repositories_router
from app.api.agents import router as agents_router
from app.api.graph import router as graph_router
from app.api.rag import router as rag_router
from app.api.github import router as github_router

app = FastAPI(
    title="CodeAware AI",
    description=(
        "Autonomous AI Software Development "
        "& Code Intelligence Platform"
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Register all routers
# ---------------------------------------------------------

app.include_router(repositories_router)
app.include_router(agents_router)
app.include_router(graph_router)
app.include_router(rag_router)
app.include_router(github_router)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "CodeAware AI",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "codeaware-backend",
    }