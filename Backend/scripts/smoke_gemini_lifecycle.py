"""Tek seferlik canlı Gemini smoke testi — kriter formu → workflow akışı.

Çalıştır: python scripts/smoke_gemini_lifecycle.py
"""

import asyncio
import sys

sys.path.insert(0, ".")

from app.application.dtos.ai_workflow_dto import LifecycleFormDTO
from app.infrastructure.config import settings
from app.infrastructure.adapters.ai.gemini_workflow_adapter import GeminiWorkflowAdapter


SCENARIOS = {
    "vmodel": LifecycleFormDTO(
        req_clarity="clear_stable",
        verification_rigor="critical",
        compliance_level="heavy",
        team_size=8,
        sector="saglik",
        quality_uat=True,
        additional_context="Hastane randevu sistemi; KVKK denetiminden geçecek.",
    ),
    "spiral": LifecycleFormDTO(
        risk_profile="high_innovative",
        req_clarity="vague",
        delivery_style="prototype_first",
        team_size=12,
        multi_team=True,
        sector="finans",
    ),
    "free": LifecycleFormDTO(
        additional_context="Küçük bir ekiple üniversite bitirme projesi yönetiyoruz.",
    ),
}


async def main() -> None:
    adapter = GeminiWorkflowAdapter(api_key=settings.GOOGLE_API_KEY)
    form = SCENARIOS.get(sys.argv[1] if len(sys.argv) > 1 else "vmodel", SCENARIOS["vmodel"])
    nodes, edges = [], []
    async for ev in adapter.generate_lifecycle_stream(form, "tr"):
        if ev.type == "node_added":
            nodes.append(ev.payload)
        elif ev.type == "edge_added":
            edges.append(ev.payload)
        elif ev.type in ("rationale", "done", "error"):
            print(ev.type.upper(), "→", ev.payload)
    print(f"\n{len(nodes)} node, {len(edges)} edge")
    for n in nodes:
        print(f"  ({n['x']:>5},{n['y']:>4}) {n['color']:<16} {n['label']}")


if __name__ == "__main__":
    asyncio.run(main())
