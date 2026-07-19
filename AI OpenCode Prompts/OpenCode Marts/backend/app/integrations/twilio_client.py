from twilio.rest import Client
from app.core.config import get_settings
from app.core.logging_ import get_logger

settings = get_settings()
logger = get_logger(__name__)

_client: Client | None = None


def get_twilio_client() -> Client | None:
    global _client
    if _client is None and settings.twilio_account_sid and settings.twilio_auth_token:
        _client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    return _client


async def send_whatsapp_message(to: str, body: str) -> bool:
    client = get_twilio_client()
    if not client:
        logger.warning("Twilio not configured")
        return False
    try:
        client.messages.create(from_=f"whatsapp:{settings.twilio_whatsapp_number}", body=body, to=f"whatsapp:{to}")
        return True
    except Exception as e:
        logger.error("Twilio send error", exc_info=e)
        return False
