/**
 * @fileMetadata
 * @purpose Multi-step signup page with compliance and AI disclaimers
 * @owner frontend-team
 * @status active
 */

import { MultiStepSignupForm } from './multi-step-signup-form'
// import { BasicSignupForm } from './basic-signup-form'

export default function SignupPage() {
  // Multi-step form is now working without RPC dependency
  return <MultiStepSignupForm />
}