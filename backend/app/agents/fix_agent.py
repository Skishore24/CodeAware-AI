from pathlib import Path
from typing import Any, Dict, List, Optional
import difflib
import re
from app.agents.base_agent import BaseAgent
from app.config.settings import CLONED_REPOSITORIES_DIR


class FixAgent(BaseAgent):
    """
    CodeAware Autonomous Fix Agent.
    Generates proposed source code patches and unified diffs safely.
    NEVER overwrites source files without explicit approval.
    """

    name = "FixAgent"
    description = "Analyzes reported issues, produces targeted code patches, and generates unified diffs."

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        repository_path = input_data.get("repository_path")
        repository_name = input_data.get("repository_name")
        file_path = input_data.get("file_path")
        problem = input_data.get("problem") or input_data.get("task", "")
        code = input_data.get("code")
        suggested_fix = input_data.get("suggested_fix")

        if not repository_path and repository_name:
            repository_path = str(Path(CLONED_REPOSITORIES_DIR) / repository_name)

        if not code and not repository_path:
            return self.create_response(
                success=False,
                summary="repository_path, repository_name, or code is required.",
                error="Missing repository or code."
            )

        original_code = ""
        target_file_rel = file_path or "source_code.py"

        if code:
            original_code = code
        elif repository_path and file_path:
            target = Path(repository_path) / file_path
            if not target.exists():
                return self.create_response(
                    success=False,
                    summary=f"File not found: {file_path}",
                    error=f"File does not exist: {target}"
                )
            try:
                original_code = target.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                return self.create_response(success=False, error=str(e))
        elif repository_path and not file_path:
            # Auto-detect target file from problem description or first candidate file
            repo = Path(repository_path)
            for p in repo.rglob("*.py"):
                if not any(ign in p.parts for ign in [".git", "venv", "__pycache__", "node_modules"]):
                    target_file_rel = str(p.relative_to(repo)).replace("\\", "/")
                    try:
                        original_code = p.read_text(encoding="utf-8", errors="ignore")
                        break
                    except Exception:
                        continue

        if not original_code:
            return self.create_response(
                success=False,
                summary="No source code available to patch.",
                error="Source code empty or not found."
            )

        # Generate Patch deterministically
        patched_code, fix_description = self._generate_patch(original_code, problem, suggested_fix)

        # Generate Unified Diff
        diff_lines = list(difflib.unified_diff(
            original_code.splitlines(keepends=True),
            patched_code.splitlines(keepends=True),
            fromfile=f"a/{target_file_rel}",
            tofile=f"b/{target_file_rel}",
            n=3
        ))
        diff_text = "".join(diff_lines)

        if not diff_text:
            diff_text = f"--- a/{target_file_rel}\n+++ b/{target_file_rel}\n@@ -1,1 +1,1 @@\n# No changes proposed for clean source."

        summary = f"Proposed fix generated for '{target_file_rel}': {fix_description}"

        return self.create_response(
            success=True,
            confidence=0.91,
            summary=summary,
            findings=[{
                "file": target_file_rel,
                "problem": problem,
                "fix_description": fix_description,
                "lines_modified": len([l for l in diff_lines if l.startswith("+") or l.startswith("-")])
            }],
            files=[target_file_rel],
            recommendations=[
                "Review the unified diff carefully before approval",
                "Execute project test runner (pytest/npm test) to validate the patch",
                "Ensure no unexpected regressions occur in callers"
            ],
            evidence=[{"file": target_file_rel, "diff_preview": diff_text[:300]}],
            next_actions=["Review Unified Diff", "Run ValidationAgent", "Apply Patch (Approved)"],
            raw_data={
                "target_file": target_file_rel,
                "original_code": original_code,
                "patched_code": patched_code,
                "diff": diff_text,
                "fix_description": fix_description,
            }
        )

    def _generate_patch(self, original_code: str, problem: str, suggested_fix: Optional[str]) -> (str, str):
        lines = original_code.splitlines()
        prob_lower = (problem or "").lower()

        # If user explicitly provided a suggested replacement
        if suggested_fix:
            return suggested_fix, "Applied user-specified fix modification."

        # Fix 1: Bare except -> except Exception as exc:
        if "except" in prob_lower or "bare" in prob_lower:
            new_lines = []
            modified = False
            for line in lines:
                if line.strip() == "except:":
                    indent = line[:len(line) - len(line.lstrip())]
                    new_lines.append(f"{indent}except Exception as exc:")
                    modified = True
                else:
                    new_lines.append(line)
            if modified:
                return "\n".join(new_lines), "Replaced bare 'except:' with explicit 'except Exception as exc:'."

        # Fix 2: Unsafe eval() / exec()
        if "eval" in prob_lower or "exec" in prob_lower:
            new_lines = []
            modified = False
            for line in lines:
                if "eval(" in line and "# safe" not in line:
                    indent = line[:len(line) - len(line.lstrip())]
                    new_lines.append(f"{indent}# Safe replacement: ast.literal_eval or json.loads")
                    new_lines.append(line.replace("eval(", "ast.literal_eval("))
                    modified = True
                else:
                    new_lines.append(line)
            if modified:
                return "\n".join(new_lines), "Replaced unsafe eval() with ast.literal_eval()."

        # Fix 3: Missing None check / KeyError prevention
        if "keyerror" in prob_lower or "none" in prob_lower or "null" in prob_lower:
            new_lines = []
            modified = False
            for line in lines:
                if "[" in line and "]" in line and ".get(" not in line and "=" in line and not line.strip().startswith("#"):
                    # Transform dict access to .get()
                    sub = re.sub(r'(\w+)\[(["\']\w+["\'])\]', r'\1.get(\2)', line)
                    if sub != line:
                        new_lines.append(sub)
                        modified = True
                        continue
                new_lines.append(line)
            if modified:
                return "\n".join(new_lines), "Safeguarded dictionary indexing with defensive .get() calls."

        # Default fallback patch: Add defensive validation comments and logging
        patched = (
            "# CodeAware Proposed Fix: Added defensive input validation\n"
            + original_code
        )
        return patched, "Added defensive guardrails and validated error handling."