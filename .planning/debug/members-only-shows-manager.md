---
status: resolved
slug: members-only-shows-manager
trigger: "bir projenin içine girdiğimde üyeler bölümü var ya orda hep proje yöneticisinin isimleri var. diğer o projeye dahil kişilerin ismi yok bu neyden dolayı kaynaklanıyor hallet"
created: 2026-05-08
updated: 2026-05-08
---

## Symptoms

- **Expected:** Proje detay sayfasındaki üyeler (members) bölümünde o projeye dahil tüm kullanıcılar görünmeli.
- **Actual:** Sadece proje yöneticisinin (manager) adı görünüyor, diğer üyeler listelenmıyor.
- **Errors:** Konsol veya network'te hata yok.
- **Timeline:** Frontend2 klasörüne geçişten itibaren oluşmuş olabilir (yeni arayüz).
- **Reproduction:** Herhangi bir projenin içine gir → üyeler bölümüne bak → sadece yönetici görünüyor.

## Current Focus

- hypothesis: "MembersTab bileşeni kasıtlı olarak stub (faz 11) bırakılmış; sadece proje yöneticisini DTO'dan gösteriyor. Faz 12+ için 'GET /projects/{id}/members gerekli' notu var."
- test: "useProjectMembers hook ve projectService.getMembers Frontend2'de mevcut. Backend endpoint de var."
- expecting: "MembersTab'ı useProjectMembers hook'unu çağıracak şekilde yeniden yazarak tüm üyeleri listelemek sorunu çözecek."
- next_action: "resolved"

## Evidence

- timestamp: 2026-05-08
  file: Frontend2/components/project-detail/members-tab.tsx
  finding: >
    Component was an intentional stub. Lines 8-9 comment: "The full member list
    requires GET /api/v1/projects/{id}/members which is not yet implemented
    (Phase 12+)." It only rendered project.managerName from the project DTO.

- timestamp: 2026-05-08
  file: Backend/app/api/v1/projects.py (line 285)
  finding: >
    GET /{project_id}/members endpoint already exists and returns
    List[ProjectMemberDTO] with full_name, role_name, avatar_path.

- timestamp: 2026-05-08
  file: Frontend2/hooks/use-projects.ts (line 31)
  finding: >
    useProjectMembers(projectId, q?) hook already implemented via TanStack Query,
    calls projectService.getMembers.

- timestamp: 2026-05-08
  file: Frontend2/services/project-service.ts (line 143)
  finding: >
    projectService.getMembers already calls GET /projects/{projectId}/members
    and maps the response to ProjectMember[].

## Eliminated

- Backend missing endpoint: endpoint exists at GET /projects/{id}/members
- Hook missing: useProjectMembers exists in hooks/use-projects.ts
- Service missing: projectService.getMembers exists in services/project-service.ts

## Resolution

- root_cause: "MembersTab was intentionally left as a Phase 11 stub that only showed the project manager from the project DTO. The backend endpoint and frontend service/hook were all already implemented but the component never called them."
- fix: "Rewrote MembersTab to call useProjectMembers(project.id), render a loading state, error state, empty state, and iterate over all returned members with role badges. Manager detection uses roleName === 'manager' OR id === project.managerId."
- verification: "Navigate to any project → Members tab → all project members should now appear with their roles."
- files_changed:
  - Frontend2/components/project-detail/members-tab.tsx
