import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useOnlineStatus } from '../services/pwa';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function OnlineTestComponent({ onStatus }: { onStatus: (status: boolean) => void }) {
  const isOnline = useOnlineStatus();
  onStatus(isOnline);
  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
}

describe('pwa useOnlineStatus hook', () => {
  it('responds to browser online and offline events', async () => {
    let currentStatus = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<OnlineTestComponent onStatus={(s) => { currentStatus = s; }} />);
    });

    expect(currentStatus).toBe(true);

    // Trigger offline event
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(currentStatus).toBe(false);

    // Trigger online event
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(currentStatus).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
