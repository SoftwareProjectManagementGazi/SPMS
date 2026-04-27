"""Phase 14 Plan 14-01 — GenerateAdminSummaryPDFUseCase (D-B6).

Reuses the Phase 12 fpdf2 PDF service. Composes a 1-page A4 portrait summary:
- Section 1: User counts (total + delta + role split)
- Section 2: Active project count + total project count
- Section 3: Top 5 most-active projects (by audit_log entries last 30d)
- Section 4: Top 5 most-active users (by audit_log entries last 30d)

Returns BytesIO for the StreamingResponse. Rate limit (1/30seconds) is
applied at the router layer per Phase 12 D-58 reuse.

DIP — uses fpdf2 (third-party, no app.infrastructure dependency); accepts
all data via injected callables so the use case remains testable without
DB / fpdf installed.
"""
import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger("spms")


class GenerateAdminSummaryPDFUseCase:
    def __init__(
        self,
        load_summary_data: Any,  # callable() -> Coro returning dict with keys
                                  # user_count / new_users_30d / role_split /
                                  # active_project_count / total_project_count /
                                  # top_projects / top_users
    ):
        self.load_summary_data = load_summary_data

    async def execute(self) -> io.BytesIO:
        data = await self.load_summary_data()

        try:
            from fpdf import FPDF
        except ImportError as exc:
            logger.exception("fpdf2 not installed")
            raise RuntimeError("PDF library not available") from exc

        # Font fallback chain — macOS Arial Unicode → Linux DejaVu → Helvetica
        font_candidates = [
            "/Library/Fonts/Arial Unicode.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
        font_path: Optional[str] = next(
            (p for p in font_candidates if Path(p).exists()), None
        )

        MARGIN = 15
        pdf = FPDF(orientation="P", unit="mm", format="A4")
        pdf.set_margins(MARGIN, MARGIN, MARGIN)
        pdf.set_auto_page_break(auto=True, margin=MARGIN)
        pdf.add_page()

        if font_path:
            pdf.add_font("uni", fname=font_path)
            fn = "uni"
        else:
            fn = "Helvetica"

        # Title
        pdf.set_font(fn, size=16)
        pdf.cell(0, 10, "SPMS Admin Summary", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(fn, size=9)
        pdf.cell(
            0, 6,
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC",
            new_x="LMARGIN", new_y="NEXT",
        )
        pdf.ln(5)

        # Section 1 — Users
        pdf.set_font(fn, size=12)
        pdf.cell(0, 8, "Users", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(fn, size=10)
        pdf.cell(0, 6, f"Total: {data.get('user_count', 0)}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(
            0, 6,
            f"New in last 30 days: {data.get('new_users_30d', 0)}",
            new_x="LMARGIN", new_y="NEXT",
        )
        role_split = data.get("role_split", {})
        if role_split:
            pdf.cell(
                0, 6,
                f"By role: " + ", ".join(f"{k}={v}" for k, v in role_split.items()),
                new_x="LMARGIN", new_y="NEXT",
            )
        pdf.ln(3)

        # Section 2 — Projects
        pdf.set_font(fn, size=12)
        pdf.cell(0, 8, "Projects", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(fn, size=10)
        pdf.cell(
            0, 6,
            f"Active: {data.get('active_project_count', 0)} / "
            f"Total: {data.get('total_project_count', 0)}",
            new_x="LMARGIN", new_y="NEXT",
        )
        pdf.ln(3)

        # Section 3 — Top 5 active projects
        pdf.set_font(fn, size=12)
        pdf.cell(0, 8, "Top 5 active projects (last 30 days)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(fn, size=10)
        for proj in (data.get("top_projects") or [])[:5]:
            pdf.cell(
                0, 6,
                f"  - {proj.get('key', '')}: {proj.get('name', '')} ({proj.get('events', 0)} events)",
                new_x="LMARGIN", new_y="NEXT",
            )
        pdf.ln(3)

        # Section 4 — Top 5 active users
        pdf.set_font(fn, size=12)
        pdf.cell(0, 8, "Top 5 active users (last 30 days)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(fn, size=10)
        for user in (data.get("top_users") or [])[:5]:
            pdf.cell(
                0, 6,
                f"  - {user.get('full_name', '')} ({user.get('events', 0)} events)",
                new_x="LMARGIN", new_y="NEXT",
            )

        pdf_bytes = bytes(pdf.output())
        return io.BytesIO(pdf_bytes)
