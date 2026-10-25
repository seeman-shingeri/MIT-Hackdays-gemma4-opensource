import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  AlertTriangle, 
  GitMerge, 
  Trash2, 
  Layers
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
  'Electrical',
  'Plumbing',
  'Structural',
  'Pedestrian Safety',
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

  // Apply preset
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

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload a JPEG, PNG, WebP, or SVG image.');
      return;
    }

    // Validate size (max 8MB)
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

  // Live duplicate detection as user edits zone/category/description
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
      // 1. Execute AI analysis (Live Gemini API or Simulated Demo)
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

      // 2. Generate unique stable case ID
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Report Campus Infrastructure Hazard
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Stage 1: Reality Capture & Evidence Ingestion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Preset Selector Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Select Built-in Evidence Preset (Bundled Local SVGs)
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                100% Offline Reliable
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EVIDENCE_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500/50'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-950 mb-2 border border-slate-800">
                      <img
                        src={preset.imageUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">
                        {preset.title}
                      </div>
                      <div className="text-[10px] font-mono text-sky-400 mt-0.5">
                        {preset.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Upload & Preview Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Preview Box */}
            <div className="relative w-full h-52 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Evidence Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 backdrop-blur-sm"
                      title="Replace image"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-rose-300 text-xs font-mono border border-rose-700 backdrop-blur-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono backdrop-blur-sm">
                    {selectedPresetId === 'custom-upload' ? 'User Upload' : 'Bundled SVG Asset'}
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-900/40 w-full h-full"
                >
                  <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                  <span className="text-xs font-mono text-slate-400">
                    Click to upload photo evidence (JPG, PNG, SVG)
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 mt-1">
                    Max size: 8MB
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Title & Category & Zone */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken wheelchair ramp slab"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as IssueCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Campus Zone
                  </label>
                  <select
                    value={zone}
                    onChange={e => setZone(e.target.value as CampusZone)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    {ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Landmark / Proximity Details (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. West entrance adjacent to bicycle rack"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Description & Reporter Label */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Incident Description & Observed Damage
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the hazard, any injuries, obstruction extent, or safety risks..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Reporter Identifier
              </label>
              <input
                type="text"
                value={reporterLabel}
                onChange={e => setReporterLabel(e.target.value)}
                placeholder="Student Reporter 1 / Staff"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Preserved during duplicate evidence clustering.
              </p>
            </div>
          </div>

          {/* STAGE 3 DUPLICATE DETECTION WARNING BANNER */}
          {duplicateWarning && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <GitMerge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                        Probable Duplicate Report Detected ({duplicateWarning.totalScore}% Match)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900 text-purple-200 border border-purple-400/30">
                        {duplicateWarning.targetCaseId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 font-semibold">
                      Existing Case: "{duplicateWarning.targetCaseTitle}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Breakdown: {duplicateWarning.explanation}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMergeDirectly}
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-colors shrink-0 shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Merge Into Master Case
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="text-xs font-mono text-slate-400">
            Model: <span className="text-sky-400 font-bold">{apiConfig.selectedModel}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitNewCase}
              disabled={isSubmitting || !description.trim() || !imageUrl}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 transition-colors shadow-lg shadow-sky-500/20"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              {isSubmitting ? 'Analyzing Reality with AI...' : 'Analyze & Submit Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
