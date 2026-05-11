import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface SprintCreateData {
  project_id: number;
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

async function fetchSprints(projectId: number): Promise<Sprint[]> {
  const res = await apiClient.get<Sprint[]>('/sprints/', {
    params: { project_id: projectId },
  });
  return res.data;
}

export function useSprints(projectId: number | null) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => fetchSprints(projectId!),
    enabled: projectId !== null,
    staleTime: 60_000,
  });
}

export function useCreateSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SprintCreateData) =>
      apiClient.post<Sprint>('/sprints/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });
}

export function useActivateSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: number) =>
      apiClient.patch<Sprint>(`/sprints/${sprintId}`, { is_active: true }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });
}

export function useCloseSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sprintId,
      moveTasksToSprintId,
    }: {
      sprintId: number;
      moveTasksToSprintId: number | null;
    }) =>
      apiClient
        .patch(`/sprints/${sprintId}/close`, {
          move_tasks_to_sprint_id: moveTasksToSprintId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sprintId,
      moveTasksTo,
    }: {
      sprintId: number;
      moveTasksTo: number | null;
    }) =>
      apiClient
        .delete(`/sprints/${sprintId}`, {
          params: moveTasksTo != null ? { move_tasks_to: moveTasksTo } : {},
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
