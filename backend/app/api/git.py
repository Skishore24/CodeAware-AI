import datetime
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config.paths import CLONED_REPOSITORIES_DIR
from app.core.logging import get_logger

logger = get_logger("app.api.git")

router = APIRouter(
    prefix="/git",
    tags=["Git Branches & Commits"],
)


def _resolve_repo(repo_name: Optional[str], repo_path: Optional[str]) -> Path:
    """
    Robustly resolves a repository directory inside CLONED_REPOSITORIES_DIR or absolute path.
    """
    if repo_path:
        p = Path(repo_path).resolve()
        if p.exists() and p.is_dir():
            return p
        p_cloned = (Path(CLONED_REPOSITORIES_DIR) / repo_path).resolve()
        if p_cloned.exists() and p_cloned.is_dir():
            return p_cloned

    if repo_name:
        p_name = (Path(CLONED_REPOSITORIES_DIR) / repo_name).resolve()
        if p_name.exists() and p_name.is_dir():
            return p_name

    # Check database
    try:
        from app.db.database import SessionLocal
        from app.models.entities import Repository
        if SessionLocal and (repo_name or repo_path):
            with SessionLocal() as db:
                name = repo_name or (Path(repo_path).name if repo_path else None)
                if name:
                    rec = db.query(Repository).filter(Repository.name == name).first()
                    if rec and rec.local_path:
                        p_db = Path(rec.local_path).resolve()
                        if p_db.exists() and p_db.is_dir():
                            return p_db
                        p_cloned_db = (Path(CLONED_REPOSITORIES_DIR) / rec.local_path).resolve()
                        if p_cloned_db.exists() and p_cloned_db.is_dir():
                            return p_cloned_db
    except Exception:
        pass

    raise HTTPException(
        status_code=404,
        detail=f"Repository not found for name='{repo_name}', path='{repo_path}'"
    )


def _format_relative_date(date_str: str) -> str:
    try:
        # Date string typically formatted as "2026-09-17 12:05:28 +0530"
        clean = date_str.split(" +")[0].split(" -")[0].strip()
        dt = datetime.datetime.strptime(clean, "%Y-%m-%d %H:%M:%S")
        now = datetime.datetime.now()
        diff = now - dt

        if diff.days < 0:
            return "Just now"
        elif diff.days == 0:
            hours = diff.seconds // 3600
            minutes = (diff.seconds % 3600) // 60
            if hours > 0:
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif minutes > 0:
                return f"{minutes} min{'s' if minutes > 1 else ''} ago"
            else:
                return "Just now"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 30:
            return f"{diff.days} days ago"
        elif diff.days < 365:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        else:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
    except Exception:
        return date_str.split(" ")[0] if " " in date_str else date_str


def _get_initials(name: str) -> str:
    parts = name.strip().split()
    if not parts:
        return "GH"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[-1][0]}".upper()


# ------------------------------------------------------------------------------
# 1. LIST BRANCHES
# ------------------------------------------------------------------------------

@router.get("/branches")
def list_branches(
    repo_name: Optional[str] = Query(None),
    repo_path: Optional[str] = Query(None),
) -> Dict[str, Any]:
    repo_dir = _resolve_repo(repo_name, repo_path)

    if not (repo_dir / ".git").exists():
        return {
            "success": True,
            "is_git": False,
            "repository": repo_dir.name,
            "current_branch": "main",
            "branches": [{"name": "main", "is_current": True, "is_remote": False}],
            "total_branches": 1,
        }

    # Get current branch
    curr_res = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )
    current_branch = curr_res.stdout.strip() if curr_res.returncode == 0 else "main"

    # Get all branches
    raw_branches = subprocess.run(
        ["git", "branch", "-a", "--sort=-committerdate"],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    ).stdout.splitlines()

    branches: List[Dict[str, Any]] = []
    seen_names = set()

    for line in raw_branches:
        clean = line.strip()
        if not clean or "->" in clean:
            continue

        is_curr = clean.startswith("* ")
        full_name = clean.lstrip("* ").strip()
        is_remote = full_name.startswith("remotes/")
        display_name = full_name.replace("remotes/origin/", "").replace("remotes/", "")

        # Deduplicate remote/local branches with same display name
        if display_name in seen_names and is_remote:
            continue
        seen_names.add(display_name)

        # Get latest commit for branch
        commit_res = subprocess.run(
            ["git", "log", "-1", "--format=%h%x1f%s%x1f%ad", "--date=short", full_name],
            cwd=repo_dir,
            capture_output=True,
            text=True,
        )
        c_hash, c_msg, c_date = "", "", ""
        if commit_res.returncode == 0 and commit_res.stdout.strip():
            c_parts = commit_res.stdout.strip().split("\x1f")
            if len(c_parts) >= 3:
                c_hash, c_msg, c_date = c_parts[0], c_parts[1], c_parts[2]

        branches.append({
            "name": display_name,
            "full_name": full_name,
            "is_current": is_curr or display_name == current_branch,
            "is_remote": is_remote,
            "commit_hash": c_hash,
            "commit_message": c_msg,
            "date": c_date,
        })

    # Sort so current branch is always first, followed by main/master
    def _sort_key(b):
        if b["is_current"]:
            return 0
        if b["name"] in ["main", "master"]:
            return 1
        return 2

    branches.sort(key=_sort_key)

    return {
        "success": True,
        "is_git": True,
        "repository": repo_dir.name,
        "current_branch": current_branch,
        "branches": branches,
        "total_branches": len(branches),
    }


