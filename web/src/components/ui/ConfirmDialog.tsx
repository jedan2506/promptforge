'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Alert } from './Alert';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
      return;
    }
    setBusy(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => (busy ? undefined : onClose())}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'primary' : 'primary'}
            onClick={handleConfirm}
            disabled={busy}
            className={destructive ? 'bg-danger text-white hover:opacity-90' : ''}
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {destructive && (
          <Alert variant="warning">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
              <span>This action cannot be undone.</span>
            </div>
          </Alert>
        )}
        <div className="text-sm text-fg/90">{description}</div>
        {error && <Alert variant="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
