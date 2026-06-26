# backend/services/notifier.py
"""
AIRA Webhook Alerting Service
Sends rich alerts to Slack / Discord / PagerDuty when incidents require manual intervention.
"""

import os
import json
import requests
from datetime import datetime


def send_slack_alert(incident_details: dict) -> bool:
    """
    Dispatches a structured alert message to Slack via Webhooks.
    If no Webhook URL is set, runs in Mock mode and prints to system logs.
    """
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    incident_text = incident_details.get("incident", "Unknown Incident")
    root_cause = incident_details.get("root_cause", "unknown")
    status = incident_details.get("final_status", "unresolved")
    cycles = incident_details.get("cycles", 0)
    elapsed_ms = incident_details.get("elapsed_ms", 0.0)
    rl_mode = incident_details.get("rl_mode", "q_learning")

    # Format block layout for Slack
    color = "#E01E5A" if status == "unresolved" else "#2EB67D"
    payload = {
        "attachments": [
            {
                "color": color,
                "title": f"🚨 AIRA Incident Report: {status.upper()}",
                "fields": [
                    {
                        "title": "Incident Details",
                        "value": incident_text,
                        "short": False
                    },
                    {
                        "title": "Suspected Root Cause",
                        "value": f"`{root_cause}`",
                        "short": True
                    },
                    {
                        "title": "RL Policy Mode",
                        "value": f"`{rl_mode}`",
                        "short": True
                    },
                    {
                        "title": "Cycles Run",
                        "value": str(cycles),
                        "short": True
                    },
                    {
                        "title": "Remediation Time",
                        "value": f"{elapsed_ms:.1f}ms",
                        "short": True
                    }
                ],
                "footer": "AIRA SRE AgentOps Engine",
                "ts": int(datetime.utcnow().timestamp())
            }
        ]
    }

    if not webhook_url or webhook_url == "YOUR_SLACK_WEBHOOK_URL_HERE":
        print("\n" + "="*60)
        print("📢 [MOCK ALERT DISPATCH] No SLACK_WEBHOOK_URL set. Logging payload:")
        print(json.dumps(payload, indent=2))
        print("="*60 + "\n")
        return True

    try:
        response = requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code == 200:
            print(f"[Notifier] ✅ Alert successfully sent to Slack (Status 200)")
            return True
        else:
            print(f"[Notifier] ❌ Slack returned status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"[Notifier] ❌ Webhook dispatch failed: {e}")
        return False
