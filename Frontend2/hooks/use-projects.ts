import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type CreateProjectDTO } from '@/services/project-service';
import { useAuth } from '@/context/auth-context';

// Status-filtered project list (D-24, PROJ-05)
export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', { status }],
    queryFn: () => projectService.getAll(status),
  });
}

export function useProject(id: string | number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
}

// Project member roster — used by the Task Detail assignee picker.
//
// Optional `q` parameter triggers backend-side full_name substring filtering
// so the picker can search-as-you-type. Caller is expected to pass an
// already-debounced string; React Query keeps each `q` slot cached
// independently for 30s so back-and-forth typing doesn't refetch the same
// query string repeatedly.
//
// `staleTime` is shorter when q is set (30s) so a new project member added
// mid-search shows up faster than the unsearched-list cache would suggest.
export function useProjectMembers(
  projectId: number | string | null,
  q?: string,
) {
  const trimmed = q?.trim() ?? ''
  return useQuery({
    queryKey: ['projects', projectId, 'members', { q: trimmed }],
    queryFn: () => projectService.getMembers(projectId!, trimmed || undefined),
    enabled: !!projectId,
    staleTime: trimmed ? 30 * 1000 : 60 * 1000,
  });
}

// Status update mutation (D-25, PROJ-02)
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectService.updateStatus(id, status),
    onSettled: () => {
      // Refetch on success AND error — if the mutation failed because the
      // project no longer exists or permission changed, the stale list needs
      // to go away so the user can see current state.
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    // D-07: onError toast is wired at the call site (components import showToast)
  });
}

// Phase 14 Plan 14-05 — admin-tab project delete mutation.
//
// Backend DELETE /projects/{id} returns 204 (Phase 9-10). On success we
// invalidate the projects list cache so the row disappears from the admin
// table after the two-step typing confirm. Errors surface via the call site
// (admin-project-row-actions.tsx wires the toast).
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => projectService.delete(projectId),
    onSettled: () => {
      // Refetch on success AND error — same rationale as useUpdateProjectStatus:
      // a stale list after a permission/state change should not linger.
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Create wizard mutation (PROJ-01)
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDTO) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Activity feed for dashboard.
// BL-01 fix: /api/v1/activity is admin-only — non-admin callers get HTTP 403.
// UAT round-4 fix: GATE the request on `user.role === "Admin"` so the request
// is never even fired for non-admin users. Suppressing the global axios
// console.error via expectedFailureCodes:[403] silenced the JS-side log, but
// Chrome DevTools still highlights any 4xx response in red at the network
// layer — that browser-level red ink isn't suppressible from JS. The clean
// fix is to skip the call entirely for non-admins; the dashboard widget
// already renders an empty feed when `data` is undefined/empty.
export function useGlobalActivity(limit = 20) {
  const { user } = useAuth();
  const isAdmin = user?.role?.name?.toLowerCase() === 'admin';
  return useQuery({
    queryKey: ['activity', { limit }],
    queryFn: async () => {
      try {
        return await projectService.getActivity(limit, 0);
      } catch (err: unknown) {
        // Defense-in-depth: even with the admin gate, if a real admin somehow
        // hits a 403 (server-side role drift, expired token edge case), keep
        // the existing graceful-degrade behavior so the widget shows empty
        // instead of crashing the dashboard.
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          return { items: [], total: 0 };
        }
        throw err;
      }
    },
    enabled: isAdmin,
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) return false;
      return failureCount < 3;
    },
  });
}

// Process templates for wizard step 2.
// Callers can read both `data` and `isLoading` to distinguish the loading
// state from the legitimate empty-result state (an admin deleted every
// template). Defaulting `data = []` here conflates those two scenarios.
export function useProcessTemplates() {
  return useQuery({
    queryKey: ['process-templates'],
    queryFn: projectService.getProcessTemplates,
    staleTime: 5 * 60 * 1000, // Templates rarely change — 5 min stale
  });
}

// Phase 14 Plan 14-06 — admin Workflows tab Klonla mutation.
//
// Clone is implemented client-side (GET source + POST new with "(Kopya)" /
// "(Copy)" name suffix) because no backend /clone endpoint exists and Plan
// 14-06 critical_constraints forbid adding one. Cache invalidation rolls
// the new clone into the existing list immediately.
export function useCloneTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nameSuffix }: { id: number; nameSuffix: string }) =>
      projectService.cloneProcessTemplate(id, nameSuffix),
    onSettled: () => {
      // Refetch on success AND error — clone may partially succeed (POST
      // landed but local state is stale) and a forced refetch keeps the UI
      // honest.
      queryClient.invalidateQueries({ queryKey: ['process-templates'] });
    },
  });
}

// Phase 14 Plan 14-06 — admin Workflows tab Sil mutation.
//
// Backend DELETE /process-templates/{id} returns 204; built-in templates
// raise 403 PermissionError. The admin UI gates this action via an
// impact-aware Modal (warns when the template is in use by N active
// projects + requires a "Yine de sil" secondary checkbox before the
// danger CTA enables) so an accidental Sil click can't trigger the call.
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) =>
      projectService.deleteProcessTemplate(templateId),
    onSettled: () => {
      // Same rationale as useDeleteProject — invalidate even on error so a
      // stale list after a permission/state change cannot linger.
      queryClient.invalidateQueries({ queryKey: ['process-templates'] });
    },
  });
}

// D-26: task statistics for Dashboard StatCard 4 (W6 fix)
export function useTaskStats() {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: () => projectService.getTaskStats(),
    staleTime: 30 * 1000,
  });
}
