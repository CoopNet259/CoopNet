from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel


# ── Harvest ──────────────────────────────────────────────────

class HarvestRequest(BaseModel):
    message: str


class ParsedHarvest(BaseModel):
    product_name: str
    quantity: float
    unit: str
    available_time: str | None = None
    confidence: float


class StockStatus(BaseModel):
    current_quantity: float
    unit: str
    is_critical: bool
    fill_percentage: float


class HarvestAnalysisResult(BaseModel):
    parsed: ParsedHarvest
    stock_status: StockStatus
    recommendation: str
    actions: list[str]
    executed_actions: list[str]
    auto_executed: bool
    confidence_label: Literal["Yüksek", "Orta", "Düşük"]
    confidence_warning: str | None


# ── Chat ─────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ToolCall(BaseModel):
    tool: str
    args: dict[str, Any]
    result: Any


class AgentResult(BaseModel):
    text: str
    toolCalls: list[ToolCall]


# ── Daily Summary ─────────────────────────────────────────────

class DailySummaryRequest(BaseModel):
    date: str | None = None


# ── Draft Email ───────────────────────────────────────────────

class DraftEmailRequest(BaseModel):
    product_name: str
    quantity: float
    unit: str = "kg"


class DraftEmailResponse(BaseModel):
    subject: str
    body: str
    suggested_quantity: float


# ── Draft Notification ────────────────────────────────────────

class DraftNotificationRequest(BaseModel):
    order_id: str


class DraftNotificationResponse(BaseModel):
    subject: str
    message: str
    channel: str


# ── Weekly Insight ────────────────────────────────────────────

class WeeklyInsightRequest(BaseModel):
    week_start: str | None = None


class RecommendedAction(BaseModel):
    tone: Literal["danger", "warn", "good"]
    title: str
    meta: str


class WeeklyInsightResponse(BaseModel):
    week_start: str
    week_end: str
    stats: dict[str, Any]
    insight: str
    highlights: list[str]
    recommended_actions: list[RecommendedAction]
    week_score: int | None
