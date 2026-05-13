from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    supabase_url: str
    supabase_anon_key: str
    cron_secret: str = ""

    # Twilio WhatsApp (opsiyonel — boş bırakılırsa simülasyon modunda çalışır)
    twilio_account_sid:    str = ""
    twilio_auth_token:     str = ""
    twilio_whatsapp_from:  str = ""   # örn. +14155238886
    manager_whatsapp:      str = ""   # Yöneticinin WhatsApp numarası (bildirim için)

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
