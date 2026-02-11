/**
 * Avatar/logo upload limits and server-side compression.
 * Used by dashboard settings and onboarding server actions.
 */
import sharp from "sharp";

/** Max size we accept for upload (10MB). Files larger are rejected. */
export const AVATAR_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/** Max dimension (width or height) for stored avatars; keeps files small. */
const AVATAR_MAX_DIMENSION = 512;
const AVATAR_JPEG_QUALITY = 85;

/**
 * Compress an image buffer for avatar/logo storage: resize to fit within
 * AVATAR_MAX_DIMENSION and encode as JPEG. Call from server actions only.
 */
export async function compressImageForAvatar(input: Buffer): Promise<Buffer> {
  try {
    const pipeline = sharp(input);
    const meta = await pipeline.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const maxSide = Math.max(w, h);
    const shouldResize = maxSide > AVATAR_MAX_DIMENSION && maxSide > 0;

    const out = shouldResize
      ? pipeline.resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        })
      : pipeline;
    return out.jpeg({ quality: AVATAR_JPEG_QUALITY }).toBuffer();
  } catch {
    return input;
  }
}
