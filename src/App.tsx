import { useState, useMemo, useEffect } from 'react';
import { CommandBar, type AppTab } from './components/CommandBar';
import { CaseFeed } from './features/cases/CaseFeed';
import { CaseDetailWorkflow } from './features/cases/CaseDetailWorkflow';
import { InspectWorkflow } from './features/inspect/InspectWorkflow';
import { AboutView } from './components/AboutView';
import { LeaderboardView } from './components/LeaderboardView';
import { ModelConfigModal } from './components/ModelConfigModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ReplayDirector } from './features/replay/ReplayDirector';

import { 
  ClipboardList, 
  Camera, 
  Info,
  Trophy,
  ShieldCheck,
  WifiOff,
  Download 
} from 'lucide-react';
import { useOnlineStatus, usePwaInstallPrompt } from './services/pwa';

import { 
  loadCases, 
  saveCases, 
  saveOrUpdateCase, 
  clearUserCases,
  getSessionApiKey, 
  setSessionApiKey, 
  getSelectedModel, 
  setSelectedModel, 
  getDemoMode, 
  setDemoMode 
} from './services/storage';

import { getCurrentUser, logoutUser } from './services/auth';
import { getPublicProfile } from './services/reputation';

import { 
  brokenRampSvg, 
  rampRebarSvg, 
  rampRainSvg, 
  repairedRampSvg 
} from './data/presetAssets';

