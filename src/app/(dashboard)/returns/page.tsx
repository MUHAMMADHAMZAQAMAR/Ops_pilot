import { getReturnsSummary } from '@/features/returns/services/returns.service';
import { ReturnsView } from '@/features/returns/components/returns-view';

export const metadata = {
  title: 'Returns, RMA & Warranty Claims | OpsPilot',
  description: 'Automotive core returns, warranty verification, and refund authorization hub.',
};

export default async function ReturnsPage() {
  const summary = await getReturnsSummary();

  return <ReturnsView initialData={summary} />;
}
