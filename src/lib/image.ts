/**
 * Client-side image downscaling before a photo is stored.
 *
 * Dayprint keeps everything in localStorage, which has a ~5 MB budget, so an
 * untouched 8 MP phone photo would blow the quota after two uploads. This
 * resizes the long edge to 1200 px and re-encodes as JPEG q=0.8 (~80–120 KB).
 *
 * Was duplicated byte-for-byte in `TodayEditor.tsx` and `ExpandedMemory.tsx`.
 * The extracted version also fixes two silent-failure paths in the copies:
 * a `getContext("2d")` that returned null produced a blank white image with no
 * error, and a non-image file rejected with the browser's opaque `Event`
 * instead of a readable message.
 */

export const IMAGE_MAX_DIM = 1200;
export const IMAGE_QUALITY = 0.8;

export function compressImage(
  file: File,
  { maxDim = IMAGE_MAX_DIM, quality = IMAGE_QUALITY }: { maxDim?: number; quality?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`Not an image file: ${file.type || "unknown type"}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable — cannot compress image"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => reject(new Error("Image could not be decoded"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("File could not be read"));
    reader.readAsDataURL(file);
  });
}
