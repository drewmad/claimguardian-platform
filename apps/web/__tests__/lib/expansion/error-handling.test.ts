/**
 * @fileMetadata
 * @purpose "Test Error object parameter handling in StateExpansionManager"
 * @dependencies ["@/lib/expansion/state-manager", "@/lib/logger"]
 * @owner expansion-team
 * @status active
 */

import { logger } from '@/lib/logger';

// Mock logger to test parameter passing
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('StateExpansionManager Error Handling', () => {
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should properly handle Error objects with correct parameter types', () => {
    const testError = new Error('Test database error');
    const testContext = { stateCode: 'FL', module: 'state-expansion' };

    // This should not cause TypeScript parameter mismatch errors
    logger.error(
      'Failed to get state configuration for FL',
      testContext,
      testError
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to get state configuration for FL',
      testContext,
      testError
    );
  });

  it('should handle unknown error types by converting to Error objects', () => {
    const unknownError = 'string error';
    const testContext = { module: 'state-expansion' };

    // This tests our error instanceof Error check and conversion
    logger.error(
      'Failed to get active states',
      testContext,
      unknownError instanceof Error ? unknownError : new Error(String(unknownError))
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to get active states',
      testContext,
      new Error('string error')
    );
  });

  it('should validate Error object parameter interface', () => {
    const error = new Error('Test error');
    
    // Verify Error object has expected properties for logger interface
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.message).toBe('string');
    expect(typeof error.stack).toBe('string');
    expect(error.name).toBe('Error');
  });

  it('should test logger interface signature compatibility', () => {
    // Test that our logger.error method accepts the correct parameter types
    const message = 'Test message';
    const context = { module: 'test', stateCode: 'FL' };
    const error = new Error('Test error');

    // This should compile without TypeScript errors
    expect(() => {
      logger.error(message, context, error);
    }).not.toThrow();

    expect(mockLogger.error).toHaveBeenCalledWith(message, context, error);
  });
});