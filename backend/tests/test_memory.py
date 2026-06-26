"""
Test Memory System
Verifies ChromaDB, Embeddings, and Memory Manager
"""
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from backend.memory.memory_manager import MemoryManager

def test_memory():
    print("\n" + "="*50)
    print("TESTING MEMORY SYSTEM")
    print("="*50)
    
    try:
        # 1. Initialize
        print("\n1. Initializing MemoryManager...", end="")
        memory = MemoryManager(enabled=True)
        print(" [OK]")
        
        # 2. Store
        print("2. Storing test memory...", end="")
        test_text = "CPU usage is high on server-1"
        test_meta = {
            "root_cause": "cpu_spike",
            "fix_strategy": "scale_cpu",
            "verdict": "resolved"
        }
        memory.remember(test_text, test_meta)
        print(" [OK]")
        
        # 3. Recall
        print(f"3. Recalling similar memory for query 'server cpu high'...", end="")
        results = memory.recall("server cpu high", k=1)
        
        if results and results["documents"]:
            doc = results["documents"][0][0]
            meta = results["metadatas"][0][0]
            print(" [OK]")
            print(f"\n   Stored: {doc}")
            print(f"   Recovered Metadata: {meta}")
            
            if meta["root_cause"] == "cpu_spike":
                print("\n[SUCCESS] Memory system is working correctly!")
                return True
            else:
                print("\n[FAIL] Metadata mismatch!")
                return False
        else:
            print(" [FAIL] No results found!")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Memory test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_memory()
