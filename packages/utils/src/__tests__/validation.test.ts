/**
 * @fileMetadata
 * @purpose "Tests for validation utility functions"
 * @owner test-team
 * @dependencies ["vitest"]
 * @exports []
 * @complexity low
 * @tags ["test", "validation", "utilities"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:16:00Z
 */

import { describe, it, expect } from 'vitest'
import { 
  validateRequired, 
  validateEmail, 
  validatePhone, 
  validatePassword 
} from '../validation'

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('should return true for non-empty values', () => {
      expect(validateRequired('test')).toBe(true)
      expect(validateRequired(123)).toBe(true)
      expect(validateRequired(true)).toBe(true)
      expect(validateRequired([])).toBe(true)
      expect(validateRequired({})).toBe(true)
    })

    it('should return false for empty values', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired(null)).toBe(false)
      expect(validateRequired(undefined)).toBe(false)
      // Note: 0 and false are considered valid values in this implementation
      expect(validateRequired(0)).toBe(true)
      expect(validateRequired(false)).toBe(true)
    })

    it('should handle whitespace strings', () => {
      expect(validateRequired('   ')).toBe(false)
      expect(validateRequired('\t\n')).toBe(false)
      expect(validateRequired(' a ')).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@gmail.com',
        'user123@domain-name.org',
        'test.email.with+symbol@example.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingtld',
        'missing@.com',
        'spaces @domain.com',
        'two@@signs.com',
        'no-at-symbol.com',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
      
      // Handle null/undefined separately to avoid runtime errors
      expect(validateEmail(null as any)).toBe(false)
      expect(validateEmail(undefined as any)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct US phone number formats', () => {
      const validPhones = [
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '5551234567'
      ]

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true)
      })
    })

    it('should reject invalid phone number formats', () => {
      const invalidPhones = [
        '123-456-789', // too short
        '123-456-78901', // too long
        'abc-def-ghij', // letters
        '555-123', // incomplete
        '(555) 123-456', // incomplete
        ''
      ]

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false)
      })
      
      // Handle null/undefined separately - should return false
      expect(validatePhone(null as any)).toBe(false)
      expect(validatePhone(undefined as any)).toBe(false)
    })

    it('should handle phone numbers with different formatting', () => {
      expect(validatePhone('555 123 4567')).toBe(true)
      expect(validatePhone('555/123/4567')).toBe(true)
      expect(validatePhone('(555)123-4567')).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('should validate passwords with minimum 8 characters', () => {
      const validPasswords = [
        'SecurePassword123!',
        'MyP@ssw0rd2023',
        'password', // simple implementation only checks length
        'PASSWORD',
        '12345678'
      ]

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true)
      })
    })

    it('should reject passwords under 8 characters', () => {
      const shortPasswords = [
        'Pass123',
        '',
        'P@ss1',
        'short'
      ]

      shortPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false)
      })
    })

    it('should require minimum length of 8 characters', () => {
      expect(validatePassword('P@ss1')).toBe(false)
      expect(validatePassword('P@ssw0r')).toBe(false)
      expect(validatePassword('P@ssw0rd')).toBe(true)
      expect(validatePassword('password')).toBe(true) // simple implementation
    })
  })
})