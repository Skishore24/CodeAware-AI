# CodeAware AI — Test Suite Guide & Reference

This directory contains the automated unit and integration test suite for **CodeAware AI**.

The test suite is designed for **100% deterministic, zero-cloud, and offline execution**. Tests run against an isolated in-memory SQLite database and use mock/deterministic LLM providers, ensuring ultra-fast execution (~4 seconds) in both local development and CI pipelines.

---

## 🚀 How to Run the Tests

All tests are executed using [`uv`](https://docs.astral.sh/uv/) from the project root.

### 1. Run the Entire Test Suite
```bash
# Run all 33 tests with standard verbose output
uv run pytest tests/ -v

# Run in quiet mode with concise traceback (recommended for fast checks)
uv run pytest -q --tb=short
```

### 2. Run a Specific Test File
```bash
# Test only the AI Agents & Orchestration
uv run pytest tests/test_agents.py -v

# Test only the FastAPI HTTP Endpoints
uv run pytest tests/test_api.py -v

# Test only Authentication & JWT
uv run pytest tests/test_auth.py -v

# Test only LLM Model Router
uv run pytest tests/test_llm_router.py -v

# Test only RAG & Vector Store
uv run pytest tests/test_rag.py -v

# Test only Sandbox Execution & Rollback
uv run pytest tests/test_sandbox.py -v

# Test only Typed Tool Registry
uv run pytest tests/test_tools.py -v
```

### 3. Run a Single Test Function
```bash
# Run only the DeepAgent long-horizon test
uv run pytest tests/test_agents.py::test_deep_agent_long_horizon -v

# Run only the user registration & login flow test
uv run pytest tests/test_auth.py::test_register_and_login_flow -v

# Run only the sandbox path validation test
uv run pytest tests/test_sandbox.py::test_sandbox_path_validation -v
```

### 4. Advanced Test Flags
```bash
# Stop on first failure
uv run pytest tests/ -x

# Generate code coverage report in the terminal
uv run pytest tests/ --cov=app --cov-report=term-missing

# Run tests matching a keyword pattern
uv run pytest tests/ -k "router or rag"
```

---

## 📋 Test Files & Their Purposes

| Test File | Test Count | Primary Purpose & Covered Functionality |
|---|:---:|---|
| **[`test_agents.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_agents.py)** | 8 | **Specialist AI Agents & Orchestration**<br>• Validates domain agents: `RefactorAgent`, `DependencyAgent`, `DatabaseAgent`, `APIAgent`, `DevOpsAgent`, and `FrontendAgent`.<br>• Tests `CodeAwareOrchestrator` query intent detection and agent delegation.<br>• Tests `DeepAgent` autonomous loop with iteration budget and plan revision. |
| **[`test_api.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_api.py)** | 5 | **FastAPI HTTP Endpoints & Contracts**<br>• Verifies `/health`, `/health/db`, `/health/ollama` endpoints.<br>• Tests repository listing, bug retrieval, and DeepAgent trigger endpoints.<br>• Verifies WebSocket/REST chat session dispatch. |
| **[`test_auth.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_auth.py)** | 3 | **Authentication, Passwords & JWT Security**<br>• Verifies bcrypt password hashing, truncation, and verification.<br>• Tests HS256 JWT access token generation, decoding, and expiration.<br>• Tests end-to-end user registration, duplicate email rejection, and login auth flow. |
| **[`test_llm_router.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_llm_router.py)** | 4 | **Model Routing & Inference Providers**<br>• Tests `ModelRouter` model selection logic between fast models (`llama3.2:3b`) and complex models (`llama3.1:8b`).<br>• Tests offline deterministic inference via `TestLLMProvider`.<br>• Tests vector embedding generation and dimensions. |
| **[`test_rag.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_rag.py)** | 3 | **Retrieval-Augmented Generation (RAG)**<br>• Tests `CodeChunker` for AST symbol-aware and line-based code slicing.<br>• Tests `VectorStore` cosine similarity search and hybrid BM25 keyword matching.<br>• Tests `ContextBuilder` for prompt assembly with exact line-level citations. |
| **[`test_sandbox.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_sandbox.py)** | 3 | **Process Isolation & Execution Security**<br>• Tests `SandboxRunner` path boundary guard preventing directory traversal (`../../etc/passwd`).<br>• Tests automated creation of `.bak` timestamped backups and safe rollback on error.<br>• Verifies rejection of non-allowlisted execution commands. |
| **[`test_tools.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/test_tools.py)** | 6 | **Typed Sandbox Tools Registry**<br>• Tests `ToolRegistry` registration, permissions (`READ`, `WRITE`, `EXECUTE`), and execution.<br>• Tests `ReadFileTool` with line slicing and `ListFilesTool`.<br>• Tests `InspectASTTool` for syntax tree extraction and error handling for unknown tools. |
| **[`conftest.py`](file:///c:/MyFiles/Project/CODEAWARE/tests/conftest.py)** | — | **Shared Test Fixtures & Environment Setup**<br>• Injects `backend/` into `sys.path`.<br>• Configures in-memory SQLite database (`sqlite:///:memory:`) using SQLAlchemy `StaticPool`.<br>• Provides `db_session` with automatic rollback per test.<br>• Provides `client` (FastAPI `TestClient`) and isolated `temp_workspace` directories. |

---

## 🛡️ Test Design Principles

1. **Isolation**: Every test run uses an isolated in-memory SQLite database and temporary workspace directories. No local files or persistent database records are modified.
2. **Speed**: The complete test suite runs in under 5 seconds.
3. **No Network Dependencies**: External LLM calls are routed to `TestLLMProvider`, so the test suite passes even when Ollama or the internet is offline.
4. **CI Compatibility**: Executed automatically on every pull request and push to `main` via [`.github/workflows/ci.yml`](file:///c:/MyFiles/Project/CODEAWARE/.github/workflows/ci.yml).
