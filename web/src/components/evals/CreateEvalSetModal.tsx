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
import { createEvalSet } from '@/services/evalService';

interface Props {
  open: boolean;
  onClose: () => void;
  projectSlug: string;
  promptSlug: string;
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export function CreateEvalSetModal({ open, onClose, projectSlug, promptSlug }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugDirty, setSlugDirty] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setSlug('');
    setSlugDirty(false);
    setDescription('');
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim() || !slug.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
    };
    const result = await createEvalSet(projectSlug, promptSlug, payload);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      return;
    }
    reset();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create eval set"
      description="Group a batch of test cases that share graders. Runs execute all items in parallel."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !slug.trim()}
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Create set
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
              if (!slugDirty) setSlug(slugify(e.target.value));
            }}
            placeholder="Refund policy Q&A"
            autoFocus
            maxLength={120}
          />
        </Label>
        <Label required hint="Lowercase letters, digits, dashes. Used in the URL.">
          Slug
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugDirty(true);
            }}
            placeholder="refund-policy-qa"
            maxLength={64}
          />
        </Label>
        <Label hint="Optional. Explain what this set covers.">
          Description
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="font-sans"
            placeholder="12 real customer tickets from Q1 with expected refund-policy answers."
          />
        </Label>
        {error && (
          <Alert variant="danger" title="Couldn't create set">
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
