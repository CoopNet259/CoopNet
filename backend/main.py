from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from routers import harvest, ai, dashboard, cron, producers, anomaly_router, whatsapp, approvals, waste_prevention, shifts, notifications, financial

app = FastAPI(title="CoopNet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(harvest.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(cron.router)
app.include_router(producers.router)
app.include_router(anomaly_router.router)
app.include_router(whatsapp.router)
app.include_router(approvals.router)
app.include_router(waste_prevention.router)
app.include_router(shifts.router)
app.include_router(notifications.router)
app.include_router(financial.router)


# ── Zamanlanmış Görevler ──────────────────────────────────────────────────────
# APScheduler: uygulama açıkken arka planda otomatik çalışır.

scheduler = AsyncIOScheduler(timezone="Europe/Istanbul")


async def _run_morning_briefing():
    """Her gün 07:00 — günlük aksiyon planı."""
    try:
        from routers.cron import morning_briefing
        # Secret kontrolünü bypass etmek için sahte request
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        await morning_briefing(_FakeReq())
        print("[SCHEDULER] ☀️ Sabah briefing tamamlandı.")
    except Exception as exc:
        print(f"[SCHEDULER] morning_briefing HATA: {exc}")


async def _run_evening_summary():
    """Her gün 22:00 — gün sonu özeti."""
    try:
        from routers.cron import evening_summary
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        await evening_summary(_FakeReq())
        print("[SCHEDULER] 🌙 Akşam özeti tamamlandı.")
    except Exception as exc:
        print(f"[SCHEDULER] evening_summary HATA: {exc}")


async def _run_weekly_briefing():
    """Her Pazartesi 08:00 — haftalık özet."""
    try:
        from routers.cron import weekly_briefing
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        await weekly_briefing(_FakeReq())
        print("[SCHEDULER] 📊 Haftalık briefing tamamlandı.")
    except Exception as exc:
        print(f"[SCHEDULER] weekly_briefing HATA: {exc}")


async def _run_timeout_check():
    """Her saat başı — 12 saati geçen onayları otomatik reddet."""
    try:
        from routers.approvals import timeout_check
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        result = await timeout_check(_FakeReq())
        if result["timed_out_count"] > 0:
            print(f"[SCHEDULER] ⏱️ {result['timed_out_count']} onay zaman aşımına uğradı.")
    except Exception as exc:
        print(f"[SCHEDULER] timeout_check HATA: {exc}")


async def _run_waste_prevention():
    """Her 6 saatte bir — son kullanım tarihi yakın ürünleri kontrol et."""
    try:
        from routers.waste_prevention import check_waste_risk
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        result = await check_waste_risk(_FakeReq())
        if result["at_risk_count"] > 0:
            print(f"[SCHEDULER] ♻️ {result['at_risk_count']} ürün israf riski, {result['offers_count']} teklif hazırlandı.")
    except Exception as exc:
        print(f"[SCHEDULER] waste_prevention HATA: {exc}")


async def _run_stock_check():
    """Her 30 dakikada bir — kritik stok kontrolü."""
    try:
        from routers.cron import stock_check
        class _FakeReq:
            headers = {"x-cron-secret": _get_secret()}
        result = await stock_check(_FakeReq())
        if result.get("critical_count", 0) > 0:
            print(f"[SCHEDULER] ⚠️ {result['critical_count']} kritik stok tespit edildi.")
    except Exception as exc:
        print(f"[SCHEDULER] stock_check HATA: {exc}")


def _get_secret() -> str:
    from config import settings
    return settings.cron_secret or ""


@app.on_event("startup")
async def start_scheduler():
    # Her gün 07:00 — sabah aksiyon planı
    scheduler.add_job(_run_morning_briefing,   CronTrigger(hour=7,  minute=0))
    # Her gün 22:00 — gün sonu özeti
    scheduler.add_job(_run_evening_summary,    CronTrigger(hour=22, minute=0))
    # Her Pazartesi 08:00 — haftalık rapor
    scheduler.add_job(_run_weekly_briefing,    CronTrigger(day_of_week="mon", hour=8, minute=0))
    # Her saat başı — onay timeout kontrolü
    scheduler.add_job(_run_timeout_check,      CronTrigger(minute=0))
    # Her 6 saatte bir — israf önleme
    scheduler.add_job(_run_waste_prevention,   CronTrigger(hour="*/6", minute=0))
    # Her 30 dakikada bir — stok kontrolü
    scheduler.add_job(_run_stock_check,        CronTrigger(minute="*/30"))

    scheduler.start()
    print("[SCHEDULER] ✅ Zamanlanmış görevler aktif:")
    print("  ☀️  07:00       — Sabah aksiyon planı")
    print("  🌙  22:00       — Gün sonu özeti")
    print("  📊  Pzt 08:00   — Haftalık rapor")
    print("  ⏱️  Her saat     — Onay timeout kontrolü")
    print("  ♻️  Her 6 saat   — İsraf önleme")
    print("  ⚠️  Her 30 dk    — Stok kontrolü")


@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
    print("[SCHEDULER] Durduruldu.")


@app.get("/health")
def health():
    jobs = [
        {"id": job.id, "next_run": str(job.next_run_time)}
        for job in scheduler.get_jobs()
    ]
    return {"status": "ok", "scheduled_jobs": len(jobs), "jobs": jobs}
