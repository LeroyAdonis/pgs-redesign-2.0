/**
 * POST /api/brand/scan/preview — Preview brand analysis without saving
 *
 * Used during onboarding to show users what the brand analysis looks like.
 * Does NOT persist results to the database.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";
import { previewBrandAnalysis } from "@/lib/brand/profile-service";
import type { ScanPreviewRequest, ScanResponse } from "@/lib/brand/types";

export async function POST(request: Request): Promise<NextResponse<ScanResponse>> {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ScanPreviewRequest;

    if (!body.socialAccountId) {
      return NextResponse.json(
        { success: false, error: "socialAccountId is required" },
        { status: 400 },
      );
    }

    const result = await previewBrandAnalysis(body.socialAccountId);

    logger.info("Brand scan preview completed", {
      postsAnalyzed: result.postsAnalyzed,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error("Brand scan preview failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { success: false, error: "Preview failed" },
      { status: 500 },
    );
  }
}
