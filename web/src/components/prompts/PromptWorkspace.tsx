'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, GitBranch, Zap, Loader2, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateVersionForm } from './CreateVersionForm';
import { VersionDiff } from './VersionDiff';
import { EvalWorkspace } from '@/components/evals/EvalWorkspace';
import { DEFAULT_ENVIRONMENTS } from '@/constants/defaultsConstants';
import { bindEnvironment } from '@/services/promptService';
import { cn } from '@/lib/cn';
import type { EvalSet, PromptVersion } from '@/types/api';

interface PromptWorkspaceProps {
  projectSlug: string;
  promptSlug: string;
  versions: PromptVersion[];
  evalSets: EvalSet[];
}

interface EnvBinding {
  environmentName: string;
  versionNumber: number | null;
}

interface BindingBarProps {
  projectSlug: string;
  promptSlug: string;
  versions: PromptVersion[];
}

function BindingBar({ projectSlug, promptSlug, versions }: BindingBarProps) {
  const router = useRouter();
  const latest = versions[0]?.versionNumber ?? null;
  const [selected, setSelected] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEFAULT_ENVIRONMENTS.map((e) => [e, latest ?? 0])),
  );
  const [busyEnv, setBusyEnv] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function bind(env: string) {
    const versionNumber = selected[env];
    if (!versionNumber) return;
    setBusyEnv(env);
    setError(null);
    const result = await bindEnvironment(projectSlug, env, { promptSlug, versionNumber });
    setBusyEnv(null);
    if (!result?.success) {
      setError(`${env}: ${result?.error?.message ?? 'unknown error'}`);
      return;
    }
    router.refresh();
  }

  if (versions.length === 0) {
    return (
      <Card>
        <div className="text-sm font-semibold mb-1">Environment bindings</div>
        <p className="text-xs text-fg-muted">Save a version first, then bind it to prod / staging / dev.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3">
        <div className="text-sm font-semibold">Environment bindings</div>
        <p className="text-[11px] text-fg-muted mt-0.5">
          Pick which version each env should serve. The SDK reads through the environment name.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DEFAULT_ENVIRONMENTS.map((env) => (
          <div key={env} className="rounded-lg border border-border p-3 bg-surface-2/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-muted">{env}</span>
              <Zap className="size-3.5 text-accent" />
            </div>
            <Select
              value={String(selected[env] ?? latest ?? 0)}
              onChange={(e) => setSelected((s) => ({ ...s, [env]: Number(e.target.value) }))}
              className="h-9 mb-2"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber} · {v.tier}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => bind(env)}
              disabled={busyEnv === env}
            >
              {busyEnv === env ? <Loader2 className="size-3 animate-spin" /> : <GitBranch className="size-3" />}
              Bind to {env}
            </Button>
          </div>
        ))}
      </div>
      {error && (
        <div className="mt-3">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

function VersionCard({ v, isLatest }: { v: PromptVersion; isLatest: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card_surface p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">v{v.versionNumber}</span>
            {isLatest && <span className="chip_accent">latest</span>}
            <span className="chip_neutral">{v.tier}</span>
            <span className="chip_neutral">temp {v.temperature}</span>
            <span className="chip_neutral">{v.maxTokens} tok</span>
          </div>
          {v.message && <p className="text-xs text-fg-muted mt-1.5">{v.message}</p>}
          <div className="text-[11px] text-fg-muted mt-1.5">
            by {v.createdBy} · {new Date(v.createdAt).toLocaleString()}
          </div>
        </div>
        <ChevronDown
          className={cn('size-4 text-fg-muted shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">System</div>
            <pre className="p-3 rounded-lg bg-surface-2 border border-border text-[11px] font-mono whitespace-pre-wrap max-h-64 overflow-auto">
              {v.system || <span className="text-fg-muted">(empty)</span>}
            </pre>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">User template</div>
            <pre className="p-3 rounded-lg bg-surface-2 border border-border text-[11px] font-mono whitespace-pre-wrap max-h-64 overflow-auto">
              {v.user || <span className="text-fg-muted">(empty)</span>}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function PromptWorkspace({ projectSlug, promptSlug, versions, evalSets }: PromptWorkspaceProps) {
  const [showForm, setShowForm] = useState(versions.length === 0);
  const latestVersion = versions[0] ?? null;

  return (
    <div className="space-y-6">
      <BindingBar projectSlug={projectSlug} promptSlug={promptSlug} versions={versions} />

      <section aria-labelledby="versions">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="versions" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Versions
          </h2>
          <div className="flex items-center gap-2">
            <span className="chip_neutral">{versions.length} total</span>
            {!showForm && (
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-3" /> New version
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mb-4">
            <CreateVersionForm
              projectSlug={projectSlug}
              promptSlug={promptSlug}
              previous={latestVersion}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {versions.length === 0 && !showForm && (
          <EmptyState
            icon={GitBranch}
            title="No versions yet"
            description="Every save is a new immutable version. Bind it to an environment to make it live."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="size-3.5" /> Create first version
              </Button>
            }
          />
        )}

        {versions.length > 0 && (
          <div className="space-y-3">
            {versions.map((v, i) => (
              <VersionCard key={v.id} v={v} isLatest={i === 0} />
            ))}
          </div>
        )}
      </section>

      {versions.length >= 2 && <VersionDiff versions={versions} />}

      <EvalWorkspace
        projectSlug={projectSlug}
        promptSlug={promptSlug}
        sets={evalSets}
        versions={versions}
      />
    </div>
  );
}
