/**
 * @fileMetadata
 * @owner frontend-team
 * @purpose "React hooks for permission checking and management"
 * @dependencies ["react", "swr"]
 * @status stable
 */

"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  getCurrentUserPermissions,
  checkUserPermission,
  getCurrentUserSubscription,
} from "@/actions/permissions";
import type { UserPermission, UserSubscription } from "@/types/permissions";

// Hook to get all user permissions
export function useUserPermissions() {
  const { data, error, isLoading, mutate } = useSWR(
    "user-permissions",
    async () => {
      const result = await getCurrentUserPermissions();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    permissions: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook to check a specific permission
export function usePermission(permissionName: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      setIsLoading(true);
      try {
        const result = await checkUserPermission(permissionName);
        setHasPermission(result);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [permissionName]);

  return { hasPermission, isLoading };
}

// Hook to check multiple permissions
export function usePermissions(permissionNames: string[]) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      setIsLoading(true);
      try {
        const results: Record<string, boolean> = {};

        // Check all permissions in parallel
        await Promise.all(
          permissionNames.map(async (name) => {
            results[name] = await checkUserPermission(name);
          }),
        );

        setPermissions(results);
      } catch (error) {
        console.error("Error checking permissions:", error);
        // Set all to false on error
        const results: Record<string, boolean> = {};
        permissionNames.forEach((name) => {
          results[name] = false;
        });
        setPermissions(results);
      } finally {
        setIsLoading(false);
      }
    }

    if (permissionNames.length > 0) {
      checkPermissions();
    }
  }, [JSON.stringify(permissionNames)]); // Use JSON.stringify to avoid infinite loops

  return { permissions, isLoading };
}

// Hook to get user's subscription
export function useUserSubscription() {
  const { data, error, isLoading, mutate } = useSWR(
    "user-subscription",
    async () => {
      const result = await getCurrentUserSubscription();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    subscription: data,
    tier: data?.tier,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook to check if user has any of the specified permissions
export function useHasAnyPermission(permissionNames: string[]) {
  const { permissions, isLoading } = usePermissions(permissionNames);

  const hasAny = Object.values(permissions).some(
    (hasPermission) => hasPermission,
  );

  return { hasAnyPermission: hasAny, isLoading };
}

// Hook to check if user has all of the specified permissions
export function useHasAllPermissions(permissionNames: string[]) {
  const { permissions, isLoading } = usePermissions(permissionNames);

  const hasAll =
    permissionNames.length > 0 &&
    permissionNames.every((name) => permissions[name] === true);

  return { hasAllPermissions: hasAll, isLoading };
}

// Hook to get permission limits
export function usePermissionLimit(permissionName: string) {
  const { permissions } = useUserPermissions();

  const permission = permissions.find(
    (p: UserPermission) => p.permission_name === permissionName,
  );

  return {
    limit: permission?.limit_value || null,
    metadata: permission?.metadata || {},
  };
}
