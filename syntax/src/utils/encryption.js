// Encryption utilities for secure contest submission storage
import CryptoJS from 'crypto-js';
import axios from 'axios';

/**
 * Generate encryption key from contest ID and session data
 * @param {string} contestId - Contest identifier
 * @param {string} sessionToken - User session token from server
 * @returns {string} Encryption key
 */
export const generateEncryptionKey = (contestId, sessionToken = '') => {
  // Use contest ID and session token to generate unique key
  const baseKey = `${contestId}_${sessionToken}_contest_secure`;
  return CryptoJS.SHA256(baseKey).toString();
};

/**
 * Encrypt submission data
 * @param {object} data - Submission data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data with HMAC signature
 */
export const encryptSubmission = (data, key) => {
  try {
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);

    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(jsonData, key).toString();

    // Create HMAC signature for integrity check
    const signature = CryptoJS.HmacSHA256(encrypted, key).toString();

    // Return combined encrypted data and signature
    return JSON.stringify({
      data: encrypted,
      signature: signature,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt submission data');
  }
};

/**
 * Decrypt submission data with integrity verification
 * @param {string} encryptedPayload - Encrypted payload with signature
 * @param {string} key - Encryption key
 * @returns {object} Decrypted data
 */
export const decryptSubmission = (encryptedPayload, key) => {
  try {
    // Parse the encrypted payload
    const payload = JSON.parse(encryptedPayload);
    const { data, signature, timestamp } = payload;

    // Verify HMAC signature
    const expectedSignature = CryptoJS.HmacSHA256(data, key).toString();
    if (expectedSignature !== signature) {
      throw new Error('Data integrity check failed - possible tampering detected');
    }

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(data, key);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt submission data');
  }
};

/**
 * Store encrypted submission in localStorage
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @param {object} submissionData - Submission data
 * @param {string} key - Encryption key
 */
export const storeEncryptedSubmission = (contestId, problemIndex, submissionData, key) => {
  const encrypted = encryptSubmission(submissionData, key);
  const storageKey = `contest_${contestId}_submission_${problemIndex}`;
  localStorage.setItem(storageKey, encrypted);
};

/**
 * Retrieve encrypted submission from localStorage
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @param {string} key - Encryption key
 * @returns {object|null} Decrypted submission data or null
 */
export const retrieveEncryptedSubmission = (contestId, problemIndex, key) => {
  try {
    const storageKey = `contest_${contestId}_submission_${problemIndex}`;
    const encrypted = localStorage.getItem(storageKey);

    if (!encrypted) {
      return null;
    }

    return decryptSubmission(encrypted, key);
  } catch (error) {
    console.error('Error retrieving submission:', error);
    return null;
  }
};

/**
 * Clear all encrypted submissions and summaries for a contest
 * @param {string} contestId - Contest ID
 * @param {number} problemCount - Number of problems
 */
export const clearEncryptedSubmissions = (contestId, problemCount) => {
  for (let idx = 0; idx < problemCount; idx++) {
    const storageKey = `contest_${contestId}_submission_${idx}`;
    const summaryKey = `contest_${contestId}_summary_${idx}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(summaryKey);
  }
};

/**
 * Retrieve all submissions for final submission
 * @param {string} contestId - Contest ID
 * @param {number} problemCount - Number of problems
 * @param {string} key - Encryption key
 * @returns {Array} Array of all submissions
 */
export const retrieveAllSubmissions = (contestId, problemCount, key) => {
  const submissions = [];

  for (let idx = 0; idx < problemCount; idx++) {
    const submission = retrieveEncryptedSubmission(contestId, idx, key);
    if (submission) {
      submissions.push({
        ...submission,
        problemIndex: idx
      });
    }
  }

  return submissions;
};

// ==================== ASYMMETRIC ENCRYPTION (RSA) ====================
// Uses public/private key pair for maximum security
// Frontend can ONLY encrypt (has public key)
// Backend can ONLY decrypt (has private key)

// Store backend's public key (fetched once on contest start)
let backendPublicKey = null;
let backendPublicKeyCrypto = null; // CryptoKey object for Web Crypto API

/**
 * Convert PEM public key to CryptoKey for Web Crypto API
 * @param {string} pemKey - PEM formatted public key
 * @returns {Promise<CryptoKey>} CryptoKey object
 */
const importPublicKey = async (pemKey) => {
  // Remove PEM header/footer and decode base64
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // Import as CryptoKey
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  );
};

/**
 * Fetch RSA public key from backend
 * This key is used to encrypt data that only backend can decrypt
 * @returns {Promise<string>} Public key in PEM format
 */
export const fetchPublicKey = async () => {
  try {
    const response = await axios.get('/api/contest/public-key');

    if (!response.data.success || !response.data.publicKey) {
      throw new Error('Failed to retrieve public key from server');
    }

    backendPublicKey = response.data.publicKey;

    // Import as CryptoKey for Web Crypto API
    backendPublicKeyCrypto = await importPublicKey(backendPublicKey);

    console.log('✓ Backend RSA public key retrieved');

    return backendPublicKey;
  } catch (error) {
    console.error('Failed to fetch public key:', error);
    throw new Error('Unable to establish secure connection with server');
  }
};

/**
 * Encrypt submission data with backend's PUBLIC key using Web Crypto API
 * Only backend can decrypt with its PRIVATE key
 * Frontend CANNOT decrypt this data
 * @param {object} data - Submission data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export const encryptSubmissionAsymmetric = async (data) => {
  try {
    if (!backendPublicKeyCrypto) {
      throw new Error('Public key not loaded. Call fetchPublicKey() first.');
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data);

    // RSA-OAEP has size limits (~190 bytes for 2048-bit key)
    // For larger data, use hybrid encryption
    if (jsonData.length > 190) {
      return await encryptLargeDataHybrid(jsonData);
    }

    // Direct RSA-OAEP encryption for small data
    const dataBuffer = new TextEncoder().encode(jsonData);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      backendPublicKeyCrypto,
      dataBuffer
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));

    return encryptedBase64;
  } catch (error) {
    console.error('Asymmetric encryption error:', error);
    throw new Error('Failed to encrypt submission: ' + error.message);
  }
};

/**
 * Hybrid encryption for larger data using Web Crypto API
 * Combines AES (fast, for data) and RSA-OAEP (secure, for key)
 * @param {string} jsonData - JSON string to encrypt
 * @returns {Promise<string>} Encrypted package (base64)
 */
const encryptLargeDataHybrid = async (jsonData) => {
  // Generate random AES key (32 bytes = 256 bits)
  const aesKey = CryptoJS.lib.WordArray.random(32).toString();

  // Encrypt data with AES
  const encryptedData = CryptoJS.AES.encrypt(jsonData, aesKey).toString();

  // Encrypt AES key with RSA-OAEP
  const aesKeyBuffer = new TextEncoder().encode(aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    backendPublicKeyCrypto,
    aesKeyBuffer
  );

  // Convert encrypted key to base64
  const encryptedKeyArray = new Uint8Array(encryptedKeyBuffer);
  const encryptedKeyBase64 = btoa(String.fromCharCode(...encryptedKeyArray));

  // Combine encrypted key and encrypted data
  const payload = {
    key: encryptedKeyBase64,  // RSA-OAEP encrypted AES key
    data: encryptedData,       // AES encrypted data
    method: 'hybrid'           // Indicates hybrid encryption
  };

  // Return as base64 encoded JSON
  return btoa(JSON.stringify(payload));
};

/**
 * Store asymmetrically encrypted submission in localStorage
 * Data is encrypted with backend's public key
 * Frontend CANNOT decrypt - only backend can
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @param {object} submissionData - Submission data
 */
export const storeEncryptedSubmissionAsymmetric = async (contestId, problemIndex, submissionData) => {
  try {
    // Encrypt with backend's public key (now async)
    const encrypted = await encryptSubmissionAsymmetric(submissionData);

    const storageKey = `contest_${contestId}_submission_${problemIndex}`;

    // Store encrypted data with metadata
    const payload = JSON.stringify({
      data: encrypted,
      timestamp: Date.now(),
      encryptionType: 'rsa-asymmetric',
      encrypted: true
    });

    localStorage.setItem(storageKey, payload);

    // ALSO store a plaintext summary for UI display (NO CODE, just metadata)
    // This allows the UI to show progress after refresh
    // Backend still verifies from encrypted data, so tampering won't affect final score
    const summaryKey = `contest_${contestId}_summary_${problemIndex}`;
    const summary = {
      problemCode: submissionData.problemCode,
      problemTitle: submissionData.problemTitle,
      passedTests: submissionData.passedTests,
      totalTests: submissionData.totalTests,
      pointsEarned: submissionData.pointsEarned,
      maxPoints: submissionData.maxPoints,
      solved: submissionData.solved,
      timestamp: submissionData.timestamp
      // NOTE: Code is NOT stored here - only in encrypted form
    };

    localStorage.setItem(summaryKey, JSON.stringify(summary));

    console.log(`✓ Submission ${problemIndex} encrypted and stored (backend-only decryption)`);
  } catch (error) {
    console.error('Failed to store encrypted submission:', error);
    throw error;
  }
};

/**
 * Retrieve encrypted submission from localStorage
 * Returns ENCRYPTED data (still encrypted, frontend cannot decrypt)
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @returns {string|null} Encrypted data (base64) or null
 */
export const retrieveEncryptedSubmissionAsymmetric = (contestId, problemIndex) => {
  try {
    const storageKey = `contest_${contestId}_submission_${problemIndex}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    const payload = JSON.parse(stored);

    // Return encrypted data (NOT decrypted)
    return payload.data;
  } catch (error) {
    console.error('Error retrieving encrypted submission:', error);
    return null;
  }
};

/**
 * Get all encrypted submissions for final submission
 * Returns array of ENCRYPTED strings (not decrypted)
 * Backend will decrypt with private key
 * @param {string} contestId - Contest ID
 * @param {number} problemCount - Number of problems
 * @returns {Array<string>} Array of encrypted submissions (base64)
 */
export const getAllEncryptedSubmissions = (contestId, problemCount) => {
  const encryptedSubmissions = [];

  for (let idx = 0; idx < problemCount; idx++) {
    const encrypted = retrieveEncryptedSubmissionAsymmetric(contestId, idx);
    if (encrypted) {
      encryptedSubmissions.push(encrypted);
    }
  }

  console.log(`✓ Retrieved ${encryptedSubmissions.length} encrypted submissions (unreadable on client)`);

  return encryptedSubmissions;
};

/**
 * Retrieve plaintext summary for a submission (for UI display)
 * This does NOT contain code, only metadata for display purposes
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @returns {object|null} Summary object or null
 */
export const retrieveSubmissionSummary = (contestId, problemIndex) => {
  try {
    const summaryKey = `contest_${contestId}_summary_${problemIndex}`;
    const stored = localStorage.getItem(summaryKey);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error retrieving submission summary:', error);
    return null;
  }
};

/**
 * Get all submission summaries for UI display
 * @param {string} contestId - Contest ID
 * @param {number} problemCount - Number of problems
 * @returns {object} Map of problemIndex -> summary
 */
export const getAllSubmissionSummaries = (contestId, problemCount) => {
  const summaries = {};

  for (let idx = 0; idx < problemCount; idx++) {
    const summary = retrieveSubmissionSummary(contestId, idx);
    if (summary) {
      summaries[idx] = summary;
    }
  }

  return summaries;
};

/**
 * Save submission summary (for verified backend submissions - no encryption needed)
 * @param {string} contestId - Contest ID
 * @param {number} problemIndex - Problem index
 * @param {object} submissionData - Submission data
 */
export const saveSubmissionSummary = (contestId, problemIndex, submissionData) => {
  try {
    const summaryKey = `contest_${contestId}_summary_${problemIndex}`;
    const summary = {
      problemCode: submissionData.problemCode,
      problemTitle: submissionData.problemTitle,
      passedTests: submissionData.passedTests,
      totalTests: submissionData.totalTests,
      pointsEarned: submissionData.pointsEarned,
      maxPoints: submissionData.maxPoints,
      solved: submissionData.solved,
      timestamp: submissionData.timestamp,
      code: submissionData.code, // Include code for local reference
      language: submissionData.language
    };

    localStorage.setItem(summaryKey, JSON.stringify(summary));
    console.log(`✓ Submission ${problemIndex} saved locally (backend-verified)`);
  } catch (error) {
    console.error('Failed to save submission summary:', error);
    throw error;
  }
};

/**
 * Clear all submissions and summaries for a contest
 * @param {string} contestId - Contest ID
 * @param {number} problemCount - Number of problems
 */
export const clearAllSubmissions = (contestId, problemCount) => {
  for (let idx = 0; idx < problemCount; idx++) {
    const storageKey = `contest_${contestId}_submission_${idx}`;
    const summaryKey = `contest_${contestId}_summary_${idx}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(summaryKey);
  }
  console.log(`✓ Cleared all submissions for contest ${contestId}`);
};
