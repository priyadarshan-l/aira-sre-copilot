"""
AIRA ChaosEngine - Incident Generator

Generates synthetic incidents for simulation, training, and demos.
Two modes:
- AUTO: Background thread generates random incidents every N seconds
- MANUAL: User triggers specific incident via API/Dashboard
"""

import random
import threading
import time
import uuid
from datetime import datetime
from typing import Callable, Optional, List, Dict, Any
from enum import Enum

from backend.chaos.incident_catalog import INCIDENT_CATALOG, generate_random_incident, CORPUS_INCIDENTS, HDFS_INCIDENTS, OPENSTACK_INCIDENTS




class ChaosMode(Enum):
    """ChaosEngine operating modes."""
    STOPPED = "stopped"
    AUTO = "auto"
    MANUAL = "manual"


class ChaosEngine:
    """
    Generates synthetic incidents for AIRA training and demos.
    
    Features:
    - Auto-pilot mode: Fires incidents at random intervals
    - Manual mode: User-triggered incidents
    - LLM mode: Generate novel "unknown" incidents (optional)
    - Event broadcasting to WebSocket clients
    """
    
    def __init__(
        self,
        on_incident: Optional[Callable[[Dict[str, Any]], None]] = None,
        min_interval: int = 30,
        max_interval: int = 90
    ):
        """
        Initialize ChaosEngine.
        
        Args:
            on_incident: Callback when incident is generated
            min_interval: Minimum seconds between auto incidents
            max_interval: Maximum seconds between auto incidents
        """
        self.on_incident = on_incident
        self.min_interval = min_interval
        self.max_interval = max_interval
        
        self.mode = ChaosMode.STOPPED
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        
        # Statistics
        self.stats = {
            "total_generated": 0,
            "auto_generated": 0,
            "manual_generated": 0,
            "by_type": {},
            "history": []
        }
    
    # ─────────────────────────────────────────────
    # AUTO MODE
    # ─────────────────────────────────────────────
    
    def start_auto_mode(self) -> Dict[str, Any]:
        """
        Start background thread that fires incidents randomly.
        
        Returns:
            Status dict with mode and next expected incident time
        """
        if self.mode == ChaosMode.AUTO:
            return {"status": "already_running", "mode": "auto"}
        
        self._stop_event.clear()
        self.mode = ChaosMode.AUTO
        
        self._thread = threading.Thread(target=self._auto_loop, daemon=True)
        self._thread.start()
        
        return {
            "status": "started",
            "mode": "auto",
            "interval_range": [self.min_interval, self.max_interval]
        }
    
    def stop_auto_mode(self) -> Dict[str, Any]:
        """Stop the background chaos generator."""
        if self.mode != ChaosMode.AUTO:
            return {"status": "not_running", "mode": str(self.mode.value)}
        
        self._stop_event.set()
        self.mode = ChaosMode.STOPPED
        
        if self._thread:
            self._thread.join(timeout=2)
            self._thread = None
        
        return {"status": "stopped", "mode": "stopped"}
    
    def _auto_loop(self):
        """Background loop that generates incidents at random intervals."""
        while not self._stop_event.is_set():
            # Random wait
            wait_time = random.randint(self.min_interval, self.max_interval)
            
            # Wait with interruptibility
            if self._stop_event.wait(timeout=wait_time):
                break  # Stop event was set
            
            # Generate incident
            incident = self._generate_incident(source="auto")
            self._emit(incident)
    
    # ─────────────────────────────────────────────
    # MANUAL MODE
    # ─────────────────────────────────────────────
    
    def trigger_manual(
        self,
        incident_text: Optional[str] = None,
        incident_type: Optional[str] = None,
        severity: str = "high"
    ) -> Dict[str, Any]:
        """
        User-triggered incident.
        
        Args:
            incident_text: Custom incident description (optional)
            incident_type: Type from catalog (optional)
            severity: low/medium/high/critical
            
        Returns:
            Generated incident dict
        """
        matched_case = None
        if incident_text:
            # Search SRE Corpus
            for case in CORPUS_INCIDENTS:
                if case.get("text") == incident_text or case.get("title") == incident_text:
                    matched_case = case
                    break
            if not matched_case:
                # Search HDFS Corpus
                for case in HDFS_INCIDENTS:
                    if case.get("text") == incident_text or case.get("title") == incident_text:
                        matched_case = case
                        break
            if not matched_case:
                # Search OpenStack Corpus
                for case in OPENSTACK_INCIDENTS:
                    if case.get("text") == incident_text or case.get("title") == incident_text:
                        matched_case = case
                        break

        
        if matched_case:
            incident = {
                "id": matched_case.get("id", f"INC-{uuid.uuid4().hex[:8].upper()}"),
                "text": matched_case["text"],
                "type": matched_case.get("type", "custom"),
                "subtype": matched_case.get("subtype", "unknown"),
                "severity": matched_case.get("severity", severity),
                "source": "manual",
                "timestamp": datetime.now().isoformat(),
                "logs": matched_case.get("logs", ""),
                "root_cause": matched_case.get("root_cause", ""),
                "resolution": matched_case.get("resolution", "")
            }
        elif incident_text:
            # User provided custom text (unmatched)
            incident = {
                "id": f"INC-{uuid.uuid4().hex[:8].upper()}",
                "text": incident_text,
                "type": incident_type or "custom",
                "severity": severity,
                "source": "manual",
                "timestamp": datetime.now().isoformat()
            }
        elif incident_type:
            # Generate from catalog by type
            incident = self._generate_incident(
                source="manual",
                incident_type=incident_type,
                severity=severity
            )
        else:
            # Random from catalog
            incident = self._generate_incident(source="manual", severity=severity)
        
        self._emit(incident)
        return incident
    
    def trigger_random(self) -> Dict[str, Any]:
        """Trigger a random incident from the catalog."""
        return self.trigger_manual()
    
    # ─────────────────────────────────────────────
    # INTERNAL
    # ─────────────────────────────────────────────
    
    def _generate_incident(
        self,
        source: str = "auto",
        incident_type: Optional[str] = None,
        severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate an incident from the catalog."""
        incident = generate_random_incident(
            incident_type=incident_type,
            severity=severity
        )
        incident["source"] = source
        incident["id"] = f"INC-{uuid.uuid4().hex[:8].upper()}"
        incident["timestamp"] = datetime.now().isoformat()
        
        return incident
    
    def _emit(self, incident: Dict[str, Any]):
        """Emit incident and update stats."""
        # Update stats
        self.stats["total_generated"] += 1
        if incident.get("source") == "auto":
            self.stats["auto_generated"] += 1
        else:
            self.stats["manual_generated"] += 1
        
        inc_type = incident.get("type", "unknown")
        self.stats["by_type"][inc_type] = self.stats["by_type"].get(inc_type, 0) + 1
        
        # Keep last 50 in history
        self.stats["history"].append({
            "id": incident["id"],
            "type": incident.get("type"),
            "severity": incident.get("severity"),
            "source": incident.get("source"),
            "timestamp": incident.get("timestamp")
        })
        if len(self.stats["history"]) > 50:
            self.stats["history"] = self.stats["history"][-50:]
        
        # Callback
        if self.on_incident:
            try:
                self.on_incident(incident)
            except Exception as e:
                print(f"[ChaosEngine] Callback error: {e}")
    
    # ─────────────────────────────────────────────
    # STATUS & CONFIG
    # ─────────────────────────────────────────────
    
    def get_status(self) -> Dict[str, Any]:
        """Get current ChaosEngine status."""
        return {
            "mode": self.mode.value,
            "interval_range": [self.min_interval, self.max_interval],
            "stats": self.stats
        }
    
    def set_config(
        self,
        min_interval: Optional[int] = None,
        max_interval: Optional[int] = None
    ) -> Dict[str, Any]:
        """Update ChaosEngine configuration."""
        if min_interval is not None:
            self.min_interval = max(5, min_interval)  # Minimum 5 seconds
        if max_interval is not None:
            self.max_interval = max(self.min_interval + 5, max_interval)
        
        return {
            "interval_range": [self.min_interval, self.max_interval]
        }
    
    def reset_stats(self):
        """Reset statistics."""
        self.stats = {
            "total_generated": 0,
            "auto_generated": 0,
            "manual_generated": 0,
            "by_type": {},
            "history": []
        }
