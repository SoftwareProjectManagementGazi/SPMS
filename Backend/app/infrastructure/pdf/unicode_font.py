"""Cross-platform Unicode TTF font resolver for fpdf2 / PDF exports.

Backend audit Bulgu BE-J + reports.py manual QA: the PDF export endpoints
hardcoded a macOS-only font path (`/Library/Fonts/Arial Unicode.ttf`).
On Windows / Linux the file does not exist → fpdf2 falls back to the
default Helvetica face, which is Latin-1 only → Turkish characters
("ş", "ı", "ğ", "ü", "ö", "ç") raise `FPDFUnicodeEncodingException`
and the export 500s.

This helper sweeps a per-OS candidate list at first-call time and
caches the first match. Tested fallback order:
- Windows: arial → segoeui → calibri (all bundled with every Win 10+
  install and all support full Turkish + WGL4 coverage).
- macOS:   ArialUnicode (legacy install) → Arial → Helvetica.
- Linux:   DejaVuSans → LiberationSans → NotoSans.

When NO candidate is present (extremely minimal Linux containers
without any fonts package), the helper returns None and callers
should fall back to `to_ascii()` transliteration to keep the PDF
producible — quality is degraded but the export still works.

Single-call module-level cache means the disk probe runs once per
process lifetime, not per export.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


# Priority-ordered Unicode-capable TTF candidates per OS family.
# Pure `.ttf` only — fpdf2's TTF parser doesn't accept `.ttc` collections.
_FONT_CANDIDATES = (
    # Windows (every Win 10+ install ships these in C:\Windows\Fonts)
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    # macOS
    "/Library/Fonts/Arial Unicode.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    # Linux (most distros ship one of these via fonts-dejavu / fonts-liberation /
    # fonts-noto packages; minimal containers may have none).
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
)


# Cached probe result. `False` means "probed and nothing found"; `None`
# means "not probed yet".
_cached_font: Optional[str] | bool = None


def find_unicode_font() -> Optional[str]:
    """Return the absolute path of the first available Unicode TTF font.

    Returns None when no candidate exists on disk; callers should
    transliterate via `to_ascii()` in that case.
    """
    global _cached_font
    if _cached_font is False:
        return None
    if isinstance(_cached_font, str):
        return _cached_font
    # First call — sweep candidates.
    # Honor an explicit override so deployments can point at a custom
    # bundled font without code changes.
    override = os.environ.get("SPMS_PDF_FONT")
    if override and Path(override).is_file():
        _cached_font = override
        logger.info("PDF Unicode font resolved via SPMS_PDF_FONT: %s", override)
        return override
    for candidate in _FONT_CANDIDATES:
        p = Path(candidate)
        if p.is_file():
            _cached_font = str(p)
            logger.info("PDF Unicode font resolved: %s", _cached_font)
            return _cached_font
    _cached_font = False
    logger.warning(
        "No Unicode-capable TTF font found on disk; PDF exports will "
        "transliterate Turkish characters to ASCII. Set SPMS_PDF_FONT to "
        "point at a TTF file to enable native Turkish rendering."
    )
    return None


# Turkish → ASCII transliteration map. Last-resort fallback for the
# vanishingly rare case where no Unicode TTF is available.
_TR_TO_ASCII = str.maketrans({
    "ş": "s", "Ş": "S",
    "ı": "i", "İ": "I",
    "ğ": "g", "Ğ": "G",
    "ü": "u", "Ü": "U",
    "ö": "o", "Ö": "O",
    "ç": "c", "Ç": "C",
})


def to_ascii(text: Optional[str]) -> str:
    """Replace Turkish-specific glyphs with their ASCII fallbacks.

    Idempotent. Returns '' for None/empty input (caller can chain safely).
    """
    if not text:
        return ""
    return text.translate(_TR_TO_ASCII)


# Internal hook for tests: reset the module-level cache so a test can
# stub the candidate list and re-run resolution without process restart.
def _reset_cache_for_tests() -> None:  # pragma: no cover
    global _cached_font
    _cached_font = None
