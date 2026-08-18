import { PageHeader } from '@/components/ui/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { KeysTable } from '@/components/keys/KeysTable';
import { listApiKeys } from '@/services/apiKeyService';

export const dynamic = 'force-dynamic';

export default async function KeysPage() {
  const result = await listApiKeys();
  const items = result?.success ? (result.data?.items ?? []) : [];

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'API keys' }]} />
      <PageHeader
        eyebrow="Settings"
        title="API keys"
        description="Bearer tokens for the SDK and CI runners. Scope keys to a single project or leave org-wide."
      />

      {!result?.success && (
        <Alert variant="danger" title="Couldn't load keys">
          {result?.error?.message ?? 'unknown error'}
        </Alert>
      )}

      {result?.success && <KeysTable items={items} />}
    </div>
  );
}
