/**
 * @fileMetadata
 * @owner @platform-team
 * @purpose "Client-side error tracking integration with automatic error capture and reporting"
 * @dependencies ["@/lib/error-tracking/error-tracker"]
 * @status stable
 */

"use client";

import React from "react";
import { errorTracker } from "./error-tracker";

interface ClientErrorConfig {
  enabled?: boolean;
  dsn?: string;
  environment?: string;
  debug?: boolean;
  sampleRate?: number;
  ignoreUrls?: Array<string | RegExp>;
  beforeSend?: (error: any) => any;
  onError?: (error: any) => void;
}

class ClientErrorIntegration {
  private config: Required<ClientErrorConfig>;
  private initialized = false;

  constructor(config: ClientErrorConfig = {}) {
    this.config = {
      enabled: true,
      dsn: "/api/errors",
      environment: process.env.NODE_ENV || "development",
      debug: false,
      sampleRate: 1.0,
      ignoreUrls: [],
      beforeSend: (error) => error,
      onError: () => {},
      ...config,
    };
  }

  /**
   * Initialize client-side error tracking
   */
  init(): void {
    if (!this.config.enabled || this.initialized || typeof window === "undefined") {
      return;
    }

    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupConsoleErrorCapture();
    this.setupNetworkErrorCapture();
    this.setupReactErrorBoundaryIntegration();

    this.initialized = true;

    if (this.config.debug) {
      console.log("[ClaimGuardian Error Tracking] Initialized", {
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
      });
    }
  }

  /**
   * Manually capture an error
   */
  async captureError(error: Error | string, context?: Record<string, any>): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const errorObj = typeof error === "string" ? new Error(error) : error;
      const enhancedContext = this.buildContext(context);

