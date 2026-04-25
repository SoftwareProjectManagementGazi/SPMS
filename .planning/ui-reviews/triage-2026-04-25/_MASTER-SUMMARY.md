# SPMS UI Triajı — Master Özet
**Tarih:** 2026-04-25
**Yöntem:** 12 paralel UI uzman ajanı, her biri bir ana sayfa için prototip (`New_Frontend/`) vs implementasyon (`Frontend2/`) karşılaştırması.
**Çıktılar:** `.planning/ui-reviews/triage-2026-04-25/{slug}.md` × 12

## Toplam bulgu: ~400 madde

| Sayfa | Eksik | Layout | Bilinmeyen extra | Bilinen extra | Hatalı kod | Toplam | Rapor |
|-------|-------|--------|------------------|---------------|-----------|--------|-------|
| Auth (login/register/forgot) | 7 | 11 | 4 | 4 (D-11) | 6 | 32 | [auth.md](./auth.md) |
| Dashboard | 7 | 11 | 4 | 0 | 8 | 30 | [dashboard.md](./dashboard.md) |
| My Tasks | 8 | 8 | 3 | 0 | 11 | 30 | [my-tasks.md](./my-tasks.md) |
| Projects List | 6 | 9 | 6 | 0 | 7 | 28 | [projects-list.md](./projects-list.md) |
| Create Project | 18 | 10 | 5 | 0 | 11 | 44 | [create-project.md](./create-project.md) |
| Project Detail | 18 | 12 | 9 | 0 | 11 | 50 | [project-detail.md](./project-detail.md) |
| Task Detail | 15 | 9 | 5 | 2 (intended) | 12 | 43 | [task-detail.md](./task-detail.md) |
| Workflow Editor | 11 | 9 | 13 | 0 | 11 | 44 | [workflow-editor.md](./workflow-editor.md) |
| Settings | 14 | 7 | 2 | 0 | 6 | 29 | [settings.md](./settings.md) |
| Reports | 11 | 0 | 1 | 0 | 3 | 15 | [reports.md](./reports.md) |
| Teams | 22 | 0 | 1 | 0 | 5 | 28 | [teams.md](./teams.md) |
| App Shell (sidebar+header) | 11 | 8 | 3 | 0 | 9 | 31 | [app-shell.md](./app-shell.md) |
| **TOPLAM** | **148** | **94** | **56** | **6** | **100** | **404** | |

---

## 🔴 Critical (Production'a çıkmadan önce mutlaka düzeltilmeli)

### Güvenlik (acil)
1. **Auth bypass** — `Frontend2/middleware.ts` cookie değerini doğrulamadan geçiriyor; `document.cookie="auth_session=1"` ile auth bypass mümkün ([app-shell.md](./app-shell.md))
2. **RBAC sızıntısı** — Sidebar'da Admin nav öğesi `isAdmin` kontrolü olmadan render ediliyor; ŞU AN her kullanıcıya Admin Paneli linki görünüyor ([app-shell.md](./app-shell.md))
3. **XSS riski** — Task detail yorumlarında DOMPurify yerine regex tabanlı sanitize ([task-detail.md](./task-detail.md))

### Sayfa-bazlı stub (kullanıcı production'da TODO mesajı görüyor)
4. **Reports sayfası tamamen stub** — "Reports page will be implemented in Phase 13." üretimde gösteriliyor; prototipte 179 satırlık tam uygulama (KPI×4, Burndown, Team Load, CFD, Lead/Cycle, Iteration Comparison, Phase Reports) ([reports.md](./reports.md))
5. **Teams sayfası tamamen stub** — "Teams page will be implemented in a later phase."; prototipte ~217 satırlık TeamsPage (kategori sidebar, takım kartları, search, view-switcher, klasör CRUD) ([teams.md](./teams.md))
6. **Admin Console tamamen yok** — Prototipte `admin.jsx` ~482 satır, 8 alt sekme; Frontend2'de hiç yok. Sidebar'daki Admin linki 404'e gidiyor ([settings.md](./settings.md))
7. **User Profile sayfası yok** — Header'daki "Profilim" butonu no-op ([settings.md](./settings.md))

