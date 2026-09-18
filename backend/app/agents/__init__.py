from app.agents.base_agent import BaseAgent
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
from app.agents.pr_agent import PRAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.dependency_agent import DependencyAgent
from app.agents.refactor_agent import RefactorAgent
from app.agents.database_agent import DatabaseAgent
from app.agents.api_agent import APIAgent
from app.agents.frontend_agent import FrontendAgent
from app.agents.devops_agent import DevOpsAgent

# NOTE: CodeAwareOrchestrator is NOT imported here to prevent circular imports.
# The import chain was: orchestrator -> app.ai.collaboration -> app.agents -> orchestrator
# Import it directly where needed: from app.agents.orchestrator import CodeAwareOrchestrator

# Standard Alias
CodeAnalysisAgent = CodeAgent

__all__ = [
    "BaseAgent",
    "RepositoryAgent",
    "SearchAgent",
    "RAGAgent",
    "CodeAgent",
    "CodeAnalysisAgent",
    "BugAgent",
    "SecurityAgent",
    "ImpactAgent",
    "TestAgent",
    "FixAgent",
    "DocumentationAgent",
    "ArchitectureAgent",
    "PerformanceAgent",
    "CodeReviewAgent",
    "GitAgent",
    "PRAgent",
    "ValidationAgent",
    "DependencyAgent",
    "RefactorAgent",
    "DatabaseAgent",
    "APIAgent",
    "FrontendAgent",
    "DevOpsAgent",
]