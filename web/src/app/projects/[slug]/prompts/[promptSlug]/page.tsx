import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PromptWorkspace } from '@/components/prompts/PromptWorkspace';
import { DeletePromptButton } from '@/components/prompts/DeletePromptButton';
import { getProject } from '@/services/projectService';
import { listVersions } from '@/services/promptService';
import { listEvalSets } from '@/services/evalService';
import { apiRequest } from '@/lib/apiClient';
import type { Prompt } from '@/types/api';

interface PageProps {
  params: Promise<{ slug: string; promptSlug: string }>;
}

async function getPrompt(projectSlug: string, promptSlug: string) {
  return apiRequest<Prompt>(
    `/projects/${encodeURIComponent(projectSlug)}/prompts/${encodeURIComponent(promptSlug)}`,
  );
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { slug, promptSlug } = await params;

  const [projectResult, promptResult, versionsResult, evalSetsResult] = await Promise.all([
    getProject(slug),
    getPrompt(slug, promptSlug),
    listVersions(slug, promptSlug),
    listEvalSets(slug, promptSlug),
  ]);

  if (!projectResult?.success) {
    if (projectResult?.error?.code === 'not_found') notFound();
    return (
      <Alert variant="danger" title="Couldn't load project">
        {projectResult?.error?.message ?? 'unknown error'}
      </Alert>
    );
  }
  if (!promptResult?.success) {
    if (promptResult?.error?.code === 'not_found') notFound();
    return (
      <Alert variant="danger" title="Couldn't load prompt">
        {promptResult?.error?.message ?? 'unknown error'}
      </Alert>
    );
  }

  const project = projectResult.data!;
  const prompt = promptResult.data!;
  const versions = versionsResult?.success ? (versionsResult.data?.items ?? []) : [];
  const evalSets = evalSetsResult?.success ? (evalSetsResult.data?.items ?? []) : [];

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { href: '/projects', label: 'Projects' },
          { href: `/projects/${project.slug}`, label: project.name },
          { label: prompt.name },
        ]}
      />

      <PageHeader
        eyebrow={`${project.name} · prompt`}
        title={prompt.name}
        description={prompt.description || `slug: ${prompt.slug}`}
        actions={<DeletePromptButton projectSlug={project.slug} promptSlug={prompt.slug} promptName={prompt.name} />}
      />

      {!versionsResult?.success && (
        <Alert variant="warning" title="Couldn't load versions">
          {versionsResult?.error?.message ?? 'unknown error'}
        </Alert>
      )}

      {!evalSetsResult?.success && (
        <Alert variant="warning" title="Couldn't load eval sets">
          {evalSetsResult?.error?.message ?? 'unknown error'}
        </Alert>
      )}

      <PromptWorkspace
        projectSlug={project.slug}
        promptSlug={prompt.slug}
        versions={versions}
        evalSets={evalSets}
      />
    </div>
  );
}
