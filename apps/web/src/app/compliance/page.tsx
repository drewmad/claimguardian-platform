import { Metadata } from 'next';
import { ComplianceChecker } from '@/components/compliance/ComplianceChecker';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Compliance Checker | ClaimGuardian',
  description: 'Automated Florida insurance compliance verification and document generation',
};

export default function CompliancePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Automated Compliance Checker</h1>
          <p className="text-gray-600 mt-2">
            Ensure your insurance claim meets all Florida statutory requirements.
            Our AI-powered system checks your claim against state regulations, identifies issues,
            and provides automatic fixes where possible.
          </p>
        </div>

        <ComplianceChecker />
      </div>
    </DashboardLayout>
  );
}
