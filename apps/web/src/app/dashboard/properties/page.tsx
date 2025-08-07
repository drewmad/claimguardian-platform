/**
 * @fileMetadata
 * @purpose "Properties dashboard page showing all user properties with enrichment status"
 * @dependencies ["@/actions","@/components","@/lib","@claimguardian/db","@claimguardian/ui"]
 * @owner property-team
 * @status stable
 */

"use client";

import { Card } from "@claimguardian/ui";
import { Button } from "@claimguardian/ui";
import {
  Plus,
  Home,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  MoreVertical,
  Shield,
  Lock,
  Users,
  TrendingUp,
  Crown,
  Building,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger/production-logger";

import { PropertyEnrichmentStatus } from "@/components/property/property-enrichment-status";
import { PropertyLimitModal } from "@/components/property/property-limit-modal";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PropertyCardSkeleton,
  DashboardStatsSkeleton,
  SkeletonCard,
} from "@/components/ui/skeleton";
import { ComponentLoader } from "@/components/loading/page-loader";
import { useLoadingState, useAsyncOperation } from "@/hooks/use-loading-state";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { checkPropertyLimit, getPropertyPricing } from "@/actions/user-tiers";
import { UserTier } from "@/lib/permissions/permission-checker";
type Json =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

interface Property {
  id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  county_name?: string;
  full_address: string;
  location?: Json;
  property_type: string;
  occupancy_status?: string;
  year_built?: number;
  square_footage?: number;
  lot_size_acres?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories: number;
  garage_spaces: number;
  pool: boolean;
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
  // Temporal fields
  version_id: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
  enrichment?: {
    version?: number;
    enriched_at?: string;
    flood_zone?: string;
    elevation_meters?: number;
    hurricane_evacuation_zone?: string;
  };
}

interface PropertyLimitInfo {
  canAdd: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  tier: UserTier;
  requiresUpgrade: boolean;
}

interface PropertyPricing {
  currentTier: UserTier;
  pricePerProperty: number;
  freeLimit: number;
  currentCount: number;
  additionalPropertiesNeeded: number;
  monthlyAdditionalCost: number;
  nextPropertyCost: number;
  isUnlimited: boolean;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [limitInfo, setLimitInfo] = useState<PropertyLimitInfo | null>(null);
  const [pricing, setPricing] = useState<PropertyPricing | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "multiple">("single");

  // Enhanced loading states
  const propertiesLoader = useLoadingState({
    key: "properties",
    minDuration: 500,
  });
  const limitsLoader = useLoadingState({ key: "limits", minDuration: 300 });
  const { execute: executeAsync } = useAsyncOperation();

  const { user } = useAuth();
  const supabase = createClient();

