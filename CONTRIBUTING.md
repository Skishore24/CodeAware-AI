# Contributing to CodeAware AI

Thank you for your interest in contributing to **CodeAware AI**! We welcome contributions to improve our local-first AI software engineering platform.

---

## 🛠️ Development Guidelines

### 1. Python Environment Management with `uv`
This project strictly enforces package management via [`uv`](https://docs.astral.sh/uv/):
- **DO NOT** use `pip install` directly or commit global virtual environments.
- **Sync Dependencies**:
  ```bash
  uv sync --all-extras
  ```
- **Add a Package**:
  ```bash
  uv add <package-name>
  ```
- **Add a Development Dependency**:
  ```bash
  uv add --dev <package-name>
  ```

### 2. Running Tests
All pull requests must pass the automated test suite before merging:
```bash
# Run all unit and integration tests
uv run pytest tests/ -v

# Run with short traceback
uv run pytest -q --tb=short
```

### 3. Code Quality & Linting
Ensure your code adheres to PEP 8 standards and passes static analysis:
```bash
# Python linting
uv run ruff check .

# Python auto-formatting
uv run ruff format .

# Frontend linting (oxlint)
cd frontend
npm run lint
```

### 4. Database Migrations (Alembic)
When modifying SQLAlchemy models in `backend/app/models/entities.py`:
1. Generate an Alembic migration:
   ```bash
   uv run alembic revision --autogenerate -m "describe changes"
   ```
2. Inspect the generated file in `backend/alembic/versions/`.
3. Apply migration to your local database:
   ```bash
   uv run alembic upgrade head
   ```

### 5. Frontend Development (React & Vite)
- The frontend is built using React 19 and Vite 8 in `frontend/`.
- Ensure new components include responsive styling and use semantic CSS variables.
- Verify clean production bundling:
  ```bash
  cd frontend
  npm run build
  ```

---

## 🌿 Git & Workflow Etiquette

1. **Branch Naming**:
   - `feat/feature-name` for new capabilities.
   - `fix/bug-description` for bug repairs.
   - `docs/documentation-update` for documentation changes.
2. **Commit Messages**:
   - Use clear, descriptive commit messages (e.g., `fix(sandbox): guard against Windows permission locks`).
3. **Sensitive Data**:
   - **Never commit `.env` files, API keys, private keys, or passwords.** Ensure all environment variables are documented in `.env.example`.
