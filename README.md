# 🧠 CodeAware AI

> **Autonomous AI Code Intelligence Platform** — Clone repositories, search code with natural language, visualize dependency knowledge graphs, orchestrate specialist AI agents, and run automated fix workflows from a single interface.

---

## ✨ Features & Capabilities

| Module | Feature | Description |
|---|---|---|
| 📂 **Repositories** | **Repository Ingestion & Discovery** | Clone any public GitHub repo or auto-detect existing workspace repositories with real-time pipeline tracking (Clone → Scan → Analyze → Index → Graph). |
| 🔍 **Code Search** | **Hybrid Code Search** | Search your entire codebase using natural language powered by hybrid TF-IDF retrieval and keyword matching. |
| 🤖 **Agent Chat** | **Specialist AI Orchestrator** | Free-text task classifier routes requests to dedicated agents (Repository, RAG, Bug, Security, Test, Fix, Documentation). |
| 🕸️ **Code Graph** | **Knowledge Graph & Impact** | Force-directed NetworkX visual canvas and structured tables mapping files, classes, functions, and symbol change impacts. |
| 🛠️ **Autonomous Fix** | **End-to-End Bug Patching** | AI inspects reported bugs, writes patches, validates syntax, previews side-by-side diffs, commits to branches, and opens GitHub PRs. |
| ⚙️ **Settings & Context** | **Global State & System Health** | Shared `RepoContext` across all pages with persistence, backend health diagnostics, and repository switching. |

---

## 🗂️ Project Structure

```
CODEAWARE/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── agents/                 # Orchestrator, RepositoryAgent, CodeAgent, RAGAgent, BugAgent, TestAgent, FixAgent
│   │   ├── ai/                     # AIModel interface, CodeAwareReasoner
│   │   ├── analysis/               # AST parser, CodeAnalyzer, RepositoryScanner
│   │   ├── api/                    # FastAPI routers (repositories, code_search, agents, graph, rag, github, autonomous)
│   │   ├── config/                 # paths.py (single source of truth), settings.py
│   │   ├── graph/                  # CodeKnowledgeGraph, ImpactAnalyzer
│   │   ├── ml/                     # IntentClassifier (TF-IDF + LogisticRegression)
│   │   ├── rag/                    # CodeChunker, HybridRetriever, VectorStore, KeywordSearch
│   │   ├── services/               # GitHubService, RepositoryService, GraphService, RAGService, AutonomousWorkflow
│   │   └── main.py                 # FastAPI application entry point
│   ├── .env.example                # Sample environment variables
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React 19 + Vite 8 frontend
│   ├── src/
│   │   ├── api/                    # Centralized Axios client & API modules (repositories, graph, agents, autonomous)
│   │   ├── components/             # Sidebar, Toast notification system, PageWrapper
│   │   ├── context/                # RepoContext (global active repo & workspace repo discovery)
│   │   ├── pages/                  # Dashboard, Repositories, CodeSearch, AgentChat, CodeGraph, AutonomousFix, Settings
│   │   ├── App.jsx                 # Router, layout & global context providers
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
│   ├── cloned_repositories/        # Cloned repositories live here
│   └── sandbox/
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ & **npm**
- **Git** installed and on PATH

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure Environment Variables (optional):**
```bash
cp .env.example .env
```
*(Fill in `GITHUB_TOKEN` if you wish to use the automatic GitHub Pull Request creation feature in Autonomous Fix)*

**Start the FastAPI backend:**
```bash
uvicorn app.main:app --reload
```

- **API URL:** `http://127.0.0.1:8000`
- **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Frontend App:** `http://localhost:5173`

---

## 🔌 API Overview

Interactive documentation is available at **`http://localhost:8000/docs`**.

### 📁 Repositories & Ingestion
| Method | Route | Description |
|---|---|---|
| `GET` | `/repositories/list` | List all discovered cloned repositories from workspace |
| `POST` | `/repositories/clone-and-ingest` | Clone repo + run scan + build graph + index RAG in 1 call |
| `POST` | `/repositories/clone` | Clone a GitHub repository |
| `POST` | `/repositories/scan` | Scan repository file structure, directories, languages |
| `POST` | `/repositories/code-analysis` | AST analysis (functions, classes, imports) |

### 🔍 Code Search & RAG
| Method | Route | Description |
|---|---|---|
| `POST` | `/code-search/search` | Natural language hybrid search with top-k code snippets |
| `POST` | `/rag/search` | Repository-aware RAG search and context extraction |

### 🤖 Agent Orchestration
| Method | Route | Description |
|---|---|---|
| `POST` | `/agents/run` | Classify task intent and execute specialist agent |

### 🕸️ Code Graph & Impact Analysis
| Method | Route | Description |
|---|---|---|
| `POST` | `/graph/summary` | Node & edge counts by type (functions, classes, files) |
| `POST` | `/graph/build` | Export full interactive dependency graph |
| `POST` | `/graph/impact` | Analyze upstream impact of modifying a specific symbol |

### 🛠️ Autonomous Fix
| Method | Route | Description |
|---|---|---|
| `POST` | `/autonomous/run` | Execute end-to-end fix generation and AST validation |
| `POST` | `/autonomous/approve` | Commit validated patch to a new git branch |
| `POST` | `/autonomous/create-pr` | Create a GitHub pull request for the branch |

---

## 🤖 Intent Classification

The `IntentClassifier` (TF-IDF + Logistic Regression) automatically determines task intent and routes to the appropriate specialist agent:

```
User Query / Task
       │
       ▼
┌──────────────────────────────┐
│  ML Intent Classifier Router │
└──────────────┬───────────────┘
               │
  ┌────────────┼────────────┬────────────┬────────────┐
  ▼            ▼            ▼            ▼            ▼
RAGAgent   RepoAgent    BugAgent    TestAgent    FixAgent
(Search &  (Structure  (Bugs &      (Pytest      (Code Patch &
 Explain)   & Metrics)  Security)    Gen)         Diffs)
```

| Intent Class | Routed Agent | Example User Query |
|---|---|---|
| `code_search` | `RAGAgent` | *"Where is authentication implemented?"* |
| `code_explanation` | `RAGAgent` | *"Explain what authenticate_user does"* |
| `repository_analysis` | `RepositoryAgent` | *"What is the structure of this project?"* |
| `impact_analysis` | `ImpactAgent` | *"What breaks if I modify verify_token?"* |
| `bug_analysis` | `BugAgent` | *"Find bugs or unsafe patterns in this file"* |
| `security_analysis` | `BugAgent` (Security mode) | *"Check for hardcoded credentials and SQL injection"* |
| `test_generation` | `TestAgent` | *"Generate pytest test cases for these functions"* |
| `fix_request` | `FixAgent` | *"Fix the IndexError in parser.py"* |
| `documentation` | `RAGAgent` | *"Generate a summary and documentation for the code"* |

---

## 🛠️ Verification & Testing

### Test Backend Agents & Services:
```bash
cd backend
python -c "from app.services.repository_service import RepositoryService; from app.config.settings import CLONED_REPOSITORIES_DIR; s = RepositoryService(CLONED_REPOSITORIES_DIR); print('Repos:', s.list_repositories())"
```

### Production Frontend Build:
```bash
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
