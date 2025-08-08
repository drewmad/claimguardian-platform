/**
 * @fileMetadata
 * @purpose "Server-action based sign-in form with persistent session cookies"
 * @dependencies ["@/app/auth/actions","@claimguardian/ui","lucide-react","next"]
 * @owner frontend-team
 * @status stable
 */
"use client";

import { Button, Input, Label, Card } from "@claimguardian/ui";
import { Shield, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import React, { useState, useTransition } from "react";

import { authenticateAction } from "@/app/auth/actions";

interface SignInFormProps {
  message?: string;
  showResetOption?: boolean;
}

export function SignInForm({ message, showResetOption }: SignInFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      authenticateAction(formData);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                ClaimGuardian
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {message && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{decodeURIComponent(message)}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form action={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                placeholder="Enter your email"
                autoComplete="email"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isPending}
                />
              </div>
              <div className="mt-2 text-right">
                <Link
                  href="/auth/recover"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Session Reset Option */}
          {showResetOption && (
            <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
              <p className="text-amber-300 text-sm mb-2">
                Having trouble signing in?
              </p>
              <Link
                href="/api/auth/reset"
                className="text-amber-200 hover:text-amber-100 text-sm underline"
                prefetch={false}
              >
                Reset session
              </Link>
              <span className="text-amber-400 text-sm"> to clear stale authentication data</span>
            </div>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{" "}
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-slate-400 hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
