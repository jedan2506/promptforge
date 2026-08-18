import * as evalRepo from '../repositories/evalRepository.js';
import type { PromptVersionRow } from '../repositories/promptRepository.js';
import { runLlm, type Tier } from './llm.js';

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
}

interface GradeResult {
  passed: boolean;
  reason: string;
  judgeCost?: { tokensIn: number; tokensOut: number; costUsd: number };
}

async function grade(
  grader: string,
  expected: string,
  actual: string,
  judgePrompt: string | null,
): Promise<GradeResult> {
  const a = actual.trim();
  const e = expected.trim();
  switch (grader) {
    case 'exact':
      return a === e ? { passed: true, reason: 'exact match' } : { passed: false, reason: `expected "${e}", got "${a}"` };
    case 'substring':
      if (!e) return { passed: true, reason: 'no expected substring (always passes)' };
      return a.toLowerCase().includes(e.toLowerCase())
        ? { passed: true, reason: `contains "${e}"` }
        : { passed: false, reason: `did not contain "${e}"` };
    case 'regex': {
      try {
        const re = new RegExp(e);
        return re.test(a)
          ? { passed: true, reason: `matched /${e}/` }
          : { passed: false, reason: `did not match /${e}/` };
      } catch (err) {
        return { passed: false, reason: `invalid regex: ${err instanceof Error ? err.message : String(err)}` };
      }
    }
    case 'llm-judge': {
      const jp = judgePrompt || 'Was the assistant response correct? Answer only PASS or FAIL, then a short reason.';
      const judge = await runLlm({
        system: 'You are a strict grader. Reply exactly "PASS: <reason>" or "FAIL: <reason>". Nothing else.',
        user: `Rubric: ${jp}\n\n--- Response to grade ---\n${a}\n\n--- Expected (if any) ---\n${e}`,
        tier: 'haiku',
        temperature: 0,
        maxTokens: 200,
      });
      const verdict = judge.text.trim();
      const passed = /^\s*pass/i.test(verdict);
      return {
        passed,
        reason: verdict.slice(0, 400),
        judgeCost: { tokensIn: judge.tokensIn, tokensOut: judge.tokensOut, costUsd: judge.costUsd },
      };
    }
    default:
      return { passed: false, reason: `unknown grader "${grader}"` };
  }
}

export interface EvalRunOptions {
  setId: string;
  version: PromptVersionRow;
  triggeredBy: string;
  items: evalRepo.EvalItemRow[];
}

export async function runEvalSet(opts: EvalRunOptions): Promise<evalRepo.EvalRunRow> {
  const run = await evalRepo.createRun({
    evalSetId: opts.setId,
    promptVersionId: opts.version.id,
    totalItems: opts.items.length,
    triggeredBy: opts.triggeredBy,
  });

  let passed = 0;
  let failed = 0;
  let errored = 0;
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCost = 0;

  for (const item of opts.items) {
    const inputVars = (item.inputVarsJson as Record<string, string>) ?? {};
    const userRendered = renderTemplate(opts.version.user, inputVars);
    try {
      const llmResult = await runLlm({
        system: opts.version.system,
        user: userRendered,
        tier: opts.version.tier as Tier,
        temperature: opts.version.temperature,
        maxTokens: opts.version.maxTokens,
      });
      const g = await grade(item.grader, item.expected, llmResult.text, item.judgePrompt ?? null);
      const tokensIn = llmResult.tokensIn + (g.judgeCost?.tokensIn ?? 0);
      const tokensOut = llmResult.tokensOut + (g.judgeCost?.tokensOut ?? 0);
      const costUsd = llmResult.costUsd + (g.judgeCost?.costUsd ?? 0);
      totalTokensIn += tokensIn;
      totalTokensOut += tokensOut;
      totalCost += costUsd;
      if (g.passed) passed++;
      else failed++;
      await evalRepo.createResult({
        evalRunId: run.id,
        evalItemId: item.id,
        passed: g.passed,
        actual: llmResult.text,
        grader: item.grader,
        reason: g.reason,
        latencyMs: llmResult.latencyMs,
        tokensIn,
        tokensOut,
        costUsd,
        errorMessage: null,
      });
    } catch (err) {
      errored++;
      await evalRepo.createResult({
        evalRunId: run.id,
        evalItemId: item.id,
        passed: false,
        actual: '',
        grader: item.grader,
        reason: 'error',
        latencyMs: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await evalRepo.updateRun(run.id, {
    status: 'done',
    passedItems: passed,
    failedItems: failed,
    errorItems: errored,
    totalCostUsd: totalCost,
    totalTokensIn,
    totalTokensOut,
    completedAt: new Date(),
    errorMessage: null,
  });

  const updated = await evalRepo.findRunById(run.id);
  return updated!;
}
