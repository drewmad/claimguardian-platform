/**
 * @fileMetadata
 * @purpose Sign-in page with client-side authentication to fix spinning issue
 * @owner frontend-team
 * @dependencies ["react", "./sign-in-form"]
 * @exports ["SignInPage"]
 * @complexity low
 * @tags ["auth", "signin", "client"]
 * @status active
 * @notes Uses client-side form to prevent server action conflicts
 */

import { SignInForm } from './sign-in-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams

  return <SignInForm message={params?.message} />
}