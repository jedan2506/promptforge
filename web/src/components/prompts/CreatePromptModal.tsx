'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createPrompt } from '@/services/promptService';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

interface CreatePromptModalProps {
  projectSlug: string;
  open: boolean;
  onClose: () => void;
}

export function CreatePromptModal({ projectSlug, open, onClose }: CreatePromptModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      slug: (slugTouched ? slug : slugify(name)).trim(),
      name: name.trim(),
      description: description.trim() || undefined,
    };
    const result = await createPrompt(projectSlug, payload);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      setSubmitting(false);
      return;
    }
    router.refresh();
    router.push(`/projects/${projectSlug}/prompts/${result.data!.slug}`);
    handleClose();
  }

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0 && !submitting;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New prompt"
      description="A named prompt within this project. You'll add versions to it next."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Create prompt
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Label required>
          Name
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Summarize support ticket"
            autoFocus
            maxLength={120}
          />
        </Label>
        <Label required hint="Lowercase, alphanumeric + hyphens. Used in the SDK path.">
          Slug
          <Input
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="summarize-support-ticket"
            maxLength={64}
          />
        </Label>
        <Label hint="Optional. What does this prompt do?">
          Description
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Summarize a support ticket into 3 bullets for the on-call rep."
            rows={3}
            maxLength={500}
          />
        </Label>
        {error && (
          <Alert variant="danger" title="Couldn't create prompt">
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
