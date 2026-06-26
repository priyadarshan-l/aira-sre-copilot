import chromadb
from backend.memory.base import BaseMemory
from backend.memory.embeddings import get_embedding_model


class ChromaMemory(BaseMemory):
    def __init__(self):
        # Persistent client (auto-saves to disk)
        self.client = chromadb.PersistentClient(
            path="./data/chroma"
        )

        #  Safe across restarts
        self.collection = self.client.get_or_create_collection(
            name="aira_memory"
        )

        self.embedding_model = get_embedding_model()

    def store(self, text: str, metadata: dict):
        embedding = self.embedding_model.embed_query(text)

        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            embeddings=[embedding],
            ids=[str(len(self.collection.get()["ids"]))]
        )
        # NO persist() call needed anymore

    def retrieve(self, text: str, k: int = 3):
        embedding = self.embedding_model.embed_query(text)

        return self.collection.query(
            query_embeddings=[embedding],
            n_results=k
        )
