import { z } from 'zod';

export const ModelTier = z.enum(['haiku', 'sonnet', 'opus']);
export type ModelTier = z.infer<typeof ModelTier>;

export const Provider = z.enum(['anthropic', 'openai']);
export type Provider = z.infer<typeof Provider>;

export const Slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'must be lowercase alphanumeric or hyphens');

export const ProjectCreate = z.object({
  slug: Slug,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
});
export type ProjectCreate = z.infer<typeof ProjectCreate>;

export const ProjectDTO = z.object({
  id: z.string(),
  slug: Slug,
  name: z.string(),
  description: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type ProjectDTO = z.infer<typeof ProjectDTO>;

export const PromptCreate = z.object({
  slug: Slug,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
});
export type PromptCreate = z.infer<typeof PromptCreate>;

export const PromptDTO = z.object({
  id: z.string(),
  projectId: z.string(),
  slug: Slug,
  name: z.string(),
  description: z.string(),
  latestVersionNumber: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type PromptDTO = z.infer<typeof PromptDTO>;

export const PromptVersionCreate = z.object({
  system: z.string().max(50_000),
  user: z.string().max(50_000),
  paramsSchemaJson: z.record(z.unknown()).optional(),
  tier: ModelTier.default('haiku'),
  temperature: z.number().min(0).max(2).default(0),
  maxTokens: z.number().int().positive().max(200_000).default(1000),
  message: z.string().max(300).optional().default(''),
});
export type PromptVersionCreate = z.infer<typeof PromptVersionCreate>;

export const PromptVersionDTO = z.object({
  id: z.string(),
  promptId: z.string(),
  versionNumber: z.number(),
  system: z.string(),
  user: z.string(),
  paramsSchemaJson: z.record(z.unknown()).nullable(),
  tier: ModelTier,
  temperature: z.number(),
  maxTokens: z.number(),
  message: z.string(),
  createdBy: z.string(),
  createdAt: z.number(),
});
export type PromptVersionDTO = z.infer<typeof PromptVersionDTO>;

export const EnvironmentName = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9-]+$/, 'lowercase alphanumeric + hyphens');

export const EnvironmentBinding = z.object({
  environmentName: EnvironmentName,
  promptSlug: Slug,
  versionNumber: z.number().int().positive(),
});
export type EnvironmentBinding = z.infer<typeof EnvironmentBinding>;

export const ApiKeyCreate = z.object({
  name: z.string().min(1).max(120),
  scope: z.enum(['read', 'write', 'admin']).default('read'),
});
export type ApiKeyCreate = z.infer<typeof ApiKeyCreate>;

export const ApiKeyDTO = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  name: z.string(),
  scope: z.enum(['read', 'write', 'admin']),
  keyPreview: z.string(),
  lastUsedAt: z.number().nullable(),
  createdAt: z.number(),
});
export type ApiKeyDTO = z.infer<typeof ApiKeyDTO>;

export const Grader = z.enum(['exact', 'substring', 'regex', 'llm-judge']);
export type Grader = z.infer<typeof Grader>;

export const EvalSetCreate = z.object({
  slug: Slug,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
});
export type EvalSetCreate = z.infer<typeof EvalSetCreate>;

export const EvalSetDTO = z.object({
  id: z.string(),
  projectId: z.string(),
  promptId: z.string(),
  slug: Slug,
  name: z.string(),
  description: z.string(),
  itemCount: z.number(),
  createdAt: z.number(),
});
export type EvalSetDTO = z.infer<typeof EvalSetDTO>;

export const EvalItemCreate = z.object({
  name: z.string().min(1).max(120),
  inputVarsJson: z.record(z.string()).default({}),
  grader: Grader.default('substring'),
  expected: z.string().max(20_000).default(''),
  judgePrompt: z.string().max(20_000).optional(),
});
export type EvalItemCreate = z.infer<typeof EvalItemCreate>;

export const EvalItemDTO = z.object({
  id: z.string(),
  evalSetId: z.string(),
  name: z.string(),
  inputVarsJson: z.record(z.string()),
  grader: Grader,
  expected: z.string(),
  judgePrompt: z.string().nullable(),
  createdAt: z.number(),
});
export type EvalItemDTO = z.infer<typeof EvalItemDTO>;

export const EvalRunTrigger = z.object({
  versionNumber: z.number().int().positive(),
});
export type EvalRunTrigger = z.infer<typeof EvalRunTrigger>;

export const EvalResultDTO = z.object({
  id: z.string(),
  evalItemId: z.string(),
  itemName: z.string(),
  grader: Grader,
  passed: z.boolean(),
  actual: z.string(),
  reason: z.string(),
  latencyMs: z.number(),
  tokensIn: z.number(),
  tokensOut: z.number(),
  costUsd: z.number(),
  errorMessage: z.string().nullable(),
});
export type EvalResultDTO = z.infer<typeof EvalResultDTO>;

export const EvalRunDTO = z.object({
  id: z.string(),
  evalSetId: z.string(),
  promptVersionId: z.string(),
  versionNumber: z.number(),
  status: z.enum(['pending', 'running', 'done', 'error']),
  totalItems: z.number(),
  passedItems: z.number(),
  failedItems: z.number(),
  errorItems: z.number(),
  totalCostUsd: z.number(),
  totalTokensIn: z.number(),
  totalTokensOut: z.number(),
  triggeredBy: z.string(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
  errorMessage: z.string().nullable(),
  results: z.array(EvalResultDTO).optional(),
});
export type EvalRunDTO = z.infer<typeof EvalRunDTO>;

export const ErrorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;
