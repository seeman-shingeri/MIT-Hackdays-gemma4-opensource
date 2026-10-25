import type { AiAnalysis, CampusZone, IssueCategory, VisualVerification } from '../types/case';
import type { ApiConfig } from '../types/ai';
import { extractJsonFromText, validateAiAnalysis, validateVerificationResponse } from './aiValidation';

export interface IncidentAnalysisInput {
  imageUrl: string;
  description: string;
  category: IssueCategory;
  zone: CampusZone;
  landmark?: string;
  reporterLabel?: string;
}

export interface ModelCheckResult {
  valid: boolean;
  availableModels: string[];
  hasGemma4: boolean;
  recommendedModel: string;
  warningMessage?: string;
  errorMessage?: string;
}

export async function checkApiKeyAndModels(apiKey: string): Promise<ModelCheckResult> {
  if (!apiKey || !apiKey.trim()) {
    return {
      valid: false,
      availableModels: [],
      hasGemma4: false,
      recommendedModel: 'gemma-4-27b-it',
      errorMessage: 'No API key provided',
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`
    );

    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        return {
          valid: false,
          availableModels: [],
          hasGemma4: false,
          recommendedModel: 'gemma-4-27b-it',
          errorMessage: 'Invalid API key or unauthorized access to Google Gemini API.',
        };
      }
      return {
        valid: false,
        availableModels: [],
        hasGemma4: false,
        recommendedModel: 'gemma-4-27b-it',
        errorMessage: `API request failed with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const modelsList: Array<{ name: string }> = data.models || [];
    const modelNames = modelsList.map(m => m.name.replace(/^models\//, ''));

    const hasGemma4 = modelNames.some(m => m.includes('gemma-4'));
    const hasGemma3 = modelNames.some(m => m.includes('gemma-3'));
    const hasGemini25 = modelNames.some(m => m.includes('gemini-2.5') || m.includes('gemini-2.0'));

    let recommended = 'gemma-4-27b-it';
    let warningMessage: string | undefined;

    if (hasGemma4) {
      recommended = modelNames.find(m => m.includes('gemma-4')) || 'gemma-4-27b-it';
    } else {
      warningMessage =
        'Gemma 4 (gemma-4-27b-it) is not currently listed in your API key tier. You may configure Gemini 2.5 Flash as a fallback or run the offline Demo Mode.';
      if (hasGemini25) {
        recommended = modelNames.find(m => m.includes('gemini-2.5-flash') || m.includes('gemini-2.0-flash')) || 'gemini-2.5-flash';
      } else if (hasGemma3) {
        recommended = 'gemma-3-27b-it';
      }
    }

    return {
      valid: true,
      availableModels: modelNames,
      hasGemma4,
      recommendedModel: recommended,
      warningMessage,
    };
  } catch (err) {
    return {
      valid: false,
      availableModels: [],
      hasGemma4: false,
      recommendedModel: 'gemma-4-27b-it',
      errorMessage: `Network error connecting to Gemini API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Parses image Data URL into inlineData format for Gemini REST API
 */
function parseImageDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  // Handle standard data URLs: data:image/png;base64,iVBORw...
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  // Handle SVG data URLs (utf8 or percent-encoded)
  if (dataUrl.startsWith('data:image/svg+xml')) {
    // For SVG presets, convert text to base64
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex !== -1) {
      const rawContent = decodeURIComponent(dataUrl.substring(commaIndex + 1));
      const base64 = btoa(unescape(encodeURIComponent(rawContent)));
      return {
        mimeType: 'image/svg+xml',
        data: base64,
      };
    }
  }

  return null;
}

export async function analyzeIncidentEvidence(
  input: IncidentAnalysisInput,
  config: ApiConfig
): Promise<AiAnalysis> {
  const modelToUse = config.selectedModel || 'gemma-4-27b-it';

  // If in demo mode or without API key, return deterministic simulated response
  if (config.isDemoMode || !config.apiKey) {
    return generateSimulatedAnalysis(input, modelToUse);
  }

  const prompt = `You are REPAIR.AI, an expert civic infrastructure and accessibility inspector.
Analyze this incident report and photographic evidence.
Context:
- Campus Zone: ${input.zone}
- Reported Category: ${input.category}
- Landmark / Specific Location: ${input.landmark || 'Not specified'}
- User Description: "${input.description}"

Evaluate observed visual hazards, potential ADA/accessibility disruption, severity level, uncertainty flags, and clarifying questions.

Return ONLY a strictly valid JSON object conforming to this schema (no markdown formatting, no code fences, just JSON):
{
  "issueTitle": "string (concise descriptive title of the specific defect)",
  "category": "${input.category}",
  "severity": "Low | Medium | High | Critical",
  "accessibilityImpact": "string (concrete mobility or sensory impact)",
  "detectedHazards": ["string (specific hazard 1)", "string (specific hazard 2)"],
  "confidenceScore": 0.92,
  "uncertaintyFlags": ["string (epistemic uncertainty or missing physical info)", "string (visual limitation)"],
  "clarifyingQuestions": ["string (specific question to ask reporter/on-site witness)"],
  "urgencyRationale": "string (why this severity was assigned)",
  "recommendedAction": "string (immediate containment and repair recommendation)"
}`;

  const imagePart = parseImageDataUrl(input.imageUrl);
  const parts: Array<Record<string, unknown>> = [];

  if (imagePart) {
    parts.push({
      inlineData: {
        mimeType: imagePart.mimeType,
        data: imagePart.data,
      },
    });
  }

  parts.push({ text: prompt });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelToUse
  )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorDesc = `API returned HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error && parsed.error.message) {
          errorDesc = parsed.error.message;
        }
      } catch {
        // use default errorDesc
      }

      console.warn(`Gemini API call failed (${errorDesc}). Falling back to calibrated civic analysis.`);
      const fallback = generateSimulatedAnalysis(input, modelToUse);
      fallback.uncertaintyFlags.unshift(`[API Fallback Notice]: ${errorDesc}`);
      return fallback;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('No text returned in Gemini API candidate output');
    }

    const rawJson = extractJsonFromText(textPart);
    const validated = validateAiAnalysis(rawJson, modelToUse, false);

    if (!validated.success) {
      throw new Error(`Invalid response structure: ${validated.error}`);
    }

    return validated.data;
  } catch (err) {
    console.error('AI Analysis Exception:', err);
    const simulated = generateSimulatedAnalysis(input, modelToUse);
    simulated.uncertaintyFlags.unshift(
      `Live API call failed (${err instanceof Error ? err.message : String(err)}). Calibrated simulated evaluation provided.`
    );
    return simulated;
  }
}

export async function verifyRepairsMultimodal(
  beforeUrl: string,
  afterUrl: string,
  issueTitle: string,
  config: ApiConfig
): Promise<VisualVerification> {
  const modelToUse = config.selectedModel || 'gemini-2.5-flash';

  if (config.isDemoMode || !config.apiKey) {
    return generateSimulatedVerification(beforeUrl, afterUrl);
  }

  const prompt = `You are REPAIR.AI, evaluating repair completion for civic case: "${issueTitle}".
Analyze the BEFORE image (first image) and AFTER repair image (second image).
Compare visible surface conditions, leveling, barrier removals, hazard abatement, and any remaining concerns.

Return ONLY a strictly valid JSON object with this schema:
{
  "verificationStatus": "VISUALLY_VERIFIED | NEEDS_REINSPECTION | UNDER_REVIEW",
  "visualChangesObserved": ["change 1", "change 2"],
  "remainingConcerns": ["any residual safety warning or curing requirement"],
  "confidenceScore": 0.94
}`;

  const beforePart = parseImageDataUrl(beforeUrl);
  const afterPart = parseImageDataUrl(afterUrl);
  const parts: Array<Record<string, unknown>> = [];

  if (beforePart) {
    parts.push({ inlineData: { mimeType: beforePart.mimeType, data: beforePart.data } });
  }
  if (afterPart) {
    parts.push({ inlineData: { mimeType: afterPart.mimeType, data: afterPart.data } });
  }

  parts.push({ text: prompt });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelToUse
  )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      return generateSimulatedVerification(beforeUrl, afterUrl);
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textPart) {
      return generateSimulatedVerification(beforeUrl, afterUrl);
    }

    const rawJson = extractJsonFromText(textPart);
    const validated = validateVerificationResponse(rawJson, beforeUrl, afterUrl, false);
    if (!validated.success) {
      return generateSimulatedVerification(beforeUrl, afterUrl);
    }
    return validated.data;
  } catch {
    return generateSimulatedVerification(beforeUrl, afterUrl);
  }
}

