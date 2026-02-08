import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Serve apple-touch-icon with no-cache so Safari always gets the naano logo.
 */
export async function GET() {
  const path = join(process.cwd(), "public", "apple-icon.png");
  const body = await readFile(path);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
