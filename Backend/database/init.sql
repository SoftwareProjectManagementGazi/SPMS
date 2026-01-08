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
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash burada tutulacak
    avatar VARCHAR(255), -- Profil resmi yolu veya URL
    is_active BOOLEAN DEFAULT TRUE,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROJECTS TABLOSU (SDD 5.2.1)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    key VARCHAR(10) NOT NULL UNIQUE, -- Örn: "SPMS" (Task ID'leri için: SPMS-1)
    name VARCHAR(150) NOT NULL,
    description TEXT,
    methodology methodology_type NOT NULL, -- SCRUM, KANBAN, WATERFALL
    start_date DATE,
    end_date DATE,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Proje yöneticisi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    custom_fields JSON
);

-- Proje Üyeleri (Many-to-Many İlişkisi - ER Diyagramındaki "Üyesidir")
CREATE TABLE project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- 5. SPRINTS TABLOSU (SDD 5.2.1 - Sadece Scrum için)
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Örn: "Sprint 1"
    goal TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE, -- Aktif sprint kontrolü
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BOARD_COLUMNS TABLOSU (SDD 5.5.1 - Dinamik Kolon Yapısı)
-- Her projenin kendi kolon yapısı olabilir (To Do, In Progress, Test, Done vb.)
CREATE TABLE board_columns (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL, -- Kolon sırası (1, 2, 3...)
    wip_limit INTEGER DEFAULT 0 -- Kanban için Work In Progress limiti (0 = limitsiz)
);

-- 7. TASKS TABLOSU (SDD 5.2.1)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id INTEGER REFERENCES sprints(id) ON DELETE SET NULL, -- Null ise Backlog'dadır
    column_id INTEGER REFERENCES board_columns(id) ON DELETE SET NULL, -- Hangi kolonda?
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Görevi yapan kişi
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Görevi açan kişi
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'MEDIUM',
    points INTEGER, -- Story points (Scrum)
    
    is_recurring BOOLEAN DEFAULT FALSE, -- Tekrarlayan görev mi?
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, -- Alt görev/Bağımlılık ilişkisi
    
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMMENTS TABLOSU (SDD 5.3.1)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS TABLOSU (SDD 5.3.1)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Bildirimi alan kişi
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id INTEGER, -- İlgili Task ID veya Project ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. LOGS TABLOSU (SDD 5.2.1 - Audit Trail)
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, 
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- İşlemi yapan
    action VARCHAR(100) NOT NULL, -- "TASK_UPDATED", "SPRINT_CREATED" vb.
    changes JSONB, -- Değişiklik detayları (Eski/Yeni değer) JSON formatında
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 11. DOSYA VE ETİKETLER (ER Diyagramına göre ekler)
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL -- Hex kodu örn: #FF0000
);

-- Görev-Etiket Many-to-Many İlişkisi
CREATE TABLE task_labels (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);