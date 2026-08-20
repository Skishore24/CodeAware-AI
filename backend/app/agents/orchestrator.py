from typing import Any, Dict, List, Optional
import time

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

from app.ml.intent_classifier import IntentClassifier
from app.services.rag_service import RAGService
from app.services.graph_service import GraphService


class CodeAwareOrchestrator:
    """
    Central Multi-Agent Orchestrator and Task Planner for CodeAware AI.
    Routes queries based on hybrid intent classification, coordinates multi-agent pipelines,
    records execution timelines, and aggregates structured results.
    """

    def __init__(self):
        # Shared core services
        self.rag_service = RAGService()
        self.graph_service = GraphService()

        # Specialist Agents
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

        # Intent Classifier
        self.intent_classifier = IntentClassifier()

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

        timeline: List[Dict[str, Any]] = []

        # 1. Step: Task Received
        timeline.append({
            "step": "Task Received",
            "status": "COMPLETED",
            "message": f"Processing query: '{task[:60]}...'",
            "timestamp": round(time.time() - start_time, 3)
        })

        # 2. Step: Intent Detection
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

        # 3. Route to primary agent and execute pipeline
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
                # Extract symbol if possible from query
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

                # If multi-intent includes fix_request, chain FixAgent & ValidationAgent
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

        # 4. Final Aggregation
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