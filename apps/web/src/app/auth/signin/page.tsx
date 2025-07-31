/**
 * @fileMetadata
 * @purpose Sign-in page with email/password authentication using Supabase.
 * @owner frontend-team
 * @dependencies ["react", "@claimguardian/ui", "@/lib/supabase"]
 * @exports ["SignInPage"]
 * @complexity medium
 * @tags ["auth", "signin", "form"]
 * @status active
 * @notes Handles user authentication with email/password and redirects to dashboard.
 */

import { Button, Input, Label, Card } from '@claimguardian/ui';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { signIn } from '@/actions/auth';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm border-slate-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">ClaimGuardian</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {params?.message && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{params.message}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form action={signIn} className="space-y-6">
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
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              Sign In
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/"
                className="text-blue-400 hover:text-blue-300"
              >
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