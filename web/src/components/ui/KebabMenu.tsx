'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

interface KebabMenuProps {
  children: ReactNode;
  label?: string;
  align?: 'left' | 'right';
}

export function KebabMenu({ children, label = 'More', align = 'right' }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-1 min-w-40 rounded-lg border border-border bg-surface shadow-xl z-20 py-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface KebabMenuItemProps {
  onSelect: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function KebabMenuItem({ onSelect, destructive, icon, children }: KebabMenuItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'w-full text-left px-3 py-1.5 text-sm inline-flex items-center gap-2 transition-colors',
        destructive ? 'text-danger hover:bg-danger/10' : 'text-fg-muted hover:text-fg hover:bg-surface-2',
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
