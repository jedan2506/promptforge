import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg',
        'outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
