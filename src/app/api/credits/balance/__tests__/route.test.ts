import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSession, createMockNextRequest } from '@/test/api-test-utils';

// ── Mocks ──────────────────────────────────────────────────────────

const mockGetServerSession = vi.fn();
vi.mock('@/lib/auth-session', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/db', () => ({
  db: { select: (...args: unknown[]) => mockSelect(...args) },
}));

vi.mock('@/db/schema', () => ({
  organizationMember: Symbol('organizationMember'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ _op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ _op: 'and', args })),
}));

const mockGetBalance = vi.fn();
vi.mock('@/lib/credits', () => ({
  getBalance: (...args: unknown[]) => mockGetBalance(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Import after mocks ──

import { GET } from '../route';

// ── Helpers ──

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/credits/balance');
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }
  return createMockNextRequest('GET', url.toString());
}

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();

  // Default: user is a member of the org
  mockLimit.mockResolvedValue([{ userId: 'test-user-1', orgId: 'org-1' }]);
});

// ── Tests ──

describe('GET /api/credits/balance', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 when orgId query param is missing', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('orgId');
  });

  it('returns 403 when user is not a member of the org', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockResolvedValue([]); // no membership

    const res = await GET(makeRequest({ orgId: 'org-other' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Forbidden');
  });

  it('returns 200 with balance on success', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockGetBalance.mockResolvedValue({ credits: 150, bonusCredits: 10 });

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.credits).toBe(150);
    expect(body.bonusCredits).toBe(10);
  });

  it('calls getBalance with the correct orgId', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockGetBalance.mockResolvedValue({ credits: 0 });

    await GET(makeRequest({ orgId: 'org-42' }));

    expect(mockGetBalance).toHaveBeenCalledWith('org-42');
  });

  it('verifies org membership for the authenticated user', async () => {
    const session = mockSession({ user: { id: 'usr-abc' } });
    mockGetServerSession.mockResolvedValue(session);
    mockGetBalance.mockResolvedValue({ credits: 0 });

    await GET(makeRequest({ orgId: 'org-1' }));

    // select chain was invoked
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('returns 500 when getBalance throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockGetBalance.mockRejectedValue(new Error('DB down'));

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch credit balance');
  });

  it('returns 500 when membership query throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockRejectedValue(new Error('DB connection lost'));

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch credit balance');
  });
});
