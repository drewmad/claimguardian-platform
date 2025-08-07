/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Type definitions for admin dashboard components"
 * @dependencies ["react", "recharts"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */

// State expansion types
export interface StateData {
  code: string;
  name: string;
  region: "Northeast" | "Southeast" | "Midwest" | "Southwest" | "West";
  population: number;
  marketSize: number;
  status: "planning" | "development" | "testing" | "staging" | "production";
}

export interface RegionData {
  region: string;
  states: number;
  population: number;
  marketSize: number;
  color: string;
}

export interface ExpansionOpportunityData {
  name: string;
  code: string;
  marketSize: number;
  population: number;
  priority: number;
  readiness: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  forecast?: number;
  [key: string]: string | number | undefined;
}

export interface MetricValue {
  mean: number;
  percentile99: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface TooltipFormatterValue {
  value: number | string;
  name?: string;
  color?: string;
}

export type TooltipFormatter = (
  value: number | string,
  name?: string,
  props?: unknown,
) => [string, string];

// Time series types
export interface TimeSeriesMetric {
  name: string;
  data: ChartDataPoint[];
  color: string;
}

// Recharts tooltip types
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}
