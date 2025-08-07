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

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger/production-logger";

// Image compression utility
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  } = {},
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        `image/${format}`,
        quality,
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Request caching utility
class RequestCache {
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): unknown | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

const requestCache = new RequestCache();

export function useRequestCache() {
  const cachedRequest = useCallback(
    async <T>(
      key: string,
      requestFn: () => Promise<T>,
      ttl?: number,
    ): Promise<T> => {
      const cached = requestCache.get(key) as T | undefined;

      if (cached) {
        if (process.env.NODE_ENV === "development") {
          logger.debug(`Cache hit for ${key}`);
        }
        return cached;
      }

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Cache miss for ${key}`);
      }
      const result = await requestFn();
      requestCache.set(key, result, ttl);

      return result;
    },
    [],
  );

  return { cachedRequest, clearCache: () => requestCache.clear() };
}

// Lazy loading hook
export function useLazyLoad(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setWasVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { elementRef, isVisible, wasVisible };
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: { [key: string]: number[] } = {};

  startTimer(key: string): () => void {
    const start = performance.now();

    return () => {
      const end = performance.now();
      const duration = end - start;

      if (!this.metrics[key]) {
        this.metrics[key] = [];
      }

      this.metrics[key].push(duration);

      // Keep only last 100 measurements
      if (this.metrics[key].length > 100) {
        this.metrics[key] = this.metrics[key].slice(-100);
      }

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Performance: ${key}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getMetrics(key: string) {
    const times = this.metrics[key] || [];

    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, count: times.length };
  }

  getAllMetrics() {
    const result: { [key: string]: unknown } = {};

    for (const key of Object.keys(this.metrics)) {
      result[key] = this.getMetrics(key);
    }

    return result;
  }

  clear() {
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRun.current >= limit) {
          setThrottledValue(value);
          lastRun.current = Date.now();
        }
      },
      limit - (Date.now() - lastRun.current),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ("memory" in performance) {
        const info = (
          performance as unknown as {
            memory: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory;
        setMemoryInfo({
          used: info.usedJSHeapSize,
          total: info.totalJSHeapSize,
          percentage: (info.usedJSHeapSize / info.totalJSHeapSize) * 100,
        });
      }
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory();

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Batch processing utility
export function useBatchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 5,
  delay: number = 100,
) {
  const [queue, setQueue] = useState<T[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<R[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const processingRef = useRef(false);

  const addToQueue = useCallback((items: T[]) => {
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;

    processingRef.current = true;
    setProcessing(true);

    try {
      const batch = queue.slice(0, batchSize);
      const remainingQueue = queue.slice(batchSize);

      const batchResults = await processor(batch);

      setResults((prev) => [...prev, ...batchResults]);
      setQueue(remainingQueue);

      // Continue processing if there are more items
      if (remainingQueue.length > 0) {
        setTimeout(() => {
          processingRef.current = false;
          processQueue();
        }, delay);
      } else {
        processingRef.current = false;
        setProcessing(false);
      }
    } catch (error) {
      setErrors((prev) => [...prev, error as Error]);
      processingRef.current = false;
      setProcessing(false);
    }
  }, [queue, processor, batchSize, delay]);

  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [queue, processQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setResults([]);
    setErrors([]);
  }, []);

  return {
    addToQueue,
    queue,
    processing,
    results,
    errors,
    clearQueue,
    queueLength: queue.length,
  };
}
