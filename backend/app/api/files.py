from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.sandbox.runner import SandboxRunner
from app.config.settings import settings, CLONED_REPOSITORIES_DIR

router = APIRouter(
    prefix="/files",
    tags=["Source File Explorer"],
)


class FileContentRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None


class FileTreeRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    sub_directory: Optional[str] = None


def _resolve_repo(repository_name: Optional[str] = None, repository_path: Optional[str] = None) -> Path:
    """
    Resolve repository directory from either repository_name or repository_path.
    Checks:
    1. Direct filesystem path if provided
    2. Subfolder within CLONED_REPOSITORIES_DIR
    3. Database record matching repository_name
    4. Default workspace repository directory
    """
    if repository_path:
        p = Path(repository_path)
        if p.is_absolute() and p.exists():
            return p
        cand = Path(CLONED_REPOSITORIES_DIR) / repository_path
        if cand.exists():
            return cand
        if p.exists():
            return p.resolve()

    if repository_name:
        cand = Path(CLONED_REPOSITORIES_DIR) / repository_name
        if cand.exists():
            return cand

        try:
            from app.db.database import SessionLocal
            from app.db.models import Repository as DBRepository
            db = SessionLocal()
            try:
                db_repo = db.query(DBRepository).filter(DBRepository.name == repository_name).first()
                if db_repo and db_repo.local_path:
                    repo_dir = Path(db_repo.local_path)
                    if repo_dir.exists():
                        return repo_dir.resolve()
            finally:
                db.close()
        except Exception:
            pass

    default_dir = Path(CLONED_REPOSITORIES_DIR).resolve()
    if default_dir.exists():
        return default_dir
    return Path(settings.REPOSITORY_STORAGE_PATH).resolve()


def _read_file_data(repo_dir: Path, file_path_str: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> Dict[str, Any]:
    sandbox = SandboxRunner(repo_dir)

    try:
        safe_path = sandbox.validate_path(file_path_str)
    except Exception as exc:
        raise HTTPException(status_code=403, detail=f"Access forbidden: {exc}")

    if not safe_path.exists() or not safe_path.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path_str}")

    try:
        raw_text = safe_path.read_text(encoding="utf-8", errors="ignore")
        lines = raw_text.splitlines()
        total_lines = len(lines)

        start = max(1, start_line) if start_line else 1
        end = min(total_lines, end_line) if end_line else total_lines

        sliced = [
            {"line_number": i, "content": lines[i - 1]}
            for i in range(start, min(end + 1, total_lines + 1))
        ]

        ext = safe_path.suffix.lower()
        language_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".json": "json",
            ".md": "markdown",
            ".html": "html",
            ".css": "css",
            ".go": "go",
            ".java": "java",
            ".cpp": "cpp",
            ".c": "c",
            ".rs": "rust",
            ".sql": "sql",
            ".yaml": "yaml",
            ".yml": "yaml",
            ".sh": "bash",
        }

        return {
            "success": True,
            "file_path": str(file_path_str),
            "file_name": safe_path.name,
            "language": language_map.get(ext, "plaintext"),
            "total_lines": total_lines,
            "start_line": start,
            "end_line": end,
            "content": raw_text,
            "lines": sliced,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error reading file: {exc}")


def _build_tree_data(repo_dir: Path, sub_directory: Optional[str] = None) -> Dict[str, Any]:
    target_root = repo_dir
    if sub_directory:
        target_root = (repo_dir / sub_directory.lstrip("/\\")).resolve()

    if not target_root.exists():
        raise HTTPException(status_code=404, detail=f"Repository or directory path not found: {target_root}")

    ignored = {".git", ".venv", "venv", "node_modules", "__pycache__", "dist", "build", ".idea", ".vscode"}

    def build_tree(path: Path) -> Dict[str, Any]:
        node: Dict[str, Any] = {
            "name": path.name,
            "path": str(path.relative_to(repo_dir)).replace("\\", "/"),
            "type": "directory" if path.is_dir() else "file",
        }
        if path.is_dir():
            children = []
            try:
                for child in sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                    if child.name not in ignored:
                        children.append(build_tree(child))
            except PermissionError:
                pass
            node["children"] = children
        else:
            try:
                node["size"] = path.stat().st_size
            except Exception:
                node["size"] = 0
        return node

    return {"success": True, "root": build_tree(target_root)}


@router.post("/content")
def get_file_content(request: FileContentRequest) -> Dict[str, Any]:
    repo_dir = _resolve_repo(request.repository_name, request.repository_path)
    return _read_file_data(repo_dir, request.file_path, request.start_line, request.end_line)


@router.get("/content")
def get_file_content_get(
    file_path: str = Query(..., description="Relative path to target file"),
    repository_name: Optional[str] = Query(None, description="Name of repository"),
    repository_path: Optional[str] = Query(None, description="Filesystem path of repository"),
    start_line: Optional[int] = Query(None),
    end_line: Optional[int] = Query(None),
) -> Dict[str, Any]:
    repo_dir = _resolve_repo(repository_name, repository_path)
    return _read_file_data(repo_dir, file_path, start_line, end_line)


@router.post("/tree")
def get_file_tree(request: FileTreeRequest) -> Dict[str, Any]:
    repo_dir = _resolve_repo(request.repository_name, request.repository_path)
    return _build_tree_data(repo_dir, request.sub_directory)


@router.get("/tree")
def get_file_tree_get(
    repository_name: Optional[str] = Query(None, description="Name of repository"),
    repository_path: Optional[str] = Query(None, description="Filesystem path of repository"),
    sub_directory: Optional[str] = Query(None, description="Optional sub-directory"),
) -> Dict[str, Any]:
    repo_dir = _resolve_repo(repository_name, repository_path)
    return _build_tree_data(repo_dir, sub_directory)
