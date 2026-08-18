import { apiRequest } from '@/lib/apiClient';
import type { ApiResult, Project } from '@/types/api';

export function listProjects(): Promise<ApiResult<{ items: Project[] }>> {
  return apiRequest<{ items: Project[] }>('/projects');
}

export function getProject(slug: string): Promise<ApiResult<Project>> {
  return apiRequest<Project>(`/projects/${encodeURIComponent(slug)}`);
}

export interface CreateProjectPayload {
  slug: string;
  name: string;
  description?: string;
}

export function createProject(payload: CreateProjectPayload): Promise<ApiResult<Project>> {
  return apiRequest<Project>('/projects', { method: 'POST', body: payload });
}

export function deleteProject(slug: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/projects/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}
