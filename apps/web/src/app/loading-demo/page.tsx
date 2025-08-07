/**
 * @fileMetadata
 * @purpose "Demonstration page showcasing all loading states and components"
 * @owner ui-team
 * @dependencies ["react", "@/components/loading", "@/components/ui"]
 * @exports ["LoadingDemoPage"]
 * @complexity medium
 * @tags ["demo", "loading", "ui"]
 * @status stable
 */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  PropertyCardSkeleton,
  DashboardStatsSkeleton,
  ClaimCardSkeleton,
} from "@/components/ui/skeleton";
import {
  LoadingOverlay,
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  LoadingBars,
  LoadingSparkles,
  ProgressIndicator,
  StepIndicator,
} from "@/components/ui/loading-overlay";
import {
  PageLoader,
  DashboardLoader,
  ModalLoader,
  ComponentLoader,
} from "@/components/loading/page-loader";
import {
  useLoadingState,
  useAsyncOperation,
  useMultiStepLoading,
} from "@/hooks/use-loading-state";

const demoSteps = [
  "Initialize system",
  "Load user data",
  "Fetch properties",
  "Process AI insights",
  "Render dashboard",
];

export default function LoadingDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Demo loading states
  const basicLoader = useLoadingState({ key: "basic-demo" });
  const { execute: executeAsyncDemo } = useAsyncOperation();
  const multiStep = useMultiStepLoading(
    demoSteps.map((step) => ({ id: step, label: step })),
  );

  // Auto-increment progress for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev >= demoSteps.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const runBasicLoadingDemo = async () => {
    basicLoader.startLoading("Running basic loading demo...");

    // Simulate loading stages
    setTimeout(() => basicLoader.updateMessage("Processing data..."), 1000);
    setTimeout(() => basicLoader.updateMessage("Almost done..."), 2000);
    setTimeout(() => basicLoader.stopLoading(), 3000);
  };

  const runAsyncDemo = async () => {
    await executeAsyncDemo(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { success: true };
      },
      {
        loadingMessage: "Running async operation demo...",
        successMessage: "Operation completed!",
        errorMessage: "Operation failed!",
        showProgress: true,
      },
    );
  };

  const runMultiStepDemo = async () => {
    multiStep.resetSteps();

    for (let i = 0; i < demoSteps.length; i++) {
      const step = demoSteps[i];
      multiStep.startStep(step, `Processing ${step}...`);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 800));

      multiStep.completeStep(step);
    }
  };

  const demos = [
    {
      id: "spinners",
      title: "Loading Spinners",
      description: "Various spinner animations with different styles and sizes",
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <LoadingSpinner size="sm" />
            <p className="text-xs text-gray-600">Small Spinner</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-gray-600">Medium Spinner</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-gray-600">Large Spinner</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingDots size="md" />
            <p className="text-xs text-gray-600">Bouncing Dots</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingPulse size="md" />
            <p className="text-xs text-gray-600">Pulse Rings</p>
          </div>
          <div className="text-center space-y-2">
            <LoadingBars size="md" />
            <p className="text-xs text-gray-600">Dancing Bars</p>
          </div>
        </div>
      ),
    },
    {
      id: "skeletons",
      title: "Skeleton Loaders",
      description: "Content placeholders that match your layout structure",
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Basic Skeletons</h4>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Text Skeleton</h4>
            <SkeletonText lines={3} width="full" />
          </div>

          <div>
            <h4 className="font-medium mb-4">Card Skeleton</h4>
            <SkeletonCard showImage={true} showAvatar={true} textLines={2} />
          </div>

          <div>
            <h4 className="font-medium mb-4">Table Skeleton</h4>
            <SkeletonTable rows={3} columns={4} showHeader={true} />
          </div>
        </div>
      ),
    },
    {
      id: "progress",
      title: "Progress Indicators",
      description: "Show completion status and step-by-step progress",
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Progress Bar</h4>
            <ProgressIndicator
              progress={progress}
              message="Loading assets..."
              showPercentage={true}
              color="blue"
            />
          </div>

          <div>
            <h4 className="font-medium mb-4">Step Indicator</h4>
            <StepIndicator steps={demoSteps} currentStep={currentStep} />
          </div>

          <div>
            <h4 className="font-medium mb-4">Multi-Step Loading</h4>
            <div className="space-y-3">
              <ProgressIndicator
                progress={multiStep.progress}
                message={multiStep.currentStep?.label || "Ready"}
                showPercentage={true}
                color={
                  multiStep.hasError
                    ? "orange"
                    : multiStep.isCompleted
                      ? "green"
                      : "blue"
                }
              />
              <Button onClick={runMultiStepDemo} disabled={multiStep.isLoading}>
                {multiStep.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Multi-Step Demo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "overlays",
      title: "Loading Overlays",
      description: "Full-screen and component-level loading overlays",
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Component Overlay</h4>
            <ComponentLoader
              isLoading={basicLoader.isLoading}
              className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
            >
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">
                  Content loaded successfully! 🎉
                </p>
              </div>
            </ComponentLoader>

            <div className="mt-3 space-x-2">
              <Button
                onClick={runBasicLoadingDemo}
                disabled={basicLoader.isLoading}
              >
                {basicLoader.isLoading ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Loading
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Loading
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={runAsyncDemo}
                disabled={basicLoader.isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Async Demo
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Different Overlay Variants</h4>
            <div className="grid grid-cols-2 gap-4">
              <LoadingOverlay
                isLoading={true}
                message="Default loading..."
                variant="spinner"
                backdrop={true}
                className="h-24 bg-gray-50 dark:bg-gray-800 rounded relative"
              />

              <LoadingOverlay
                isLoading={true}
                message="Processing with sparkles..."
                variant="sparkles"
                backdrop={true}
                className="h-24 bg-gray-50 dark:bg-gray-800 rounded relative"
              />

              <LoadingOverlay
                isLoading={true}
                message="Analyzing data..."
                variant="bars"
                backdrop={true}
                className="h-24 bg-gray-50 dark:bg-gray-800 rounded relative"
              />

              <LoadingOverlay
                isLoading={true}
                message="Syncing..."
                variant="pulse"
                backdrop={true}
                className="h-24 bg-gray-50 dark:bg-gray-800 rounded relative"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "specialized",
      title: "Specialized Loaders",
      description: "Pre-built loading components for specific use cases",
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Property Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Dashboard Stats</h4>
            <DashboardStatsSkeleton />
          </div>

          <div>
            <h4 className="font-medium mb-4">Claim Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClaimCardSkeleton />
              <ClaimCardSkeleton />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Modal Loading</h4>
            <Card>
              <CardHeader>
                <CardTitle>Sample Modal</CardTitle>
              </CardHeader>
              <CardContent>
                <ModalLoader
                  isLoading={true}
                  message="Processing your request..."
                  variant="default"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Loading States Demo
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive showcase of loading states, progress indicators, and
            skeleton loaders for enhanced user experience.
          </p>
        </motion.div>

        {/* Demo Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {demos.map((demo, index) => (
            <Button
              key={demo.id}
              variant={activeDemo === demo.id ? "default" : "outline"}
              onClick={() =>
                setActiveDemo(activeDemo === demo.id ? null : demo.id)
              }
              className={
                activeDemo === demo.id
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-white/20 text-white hover:bg-white/10"
              }
            >
              {demo.title}
            </Button>
          ))}
        </motion.div>

        {/* Demo Content */}
        <div className="space-y-8">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{
                opacity:
                  activeDemo === demo.id || activeDemo === null ? 1 : 0.3,
                y: 0,
                scale:
                  activeDemo === demo.id ? 1 : activeDemo === null ? 1 : 0.95,
              }}
              transition={{ delay: index * 0.1 }}
              className={`${
                activeDemo && activeDemo !== demo.id
                  ? "pointer-events-none"
                  : ""
              }`}
            >
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl">
                        {demo.title}
                      </CardTitle>
                      <p className="text-gray-300 mt-1">{demo.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-500 text-blue-400"
                    >
                      Interactive
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    {demo.component}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            ← Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
