import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-fg-muted">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${c.label}-${i}`}>
            {c.href && !isLast ? (
              <Link href={c.href} className="hover:text-fg transition-colors truncate max-w-[12rem]">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-fg truncate max-w-[16rem]' : 'truncate max-w-[12rem]'}>
                {c.label}
              </span>
            )}
            {!isLast && <ChevronRight className="size-3 shrink-0 text-fg-muted/50" />}
          </Fragment>
        );
      })}
    </nav>
  );
}
