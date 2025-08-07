/**
 * @fileMetadata
 * @purpose "Property limit enforcement modal for tier-based restrictions"
 * @dependencies ["@/components","@/lib","react"]
 * @owner property-team
 * @status stable
 */
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Home,
  TrendingUp,
  Zap,
  Users,
  AlertTriangle,
  Plus,
  CreditCard,
  Check,
} from "lucide-react";
import { UserTier } from "@/lib/permissions/permission-checker";
import {
  getPropertyPricing,
  checkPropertyLimit,
  createAdditionalPropertySubscription,
} from "@/actions/user-tiers";

interface PropertyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onPayPerProperty: () => void;
  userId: string;
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

export function PropertyLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  onPayPerProperty,
  userId,
}: PropertyLimitModalProps) {
  const [limitInfo, setLimitInfo] = useState<PropertyLimitInfo | null>(null);
  const [pricing, setPricing] = useState<PropertyPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadPropertyInfo();
    }
  }, [isOpen, userId]);

  const loadPropertyInfo = async () => {
    try {
      setLoading(true);

      const [limitResult, pricingResult] = await Promise.all([
        checkPropertyLimit(userId),
        getPropertyPricing(userId),
      ]);

      if (limitResult.data) {
        setLimitInfo(limitResult.data);
      }

      if (pricingResult.data) {
        setPricing(pricingResult.data);
      }
    } catch (error) {
      console.error("Error loading property info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPerProperty = async () => {
    if (!pricing) return;

    try {
      setProcessingPayment(true);

      const result = await createAdditionalPropertySubscription({
        userId,
        additionalProperties: 1,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onPayPerProperty();
      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case "free":
        return <Users className="h-5 w-5" />;
      case "renter":
        return <Home className="h-5 w-5" />;
      case "essential":
        return <Zap className="h-5 w-5" />;
      case "plus":
        return <TrendingUp className="h-5 w-5" />;
      case "pro":
        return <Crown className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
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

  const tierUpgradeOptions: Record<
    UserTier,
    { name: string; price: number; limit: number }[]
  > = {
    free: [
      { name: "Basic", price: 9.99, limit: 3 },
      { name: "Essential", price: 29.99, limit: 5 },
      { name: "Plus", price: 49.99, limit: 15 },
    ],
    basic: [
      { name: "Essential", price: 29.99, limit: 5 },
      { name: "Plus", price: 49.99, limit: 15 },
    ],
    essential: [
      { name: "Plus", price: 49.99, limit: 15 },
    ],
    plus: [
      { name: "Pro", price: 99.99, limit: 999999 },
    ],
    renter: [
      { name: "Pro", price: 99.99, limit: 999999 },
      { name: "Enterprise", price: 0, limit: 999999 },
    ],
    homeowner: [
      { name: "Pro", price: 99.99, limit: 999999 },
      { name: "Enterprise", price: 0, limit: 999999 },
    ],
    pro: [],
    enterprise: [],
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Property Limit Reached
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose how you'd like to add more properties to your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          {limitInfo && pricing && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getTierColor(limitInfo.tier)}
                    >
                      <div className="flex items-center gap-1">
                        {getTierIcon(limitInfo.tier)}
                        <span className="capitalize">{limitInfo.tier}</span>
                      </div>
                    </Badge>
                    <div className="text-sm text-gray-400">
                      {limitInfo.currentCount} of {limitInfo.limit} properties
                      used
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      Additional properties
                    </div>
                    <div className="font-semibold text-white">
                      ${pricing.pricePerProperty}/month each
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pay Per Property */}
            {pricing && !pricing.isUnlimited && (
              <Card className="bg-gray-800 border-gray-700 hover:border-blue-600 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-blue-500" />
                    Add One Property
                  </CardTitle>
                  <CardDescription>
                    Pay per additional property as needed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-300">
                        ${pricing.nextPropertyCost}/month per property
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-300">
                        No commitment required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-300">
                        Cancel anytime
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handlePayPerProperty}
                    disabled={processingPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {processingPayment
                      ? "Processing..."
                      : `Pay $${pricing.nextPropertyCost}/month`}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upgrade Tier */}
            {limitInfo && tierUpgradeOptions[limitInfo.tier].length > 0 && (
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-600 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Upgrade Your Plan
                  </CardTitle>
                  <CardDescription>
                    Get more properties and additional features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tierUpgradeOptions[limitInfo.tier]
                      .slice(0, 2)
                      .map((option) => (
                        <div
                          key={option.name}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-300">
                            {option.name}:{" "}
                            {option.limit === 999999
                              ? "Unlimited"
                              : option.limit}{" "}
                            properties for ${option.price}/month
                          </span>
                        </div>
                      ))}
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-300">
                        Full AI toolkit included
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={onUpgrade}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Questions about pricing?{" "}
              <a href="/contact" className="text-blue-400 hover:text-blue-300">
                Contact our team
              </a>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
