from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class CodeAwareException(Exception):
    """Base exception for all CodeAware application errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class EntityNotFoundException(CodeAwareException):
    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{entity_id}' not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity": entity_name, "id": str(entity_id)}
        )


class SecuritySandboxException(CodeAwareException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Security Sandbox Violation: {message}",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class AgentExecutionException(CodeAwareException):
    def __init__(self, agent_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Agent '{agent_name}' failed: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"agent": agent_name, **(details or {})}
        )


class OllamaUnavailableException(CodeAwareException):
    def __init__(self, message: str = "Local Ollama server is unreachable or timed out."):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": "ollama", "action": "Ensure Ollama is running (ollama serve)"}
        )


class AuthenticationException(CodeAwareException):
    def __init__(self, message: str = "Authentication failed or token is invalid."):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details={"auth": "unauthorized"}
        )


class AuthorizationException(CodeAwareException):
    def __init__(self, message: str = "Insufficient permissions to perform this operation."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details={"auth": "forbidden"}
        )
