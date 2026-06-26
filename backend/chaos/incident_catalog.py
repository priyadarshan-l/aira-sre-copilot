"""
AIRA Incident Catalog - Realistic SRE Incident Templates

A catalog of real-world infrastructure incidents that ChaosEngine
uses to generate synthetic scenarios for training and demos.
"""

import random
from typing import Optional, Dict, Any, List
import json
import os

# Try to load external grounded incident corpus if available
CORPUS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets", "incident_corpus.json")
CORPUS_INCIDENTS = []
if os.path.exists(CORPUS_PATH):
    try:
        with open(CORPUS_PATH, "r") as f:
            CORPUS_INCIDENTS = json.load(f)
            print(f"[IncidentCatalog] Grounded incident corpus loaded: {len(CORPUS_INCIDENTS)} cases.")
    except Exception as e:
        print(f"[IncidentCatalog] Failed to load incident corpus: {e}")

# Load HDFS log anomaly corpus
HDFS_CORPUS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets", "hdfs_corpus.json")
HDFS_INCIDENTS = []
if os.path.exists(HDFS_CORPUS_PATH):
    try:
        with open(HDFS_CORPUS_PATH, "r") as f:
            HDFS_INCIDENTS = json.load(f)
            print(f"[IncidentCatalog] Grounded HDFS corpus loaded: {len(HDFS_INCIDENTS)} cases.")
    except Exception as e:
        print(f"[IncidentCatalog] Failed to load HDFS corpus: {e}")

# Load OpenStack log anomaly corpus
OPENSTACK_CORPUS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets", "openstack_corpus.json")
OPENSTACK_INCIDENTS = []
if os.path.exists(OPENSTACK_CORPUS_PATH):
    try:
        with open(OPENSTACK_CORPUS_PATH, "r") as f:
            OPENSTACK_INCIDENTS = json.load(f)
            print(f"[IncidentCatalog] Grounded OpenStack corpus loaded: {len(OPENSTACK_INCIDENTS)} cases.")
    except Exception as e:
        print(f"[IncidentCatalog] Failed to load OpenStack corpus: {e}")




# ─────────────────────────────────────────────────────────────────
# INCIDENT CATALOG
# Each entry: type, template (with placeholders), severity range
# ─────────────────────────────────────────────────────────────────

