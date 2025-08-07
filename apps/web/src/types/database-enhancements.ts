/**
 * @fileMetadata
 * @purpose "Type enhancements for database operations"
 * @dependencies []
 * @owner core-team
 * @status stable
 */

export interface CreatePolicyInput {
  property_id: string
  carrier: string
  policy_number: string
  effective_date: string
  expiration_date: string
  coverage_amount: number
  deductible: number
  wind_deductible?: number | string
  flood_deductible?: number
  premium_amount: number
  additional_coverages?: string[]
}
