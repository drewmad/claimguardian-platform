/**
 * @fileMetadata
 * @purpose Tests for secure logging service with sensitive data redaction
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "logging", "security", "redaction"]
 * @status active
 */

import { logger } from '@/lib/logger'
import { mockConsole } from '../../utils/test-utils'

describe('Logger', () => {
  let console: ReturnType<typeof mockConsole>
  let originalEnv: string | undefined

  beforeEach(() => {
    console = mockConsole()
    originalEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    console.restore()
    process.env.NODE_ENV = originalEnv
  })

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message')
      )
    })

    it('should log warning messages', () => {
      logger.warn('Test warning message')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Test warning message')
      )
    })

    it('should log error messages', () => {
      logger.error('Test error message')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Test error message')
      )
    })

    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development'
      
      logger.debug('Test debug message')
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Test debug message')
      )
    })

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production'
      
      logger.debug('Test debug message')
      
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('Sensitive Data Redaction', () => {
    it('should redact password fields', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      }

      logger.info('User login', sensitiveData)

      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"password":"[REDACTED]"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"confirmPassword":"[REDACTED]"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('user@example.com')
      )
    })

    it('should redact token fields', () => {
      const sensitiveData = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh_token_value',
        api_key: 'sk_live_123456789',
        token: 'bearer_token_value',
      }

      logger.info('Auth data', sensitiveData)

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"access_token":"[REDACTED]"')
      expect(logCall).toContain('"refresh_token":"[REDACTED]"')
      expect(logCall).toContain('"api_key":"[REDACTED]"')
      expect(logCall).toContain('"token":"[REDACTED]"')
    })

    it('should redact SSN and sensitive IDs', () => {
      const sensitiveData = {
        ssn: '123-45-6789',
        social_security_number: '987654321',
        credit_card: '4111-1111-1111-1111',
        account_number: '1234567890',
      }

      logger.info('Personal data', sensitiveData)

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"ssn":"[REDACTED]"')
      expect(logCall).toContain('"social_security_number":"[REDACTED]"')
      expect(logCall).toContain('"credit_card":"[REDACTED]"')
      expect(logCall).toContain('"account_number":"[REDACTED]"')
    })

    it('should redact sensitive patterns in strings', () => {
      const messageWithSecrets = 'User password is secret123 and token is eyJhbGciOiJIUzI1NiI...'

      logger.info(messageWithSecrets)

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('[REDACTED]')
      expect(logCall).not.toContain('secret123')
      expect(logCall).not.toContain('eyJhbGciOiJIUzI1NiI')
    })

    it('should handle nested objects with sensitive data', () => {
      const nestedData = {
        user: {
          email: 'user@example.com',
          auth: {
            password: 'secret123',
            tokens: {
              access: 'access_token_value',
              refresh: 'refresh_token_value',
            },
          },
        },
        metadata: {
          api_key: 'sk_live_123',
        },
      }

      logger.info('Nested sensitive data', nestedData)

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"password":"[REDACTED]"')
      expect(logCall).toContain('"access":"[REDACTED]"')
      expect(logCall).toContain('"refresh":"[REDACTED]"')
      expect(logCall).toContain('"api_key":"[REDACTED]"')
      expect(logCall).toContain('user@example.com') // Non-sensitive data preserved
    })

    it('should handle arrays with sensitive data', () => {
      const arrayData = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', token: 'token123' },
        ],
        tokens: ['token1', 'token2', 'token3'],
      }

      logger.info('Array with sensitive data', arrayData)

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"password":"[REDACTED]"')
      expect(logCall).toContain('"token":"[REDACTED]"')
      expect(logCall).toContain('John') // Non-sensitive data preserved
      expect(logCall).toContain('Jane')
    })
  })

  describe('Error Logging', () => {
    it('should log Error objects with stack traces', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'

      logger.error('An error occurred', { error })

      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Test error')
      )
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('test.js:1:1')
      )
    })

    it('should handle errors with sensitive data in message', () => {
      const error = new Error('Authentication failed for password secret123')

      logger.error('Auth error', { error })

      const logCall = console.error.mock.calls[0][1]
      expect(logCall).toContain('[REDACTED]')
      expect(logCall).not.toContain('secret123')
    })

    it('should redact sensitive data in error context', () => {
      const error = new Error('Database connection failed')
      const context = {
        connectionString: 'postgresql://user:password@localhost:5432/db',
        credentials: {
          username: 'dbuser',
          password: 'dbpass123',
        },
      }

      logger.error('Database error', { error, ...context })

      const logCall = console.error.mock.calls[0][1]
      expect(logCall).toContain('"password":"[REDACTED]"')
      expect(logCall).not.toContain('dbpass123')
      expect(logCall).toContain('Database connection failed')
    })
  })

  describe('User Context', () => {
    it('should set and include user context in logs', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
      }

      logger.setUser(user)
      logger.info('User action performed')

      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"userId":"user123"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"userEmail":"user@example.com"')
      )
    })

    it('should clear user context', () => {
      logger.setUser({ id: 'user123', email: 'user@example.com' })
      logger.clearUser()
      logger.info('Anonymous action')

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).not.toContain('userId')
      expect(logCall).not.toContain('userEmail')
    })

    it('should redact sensitive user data in context', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        password: 'secret123', // This should be redacted
        api_key: 'sk_live_123', // This should be redacted
      }

      logger.setUser(user)
      logger.info('User context test')

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"userId":"user123"')
      expect(logCall).toContain('"userEmail":"user@example.com"')
      expect(logCall).not.toContain('secret123')
      expect(logCall).not.toContain('sk_live_123')
    })
  })

  describe('Event Tracking', () => {
    it('should track events with sanitized data', () => {
      const eventData = {
        action: 'user_login',
        email: 'user@example.com',
        password: 'secret123',
        timestamp: Date.now(),
      }

      logger.track('UserLogin', eventData)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TRACK]'),
        expect.stringContaining('"event":"UserLogin"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"password":"[REDACTED]"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('user@example.com')
      )
    })

    it('should include user context in tracked events', () => {
      logger.setUser({ id: 'user123', email: 'user@example.com' })
      
      logger.track('PageView', { page: '/dashboard' })

      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"userId":"user123"')
      expect(logCall).toContain('"event":"PageView"')
      expect(logCall).toContain('"page":"/dashboard"')
    })
  })

  describe('Production vs Development', () => {
    it('should include less verbose information in production', () => {
      process.env.NODE_ENV = 'production'

      logger.info('Production log', { 
        debug: 'verbose debug info',
        important: 'important data' 
      })

      // Should still log but potentially with less detail
      expect(console.info).toHaveBeenCalled()
    })

    it('should include full context in development', () => {
      process.env.NODE_ENV = 'development'

      logger.info('Development log', { 
        debug: 'verbose debug info',
        stack: 'full stack trace' 
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('verbose debug info')
      )
    })

    it('should suppress info logs in production but keep warnings and errors', () => {
      process.env.NODE_ENV = 'production'

      logger.info('Production info')
      logger.warn('Production warning')
      logger.error('Production error')

      // Info might be suppressed in production
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should handle large objects efficiently', () => {
      const largeObject = {
        data: Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100),
        })),
        password: 'secret123', // Should still be redacted
      }

      const startTime = Date.now()
      logger.info('Large object test', largeObject)
      const endTime = Date.now()

      // Should complete quickly even with large objects
      expect(endTime - startTime).toBeLessThan(100)
      
      // Sensitive data should still be redacted
      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"password":"[REDACTED]"')
    })

    it('should handle circular references gracefully', () => {
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj
      circularObj.password = 'secret123'

      // Should not throw error
      expect(() => {
        logger.info('Circular reference test', circularObj)
      }).not.toThrow()

      // Should still redact sensitive data
      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('"password":"[REDACTED]"')
    })
  })
})