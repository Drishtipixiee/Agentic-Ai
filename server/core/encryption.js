/**
 * AES-256-GCM Field-Level Encryption for PHI
 * Uses Node.js built-in crypto module
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.PHI_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const KEY = Buffer.from(KEY_HEX, 'hex');

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Encode as base64: iv:authTag:ciphertext
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decrypt(encryptedStr) {
  try {
    const [ivB64, authTagB64, encryptedB64] = encryptedStr.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Sanitise a vitals record — encrypt PHI fields, return safe abstraction
 * for downstream agents
 */
export function sanitise(rawRecord) {
  return {
    patientIdEncrypted: rawRecord.patientId ? encrypt(rawRecord.patientId) : undefined,
    nameEncrypted: rawRecord.name ? encrypt(rawRecord.name) : undefined,
    dobEncrypted: rawRecord.dob ? encrypt(rawRecord.dob) : undefined,
    // Safe fields passed through
    rr: rawRecord.rr,
    spo2: rawRecord.spo2,
    sysBP: rawRecord.sysBP,
    hr: rawRecord.hr,
    consciousness: rawRecord.consciousness,
    temp: rawRecord.temp,
    rrIntervals: rawRecord.rrIntervals,
    timestamp: rawRecord.timestamp,
    scenario: rawRecord.scenario,
  };
}
