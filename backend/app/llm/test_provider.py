import json
from typing import Any, AsyncIterator, Dict, List, Optional
from app.llm.base import LLMProvider
from app.llm.schemas import LLMRequest, LLMResponse, ModelInfo


class TestLLMProvider(LLMProvider):
    """
    Deterministic Local AI Test Provider for CI and offline execution (Section 40).
    Produces structured responses without external API calls or running Ollama.
    """

    def check_health(self) -> Dict[str, Any]:
        return {
            "connected": True,
            "base_url": "mock://local-test",
            "version": "test-v1",
            "active_model": "test-coder:7b",
            "message": "Local deterministic test provider ready",
        }

    def list_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(
                id="test-coder:7b",
                name="Test Deterministic Coder",
                description="Fast test provider for unit tests and CI",
                is_installed=True,
                recommended=True,
            ),
            ModelInfo(
                id="test-embed:latest",
                name="Test Embedder",
                description="768-dim mock vector embedding provider",
                is_installed=True,
            )
        ]

    def generate(self, request: LLMRequest) -> LLMResponse:
        prompt_lower = request.prompt.lower()
        content = "Analysis completed with deterministic test provider."

        # Bug fixing response
        if "fix" in prompt_lower or "patch" in prompt_lower:
            content = (
                "```python\n"
                "# Deterministic validated patch\n"
                "def patched_function(*args, **kwargs):\n"
                "    return True\n"
                "```"
            )
        # Test generation response
        elif "test" in prompt_lower:
            content = (
                "```python\n"
                "import unittest\n\n"
                "class TestGeneratedSuite(unittest.TestCase):\n"
                "    def test_basic_execution(self):\n"
                "        self.assertTrue(True)\n"
                "```"
            )
        # Code explanation response
        elif "explain" in prompt_lower or "what does" in prompt_lower:
            content = (
                "### Code Structure Overview\n"
                "The analyzed module provides structured application logic with defined entry points and error guards."
            )
        # Security response
        elif "security" in prompt_lower or "vulnerability" in prompt_lower:
            content = (
                "### Security Audit Summary\n"
                "No critical remote execution vectors identified in target snippet."
            )

        return LLMResponse(
            content=content,
            model=request.model or "test-coder:7b",
            success=True,
            duration_ms=1.5,
            prompt_tokens=10,
            completion_tokens=25,
        )

    async def generate_async(self, request: LLMRequest) -> LLMResponse:
        return self.generate(request)

    async def stream_generate(self, request: LLMRequest) -> AsyncIterator[str]:
        resp = self.generate(request)
        tokens = resp.content.split(" ")
        for token in tokens:
            yield token + " "

    def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        # Return reproducible 768-dimensional normalized mock embeddings
        result = []
        for text in texts:
            seed = sum(ord(c) for c in text[:50]) % 100
            vec = [float((seed + i) % 10) / 10.0 for i in range(768)]
            result.append(vec)
        return result
