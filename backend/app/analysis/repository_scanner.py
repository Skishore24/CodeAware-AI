from pathlib import Path
from collections import Counter


class RepositoryScanner:
    """
    Scans a cloned repository and collects
    basic repository information.
    """

    # ---------------------------------------------------------
    # Files that should NOT be analyzed
    # ---------------------------------------------------------

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
        ".next",
        ".cache",
    }

    # ---------------------------------------------------------
    # File extension → language
    # ---------------------------------------------------------

    LANGUAGE_MAP = {
        ".py": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".java": "Java",
        ".cpp": "C++",
        ".cc": "C++",
        ".c": "C",
        ".h": "C/C++",
        ".cs": "C#",
        ".go": "Go",
        ".rs": "Rust",
        ".php": "PHP",
        ".rb": "Ruby",
        ".swift": "Swift",
        ".kt": "Kotlin",
        ".html": "HTML",
        ".css": "CSS",
        ".scss": "SCSS",
        ".json": "JSON",
        ".xml": "XML",
        ".yaml": "YAML",
        ".yml": "YAML",
        ".sql": "SQL",
        ".md": "Markdown",
        ".sh": "Shell",
        ".bat": "Batch",
    }

    # ---------------------------------------------------------
    # Constructor
    # ---------------------------------------------------------

    def __init__(self, repository_path: Path):
        self.repository_path = Path(repository_path)

    # ---------------------------------------------------------
    # Check whether directory should be ignored
    # ---------------------------------------------------------

    def should_ignore(self, path: Path) -> bool:

        return any(
            part in self.IGNORED_DIRECTORIES
            for part in path.parts
        )

    # ---------------------------------------------------------
    # Get all repository files
    # ---------------------------------------------------------

    def get_files(self):

        files = []

        for path in self.repository_path.rglob("*"):

            if not path.is_file():
                continue

            if self.should_ignore(path):
                continue

            files.append(path)

        return files

    # ---------------------------------------------------------
    # Detect language
    # ---------------------------------------------------------

    def detect_language(self, file_path: Path):

        extension = file_path.suffix.lower()

        return self.LANGUAGE_MAP.get(
            extension,
            "Other"
        )

    # ---------------------------------------------------------
    # Count lines
    # ---------------------------------------------------------

    def count_lines(self, file_path: Path):

        try:

            with open(
                file_path,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                return sum(
                    1 for _ in file
                )

        except Exception:

            return 0

    # ---------------------------------------------------------
    # Detect important files
    # ---------------------------------------------------------

    def detect_project_files(self, files):

        file_names = {
            file.name.lower()
            for file in files
        }

        return {

            "has_readme": any(
                name.startswith("readme")
                for name in file_names
            ),

            "has_requirements": (
                "requirements.txt" in file_names
            ),

            "has_package_json": (
                "package.json" in file_names
            ),

            "has_dockerfile": (
                "dockerfile" in file_names
            ),

            "has_gitignore": (
                ".gitignore" in file_names
            ),

            "has_env_file": (
                ".env" in file_names
            ),
        }

    # ---------------------------------------------------------
    # Main scanner
    # ---------------------------------------------------------

    def scan(self):

        if not self.repository_path.exists():

            raise FileNotFoundError(
                f"Repository does not exist: "
                f"{self.repository_path}"
            )

        files = self.get_files()

        language_counter = Counter()

        total_lines = 0

        file_details = []

        for file_path in files:

            language = self.detect_language(
                file_path
            )

            lines = self.count_lines(
                file_path
            )

            language_counter[language] += 1

            total_lines += lines

            relative_path = file_path.relative_to(
                self.repository_path
            )

            file_details.append({

                "path": str(relative_path),

                "name": file_path.name,

                "extension": file_path.suffix,

                "language": language,

                "lines": lines,

            })

        project_files = self.detect_project_files(
            files
        )

        return {

            "repository_name": (
                self.repository_path.name
            ),

            "repository_path": str(
                self.repository_path
            ),

            "total_files": len(files),

            "total_lines": total_lines,

            "languages": dict(
                language_counter
            ),

            "project_files": project_files,

            "files": file_details,

        }