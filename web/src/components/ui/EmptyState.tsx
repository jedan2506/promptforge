import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('card_surface p-8 sm:p-12 text-center', className)}>
      {Icon && (
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/30">
          <Icon className="size-5" />
        </div>
      )}
      <div className="text-base font-semibold">{title}</div>
      {description && <p className="text-sm text-fg-muted mt-1.5 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5 flex items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
