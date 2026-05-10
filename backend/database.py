from supabase import create_client, Client
from config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            settings.next_public_supabase_url,
            settings.next_public_supabase_anon_key,
        )
    return _client
