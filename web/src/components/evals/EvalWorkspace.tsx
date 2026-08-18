'use client';

import { useState } from 'react';
import { Plus, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateEvalSetModal } from './CreateEvalSetModal';
import { EvalSetPanel } from './EvalSetPanel';
import type { EvalSet, PromptVersion } from '@/types/api';

interface Props {
  projectSlug: string;
  promptSlug: string;
  sets: EvalSet[];
  versions: PromptVersion[];
}

export function EvalWorkspace({ projectSlug, promptSlug, sets, versions }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section aria-labelledby="evals">
      <div className="flex items-baseline justify-between mb-4">
        <h2 id="evals" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Eval sets
        </h2>
        <div className="flex items-center gap-2">
          <span className="chip_neutral">{sets.length} total</span>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3" /> New set
          </Button>
        </div>
      </div>

      {sets.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="No eval sets yet"
          description="Group test cases here. Run them against any version to catch regressions before prod."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" /> Create first set
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sets.map((s) => (
            <EvalSetPanel
              key={s.id}
              projectSlug={projectSlug}
              promptSlug={promptSlug}
              set={s}
              versions={versions}
            />
          ))}
        </div>
      )}

      <CreateEvalSetModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectSlug={projectSlug}
        promptSlug={promptSlug}
      />
    </section>
  );
}
