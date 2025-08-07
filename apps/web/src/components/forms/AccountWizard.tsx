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

import { createBrowserSupabaseClient } from "@claimguardian/db";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { logger } from "@/lib/logger/production-logger";

import { ProgressBar } from "./ProgressBar";
import { Agreements } from "./steps/Agreements";
import { PersonalInfo } from "./steps/PersonalInfo";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
  ageVerified: boolean;
}

export function AccountWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const nextStep = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
    setStep(step + 1);
    setError(null);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  const submitForm = async (data: Partial<FormData>) => {
    const finalData = { ...formData, ...data };
    setIsLoading(true);
    setError(null);

    try {
      // Create user account
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: finalData.email!,
          password: finalData.password!,
          options: {
            data: {
              first_name: finalData.firstName,
              last_name: finalData.lastName,
              phone: finalData.phone,
              full_name: `${finalData.firstName} ${finalData.lastName}`,
            },
          },
        });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (signUpData?.user) {
        // Log consents
        try {
          await supabase.rpc("link_consent_to_user", {
            p_user_id: signUpData.user.id,
            p_consents: {
              terms_of_service: finalData.agreed,
              privacy_policy: finalData.agreed,
              data_processing: finalData.agreed,
              age_verification: finalData.ageVerified,
              cookies: finalData.agreed,
              ai_disclaimer: finalData.agreed,
            },
            p_ip_address: null,
            p_user_agent: navigator.userAgent,
          });
        } catch (consentError) {
          // Log but don't fail the signup
          logger.error("Error logging consents:", { consentError });
        }

        setSuccess(true);

        // Redirect to onboarding after success message
        setTimeout(() => {
          router.push("/onboarding");
        }, 2000);
      }
    } catch (err) {
      logger.error("Signup error:", {}, err instanceof Error ? err : new Error(String(err)));
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <Alert className="bg-green-900/20 border-green-500/30">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            <div className="space-y-2">
              <p className="font-medium">Account created successfully! 🎉</p>
              <p className="text-sm">
                Welcome to ClaimGuardian! Check your email for a confirmation
                link, then we'll redirect you to your dashboard.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar currentStep={step} totalSteps={2} />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        {step === 1 && (
          <PersonalInfo onNext={nextStep} defaultValues={formData} />
        )}

        {step === 2 && (
          <Agreements
            onPrev={prevStep}
            onSubmit={submitForm}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Secure signup powered by enterprise-grade encryption
        </p>
      </div>
    </div>
  );
}
