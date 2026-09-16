/**
 * Client-side image compression, used before uploading any user photo to
 * Supabase Storage. Keeps storage usage and transfer costs down without
 * a visible quality loss, since photos are downscaled to a sensible max
 * size and re-encoded as JPEG at a high quality setting.
 */

export type CompressImageOptions = {
  /** Longest side (px) the image is allowed to be after compression. */
  maxDimension?: number;
  /** JPEG quality, 0-1. */
  quality?: number;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Resizes and re-encodes an image file as JPEG. Falls back to the original
 * file if the browser can't decode the image, or if compression didn't
 * actually make the file smaller (e.g. it was already small/optimized).
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  // Skip formats compression wouldn't help with or could break (icons/animations).
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const newName = `${file.name.replace(/\.[^./\\]+$/, "")}.jpg`;
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