import type { CivicCase, EvidenceItem, MergeLog } from './types/case';
import type { ApiConfig } from './types/ai';
import type { UserAccount, PublicUserProfile } from './types/auth';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('reports');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => getDemoMode());
  const [cases, setCases] = useState<CivicCase[]>(() => loadCases(getDemoMode()));
  
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    const loaded = loadCases(getDemoMode());
    return loaded.length > 0 ? loaded[0].id : null;
  });

  // Mobile reports view: 'list' | 'detail'
  const [mobileReportsView, setMobileReportsView] = useState<'list' | 'detail'>('list');
  const [feedFilter, setFeedFilter] = useState<'All' | 'Active' | 'Resolved' | 'My Reports'>('All');

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Contributor profile modal
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Modals & Replay
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [replayStep, setReplayStep] = useState<number>(1);

  // AI & telemetry config
  const [apiKey, setApiKey] = useState<string>(() => getSessionApiKey());
  const [selectedModelName, setSelectedModelName] = useState<string>(() => getSelectedModel());

  // PWA and Network state
  const isOnline = useOnlineStatus();
  const { installPrompt, triggerInstall } = usePwaInstallPrompt();

  // Active case in view
  const activeCase = cases.find(c => c.id === selectedCaseId) || (cases.length > 0 ? cases[0] : null);

  // Resolved public profile for modal
  const publicProfile: PublicUserProfile | null = useMemo(() => {
    if (!selectedProfileUserId) return null;
    return getPublicProfile(selectedProfileUserId);
  }, [selectedProfileUserId]);

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
  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    setDemoMode(nextMode);
    const reloaded = loadCases(nextMode);
    setCases(reloaded);
    setSelectedCaseId(reloaded.length > 0 ? reloaded[0].id : null);
    setMobileReportsView('list');
  };

  // Handle new case created from InspectWorkflow
  const handleCaseCreated = (newCase: CivicCase) => {
    const updated = saveOrUpdateCase(newCase, isDemoMode);
    setCases(updated);
    setSelectedCaseId(newCase.id);
    setActiveTab('reports');
    setMobileReportsView('detail');
  };

  // Handle case updated
  const handleUpdateCase = (updatedCase: CivicCase) => {
    const updated = saveOrUpdateCase(updatedCase, isDemoMode);
    setCases(updated);
  };

  // Handle case deleted
  const handleDeleteCase = (deletedId: string) => {
    const updated = cases.filter(c => c.id !== deletedId);
    setCases(updated);
    setSelectedCaseId(updated.length > 0 ? updated[0].id : null);
    setMobileReportsView('list');
  };

  // Handle Auth Login / Register Success
  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Open Contributor Profile
  const handleOpenProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setIsProfileModalOpen(true);
  };

  // Filter My Reports
  const handleFilterMyReports = () => {
    setActiveTab('reports');
    setFeedFilter('My Reports');
    setMobileReportsView('list');
  };

  // Keyboard navigation shortcuts (1: Reports, 2: Inspect, 3: Leaderboard, 4: About)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '1') {
        setActiveTab('reports');
      } else if (e.key === '2') {
        setActiveTab('inspect');
      } else if (e.key === '3') {
        setActiveTab('leaderboard');
      } else if (e.key === '4') {
        setActiveTab('about');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear local data
  const handleClearData = () => {
    if (window.confirm('Reset all local incident records? This will clear locally recorded cases.')) {
      clearUserCases();
      const reloaded = loadCases(isDemoMode);
      setCases(reloaded);
      setSelectedCaseId(null);
      setMobileReportsView('list');
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
    saveCases(updatedList, isDemoMode);
    setSelectedCaseId(modifiedCase.id);
    setActiveTab('reports');
    setMobileReportsView('detail');
  };

  const startReplay = () => {
    if (!isDemoMode) {
      handleToggleDemoMode();
    }
    setIsReplayActive(true);
    handleReplayStepChange(1);
  };

  const apiConfig: ApiConfig = {
    apiKey,
    selectedModel: selectedModelName,
    isDemoMode,
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-950 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Incident records and offline tools remain operational. Live AI analysis requires internet connectivity.
            </span>
          </div>
        </div>
      )}

      {/* PWA Install Promotion Banner */}
      {installPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>Install REPAIR.AI on your device for rapid offline field inspection.</span>
          </div>
          <button
            type="button"
            onClick={triggerInstall}
            className="min-h-[30px] px-3 py-1 rounded-lg bg-white text-blue-700 font-bold hover:bg-blue-50 active:scale-95 transition-all"
          >
            Install
          </button>
        </div>
      )}

      {/* 1. Fixed Top CommandBar (macOS Translucent Glass, Stays Fixed) */}
      <CommandBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        reportsCount={cases.length}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={handleOpenProfile}
        onFilterMyReports={handleFilterMyReports}
        onLogout={handleLogout}
      />

      {/* 2. Main Content View Area (Scrolls independently; Never covered by navigation) */}
      <main id="main-content" className="flex-1 overflow-hidden pt-16 pb-16 lg:pb-0 flex flex-col">
        {activeTab === 'reports' && (
          <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
            {/* Left Column: Reports List */}
            <div
              className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full border-r border-slate-200/80 ${
                mobileReportsView === 'list' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <CaseFeed
                cases={cases}
                selectedCaseId={selectedCaseId}
                onSelectCase={id => {
                  setSelectedCaseId(id);
                  setMobileReportsView('detail');
                }}
                onStartInspection={() => setActiveTab('inspect')}
                isDemoMode={isDemoMode}
                onToggleDemoMode={handleToggleDemoMode}
                currentUserId={currentUser?.id}
                initialFilter={feedFilter}
              />
            </div>

            {/* Right Column: Active Case Workflow */}
            <div
              className={`flex-1 h-full overflow-hidden ${
                mobileReportsView === 'detail' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {activeCase ? (
                <CaseDetailWorkflow
                  civicCase={activeCase}
                  onUpdateCase={handleUpdateCase}
                  onDeleteCase={handleDeleteCase}
                  currentUser={currentUser}
                  apiConfig={apiConfig}
                  onBackToList={() => setMobileReportsView('list')}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onSelectContributor={handleOpenProfile}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <ShieldCheck className="w-12 h-12 stroke-[1.5] text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No Report Selected</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Select a report from the list on the left, or launch an inspection to document an incident.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inspect' && (
          <InspectWorkflow
            onReportSubmitted={handleCaseCreated}
            onCancel={() => setActiveTab('reports')}
            apiConfig={apiConfig}
            isDemoMode={isDemoMode}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            currentUser={currentUser}
            onSelectContributor={handleOpenProfile}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'about' && (
          <AboutView
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            selectedModel={selectedModelName}
            onSelectModel={handleSelectModel}
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
            onStartReplay={startReplay}
            cases={cases}
            onClearData={handleClearData}
          />
        )}
      </main>

      {/* 3. Fixed Mobile Bottom Tab Bar (macOS Glass Style, Stays Fixed) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/85 border-t border-slate-200/70 px-4 py-1 pb-safe flex items-center justify-around shadow-lg">
        {/* Destination 1: Reports */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('reports');
            if (cases.length === 0) setMobileReportsView('list');
          }}
          className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            activeTab === 'reports' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="View Reports"
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {cases.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] bg-slate-900 text-white font-bold">
                {cases.length}
              </span>
            )}
          </div>
          <span>Reports</span>
        </button>

        {/* Destination 2: Inspect (Centered Action Pill) */}
        <button
          type="button"
          onClick={() => setActiveTab('inspect')}
          className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all ${
            activeTab === 'inspect'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Inspect Fault"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'inspect'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700'
          }`}>
            <Camera className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span>Inspect</span>
        </button>

        {/* Destination 3: Leaderboard */}
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            activeTab === 'leaderboard' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Reputation & Leaderboard"
        >
          <Trophy className="w-5 h-5" />
          <span>Ranks</span>
        </button>

        {/* Destination 4: About */}
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
            activeTab === 'about' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="About & Settings"
        >
          <Info className="w-5 h-5" />
          <span>About</span>
        </button>
      </nav>

      {/* Simplified Model Settings Sheet */}
      <ModelConfigModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModelName}
        onSelectModel={handleSelectModel}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Contributor Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={publicProfile}
        currentUserId={currentUser?.id}
        onViewReport={reportId => {
          setSelectedCaseId(reportId);
          setActiveTab('reports');
          setMobileReportsView('detail');
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      {/* Guided Community Problem Replay Overlay */}
      {isReplayActive && (
        <ReplayDirector
          currentStep={replayStep}
          onStepChange={handleReplayStepChange}
          onClose={() => setIsReplayActive(false)}
        />
      )}
    </div>
  );
}

export default App;
