import { Metadata } from 'next';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Notification Preferences | ClaimGuardian',
  description: 'Manage your notification preferences and communication channels',
};

export default function NotificationSettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-gray-600 mt-2">
            Control how and when you receive updates about your properties, claims, and community alerts
          </p>
        </div>

        <NotificationPreferences />
      </div>
    </DashboardLayout>
  );
}
