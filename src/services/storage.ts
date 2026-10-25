import type { CivicCase, EvidenceItem, MergeLog } from '../types/case';
import { INITIAL_DEMO_CASES } from '../data/demoCases';
import type { DuplicateMatchResult } from '../types/ai';

const STORAGE_KEY_USER_CASES = 'repair_ai_user_cases_v2';
const STORAGE_KEY_DEMO_CASES = 'repair_ai_demo_cases_v2';
const STORAGE_KEY_MODEL = 'repair_ai_selected_model';
const STORAGE_KEY_DEMO_MODE = 'repair_ai_demo_mode_active';
const SESSION_KEY_API_KEY = 'repair_ai_api_key_session';

/**
 * Loads cases from storage.
 * If demoMode is true, loads isolated demo records.
 * If demoMode is false, loads genuine user-submitted reports (defaults to [] if empty).
 * NEVER silently seeds mock data into the real user cases.
 */
export function loadCases(isDemoMode = false): CivicCase[] {
  try {
    if (isDemoMode) {
      const rawDemo = localStorage.getItem(STORAGE_KEY_DEMO_CASES);
      if (!rawDemo) {
        saveCases(INITIAL_DEMO_CASES, true);
        return INITIAL_DEMO_CASES;
      }
      const parsedDemo = JSON.parse(rawDemo);
      return Array.isArray(parsedDemo) && parsedDemo.length > 0 ? parsedDemo : INITIAL_DEMO_CASES;
    }

    const rawUser = localStorage.getItem(STORAGE_KEY_USER_CASES);
    if (!rawUser) {
      return []; // Clean empty state for new installation
    }
    const parsedUser = JSON.parse(rawUser);
    return Array.isArray(parsedUser) ? parsedUser : [];
  } catch (err) {
    console.error('Failed to parse cases from localStorage:', err);
    return isDemoMode ? INITIAL_DEMO_CASES : [];
  }
}

/**
 * Saves cases to localStorage. Strictly isolates user cases from demo cases.
 */
export function saveCases(cases: CivicCase[], isDemoMode = false): void {
  try {
    const key = isDemoMode ? STORAGE_KEY_DEMO_CASES : STORAGE_KEY_USER_CASES;
    localStorage.setItem(key, JSON.stringify(cases));
  } catch (err) {
    console.error('Failed to save cases to localStorage:', err);
  }
}

/**
 * Retrieves a single case by ID.
 */
export function getCaseById(id: string, isDemoMode = false): CivicCase | undefined {
  const cases = loadCases(isDemoMode);
  return cases.find(c => c.id === id);
}

/**
 * Saves a new case or updates an existing case.
 */
export function saveOrUpdateCase(civicCase: CivicCase, isDemoMode = false): CivicCase[] {
  const cases = loadCases(isDemoMode);
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

  saveCases(updatedCases, isDemoMode);
  return updatedCases;
}

/**
 * Merges a corroborating report into an existing case.
 */
export function mergeEvidenceIntoCase(
  targetCaseId: string,
  newEvidence: EvidenceItem,
  matchResult: DuplicateMatchResult,
  isDemoMode = false
): CivicCase | null {
  const cases = loadCases(isDemoMode);
  const targetIndex = cases.findIndex(c => c.id === targetCaseId);
  if (targetIndex === -1) return null;

  const targetCase = cases[targetIndex];

  // Prevent duplicate merging of the same report ID
  const alreadyMerged = targetCase.evidence.some(e => e.reportId === newEvidence.reportId);
  if (alreadyMerged) {
    return targetCase;
  }

  const mergeLog: MergeLog = {
    mergedReportId: newEvidence.reportId,
    reporterLabel: newEvidence.reporterLabel || 'Corroborating Inspector',
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
  const newPriorityScore = Math.min(100, targetCase.priorityScore + 6);

  const updatedCase: CivicCase = {
    ...targetCase,
    evidence: updatedEvidence,
    mergeHistory: [...targetCase.mergeHistory, mergeLog],
    priorityScore: newPriorityScore,
    updatedAt: new Date().toISOString(),
  };

  cases[targetIndex] = updatedCase;
  saveCases(cases, isDemoMode);
  return updatedCase;
}

/**
 * Clears all real user cases (for resetting the database).
 */
export function clearUserCases(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_USER_CASES);
  } catch (err) {
    console.error('Failed to clear user cases:', err);
  }
}

/**
 * Resets the demo dataset back to defaults.
 */
export function resetDemoCases(): CivicCase[] {
  saveCases(INITIAL_DEMO_CASES, true);
  return INITIAL_DEMO_CASES;
}

/**
 * Demo Mode Flag
 */
export function getDemoMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DEMO_MODE) === 'true';
  } catch {
    return false;
  }
}

export function setDemoMode(active: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO_MODE, active ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to persist demo mode state:', err);
  }
}

/**
 * Session API Key Management
 */
export function getSessionApiKey(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY_API_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionApiKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      sessionStorage.removeItem(SESSION_KEY_API_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY_API_KEY, key.trim());
    }
  } catch (err) {
    console.error('Failed to save API key to session storage:', err);
  }
}

/**
 * Model Selection Management
 */
export function getSelectedModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-2.5-flash';
  } catch {
    return 'gemini-2.5-flash';
  }
}

export function setSelectedModel(model: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, model);
  } catch (err) {
    console.error('Failed to save selected model:', err);
  }
}
