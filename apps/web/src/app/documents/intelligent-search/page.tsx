/**
 * @fileMetadata
 * @purpose "Intelligent Document Search page with AI-powered search capabilities"
 * @owner ai-team
 * @dependencies ["react", "@/components/layout/dashboard-layout", "@/components/documents"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["page", "documents", "search", "ai"]
 * @status stable
 */

import { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { IntelligentDocumentSearchComponent } from "@/components/documents/intelligent-document-search";

export const metadata: Metadata = {
  title: "Intelligent Document Search - ClaimGuardian",
  description:
    "AI-powered search across all your insurance documents with natural language queries and semantic understanding.",
};

export default function IntelligentDocumentSearchPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <IntelligentDocumentSearchComponent />
      </div>
    </DashboardLayout>
  );
}
