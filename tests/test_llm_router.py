import pytest


def test_model_router_initialization(model_router):
    assert model_router is not None
    health = model_router.check_health()
    assert health["connected"] is True
    assert "test" in health["active_model"].lower() or "ollama" in health["active_model"].lower()


def test_model_selection_logic(model_router):
    # Fast lightweight tasks
    fast_model = model_router.select_model("intent_classification")
    assert fast_model is not None

    # Deep reasoning tasks
    deep_model = model_router.select_model("patch_generation")
    assert deep_model is not None


def test_router_generate_deterministic_content(model_router):
    # Bug fix prompt
    resp_fix = model_router.generate(
        prompt="Please write a patch to fix the null pointer error",
        task_type="patch"
    )
    assert resp_fix.success is True
    assert "def patched_function" in resp_fix.content or len(resp_fix.content) > 0

    # Test gen prompt
    resp_test = model_router.generate(
        prompt="Generate unit tests for calculator",
        task_type="test_gen"
    )
    assert resp_test.success is True
    assert "test" in resp_test.content.lower()


@pytest.mark.asyncio
async def test_router_async_generate(model_router):
    resp = await model_router.generate_async(
        prompt="Explain what this code does",
        task_type="explain"
    )
    assert resp.success is True
    assert len(resp.content) > 0


def test_router_embeddings(model_router):
    texts = ["def calculate_total():", "import sys\nimport os"]
    embeddings = model_router.embed(texts)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 768
    assert len(embeddings[1]) == 768
