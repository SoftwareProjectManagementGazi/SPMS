import logging
import random
from datetime import date, timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

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

async def seed_data(session: AsyncSession):
    try:
        # Check if data already exists to prevent duplication
        result = await session.execute(select(UserModel).limit(1))
        if result.scalars().first():
            logger.info("SEEDER: Veritabanı zaten dolu, işlem atlanıyor.")
            return

        logger.info("SEEDER: Veritabanı dolumu başlatılıyor...")
        
        roles_map = await seed_roles(session)
        users_map = await seed_users(session, roles_map)
        projects_map, created_projects = await seed_projects(session, users_map)

        await seed_scrum_details(session, projects_map["SPMS"], users_map)
        await seed_kanban_details(session, projects_map["MOB"], users_map)
        await seed_waterfall_details(session, projects_map["DATA"], users_map)
        await seed_scrum_details(session, projects_map["AI"], users_map)

        await seed_teams(session, projects_map, users_map)
        await seed_milestones_and_artifacts(session, created_projects)

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
            # D-36: process_config base structure (schema_version 1)
            project.process_config = {
                "schema_version": 1,
                "workflow": {"mode": "flexible", "nodes": [], "edges": [], "groups": []}
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

async def seed_scrum_details(session: AsyncSession, project, users_map):
    cols = ["Backlog", "To Do", "In Progress", "Code Review", "Done"]
    col_map = {}
    for idx, name in enumerate(cols):
        c = BoardColumnModel(project_id=project.id, name=name, order_index=idx)
        session.add(c)
        col_map[name] = c
    await session.flush()

    s1 = SprintModel(project_id=project.id, name="Sprint 1", goal="Altyapı", start_date=date.today()-timedelta(days=14), end_date=date.today(), is_active=False)
    s2 = SprintModel(project_id=project.id, name="Sprint 2", goal="MVP", start_date=date.today(), end_date=date.today()+timedelta(days=14), is_active=True)
    session.add_all([s1, s2])
    await session.flush()

    await generate_hierarchical_tasks(session, project, [s1, s2], col_map)

async def seed_kanban_details(session: AsyncSession, project, users_map):
    col_defs = [("To Do", 0), ("Analiz", 3), ("Geliştirme", 4), ("Test", 2), ("Done", 0)]
    col_map = {}
    for idx, (name, wip) in enumerate(col_defs):
        c = BoardColumnModel(project_id=project.id, name=name, order_index=idx, wip_limit=wip)
        session.add(c)
        col_map[name] = c
    await session.flush()
    
    await generate_hierarchical_tasks(session, project, [], col_map)

async def seed_waterfall_details(session: AsyncSession, project, users_map):
    cols = ["Gereksinim", "Analiz", "Tasarım", "Uygulama", "Test", "Bakım"]
    col_map = {}
    for idx, name in enumerate(cols):
        c = BoardColumnModel(project_id=project.id, name=name, order_index=idx)
        session.add(c)
        col_map[name] = c
    await session.flush()

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