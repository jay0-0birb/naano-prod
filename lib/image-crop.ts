import type { Area } from "react-easy-crop";

// Utility to create a cropped (and optionally downscaled) image blob
// from a source image and crop area.
// We default to JPEG with compression so avatars stay lightweight.
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area | null,
  mimeType: string = "image/jpeg",
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const crop: Area = pixelCrop ?? {
    x: 0,
    y: 0,
    width: image.width || 0,
    height: image.height || 0,
  };

  // Limit the output dimensions so the resulting file size stays small,
  // regardless of how large the original photo is.
  const MAX_OUTPUT_DIMENSION = 512;
  let outputWidth = crop.width;
  let outputHeight = crop.height;

  const largestSide = Math.max(outputWidth, outputHeight);
  if (largestSide > MAX_OUTPUT_DIMENSION && largestSide > 0) {
    const scale = MAX_OUTPUT_DIMENSION / largestSide;
    outputWidth = Math.round(outputWidth * scale);
    outputHeight = Math.round(outputHeight * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to get canvas context");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const quality =
    mimeType === "image/jpeg" || mimeType === "image/webp" ? 0.85 : undefined;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

