import { apiRequest } from '@/lib/apiClient';
import type { ApiResult, Prompt, PromptVersion, ModelTier } from '@/types/api';

export function listPrompts(projectSlug: string): Promise<ApiResult<{ items: Prompt[] }>> {
  return apiRequest<{ items: Prompt[] }>(`/projects/${encodeURIComponent(projectSlug)}/prompts`);
}

export interface CreatePromptPayload {
  slug: string;
  name: string;
  description?: string;
}

export function createPrompt(projectSlug: string, payload: CreatePromptPayload): Promise<ApiResult<Prompt>> {
  return apiRequest<Prompt>(`/projects/${encodeURIComponent(projectSlug)}/prompts`, {
    method: 'POST',
    body: payload,
  });
}

export function deletePrompt(projectSlug: string, promptSlug: string): Promise<ApiResult<null>> {
  return apiRequest<null>(
    `/projects/${encodeURIComponent(projectSlug)}/prompts/${encodeURIComponent(promptSlug)}`,
    { method: 'DELETE' },
  );
}

export function listVersions(projectSlug: string, promptSlug: string): Promise<ApiResult<{ items: PromptVersion[] }>> {
  return apiRequest<{ items: PromptVersion[] }>(
    `/projects/${encodeURIComponent(projectSlug)}/prompts/${encodeURIComponent(promptSlug)}/versions`,
  );
}

export interface CreateVersionPayload {
  system: string;
  user: string;
  paramsSchemaJson?: Record<string, unknown>;
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  message?: string;
}

export function createVersion(
  projectSlug: string,
  promptSlug: string,
  payload: CreateVersionPayload,
): Promise<ApiResult<PromptVersion>> {
  return apiRequest<PromptVersion>(
    `/projects/${encodeURIComponent(projectSlug)}/prompts/${encodeURIComponent(promptSlug)}/versions`,
    { method: 'POST', body: payload },
  );
}

export function bindEnvironment(
  projectSlug: string,
  environmentName: string,
  payload: { promptSlug: string; versionNumber: number },
): Promise<ApiResult<{ environmentName: string; promptSlug: string; versionNumber: number }>> {
  return apiRequest(
    `/projects/${encodeURIComponent(projectSlug)}/environments/${encodeURIComponent(environmentName)}/bindings`,
    { method: 'POST', body: payload },
  );
}

export function fetchBoundVersion(
  projectSlug: string,
  environmentName: string,
  promptSlug: string,
): Promise<ApiResult<PromptVersion>> {
  return apiRequest<PromptVersion>(
    `/projects/${encodeURIComponent(projectSlug)}/environments/${encodeURIComponent(environmentName)}/prompts/${encodeURIComponent(promptSlug)}`,
  );
}
