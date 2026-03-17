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
  db: { select: () => mockSelect() },
}));

vi.mock('@/db/schema', () => ({
  organizationMember: Symbol('organizationMember'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ _op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ _op: 'and', args })),
}));

const mockGetTransactionHistory = vi.fn();
vi.mock('@/lib/credits', () => ({
  getTransactionHistory: (...args: unknown[]) =>
    mockGetTransactionHistory(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Import after mocks ──

import { GET } from '../route';

// ── Helpers ──

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/credits/transactions');
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }
  return createMockNextRequest('GET', url.toString());
}

const MOCK_TRANSACTIONS = [
  { id: 'tx-1', type: 'topup', amount: 100, createdAt: '2025-06-01T12:00:00Z' },
  { id: 'tx-2', type: 'usage', amount: -5, createdAt: '2025-06-01T13:00:00Z' },
];

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();

  // Default: user is a member of the org
  mockLimit.mockResolvedValue([{ userId: 'test-user-1', orgId: 'org-1' }]);

  // Default: return mock transactions
  mockGetTransactionHistory.mockResolvedValue(MOCK_TRANSACTIONS);
});

// ── Tests ──

describe('GET /api/credits/transactions', () => {
  // ── Auth ──

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  // ── Validation ──

  it('returns 400 when orgId query param is missing', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('orgId');
  });

  // ── Authorization ──

  it('returns 403 when user is not a member of the org', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockResolvedValue([]); // no membership

    const res = await GET(makeRequest({ orgId: 'org-other' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Forbidden');
  });

  // ── Success ──

  it('returns 200 with transactions on success', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.transactions).toEqual(MOCK_TRANSACTIONS);
  });

  // ── Pagination defaults ──

  it('uses default limit=20 and offset=0 when not provided', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    await GET(makeRequest({ orgId: 'org-1' }));

    expect(mockGetTransactionHistory).toHaveBeenCalledWith('org-1', {
      limit: 20,
      offset: 0,
    });
  });

  it('passes custom limit and offset', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    await GET(makeRequest({ orgId: 'org-1', limit: '50', offset: '10' }));

    expect(mockGetTransactionHistory).toHaveBeenCalledWith('org-1', {
      limit: 50,
      offset: 10,
    });
  });

  it('caps limit at 100', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    await GET(makeRequest({ orgId: 'org-1', limit: '200' }));

    expect(mockGetTransactionHistory).toHaveBeenCalledWith('org-1', {
      limit: 100,
      offset: 0,
    });
  });

  // ── Error handling ──

  it('returns 500 when getTransactionHistory throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockGetTransactionHistory.mockRejectedValue(new Error('Query failed'));

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch transaction history');
  });

  it('returns 500 when membership query throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockRejectedValue(new Error('Connection refused'));

    const res = await GET(makeRequest({ orgId: 'org-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch transaction history');
  });
});
