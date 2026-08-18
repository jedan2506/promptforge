'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateApiKeyModal } from './CreateApiKeyModal';
import { revokeApiKey } from '@/services/apiKeyService';
import type { ApiKey } from '@/types/api';
import { Key } from 'lucide-react';

interface Props {
  items: ApiKey[];
}

function formatWhen(ms: number | null): string {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}

const scopeChip: Record<ApiKey['scope'], string> = {
  read: 'chip_neutral',
  write: 'chip_accent',
  admin: 'chip_neutral',
};

export function KeysTable({ items }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  async function handleRevoke() {
    if (!revokeTarget) return;
    const result = await revokeApiKey(revokeTarget.id);
    if (!result?.success) throw new Error(result?.error?.message ?? 'revoke failed');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-semibold">Active keys</div>
          <p className="text-xs text-fg-muted mt-0.5">
            {items.length} active. Revoking is permanent — issue a new key to rotate.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" /> New API key
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys yet"
          description="Create one to authenticate the SDK or CI runners."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" /> Create first key
            </Button>
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-fg-muted uppercase tracking-[0.1em]">
                  <th className="text-left px-4 py-2 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 font-semibold">Scope</th>
                  <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">Preview</th>
                  <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Last used</th>
                  <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Created</th>
                  <th className="text-right px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((k) => (
                  <tr key={k.id} className="border-t border-border">
                    <td className="px-4 py-3 min-w-0">
                      <div className="font-medium">{k.name}</div>
                      {k.projectId && (
                        <div className="text-[11px] text-fg-muted mt-0.5">project-scoped</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={scopeChip[k.scope]}>{k.scope}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted hidden sm:table-cell">
                      {k.keyPreview}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted hidden md:table-cell">
                      {formatWhen(k.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted hidden md:table-cell">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(k)}>
                        <Ban className="size-3" /> Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateApiKeyModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title={`Revoke "${revokeTarget?.name ?? ''}"?`}
        description="Any SDK or CI runner using this key will start returning 401 immediately."
        confirmLabel="Revoke key"
        destructive
      />
    </div>
  );
}
