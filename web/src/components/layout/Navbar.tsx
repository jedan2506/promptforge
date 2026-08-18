'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { primaryNav } from '@/constants/navConstants';
import { config } from '@/config/env';
import { cn } from '@/lib/cn';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur">
      <div className="container_page flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={config.siteName}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
            <Flame className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{config.siteName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {primaryNav.map((n) => {
            const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg hover:bg-surface-2/60',
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted hover:text-fg"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="md:hidden border-t border-border bg-bg/95"
          >
            <div className="container_page py-2 flex flex-col">
              {primaryNav.map((n) => {
                const active = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href));
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg hover:bg-surface-2/60',
                    )}
                  >
                    <n.icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
