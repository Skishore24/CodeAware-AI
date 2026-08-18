from typing import Any, Dict

from app.agents.repository_agent import RepositoryAgent
from app.agents.code_agent import CodeAgent
from app.agents.rag_agent import RAGAgent
from app.agents.impact_agent import ImpactAgent
from app.agents.bug_agent import BugAgent
from app.agents.test_agent import TestAgent
from app.agents.fix_agent import FixAgent

from app.ml.intent_classifier import IntentClassifier


class CodeAwareOrchestrator:
    """
    Central controller for CodeAware AI.

    Receives a developer task,
    determines the intent,
    selects the correct specialist agent,
    and returns the result.
    """

    def __init__(self):

        # ---------------------------------------------
        # Specialist agents
        # ---------------------------------------------

        self.repository_agent = RepositoryAgent()
        self.code_agent = CodeAgent()
        self.rag_agent = RAGAgent()
        self.impact_agent = ImpactAgent()
        self.bug_agent = BugAgent()
        self.test_agent = TestAgent()
        self.fix_agent = FixAgent()

        # ---------------------------------------------
        # Intent classifier
        # ---------------------------------------------

        self.intent_classifier = IntentClassifier()

    # =================================================
    # RUN TASK
    # =================================================

    def run(
        self,
        task: str,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        # ---------------------------------------------
        # Validate task
        # ---------------------------------------------

        if not task or not task.strip():
            return {
                "success": False,
                "intent": None,
                "message": "Task is required."
            }

        # ---------------------------------------------
        # Make sure input_data is a dictionary
        # ---------------------------------------------

        if input_data is None:
            input_data = {}

        # ---------------------------------------------
        # Predict user intent
        # ---------------------------------------------

        try:
            intent_result = self.intent_classifier.predict(task)

        except Exception as exc:
            return {
                "success": False,
                "intent": None,
                "message": "Intent classification failed.",
                "error": str(exc)
            }

        # ---------------------------------------------
        # Extract intent
        # ---------------------------------------------

        intent = intent_result.get("intent")
        confidence = intent_result.get("confidence", 0.0)
        alternatives = intent_result.get("alternatives", [])

        # ---------------------------------------------
        # Execute selected agent
        # ---------------------------------------------

        try:

            # =========================================
            # Repository Analysis
            # =========================================

            if intent == "repository_analysis":
                result = self.repository_agent.run(input_data)

            # =========================================
            # Code Search
            # =========================================

            elif intent == "code_search":
                result = self.rag_agent.run({**input_data, "question": task})

            # =========================================
            # Code Explanation
            # =========================================

            elif intent == "code_explanation":
                result = self.rag_agent.run({**input_data, "question": task})

            # =========================================
            # Impact Analysis
            # =========================================

            elif intent == "impact_analysis":
                agent_input = {**input_data}
                symbol = (
                    agent_input.get("symbol")
                    or agent_input.get("symbol_name")
                )
                if symbol:
                    agent_input["symbol"] = symbol
                result = self.impact_agent.run(agent_input)

            # =========================================
            # Bug Analysis
            # =========================================

            elif intent == "bug_analysis":
                result = self.bug_agent.run(input_data)

            # =========================================
            # Security Analysis
            # =========================================

            elif intent == "security_analysis":
                # Security checks are handled by the Bug Agent
                # (pattern-based detection of unsafe code patterns)
                result = self.bug_agent.run({
                    **input_data,
                    "mode": "security",
                })

            # =========================================
            # Test Generation
            # =========================================

            elif intent == "test_generation":
                result = self.test_agent.run(input_data)

            # =========================================
            # Fix Request
            # =========================================

            elif intent == "fix_request":
                result = self.fix_agent.run(input_data)

            # =========================================
            # Documentation
            # =========================================

            elif intent == "documentation":
                # Use the RAG agent to explain the codebase structure
                result = self.rag_agent.run({
                    **input_data,
                    "question": task,
                })

            # =========================================
            # Unknown Intent
            # =========================================

            else:
                result = {
                    "success": False,
                    "agent": "Orchestrator",
                    "message": f"Unknown intent: {intent}"
                }

        except Exception as exc:
            return {
                "success": False,
                "intent": intent,
                "intent_confidence": confidence,
                "intent_alternatives": alternatives,
                "agent_result": {
                    "success": False,
                    "message": "Agent execution failed.",
                    "error": str(exc)
                }
            }

        # ---------------------------------------------
        # Return complete result
        # ---------------------------------------------

        return {
            "success": result.get("success", False),
            "intent": intent,
            "intent_confidence": confidence,
            "intent_alternatives": alternatives,
            "agent_result": result,
        }