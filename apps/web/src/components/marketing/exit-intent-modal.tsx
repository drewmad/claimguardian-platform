/**
 * @fileMetadata
 * @purpose "Exit-intent modal for lead capture and conversion optimization"
 * @dependencies ["react", "lucide-react"]
 * @owner marketing-team
 * @status stable
 */

"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Shield, Clock } from "lucide-react";

interface ExitIntentModalProps {
  onClose: () => void;
  onSignup: () => void;
}

export function ExitIntentModal({ onClose, onSignup }: ExitIntentModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Track exit intent conversion
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag('event', 'exit_intent_signup', {
          email_domain: email.split('@')[1],
        });
      }

      // Call the signup handler
      onSignup();
    } catch (error) {
      console.error('Exit intent signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/50 rounded-2xl max-w-lg w-full p-6 shadow-[0_20px_80px_rgba(239,68,68,0.3)] animate-in slide-in-from-bottom duration-500">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Warning indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-500/20 border border-red-500/50 rounded-full p-3 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Wait! Don't Leave Unprotected
          </h2>
          <p className="text-gray-300">
            Hurricane season is active. Get your property protection checklist before you go.
          </p>
        </div>

        {/* Urgency benefits */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-300">Free Hurricane Checklist</p>
              <p className="text-xs text-gray-400">15-minute property protection guide</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Instant Access</p>
              <p className="text-xs text-gray-400">Delivered to your email immediately</p>
            </div>
          </div>
        </div>

        {/* Email capture form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
              required
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              'Get My Free Hurricane Checklist'
            )}
          </button>
        </form>

        {/* Social proof */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>✅ 1,247 Florida families protected</span>
            <span>•</span>
            <span>✅ $2.4M+ recovered in claims</span>
          </div>
        </div>

        {/* Small print */}
        <p className="text-xs text-gray-500 text-center mt-4">
          No spam. Unsubscribe anytime. Used only for hurricane season updates.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage exit intent detection and modal state
 */
export function useExitIntent() {
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (hasShown) return; // Only show once per session

    let isExitIntent = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect exit intent - mouse moving to top of screen
      if (e.clientY <= 0 && !isExitIntent) {
        isExitIntent = true;
        setShowModal(true);
        setHasShown(true);
      }
    };

    // Add some delay before enabling exit intent
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 10000); // Wait 10 seconds before enabling exit intent

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSignup = () => {
    // Redirect to signup with exit intent tracking
    if (typeof window !== "undefined") {
      window.location.href = '/auth/signup?source=exit_intent';
    }
  };

  return {
    showModal,
    closeModal,
    handleSignup,
  };
}