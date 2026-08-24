# CodeAware AI — Autonomous Code Intelligence Platform

> **Local-First, Self-Hosted Developer Intelligence** — understand an entire repository, retrieve relevant source code with citations, analyze symbols & dependencies, detect bugs & security vulnerabilities, calculate blast radius, generate unit tests, and propose verified patches through a clean developer workspace.

---

## 🚀 Key Capabilities

- **100% Local-First / Self-Hosted**: Zero reliance on external paid LLM APIs. Uses deterministic AST symbol analysis, static pattern checking, TF-IDF hybrid retrieval, and local reasoning.
- **15 Standardized Specialist Agents**:
  1. `RepositoryAgent` — Tech stack, language distribution, file hierarchy & entry points.
  2. `SearchAgent` — Natural language code search and symbol lookup.
  3. `RAGAgent` — Repository-aware chunk retrieval with line-number citations.
  4. `CodeAnalysisAgent` — AST classes, methods, parameters, and call graphs.
  5. `BugAgent` — Syntax errors, bare excepts, runtime flaws, and unhandled issues.
  6. `SecurityAgent` — OWASP static security audits (SQLi, hardcoded credentials, command injection, unsafe eval/exec, path traversal).
  7. `ImpactAgent` — Direct callers, indirect dependencies, affected APIs, and broken tests.
  8. `TestAgent` — Generates isolated pytest/unittest test suites with mocks and boundary tests.
  9. `FixAgent` — Proposes targeted patches and generates unified diffs.
  10. `DocumentationAgent` — Generates markdown documentation and API contracts.
  11. `ArchitectureAgent` — Layer mapping (API, services, models, UI) and coupling risk analysis.
  12. `PerformanceAgent` — Identifies N+1 query patterns, blocking I/O, and bottlenecks.
  13. `CodeReviewAgent` — Evaluates code across 8 engineering dimensions.
  14. `GitAgent` — Inspects commits, branches, and diffs.
  15. `ValidationAgent` — Isolated syntax and test validation runners.
- **Hybrid Intent Classifier**: Classifies 15 developer intents using TF-IDF and Logistic Regression with multi-intent support (e.g. *Bug Analysis + Fix Request*).
- **Knowledge Graph & Blast Radius**: NetworkX graph linking repositories, files, classes, functions, and imports with interactive blast radius scoring (High / Medium / Low).
- **Safe Autonomous Fix Workflow**: Inspect unified diffs -> run syntax and test validation -> approve and apply patch with automatic rollback protection.
- **Modern Developer UI**: Clean Light Theme (GitHub + Linear + VS Code aesthetic), Command Palette (`Ctrl+K` / `Cmd+K`), split search layout, and live execution timelines.

---

## 🏗️ Architecture

```text
Developer Query / Task
         ↓
Hybrid Intent Classifier (15 Intents)
         ↓
Task Planner & Orchestrator
         ↓
Repository Context Resolver & AST Engine
         ↓
Hybrid RAG Retrieval (TF-IDF + Symbol + Path Matching)
         ↓
Specialist Agent Selection & Chaining
         ↓
CodeAware Deterministic Reasoner
         ↓
Validation & Test Runner
         ↓
Structured Response with Line Citations & Unified Diff
```

---

## 📦 Project Structure

```text
CODEAWARE/
├── backend/
│   ├── app/
│   │   ├── agents/          # 15 Standardized specialist agents + Orchestrator
│   │   ├── ai/              # Local deterministic reasoning engine & interfaces
│   │   ├── analysis/        # AST parser (Python, JS/TS, Go, Java) & scanner
│   │   ├── api/             # FastAPI REST endpoints (repositories, search, security, review, graph, autonomous, etc.)
│   │   ├── config/          # Environment settings & directory paths
│   │   ├── graph/           # Knowledge graph builder & impact analyzer
│   │   ├── ml/              # 15-intent classifier with TF-IDF
│   │   ├── rag/             # Chunker, TF-IDF vector store, hybrid retriever
│   │   ├── services/        # Ingestion, RAG, Graph, and Autonomous workflows
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Backend unit & integration test suite
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Example configuration
│
└── frontend/
    ├── public/
    │   └── assets/          # SVG brand assets & product illustrations
    ├── src/
    │   ├── api/             # Unified HTTP API client & endpoint helpers
    │   ├── components/      # Sidebar, CommandPalette, Toast, SourceViewer, DiffViewer
    │   ├── context/         # RepoContext (global state, health polling)
    │   ├── pages/           # Dashboard, Repositories, CodeSearch, AgentChat,
    │   │                    # CodeGraph, ImpactAnalysis, AutonomousFix,
    │   │                    # CodeReview, SecurityDashboard, TestGenerator, Settings
    │   ├── index.css        # Modern Light Theme design system
    │   ├── App.jsx          # Route configuration
    │   └── main.jsx
    └── package.json
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ Keyboard Shortcuts
- `Ctrl+K` / `Cmd+K`: Open Command Palette to navigate features or switch repositories.
- `Ctrl+P` / `Cmd+P`: Quick search across files, symbols, and commands.
- `Esc`: Close open modal overlays.

---

## 🧪 Running Tests

```bash
cd backend
python -m unittest tests.test_codeaware -v
```

---

## 🔒 Security & Path Safety
- **Path Traversal Protection**: All file read/write operations strictly validate that target paths resolve within the active repository root.
- **Automated Patch Backups**: Patch application creates automatic timestamped `.bak` copies and rolls back on error.
- **Isolated Validation**: Syntax validation and test verification are performed in isolated sandboxes before changes are presented to the developer.
- **OWASP Top 10 Static Audit**: Proactively catches SQL injection, hardcoded secrets, unsafe deserialization, and dangerous eval/exec calls.
