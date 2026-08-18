from typing import Any, Dict, Optional
import os


class PRAgent:
    """
    GitHub Pull Request Agent.

    Responsibilities:
    - Validate GitHub repository information.
    - Create a pull request after human approval.
    - Generate a useful PR title and body.
    - Return the created PR information.

    IMPORTANT:
    This agent only creates a PR when explicitly requested.
    """

    name = "PR Agent"

    description = (
        "Creates GitHub pull requests for "
        "human-approved CodeAware fixes."
    )

    # =========================================================
    # MAIN
    # =========================================================

    def run(
        self,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        owner = input_data.get(
            "owner"
        )

        repo_name = input_data.get(
            "repo_name"
        )

        head_branch = input_data.get(
            "head_branch"
        )

        base_branch = input_data.get(
            "base_branch",
            "main"
        )

        title = input_data.get(
            "title"
        )

        body = input_data.get(
            "body"
        )

        approved = input_data.get(
            "approved",
            False
        )

        token = input_data.get(
            "github_token"
        )

        # -----------------------------------------------------
        # Token
        # -----------------------------------------------------

        if not token:

            token = os.getenv(
                "GITHUB_TOKEN"
            )

        # -----------------------------------------------------
        # Human approval
        # -----------------------------------------------------

        if not approved:

            return {
                "success": False,
                "agent": self.name,
                "status": "WAITING_FOR_APPROVAL",
                "message": (
                    "Human approval is required "
                    "before creating a pull request."
                )
            }

        # -----------------------------------------------------
        # Required fields
        # -----------------------------------------------------

        missing = []

        if not owner:
            missing.append("owner")

        if not repo_name:
            missing.append("repo_name")

        if not head_branch:
            missing.append("head_branch")

        if not base_branch:
            missing.append("base_branch")

        if not token:
            missing.append("github_token")

        if missing:

            return {
                "success": False,
                "agent": self.name,
                "status": "INVALID_INPUT",
                "missing": missing,
                "message": (
                    "Required PR information is missing."
                )
            }

        # -----------------------------------------------------
        # Default PR title
        # -----------------------------------------------------

        if not title:

            title = (
                "CodeAware AI: Apply validated fix"
            )

        # -----------------------------------------------------
        # Default PR body
        # -----------------------------------------------------

        if not body:

            body = self._build_default_body(
                input_data
            )

        # -----------------------------------------------------
        # Create PR
        # -----------------------------------------------------

        try:

            from github import Github

            github = Github(
                token
            )

            repository = github.get_repo(
                f"{owner}/{repo_name}"
            )

            pull_request = (
                repository.create_pull(
                    title=title,
                    body=body,
                    head=head_branch,
                    base=base_branch
                )
            )

            return {
                "success": True,
                "agent": self.name,
                "status": "CREATED",
                "pull_request": {
                    "number": (
                        pull_request.number
                    ),
                    "title": (
                        pull_request.title
                    ),
                    "url": (
                        pull_request.html_url
                    ),
                    "state": (
                        pull_request.state
                    ),
                    "head": (
                        head_branch
                    ),
                    "base": (
                        base_branch
                    )
                },
                "message": (
                    "Pull request created successfully."
                )
            }

        except Exception as exc:

            return {
                "success": False,
                "agent": self.name,
                "status": "FAILED",
                "error": str(exc),
                "message": (
                    "GitHub pull request creation failed."
                )
            }

    # =========================================================
    # DEFAULT BODY
    # =========================================================

    def _build_default_body(
        self,
        input_data: Dict[str, Any]
    ) -> str:

        problem = input_data.get(
            "problem",
            "Code issue identified by CodeAware AI."
        )

        validation_status = input_data.get(
            "validation_status",
            "Passed"
        )

        files_changed = input_data.get(
            "files_changed",
            []
        )

        if isinstance(
            files_changed,
            list
        ):

            files_text = "\n".join(
                f"- `{file}`"
                for file in files_changed
            )

        else:

            files_text = (
                "- Not specified"
            )

        return f"""## CodeAware AI Fix

### Problem

{problem}

### Validation

**Status:** {validation_status}

### Files Changed

{files_text}

### Workflow

```text
Repository Analysis
        ↓
Bug Detection
        ↓
Fix Generation
        ↓
Test Generation
        ↓
Validation
        ↓
Human Approval
        ↓
Pull Request
```"""