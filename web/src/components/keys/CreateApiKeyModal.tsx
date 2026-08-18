'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createApiKey } from '@/services/apiKeyService';
import type { ApiKeyWithSecret } from '@/types/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateApiKeyModal({ open, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'write' | 'admin'>('read');
  const [projectSlug, setProjectSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApiKeyWithSecret | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName('');
    setScope('read');
    setProjectSlug('');
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
    router.refresh();
  }

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload: { name: string; scope: 'read' | 'write' | 'admin'; projectSlug?: string } = {
      name: name.trim(),
      scope,
    };
    if (projectSlug.trim()) payload.projectSlug = projectSlug.trim();
    const result = await createApiKey(payload);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      return;
    }
    setCreated(result.data!);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={created ? 'API key created' : 'Create API key'}
      description={
        created
          ? 'Copy this key now — it won\'t be shown again. Store it in your app\'s secrets manager.'
          : 'Scoped keys let SDK apps read and mutate PromptForge. Only admins can create keys.'
      }
      footer={
        created ? (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Create key
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-3">
          <Alert variant="warning" title="Save this key now">
            After you close this dialog, only the preview remains visible.
          </Alert>
          <div className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs font-mono break-all">{created.plaintextKey}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(created.plaintextKey).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                aria-label="Copy key"
                className="shrink-0 rounded-md p-1.5 text-fg-muted hover:text-fg hover:bg-surface transition-colors"
              >
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label required>
            Name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CI runner"
              autoFocus
              maxLength={120}
            />
          </Label>
          <Label required hint="read = SDK; write = create/update prompts; admin = create keys, delete projects.">
            Scope
            <Select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="read">read</option>
              <option value="write">write</option>
              <option value="admin">admin</option>
            </Select>
          </Label>
          <Label hint="Optional. Restrict this key to a single project by slug.">
            Project slug
            <Input
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="acme-support"
              maxLength={64}
            />
          </Label>
          {error && (
            <Alert variant="danger" title="Couldn't create key">
              {error}
            </Alert>
          )}
        </div>
      )}
    </Modal>
  );
}
