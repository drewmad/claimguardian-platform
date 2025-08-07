/**
 * @fileMetadata
 * @purpose "AI Use Agreement page"
 * @dependencies ["@/components","next"]
 * @owner legal-team
 * @status stable
 */

import { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "AI Use Agreement | ClaimGuardian",
  description: "How ClaimGuardian uses AI to help with your insurance claims",
};

export default function AIUseAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <LegalDocumentView documentType="ai_use_agreement" />
      </div>
    </div>
  );
}
