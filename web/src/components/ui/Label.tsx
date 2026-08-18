import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  hint?: ReactNode;
  required?: boolean;
}

export function Label({ className, hint, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)} {...props}>
      <span className="text-xs font-semibold text-fg-muted uppercase tracking-[0.08em]">
        {children}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {hint && <span className="text-[11px] text-fg-muted/80 -mt-1 mb-0.5">{hint}</span>}
    </label>
  );
}
