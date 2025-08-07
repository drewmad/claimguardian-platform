/**
 * @fileMetadata
 * @purpose "Mobile-optimized login modal with enhanced touch interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "@/components/ui/responsive-modal"]
 * @exports ["ResponsiveLoginModal"]
 * @complexity medium
 * @tags ["modal", "login", "auth", "mobile", "responsive"]
 * @status stable
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { useModalStore } from "@/stores/modal-store";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

interface FormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

export function ResponsiveLoginModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { signIn, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const isOpen = activeModal === "responsive-login";

  useEffect(() => {
    if (isOpen) {
      logger.track("login_modal_opened");
      // Focus email field on mobile with slight delay for animation
      setTimeout(() => {
        emailRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: "", password: "" });
      setErrors({});
      setTouchedFields(new Set());
      setLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  // Load remembered email if available
  useEffect(() => {
    if (isOpen) {
      const rememberedEmail = localStorage.getItem("claimguardian_email");
      if (rememberedEmail) {
        setFormData((prev) => ({ ...prev, email: rememberedEmail }));
        setRememberMe(true);
      }
    }
  }, [isOpen]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email";
        return undefined;

      case "password":
        if (!value) return "Password is required";
        return undefined;

      default:
        return undefined;
    }
  };

  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFieldBlur = (name: keyof FormData) => {
    setTouchedFields((prev) => new Set([...prev, name]));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) newErrors[key as keyof ValidationErrors] = error;
    });

    setErrors(newErrors);
    setTouchedFields(new Set(Object.keys(formData)));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);
    logger.track("login_attempt", { email: formData.email });

    try {
      await signIn(formData.email, formData.password);

      // Remember email if requested
      if (rememberMe) {
        localStorage.setItem("claimguardian_email", formData.email);
      } else {
        localStorage.removeItem("claimguardian_email");
      }

      logger.track("login_success", { email: formData.email });
      toast.success("Welcome back!");
      closeModal();
    } catch (error) {
      logger.error("Login failed", {}, error instanceof Error ? error : new Error(String(error)));
      // Error is handled by auth provider
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    closeModal();
    openModal("enhanced-forgot-password");
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={closeModal}
      size="md"
      position="center"
      mobileSlideUp={true}
      enableSwipeToClose={true}
      showHeader={false}
      allowDismiss={!loading}
    >
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
            <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your ClaimGuardian account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={emailRef}
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                placeholder="your@email.com"
                className={`pl-10 ${errors.email && touchedFields.has("email") ? "border-red-500 focus:border-red-500" : ""}`}
                autoComplete="email"
              />
            </div>
            {errors.email && touchedFields.has("email") && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                onBlur={() => handleFieldBlur("password")}
                placeholder="Enter your password"
                className={`pl-10 pr-10 ${errors.password && touchedFields.has("password") ? "border-red-500 focus:border-red-500" : ""}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && touchedFields.has("password") && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Remember me
              </span>
            </label>
          </div>

          {/* Auth Error */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {authError.message}
                </span>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              loading ||
              Object.keys(errors).some(
                (key) => errors[key as keyof ValidationErrors],
              )
            }
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>


        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => {
                closeModal();
                openModal("responsive-signup");
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}
