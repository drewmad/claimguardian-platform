/**
 * @fileMetadata
 * @purpose "Property image component with AI generation and fallbacks"
 * @owner frontend-team
 * @dependencies ["react", "next/image"]
 * @exports ["PropertyImage"]
 * @complexity medium
 * @tags ["property", "image", "ai-generated", "ui"]
 * @status stable
 */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger/production-logger";

import {
  getPropertyImage,
  getPropertyImageByType,
  PropertyImageStyle,
} from "@/lib/ai/image-generation";

interface PropertyImageProps {
  propertyId?: string;
  propertyType?: string;
  propertyName?: string;
  size?: string;
  location?: string;
  style?: PropertyImageStyle;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  generateAI?: boolean;
  fallbackEmoji?: string;
  src?: string;
  alt?: string;
}

export function PropertyImage({
  propertyId, // Accept but don't use yet
  propertyType = "Single Family Home",
  propertyName,
  size, // Accept size prop for compatibility
  location = "Florida",
  style = "florida-style",
  width = 400,
  height = 300,
  className = "",
  priority = false,
  generateAI = false,
  fallbackEmoji = "🏠",
}: PropertyImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadPropertyImage = async () => {
      try {
        setLoading(true);
        setError(false);

        if (generateAI) {
          // Try AI generation
          const aiImage = await getPropertyImage({
            propertyType,
            style,
            location,
            features: [],
          });
          setImageUrl(aiImage);
        } else {
          // Use curated image based on property type
          const image = getPropertyImageByType(propertyType);
          setImageUrl(image);
        }
      } catch (err) {
        logger.error("Error loading property image:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyImage();
  }, [propertyType, style, location, generateAI]);

  const handleImageError = () => {
    setError(true);
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse text-gray-400">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <span className="text-4xl" role="img" aria-label="Property">
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ width, height }}
    >
      <Image
        src={imageUrl}
        alt={propertyName || `${propertyType} in ${location}`}
        fill
        className="object-cover transition-transform hover:scale-105"
        priority={priority}
        onError={handleImageError}
        sizes={`${width}px`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
}

// Simplified property avatar for smaller displays
export function PropertyAvatar({
  propertyType = "Single Family Home",
  className = "",
  fallbackEmoji = "🏠",
}: {
  propertyType?: string;
  size?: number;
  className?: string;
  fallbackEmoji?: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const image = getPropertyImageByType(propertyType);
    setImageUrl(image);
  }, [propertyType]);

  if (error || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg ${className}`}
      >
        <span className="text-lg" role="img" aria-label="Property">
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={imageUrl}
        alt={`${propertyType} property`}
        fill
        className="object-cover"
        onError={() => setError(true)}
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  );
}
