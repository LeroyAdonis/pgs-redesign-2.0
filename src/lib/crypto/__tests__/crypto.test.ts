/**
 * Tests for AES-256-GCM encryption/decryption utilities.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// We need to set the env var before importing the module
const TEST_KEY = "a".repeat(64); // 32 bytes as hex

describe("crypto", () => {
  let encrypt: (plaintext: string) => string;
  let decrypt: (ciphertext: string) => string;

  beforeEach(async () => {
    vi.stubEnv("ENCRYPTION_KEY", TEST_KEY);
    // Re-import to pick up the env var
    const mod = await import("../crypto");
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts and decrypts a simple string", () => {
    const plaintext = "hello world";
    const ciphertext = encrypt(plaintext);
    const result = decrypt(ciphertext);
    expect(result).toBe(plaintext);
  });

  it("encrypts and decrypts an OAuth token", () => {
    const token =
      "EAABsbCS0ZBYEBAI6ZCe6N5ZBzk0H1c6ZBZCqWZBZA7Q3ZBiVZCgW9h0fZBmNZB";
    const ciphertext = encrypt(token);
    const result = decrypt(ciphertext);
    expect(result).toBe(token);
  });

  it("produces base64-encoded output", () => {
    const ciphertext = encrypt("test");
    // Base64 characters: A-Z, a-z, 0-9, +, /, =
    expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("produces different ciphertext for same plaintext (unique IV)", () => {
    const plaintext = "same input every time";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);

    // Both decrypt to same value
    expect(decrypt(c1)).toBe(plaintext);
    expect(decrypt(c2)).toBe(plaintext);
  });

  it("handles empty string", () => {
    const ciphertext = encrypt("");
    const result = decrypt(ciphertext);
    expect(result).toBe("");
  });

  it("handles unicode text", () => {
    const plaintext = "🇿🇦 Mzansi 🔥 Eish! Ñoño";
    const ciphertext = encrypt(plaintext);
    const result = decrypt(ciphertext);
    expect(result).toBe(plaintext);
  });

  it("handles long strings", () => {
    const plaintext = "x".repeat(10000);
    const ciphertext = encrypt(plaintext);
    const result = decrypt(ciphertext);
    expect(result).toBe(plaintext);
  });

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("sensitive data");
    const tampered = ciphertext.slice(0, -4) + "XXXX";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on invalid base64 input", () => {
    expect(() => decrypt("not-valid-at-all!!!")).toThrow();
  });

  it("throws on too-short ciphertext", () => {
    // Less than IV (12) + auth tag (16) = 28 bytes
    const short = Buffer.alloc(10).toString("base64");
    expect(() => decrypt(short)).toThrow(
      "Invalid ciphertext: too short to contain IV and auth tag.",
    );
  });

  it("throws when ENCRYPTION_KEY is missing", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    const mod = await import("../crypto");
    expect(() => mod.encrypt("test")).toThrow("ENCRYPTION_KEY is not set");
  });

  it("throws when ENCRYPTION_KEY is wrong length", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "abcdef"); // too short
    const mod = await import("../crypto");
    expect(() => mod.encrypt("test")).toThrow("64 hex characters");
  });

  it("throws when ENCRYPTION_KEY has invalid characters", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "g".repeat(64)); // 'g' is not hex
    const mod = await import("../crypto");
    expect(() => mod.encrypt("test")).toThrow("hexadecimal");
  });

  it("cannot decrypt with a different key", async () => {
    const ciphertext = encrypt("secret");

    // Change the key
    vi.stubEnv("ENCRYPTION_KEY", "b".repeat(64));
    const mod = await import("../crypto");

    expect(() => mod.decrypt(ciphertext)).toThrow();
  });
});
