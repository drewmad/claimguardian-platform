/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Improved empty state component with educational content and clear CTAs"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card-variants";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";
import React from "react";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateTip {
  title: string;
  description: string;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tips?: EmptyStateTip[];
  learnMoreUrl?: string;
  className?: string;
  variant?: "default" | "compact" | "full";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  tips = [],
  learnMoreUrl,
  className,
  variant = "default",
}: EmptyStateProps) {
  const sizes = {
    default: {
      icon: "w-16 h-16",
      title: "text-xl",
      padding: "p-12",
    },
    compact: {
      icon: "w-12 h-12",
      title: "text-lg",
      padding: "p-8",
    },
    full: {
      icon: "w-20 h-20",
      title: "text-2xl",
      padding: "p-16",
    },
  };

  const size = sizes[variant];

  return (
    <Card
      variant="insurance"
      className={cn("relative overflow-hidden", className)}
    >
      <CardContent className={cn(size.padding, "text-center")}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-700 rounded-full blur-xl opacity-50" />
              <Icon className={cn(size.icon, "text-gray-600 relative")} />
            </div>
          </div>

          {/* Title & Description */}
          <h3 className={cn(size.title, "font-semibold text-white mb-2")}>
            {title}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-3 justify-center mb-8">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                const isExternal = action.href?.startsWith("http");

                if (action.href) {
                  return (
                    <a
                      key={index}
                      href={action.href}
                      onClick={action.onClick}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                        action.variant === "secondary"
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : action.variant === "outline"
                            ? "border border-gray-600 hover:bg-gray-700 text-gray-300"
                            : "bg-blue-600 hover:bg-blue-700 text-white",
                      )}
                    >
                      {ActionIcon && <ActionIcon className="w-4 h-4" />}
                      {action.label}
                    </a>
                  );
                }

                return (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    onClick={action.onClick}
                    className="gap-2"
                  >
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Educational Tips */}
          {tips.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Quick Tips
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                {tips.map((tip, index) => {
                  const TipIcon = tip.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      {TipIcon && (
                        <div className="flex-shrink-0">
                          <TipIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white mb-1">
                          {tip.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learn More Link */}
          {learnMoreUrl && (
            <div className="mt-6">
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Learn more about getting started →
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Insurance-specific empty states
export function InsuranceEmptyState({
  onAddPolicy,
  onAddProperty,
}: {
  onAddPolicy?: () => void;
  onAddProperty?: () => void;
}) {
  return (
    <EmptyState
      icon={Shield}
      title="No Insurance Policies Yet"
      description="Start by adding your properties and insurance policies to track coverage, manage claims, and protect your assets."
      actions={[
        {
          label: "Add Property",
          onClick: onAddProperty,
          variant: "secondary",
          icon: Home,
        },
        {
          label: "Add Policy",
          onClick: onAddPolicy,
          icon: Shield,
        },
      ]}
      tips={[
        {
          icon: Shield,
          title: "Complete Coverage",
          description: "Track all your insurance policies in one place",
        },
        {
          icon: AlertTriangle,
          title: "Claim Management",
          description: "File and track claims directly from the dashboard",
        },
        {
          icon: DollarSign,
          title: "Premium Tracking",
          description: "Monitor payments and renewal dates",
        },
      ]}
      learnMoreUrl="https://help.claimguardian.com/insurance"
    />
  );
}

// Export for convenience
import {
  Shield,
  Home,
  AlertTriangle,
  DollarSign,
  FileText,
  Package,
} from "lucide-react";

export { Shield, Home, AlertTriangle, DollarSign };
