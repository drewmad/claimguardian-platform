import { Metadata } from 'next';
import { ClaimPredictor } from '@/components/ai/ClaimPredictor';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'AI Claim Predictor | ClaimGuardian',
  description: 'Predict claim approval likelihood and get AI-powered recommendations',
};

export default function ClaimPredictorPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI-Powered Claim Predictor</h1>
          <p className="text-gray-600 mt-2">
            Get instant predictions on your claim's approval likelihood, estimated timeline, and payout range.
            Our AI analyzes thousands of similar claims to provide data-driven recommendations.
          </p>
        </div>

        <ClaimPredictor />
      </div>
    </DashboardLayout>
  );
}
