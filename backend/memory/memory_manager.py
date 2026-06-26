class MemoryManager:
    def __init__(self, enabled=True):
        self.enabled = enabled
        self.store = None

        if self.enabled:
            from backend.memory.chroma_store import ChromaMemory
            self.store = ChromaMemory()

    def remember(self, text: str, metadata: dict):
        if not self.enabled:
            return
        self.store.store(text, metadata)

    def recall(self, text: str, k: int = 3, n_results: int = None):
        """Recall similar memories from the store.
        
        Args:
            text: Query text to search for
            k: Number of results (legacy parameter)
            n_results: Number of results (preferred parameter, overrides k)
        """
        if not self.enabled:
            return []
        
        # Use n_results if provided, otherwise use k
        num_results = n_results if n_results is not None else k
        return self.store.retrieve(text, num_results)

    def get_recent(self, n: int = 10):
        """Get the most recent stored memories."""
        if not self.enabled or not self.store:
            return []
        return self.store.get_recent(n)



    