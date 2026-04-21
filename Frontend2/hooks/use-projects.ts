import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type CreateProjectDTO } from '@/services/project-service';

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
// BL-01 fix: /api/v1/activity is admin-only. Non-admin callers receive HTTP 403 —
// swallow that and return an empty feed so the Dashboard widget degrades gracefully
// instead of surfacing a scary error toast. Other errors still propagate normally.
export function useGlobalActivity(limit = 20) {
  return useQuery({
    queryKey: ['activity', { limit }],
    queryFn: async () => {
      try {
        return await projectService.getActivity(limit, 0);
      } catch (err: unknown) {
        // Axios error shape: err.response.status === 403 for non-admin users
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          return { items: [], total: 0 };
        }
        throw err;
      }
    },
    // Don't retry on 403 — the user will never be upgraded to admin by a retry.
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
