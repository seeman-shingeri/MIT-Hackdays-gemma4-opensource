import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ImageComparisonSlider } from '../components/ImageComparisonSlider';

// Configure React act environment for HappyDOM
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ImageComparisonSlider', () => {
  it('renders slider with accessibility attributes and 50% default', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ImageComparisonSlider
          beforeUrl="data:image/svg+xml;utf8,<svg></svg>"
          afterUrl="data:image/svg+xml;utf8,<svg></svg>"
        />
      );
    });

    const slider = container.querySelector('[role="slider"]');
    expect(slider).not.toBeNull();
    expect(slider?.getAttribute('aria-valuenow')).toBe('50');
    expect(slider?.getAttribute('aria-valuemin')).toBe('0');
    expect(slider?.getAttribute('aria-valuemax')).toBe('100');

    // ArrowLeft decreases by 5%
    await act(async () => {
      slider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(slider?.getAttribute('aria-valuenow')).toBe('45');

    // End jumps to 100%
    await act(async () => {
      slider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    expect(slider?.getAttribute('aria-valuenow')).toBe('100');

    // Home jumps to 0%
    await act(async () => {
      slider?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(slider?.getAttribute('aria-valuenow')).toBe('0');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
