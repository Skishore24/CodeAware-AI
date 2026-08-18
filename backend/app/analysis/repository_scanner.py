from pathlib import Path
from typing import Any, Dict, List


class RepositoryScanner:
    """
    Scans a cloned repository and collects
    structural information.
    """

    # =====================================================
    # FILES WE DON'T WANT TO ANALYZE
    # =====================================================

    IGNORED_DIRECTORIES = {
        ".git",
        ".venv",
        "venv",
        "env",
        "node_modules",
        "__pycache__",
        ".idea",
        ".vscode",
        "dist",
        "build",
        "coverage",
        ".pytest_cache",
    }

    # =====================================================
    # EXTENSIONS
    # =====================================================

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

    }

    # =====================================================
    # IMPORTANT FILES
    # =====================================================

    IMPORTANT_FILES = {
        "README.md",
        "README.txt",
        "README",
        "requirements.txt",
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pyproject.toml",
        "setup.py",
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".env.example",
        ".gitignore",
    }

    # =====================================================
    # INITIALIZE
    # =====================================================

    def __init__(
        self,
        repository_path: Path
    ):

        self.repository_path = Path(
            repository_path
        )

    # =====================================================
    # PUBLIC SCAN METHOD
    # =====================================================

    def scan(self) -> Dict[str, Any]:

        # -------------------------------------------------
        # Validate repository
        # -------------------------------------------------

        if not self.repository_path.exists():

            raise FileNotFoundError(
                f"Repository does not exist: "
                f"{self.repository_path}"
            )

        if not self.repository_path.is_dir():

            raise ValueError(
                "Repository path is not a directory."
            )

        # -------------------------------------------------
        # Collect files
        # -------------------------------------------------

        files: List[Dict[str, Any]] = []

        language_counts: Dict[str, int] = {}

        total_size = 0

        for file_path in self._iter_files():

            relative_path = (
                file_path.relative_to(
                    self.repository_path
                )
            )

            extension = (
                file_path.suffix.lower()
            )

            language = (
                self.LANGUAGE_EXTENSIONS.get(
                    extension,
                    "Unknown"
                )
            )

            try:

                size = (
                    file_path.stat().st_size
                )

            except OSError:

                size = 0

            total_size += size

            language_counts[language] = (
                language_counts.get(
                    language,
                    0
                ) + 1
            )

            files.append(
                {
                    "path": str(
                        relative_path
                    ),
                    "name": file_path.name,
                    "extension": extension,
                    "language": language,
                    "size_bytes": size,
                }
            )

        # -------------------------------------------------
        # Important files
        # -------------------------------------------------

        important_files = []

        for file in files:

            if file["name"] in (
                self.IMPORTANT_FILES
            ):

                important_files.append(
                    file["path"]
                )

        # -------------------------------------------------
        # Directories
        # -------------------------------------------------

        directories = []

        for directory in self._iter_directories():

            relative_path = (
                directory.relative_to(
                    self.repository_path
                )
            )

            directories.append(
                str(relative_path)
            )

        # -------------------------------------------------
        # Detect project type
        # -------------------------------------------------

        project_types = (
            self._detect_project_types(
                files
            )
        )

        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        return {

            "success": True,

            "repository": (
                self.repository_path.name
            ),

            "repository_path": str(
                self.repository_path
            ),

            "summary": {

                "total_files": len(
                    files
                ),

                "total_directories": len(
                    directories
                ),

                "total_size_bytes": (
                    total_size
                ),

                "languages": (
                    language_counts
                ),

            },

            "project_types": (
                project_types
            ),

            "important_files": (
                important_files
            ),

            "directories": (
                directories
            ),

            "files": files,

        }

    # =====================================================
    # FILE ITERATOR
    # =====================================================

    def _iter_files(self):

        for path in self.repository_path.rglob("*"):

            if not path.is_file():
                continue

            if self._is_ignored(path):
                continue

            yield path

    # =====================================================
    # DIRECTORY ITERATOR
    # =====================================================

    def _iter_directories(self):

        for path in self.repository_path.rglob("*"):

            if not path.is_dir():
                continue

            if self._is_ignored(path):
                continue

            yield path

    # =====================================================
    # IGNORE CHECK
    # =====================================================

    def _is_ignored(
        self,
        path: Path
    ) -> bool:

        try:

            relative = (
                path.relative_to(
                    self.repository_path
                )
            )

        except ValueError:

            return True

        for part in relative.parts:

            if part in self.IGNORED_DIRECTORIES:

                return True

        return False

    # =====================================================
    # PROJECT TYPE DETECTION
    # =====================================================

    def _detect_project_types(
        self,
        files: List[Dict[str, Any]]
    ) -> List[str]:

        names = {
            file["name"]
            for file in files
        }

        extensions = {
            file["extension"]
            for file in files
        }

        project_types = []

        # -------------------------------------------------
        # Python
        # -------------------------------------------------

        if (
            "requirements.txt" in names
            or "pyproject.toml" in names
            or ".py" in extensions
        ):

            project_types.append(
                "Python"
            )

        # -------------------------------------------------
        # Node / React
        # -------------------------------------------------

        if "package.json" in names:

            project_types.append(
                "Node.js"
            )

        if (
            ".jsx" in extensions
            or ".tsx" in extensions
        ):

            project_types.append(
                "React"
            )

        # -------------------------------------------------
        # Java
        # -------------------------------------------------

        if ".java" in extensions:

            project_types.append(
                "Java"
            )

        # -------------------------------------------------
        # Go
        # -------------------------------------------------

        if ".go" in extensions:

            project_types.append(
                "Go"
            )

        # -------------------------------------------------
        # Rust
        # -------------------------------------------------

        if ".rs" in extensions:

            project_types.append(
                "Rust"
            )

        # -------------------------------------------------
        # Docker
        # -------------------------------------------------

        if (
            "Dockerfile" in names
            or "docker-compose.yml" in names
            or "docker-compose.yaml" in names
        ):

            project_types.append(
                "Docker"
            )

        return sorted(
            set(project_types)
        )