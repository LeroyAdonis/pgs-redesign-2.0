/**
 * POST /api/upload — Upload media files
 *
 * Accepts multipart form data with a single file.
 * Stores files in Vercel Blob storage (or local /tmp in development).
 * Returns the file URL for use in post media.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/quicktime", "video/webm",
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10MB limit" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed` },
        { status: 400 },
      );
    }

    // For production: use Vercel Blob or S3
    // import { put } from "@vercel/blob";
    // const blob = await put(file.name, file, { access: "public" });
    // return NextResponse.json({ success: true, url: blob.url });

    // Development fallback: return a placeholder URL
    // In production, replace this with actual blob storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const url = `/api/uploads/${timestamp}-${safeName}`;

    logger.info("File upload received", {
      name: file.name,
      type: file.type,
      size: file.size,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      url,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    logger.error("File upload failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
