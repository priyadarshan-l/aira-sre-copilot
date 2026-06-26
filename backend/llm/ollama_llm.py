from backend.llm.base import BaseLLM


class OllamaLLM(BaseLLM):
    """
    Skeleton implementation for local Ollama-based LLMs.
    This class is intentionally minimal and safe.

    Later, this will:
    - Call Ollama local server (http://localhost:11434)
    - Use models like llama3, mistral, etc.
    """

    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        self.enabled = False  # flip to True when Ollama is configured

    def generate(self, prompt: str) -> dict:
        if not self.enabled:
            return {
                "error": "ollama_disabled",
                "message": (
                    "Ollama LLM is not enabled on this system. "
                    "Install Ollama and enable this class."
                )
            }

        # -----------------------------
        # FUTURE IMPLEMENTATION (placeholder)
        # -----------------------------
        # Example (DO NOT ENABLE YET):
        #
        # import requests
        # response = requests.post(
        #     "http://localhost:11434/api/generate",
        #     json={
        #         "model": self.model_name,
        #         "prompt": prompt,
        #         "stream": False
        #     }
        # )
        # return response.json()
        # -----------------------------

        return {
            "error": "ollama_not_implemented",
            "message": "Ollama generate() not implemented yet"
        }
