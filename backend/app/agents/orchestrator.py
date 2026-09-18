import time
from typing import Any, Dict, List, Optional

from app.agents.repository_agent import RepositoryAgent
from app.agents.search_agent import SearchAgent
from app.agents.rag_agent import RAGAgent
from app.agents.code_agent import CodeAgent
from app.agents.bug_agent import BugAgent
from app.agents.security_agent import SecurityAgent
from app.agents.impact_agent import ImpactAgent
from app.agents.test_agent import TestAgent
from app.agents.fix_agent import FixAgent
from app.agents.documentation_agent import DocumentationAgent
from app.agents.architecture_agent import ArchitectureAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.code_review_agent import CodeReviewAgent
from app.agents.git_agent import GitAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.dependency_agent import DependencyAgent
from app.agents.refactor_agent import RefactorAgent
from app.agents.database_agent import DatabaseAgent
from app.agents.api_agent import APIAgent
from app.agents.frontend_agent import FrontendAgent
from app.agents.devops_agent import DevOpsAgent

from app.ai.collaboration import multi_agent_engine
from app.deep_agent.agent import DeepAgent
from app.ml.intent_classifier import IntentClassifier
from app.services.rag_service import RAGService
from app.services.graph_service import GraphService


class CodeAwareOrchestrator:
    """
    Central Multi-Agent Orchestrator, Task Planner and Router for CodeAware AI.
    Routes queries between quick specialist agents, multi-agent collaboration, and DeepAgent.
    """

    def __init__(self):
        # Shared core services
        self.rag_service = RAGService()
        self.graph_service = GraphService()

        # Specialist Agents (All 21 Standardized Agents)
        self.repository_agent = RepositoryAgent()
        self.search_agent = SearchAgent(rag_service=self.rag_service)
        self.rag_agent = RAGAgent(rag_service=self.rag_service)
        self.code_agent = CodeAgent()
        self.bug_agent = BugAgent()
        self.security_agent = SecurityAgent()
        self.impact_agent = ImpactAgent(graph_service=self.graph_service)
        self.test_agent = TestAgent()
        self.fix_agent = FixAgent()
        self.documentation_agent = DocumentationAgent()
        self.architecture_agent = ArchitectureAgent()
        self.performance_agent = PerformanceAgent()
        self.code_review_agent = CodeReviewAgent()
        self.git_agent = GitAgent()
        self.validation_agent = ValidationAgent()
        self.dependency_agent = DependencyAgent()
        self.refactor_agent = RefactorAgent()
        self.database_agent = DatabaseAgent()
        self.api_agent = APIAgent()
        self.frontend_agent = FrontendAgent()
        self.devops_agent = DevOpsAgent()

        # Intent Classifier
        self.intent_classifier = IntentClassifier()

        # Deep Agent
        self.deep_agent = DeepAgent()

    def run(self, task: str, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute an autonomous task or query across the multi-agent system.
        """
        start_time = time.time()
        input_data = input_data or {}

        if not task or not task.strip():
            return {
                "success": False,
                "intent": None,
                "summary": "Task query is required.",
                "timeline": [{"step": "Validation", "status": "FAILED", "message": "Empty task query provided."}]
            }

        # Check if caller explicitly requested DeepAgent
        if input_data.get("mode") == "deep_agent" or any(kw in task.lower() for kw in ["long-horizon", "deep analysis", "deep fix", "autonomous loop"]):
            deep_res = self.deep_agent.run(
                goal=task,
                repository_path=input_data.get("repository_path"),
                max_iterations=input_data.get("max_iterations", 6),
            )
            return {
                "success": deep_res.get("success", False),
                "intent": "deep_agent",
                "summary": deep_res.get("final_report", "DeepAgent execution complete."),
                "deep_agent_result": deep_res,
                "findings": [],
                "files": [],
                "recommendations": ["Review DeepAgent steps and applied patches."],
                "evidence": deep_res.get("steps", []),
                "timeline": [{"step": s["action"], "status": s["status"], "message": s["details"]} for s in deep_res.get("steps", [])],
                "duration_sec": deep_res.get("duration_sec", 0.0),
            }

        # Check if multi-agent collaboration is warranted
        if input_data.get("mode") == "collaborative" or any(kw in task.lower() for kw in ["why is", "investigate", "audit and fix", "find why"]):
            return multi_agent_engine.execute_collaborative_workflow(task, input_data)

        timeline: List[Dict[str, Any]] = []
        timeline.append({
            "step": "Task Received",
            "status": "COMPLETED",
            "message": f"Processing query: '{task[:60]}...'",
            "timestamp": round(time.time() - start_time, 3)
        })

        # Intent Detection
        try:
            intent_result = self.intent_classifier.predict(task)
            primary_intent = intent_result.get("intent", "code_search")
            secondary_intent = intent_result.get("secondary_intent")
            confidence = intent_result.get("confidence", 0.85)

            timeline.append({
                "step": "Intent Classification",
                "status": "COMPLETED",
                "message": f"Detected: {primary_intent} ({round(confidence * 100)}%)" + (f" -> Secondary: {secondary_intent}" if secondary_intent else ""),
                "timestamp": round(time.time() - start_time, 3)
            })
        except Exception as e:
            primary_intent = "code_search"
            secondary_intent = None
            confidence = 0.50
            timeline.append({
                "step": "Intent Classification",
                "status": "FALLBACK",
                "message": f"Using fallback intent code_search: {e}",
                "timestamp": round(time.time() - start_time, 3)
            })

        agent_data = {**input_data, "task": task, "question": task, "query": task}
        agent_result: Dict[str, Any] = {}
        chained_results: Dict[str, Any] = {}

        try:
            if primary_intent == "repository_analysis":
                timeline.append({"step": "Repository Scan", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.repository_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent in ("code_search", "code_explanation"):
                timeline.append({"step": "RAG Hybrid Retrieval", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.rag_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "impact_analysis":
                timeline.append({"step": "Knowledge Graph Traversal", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                words = task.split()
                symbol_candidate = words[-1].strip("?.,'\"") if words else ""
                agent_result = self.impact_agent.run({**agent_data, "symbol": agent_data.get("symbol") or symbol_candidate})
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "security_analysis":
                timeline.append({"step": "Security Audit & OWASP Scan", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.security_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "bug_analysis":
                timeline.append({"step": "Bug Inspection & AST Check", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.bug_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

                if secondary_intent == "fix_request" or "fix" in task.lower():
                    timeline.append({"step": "FixAgent Patch Generation", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                    fix_res = self.fix_agent.run({**agent_data, "problem": task})
                    chained_results["fix"] = fix_res
                    timeline[-1]["status"] = "COMPLETED"

                    timeline.append({"step": "ValidationAgent Verification", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                    val_res = self.validation_agent.run({
                        "modified_code": fix_res.get("raw_data", {}).get("patched_code", ""),
                        "file_path": fix_res.get("raw_data", {}).get("target_file", "code.py")
                    })
                    chained_results["validation"] = val_res
                    timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "fix_request":
                timeline.append({"step": "Autonomous Patch Generation", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.fix_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

                timeline.append({"step": "Patch Validation", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                val_res = self.validation_agent.run({
                    "modified_code": agent_result.get("raw_data", {}).get("patched_code", ""),
                    "file_path": agent_result.get("raw_data", {}).get("target_file", "code.py")
                })
                chained_results["validation"] = val_res
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "test_generation":
                timeline.append({"step": "Test Suite Generation", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.test_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "architecture_analysis":
                timeline.append({"step": "Architecture Layer Mapping", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.architecture_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "code_review":
                timeline.append({"step": "Engineering Code Review", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.code_review_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "performance_analysis":
                timeline.append({"step": "Performance Bottleneck Scan", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.performance_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "documentation":
                timeline.append({"step": "Documentation Synthesis", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.documentation_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif primary_intent == "git_analysis":
                timeline.append({"step": "Git Inspection", "status": "RUNNING", "timestamp": round(time.time() - start_time, 3)})
                agent_result = self.git_agent.run(agent_data)
                timeline[-1]["status"] = "COMPLETED"

            elif "depend" in task.lower() or "package" in task.lower():
                agent_result = self.dependency_agent.run(agent_data)
            elif "database" in task.lower() or "sql" in task.lower():
                agent_result = self.database_agent.run(agent_data)
            elif "api" in task.lower() or "route" in task.lower():
                agent_result = self.api_agent.run(agent_data)
            elif "frontend" in task.lower() or "react" in task.lower():
                agent_result = self.frontend_agent.run(agent_data)
            elif "devops" in task.lower() or "docker" in task.lower():
                agent_result = self.devops_agent.run(agent_data)
            elif "refactor" in task.lower():
                agent_result = self.refactor_agent.run(agent_data)
            else:
                agent_result = self.rag_agent.run(agent_data)

        except Exception as exc:
            timeline.append({"step": "Execution Error", "status": "FAILED", "message": str(exc), "timestamp": round(time.time() - start_time, 3)})
            agent_result = {
                "success": False,
                "agent": "Orchestrator",
                "summary": f"Agent execution encountered an error: {exc}",
                "error": str(exc),
                "findings": [],
                "files": [],
                "recommendations": []
            }

        timeline.append({
            "step": "Response Aggregation",
            "status": "COMPLETED",
            "message": "Structured response synthesized with evidence and citations.",
            "timestamp": round(time.time() - start_time, 3)
        })

        return {
            "success": agent_result.get("success", False),
            "intent": primary_intent,
            "secondary_intent": secondary_intent,
            "intent_confidence": confidence,
            "intent_alternatives": intent_result.get("alternatives", []),
            "agent_name": agent_result.get("agent", "Orchestrator"),
            "summary": agent_result.get("summary", ""),
            "findings": agent_result.get("findings", []),
            "files": agent_result.get("files", []),
            "recommendations": agent_result.get("recommendations", []),
            "evidence": agent_result.get("evidence", []),
            "next_actions": agent_result.get("next_actions", []),
            "timeline": timeline,
            "agent_result": agent_result,
            "chained_results": chained_results,
            "execution_duration_sec": round(time.time() - start_time, 3)
        }

    def execute_agent(self, agent_name: str, task_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a specific named specialist agent directly."""
        name_clean = agent_name.lower()
        task_input = task_input or {}
        agent_map = {
            "refactor": self.refactor_agent,
            "dependency": self.dependency_agent,
            "database": self.database_agent,
            "api": self.api_agent,
            "frontend": self.frontend_agent,
            "devops": self.devops_agent,
            "security": self.security_agent,
            "bug": self.bug_agent,
            "test": self.test_agent,
            "fix": self.fix_agent,
            "review": self.code_review_agent,
            "git": self.git_agent,
        }
        for key, ag in agent_map.items():
            if key in name_clean:
                return ag.run(task_input)
        return self.run(agent_name, task_input)

    def run_multi_agent_collaboration(self, objective: str, repository_path: Optional[str] = None) -> Dict[str, Any]:
        """Run collaborative multi-agent plan and execution."""
        from app.ai.collaboration import multi_agent_engine
        return multi_agent_engine.execute_collaborative_workflow(
            task=objective,
            input_data={"repository_path": repository_path}
        )