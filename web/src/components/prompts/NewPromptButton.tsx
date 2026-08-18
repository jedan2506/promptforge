'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatePromptModal } from './CreatePromptModal';

export function NewPromptButton({ projectSlug }: { projectSlug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> New prompt
      </Button>
      <CreatePromptModal projectSlug={projectSlug} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
