/**
 * Input sanitization utilities for user-generated content.
 *
 * Uses DOMPurify (via isomorphic-dompurify) — the gold-standard XSS
 * prevention library — to sanitize inputs at the API boundary before
 * they reach the database.
 *
 * Two modes:
 *  - `sanitizeText()` — strips ALL HTML, returns plain text only
 *  - `sanitizeHtml()` — allows a safe HTML subset (bold, italic, links, lists)
 */

import DOMPurify from "isomorphic-dompurify";

// ---------------------------------------------------------------------------
// sanitizeText — strip ALL HTML, return plain text
// ---------------------------------------------------------------------------

/**
 * Strips all HTML tags and returns plain text.
 *
 * Use this for fields that should never contain HTML (names, emails,
 * plain-text messages, prompts, etc.).
 *
 * @param input - The raw user input string
 * @returns Sanitized plain text, or empty string for nullish/non-string input
 */
export function sanitizeText(input: unknown): string {
  if (input == null || typeof input !== "string") {
    return "";
  }

  // ALLOWED_TAGS: [] means strip every tag, leaving only text content
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

// ---------------------------------------------------------------------------
// sanitizeHtml — allow safe HTML subset
// ---------------------------------------------------------------------------

/** Tags considered safe for rich-text content. */
const SAFE_TAGS = [
  "b",
  "i",
  "em",
  "strong",
  "a",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
] as const;

/** Attributes allowed on safe tags. */
const SAFE_ATTRS = ["href", "target", "rel"] as const;

/**
 * Sanitizes HTML while preserving a safe subset of tags.
 *
 * Use this for fields that intentionally contain rich text (e.g. formatted
 * post content that will be rendered as HTML).
 *
 * @param input - The raw HTML string
 * @returns Sanitized HTML with only safe tags/attributes, or empty string
 */
export function sanitizeHtml(input: unknown): string {
  if (input == null || typeof input !== "string") {
    return "";
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...SAFE_TAGS],
    ALLOWED_ATTR: [...SAFE_ATTRS],
  }).trim();
}