### Dead/broken handlers
8. **Dashboard PortfolioTable** — `cursor: "pointer"` ama `onClick` handler yok; navigasyon kayıp ([dashboard.md](./dashboard.md))
9. **Workflow Editor mode toggle** — Lifecycle ↔ "Görev Durumları" SegmentedControl URL'e yazıyor ama tek bir state var; status moduna geçince hiçbir görsel etki olmuyor (dead control) ([workflow-editor.md](./workflow-editor.md))
10. **Sidebar user widget** — `PLACEHOLDER_USER`/"Member" gösteriyor; gerçek `useAuth().user` bağlanmamış ([app-shell.md](./app-shell.md))

### Sayfa anatomisi yanlış
11. **Project Detail page header** — Tek satırlık dense layout (key chip + methodology Badge + status Badge + İş akışı/MoreH/Yeni Görev butonları + alt satırda tarih/üye/görev/sprint meta + AvatarStack) tamamen kayıp; başlık 24px tek satıra "key · methodology" ile düşürülmüş, sağda tek "Düzenle" butonu kalmış ([project-detail.md](./project-detail.md))
12. **Task Detail header** — Sıra bozuk: prototip breadcrumb → bug-icon + büyük başlık → Watch/Link/Branch + MoreH; implementasyonda breadcrumb sadece subtask için, başlık altında "key · type" satırı eklenmiş, Link/Branch/MoreH komple düşmüş ([task-detail.md](./task-detail.md))
13. **Create Project Step 3** — Prototipteki interaktif WorkflowCanvas + sağ panel (Akış Modu/Selection/Validation) yerine read-only "ok→ok" pill listesi; Step 4'ün %75'i (Görev Alanları, Davranış Kuralları, Üye Davet kartları) eksik; Step 1'de Proje Yöneticisi seçici eksik ([create-project.md](./create-project.md))
14. **Auth sağ panel marka içeriği** — Headline, paragraph, 4 stat-card ve badge tamamen yeniden yazılmış; D-11 onayı dışı bir yeniden yazım. Prototip "Waterfall'dan Scrum'a — tek platform" + (120+ Aktif proje, 99.9% uptime, vs) yerine implementasyon "Projelerinizi tek yerden" + (4 Metodoloji, 16+ UI bileşeni) gösteriyor ([auth.md](./auth.md))
15. **Projects List ProjectCard** — Footer görev sayacı broken (`{görev}` kelimesi sayı olmadan basılıyor); ekip avatar yığını yerine yalnız manager; methodology badge sabit `neutral` (scrum/kanban/waterfall renk-kodlama silinmiş) ([projects-list.md](./projects-list.md))

---

## 🟠 High (UX/işlevsel kalite)

- **My Tasks "All Tasks" header cap** — `task-group-list.tsx:181` early-return ile sticky cap kayıp ([my-tasks.md](./my-tasks.md))
- **My Tasks task key görünürlük** — Render ediliyor ama `fg-subtle` + 10.8px font ile neredeyse görünmez (kullanıcı "yok" sandı, aslında "kontrast ölü") ([my-tasks.md](./my-tasks.md))
- **Header Notification Bell + Help eksik** ([app-shell.md](./app-shell.md))
- **Header'da intentional olmayan Moon/Sun toggle eklenmiş** — prototipte yok ([app-shell.md](./app-shell.md))
- **Workflow Editor Minimap** — `showMiniMap={false}` ile hiç render edilmiyor; BFS-driven node states `phaseTransitions: []` boş geçildiği için active/past faz görselleri ortaya çıkmıyor ([workflow-editor.md](./workflow-editor.md))
- **Task Detail sub-tasks grid** — 5-sütunlu prototip yapısından (key + checkbox + title + status badge + avatar) sapmış (checkbox kayıp, due-date sütunu eklenmiş, Badge tone hep "neutral") ([task-detail.md](./task-detail.md))
- **Task Detail sidebar** — Reporter / Sprint badge / Etiket name / Bağımlılıklar bölümü eksik ([task-detail.md](./task-detail.md))
- **Settings Security** — 2FA + Active Sessions kartları eksik; password değişikliği endpoint paylaşımı ve `canChangePassword` validasyonu disable'a bağlanmamış ([settings.md](./settings.md))
- **Settings Profile** — 4 alan eksik (Görünen ad / Telefon / Departman / Unvan) ([settings.md](./settings.md))
- **Settings Appearance** — WCAG preview + "Yeni tema olarak kaydet" + "Özel Temalarım" kartı eksik ([settings.md](./settings.md))
- **Tüm sayfalarda i18n eksikliği** (özellikle Reports, Settings, Teams stub mesajları İngilizce sabit)
- **Dashboard tipografi hiyerarşisi düşürülmüş** — Header H1 24→20, StatCard değer 28→20 (büyük rakam hiyerarşisi yok olmuş) ([dashboard.md](./dashboard.md))

