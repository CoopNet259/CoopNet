from __future__ import annotations
from fastapi import APIRouter
from database import get_supabase

router = APIRouter(prefix="/api/producers", tags=["producers"])


@router.get("")
async def get_producers():
    sb = get_supabase()
    res = sb.table("producers").select("*").order("id", ascending=True).execute()
    return res.data or []