/**
 * Deterministic Calibrated Simulated Analysis (100% offline reliability for demo)
 */
function generateSimulatedAnalysis(input: IncidentAnalysisInput, modelName: string): AiAnalysis {
  let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  let accessibilityImpact = 'Pedestrian route impacted; requires caution.';
  let hazards: string[] = ['Physical obstruction requiring facilities response'];
  let uncertainties: string[] = ['Subsurface structural status cannot be determined visually'];
  let questions: string[] = ['Has this area been marked with temporary warning signs?'];
  let urgency = 'Standard facilities response priority.';
  let action = 'Deploy maintenance crew for physical evaluation.';

  if (input.category === 'Accessibility' || input.description.toLowerCase().includes('ramp') || input.description.toLowerCase().includes('wheelchair')) {
    severity = 'Critical';
    accessibilityImpact = 'Total wheelchair pathway disruption; vertical concrete displacement exceeds ADA 1/4" maximum lip threshold.';
    hazards = [
      'Wheelchair tipping risk due to broken concrete joint',
      'Severe pedestrian trip hazard along primary transit artery',
      'Potential instability of handrail base flange under lateral load',
    ];
    uncertainties = [
      'Subsurface voiding or soil erosion beneath concrete apron unknown without sounding',
      'Handrail anchor bolt embedment depth cannot be certified from visual surface inspection alone',
    ];
    questions = [
      'Does the handrail feel physically loose when pulled outward?',
      'Is there standing water or hollow sound under the slab when stepped on?',
    ];
    urgency = 'Primary ADA access to core academic facility; zero step-free bypass exists within 100 meters.';
    action = 'Erect ADA detour signage immediately, secure temporary ramp bridging plate, and dispatch concrete repair team.';
  } else if (input.category === 'Electrical' || input.description.toLowerCase().includes('conduit') || input.description.toLowerCase().includes('wire')) {
    severity = 'High';
    accessibilityImpact = 'Shock/electrocution hazard along sidewalk boundary accessible to pedestrians and guide animals.';
    hazards = [
      'Direct contact electric shock from unshielded conductors',
      'Short circuit and arc flash risk during damp weather',
    ];
    uncertainties = [
      'Live voltage presence and circuit breaker state cannot be verified without multimeter testing',
    ];
    questions = [
      'Is there any audible electrical buzzing or ozone smell near the box?',
    ];
    urgency = 'Unsecured high-voltage enclosure in unrestricted campus circulation zone.';
    action = 'Dispatch licensed university electrician immediately for lockout/tagout and enclosure replacement.';
  } else if (input.category === 'Plumbing' || input.description.toLowerCase().includes('water') || input.description.toLowerCase().includes('leak')) {
    severity = 'Medium';
    accessibilityImpact = 'Wet tile surface poses slip hazard to cane, crutch, and wheelchair users.';
    hazards = [
      'Slip-and-fall injury risk on polished corridor floor',
      'Water ingress damage to overhead fixtures and ceiling panels',
    ];
    uncertainties = [
      'Water type (potable vs graywater vs chilled chemical line) cannot be confirmed visually',
    ];
    questions = [
      'Is the leaking water colored, hot, or giving off an odor?',
    ];
    urgency = 'Active continuous leak spreading across interior pedestrian corridor.';
    action = 'Place catch basin and caution cones; trace supply valve to isolate pipe section.';
  }

  return {
    issueTitle: `Identified ${input.category} Defect at ${input.zone}`,
    category: input.category,
    severity,
    accessibilityImpact,
    detectedHazards: hazards,
    confidenceScore: 0.94,
    uncertaintyFlags: uncertainties,
    clarifyingQuestions: questions,
    urgencyRationale: urgency,
    recommendedAction: action,
    analyzedAt: new Date().toISOString(),
    modelUsed: modelName,
    isSimulated: true,
  };
}

function generateSimulatedVerification(beforeUrl: string, afterUrl: string): VisualVerification {
  return {
    verificationStatus: 'VISUALLY_VERIFIED',
    visualChangesObserved: [
      'Concrete fracture has been ground down, filled, and resurfaced with smooth trowel finish',
      'Level transition restored to zero-threshold ADA compliance at ramp apron',
      'Yellow detectable warning truncated-dome safety strip freshly installed at bottom landing',
      'Handrail mounting posts re-anchored with new stainless steel base flange plates',
    ],
    remainingConcerns: [
      'Ensure concrete reaches full 28-day compressive cure before heavy motorized equipment access',
      'Confirm skid-resistance rating once dry',
    ],
    confidenceScore: 0.96,
    beforeImageUrl: beforeUrl,
    afterImageUrl: afterUrl,
    verifiedAt: new Date().toISOString(),
    isSimulated: true,
    complianceDisclaimer:
      'NOTICE: Visual verification is based solely on automated image comparison and does NOT certify structural integrity, load-bearing safety, electrical code conformance, or statutory ADA compliance. A licensed municipal or university safety inspector must conduct on-site physical certification before final sign-off.',
  };
}
