import { describe, it, expect } from 'vitest';
import { calculateDuplicateScore, findDuplicatesForReport, tokenizeText } from '../services/duplicateMatching';
import type { CivicCase } from '../types/case';

describe('duplicateMatching service', () => {
  const mockExistingCase: CivicCase = {
    id: 'CIV-8492-A',
    title: 'Damaged Concrete on Main Library Accessibility Ramp',
    category: 'Accessibility',
    severity: 'Critical',
    status: 'REPORTED',
    zone: 'Main Library',
    landmark: 'West Entrance Ramp facing quad',
    createdAt: '2026-10-25T09:14:00Z',
    updatedAt: '2026-10-25T09:14:00Z',
    priorityScore: 90,
    evidence: [
      {
        id: 'EV-1',
        reportId: 'REP-1',
        reporterLabel: 'Reporter 1',
        imageUrl: '',
        timestamp: '2026-10-25T09:14:00Z',
        description: 'Severe cracked concrete slab and loose handrail on the library ramp',
        zone: 'Main Library',
      },
    ],
    clarificationAnswers: [],
    mergeHistory: [],
  };

  it('tokenizes text and filters short tokens and stop words', () => {
    const tokens = tokenizeText('The broken ramp on the library entrance has severe cracking');
    expect(tokens.has('the')).toBe(false);
    expect(tokens.has('on')).toBe(false);
    expect(tokens.has('broken')).toBe(true);
    expect(tokens.has('ramp')).toBe(true);
    expect(tokens.has('library')).toBe(true);
    expect(tokens.has('cracking')).toBe(true);
  });

  it('scores 75+ for same zone, same category, and overlapping keywords', () => {
    const report = {
      zone: 'Main Library' as const,
      category: 'Accessibility' as const,
      description: 'Second report of concrete fracture and damaged ramp at library entrance',
      landmark: 'West ramp',
    };

    const result = calculateDuplicateScore(report, mockExistingCase);
    expect(result.zoneScore).toBe(40);
    expect(result.categoryScore).toBe(35);
    expect(result.keywordScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeGreaterThanOrEqual(75);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  it('scores low when zone and category do not match', () => {
    const report = {
      zone: 'Engineering Wing' as const,
      category: 'Electrical' as const,
      description: 'Exposed live wiring in junction box outside bay 3',
    };

    const result = calculateDuplicateScore(report, mockExistingCase);
    expect(result.zoneScore).toBe(0);
    expect(result.categoryScore).toBe(0);
    expect(result.isDuplicate).toBe(false);
    expect(result.totalScore).toBeLessThan(30);
  });

  it('finds duplicate cases meeting the 70% threshold', () => {
    const report = {
      zone: 'Main Library' as const,
      category: 'Accessibility' as const,
      description: 'Library ramp has deep cracks and exposed rebar',
    };

    const duplicates = findDuplicatesForReport(report, [mockExistingCase]);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].targetCaseId).toBe('CIV-8492-A');
  });
});
