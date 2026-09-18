from app.tools.base import PermissionLevel
from app.tools.registry import tool_registry


def test_tool_registry_initialization():
    tools = tool_registry.list_tools()
    assert len(tools) >= 19
    names = {t.name for t in tools}
    assert "read_file" in names
    assert "list_files" in names
    assert "search_code" in names
    assert "inspect_ast" in names
    assert "analyze_security" in names
    assert "run_tests" in names
    assert "generate_patch" in names
    assert "apply_patch" in names
    assert "query_rag" in names
    assert "query_graph" in names


def test_tool_permissions():
    read_tool = tool_registry.get("read_file")
    assert read_tool.permission_level == PermissionLevel.READ

    patch_tool = tool_registry.get("apply_patch")
    assert patch_tool.permission_level == PermissionLevel.WRITE

    test_tool = tool_registry.get("run_tests")
    assert test_tool.permission_level == PermissionLevel.EXECUTE


def test_read_file_tool(temp_workspace):
    res = tool_registry.execute(
        "read_file",
        file_path="src/calculator.py",
        repository_path=str(temp_workspace)
    )
    assert res["success"] is True
    assert "def add" in res["content"]
    assert res["total_lines"] > 0


def test_list_files_tool(temp_workspace):
    res = tool_registry.execute(
        "list_files",
        repository_path=str(temp_workspace)
    )
    assert res["success"] is True
    files = [f["file"] for f in res["files"]]
    assert any("calculator.py" in f for f in files)


def test_inspect_ast_tool(temp_workspace):
    res = tool_registry.execute(
        "inspect_ast",
        file_path="src/calculator.py",
        repository_path=str(temp_workspace)
    )
    assert res["success"] is True
    assert "ast" in res
    assert "functions" in res["ast"] or "classes" in res["ast"]


def test_unknown_tool_error():
    res = tool_registry.execute("non_existent_tool_12345")
    assert res["success"] is False
    assert "not registered" in res["error"]
