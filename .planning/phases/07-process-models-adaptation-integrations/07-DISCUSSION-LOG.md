# Phase 7: Discussion Log

**Session:** 2026-04-10
**Areas discussed:** Process template content, Template customization scope, Config panel design, External integration choice

---

## Area 1: Process Template Content

**Q: What should a process template define when a project is created?**
Options: Columns + sprint length | Columns only | Columns + sprints + full event calendar
→ Selected: Columns + sprint length (Option 1 as baseline)
Notes: User specified SDD §5.5.1/5.5.3 compliance — dynamic columns with wip_limit, recurring events via existing tasks table fields (is_recurring, recurrence_type, recurrence_end_date), behavioral flags in process_config JSONB.

**Q: What are the built-in column sets for each methodology?**
→ Selected: SDD-defined defaults (fully Turkish)
Notes: SCRUM: İş Birikimi|Yapılacaklar|Devam Eden|İnceleme|Tamamlandı; KANBAN: Yapılacaklar|Devam Eden(WIP:3)|Test|Tamamlandı; WATERFALL: Gereksinimler|Tasarım|Geliştirme|Test|Dağıtım; ITERATIVE: Planlama|Analiz|Geliştirme|Değerlendirme. Initial seeds only — PM can customize after.

**Q: Which recurring tasks should be auto-created per methodology?**
→ Selected: Hybrid (all methodologies get seeds, all customizable)
Notes: SCRUM: Günlük Toplantı + Sprint Değerlendirmesi; KANBAN: Haftalık Senkronizasyon; WATERFALL: Aşama Değerlendirmesi; ITERATIVE: İterasyon Planlama. Phase 3 completion-loop handles future instances.

**Q: What are the methodology-specific behavioral flags?**
→ Selected: Hybrid (per-methodology defaults + user-overridable per project)
Notes: WATERFALL: enforce_sequential_dependencies=true; KANBAN: enforce_wip_limits=true; SCRUM: restrict_expired_sprints=true. All stored in process_config JSONB on projects table.

**Q: Should Kanban WIP limit enforcement be a hard block or warning toast?**
→ Selected: Warning toast (Option 1)
Notes: Column header turns amber/red when over limit. Turkish toast: "Uyarı: Bu kolon için belirlenen WIP (Aynı Anda Yapılan İş) limiti aşıldı!" Uses Phase 4 dnd-kit + sonner pattern.

**Q: Where does ITERATIVE methodology fit (missing from current enum)?**
→ Selected: Add ITERATIVE to enum + migration

**Q: How should PROC-05 recurring events be technically wired?**
→ Selected: Created at project creation (Option 1)
Notes: Must work across ALL methodologies — sprint-lifecycle hook would break non-sprint methodologies (Kanban, Waterfall). Universal creation + Phase 3 completion-loop is the correct architecture.

---

## Area 2: Template Customization Scope

**Q: What does PROC-04 'creating a new process model template' mean?**
→ Selected: Custom SDLC template stored globally (Option 1)
Notes: PROCESS_TEMPLATES table. Same payload as built-in seeds (columns + recurring_tasks + behavioral_flags). Selectable in project creation dropdown. Built-in 4 are read-only.

**Q: What happens to existing columns when methodology changes mid-project (ADAPT-01)?**
→ Selected: SDD §5.5.3 transition logic
Notes: No data loss — preserve columns/tasks. Archive active/future sprints when switching away from SCRUM. Inject new methodology's default behavioral flags into process_config. Confirmation dialog.

**Q: Where does Project Manager customize template for their project (PROC-03)?**
→ Selected: Project Settings tab (Recommended)
Notes: Extend Phase 4 Settings tab with 'Süreç Modeli' section: methodology badge, sprint duration, behavioral flag toggles.

**Q: Where does Admin manage global process templates (ADAPT-02)?**
→ Selected: New /admin/process-templates route
Notes: Admin-only (RBAC per SDD §4.1.1). Built-in templates read-only (view only). Full CRUD on custom templates only.

---

## Area 3: Config Panel Design

**Q: Which system parameters are configurable without restart (ADAPT-05)?**
→ Selected: SDD-specified + zero-downtime architecture
Notes: Varsayılan Döngü Süresi (sprint days), Maksimum Görev Sınırı (WIP fallback), Varsayılan Bildirim Frekansı (Anında/Saatlik/Günlük). SYSTEM_CONFIG table, cached singleton with refresh on update.

**Q: Module toggles (ADAPT-04)?**
→ Selected: Reporting module toggle only
Notes: When off: sidebar item removed, /reports returns 403. Stored in SYSTEM_CONFIG.

**Q: Where does admin config panel live?**
→ Selected: Extend /admin with /admin/settings sub-page
Notes: /admin space: Process Templates | System Settings. Admin role only.

**Q: ADAPT-03 UI theming scope?**
→ Selected: Comprehensive theming (SPMS-ADAPT-3)
Notes: Primary brand color + chart themes → SYSTEM_CONFIG → CSS custom properties. Status label colors → board_columns.color field. All injected dynamically, no restart. Labels in Turkish.

---

## Area 4: External Integration Choice

**Q: Which external service for EXT-01?**
→ Selected: Slack + Microsoft Teams (both)
Notes: Google Calendar explicitly deferred. Webhook-based, no OAuth needed.

**Q: What events trigger outbound notifications?**
→ Selected: Three balanced events
Notes: project.created, task.assigned, task.status_changed. Turkish messages with emoji prefixes.

**Q: How do users configure webhook URL (EXT-03/04)?**
→ Selected: Per-project routing with admin master switch
Notes: 'Entegrasyonlar' section in Project Settings. Stored in process_config JSONB. 'Bağlantıyı Test Et' button. Admin master switch 'Dış Entegrasyonlar Aktif' in /admin/settings.

**Q: Integration service layer architecture (EXT-02/05)?**
→ Selected: IIntegrationService interface + adapters (Recommended)
Notes: Slack + Teams as separate adapter classes. Factory maps platform → implementation. Adding new integration = new class only.

---

*Discussion log for human reference only. Not consumed by downstream agents.*
