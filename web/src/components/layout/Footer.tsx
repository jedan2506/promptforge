import { config } from '@/config/env';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border">
      <div className="container_page py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-fg-muted">
        <div>
          © {year} {config.siteName}. MIT licensed. Local-first LLM ops.
        </div>
        <div className="flex gap-4">
          <a href="https://github.com/" className="hover:text-fg transition-colors">
            GitHub
          </a>
          <a href="/docs" className="hover:text-fg transition-colors">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
