# backend/llm/groq_llm.py
"""
AIRA Groq LLM Integration
Uses Groq's high-speed endpoint (with OpenAI compatibility) for low-latency reasoning.
"""

import os
import json
import re
from backend.llm.base import BaseLLM


class GroqLLM(BaseLLM):
    """
    Groq LLM backend for AIRA agents.
    Uses llama-3.3-70b-versatile by default for fast, accurate SRE reasoning.
    """

    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        self.model_name = model
        self.llm = None
        self._init_client()

    def _init_client(self):
        """Initialize LangChain ChatOpenAI client with Groq configurations."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "YOUR_GROQ_API_KEY_HERE":
            print("[GroqLLM] GROQ_API_KEY not set or is placeholder in .env")
            return

        try:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                openai_api_key=api_key,
                openai_api_base="https://api.groq.com/openai/v1",
                model=self.model_name,
                temperature=0.2,
                max_tokens=300
            )
            print(f"[GroqLLM] ✅ Initialized Groq LLM with model: {self.model_name}")
        except Exception as e:
            print(f"[GroqLLM] ❌ Initialization failed: {e}")
            self.llm = None

    def generate(self, prompt: str) -> dict:
        """
        Send a prompt to Groq and parse JSON response.
        Always returns a dict. Never raises exceptions.
        """
        if self.llm is None:
            return {"error": "groq_unavailable", "message": "Groq client not initialized"}

        try:
            response = self.llm.invoke(prompt)
            text = response.content.strip()

            # Clean JSON markdown blocks if any
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\s*", "", text)
                text = re.sub(r"\s*```$", "", text)
                text = text.strip()

            return json.loads(text)

        except json.JSONDecodeError as e:
            print(f"[GroqLLM] JSON parse error: {e} | Raw: {text[:200]}")
            return {"error": "json_parse_failure", "message": str(e), "raw": text[:200]}
        except Exception as e:
            print(f"[GroqLLM] API error: {e}")
            return {"error": "api_failure", "message": str(e)}

    def is_available(self) -> bool:
        """Check if the Groq client is ready."""
        return self.llm is not None
