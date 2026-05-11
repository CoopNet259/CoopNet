from __future__ import annotations
import json
from datetime import date
from fastapi import APIRouter, Query
from database import get_supabase

router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

SEVERITY_ORDER = {"kritik": 0, "yuksek": 1, "orta": 2, "bilgi": 3}


@router.get("/summary")
async def anomaly_summary(target_date: str = Query(default=None)):
    sb = get_supabase()
    today = target_date or date.today().isoformat()
    anomalies: list[dict] = []

    # ── 1. Stok anomalileri (products: ad, mevcut_kg, kapasite_kg) ──
    products_res = sb.table("products").select(
        "id, ad, emoji, mevcut_kg, kapasite_kg"
    ).execute()

    for p in (products_res.data or []):
        current = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct = round((current / capacity) * 100) if capacity > 0 else 100
        name = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()

        if pct <= 20:
            anomalies.append({
                "id": f"stock-{p['id']}",
                "title": f"{name} stok seviyesi kritik",
                "description": f"{name} stok seviyesi %{pct} olarak ölçüldü. Acil sipariş planlayın.",
                "severity": "kritik",
                "category": "Depo",
                "source": "Stok Analizi",
                "recommendation": "Satın alma desteği ile ek stok talebi oluşturun.",
            })
        elif pct <= 40:
            anomalies.append({
                "id": f"stock-{p['id']}",
                "title": f"{name} stoğu düşük",
                "description": f"{name} şu anda %{pct} dolulukta. Talep artışı riski mevcut.",
                "severity": "yuksek",
                "category": "Depo",
                "source": "Stok Analizi",
                "recommendation": "Tedarikçi ve üretim planını kontrol edin.",
            })

    # ── 2. STK uyarıları ─────────────────────────────────────────
    stk_res = sb.table("stk_alerts").select("*").execute()
    for alert in (stk_res.data or []):
        kardesler = alert.get("kardesler") or []
        if isinstance(kardesler, str):
            try:
                kardesler = json.loads(kardesler)
            except Exception:
                kardesler = []
        line = (
            f"Kardeş üreticiler: {', '.join(c.get('ad', '') for c in kardesler)}."
            if kardesler else ""
        )
        anomalies.append({
            "id": f"stk-{alert['id']}",
            "title": f"{alert.get('urun', '?')} için STK risk uyarısı",
            "description": f"{alert.get('emoji', '')} {alert.get('urun', '')} için {alert.get('kalan_gun_mesaj', '')}. {line}".strip(),
            "severity": "yuksek",
            "category": "STK",
            "source": "STK İzleme",
            "recommendation": "Riskli ürünü hızlıca kardeş üretici ile eşleştirin.",
        })

    # ── 3. AI logları (ai_logs: tip, baslik, mesaj, kategori) ────
    logs_res = (
        sb.table("ai_logs")
        .select("id, tip, baslik, mesaj, kategori")
        .eq("tip", "Anomali")
        .limit(5)
        .execute()
    )
    for log in (logs_res.data or []):
        anomalies.append({
            "id": f"ai-{log['id']}",
            "title": f"AI tespiti: {log.get('baslik', '')}",
            "description": log.get("mesaj", ""),
            "severity": "kritik",
            "category": log.get("kategori", "AI Tespiti"),
            "source": "AI Görüşü",
            "recommendation": "Hatanın kaynağını inceleyin ve gerekirse depo operasyonunu güncelleyin.",
        })

    anomalies.sort(key=lambda x: SEVERITY_ORDER.get(x["severity"], 4))
    return {"date": today, "anomalies": anomalies}
