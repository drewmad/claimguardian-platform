import { Metadata } from 'next';
import { PredictiveMaintenanceAlerts } from '@/components/maintenance/PredictiveMaintenanceAlerts';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Predictive Maintenance | ClaimGuardian',
  description: 'AI-powered predictive maintenance system to prevent costly repairs',
};

export default function PredictiveMaintenancePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <PredictiveMaintenanceAlerts />
      </div>
    </DashboardLayout>
  );
}