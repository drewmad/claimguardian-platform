import { Metadata } from 'next';
import { SystemMonitoringDashboard } from '@/components/monitoring/SystemMonitoringDashboard';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'System Monitoring | ClaimGuardian',
  description: 'Real-time system health and performance monitoring',
};

export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <SystemMonitoringDashboard />
      </div>
    </DashboardLayout>
  );
}
