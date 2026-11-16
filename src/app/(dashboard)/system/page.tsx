import { getSystemHealthSummary } from '@/features/system/services/system.service';
import { SystemView } from '@/features/system/components/system-view';

export const metadata = {
  title: 'System Health & Incident Response | OpsPilot',
  description: 'Subsystem telemetry, autonomous circuit breaker, and incident mitigation ledger.',
};

export default async function SystemPage() {
  const summary = await getSystemHealthSummary();

  return <SystemView initialData={summary} />;
}
