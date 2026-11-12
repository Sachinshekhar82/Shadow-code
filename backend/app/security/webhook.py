import hmac
import hashlib
import logging
from fastapi import HTTPException, Header, Request

from backend.app.core.config import settings

logger = logging.getLogger("shadow_code.security.webhook")

async def verify_github_webhook_signature(
    request: Request,
    x_hub_signature_256: str = Header(None)
) -> bytes:
    """
    Validates GitHub webhook payload against HMAC-SHA256 signature
    using GITHUB_WEBHOOK_SECRET.
    """
    body = await request.body()
    
    # If no secret is configured or header missing in dev mode, log warning
    if not settings.GITHUB_WEBHOOK_SECRET or not x_hub_signature_256:
        if settings.DEBUG:
            logger.warning("Debug mode: Webhook signature verification bypassed.")
            return body
        raise HTTPException(status_code=401, detail="Missing X-Hub-Signature-256 header")

    if not x_hub_signature_256.startswith("sha256="):
        raise HTTPException(status_code=400, detail="Invalid signature format. Must start with sha256=")

    signature = x_hub_signature_256.split("sha256=")[1]
    expected = hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode("utf-8"),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        logger.warning("Invalid GitHub webhook signature received.")
        raise HTTPException(status_code=403, detail="Invalid HMAC-SHA256 webhook signature")

    return body
