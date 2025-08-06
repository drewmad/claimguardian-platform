import { Metadata } from 'next';
import { FraudDetectionDashboard } from '@/components/fraud/FraudDetectionDashboard';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Fraud Detection System | ClaimGuardian',
  description: 'AI-powered fraud detection and prevention system for insurance claims',
};

export default function FraudDetectionPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <FraudDetectionDashboard />
      </div>
    </DashboardLayout>
  );
}