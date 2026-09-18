from abc import ABC
from typing import Any, Dict, List, Optional


class BaseAgent(ABC):
    """
    Standardized base class for all CodeAware specialist agents (Section 12).
    Enforces consistent execution flow: Input -> Validation -> Analysis/Execution -> Structured Output.
    """

    name: str = "BaseAgent"
    description: str = "Base agent"
    capabilities: List[str] = []
    tools: List[str] = []

    def __init__(self, repository_path: Optional[str] = None, **kwargs: Any):
        self.repository_path = repository_path
        for k, v in kwargs.items():
            setattr(self, k, v)

    def validate(self, input_data: Dict[str, Any]) -> bool:
        """Validate agent input parameters before execution."""
        return isinstance(input_data, dict)

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Core execution logic of the specialist agent.
        Subclasses can override either execute() or run().
        """
        return self.create_response(success=True, summary=f"{self.name} executed successfully.")

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Unified entry point providing validation and error handling.
        Delegates to execute() unless overridden by legacy agents.
        """
        if not self.validate(input_data):
            return self.create_response(
                success=False,
                confidence=0.0,
                summary=f"Validation failed for agent {self.name}: Invalid input parameters.",
                error="Invalid input data.",
            )
        try:
            return self.execute(input_data)
        except Exception as exc:
            return self.create_response(
                success=False,
                confidence=0.0,
                summary=f"Agent '{self.name}' encountered an error: {exc}",
                error=str(exc),
            )

    def summarize(self, result: Dict[str, Any]) -> str:
        """Generate a concise textual summary of agent findings."""
        findings_count = len(result.get("findings", []))
        status = "succeeded" if result.get("success") else "failed"
        return f"{self.name} {status} with {findings_count} findings."

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
        """Construct a predictable, unified agent response schema."""
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