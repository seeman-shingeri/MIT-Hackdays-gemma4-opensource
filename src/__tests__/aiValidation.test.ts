import { describe, it, expect } from 'vitest';
import { 
  extractJsonFromText, 
  validateAiAnalysis, 
  validateVerificationResponse,
  validateFaultRecognition 
} from '../services/aiValidation';
import { recognizeFaultAutomatically, AiServiceError } from '../services/ai';

describe('aiValidation and fault recognition service', () => {
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

    const res = validateAiAnalysis(input, 'gemini-2.5-flash', false);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.issueTitle).toBe('Damaged ramp concrete');
      expect(res.data.category).toBe('Accessibility');
      expect(res.data.severity).toBe('Critical');
      expect(res.data.confidenceScore).toBe(1.0); // clamped to 1.0
      expect(res.data.modelUsed).toBe('gemini-2.5-flash');
    }
  });

  it('validates automatic fault recognition output schema', () => {
    const input = {
      detectedIssue: 'Severe crack across asphalt roadway',
      category: 'Road & Pavement Damage',
      severity: 'High',
      plainLanguageDescription: 'Large transversal fracture in roadway causing vehicle tire hazard.',
      visibleEvidence: ['Fracture width > 2 inches', 'Subbase aggregate visible'],
      confidenceRating: 'High',
      confidenceNote: 'High visual contrast; clear road markings visible.',
      uncertainties: ['Subsurface sinkhole risk requires geotech inspection'],
      suggestedNextStep: 'Deploy traffic cones and route to Road Operations',
      requiresHumanOnsiteInspection: true,
    };

    const res = validateFaultRecognition(input, 'gemini-2.5-flash', false);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.detectedIssue).toBe('Severe crack across asphalt roadway');
      expect(res.data.category).toBe('Road & Pavement Damage');
      expect(res.data.confidenceRating).toBe('High');
      expect(res.data.requiresHumanOnsiteInspection).toBe(true);
      expect(res.data.isSimulated).toBe(false);
    }
  });

  it('refuses to fabricate live AI results when API key is missing and demo mode is off', async () => {
    const fakeImage = 'data:image/svg+xml;utf8,<svg></svg>';
    const config = { apiKey: '', selectedModel: 'gemini-2.5-flash', isDemoMode: false };

    await expect(recognizeFaultAutomatically(fakeImage, config)).rejects.toThrow(AiServiceError);
  });

  it('returns isolated demonstration results with isSimulated flag when demo mode is active', async () => {
    const fakeImage = 'data:image/svg+xml;utf8,<svg id="ramp"></svg>';
    const config = { apiKey: '', selectedModel: 'gemini-2.5-flash', isDemoMode: true };

    const result = await recognizeFaultAutomatically(fakeImage, config);
    expect(result.isSimulated).toBe(true);
    expect(result.modelUsed).toBe('Offline Calibrated Demo');
    expect(result.confidenceNote).toContain('demonstration');
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
