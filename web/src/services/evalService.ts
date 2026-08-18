import { apiRequest } from '@/lib/apiClient';
import type { ApiResult, EvalItem, EvalRun, EvalSet, Grader } from '@/types/api';

const base = (projectSlug: string, promptSlug: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/prompts/${encodeURIComponent(promptSlug)}/evals`;

export function listEvalSets(projectSlug: string, promptSlug: string): Promise<ApiResult<{ items: EvalSet[] }>> {
  return apiRequest<{ items: EvalSet[] }>(base(projectSlug, promptSlug));
}

export interface CreateEvalSetPayload {
  slug: string;
  name: string;
  description?: string;
}
export function createEvalSet(
  projectSlug: string,
  promptSlug: string,
  payload: CreateEvalSetPayload,
): Promise<ApiResult<EvalSet>> {
  return apiRequest<EvalSet>(base(projectSlug, promptSlug), { method: 'POST', body: payload });
}

export function deleteEvalSet(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
): Promise<ApiResult<null>> {
  return apiRequest<null>(`${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}`, { method: 'DELETE' });
}

export function listEvalItems(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
): Promise<ApiResult<{ items: EvalItem[] }>> {
  return apiRequest<{ items: EvalItem[] }>(`${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/items`);
}

export interface CreateEvalItemPayload {
  name: string;
  inputVarsJson?: Record<string, string>;
  grader: Grader;
  expected?: string;
  judgePrompt?: string;
}
export function createEvalItem(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
  payload: CreateEvalItemPayload,
): Promise<ApiResult<EvalItem>> {
  return apiRequest<EvalItem>(`${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/items`, {
    method: 'POST',
    body: payload,
  });
}

export function deleteEvalItem(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
  itemId: string,
): Promise<ApiResult<null>> {
  return apiRequest<null>(
    `${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  );
}

export function triggerEvalRun(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
  versionNumber: number,
): Promise<ApiResult<EvalRun>> {
  return apiRequest<EvalRun>(`${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/runs`, {
    method: 'POST',
    body: { versionNumber },
  });
}

export function listEvalRuns(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
): Promise<ApiResult<{ items: EvalRun[] }>> {
  return apiRequest<{ items: EvalRun[] }>(`${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/runs`);
}

export function getEvalRun(
  projectSlug: string,
  promptSlug: string,
  setSlug: string,
  runId: string,
): Promise<ApiResult<EvalRun>> {
  return apiRequest<EvalRun>(
    `${base(projectSlug, promptSlug)}/${encodeURIComponent(setSlug)}/runs/${encodeURIComponent(runId)}`,
  );
}
