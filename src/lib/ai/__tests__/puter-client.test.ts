/**
 * Tests for Puter.js client wrapper
 *
 * Mocks the global `window.puter` object to test availability detection,
 * error handling, and retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPuterAvailable,
  generateText,
  generateImage,
  generateVideo,
} from "../puter-client";

// ── Mocks ───────────────────────────────────────────────────────

function createMockPuter() {
  return {
    ai: {
      chat: vi.fn(),
      txt2img: vi.fn(),
      txt2vid: vi.fn(),
    },
  };
}

// ── Setup/Teardown ──────────────────────────────────────────────

describe("isPuterAvailable", () => {
  const originalWindow = global.window;

  afterEach(() => {
    // Restore window state
    if (global.window) {
      delete (global.window as unknown as Record<string, unknown>).puter;
    }
  });

  it("returns unavailable when window.puter is not defined", () => {
    delete (global.window as unknown as Record<string, unknown>).puter;

    const result = isPuterAvailable();
    expect(result.available).toBe(false);
    expect(result.aiAvailable).toBe(false);
    expect(result.reason).toContain("not loaded");
  });

  it("returns AI unavailable when puter exists but ai is missing", () => {
    (global.window as unknown as Record<string, unknown>).puter = {};

    const result = isPuterAvailable();
    expect(result.available).toBe(true);
    expect(result.aiAvailable).toBe(false);
    expect(result.reason).toContain("AI module not available");
  });

  it("returns fully available when puter.ai exists", () => {
    (global.window as unknown as Record<string, unknown>).puter = createMockPuter();

    const result = isPuterAvailable();
    expect(result.available).toBe(true);
    expect(result.aiAvailable).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe("generateText", () => {
  beforeEach(() => {
    (global.window as unknown as Record<string, unknown>).puter = createMockPuter();
  });

  afterEach(() => {
    delete (global.window as unknown as Record<string, unknown>).puter;
    vi.restoreAllMocks();
  });

  it("calls puter.ai.chat with the prompt", async () => {
    const mockPuter = window.puter!;
    const chatFn = vi.mocked(mockPuter.ai.chat);
    chatFn.mockResolvedValueOnce({
      message: { content: "Generated post content", role: "assistant" },
      finish_reason: "stop",
    });

    const result = await generateText("Write a post");

    expect(chatFn).toHaveBeenCalledOnce();
    expect(chatFn).toHaveBeenCalledWith("Write a post", expect.any(Object));
    expect(result.content).toBe("Generated post content");
  });

  it("returns the model name", async () => {
    const mockPuter = window.puter!;
    vi.mocked(mockPuter.ai.chat).mockResolvedValueOnce({
      message: { content: "Hello", role: "assistant" },
      finish_reason: "stop",
    });

    const result = await generateText("Hi", { model: "claude-sonnet" });

    expect(result.model).toBe("claude-sonnet");
  });

  it("throws when puter AI is not available", async () => {
    delete (global.window as unknown as Record<string, unknown>).puter;

    await expect(generateText("Hello")).rejects.toThrow("Puter AI not available");
  });

  it("retries on transient errors", async () => {
    const mockPuter = window.puter!;
    const chatFn = vi.mocked(mockPuter.ai.chat);

    chatFn
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce({
        message: { content: "Recovered content", role: "assistant" },
        finish_reason: "stop",
      });

    const result = await generateText("Hello", { maxRetries: 2 });

    expect(chatFn).toHaveBeenCalledTimes(2);
    expect(result.content).toBe("Recovered content");
  });

  it("does not retry on non-transient errors", async () => {
    const mockPuter = window.puter!;
    const chatFn = vi.mocked(mockPuter.ai.chat);

    chatFn.mockRejectedValueOnce(new Error("Invalid prompt format"));

    await expect(
      generateText("Hello", { maxRetries: 3 }),
    ).rejects.toThrow("Invalid prompt format");

    expect(chatFn).toHaveBeenCalledOnce();
  });

  it("throws after all retries are exhausted", async () => {
    const mockPuter = window.puter!;
    const chatFn = vi.mocked(mockPuter.ai.chat);

    chatFn
      .mockRejectedValueOnce(new Error("Server error"))
      .mockRejectedValueOnce(new Error("Server error"))
      .mockRejectedValueOnce(new Error("Server error"));

    await expect(
      generateText("Hello", { maxRetries: 2 }),
    ).rejects.toThrow("Server error");

    expect(chatFn).toHaveBeenCalledTimes(3);
  });
});

describe("generateImage", () => {
  beforeEach(() => {
    (global.window as unknown as Record<string, unknown>).puter = createMockPuter();
  });

  afterEach(() => {
    delete (global.window as unknown as Record<string, unknown>).puter;
    vi.restoreAllMocks();
  });

  it("calls puter.ai.txt2img and extracts src", async () => {
    const mockPuter = window.puter!;
    const txt2imgFn = vi.mocked(mockPuter.ai.txt2img);

    const mockImg = { src: "data:image/png;base64,abc123" } as HTMLImageElement;
    txt2imgFn.mockResolvedValueOnce(mockImg);

    const result = await generateImage("A beautiful sunset");

    expect(txt2imgFn).toHaveBeenCalledOnce();
    expect(result.imageDataUrl).toBe("data:image/png;base64,abc123");
  });

  it("throws when image src is empty", async () => {
    const mockPuter = window.puter!;
    const txt2imgFn = vi.mocked(mockPuter.ai.txt2img);

    const mockImg = { src: "" } as HTMLImageElement;
    txt2imgFn.mockResolvedValueOnce(mockImg);

    await expect(generateImage("A sunset")).rejects.toThrow(
      "returned no image data",
    );
  });

  it("throws when puter AI is not available", async () => {
    delete (global.window as unknown as Record<string, unknown>).puter;

    await expect(generateImage("A sunset")).rejects.toThrow(
      "Puter AI not available",
    );
  });

  it("retries on transient errors", async () => {
    const mockPuter = window.puter!;
    const txt2imgFn = vi.mocked(mockPuter.ai.txt2img);

    const mockImg = { src: "data:image/png;base64,ok" } as HTMLImageElement;
    txt2imgFn
      .mockRejectedValueOnce(new Error("Rate limit"))
      .mockResolvedValueOnce(mockImg);

    const result = await generateImage("A sunset", { maxRetries: 2 });
    expect(result.imageDataUrl).toBe("data:image/png;base64,ok");
    expect(txt2imgFn).toHaveBeenCalledTimes(2);
  });
});

describe("generateVideo", () => {
  beforeEach(() => {
    (global.window as unknown as Record<string, unknown>).puter = createMockPuter();
  });

  afterEach(() => {
    delete (global.window as unknown as Record<string, unknown>).puter;
    vi.restoreAllMocks();
  });

  it("calls puter.ai.txt2vid and extracts src", async () => {
    const mockPuter = window.puter!;
    const txt2vidFn = vi.mocked(mockPuter.ai.txt2vid);

    const mockVideo = {
      src: "blob:https://example.com/video-123",
    } as HTMLVideoElement;
    txt2vidFn.mockResolvedValueOnce(mockVideo);

    const result = await generateVideo("A coffee brewing process");

    expect(txt2vidFn).toHaveBeenCalledOnce();
    expect(result.videoUrl).toBe("blob:https://example.com/video-123");
  });

  it("throws when video src is empty", async () => {
    const mockPuter = window.puter!;
    const txt2vidFn = vi.mocked(mockPuter.ai.txt2vid);

    const mockVideo = { src: "" } as HTMLVideoElement;
    txt2vidFn.mockResolvedValueOnce(mockVideo);

    await expect(generateVideo("A video")).rejects.toThrow(
      "returned no video data",
    );
  });

  it("throws when puter AI is not available", async () => {
    delete (global.window as unknown as Record<string, unknown>).puter;

    await expect(generateVideo("A video")).rejects.toThrow(
      "Puter AI not available",
    );
  });
});
