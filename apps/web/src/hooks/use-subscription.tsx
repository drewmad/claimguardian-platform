/**
 * @fileMetadata
 * @purpose "Hook for checking subscription status and limits"
 * @dependencies ["@/config","@/lib","react","sonner"]
 * @owner billing-team
 * @status stable
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkLimit, getPlanLimits } from "@/config/pricing";
import { toast } from "sonner";

interface SubscriptionState {
  plan: string;
  status: string;
  limits: {
    properties: number;
    claims: number;
    aiRequests: number;
    storage: number;
    users: number;
  };
  usage: {
    properties: number;
    claims: number;
    aiRequests: number;
    storage: number;
    users: number;
  };
  loading: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    status: "active",
    limits: getPlanLimits("free"),
    usage: {
      properties: 0,
      claims: 0,
      aiRequests: 0,
      storage: 0,
      users: 1,
    },
    loading: true,
  });

  const supabase = createClient();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Get user profile with subscription info
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_status")
        .eq("id", user.id)
        .single();

      if (profile) {
        const plan = profile.subscription_plan || "free";

        // Get usage data
        const [properties, claims, aiUsage] = await Promise.all([
          supabase
            .from("properties")
            .select("id", { count: "exact" })
            .eq("user_id", user.id),
          supabase
            .from("claims")
            .select("id", { count: "exact" })
            .eq("user_id", user.id)
            .gte(
              "created_at",
              new Date(new Date().getFullYear(), 0, 1).toISOString(),
            ),
          supabase
            .from("ai_usage_logs")
            .select("token_count")
            .eq("user_id", user.id)
            .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
        ]);

        const totalAiRequests =
          aiUsage.data?.reduce((sum, log) => sum + (log.token_count || 0), 0) ||
          0;

        setState({
          plan,
          status: profile.subscription_status || "active",
          limits: getPlanLimits(plan),
          usage: {
            properties: properties.count || 0,
            claims: claims.count || 0,
            aiRequests: Math.ceil(totalAiRequests / 1000), // Convert tokens to requests estimate
            storage: 0, // TODO: Calculate actual storage usage
            users: 1,
          },
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const checkFeatureAccess = (
    resource: keyof SubscriptionState["limits"],
    increment: number = 1,
  ): { allowed: boolean; message?: string } => {
    const check = checkLimit(
      state.plan,
      resource,
      state.usage[resource] + increment,
    );

    if (!check.allowed) {
      const message =
        check.limit === -1
          ? `You've reached the limit for ${resource} on your current plan`
          : `You've reached the limit of ${check.limit} ${resource} on your ${state.plan} plan`;

      return { allowed: false, message };
    }

    return { allowed: true };
  };

  const requirePlan = (requiredPlan: string): boolean => {
    const planHierarchy = ["free", "homeowner", "landlord", "enterprise"];
    const currentIndex = planHierarchy.indexOf(state.plan);
    const requiredIndex = planHierarchy.indexOf(requiredPlan);

    if (currentIndex < requiredIndex) {
      toast.error(`This feature requires the ${requiredPlan} plan or higher`);
      return false;
    }

    return true;
  };

  return {
    ...state,
    checkFeatureAccess,
    requirePlan,
    refresh: loadSubscriptionData,
  };
}
