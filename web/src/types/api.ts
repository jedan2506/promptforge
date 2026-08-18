export type ModelTier = 'haiku' | 'sonnet' | 'opus';
export type Provider = 'anthropic' | 'openai';

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  description: string;
  latestVersionNumber: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  system: string;
  user: string;
  paramsSchemaJson: Record<string, unknown> | null;
  tier: ModelTier;
  temperature: number;
  maxTokens: number;
  message: string;
  createdBy: string;
  createdAt: number;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorEnvelope['error'];
}

export type Grader = 'exact' | 'substring' | 'regex' | 'llm-judge';

export interface ApiKey {
  id: string;
  projectId: string | null;
  name: string;
  scope: 'read' | 'write' | 'admin';
  keyPreview: string;
  lastUsedAt: number | null;
  createdAt: number;
}

export interface ApiKeyWithSecret extends ApiKey {
  plaintextKey: string;
}

export interface EvalSet {
  id: string;
  projectId: string;
  promptId: string;
  slug: string;
  name: string;
  description: string;
  itemCount: number;
  createdAt: number;
}

export interface EvalItem {
  id: string;
  evalSetId: string;
  name: string;
  inputVarsJson: Record<string, string>;
  grader: Grader;
  expected: string;
  judgePrompt: string | null;
  createdAt: number;
}

export interface EvalResult {
  id: string;
  evalItemId: string;
  itemName: string;
  grader: Grader;
  passed: boolean;
  actual: string;
  reason: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  errorMessage: string | null;
}

export interface EvalRun {
  id: string;
  evalSetId: string;
  promptVersionId: string;
  versionNumber: number;
  status: 'pending' | 'running' | 'done' | 'error';
  totalItems: number;
  passedItems: number;
  failedItems: number;
  errorItems: number;
  totalCostUsd: number;
  totalTokensIn: number;
  totalTokensOut: number;
  triggeredBy: string;
  startedAt: number;
  completedAt: number | null;
  errorMessage: string | null;
  results?: EvalResult[];
}
