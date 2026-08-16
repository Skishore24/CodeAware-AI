from typing import Any, Dict

from app.agents.repository_agent import (
    RepositoryAgent
)

from app.agents.code_agent import (
    CodeAgent
)

from app.agents.rag_agent import (
    RAGAgent
)

from app.ml.intent_classifier import (
    IntentClassifier
)
from app.agents.impact_agent import (
    ImpactAgent
)


class CodeAwareOrchestrator:

    def __init__(self):

        self.repository_agent = (
            RepositoryAgent()
        )

        self.code_agent = (
            CodeAgent()
        )

        self.rag_agent = (
            RAGAgent()
        )

        self.intent_classifier = (
            IntentClassifier()
        )

    # ---------------------------------------------------------
    # Run task
    # ---------------------------------------------------------

    def run(
        self,
        task: str,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:

        # -----------------------------------------------------
        # Predict intent
        # -----------------------------------------------------

        intent_result = (
            self.intent_classifier.predict(
                task
            )
        )

        intent = intent_result[
            "intent"
        ]

        # -----------------------------------------------------
        # Repository analysis
        # -----------------------------------------------------

        if intent == "repository_analysis":

            result = (
                self.repository_agent.run(
                    input_data
                )
            )

        # -----------------------------------------------------
        # Code search
        # -----------------------------------------------------

        elif intent == "code_search":

            input_data = {
                **input_data,
                "question": task,
            }

            result = (
                self.rag_agent.run(
                    input_data
                )
            )

        # -----------------------------------------------------
        # Code explanation
        # -----------------------------------------------------

        elif intent == "code_explanation":

            input_data = {
                **input_data,
                "question": task,
            }

            result = (
                self.rag_agent.run(
                    input_data
                )
            )


        # -----------------------------------------------------
        # Impact analysis
        # -----------------------------------------------------

        elif intent == "impact_analysis":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Impact Agent is the next "
                    "agent we will implement."
                ),
            }

        # -----------------------------------------------------
        # Bug analysis
        # -----------------------------------------------------

        elif intent == "bug_analysis":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Bug Agent is the next "
                    "agent we will implement."
                ),
            }

        # -----------------------------------------------------
        # Security
        # -----------------------------------------------------

        elif intent == "security_analysis":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Security Agent is the next "
                    "agent we will implement."
                ),
            }

        # -----------------------------------------------------
        # Tests
        # -----------------------------------------------------

        elif intent == "test_generation":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Test Agent is the next "
                    "agent we will implement."
                ),
            }

        # -----------------------------------------------------
        # Fix
        # -----------------------------------------------------

        elif intent == "fix_request":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Fix Agent is the next "
                    "agent we will implement."
                ),
            }

        # -----------------------------------------------------
        # Documentation
        # -----------------------------------------------------

        elif intent == "documentation":

            result = {
                "success": False,
                "intent": intent,
                "message": (
                    "Documentation Agent is "
                    "the next agent we will implement."
                ),
            }

        else:

            result = {
                "success": False,
                "message": (
                    "Unknown intent."
                ),
            }

        # -----------------------------------------------------
        # Return complete orchestration result
        # -----------------------------------------------------

        return {

            "success": result.get(
                "success",
                False
            ),

            "intent": intent,

            "intent_confidence": (
                intent_result[
                    "confidence"
                ]
            ),

            "intent_alternatives": (
                intent_result[
                    "alternatives"
                ]
            ),

            "agent_result": result,

        }