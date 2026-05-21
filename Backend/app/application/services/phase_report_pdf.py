"""BACK-06 / D-58, D-59, D-60 — fpdf2 programmatic PDF composition.

Professional monochrome layout: single accent color, clean typography,
minimal chrome.  Suitable for business / corporate use.

Sync rendering in request thread. <2MB, <500ms target per D-60.

Unicode font: Reports v2 manual QA fixed the Windows-only failure
(arialuni.ttf was the only Windows candidate and it's not installed by
default on Win 10+). Cross-platform resolution + transliteration
fallback now lives in `app.infrastructure.pdf.unicode_font`, shared
with `/reports/export/pdf`. When no Unicode TTF is present on the host
Turkish characters transliterate to ASCII so the export still works.
"""
from datetime import datetime
from fpdf import FPDF
from app.domain.entities.phase_report import PhaseReport
from app.infrastructure.pdf.unicode_font import find_unicode_font, to_ascii

# ── Layout ─────────────────────────────────────────────────────────────────
_MARGIN = 20
_PAGE_W = 210
_PAGE_H = 297
_CW     = _PAGE_W - 2 * _MARGIN  # 170 mm effective width

# ── Palette — one accent, otherwise grays ──────────────────────────────────
_C_ACCENT  = (30,  64, 175)   # blue-800  — accent only
_C_BLACK   = (17,  24,  39)   # gray-900  — headings
_C_BODY    = (55,  65,  81)   # gray-700  — body text
_C_MUTED   = (107, 114, 128)  # gray-500  — labels / captions
_C_RULE    = (209, 213, 219)  # gray-300  — dividers
_C_SURFACE = (249, 250, 251)  # gray-50   — alternate bg
_C_WHITE   = (255, 255, 255)


# ── Low-level helpers ──────────────────────────────────────────────────────

def _resolve_font(pdf: FPDF) -> str:
    """Resolve the document's primary font.

    Delegates the host-OS candidate sweep to the shared
    `find_unicode_font()` helper. When a TTF is available we register
    both the regular and bold styles against the same file — fpdf2
    accepts this; the bold style won't render bolder than regular if
    the file has no bold variant, but Turkish glyphs still render
    correctly which is the whole point of this resolution.
    """
    path = find_unicode_font()
    if path:
        pdf.add_font("uni", style="",  fname=path)
        pdf.add_font("uni", style="B", fname=path)
        return "uni"
    return "Helvetica"


def _safe(text: str, is_unicode: bool) -> str:
    """Sanitize text for the chosen font.

    - When the resolved font is the Unicode TTF we pass through verbatim.
    - When we fell back to Helvetica (Latin-1 only) we Turkish→ASCII
      transliterate via the shared helper. Reading "Cozum" instead of
      "Çözüm" is preferable to either '?' replacement or a 500.
    """
    if is_unicode:
        return text
    return to_ascii(text)


def _rule(pdf: FPDF, lw: float = 0.25) -> None:
    pdf.set_draw_color(*_C_RULE)
    pdf.set_line_width(lw)
    pdf.line(_MARGIN, pdf.get_y(), _MARGIN + _CW, pdf.get_y())
    pdf.ln(4)


# ── Section renderers ──────────────────────────────────────────────────────

def _render_header(
    pdf: FPDF, font: str, u: bool,
    project_name: str, phase_name: str, report: PhaseReport,
) -> None:
    # Thin top accent line
    pdf.set_fill_color(*_C_ACCENT)
    pdf.set_draw_color(*_C_ACCENT)
    pdf.rect(0, 0, _PAGE_W, 3, style="F")

    # Document title
    pdf.set_xy(_MARGIN, 10)
    pdf.set_text_color(*_C_BLACK)
    pdf.set_font(font, size=18, style="B")
    title = "Faz Değerlendirme Raporu" if u else "Faz Degerlendirme Raporu"
    pdf.cell(_CW, 11, _safe(title, u), new_x="LMARGIN", new_y="NEXT")

    # Project · Phase on same line
    pdf.set_font(font, size=10)
    pdf.set_text_color(*_C_MUTED)
    pdf.set_x(_MARGIN)
    pdf.cell(_CW, 6, _safe(f"{project_name}  ·  {phase_name}", u), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)
    _rule(pdf, lw=0.5)

    # Metadata row — 4 columns
    now_str = datetime.utcnow().strftime("%d.%m.%Y")
    dur     = report.summary_duration_days or 0
    dur_lbl = f"{dur} gün" if u else f"{dur} gun"
    meta = [
        ("Tarih",                                              now_str),
        ("Döngü"  if u else "Dongu",                          str(report.cycle_number)),
        ("Revizyon",                                           f"Rev {report.revision}"),
        ("Süre"   if u else "Sure",                            dur_lbl),
    ]
    col_w = _CW / len(meta)
    y_meta = pdf.get_y()
    for i, (lbl, val) in enumerate(meta):
        x = _MARGIN + i * col_w
        pdf.set_xy(x, y_meta)
        pdf.set_font(font, size=7.5)
        pdf.set_text_color(*_C_MUTED)
        pdf.cell(col_w, 4.5, _safe(lbl.upper(), u))
        pdf.set_xy(x, y_meta + 4.5)
        pdf.set_font(font, size=10, style="B")
        pdf.set_text_color(*_C_BLACK)
        pdf.cell(col_w, 6, _safe(val, u))

    pdf.set_xy(_MARGIN, y_meta + 12)
    _rule(pdf)