INCIDENT_CATALOG: List[Dict[str, Any]] = [
    # ═══════════════════════════════════════════════════════════
    # DATABASE ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "database",
        "subtype": "connection_pool",
        "template": "PostgreSQL connection pool at {percent}% capacity on {service}. Active connections: {connections}/{max_connections}",
        "params": {
            "percent": {"range": [85, 100]},
            "connections": {"range": [180, 200]},
            "max_connections": {"fixed": 200}
        },
        "severity_weights": {"critical": 0.4, "high": 0.5, "medium": 0.1}
    },
    {
        "type": "database",
        "subtype": "deadlock",
        "template": "Deadlock detected in MySQL {database} database. Waiting transactions: {count}. Lock timeout exceeded.",
        "params": {
            "database": {"options": ["orders", "users", "inventory", "payments", "sessions"]},
            "count": {"range": [3, 12]}
        },
        "severity_weights": {"critical": 0.6, "high": 0.4}
    },
    {
        "type": "database",
        "subtype": "replication_lag",
        "template": "Database replication lag > {lag} seconds on {replica}. Primary: {primary}",
        "params": {
            "lag": {"range": [10, 120]},
            "replica": {"options": ["replica-east-1", "replica-west-2", "replica-eu-1"]},
            "primary": {"fixed": "primary-us-east-1"}
        },
        "severity_weights": {"high": 0.6, "medium": 0.4}
    },
    
    # ═══════════════════════════════════════════════════════════
    # MEMORY ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "memory",
        "subtype": "oom",
        "template": "Memory exhaustion on {service}. OOM killed at {memory}MB. RSS growing at {rate}MB/min",
        "params": {
            "service": {"options": ["api-gateway", "user-service", "order-processor", "auth-service", "cache-warmer"]},
            "memory": {"range": [3800, 4096]},
            "rate": {"range": [50, 200]}
        },
        "severity_weights": {"critical": 0.7, "high": 0.3}
    },
    {
        "type": "memory",
        "subtype": "leak",
        "template": "Memory leak detected in {service}. Heap usage: {percent}%. GC overhead limit exceeded.",
        "params": {
            "service": {"options": ["payment-gateway", "notification-service", "search-indexer", "analytics-worker"]},
            "percent": {"range": [90, 99]}
        },
        "severity_weights": {"high": 0.6, "medium": 0.4}
    },
    {
        "type": "memory",
        "subtype": "cache_eviction",
        "template": "Redis cache memory at {percent}%. Aggressive eviction started. Keys evicted: {keys}/sec",
        "params": {
            "percent": {"range": [95, 100]},
            "keys": {"range": [1000, 5000]}
        },
        "severity_weights": {"high": 0.5, "medium": 0.5}
    },
    
    # ═══════════════════════════════════════════════════════════
    # LATENCY ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "latency",
        "subtype": "api_timeout",
        "template": "P99 latency spike to {latency}ms on {endpoint}. Threshold: {threshold}ms. Region: {region}",
        "params": {
            "latency": {"range": [2000, 10000]},
            "endpoint": {"options": ["/api/checkout", "/api/search", "/api/users/profile", "/api/inventory/sync"]},
            "threshold": {"fixed": 500},
            "region": {"options": ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]}
        },
        "severity_weights": {"critical": 0.3, "high": 0.5, "medium": 0.2}
    },
    {
        "type": "latency",
        "subtype": "network",
        "template": "Network latency to {service} spiked to {latency}ms. Packet loss: {loss}%",
        "params": {
            "service": {"options": ["payment-provider", "shipping-api", "inventory-sync", "auth-provider"]},
            "latency": {"range": [500, 5000]},
            "loss": {"range": [1, 15]}
        },
        "severity_weights": {"high": 0.6, "medium": 0.4}
    },
    
    # ═══════════════════════════════════════════════════════════
    # CRASH/POD ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "crash",
        "subtype": "crashloop",
        "template": "Pod CrashLoopBackOff: {service} restarted {count} times in last {minutes} minutes. Exit code: {exit_code}",
        "params": {
            "service": {"options": ["order-service", "user-auth", "payment-processor", "notification-worker", "api-gateway"]},
            "count": {"range": [3, 15]},
            "minutes": {"range": [5, 30]},
            "exit_code": {"options": [1, 137, 139, 143]}
        },
        "severity_weights": {"critical": 0.5, "high": 0.5}
    },
    {
        "type": "crash",
        "subtype": "deployment_failure",
        "template": "Deployment failed for {service} v{version}. Rollback initiated. Error: {error}",
        "params": {
            "service": {"options": ["checkout-service", "inventory-manager", "recommendation-engine"]},
            "version": {"options": ["2.4.1", "3.0.0", "1.9.2", "2.1.0-beta"]},
            "error": {"options": ["ImagePullBackOff", "CrashLoopBackOff", "ReadinessProbe failed", "ConfigMap not found"]}
        },
        "severity_weights": {"critical": 0.4, "high": 0.6}
    },
    
    # ═══════════════════════════════════════════════════════════
    # DISK ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "disk",
        "subtype": "full",
        "template": "Disk usage at {percent}% on {host}. Only {gb}GB free. Volume: {volume}",
        "params": {
            "percent": {"range": [90, 99]},
            "host": {"options": ["prod-db-01", "prod-logs-02", "prod-storage-03", "prod-backup-01"]},
            "gb": {"range": [1, 10]},
            "volume": {"options": ["/dev/sda1", "/dev/xvdf", "/data", "/logs"]}
        },
        "severity_weights": {"critical": 0.3, "high": 0.5, "medium": 0.2}
    },
    {
        "type": "disk",
        "subtype": "iops",
        "template": "Disk IOPS throttled on {host}. Current: {current} IOPS, Limit: {limit} IOPS. Queue depth: {queue}",
        "params": {
            "host": {"options": ["db-primary", "elasticsearch-01", "kafka-broker-2"]},
            "current": {"range": [2800, 3000]},
            "limit": {"fixed": 3000},
            "queue": {"range": [50, 200]}
        },
        "severity_weights": {"high": 0.7, "medium": 0.3}
    },
    
    # ═══════════════════════════════════════════════════════════
    # NETWORK/CONNECTIVITY
    # ═══════════════════════════════════════════════════════════
    {
        "type": "network",
        "subtype": "partition",
        "template": "Network partition detected between {zone_a} and {zone_b}. DNS resolution failing.",
        "params": {
            "zone_a": {"options": ["us-east-1a", "us-east-1b", "eu-west-1a"]},
            "zone_b": {"options": ["us-east-1c", "us-west-2a", "eu-west-1b"]}
        },
        "severity_weights": {"critical": 0.8, "high": 0.2}
    },
    {
        "type": "network",
        "subtype": "lb_unhealthy",
        "template": "Load balancer health checks failing for {count}/{total} targets in {target_group}",
        "params": {
            "count": {"range": [2, 5]},
            "total": {"fixed": 6},
            "target_group": {"options": ["api-targets", "web-targets", "worker-targets"]}
        },
        "severity_weights": {"critical": 0.4, "high": 0.6}
    },
    
    # ═══════════════════════════════════════════════════════════
    # SECURITY
    # ═══════════════════════════════════════════════════════════
    {
        "type": "security",
        "subtype": "auth_spike",
        "template": "Unusual login pattern: {count} failed attempts from {ip} in last {minutes} minutes. Possible brute force.",
        "params": {
            "count": {"range": [50, 500]},
            "ip": {"options": ["203.0.113.42", "198.51.100.17", "192.0.2.99", "172.16.0.100"]},
            "minutes": {"range": [5, 15]}
        },
        "severity_weights": {"critical": 0.3, "high": 0.5, "medium": 0.2}
    },
    {
        "type": "security",
        "subtype": "certificate",
        "template": "SSL certificate for {domain} expires in {days} days. Renewal required.",
        "params": {
            "domain": {"options": ["api.example.com", "dashboard.example.com", "payments.example.com", "*.internal.example.com"]},
            "days": {"range": [1, 14]}
        },
        "severity_weights": {"critical": 0.2, "high": 0.5, "medium": 0.3}
    },
    
    # ═══════════════════════════════════════════════════════════
    # CPU ISSUES
    # ═══════════════════════════════════════════════════════════
    {
        "type": "cpu",
        "subtype": "spike",
        "template": "CPU spike on {host}. Load average: {load}%. All cores saturated. Top process: {process}",
        "params": {
            "host": {"options": ["prod-server-01", "api-node-03", "worker-05", "cache-node-02"]},
            "load": {"range": [90, 100]},
            "process": {"options": ["java", "node", "python3", "nginx", "postgres"]}
        },
        "severity_weights": {"critical": 0.3, "high": 0.5, "medium": 0.2}
    },
    {
        "type": "cpu",
        "subtype": "throttling",
        "template": "Container CPU throttled for {service}. Throttle rate: {rate}%. Requests/limit: {requests}m/{limit}m",
        "params": {
            "service": {"options": ["api-gateway", "order-worker", "search-service"]},
            "rate": {"range": [30, 80]},
            "requests": {"range": [900, 1000]},
            "limit": {"fixed": 1000}
        },
        "severity_weights": {"high": 0.6, "medium": 0.4}
    },
]


