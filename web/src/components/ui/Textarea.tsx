import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted/70',
        'outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors',
        'font-mono leading-relaxed',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
});
