import { getSuppliersSummary } from '@/features/suppliers/services/suppliers.service';
import { SuppliersView } from '@/features/suppliers/components/suppliers-view';

export const metadata = {
  title: 'Suppliers & Replenishment | OpsPilot',
  description: 'Automotive vendor directory and purchase order replenishment hub.',
};

export default async function SuppliersPage() {
  const summary = await getSuppliersSummary();

  return <SuppliersView initialData={summary} />;
}
