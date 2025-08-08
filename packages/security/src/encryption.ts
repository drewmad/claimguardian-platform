/**
 * @fileMetadata
 * @purpose "Environment variable encryption and secure storage utilities"
 * @owner security-team
 * @dependencies ["crypto", "node:fs"]
 * @exports ["EncryptionManager", "SecureVault"]
 * @complexity high
 * @tags ["security", "encryption", "environment"]
 * @status production-ready
 */

import { createCipher, createDecipher, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Encryption manager for sensitive environment variables
 */
export class EncryptionManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;

  /**
   * Generate a cryptographically secure encryption key
   */
  static generateKey(): string {
    return randomBytes(this.KEY_LENGTH).toString('base64');
  }

  /**
   * Generate a secure session secret
   */
  static generateSessionSecret(): string {
    return randomBytes(32).toString('base64');
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  static async deriveKey(password: string, salt?: Buffer): Promise<{ key: Buffer; salt: Buffer }> {
    const saltBuffer = salt || randomBytes(this.SALT_LENGTH);
    const key = await scryptAsync(password, saltBuffer, this.KEY_LENGTH) as Buffer;
    return { key, salt: saltBuffer };
  }

  /**
   * Encrypt sensitive data
   */
  static async encrypt(
    plaintext: string, 
    encryptionKey: string
  ): Promise<{ encrypted: string; metadata: EncryptionMetadata }> {
    try {
      const key = Buffer.from(encryptionKey, 'base64');
      const iv = randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('ClaimGuardian-ENV', 'utf8'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      const result = {
        algorithm: this.ALGORITHM,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted
      };

      const metadata: EncryptionMetadata = {
        algorithm: this.ALGORITHM,
        timestamp: new Date().toISOString(),
        version: '1.0',
        keyId: this.generateKeyId(encryptionKey)
      };

      return {
        encrypted: Buffer.from(JSON.stringify(result)).toString('base64'),
        metadata
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decrypt(
    encryptedData: string, 
    encryptionKey: string
  ): Promise<string> {
    try {
      const key = Buffer.from(encryptionKey, 'base64');
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');
      const encryptedObj = JSON.parse(encryptedBuffer.toString('utf8'));
      
      const decipher = crypto.createDecipher(encryptedObj.algorithm, key);
      decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
      decipher.setAAD(Buffer.from('ClaimGuardian-ENV', 'utf8'));
      
      let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a key identifier for tracking
   */
  private static generateKeyId(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Rotate encryption key with backward compatibility
   */
  static async rotateKey(
    currentKey: string, 
    newKey: string, 
    encryptedValues: Record<string, string>
  ): Promise<Record<string, string>> {
    const rotatedValues: Record<string, string> = {};
    
    for (const [name, encryptedValue] of Object.entries(encryptedValues)) {
      try {
        // Decrypt with old key
        const plaintext = await this.decrypt(encryptedValue, currentKey);
        
        // Re-encrypt with new key
        const { encrypted } = await this.encrypt(plaintext, newKey);
        rotatedValues[name] = encrypted;
      } catch (error) {
        console.error(`Failed to rotate key for ${name}:`, error);
        // Keep the old encrypted value as fallback
        rotatedValues[name] = encryptedValue;
      }
    }
    
    return rotatedValues;
  }
}

/**
 * Encryption metadata for tracking and auditing
 */
interface EncryptionMetadata {
  algorithm: string;
  timestamp: string;
  version: string;
  keyId: string;
}

/**
 * Secure vault for managing encrypted environment variables
 */
export class SecureVault {
  private encryptionKey: string;
  private previousKey?: string;
  private vault: Map<string, EncryptedEntry> = new Map();

  constructor(encryptionKey: string, previousKey?: string) {
    this.encryptionKey = encryptionKey;
    this.previousKey = previousKey;
  }

  /**
   * Store a sensitive value in the vault
   */
  async store(name: string, value: string, metadata?: Record<string, unknown>): Promise<void> {
    const { encrypted, metadata: encMeta } = await EncryptionManager.encrypt(value, this.encryptionKey);
    
    this.vault.set(name, {
      encrypted,
      metadata: encMeta,
      userMetadata: metadata || {},
      createdAt: new Date().toISOString(),
      accessCount: 0
    });
  }

  /**
   * Retrieve a sensitive value from the vault
   */
  async retrieve(name: string): Promise<string | null> {
    const entry = this.vault.get(name);
    if (!entry) return null;

    try {
      // Try with current key first
      const decrypted = await EncryptionManager.decrypt(entry.encrypted, this.encryptionKey);
      
      // Update access tracking
      entry.accessCount++;
      entry.lastAccessedAt = new Date().toISOString();
      
      return decrypted;
    } catch (error) {
      // Try with previous key if available (for key rotation)
      if (this.previousKey) {
        try {
          const decrypted = await EncryptionManager.decrypt(entry.encrypted, this.previousKey);
          
          // Re-encrypt with current key for future access
          await this.store(name, decrypted, entry.userMetadata);
          
          return decrypted;
        } catch (previousError) {
          console.error(`Failed to decrypt ${name} with both current and previous keys`);
        }
      }
      
      throw new Error(`Failed to retrieve ${name} from secure vault`);
    }
  }

  /**
   * List all entries in the vault (without decrypting)
   */
  listEntries(): VaultEntry[] {
    return Array.from(this.vault.entries()).map(([name, entry]) => ({
      name,
      metadata: entry.metadata,
      userMetadata: entry.userMetadata,
      createdAt: entry.createdAt,
      lastAccessedAt: entry.lastAccessedAt,
      accessCount: entry.accessCount
    }));
  }

  /**
   * Remove an entry from the vault
   */
  remove(name: string): boolean {
    return this.vault.delete(name);
  }

  /**
   * Clear all entries from the vault
   */
  clear(): void {
    this.vault.clear();
  }

  /**
   * Export vault to encrypted JSON (for backup)
   */
  async export(): Promise<string> {
    const vaultData = Object.fromEntries(this.vault);
    return JSON.stringify(vaultData, null, 2);
  }

  /**
   * Import vault from encrypted JSON
   */
  async import(encryptedJson: string): Promise<void> {
    try {
      const vaultData = JSON.parse(encryptedJson);
      
      for (const [name, entry] of Object.entries(vaultData)) {
        this.vault.set(name, entry as EncryptedEntry);
      }
    } catch (error) {
      throw new Error(`Failed to import vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rotate the vault's encryption key
   */
  async rotateKey(newKey: string): Promise<void> {
    const encryptedValues: Record<string, string> = {};
    
    // Collect all encrypted values
    for (const [name, entry] of this.vault) {
      encryptedValues[name] = entry.encrypted;
    }
    
    // Rotate with encryption manager
    const rotatedValues = await EncryptionManager.rotateKey(
      this.encryptionKey, 
      newKey, 
      encryptedValues
    );
    
    // Update vault with new encrypted values
    for (const [name, newEncrypted] of Object.entries(rotatedValues)) {
      const entry = this.vault.get(name);
      if (entry) {
        entry.encrypted = newEncrypted;
        entry.metadata.keyId = this.generateKeyId(newKey);
        entry.lastRotatedAt = new Date().toISOString();
      }
    }
    
    // Update keys
    this.previousKey = this.encryptionKey;
    this.encryptionKey = newKey;
  }

  private generateKeyId(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 8);
  }
}

/**
 * Encrypted entry in the secure vault
 */
interface EncryptedEntry {
  encrypted: string;
  metadata: EncryptionMetadata;
  userMetadata: Record<string, unknown>;
  createdAt: string;
  lastAccessedAt?: string;
  lastRotatedAt?: string;
  accessCount: number;
}

/**
 * Public vault entry information (without encrypted data)
 */
interface VaultEntry {
  name: string;
  metadata: EncryptionMetadata;
  userMetadata: Record<string, unknown>;
  createdAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}

/**
 * Environment-specific secure vault factory
 */
export class SecureVaultFactory {
  /**
   * Create a vault for the current environment
   */
  static createVault(): SecureVault {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;
    
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is required for secure vault");
    }
    
    return new SecureVault(encryptionKey, previousKey);
  }

  /**
   * Create a vault with generated keys (for testing/setup)
   */
  static createTestVault(): SecureVault {
    const key = EncryptionManager.generateKey();
    return new SecureVault(key);
  }
}