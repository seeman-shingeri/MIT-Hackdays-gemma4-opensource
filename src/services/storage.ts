import type { CivicCase, EvidenceItem, MergeLog } from '../types/case';
import { INITIAL_DEMO_CASES } from '../data/demoCases';
import type { DuplicateMatchResult } from '../types/ai';

const STORAGE_KEY_CASES = 'repair_ai_cases_v1';
const STORAGE_KEY_MODEL = 'repair_ai_selected_model';
const STORAGE_KEY_DEMO_MODE = 'repair_ai_demo_mode';
const SESSION_KEY_API_KEY = 'repair_ai_api_key_session';

export function loadCases(): CivicCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASES);
    if (!raw) {
      // Seed default demo cases if storage is empty
      saveCases(INITIAL_DEMO_CASES);
      return INITIAL_DEMO_CASES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveCases(INITIAL_DEMO_CASES);
      return INITIAL_DEMO_CASES;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse cases from localStorage, recovering with demo seed:', err);
    saveCases(INITIAL_DEMO_CASES);
    return INITIAL_DEMO_CASES;
  }
}

export function saveCases(cases: CivicCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  } catch (err) {
    console.error('Failed to save cases to localStorage:', err);
  }
}

export function getCaseById(id: string): CivicCase | undefined {
  const cases = loadCases();
  return cases.find(c => c.id === id);
}

export function saveOrUpdateCase(civicCase: CivicCase): CivicCase[] {
  const cases = loadCases();
  const index = cases.findIndex(c => c.id === civicCase.id);
  let updatedCases: CivicCase[];

  if (index >= 0) {
    updatedCases = [...cases];
    updatedCases[index] = {
      ...civicCase,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updatedCases = [civicCase, ...cases];
  }

  saveCases(updatedCases);
  return updatedCases;
}

export function mergeEvidenceIntoCase(
  targetCaseId: string,
  newEvidence: EvidenceItem,
  matchResult: DuplicateMatchResult
): CivicCase | null {
  const cases = loadCases();
  const targetIndex = cases.findIndex(c => c.id === targetCaseId);
  if (targetIndex === -1) return null;

  const targetCase = cases[targetIndex];

  // Prevent accidental duplicate merging of the same report ID
  const alreadyMerged = targetCase.evidence.some(e => e.reportId === newEvidence.reportId);
  if (alreadyMerged) {
    return targetCase;
  }

  const mergeLog: MergeLog = {
    mergedReportId: newEvidence.reportId,
    reporterLabel: newEvidence.reporterLabel,
    mergedAt: new Date().toISOString(),
    duplicateScore: matchResult.totalScore,
    scoreBreakdown: {
      zoneScore: matchResult.zoneScore,
      categoryScore: matchResult.categoryScore,
      keywordScore: matchResult.keywordScore,
    },
    reason: matchResult.explanation,
  };

  const updatedEvidence = [...targetCase.evidence, newEvidence];
  // Calculate augmented priority score: base score + 5 pts per corroborating evidence report (capped at 100)
  const newPriorityScore = Math.min(100, targetCase.priorityScore + 6);

  const updatedCase: CivicCase = {
    ...targetCase,
    evidence: updatedEvidence,
    mergeHistory: [...targetCase.mergeHistory, mergeLog],
    priorityScore: newPriorityScore,
    updatedAt: new Date().toISOString(),
  };

  cases[targetIndex] = updatedCase;
  saveCases(cases);
  return updatedCase;
}

export function resetToDemoData(): CivicCase[] {
  try {
    localStorage.removeItem(STORAGE_KEY_CASES);
    saveCases(INITIAL_DEMO_CASES);
    return INITIAL_DEMO_CASES;
  } catch (err) {
    console.error('Failed to reset demo data:', err);
    return INITIAL_DEMO_CASES;
  }
}

// Session-only API Key storage (Never in LocalStorage)
export function getSessionApiKey(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY_API_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionApiKey(key: string): void {
  try {
    if (!key.trim()) {
      sessionStorage.removeItem(SESSION_KEY_API_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY_API_KEY, key.trim());
    }
  } catch (err) {
    console.error('Failed to set session API key:', err);
  }
}

export function getSelectedModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemma-4-27b-it';
  } catch {
    return 'gemma-4-27b-it';
  }
}

export function setSelectedModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch (err) {
    console.error('Failed to save selected model:', err);
  }
}

export function getDemoMode(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMO_MODE);
    return raw !== null ? raw === 'true' : true; // Default to demo mode for initial instant playback
  } catch {
    return true;
  }
}

export function setDemoMode(isDemo: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO_MODE, isDemo ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set demo mode:', err);
  }
}
