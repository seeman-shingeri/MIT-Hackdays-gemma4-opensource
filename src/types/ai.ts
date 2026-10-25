export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  isGemma4: boolean;
  isOpenWeight: boolean;
  isFallback: boolean;
  requiresKey: boolean;
}

export const SUPPORTED_MODELS: ModelOption[] = [
  {
    id: 'gemma-4-27b-it',
    name: 'Gemma 4 27B-IT',
    provider: 'Google Open Weights / Gemini API',
    description: 'Hackathon target model: Next-gen open-weights model for reasoning & structured civic extraction.',
    isGemma4: true,
    isOpenWeight: true,
    isFallback: false,
    requiresKey: true,
  },
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B-IT',
    provider: 'Google Open Weights',
    description: 'Prior generation open model fallback for structured parsing and safety analysis.',
    isGemma4: false,
    isOpenWeight: true,
    isFallback: false,
    requiresKey: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google Gemini API',
    description: 'High-speed multimodal fallback model for high-resolution image analysis and verification.',
    isGemma4: false,
    isOpenWeight: false,
    isFallback: true,
    requiresKey: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google Gemini API',
    description: 'Standard Gemini multimodal model for general civic image inspection.',
    isGemma4: false,
    isOpenWeight: false,
    isFallback: true,
    requiresKey: true,
  },
];

export interface ApiConfig {
  apiKey: string;
  selectedModel: string;
  isDemoMode: boolean;
  lastTestedAt?: string;
  isValidKey?: boolean;
  availableModels?: string[];
  warningMessage?: string;
}

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  totalScore: number; // 0 - 100
  zoneScore: number; // 0 - 40
  categoryScore: number; // 0 - 35
  keywordScore: number; // 0 - 25
  targetCaseId: string;
  targetCaseTitle: string;
  matchedKeywords: string[];
  explanation: string;
}
