# backend/llm/llm_factory.py
"""
AIRA LLM Factory — Auto-selects the best available LLM.
Priority: Gemini > Groq > OpenAI > Ollama > Fallback (rule-based)
"""

import os
from dotenv import load_dotenv

load_dotenv()


def get_llm():
    """
    Returns the best available LLM based on environment keys.
    No manual config needed — just set the right API key in .env
    """

    # 1. Gemini (Primary — fast + free tier)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "YOUR_GEMINI_API_KEY_HERE":
        try:
            from backend.llm.gemini_llm import GeminiLLM
            llm = GeminiLLM()
            if llm.is_available():
                print("[LLMFactory] [OK] Using Gemini 1.5 Flash")
                return llm
        except Exception as e:
            print(f"[LLMFactory] Gemini init failed: {e}")

    # 2. Groq (Secondary — ultra-low latency)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key != "YOUR_GROQ_API_KEY_HERE":
        try:
            from backend.llm.groq_llm import GroqLLM
            llm = GroqLLM()
            if llm.is_available():
                print("[LLMFactory] [OK] Using Groq Llama-3.3-70b")
                return llm
        except Exception as e:
            print(f"[LLMFactory] Groq init failed: {e}")

    # 3. OpenAI (Tertiary)
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from backend.llm.openai_llm import OpenAILLM
            print("[LLMFactory] [OK] Using OpenAI GPT-4o-mini")
            return OpenAILLM()
        except Exception as e:
            print(f"[LLMFactory] OpenAI init failed: {e}")

    # 4. Ollama (Local — no API key needed)
    try:
        from backend.llm.ollama_llm import OllamaLLM
        print("[LLMFactory] [OK] Using Ollama (local)")
        return OllamaLLM()
    except Exception as e:
        print(f"[LLMFactory] Ollama init failed: {e}")

    # 5. Rule-based fallback (always works)
    from backend.llm.fallback_llm import FallbackLLM
    print("[LLMFactory] [FALLBACK] Using rule-based fallback (no LLM key found)")
    return FallbackLLM()
