import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../env.js';
import { computeCost } from './pricing.js';

export type Tier = 'haiku' | 'sonnet' | 'opus';
export type Provider = 'anthropic' | 'openai';

export interface LlmRunArgs {
  system: string;
  user: string;
  tier: Tier;
  temperature: number;
  maxTokens: number;
  signal?: AbortSignal;
}

export interface LlmRunResult {
  provider: Provider;
  model: string;
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
}

const ANTHROPIC_MODEL: Record<Tier, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-7',
};
const OPENAI_MODEL: Record<Tier, string> = {
  haiku: 'gpt-4o-mini',
  sonnet: 'gpt-4o',
  opus: 'gpt-4o',
};

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropicClient;
}
function getOpenAI(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openaiClient;
}

export function providerChain(): Provider[] {
  const chain: Provider[] = [];
  if (env.ANTHROPIC_API_KEY) chain.push('anthropic');
  if (env.OPENAI_API_KEY) chain.push('openai');
  return chain;
}

export function anyProviderConfigured(): boolean {
  return providerChain().length > 0;
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (!status) return false;
  if (status === 429 || status === 401 || status === 403) return true;
  return status >= 500;
}

async function runAnthropic(args: LlmRunArgs): Promise<LlmRunResult> {
  const client = getAnthropic();
  const model = ANTHROPIC_MODEL[args.tier];
  const t0 = Date.now();
  const resp = await client.messages.create(
    {
      model,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      system: args.system,
      messages: [{ role: 'user', content: args.user }],
    },
    { signal: args.signal },
  );
  const latencyMs = Date.now() - t0;
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const tokensIn = resp.usage?.input_tokens ?? 0;
  const tokensOut = resp.usage?.output_tokens ?? 0;
  return {
    provider: 'anthropic',
    model,
    text,
    tokensIn,
    tokensOut,
    costUsd: computeCost(model, tokensIn, tokensOut),
    latencyMs,
  };
}

async function runOpenAI(args: LlmRunArgs): Promise<LlmRunResult> {
  const client = getOpenAI();
  const model = OPENAI_MODEL[args.tier];
  const t0 = Date.now();
  const resp = await client.chat.completions.create(
    {
      model,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    },
    { signal: args.signal },
  );
  const latencyMs = Date.now() - t0;
  const text = resp.choices[0]?.message?.content ?? '';
  const tokensIn = resp.usage?.prompt_tokens ?? 0;
  const tokensOut = resp.usage?.completion_tokens ?? 0;
  return {
    provider: 'openai',
    model,
    text,
    tokensIn,
    tokensOut,
    costUsd: computeCost(model, tokensIn, tokensOut),
    latencyMs,
  };
}

export async function runLlm(args: LlmRunArgs): Promise<LlmRunResult> {
  const chain = providerChain();
  if (chain.length === 0) throw new Error('No LLM API key set (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
  let lastErr: unknown = null;
  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    try {
      return provider === 'anthropic' ? await runAnthropic(args) : await runOpenAI(args);
    } catch (err) {
      lastErr = err;
      if (i === chain.length - 1 || !isRetryable(err)) throw err;
      const status = (err as { status?: number })?.status ?? '?';
      console.warn(`[llm] ${provider} failed with ${status}, falling back to ${chain[i + 1]}`);
    }
  }
  throw lastErr ?? new Error('all providers failed');
}
