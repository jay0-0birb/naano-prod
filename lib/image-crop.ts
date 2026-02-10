import type { Area } from "react-easy-crop";

// Utility to create a cropped image blob from a source image and crop area.
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area | null,
  mimeType: string = "image/png",
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

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
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
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, mimeType);
  });
}

