import type { AiAnalysis, CampusZone, IssueCategory, VisualVerification } from '../types/case';
import type { ApiConfig } from '../types/ai';
import { 
  extractJsonFromText, 
  validateAiAnalysis, 
  validateVerificationResponse,
  validateFaultRecognition,
  type AutomaticFaultRecognitionResult 
} from './aiValidation';

export class AiServiceError extends Error {
  code?: string;
  statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

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
      recommendedModel: 'gemini-2.5-flash',
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
          recommendedModel: 'gemini-2.5-flash',
          errorMessage: 'Invalid API key or unauthorized access to Google Gemini API.',
        };
      }
      return {
        valid: false,
        availableModels: [],
        hasGemma4: false,
        recommendedModel: 'gemini-2.5-flash',
        errorMessage: `API request failed with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const modelsList: Array<{ name: string }> = data.models || [];
    const modelNames = modelsList.map(m => m.name.replace(/^models\//, ''));

    const hasGemma4 = modelNames.some(m => m.includes('gemma-4'));
    const hasGeminiFlash = modelNames.some(m => m.includes('gemini-2.5-flash') || m.includes('gemini-2.0-flash') || m.includes('gemini-1.5-flash'));

    let recommended = 'gemini-2.5-flash';
    let warningMessage: string | undefined;

    if (hasGemma4) {
      recommended = modelNames.find(m => m.includes('gemma-4')) || 'gemma-4-26b-a4b-it';
    } else if (hasGeminiFlash) {
      recommended = modelNames.find(m => m.includes('gemini-2.5-flash')) || modelNames.find(m => m.includes('flash')) || 'gemini-2.5-flash';
      warningMessage = 'Gemma 4 is not available on your key tier. Using Gemini 2.5 Flash for high-speed multimodal vision analysis.';
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
      recommendedModel: 'gemini-2.5-flash',
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

/**
 * AUTOMATIC FAULT RECOGNITION (Section 5)
 * Analyzes uploaded infrastructure photograph automatically upon selection.
 * Identifies defects, visual evidence, uncertainties, and appropriate next steps.
 * Never invents a fault if none is observed; honestly reports API errors.
 */
export async function recognizeFaultAutomatically(
  imageDataUrl: string,
  config: ApiConfig,
  signal?: AbortSignal
): Promise<AutomaticFaultRecognitionResult> {
  const modelToUse = config.selectedModel || 'gemini-2.5-flash';

  // 1. If explicit Demo Mode is active, return calibrated demonstration inspection
  if (config.isDemoMode) {
    return generateSimulatedFaultRecognition(imageDataUrl);
  }

  // 2. If no API key configured and NOT in demo mode, fail honestly
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new AiServiceError(
      'Google Gemini API key required for live AI analysis. Please enter your API key in Settings or activate Demo Mode to evaluate.',
      'MISSING_API_KEY'
    );
  }

  const imagePart = parseImageDataUrl(imageDataUrl);
  if (!imagePart) {
    throw new AiServiceError('Invalid or unreadable image format for visual inspection.', 'INVALID_IMAGE');
  }

  const prompt = `You are REPAIR.AI, a certified municipal infrastructure and accessibility compliance auditor.
Carefully inspect this photograph of a physical infrastructure element (e.g. sidewalk, roadway, ramp, stairs, wiring, pipes, or public fixtures).

Detect any visible physical damage, degradation, hazard, or safety barrier.

Important Instructions:
1. If the infrastructure is in good condition or no obvious defect is present, explicitly state detectedIssue as "No clear fault detected", category as "No Clear Fault Detected", severity as "Low", and confidenceRating as "High". NEVER invent or hallucinate a fault.
2. Select category from:
   - "Road & Pavement Damage"
   - "Cracks & Concrete Damage"
   - "Accessibility Obstacles"
   - "Exposed Electrical Wiring"
   - "Water Leakage & Plumbing"
   - "Damaged Public Infrastructure"
   - "No Clear Fault Detected"
   - "Other Visible Defects"
3. Identify specific visible pixel cues (e.g. concrete spalling, vertical displacement, exposed rebar, puddle accumulation, damaged insulation).
4. State epistemic uncertainties (e.g. lighting limits, subsurface voiding, anchor bolt tightness that cannot be certified visually).
5. State clear plain-language description and suggested next steps.

Return ONLY a strictly valid JSON object matching this schema (no markdown fences, just pure JSON):
{
  "detectedIssue": "string (concise summary of the specific defect or 'No clear fault detected')",
  "category": "Road & Pavement Damage | Cracks & Concrete Damage | Accessibility Obstacles | Exposed Electrical Wiring | Water Leakage & Plumbing | Damaged Public Infrastructure | No Clear Fault Detected | Other Visible Defects",
  "severity": "Low | Medium | High | Critical",
  "plainLanguageDescription": "string (clear 2-sentence explanation of the hazard)",
  "visibleEvidence": ["string (pixel observation 1)", "string (pixel observation 2)"],
  "confidenceRating": "High | Medium | Low | Inconclusive",
  "confidenceNote": "string (note on visual clarity vs structural certainty)",
  "uncertainties": ["string (limitation 1)", "string (limitation 2)"],
  "suggestedNextStep": "string (immediate dispatch or containment action)",
  "requiresHumanOnsiteInspection": true
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelToUse
  )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: imagePart.mimeType,
                  data: imagePart.data,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1024,
        },
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `API request failed with HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      } catch {
        // default msg
      }
      throw new AiServiceError(`Gemini API Error (${response.status}): ${msg}`, 'API_ERROR', response.status);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new AiServiceError('The model did not return text content in its response.', 'EMPTY_RESPONSE');
    }

    const rawJson = extractJsonFromText(textPart);
    const validated = validateFaultRecognition(rawJson, modelToUse, false);

    if (!validated.success) {
      throw new AiServiceError(`Model output did not match expected structure: ${validated.error}`, 'VALIDATION_FAILED');
    }

    return validated.data;
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AiServiceError('Analysis was canceled because a new photo was selected.', 'ABORTED');
    }
    throw new AiServiceError(
      `Network or inference error: ${err instanceof Error ? err.message : String(err)}`,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Analyzes an incident with both image and metadata context.
 */
export async function analyzeIncidentEvidence(
  input: IncidentAnalysisInput,
  config: ApiConfig
): Promise<AiAnalysis> {
  const modelToUse = config.selectedModel || 'gemini-2.5-flash';

  if (config.isDemoMode) {
    return generateSimulatedAnalysis(input, 'Offline Calibrated Demo');
  }

  if (!config.apiKey || !config.apiKey.trim()) {
    throw new AiServiceError(
      'Google Gemini API key required for live AI analysis. Configure your key in Settings or activate Demo Mode.',
      'MISSING_API_KEY'
    );
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorDesc = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) errorDesc = parsed.error.message;
    } catch {
      // default
    }
    throw new AiServiceError(`Gemini API Error: ${errorDesc}`, 'API_ERROR', response.status);
  }

  const data = await response.json();
  const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textPart) {
    throw new AiServiceError('No text returned in Gemini API candidate output', 'EMPTY_RESPONSE');
  }

  const rawJson = extractJsonFromText(textPart);
  const validated = validateAiAnalysis(rawJson, modelToUse, false);

  if (!validated.success) {
    throw new AiServiceError(`Invalid response structure: ${validated.error}`, 'VALIDATION_FAILED');
  }

  return validated.data;
}

/**
 * Compares Before and After photographs to verify repair quality.
 */
export async function verifyRepairsMultimodal(
  beforeUrl: string,
  afterUrl: string,
  issueTitle: string,
  config: ApiConfig
): Promise<VisualVerification> {
  const modelToUse = config.selectedModel || 'gemini-2.5-flash';

  if (config.isDemoMode) {
    return generateSimulatedVerification(beforeUrl, afterUrl);
  }

  if (!config.apiKey || !config.apiKey.trim()) {
    throw new AiServiceError(
      'Google Gemini API key required for repair verification. Enter your API key in Settings or activate Demo Mode.',
      'MISSING_API_KEY'
    );
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) msg = parsed.error.message;
    } catch {
      // default
    }
    throw new AiServiceError(`Verification API Error: ${msg}`, 'API_ERROR', response.status);
  }

  const data = await response.json();
  const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textPart) {
    throw new AiServiceError('No response returned by Gemini model for verification comparison.', 'EMPTY_RESPONSE');
  }

  const rawJson = extractJsonFromText(textPart);
  const validated = validateVerificationResponse(rawJson, beforeUrl, afterUrl, false);
  if (!validated.success) {
    throw new AiServiceError(`Invalid verification response structure: ${validated.error}`, 'VALIDATION_FAILED');
  }

  return validated.data;
}

/**
 * Deterministic Calibrated Simulated Fault Recognition (Isolated for Demo Mode only)
 */
function generateSimulatedFaultRecognition(imageDataUrl: string): AutomaticFaultRecognitionResult {
  // Inspect image data heuristic or preset characteristics
  let issue = 'Severe Concrete Fracture on Pedestrian Ramp';
  let cat = 'Cracks & Concrete Damage';
  let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Critical';
  let desc = 'Transverse fracture across primary pedestrian circulation path with pronounced vertical lip displacement.';
  let evidence = [
    'Transverse fracture exceeding 1.25 inches across pavement slab',
    'Vertical lip displacement creates wheelchair tip and pedestrian trip hazard',
    'Exposed rebar mesh visible at fracture boundary',
  ];

  if (imageDataUrl.includes('conduit') || imageDataUrl.includes('electric')) {
    issue = 'Exposed Electrical Junction Box with Bare Conductors';
    cat = 'Exposed Electrical Wiring';
    severity = 'Critical';
    desc = 'Detached outdoor weather-head housing with exposed energized conductors accessible to pedestrians.';
    evidence = ['Detached NEMA enclosure cover', 'Phase wiring conductors exposed to elements and public reach'];
  } else if (imageDataUrl.includes('water') || imageDataUrl.includes('leak')) {
    issue = 'Overhead Water Ingress with Active Puddle Accumulation';
    cat = 'Water Leakage & Plumbing';
    severity = 'High';
    desc = 'Ceiling water leakage depositing standing pool on polished terrazzo flooring.';
    evidence = ['Active water drip from ceiling expansion joint', 'Standing water puddle without slip warning cones'];
  } else if (imageDataUrl.includes('tactile')) {
    issue = 'Tactile Truncated Domes Obstructed by Construction Materials';
    cat = 'Accessibility Obstacles';
    severity = 'High';
    desc = 'Wood pallet obstructing ADA detectable warning surface prior to platform edge.';
    evidence = ['Material pallet stationed over yellow truncated dome tiles', 'Zero visual pathway clearance for cane travelers'];
  }

  return {
    detectedIssue: issue,
    category: cat,
    severity,
    plainLanguageDescription: desc,
    visibleEvidence: evidence,
    confidenceRating: 'High',
    confidenceNote: 'Pre-calibrated demonstration inspection profile. Real image analysis executes live through Gemini API.',
    uncertainties: [
      'Subsurface concrete stability and voiding require on-site acoustic sounding',
      'Load-bearing reinforcement depth cannot be evaluated visually',
    ],
    suggestedNextStep: 'Install immediate barricades and route ticket to Facilities Concrete Maintenance queue.',
    requiresHumanOnsiteInspection: true,
    analyzedAt: new Date().toISOString(),
    modelUsed: 'Offline Calibrated Demo',
    isSimulated: true,
  };
}

/**
 * Deterministic Calibrated Simulated Analysis (Isolated for Demo Mode only)
 */
function generateSimulatedAnalysis(input: IncidentAnalysisInput, modelName: string): AiAnalysis {
  return {
    issueTitle: `Inspection: ${input.category} Hazard at ${input.zone}`,
    category: input.category,
    severity: input.category === 'Accessibility' || input.category === 'Electrical' ? 'Critical' : 'High',
    accessibilityImpact: 'Disrupts accessible pedestrian route. Wheelchair and cane mobility compromised.',
    detectedHazards: [
      'Physical barrier requiring facilities remediation',
      'Safety code violation requiring authorized field clearance',
    ],
    confidenceScore: 0.94,
    uncertaintyFlags: [
      'Subsurface structural conditions cannot be certified from 2D photography',
      'Structural load strength requires licensed on-site engineering test',
    ],
    clarifyingQuestions: [
      'Is the pathway currently cordoned off with high-visibility caution tape?',
    ],
    urgencyRationale: 'High-frequency campus pedestrian transit route with imminent trip or barrier risk.',
    recommendedAction: 'Dispatch maintenance operations crew for rapid barricade deployment and work order initiation.',
    analyzedAt: new Date().toISOString(),
    modelUsed: modelName,
    isSimulated: true,
  };
}

/**
 * Deterministic Simulated Verification (Isolated for Demo Mode only)
 */
function generateSimulatedVerification(beforeUrl: string, afterUrl: string): VisualVerification {
  return {
    verificationStatus: 'VISUALLY_VERIFIED',
    visualChangesObserved: [
      'Concrete fracture backfilled, graded flush, and textured for slip-resistance',
      'Grade transition restored to zero-threshold ADA compliance at entrance apron',
      'Yellow detectable warning truncated dome strip installed at transition edge',
    ],
    remainingConcerns: [
      'Concrete requires 28-day cure before motorized utility vehicle transit',
      'Periodic re-inspection recommended after first severe rain event',
    ],
    confidenceScore: 0.95,
    beforeImageUrl: beforeUrl,
    afterImageUrl: afterUrl,
    verifiedAt: new Date().toISOString(),
    isSimulated: true,
    complianceDisclaimer:
      'NOTICE: Visual verification represents automated photographic comparison only and does NOT certify structural strength or building code compliance. A licensed municipal or university safety inspector must conduct on-site physical certification before final sign-off.',
  };
}
