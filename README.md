# 🧠 CodeAware AI

> **Autonomous AI Code Intelligence Platform** — Clone repositories, search code with natural language, visualise knowledge graphs, and run specialist AI agents from a single interface.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Repository Cloning** | Clone any public GitHub repo in one click |
| **Hybrid Code Search** | TF-IDF + keyword retrieval across entire codebases |
| **Agent Orchestration** | ML intent classifier routes tasks to specialist agents |
| **Code Knowledge Graph** | NetworkX graph of files, classes, functions, imports |
| **Impact Analysis** | Discover what breaks before changing a symbol |
| **RAG Pipeline** | Repository-aware answers via chunk retrieval + reasoning |

---

## 🗂️ Project Structure

```
CODEAWARE/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── agents/                 # BaseAgent, CodeAgent, RAGAgent, RepositoryAgent, Orchestrator
│   │   ├── ai/                     # AIModel interface, CodeAwareReasoner
│   │   ├── analysis/               # AST parser, CodeAnalyzer, RepositoryScanner
│   │   ├── api/                    # FastAPI routers (repositories, agents, graph, rag, github)
│   │   ├── config/                 # paths.py (single source of truth), settings.py (re-exports)
│   │   ├── graph/                  # CodeKnowledgeGraph, ImpactAnalyzer
│   │   ├── ml/                     # IntentClassifier (TF-IDF + LogisticRegression)
│   │   ├── rag/                    # CodeChunker, HybridRetriever, VectorStore, KeywordSearch
│   │   ├── services/               # GitHubService, RepositoryService, GraphService, RAGService
│   │   └── main.py                 # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── api/                    # Axios client + per-feature wrappers
│   │   ├── components/             # Sidebar, Toast notification system
│   │   ├── pages/                  # Dashboard, Repositories, CodeSearch, AgentChat, CodeGraph
│   │   ├── App.jsx                 # Router + layout
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global dark glassmorphism design system
│   ├── index.html
│   └── package.json
│
├── data/                           # Persistent data store (auto-created)
│   ├── repositories/
│   ├── indexes/
│   ├── graphs/
│   └── embeddings/
│
├── workspace/                      # Runtime workspace (auto-created)
│   ├── cloned_repositories/        # Git-cloned repos live here
│   └── sandbox/
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **Git** installed and on PATH

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Start the backend:**

```bash
uvicorn app.main:app --reload
```

The API will be available at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

### 3. Configuration (optional)

The backend auto-creates all required directories on startup. No `.env` file is required for basic usage.

Directory locations are controlled in `backend/app/config/paths.py`:

| Variable | Default Path |
|----------|--------------|
| `CLONED_REPOSITORIES_DIR` | `workspace/cloned_repositories/` |
| `SANDBOX_DIR` | `workspace/sandbox/` |
| `DATA_DIR` | `data/` |
| `INDEXES_DIR` | `data/indexes/` |
| `GRAPHS_DIR` | `data/graphs/` |
| `EMBEDDINGS_DIR` | `data/embeddings/` |

---

## 🔌 API Reference

All routes are available at **http://localhost:8000/docs**

### GitHub / Repositories

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/github/clone` | Clone a GitHub repo (by URL string) |
| `POST` | `/repositories/clone` | Clone with pydantic URL validation |
| `POST` | `/repositories/scan` | Scan repo structure and file metadata |
| `POST` | `/repositories/code-analysis` | AST analysis — functions, classes, imports |

### RAG

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/rag/search` | Hybrid search over a cloned repository |

### Code Graph

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/graph/summary` | Node/edge counts and type breakdowns |
| `POST` | `/graph/build` | Full graph export (nodes + edges) |
| `POST` | `/graph/impact` | Upstream impact of changing a symbol |

### Agents

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/agents/run` | Run the orchestrator with a natural language task |

### Health

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | Backend health check |
| `GET` | `/` | Version and status info |

---

## 🤖 Intent Classes

The `IntentClassifier` (TF-IDF + Logistic Regression) maps free-text tasks to one of 9 intents:

| Intent | Example Prompts |
|--------|----------------|
| `code_search` | "Where is authentication implemented?" |
| `code_explanation` | "Explain authenticate_user" |
| `repository_analysis` | "Analyse the project structure" |
| `impact_analysis` | "What breaks if I change login?" |
| `bug_analysis` | "Why does this function crash?" |
| `security_analysis` | "Find hardcoded secrets" |
| `test_generation` | "Generate tests for the login function" |
| `fix_request` | "Fix this bug" |
| `documentation` | "Generate README documentation" |

---

## 🏗️ Architecture

```
User Request
    │
    ▼
IntentClassifier (ML)
    │
    ├── code_search / code_explanation ──► RAGAgent
    │       └── CodeChunker → HybridRetriever → CodeAwareReasoner
    │
    ├── repository_analysis ──────────────► RepositoryAgent
    │       └── RepositoryScanner
    │
    ├── impact_analysis ──────────────────► (CodeGraph + ImpactAnalyzer)
    │
    └── bug / security / tests / fix / docs ─► (planned agents)
```

---

## 🛠️ Development

### Run backend tests

```bash
cd backend
python test_intent.py
python test_rag.py
```

### Build frontend for production

```bash
cd frontend
npm run build
```

---

## 📋 Roadmap

- [ ] LLM integration (OpenAI / local model) for richer answers
- [ ] Bug Analysis Agent
- [ ] Security Analysis Agent  
- [ ] Test Generation Agent
- [ ] Fix Request Agent
- [ ] Documentation Generator Agent
- [ ] Persistent vector store (FAISS / ChromaDB)
- [ ] GitHub Actions CI/CD
- [ ] Docker Compose setup

---

## 📄 License

MIT