import { getDemandForecastSummary } from '@/features/forecast/services/forecast.service';
import { ForecastView } from '@/features/forecast/components/forecast-view';

export const metadata = {
  title: 'Demand Forecasting & Restock Optimizer | OpsPilot',
  description: 'Predictive automotive SKU depletion curves and 1-click replenishment PO generation.',
};

export default async function ForecastPage() {
  const summary = await getDemandForecastSummary();

  return <ForecastView initialData={summary} />;
}
