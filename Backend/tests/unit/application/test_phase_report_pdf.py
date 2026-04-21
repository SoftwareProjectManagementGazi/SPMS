"""BACK-06 / D-58/59/60: phase_report_pdf service smoke tests."""
from app.application.services.phase_report_pdf import render_pdf
from app.domain.entities.phase_report import PhaseReport


def test_render_produces_valid_pdf_bytes():
    r = PhaseReport(
        project_id=1, phase_id="nd_a1b2c3d4e5", cycle_number=1, revision=1,
        summary_task_count=10, summary_done_count=8, summary_moved_count=2,
        summary_duration_days=14,
        issues="Testing issues text", lessons="Testing lessons",
        recommendations="Testing recommendations",
    )
    pdf_bytes = render_pdf(r, project_name="Test Project", phase_name="Tasarım")
    assert isinstance(pdf_bytes, bytes) and len(pdf_bytes) > 100
    # PDF magic bytes
    assert pdf_bytes.startswith(b"%PDF")


def test_render_handles_empty_optional_fields():
    r = PhaseReport(project_id=1, phase_id="nd_a1b2c3d4e5")
    pdf_bytes = render_pdf(r, project_name="P", phase_name="Faz")
    assert pdf_bytes.startswith(b"%PDF")


def test_render_handles_turkish_diacritics():
    """Does not crash on Turkish characters (visual fidelity is manual check per 09-VALIDATION.md)."""
    r = PhaseReport(
        project_id=1, phase_id="nd_a1b2c3d4e5",
        issues="Geliştirme sürecinde karşılaşılan sorunlar: çözümlenmiş değildir.",
        lessons="Ekip öğrenimi ve süreç iyileştirmeleri uygulandı.",
        recommendations="İleri safha önerileri: tasarım, geliştirme, test aşamalarında iyileştirme.",
    )
    pdf_bytes = render_pdf(r, project_name="Türkçe Projesi", phase_name="Gereksinim Analizi")
    assert pdf_bytes.startswith(b"%PDF")


def test_render_handles_completed_tasks_notes():
    r = PhaseReport(
        project_id=1, phase_id="nd_a1b2c3d4e5",
        completed_tasks_notes={"task_101": "Implemented", "task_102": "Reviewed"},
    )
    pdf_bytes = render_pdf(r, "P", "F")
    assert pdf_bytes.startswith(b"%PDF")
