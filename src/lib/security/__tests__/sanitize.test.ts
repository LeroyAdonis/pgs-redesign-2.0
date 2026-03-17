import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeHtml } from "../sanitize";

// ---------------------------------------------------------------------------
// sanitizeText — strips ALL HTML, returns plain text
// ---------------------------------------------------------------------------

describe("sanitizeText", () => {
  it("strips <script> tags completely", () => {
    const input = 'Hello<script>alert("xss")</script>World';
    expect(sanitizeText(input)).toBe("HelloWorld");
  });

  it("strips event handler attributes (onclick, onerror)", () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    expect(sanitizeText(input)).toBe("Click me");
  });

  it("strips XSS payload: <img src=x onerror=alert(1)>", () => {
    const input = 'Before<img src=x onerror="alert(1)">After';
    expect(sanitizeText(input)).toBe("BeforeAfter");
  });

  it("strips nested script injection", () => {
    // DOMPurify parses as HTML first: `<scr` is text, `<script>...</script>` is
    // stripped, leaving residual text fragments — but no executable code survives.
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const result = sanitizeText(input);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("</script");
  });

  it("strips svg/onload XSS vector", () => {
    // DOMPurify removes entire SVG elements (including child text) when
    // ALLOWED_TAGS is empty — this is correct security behavior.
    const input = '<svg onload="alert(1)">test</svg>';
    const result = sanitizeText(input);
    expect(result).not.toContain("<svg");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("alert");
  });

  it("strips javascript: protocol in href", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    expect(sanitizeText(input)).toBe("click");
  });

  it("strips iframe injection", () => {
    const input = '<iframe src="https://evil.com"></iframe>Safe text';
    expect(sanitizeText(input)).toBe("Safe text");
  });

  it("preserves safe plain text unchanged", () => {
    const input = "Hello, this is a normal support message!";
    expect(sanitizeText(input)).toBe("Hello, this is a normal support message!");
  });

  it("preserves text with special characters", () => {
    // DOMPurify in text-only mode (ALLOWED_TAGS: []) returns decoded text
    // so & stays as & (not &amp;) since the output is plain text.
    const input = "Price is R50 & delivery is free! 100% guaranteed.";
    expect(sanitizeText(input)).toBe("Price is R50 & delivery is free! 100% guaranteed.");
  });

  it("preserves emoji and unicode", () => {
    const input = "Mzansi 🇿🇦 is lekker! Sawubona 🙏";
    expect(sanitizeText(input)).toBe("Mzansi 🇿🇦 is lekker! Sawubona 🙏");
  });

  it("trims surrounding whitespace", () => {
    const input = "   padded text   ";
    expect(sanitizeText(input)).toBe("padded text");
  });

  it("returns empty string for null input", () => {
    expect(sanitizeText(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(sanitizeText(undefined)).toBe("");
  });

  it("returns empty string for non-string input (number)", () => {
    expect(sanitizeText(42)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("handles string with only HTML tags (no text content)", () => {
    const input = "<div><span></span></div>";
    expect(sanitizeText(input)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// sanitizeHtml — allows safe HTML subset
// ---------------------------------------------------------------------------

describe("sanitizeHtml", () => {
  it("preserves safe tags: <b>, <i>, <em>, <strong>", () => {
    const input = "<b>bold</b> <i>italic</i> <em>em</em> <strong>strong</strong>";
    expect(sanitizeHtml(input)).toBe(
      "<b>bold</b> <i>italic</i> <em>em</em> <strong>strong</strong>",
    );
  });

  it("preserves safe tags: <a> with href", () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeHtml(input)).toBe('<a href="https://example.com">link</a>');
  });

  it("preserves safe tags: lists", () => {
    const input = "<ul><li>one</li><li>two</li></ul>";
    expect(sanitizeHtml(input)).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("strips <script> tags but keeps surrounding content", () => {
    const input = 'Hello<script>alert("xss")</script>World';
    expect(sanitizeHtml(input)).toBe("HelloWorld");
  });

  it("strips dangerous attributes from allowed tags", () => {
    const input = '<a href="https://safe.com" onclick="alert(1)">link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("https://safe.com");
    expect(result).not.toContain("onclick");
  });

  it("strips javascript: protocol from href", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript");
  });

  it("strips disallowed tags like <div>, <span>, <style>", () => {
    const input = "<div><span>text</span></div><style>body{}</style>";
    expect(sanitizeHtml(input)).toBe("text");
  });

  it("strips <img> with onerror XSS payload", () => {
    const input = '<img src=x onerror="alert(1)">text';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
    expect(result).toContain("text");
  });

  it("returns empty string for null input", () => {
    expect(sanitizeHtml(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(sanitizeHtml(undefined)).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeHtml(123)).toBe("");
  });
});
