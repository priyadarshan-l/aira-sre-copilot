# backend/llm/gemini_llm.py
"""
AIRA Gemini LLM Integration
Uses Google's Gemini Flash model for fast, accurate SRE reasoning.
"""

import os
import json
import re
from backend.llm.base import BaseLLM

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class GeminiLLM(BaseLLM):
    """
    Gemini Pro LLM backend for AIRA agents.
    Uses gemini-1.5-flash for speed + cost efficiency.
    Falls back gracefully if API is unavailable.
    """

    def __init__(self, model: str = "gemini-1.5-flash"):
        self.model_name = model
        self.model = None
        self._init_client()

    def _init_client(self):
        """Initialize Gemini client from environment."""
        if not GEMINI_AVAILABLE:
            print("[GeminiLLM] google-generativeai not installed. Run: pip install google-generativeai")
            return

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("[GeminiLLM] GEMINI_API_KEY not set in .env — falling back to rule-based mode")
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(self.model_name)
            print(f"[GeminiLLM] ✅ Initialized with model: {self.model_name}")
        except Exception as e:
            print(f"[GeminiLLM] ❌ Init failed: {e}")
            self.model = None

    def generate(self, prompt: str) -> dict:
        """
        Send a prompt to Gemini and parse JSON response.
        Always returns a dict. Never raises exceptions.
        """
        if self.model is None:
            return {"error": "gemini_unavailable", "message": "Gemini not initialized"}

        # Enforce JSON output in the prompt
        full_prompt = (
            f"{prompt}\n\n"
            "IMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, no code blocks.\n"
            "Start your response directly with { and end with }."
        )

        try:
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=512,
                )
            )

            raw = response.text.strip()

            # Strip markdown code fences if Gemini adds them
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
                raw = raw.strip()

            return json.loads(raw)

        except json.JSONDecodeError as e:
            print(f"[GeminiLLM] JSON parse error: {e} | Raw: {raw[:200]}")
            return {"error": "json_parse_failure", "message": str(e), "raw": raw[:200]}
        except Exception as e:
            print(f"[GeminiLLM] API error: {e}")
            return {"error": "api_failure", "message": str(e)}

    def is_available(self) -> bool:
        """Check if the Gemini client is ready."""
        return self.model is not None
