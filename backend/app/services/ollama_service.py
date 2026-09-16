import os
import logging
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error
import json

logger = logging.getLogger(__name__)

DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")


class OllamaService:
    """
    Client service for local Ollama LLM integration in CodeAware AI.
    Connects to local Ollama instances (default: http://localhost:11434)
    with zero cloud dependencies, supporting models like Qwen 2.5 Coder,
    DeepSeek R1, Llama 3.1, etc.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: int = 120,
    ):
        self.base_url = (base_url or DEFAULT_OLLAMA_URL).rstrip("/")
        self.model = model or DEFAULT_OLLAMA_MODEL
        self.timeout = timeout

    def check_connection(self) -> Dict[str, Any]:
        """
        Check if Ollama server is running and reachable.
        """
        url = f"{self.base_url}/api/version"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CodeAware-AI/1.0"})
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    version = data.get("version", "unknown")
                    return {
                        "connected": True,
                        "base_url": self.base_url,
                        "version": version,
                        "model": self.model,
                        "message": f"Ollama is running (v{version})",
                    }
        except Exception as e:
            return {
                "connected": False,
                "base_url": self.base_url,
                "model": self.model,
                "error": str(e),
                "message": "Ollama server is not reachable at " + self.base_url,
            }
        return {"connected": False, "base_url": self.base_url, "model": self.model}

    def list_installed_models(self) -> List[Dict[str, Any]]:
        """
        List all locally pulled models in Ollama via /api/tags.
        """
        url = f"{self.base_url}/api/tags"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CodeAware-AI/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    return data.get("models", [])
        except Exception as e:
            logger.warning(f"Could not retrieve models from Ollama: {e}")
            return []
        return []

    def get_effective_model(self) -> str:
        """
        Return the preferred model if installed, otherwise the best available installed model.
        """
        installed = [m.get("name") or m.get("model") for m in self.list_installed_models()]
        if any(self.model in m for m in installed):
            return self.model
        for candidate in ["llama3.1:8b", "llama3.2:3b", "qwen2.5-coder:7b", "codellama:7b"]:
            if any(candidate in m for m in installed):
                return candidate
        text_models = [m for m in installed if "embed" not in m]
        if text_models:
            return text_models[0]
        return self.model

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        context: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Optional[str]:
        """
        Send a generation request to Ollama /api/generate.
        Returns the string response or None if Ollama is unavailable.
        """
        target_model = model or self.get_effective_model()
        full_prompt = prompt
        if context:
            full_prompt = f"Repository Context:\n```\n{context}\n```\n\nTask / Question:\n{prompt}"

        payload = {
            "model": target_model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if system:
            payload["system"] = system

        url = f"{self.base_url}/api/generate"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json", "User-Agent": "CodeAware-AI/1.0"},
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status == 200:
                    result = json.loads(response.read().decode("utf-8"))
                    return result.get("response", "")
        except Exception as e:
            logger.warning(f"Ollama generation failed or timed out: {e}")
            return None
        return None


# Global singleton instance
ollama_service = OllamaService()
