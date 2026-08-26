# CodeAware AI — Autonomous Code Intelligence Platform

<div align="center">

![CodeAware AI](https://img.shields.io/badge/CodeAware-AI_Code_Intelligence-4F46E5?style=for-the-badge&logo=codeforces&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NetworkX](https://img.shields.io/badge/NetworkX-Graph_Topology-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**100% Local-First, Self-Hosted Developer Intelligence** — understand any codebase, explore connected AST knowledge graphs, retrieve code with line-number citations, perform OWASP security audits, calculate blast radius, generate unit test suites, and apply verified autonomous patches.

</div>

---

## 🌟 Key Capabilities

* **100% Local-First & Privacy Preserving**: Zero data leaves your machine. Operates with deterministic AST symbol analyzers, pattern checking, TF-IDF hybrid retrieval, and local AI agents.
* **15 Standardized Specialist AI Agents**:
  1. `RepositoryAgent` — Tech stack detection, language distribution, file hierarchy & entry points.
  2. `SearchAgent` — Natural language code search and symbol lookup.
  3. `RAGAgent` — Repository-aware chunk retrieval with line-number citations.
  4. `CodeAnalysisAgent` — AST classes, methods, parameters, and call graphs.
  5. `BugAgent` — Syntax errors, bare excepts, runtime flaws, and unhandled exceptions.
  6. `SecurityAgent` — Static OWASP audits (SQL injection, hardcoded secrets, command injection, path traversal, unsafe eval/exec).
  7. `ImpactAgent` — Direct callers, indirect dependencies, affected routes, and broken tests.
  8. `TestAgent` — Generates isolated pytest/unittest test suites with fixtures, mocks, and edge cases.
  9. `FixAgent` — Proposes targeted patches and generates side-by-side unified diffs.
  10. `DocumentationAgent` — Generates markdown documentation and API contracts.
  11. `ArchitectureAgent` — Layer mapping (API, services, models, UI) and coupling risk analysis.
  12. `PerformanceAgent` — Identifies N+1 query patterns, blocking I/O, and bottlenecks.
  13. `CodeReviewAgent` — Evaluates code across 8 engineering quality dimensions.
  14. `GitAgent` — Inspects commits, branches, and diff histories.
  15. `ValidationAgent` — Isolated syntax and test validation sandbox runner.
* **Connected Interactive Knowledge Graph**:
  - Interactive Force-Directed network and hierarchical tree layouts.
  - Bézier connecting edges with directional arrows (`contains`, `defines`, `calls`, `imports`).
  - Drag-and-drop physics, canvas panning, 40%–280% zoom, sub-graph path illumination, and section maximize mode.
* **Autonomous Patching with Unified Diffs**:
  - Generates side-by-side code diffs with green/red line highlighting.
  - Automatic `.bak` timestamped backups and instant rollback protection.
* **Hybrid Code Search & RAG**:
  - Multi-tier retrieval combining AST exact symbol matching, BM25/TF-IDF vector ranking, and fuzzy path resolution.
* **Modern Developer Workspace**:
  - Raycast/Linear-inspired interface with Light & Dark themes.
  - Command Palette (`Ctrl+K` / `Cmd+K`), animated 404 page, and zero-warning build output.

---

## 🏗️ Architecture & Orchestration Flow

```text
                     Developer Query / Request
                                ↓
                 ┌─────────────────────────────┐
                 │   Hybrid Intent Classifier  │ (15 Classified Intents)
                 └──────────────┬──────────────┘
                                ↓
                 ┌─────────────────────────────┐
                 │  Task Planner & Orchestrator │
                 └──────────────┬──────────────┘
                                ↓
     ┌──────────────────────────┴──────────────────────────┐
     ↓                                                     ↓
┌─────────────────────────────┐           ┌─────────────────────────────┐
│  AST Symbol & Graph Engine  │           │   Hybrid RAG & Retriever    │
│  (NetworkX Dependency Tree) │           │ (TF-IDF + Path + Exact AST) │
└─────────────┬───────────────┘           └──────────────┬──────────────┘
              └─────────────────────┬────────────────────┘
                                    ↓
                 ┌─────────────────────────────┐
                 │   15 Specialist AI Agents   │
                 └──────────────┬──────────────┘
                                ↓
                 ┌─────────────────────────────┐
                 │  Deterministic AI Reasoner  │
                 └──────────────┬──────────────┘
                                ↓
                 ┌─────────────────────────────┐
                 │  Validation Sandbox Runner  │
                 └──────────────┬──────────────┘
                                ↓
   Structured Response: Line Citations • Call Graph • Unified Diff
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, Vite 8, React Router 7, Lucide Icons, Vanilla CSS Design System |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic, NetworkX |
| **AST & Analysis** | Python `ast`, Regex Polyglot Lexers (JS/TS, Go, Java, C++, Rust) |
| **Search & Retrieval** | Scikit-learn (TF-IDF & Logistic Regression), BM25 Token Ranking |
| **Graph Visualization** | Custom SVG Canvas Engine with Force-directed & Radial Layouts |
| **Quality & Linter** | `oxlint`, Python `unittest` |

---

## 📁 Repository Structure

```text
CODEAWARE/
├── backend/
│   ├── app/
│   │   ├── agents/          # 15 Standardized specialist agents + Orchestrator
│   │   ├── ai/              # Local deterministic reasoning engine & interfaces
│   │   ├── analysis/        # AST polyglot parser & vulnerability scanner
│   │   ├── api/             # FastAPI REST endpoints (repos, search, graph, etc.)
│   │   ├── config/          # Environment settings & directory paths
│   │   ├── db/              # In-memory & SQLite metadata stores
│   │   ├── graph/           # Knowledge graph builder & impact analyzer
│   │   ├── ml/              # 15-intent classifier with TF-IDF
│   │   ├── rag/             # Chunker, vector stores, hybrid retriever
│   │   ├── services/        # Ingestion, RAG, Graph, and Autonomous workflows
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Backend unit & integration test suite
│   └── requirements.txt     # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/             # HTTP API client and endpoint helpers
│   │   ├── components/      # Sidebar, Header, CommandPalette, SourceViewer, DiffViewer
│   │   ├── context/         # AuthContext, RepoContext, ThemeContext
│   │   ├── pages/           # Dashboard, Repositories, CodeSearch, AgentChat,
│   │   │                    # CodeGraph, ImpactAnalysis, AutonomousFix,
│   │   │                    # CodeReview, SecurityDashboard, TestGenerator, Settings
│   │   ├── index.css        # Modern design system & animation tokens
│   │   ├── App.jsx          # Route layout & initialization gate
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore               # Comprehensive Git ignore rules
└── README.md                # Project documentation
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

### 1. Clone & Setup Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be running at [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs at `/docs`).

---

### 2. Setup & Launch Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ Navigation & Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Open Universal Command Palette |
| `Ctrl + P` / `Cmd + P` | Quick Switch Repository |
| `Esc` | Close Modal / Command Palette |
| `Scroll Wheel` | Zoom in/out on Knowledge Graph |
| `Click + Drag` | Pan canvas / Drag graph nodes |

---

## 🧪 Testing & Code Quality

```bash
# Run backend test suite
cd backend
python -m unittest tests.test_codeaware -v

# Run frontend linter (0 warnings)
cd frontend
npm run lint

# Run frontend production build
npm run build
```

---

## 🔒 Security & Sandboxing

* **Strict Path Traversal Guards**: Every file system access strictly verifies that the target path resolves inside the active repository root sandbox.
* **Automated Patch Backups**: Every patch generates timestamped `.bak` files with automatic rollback on test or syntax failure.
* **Static OWASP Rules**: Detects SQL injection, hardcoded API secrets, insecure deserialization, command execution (`subprocess`, `eval`), and unhandled exceptions.

---

<div align="center">
Built with ❤️ for modern software engineering teams.
</div>
