/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Enhanced dashboard with mobile-first responsive design and accessibility improvements"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-06T00:00:00Z
 * @notes Updated for WCAG 2.1 AA compliance, improved mobile UX, and enhanced touch targets
 */
"use client";

// Force dynamic rendering to prevent SSG issues with Supabase client
export const dynamic = "force-dynamic";

import {
  Shield,
  Wrench,
  CheckCircle,
  AlertCircle,
  CloudRain,
  Wind,
  Droplets,
  Activity,
  Camera,
  FileText,
  ChevronRight,
  Package,
  DollarSign,
  Bell,
  Calendar,
  Home,
  Car,
  Zap,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Thermometer,
  Timer,
  Settings2,
  ShieldCheck,
  Receipt,
  HardHat,
  Siren,
  Code,
  Menu,
  X,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LearningWidget } from "@/components/learning/learning-widget";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { PropertySetupWizard } from "@/components/onboarding/property-setup-wizard";
import { AIToolsIntroduction } from "@/components/onboarding/ai-tools-introduction";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/lib/supabase/client";
import { profileService, UserProfile } from "@/lib/auth/profile-service";
import { FloridaPropertyMap } from "@/components/maps/florida-property-map";
import {
  MetricCard,
  ActivityFeed,
  WeatherWidget,
  PropertyHealthWidget,
  InsuranceOverviewWidget,
  AIInsightsWidget,
} from "@/components/dashboard/enhanced-dashboard-widgets";

interface QuickAccessItem {
  id: string;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  hoverColor: string;
  isPrimary?: boolean;
  ariaLabel?: string;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: "personal-property",
    title: "Personal Property",
    path: "/dashboard/personal-property",
    icon: Package,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(147,51,234,0.15)]",
    isPrimary: true,
    ariaLabel: "Manage personal property inventory",
  },
  {
    id: "expenses",
    title: "Expenses",
    path: "/dashboard/expenses",
    icon: DollarSign,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(34,197,94,0.15)]",
    isPrimary: true,
    ariaLabel: "View and manage expenses",
  },
  {
    id: "claims",
    title: "Claims",
    path: "/dashboard/claims",
    icon: FileText,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)]",
    isPrimary: true,
    ariaLabel: "Access insurance claims",
  },
  {
    id: "maintenance",
    title: "Maintenance",
    path: "/dashboard/maintenance",
    icon: Wrench,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(6,182,212,0.15)]",
    isPrimary: true,
    ariaLabel: "Schedule and track maintenance",
  },
  {
    id: "warranty-watch",
    title: "Warranty Watch",
    path: "/dashboard/warranty-watch",
    icon: ShieldCheck,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(234,179,8,0.15)]",
    ariaLabel: "Monitor warranty coverage",
  },
  {
    id: "contractors",
    title: "Contractors",
    path: "/dashboard/contractors",
    icon: HardHat,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(251,146,60,0.15)]",
    ariaLabel: "Find and manage contractors",
  },
  {
    id: "situation-room",
    title: "Situation Room",
    path: "/dashboard/situation-room",
    icon: Siren,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]",
    ariaLabel: "Emergency response center",
  },
  {
    id: "development",
    title: "Development",
    path: "/dashboard/development",
    icon: Code,
    hoverColor: "hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]",
    ariaLabel: "Developer tools and settings",
  },
];

function QuickAccessGrid({ router }: { router: ReturnType<typeof useRouter> }) {
  const [showAll, setShowAll] = useState(false);

  const primaryItems = QUICK_ACCESS_ITEMS.filter((item) => item.isPrimary);
  const secondaryItems = QUICK_ACCESS_ITEMS.filter((item) => !item.isPrimary);

  const displayItems = showAll ? QUICK_ACCESS_ITEMS : primaryItems;

  return (
    <section role="region" aria-label="Quick access navigation">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {displayItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              data-quick-access={item.id}
              className={`
                touch-target-lg p-4 liquid-glass-2
                hover:liquid-glass-3 active:scale-95 rounded-lg
                transition-all flex flex-col items-center gap-3 group
                shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${item.hoverColor}
                focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:outline-none
              `}
              aria-label={item.ariaLabel || `Go to ${item.title}`}
              role="button"
              tabIndex={0}
            >
              <Icon
                className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              />
              <span className="text-sm sm:text-base text-center font-medium">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      {!showAll && secondaryItems.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label={`Show ${secondaryItems.length} more quick access options`}
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Show {secondaryItems.length} More
          </Button>
        </div>
      )}

      {showAll && (
        <div className="flex justify-center mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Show fewer options"
          >
            Show Less
          </Button>
        </div>
      )}
    </section>
  );
}

