'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2, ChevronDown, Loader2, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddEvalItemForm } from './AddEvalItemForm';
import { EvalRunResults } from './EvalRunResults';
import {
  deleteEvalItem,
  deleteEvalSet,
  getEvalRun,
  listEvalItems,
  listEvalRuns,
  triggerEvalRun,
} from '@/services/evalService';
import { cn } from '@/lib/cn';
import type { EvalItem, EvalRun, EvalSet, PromptVersion } from '@/types/api';

interface Props {
  projectSlug: string;
  promptSlug: string;
  set: EvalSet;
  versions: PromptVersion[];
}

export function EvalSetPanel({ projectSlug, promptSlug, set, versions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<EvalItem[] | null>(null);
  const [runs, setRuns] = useState<EvalRun[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runVersion, setRunVersion] = useState<number>(versions[0]?.versionNumber ?? 0);
  const [triggering, setTriggering] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [itemsResult, runsResult] = await Promise.all([
      listEvalItems(projectSlug, promptSlug, set.slug),
      listEvalRuns(projectSlug, promptSlug, set.slug),
    ]);
    if (!itemsResult?.success) {
      setError(itemsResult?.error?.message ?? 'failed to load items');
      setLoading(false);
      return;
    }
    if (!runsResult?.success) {
      setError(runsResult?.error?.message ?? 'failed to load runs');
      setLoading(false);
      return;
    }
    setItems(itemsResult.data?.items ?? []);
    setRuns(runsResult.data?.items ?? []);
    setLoading(false);
  }, [projectSlug, promptSlug, set.slug]);

  useEffect(() => {
    if (!open || items !== null) return;
    void refresh();
  }, [open, items, refresh]);

  useEffect(() => {
    if (!runs || runs.length === 0) return;
    const active = runs.find((r) => r.status === 'running' || r.status === 'pending');
    if (!active) return;
    let cancelled = false;
    const poll = async () => {
      const result = await getEvalRun(projectSlug, promptSlug, set.slug, active.id);
      if (cancelled) return;
      if (result?.success && result.data) {
        const updated = result.data;
        setRuns((prev) =>
          prev ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) : prev,
        );
        if (updated.status === 'done' || updated.status === 'error') {
          router.refresh();
          return;
        }
      }
      timeout = setTimeout(poll, 2000);
    };
    let timeout = setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [runs, projectSlug, promptSlug, set.slug, router]);

  async function handleRun() {
    if (!runVersion || triggering) return;
    setTriggering(true);
    setError(null);
    const result = await triggerEvalRun(projectSlug, promptSlug, set.slug, runVersion);
    setTriggering(false);
    if (!result?.success) {
      setError(result?.error?.message ?? 'trigger failed');
      return;
    }
    setRuns((prev) => (prev ? [result.data!, ...prev] : [result.data!]));
  }

  async function handleDeleteItem(id: string) {
    const result = await deleteEvalItem(projectSlug, promptSlug, set.slug, id);
    if (!result?.success) {
      setError(result?.error?.message ?? 'delete failed');
      return;
    }
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    router.refresh();
  }

  async function handleDeleteSet() {
    const result = await deleteEvalSet(projectSlug, promptSlug, set.slug);
    if (!result?.success) throw new Error(result?.error?.message ?? 'delete failed');
    router.refresh();
  }

  const hasVersions = versions.length > 0;
  const latestRun = runs?.[0];

  return (
    <div className="card_surface p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 text-left flex items-start gap-3"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn('size-4 text-fg-muted shrink-0 transition-transform mt-0.5', open && 'rotate-180')}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{set.name}</span>
              <span className="chip_neutral font-mono">{set.slug}</span>
              <span className="chip_accent">
                <Beaker className="size-3" />
                {set.itemCount} {set.itemCount === 1 ? 'item' : 'items'}
              </span>
              {latestRun && (
                <span
                  className={cn(
                    'chip_neutral',
                    latestRun.status === 'done' &&
                      latestRun.passedItems === latestRun.totalItems &&
                      'text-success',
                    latestRun.status === 'done' &&
                      latestRun.passedItems < latestRun.totalItems &&
                      'text-warning',
                    latestRun.status === 'error' && 'text-danger',
                  )}
                >
                  last: {latestRun.status === 'done'
                    ? `${latestRun.passedItems}/${latestRun.totalItems}`
                    : latestRun.status}
                </span>
              )}
            </div>
            {set.description && <p className="text-[11px] text-fg-muted mt-1">{set.description}</p>}
          </div>
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 pl-7">
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-fg-muted">Run against</span>
            {hasVersions ? (
              <>
                <Select
                  value={String(runVersion)}
                  onChange={(e) => setRunVersion(Number(e.target.value))}
                  className="h-8 w-auto text-xs"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.versionNumber}>
                      v{v.versionNumber} · {v.tier}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRun}
                  disabled={triggering || (items?.length ?? 0) === 0}
                >
                  {triggering ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                  Run eval
                </Button>
              </>
            ) : (
              <span className="text-[11px] text-fg-muted">Create a version first.</span>
            )}
            <div className="grow" />
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="size-3" /> Delete set
            </Button>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted">Items</div>
              {!showAddItem && (
                <Button variant="ghost" size="sm" onClick={() => setShowAddItem(true)}>
                  + Add item
                </Button>
              )}
            </div>
            {loading && !items && <div className="text-xs text-fg-muted">Loading…</div>}
            {items && items.length === 0 && !showAddItem && (
              <div className="text-xs text-fg-muted italic">No items yet.</div>
            )}
            {items && items.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden mb-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-2 px-3 py-2 border-t border-border first:border-t-0 text-xs"
                  >
                    <span className="font-medium truncate flex-1">{it.name}</span>
                    <span className="chip_neutral">{it.grader}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(it.id)}
                      aria-label="Delete item"
                      className="text-fg-muted hover:text-danger transition-colors p-1"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showAddItem && (
              <div className="space-y-2">
                <AddEvalItemForm projectSlug={projectSlug} promptSlug={promptSlug} setSlug={set.slug} />
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {runs && runs.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-2">Runs</div>
              <div className="space-y-3">
                {runs.map((r) => (
                  <EvalRunResults key={r.id} run={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteSet}
        title={`Delete eval set "${set.name}"?`}
        description="All items and run history for this set will be permanently deleted."
        confirmLabel="Delete set"
        destructive
      />
    </div>
  );
}
