import json
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.llm.router import llm_router

logger = logging.getLogger("app.ai.planner")


class PlannedTask(BaseModel):
    step_id: int
    agent_name: str
    description: str
    action_type: str
    depends_on: List[int] = []
    input_params: Dict[str, Any] = {}


class ExecutionPlan(BaseModel):
    objective: str
    requires_multi_agent: bool = True
    tasks: List[PlannedTask]
    estimated_duration_sec: int = 15


class PlannerAgent:
    """
    Task Planner Agent for CodeAware AI (Section 13).
    Analyzes developer queries and decomposes them into an ordered, dependency-aware
    graph of specialist agent tasks.
    """

    def plan(self, objective: str, repository_name: Optional[str] = None, repository_path: Optional[str] = None) -> ExecutionPlan:
        obj_lower = objective.lower()

        # 1. Check for compound tasks requiring collaboration
        # Example: "Find why login is failing", "Fix bug in auth and add tests"
        if any(kw in obj_lower for kw in ["failing", "broken", "bug and test", "audit and fix", "investigate", "why is", "review and fix"]):
            return ExecutionPlan(
                objective=objective,
                requires_multi_agent=True,
                tasks=[
                    PlannedTask(
                        step_id=1,
                        agent_name="SearchAgent",
                        description=f"Locate files, functions, and symbols related to: '{objective}'",
                        action_type="search",
                        input_params={"query": objective, "repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=2,
                        agent_name="CodeAnalysisAgent",
                        description="Inspect AST structures, parameters, and callers in identified files",
                        action_type="ast_analysis",
                        depends_on=[1],
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=3,
                        agent_name="BugAgent",
                        description="Check for syntax errors, unhandled exceptions, and runtime flaws",
                        action_type="bug_check",
                        depends_on=[2],
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=4,
                        agent_name="SecurityAgent",
                        description="Audit authentication and input validation against OWASP rules",
                        action_type="security_audit",
                        depends_on=[2],
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=5,
                        agent_name="FixAgent",
                        description="Propose targeted patch and generate side-by-side unified diff",
                        action_type="patch_synthesis",
                        depends_on=[3, 4],
                        input_params={"problem": objective, "repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=6,
                        agent_name="ValidationAgent",
                        description="Validate proposed patch in isolated sandbox and verify syntax",
                        action_type="validation",
                        depends_on=[5],
                        input_params={"repository_path": repository_path},
                    ),
                ],
            )

        # 2. Security Audit plan
        if "security" in obj_lower or "vulnerability" in obj_lower or "owasp" in obj_lower:
            return ExecutionPlan(
                objective=objective,
                requires_multi_agent=True,
                tasks=[
                    PlannedTask(
                        step_id=1,
                        agent_name="SecurityAgent",
                        description="Scan repository for static OWASP vulnerabilities and secrets",
                        action_type="security_scan",
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=2,
                        agent_name="ImpactAgent",
                        description="Assess blast radius and callers of vulnerable functions",
                        action_type="impact_analysis",
                        depends_on=[1],
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=3,
                        agent_name="FixAgent",
                        description="Generate remediations for discovered vulnerabilities",
                        action_type="patch_synthesis",
                        depends_on=[1],
                        input_params={"repository_path": repository_path},
                    ),
                ],
            )

        # 3. Test generation plan
        if "test" in obj_lower or "coverage" in obj_lower or "pytest" in obj_lower:
            return ExecutionPlan(
                objective=objective,
                requires_multi_agent=True,
                tasks=[
                    PlannedTask(
                        step_id=1,
                        agent_name="CodeAnalysisAgent",
                        description="Identify function signatures, parameters, and returns for test targets",
                        action_type="ast_analysis",
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=2,
                        agent_name="TestAgent",
                        description="Synthesize isolated pytest/unittest suites with mocks and assertions",
                        action_type="test_synthesis",
                        depends_on=[1],
                        input_params={"repository_path": repository_path},
                    ),
                    PlannedTask(
                        step_id=3,
                        agent_name="ValidationAgent",
                        description="Execute generated tests inside isolated sandbox runner",
                        action_type="test_run",
                        depends_on=[2],
                        input_params={"repository_path": repository_path},
                    ),
                ],
            )

        # Default single-specialist plan
        return ExecutionPlan(
            objective=objective,
            requires_multi_agent=False,
            tasks=[
                PlannedTask(
                    step_id=1,
                    agent_name="RAGAgent",
                    description="Retrieve relevant code snippets and synthesize answer with citations",
                    action_type="rag_retrieve",
                    input_params={"query": objective, "repository_path": repository_path},
                )
            ],
        )
