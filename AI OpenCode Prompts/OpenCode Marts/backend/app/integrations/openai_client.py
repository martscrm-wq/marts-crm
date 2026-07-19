from openai import AsyncOpenAI
from app.core.config import get_settings
from app.core.logging_ import get_logger

settings = get_settings()
logger = get_logger(__name__)

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def get_ai_response(message: str, system_prompt: str, context: str, locale: str = "en") -> tuple[str, int]:
    if not settings.openai_api_key:
        return f"[AI Disabled - No API Key] Echo: {message}", 0

    try:
        client = get_client()
        lang_instruction = f"Respond in the user's language (locale: {locale})."
        full_system = "\n".join(filter(None, [system_prompt, context and f"Context:\n{context}", lang_instruction]))
        response = await client.responses.create(
            model="gpt-4o",
            instructions=full_system or "You are a helpful AI assistant.",
            input=message,
        )
        tokens = response.usage.total_tokens if response.usage else 0
        return response.output_text, tokens
    except Exception as e:
        logger.error("OpenAI API error", exc_info=e)
        return f"Sorry, I encountered an error processing your request.", 0
