import Link from 'next/link';
import { ArrowRight, GitBranch, Layers, Zap, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from '@/components/motion/Reveal';
import { NewProjectButton } from '@/components/projects/NewProjectButton';
import { listProjects } from '@/services/projectService';
import { config } from '@/config/env';

const capabilities = [
  {
    icon: Layers,
    title: 'Projects & Prompts',
    body: 'Organize prompts by project. Each prompt is a named, versioned resource with description and metadata.',
  },
  {
    icon: GitBranch,
    title: 'Immutable versions',
    body: 'Every save is a new numbered version. Diff any two versions; roll back with one PATCH.',
  },
  {
    icon: Zap,
    title: 'Environment bindings',
    body: 'Point "prod" at v7, "staging" at v8. The SDK reads the bound version — no code changes to ship a prompt update.',
  },
  {
    icon: ShieldCheck,
    title: 'Auth + audit',
    body: 'Scoped API keys hashed at rest. Every mutation logged with actor + diff. Production hygiene from day one.',
  },
];

export default async function HomePage() {
  const result = await listProjects();
  const projects = result?.success ? (result.data?.items ?? []) : [];
  const hasBackendError = !result?.success;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="v0.1 · self-hostable"
        title={config.siteName}
        description={`${config.siteTagline} Prompts live in Postgres, versioned like code. Ship diffs, not vibes.`}
        actions={
          <>
            <NewProjectButton />
            <Link href="/projects">
              <Button variant="outline">
                All projects <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <section aria-labelledby="capabilities">
        <h2 id="capabilities" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted mb-4">
          What it does
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.05}>
              <Card className="h-full">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30 mb-3">
                  <c.icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">{c.title}</h3>
                <p className="text-xs text-fg-muted mt-1.5 leading-relaxed">{c.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="projects">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="projects" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Recent projects
          </h2>
          <span className="chip_neutral">{projects.length} total</span>
        </div>

        {hasBackendError && (
          <Alert variant="danger" title="Backend unreachable">
            {result?.error?.message ?? 'unknown error'}. Confirm the API is running at{' '}
            <code className="chip_neutral">{config.apiBase}</code> and that <code>ADMIN_API_KEY</code> is set in the
            web environment.
          </Alert>
        )}

        {!hasBackendError && projects.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No projects yet"
            description="Create your first project to start versioning prompts."
            action={<NewProjectButton />}
          />
        )}

        {!hasBackendError && projects.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.04, 0.24)}>
                <Link href={`/projects/${p.slug}`} className="block h-full">
                  <Card className="h-full">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                      <span className="chip_accent shrink-0">{p.slug}</span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-fg-muted mt-1.5 line-clamp-2">{p.description}</p>
                    )}
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