# ------------------------------------------------------------------------------
# 2. LIST COMMITS (GITHUB STYLE)
# ------------------------------------------------------------------------------

@router.get("/commits")
def list_commits(
    repo_name: Optional[str] = Query(None),
    repo_path: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
) -> Dict[str, Any]:
    repo_dir = _resolve_repo(repo_name, repo_path)

    if not (repo_dir / ".git").exists():
        return {
            "success": True,
            "is_git": False,
            "repository": repo_dir.name,
            "current_branch": "main",
            "commits": [],
            "total_commits": 0,
        }

    # Determine branch to query
    target_branch = branch
    if not target_branch:
        curr_res = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
        )
        target_branch = curr_res.stdout.strip() if curr_res.returncode == 0 else "main"

    # Git log format: hash | short_hash | author_name | author_email | date_iso | subject | body
    format_str = "%H%x1f%h%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b%x1e"
    cmd = ["git", "log", "-n", str(limit), f"--pretty=format:{format_str}", "--date=iso", target_branch]
    if search:
        cmd.extend(["--grep", search])

    log_res = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True)
    commits_list: List[Dict[str, Any]] = []

    if log_res.returncode == 0 and log_res.stdout.strip():
        for block in log_res.stdout.split("\x1e"):
            block = block.strip()
            if not block:
                continue
            parts = block.split("\x1f")
            if len(parts) >= 6:
                full_hash = parts[0].strip()
                short_hash = parts[1].strip()
                author_name = parts[2].strip() or "Developer"
                author_email = parts[3].strip()
                date_raw = parts[4].strip()
                subject = parts[5].strip() or "Commit update"
                body = parts[6].strip() if len(parts) > 6 else ""

                # Format human readable date
                try:
                    clean_dt = date_raw.split(" +")[0].split(" -")[0].strip()
                    dt_obj = datetime.datetime.strptime(clean_dt, "%Y-%m-%d %H:%M:%S")
                    date_group = dt_obj.strftime("%b %d, %Y")
                except Exception:
                    date_group = date_raw[:10]

                commits_list.append({
                    "hash": full_hash,
                    "short_hash": short_hash,
                    "author_name": author_name,
                    "author_email": author_email,
                    "author_initials": _get_initials(author_name),
                    "date": date_raw,
                    "date_group": date_group,
                    "date_relative": _format_relative_date(date_raw),
                    "message": subject,
                    "body": body,
                    "verified": True,
                })

    # Get total count of commits in repository branch
    count_res = subprocess.run(
        ["git", "rev-list", "--count", target_branch],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )
    total_count = int(count_res.stdout.strip()) if count_res.returncode == 0 and count_res.stdout.strip().isdigit() else len(commits_list)

    return {
        "success": True,
        "is_git": True,
        "repository": repo_dir.name,
        "current_branch": target_branch,
        "commits": commits_list,
        "total_commits": total_count,
    }


# ------------------------------------------------------------------------------
# 3. GET SINGLE COMMIT DETAILS & DIFF
# ------------------------------------------------------------------------------

@router.get("/commit/{commit_hash}")
def get_commit_details(
    commit_hash: str,
    repo_name: Optional[str] = Query(None),
    repo_path: Optional[str] = Query(None),
) -> Dict[str, Any]:
    repo_dir = _resolve_repo(repo_name, repo_path)

    # Show commit metadata
    info_format = "%H%x1f%h%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b"
    info_res = subprocess.run(
        ["git", "show", "-s", f"--pretty=format:{info_format}", "--date=iso", commit_hash],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )
    if info_res.returncode != 0:
        raise HTTPException(status_code=404, detail=f"Commit '{commit_hash}' not found.")

    parts = info_res.stdout.strip().split("\x1f")
    commit_meta = {
        "hash": parts[0],
        "short_hash": parts[1],
        "author_name": parts[2],
        "author_email": parts[3],
        "author_initials": _get_initials(parts[2]),
        "date": parts[4],
        "date_relative": _format_relative_date(parts[4]),
        "message": parts[5],
        "body": parts[6] if len(parts) > 6 else "",
    }

    # Stat of changed files
    stat_res = subprocess.run(
        ["git", "show", "--stat", "--oneline", commit_hash],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )

    # Full unified diff
    diff_res = subprocess.run(
        ["git", "show", "--patch", commit_hash],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )

    return {
        "success": True,
        "commit": commit_meta,
        "stats": stat_res.stdout.strip(),
        "diff": diff_res.stdout[:50000],  # Truncate at 50KB to keep fast
    }


# ------------------------------------------------------------------------------
# 4. CHECKOUT / SWITCH BRANCH
# ------------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    repository_name: Optional[str] = None
    repository_path: Optional[str] = None
    branch: str


@router.post("/checkout")
def checkout_branch(request: CheckoutRequest) -> Dict[str, Any]:
    repo_dir = _resolve_repo(request.repository_name, request.repository_path)

    clean_branch = request.branch.replace("remotes/origin/", "").replace("remotes/", "").strip()

    res = subprocess.run(
        ["git", "checkout", clean_branch],
        cwd=repo_dir,
        capture_output=True,
        text=True,
    )

    if res.returncode != 0:
        # Try checking out as new tracking branch if it was remote
        res2 = subprocess.run(
            ["git", "checkout", "-b", clean_branch, f"origin/{clean_branch}"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
        )
        if res2.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=res.stderr.strip() or res2.stderr.strip() or "Failed to checkout branch."
            )

    return {
        "success": True,
        "branch": clean_branch,
        "repository": repo_dir.name,
        "message": f"Successfully switched repository to branch '{clean_branch}'."
    }
