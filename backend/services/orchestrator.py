from __future__ import annotations
import asyncio
from typing import Any
import google.generativeai as genai
from services.gemini_client import get_model
from tools.definitions import TOOL_DEFINITIONS
from tools.handlers import execute_tool_call
from services.logger import log_ai
from models.schemas import ChatMessage

SYSTEM_PROMPT = """Sen CoopFlow AI'sın — bir kooperatifin iş akışını yöneten yapay zeka ajanısın.

Görevin: Kullanıcının sorusunu anla, gerekli tool'ları çağırarak gerçek veriye bak, sonra net ve kısa Türkçe yanıt ver.

Kurallar:
- Önce tool çağır, veriyi gör, sonra yorum yap. Asla tahmin etme.
- Stok kritikse bunu açıkça belirt ve ne yapılması gerektiğini söyle.
- Yanıtların kısa ve eyleme dönüştürülebilir olsun.
- Önceki mesajları hatırlıyorsun, tutarlı yanıt ver."""


async def run_agent(user_message: str, history: list[ChatMessage] = []) -> dict[str, Any]:
    model = get_model(complex=False, system_instruction=SYSTEM_PROMPT)

    gemini_history = [
        {"role": msg.role, "parts": [{"text": msg.text}]}
        for msg in history[-10:]
    ]

    chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=False)
    tool_calls: list[dict[str, Any]] = []

    response = await asyncio.to_thread(chat.send_message, user_message, tools=[TOOL_DEFINITIONS])

    for _ in range(5):
        fn_calls = response.candidates[0].content.parts if response.candidates else []
        fn_calls = [p for p in fn_calls if hasattr(p, "function_call") and p.function_call.name]

        if not fn_calls:
            break

        tool_results = []
        for part in fn_calls:
            fn = part.function_call
            args = dict(fn.args)
            result = execute_tool_call(fn.name, args)
            tool_calls.append({"tool": fn.name, "args": args, "result": result})
            tool_results.append(
                genai.protos.Part(
                    function_response=genai.protos.FunctionResponse(
                        name=fn.name,
                        response={"result": result},
                    )
                )
            )

        response = await asyncio.to_thread(chat.send_message, tool_results)

    text = response.text if hasattr(response, "text") else ""
    result = {"text": text, "toolCalls": tool_calls}

    log_ai("chat", user_message, result)
    return result
