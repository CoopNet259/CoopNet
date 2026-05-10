import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.gemini_api_key)


def get_model(complex: bool = False, system_instruction: str | None = None) -> genai.GenerativeModel:
    model_name = "gemini-2.5-pro" if complex else "gemini-2.5-flash"
    kwargs: dict = {"model_name": model_name}
    if system_instruction:
        kwargs["system_instruction"] = system_instruction
    return genai.GenerativeModel(**kwargs)
