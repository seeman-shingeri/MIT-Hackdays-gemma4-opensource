import { describe, it, expect } from 'vitest';
import { loadCases, saveOrUpdateCase, getDemoMode, setDemoMode } from '../services/storage';
import { findDuplicatesForReport } from '../services/duplicateMatching';
import type { CivicCase } from '../types/case';

describe('Mobile Workflows & Verification Suite', () => {
  it('persists newly created mobile case to LocalStorage and reloads accurately', () => {
    const testCase: CivicCase = {
      id: 'CIV-TEST-MOBILE-1',
      title: 'Cracked Curb Ingress',
      category: 'Accessibility',
      severity: 'High',
      status: 'REPORTED',
      zone: 'North Quad',
      landmark: 'North Gate Curb Cut',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [
        {
          id: 'EV-M-1',
          reportId: 'REP-M-1',
          reporterLabel: 'Mobile Student Inspector',
          imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
          timestamp: new Date().toISOString(),
          description: 'Curb cut fractured with vertical lip exceeding 0.5 inches.',
          zone: 'North Quad',
          landmark: 'North Gate',
          isPrimary: true,
        },
      ],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 88,
    };

    saveOrUpdateCase(testCase);
    const reloadedCases = loadCases();
    const found = reloadedCases.find(c => c.id === 'CIV-TEST-MOBILE-1');

    expect(found).toBeDefined();
    expect(found?.title).toBe('Cracked Curb Ingress');
    expect(found?.zone).toBe('North Quad');
  });

  it('runs offline demo mode and duplicate clustering without requiring API keys', () => {
    setDemoMode(true);
    expect(getDemoMode()).toBe(true);

    const cases = loadCases();
    const report = {
      zone: cases[0].zone,
      category: cases[0].category,
      description: 'Wheelchair ramp fracture with concrete displacement',
      landmark: cases[0].landmark,
      title: 'Broken accessibility ramp',
    };

    const duplicates = findDuplicatesForReport(report, cases, 70);
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].targetCaseId).toBe(cases[0].id);
    expect(duplicates[0].totalScore).toBeGreaterThanOrEqual(70);
  });
});
