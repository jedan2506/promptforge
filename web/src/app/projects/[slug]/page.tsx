import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, GitBranch } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Reveal } from '@/components/motion/Reveal';
import { NewPromptButton } from '@/components/prompts/NewPromptButton';
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton';
import { getProject } from '@/services/projectService';
import { listPrompts } from '@/services/promptService';
import { config } from '@/config/env';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const projectResult = await getProject(slug);
  if (!projectResult?.success) {
    if (projectResult?.error?.code === 'not_found') notFound();
    return (
      <div className="space-y-6">
        <Alert variant="danger" title="Couldn't load project">
          {projectResult?.error?.message ?? 'unknown error'}
        </Alert>
      </div>
    );
  }
  const project = projectResult.data!;
  const promptsResult = await listPrompts(slug);
  const prompts = promptsResult?.success ? (promptsResult.data?.items ?? []) : [];

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ href: '/projects', label: 'Projects' }, { label: project.name }]} />

      <PageHeader
        eyebrow="Project"
        title={project.name}
        description={project.description || 'No description.'}
        actions={
          <>
            <NewPromptButton projectSlug={project.slug} />
            <DeleteProjectButton projectSlug={project.slug} projectName={project.name} />
          </>
        }
      />

      <section aria-labelledby="prompts">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="prompts" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Prompts
          </h2>
          <span className="chip_neutral">{prompts.length} total</span>
        </div>

        {!promptsResult?.success && (
          <Alert variant="danger" title="Couldn't load prompts">
            {promptsResult?.error?.message ?? 'unknown error'}
          </Alert>
        )}

        {promptsResult?.success && prompts.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No prompts in this project"
            description={`Add your first prompt to "${project.name}" to start versioning.`}
            action={<NewPromptButton projectSlug={project.slug} />}
          />
        )}

        {promptsResult?.success && prompts.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.03, 0.24)}>
                <Link href={`/projects/${project.slug}/prompts/${p.slug}`} className="block h-full">
                  <Card className="h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                        <div className="text-[11px] text-fg-muted mt-0.5 font-mono truncate">{p.slug}</div>
                      </div>
                      <span className="chip_accent shrink-0">
                        <GitBranch className="size-3" />
                        {p.latestVersionNumber ? `v${p.latestVersionNumber}` : 'no versions'}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-fg-muted mt-2 line-clamp-2">{p.description}</p>
                    )}
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="sdk-snippet">
        <h2 id="sdk-snippet" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted mb-3">
          SDK snippet
        </h2>
        <Card>
          <p className="text-xs text-fg-muted mb-3">
            Fetch a prompt version bound to an environment from your app.
          </p>
          <pre className="p-3 rounded-lg bg-surface-2 border border-border text-[11px] font-mono overflow-x-auto text-fg/90">
{`import { PromptForge } from '@promptforge/client';

const forge = new PromptForge({
  apiKey: process.env.PROMPTFORGE_KEY!,
  baseUrl: '${config.apiBase}',
});

const version = await forge.get('${project.slug}', 'prod', '<prompt-slug>');
// version.system, version.user, version.tier, version.temperature, ...`}
          </pre>
        </Card>
      </section>
    </div>
  );
}
