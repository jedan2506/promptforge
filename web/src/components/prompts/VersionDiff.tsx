'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { diffLines, type DiffLine } from '@/lib/diff';
import { cn } from '@/lib/cn';
import type { PromptVersion } from '@/types/api';

interface Props {
  versions: PromptVersion[];
}

function DiffPane({ title, lines, side }: { title: string; lines: DiffLine[]; side: 'left' | 'right' }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">{title}</div>
      <pre className="rounded-lg border border-border bg-surface-2 text-[11px] font-mono max-h-96 overflow-auto">
        {lines.map((l, i) => {
          const isEqual = l.op === 'equal';
          const isRemove = l.op === 'remove';
          const isAdd = l.op === 'add';
          const show = side === 'left' ? !isAdd : !isRemove;
          if (!show) {
            return (
              <div key={i} className="px-3 leading-relaxed text-transparent select-none">
                &nbsp;
              </div>
            );
          }
          const text = side === 'left' ? l.left ?? '' : l.right ?? '';
          return (
            <div
              key={i}
              className={cn(
                'px-3 leading-relaxed whitespace-pre-wrap',
                isEqual && 'text-fg/85',
                side === 'left' && isRemove && 'bg-danger/10 text-danger',
                side === 'right' && isAdd && 'bg-success/10 text-success',
              )}
            >
              {text || ' '}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function ParamRow({ label, left, right }: { label: string; left: string | number; right: string | number }) {
  const changed = String(left) !== String(right);
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1 text-xs">
      <span className="text-fg-muted">{label}</span>
      <span className={cn('font-mono', changed && 'text-danger')}>{String(left)}</span>
      <span className={cn('font-mono', changed && 'text-success')}>{String(right)}</span>
    </div>
  );
}

export function VersionDiff({ versions }: Props) {
  const sorted = useMemo(() => [...versions].sort((a, b) => b.versionNumber - a.versionNumber), [versions]);
  const [leftId, setLeftId] = useState<string>(sorted[1]?.id ?? sorted[0]?.id ?? '');
  const [rightId, setRightId] = useState<string>(sorted[0]?.id ?? '');

  const left = sorted.find((v) => v.id === leftId) ?? sorted[0];
  const right = sorted.find((v) => v.id === rightId) ?? sorted[0];

  const systemDiff = useMemo(() => diffLines(left?.system ?? '', right?.system ?? ''), [left, right]);
  const userDiff = useMemo(() => diffLines(left?.user ?? '', right?.user ?? ''), [left, right]);

  if (sorted.length < 2) return null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-accent" /> Diff versions
          </div>
          <p className="text-[11px] text-fg-muted mt-0.5">
            Compare any two versions side-by-side. Red = removed, green = added.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-5">
        <Label>
          Base (left)
          <Select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} · {v.tier}
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          Compare (right)
          <Select value={rightId} onChange={(e) => setRightId(e.target.value)}>
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} · {v.tier}
              </option>
            ))}
          </Select>
        </Label>
      </div>

      {left && right && (
        <>
          <div className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 mb-4">
            <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.15em] text-fg-muted mb-1">
              <span>Param</span>
              <span>v{left.versionNumber}</span>
              <span>v{right.versionNumber}</span>
            </div>
            <ParamRow label="tier" left={left.tier} right={right.tier} />
            <ParamRow label="temperature" left={left.temperature} right={right.temperature} />
            <ParamRow label="max tokens" left={left.maxTokens} right={right.maxTokens} />
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <DiffPane title={`System · v${left.versionNumber}`} lines={systemDiff} side="left" />
              <DiffPane title={`System · v${right.versionNumber}`} lines={systemDiff} side="right" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DiffPane title={`User · v${left.versionNumber}`} lines={userDiff} side="left" />
              <DiffPane title={`User · v${right.versionNumber}`} lines={userDiff} side="right" />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
