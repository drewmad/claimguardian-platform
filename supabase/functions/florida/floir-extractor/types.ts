export enum FliorDataType {
  CATASTROPHE = "catastrophe",
  INDUSTRY_REPORTS = "industry_reports",
  PROFESSIONAL_LIABILITY = "professional_liability",
  DATA_CALL = "data_call",
  LICENSEE_SEARCH = "licensee_search",
  RATE_FILINGS = "rate_filings",
  RECEIVERSHIP = "receivership",
  FINANCIAL_REPORTS = "financial_reports",
  NEWS_BULLETINS = "news_bulletins",
  SURPLUS_LINES = "surplus_lines",
}

export interface CrawlRequest {
  data_type: FliorDataType;
  query?: Record<string, any>;
  force_refresh?: boolean;
}

export interface CrawlResponse {
  success: boolean;
  data_type: FliorDataType;
  records_processed: number;
  records_created: number;
  records_updated: number;
  errors?: Array<{
    record_id?: string;
    record_data?: any;
    error: string;
    details: string;
  }>;
  crawl_run_id: string;
}

export interface ParsedRecord {
  primary_key: string;
  normalized: Record<string, any>;
  source_url?: string;
  pdf_content?: string;
  content_for_embedding?: string;
}

export interface RateLimiter {
  domain: string;
  requestsPerSecond: number;
  lastRequestTime: number;
  queue: Array<() => Promise<any>>;
}

export interface SiteConfig {
  baseUrl: string;
  rateLimit: number; // requests per second
  requiresSession: boolean;
  antiBot: {
    userAgent: string;
    headers: Record<string, string>;
    delays: {
      min: number;
      max: number;
    };
  };
}

export interface FieldMapping {
  [key: string]: {
    selector?: string;
    attribute?: string;
    regex?: string;
    json_key?: string;
    transform?: (value: string) => any;
  };
}

export type FliorPortalConfig = Record<
  FliorDataType,
  {
    site: SiteConfig;
    endpoints: {
      main: string;
      search?: string;
      results?: string;
    };
    fieldMapping: FieldMapping;
    pagination?: {
      type: "query" | "form" | "json";
      params: Record<string, any>;
    };
  }
>;
