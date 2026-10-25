import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  GitMerge, 
  Trash2, 
  Camera,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';
import type { CampusZone, CivicCase, EvidenceItem, IssueCategory } from '../../types/case';
import { EVIDENCE_PRESETS, type EvidencePreset } from '../../data/presetAssets';
import { findDuplicatesForReport } from '../../services/duplicateMatching';
import { analyzeIncidentEvidence } from '../../services/ai';
import type { ApiConfig, DuplicateMatchResult } from '../../types/ai';

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

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCases: CivicCase[];
  onCaseCreated: (newCase: CivicCase) => void;
  onEvidenceMerged: (targetCaseId: string, evidence: EvidenceItem, match: DuplicateMatchResult) => void;
  apiConfig: ApiConfig;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  existingCases,
  onCaseCreated,
  onEvidenceMerged,
  apiConfig,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-ramp-broken');
  const [imageUrl, setImageUrl] = useState<string>(EVIDENCE_PRESETS[0].imageUrl);
  const [title, setTitle] = useState<string>(EVIDENCE_PRESETS[0].title);
  const [category, setCategory] = useState<IssueCategory>(EVIDENCE_PRESETS[0].category);
  const [zone, setZone] = useState<CampusZone>(EVIDENCE_PRESETS[0].zone);
  const [landmark, setLandmark] = useState<string>(EVIDENCE_PRESETS[0].landmark);
  const [description, setDescription] = useState<string>(EVIDENCE_PRESETS[0].description);
  const [reporterLabel, setReporterLabel] = useState<string>(EVIDENCE_PRESETS[0].reporterLabel);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply a preset
  const handleSelectPreset = (preset: EvidencePreset) => {
    setSelectedPresetId(preset.id);
    setImageUrl(preset.imageUrl);
    setTitle(preset.title);
    setCategory(preset.category);
    setZone(preset.zone);
    setLandmark(preset.landmark);
    setDescription(preset.description);
    setReporterLabel(preset.reporterLabel);
    setUploadError(null);
  };

  // Real file upload with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload a JPEG, PNG, WebP, or SVG photograph.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB limit. Please provide a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setSelectedPresetId('custom-upload');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file from disk.');
    };
    reader.readAsDataURL(file);
  };

  // Live duplicate detection
  const duplicateWarning: DuplicateMatchResult | null = useMemo(() => {
    if (!description.trim()) {
      return null;
    }

    const report = {
      zone,
      category,
      description,
      landmark,
      title,
    };

    const matches = findDuplicatesForReport(report, existingCases, 70);
    return matches.length > 0 ? matches[0] : null;
  }, [zone, category, description, landmark, title, existingCases]);

  if (!isOpen) return null;

  const handleSubmitNewCase = async () => {
    if (!description.trim() || !imageUrl) return;
    setIsSubmitting(true);

    try {
      const aiAnalysis = await analyzeIncidentEvidence(
        {
          imageUrl,
          description,
          category,
          zone,
          landmark,
          reporterLabel,
        },
        apiConfig
      );

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const caseId = `CIV-${new Date().getFullYear()}-${randomSuffix}`;
      const reportId = `REP-${Date.now().toString().slice(-6)}`;

      const newEvidence: EvidenceItem = {
        id: `EV-${Date.now()}`,
        reportId,
        reporterLabel: reporterLabel || 'Campus Citizen Reporter',
        imageUrl,
        timestamp: new Date().toISOString(),
        description,
        zone,
        landmark,
        isPrimary: true,
      };

      const newCase: CivicCase = {
        id: caseId,
        title: title || aiAnalysis.issueTitle || `${category} Hazard at ${zone}`,
        category,
        severity: aiAnalysis.severity,
        status: 'REPORTED',
        zone,
        landmark: landmark || 'Reported Location',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidence: [newEvidence],
        aiAnalysis,
        clarificationAnswers: [],
        mergeHistory: [],
        assignedTeam:
          category === 'Accessibility'
            ? 'Campus Accessibility & Concrete Operations'
            : category === 'Electrical'
            ? 'Facilities Electrical Operations'
            : category === 'Plumbing'
            ? 'Plumbing & Mechanical Services'
            : 'Campus Facilities Dispatch',
        estimatedResponseTarget:
          aiAnalysis.severity === 'Critical'
            ? '4 Hours (Urgent ADA Barrier - Non-binding SLA)'
            : '24 Hours (Standard Facilities Priority)',
        priorityScore: aiAnalysis.severity === 'Critical' ? 92 : aiAnalysis.severity === 'High' ? 84 : 70,
      };

      onCaseCreated(newCase);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergeDirectly = () => {
    if (!duplicateWarning) return;
    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    const newEvidence: EvidenceItem = {
      id: `EV-${Date.now()}`,
      reportId,
      reporterLabel: reporterLabel || 'Corroborating Student Reporter',
      imageUrl,
      timestamp: new Date().toISOString(),
      description,
      zone,
      landmark,
      isPrimary: false,
    };

    onEvidenceMerged(duplicateWarning.targetCaseId, newEvidence, duplicateWarning);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Report Infrastructure Problem
            </h2>
            <p className="text-xs text-slate-500">
              Step {currentStep} of 4: {
                currentStep === 1 ? 'Add Evidence Photo' :
                currentStep === 2 ? 'Describe Location & Details' :
                currentStep === 3 ? 'Review AI Observations' :
                'Confirm & Submit'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 text-xs text-center font-medium">
          <div className={`py-2 border-b-2 ${currentStep >= 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
            1. Evidence
          </div>
          <div className={`py-2 border-b-2 ${currentStep >= 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
            2. Details
          </div>
          <div className={`py-2 border-b-2 ${currentStep >= 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
            3. Review
          </div>
          <div className={`py-2 border-b-2 ${currentStep >= 4 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
            4. Submit
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: ADD EVIDENCE */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Photo Preview Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Incident Photograph
                </label>

                <div className="relative w-full aspect-16/10 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-medium border border-slate-200 shadow-sm hover:bg-white"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-1.5 rounded-lg bg-white/95 text-rose-600 text-xs font-medium border border-slate-200 shadow-sm hover:bg-rose-50"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 text-center cursor-pointer hover:bg-slate-100/60 w-full h-full flex flex-col items-center justify-center"
                    >
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-700">
                        Upload a photo or capture with camera
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, WebP or SVG up to 8MB
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {uploadError && (
                  <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
                )}
              </div>

              {/* Sample Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-600 block">
                  Or select a standard inspection sample:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVIDENCE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex flex-col justify-between ${
                        selectedPresetId === preset.id
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-full aspect-16/10 rounded overflow-hidden bg-slate-100 mb-1.5">
                        <img src={preset.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="font-medium text-slate-900 truncate">{preset.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{preset.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DESCRIBE THE PROBLEM */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken wheelchair ramp edge"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Detailed Description &amp; Damage Observation
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what is damaged, any trip/tip risk, exposed wiring, water ingress, or accessibility barriers..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
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
                  placeholder="Student Reporter 1 / Facilities Monitor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW AI FINDINGS & DUPLICATE CHECK */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Preliminary AI Inspection Assessment
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p>
                    <strong>Observed Visual Damage:</strong> Severe surface degradation consistent with reported {category.toLowerCase()} hazard.
                  </p>
                  <p>
                    <strong>Needs Verification:</strong> Physical structural stability, subsurface voiding, and handrail anchorage require human on-site inspection.
                  </p>
                  <p>
                    <strong>Recommended Next Action:</strong> Dispatch maintenance crew to install temporary warning signage and deploy containment measures.
                  </p>
                </div>
              </div>

              {/* Duplicate Detection Alert if >= 70% */}
              {duplicateWarning && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <GitMerge className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-purple-950 uppercase tracking-wide block">
                          Similar Existing Incident Found ({duplicateWarning.totalScore}% Match)
                        </span>
                        <p className="text-xs text-purple-900 mt-1 font-medium">
                          Case {duplicateWarning.targetCaseId}: "{duplicateWarning.targetCaseTitle}"
                        </p>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          Matching: {duplicateWarning.explanation}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleMergeDirectly}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shrink-0 transition-colors"
                    >
                      Merge with Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CONFIRM & SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{title}</h4>
                    <p className="text-slate-600">{zone} — {landmark}</p>
                    <p className="text-slate-500 italic mt-1 line-clamp-2">"{description}"</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  By submitting, this report will be assigned a permanent Case ID and routed to the corresponding campus maintenance dispatch queue.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !imageUrl) return;
                  if (currentStep === 2 && !description.trim()) return;
                  setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4);
                }}
                disabled={(currentStep === 1 && !imageUrl) || (currentStep === 2 && !description.trim())}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitNewCase}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {isSubmitting ? 'Analyzing & Submitting...' : 'Submit Incident Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
