'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { EvalResult, EvalRun } from '@/types/api';

interface Props {
  run: EvalRun;
}

function StatusIcon({ status }: { status: EvalRun['status'] }) {
  if (status === 'running' || status === 'pending')
    return <Loader2 className="size-4 text-fg-muted animate-spin" aria-label="running" />;
  if (status === 'done') return <CheckCircle2 className="size-4 text-success" aria-label="done" />;
  return <AlertTriangle className="size-4 text-danger" aria-label="error" />;
}

function ResultRow({ r }: { r: EvalResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2/40 transition-colors"
        aria-expanded={open}
      >
        {r.errorMessage ? (
          <AlertTriangle className="size-4 text-danger shrink-0" />
        ) : r.passed ? (
          <CheckCircle2 className="size-4 text-success shrink-0" />
        ) : (
          <XCircle className="size-4 text-danger shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{r.itemName}</div>
          <div className="text-[10px] text-fg-muted mt-0.5 truncate">
            {r.grader} · {r.latencyMs}ms · {r.tokensIn}/{r.tokensOut} tok · ${r.costUsd.toFixed(5)}
          </div>
        </div>
        <ChevronDown
          className={cn('size-3.5 text-fg-muted shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {r.errorMessage && (
            <div className="rounded-lg bg-danger/10 border border-danger/30 p-2 text-[11px] text-danger font-mono">
              {r.errorMessage}
            </div>
          )}
          {r.reason && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">Grader reason</div>
              <div className="text-[11px] text-fg/90">{r.reason}</div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">Model output</div>
            <pre className="p-2 rounded-lg bg-surface-2 border border-border text-[11px] font-mono whitespace-pre-wrap max-h-56 overflow-auto">
              {r.actual || <span className="text-fg-muted">(empty)</span>}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function EvalRunResults({ run }: Props) {
  const results = run.results ?? [];
  const passRate = run.totalItems > 0 ? (run.passedItems / run.totalItems) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-surface-2/30">
      <div className="p-4 flex items-center gap-3 flex-wrap">
        <StatusIcon status={run.status} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            Run · v{run.versionNumber}{' '}
            <span className="text-fg-muted font-normal">
              · {new Date(run.startedAt).toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] text-fg-muted mt-0.5">
            {run.status === 'done' || run.status === 'error' ? (
              <>
                {run.passedItems}/{run.totalItems} passed
                {run.failedItems > 0 && ` · ${run.failedItems} failed`}
                {run.errorItems > 0 && ` · ${run.errorItems} error`}
                {' · '}
                {run.totalTokensIn}/{run.totalTokensOut} tok · ${run.totalCostUsd.toFixed(5)}
              </>
            ) : (
              'in progress…'
            )}
          </div>
        </div>
        {(run.status === 'done' || run.status === 'error') && run.totalItems > 0 && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'chip_neutral',
                passRate === 100 && 'text-success',
                passRate < 100 && passRate > 0 && 'text-warning',
                passRate === 0 && 'text-danger',
              )}
            >
              {passRate.toFixed(0)}% pass
            </div>
          </div>
        )}
      </div>

      {run.errorMessage && (
        <div className="px-4 pb-3">
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-2 text-[11px] text-danger font-mono">
            {run.errorMessage}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          {results.map((r) => (
            <ResultRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
