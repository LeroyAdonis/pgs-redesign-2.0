import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

const mockGetServerSession = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/lib/auth-session', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  notification: Symbol('notification'),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockRateLimitCheck = vi.fn();

vi.mock('@/lib/security/rate-limit', () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    reset: vi.fn(),
  }),
}));

vi.mock('@/lib/security/sanitize', () => ({
  sanitizeText: (input: unknown) =>
    typeof input === 'string' ? input.trim() : '',
}));

// ── Import after mocks ──

import { POST } from '../route';

// ── Helpers ──

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/support/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();

  // Default: rate limiter allows requests
  mockRateLimitCheck.mockReturnValue({ allowed: true, remaining: 4, resetAt: new Date() });

  // Default: chain insert → values → returning
  mockReturning.mockResolvedValue([{ id: 'test-notification-id' }]);
  mockValues.mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValues });
});

// ── Tests ──

describe('POST /api/support/ticket', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({
      name: 'Test',
      email: 'test@example.com',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Authentication required');
  });

  it('returns 400 for missing name field', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const req = makeRequest({
      email: 'test@example.com',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('name');
  });

  it('returns 400 for missing email field', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const req = makeRequest({
      name: 'Test',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('email');
  });

  it('returns 400 for invalid email', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const req = makeRequest({
      name: 'Test',
      email: 'not-an-email',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('email');
  });

  it('returns 400 for message too short (< 10 chars)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const req = makeRequest({
      name: 'Test',
      email: 'test@example.com',
      message: 'Short',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('10 characters');
  });

  it('returns 201 with ticketId on success', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-success' },
    });

    const req = makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message for support',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.ticketId).toBe('test-notification-id');
  });

  it('saves notification to database with correct data', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-db-check' },
    });

    const req = makeRequest({
      name: '  John Doe  ',
      email: 'john@example.com',
      message: '  Please help me with my account settings  ',
    });

    await POST(req);

    // Verify insert was called
    expect(mockInsert).toHaveBeenCalledTimes(1);

    // Verify values were passed with trimmed data
    expect(mockValues).toHaveBeenCalledWith({
      userId: 'user-db-check',
      type: 'system',
      title: 'Support Ticket',
      message: 'Please help me with my account settings',
      data: {
        type: 'support_ticket',
        name: 'John Doe',
        email: 'john@example.com',
        source: 'chatbot',
      },
    });

    // Verify returning was called
    expect(mockReturning).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when database insert fails', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-error' },
    });

    mockReturning.mockRejectedValue(new Error('DB connection failed'));

    const req = makeRequest({
      name: 'Test',
      email: 'test@example.com',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to submit support ticket');
  });

  it('returns 400 for empty name string', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const req = makeRequest({
      name: '   ',
      email: 'test@example.com',
      message: 'This is a valid test message',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('name');
  });
});
