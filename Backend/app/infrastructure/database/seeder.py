import logging
import random
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.project import ProjectModel, Methodology, project_members
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.task import TaskModel, TaskPriority
from app.infrastructure.database.models.comment import CommentModel
from app.infrastructure.database.models.notification import NotificationModel, NotificationType
from app.infrastructure.security import get_password_hash

logger = logging.getLogger(__name__)

# --- Constants & Data ---

INITIAL_ROLES = [
    {"name": "Admin", "description": "Administrator with full access"},
    {"name": "Project Manager", "description": "Manages projects and teams"},
    {"name": "Member", "description": "Project member can view and work on tasks"},
]

USERS_DATA = [
    {
        "email": "admin@spms.com",
        "password": "admin",
        "full_name": "System Administrator",
        "role": "Admin",
        "avatar": "https://i.pravatar.cc/150?u=admin"
    },
    {
        "email": "manager@spms.com",
        "password": "password",
        "full_name": "Alice Manager",
        "role": "Project Manager",
        "avatar": "https://i.pravatar.cc/150?u=alice"
    },
    {
        "email": "dev@spms.com",
        "password": "password",
        "full_name": "Bob Developer",
        "role": "Member",
        "avatar": "https://i.pravatar.cc/150?u=bob"
    },
    {
        "email": "qa@spms.com",
        "password": "password",
        "full_name": "Charlie Tester",
        "role": "Member",
        "avatar": "https://i.pravatar.cc/150?u=charlie"
    },
    # Additional Users
    {"email": "david.lee@spms.com", "password": "password", "full_name": "David Lee", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=david"},
    {"email": "emma.white@spms.com", "password": "password", "full_name": "Emma White", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=emma"},
    {"email": "frank.wright@spms.com", "password": "password", "full_name": "Frank Wright", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=frank"},
    {"email": "grace.green@spms.com", "password": "password", "full_name": "Grace Green", "role": "Project Manager", "avatar": "https://i.pravatar.cc/150?u=grace"},
    {"email": "henry.black@spms.com", "password": "password", "full_name": "Henry Black", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=henry"},
    {"email": "isabel.grey@spms.com", "password": "password", "full_name": "Isabel Grey", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=isabel"},
    {"email": "jack.brown@spms.com", "password": "password", "full_name": "Jack Brown", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=jack"},
    {"email": "karen.davis@spms.com", "password": "password", "full_name": "Karen Davis", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=karen"},
    {"email": "leo.wilson@spms.com", "password": "password", "full_name": "Leo Wilson", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=leo"},
    {"email": "mia.thomas@spms.com", "password": "password", "full_name": "Mia Thomas", "role": "Member", "avatar": "https://i.pravatar.cc/150?u=mia"},
]

PROJECTS_DATA = [
    {
        "name": "E-Commerce Revamp",
        "key": "ECM",
        "description": "Modernizing the main e-commerce platform.",
        "methodology": Methodology.SCRUM,
        "manager_email": "manager@spms.com",
        "members": ["dev@spms.com", "qa@spms.com", "david.lee@spms.com", "emma.white@spms.com", "frank.wright@spms.com"]
    },
    {
        "name": "Internal Tools",
        "key": "INT",
        "description": "Maintenance of internal HR and Finance tools.",
        "methodology": Methodology.KANBAN,
        "manager_email": "grace.green@spms.com",
        "members": ["dev@spms.com", "henry.black@spms.com", "isabel.grey@spms.com", "jack.brown@spms.com"]
    },
    {
        "name": "Legacy Migration",
        "key": "LEG",
        "description": "Moving legacy data to the new cloud infrastructure.",
        "methodology": Methodology.WATERFALL,
        "manager_email": "manager@spms.com",
        "members": ["qa@spms.com", "karen.davis@spms.com", "leo.wilson@spms.com", "mia.thomas@spms.com"]
    }
]

# --- Seeder Functions ---

async def seed_data(session: AsyncSession):
    """
    Orchestrates the seeding process.
    """
    try:
        logger.info("Starting database seed...")
        
        roles_map = await seed_roles(session)
        users_map = await seed_users(session, roles_map)
        projects_map = await seed_projects(session, users_map)
        
        await seed_scrum_details(session, projects_map, users_map)
        await seed_kanban_details(session, projects_map, users_map)
        await seed_waterfall_details(session, projects_map, users_map)
        
        await session.commit()
        logger.info("Database seeding completed successfully.")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        await session.rollback()
        raise

async def seed_roles(session: AsyncSession):
    logger.info("Seeding roles...")
    result = await session.execute(select(RoleModel))
    existing_roles = result.scalars().all()
    roles_map = {r.name: r for r in existing_roles}

    for role_data in INITIAL_ROLES:
        if role_data["name"] not in roles_map:
            new_role = RoleModel(name=role_data["name"], description=role_data["description"])
            session.add(new_role)
            roles_map[role_data["name"]] = new_role
    
    await session.flush() # Ensure IDs are generated
    return roles_map

async def seed_users(session: AsyncSession, roles_map):
    logger.info("Seeding users...")
    result = await session.execute(select(UserModel))
    existing_users = result.scalars().all()
    users_map = {u.email: u for u in existing_users}

    for user_data in USERS_DATA:
        if user_data["email"] not in users_map:
            role = roles_map.get(user_data["role"])
            if not role:
                logger.warning(f"Role {user_data['role']} not found for user {user_data['email']}. Skipping.")
                continue

            new_user = UserModel(
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                is_active=True,
                role_id=role.id,
                avatar=user_data["avatar"]
            )
            session.add(new_user)
            users_map[user_data["email"]] = new_user
    
    await session.flush()
    return users_map

async def seed_projects(session: AsyncSession, users_map):
    logger.info("Seeding projects...")
    result = await session.execute(select(ProjectModel))
    existing_projects = result.scalars().all()
    projects_map = {p.key: p for p in existing_projects}

    for p_data in PROJECTS_DATA:
        if p_data["key"] not in projects_map:
            manager = users_map.get(p_data["manager_email"])
            new_project = ProjectModel(
                name=p_data["name"],
                key=p_data["key"],
                description=p_data["description"],
                methodology=p_data["methodology"],
                manager_id=manager.id if manager else None,
                start_date=date.today(),
                end_date=date.today() + timedelta(days=90)
            )
            
            # Add members
            if manager:
                 new_project.members.append(manager)
                 
            for member_email in p_data["members"]:
                member = users_map.get(member_email)
                if member:
                    new_project.members.append(member)
            
            session.add(new_project)
            projects_map[p_data["key"]] = new_project
    
    await session.flush()
    return projects_map

async def generate_tasks(session: AsyncSession, project: ProjectModel, sprints: list, col_map: dict):
    """
    Generates random tasks for a project, including parent-child relationships.
    """
    # Check if tasks already exist to avoid duplication on re-seed
    res = await session.execute(select(TaskModel).where(TaskModel.project_id == project.id))
    if res.scalars().first():
        logger.info(f"Tasks already exist for project {project.key}. Skipping task generation.")
        return

    # Reload project members to ensure we have access
    await session.refresh(project, attribute_names=['members'])
    members = project.members
    if not members:
        logger.warning(f"No members found for project {project.key}. Cannot assign tasks.")
        return

    priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]
    col_names = list(col_map.keys())

    # Generate 4-5 Parent Tasks
    num_parents = random.randint(4, 5)
    
    for i in range(num_parents):
        parent_title = f"{project.key} Feature {i+1}"
        reporter = random.choice(members)
        assignee = random.choice(members)
        
        # Randomly assign sprint if available
        sprint_id = random.choice(sprints).id if sprints else None
        
        # Randomly assign column (bias towards initial columns for parents?)
        # Let's just pick random.
        col_name = random.choice(col_names)
        
        parent_task = TaskModel(
            project_id=project.id,
            sprint_id=sprint_id,
            column_id=col_map[col_name].id,
            title=parent_title,
            description=f"High-level requirements for {parent_title}. This is a parent task.",
            priority=random.choice(priorities),
            points=random.randint(5, 13),
            assignee_id=assignee.id,
            reporter_id=reporter.id,
            parent_task_id=None
        )
        session.add(parent_task)
        await session.flush() # Flush to get ID for subtasks

        # Generate 2-6 Subtasks
        num_subs = random.randint(2, 6)
        for j in range(num_subs):
            sub_title = f"{parent_title} - Subtask {j+1}"
            sub_assignee = random.choice(members)
            sub_reporter = random.choice(members)
            
            sub_task = TaskModel(
                project_id=project.id,
                sprint_id=sprint_id, # Inherit sprint
                column_id=col_map[random.choice(col_names)].id, # Random column
                title=sub_title,
                description=f"Implementation details for {sub_title}.",
                priority=random.choice(priorities),
                points=random.randint(1, 5),
                assignee_id=sub_assignee.id,
                reporter_id=sub_reporter.id,
                parent_task_id=parent_task.id
            )
            session.add(sub_task)
            
            # Add a random comment occasionally
            if random.random() > 0.7:
                comment = CommentModel(
                    task_id=sub_task.id, # Needs flush? No, relationship or flush. We'll flush batch later or rely on session.
                    # Wait, if we don't flush sub_task, sub_task.id is None.
                    # We can't set task_id directly if None.
                    # But we can assume session.add(sub_task) will get ID on next flush/commit?
                    # No, for FK assignment we need ID or object relationship.
                    # Since CommentModel uses task_id, we need ID.
                    # Let's just skip comments inside this loop to avoid excessive flushing.
                    pass
                )

    await session.flush()


async def seed_scrum_details(session: AsyncSession, projects_map, users_map):
    project = projects_map.get("ECM")
    if not project: return

    # 1. Columns
    columns = ["Backlog", "To Do", "In Progress", "Review", "Done"]
    col_map = {}
    
    res = await session.execute(select(BoardColumnModel).where(BoardColumnModel.project_id == project.id))
    existing_cols = res.scalars().all()
    
    if not existing_cols:
        for idx, col_name in enumerate(columns):
            col = BoardColumnModel(project_id=project.id, name=col_name, order_index=idx)
            session.add(col)
            col_map[col_name] = col
        await session.flush()
    else:
        for col in existing_cols:
            col_map[col.name] = col

    # 2. Sprints
    sprints = []
    res = await session.execute(select(SprintModel).where(SprintModel.project_id == project.id))
    existing_sprints = res.scalars().all()
    if not existing_sprints:
        sprint1 = SprintModel(
            project_id=project.id, name="Sprint 1", goal="Setup Infrastructure",
            start_date=date.today(), end_date=date.today() + timedelta(days=14),
            is_active=True
        )
        sprint2 = SprintModel(
            project_id=project.id, name="Sprint 2", goal="Core Features",
            start_date=date.today() + timedelta(days=15), end_date=date.today() + timedelta(days=29),
            is_active=False
        )
        session.add_all([sprint1, sprint2])
        await session.flush()
        sprints = [sprint1, sprint2]
    else:
        sprints = existing_sprints

    # 3. Tasks
    await generate_tasks(session, project, sprints, col_map)
    
    # 4. Add Notification (Sample)
    # Check if we have tasks now
    res = await session.execute(select(TaskModel).where(TaskModel.project_id == project.id))
    task = res.scalars().first()
    if task and task.assignee_id:
        # Check if notification exists
        n_res = await session.execute(select(NotificationModel).where(
            NotificationModel.user_id == task.assignee_id, 
            NotificationModel.related_entity_id == task.id
        ))
        if not n_res.scalars().first():
             n1 = NotificationModel(
                user_id=task.assignee_id, message=f"You were assigned to '{task.title}'",
                type=NotificationType.TASK_ASSIGNED, related_entity_id=task.id
             )
             session.add(n1)


async def seed_kanban_details(session: AsyncSession, projects_map, users_map):
    project = projects_map.get("INT")
    if not project: return

    # Columns with WIP
    col_defs = [
        {"name": "To Do", "wip": 0},
        {"name": "In Progress", "wip": 3},
        {"name": "Testing", "wip": 2},
        {"name": "Done", "wip": 0}
    ]
    col_map = {}

    res = await session.execute(select(BoardColumnModel).where(BoardColumnModel.project_id == project.id))
    existing_cols = res.scalars().all()
    
    if not existing_cols:
        for idx, c_def in enumerate(col_defs):
            col = BoardColumnModel(
                project_id=project.id, name=c_def["name"], 
                order_index=idx, wip_limit=c_def["wip"]
            )
            session.add(col)
            col_map[c_def["name"]] = col
        await session.flush()
    else:
         for col in existing_cols:
            col_map[col.name] = col
    
    # Tasks
    await generate_tasks(session, project, [], col_map)

async def seed_waterfall_details(session: AsyncSession, projects_map, users_map):
    project = projects_map.get("LEG")
    if not project: return
    
    columns = ["Requirements", "Design", "Implementation", "Verification", "Maintenance"]
    col_map = {}
    
    res = await session.execute(select(BoardColumnModel).where(BoardColumnModel.project_id == project.id))
    existing_cols = res.scalars().all()
    
    if not existing_cols:
        for idx, col_name in enumerate(columns):
            col = BoardColumnModel(project_id=project.id, name=col_name, order_index=idx)
            session.add(col)
            col_map[col_name] = col
        await session.flush()
    else:
        for col in existing_cols:
            col_map[col.name] = col
            
    # Tasks
    await generate_tasks(session, project, [], col_map)