  const fetchProperties = useCallback(async () => {
    const result = await executeAsync(
      async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        propertiesLoader.startLoading("Loading your properties...");
        propertiesLoader.updateProgress(20);

        // Fetch current properties with enrichment data
        const { data, error } = await supabase
          .from("properties")
          .select(
            `
            *,
            enrichment:property_enrichments(
              version,
              enriched_at,
              flood_zone,
              elevation_meters,
              hurricane_evacuation_zone
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("is_current", true) // Only get current versions
          .eq("property_enrichments.is_current", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        propertiesLoader.updateProgress(80);
        propertiesLoader.updateMessage("Processing property data...");

        // Transform the data to include enrichment
        const transformedData =
          data?.map((property) => ({
            ...property,
            enrichment: property.enrichment?.[0] || null,
          })) || [];

        propertiesLoader.updateProgress(100);
        return transformedData;
      },
      {
        loadingMessage: "Fetching properties...",
        successMessage: "Properties loaded successfully",
        errorMessage: "Failed to load properties",
        showProgress: true,
      },
    );

    if (result) {
      setProperties(result);
      propertiesLoader.stopLoading();
    } else {
      propertiesLoader.setError(new Error("Failed to load properties"));
    }
  }, [supabase, executeAsync, propertiesLoader]);

  const fetchLimitInfo = useCallback(async () => {
    if (!user) return;

    const result = await executeAsync(
      async () => {
        limitsLoader.startLoading("Checking property limits...");
        limitsLoader.updateProgress(30);

        const [limitResult, pricingResult] = await Promise.all([
          checkPropertyLimit(user.id),
          getPropertyPricing(user.id),
        ]);

        limitsLoader.updateProgress(80);
        limitsLoader.updateMessage("Processing limit data...");

        const data = {
          limitInfo: limitResult.data || null,
          pricing: pricingResult.data || null,
        };

        limitsLoader.updateProgress(100);
        return data;
      },
      {
        loadingMessage: "Loading property limits...",
        successMessage: "Limits loaded",
        errorMessage: "Failed to load property limits",
        showProgress: true,
      },
    );

    if (result) {
      setLimitInfo(result.limitInfo);
      setPricing(result.pricing);
      limitsLoader.stopLoading();
    }
  }, [user, executeAsync, limitsLoader]);

  useEffect(() => {
    fetchProperties();
    fetchLimitInfo();
  }, [fetchProperties, fetchLimitInfo]);

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case "free":
        return <Users className="h-4 w-4" />;
      case "renter":
        return <Home className="h-4 w-4" />;
      case "essential":
        return <Shield className="h-4 w-4" />;
      case "plus":
        return <TrendingUp className="h-4 w-4" />;
      case "pro":
        return <Crown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case "free":
        return "border-gray-500 text-gray-500";
      case "renter":
        return "border-blue-500 text-blue-500";
      case "essential":
        return "border-green-500 text-green-500";
      case "plus":
        return "border-purple-500 text-purple-500";
      case "pro":
        return "border-yellow-500 text-yellow-500";
      default:
        return "border-gray-500 text-gray-500";
    }
  };

  const handleAddProperty = async () => {
    if (!limitInfo || !user) {
      toast.error("Unable to check property limits");
      return;
    }

    if (limitInfo.canAdd) {
      // User can add more properties within their tier
      window.location.href = "/dashboard/properties/add";
    } else {
      // Show limit modal
      setShowLimitModal(true);
    }
  };

  const handleUpgrade = () => {
    setShowLimitModal(false);
    window.location.href = "/pricing";
  };

  const handlePayPerProperty = () => {
    setShowLimitModal(false);
    toast.success(
      "Additional property slot added! You can now add another property.",
    );
    // Refresh limits after payment
    fetchLimitInfo();
  };

  // Enhanced loading screen
  if (propertiesLoader.isLoading && properties.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Tab skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </div>

        {/* Stats skeleton */}
        <DashboardStatsSkeleton />

        {/* Property cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Properties Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage and review your portfolio of properties.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "single"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Home className="inline-block mr-2 h-4 w-4" />
          My Property
        </button>
        <button
          onClick={() => setActiveTab("multiple")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "multiple"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Building className="inline-block mr-2 h-4 w-4" />
          Multiple Properties
        </button>
      </div>

      {/* Property Limits Info Card */}
      <ComponentLoader
        isLoading={limitsLoader.isLoading}
        skeleton={<SkeletonCard className="mb-6 bg-gray-50 dark:bg-gray-800" />}
      >
        {limitInfo && pricing && !limitInfo.canAdd && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Property Limit Reached
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your {limitInfo.tier} plan includes {limitInfo.limit}{" "}
                      properties.
                      {pricing.pricePerProperty > 0 && (
                        <span>
                          {" "}
                          Additional properties are ${pricing.pricePerProperty}
                          /month each.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLimitModal(true)}
                  >
                    View Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </ComponentLoader>

      {/* Tab Content */}
      {activeTab === "single" ? (
        // Single Property Tab
        properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No property yet</h3>
              <p className="text-gray-600 mb-4">
                Add your primary residence to get started with ClaimGuardian
              </p>
              <Link href="/dashboard/properties/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {properties.slice(0, 1).map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative bg-gradient-to-br from-blue-400 to-blue-600">
                  <img
                    src={`https://source.unsplash.com/800x450/?house,modern,architecture&sig=${property.id}`}
                    alt={
                      (property.metadata as { name?: string })?.name ||
                      property.street_address
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {(property.metadata as { name?: string })?.name ||
                      "My Home"}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {property.city}, {property.state}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>
                      Added:{" "}
                      {new Date(property.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      Est. Value:{" "}
                      {property.current_value
                        ? `$${property.current_value.toLocaleString()}`
                        : "-"}
                    </div>
                    <div>
                      Insurability: {property.enrichment ? "Assessed" : "-"}
                    </div>
                  </div>
                  <Link href={`/dashboard/properties/${property.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        // Multiple Properties Tab
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {!limitsLoader.isLoading && limitInfo && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getTierColor(limitInfo.tier)}
                    >
                      <div className="flex items-center gap-1">
                        {getTierIcon(limitInfo.tier)}
                        <span className="capitalize">{limitInfo.tier}</span>
                      </div>
                    </Badge>
                    <span>
                      {limitInfo.currentCount} of{" "}
                      {limitInfo.limit === 999999 ? "∞" : limitInfo.limit}{" "}
                      properties
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleAddProperty}
              disabled={limitsLoader.isLoading}
            >
              {limitInfo?.canAdd ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Add Property
                </>
              )}
            </Button>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No additional properties
                </h3>
                <p className="text-gray-600 mb-4">
                  Perfect for landlords and property managers. Add rental
                  properties, vacation homes, and investment properties.
                </p>
                <Link href="/dashboard/properties/add">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => {
                // Generate a display name for the property
                const propertyName =
                  (property.metadata as { name?: string })?.name ||
                  `${property.property_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${properties.indexOf(property) + 1}`;

                return (
                  <Card
                    key={property.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={`https://source.unsplash.com/800x450/?house,property,real-estate&sig=${property.id}`}
                        alt={propertyName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {propertyName}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {property.city}, {property.state}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div>
                          Added:{" "}
                          {new Date(property.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          Est. Value:{" "}
                          {property.current_value
                            ? `$${property.current_value.toLocaleString()}`
                            : "-"}
                        </div>
                        <div>
                          Insurability: {property.enrichment ? "Assessed" : "-"}
                        </div>
                      </div>
                      <Link href={`/dashboard/properties/${property.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Property Limit Modal */}
      <PropertyLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        onPayPerProperty={handlePayPerProperty}
        userId={user?.id || ""}
      />
    </div>
  );
}
