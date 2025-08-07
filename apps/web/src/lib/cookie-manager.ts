/**
 * Cookie Manager - Central control for all cookie operations
 * Ensures GDPR/CCPA compliance and proper consent handling
 */

export type CookieConsent = 'accepted' | 'necessary-only' | null;

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

class CookieManager {
  private static instance: CookieManager;
  private consentKey = 'cookie-consent';
  private consentDateKey = 'cookie-consent-date';
  private preferencesKey = 'cookie-preferences';
  
  private constructor() {}
  
  static getInstance(): CookieManager {
    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager();
    }
    return CookieManager.instance;
  }
  
  /**
   * Get current consent status
   */
  getConsent(): CookieConsent {
    if (typeof window === 'undefined') return null;
    const consent = localStorage.getItem(this.consentKey);
    return consent as CookieConsent;
  }
  
  /**
   * Get detailed cookie preferences
   */
  getPreferences(): CookiePreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }
    
    const stored = localStorage.getItem(this.preferencesKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // If we have old-style consent, migrate it
    const consent = this.getConsent();
    if (consent === 'accepted') {
      return {
        necessary: true,
        analytics: true,
        marketing: true,
        personalization: true
      };
    } else if (consent === 'necessary-only') {
      return {
        necessary: true,
        analytics: false,
        marketing: false,
        personalization: false
      };
    }
    
    return this.getDefaultPreferences();
  }
  
  /**
   * Set consent and preferences
   */
  setConsent(consent: 'accepted' | 'necessary-only', preferences?: CookiePreferences) {
    if (typeof window === 'undefined') return;
    
    // Store consent
    localStorage.setItem(this.consentKey, consent);
    localStorage.setItem(this.consentDateKey, new Date().toISOString());
    
    // Store preferences
    const prefs = preferences || (consent === 'accepted' 
      ? {
          necessary: true,
          analytics: true,
          marketing: true,
          personalization: true
        }
      : {
          necessary: true,
          analytics: false,
          marketing: false,
          personalization: false
        });
    
    localStorage.setItem(this.preferencesKey, JSON.stringify(prefs));
    
    // Apply preferences
    this.applyPreferences(prefs);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { 
      detail: { consent, preferences: prefs } 
    }));
  }
  
  /**
   * Check if a specific cookie type is allowed
   */
  isAllowed(type: keyof CookiePreferences): boolean {
    const prefs = this.getPreferences();
    return prefs[type] === true;
  }
  
  /**
   * Apply cookie preferences (enable/disable tracking)
   */
  private applyPreferences(prefs: CookiePreferences) {
    if (typeof window === 'undefined') return;
    
    // Google Analytics
    if (prefs.analytics && typeof window.gtag !== 'undefined') {
      // Enable GA
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else if (typeof window.gtag !== 'undefined') {
      // Disable GA
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
    
    // Marketing cookies
    if (prefs.marketing && typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    } else if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
    
    // PostHog Analytics
    if (prefs.analytics && typeof window.posthog !== 'undefined') {
      window.posthog.opt_in_capturing();
    } else if (typeof window.posthog !== 'undefined') {
      window.posthog.opt_out_capturing();
    }
    
    // Sentry error tracking (considered necessary but respecting user choice)
    if (prefs.analytics && window.Sentry) {
      // Sentry is usually necessary for error tracking but we respect user choice
      const client = (window.Sentry as any).getCurrentHub?.()?.getClient?.();
      if (client && client.getOptions) {
        client.getOptions().enabled = true;
      }
    } else if (window.Sentry) {
      const client = (window.Sentry as any).getCurrentHub?.()?.getClient?.();
      if (client && client.getOptions) {
        client.getOptions().enabled = false;
      }
    }
  }
  
  /**
   * Clear all cookies (except necessary)
   */
  clearNonEssentialCookies() {
    if (typeof window === 'undefined') return;
    
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // List of essential cookies to keep
    const essentialCookies = [
      'cookie-consent',
      'cookie-preferences',
      'sb-', // Supabase auth cookies
      'csrf',
      'session'
    ];
    
    // Clear non-essential cookies
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Check if this is an essential cookie
      const isEssential = essentialCookies.some(essential => 
        name.startsWith(essential)
      );
      
      if (!isEssential) {
        // Clear the cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      }
    });
  }
  
  /**
   * Get default preferences (necessary only)
   */
  private getDefaultPreferences(): CookiePreferences {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false
    };
  }
  
  /**
   * Check if consent is required (for GDPR regions)
   */
  isConsentRequired(): boolean {
    // You could implement geo-detection here
    // For now, always require consent to be safe
    return true;
  }
  
  /**
   * Get consent age in days
   */
  getConsentAge(): number | null {
    if (typeof window === 'undefined') return null;
    
    const dateStr = localStorage.getItem(this.consentDateKey);
    if (!dateStr) return null;
    
    const consentDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - consentDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Check if consent needs renewal (older than 365 days)
   */
  needsRenewal(): boolean {
    const age = this.getConsentAge();
    return age !== null && age > 365;
  }
}

// Export singleton instance
export const cookieManager = CookieManager.getInstance();

// Global type declarations for third-party scripts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    posthog?: any;
    // Sentry type is declared at the top of this file
  }
}