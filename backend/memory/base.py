from abc import ABC, abstractmethod
from typing import List, Dict

class BaseMemory(ABC):

    @abstractmethod
    def store(self, text: str, metadata: Dict):
        pass

    @abstractmethod
    def retrieve(self, text:str, k: int = 3) -> List[Dict]:
        pass
    