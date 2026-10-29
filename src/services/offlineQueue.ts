/**
 * Offline Mutation Queue and Reconnect Synchronization Service.
 * Queues critical actions (case updates, reports, ratings) while offline
 * and synchronizes with local storage/backends once network is restored.
 */

export type OfflineMutationType = 
  | 'SAVE_CASE' 
  | 'DELETE_CASE' 
  | 'STATUS_UPDATE' 
  | 'RATE_REPORT';

export interface OfflineMutation<T = unknown> {
  id: string;
  type: OfflineMutationType;
  payload: T;
  queuedAt: string;
  retryCount: number;
}

const OFFLINE_QUEUE_STORAGE_KEY = 'repair_ai_offline_mutation_queue_v1';

function generateQueueId(): string {
  return `MUT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getOfflineQueue(): OfflineMutation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[OfflineQueue] Failed to load offline queue from storage:', err);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineMutation[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[OfflineQueue] Failed to save offline queue to storage:', err);
  }
}

export function enqueueOfflineMutation<T>(type: OfflineMutationType, payload: T): OfflineMutation<T> {
  const queue = getOfflineQueue();
  const mutation: OfflineMutation<T> = {
    id: generateQueueId(),
    type,
    payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  queue.push(mutation as OfflineMutation);
  saveOfflineQueue(queue);
  return mutation;
}

export function removeOfflineMutation(id: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter(item => item.id !== id);
  saveOfflineQueue(updated);
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
  } catch (err) {
    console.warn('[OfflineQueue] Failed to clear offline queue:', err);
  }
}

export async function processOfflineQueue(
  executor: (mutation: OfflineMutation) => Promise<boolean> | boolean
): Promise<{ processed: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  const remaining: OfflineMutation[] = [];
  let processed = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      const success = await executor(mutation);
      if (success) {
        processed++;
      } else {
        failed++;
        remaining.push({
          ...mutation,
          retryCount: mutation.retryCount + 1,
        });
      }
    } catch {
      failed++;
      remaining.push({
        ...mutation,
        retryCount: mutation.retryCount + 1,
      });
    }
  }

  saveOfflineQueue(remaining);
  return { processed, failed };
}

/**
 * Registers a listener that triggers queue processing when the browser goes online.
 * Returns an unbind cleanup function.
 */
export function registerAutoSyncOnOnline(
  executor: (mutation: OfflineMutation) => Promise<boolean> | boolean
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    processOfflineQueue(executor).catch(err => {
      console.warn('[OfflineQueue] Auto-sync encountered error:', err);
    });
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
