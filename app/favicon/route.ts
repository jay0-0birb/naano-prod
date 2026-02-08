import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Serve favicon with no-cache so Safari (and others) always get the naano logo
 * instead of a cached default triangle.
 */
export async function GET() {
  const path = join(process.cwd(), "public", "favicon.ico");
  const body = await readFile(path);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