# ─────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────

def _resolve_param(param_config: Dict) -> Any:
    """Resolve a parameter value from its config."""
    if "fixed" in param_config:
        return param_config["fixed"]
    elif "range" in param_config:
        return random.randint(param_config["range"][0], param_config["range"][1])
    elif "options" in param_config:
        return random.choice(param_config["options"])
    return None


def _choose_severity(weights: Dict[str, float]) -> str:
    """Choose severity based on weights."""
    severities = list(weights.keys())
    probs = list(weights.values())
    return random.choices(severities, weights=probs, k=1)[0]


def generate_random_incident(
    incident_type: Optional[str] = None,
    severity: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a random incident from the catalog.
    
    Args:
        incident_type: Filter by type (database, memory, etc.)
        severity: Override severity (critical, high, medium, low)
        
    Returns:
        Incident dict with text, type, severity, etc.
    """
    # If the grounded incident corpus is available, draw from it directly
    if CORPUS_INCIDENTS:
        candidates = CORPUS_INCIDENTS
        if incident_type:
            candidates = [c for c in candidates if c["type"] == incident_type]
        if severity:
            candidates = [c for c in candidates if c["severity"] == severity]
            
        if candidates:
            item = random.choice(candidates)
            return {
                "text": item["text"],
                "type": item["type"],
                "subtype": item.get("subtype", "unknown"),
                "severity": item.get("severity", "high"),
                "params": {
                    "root_cause": item.get("root_cause"),
                    "resolution": item.get("resolution"),
                    "corpus_id": item.get("id")
                }
            }

    # Filter fallback template catalog
    candidates = INCIDENT_CATALOG
    if incident_type:
        candidates = [c for c in candidates if c["type"] == incident_type]
    
    if not candidates:
        candidates = INCIDENT_CATALOG
    
    # Pick random template
    template_config = random.choice(candidates)
    
    # Resolve all parameters
    params = {}
    for key, config in template_config.get("params", {}).items():
        params[key] = _resolve_param(config)
    
    # Generate text
    text = template_config["template"].format(**params)
    
    # Determine severity
    if not severity:
        severity = _choose_severity(template_config.get("severity_weights", {"high": 1.0}))
    
    return {
        "text": text,
        "type": template_config["type"],
        "subtype": template_config.get("subtype", "unknown"),
        "severity": severity,
        "params": params
    }


def get_incident_types() -> List[str]:
    """Get all unique incident types."""
    return list(set(c["type"] for c in INCIDENT_CATALOG))


def get_incidents_by_type(incident_type: str) -> List[Dict]:
    """Get all incidents of a specific type."""
    return [c for c in INCIDENT_CATALOG if c["type"] == incident_type]
