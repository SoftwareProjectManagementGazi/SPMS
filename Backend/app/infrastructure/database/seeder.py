import logging
import random
from datetime import date, timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.infrastructure.database.seeder_extended import seed_extended_data
# Wave 2 W2-C9 — single-source default column lists. Shared with
# alembic 014's backfill so the seed payload never drifts.
from app.infrastructure.database._default_columns import (
    KANBAN_DEFAULT_COLUMNS,
    SCRUM_DEFAULT_COLUMNS,
    WATERFALL_DEFAULT_COLUMNS,
)

# --- Modeller ---
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel, Methodology
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.task import TaskModel, TaskPriority
from app.infrastructure.database.models.comment import CommentModel
from app.infrastructure.database.models.notification import NotificationModel, NotificationType
from app.infrastructure.database.models.label import LabelModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel
from app.infrastructure.database.models.milestone import MilestoneModel
from app.infrastructure.database.models.artifact import ArtifactModel
from app.infrastructure.database.models.process_template import ProcessTemplateModel
from app.domain.entities.project import ProjectStatus

from app.infrastructure.security import get_password_hash

logger = logging.getLogger(__name__)

# --- Sabit Veriler ---

INITIAL_ROLES = [
    {"name": "Admin", "description": "Sistem yöneticisi, tam yetkili."},
    {"name": "Project Manager", "description": "Proje yöneticisi, ekip ve süreç yönetimi."},
    {"name": "Member", "description": "Ekip üyesi, görev üzerinde çalışır."},
]

