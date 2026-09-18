from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel


class PermissionLevel(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    EXECUTE = "EXECUTE"
    ADMIN = "ADMIN"


class ToolDefinition(BaseModel):
    name: str
    description: str
    permission_level: PermissionLevel = PermissionLevel.READ
    timeout: int = 30
    parameters: Dict[str, Any] = {}
    returns: Dict[str, Any] = {}


class BaseTool(ABC):
    """
    Standard Base Class for all controlled agent tools (Section 15).
    """
    name: str = "base_tool"
    description: str = "Base agent tool"
    permission_level: PermissionLevel = PermissionLevel.READ
    timeout: int = 30

    @abstractmethod
    def execute(self, **kwargs: Any) -> Dict[str, Any]:
        """Execute the tool with validated arguments."""
        pass

    def get_definition(self) -> ToolDefinition:
        return ToolDefinition(
            name=self.name,
            description=self.description,
            permission_level=self.permission_level,
            timeout=self.timeout,
        )
