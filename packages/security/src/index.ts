/**
 * @fileMetadata
 * @purpose "Main export file for ClaimGuardian security package"
 * @owner security-team
 * @exports ["*"]
 * @complexity low
 * @tags ["security", "exports"]
 * @status production-ready
 */

// Environment validation
export {
  env,
  getSecureEnv,
  validateEnvironment,
  EnvSecurityManager,
  EnvSecurityLevel,
  ENV_REGISTRY,
  type EnvironmentConfig,
  type EnvVarMetadata
} from './env-validator';

// Encryption utilities
export {
  EncryptionManager,
  SecureVault,
  SecureVaultFactory
} from './encryption';

// Re-export commonly used types
export type { ZodError } from 'zod';