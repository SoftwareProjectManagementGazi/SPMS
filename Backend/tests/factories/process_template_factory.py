"""ProcessTemplate entity factory."""
from typing import Any, Optional

try:
    from app.domain.entities.process_template import ProcessTemplate
except ImportError:  # pragma: no cover — if entity path differs in the codebase
    ProcessTemplate = None  # type: ignore

_counter = {"value": 0}


def make_process_template(
    name: Optional[str] = None,
    cycle_label_tr: str = "Sprint",
    cycle_label_en: str = "Sprint",
    id: Optional[int] = None,
    **extra: Any,
):
    """Return a ProcessTemplate with sensible defaults. If entity shape differs in codebase,
    overrides via **extra allow per-test flexibility."""
    if ProcessTemplate is None:
        raise RuntimeError("ProcessTemplate entity not importable — factory unavailable")
    _counter["value"] += 1
    n = _counter["value"]
    return ProcessTemplate(
        id=id,
        name=name or f"TestTemplate{n}",
        **extra,
    )
