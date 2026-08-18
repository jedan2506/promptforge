export interface ModelPricing {
  inputPerMtok: number;
  outputPerMtok: number;
}

export const PRICING: Record<string, ModelPricing> = {
  'claude-haiku-4-5-20251001': { inputPerMtok: 1.0, outputPerMtok: 5.0 },
  'claude-sonnet-4-6': { inputPerMtok: 3.0, outputPerMtok: 15.0 },
  'claude-opus-4-7': { inputPerMtok: 15.0, outputPerMtok: 75.0 },
  'gpt-4o-mini': { inputPerMtok: 0.15, outputPerMtok: 0.6 },
  'gpt-4o': { inputPerMtok: 2.5, outputPerMtok: 10.0 },
  'gpt-4-turbo': { inputPerMtok: 10.0, outputPerMtok: 30.0 },
};

const FALLBACK: ModelPricing = { inputPerMtok: 3, outputPerMtok: 15 };

export function computeCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING[model] ?? FALLBACK;
  return (tokensIn * p.inputPerMtok + tokensOut * p.outputPerMtok) / 1_000_000;
}
