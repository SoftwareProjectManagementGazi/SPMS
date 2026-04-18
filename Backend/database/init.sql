-- 1. ENUM TİPLERİNİN TANIMLANMASI (SDD 5.2.1 ve 5.3.1 referans alınarak)
CREATE TYPE methodology_type AS ENUM ('SCRUM', 'KANBAN', 'WATERFALL');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE task_status_type AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'REVIEW'); -- Varsayılan durumlar
CREATE TYPE notification_type AS ENUM ('TASK_ASSIGNED', 'COMMENT_ADDED', 'DEADLINE_APPROACHING', 'PROJECT_UPDATE');

-- 2. ROLES TABLOSU (SDD 5.1.1)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Admin, Proje Yöneticisi, Ekip Üyesi
    description TEXT
);

-- 3. USERS TABLOSU (SDD 5.1.1)
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at (DATA-01, DATA-02)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. PROJECTS TABLOSU (SDD 5.2.1)
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at (DATA-01, DATA-02)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    key VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    methodology methodology_type NOT NULL,
    start_date DATE,
    end_date DATE,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    custom_fields JSON,
    task_seq INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_projects_manager_id ON projects(manager_id);

-- Proje Üyeleri (Many-to-Many)
CREATE TABLE project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- 5. SPRINTS TABLOSU (SDD 5.2.1 - Sadece Scrum için)
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at (DATA-01, DATA-02)
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. BOARD_COLUMNS TABLOSU (SDD 5.5.1)
CREATE TABLE board_columns (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    wip_limit INTEGER DEFAULT 0
);

-- 7. TASKS TABLOSU (SDD 5.2.1)
-- TimestampedMixin: version, is_deleted, deleted_at (DATA-01, DATA-02)
-- Recurrence columns (DATA-03)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id INTEGER REFERENCES sprints(id) ON DELETE SET NULL,
    column_id INTEGER REFERENCES board_columns(id) ON DELETE SET NULL,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'MEDIUM',
    points INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    recurrence_interval VARCHAR(20),
    recurrence_end_date DATE,
    recurrence_count INTEGER,
    task_key VARCHAR(20),
    series_id VARCHAR(36)
);
CREATE INDEX ix_tasks_project_id ON tasks(project_id);
CREATE INDEX ix_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX ix_tasks_parent_task_id ON tasks(parent_task_id);

-- 8. COMMENTS TABLOSU (SDD 5.3.1)
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at (DATA-01, DATA-02)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. NOTIFICATIONS TABLOSU (SDD 5.3.1)
-- Hard delete — no TimestampedMixin (CONTEXT.md kararı)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id INTEGER,
    related_entity_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AUDIT_LOG TABLOSU (SDD Revizyon - Alan bazlı değişiklik izleme)
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_audit_log_id ON audit_log(id);
CREATE INDEX ix_audit_log_entity_id ON audit_log(entity_id);

-- 11. DOSYA VE ETİKETLER
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at (DATA-01, DATA-02)
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Görev-Etiket Many-to-Many
CREATE TABLE task_labels (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- 12. PHASE 2 TABLOLARI (AUTH-02, AUTH-03)

-- teams tablosu — global ekip varlığı
-- TimestampedMixin: version, updated_at, is_deleted, deleted_at
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- team_members — kullanıcı-ekip çoka çok ilişkisi (join table)
CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

-- team_projects — ekip-proje çoka çok ilişkisi (join table)
CREATE TABLE IF NOT EXISTS team_projects (
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, project_id)
);

-- notification_preferences — kullanıcı bildirim tercihleri
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferences JSON NOT NULL DEFAULT '{}',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deadline_days INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- task_dependencies — görev bağımlılıkları
CREATE TABLE IF NOT EXISTS task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'blocks',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_id)
);

-- task_watchers — görev takipçileri
CREATE TABLE IF NOT EXISTS task_watchers (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id)
);

-- password_reset_tokens — tek kullanımlık şifre sıfırlama tokenleri
-- Append-only: TimestampedMixin uygulanmaz (CONTEXT.md kararı)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id ON password_reset_tokens(user_id);
