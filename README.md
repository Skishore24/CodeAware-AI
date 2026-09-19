# CodeAware AI — Production AI Code Intelligence & Autonomous Engineering Platform

<div align="center">

![CodeAware AI](https://img.shields.io/badge/CodeAware-AI_Autonomous_Platform-4F46E5?style=for-the-badge&logo=codeforces&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![uv](https://img.shields.io/badge/uv-Fast_Python_Packaging-DE5FE9?style=for-the-badge)
![Ollama](https://img.shields.io/badge/Ollama-Local_LLM_Inference-black?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL_8.0-SQLAlchemy_2.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-Vite_8-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**100% Local-First Autonomous Software Engineering Platform** — zero cloud dependencies, powered by local Ollama LLMs (`llama3.1:8b`, `llama3.2:3b`, `nomic-embed-text`), managed with `uv`, backed by MySQL 8 with Alembic migrations, featuring long-horizon DeepAgent iteration, 21 specialist AI agents, interactive knowledge graphs, and safe sandboxed execution.

</div>

---

## 🌟 Architecture Highlights

- **100% Local-First Architecture**: No cloud LLM keys required. All inference is processed via local Ollama models with a dynamic Model Router that delegates fast tasks to `llama3.2:3b` and complex reasoning/patching to `llama3.1:8b`.
- **Modern Python Management with `uv`**: Ultra-fast dependency resolution, reproducible lockfiles (`uv.lock`), and unified workspace management.
- **Enterprise MySQL & Alembic Migrations**: 34 fully relational models covering RBAC users, repositories, analysis runs, security findings, bugs, patches, test runs, agent runs, audit logs, RAG chunks, and knowledge graph entities.
- **DeepAgent Long-Horizon Loop**: Self-directed autonomous engineering with iterative planning, sandbox execution, test-driven validation, tool budget limits, and loop-prevention guards.
- **Multi-Agent Orchestrator**: Coordinates 21 specialist agents across Intent Detection, Planning, Analysis, Security Auditing, Test Generation, Patching, and Validation.
- **19 Typed Sandbox Tools**: Granular permissions (`READ`, `WRITE`, `EXECUTE`), path traversal validation, allowlisted commands, and timestamped `.bak` automatic rollback.
- **Code RAG & Hybrid Vector Search**: Combines AST exact symbol matching, BM25/TF-IDF keyword scoring, and normalized vector embeddings with line-level code citations.
- **Interactive Knowledge Graph**: Canvas with force-directed physics, sub-graph path tracing, and caller/callee visualization.
- **Production React 19 Frontend**: Raycast/Linear-inspired workspace with Command Palette (`Ctrl+K`), tabbed Repository Intelligence, Bug Tracker, and DeepAgent execution visualizer.

---

## 🤖 21 Specialist AI Agents

| Agent | Focus Area & Capabilities |
|---|---|
| `DeepAgent` | Long-horizon iterative bug fixing, test execution, and self-directed repair loops. |
| `RepositoryAgent` | Tech stack detection, language breakdown, file structure, and entry points. |
| `SearchAgent` | Natural language code search and symbol lookup across repositories. |
| `RAGAgent` | Repository chunk retrieval with exact line-number citations. |
| `CodeAgent` | Python/JS AST parsing, class/method extraction, and cyclomatic complexity. |
| `BugAgent` | Syntax error detection, unhandled exceptions, and runtime bug classification. |
| `SecurityAgent` | Static OWASP audits (SQL injection, hardcoded secrets, command injection, path traversal). |
| `ImpactAgent` | Blast radius calculation, callers, callees, affected API routes, and broken tests. |
| `TestAgent` | Generates isolated `pytest` and `unittest` suites with mocks and boundary tests. |
| `FixAgent` | Generates unified git diffs and synthesizes verified patches. |
| `DocumentationAgent` | Automated markdown documentation, docstrings, and API specs. |
| `ArchitectureAgent` | Layer mapping (API, services, models, UI) and coupling risk analysis. |
| `PerformanceAgent` | Scans for N+1 query patterns, blocking I/O, and CPU-intensive hotspots. |
| `CodeReviewAgent` | Evaluates code across 8 engineering quality dimensions. |
| `GitAgent` | Commit history, branch topology, author churn, and diff comparisons. |
| `PRAgent` | Pull request summaries, risk evaluations, and automated review comments. |
| `ValidationAgent` | Isolated syntax validation and test execution runner. |
| `DependencyAgent` | Dependency security scanning, version drift, and outdated package alerts. |
| `RefactorAgent` | Identifies cognitive complexity smells, god classes, and proposes cleaner abstractions. |
| `DatabaseAgent` | SQL schema auditing, index recommendations, and ORM query optimization. |
| `APIAgent` | FastAPI/Express route discovery, parameter validation, and REST contract audits. |
| `FrontendAgent` | React component hierarchy, state flow analysis, and accessibility audits. |
| `DevOpsAgent` | Dockerfile, CI/CD workflow, and environment configuration audits. |

---

## 🚀 Quick Start Guide

> [!IMPORTANT]
> **Strict Package Management with `uv` (No `pip`)**  
> This project strictly uses [`uv`](https://docs.astral.sh/uv/) for Python dependency, environment, and execution management:
> - **DO NOT** use `pip install` or manual `python -m venv`. `uv` manages the virtual environment automatically in `.venv`.
> - **Sync Environment**: `uv sync --all-extras`
> - **Start Server**: `uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
> - **Run Migrations**: `uv run alembic upgrade head`
> - **Run Tests**: `uv run pytest tests/ -v`
> - **Add Dependencies**: `uv add <package_name>` (or `uv add --dev <package_name>`)

### Prerequisites

1. **Python 3.10+** and [uv](https://docs.astral.sh/uv/getting-started/installation/):
   ```bash
   # On Windows (PowerShell):
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

   # On Linux/macOS:
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
2. **Node.js 18+** and `npm`
3. **MySQL 8.0+** running locally
4. **Ollama** installed with models:
   ```bash
   ollama pull llama3.1:8b
   ollama pull llama3.2:3b
   ollama pull nomic-embed-text
   ```

---

### 1. Database Setup (MySQL)

Create the local database in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS codeaware_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure `backend/.env` with your database credentials:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Admin@123
MYSQL_DATABASE=codeaware_db

# Local Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_FAST_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest
OLLAMA_TIMEOUT_SECONDS=90
```

Apply database migrations:

```bash
uv run alembic upgrade head
```

---

### 2. Backend Installation & Start (with `uv`)

```bash
# 1. Sync all dependencies and build local environment (DO NOT use pip)
uv sync --all-extras

# 2. Start the FastAPI development server with uv
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI server runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).  
Interactive Swagger documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### 3. Frontend Installation & Start

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧠 Machine Learning & Model Training

CodeAware AI includes an offline code vulnerability detection classifier trained on real CVE fixes and production code:

- **Quick CLI Training**: `uv run python train.py --samples 2000`
- **Comprehensive Guide**: See [`ML_TRAINING_GUIDE.md`](file:///c:/MyFiles/Project/CODEAWARE/ML_TRAINING_GUIDE.md) for full pipeline architecture, CodeSearchNet integration, and hyperparameter tuning.

---

## 🧪 Verification & Testing

### Run Backend Test Suite (33 Automated Tests)

```bash
uv run pytest tests/ -v
```

### Run Backend Linter

```bash
uv run ruff check tests/
```

### Run Frontend Linter & Production Build

```bash
cd frontend
npm run lint
npm run build
```

---

## 🔒 Security & Sandbox Guarantees

1. **Path Boundary Validation**: Every file tool validates target paths against the repository sandbox root. Path traversal attempts (`../../etc/passwd`) are rejected with `SecuritySandboxException`.
2. **Command Allowlist**: Execution is strictly restricted to safe commands (`pytest`, `unittest`, `npm test`, `ruff`, `mypy`, `oxlint`). Unsafe commands are blocked.
3. **Automated Rollback**: All patches create timestamped `.bak` files. In the event of syntax errors or failed tests, files are immediately restored.
4. **RBAC & Token Security**: Secure bcrypt password hashing, HS256 JWT tokens, and role-based access control.

---

## 📄 License

MIT License. Built for engineering teams building resilient, production software.
