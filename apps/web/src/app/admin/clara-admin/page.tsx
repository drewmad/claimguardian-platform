/**
 * @fileMetadata
 * @owner @admin-team
 * @purpose "Clara AI Companion Admin Page (ADMIN ONLY)"
 * @dependencies ["react", "@/components/admin/clara-admin-dashboard"]
 * @status stable
 * @ai-integration clara-companion
 * @insurance-context emotional-support
 * @security-level admin-only
 */

"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { ClaraAdminDashboard } from "@/components/admin/clara-admin-dashboard";

export default function ClaraAdminPage() {
  return (
    <AdminLayout>
      <ClaraAdminDashboard />
    </AdminLayout>
  );
}
