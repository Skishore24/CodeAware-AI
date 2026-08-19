from pathlib import Path
from typing import Any, Dict, List, Optional
import os


class RepositoryScanner:
    """
    Scans a cloned repository and collects structural information,
    language distributions, entry points, detected frameworks, and file hierarchy.
    """

    IGNORED_DIRECTORIES = {
        ".git", ".venv", "venv", "env", "node_modules", "__pycache__",
        ".idea", ".vscode", "dist", "build", "coverage", ".pytest_cache",
        ".cache", ".next", ".nuxt", "out", "target", "bin", "obj"
    }

    IGNORED_EXTENSIONS = {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
        ".mp4", ".mov", ".avi", ".mp3", ".wav",
        ".zip", ".tar", ".gz", ".7z", ".rar",
        ".pyc", ".pyd", ".exe", ".dll", ".so", ".dylib", ".class",
        ".lock", ".wasm", ".bin", ".env", ".env.local"
    }

    LANGUAGE_EXTENSIONS = {
        ".py": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".java": "Java",
        ".c": "C",
        ".cpp": "C++",
        ".cc": "C++",
        ".h": "C/C++",
        ".hpp": "C++",
        ".go": "Go",
        ".rs": "Rust",
        ".php": "PHP",
        ".rb": "Ruby",
        ".cs": "C#",
        ".swift": "Swift",
        ".kt": "Kotlin",
        ".sql": "SQL",
        ".html": "HTML",
        ".css": "CSS",
        ".scss": "SCSS",
        ".json": "JSON",
        ".yaml": "YAML",
        ".yml": "YAML",
        ".xml": "XML",
        ".md": "Markdown",
        ".sh": "Shell",
        ".bat": "Batch",
        ".ps1": "PowerShell"
    }

    IMPORTANT_FILES = {
        "README.md", "README.txt", "README", "requirements.txt",
        "pyproject.toml", "setup.py", "package.json", "package-lock.json",
        "tsconfig.json", "go.mod", "pom.xml", "build.gradle", "Cargo.toml",
        "Dockerfile", "docker-compose.yml", "Makefile"
    }

    def __init__(self, repository_path: Path):
        self.repository_path = Path(repository_path)

    def scan(self) -> Dict[str, Any]:
        if not self.repository_path.exists():
            return {
                "success": False,
                "error": f"Repository path does not exist: {self.repository_path}"
            }

        files_list: List[Dict[str, Any]] = []
        languages: Dict[str, int] = {}
        total_size_bytes = 0
        total_lines = 0
        detected_frameworks = set()
        entry_points = []

        for root, dirs, files in os.walk(self.repository_path):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in self.IGNORED_DIRECTORIES]

            for file in files:
                file_path = Path(root) / file
                ext = file_path.suffix.lower()

                if ext in self.IGNORED_EXTENSIONS:
                    continue

                try:
                    rel_path = str(file_path.relative_to(self.repository_path)).replace("\\", "/")
                    size = file_path.stat().st_size
                    total_size_bytes += size

                    lang = self.LANGUAGE_EXTENSIONS.get(ext, "Other")
                    languages[lang] = languages.get(lang, 0) + 1

                    # Count lines for text code files
                    file_lines = 0
                    if size < 2 * 1024 * 1024:  # Under 2MB
                        try:
                            content = file_path.read_text(encoding="utf-8", errors="ignore")
                            file_lines = len(content.splitlines())
                            total_lines += file_lines

                            # Detect frameworks from configuration files / imports
                            if file == "package.json":
                                if "react" in content: detected_frameworks.add("React")
                                if "vue" in content: detected_frameworks.add("Vue")
                                if "next" in content: detected_frameworks.add("Next.js")
                                if "express" in content: detected_frameworks.add("Express")
                                if "vite" in content: detected_frameworks.add("Vite")
                            elif file in ("requirements.txt", "pyproject.toml", "setup.py"):
                                if "fastapi" in content.lower(): detected_frameworks.add("FastAPI")
                                if "django" in content.lower(): detected_frameworks.add("Django")
                                if "flask" in content.lower(): detected_frameworks.add("Flask")
                                if "torch" in content.lower() or "pytorch" in content.lower(): detected_frameworks.add("PyTorch")
                                if "scikit-learn" in content.lower(): detected_frameworks.add("Scikit-Learn")
                            elif file == "go.mod":
                                if "gin-gonic" in content: detected_frameworks.add("Gin")
                                if "fiber" in content: detected_frameworks.add("Fiber")
                        except Exception:
                            pass

                    # Identify entry points
                    if file in ("main.py", "app.py", "index.js", "index.ts", "main.go", "App.jsx", "App.tsx", "server.js"):
                        entry_points.append(rel_path)

                    files_list.append({
                        "path": rel_path,
                        "name": file,
                        "extension": ext,
                        "language": lang,
                        "size_bytes": size,
                        "lines": file_lines,
                        "is_important": file in self.IMPORTANT_FILES
                    })

                except Exception:
                    continue

        # Sort languages by count
        sorted_languages = sorted(languages.items(), key=lambda item: item[1], reverse=True)
        primary_language = sorted_languages[0][0] if sorted_languages else "Unknown"

        return {
            "success": True,
            "repository": self.repository_path.name,
            "path": str(self.repository_path),
            "total_files": len(files_list),
            "total_lines": total_lines,
            "total_size_bytes": total_size_bytes,
            "primary_language": primary_language,
            "languages": {k: v for k, v in sorted_languages},
            "frameworks": sorted(list(detected_frameworks)),
            "entry_points": entry_points,
            "files": files_list[:2000],  # Return up to 2000 files
            "important_files": [f for f in files_list if f["is_important"]],
        }