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

---

## GDPR/KVKK Uyumluluk Notu

**Tarih:** 2026-03-12
**Kapsam:** Phase 2 — Kimlik Doğrulama ve Ekip Yönetimi

### İşlenen Kişisel Veriler

| Veri Alanı | Amaç | Saklama Süresi |
|------------|------|----------------|
| Ad Soyad (full_name) | Kullanıcı kimliği ve profil görüntüleme | Hesap silinene kadar |
| E-posta adresi | Kimlik doğrulama, şifre sıfırlama | Hesap silinene kadar |
| Şifre (bcrypt hash) | Kimlik doğrulama | Hesap silinene kadar |
| Avatar dosyası (isteğe bağlı) | Profil fotoğrafı | Hesap silinene kadar veya kullanıcı değiştirene kadar |
| IP adresi (rate limiting) | Güvenlik — brute force koruması | Oturum süresince (bellekte) |
| Şifre sıfırlama tokeni (SHA-256 hash) | Tek kullanımlık parola sıfırlama | 30 dakika geçerlilik, kullanım sonrası işaretlenir |
| Giriş başarısızlık sayacı | Güvenlik — hesap kilitleme (5 deneme) | Bellekte, sunucu yeniden başlayana veya başarılı girişe kadar |

### Veri Minimizasyonu

- Yalnızca sistem işlevleri için zorunlu veriler toplanmaktadır.
- Avatar yükleme isteğe bağlıdır; varsayılan avatar gerekmez.
- Şifre sıfırlama tokenleri ham değil, SHA-256 hash olarak saklanır.

### Kullanıcı Hakları

- **Erişim:** Kullanıcı kendi profil verilerine `GET /auth/me` ile erişebilir.
- **Düzeltme:** Kullanıcı profil bilgilerini `PUT /auth/me` ile güncelleyebilir.
- **Silme:** Kullanıcı hesabı silindiğinde ilgili veriler kaldırılır (soft delete; kalıcı silme admin yetkisi gerektirir).

### Veri Güvenliği

- Şifreler bcrypt algoritması ile hashlenir; plaintext saklanmaz.
- JWT token'ları localStorage'da tutulmaktadır (v2'de HttpOnly cookie'ye geçiş planlanmaktadır).
- Avatar dizinine kimlik doğrulamasız erişim engellenmektedir.
- Rate limiting ve hesap kilitleme, brute force saldırılarına karşı koruma sağlar.

### Otomatik Silme ve İhracat

Bu fazda otomatik veri silme veya dışa aktarım akışı uygulanmamıştır.
KVKK "Silme Hakkı" tam uygulaması v2 kapsamında planlanmaktadır.
