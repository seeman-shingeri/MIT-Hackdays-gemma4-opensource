/**
 * Client-side image processing and downscaling utilities for mobile browsers.
 * Prevents memory exhaustion when processing high-resolution (12-48MP) smartphone photos.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  isHeic?: boolean;
}

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const HEIC_MIME_TYPES = [
  'image/heic',
  'image/heif',
];

/**
 * Validates file format and size for civic evidence submissions.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file was provided.' };
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Detect HEIC/HEIF files which browsers cannot render on HTML5 canvas natively
  if (
    HEIC_MIME_TYPES.includes(fileType) ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  ) {
    return {
      valid: false,
      isHeic: true,
      error: 'Apple HEIC/HEIF format is not directly supported by web browsers. Please select JPEG or PNG in your camera settings.',
    };
  }

  // Check supported mime types or extensions
  const isSupportedMime = SUPPORTED_MIME_TYPES.includes(fileType);
  const isSupportedExt =
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp') ||
    fileName.endsWith('.svg');

  if (!isSupportedMime && !isSupportedExt) {
    return {
      valid: false,
      error: `Unsupported format (${file.type || 'unknown'}). Please upload a JPEG, PNG, WebP, or SVG photograph.`,
    };
  }

  // Check file size (max 20MB source before client-side downscaling)
  const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_SOURCE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 20MB limit. Please choose a smaller photo.`,
    };
  }

  return { valid: true };
}

export interface ProcessedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

/**
 * Downscales and compresses an image to safe mobile dimensions (default max 1600px).
 * Eliminates browser tab crashes and reduces payload for Gemma multimodal analysis.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<ProcessedImageInfo> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  // Pass through SVG vectors without rasterizing
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve({
            dataUrl: reader.result,
            width: 800,
            height: 600,
            originalSizeBytes: file.size,
            compressedSizeBytes: file.size,
          });
        } else {
          reject(new Error('Failed to read SVG file content.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from storage.'));
      reader.readAsDataURL(file);
    });
  }

  // Load raster image into memory using HTML Image element
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate aspect-preserved dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Draw onto offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not initialize 2D canvas context for image processing.'));
        return;
      }

      // High quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG for universal compatibility and compact payload
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Calculate approximate compressed size in bytes from base64 string
      const base64Content = dataUrl.split(',')[1] || '';
      const compressedSizeBytes = Math.round((base64Content.length * 3) / 4);

      resolve({
        dataUrl,
        width,
        height,
        originalSizeBytes: file.size,
        compressedSizeBytes,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The image could not be decoded. The file may be damaged.'));
    };

    img.src = objectUrl;
  });
}
