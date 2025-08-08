/**
 * @fileMetadata
 * @purpose "Optimized image component with next/image integration and performance monitoring"
 * @dependencies ["next/image", "lucide-react"]
 * @exports ["OptimizedImage", "PropertyImage", "AvatarImage"]
 * @owner performance-team
 * @status stable
 */

"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  loading?: "lazy" | "eager";
}

interface PropertyImageProps
  extends Omit<OptimizedImageProps, "width" | "height"> {
  propertyType?: string;
  location?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
  size?: "sm" | "md" | "lg" | "xl";
}

interface AvatarImageProps
  extends Omit<OptimizedImageProps, "width" | "height" | "fill"> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallbackInitials?: string;
}

// Size mappings for consistent sizing
const PROPERTY_SIZES = {
  sm: { width: 200, height: 150 },
  md: { width: 320, height: 240 },
  lg: { width: 480, height: 360 },
  xl: { width: 640, height: 480 },
} as const;

const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

// Performance monitoring for images
const trackImagePerformance = (
  src: string,
  loadTime: number,
  success: boolean,
) => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    console.log(
      `[Image Performance] ${src} - ${success ? "loaded" : "failed"} in ${loadTime}ms`,
    );

    // Send to analytics
    window.gtag?.("event", "image_performance", {
      custom_map: {
        dimension1: src,
        dimension2: success ? "success" : "error",
        metric1: loadTime,
      },
    });
  }
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  fill = false,
  sizes,
  onLoad,
  onError,
  fallbackSrc,
  loading = "lazy",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loadStartTime] = useState(Date.now());

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    const loadTime = Date.now() - loadStartTime;
    trackImagePerformance(currentSrc, loadTime, true);
    onLoad?.();
  }, [currentSrc, loadStartTime, onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    const loadTime = Date.now() - loadStartTime;
    trackImagePerformance(currentSrc, loadTime, false);

    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  }, [currentSrc, fallbackSrc, loadStartTime, onError]);

  // Error state
  if (hasError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-800 border border-gray-700 rounded",
          className,
        )}
        style={{ width, height }}
      >
        <ImageOff className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div
      className={cn("relative", className)}
      style={fill ? undefined : { width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 border border-gray-700 rounded z-10">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        loading={priority ? undefined : loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        {...props}
      />
    </div>
  );
}

export function PropertyImage({
  src,
  alt,
  propertyType,
  location,
  aspectRatio = "landscape",
  size = "md",
  className,
  ...props
}: PropertyImageProps) {
  const dimensions = PROPERTY_SIZES[size];

  // Adjust dimensions based on aspect ratio
  let width: number = dimensions.width;
  let height: number = dimensions.height;
  if (aspectRatio === "square") {
    height = width;
  } else if (aspectRatio === "portrait") {
    const temp = width;
    width = height;
    height = temp;
  }

  // Generate responsive sizes
  const sizes = `(max-width: 640px) ${Math.floor(width * 0.8)}px, (max-width: 1024px) ${width}px, ${Math.floor(width * 1.2)}px`;

  // Generate blur placeholder based on property type
  const blurDataURL = generatePropertyBlurData(propertyType);

  // Fallback image based on property type
  const fallbackSrc = `/images/property-fallbacks/${propertyType || "default"}.jpg`;

  return (
    <OptimizedImage
      src={src}
      alt={
        alt ||
        `${propertyType || "Property"} ${location ? `in ${location}` : ""}`
      }
      width={width}
      height={height}
      className={cn("rounded-lg overflow-hidden", className)}
      placeholder="blur"
      blurDataURL={blurDataURL}
      sizes={sizes}
      fallbackSrc={fallbackSrc}
      quality={80}
      {...props}
    />
  );
}

export function AvatarImage({
  src,
  alt,
  size = "md",
  className,
  fallbackInitials,
  ...props
}: AvatarImageProps) {
  const dimensions = AVATAR_SIZES[size];

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={dimensions}
        height={dimensions}
        className="rounded-full"
        quality={90}
        {...props}
      />

      {/* Fallback initials if image fails */}
      {fallbackInitials && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-600 text-white rounded-full text-sm font-medium"
          style={{
            width: dimensions,
            height: dimensions,
            fontSize: Math.max(dimensions / 3, 10),
          }}
        >
          {fallbackInitials}
        </div>
      )}
    </div>
  );
}

// Helper function to generate blur data URLs
function generatePropertyBlurData(propertyType?: string): string {
  const colors = {
    single_family: "#1e40af", // blue
    townhouse: "#059669", // green
    condo: "#dc2626", // red
    multi_family: "#7c3aed", // purple
    commercial: "#ea580c", // orange
    land: "#16a34a", // green
    default: "#374151", // gray
  };

  const color = colors[propertyType as keyof typeof colors] || colors.default;

  // Generate a simple blur placeholder
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="40" height="30" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="30" fill="${color}" opacity="0.5"/>
    </svg>`,
  )}`;
}

// Performance utilities
export const preloadImage = (src: string, priority = false) => {
  if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = priority ? "preload" : "prefetch";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  }
};

export const preloadImages = (srcs: string[], priority = false) => {
  srcs.forEach((src) => preloadImage(src, priority));
};

// Image format detection utility
export const getOptimalImageFormat = () => {
  if (typeof window === "undefined") return "webp";

  // Check for AVIF support
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  if (canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0) {
    return "avif";
  }

  // Check for WebP support
  if (canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0) {
    return "webp";
  }

  return "jpeg";
};

// Lazy loading intersection observer utility
export const createImageObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
) => {
  if (typeof window === "undefined") return null;

  return new IntersectionObserver(callback, {
    rootMargin: "50px 0px",
    threshold: 0.01,
  });
};
