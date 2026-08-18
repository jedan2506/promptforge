import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const variantMap: Record<Variant, { icon: typeof Info; className: string; iconColor: string }> = {
  info: { icon: Info, className: 'border-border bg-surface-2/60', iconColor: 'text-fg-muted' },
  success: {
    icon: CheckCircle2,
    className: 'border-success/30 bg-success/5',
    iconColor: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/40 bg-warning/5',
    iconColor: 'text-warning',
  },
  danger: {
    icon: XCircle,
    className: 'border-danger/40 bg-danger/5',
    iconColor: 'text-danger',
  },
};

interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const v = variantMap[variant];
  return (
    <div className={cn('rounded-lg border p-3 sm:p-4 flex items-start gap-3', v.className, className)}>
      <v.icon className={cn('size-4 shrink-0 mt-0.5', v.iconColor)} />
      <div className="min-w-0 flex-1 text-sm">
        {title && <div className="font-semibold text-fg mb-1">{title}</div>}
        <div className="text-fg/90">{children}</div>
      </div>
    </div>
  );
}
