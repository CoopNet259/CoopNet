from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Literal
from database import get_supabase

ActionType = Literal[
    "harvest_analyze", "chat", "daily_summary", "draft_email",
    "draft_notification", "stock_check", "anomaly_check", "weekly_insight",
]


def log_ai(action_type: ActionType, input_text: str, output_data: Any) -> None:
    record = {
        "action_type": action_type,
        "input_text": input_text,
        "output_data": output_data,
        "status": "success",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        get_supabase().table("ai_logs").insert(record).execute()
    except Exception as exc:
        print(f"[AI_LOG_ERROR] {exc}")
        print(f"[AI_LOG_FALLBACK] {record}")
