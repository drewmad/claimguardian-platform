import { Metadata } from "next";
import { CommunityInsightsDashboard } from "@/components/community/CommunityInsightsDashboard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata: Metadata = {
  title: "Community Insights | ClaimGuardian",
  description: "Privacy-first community insights and claim trends in your area",
};

export default function CommunityInsightsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Community Insights</h1>
          <p className="text-gray-600 mt-2">
            Discover trends and patterns in your community while maintaining
            complete privacy
          </p>
        </div>

        <CommunityInsightsDashboard />
      </div>
    </DashboardLayout>
  );
}
