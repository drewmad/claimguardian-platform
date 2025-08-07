import { Metadata } from "next";
import { SentimentAnalysisDashboard } from "@/components/sentiment/SentimentAnalysisDashboard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata: Metadata = {
  title: "Sentiment Analysis | ClaimGuardian",
  description:
    "AI-powered sentiment analysis of customer communications and feedback",
};

export default function SentimentAnalysisPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <SentimentAnalysisDashboard />
      </div>
    </DashboardLayout>
  );
}
