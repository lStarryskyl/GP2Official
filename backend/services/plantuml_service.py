"""PlantUML rendering service — uses RapidAPI endpoint with public server fallback."""

from __future__ import annotations

import os
import zlib
import logging
from typing import Optional

logger = logging.getLogger(__name__)

PLANTUML_SERVER = "https://www.plantuml.com/plantuml"
RAPIDAPI_HOST = os.environ.get("PLANTUML_API_HOST", "plantuml-api.p.rapidapi.com")
RAPIDAPI_KEY = os.environ.get("PLANTUML_API_KEY", "")


# ── Encoding helpers (unchanged) ─────────────────────────────────────────────

def _encode_6bit(b: int) -> str:
    if b < 10:
        return chr(48 + b)
    b -= 10
    if b < 26:
        return chr(65 + b)
    b -= 26
    if b < 26:
        return chr(97 + b)
    b -= 26
    if b == 0:
        return "-"
    if b == 1:
        return "_"
    return "?"


def _append_3bytes(b1: int, b2: int, b3: int) -> str:
    c1 = b1 >> 2
    c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
    c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
    c4 = b3 & 0x3F
    return "".join([
        _encode_6bit(c1 & 0x3F),
        _encode_6bit(c2 & 0x3F),
        _encode_6bit(c3 & 0x3F),
        _encode_6bit(c4 & 0x3F),
    ])


def encode_plantuml(plantuml_text: str) -> str:
    """Encode PlantUML text for use in server URLs."""
    if not plantuml_text:
        return ""
    data = plantuml_text.encode("utf-8")
    compressed = zlib.compress(data)[2:-4]
    res = []
    for i in range(0, len(compressed), 3):
        b1 = compressed[i]
        b2 = compressed[i + 1] if i + 1 < len(compressed) else 0
        b3 = compressed[i + 2] if i + 2 < len(compressed) else 0
        res.append(_append_3bytes(b1, b2, b3))
    return "".join(res)


def build_plantuml_image_url(plantuml_text: str, fmt: str = "svg") -> str:
    """Return a public PlantUML server URL for the provided code (fallback)."""
    encoded = encode_plantuml(plantuml_text)
    server = PLANTUML_SERVER.rstrip("/")
    return f"{server}/{fmt}/{encoded}"


# ── RapidAPI rendering ────────────────────────────────────────────────────────

async def render_plantuml_png(plantuml_text: str) -> Optional[bytes]:
    """Render PlantUML to PNG using the RapidAPI endpoint.
    Falls back to None if the API key is not configured.
    """
    if not RAPIDAPI_KEY:
        logger.warning("PLANTUML_API_KEY not set — skipping RapidAPI render")
        return None
    try:
        import httpx
        url = f"https://{RAPIDAPI_HOST}/png"
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
            "Content-Type": "text/plain",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, content=plantuml_text.encode("utf-8"), headers=headers)
            resp.raise_for_status()
            return resp.content
    except Exception as exc:
        logger.error(f"RapidAPI PlantUML render failed: {exc}")
        return None


async def render_plantuml_svg(plantuml_text: str) -> Optional[str]:
    """Render PlantUML to SVG string using the RapidAPI endpoint."""
    if not RAPIDAPI_KEY:
        return None
    try:
        import httpx
        url = f"https://{RAPIDAPI_HOST}/svg"
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
            "Content-Type": "text/plain",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, content=plantuml_text.encode("utf-8"), headers=headers)
            resp.raise_for_status()
            return resp.text
    except Exception as exc:
        logger.error(f"RapidAPI PlantUML SVG render failed: {exc}")
        return None


def get_plantuml_url(plantuml_text: str, fmt: str = "svg") -> str:
    """Get the best available URL for a PlantUML diagram.
    Uses RapidAPI if key available, otherwise public server.
    """
    return build_plantuml_image_url(plantuml_text, fmt)