USERS_DATA = [
    {"email": "admin@spms.com", "full_name": "Sistem Yöneticisi", "role": "Admin", "avatar": "https://i.pravatar.cc/150?u=ayse"},
    {"email": "ayse.oz@gazi.edu.tr", "full_name": "Ayşe Öz", "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=admin"},
    {"email": "yusuf.bayrakci@gazi.edu.tr", "full_name": "Yusuf Emre Bayrakcı", "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=yusuf"},
    {"email": "mehmet.yilmaz@firma.com", "full_name": "Mehmet Yılmaz", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=mehmet"},
    {"email": "zeynep.kaya@firma.com", "full_name": "Zeynep Kaya", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=zeynep"},
    {"email": "ali.demir@firma.com", "full_name": "Ali Demir", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=ali"},
    {"email": "elif.celik@firma.com", "full_name": "Elif Çelik", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=elif"},
    {"email": "can.yildiz@firma.com", "full_name": "Can Yıldız", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=can"},
]

PROJECTS_DATA = [
    {
        "name": "SPMS Geliştirme",
        "key": "SPMS",
        "description": "Yazılım Proje Yönetim Sistemi'nin backend ve frontend geliştirmeleri.",
        "methodology": Methodology.SCRUM,
        "status": "ACTIVE",  # D-36: varied statuses for SegmentedControl filter testing
        "manager_email": "ayse.oz@gazi.edu.tr",
        "labels": ["Backend", "Frontend", "Database", "Bug", "Refactor"]
    },
    {
        "name": "E-Ticaret Mobil App",
        "key": "MOB",
        "description": "Müşteriler için iOS ve Android tabanlı mobil alışveriş uygulaması.",
        "methodology": Methodology.KANBAN,
        "status": "ACTIVE",  # D-36: 2× ACTIVE for filter testing
        "manager_email": "yusuf.bayrakci@gazi.edu.tr",
        "labels": ["UI/UX", "API", "iOS", "Android", "Critical"]
    },
    {
        "name": "Veri Ambarı Göçü",
        "key": "DATA",
        "description": "Eski Oracle veritabanından PostgreSQL sistemine veri taşıma ve temizleme projesi.",
        "methodology": Methodology.WATERFALL,
        "status": "COMPLETED",  # D-36: 1× COMPLETED for filter testing
        "manager_email": "ayse.oz@gazi.edu.tr",
        "labels": ["ETL", "Validation", "Script", "Schema"]
    },
    {
        "name": "Yapay Zeka Modülü",
        "key": "AI",
        "description": "Proje tahminlemeleri için makine öğrenmesi modülünün entegrasyonu.",
        "methodology": Methodology.SCRUM,
        "status": "ON_HOLD",  # D-36: 1× ON_HOLD for filter testing
        "manager_email": "yusuf.bayrakci@gazi.edu.tr",
        "labels": ["ML", "Python", "Training", "Integration"]
    }
]

# Gerçekçi görev içerikleri üretmek için şablonlar
PARENT_TASK_TEMPLATES = [
    ("Kullanıcı Oturum Yönetimi", "Sisteme güvenli giriş, kayıt olma, şifre sıfırlama ve JWT token altyapısının kurulmasını kapsar."),
    ("Ödeme Sistemi Entegrasyonu", "Stripe ve Iyzico sanal pos entegrasyonlarının yapılması ve güvenli ödeme sayfasının hazırlanması."),
    ("Raporlama Dashboard'u", "Yöneticiler için grafiksel raporların sunulduğu, chart.js kullanılan panelin geliştirilmesi."),
    ("Bildirim Altyapısı", "WebSocket üzerinden gerçek zamanlı bildirimlerin ve e-posta servisinin kurgulanması."),
    ("Profil Sayfaları", "Kullanıcıların kendi bilgilerini güncelleyebileceği ve avatar yükleyebileceği ekranlar."),
    ("Arama ve Filtreleme", "Proje genelinde detaylı arama (Elasticsearch) ve filtreleme özelliklerinin backend desteği."),
    ("Performans Optimizasyonu", "Veritabanı sorgularının optimize edilmesi ve Redis önbellekleme mekanizmasının kurulması."),
    ("API Dokümantasyonu", "Swagger/OpenAPI kullanılarak tüm endpointlerin detaylı dokümante edilmesi.")
]

SUBTASK_PREFIXES = ["Analiz", "Tasarım", "Geliştirme", "Unit Test", "Entegrasyon", "Code Review", "Bug Fix"]

# Phase 12 Plan 12-10 (LIFE-01 fix) — default workflow shapes per methodology
# so a freshly-seeded project never lands with an empty `process_config.phase_workflow`.
# (C1: V2 schema renamed `workflow` -> `phase_workflow`.)
# Each shape ports the canonical preset from
# Frontend2/lib/lifecycle/presets.ts (which itself ports from
# New_Frontend/src/data.jsx DEFAULT_LIFECYCLES + EXTRA_LIFECYCLES) so the
# Settings > Yaşam Döngüsü panel and the LifecycleTab summary strip both
# render a real workflow on day-zero. Each shape satisfies the FE
# validateWorkflow() contract (>=1 isInitial, >=1 isFinal, valid edges,
# orphan-free).
#
# `name` is the canonical FE field; `label` is preserved for the legacy
# WorkflowConfigDTO mapper (mapWorkflowNode reads `name` first). Keys use
# snake_case at the JSONB boundary (is_initial/is_final) per Pitfall 21.

# Phase 12 Plan 12-10 (Bug X UAT fix) — node IDs MUST satisfy the D-22
# regex `^nd_[A-Za-z0-9_-]{10}$` (defined in Backend/app/domain/entities/task.py).
# Pre-fix the seeder shipped `n1`/`n2`/etc. which fails the regex; once the
# WorkflowConfig validator is wired into the project PATCH path, every save
# fails 422 unless these IDs are regex-compliant.
#
# We use deterministic readable suffixes (e.g. `nd_scinit0001`) that mirror
# the Frontend2 preset IDs in `Frontend2/lib/lifecycle/presets.ts`, so a
# user moving between seed data and "Şablon Yükle" sees the same node
# identities for matching methodology pairs (no churn on apply).

_DEFAULT_WORKFLOW_SCRUM = {
    "mode": "flexible",
    "nodes": [
        {"id": "nd_scinit0001", "name": "Başlatma", "description": "Vizyon ve hedefler",
         "x": 60, "y": 120, "color": "status-todo", "is_initial": True},
        {"id": "nd_scplan0002", "name": "Planlama", "description": "Backlog ve sprint planning",
         "x": 280, "y": 120, "color": "status-todo"},
        {"id": "nd_scexec0003", "name": "Yürütme", "description": "Sprint'ler",
         "x": 500, "y": 120, "color": "status-progress"},
        {"id": "nd_scmoni0004", "name": "İzleme", "description": "Metrikler ve retro",
         "x": 720, "y": 120, "color": "status-review"},
        {"id": "nd_sccls00005", "name": "Kapanış", "description": "Teslim ve ders",
         "x": 940, "y": 120, "color": "status-done", "is_final": True},
    ],
    "edges": [
        {"id": "e1", "source": "nd_scinit0001", "target": "nd_scplan0002", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e2", "source": "nd_scplan0002", "target": "nd_scexec0003", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e3", "source": "nd_scexec0003", "target": "nd_scmoni0004", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e4", "source": "nd_scmoni0004", "target": "nd_scexec0003", "type": "feedback",
         "label": "Retro", "bidirectional": False, "is_all_gate": False},
        {"id": "e5", "source": "nd_scmoni0004", "target": "nd_sccls00005", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
    ],
    "groups": [],
}

_DEFAULT_WORKFLOW_WATERFALL = {
    "mode": "sequential-locked",
    "nodes": [
        {"id": "nd_wfreq00001", "name": "Gereksinimler", "description": "Kapsam ve dokümantasyon",
         "x": 60, "y": 120, "color": "status-todo", "is_initial": True},
        {"id": "nd_wfdes00002", "name": "Tasarım", "description": "Mimari ve UI",
         "x": 280, "y": 120, "color": "status-progress"},
        {"id": "nd_wfimp00003", "name": "Uygulama", "description": "Geliştirme",
         "x": 500, "y": 120, "color": "status-progress"},
        {"id": "nd_wftst00004", "name": "Test", "description": "QA ve UAT",
         "x": 720, "y": 120, "color": "status-review"},
        {"id": "nd_wfdep00005", "name": "Yayın", "description": "Dağıtım",
         "x": 940, "y": 120, "color": "status-done"},
        {"id": "nd_wfmnt00006", "name": "Bakım", "description": "Destek",
         "x": 1160, "y": 120, "color": "status-done", "is_final": True},
    ],
    "edges": [
        {"id": "e1", "source": "nd_wfreq00001", "target": "nd_wfdes00002", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e2", "source": "nd_wfdes00002", "target": "nd_wfimp00003", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e3", "source": "nd_wfimp00003", "target": "nd_wftst00004", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e4", "source": "nd_wftst00004", "target": "nd_wfdep00005", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e5", "source": "nd_wfdep00005", "target": "nd_wfmnt00006", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
    ],
    "groups": [],
}

_DEFAULT_WORKFLOW_KANBAN = {
    "mode": "continuous",
    "nodes": [
        # Continuous mode requires a single node that is both initial and final.
        {"id": "nd_kbflow0001", "name": "Sürekli Akış", "description": "Tek aktif faz",
         "x": 400, "y": 120, "color": "status-progress",
         "is_initial": True, "is_final": True},
    ],
    "edges": [],
    "groups": [],
}

_DEFAULT_WORKFLOW_ITERATIVE = {
    "mode": "flexible",
    "nodes": [
        {"id": "nd_itplan0001", "name": "Planlama", "description": "Hedef belirleme",
         "x": 60, "y": 120, "color": "status-todo", "is_initial": True},
        {"id": "nd_itdes00002", "name": "Tasarım", "description": "Yineleme tasarımı",
         "x": 260, "y": 120, "color": "status-progress"},
        {"id": "nd_itimp00003", "name": "Uygulama", "description": "Geliştirme ve test",
         "x": 460, "y": 120, "color": "status-progress"},
        {"id": "nd_iteva00004", "name": "Değerlendirme", "description": "İnceleme ve karar",
         "x": 660, "y": 120, "color": "status-done", "is_final": True},
    ],
    "edges": [
        {"id": "e1", "source": "nd_itplan0001", "target": "nd_itdes00002", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e2", "source": "nd_itdes00002", "target": "nd_itimp00003", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e3", "source": "nd_itimp00003", "target": "nd_iteva00004", "type": "flow",
         "label": None, "bidirectional": False, "is_all_gate": False},
        {"id": "e4", "source": "nd_iteva00004", "target": "nd_itplan0001", "type": "feedback",
         "label": "Yeni iterasyon", "bidirectional": False, "is_all_gate": False},
    ],
    "groups": [],
}


# C1: capabilities defaults per methodology. Mirrors the seed values written
# by migration_005.py for the process_templates table (Scrum -> restrict_expired_sprints,
# Kanban -> enforce_wip_limits, Waterfall -> enforce_sequential_dependencies).
# Kept here as the single seed-time source of truth for fresh project rows.
_CAPABILITY_DEFAULTS_BY_METHODOLOGY = {
    Methodology.SCRUM: {
        "enforce_wip_limits": False,
        "enforce_sequential_dependencies": False,
        "restrict_expired_sprints": True,
    },
    Methodology.KANBAN: {
        "enforce_wip_limits": True,
        "enforce_sequential_dependencies": False,
        "restrict_expired_sprints": False,
    },
    Methodology.WATERFALL: {
        "enforce_wip_limits": False,
        "enforce_sequential_dependencies": True,
        "restrict_expired_sprints": False,
    },
    Methodology.ITERATIVE: {
        "enforce_wip_limits": False,
        "enforce_sequential_dependencies": False,
        "restrict_expired_sprints": False,
    },
}


def _default_workflow_for_methodology(methodology: Methodology) -> dict:
    """Return a ready-to-use workflow shape (LIFE-01 fix).

    Maps the project's `methodology` enum to the canonical FE preset shape so
    the Settings > Yaşam Döngüsü panel and the LifecycleTab summary strip
    have a real workflow to render on day-zero. The returned dict is a deep
    copy so callers can mutate it without affecting the module-level fixture.

    C1 (workflow engine refactor): the returned dict is a V2 `phase_workflow`
    block that includes the `capabilities` sub-object seeded with methodology-
    appropriate defaults (mirrors migration_005.py:115-139). The caller is
    expected to attach this under `process_config["phase_workflow"]` with
    `schema_version=2`.
    """
    import copy
    if methodology == Methodology.WATERFALL:
        wf = copy.deepcopy(_DEFAULT_WORKFLOW_WATERFALL)
    elif methodology == Methodology.KANBAN:
        wf = copy.deepcopy(_DEFAULT_WORKFLOW_KANBAN)
    elif methodology == Methodology.ITERATIVE:
        wf = copy.deepcopy(_DEFAULT_WORKFLOW_ITERATIVE)
    else:
        # SCRUM is the default fallback (matches CLAUDE.md polymorphism rule —
        # any unhandled methodology degrades to the safest, most-common shape).
        wf = copy.deepcopy(_DEFAULT_WORKFLOW_SCRUM)

    # C1: derive initial_node_id from the seeded nodes (matches the entity
    # normalizer's algorithm) and attach the capabilities sub-object.
    initial_node_id = None
    for n in wf.get("nodes", []) or []:
        if isinstance(n, dict) and n.get("is_initial"):
            initial_node_id = n.get("id")
            break
    cap_defaults = _CAPABILITY_DEFAULTS_BY_METHODOLOGY.get(methodology, {
        "enforce_wip_limits": False,
        "enforce_sequential_dependencies": False,
        "restrict_expired_sprints": False,
    })
    wf["capabilities"] = {**cap_defaults, "initial_node_id": initial_node_id}
    return wf

COMMENT_TEXTS = [
    "Bu konuda biraz daha detaya ihtiyacım var.",
    "Tasarım ekibiyle görüştüm, revize bekliyoruz.",
    "API endpoint'i hazır, test edebilirsiniz.",
    "Pull Request açıldı, inceleme bekliyor.",
    "Gecikme için üzgünüm, yarına tamamlanacak.",
    "Harika iş, ellerine sağlık!"
]

# --- Yardımcı Fonksiyonlar ---

def get_random_date(start_days_ago=60, end_days_ago=0):
    days = random.randint(end_days_ago, start_days_ago)
    return datetime.now() - timedelta(days=days)

async def seed_data(session: AsyncSession, *, skip_tasks: bool = False):
    """Top-level seed entry point.

    ``skip_tasks=True`` is the simulator's bootstrap mode — base entities
    (roles/users/templates/projects/columns/sprints/teams/milestones/artifacts)
    are still created, but no synthetic tasks or audit_log rows are written.
    The simulator then drives the task lifecycle on top of this baseline so
    every audit row carries a simulated timestamp.

    Default (False) preserves the lifespan behaviour: when a simulator
    snapshot exists at ``Backend/fixtures/simulated_quarter.sql.gz`` AND
    audit_log is empty (fresh container), the snapshot is loaded instead
    of the legacy hand-rolled task fixtures. Otherwise the legacy path
    runs end-to-end.
    """
    # Simulator snapshot fast-path: if a baked dump exists and the DB is
    # genuinely empty (no audit_log rows), restore it and bail out — that
    # turns a multi-minute legacy seed into a few-second COPY of rows with
    # realistic 90-day timestamps. The skip_tasks=True caller (the
    # simulator's own bootstrap) bypasses this branch because it wants the
    # legacy bootstrap path to set up roles / users / templates / projects
    # before driving the simulation.
    if not skip_tasks:
        from app.infrastructure.database.snapshot_loader import maybe_load_snapshot
        if await maybe_load_snapshot(session):
            return
    try:
        # No top-level idempotency guard — each entity seeder has its own
        # per-row check (seed_roles by name, seed_users by email,
        # seed_process_templates by name, seed_projects by key). Detail seeders
        # only fire for projects newly created in this run, so re-running on a
        # populated DB doesn't duplicate columns, sprints, tasks, or teams.
        # This lets late-added entities (e.g., new built-in templates) land on
        # subsequent startups without dropping the database.
        logger.info("SEEDER: Veritabanı dolumu başlatılıyor...")

        roles_map = await seed_roles(session)
        users_map = await seed_users(session, roles_map)
        await seed_process_templates(session)
        projects_map, created_projects = await seed_projects(session, users_map)

        # Detail seeds only run for projects newly created this pass, so a
        # re-run on a partially-populated DB doesn't duplicate columns, sprints,
        # tasks, teams, milestones, or artifacts.
        created_keys = {p.key for p in created_projects}
        detail_dispatch = {
            "SPMS": seed_scrum_details,
            "MOB": seed_kanban_details,
            "DATA": seed_waterfall_details,
            "AI": seed_scrum_details,
        }
        for key, seeder in detail_dispatch.items():
            if key in created_keys and key in projects_map:
                await seeder(session, projects_map[key], users_map, skip_tasks=skip_tasks)

        if created_projects:
            await seed_teams(session, {p.key: p for p in created_projects}, users_map)
            await seed_milestones_and_artifacts(session, created_projects)

        await session.commit()
        logger.info("SEEDER: Temel veriler commit edildi.")

        # Genişletilmiş seeder: +92 kullanıcı, +15 proje, +12 yaşam döngüsü şablonu
        await seed_extended_data(session, skip_tasks=skip_tasks)
        await session.commit()
        logger.info("SEEDER: İşlem başarıyla tamamlandı.")
    except Exception as e:
        logger.error(f"SEEDER HATASI: {e}")
        await session.rollback()
        raise

# --- Temel Veri Fonksiyonları ---

async def seed_roles(session: AsyncSession):
    logger.info("... Roller oluşturuluyor")
    result = await session.execute(select(RoleModel))
    roles_map = {r.name: r for r in result.scalars().all()}
    for r_data in INITIAL_ROLES:
        if r_data["name"] not in roles_map:
            role = RoleModel(name=r_data["name"], description=r_data["description"])
            session.add(role)
            roles_map[r_data["name"]] = role
    await session.flush()
    return roles_map

async def seed_users(session: AsyncSession, roles_map):
    logger.info("... Kullanıcılar oluşturuluyor")
    result = await session.execute(select(UserModel))
    users_map = {u.email: u for u in result.scalars().all()}
    for u_data in USERS_DATA:
        if u_data["email"] not in users_map:
            role = roles_map.get(u_data["role"])
            user = UserModel(
                email=u_data["email"],
                password_hash=get_password_hash("123456"),
                full_name=u_data["full_name"],
                is_active=True,
                role_id=role.id,
                avatar=u_data["avatar"]
            )
            session.add(user)
            users_map[u_data["email"]] = user
    await session.flush()
    return users_map

async def seed_process_templates(session: AsyncSession):
    """Seed the three built-in methodology templates (scrum, kanban, waterfall).

    The alembic 005 migration creates the process_templates table and backfills
    projects.process_template_id from methodology text, but neither the migration
    nor the project seeder creates the template rows themselves. Without these
    rows, the Create Project wizard step 2 has no templates to show.

    Idempotent per-name: existing rows are left alone.
    """
    logger.info("... Süreç şablonları oluşturuluyor")
    result = await session.execute(select(ProcessTemplateModel))
    existing = {t.name.lower() for t in result.scalars().all()}

    templates = [
        {
            "name": "Scrum",
            "is_builtin": True,
            "description": "Zaman-kutulu sprintler, ürün backlog'u, günlük stand-up ve retrospektif ile iteratif geliştirme.",
            "columns": [
                {"name": "Backlog", "order": 0},
                {"name": "To Do", "order": 1},
                {"name": "In Progress", "order": 2},
                {"name": "Code Review", "order": 3},
                {"name": "Done", "order": 4},
            ],
            # Wave 2 W2-C9 — engine-aware shape consumed by W2-C10's
            # CreateProjectUseCase. Legacy ``columns`` above remains as a
            # read fallback until W2-C11 dual-key cleanup.
            "default_columns": SCRUM_DEFAULT_COLUMNS,
            "recurring_tasks": [],
            "behavioral_flags": {"sprint_required": True, "wip_limits": False},
            "cycle_label_tr": "Sprint",
            "cycle_label_en": "Sprint",
            # Fix (debug workflow-editor-seeder-schema-broken): node schema must match
            # WorkflowNodeDTO (id, name, x, y, color, is_initial, is_final, description).
            # Old shape used {id, label, order} — mapWorkflowNode reads `name` not `label`,
            # so label was silently dropped producing undefined names on the canvas.
            # Missing x/y stacked all nodes at (0,0). Short ids ("plan", "develop", etc.)
            # fail the D-22 regex ^nd_[A-Za-z0-9_-]{10}$ and cause 422 on save.
            # This block now mirrors _DEFAULT_WORKFLOW_SCRUM exactly.
            "default_workflow": {
                "mode": "flexible",
                "nodes": [
                    {"id": "nd_scinit0001", "name": "Başlatma", "description": "Vizyon ve hedefler",
                     "x": 60, "y": 120, "color": "status-todo", "is_initial": True},
                    {"id": "nd_scplan0002", "name": "Planlama", "description": "Backlog ve sprint planning",
                     "x": 280, "y": 120, "color": "status-todo"},
                    {"id": "nd_scexec0003", "name": "Yürütme", "description": "Sprint'ler",
                     "x": 500, "y": 120, "color": "status-progress"},
                    {"id": "nd_scmoni0004", "name": "İzleme", "description": "Metrikler ve retro",
                     "x": 720, "y": 120, "color": "status-review"},
                    {"id": "nd_sccls00005", "name": "Kapanış", "description": "Teslim ve ders",
                     "x": 940, "y": 120, "color": "status-done", "is_final": True},
                ],
                "edges": [
                    {"id": "e1", "source": "nd_scinit0001", "target": "nd_scplan0002", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e2", "source": "nd_scplan0002", "target": "nd_scexec0003", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e3", "source": "nd_scexec0003", "target": "nd_scmoni0004", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e4", "source": "nd_scmoni0004", "target": "nd_scexec0003", "type": "feedback",
                     "label": "Retro", "bidirectional": False, "is_all_gate": False},
                    {"id": "e5", "source": "nd_scmoni0004", "target": "nd_sccls00005", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                ],
                "groups": [],
            },
        },
        {
            "name": "Kanban",
            "is_builtin": True,
            "description": "Sürekli akış, WIP limitleri ve çekme tabanlı iş akışı ile akışkan teslimat.",
            "columns": [
                {"name": "To Do", "order": 0, "wip_limit": 0},
                {"name": "Analiz", "order": 1, "wip_limit": 3},
                {"name": "Geliştirme", "order": 2, "wip_limit": 4},
                {"name": "Test", "order": 3, "wip_limit": 2},
                {"name": "Done", "order": 4, "wip_limit": 0},
            ],
            # Wave 2 W2-C9 — engine-aware shape (see _default_columns.py).
            "default_columns": KANBAN_DEFAULT_COLUMNS,
            "recurring_tasks": [],
            "behavioral_flags": {"sprint_required": False, "wip_limits": True},
            "cycle_label_tr": "Döngü",
            "cycle_label_en": "Cycle",
            # Fix: continuous mode requires a single node that is both initial and final.
            # Old shape had three nodes {id, label, order} — wrong schema + wrong structure
            # for continuous mode. Mirrors _DEFAULT_WORKFLOW_KANBAN exactly.
            "default_workflow": {
                "mode": "continuous",
                "nodes": [
                    {"id": "nd_kbflow0001", "name": "Sürekli Akış", "description": "Tek aktif faz",
                     "x": 400, "y": 120, "color": "status-progress",
                     "is_initial": True, "is_final": True},
                ],
                "edges": [],
                "groups": [],
            },
        },
        {
            "name": "Waterfall",
            "is_builtin": True,
            "description": "Gereksinim, tasarım, uygulama, test, bakım fazlarıyla sıralı ve belgeleme ağırlıklı model.",
            "columns": [
                {"name": "Gereksinim", "order": 0},
                {"name": "Analiz", "order": 1},
                {"name": "Tasarım", "order": 2},
                {"name": "Uygulama", "order": 3},
                {"name": "Test", "order": 4},
                {"name": "Bakım", "order": 5},
            ],
            # Wave 2 W2-C9 — engine-aware shape (see _default_columns.py).
            "default_columns": WATERFALL_DEFAULT_COLUMNS,
            "recurring_tasks": [],
            "behavioral_flags": {"sprint_required": False, "strict_dependencies": True},
            "cycle_label_tr": "Faz",
            "cycle_label_en": "Phase",
            # Fix: mode corrected sequential -> sequential-locked. Node IDs fixed to
            # nd_* (D-22 compliant). Old edge source/target refs ("req", "design" etc.)
            # broken because node IDs changed. Mirrors _DEFAULT_WORKFLOW_WATERFALL exactly.
            "default_workflow": {
                "mode": "sequential-locked",
                "nodes": [
                    {"id": "nd_wfreq00001", "name": "Gereksinimler", "description": "Kapsam ve dokümantasyon",
                     "x": 60, "y": 120, "color": "status-todo", "is_initial": True},
                    {"id": "nd_wfdes00002", "name": "Tasarım", "description": "Mimari ve UI",
                     "x": 280, "y": 120, "color": "status-progress"},
                    {"id": "nd_wfimp00003", "name": "Uygulama", "description": "Geliştirme",
                     "x": 500, "y": 120, "color": "status-progress"},
                    {"id": "nd_wftst00004", "name": "Test", "description": "QA ve UAT",
                     "x": 720, "y": 120, "color": "status-review"},
                    {"id": "nd_wfdep00005", "name": "Yayın", "description": "Dağıtım",
                     "x": 940, "y": 120, "color": "status-done"},
                    {"id": "nd_wfmnt00006", "name": "Bakım", "description": "Destek",
                     "x": 1160, "y": 120, "color": "status-done", "is_final": True},
                ],
                "edges": [
                    {"id": "e1", "source": "nd_wfreq00001", "target": "nd_wfdes00002", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e2", "source": "nd_wfdes00002", "target": "nd_wfimp00003", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e3", "source": "nd_wfimp00003", "target": "nd_wftst00004", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e4", "source": "nd_wftst00004", "target": "nd_wfdep00005", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                    {"id": "e5", "source": "nd_wfdep00005", "target": "nd_wfmnt00006", "type": "flow",
                     "label": None, "bidirectional": False, "is_all_gate": False},
                ],
                "groups": [],
            },
        },
    ]

    for tpl in templates:
        if tpl["name"].lower() in existing:
            continue
        session.add(ProcessTemplateModel(**tpl))

    await session.flush()


async def seed_projects(session: AsyncSession, users_map):
    logger.info("... Projeler oluşturuluyor")
    result = await session.execute(select(ProjectModel))
    projects_map = {p.key: p for p in result.scalars().all()}
    all_users = list(users_map.values())
    created_projects = []

    for p_data in PROJECTS_DATA:
        if p_data["key"] not in projects_map:
            manager = users_map.get(p_data["manager_email"])
            project = ProjectModel(
                name=p_data["name"],
                key=p_data["key"],
                description=p_data["description"],
                methodology=p_data["methodology"],
                manager_id=manager.id if manager else None,
                start_date=date.today() - timedelta(days=30),
                end_date=date.today() + timedelta(days=90)
            )
            # D-36: varied project statuses for SegmentedControl filter testing
            project.status = ProjectStatus(p_data.get("status", "ACTIVE"))
            # D-36: process_config base structure (schema_version 2 since C1).
            # Phase 12 Plan 12-10 (LIFE-01 fix) — seed a non-empty default
            # workflow per methodology so freshly-created projects never
            # land on an empty `nodes: []` and the lifecycle panel always
            # has a real graph to render on first open.
            # C1 (workflow engine refactor): V2 schema — key is `phase_workflow`
            # (was `workflow`), and the helper attaches `capabilities` with
            # methodology-appropriate defaults.
            project.process_config = {
                "schema_version": 2,
                "phase_workflow": _default_workflow_for_methodology(p_data["methodology"]),
            }
            # Rastgele 4-6 üye ata
            members = random.sample(all_users, k=min(len(all_users), random.randint(4, 6)))
            if manager and manager not in members: members.append(manager)
            project.members.extend(members)

            session.add(project)
            projects_map[p_data["key"]] = project
            created_projects.append(project)
            await session.flush()

            # Etiketler
            for lbl in p_data["labels"]:
                color = f"#{random.randint(0, 0xFFFFFF):06x}"
                session.add(LabelModel(project_id=project.id, name=lbl, color=color))

    await session.flush()

    # D-36: link process_template_id by methodology name
    template_result = await session.execute(select(ProcessTemplateModel))
    templates_by_name = {t.name.lower(): t for t in template_result.scalars().all()}
    METHODOLOGY_TO_TEMPLATE = {
        Methodology.SCRUM: "scrum",
        Methodology.KANBAN: "kanban",
        Methodology.WATERFALL: "waterfall",
    }
    for project in created_projects:
        meth_key = METHODOLOGY_TO_TEMPLATE.get(project.methodology, "")
        if meth_key and meth_key in templates_by_name:
            project.process_template_id = templates_by_name[meth_key].id

    await session.flush()
    return projects_map, created_projects

# --- Görev Üretim Mantığı (Hiyerarşik) ---

async def generate_hierarchical_tasks(session: AsyncSession, project: ProjectModel, sprints: list, col_map: dict):
    logger.info(f"   -> Görevler üretiliyor: {project.name}")

    # Gerekli verileri çek
    await session.refresh(project, attribute_names=['members'])
    members = project.members
    lbl_res = await session.execute(select(LabelModel).where(LabelModel.project_id == project.id))
    labels = lbl_res.scalars().all()
    col_names = list(col_map.keys())

    # Parent Task Loop (6-7 adet)
    num_parents = random.randint(6, 7)
    for i in range(num_parents):
        template = PARENT_TASK_TEMPLATES[i % len(PARENT_TASK_TEMPLATES)]
        p_title = f"{template[0]} ({project.key})"
        p_desc = template[1]

        # Parent genellikle Backlog veya Todo'da durur, ama bazen ilerlemiş olabilir
        p_status_name = random.choice(col_names[:3]) # İlk 3 kolon
        p_col = col_map[p_status_name]
        p_assignee = random.choice(members)
        p_sprint = random.choice(sprints) if sprints and project.methodology == Methodology.SCRUM else None

        parent_task = TaskModel(
            project_id=project.id,
            sprint_id=p_sprint.id if p_sprint else None,
            column_id=p_col.id,
            assignee_id=p_assignee.id,
            reporter_id=project.manager_id,
            title=p_title,
            description=f"## Genel Bakış\n{p_desc}\n\nBu ana görev, altındaki iş kalemlerinin tamamlanmasıyla bitecektir.",
            priority=random.choice([TaskPriority.HIGH, TaskPriority.CRITICAL]),
            points=random.choice([13, 21, 34]), # Epic puanları yüksek olur
            due_date=datetime.now() + timedelta(days=30),
            created_at=get_random_date(start_days_ago=45, end_days_ago=30)
        )
        session.add(parent_task)
        await session.flush() # ID al

        # Subtask Loop (2-7 adet)
        num_subs = random.randint(2, 7)
        for j in range(num_subs):
            prefix = SUBTASK_PREFIXES[j % len(SUBTASK_PREFIXES)]
            s_title = f"{prefix}: {template[0]} - Parça {j+1}"

            # Subtask'lar daha dağınık olabilir
            s_status_name = random.choice(col_names)
            s_col = col_map[s_status_name]
            s_assignee = random.choice(members)

            # Subtask sprint'i parent ile aynı veya farklı olabilir (genelde aynı olur)
            s_sprint = p_sprint if p_sprint else (random.choice(sprints) if sprints else None)

            sub_task = TaskModel(
                project_id=project.id,
                sprint_id=s_sprint.id if s_sprint else None,
                column_id=s_col.id,
                assignee_id=s_assignee.id,
                reporter_id=p_assignee.id,
                parent_task_id=parent_task.id,
                title=s_title,
                description=f"### İş Tanımı\n{template[0]} kapsamında yapılacak {prefix} çalışmaları.\n\n- [ ] Gereksinimleri kontrol et\n- [ ] Kodlamayı yap\n- [ ] Test et",
                priority=random.choice(list(TaskPriority)),
                points=random.choice([1, 2, 3, 5, 8]),
                due_date=datetime.now() + timedelta(days=random.randint(-5, 15)),
                created_at=get_random_date(start_days_ago=25, end_days_ago=5)
            )
            session.add(sub_task)
            await session.flush()

            # Detaylar: Etiket, Log, Yorum
            if labels:
                # Many-to-Many ilişkisi seeder'da zor olabilir, varsa ekle (TaskModel'de relationship tanimliysa)
                # sub_task.labels.append(random.choice(labels))
                pass

            # AUDIT LOG (Create) — activity feed endpoint reads from audit_log table
            session.add(AuditLogModel(
                entity_type="task", entity_id=sub_task.id,
                field_name="status", old_value=None, new_value="Open",
                user_id=sub_task.reporter_id, action="created",
                timestamp=sub_task.created_at
            ))

            # AUDIT LOG (Status Change - Eğer ilerlediyse)
            if s_status_name not in ["Backlog", "To Do", "Gereksinim"]:
                status_changed_at = datetime.now() - timedelta(days=random.randint(0, 5))
                session.add(AuditLogModel(
                    entity_type="task", entity_id=sub_task.id,
                    field_name="status", old_value="Open", new_value=s_status_name,
                    user_id=sub_task.assignee_id, action="updated",
                    timestamp=status_changed_at
                ))

            # Yorum (%50 ihtimal)
            if random.random() > 0.5:
                session.add(CommentModel(
                    task_id=sub_task.id, user_id=random.choice(members).id,
                    content=random.choice(COMMENT_TEXTS), created_at=datetime.now()
                ))

            # Bildirim (Atama varsa)
            if sub_task.assignee_id:
                session.add(NotificationModel(
                    user_id=sub_task.assignee_id, type=NotificationType.TASK_ASSIGNED,
                    message=f"Yeni görev atandı: {s_title}", related_entity_id=sub_task.id, is_read=False
                ))

# --- Metodolojiye Özgü Detaylar ---

async def seed_scrum_details(session: AsyncSession, project, users_map, *, skip_tasks: bool = False):
    # Use the single-source SCRUM_DEFAULT_COLUMNS spec from _default_columns
    # so category / is_initial / is_terminal / entry_policy / exit_policy
    # land correctly on every new project's board. Previously this seeded
    # plain (name, order_index) tuples — column.category defaulted to "todo"
    # for every row including Done, which broke the CFD's done-bucket count.
    col_map = {}
    for spec in SCRUM_DEFAULT_COLUMNS:
        c = BoardColumnModel(
            project_id=project.id,
            name=spec["name"],
            order_index=spec["order_index"],
            wip_limit=spec.get("wip_limit", 0),
            category=spec.get("category"),
            is_initial=spec.get("is_initial", False),
            is_terminal=spec.get("is_terminal", False),
            max_duration_days=spec.get("max_duration_days"),
            entry_policy=spec.get("entry_policy", "any"),
            exit_policy=spec.get("exit_policy", "any"),
        )
        session.add(c)
        col_map[spec["name"]] = c
    await session.flush()

    s1 = SprintModel(project_id=project.id, name="Sprint 1", goal="Altyapı", start_date=date.today()-timedelta(days=14), end_date=date.today(), is_active=False)
    s2 = SprintModel(project_id=project.id, name="Sprint 2", goal="MVP", start_date=date.today(), end_date=date.today()+timedelta(days=14), is_active=True)
    session.add_all([s1, s2])
    await session.flush()

    # Simulator path: bootstrap calls this with skip_tasks=True so the discrete-
    # event simulator drives task creation through real Use Case calls. Lifespan
    # callers leave the default (False) so the legacy fixed-task seed still
    # runs when no simulator snapshot exists.
    if not skip_tasks:
        await generate_hierarchical_tasks(session, project, [s1, s2], col_map)

async def seed_kanban_details(session: AsyncSession, project, users_map, *, skip_tasks: bool = False):
    col_map = {}
    for spec in KANBAN_DEFAULT_COLUMNS:
        c = BoardColumnModel(
            project_id=project.id,
            name=spec["name"],
            order_index=spec["order_index"],
            wip_limit=spec.get("wip_limit", 0),
            category=spec.get("category"),
            is_initial=spec.get("is_initial", False),
            is_terminal=spec.get("is_terminal", False),
            max_duration_days=spec.get("max_duration_days"),
            entry_policy=spec.get("entry_policy", "any"),
            exit_policy=spec.get("exit_policy", "any"),
        )
        session.add(c)
        col_map[spec["name"]] = c
    await session.flush()

    if not skip_tasks:
        await generate_hierarchical_tasks(session, project, [], col_map)

async def seed_waterfall_details(session: AsyncSession, project, users_map, *, skip_tasks: bool = False):
    col_map = {}
    for spec in WATERFALL_DEFAULT_COLUMNS:
        c = BoardColumnModel(
            project_id=project.id,
            name=spec["name"],
            order_index=spec["order_index"],
            wip_limit=spec.get("wip_limit", 0),
            category=spec.get("category"),
            is_initial=spec.get("is_initial", False),
            is_terminal=spec.get("is_terminal", False),
            max_duration_days=spec.get("max_duration_days"),
            entry_policy=spec.get("entry_policy", "any"),
            exit_policy=spec.get("exit_policy", "any"),
        )
        session.add(c)
        col_map[spec["name"]] = c
    await session.flush()

    if not skip_tasks:
        await generate_hierarchical_tasks(session, project, [], col_map)


async def seed_teams(session: AsyncSession, projects_map: dict, users_map: dict):
    """D-36: create one team per project, assign leader_id to the project manager."""
    logger.info("... Ekipler oluşturuluyor (D-36)")
    all_users = list(users_map.values())

    for key, project in projects_map.items():
        # Team owner = project manager (or first user as fallback)
        owner = next(
            (u for u in all_users if u.id == project.manager_id),
            all_users[0]
        )
        team = TeamModel(
            name=f"{project.name} Ekibi",
            description=f"{project.name} projesi için ekip.",
            owner_id=owner.id,
        )
        session.add(team)
        await session.flush()  # get team.id

        # D-36: assign team leader (project manager as leader)
        team.leader_id = owner.id

        # Add 3-5 members to the team
        await session.refresh(project, attribute_names=["members"])
        project_members = project.members or []
        team_members = project_members[:5] if project_members else all_users[:3]
        for user in team_members:
            session.add(TeamMemberModel(team_id=team.id, user_id=user.id))

        # Link team to project
        session.add(TeamProjectModel(team_id=team.id, project_id=project.id))

    await session.flush()


async def seed_milestones_and_artifacts(session: AsyncSession, created_projects: list):
    """D-36: seed 2-3 milestones and 3 artifacts per project with varied statuses."""
    logger.info("... Kilometre taşları ve eserler oluşturuluyor (D-36)")

    MILESTONE_TEMPLATES = [
        {"name": "Faz 1 Tamamlandı", "status": "completed", "days_offset": -30},
        {"name": "MVP Yayını", "status": "in_progress", "days_offset": 30},
        {"name": "Final Teslimat", "status": "pending", "days_offset": 90},
    ]

    ARTIFACT_TEMPLATES = [
        {"name": "Gereksinim Dokümanı", "status": "completed"},
        {"name": "Tasarım Spesifikasyonu", "status": "in_progress"},
        {"name": "Test Raporu", "status": "not_created"},
    ]

    today = date.today()

    for project in created_projects:
        # 3 milestones per project with varied statuses
        for ms_data in MILESTONE_TEMPLATES:
            target_dt = datetime.combine(
                today + timedelta(days=ms_data["days_offset"]),
                datetime.min.time()
            )
            milestone = MilestoneModel(
                project_id=project.id,
                name=ms_data["name"],
                status=ms_data["status"],
                target_date=target_dt,
            )
            session.add(milestone)

        # 3 artifacts per project with varied statuses
        for art_data in ARTIFACT_TEMPLATES:
            artifact = ArtifactModel(
                project_id=project.id,
                name=art_data["name"],
                status=art_data["status"],
            )
            session.add(artifact)

    await session.flush()
