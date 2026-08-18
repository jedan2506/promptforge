import Link from 'next/link';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from '@/components/motion/Reveal';
import { NewProjectButton } from '@/components/projects/NewProjectButton';
import { listProjects } from '@/services/projectService';

export default async function ProjectsIndexPage() {
  const result = await listProjects();
  const projects = result?.success ? (result.data?.items ?? []) : [];
  const hasError = !result?.success;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="All projects"
        description="Each project is a namespace for related prompts. Slugs are used in URLs and the SDK path."
        actions={<NewProjectButton />}
      />

      {hasError && (
        <Alert variant="danger" title="Couldn't load projects">
          {result?.error?.message ?? 'unknown error'}
        </Alert>
      )}

      {!hasError && projects.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No projects yet"
          description="Create your first project to start versioning prompts."
          action={<NewProjectButton />}
        />
      )}

      {!hasError && projects.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.03, 0.18)}>
              <Link href={`/projects/${p.slug}`} className="block h-full">
                <Card className="h-full">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                    <span className="chip_accent shrink-0">{p.slug}</span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-fg-muted mt-1.5 line-clamp-3">{p.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-border text-[11px] text-fg-muted">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
