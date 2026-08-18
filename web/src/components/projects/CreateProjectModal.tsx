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
import { createProject } from '@/services/projectService';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
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
    if (!name.trim() || !slug.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      slug: slug.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
    };
    const result = await createProject(payload);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      setSubmitting(false);
      return;
    }
    router.refresh();
    router.push(`/projects/${result.data!.slug}`);
    handleClose();
  }

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0 && !submitting;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New project"
      description="Group of related prompts. Slug is used in URLs and the SDK."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Create project
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
            placeholder="Acme Support Bot"
            autoFocus
            maxLength={120}
          />
        </Label>
        <Label required hint="Lowercase, alphanumeric + hyphens. Immutable after creation.">
          Slug
          <Input
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="acme-support-bot"
            maxLength={64}
          />
        </Label>
        <Label hint="Optional. Explain what this project is for.">
          Description
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Prompts for our customer-support chatbot."
            rows={3}
            maxLength={500}
          />
        </Label>
        {error && (
          <Alert variant="danger" title="Couldn't create project">
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
