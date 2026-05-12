from __future__ import annotations
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from database import get_supabase
from tools.handlers import assign_task, send_notification, log_agent_decision
from services.logger import log_ai
from config import settings

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


# ── Yönetici: Bekleyen onayları listele ──────────────────────────────────────

@router.get("")
async def list_approvals():
    """Bekleyen tüm yönetici onaylarını getir."""
    sb = get_supabase()
    res = (
        sb.table("pending_approvals")
        .select("*")
        .eq("durum", "bekliyor")
        .order("olusturuldu", desc=False)
        .execute()
    )
    return res.data or []


# ── Yönetici: Onayla ─────────────────────────────────────────────────────────

@router.post("/{approval_id}/approve")
async def approve(approval_id: int):
    """Yönetici talebi onaylar → depo görevi açılır, üreticiye kabul mesajı yazılır."""
    sb = get_supabase()
    res = sb.table("pending_approvals").select("*").eq("id", approval_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Onay kaydı bulunamadı.")

    row = res.data[0]
    if row["durum"] != "bekliyor":
        raise HTTPException(status_code=400, detail=f"Bu talep zaten '{row['durum']}' durumunda.")

    urun        = row["urun_adi"]
    miktar      = row["kabul_miktari"] or row["talep_miktari"]
    birim       = row["birim"]
    uretici_adi = row["uretici_adi"]

    # Depo görevi oluştur
    task_result = assign_task(
        role="warehouse",
        title=f"{urun} hasat teslimi — {miktar} {birim}",
        description=f"Yönetici onaylı teslimat. Üretici: {uretici_adi}. Orijinal talep: {row['talep_miktari']} {birim}.",
        priority="medium",
        product_name=urun,
    )

    # Bildirimler
    send_notification(
        role="warehouse",
        title=f"Onaylı teslim: {urun}",
        message=f"{uretici_adi}'dan {miktar} {birim} {urun} teslim alınacak. Yönetici onayladı.",
        type="info",
    )

    # Kaydı güncelle
    sb.table("pending_approvals").update({
        "durum": "onaylandi",
        "guncellendi": datetime.now(timezone.utc).isoformat(),
    }).eq("id", approval_id).execute()

    log_agent_decision(
        ajan="manager_approval",
        karar="onaylandi",
        aciklama=f"Yönetici {urun} talebini onayladı. Depo görevi oluşturuldu.",
        tetikleyen=f"approval_id={approval_id}",
        meta={"approval_id": approval_id, "urun": urun, "miktar": miktar, "task_id": task_result.get("task_id")},
    )

    return {
        "status": "onaylandi",
        "approval_id": approval_id,
        "task_id": task_result.get("task_id"),
        "message": f"{urun} talebi onaylandı, depo görevi oluşturuldu.",
        # Frontend bu mesajı WhatsApp'tan üreticiye iletebilir
        "whatsapp_reply": (
            f"✅ Merhaba *{uretici_adi}*!\n"
            f"{miktar} {birim} *{urun}* teslimatınız yöneticimiz tarafından onaylandı. "
            f"Depo görevlimiz sizinle iletişime geçecek.\n\n"
            f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
        ),
    }


# ── Yönetici: Reddet ─────────────────────────────────────────────────────────

@router.post("/{approval_id}/reject")
async def reject(approval_id: int):
    """Yönetici talebi reddeder → üreticiye red mesajı hazırlanır."""
    sb = get_supabase()
    res = sb.table("pending_approvals").select("*").eq("id", approval_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Onay kaydı bulunamadı.")

    row = res.data[0]
    if row["durum"] != "bekliyor":
        raise HTTPException(status_code=400, detail=f"Bu talep zaten '{row['durum']}' durumunda.")

    sb.table("pending_approvals").update({
        "durum": "reddedildi",
        "guncellendi": datetime.now(timezone.utc).isoformat(),
    }).eq("id", approval_id).execute()

    log_agent_decision(
        ajan="manager_approval",
        karar="reddedildi",
        aciklama=f"Yönetici {row['urun_adi']} talebini reddetti.",
        tetikleyen=f"approval_id={approval_id}",
        meta={"approval_id": approval_id, "urun": row["urun_adi"]},
    )

    return {
        "status": "reddedildi",
        "approval_id": approval_id,
        "whatsapp_reply": (
            f"ℹ️ Merhaba *{row['uretici_adi']}*!\n"
            f"{row['talep_miktari']} {row['birim']} *{row['urun_adi']}* talebiniz bu dönem için "
            f"karşılanamıyor. Ürününüzü başka kanallardan değerlendirebilirsiniz.\n\n"
            f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
        ),
    }


# ── CRON: 12 Saat Timeout Ajanı ──────────────────────────────────────────────

@router.get("/timeout-check")
async def timeout_check(request: Request):
    """
    Her saat çalışır. 12 saati geçen 'bekliyor' kayıtları otomatik reddedilir,
    üreticiye red bilgisi hazırlanır.
    Cron secret ile korunur.
    """
    secret = request.headers.get("x-cron-secret")
    if settings.cron_secret and secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Yetkisiz")

    sb   = get_supabase()
    now  = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=12)).isoformat()

    # 12 saatten eski bekleyenler
    res = (
        sb.table("pending_approvals")
        .select("*")
        .eq("durum", "bekliyor")
        .lt("olusturuldu", cutoff)
        .execute()
    )
    expired = res.data or []

    timed_out = []
    for row in expired:
        sb.table("pending_approvals").update({
            "durum": "zaman_asimi",
            "guncellendi": now.isoformat(),
        }).eq("id", row["id"]).execute()

        log_agent_decision(
            ajan="timeout_agent",
            karar="zaman_asimi",
            aciklama=f"{row['urun_adi']} talebi 12 saat yanıtsız kaldı, otomatik reddedildi.",
            tetikleyen=f"approval_id={row['id']}",
            meta={"approval_id": row["id"], "uretici": row["uretici_adi"], "urun": row["urun_adi"]},
        )

        timed_out.append({
            "approval_id": row["id"],
            "uretici_adi": row["uretici_adi"],
            "uretici_telefon": row["uretici_telefon"],
            "urun": row["urun_adi"],
            # Frontend/Twilio bu mesajı üreticiye WhatsApp ile gönderebilir
            "whatsapp_reply": (
                f"ℹ️ Merhaba *{row['uretici_adi']}*!\n"
                f"{row['talep_miktari']} {row['birim']} *{row['urun_adi']}* talebiniz "
                f"12 saat içinde yanıtlanamadı ve sistem tarafından kapatıldı. "
                f"Ürününüzü başka kanallardan değerlendirebilirsiniz.\n\n"
                f"_CoopNet AI — Kooperatif Yönetim Sistemi_"
            ),
        })

    result = {
        "checked_at": now.isoformat(),
        "timed_out_count": len(timed_out),
        "timed_out": timed_out,
    }
    log_ai("timeout_check", "cron:timeout_check", result)
    return result
