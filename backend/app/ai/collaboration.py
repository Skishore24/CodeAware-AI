import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.ai.planner import PlannerAgent, ExecutionPlan, PlannedTask
from app.agents.repository_agent import RepositoryAgent
from app.agents.search_agent import SearchAgent
from app.agents.rag_agent import RAGAgent
from app.agents.code_agent import CodeAgent
from app.agents.bug_agent import BugAgent
from app.agents.security_agent import SecurityAgent
from app.agents.impact_agent import ImpactAgent
from app.agents.test_agent import TestAgent
from app.agents.fix_agent import FixAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.dependency_agent import DependencyAgent
from app.agents.database_agent import DatabaseAgent
from app.agents.api_agent import APIAgent
from app.services.rag_service import RAGService
from app.services.graph_service import GraphService
from app.llm.router import llm_router


class SharedTaskState(BaseModel):
    """Structured shared memory across cooperating specialist agents."""
    objective: str
    repository_path: Optional[str] = None
    evidence_files: List[str] = Field(default_factory=list)
    findings: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    patches: List[Dict[str, Any]] = Field(default_factory=list)
    validation_status: str = "PENDING"
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    agent_outputs: Dict[str, Any] = Field(default_factory=dict)


class MultiAgentEngine:
    """
    Multi-Agent Collaboration Engine (Section 13).
    Coordinates Planner -> Specialist Execution -> Evidence Aggregation -> Critic -> Validation.
    """

    def __init__(self):
        self.planner = PlannerAgent()
        self.rag_service = RAGService()
        self.graph_service = GraphService()

        # Agents map
        self.agents = {
            "RepositoryAgent": RepositoryAgent(),
            "SearchAgent": SearchAgent(rag_service=self.rag_service),
            "RAGAgent": RAGAgent(rag_service=self.rag_service),
            "CodeAnalysisAgent": CodeAgent(),
            "CodeAgent": CodeAgent(),
            "BugAgent": BugAgent(),
            "SecurityAgent": SecurityAgent(),
            "ImpactAgent": ImpactAgent(graph_service=self.graph_service),
            "TestAgent": TestAgent(),
            "FixAgent": FixAgent(),
            "ValidationAgent": ValidationAgent(),
            "DependencyAgent": DependencyAgent(),
            "DatabaseAgent": DatabaseAgent(),
            "APIAgent": APIAgent(),
        }

    def execute_collaborative_workflow(
        self,
        task: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        input_data = input_data or {}
        repo_path = input_data.get("repository_path")
        repo_name = input_data.get("repository_name")

        # 1. Planner decomposes the objective
        plan: ExecutionPlan = self.planner.plan(task, repository_name=repo_name, repository_path=repo_path)

        state = SharedTaskState(
            objective=task,
            repository_path=repo_path,
        )

        state.timeline.append({
            "step": "Task Planning",
            "status": "COMPLETED",
            "message": f"Decomposed into {len(plan.tasks)} cooperative agent steps.",
            "duration_ms": round((time.time() - start_time) * 1000, 2),
        })

        # 2. Sequential execution of planned specialist tasks with shared state
        for t in plan.tasks:
            agent = self.agents.get(t.agent_name)
            if not agent:
                continue

            step_start = time.time()
            step_input = {
                **input_data,
                **t.input_params,
                "task": t.description,
                "objective": task,
                "evidence_files": state.evidence_files,
                "findings": state.findings,
            }

            try:
                result = agent.run(step_input)
                state.agent_outputs[t.agent_name] = result

                # Aggregate evidence and findings into shared state
                if result.get("files"):
                    for f in result["files"]:
                        if f not in state.evidence_files:
                            state.evidence_files.append(f)

                if result.get("findings"):
                    state.findings.extend(result["findings"])

                if result.get("recommendations"):
                    for r in result["recommendations"]:
                        if r not in state.recommendations:
                            state.recommendations.append(r)

                # If FixAgent generated patch data, track it
                if t.agent_name == "FixAgent" and result.get("raw_data", {}).get("diff"):
                    state.patches.append(result["raw_data"])

                # If ValidationAgent executed, update validation status
                if t.agent_name == "ValidationAgent":
                    state.validation_status = "PASSED" if result.get("success") else "FAILED"

                state.timeline.append({
                    "step": f"Step {t.step_id}: {t.agent_name}",
                    "status": "COMPLETED" if result.get("success") else "WARNING",
                    "message": result.get("summary", ""),
                    "duration_ms": round((time.time() - step_start) * 1000, 2),
                })
            except Exception as exc:
                state.timeline.append({
                    "step": f"Step {t.step_id}: {t.agent_name}",
                    "status": "FAILED",
                    "message": str(exc),
                    "duration_ms": round((time.time() - step_start) * 1000, 2),
                })

        # 3. Evidence Aggregation & Synthesis
        total_duration = round(time.time() - start_time, 2)
        summary = (
            f"Multi-agent collaboration resolved objective across {len(plan.tasks)} agent tasks. "
            f"Inspected {len(state.evidence_files)} source files and collected {len(state.findings)} findings."
        )

        return {
            "success": True,
            "objective": task,
            "plan": plan.model_dump(),
            "summary": summary,
            "validation_status": state.validation_status,
            "evidence_files": state.evidence_files,
            "findings": state.findings,
            "recommendations": state.recommendations[:8],
            "patches": state.patches,
            "timeline": state.timeline,
            "agent_outputs": state.agent_outputs,
            "duration_sec": total_duration,
        }


multi_agent_engine = MultiAgentEngine()
