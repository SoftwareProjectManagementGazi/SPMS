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
// 60s staleTime keeps the dropdown snappy when the user opens it repeatedly
// without firing redundant fetches; mutations on /projects/{id}/members
// invalidate this key explicitly.
export function useProjectMembers(projectId: number | string | null) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectService.getMembers(projectId!),
    enabled: !!projectId,
    staleTime: 60 * 1000,
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

// D-26: task statistics for Dashboard StatCard 4 (W6 fix)
export function useTaskStats() {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: () => projectService.getTaskStats(),
    staleTime: 30 * 1000,
  });
}
