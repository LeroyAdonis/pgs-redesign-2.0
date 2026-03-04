/**
 * POST /api/support/ticket — Submit a support ticket
 *
 * Creates a notification record of type "system" representing the ticket.
 * Requires authentication because the notification table has a NOT NULL
 * userId foreign key. Unauthenticated users are directed to email
 * support@purpleglow.co.za instead.
 *
 * Rate-limited to 5 requests per minute per user session.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { sanitizeText } from "@/lib/security/sanitize";
import { createRateLimiter } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface TicketSuccessResponse {
  success: true;
  ticketId: string;
}

interface TicketErrorResponse {
  success: false;
  error: string;
}

type TicketResponse = TicketSuccessResponse | TicketErrorResponse;

// ---------------------------------------------------------------------------
// Request body
// ---------------------------------------------------------------------------

interface TicketRequestBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}

// ---------------------------------------------------------------------------
// Rate limiting — 5 tickets / minute per user
// ---------------------------------------------------------------------------

const rateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Basic email regex — intentionally simple, not RFC-5322 compliant. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBody(body: TicketRequestBody): string | null {
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return "name is required and must be a non-empty string";
  }

  if (typeof body.email !== "string" || !EMAIL_RE.test(body.email)) {
    return "A valid email address is required";
  }

  if (typeof body.message !== "string" || body.message.trim().length < 10) {
    return "message is required and must be at least 10 characters";
  }

  return null;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<TicketResponse>> {
  try {
    // --- Auth check (required — notification.userId is NOT NULL) ---
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required to submit a support ticket. " +
            "Please log in, or email support@purpleglow.co.za directly.",
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // --- Rate limit ---
    if (!rateLimiter.check(userId).allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many support tickets. Please wait a minute before trying again.",
        },
        { status: 429 },
      );
    }

    // --- Parse & validate body ---
    const body = (await request.json()) as TicketRequestBody;
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    // Sanitize user inputs at the API boundary before DB insertion
    const name = sanitizeText(body.name);
    const email = sanitizeText(body.email);
    const message = sanitizeText(body.message);

    // --- Insert notification as support ticket ---
    const [inserted] = await db
      .insert(notification)
      .values({
        userId,
        type: "system",
        title: "Support Ticket",
        message,
        data: {
          type: "support_ticket",
          name,
          email,
          source: "chatbot",
        },
      })
      .returning({ id: notification.id });

    if (!inserted) {
      throw new Error("Notification insert returned no rows");
    }

    logger.info("Support ticket created", {
      ticketId: inserted.id,
      userId,
    });

    return NextResponse.json(
      { success: true, ticketId: inserted.id },
      { status: 201 },
    );
  } catch (error) {
    logger.error("POST /api/support/ticket failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to submit support ticket" },
      { status: 500 },
    );
  }
}
