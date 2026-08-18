import { pgTable, text, integer, real, timestamp, uniqueIndex, index, jsonb, boolean } from 'drizzle-orm/pg-core';

// --- Projects ---
export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex('projects_slug_unique').on(t.slug),
  }),
);

// --- Prompts (a named prompt within a project) ---
export const prompts = pgTable(
  'prompts',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectSlugUnique: uniqueIndex('prompts_project_slug_unique').on(t.projectId, t.slug),
    byProject: index('prompts_project_idx').on(t.projectId),
  }),
);

// --- Prompt versions (immutable, monotonically numbered per prompt) ---
export const promptVersions = pgTable(
  'prompt_versions',
  {
    id: text('id').primaryKey(),
    promptId: text('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    system: text('system').notNull(),
    user: text('user_template').notNull(),
    paramsSchemaJson: jsonb('params_schema_json'),
    tier: text('tier').notNull().default('haiku'),
    temperature: real('temperature').notNull().default(0),
    maxTokens: integer('max_tokens').notNull().default(1000),
    message: text('message').notNull().default(''),
    createdBy: text('created_by').notNull().default('system'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    promptVersionUnique: uniqueIndex('prompt_versions_prompt_version_unique').on(t.promptId, t.versionNumber),
    byPrompt: index('prompt_versions_prompt_idx').on(t.promptId, t.versionNumber),
  }),
);

// --- Environment bindings (e.g. "prod" points to prompt X version 7) ---
export const environmentBindings = pgTable(
  'environment_bindings',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    environmentName: text('environment_name').notNull(),
    promptId: text('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    promptVersionId: text('prompt_version_id')
      .notNull()
      .references(() => promptVersions.id, { onDelete: 'restrict' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by').notNull().default('system'),
  },
  (t) => ({
    envPromptUnique: uniqueIndex('env_bindings_env_prompt_unique').on(
      t.projectId,
      t.environmentName,
      t.promptId,
    ),
    byProjectEnv: index('env_bindings_project_env_idx').on(t.projectId, t.environmentName),
  }),
);

// --- API keys (hashed at rest, plaintext returned once on create) ---
export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    scope: text('scope').notNull().default('read'),
    keyHash: text('key_hash').notNull(),
    keyPreview: text('key_preview').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revoked: boolean('revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byHash: uniqueIndex('api_keys_hash_unique').on(t.keyHash),
    byProject: index('api_keys_project_idx').on(t.projectId),
  }),
);

// --- Eval sets (golden inputs for a prompt) ---
export const evalSets = pgTable(
  'eval_sets',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    promptId: text('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    promptSlugUnique: uniqueIndex('eval_sets_prompt_slug_unique').on(t.promptId, t.slug),
    byPrompt: index('eval_sets_prompt_idx').on(t.promptId),
  }),
);

export const evalItems = pgTable(
  'eval_items',
  {
    id: text('id').primaryKey(),
    evalSetId: text('eval_set_id')
      .notNull()
      .references(() => evalSets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    inputVarsJson: jsonb('input_vars_json').notNull(),
    grader: text('grader').notNull().default('substring'),
    expected: text('expected').notNull().default(''),
    judgePrompt: text('judge_prompt'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySet: index('eval_items_set_idx').on(t.evalSetId),
  }),
);

export const evalRuns = pgTable(
  'eval_runs',
  {
    id: text('id').primaryKey(),
    evalSetId: text('eval_set_id')
      .notNull()
      .references(() => evalSets.id, { onDelete: 'cascade' }),
    promptVersionId: text('prompt_version_id')
      .notNull()
      .references(() => promptVersions.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    totalItems: integer('total_items').notNull().default(0),
    passedItems: integer('passed_items').notNull().default(0),
    failedItems: integer('failed_items').notNull().default(0),
    errorItems: integer('error_items').notNull().default(0),
    totalCostUsd: real('total_cost_usd').notNull().default(0),
    totalTokensIn: integer('total_tokens_in').notNull().default(0),
    totalTokensOut: integer('total_tokens_out').notNull().default(0),
    triggeredBy: text('triggered_by').notNull().default('system'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
  },
  (t) => ({
    byVersion: index('eval_runs_version_idx').on(t.promptVersionId, t.startedAt),
    bySet: index('eval_runs_set_idx').on(t.evalSetId, t.startedAt),
  }),
);

export const evalResults = pgTable(
  'eval_results',
  {
    id: text('id').primaryKey(),
    evalRunId: text('eval_run_id')
      .notNull()
      .references(() => evalRuns.id, { onDelete: 'cascade' }),
    evalItemId: text('eval_item_id')
      .notNull()
      .references(() => evalItems.id, { onDelete: 'cascade' }),
    passed: boolean('passed').notNull().default(false),
    actual: text('actual').notNull().default(''),
    grader: text('grader').notNull(),
    reason: text('reason').notNull().default(''),
    latencyMs: integer('latency_ms').notNull().default(0),
    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    costUsd: real('cost_usd').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byRun: index('eval_results_run_idx').on(t.evalRunId),
  }),
);

// --- Audit log (append-only) ---
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id'),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    diffJson: jsonb('diff_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProjectCreated: index('audit_log_project_created_idx').on(t.projectId, t.createdAt),
    byTarget: index('audit_log_target_idx').on(t.targetType, t.targetId),
  }),
);