// Enhanced empty state components with better accessibility
function EmptyRecentActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-3">
        <Activity className="h-6 w-6 text-blue-400" aria-hidden="true" />
      </div>
      <h4 className="text-white font-medium mb-2">No recent activity</h4>
      <p className="text-sm text-text-secondary mb-4">
        Start managing your property to see activity here
      </p>
      <Button
        size="sm"
        onClick={() =>
          document
            .querySelector<HTMLButtonElement>(
              '[data-quick-access="personal-property"]',
            )
            ?.click()
        }
        className="bg-blue-600 hover:bg-blue-700"
        aria-label="Add personal property items to get started"
      >
        Add Property Items
      </Button>
    </div>
  );
}

function EmptyUpcomingTasks() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-3">
        <CheckCircle className="h-6 w-6 text-green-400" aria-hidden="true" />
      </div>
      <h4 className="text-white font-medium mb-2">You're all caught up!</h4>
      <p className="text-sm text-text-secondary mb-4">
        No pending tasks at the moment
      </p>
      <Button
        size="sm"
        variant="outline"
        className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
        onClick={() =>
          toast.info(
            "Task history coming soon! You'll be able to view all your completed maintenance tasks.",
          )
        }
        aria-label="View task history (coming soon)"
      >
        View Completed Tasks
      </Button>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showPropertyWizard, setShowPropertyWizard] = useState(false);
  const [showAIToolsIntro, setShowAIToolsIntro] = useState(false);

  const onboarding = useOnboarding();

  // Mock states for demonstration - in real app, these would come from API calls
  const [hasRecentActivity] = useState(true);
  const [hasPendingTasks] = useState(true);
  const [hasProperties, setHasProperties] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const profile = await profileService.getProfile(user.id);
        if (profile) {
          setUserProfile(profile);
        }

        const { data, error } = await supabase
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          logger.error("Error checking onboarding:", {}, toError(error));
        }

        // Check if user has any properties
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        const userHasProperties = properties && properties.length > 0;
        setHasProperties(userHasProperties);

        // Check if we should show the welcome tour
        if (!onboarding.isLoading && onboarding.shouldShowTour()) {
          setShowWelcomeTour(true);
        } else if (!userHasProperties && !onboarding.hasAddedProperty) {
          // Don't auto-show property wizard - user can click "Add Property" button when ready
          // setShowPropertyWizard(true);
        } else if (
          onboarding.hasAddedProperty &&
          !onboarding.hasExploredAITools
        ) {
          // Show AI Tools intro after property setup
          setShowAIToolsIntro(true);
        }
      } catch (error) {
        logger.error("Error checking onboarding status:", {}, toError(error));
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, supabase, onboarding]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
            role="status"
            aria-label="Loading dashboard"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const userName =
    userProfile?.firstName ||
    user?.user_metadata?.firstName ||
    "Property Owner";

  return (
    <>
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Enhanced Header with better mobile UX */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Welcome back, {userName}
                </h1>
                <p className="text-text-secondary text-sm sm:text-base">
                  Your property is protected and monitored 24/7
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {onboarding.hasCompletedTour && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => setShowWelcomeTour(true)}
                    aria-label="Restart welcome tour"
                    title="Restart tour"
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => setShowAIToolsIntro(true)}
                  aria-label="Explore AI Tools"
                  title="AI Tools"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600 touch-target"
                  aria-label="View alerts and notifications"
                >
                  <Bell className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className="relative hidden sm:inline">
                    Alerts
                    <span
                      className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"
                      aria-hidden="true"
                    ></span>
                  </span>
                  <span className="relative sm:hidden">
                    <span
                      className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"
                      aria-hidden="true"
                    ></span>
                  </span>
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 touch-target"
                  size="sm"
                  aria-label="Quick add new item"
                  onClick={() => setShowPropertyWizard(true)}
                >
                  <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Add Property</span>
                </Button>
              </div>
            </header>

            {/* Enhanced Stats Grid with real-time metric cards */}
            <section role="region" aria-label="Property statistics overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <MetricCard 
                  metric={{
                    title: "Property Value",
                    value: "$485,000",
                    change: 5.2,
                    trend: "up",
                    icon: Home,
                    color: "from-blue-900/20 to-blue-800/20",
                    sparklineData: [450000, 455000, 460000, 465000, 470000, 475000, 480000, 485000]
                  }}
                />
                <MetricCard 
                  metric={{
                    title: "Items Tracked",
                    value: "247",
                    change: 12,
                    trend: "up",
                    icon: Package,
                    color: "from-purple-900/20 to-purple-800/20",
                    sparklineData: [210, 215, 220, 225, 230, 235, 240, 247]
                  }}
                />
                <MetricCard 
                  metric={{
                    title: "Coverage Score",
                    value: "100%",
                    change: 0,
                    trend: "stable",
                    icon: Shield,
                    color: "from-cyan-900/20 to-cyan-800/20",
                    sparklineData: [98, 99, 100, 100, 100, 100, 100, 100]
                  }}
                />
                <MetricCard 
                  metric={{
                    title: "Monthly Expenses",
                    value: "$1,245",
                    change: -12,
                    trend: "down",
                    icon: Receipt,
                    color: "from-green-900/20 to-green-800/20",
                    sparklineData: [1500, 1450, 1400, 1350, 1300, 1280, 1260, 1245]
                  }}
                />
                <MetricCard 
                  metric={{
                    title: "Pending Tasks",
                    value: hasPendingTasks ? "3" : "0",
                    change: hasPendingTasks ? 50 : -100,
                    trend: hasPendingTasks ? "up" : "down",
                    icon: AlertCircle,
                    color: hasPendingTasks ? "from-orange-900/20 to-orange-800/20" : "from-green-900/20 to-green-800/20",
                    sparklineData: [5, 4, 3, 2, 1, 2, 3, hasPendingTasks ? 3 : 0]
                  }}
                />
              </div>
            </section>

            {/* Main Content Grid with improved responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Enhanced for mobile-first */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Weather Widget with real-time updates */}
                <WeatherWidget />

                {/* Quick Access Grid */}
                <Card className="liquid-glass-4 border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.1)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickAccessGrid router={router} />
                  </CardContent>
                </Card>

                {/* Property Map */}
                <Card className="liquid-glass-4 border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.1)] transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-400" />
                        Florida Properties Overview
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/property-map")}
                        className="text-cyan-400 hover:text-cyan-300"
                        aria-label="View full property map"
                      >
                        View Full Map
                        <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="relative h-[400px] w-full">
                      <FloridaPropertyMap
                        height="400px"
                        showControls={true}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                        enableClustering={true}
                        showHeatMap={false}
                        showRealParcels={true}
                      />
                      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
                        <div className="absolute inset-0 bg-gray-800/90 flex items-center justify-center">
                          <div className="text-center p-6">
                            <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-white font-medium mb-2">Map Configuration Required</p>
                            <p className="text-sm text-gray-400 mb-4">
                              Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open("https://www.mapbox.com/", "_blank")}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              Get Mapbox Token
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Property Status - Enhanced for mobile */}
                <Card className="liquid-glass-4 border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        Property Status
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/property")}
                        className="text-cyan-400 hover:text-cyan-300"
                        aria-label="View all property status details"
                      >
                        View All
                        <ChevronRight
                          className="h-4 w-4 ml-1"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-600/20 rounded">
                            <CheckCircle
                              className="h-4 w-4 text-green-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              HVAC System
                            </p>
                            <p className="text-xs text-text-secondary">
                              Last serviced 2 weeks ago
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                          Good
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-600/20 rounded">
                            <AlertCircle
                              className="h-4 w-4 text-yellow-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Roof
                            </p>
                            <p className="text-xs text-text-secondary">
                              Inspection due in 30 days
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                          Due Soon
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Enhanced mobile experience */}
              <div className="space-y-4 sm:space-y-6">
                {/* Activity Feed with real-time updates */}
                <ActivityFeed limit={8} />

                {/* Upcoming Tasks */}
                <Card
                  id="upcoming-tasks"
                  className="liquid-glass-4 border-gray-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(251,146,60,0.1)] transition-all duration-500"
                  tabIndex={-1}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        Upcoming Tasks
                      </CardTitle>
                      {hasPendingTasks ? (
                        <Badge className="liquid-glass-warning text-orange-400">
                          3 pending
                        </Badge>
                      ) : (
                        <Badge className="liquid-glass-success text-green-400">
                          All done
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasPendingTasks ? (
                      <div
                        className="space-y-3"
                        role="region"
                        aria-label="Pending tasks"
                      >
                        <div className="p-3 liquid-glass-warning border border-orange-600/40 rounded-lg shadow-[0_4px_16px_rgba(251,146,60,0.15)]">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-medium text-white">
                                Prepare for Hurricane
                              </h4>
                              <p className="text-xs text-text-secondary mt-1">
                                Review checklist and secure property
                              </p>
                            </div>
                            <Badge className="liquid-glass-danger text-red-400 text-xs shrink-0 ml-2">
                              Urgent
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              Due in 2 days
                            </span>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs bg-orange-600 hover:bg-orange-700 touch-target"
                            >
                              Start
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyUpcomingTasks />
                    )}
                  </CardContent>
                </Card>

                {/* Property Health Score Widget */}
                <PropertyHealthWidget />

                {/* Insurance Overview Widget */}
                <InsuranceOverviewWidget />

                {/* AI Insights Widget */}
                <AIInsightsWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Learning Assistant Widget */}
        <LearningWidget />
      </DashboardLayout>

      {/* Welcome Tour */}
      {showWelcomeTour && (
        <WelcomeTour
          onComplete={() => {
            setShowWelcomeTour(false);
            onboarding.completeTour();
          }}
          onSkip={() => {
            setShowWelcomeTour(false);
            onboarding.skipTour();
            localStorage.setItem(
              "onboarding_tour_dismissed",
              Date.now().toString(),
            );
          }}
          startDelay={1000}
        />
      )}

      {/* Property Setup Wizard */}
      {showPropertyWizard && (
        <PropertySetupWizard
          onComplete={() => {
            setShowPropertyWizard(false);
            onboarding.markStepComplete("property");
            toast.success(
              "Property added successfully! Your dashboard is now personalized.",
            );
            // Show AI Tools intro next
            setShowAIToolsIntro(true);
          }}
          onSkip={() => {
            setShowPropertyWizard(false);
            localStorage.setItem(
              "property_wizard_skipped",
              Date.now().toString(),
            );
          }}
          // Only allow skip if user already has properties
          allowSkip={hasProperties || onboarding.hasAddedProperty}
        />
      )}

      {/* AI Tools Introduction */}
      {showAIToolsIntro && (
        <AIToolsIntroduction
          onComplete={() => {
            setShowAIToolsIntro(false);
            onboarding.markStepComplete("ai-tools", {
              selectedTools: JSON.parse(
                localStorage.getItem("selected_ai_tools") || "[]",
              ),
            });
            toast.success(
              "Great! You can now explore AI-powered features to enhance your property management.",
            );
          }}
          onSkip={() => {
            setShowAIToolsIntro(false);
            localStorage.setItem(
              "ai_tools_intro_skipped",
              Date.now().toString(),
            );
          }}
        />
      )}

      {/* Onboarding Modal Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 liquid-glass-overlay" />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <OnboardingFlow
                key={onboardingKey}
                onComplete={() => {
                  setShowOnboarding(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
