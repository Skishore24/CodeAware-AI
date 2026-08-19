from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseAgent(ABC):
    """
    Standardized base class for all CodeAware specialist agents.
    Enforces consistent execution flow: Input -> Validation -> Analysis -> Structured Output.
    """

    name: str = "BaseAgent"
    description: str = "Base agent"

    @abstractmethod
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent's core workflow and return a structured dictionary.
        """
        pass

    def create_response(
        self,
        success: bool = True,
        confidence: float = 0.90,
        summary: str = "",
        findings: Optional[List[Dict[str, Any]]] = None,
        files: Optional[List[str]] = None,
        recommendations: Optional[List[str]] = None,
        evidence: Optional[List[Dict[str, Any]]] = None,
        next_actions: Optional[List[str]] = None,
        raw_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Construct a predictable, unified agent response schema.
        """
        resp = {
            "success": success,
            "agent": self.name,
            "confidence": round(confidence, 2),
            "summary": summary or ("Execution completed successfully." if success else "Execution failed."),
            "findings": findings or [],
            "files": files or [],
            "recommendations": recommendations or [],
            "evidence": evidence or [],
            "next_actions": next_actions or [],
        }
        if error:
            resp["error"] = error
        if raw_data:
            resp["raw_data"] = raw_data
        return resp