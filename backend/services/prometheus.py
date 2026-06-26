# backend/services/prometheus.py
"""
AIRA Mock Prometheus Telemetry Service
Provides a hybrid interface: queries actual host metrics via psutil,
and falls back to in-memory mock metrics for simulated applications.
"""

import psutil
import time
from typing import Dict, Any

try:
    import psutil
except ImportError:
    psutil = None  # Fallback to mock

class MockPrometheus:
    def __init__(self):
        self._mock_metrics: Dict[str, float] = {
            "node_network_latency_ms": 12.5,
            "db_connection_pool_saturation_percent": 15.0,
            "db_deadlocks_total": 0.0,
            "ssl_certificate_expiry_days": 85.0
        }
        
    