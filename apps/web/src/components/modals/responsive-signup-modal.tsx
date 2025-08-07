/**
 * @fileMetadata
 * @purpose "Mobile-optimized signup modal with enhanced touch interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "@/components/ui/responsive-modal"]
 * @exports ["ResponsiveSignupModal"]
 * @complexity medium
 * @tags ["modal", "signup", "auth", "mobile", "responsive"]
 * @status stable
 */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Loader2,
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
  confirmPassword?: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function ResponsiveSignupModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { signUp, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "verification">("form");

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const isOpen = activeModal === "responsive-signup";

  useEffect(() => {
    if (isOpen) {
      logger.track("signup_modal_opened");
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: "", password: "", confirmPassword: "" });
      setErrors({});
      setTouchedFields(new Set());
      setStep("form");
      setSubmitted(false);
      setLoading(false);
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
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must contain uppercase, lowercase, and number";
        }
        return undefined;

      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
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

    // Validate confirm password when password changes
    if (name === "password" && formData.confirmPassword) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword,
      );
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleFieldBlur = (name: keyof FormData) => {
    setTouchedFields((prev) => new Set([...prev, name]));
    const error = validateField(name, formData[name] || "");
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData] || "");
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
    logger.track("signup_attempt", { email: formData.email });

    try {
      const success = await signUp({
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        setStep("verification");
        setSubmitted(true);
        logger.track("signup_success", { email: formData.email });
        toast.success("Account created! Please check your email.");
      }
    } catch (error) {
      logger.error("Signup failed", {}, error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string,
  ): { score: number; text: string; color: string } => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { text: "Very Weak", color: "text-red-500" },
      { text: "Weak", color: "text-red-400" },
      { text: "Fair", color: "text-yellow-500" },
      { text: "Good", color: "text-blue-500" },
      { text: "Strong", color: "text-green-500" },
      { text: "Very Strong", color: "text-green-600" },
    ];

    return { score, ...levels[Math.min(score, 5)] };
  };

  const renderFormContent = () => (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Join ClaimGuardian to start protecting your property
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
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              placeholder="your@email.com"
              className={`pl-10 ${errors.email && touchedFields.has("email") ? "border-red-500 focus:border-red-500" : ""}`}
              autoFocus
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
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              onBlur={() => handleFieldBlur("password")}
              placeholder="Create a strong password"
              className={`pl-10 pr-10 ${errors.password && touchedFields.has("password") ? "border-red-500 focus:border-red-500" : ""}`}
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Password strength:</span>
                <span className={getPasswordStrength(formData.password).color}>
                  {getPasswordStrength(formData.password).text}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${
                    getPasswordStrength(formData.password).score <= 2
                      ? "bg-red-500"
                      : getPasswordStrength(formData.password).score <= 4
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${(getPasswordStrength(formData.password).score / 6) * 100}%`,
                  }}
                />
              </div>
            </motion.div>
          )}

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

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleFieldChange("confirmPassword", e.target.value)
              }
              onBlur={() => handleFieldBlur("confirmPassword")}
              placeholder="Confirm your password"
              className={`pl-10 pr-10 ${errors.confirmPassword && touchedFields.has("confirmPassword") ? "border-red-500 focus:border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && touchedFields.has("confirmPassword") && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {errors.confirmPassword}
            </motion.p>
          )}
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
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => {
              closeModal();
              openModal("responsive-login");
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );

  const renderVerificationContent = () => (
    <div className="p-6 text-center space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We sent a verification email to
          </p>
          <p className="font-medium text-gray-900 dark:text-white">
            {formData.email}
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Click the link in the email to verify your account and get started.
        </p>
        <p>
          Didn't receive the email? Check your spam folder or request a new one.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={closeModal} className="w-full">
          Got it, thanks!
        </Button>
        <button
          onClick={() => {
            // TODO: Implement resend verification
            toast.info("Verification email resent!");
          }}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm hover:underline"
        >
          Resend verification email
        </button>
      </div>
    </div>
  );

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
      {step === "form" ? renderFormContent() : renderVerificationContent()}
    </ResponsiveModal>
  );
}
