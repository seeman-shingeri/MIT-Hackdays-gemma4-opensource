import { useState } from 'react';
import { CommandBar } from './components/CommandBar';
import { ModelConfigModal } from './components/ModelConfigModal';
import { JudgeRubricModal } from './components/JudgeRubricModal';
import { IncidentReportModal } from './features/cases/IncidentReportModal';
import { CaseFeed } from './features/cases/CaseFeed';
import { CaseDetailWorkflow } from './features/cases/CaseDetailWorkflow';
import { TelemetryInspector } from './features/cases/TelemetryInspector';
import { ReplayDirector } from './features/replay/ReplayDirector';

import { 
  loadCases, 
  saveCases, 
  saveOrUpdateCase, 
  mergeEvidenceIntoCase, 
  resetToDemoData, 
  getSessionApiKey, 
  setSessionApiKey, 
  getSelectedModel, 
  setSelectedModel, 
  getDemoMode, 
  setDemoMode 
} from './services/storage';

import { 
  brokenRampSvg, 
  rampRebarSvg, 
  rampRainSvg, 
  repairedRampSvg 
} from './data/presetAssets';

import type { CivicCase, EvidenceItem, MergeLog } from './types/case';
import type { ApiConfig, DuplicateMatchResult } from './types/ai';

export function App() {
  const [cases, setCases] = useState<CivicCase[]>(() => loadCases());
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    const loaded = loadCases();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState<boolean>(false);

  // Replay state
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [replayStep, setReplayStep] = useState<number>(1);

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<'feed' | 'workflow' | 'telemetry'>('workflow');

  // AI & telemetry config
  const [apiKey, setApiKey] = useState<string>(() => getSessionApiKey());
  const [selectedModelName, setSelectedModelName] = useState<string>(() => getSelectedModel());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => getDemoMode());
  const [aiCallsCount, setAiCallsCount] = useState<number>(3); // Initial seeded inferences

  // Current selected case
  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  // Save API key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setSessionApiKey(key);
  };

  // Select Model
  const handleSelectModel = (model: string) => {
    setSelectedModelName(model);
    setSelectedModel(model);
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = (demo: boolean) => {
    setIsDemoMode(demo);
    setDemoMode(demo);
  };

  // Handle new case created
  const handleCaseCreated = (newCase: CivicCase) => {
    const updated = saveOrUpdateCase(newCase);
    setCases(updated);
    setSelectedCaseId(newCase.id);
    setAiCallsCount(prev => prev + 1);
  };

  // Handle evidence merged
  const handleEvidenceMerged = (
    targetCaseId: string,
    evidence: EvidenceItem,
    match: DuplicateMatchResult
  ) => {
    const merged = mergeEvidenceIntoCase(targetCaseId, evidence, match);
    if (merged) {
      const updatedList = loadCases();
      setCases(updatedList);
      setSelectedCaseId(targetCaseId);
    }
  };

  // Handle case updated
  const handleUpdateCase = (updatedCase: CivicCase) => {
    const updated = saveOrUpdateCase(updatedCase);
    setCases(updated);
    if (updatedCase.verification) {
      setAiCallsCount(prev => prev + 1);
    }
  };

  // Reset to default demo state
  const handleResetDemo = () => {
    const defaultCases = resetToDemoData();
    setCases(defaultCases);
    setSelectedCaseId(defaultCases[0]?.id || null);
    setIsReplayActive(false);
    setReplayStep(1);
  };

  // COMMUNITY PROBLEM REPLAY STEP CONTROLLER
  const handleReplayStepChange = (step: number) => {
    setReplayStep(step);

    // Target demonstration case ID: CIV-8492-A
    const baseTarget = cases.find(c => c.id === 'CIV-8492-A') || cases[0];
    if (!baseTarget) return;

    let modifiedCase: CivicCase = { ...baseTarget };

    if (step === 1) {
      // Step 1: Single original report by Student Reporter 1
      modifiedCase = {
        ...modifiedCase,
        status: 'REPORTED',
        priorityScore: 90,
        evidence: [
          {
            id: 'EV-8492-1',
            reportId: 'REP-0914-01',
            reporterLabel: 'Student Reporter 1 (Access Committee)',
            imageUrl: brokenRampSvg,
            timestamp: '2026-10-25T09:14:00Z',
            description: 'Severe transversal fracture across the primary accessibility ramp. A 1.5-inch vertical displacement blocks wheelchair transit and poses a trip hazard.',
            zone: 'Main Library',
            landmark: 'West Accessibility Ramp',
            isPrimary: true,
          },
        ],
        mergeHistory: [],
        verification: undefined,
      };
    } else if (step === 2) {
      // Step 2: Student Reporter 2 submits second photo showing exposed rebar; duplicate merged
      const evidence2: EvidenceItem = {
        id: 'EV-8492-2',
        reportId: 'REP-1002-02',
        reporterLabel: 'Student Reporter 2 (Architecture Student)',
        imageUrl: rampRebarSvg,
        timestamp: '2026-10-25T10:02:00Z',
        description: 'Close-up evidence showing exposed oxidized steel rebar grid within concrete cavity.',
        zone: 'Main Library',
        landmark: 'West Ramp East Edge',
        isPrimary: false,
      };

      const mergeLog1: MergeLog = {
        mergedReportId: 'REP-1002-02',
        reporterLabel: 'Student Reporter 2 (Architecture Student)',
        mergedAt: '2026-10-25T10:02:30Z',
        duplicateScore: 88,
        scoreBreakdown: { zoneScore: 40, categoryScore: 35, keywordScore: 13 },
        reason: 'Identical campus zone: "Main Library" (+40 pts) • Identical category: "Accessibility" (+35 pts) • Shared keywords [concrete, ramp, spalling] (+13 pts)',
      };

      modifiedCase = {
        ...modifiedCase,
        status: 'UNDER_REVIEW',
        priorityScore: 94,
        evidence: [baseTarget.evidence[0], evidence2],
        mergeHistory: [mergeLog1],
        verification: undefined,
      };
    } else if (step === 3) {
      // Step 3: Student Reporter 3 submits photo under rain; 3 reports converged
      const evidence2: EvidenceItem = {
        id: 'EV-8492-2',
        reportId: 'REP-1002-02',
        reporterLabel: 'Student Reporter 2 (Architecture Student)',
        imageUrl: rampRebarSvg,
        timestamp: '2026-10-25T10:02:00Z',
        description: 'Close-up evidence showing exposed oxidized steel rebar grid within concrete cavity.',
        zone: 'Main Library',
        landmark: 'West Ramp East Edge',
        isPrimary: false,
      };

      const evidence3: EvidenceItem = {
        id: 'EV-8492-3',
        reportId: 'REP-1045-03',
        reporterLabel: 'Student Reporter 3 (Campus Commuter)',
        imageUrl: rampRainSvg,
        timestamp: '2026-10-25T10:45:00Z',
        description: 'Standing rain puddle accumulated over cracked slab creating hazardous slip conditions for wheelchairs and canes.',
        zone: 'Main Library',
        landmark: 'West Ramp Surface',
        isPrimary: false,
      };

      const mergeLog1: MergeLog = {
        mergedReportId: 'REP-1002-02',
        reporterLabel: 'Student Reporter 2 (Architecture Student)',
        mergedAt: '2026-10-25T10:02:30Z',
        duplicateScore: 88,
        scoreBreakdown: { zoneScore: 40, categoryScore: 35, keywordScore: 13 },
        reason: 'Identical campus zone: "Main Library" (+40 pts) • Identical category: "Accessibility" (+35 pts) • Shared keywords [concrete, ramp] (+13 pts)',
      };

      const mergeLog2: MergeLog = {
        mergedReportId: 'REP-1045-03',
        reporterLabel: 'Student Reporter 3 (Campus Commuter)',
        mergedAt: '2026-10-25T10:45:20Z',
        duplicateScore: 92,
        scoreBreakdown: { zoneScore: 40, categoryScore: 35, keywordScore: 17 },
        reason: 'Identical campus zone: "Main Library" (+40 pts) • Identical category: "Accessibility" (+35 pts) • Shared keywords [ramp, water, slip] (+17 pts)',
      };

      modifiedCase = {
        ...modifiedCase,
        status: 'WORK_ORDER_ISSUED',
        priorityScore: 98,
        evidence: [baseTarget.evidence[0], evidence2, evidence3],
        mergeHistory: [mergeLog1, mergeLog2],
        verification: undefined,
      };
    } else if (step === 4) {
      // Step 4: Repair evidence uploaded by Facilities Contractor
      modifiedCase = {
        ...modifiedCase,
        status: 'REPAIR_IN_PROGRESS',
        verification: {
          verificationStatus: 'UNDER_REVIEW',
          visualChangesObserved: [
            'Fresh concrete slab poured and screeded flush with entrance threshold',
            'Detectable warning tactile strip installed at apron landing',
          ],
          remainingConcerns: ['Awaiting multimodal AI visual comparison'],
          confidenceScore: 0.85,
          beforeImageUrl: brokenRampSvg,
          afterImageUrl: repairedRampSvg,
          verifiedAt: '2026-10-25T15:30:00Z',
          isSimulated: true,
          complianceDisclaimer:
            'NOTICE: Visual verification represents automated photographic comparison only. Official structural clearance requires on-site certified engineering inspection.',
        },
      };
    } else if (step === 5) {
      // Step 5: Visual verification completed & verified
      modifiedCase = {
        ...modifiedCase,
        status: 'VISUALLY_VERIFIED',
        verification: {
          verificationStatus: 'VISUALLY_VERIFIED',
          visualChangesObserved: [
            'Concrete transversal fracture ground down, backfilled, and resurfaced flush',
            'Grade transition restored to zero-threshold ADA compliance at entrance apron',
            'Yellow ADA detectable warning truncated domes installed at landing',
            'Handrail anchor posts re-secured with stainless steel base plates',
          ],
          remainingConcerns: [
            'Concrete requires 28-day compressive cure before motorized maintenance vehicle transit',
            'Confirm slip-resistance rating when wet',
          ],
          confidenceScore: 0.96,
          beforeImageUrl: brokenRampSvg,
          afterImageUrl: repairedRampSvg,
          verifiedAt: '2026-10-25T16:00:00Z',
          isSimulated: true,
          complianceDisclaimer:
            'NOTICE: Visual verification represents automated photographic comparison only and does NOT certify structural strength or building code compliance. A licensed municipal or university safety inspector must conduct on-site physical certification before final sign-off.',
        },
      };
    }

    // Save and update cases in state
    const updatedList = cases.map(c => (c.id === modifiedCase.id ? modifiedCase : c));
    setCases(updatedList);
    saveCases(updatedList);
    setSelectedCaseId(modifiedCase.id);
  };

  const startReplay = () => {
    setIsReplayActive(true);
    handleReplayStepChange(1);
  };

  const apiConfig: ApiConfig = {
    apiKey,
    selectedModel: selectedModelName,
    isDemoMode,
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col antialiased">
      {/* 1. Command Bar */}
      <CommandBar
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenRubricModal={() => setIsRubricModalOpen(true)}
        onStartReplay={startReplay}
        onResetDemo={handleResetDemo}
        isReplayActive={isReplayActive}
        selectedModel={selectedModelName}
        isDemoMode={isDemoMode}
        hasApiKey={Boolean(apiKey)}
      />

      {/* 2. Community Problem Replay Director (when active) */}
      {isReplayActive && (
        <ReplayDirector
          currentStep={replayStep}
          onStepChange={handleReplayStepChange}
          onClose={() => setIsReplayActive(false)}
        />
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 text-xs font-mono py-2">
        <button
          type="button"
          onClick={() => setMobileTab('feed')}
          className={`px-3 py-1 rounded ${mobileTab === 'feed' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Cases ({cases.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('workflow')}
          className={`px-3 py-1 rounded ${mobileTab === 'workflow' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Workflow & Dossier
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('telemetry')}
          className={`px-3 py-1 rounded ${mobileTab === 'telemetry' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          Telemetry
        </button>
      </div>

      {/* 3. Three-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Case Feed */}
        <div className={`w-full lg:w-80 xl:w-96 flex shrink-0 ${mobileTab === 'feed' ? 'flex' : 'hidden lg:flex'}`}>
          <CaseFeed
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={id => {
              setSelectedCaseId(id);
              setMobileTab('workflow');
            }}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        </div>

        {/* Center Panel: Case Workflow & Epistemic Analysis */}
        <div className={`flex-1 flex overflow-hidden ${mobileTab === 'workflow' ? 'flex' : 'hidden lg:flex'}`}>
          {activeCase ? (
            <CaseDetailWorkflow
              civicCase={activeCase}
              onUpdateCase={handleUpdateCase}
              apiConfig={apiConfig}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              No civic case selected
            </div>
          )}
        </div>

        {/* Right Panel: Telemetry & Evidence Inspector */}
        <div className={`w-full lg:w-72 xl:w-80 shrink-0 ${mobileTab === 'telemetry' ? 'flex' : 'hidden lg:flex'}`}>
          {activeCase && (
            <TelemetryInspector
              civicCase={activeCase}
              allCases={cases}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        existingCases={cases}
        onCaseCreated={handleCaseCreated}
        onEvidenceMerged={handleEvidenceMerged}
        apiConfig={apiConfig}
      />

      <ModelConfigModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModelName}
        onSelectModel={handleSelectModel}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      <JudgeRubricModal
        isOpen={isRubricModalOpen}
        onClose={() => setIsRubricModalOpen(false)}
        cases={cases}
        selectedModel={selectedModelName}
        isDemoMode={isDemoMode}
        aiCallsCount={aiCallsCount}
      />
    </div>
  );
}
export default App;
