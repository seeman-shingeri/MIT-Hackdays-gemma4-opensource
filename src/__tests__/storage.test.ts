import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadCases, 
  getCaseById, 
  saveOrUpdateCase, 
  mergeEvidenceIntoCase,
  setSessionApiKey,
  getSessionApiKey 
} from '../services/storage';
import type { EvidenceItem } from '../types/case';
import type { DuplicateMatchResult } from '../types/ai';

describe('storage and merge service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('loads demo cases when localStorage is empty', () => {
    const cases = loadCases();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].id).toBe('CIV-8492-A');
  });

  it('saves and retrieves an updated case', () => {
    const cases = loadCases();
    const testCase = cases[0];
    const updated = { ...testCase, title: 'Updated Title Test' };
    saveOrUpdateCase(updated);

    const retrieved = getCaseById(testCase.id);
    expect(retrieved?.title).toBe('Updated Title Test');
  });

  it('merges new evidence and logs merge history without duplicating existing reports', () => {
    const cases = loadCases();
    const targetCase = cases[0];
    const initialEvidenceCount = targetCase.evidence.length;

    const newEvidence: EvidenceItem = {
      id: 'EV-TEST-2',
      reportId: 'REP-TEST-02',
      reporterLabel: 'Reporter 2',
      imageUrl: 'data:image/svg+xml,...',
      timestamp: '2026-10-25T10:00:00Z',
      description: 'Second viewpoint showing deep fracture',
      zone: 'Main Library',
    };

    const matchResult: DuplicateMatchResult = {
      isDuplicate: true,
      totalScore: 85,
      zoneScore: 40,
      categoryScore: 35,
      keywordScore: 10,
      targetCaseId: targetCase.id,
      targetCaseTitle: targetCase.title,
      matchedKeywords: ['fracture', 'ramp'],
      explanation: 'Identical zone and category with shared keywords',
    };

    const merged = mergeEvidenceIntoCase(targetCase.id, newEvidence, matchResult);
    expect(merged).not.toBeNull();
    expect(merged?.evidence.length).toBe(initialEvidenceCount + 1);
    expect(merged?.mergeHistory.length).toBe(1);
    expect(merged?.mergeHistory[0].mergedReportId).toBe('REP-TEST-02');

    // Attempting to merge the same report again must be a no-op
    const reMerged = mergeEvidenceIntoCase(targetCase.id, newEvidence, matchResult);
    expect(reMerged?.evidence.length).toBe(initialEvidenceCount + 1);
  });

  it('stores API keys exclusively in sessionStorage and never in localStorage', () => {
    setSessionApiKey('AIzaSyFakeKeyTest123');
    expect(getSessionApiKey()).toBe('AIzaSyFakeKeyTest123');
    expect(localStorage.getItem('repair_ai_api_key_session')).toBeNull();
  });
});
