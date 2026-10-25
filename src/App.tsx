import { useState } from 'react';
import { CommandBar } from './components/CommandBar';
import { ModelConfigModal } from './components/ModelConfigModal';
import { JudgeRubricModal } from './components/JudgeRubricModal';
import { IncidentReportModal } from './features/cases/IncidentReportModal';
import { CaseFeed } from './features/cases/CaseFeed';
import { CaseDetailWorkflow } from './features/cases/CaseDetailWorkflow';
import { ReplayDirector } from './features/replay/ReplayDirector';

import { 
  ClipboardList, 
  Plus, 
  Play, 
  HelpCircle,
  ShieldCheck,
  WifiOff,
  Download 
} from 'lucide-react';
import { useOnlineStatus, usePwaInstallPrompt } from './services/pwa';

import { 
  loadCases, 
  saveCases, 
  saveOrUpdateCase, 
  mergeEvidenceIntoCase, 
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

  // Mobile view state: 'list' | 'detail'
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState<boolean>(false);

  // Replay state
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [replayStep, setReplayStep] = useState<number>(1);

  // AI & telemetry config
  const [apiKey, setApiKey] = useState<string>(() => getSessionApiKey());
  const [selectedModelName, setSelectedModelName] = useState<string>(() => getSelectedModel());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => getDemoMode());
  const [aiCallsCount, setAiCallsCount] = useState<number>(3); // Initial seeded count

  // PWA and Network state
  const isOnline = useOnlineStatus();
  const { installPrompt, triggerInstall } = usePwaInstallPrompt();

  // Active case
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
    setMobileView('detail');
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
      setMobileView('detail');
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

  // COMMUNITY PROBLEM REPLAY STEP CONTROLLER
  const handleReplayStepChange = (step: number) => {
    setReplayStep(step);

    const baseTarget = cases.find(c => c.id === 'CIV-8492-A') || cases[0];
    if (!baseTarget) return;

    let modifiedCase: CivicCase = { ...baseTarget };

    if (step === 1) {
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

    const updatedList = cases.map(c => (c.id === modifiedCase.id ? modifiedCase : c));
    setCases(updatedList);
    saveCases(updatedList);
    setSelectedCaseId(modifiedCase.id);
    setMobileView('detail');
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-950 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Field records and Community Problem Replay remain fully operational. Live Gemma API analysis requires internet connectivity.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] bg-amber-600/30 px-2 py-0.5 rounded text-amber-950">
            Local Persistence Ready
          </span>
        </div>
      )}

      {/* PWA Install Promotion Banner (when browser prompt is available) */}
      {installPrompt && (
        <div className="bg-blue-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>Install REPAIR.AI on your device for one-tap field access &amp; offline reliability.</span>
          </div>
          <button
            type="button"
            onClick={triggerInstall}
            className="min-h-[32px] px-3 py-1 rounded-md bg-white text-blue-700 font-bold hover:bg-blue-50 active:scale-95 transition-all"
          >
            Install App
          </button>
        </div>
      )}

      {/* 1. Simplified Main Navigation */}
      <CommandBar
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenRubricModal={() => setIsRubricModalOpen(true)}
        onStartReplay={startReplay}
        isReplayActive={isReplayActive}
        totalReportsCount={cases.length}
      />

      {/* 2. Guided Community Problem Replay (when active) */}
      {isReplayActive && (
        <ReplayDirector
          currentStep={replayStep}
          onStepChange={handleReplayStepChange}
          onClose={() => setIsReplayActive(false)}
        />
      )}

      {/* 3. Main Workspace: Clean 2-Column Layout on Desktop, Fluid on Mobile */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Column: Reports List */}
        <div
          className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full border-r border-slate-200 ${
            mobileView === 'list' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <CaseFeed
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={id => {
              setSelectedCaseId(id);
              setMobileView('detail');
            }}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        </div>

        {/* Right Column: Selected Report Detail */}
        <div
          className={`flex-1 h-full overflow-hidden ${
            mobileView === 'detail' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeCase ? (
            <CaseDetailWorkflow
              civicCase={activeCase}
              onUpdateCase={handleUpdateCase}
              apiConfig={apiConfig}
              onBackToList={() => setMobileView('list')}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
              <p className="text-sm font-medium">Select a report from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Mobile Bottom Navigation Bar with Safe Area support */}
      <nav className="lg:hidden sticky bottom-0 z-30 w-full bg-white border-t border-slate-200 py-1 px-3 pb-safe flex items-center justify-around shadow-md">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`min-h-[44px] min-w-[44px] px-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            mobileView === 'list' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
          }`}
          aria-label="View all incident cases"
        >
          <ClipboardList className="w-5 h-5" />
          <span>Cases</span>
        </button>

        {activeCase && (
          <button
            type="button"
            onClick={() => setMobileView('detail')}
            className={`min-h-[44px] min-w-[44px] px-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              mobileView === 'detail' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
            aria-label="View active case workflow"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="truncate max-w-[64px]">Workflow</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center -mt-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-md active:scale-95 transition-transform focus:ring-2 focus:ring-blue-500"
          title="Report New Incident"
          aria-label="Report New Incident"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={startReplay}
          className={`min-h-[44px] min-w-[44px] px-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            isReplayActive ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Community Problem Replay"
        >
          <Play className="w-5 h-5" />
          <span>Replay</span>
        </button>

        <button
          type="button"
          onClick={() => setIsRubricModalOpen(true)}
          className="min-h-[44px] min-w-[44px] px-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Project Rubric and Architecture"
        >
          <HelpCircle className="w-5 h-5" />
          <span>About</span>
        </button>
      </nav>

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
