/**
 * @fileMetadata
 * @purpose "Provides utility functions for common form validation patterns."
 * @owner frontend-team
 * @dependencies []
 * @exports ["validateRequired", "validateEmail", "validatePhone", "validatePassword"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T19:43:12-04:00
 * @complexity low
 * @tags ["utility", "validation", "form"]
 * @status stable
 * @notes Used for client-side form validation.
 */
export const validateRequired = (value: any): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};
