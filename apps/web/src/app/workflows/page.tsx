import { Metadata } from 'next';
import { WorkflowManagement } from '@/components/workflows/WorkflowManagement';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Workflow Automation | ClaimGuardian',
  description: 'Automate repetitive tasks and streamline your insurance processes',
};

export default function WorkflowsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <WorkflowManagement />
      </div>
    </DashboardLayout>
  );
}