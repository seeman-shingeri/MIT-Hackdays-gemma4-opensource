import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Check
} from 'lucide-react';
import type { CampusZone, CivicCase, EvidenceItem, IssueCategory } from '../../types/case';
import type { ApiConfig } from '../../types/ai';
import { processAndCompressImage, validateImageFile, type ProcessedImageInfo } from '../../utils/imageUtils';
import { recognizeFaultAutomatically, AiServiceError } from '../../services/ai';
import type { AutomaticFaultRecognitionResult } from '../../services/aiValidation';
import { EVIDENCE_PRESETS } from '../../data/presetAssets';

const ZONES: CampusZone[] = [
  'Main Library',
  'North Quad',
  'Engineering Wing',
  'Student Union',
  'Athletics Complex',
  'West Residence Hall',
  'Central Plaza',
];

const CATEGORIES: IssueCategory[] = [
  'Accessibility',
  'Pedestrian Safety',
  'Electrical',
  'Plumbing',
  'Structural',
];

interface InspectWorkflowProps {
  onReportSubmitted: (newCase: CivicCase) => void;
  onCancel: () => void;
  apiConfig: ApiConfig;
  isDemoMode: boolean;
}

export const InspectWorkflow: React.FC<InspectWorkflowProps> = ({
  onReportSubmitted,
  onCancel,
  apiConfig,
  isDemoMode,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Evidence & Auto-analysis state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageMetadata, setImageMetadata] = useState<ProcessedImageInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AutomaticFaultRecognitionResult | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<IssueCategory>('Accessibility');
  const [zone, setZone] = useState<CampusZone>('Main Library');
  const [landmark, setLandmark] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reporterLabel, setReporterLabel] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Run automatic AI fault analysis upon image selection
  const runAutoAnalysis = useCallback(async (dataUrl: string) => {
    // Abort previous in-flight request if user changes image quickly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await recognizeFaultAutomatically(
        dataUrl,
        apiConfig,
        abortControllerRef.current.signal
      );

      setAnalysisResult(result);

      // Pre-fill fields automatically from the recognized findings
      if (!title || title.trim() === '') {
        setTitle(result.detectedIssue);
      }
      if (!description || description.trim() === '') {
        setDescription(result.plainLanguageDescription);
      }

      // Map detected category to app categories if applicable
      if (result.category.toLowerCase().includes('access')) {
        setCategory('Accessibility');
      } else if (result.category.toLowerCase().includes('electric')) {
        setCategory('Electrical');
      } else if (result.category.toLowerCase().includes('water') || result.category.toLowerCase().includes('plumb')) {
        setCategory('Plumbing');
      } else if (result.category.toLowerCase().includes('concrete') || result.category.toLowerCase().includes('crack') || result.category.toLowerCase().includes('struct')) {
        setCategory('Structural');
      } else {
        setCategory('Pedestrian Safety');
      }
    } catch (err: unknown) {
      if (err instanceof AiServiceError && err.code === 'ABORTED') {
        return; // Ignore canceled request
      }
      const msg = err instanceof Error ? err.message : 'Visual recognition failed.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiConfig, title, description]);

  // Handle image selection from camera or gallery
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisError(null);
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAnalysisError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      const processed = await processAndCompressImage(file, 1600, 0.85);
      setImageUrl(processed.dataUrl);
      setImageMetadata(processed);

      // AUTOMATIC TRIGGER: starts immediately upon photo selection
      runAutoAnalysis(processed.dataUrl);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed to process image.');
    }
  };

  // Select one of the inspection presets (for test & demo evaluation)
  const handleSelectPreset = (presetUrl: string, presetTitle: string, presetCat: IssueCategory) => {
    setImageUrl(presetUrl);
    setImageMetadata(null);
    setTitle(presetTitle);
    setCategory(presetCat);
    runAutoAnalysis(presetUrl);
  };

  // Submit the genuine new report
  const handleSubmitReport = async () => {
    if (!imageUrl || !title.trim()) return;
    setIsSubmitting(true);

    try {
      const caseId = `CIV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const reportId = `REP-${Date.now().toString().slice(-6)}`;

      const newEvidence: EvidenceItem = {
        id: `EV-${Date.now()}`,
        reportId,
        reporterLabel: reporterLabel.trim() || 'Field Inspector',
        imageUrl,
        timestamp: new Date().toISOString(),
        description: description.trim() || title,
        zone,
        landmark: landmark.trim() || 'Reported Location',
        isPrimary: true,
      };

      const newCase: CivicCase = {
        id: caseId,
        title: title.trim(),
        category,
        severity: analysisResult?.severity || 'Medium',
        status: 'REPORTED',
        zone,
        landmark: landmark.trim() || 'Reported Location',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidence: [newEvidence],
        clarificationAnswers: [],
        mergeHistory: [],
        priorityScore: analysisResult?.severity === 'Critical' ? 92 : analysisResult?.severity === 'High' ? 84 : 70,
        assignedTeam:
          category === 'Accessibility'
            ? 'Campus Accessibility & Concrete Operations'
            : category === 'Electrical'
            ? 'Facilities Electrical Operations'
            : category === 'Plumbing'
            ? 'Plumbing & Mechanical Services'
            : 'Campus Facilities Dispatch',
        estimatedResponseTarget:
          analysisResult?.severity === 'Critical'
            ? '4 Hours (Urgent Hazard)'
            : '24 Hours (Standard Facilities Tier)',
        aiAnalysis: analysisResult ? {
          issueTitle: analysisResult.detectedIssue,
          category,
          severity: analysisResult.severity,
          accessibilityImpact: analysisResult.plainLanguageDescription,
          detectedHazards: analysisResult.visibleEvidence,
          confidenceScore: 0.90,
          uncertaintyFlags: analysisResult.uncertainties,
          clarifyingQuestions: [],
          urgencyRationale: analysisResult.confidenceNote,
          recommendedAction: analysisResult.suggestedNextStep,
          analyzedAt: analysisResult.analyzedAt,
          modelUsed: analysisResult.modelUsed,
          isSimulated: analysisResult.isSimulated,
        } : undefined,
      };

      setIsSubmitted(true);
      setTimeout(() => {
        onReportSubmitted(newCase);
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up in-flight abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full bg-transparent">
      {/* 4-Step iOS Progress Indicator */}
      <div className="px-4 py-3 border-b border-slate-200/60 bg-white/60 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Step {step} of 4: {
            step === 1 ? 'Capture Evidence' :
            step === 2 ? 'Incident Details' :
            step === 3 ? 'AI Findings Review' :
            'Confirm & Submit'
          }</span>
          <span className="text-slate-400 font-mono text-[11px]">{step * 25}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {/* Main Form Content (Independently Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-y-contain">
        {/* STEP 1: CAPTURE & AUTO-ANALYSIS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {isDemoMode && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Demo Mode Active: Inspection will be saved to the isolated demonstration collection.</span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Capture Infrastructure Evidence
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a photograph or select an image. Analysis begins automatically.
              </p>
            </div>

            {/* Photo Preview Box */}
            <div className="relative w-full aspect-16/10 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Inspection" className="w-full h-full object-cover" />
                  
                  {/* Resolution & Size Pill */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-mono backdrop-blur-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {imageMetadata
                        ? `${imageMetadata.width} × ${imageMetadata.height} • ${(imageMetadata.compressedSizeBytes / 1024).toFixed(0)} KB`
                        : 'Field Photo Ready'}
                    </span>
                  </div>

                  {/* Top Action Buttons on photo */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold border border-slate-200/80 shadow-xs hover:bg-white"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageMetadata(null);
                        setAnalysisResult(null);
                        setAnalysisError(null);
                      }}
                      className="p-2 rounded-lg bg-white/95 text-rose-600 text-xs font-semibold border border-slate-200/80 shadow-xs hover:bg-rose-50"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center w-full h-full flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                    <Camera className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Take a photo or choose from gallery
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      JPEG, PNG, WebP or SVG up to 20MB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 active:scale-95 transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>Upload from Gallery</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden Native File Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Automatic Recognition Indicator & Status */}
            {imageUrl && (
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xs space-y-2">
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 py-1">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Analyzing image…
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Evaluating infrastructure surfaces, fractures, and accessibility barriers.
                      </p>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">
                          {analysisResult.detectedIssue}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        analysisResult.confidenceRating === 'High'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {analysisResult.confidenceRating} Clarity
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {analysisResult.plainLanguageDescription}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      Engine: {analysisResult.modelUsed}
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="flex items-start gap-2.5 text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">AI Analysis Notice</p>
                      <p className="text-rose-700 mt-0.5">{analysisError}</p>
                      <button
                        type="button"
                        onClick={() => runAutoAnalysis(imageUrl)}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-semibold underline block"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Evaluation Samples (Available for Testing & Demo) */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Or select an inspection sample for demonstration:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EVIDENCE_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.imageUrl, p.title, p.category)}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-left text-xs transition-colors"
                  >
                    <div className="aspect-16/10 rounded-lg overflow-hidden bg-slate-100 mb-1.5">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="font-medium text-slate-900 truncate">{p.title}</div>
                    <div className="text-[10px] text-slate-400">{p.category}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INCIDENT DETAILS */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Incident Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and refine location and defect details.
              </p>
            </div>

            <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Defect Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken wheelchair ramp edge"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hazard Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as IssueCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Campus Zone
                  </label>
                  <select
                    value={zone}
                    onChange={e => setZone(e.target.value as CampusZone)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Specific Landmark / Proximity
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. West entrance ramp facing Library Quad"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description &amp; Observed Conditions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe damage, immediate safety hazard, or transit restrictions..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reporter Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={reporterLabel}
                  onChange={e => setReporterLabel(e.target.value)}
                  placeholder="Inspector Name / ID"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW AI FINDINGS */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                AI Findings &amp; Uncertainties
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified observations and statutory inspection limits.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              {/* Evidence Observations */}
              <div>
                <span className="font-semibold text-slate-900 block mb-1.5">
                  Observed Physical Evidence:
                </span>
                <ul className="space-y-1 text-slate-600">
                  {(analysisResult?.visibleEvidence || ['Surface defect identified in uploaded imagery']).map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Epistemic Uncertainties */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-semibold block">
                  Epistemic Uncertainties &amp; Visual Limits:
                </span>
                <ul className="space-y-1 text-amber-800">
                  {(analysisResult?.uncertainties || ['Subsurface material stability requires physical testing']).map((un, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span>⚠️</span>
                      <span>{un}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Action */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">
                  Suggested Action:
                </span>
                <p className="text-slate-600">
                  {analysisResult?.suggestedNextStep || 'Dispatch certified operations crew for on-site physical evaluation.'}
                </p>
              </div>

              {/* Confidence Notice */}
              <div className="text-[11px] text-slate-400 italic">
                {analysisResult?.confidenceNote || 'Self-reported confidence indicates visual clarity and does not replace on-site physical inspection.'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM & SUBMIT */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Confirm Report Submission
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify summary before creating a permanent municipal record.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{title}</h3>
                  <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{zone} {landmark ? `— ${landmark}` : ''}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">Description:</span>
                <p>{description || 'No additional narrative provided.'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                By submitting, this incident will be saved to your local database and routed to the corresponding municipal response queue.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Footer (Never scrolls away) */}
      <div className="p-4 border-t border-slate-200/70 bg-white/80 backdrop-blur-xl flex items-center justify-between gap-3">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !imageUrl) return;
                if (step === 2 && !title.trim()) return;
                setStep((step + 1) as 1 | 2 | 3 | 4);
              }}
              disabled={(step === 1 && !imageUrl) || (step === 2 && !title.trim())}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={isSubmitting || isSubmitted}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Report Saved!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
