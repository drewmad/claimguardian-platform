/**
 * @fileMetadata
 * @purpose "TypeScript types for legal compliance and consent tracking"
 * @dependencies []
 * @owner legal-team
 * @status stable
 */

export type LegalDocumentType =
  | "privacy_policy"
  | "terms_of_service"
  | "ai_use_agreement"
  | "cookie_policy"
  | "data_processing_agreement";

export type ConsentActionType =
  | "accepted"
  | "declined"
  | "withdrawn"
  | "updated";

export type ConsentMethod = "signup" | "settings" | "prompted" | "auto_update";

export type ConsentFlow = "standard" | "gdpr" | "ccpa";

export type DeviceType = "mobile" | "tablet" | "desktop";

export type LogoutReason = "user" | "timeout" | "admin" | "security";

export interface Geolocation {
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
}

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  effective_date: string;
  created_at: string;
  created_by?: string;
  is_active: boolean;
  requires_acceptance: boolean;
  parent_version_id?: string;
  change_summary?: string;
  storage_url?: string;
  sha256_hash: string;
  metadata?: Record<string, any>;
}

export interface UserConsent {
  id: string;
  user_id: string;
  document_id: string;
  action: ConsentActionType;
  consented_at: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  geolocation?: Geolocation;
  session_id?: string;
  consent_method: ConsentMethod;
  is_current: boolean;
  metadata?: Record<string, any>;
  referrer_url?: string;
  page_url?: string;
  consent_flow?: ConsentFlow;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  geolocation?: Geolocation;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  logout_at?: string;
  logout_reason?: LogoutReason;
  risk_score: number;
  metadata?: Record<string, any>;
}

export interface ConsentAuditLog {
  id: string;
  user_id: string;
  action: string;
  document_type?: LegalDocumentType;
  document_version?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name?: string;
  device_type?: DeviceType;
  operating_system?: string;
  browser?: string;
  first_seen: string;
  last_seen: string;
  is_trusted: boolean;
  is_blocked: boolean;
  metadata?: Record<string, any>;
}

export interface ConsentStatus {
  document_type: LegalDocumentType;
  is_accepted: boolean;
  accepted_version?: string;
  accepted_at?: string;
  needs_update: boolean;
}

export interface SignupData {
  // Basic info
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Legal consents
  acceptedDocuments: string[]; // Array of document IDs

  // Device tracking data
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  screenResolution?: string;

  // Location data
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };

  // Attribution data
  referrer?: string;
  landingPage?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  // Consent flags
  gdprConsent?: boolean;
  marketingConsent?: boolean;
  dataProcessingConsent?: boolean;
  aiProcessingConsent?: boolean;
}

export interface EnhancedProfile {
  // Existing profile fields...
  user_id: string;
  created_at: string;
  updated_at: string;

  // New compliance fields
  signup_ip_address?: string;
  signup_user_agent?: string;
  signup_device_fingerprint?: string;
  signup_geolocation?: Geolocation;
  signup_referrer?: string;
  signup_utm_params?: Record<string, string>;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  data_processing_consent: boolean;
  last_consent_update?: string;
  consent_ip_history: Array<{
    ip: string;
    timestamp: string;
  }>;
}