      await this.sendError({
        action: "capture_error",
        type: "javascript",
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
        context: enhancedContext,
      });
    } catch (err) {
      this.handleInternalError("Failed to capture manual error", err);
    }
  }

  /**
   * Capture exception with additional context
   */
  async captureException(error: Error, context?: {
    tags?: string[];
    extra?: Record<string, any>;
    level?: "low" | "medium" | "high" | "critical";
    fingerprint?: string;
  }): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const enhancedContext = this.buildContext(context?.extra);

      await this.sendError({
        action: "capture_error",
        type: "javascript",
        name: error.name,
        message: error.message,
        stack: error.stack,
        severity: context?.level || "medium",
        tags: context?.tags || [],
        context: enhancedContext,
        metadata: {
          fingerprint: context?.fingerprint,
          ...context?.extra,
        },
      });
    } catch (err) {
      this.handleInternalError("Failed to capture exception", err);
    }
  }

  /**
   * Capture API error
   */
  async captureAPIError(error: Error, request: {
    url: string;
    method: string;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<void> {
    if (!this.config.enabled) return;

    try {
      await this.sendError({
        action: "capture_api_error",
        error: { message: error.message, name: error.name },
        requestData: {
          url: request.url,
          method: request.method,
          response: request.status ? {
            status: request.status,
            statusText: request.statusText || "",
          } : undefined,
          headers: request.headers,
          body: request.body,
        },
      });
    } catch (err) {
      this.handleInternalError("Failed to capture API error", err);
    }
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: "navigation" | "user" | "http" | "console" | "auth";
    level?: "info" | "warning" | "error";
    data?: Record<string, any>;
  }): void {
    if (!this.config.enabled) return;

    // Add locally to the error tracker
    errorTracker.addBreadcrumb({
      category: breadcrumb.category || "user",
      message: breadcrumb.message,
      level: breadcrumb.level || "info",
      data: breadcrumb.data,
    });

    // Also send to server for immediate storage
    this.sendError({
      action: "add_breadcrumb",
      category: breadcrumb.category || "user",
      breadcrumbMessage: breadcrumb.message,
      level: breadcrumb.level || "info",
      breadcrumbData: breadcrumb.data,
    }).catch(err => {
      this.handleInternalError("Failed to add breadcrumb", err);
    });
  }

  /**
   * Set user context
   */
  setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }): void {
    if (typeof window !== "undefined") {
      (window as any).__claimguardian_user = user;
    }
  }

  /**
   * Set extra context
   */
  setContext(key: string, value: any): void {
    if (typeof window !== "undefined") {
      (window as any).__claimguardian_context = (window as any).__claimguardian_context || {};
      (window as any).__claimguardian_context[key] = value;
    }
  }

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void {
    if (typeof window !== "undefined") {
      (window as any).__claimguardian_tags = {
        ...(window as any).__claimguardian_tags,
        ...tags,
      };
    }
  }

  // Private methods
  private setupGlobalErrorHandlers(): void {
    window.addEventListener("error", (event) => {
      if (!this.shouldCaptureError(event.filename || "")) return;

      this.sendError({
        action: "capture_error",
        type: "javascript",
        name: event.error?.name || "Error",
        message: event.message,
        stack: event.error?.stack,
        source: {
          file: event.filename,
          line: event.lineno,
          column: event.colno,
        },
        context: this.buildContext(),
      }).catch(err => {
        this.handleInternalError("Failed to send global error", err);
      });
    });
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener("unhandledrejection", (event) => {
      const error = event.reason;
      
      this.sendError({
        action: "capture_error",
        type: "javascript",
        name: "UnhandledPromiseRejection",
        message: error?.message || String(error),
        stack: error?.stack,
        severity: "high",
        context: this.buildContext(),
      }).catch(err => {
        this.handleInternalError("Failed to send unhandled rejection", err);
      });
    });
  }

  private setupConsoleErrorCapture(): void {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Call original first
      originalConsoleError.apply(console, args);
      
      // Then capture for tracking
      const message = args.map(arg => 
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");

      this.sendError({
        action: "capture_error",
        type: "javascript",
        name: "ConsoleError",
        message: `Console Error: ${message}`,
        severity: "low",
        context: this.buildContext(),
      }).catch(err => {
        // Don't use console.error here to avoid infinite loop
        originalConsoleError("Failed to capture console error:", err);
      });
    };
  }

  private setupNetworkErrorCapture(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        
        // Log successful requests as breadcrumbs
        this.addBreadcrumb({
          category: "http",
          message: `${options?.method || "GET"} ${typeof url === "string" ? url : url instanceof Request ? url.url : url.href} ${response.status}`,
          level: response.ok ? "info" : "error",
          data: {
            url: typeof url === "string" ? url : url instanceof Request ? url.url : url.href,
            method: options?.method || "GET",
            status: response.status,
            duration: Date.now() - startTime,
          },
        });

        // Capture 4xx/5xx responses as errors
        if (!response.ok && response.status >= 400) {
          await this.captureAPIError(
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            {
              url: typeof url === "string" ? url : url instanceof Request ? url.url : url.href,
              method: options?.method || "GET",
              status: response.status,
              statusText: response.statusText,
              headers: options?.headers as Record<string, string>,
              body: options?.body,
            }
          );
        }
        
        return response;
      } catch (error) {
        // Capture network errors
        await this.captureAPIError(
          error instanceof Error ? error : new Error(String(error)),
          {
            url: typeof url === "string" ? url : url instanceof Request ? url.url : url.href,
            method: options?.method || "GET",
            headers: options?.headers as Record<string, string>,
            body: options?.body,
          }
        );
        
        throw error;
      }
    };
  }

  private setupReactErrorBoundaryIntegration(): void {
    // Listen for React error boundary events
    window.addEventListener("react-error-boundary", ((event: CustomEvent) => {
      const { error, errorInfo } = event.detail;
      
      this.sendError({
        action: "capture_error",
        type: "javascript",
        name: error?.name || "ReactError",
        message: error?.message || "React component error",
        stack: error?.stack,
        severity: "high",
        context: this.buildContext({
          componentStack: errorInfo?.componentStack,
        }),
        tags: ["react", "component-error"],
      }).catch(err => {
        this.handleInternalError("Failed to capture React error", err);
      });
    }) as EventListener);
  }

  private buildContext(extra?: Record<string, any>): Record<string, any> {
    if (typeof window === "undefined") return extra || {};

    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
      },
      user: (window as any).__claimguardian_user,
      context: (window as any).__claimguardian_context,
      tags: (window as any).__claimguardian_tags,
      ...extra,
    };
  }

  private shouldCaptureError(filename: string): boolean {
    if (Math.random() > this.config.sampleRate) {
      return false;
    }

    return !this.config.ignoreUrls.some(pattern => {
      if (typeof pattern === "string") {
        return filename.includes(pattern);
      }
      return pattern.test(filename);
    });
  }

  private async sendError(payload: any): Promise<void> {
    try {
      const processedPayload = this.config.beforeSend(payload);
      if (!processedPayload) return;

      const response = await fetch(this.config.dsn, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedPayload),
      });

      if (!response.ok && this.config.debug) {
        console.warn(`[ClaimGuardian Error Tracking] Failed to send error: ${response.status}`);
      }
    } catch (err) {
      this.handleInternalError("Failed to send error to server", err);
    }
  }

  private handleInternalError(message: string, error: any): void {
    if (this.config.debug) {
      console.error(`[ClaimGuardian Error Tracking] ${message}:`, error);
    }
    
    this.config.onError(error);
  }
}

// Export singleton instance
export const clientErrorIntegration = new ClientErrorIntegration();

// Auto-initialize if in browser environment
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      clientErrorIntegration.init();
    });
  } else {
    clientErrorIntegration.init();
  }
}

// React Error Boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Dispatch custom event for error tracking
      const event = new CustomEvent("react-error-boundary", {
        detail: { error, errorInfo },
      });
      window.dispatchEvent(event);

      // Also capture directly
      clientErrorIntegration.captureException(error, {
        level: "high",
        tags: ["react", "error-boundary"],
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="flex items-center justify-center min-h-[200px] bg-gray-900 text-white">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-4">
                We've been notified and are working to fix this issue.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

// Hook for manual error tracking in React components
export function useErrorTracking() {
  return {
    captureError: clientErrorIntegration.captureError.bind(clientErrorIntegration),
    captureException: clientErrorIntegration.captureException.bind(clientErrorIntegration),
    addBreadcrumb: clientErrorIntegration.addBreadcrumb.bind(clientErrorIntegration),
    setUser: clientErrorIntegration.setUser.bind(clientErrorIntegration),
    setContext: clientErrorIntegration.setContext.bind(clientErrorIntegration),
    setTags: clientErrorIntegration.setTags.bind(clientErrorIntegration),
  };
}

// Export the class for custom configurations
export { ClientErrorIntegration };