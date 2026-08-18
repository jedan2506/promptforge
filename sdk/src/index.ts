export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  system: string;
  user: string;
  paramsSchemaJson: Record<string, unknown> | null;
  tier: 'haiku' | 'sonnet' | 'opus';
  temperature: number;
  maxTokens: number;
  message: string;
  createdBy: string;
  createdAt: number;
}

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  cacheTtlMs?: number;
}

interface CacheEntry {
  value: PromptVersion;
  expiresAt: number;
}

export class PromptForge {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(opts: ClientOptions) {
    if (!opts.apiKey) throw new Error('PromptForge: apiKey required');
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? 'http://localhost:4400/api').replace(/\/+$/, '');
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.cacheTtlMs = opts.cacheTtlMs ?? 30_000;
  }

  /** Fetch the version bound to an environment for a prompt. */
  async get(project: string, env: string, prompt: string): Promise<PromptVersion> {
    const key = `${project}/${env}/${prompt}`;
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) return hit.value;
    const url = `${this.baseUrl}/projects/${encodeURIComponent(project)}/environments/${encodeURIComponent(env)}/prompts/${encodeURIComponent(prompt)}`;
    const res = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PromptForge: ${res.status} ${res.statusText} — ${body}`);
    }
    const value = (await res.json()) as PromptVersion;
    this.cache.set(key, { value, expiresAt: now + this.cacheTtlMs });
    return value;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default PromptForge;
