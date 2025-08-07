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

import { X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/stores/modal-store";
import { SocialLoginPanel } from "@/components/auth/social-login-enhanced";

export function SimpleSignupModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { signUp, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  if (activeModal !== "signup") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const success = await signUp({
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We sent a confirmation email to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to activate your account.
          </p>
          <Button onClick={closeModal} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

      <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Create Account</h2>

        {/* Social Login Section */}
        <div className="mb-6">
          <SocialLoginPanel
            mode="signup"
            onSuccess={() => closeModal()}
            onError={(error) => console.error("Social signup error:", error)}
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error.message}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <button
            onClick={() => {
              closeModal();
              openModal("login");
            }}
            className="text-blue-600 hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
