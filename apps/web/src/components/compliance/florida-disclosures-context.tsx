/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

import { FloridaDisclosuresModal } from "./florida-disclosures-modal";

interface FloridaDisclosuresContextType {
  showDisclosures: (userId: string) => void;
  hasSeenDisclosures: boolean;
}

const FloridaDisclosuresContext = createContext<
  FloridaDisclosuresContextType | undefined
>(undefined);

export function FloridaDisclosuresProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSeenDisclosures, setHasSeenDisclosures] = useState(false);

  const showDisclosures = (userId: string) => {
    setUserId(userId);
    setIsOpen(true);
  };

  const handleAccept = () => {
    setIsOpen(false);
    setHasSeenDisclosures(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <FloridaDisclosuresContext.Provider
      value={{ showDisclosures, hasSeenDisclosures }}
    >
      {children}
      {userId && (
        <FloridaDisclosuresModal
          open={isOpen}
          onAccept={handleAccept}
          onCancel={handleCancel}
          userId={userId}
        />
      )}
    </FloridaDisclosuresContext.Provider>
  );
}

export function useFloridaDisclosures() {
  const context = useContext(FloridaDisclosuresContext);
  if (!context) {
    throw new Error(
      "useFloridaDisclosures must be used within FloridaDisclosuresProvider",
    );
  }
  return context;
}