---

## 🟡 Medium / Low

Sayfa-bazlı raporlarda detaylı listelendi (toplam ~270+ madde). Bunlar tek tek prioritize tablolarında.

---

## ✅ Bilinen intentional değişiklikler (uyarı, hata değil)

| Değişiklik | Sayfa | Durum |
|------------|-------|-------|
| Attachments / Ekler bölümü | Task Detail | Kullanıcı bilerek ekledi (uyarı) |
| Rich text editor | Task Detail | Kullanıcı bilerek ekledi (uyarı) — **ancak ajan inceledi: "rich text in comments" claim'i implementasyonda mevcut değil — sadece textarea + manuel HTML mention enjeksiyonu**. Açıklama için belki sıkıntı, comment için çelişki var. |
| D-11: Register screen kaldırılmış | Auth | Onaylı |
| D-11: Google OAuth eklenmiş | Auth | Onaylı |
| D-11: Divider eklenmiş | Auth | Onaylı |
| D-11: Kayıt-link kaldırılmış | Auth | Onaylı |

---

## Toplam mod (sweep'in ne kadar büyük olacağı)

- **Critical madde sayısı:** ~25
- **High madde sayısı:** ~80
- **Medium madde sayısı:** ~150
- **Low madde sayısı:** ~150
- **Toplam:** ~404

**Tahmini sweep eforu:** Critical + High = ~105 madde, sayfa başına 5-10 madde. Tipik sayfa 1-3 saat tamir alabilir. 12 sayfa × ortalama 2 saat = 24 saat fokus iş. Paralel ajan sweep'iyle 3-6 saatte iniş yapılabilir.

---

## Önerilen sweep sırası (bağımlılık + risk önceliği)

1. **App Shell** — auth bypass + RBAC sızıntısı + sidebar user binding (her sayfayı etkiler)
2. **Auth** — D-11 kapsamı dışı brand içeriğini geri yükle, i18n ekle
3. **My Tasks** — kullanıcı zaten örnek vermişti; öncelik
4. **Project Detail** — page header ve tab yapısı (board/activity/lifecycle)
5. **Task Detail** — header + sub-tasks + sidebar
6. **Create Project** — Step 3 canvas
7. **Workflow Editor** — mode toggle + minimap
8. **Dashboard** — handler + tipografi
9. **Projects List** — card footer + methodology
10. **Settings** — Admin Console + User Profile sayfaları + 2FA/Sessions
11. **Reports** — sıfırdan inşa (KPI + 5 grafik + Phase Reports)
12. **Teams** — sıfırdan inşa (sidebar + grid + folder CRUD)

---

## Sonraki adım

Kullanıcının onayı ile **full sweep** başlayacak. Sweep iki şekilde yapılabilir:

**Opsiyon A — Sayfa-bazlı paralel sweep ajanları (12 ajan):**
Her sayfa için bir uygulayıcı ajan; her ajan kendi raporundaki Critical + High maddeleri uygular, atomik commit atar. Hız ↑, koordinasyon riski ↑.

**Opsiyon B — Sıralı sweep (yukarıdaki bağımlılık sırasıyla):**
Ana thread'de veya tek bir ajanla sayfa-sayfa ilerlenir. Hız ↓, koordinasyon güvenli ↑.

**Opsiyon C — Sadece Critical:**
Önce 25 Critical madde tek pass, kullanıcı onaylar, sonra High/Medium ayrı pass'lerde.

Kullanıcı tercihi bekleniyor.
