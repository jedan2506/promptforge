'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deletePrompt } from '@/services/promptService';

interface Props {
  projectSlug: string;
  promptSlug: string;
  promptName: string;
}

export function DeletePromptButton({ projectSlug, promptSlug, promptName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    const result = await deletePrompt(projectSlug, promptSlug);
    if (!result?.success) throw new Error(result?.error?.message ?? 'delete failed');
    router.push(`/projects/${projectSlug}`);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2 className="size-3.5" /> Delete prompt
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={`Delete prompt "${promptName}"?`}
        description="All versions, eval sets, and environment bindings for this prompt will be permanently deleted."
        confirmLabel="Delete prompt"
        destructive
      />
    </>
  );
}
