# SDD Revizyon Notları

Bu dosya, projenin Software Design Document (SDD) revizyonlarını ve şema değişikliklerini takip eder.

---

## Faz 2 — Yeni Tablo Şemaları (Phase 2 New Table Schemas)

**Tarih:** 2026-03-12
**Kapsam:** Phase 2 — Kimlik Doğrulama ve Ekip Yönetimi

### teams

Global ekip varlığı. Bir ekip birden fazla projeye atanabilir.

| Sütun | Tür | Kısıtlamalar | Açıklama |
|-------|-----|--------------|----------|
| id | SERIAL | PRIMARY KEY | |
| name | VARCHAR(100) | NOT NULL | Ekip adı |
| description | TEXT | | İsteğe bağlı açıklama |
| owner_id | INTEGER | NOT NULL, FK → users.id | Ekibi oluşturan kullanıcı |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| version | INTEGER | NOT NULL DEFAULT 1 | Optimistic locking (TimestampedMixin) |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| is_deleted | BOOLEAN | NOT NULL DEFAULT FALSE | Soft delete (TimestampedMixin) |
| deleted_at | TIMESTAMPTZ | | |

### team_members

Kullanıcı–ekip çoka çok ilişkisi (join table).

| Sütun | Tür | Kısıtlamalar | Açıklama |
|-------|-----|--------------|----------|
| team_id | INTEGER | PK, FK → teams.id ON DELETE CASCADE | |
| user_id | INTEGER | PK, FK → users.id ON DELETE CASCADE | |
| joined_at | TIMESTAMPTZ | DEFAULT now() | Üyelik tarihi |

### team_projects

Ekip–proje çoka çok ilişkisi (join table).

| Sütun | Tür | Kısıtlamalar | Açıklama |
|-------|-----|--------------|----------|
| team_id | INTEGER | PK, FK → teams.id ON DELETE CASCADE | |
| project_id | INTEGER | PK, FK → projects.id ON DELETE CASCADE | |
| assigned_at | TIMESTAMPTZ | DEFAULT now() | Atama tarihi |

### password_reset_tokens

Tek kullanımlık şifre sıfırlama tokenleri (append-only; TimestampedMixin uygulanmaz).

| Sütun | Tür | Kısıtlamalar | Açıklama |
|-------|-----|--------------|----------|
| id | SERIAL | PRIMARY KEY | |
| token_hash | VARCHAR(64) | NOT NULL UNIQUE | SHA-256 hash; plaintext saklanmaz |
| user_id | INTEGER | NOT NULL, FK → users.id ON DELETE CASCADE | |
| expires_at | TIMESTAMPTZ | NOT NULL | 30 dakika geçerlilik süresi |
| used_at | TIMESTAMPTZ | | Kullanıldığında doldurulur; NULL ise henüz kullanılmamış |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

İndeksler: `ix_password_reset_tokens_token_hash`, `ix_password_reset_tokens_user_id`
