

def test_health_endpoints(client):
    # Root health
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "ok"

    # API health with database and ollama status
    res2 = client.get("/api/health")
    assert res2.status_code == 200
    data = res2.json()
    assert "components" in data
    assert "database" in data["components"]
    assert "ollama" in data["components"]


def test_repositories_endpoints(client):
    res = client.get("/api/repositories")
    assert res.status_code == 200
    assert isinstance(res.json(), list) or "repositories" in res.json()


def test_bugs_endpoints(client, temp_workspace):
    # Scan bugs on test workspace
    scan_res = client.post("/api/bugs/scan", json={
        "repository_path": str(temp_workspace)
    })
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert "findings" in scan_data or "bugs" in scan_data or "count" in scan_data

    # List bugs
    list_res = client.get("/api/bugs/list")
    assert list_res.status_code == 200


def test_deep_agent_run_endpoint(client, temp_workspace):
    res = client.post("/api/deep-agent/run", json={
        "goal": "Audit calculator module for safe division",
        "repository_path": str(temp_workspace),
        "max_iterations": 2,
        "timeout_seconds": 30
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "result" in data
    assert "steps" in data["result"]
    assert len(data["result"]["steps"]) > 0


def test_chat_send_endpoint(client):
    res = client.post("/api/chat/send", json={
        "message": "Explain how to write safe code",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "content" in data
