'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteProject } from '@/services/projectService';

interface Props {
  projectSlug: string;
  projectName: string;
  variant?: 'button' | 'menu-item';
}

export function DeleteProjectButton({ projectSlug, projectName, variant = 'button' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    const result = await deleteProject(projectSlug);
    if (!result?.success) throw new Error(result?.error?.message ?? 'delete failed');
    router.push('/projects');
    router.refresh();
  }

  return (
    <>
      {variant === 'button' ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Trash2 className="size-3.5" /> Delete project
        </Button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="w-full text-left px-3 py-1.5 text-sm inline-flex items-center gap-2 text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          <Trash2 className="size-3.5" /> Delete project
        </button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={`Delete project "${projectName}"?`}
        description="All prompts, versions, environment bindings, and eval sets in this project will be permanently deleted."
        confirmLabel="Delete project"
        destructive
      />
    </>
  );
}
