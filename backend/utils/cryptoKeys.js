const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * KeyManager - Handles RSA key pair generation and encryption/decryption
 * Uses asymmetric encryption where:
 * - Public key (shared with frontend) - can ONLY encrypt
 * - Private key (kept on server) - can ONLY decrypt
 */
class KeyManager {
  constructor() {
    this.keysDir = path.join(__dirname, '../keys');
    this.publicKeyPath = path.join(this.keysDir, 'public.pem');
    this.privateKeyPath = path.join(this.keysDir, 'private.pem');
    this.publicKey = null;
    this.privateKey = null;

    this.initialize();
  }

  /**
   * Initialize key manager - load or generate keys
   */
  initialize() {
    try {
      // Check if keys exist
      if (fs.existsSync(this.publicKeyPath) && fs.existsSync(this.privateKeyPath)) {
        // Load existing keys
        this.publicKey = fs.readFileSync(this.publicKeyPath, 'utf8');
        this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
        console.log('✓ RSA key pair loaded from files');
      } else {
        // Generate new key pair
        console.log('RSA keys not found, generating new key pair...');
        this.generateKeys();
      }
    } catch (error) {
      console.error('Error initializing KeyManager:', error);
      throw error;
    }
  }

  /**
   * Generate new RSA key pair
   */
  generateKeys() {
    try {
      console.log('Generating 2048-bit RSA key pair...');

      // Generate RSA key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // 2048-bit key
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Ensure keys directory exists
      if (!fs.existsSync(this.keysDir)) {
        fs.mkdirSync(this.keysDir, { recursive: true });
        console.log(`✓ Created keys directory: ${this.keysDir}`);
      }

      // Save keys to files
      fs.writeFileSync(this.publicKeyPath, publicKey);
      fs.writeFileSync(this.privateKeyPath, privateKey);

      // Set permissions (Unix-like systems only)
      if (process.platform !== 'win32') {
        fs.chmodSync(this.privateKeyPath, 0o600); // Private key readable only by owner
        fs.chmodSync(this.publicKeyPath, 0o644);  // Public key readable by all
      }

      this.publicKey = publicKey;
      this.privateKey = privateKey;

      console.log('✓ RSA key pair generated and saved');
      console.log(`  Public key: ${this.publicKeyPath}`);
      console.log(`  Private key: ${this.privateKeyPath}`);
    } catch (error) {
      console.error('Error generating RSA keys:', error);
      throw error;
    }
  }

  /**
   * Get public key (safe to share with frontend)
   * @returns {string} Public key in PEM format
   */
  getPublicKey() {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }
    return this.publicKey;
  }

  /**
   * Decrypt data using private key
   * Supports both direct RSA and hybrid (AES+RSA) encryption
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {object} Decrypted data as object
   */
  decrypt(encryptedData) {
    try {
      if (!this.privateKey) {
        throw new Error('Private key not initialized');
      }

      // Check if this is hybrid encryption (base64 encoded JSON with method: 'hybrid')
      try {
        const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);

        if (parsed.method === 'hybrid') {
          // Hybrid encryption: decrypt AES key with RSA, then decrypt data with AES
          return this.decryptHybrid(parsed);
        }
      } catch (e) {
        // Not hybrid encryption, continue with direct RSA
      }

      // Direct RSA decryption
      const buffer = Buffer.from(encryptedData, 'base64');

      // Decrypt with private key using RSA-OAEP (compatible with Web Crypto API)
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      // Convert buffer to string and parse JSON
      const decryptedString = decrypted.toString('utf8');
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error.message);
      throw new Error('Decryption failed - data may be corrupted, tampered with, or encrypted with wrong key');
    }
  }

  /**
   * Decrypt hybrid encrypted data (AES + RSA)
   * @param {object} payload - Hybrid encryption payload {key, data, method}
   * @returns {object} Decrypted data
   */
  decryptHybrid(payload) {
    try {
      const CryptoJS = require('crypto-js');

      // Decrypt AES key using RSA-OAEP (compatible with Web Crypto API)
      const encryptedAESKey = Buffer.from(payload.key, 'base64');
      const aesKeyBuffer = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encryptedAESKey
      );
      const aesKey = aesKeyBuffer.toString('utf8');

      // Decrypt data using AES
      const decrypted = CryptoJS.AES.decrypt(payload.data, aesKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Hybrid decryption failed - invalid AES key or corrupted data');
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Hybrid decryption error:', error.message);
      throw new Error('Hybrid decryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt multiple submissions
   * @param {Array<string>} encryptedSubmissions - Array of encrypted submissions
   * @returns {Array<object>} Array of decrypted submissions
   */
  decryptBatch(encryptedSubmissions) {
    if (!Array.isArray(encryptedSubmissions)) {
      throw new Error('Expected array of encrypted submissions');
    }

    return encryptedSubmissions.map((encrypted, index) => {
      try {
        return this.decrypt(encrypted);
      } catch (error) {
        console.error(`Failed to decrypt submission ${index}:`, error.message);
        throw new Error(`Failed to decrypt submission ${index}: ${error.message}`);
      }
    });
  }

  /**
   * Verify key pair integrity
   * @returns {boolean} True if keys are valid
   */
  verifyKeys() {
    try {
      // Test encryption/decryption cycle
      const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });

      // Encrypt with public key using RSA-OAEP
      const encrypted = crypto.publicEncrypt(
        {
          key: this.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(testData, 'utf8')
      );

      // Decrypt with private key using RSA-OAEP
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encrypted
      );

      // Verify data matches
      const result = decrypted.toString('utf8') === testData;

      if (result) {
        console.log('✓ Key pair verification successful');
      } else {
        console.error('✗ Key pair verification failed');
      }

      return result;
    } catch (error) {
      console.error('Key verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new KeyManager();
