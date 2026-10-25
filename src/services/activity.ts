import type { ReportActivityItem, ActivityActionType } from '../types/reputation';
import type { UserAccount } from '../types/auth';

const STORAGE_ACTIVITY_KEY = 'repair_ai_activity_v2';

export function loadAllActivities(): ReportActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActivities(items: ReportActivityItem[]): void {
  try {
    localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save activity log:', err);
  }
}

/**
 * Appends an immutable activity record to the audit trail.
 * Audit records persist even if a report is later removed from active listings.
 */
export function logActivity(
  actionType: ActivityActionType,
  reportId: string,
  actor: UserAccount | null,
  details: string,
  metadata?: Record<string, unknown>
): ReportActivityItem {
  const item: ReportActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reportId,
    actorId: actor?.id || 'SYSTEM',
    actorName: actor?.displayName || 'System / Field Service',
    actorRole: actor?.role || 'SYSTEM',
    actionType,
    details,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const current = loadAllActivities();
  const updated = [item, ...current];
  saveActivities(updated);

  return item;
}

/**
 * Retrieves all activity history specifically associated with a report ID.
 */
export function getActivitiesForReport(reportId: string): ReportActivityItem[] {
  const all = loadAllActivities();
  return all.filter(a => a.reportId === reportId);
}

/**
 * Retrieves recent activity across the entire system.
 */
export function getRecentActivities(limit = 20): ReportActivityItem[] {
  const all = loadAllActivities();
  return all.slice(0, limit);
}
