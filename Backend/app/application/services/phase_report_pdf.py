"""BACK-06 / D-58, D-59, D-60 — fpdf2 programmatic PDF composition.

Sync rendering in request thread. <2MB, <500ms target per D-60.

Unicode font fallback: if no system Unicode font is found, falls back to Helvetica
(Latin-1 only). In that case, non-Latin-1 characters are replaced with '?' to prevent
FPDFUnicodeEncodingException. Visual fidelity of Turkish diacritics requires a Unicode
font (macOS/Linux) — see 09-VALIDATION.md manual verification section.
"""
from pathlib import Path
from fpdf import FPDF
from app.domain.entities.phase_report import PhaseReport


# Unicode font candidates — try in order, fall back to Helvetica.
# Matches reports.py pattern.
_FONT_CANDIDATES = [
    "/Library/Fonts/Arial Unicode.ttf",  # macOS
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux (debian/ubuntu)
    "C:\\Windows\\Fonts\\arialuni.ttf",  # Windows (Arial Unicode MS)
]


def _resolve_font(pdf: FPDF) -> str:
    for candidate in _FONT_CANDIDATES:
        if Path(candidate).exists():
            pdf.add_font("uni", fname=candidate)
            return "uni"
    return "Helvetica"


def _safe(text: str, is_unicode_font: bool) -> str:
    """When using Helvetica (Latin-1 encoding), replace non-encodable chars with '?'.
    With a Unicode font, return text unchanged."""
    if is_unicode_font:
        return text
    return text.encode("latin-1", errors="replace").decode("latin-1")


def render_pdf(report: PhaseReport, project_name: str, phase_name: str) -> bytes:
    """Compose a phase evaluation PDF. Returns bytes ready for StreamingResponse."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    font = _resolve_font(pdf)
    is_unicode = font != "Helvetica"

    _render_header(pdf, font, is_unicode, project_name, phase_name, report)
    _render_summary(pdf, font, is_unicode, report)
    _render_tasks_section(pdf, font, is_unicode, report)
    _render_reflection(pdf, font, is_unicode, report)

    return bytes(pdf.output())


def _render_header(pdf: FPDF, font: str, is_unicode: bool, project_name: str, phase_name: str, report: PhaseReport) -> None:
    pdf.set_font(font, size=16, style="B")
    pdf.cell(0, 10, "Faz Degerlendirme Raporu", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=11)
    pdf.cell(0, 7, _safe(f"Proje: {project_name}", is_unicode), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, _safe(f"Faz: {phase_name}", is_unicode), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(
        0, 7,
        f"Dongu: {report.cycle_number} | Revizyon: {report.revision}",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(5)


def _render_summary(pdf: FPDF, font: str, is_unicode: bool, report: PhaseReport) -> None:
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Ozet Metrikler", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=10)

    def _row(label: str, value):
        pdf.cell(0, 6, f"{label}: {value if value is not None else '---'}", new_x="LMARGIN", new_y="NEXT")

    _row("Toplam Gorev", report.summary_task_count)
    _row("Tamamlanan", report.summary_done_count)
    _row("Tasınan" if is_unicode else "Tasinan", report.summary_moved_count)
    _row("Sure (gun)", report.summary_duration_days)
    pdf.ln(4)


def _render_tasks_section(pdf: FPDF, font: str, is_unicode: bool, report: PhaseReport) -> None:
    if not report.completed_tasks_notes:
        return
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Gorev Notları" if is_unicode else "Gorev Notlari", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=9)
    for task_id, note in report.completed_tasks_notes.items():
        # Use pdf.epw (effective page width) instead of 0 to avoid
        # "Not enough horizontal space" error in fpdf2 2.8.x (Rule 1 fix)
        pdf.multi_cell(pdf.epw, 5, _safe(f"Task {task_id}: {note}", is_unicode))
    pdf.ln(3)


def _render_reflection(pdf: FPDF, font: str, is_unicode: bool, report: PhaseReport) -> None:
    pdf.set_font(font, size=12, style="B")
    pdf.cell(0, 8, "Degerlendirme", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=10)
    if report.issues:
        pdf.set_font(font, size=10, style="B")
        pdf.cell(0, 6, "Sorunlar:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(font, size=10)
        pdf.multi_cell(pdf.epw, 5, _safe(report.issues, is_unicode))
        pdf.ln(2)
    if report.lessons:
        pdf.set_font(font, size=10, style="B")
        pdf.cell(0, 6, "Dersler:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(font, size=10)
        pdf.multi_cell(pdf.epw, 5, _safe(report.lessons, is_unicode))
        pdf.ln(2)
    if report.recommendations:
        pdf.set_font(font, size=10, style="B")
        pdf.cell(0, 6, "Oneriler:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(font, size=10)
        pdf.multi_cell(pdf.epw, 5, _safe(report.recommendations, is_unicode))
