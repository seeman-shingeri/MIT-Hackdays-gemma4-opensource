import { describe, it, expect } from 'vitest';
import { 
  validateImageFile, 
  formatFileSize, 
  calculateCompressionSavings, 
  calculateDimensionsFit 
} from '../utils/imageUtils';

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

describe('imageUtils formatting and dimension calculation', () => {
  it('formats bytes into readable size strings', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  it('calculates compression savings percentage accurately', () => {
    const { savedBytes, savingsPercent } = calculateCompressionSavings(1000, 250);
    expect(savedBytes).toBe(750);
    expect(savingsPercent).toBe(75);

    const noSavings = calculateCompressionSavings(100, 150);
    expect(noSavings.savedBytes).toBe(0);
    expect(noSavings.savingsPercent).toBe(0);
  });

  it('scales dimensions preserving aspect ratio without distortion', () => {
    // 4000x3000 landscape scaled to 1600 max
    const landscape = calculateDimensionsFit(4000, 3000, 1600);
    expect(landscape.width).toBe(1600);
    expect(landscape.height).toBe(1200);
    expect(landscape.scaled).toBe(true);

    // 3000x4000 portrait scaled to 1600 max
    const portrait = calculateDimensionsFit(3000, 4000, 1600);
    expect(portrait.width).toBe(1200);
    expect(portrait.height).toBe(1600);
    expect(portrait.scaled).toBe(true);

    // Already smaller than max
    const small = calculateDimensionsFit(800, 600, 1600);
    expect(small.width).toBe(800);
    expect(small.height).toBe(600);
    expect(small.scaled).toBe(false);
  });
});
