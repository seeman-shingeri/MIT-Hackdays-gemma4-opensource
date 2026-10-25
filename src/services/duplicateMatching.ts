import type { CampusZone, CivicCase, IssueCategory } from '../types/case';
import type { DuplicateMatchResult } from '../types/ai';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export function tokenizeText(text: string): Set<string> {
  if (!text || typeof text !== 'string') return new Set();
  
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
    
  return new Set(tokens);
}

export interface CandidateReport {
  zone: CampusZone;
  category: IssueCategory;
  description: string;
  landmark?: string;
  title?: string;
  excludeCaseId?: string;
}

/**
 * Deterministic Duplicate Scoring Formula:
 * - Zone Match: 40% (40 points)
 * - Category Match: 35% (35 points)
 * - Keyword Overlap: 25% (25 points)
 * Total Score: 0 - 100
 */
export function calculateDuplicateScore(
  report: CandidateReport,
  existingCase: CivicCase
): DuplicateMatchResult {
  // 1. Zone match (40%)
  const zoneMatches = report.zone === existingCase.zone;
  const zoneScore = zoneMatches ? 40 : 0;

  // 2. Category match (35%)
  const categoryMatches = report.category === existingCase.category;
  const categoryScore = categoryMatches ? 35 : 0;

  // 3. Keyword overlap (25%)
  const reportTokens = new Set<string>([
    ...tokenizeText(report.description),
    ...tokenizeText(report.title || ''),
    ...tokenizeText(report.landmark || '')
  ]);

  const existingTokens = new Set<string>([
    ...tokenizeText(existingCase.title),
    ...tokenizeText(existingCase.landmark),
    ...tokenizeText(existingCase.evidence.map(e => e.description).join(' '))
  ]);

  const sharedTokens: string[] = [];
  reportTokens.forEach(token => {
    if (existingTokens.has(token)) {
      sharedTokens.push(token);
    }
  });

  let keywordScore = 0;
  if (reportTokens.size > 0 && existingTokens.size > 0) {
    const minTokens = Math.max(2, Math.min(reportTokens.size, existingTokens.size));
    const overlapRatio = sharedTokens.length / minTokens;
    keywordScore = Math.min(25, Math.round(overlapRatio * 25));
  }

  const totalScore = zoneScore + categoryScore + keywordScore;
  const isDuplicate = totalScore >= 70;

  const reasons: string[] = [];
  if (zoneMatches) reasons.push(`Identical campus zone: "${report.zone}" (+40 pts)`);
  if (categoryMatches) reasons.push(`Identical category: "${report.category}" (+35 pts)`);
  if (sharedTokens.length > 0) {
    reasons.push(
      `Shared keywords [${sharedTokens.slice(0, 5).join(', ')}${sharedTokens.length > 5 ? '...' : ''}] (+${keywordScore} pts)`
    );
  } else {
    reasons.push(`Low keyword overlap (+${keywordScore} pts)`);
  }

  const explanation = reasons.join(' • ');

  return {
    isDuplicate,
    totalScore,
    zoneScore,
    categoryScore,
    keywordScore,
    targetCaseId: existingCase.id,
    targetCaseTitle: existingCase.title,
    matchedKeywords: sharedTokens,
    explanation,
  };
}

export function findDuplicatesForReport(
  report: CandidateReport,
  existingCases: CivicCase[],
  threshold = 70
): DuplicateMatchResult[] {
  const activeCases = existingCases.filter(
    c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.id !== report.excludeCaseId
  );

  const results: DuplicateMatchResult[] = [];

  for (const existingCase of activeCases) {
    const match = calculateDuplicateScore(report, existingCase);
    if (match.totalScore >= threshold) {
      results.push(match);
    }
  }

  return results.sort((a, b) => b.totalScore - a.totalScore);
}
