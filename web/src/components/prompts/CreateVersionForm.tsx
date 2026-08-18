'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { MODEL_TIERS } from '@/constants/defaultsConstants';
import { createVersion } from '@/services/promptService';
import type { ModelTier, PromptVersion } from '@/types/api';

interface CreateVersionFormProps {
  projectSlug: string;
  promptSlug: string;
  previous?: PromptVersion | null;
  onCancel?: () => void;
}

export function CreateVersionForm({ projectSlug, promptSlug, previous, onCancel }: CreateVersionFormProps) {
  const router = useRouter();
  const [system, setSystem] = useState(previous?.system ?? '');
  const [user, setUser] = useState(previous?.user ?? '');
  const [tier, setTier] = useState<ModelTier>(previous?.tier ?? 'haiku');
  const [temperature, setTemperature] = useState<string>(String(previous?.temperature ?? 0));
  const [maxTokens, setMaxTokens] = useState<string>(String(previous?.maxTokens ?? 1000));
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!system.trim() && !user.trim()) {
      setError('Provide at least a system or user prompt.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      system,
      user,
      tier,
      temperature: Number(temperature) || 0,
      maxTokens: Number(maxTokens) || 1000,
      message: message.trim() || undefined,
    };
    const result = await createVersion(projectSlug, promptSlug, payload);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      setSubmitting(false);
      return;
    }
    router.refresh();
    onCancel?.();
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">New version</h3>
          <p className="text-[11px] text-fg-muted mt-0.5">
            Every save is immutable. Bind it to an environment to make it live.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-md p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="space-y-4">
        <Label hint="System prompt — role, rules, format. Cached across calls.">
          System
          <Textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={5}
            placeholder="You are a senior support engineer. Reply in ≤ 3 bullets."
            maxLength={50_000}
          />
        </Label>
        <Label hint="User template. Use {{variable}} placeholders for runtime substitution.">
          User template
          <Textarea
            value={user}
            onChange={(e) => setUser(e.target.value)}
            rows={5}
            placeholder="Ticket: {{ticket_body}}"
            maxLength={50_000}
          />
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Label>
            Tier
            <Select value={tier} onChange={(e) => setTier(e.target.value as ModelTier)}>
              {MODEL_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Temperature
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </Label>
          <Label>
            Max tokens
            <Input
              type="number"
              min={1}
              max={200_000}
              step={100}
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
          </Label>
        </div>
        <Label hint="Optional. Short commit-message style note about what changed.">
          Message
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="tighten refusal on unsafe requests"
            maxLength={300}
          />
        </Label>
        {error && (
          <Alert variant="danger" title="Couldn't save version">
            {error}
          </Alert>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save version
          </Button>
        </div>
      </div>
    </Card>
  );
}
