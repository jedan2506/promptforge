'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from './CreateProjectModal';

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> New project
      </Button>
      <CreateProjectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
