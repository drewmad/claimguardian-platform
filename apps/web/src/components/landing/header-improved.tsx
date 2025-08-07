/**
 * @fileMetadata
 * @purpose "Improved landing page header with better branding and navigation"
 * @owner frontend-team
 * @dependencies ["react", "next/link", "@/lib/constants"]
 * @exports ["Header"]
 * @complexity medium
 * @tags ["header", "navigation", "landing"]
 * @status stable
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { COLORS } from "@/lib/constants";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useModalStore } from "@/stores/modal-store";

// Professional logo with enhanced styling
const HeaderLogoIcon = () => (
  <div className="relative">
    <OptimizedImage
      src="/ClaimGuardian.png"
      alt="ClaimGuardian Logo"
      width={32}
      height={32}
      priority={true}
      className="object-contain"
    />
    {/* Subtle glow effect for logo */}
    <div className="absolute inset-0 blur-md opacity-30 bg-green-400/20 animate-pulse" />
  </div>
);

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openModal } = useModalStore();

  return (
    <>
      <header
        className="sticky top-0 z-50 px-4 md:px-6 py-3 flex justify-between items-center transition-all duration-300 border-b safe-area-top"
        style={{
          backgroundColor: "rgba(43, 45, 66, 0.95)", // Gunmetal with transparency
          backdropFilter: "blur(12px)",
          borderBottomColor: "rgba(57, 255, 20, 0.1)", // Subtle neon green border
          WebkitBackdropFilter: "blur(12px)", // Safari support
        }}
      >
        {/* Logo - Professional logo + Wordmark paired */}
        <Link href="/" className="flex items-center gap-2 group">
          <HeaderLogoIcon />
          <h1 className="font-slab text-xl md:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
            ClaimGuardian
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="relative py-2 px-5 rounded-full font-semibold transition-all duration-300 hover:scale-105 overflow-hidden group"
              style={{
                backgroundColor: COLORS.brand.neonGreen,
                color: "black",
              }}
            >
              <span className="relative z-10">Start Free</span>
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-3">
          <Link
            href="/auth/signup"
            className="font-semibold text-sm py-2.5 px-4 rounded-lg transition-all duration-300 hover:scale-105 inline-block a11y-touch-target"
            style={{
              backgroundColor: COLORS.brand.neonGreen,
              color: "black",
            }}
          >
Start Free
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white hover:text-green-400 transition-colors a11y-touch-target"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <nav
            className="absolute top-16 left-0 right-0 mx-4 p-6 rounded-lg"
            style={{
              backgroundColor: "rgba(43, 45, 66, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(57, 255, 20, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <div className="border-t border-gray-600 pt-4 space-y-3">
                <Link
                  href="/auth/signin"
                  className="block w-full text-left text-gray-300 text-lg font-medium py-3 px-4 rounded-lg hover:bg-white/10 transition-colors a11y-touch-target"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-center py-3 px-6 rounded-full font-semibold transition-all duration-300 a11y-touch-target"
                  style={{
                    backgroundColor: COLORS.brand.neonGreen,
                    color: "black",
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Start Free
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
