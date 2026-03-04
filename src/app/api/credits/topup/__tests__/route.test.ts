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

const mockGetTopUpPackageByCreditAmount = vi.fn();
vi.mock('@/lib/payments/tier-config', () => ({
  getTopUpPackageByCreditAmount: (...args: unknown[]) =>
    mockGetTopUpPackageByCreditAmount(...args),
}));

const mockCreateTopUpCheckout = vi.fn();
vi.mock('@/lib/payments/topup-service', () => ({
  createTopUpCheckout: (...args: unknown[]) =>
    mockCreateTopUpCheckout(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Import after mocks ──

import { POST } from '../route';

// ── Helpers ──

const BASE_URL = 'http://localhost:3000/api/credits/topup';

function makeRequest(body: unknown) {
  return createMockNextRequest('POST', BASE_URL, body);
}

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();

  // Default: user has an org membership
  mockLimit.mockResolvedValue([{ userId: 'test-user-1', orgId: 'org-1' }]);

  // Default: valid package
  mockGetTopUpPackageByCreditAmount.mockReturnValue({
    credits: 100,
    priceZar: 9900,
    stripePriceId: 'price_test_100',
  });

  // Default: successful checkout
  mockCreateTopUpCheckout.mockResolvedValue({
    success: true,
    checkoutUrl: 'https://checkout.stripe.com/session-123',
  });
});

// ── Tests ──

describe('POST /api/credits/topup', () => {
  // ── Auth ──

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  // ── Validation ──

  it('returns 400 when creditAmount is missing', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('creditAmount');
  });

  it('returns 400 when creditAmount is not a number', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await POST(makeRequest({ creditAmount: 'one hundred' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('creditAmount');
  });

  it('returns 400 when creditAmount is NaN', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await POST(makeRequest({ creditAmount: NaN }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when creditAmount is Infinity', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await POST(makeRequest({ creditAmount: Infinity }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when creditAmount has no matching package', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockGetTopUpPackageByCreditAmount.mockReturnValue(null);

    const res = await POST(makeRequest({ creditAmount: 999 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('no matching package');
  });

  // ── Authorization ──

  it('returns 403 when user has no organization membership', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockResolvedValue([]); // no membership

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain('organization membership');
  });

  // ── Success ──

  it('returns 200 with checkoutUrl on success', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.checkoutUrl).toBe('https://checkout.stripe.com/session-123');
  });

  it('passes correct arguments to createTopUpCheckout', async () => {
    const session = mockSession({
      user: { id: 'user-checkout', email: 'buyer@example.com' },
    });
    mockGetServerSession.mockResolvedValue(session);
    mockLimit.mockResolvedValue([{ userId: 'user-checkout', orgId: 'org-pay' }]);

    await POST(makeRequest({ creditAmount: 100 }));

    expect(mockCreateTopUpCheckout).toHaveBeenCalledWith(
      'org-pay',         // orgId from membership
      'user-checkout',   // session.user.id
      'buyer@example.com', // session.user.email
      100,               // creditAmount
    );
  });

  // ── Service errors ──

  it('returns 500 when createTopUpCheckout returns failure', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockCreateTopUpCheckout.mockResolvedValue({
      success: false,
      error: 'Stripe API error',
    });

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Stripe API error');
  });

  it('returns 500 when createTopUpCheckout throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockCreateTopUpCheckout.mockRejectedValue(new Error('Network timeout'));

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create top-up checkout');
  });

  it('returns 500 when membership query throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession());
    mockLimit.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest({ creditAmount: 100 }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create top-up checkout');
  });
});
