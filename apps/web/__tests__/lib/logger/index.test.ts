/**
 * @fileMetadata
 * @purpose Tests for logging service
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "logging"]
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
    logger.clearLogs()
  })

  afterEach(() => {
    console.restore()
    // Use Object.defineProperty to restore NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      enumerable: true,
      configurable: true
    })
  })

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.any(String)
      )
      expect(console.info.mock.calls[0][0]).toContain('Test info message')
    })

    it('should log warning messages', () => {
      logger.warn('Test warning message')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.any(String)
      )
      expect(console.warn.mock.calls[0][0]).toContain('Test warning message')
    })

    it('should log error messages', () => {
      logger.error('Test error message')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.any(String),
        expect.any(String)
      )
      expect(console.error.mock.calls[0][0]).toContain('Test error message')
    })

    it('should log debug messages in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        enumerable: true,
        configurable: true
      })
      
      // Clear the module cache to force a fresh import
      jest.resetModules()
      const { logger: devLogger } = require('@/lib/logger')
      devLogger.debug('Test debug message')
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.any(String)
      )
    })

    it('should not log debug messages in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        enumerable: true,
        configurable: true
      })
      
      // Clear the module cache to force a fresh import
      jest.resetModules()
      const { logger: prodLogger } = require('@/lib/logger')
      prodLogger.debug('Test debug message')
      
      expect(console.debug).not.toHaveBeenCalled()
    })
  })

  describe('Context Logging', () => {
    it('should include context in log messages', () => {
      const context = { userId: 'test123', action: 'login' }
      logger.info('User action', context)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(JSON.stringify(context, null, 2))
      )
    })

    it('should include module context', () => {
      const context = { module: 'auth', userId: 'test123' }
      logger.info('Auth action', context)

      expect(console.info.mock.calls[0][0]).toContain('[auth]')
    })
  })

  describe('Error Logging', () => {
    it('should log Error objects with stack traces', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'

      logger.error('An error occurred', {}, error)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.any(String),
        expect.stringContaining('Error: Test error')
      )
    })

    it('should log critical errors', () => {
      const error = new Error('Critical error')
      logger.critical('System failure', {}, error)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL]'),
        expect.any(String),
        expect.any(String)
      )
    })
  })

  describe('User Context', () => {
    it('should log when user context is set', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
      }

      logger.setUser(user)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('user123')
      )
    })

    it('should log when user context is cleared', () => {
      logger.setUser(null)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('User context cleared'),
        expect.any(String)
      )
    })
  })

  describe('Event Tracking', () => {
    it('should track events', () => {
      const eventData = {
        action: 'button_click',
        label: 'submit',
      }

      logger.track('UserAction', eventData)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Event: UserAction'),
        expect.stringContaining('eventType')
      )
      
      const logCall = console.info.mock.calls[0][1]
      expect(logCall).toContain('UserAction')
      expect(logCall).toContain('track')
    })

    it('should track page views', () => {
      logger.pageView('/dashboard', { referrer: '/home' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Event: page_view'),
        expect.stringContaining('/dashboard')
      )
    })
  })

  describe('Log Buffer', () => {
    it('should store recent logs', () => {
      logger.info('Log 1')
      logger.warn('Log 2')
      logger.error('Log 3')

      const recentLogs = logger.getRecentLogs(3)
      expect(recentLogs).toHaveLength(3)
      expect(recentLogs[0].message).toBe('Log 1')
      expect(recentLogs[1].message).toBe('Log 2')
      expect(recentLogs[2].message).toBe('Log 3')
    })

    it('should clear log buffer', () => {
      logger.info('Log to clear')
      logger.clearLogs()

      const recentLogs = logger.getRecentLogs()
      expect(recentLogs).toHaveLength(0)
    })
  })

  describe('Module Loggers', () => {
    it('should use auth logger with module context', () => {
      const { authLogger } = require('@/lib/logger')
      authLogger.info('Auth event')

      expect(console.info.mock.calls[0][0]).toContain('[auth]')
    })

    it('should use api logger with module context', () => {
      const { apiLogger } = require('@/lib/logger')
      apiLogger.warn('API warning')

      expect(console.warn.mock.calls[0][0]).toContain('[api]')
    })

    it('should use camera logger with module context', () => {
      const { cameraLogger } = require('@/lib/logger')
      cameraLogger.error('Camera error')

      expect(console.error.mock.calls[0][0]).toContain('[camera]')
    })
  })

  describe('Auth Debug', () => {
    it('should log auth debug in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        enumerable: true,
        configurable: true
      })

      jest.resetModules()
      const { logger: devLogger } = require('@/lib/logger')
      devLogger.authDebug('SessionCheck', { userId: '123' })

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH DEBUG] SessionCheck'),
        expect.any(String)
      )
    })

    it('should not log auth debug in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        enumerable: true,
        configurable: true
      })

      jest.resetModules()
      const { logger: prodLogger } = require('@/lib/logger')
      prodLogger.authDebug('SessionCheck', { userId: '123' })

      expect(console.debug).not.toHaveBeenCalled()
    })
  })
})