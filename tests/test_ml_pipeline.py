import pytest
from app.ml.datasets.cvefixes_loader import CVEFixesLoader
from app.ml.inference.vulnerability_detector import VulnerabilityDetector
from app.ml.training.vulnerability_trainer import VulnerabilityModelTrainer


def test_cvefixes_loader_summary():
    loader = CVEFixesLoader()
    assert loader.exists() is True
    summary = loader.get_summary()
    assert summary["exists"] is True
    assert summary["total_samples"] > 0
    assert "vulnerable" in summary["labels"]
    assert "safe" in summary["labels"]


def test_cvefixes_loader_load_data():
    loader = CVEFixesLoader()
    texts, labels, langs = loader.load_data(max_samples=20, balance=True)
    assert len(texts) > 0
    assert len(texts) == len(labels) == len(langs)
    assert any(l == 1 for l in labels)


def test_vulnerability_detector_inference():
    detector = VulnerabilityDetector()
    assert detector.is_available() is True

    # Test dangerous code snippet
    dangerous_code = "void pwn(char *u) { char b[64]; strcpy(b, u); system(b); }"
    res_vuln = detector.predict(dangerous_code)
    assert res_vuln["is_vulnerable"] is True
    assert res_vuln["label"] == "VULNERABLE"
    assert res_vuln["vulnerability_score"] >= 0.5
    assert len(res_vuln["recommendations"]) > 0

    # Test clean code snippet
    safe_code = "def add(x: int, y: int) -> int:\n    return x + y\n"
    res_safe = detector.predict(safe_code)
    assert res_safe["is_vulnerable"] is False
    assert res_safe["label"] == "SAFE"
    assert res_safe["vulnerability_score"] < 0.5


def test_ml_api_datasets_endpoint(client):
    res = client.get("/api/ml/datasets")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["count"] >= 1
    assert any(d["id"] == "cvefixes" for d in data["datasets"])


def test_ml_api_models_endpoint(client):
    res = client.get("/api/ml/models")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["models"]) >= 1
    model = data["models"][0]
    assert "metrics" in model
    assert model["metrics"]["accuracy"] > 0.8


def test_ml_api_predict_endpoint(client):
    res = client.post("/api/ml/predict", json={
        "code": "char input[256]; gets(input); system(input);",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["label"] == "VULNERABLE"
    assert data["vulnerability_score"] > 0.5
