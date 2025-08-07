import { Metadata } from "next";
import { RealtimeClaimsDashboard } from "@/components/claims/realtime-claims-dashboard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata: Metadata = {
  title: "Real-Time Claims Processing - ClaimGuardian",
  description:
    "Live claims monitoring, queue management, and automated processing with AI-powered insights",
};

export default function RealtimeClaimsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Real-Time Claims Processing
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor claims processing in real-time with AI-powered queue
            management and automated workflows
          </p>
        </div>

        <RealtimeClaimsDashboard className="space-y-6" />
      </div>
    </DashboardLayout>
  );
}
