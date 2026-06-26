import json
from backend.llm.base import BaseLLM
import os


class OpenAILLM(BaseLLM):
    def __init__(self):
        # Lazy import — langchain_openai takes 30s+ to load, so we defer it
        from langchain_openai import ChatOpenAI
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=300
        )
    
    def generate(self, prompt: str) -> dict:
        try:
            response = self.llm.invoke(prompt)
            text = response.content
            return json.loads(text)

        except Exception as e:
            return {
                "error": "llm_failure",
                "message": str(e)
            }
