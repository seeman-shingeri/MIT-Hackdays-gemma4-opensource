import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueOfflineMutation,
  getOfflineQueue,
  removeOfflineMutation,
  clearOfflineQueue,
  processOfflineQueue,
  registerAutoSyncOnOnline,
} from '../services/offlineQueue';

describe('offlineQueue service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('enqueues mutations and persists them to localStorage', () => {
    expect(getOfflineQueue()).toHaveLength(0);

    const mutation = enqueueOfflineMutation('SAVE_CASE', { id: 'CIV-TEST', title: 'Pothole' });
    expect(mutation.id).toBeDefined();
    expect(mutation.type).toBe('SAVE_CASE');
    expect(mutation.retryCount).toBe(0);

    const stored = getOfflineQueue();
    expect(stored).toHaveLength(1);
    expect((stored[0].payload as { id: string }).id).toBe('CIV-TEST');
  });

  it('removes individual mutations by id', () => {
    const m1 = enqueueOfflineMutation('SAVE_CASE', { id: 'CASE-1' });
    const m2 = enqueueOfflineMutation('STATUS_UPDATE', { id: 'CASE-2' });

    expect(getOfflineQueue()).toHaveLength(2);

    removeOfflineMutation(m1.id);
    const updated = getOfflineQueue();
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(m2.id);
  });

  it('clears all mutations', () => {
    enqueueOfflineMutation('SAVE_CASE', { id: 'CASE-1' });
    enqueueOfflineMutation('RATE_REPORT', { id: 'CASE-2' });
    expect(getOfflineQueue()).toHaveLength(2);

    clearOfflineQueue();
    expect(getOfflineQueue()).toHaveLength(0);
  });

  it('processes mutations: successfully processed items are cleared, failed items are retained with incremented retry count', async () => {
    enqueueOfflineMutation('SAVE_CASE', { id: 'SUCCESS-1' });
    enqueueOfflineMutation('STATUS_UPDATE', { id: 'FAIL-1' });

    const result = await processOfflineQueue(async (mutation) => {
      const payload = mutation.payload as { id: string };
      return payload.id.startsWith('SUCCESS');
    });

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(1);

    const remaining = getOfflineQueue();
    expect(remaining).toHaveLength(1);
    expect((remaining[0].payload as { id: string }).id).toBe('FAIL-1');
    expect(remaining[0].retryCount).toBe(1);
  });

  it('triggers auto-sync when online window event fires', async () => {
    enqueueOfflineMutation('SAVE_CASE', { id: 'SUCCESS-ONLINE' });
    
    const handler = vi.fn().mockResolvedValue(true);
    const cleanup = registerAutoSyncOnOnline(handler);

    window.dispatchEvent(new Event('online'));

    // Wait for microtask queue
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(getOfflineQueue()).toHaveLength(0);

    cleanup();
  });
});
