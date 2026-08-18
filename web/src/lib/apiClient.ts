import { config } from '@/config/env';
import type { ApiResult, ErrorEnvelope } from '@/types/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const url = `${config.apiBase}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };
  if (config.adminApiKey && !headers.Authorization) {
    headers.Authorization = `Bearer ${config.adminApiKey}`;
  }
  try {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: options.cache ?? 'no-store',
      signal: options.signal,
    });
    const text = await res.text();
    const parsed = text ? (JSON.parse(text) as T | ErrorEnvelope) : ({} as T);
    if (!res.ok) {
      const err = (parsed as ErrorEnvelope).error ?? {
        code: 'unknown',
        message: `HTTP ${res.status}`,
      };
      return { success: false, error: err };
    }
    return { success: true, data: parsed as T };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'network',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
