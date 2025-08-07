/**
 * @fileMetadata
 * @purpose "Tests for real-time subscription React hook"
 * @owner realtime-team
 * @dependencies ["vitest", "@testing-library/react", "@claimguardian/db"]
 * @exports []
 * @complexity low
 * @tags ["test", "realtime", "hooks", "react"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T21:00:00Z
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRealtimeSubscription } from "../hooks";

// Mock RealtimeClient to avoid complex setup
vi.mock("../client", () => ({
  RealtimeClient: vi.fn().mockImplementation(() => ({
    subscribeToTable: vi.fn(() => ({
      unsubscribe: vi.fn(),
    })),
    setUserId: vi.fn(),
  })),
}));

const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
} as unknown as SupabaseClient;

describe("useRealtimeSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be an alias for useRealtimeTable", () => {
    const { result } = renderHook(() =>
      useRealtimeSubscription(mockSupabase, "claims", {
        onInsert: vi.fn(),
      }),
    );

    // Should return the same structure as useRealtimeTable
    expect(result.current).toHaveProperty("events");
    expect(result.current).toHaveProperty("isConnected");
    expect(result.current).toHaveProperty("clearEvents");
    expect(Array.isArray(result.current.events)).toBe(true);
    expect(typeof result.current.isConnected).toBe("boolean");
    expect(typeof result.current.clearEvents).toBe("function");
  });

  it("should accept optional parameters", () => {
    expect(() => {
      renderHook(() => useRealtimeSubscription(mockSupabase, "claims"));
    }).not.toThrow();
  });

  it("should handle callback options", () => {
    const onInsert = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    expect(() => {
      renderHook(() =>
        useRealtimeSubscription(mockSupabase, "claims", {
          onInsert,
          onUpdate,
          onDelete,
          enabled: true,
        }),
      );
    }).not.toThrow();
  });
});
