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
import { useState, useEffect, useCallback } from "react";

interface MobileConfig {
  breakpoint?: number;
  checkOrientation?: boolean;
}

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  deviceType: "mobile" | "tablet" | "desktop";
}

const DEFAULT_CONFIG: MobileConfig = {
  breakpoint: 768,
  checkOrientation: true,
};

export function useMobile(config: MobileConfig = DEFAULT_CONFIG) {
  const { breakpoint = 768, checkOrientation = true } = config;

  const getDeviceInfo = useCallback((): MobileState => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: true,
        isLandscape: false,
        width: 1920,
        height: 1080,
        deviceType: "desktop",
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < breakpoint;
    const isTablet = width >= breakpoint && width < 1024;
    const isDesktop = width >= 1024;
    const isPortrait = height > width;
    const isLandscape = width > height;

    let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
    if (isMobile) deviceType = "mobile";
    else if (isTablet) deviceType = "tablet";

    return {
      isMobile,
      isTablet,
      isDesktop,
      isPortrait: checkOrientation ? isPortrait : true,
      isLandscape: checkOrientation ? isLandscape : false,
      width,
      height,
      deviceType,
    };
  }, [breakpoint, checkOrientation]);

  const [state, setState] = useState<MobileState>(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setState(getDeviceInfo());
    };

    // Initial check
    handleResize();

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [getDeviceInfo]);

  return state;
}

// Hook for touch detection
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          // @ts-expect-error - msMaxTouchPoints is legacy IE property
          navigator.msMaxTouchPoints > 0,
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

// Hook for safe area insets (for notched devices)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue("--sat") || "0"),
        right: parseInt(computedStyle.getPropertyValue("--sar") || "0"),
        bottom: parseInt(computedStyle.getPropertyValue("--sab") || "0"),
        left: parseInt(computedStyle.getPropertyValue("--sal") || "0"),
      });
    };

    // Set CSS variables for safe areas
    const root = document.documentElement;
    root.style.setProperty("--sat", "env(safe-area-inset-top)");
    root.style.setProperty("--sar", "env(safe-area-inset-right)");
    root.style.setProperty("--sab", "env(safe-area-inset-bottom)");
    root.style.setProperty("--sal", "env(safe-area-inset-left)");

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);

    return () => {
      window.removeEventListener("resize", updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Hook for viewport height (handles mobile browser chrome)
export function useViewportHeight() {
  const [height, setHeight] = useState("100vh");

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      setHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return height;
}
