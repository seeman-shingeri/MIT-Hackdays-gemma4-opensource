import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadCases, 
  getCaseById, 
  saveOrUpdateCase, 
  mergeEvidenceIntoCase,
  setSessionApiKey,
  getSessionApiKey,
  resetDemoCases
} from '../services/storage';
import type { CivicCase, EvidenceItem } from '../types/case';
import type { DuplicateMatchResult } from '../types/ai';

describe('storage and merge service (zero fake data & isolated demo)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns an empty array on fresh installation with no fake cases', () => {
    const cases = loadCases(false);
    expect(cases).toEqual([]);
    expect(cases.length).toBe(0);
  });

  it('loads isolated demo cases only when explicitly requested in demo mode', () => {
    const demoCases = loadCases(true);
    expect(demoCases.length).toBeGreaterThan(0);
    expect(demoCases[0].id).toBe('CIV-8492-A');

    // Real user cases must still be completely empty!
    const userCases = loadCases(false);
    expect(userCases).toEqual([]);
  });

  it('saves and retrieves a genuine user-submitted case without touching demo storage', () => {
    const testCase: CivicCase = {
      id: 'CIV-USER-001',
      title: 'Pothole on Oak Street',
      category: 'Pedestrian Safety',
      severity: 'Medium',
      status: 'REPORTED',
      zone: 'North Quad',
      landmark: 'Near Crosswalk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [
        {
          id: 'EV-USER-001',
          reportId: 'REP-USER-001',
          reporterLabel: 'Citizen',
          imageUrl: 'data:image/svg+xml,...',
          timestamp: new Date().toISOString(),
          description: 'Pothole in crosswalk',
          zone: 'North Quad',
          isPrimary: true,
        },
      ],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 70,
    };

    saveOrUpdateCase(testCase, false);

    const userCases = loadCases(false);
    expect(userCases.length).toBe(1);
    expect(userCases[0].title).toBe('Pothole on Oak Street');

    const retrieved = getCaseById('CIV-USER-001', false);
    expect(retrieved?.id).toBe('CIV-USER-001');
  });

  it('merges new evidence and logs merge history without duplicating existing reports', () => {
    const demoCases = resetDemoCases();
    const targetCase = demoCases[0];

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

    const merged = mergeEvidenceIntoCase(targetCase.id, newEvidence, matchResult, true);
    expect(merged).not.toBeNull();
    expect(merged?.evidence.length).toBe(targetCase.evidence.length + 1);
    expect(merged?.mergeHistory.length).toBe(1);
    expect(merged?.mergeHistory[0].duplicateScore).toBe(85);
  });

  it('manages session-only API keys securely without persisting to permanent storage', () => {
    expect(getSessionApiKey()).toBe('');
    setSessionApiKey('AIzaSyTestKey12345');
    expect(getSessionApiKey()).toBe('AIzaSyTestKey12345');
    expect(localStorage.getItem('repair_ai_api_key_session')).toBeNull();

    setSessionApiKey('');
    expect(getSessionApiKey()).toBe('');
  });
});
