import { apiRequest } from '@/lib/apiClient';
import type { ApiKey, ApiKeyWithSecret, ApiResult } from '@/types/api';

export function listApiKeys(): Promise<ApiResult<{ items: ApiKey[] }>> {
  return apiRequest<{ items: ApiKey[] }>('/keys');
}

export interface CreateApiKeyPayload {
  name: string;
  scope: 'read' | 'write' | 'admin';
  projectSlug?: string;
}

export function createApiKey(payload: CreateApiKeyPayload): Promise<ApiResult<ApiKeyWithSecret>> {
  return apiRequest<ApiKeyWithSecret>('/keys', { method: 'POST', body: payload });
}

export function revokeApiKey(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
