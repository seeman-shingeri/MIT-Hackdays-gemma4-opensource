import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../utils/imageUtils';

describe('imageUtils file validation', () => {
  it('accepts valid JPEG, PNG, WebP and SVG files', () => {
    const jpeg = new File(['fake-bytes'], 'ramp.jpg', { type: 'image/jpeg' });
    const png = new File(['fake-bytes'], 'ramp.png', { type: 'image/png' });
    const webp = new File(['fake-bytes'], 'ramp.webp', { type: 'image/webp' });
    const svg = new File(['<svg></svg>'], 'ramp.svg', { type: 'image/svg+xml' });

    expect(validateImageFile(jpeg).valid).toBe(true);
    expect(validateImageFile(png).valid).toBe(true);
    expect(validateImageFile(webp).valid).toBe(true);
    expect(validateImageFile(svg).valid).toBe(true);
  });

  it('rejects unsupported file formats like pdf or text', () => {
    const pdf = new File(['fake-bytes'], 'document.pdf', { type: 'application/pdf' });
    const result = validateImageFile(pdf);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported format');
  });

  it('detects Apple HEIC/HEIF files and provides guidance', () => {
    const heic = new File(['fake-bytes'], 'IMG_1024.HEIC', { type: 'image/heic' });
    const result = validateImageFile(heic);

    expect(result.valid).toBe(false);
    expect(result.isHeic).toBe(true);
    expect(result.error).toContain('HEIC/HEIF');
  });

  it('rejects files larger than 20MB', () => {
    // 21 MB dummy file
    const bigFile = new File([new Uint8Array(21 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(bigFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds the 20MB limit');
  });
});
