/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Lazy loading image component with blur-up effect"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  blurDataUrl?: string;
  aspectRatio?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: () => void;
  showLoader?: boolean;
  threshold?: number;
}

export function LazyImage({
  src,
  alt,
  fallbackSrc = "/placeholder.jpg",
  blurDataUrl,
  aspectRatio,
  objectFit = "cover",
  onLoad,
  onError,
  showLoader = true,
  threshold = 0.1,
  className,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(blurDataUrl || "");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "50px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    img.src = src;
  }, [isInView, src, fallbackSrc, onLoad, onError]);

  const containerStyle: React.CSSProperties = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : {};

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-gray-800", className)}
      style={
        aspectRatio
          ? {
              position: "relative",
              width: "100%",
              height: 0,
              ...containerStyle,
            }
          : {}
      }
    >
      {/* Blur placeholder */}
      {blurDataUrl && isLoading && (
        <img
          src={blurDataUrl}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full",
            `object-${objectFit}`,
            "filter blur-xl scale-110",
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            aspectRatio ? "absolute inset-0 w-full h-full" : "",
            `object-${objectFit}`,
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {showLoader && isLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <ImageOff className="w-8 h-8 text-gray-600 mb-2" />
          <p className="text-xs text-gray-500">Failed to load image</p>
        </div>
      )}
    </div>
  );
}

// Image gallery with lazy loading
interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function LazyImageGallery({
  images,
  columns = 3,
  gap = 4,
  className,
}: LazyImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <>
      <div
        className={cn("grid", `grid-cols-${columns}`, `gap-${gap}`, className)}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: `${gap * 0.25}rem`,
        }}
      >
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className="relative group cursor-pointer overflow-hidden rounded-lg"
          >
            <LazyImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              aspectRatio={1}
              className="w-full h-full transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <LazyImage
            src={images[selectedImage].src}
            alt={images[selectedImage].alt}
            className="max-w-full max-h-full"
            objectFit="contain"
          />
        </div>
      )}
    </>
  );
}

// Optimized property image with lazy loading
export function LazyPropertyImage({
  src,
  propertyName,
  size = "medium",
  className,
}: {
  src?: string;
  propertyName: string;
  size?: "small" | "medium" | "large" | "full";
  className?: string;
}) {
  const sizes = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-64 h-64",
    full: "w-full h-full",
  };

  return (
    <LazyImage
      src={
        src ||
        `/api/placeholder/400/300?text=${encodeURIComponent(propertyName)}`
      }
      alt={propertyName}
      className={cn(sizes[size], className)}
      fallbackSrc={`/api/placeholder/400/300?text=${encodeURIComponent(propertyName)}`}
      aspectRatio={size === "full" ? 16 / 9 : 1}
    />
  );
}

// Next.js Image component wrapper with lazy loading
import { X } from "lucide-react";

export function NextLazyImage({
  src,
  alt,
  priority = false,
  ...props
}: {
  src: string;
  alt: string;
  priority?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (typeof window !== "undefined" && "next" in window) {
    // Use Next.js Image component if available
    const NextImage = require("next/image").default;
    return (
      <NextImage
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k="
        {...props}
      />
    );
  }

  // Fallback to regular lazy image
  return <LazyImage src={src} alt={alt} {...props} />;
}
