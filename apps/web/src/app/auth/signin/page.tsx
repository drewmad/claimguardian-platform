/**
 * @fileMetadata
 * @purpose "Sign-in page with simplified authentication flow"
 * @owner frontend-team
 * @dependencies ["react", "./simple-sign-in-form"]
 * @exports ["SignInPage"]
 * @complexity low
 * @tags ["auth", "signin", "client"]
 * @status stable
 * @notes Uses simplified form with direct Supabase auth
 */

import { SimpleSignInForm } from './simple-sign-in-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams

  return <SimpleSignInForm message={params?.message} />
}
