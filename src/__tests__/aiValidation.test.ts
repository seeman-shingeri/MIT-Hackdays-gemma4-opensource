import { describe, it, expect } from 'vitest';
import { extractJsonFromText, validateAiAnalysis, validateVerificationResponse } from '../services/aiValidation';

describe('aiValidation service', () => {
  it('strips markdown code blocks and parses raw json', () => {
    const raw = `\`\`\`json
    {
      "issueTitle": "Broken concrete curb",
      "category": "Accessibility",
      "severity": "Critical",
      "confidenceScore": 0.95
    }
    \`\`\``;

    const parsed = extractJsonFromText(raw) as Record<string, unknown>;
    expect(parsed.issueTitle).toBe('Broken concrete curb');
    expect(parsed.severity).toBe('Critical');
  });

  it('validates AI analysis output structure and clamps confidence scores', () => {
    const input = {
      issueTitle: 'Damaged ramp concrete',
      category: 'accessibility',
      severity: 'critical',
      accessibilityImpact: 'Wheelchair access denied',
      detectedHazards: ['Tripping risk', 'Tip hazard'],
      confidenceScore: 1.45, // invalid, should be clamped
      uncertaintyFlags: ['Subsurface unknown'],
      clarifyingQuestions: ['Is the ground hollow?'],
    };

    const res = validateAiAnalysis(input, 'gemma-4-27b-it', false);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.issueTitle).toBe('Damaged ramp concrete');
      expect(res.data.category).toBe('Accessibility');
      expect(res.data.severity).toBe('Critical');
      expect(res.data.confidenceScore).toBe(1.0); // clamped to 1.0
      expect(res.data.modelUsed).toBe('gemma-4-27b-it');
    }
  });

  it('validates verification output and includes the non-negotiable statutory disclaimer', () => {
    const input = {
      verificationStatus: 'VISUALLY_VERIFIED',
      visualChangesObserved: ['New concrete patch applied', 'Handrail repainted'],
      remainingConcerns: ['Verify cure time'],
      confidenceScore: 0.92,
    };

    const res = validateVerificationResponse(input, 'before.jpg', 'after.jpg', false);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.verificationStatus).toBe('VISUALLY_VERIFIED');
      expect(res.data.visualChangesObserved.length).toBe(2);
      expect(res.data.complianceDisclaimer).toContain('does NOT certify structural integrity');
    }
  });
});
