export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateRequest(req: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = []

  if (!req || typeof req !== 'object') {
    errors.push('Request body must be a valid JSON object')
    return { valid: false, errors }
  }

  requiredFields.forEach(field => {
    if (!(field in req) || req[field] === null || req[field] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
