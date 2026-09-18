from app.agents.api_agent import APIAgent
from app.agents.database_agent import DatabaseAgent
from app.agents.dependency_agent import DependencyAgent
from app.agents.devops_agent import DevOpsAgent
from app.agents.frontend_agent import FrontendAgent
from app.agents.orchestrator import CodeAwareOrchestrator
from app.agents.refactor_agent import RefactorAgent
from app.deep_agent.agent import DeepAgent


def test_refactor_agent(temp_workspace):
    agent = RefactorAgent(repository_path=str(temp_workspace))
    res = agent.run({
        "file_path": "src/calculator.py",
        "repository_path": str(temp_workspace),
        "objective": "Simplify error handling in divide function"
    })
    assert res["success"] is True
    assert "refactor" in res.get("agent_name", res.get("agent", "")).lower()


def test_dependency_agent(temp_workspace):
    agent = DependencyAgent(repository_path=str(temp_workspace))
    res = agent.run({"repository_path": str(temp_workspace)})
    assert res["success"] is True
    assert "dependency" in res.get("agent_name", res.get("agent", "")).lower()


def test_database_agent(temp_workspace):
    agent = DatabaseAgent(repository_path=str(temp_workspace))
    res = agent.run({"repository_path": str(temp_workspace), "task": "audit_schema"})
    assert res["success"] is True
    assert "database" in res.get("agent_name", res.get("agent", "")).lower()


def test_api_agent(temp_workspace):
    agent = APIAgent(repository_path=str(temp_workspace))
    res = agent.run({"repository_path": str(temp_workspace), "task": "inspect_endpoints"})
    assert res["success"] is True
    assert "api" in res.get("agent_name", res.get("agent", "")).lower()


def test_devops_agent(temp_workspace):
    agent = DevOpsAgent(repository_path=str(temp_workspace))
    res = agent.run({"repository_path": str(temp_workspace), "task": "audit_pipeline"})
    assert res["success"] is True
    assert "devops" in res.get("agent_name", res.get("agent", "")).lower()


def test_frontend_agent(temp_workspace):
    agent = FrontendAgent(repository_path=str(temp_workspace))
    res = agent.run({"repository_path": str(temp_workspace), "task": "audit_components"})
    assert res["success"] is True
    assert "frontend" in res.get("agent_name", res.get("agent", "")).lower()


def test_orchestrator_routing(temp_workspace):
    orchestrator = CodeAwareOrchestrator()
    
    # 1. Single specialist agent execution
    res = orchestrator.execute_agent(
        agent_name="refactor",
        task_input={
            "file_path": "src/calculator.py",
            "repository_path": str(temp_workspace),
            "objective": "Format code"
        }
    )
    assert res["success"] is True

    # 2. Collaborative multi-agent plan
    collab_res = orchestrator.run_multi_agent_collaboration(
        objective="Analyze repository and suggest tests",
        repository_path=str(temp_workspace)
    )
    assert collab_res["success"] is True
    assert len(collab_res["timeline"]) > 0


def test_deep_agent_long_horizon(temp_workspace):
    deep_agent = DeepAgent(repository_path=str(temp_workspace))
    res = deep_agent.run(
        goal="Audit calculator.py and verify safe execution",
        repository_path=str(temp_workspace),
        max_iterations=3,
        timeout_seconds=30
    )
    assert res["success"] is True
    assert "status" in res
    assert len(res["steps"]) > 0
