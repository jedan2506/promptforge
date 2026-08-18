export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const MODEL_TIERS = [
  { value: 'haiku', label: 'Fast (haiku / gpt-4o-mini tier)' },
  { value: 'sonnet', label: 'Mid (sonnet / gpt-4o tier)' },
  { value: 'opus', label: 'Large / reasoning' },
] as const;

export const DEFAULT_ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