def _render_metrics(
    pdf: FPDF, font: str, u: bool, report: PhaseReport,
) -> None:
    total   = report.summary_task_count  or 0
    done    = report.summary_done_count  or 0
    moved   = report.summary_moved_count or 0
    success = round((done / total) * 100) if total > 0 else 0

    pdf.set_font(font, size=8, style="B")
    pdf.set_text_color(*_C_MUTED)
    section_lbl = "ÖZET METRİKLER" if u else "OZET METRIKLER"
    pdf.set_x(_MARGIN)
    pdf.cell(_CW, 5, _safe(section_lbl, u), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    cards = [
        ("Toplam Görev"  if u else "Toplam Gorev",  str(total)),
        ("Tamamlanan",                               str(done)),
        ("Taşınan"       if u else "Tasinan",         str(moved)),
        ("Başarı"        if u else "Basari",           f"%{success}"),
    ]
    n     = len(cards)
    gap   = 5
    cw    = (_CW - gap * (n - 1)) / n
    y0    = pdf.get_y()
    ch    = 20

    for i, (label, value) in enumerate(cards):
        x = _MARGIN + i * (cw + gap)

        # Light gray box
        pdf.set_fill_color(*_C_SURFACE)
        pdf.set_draw_color(*_C_RULE)
        pdf.set_line_width(0.2)
        pdf.rect(x, y0, cw, ch, style="FD")

        # Accent top border on first card only (visual anchor)
        if i == 0:
            pdf.set_fill_color(*_C_ACCENT)
            pdf.set_draw_color(*_C_ACCENT)
            pdf.rect(x, y0, cw, 1.5, style="F")

        # Value
        pdf.set_xy(x, y0 + 3)
        pdf.set_font(font, size=15, style="B")
        pdf.set_text_color(*_C_BLACK)
        pdf.cell(cw, 9, _safe(value, u), align="C")

        # Label
        pdf.set_xy(x, y0 + 12.5)
        pdf.set_font(font, size=7.5)
        pdf.set_text_color(*_C_MUTED)
        pdf.cell(cw, 5, _safe(label, u), align="C")

    pdf.set_xy(_MARGIN, y0 + ch + 6)

    # Progress bar
    if total > 0:
        pct = done / total
        bar_y = pdf.get_y()

        # Bar label
        pdf.set_font(font, size=8)
        pdf.set_text_color(*_C_MUTED)
        lbl_text = "Tamamlanma Oranı" if u else "Tamamlanma Orani"
        pdf.set_x(_MARGIN)
        pdf.cell(_CW - 15, 5, _safe(lbl_text, u))
        pdf.set_font(font, size=8, style="B")
        pdf.set_text_color(*_C_BLACK)
        pdf.cell(15, 5, f"%{round(pct * 100)}", align="R")
        pdf.set_x(_MARGIN)
        pdf.ln(5.5)

        ry = pdf.get_y()
        # Track
        pdf.set_fill_color(*_C_RULE)
        pdf.set_draw_color(*_C_RULE)
        pdf.rect(_MARGIN, ry, _CW, 3, style="F")
        # Fill — accent for ≥70%, gray otherwise
        fill_color = _C_ACCENT if pct >= 0.7 else _C_MUTED
        pdf.set_fill_color(*fill_color)
        pdf.set_draw_color(*fill_color)
        pdf.rect(_MARGIN, ry, max(2, _CW * pct), 3, style="F")

        pdf.set_xy(_MARGIN, ry + 8)

    pdf.ln(2)
    _rule(pdf)


def _render_section(
    pdf: FPDF, font: str, u: bool,
    heading: str, content: str | None,
) -> None:
    # Heading
    pdf.set_x(_MARGIN)
    pdf.set_font(font, size=8, style="B")
    pdf.set_text_color(*_C_MUTED)
    pdf.cell(_CW, 5, _safe(heading.upper(), u), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    text = (content or "").strip()
    if not text:
        pdf.set_x(_MARGIN)
        pdf.set_font(font, size=9)
        pdf.set_text_color(*_C_MUTED)
        empty = "— bilgi girilmedi —" if u else "-- bilgi girilmedi --"
        pdf.cell(_CW, 6, _safe(empty, u), new_x="LMARGIN", new_y="NEXT")
    else:
        # Left-indented with thin accent rule
        bar_x = _MARGIN
        pdf.set_fill_color(*_C_ACCENT)
        pdf.set_draw_color(*_C_ACCENT)

        # Capture start Y; draw text first, then draw bar with measured height
        y_start = pdf.get_y()
        pdf.set_xy(_MARGIN + 6, y_start)
        pdf.set_font(font, size=9.5)
        pdf.set_text_color(*_C_BODY)
        pdf.multi_cell(_CW - 6, 5.5, _safe(text, u))
        y_end = pdf.get_y()

        bar_h = max(5.5, y_end - y_start)
        pdf.set_fill_color(*_C_ACCENT)
        pdf.set_draw_color(*_C_ACCENT)
        pdf.rect(bar_x, y_start, 1.5, bar_h, style="F")

    pdf.ln(6)


def _render_evaluation(
    pdf: FPDF, font: str, u: bool, report: PhaseReport,
) -> None:
    eval_lbl = "DEĞERLENDİRME" if u else "DEGERLENDIRME"
    pdf.set_x(_MARGIN)
    pdf.set_font(font, size=11, style="B")
    pdf.set_text_color(*_C_BLACK)
    pdf.cell(_CW, 7, _safe(eval_lbl, u), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    sections = [
        ("Karşılaşılan Sorunlar" if u else "Karsilasilan Sorunlar", report.issues),
        ("Öğrenilen Dersler"     if u else "Ogrenilen Dersler",     report.lessons),
        ("Sonraki Faz Önerileri" if u else "Sonraki Faz Onerileri", report.recommendations),
    ]
    for heading, content in sections:
        _render_section(pdf, font, u, heading, content)


def _render_tasks_section(
    pdf: FPDF, font: str, u: bool, report: PhaseReport,
) -> None:
    if not report.completed_tasks_notes:
        return

    _rule(pdf)
    task_lbl = "GÖREV NOTLARI" if u else "GOREV NOTLARI"
    pdf.set_x(_MARGIN)
    pdf.set_font(font, size=11, style="B")
    pdf.set_text_color(*_C_BLACK)
    pdf.cell(_CW, 7, _safe(task_lbl, u), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    for task_id, note in report.completed_tasks_notes.items():
        y = pdf.get_y()
        # Small square bullet
        pdf.set_fill_color(*_C_ACCENT)
        pdf.set_draw_color(*_C_ACCENT)
        pdf.rect(_MARGIN, y + 1.5, 2, 2, style="F")

        pdf.set_xy(_MARGIN + 5, y)
        pdf.set_font(font, size=8.5, style="B")
        pdf.set_text_color(*_C_BLACK)
        pdf.cell(16, 5, _safe(f"#{task_id}", u))

        pdf.set_font(font, size=8.5)
        pdf.set_text_color(*_C_BODY)
        pdf.multi_cell(_CW - 21, 5, _safe(note, u))
        pdf.ln(1)


def _render_footer(pdf: FPDF, font: str, u: bool) -> None:
    footer_y = _PAGE_H - 14

    # Thin rule
    pdf.set_draw_color(*_C_RULE)
    pdf.set_line_width(0.25)
    pdf.line(_MARGIN, footer_y, _MARGIN + _CW, footer_y)

    pdf.set_xy(_MARGIN, footer_y + 2)
    pdf.set_font(font, size=7)
    pdf.set_text_color(*_C_MUTED)
    left = "SPMS — Yazilim Proje Yonetim Sistemi"
    pdf.cell(_CW / 2, 5, _safe(left, u))

    pdf.set_x(_MARGIN + _CW / 2)
    pdf.set_font(font, size=7)
    page_lbl = "Sayfa 1 / 1"
    pdf.cell(_CW / 2, 5, page_lbl, align="R")


# ── Public entry point ─────────────────────────────────────────────────────

def render_pdf(report: PhaseReport, project_name: str, phase_name: str) -> bytes:
    """Compose a professional phase evaluation PDF. Returns bytes."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(_MARGIN, _MARGIN, _MARGIN)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    font = _resolve_font(pdf)
    u    = font != "Helvetica"

    _render_header(pdf, font, u, project_name, phase_name, report)
    _render_metrics(pdf, font, u, report)
    _render_evaluation(pdf, font, u, report)
    _render_tasks_section(pdf, font, u, report)
    _render_footer(pdf, font, u)

    return bytes(pdf.output())
