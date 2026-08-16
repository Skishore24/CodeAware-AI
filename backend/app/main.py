from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import (
    DATA_DIR,
    REPOSITORIES_DIR,
    INDEXES_DIR,
    GRAPHS_DIR,
    EMBEDDINGS_DIR,
    WORKSPACE_DIR,
)


app = FastAPI(
    title="CodeAware AI",
    description="Autonomous AI Software Development & Code Intelligence Platform",
    version="0.1.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "codeaware-backend",
    }


# ---------------------------------------------------------
# System information
# ---------------------------------------------------------

@app.get("/system")
def system_info():
    return {
        "data_directory": str(DATA_DIR),
        "repositories_directory": str(REPOSITORIES_DIR),
        "indexes_directory": str(INDEXES_DIR),
        "graphs_directory": str(GRAPHS_DIR),
        "embeddings_directory": str(EMBEDDINGS_DIR),
        "workspace_directory": str(WORKSPACE_DIR),
    }