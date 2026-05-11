from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    next_public_supabase_url: str
    next_public_supabase_anon_key: str
    cron_secret: str = ""

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
