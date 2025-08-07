/**
 * @fileMetadata
 * @purpose "Server-side IP detection utility for secure, resilient tracking"
 * @dependencies ["@/lib","next"]
 * @owner security-team
 * @status stable
 */

import { headers } from "next/headers";

import { logger } from "@/lib/logger";

/**
 * Securely detect user IP address from server-side headers
 * Handles various proxy configurations and provides resilient fallbacks
 */
export async function getClientIPAddress(): Promise<string> {
  try {
    const headersList = await headers();

    // Priority order for IP detection (most reliable first)
    const ipSources = [
      // Cloudflare
      headersList.get("cf-connecting-ip"),
      // AWS ALB/ELB
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim(),
      // Standard proxy headers
      headersList.get("x-real-ip"),
      headersList.get("x-client-ip"),
      // Less common but sometimes used
      headersList.get("x-forwarded"),
      headersList.get("x-cluster-client-ip"),
      headersList.get("forwarded-for"),
      headersList.get("forwarded"),
    ];

    // Find first valid IP address
    for (const ip of ipSources) {
      if (ip && isValidIP(ip)) {
        logger.debug("Client IP detected", { ip, source: "headers" });
        return ip;
      }
    }

    // Fallback - this shouldn't happen in production with proper load balancer config
    logger.warn("No valid IP found in headers, using fallback", {
      headers: Object.fromEntries(
        Array.from(headersList.entries()).filter(
          ([key]) =>
            key.toLowerCase().includes("ip") ||
            key.toLowerCase().includes("forward"),
        ),
      ),
    });

    return "unknown";
  } catch (error) {
    logger.error("Failed to detect client IP", {}, error as Error);
    return "unknown";
  }
}

/**
 * Basic IP address validation
 */
function isValidIP(ip: string): boolean {
  if (!ip || ip === "unknown") return false;

  // Remove any port numbers
  const cleanIP = ip.split(":")[0];

  // IPv4 validation
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(cleanIP)) {
    return !isPrivateIP(cleanIP);
  }

  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(cleanIP)) {
    return true;
  }

  return false;
}

/**
 * Check if IP is private/internal (we want public IPs for geolocation)
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (localhost)
  if (parts[0] === 127) return true;

  return false;
}

/**
 * Enhanced tracking data collection with server-side IP detection
 */
export interface ServerTrackingData {
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  source: "server-headers" | "fallback";
}

/**
 * Collect server-side tracking data safely
 */
export async function collectServerTrackingData(): Promise<ServerTrackingData> {
  try {
    const headersList = await headers();
    const ipAddress = await getClientIPAddress();
    const userAgent = headersList.get("user-agent") || undefined;

    return {
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      source: ipAddress === "unknown" ? "fallback" : "server-headers",
    };
  } catch (error) {
    logger.error("Failed to collect server tracking data", {}, error as Error);

    return {
      ipAddress: "unknown",
      timestamp: new Date().toISOString(),
      source: "fallback",
    };
  }
}
