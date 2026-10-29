import { describe, it, expect } from 'vitest';
import { exportCasesToJson, exportCasesToCsv } from '../services/dataExport';
import type { CivicCase } from '../types/case';

describe('Municipal & Open-Source Data Export Service', () => {
  const sampleCases: CivicCase[] = [
    {
      id: 'CIV-TEST-EXPORT-1',
      title: 'Displaced Step Edge',
      category: 'Pedestrian Safety',
      severity: 'High',
      status: 'REPORTED',
      zone: 'North Quad',
      landmark: 'Main Quad Steps',
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 84,
      createdBy: 'usr_test_1',
      createdByName: 'Morgan Lee',
      assignedTeam: 'Facilities Dispatch',
    },
    {
      id: 'CIV-TEST-EXPORT-2',
      title: 'Flickering Exterior Bollard',
      category: 'Electrical',
      severity: 'Low',
      status: 'RESOLVED',
      zone: 'Main Library',
      landmark: 'Courtyard Path',
      createdAt: '2026-10-25T11:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z',
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 40,
      createdBy: 'usr_test_2',
      createdByName: 'Taylor Swift',
      resolvedBy: 'Technician Sam',
      resolvedAt: '2026-10-25T12:00:00.000Z',
    },
  ];

  it('exports civic cases to valid, parseable JSON', () => {
    const jsonStr = exportCasesToJson(sampleCases);
    const parsed = JSON.parse(jsonStr);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].id).toBe('CIV-TEST-EXPORT-1');
    expect(parsed[1].resolvedBy).toBe('Technician Sam');
  });

  it('exports civic cases to standard CSV with headers and escaped fields', () => {
    const csvStr = exportCasesToCsv(sampleCases);
    const lines = csvStr.split('\n');

    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[0]).toContain('Case ID,Title,Category,Severity,Status');
    expect(lines[1]).toContain('"CIV-TEST-EXPORT-1"');
    expect(lines[1]).toContain('"Displaced Step Edge"');
    expect(lines[1]).toContain('"Morgan Lee"');
    expect(lines[2]).toContain('"CIV-TEST-EXPORT-2"');
    expect(lines[2]).toContain('"Technician Sam"');
  });
});
