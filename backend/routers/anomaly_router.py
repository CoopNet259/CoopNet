from __future__ import annotations
import json
from collections import defaultdict
from datetime import date, timedelta
from fastapi import APIRouter, Query
from database import get_supabase

router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

SEVERITY_ORDER = {"kritik": 0, "yuksek": 1, "orta": 2, "bilgi": 3}


def _parse_miktar(val) -> float:
    if val is None:
        return 0.0
    try:
        return float(str(val).split()[0])
    except (ValueError, IndexError):
        return 0.0


@router.get("/summary")
async def anomaly_summary(target_date: str = Query(default=None)):
    sb = get_supabase()
    today_str = target_date or date.today().isoformat()
    today     = date.fromisoformat(today_str)
    anomalies: list[dict] = []

    # ── 1. Ürün & stok verileri ──────────────────────────────────
    products_res = sb.table("products").select(
        "id, ad, emoji, mevcut_kg, kapasite_kg, son_kullanim_tarihi"
    ).execute()
    products = products_res.data or []

    # Stok düşüklüğü anomalileri
    for p in products:
        current  = p.get("mevcut_kg") or 0
        capacity = p.get("kapasite_kg") or 1
        pct      = round((current / capacity) * 100) if capacity > 0 else 100
        name     = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()

        if pct <= 20:
            anomalies.append({
                "id": f"stock-{p['id']}",
                "title": f"{name} stok seviyesi kritik",
                "description": f"Mevcut stok kapasitesinin %{pct}'i. Acil tedarik planlanmalı.",
                "severity": "kritik",
                "category": "Depo",
                "source": "Stok Analizi",
                "recommendation": "Satın alma desteği ile ek stok talebi oluşturun.",
            })
        elif pct <= 40:
            anomalies.append({
                "id": f"stock-{p['id']}",
                "title": f"{name} stoğu düşük",
                "description": f"Mevcut stok kapasitesinin %{pct}'i. Talep artışı riski var.",
                "severity": "yuksek",
                "category": "Depo",
                "source": "Stok Analizi",
                "recommendation": "Tedarikçi ve üretim planını kontrol edin.",
            })

    # ── 2. Son kullanım tarihi yaklaşan ürünler ──────────────────
    for p in products:
        sku_raw = p.get("son_kullanim_tarihi")
        if not sku_raw:
            continue
        try:
            sku = date.fromisoformat(str(sku_raw)[:10])
        except ValueError:
            continue

        days_left = (sku - today).days
        name = f"{p.get('emoji', '')} {p.get('ad', '')}".strip()
        surplus = p.get("mevcut_kg") or 0

        if days_left < 0:
            anomalies.append({
                "id": f"expired-{p['id']}",
                "title": f"{name} son kullanım tarihi geçti",
                "description": f"{surplus} kg stok {abs(days_left)} gün önce son kullanım tarihini aştı.",
                "severity": "kritik",
                "category": "İsraf",
                "source": "Raf Ömrü Takibi",
                "recommendation": "Stoğu derhal imha listesine alın veya kardeş üreticiye devredin.",
            })
        elif days_left <= 2:
            anomalies.append({
                "id": f"expiring-{p['id']}",
                "title": f"{name} {days_left} gün içinde sona eriyor",
                "description": f"{surplus} kg stok var, son kullanım: {sku_raw}. Ajan otomatik teklif gönderdi.",
                "severity": "kritik",
                "category": "İsraf",
                "source": "Raf Ömrü Takibi",
                "recommendation": "Kardeş üretici onayını takip edin veya depo görevi oluşturun.",
            })
        elif days_left <= 5:
            anomalies.append({
                "id": f"expiring-{p['id']}",
                "title": f"{name} raf ömrü riski",
                "description": f"{surplus} kg stok var, {days_left} gün kaldı (son kullanım: {sku_raw}).",
                "severity": "yuksek",
                "category": "İsraf",
                "source": "Raf Ömrü Takibi",
                "recommendation": "Talepler sayfasından teklif gönderin veya depo görevi açın.",
            })

    # ── 3. Haftalık talep trend anomalileri ──────────────────────
    week_start = (today - timedelta(days=7)).isoformat()
    prev_start = (today - timedelta(days=14)).isoformat()

    try:
        this_res = sb.table("requests").select("urun,miktar,durum").gte("tarih", week_start).execute()
        prev_res = (
            sb.table("requests").select("urun,miktar")
            .gte("tarih", prev_start).lt("tarih", week_start).execute()
        )
        this_week_rows = this_res.data or []
        prev_week_rows = prev_res.data or []
    except Exception:
        this_week_rows = []
        prev_week_rows = []

    this_totals: dict[str, float] = defaultdict(float)
    prev_totals: dict[str, float] = defaultdict(float)
    for r in this_week_rows:
        p = (r.get("urun") or "").strip()
        if p:
            this_totals[p] += _parse_miktar(r.get("miktar"))
    for r in prev_week_rows:
        p = (r.get("urun") or "").strip()
        if p:
            prev_totals[p] += _parse_miktar(r.get("miktar"))

    product_names = {p.get("ad", "").strip() for p in products}

    # 3a. Bu hafta talebi tamamen düşen ürünler
    for urun, prev_kg in prev_totals.items():
        if prev_kg >= 10 and this_totals.get(urun, 0) == 0:
            anomalies.append({
                "id": f"demand-gone-{urun}",
                "title": f"{urun} talebi bu hafta sıfırlandı",
                "description": (
                    f"Geçen hafta {prev_kg:.0f} kg sipariş alan {urun} için "
                    "bu hafta hiç sipariş gelmedi."
                ),
                "severity": "yuksek",
                "category": "Talep",
                "source": "Haftalık Trend",
                "recommendation": "Müşteri iletişimini kontrol edin, fiyat veya kalite sorunu olabilir.",
            })

    # 3b. Bu hafta aniden patlayan talep (>%150 artış, baseline ≥ 10 kg)
    for urun, this_kg in this_totals.items():
        prev_kg = prev_totals.get(urun, 0)
        if prev_kg >= 10:
            pct_change = ((this_kg - prev_kg) / prev_kg) * 100
            if pct_change > 150:
                anomalies.append({
                    "id": f"demand-spike-{urun}",
                    "title": f"{urun} talebinde ani artış: +%{pct_change:.0f}",
                    "description": (
                        f"Geçen hafta {prev_kg:.0f} kg → bu hafta {this_kg:.0f} kg. "
                        "Stok karşılayamayabilir."
                    ),
                    "severity": "yuksek",
                    "category": "Talep",
                    "source": "Haftalık Trend",
                    "recommendation": "Depo stoğunu kontrol edin, gerekirse acil tedarik başlatın.",
                })

    # 3c. Ürün kayıtlı ama hiç sipariş yok (tüm zamanlar)
    try:
        all_reqs_res = sb.table("requests").select("urun").execute()
        ordered_products = {(r.get("urun") or "").strip() for r in (all_reqs_res.data or [])}
    except Exception:
        ordered_products = set()

    for urun in product_names:
        if urun and urun not in ordered_products:
            anomalies.append({
                "id": f"no-demand-{urun}",
                "title": f"{urun} için hiç sipariş yok",
                "description": f"{urun} stok sistemine kayıtlı ancak bugüne kadar hiç sipariş alınmadı.",
                "severity": "bilgi",
                "category": "Talep",
                "source": "Ürün-Sipariş Eşleşme",
                "recommendation": "Ürünü aktif müşterilere tanıtın veya fiyatlandırmayı gözden geçirin.",
            })

    # ── 4. Gecikmiş sipariş spike'ı ─────────────────────────────
    open_statuses = {"bekliyor", "hazirlaniyor", "yolda"}
    open_orders   = [r for r in this_week_rows if r.get("durum") in open_statuses]
    delayed       = [r for r in this_week_rows if r.get("durum") in ("gecikti", "gecikmiş")]

    if open_orders and len(delayed) / max(len(open_orders), 1) >= 0.25:
        pct_delayed = round(len(delayed) / len(open_orders) * 100)
        anomalies.append({
            "id": "delayed-orders-spike",
            "title": f"Gecikmiş sipariş oranı yüksek: %{pct_delayed}",
            "description": (
                f"Bu haftaki açık siparişlerin %{pct_delayed}'i (%{len(delayed)}/{len(open_orders)}) "
                "gecikmiş durumda."
            ),
            "severity": "yuksek",
            "category": "Lojistik",
            "source": "Sipariş Analizi",
            "recommendation": "Lojistik süreçleri ve teslimat kanallarını gözden geçirin.",
        })

    # ── 5. STK uyarıları (stk_alerts tablosu) ───────────────────
    try:
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
                "description": f"{alert.get('emoji', '')} {alert.get('urun', '')} — {alert.get('kalan_gun_mesaj', '')}. {line}".strip(),
                "severity": "yuksek",
                "category": "STK",
                "source": "STK İzleme",
                "recommendation": "Riskli ürünü hızlıca kardeş üretici ile eşleştirin.",
            })
    except Exception:
        pass

    # ── 6. AI log anomalileri ────────────────────────────────────
    try:
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
    except Exception:
        pass

    # Tekrar eden id'leri temizle, öncelik sırala
    seen: set[str] = set()
    unique: list[dict] = []
    for a in sorted(anomalies, key=lambda x: SEVERITY_ORDER.get(x["severity"], 4)):
        if a["id"] not in seen:
            seen.add(a["id"])
            unique.append(a)

    return {"date": today_str, "anomalies": unique}
