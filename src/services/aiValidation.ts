import type { AiAnalysis, IssueCategory, Severity, VerificationStatus, VisualVerification } from '../types/case';

const VALID_CATEGORIES: IssueCategory[] = [
  'Accessibility',
  'Electrical',
  'Plumbing',
  'Structural',
  'Pedestrian Safety',
];

const VALID_SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

const VALID_VERIFICATION_STATUSES: VerificationStatus[] = [
  'UNVERIFIED',
  'REPORTED',
  'UNDER_REVIEW',
  'VISUALLY_VERIFIED',
  'NEEDS_REINSPECTION',
];

export function extractJsonFromText(rawText: string): unknown {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or non-string response received from AI model');
  }

  // Strip markdown code block if present: ```json ... ```
  let cleaned = rawText.trim();
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = codeBlockRegex.exec(cleaned);
  if (match) {
    cleaned = match[1].trim();
  }

  // Attempt to parse JSON
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt fallback to find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(sub);
    }
    throw new Error(`Model returned malformed JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function validateAiAnalysis(
  raw: unknown,
  modelName: string,
  isSimulated = false
): { success: true; data: AiAnalysis } | { success: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Expected JSON object in AI analysis output' };
  }

  const obj = raw as Record<string, unknown>;

  const issueTitle = typeof obj.issueTitle === 'string' && obj.issueTitle.trim()
    ? obj.issueTitle.trim()
    : 'Identified Civic Infrastructure Anomaly';

  let category: IssueCategory = 'Accessibility';
  if (typeof obj.category === 'string') {
    const matched = VALID_CATEGORIES.find(c => c.toLowerCase() === (obj.category as string).toLowerCase().trim());
    if (matched) category = matched;
  }

  let severity: Severity = 'Medium';
  if (typeof obj.severity === 'string') {
    const matched = VALID_SEVERITIES.find(s => s.toLowerCase() === (obj.severity as string).toLowerCase().trim());
    if (matched) severity = matched;
  }

  const accessibilityImpact = typeof obj.accessibilityImpact === 'string' && obj.accessibilityImpact.trim()
    ? obj.accessibilityImpact.trim()
    : 'Potential pedestrian or mobility impact identified from reported imagery.';

  const detectedHazards: string[] = Array.isArray(obj.detectedHazards)
    ? obj.detectedHazards.filter(h => typeof h === 'string' && h.trim().length > 0).map(h => String(h).trim())
    : ['Visual anomaly requiring maintenance investigation'];

  let confidenceScore = typeof obj.confidenceScore === 'number' && !isNaN(obj.confidenceScore)
    ? obj.confidenceScore
    : 0.85;
  confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore));

  const uncertaintyFlags: string[] = Array.isArray(obj.uncertaintyFlags)
    ? obj.uncertaintyFlags.filter(u => typeof u === 'string' && u.trim().length > 0).map(u => String(u).trim())
    : ['Subsurface structural condition cannot be determined from visual photographic evidence alone'];

  const clarifyingQuestions: string[] = Array.isArray(obj.clarifyingQuestions)
    ? obj.clarifyingQuestions.filter(q => typeof q === 'string' && q.trim().length > 0).map(q => String(q).trim())
    : [];

  const urgencyRationale = typeof obj.urgencyRationale === 'string' && obj.urgencyRationale.trim()
    ? obj.urgencyRationale.trim()
    : 'Assessed based on location proximity to high-frequency pedestrian pathways.';

  const recommendedAction = typeof obj.recommendedAction === 'string' && obj.recommendedAction.trim()
    ? obj.recommendedAction.trim()
    : 'Dispatch physical inspection team to assess repair requirements.';

  const validated: AiAnalysis = {
    issueTitle,
    category,
    severity,
    accessibilityImpact,
    detectedHazards,
    confidenceScore,
    uncertaintyFlags,
    clarifyingQuestions,
    urgencyRationale,
    recommendedAction,
    analyzedAt: new Date().toISOString(),
    modelUsed: modelName,
    isSimulated,
  };

  return { success: true, data: validated };
}

export function validateVerificationResponse(
  raw: unknown,
  beforeUrl: string,
  afterUrl: string,
  isSimulated = false
): { success: true; data: VisualVerification } | { success: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Expected JSON object in verification output' };
  }

  const obj = raw as Record<string, unknown>;

  let verificationStatus: VerificationStatus = 'UNDER_REVIEW';
  if (typeof obj.verificationStatus === 'string') {
    const matched = VALID_VERIFICATION_STATUSES.find(
      s => s.toLowerCase() === (obj.verificationStatus as string).toLowerCase().trim()
    );
    if (matched) verificationStatus = matched;
  }

  const visualChangesObserved: string[] = Array.isArray(obj.visualChangesObserved)
    ? obj.visualChangesObserved.filter(c => typeof c === 'string' && c.trim().length > 0).map(c => String(c).trim())
    : ['Visual change observed between before and after image submissions'];

  const remainingConcerns: string[] = Array.isArray(obj.remainingConcerns)
    ? obj.remainingConcerns.filter(c => typeof c === 'string' && c.trim().length > 0).map(c => String(c).trim())
    : [];

  let confidenceScore = typeof obj.confidenceScore === 'number' && !isNaN(obj.confidenceScore)
    ? obj.confidenceScore
    : 0.90;
  confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore));

  const validated: VisualVerification = {
    verificationStatus,
    visualChangesObserved,
    remainingConcerns,
    confidenceScore,
    beforeImageUrl: beforeUrl,
    afterImageUrl: afterUrl,
    verifiedAt: new Date().toISOString(),
    isSimulated,
    complianceDisclaimer:
      'NOTICE: Visual verification is based solely on automated image comparison and does NOT certify structural integrity, load-bearing safety, electrical code conformance, or statutory ADA compliance. A licensed municipal or university safety inspector must conduct on-site physical certification before final sign-off.',
  };

  return { success: true, data: validated };
}
