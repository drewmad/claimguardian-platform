/**
 * @fileMetadata
 * @purpose "Scarcity banner component for limited-time offers and urgency"
 * @dependencies ["react", "lucide-react"]
 * @owner marketing-team
 * @status stable
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, Flame, TrendingUp, Users } from "lucide-react";

interface ScarcityBannerProps {
  offer: {
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
    expiresAt: Date;
    limitType: "time" | "spots" | "users";
    currentCount?: number;
    totalLimit?: number;
  };
  position?: "top" | "bottom" | "floating";
  theme?: "hurricane" | "claim-season" | "limited-spots";
}

export function ScarcityBanner({ 
  offer, 
  position = "floating",
  theme = "hurricane" 
}: ScarcityBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +offer.expiresAt - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setIsVisible(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [offer.expiresAt]);

  if (!isVisible) return null;

  const getThemeStyles = () => {
    switch (theme) {
      case "hurricane":
        return {
          bg: "bg-gradient-to-r from-red-600 via-orange-500 to-red-600",
          border: "border-red-400/50",
          text: "text-white",
          accent: "text-yellow-300",
        };
      case "claim-season":
        return {
          bg: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
          border: "border-blue-400/50",
          text: "text-white",
          accent: "text-cyan-300",
        };
      case "limited-spots":
        return {
          bg: "bg-gradient-to-r from-green-600 via-emerald-500 to-green-600",
          border: "border-green-400/50",
          text: "text-white",
          accent: "text-lime-300",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-red-600 via-orange-500 to-red-600",
          border: "border-red-400/50",
          text: "text-white",
          accent: "text-yellow-300",
        };
    }
  };

  const styles = getThemeStyles();
  const spotsRemaining = offer.totalLimit ? offer.totalLimit - (offer.currentCount || 0) : null;

  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "relative w-full";
      case "bottom":
        return "relative w-full";
      case "floating":
        return "fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto";
      default:
        return "relative w-full";
    }
  };

  return (
    <div className={getPositionStyles()}>
      <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 shadow-2xl relative overflow-hidden animate-pulse`}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)] opacity-30" />
        
        <div className="relative z-10">
          {/* Header with icon and close button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-yellow-300 animate-bounce" />
              <span className="font-bold text-sm uppercase tracking-wider">Limited Time</span>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white text-sm"
              aria-label="Close banner"
            >
              ✕
            </button>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Offer details */}
            <div className="md:col-span-2">
              <h3 className={`font-bold text-lg ${styles.text} mb-1`}>
                {offer.title}
              </h3>
              <p className={`text-sm ${styles.text} opacity-90`}>
                {offer.description}
              </p>
              
              {/* Scarcity indicators */}
              <div className="flex items-center gap-4 mt-2 text-xs">
                {offer.limitType === "spots" && spotsRemaining && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className={styles.accent}>
                      Only {spotsRemaining} spots left
                    </span>
                  </div>
                )}
                
                {offer.limitType === "users" && offer.currentCount && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className={styles.accent}>
                      {offer.currentCount} families already protected
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className={styles.accent}>
                    Expires in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                  </span>
                </div>
              </div>
            </div>

            {/* CTA and countdown */}
            <div className="text-center">
              {/* Countdown timer */}
              <div className="bg-black/20 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs opacity-70">DAYS</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs opacity-70">HRS</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs opacity-70">MIN</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{timeLeft.seconds}</div>
                    <div className="text-xs opacity-70">SEC</div>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <a
                href={offer.ctaUrl}
                className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:scale-105 transform duration-200 inline-block text-sm"
                onClick={() => {
                  // Track scarcity banner conversion
                  if (typeof window !== "undefined" && (window as any).gtag) {
                    (window as any).gtag('event', 'scarcity_banner_click', {
                      offer_title: offer.title,
                      theme,
                      position,
                    });
                  }
                }}
              >
                {offer.ctaText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Predefined scarcity offers for ClaimGuardian
 */
export const SCARCITY_OFFERS = {
  HURRICANE_PREP: {
    title: "Free Hurricane Season Protection Setup",
    description: "Get your property fully documented before the next storm hits Florida",
    ctaText: "Claim Free Setup",
    ctaUrl: "/auth/signup?offer=hurricane_prep",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    limitType: "time" as const,
  },
  
  EARLY_ACCESS: {
    title: "Early Access: AI Property Intelligence",
    description: "Be among the first 500 Florida families to get AI-powered property protection",
    ctaText: "Get Early Access",
    ctaUrl: "/auth/signup?offer=early_access",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    limitType: "spots" as const,
    currentCount: 247,
    totalLimit: 500,
  },
  
  CLAIM_SEASON: {
    title: "Claim Season 2025: Don't Get Left Behind",
    description: "Insurance companies are tightening policies. Protect yourself now.",
    ctaText: "Secure My Claims",
    ctaUrl: "/auth/signup?offer=claim_season",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    limitType: "users" as const,
    currentCount: 1247,
  },
};