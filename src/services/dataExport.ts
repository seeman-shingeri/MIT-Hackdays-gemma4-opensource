import type { CivicCase } from '../types/case';

/**
 * Converts civic cases into a formatted JSON string.
 */
export function exportCasesToJson(cases: CivicCase[]): string {
  return JSON.stringify(cases, null, 2);
}

/**
 * Converts civic cases into RFC 4180 compliant CSV format.
 */
export function exportCasesToCsv(cases: CivicCase[]): string {
  const headers = [
    'Case ID',
    'Title',
    'Category',
    'Severity',
    'Status',
    'Priority Score',
    'Campus Zone',
    'Landmark',
    'Created At',
    'Reported By',
    'Assigned To',
    'Resolved By',
    'Resolved At',
    'Evidence Count',
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = cases.map(c => [
    escapeCsv(c.id),
    escapeCsv(c.title),
    escapeCsv(c.category),
    escapeCsv(c.severity),
    escapeCsv(c.status),
    escapeCsv(c.priorityScore),
    escapeCsv(c.zone),
    escapeCsv(c.landmark),
    escapeCsv(c.createdAt),
    escapeCsv(c.createdByName || 'Legacy / Unrecorded'),
    escapeCsv(c.assignedTo || c.assignedTeam || 'Not assigned'),
    escapeCsv(c.resolvedBy || 'Not resolved'),
    escapeCsv(c.resolvedAt || ''),
    escapeCsv(c.evidence.length),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Triggers a browser file download.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
