/**
 * @fileMetadata
 * @purpose Simple signup page that captures all required information in one form
 * @owner frontend-team
 * @status active
 */

// import { MultiStepSignupForm } from './multi-step-signup-form'
import { BasicSignupForm } from './basic-signup-form'

export default function SignupPage() {
  // Temporarily using BasicSignupForm to ensure user creation works
  // TODO: Fix RPC function and re-enable MultiStepSignupForm
  return <BasicSignupForm />
}