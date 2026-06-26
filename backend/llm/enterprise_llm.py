from backend.llm.base import BaseLLM

class EnterpriseLLM(BaseLLM):
    def generate(self, prompt: str) -> dict:
        return {
            "error": "enterprise_llm_not_configured",
            "message": "Enterprise LLM is not configured yet"
        }
