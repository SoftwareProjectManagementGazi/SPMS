"""Canonical lifecycle templates — trim to the 9 classic SDLC models.

Mevcut DB'yi kanonik duruma getirir (_template_workflows.py tek kaynak):
  1. Eksik kanonik şablonlar eklenir (Yinelemeli / Artırımlı / Prototipleme).
  2. Kalan şablonların default_workflow'u ders-kitabı illüstrasyon
     geometrisiyle güncellenir (V gerçekten V, şelale merdiven, döngüler
     çember/sarmal), açıklamalar tazelenir.
  3. Obsolet şablonları kullanan projeler kanonik karşılıklarına remap edilir
     (copy-on-use sayesinde projelerin kendi workflow kopyaları etkilenmez).
  4. Obsolet şablon satırları silinir.

Revision ID: 017_canonical_lifecycle_templates
Revises: 016_drop_orphaned_task_status_type
Create Date: 2026-06-12
"""
import json

from alembic import op
import sqlalchemy as sa

from app.infrastructure.database._template_workflows import (
    CANONICAL_TEMPLATES,
    OBSOLETE_TEMPLATE_NAMES,
    OBSOLETE_TEMPLATE_REMAP,
)

# revision identifiers, used by Alembic.
revision = "017_canonical_lifecycle_templates"
down_revision = "016_drop_orphaned_task_status_type"
branch_labels = None
depends_on = None


def _jsonb(value):
    """None → SQL NULL; everything else → its JSON text (CAST'lenir)."""
    return None if value is None else json.dumps(value, ensure_ascii=False)


def upgrade() -> None:
    conn = op.get_bind()

    # 1 + 2 — kanonik upsert: var olan satırın grafı/açıklaması güncellenir,
    # eksik olan tam payload ile eklenir.
    for tpl in CANONICAL_TEMPLATES:
        row = conn.execute(
            sa.text("SELECT id FROM process_templates WHERE name = :n"),
            {"n": tpl["name"]},
        ).first()
        if row:
            conn.execute(
                sa.text(
                    "UPDATE process_templates SET "
                    "  default_workflow = CAST(:wf AS jsonb), "
                    "  description = :d "
                    "WHERE id = :i"
                ),
                {
                    "wf": _jsonb(tpl["default_workflow"]),
                    "d": tpl["description"],
                    "i": row[0],
                },
            )
        else:
            conn.execute(
                sa.text(
                    "INSERT INTO process_templates "
                    "(name, is_builtin, description, columns, recurring_tasks, "
                    " behavioral_flags, cycle_label_tr, cycle_label_en, "
                    " default_workflow, default_columns, default_artifacts, "
                    " default_phase_criteria) "
                    "VALUES (:name, true, :description, CAST(:columns AS jsonb), "
                    "        CAST(:recurring AS jsonb), CAST(:flags AS jsonb), "
                    "        :clt, :cle, CAST(:wf AS jsonb), CAST(:dcols AS jsonb), "
                    "        CAST(:darts AS jsonb), CAST(:dcrit AS jsonb))"
                ),
                {
                    "name": tpl["name"],
                    "description": tpl["description"],
                    "columns": _jsonb(tpl.get("columns", [])),
                    "recurring": _jsonb(tpl.get("recurring_tasks", [])),
                    "flags": _jsonb(tpl.get("behavioral_flags", {})),
                    "clt": tpl.get("cycle_label_tr", "Faz"),
                    "cle": tpl.get("cycle_label_en", "Phase"),
                    "wf": _jsonb(tpl.get("default_workflow")),
                    "dcols": _jsonb(tpl.get("default_columns")),
                    "darts": _jsonb(tpl.get("default_artifacts")),
                    "dcrit": _jsonb(tpl.get("default_phase_criteria")),
                },
            )

    # 3 — obsolet şablonlara bağlı projeleri kanonik karşılığa taşı.
    for old_name, new_name in OBSOLETE_TEMPLATE_REMAP.items():
        conn.execute(
            sa.text(
                "UPDATE projects SET process_template_id = "
                "  (SELECT id FROM process_templates WHERE name = :new_name) "
                "WHERE process_template_id = "
                "  (SELECT id FROM process_templates WHERE name = :old_name)"
            ),
            {"new_name": new_name, "old_name": old_name},
        )

    # 4 — obsolet satırları sil.
    conn.execute(
        sa.text(
            "DELETE FROM process_templates WHERE name IN :names"
        ).bindparams(sa.bindparam("names", expanding=True)),
        {"names": OBSOLETE_TEMPLATE_NAMES},
    )


def downgrade() -> None:
    # Silinen şablon içerikleri geri üretilemez — downgrade desteklenmiyor.
    raise NotImplementedError(
        "017 is a one-way data migration (obsolete templates are deleted)."
    )
