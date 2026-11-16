import { getIntegrationsSummary } from '@/features/integrations/services/integrations.service';
import { IntegrationsView } from '@/features/integrations/components/integrations-view';

export const metadata = {
  title: 'Logistics & Webhook Integrations | OpsPilot',
  description: 'Manage carrier tracking webhooks, storefront order sync, and payment gateways.',
};

export default async function IntegrationsPage() {
  const summary = await getIntegrationsSummary();

  return <IntegrationsView initialData={summary} />;
}
