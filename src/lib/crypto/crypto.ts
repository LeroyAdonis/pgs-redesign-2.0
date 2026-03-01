/**
 * AES-256-GCM encryption utilities for OAuth token storage.
 *
 * Tokens are encrypted before being written to the database and
 * decrypted when needed for API calls. This ensures tokens at rest
 * are protected even if the database is compromised.
 *
 * Format: base64(iv || ciphertext || authTag)
 *   - IV:       12 bytes (96-bit, GCM recommended)
 *   - AuthTag:  16 bytes (128-bit)
 *   - The rest is ciphertext
 *
 * The ENCRYPTION_KEY env var must be a 64-character hex string
 * representing 32 bytes (256 bits).
 */

import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Resolve the 32-byte encryption key from the ENCRYPTION_KEY env var.
 *
 * Validates length and format — throws an actionable error if misconfigured.
 */
function getEncryptionKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;

  if (!hex) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with: " +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  if (hex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got ${hex.length} characters.`,
    );
  }

  if (!/^[0-9a-f]+$/i.test(hex)) {
    throw new Error("ENCRYPTION_KEY must contain only hexadecimal characters.");
  }

  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 *
 * @param plaintext - The string to encrypt (e.g., an OAuth access token)
 * @returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Pack: IV (12) || ciphertext (variable) || authTag (16)
  const packed = Buffer.concat([iv, encrypted, authTag]);

  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 *
 * @param ciphertext - Base64 string produced by `encrypt()`
 * @returns The original plaintext string
 * @throws If the ciphertext is tampered with or the key is wrong
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const packed = Buffer.from(ciphertext, "base64");

  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid ciphertext: too short to contain IV and auth tag.");
  }

  // Unpack: IV (12) || ciphertext (variable) || authTag (16)
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH, packed.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
