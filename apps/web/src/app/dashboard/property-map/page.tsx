/**
 * @fileMetadata
 * @purpose "Property map dashboard page showing interactive Florida property visualization"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "@/components/maps/property-map-dashboard"]
 * @exports ["PropertyMapPage"]
 * @complexity medium
 * @tags ["page", "dashboard", "maps", "properties"]
 * @status stable
 */

import { Metadata } from "next";
import { PropertyMapDashboard } from "@/components/maps/property-map-dashboard";

export const metadata: Metadata = {
  title: "Property Map - ClaimGuardian",
  description:
    "Interactive map visualization of Florida properties and insurance data",
};

export default function PropertyMapPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <PropertyMapDashboard />
    </div>
  );
}
