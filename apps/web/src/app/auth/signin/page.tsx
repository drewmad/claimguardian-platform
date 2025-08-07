/**
 * @fileMetadata
 * @purpose "Sign-in page with robust authentication flow"
 * @owner frontend-team
 * @dependencies ["react", "./sign-in-form"]
 * @exports ["SignInPage"]
 * @complexity low
 * @tags ["auth", "signin", "client"]
 * @status stable
 * @notes Uses the main SignInForm which is integrated with the AuthProvider
 */

import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return <SignInForm message={params?.message} />;
}
