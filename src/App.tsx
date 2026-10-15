import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Share2,
  BookOpen,
  User,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { Astrolabe3D } from './components/Astrolabe3D';
import type { ChartCue } from './services/natallyChat';
import { DraggableCard } from './components/DraggableCard';
import { FirstLight } from './components/onboarding/FirstLight';
import { NatalInputForm } from './components/NatalInputForm';
import { ThemesAndWisdomBox } from './components/ThemesAndWisdomBox';
import { NatallyChatbot } from './components/NatallyChatbot';
import { NatallySprite } from './components/NatallySprite';
import { NatallyIcon } from './components/NatallyIcon';
import { SelectedComponentsBar } from './components/SelectedComponentsBar';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { ReadingsModal } from './components/ReadingsModal';
import {
  calculateNatalChart,
  NatalChartInput,
  NatalChartResult,
  formatLongitude,
} from './services/ephemeris';
import { computeThemesAndWisdom, NumerologyAndThemes } from './services/astrowisdom';
import { generateAstrologicalReading } from './services/readings';
import {
  VoiceSettings,
  loadVoiceSettings,
  saveVoiceSettings,
  stopSpeaking,
} from './services/voiceService';
import { loadAccountValue, saveAccountValue } from './services/accountStorage';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { loadGazetteer } from './services/gazetteer';
import { createSessionProfileLoader, getEntryStage, type SessionProfileState } from './services/sessionProfile';
import {
  IntakeStorageBillingError,
  clearNatalIntake,
  fetchUserIntake,
  uploadUserIntake,
} from './services/onboarding';
import {
  IntakeDraft,
  intakeToChartInput,
  loadNatalIntake,
  saveNatalIntake,
} from './services/onboarding';

const LORE_STORAGE_KEY = 'astrosphere_user_lore_v1';

export default function App() {
  const [chartInput, setChartInput] = useState<NatalChartInput | null>(null);
  const [chartResult, setChartResult] = useState<NatalChartResult | null>(null);
  const [wisdom, setWisdom] = useState<NumerologyAndThemes | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [onboardBusy, setOnboardBusy] = useState<boolean>(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [inspectorTab, setInspectorTab] = useState<'planets' | 'houses'>('planets');
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(true);

  // Multi-Selection State for Shift-/Ctrl-Clicking Components
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [chartFocus, setChartFocus] = useState<{ chart: NatalChartResult; targets: string[] } | null>(null);
  const handleChartFocus = useCallback((targets: string[], sourceChart: NatalChartResult) => {
    setChartFocus(previous => previous?.chart === sourceChart && previous.targets.join('\0') === targets.join('\0')
      ? previous : { chart: sourceChart, targets });
  }, []);
  const [isGeneratingMultiReading, setIsGeneratingMultiReading] = useState(false);
  const [isNatalParamsRolledUp, setIsNatalParamsRolledUp] = useState(true);
  const [isThemesRolledUp, setIsThemesRolledUp] = useState(false);

  // Natally Companion State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [synastryChart, setSynastryChart] = useState<NatalChartResult | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSnippet, setSpeechSnippet] = useState<string | null>(null);
  const [activeTargetEntity, setActiveTargetEntity] = useState<string | null>(null);
  // Keyboard quick-entry: typing anything (no field focused) summons a small
  // chat entry box — mouseless desktop path that never blocks the torus view.
  const [quickEntryOpen, setQuickEntryOpen] = useState<boolean>(false);
  const [quickMessage, setQuickMessage] = useState<{ text: string; nonce: number } | null>(null);
  const [externalReadingToInject, setExternalReadingToInject] = useState<{
    title: string;
    content: string;
    type: string;
    sender?: 'user' | 'natally';
    chartCues?: ChartCue[];
    chartFocusKey?: string;
  } | null>(null);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReadingsModal, setShowReadingsModal] = useState(false);
  const [readingsInitialType, setReadingsInitialType] = useState<
    'horoscope' | 'synastry' | 'house' | 'planet' | 'aspect'
  >('horoscope');
  const [readingsTargetKey, setReadingsTargetKey] = useState<string | undefined>(undefined);

  // User state & Persistent Lore memory store
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authResolved, setAuthResolved] = useState<boolean>(false);
  const [profileState, setProfileState] = useState<SessionProfileState<NatalChartInput>>({ uid: null, status: 'loading', profile: null, error: null });
  const profileLoader = useRef<ReturnType<typeof createSessionProfileLoader<NatalChartInput>> | null>(null);
  const sessionGeneration = useRef(0);
  const booted = useRef(false);
  // Billing/quota storage failure: proceeding unmetered would leak funds.
  const [storageBillingBlocked, setStorageBillingBlocked] = useState<string | null>(null);
  const [userLore, setUserLore] = useState<string[]>([]);
  // This closure belongs to one authenticated session, including A→B→A changes.
  const renderGeneration = sessionGeneration.current;
  const isCurrentSession = () => !!user && auth.currentUser?.uid === user.uid &&
    sessionGeneration.current === renderGeneration;

  useEffect(() => {
    if (isCurrentSession()) saveAccountValue(LORE_STORAGE_KEY, user!.uid, userLore);
  }, [userLore, user]);

  useEffect(() => {
    if (!authResolved || !user || profileState.status !== 'ready' || !chartInput) return;
    const onAnyKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setQuickEntryOpen(false); return; }
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      const printable = e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter';
      if (!inField && !quickEntryOpen && printable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setQuickEntryOpen(true);
      }
    };
    window.addEventListener('keydown', onAnyKey);
    return () => window.removeEventListener('keydown', onAnyKey);
  }, [quickEntryOpen, authResolved, user, profileState.status, chartInput]);

  useEffect(() => {
    const loader = createSessionProfileLoader<NatalChartInput>(async uid => {
      const remote = await fetchUserIntake(uid);
      return remote ?? loadNatalIntake(uid);
    }, state => {
      setProfileState(state);
      if (state.status === 'ready' && state.uid && auth.currentUser?.uid === state.uid) {
        if (state.profile) saveNatalIntake(state.profile, state.uid);
        setChartInput(state.profile);
      }
    });
    profileLoader.current = loader;
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      sessionGeneration.current += 1;
      booted.current = false;
      stopSpeaking();
      setIsSpeaking(false);
      setSpeechSnippet(null);
      setActiveTargetEntity(null);
      setSelectedComponents([]);
      setChartFocus(null);
      setIsGeneratingMultiReading(false);
      const lore = loadAccountValue<unknown>(LORE_STORAGE_KEY, currentUser?.uid, []);
      setUserLore(Array.isArray(lore) ? lore.filter((item): item is string => typeof item === 'string') : []);
      setUser(currentUser);
      setAuthResolved(true);
      setChartInput(null);
      setChartResult(null);
      setWisdom(null);
      setSynastryChart(null);
      setStorageBillingBlocked(null);
      setOnboardError(null);
      setOnboardBusy(false);
      setIsCalculating(false);
      setIsChatOpen(false);
      setQuickEntryOpen(false);
      setQuickMessage(null);
      setExternalReadingToInject(null);
      setShowAuthModal(false);
      setShowReadingsModal(false);
      setShowExportModal(false);
      void loader.load(currentUser?.uid ?? null);
    }, () => {
      sessionGeneration.current += 1;
      stopSpeaking();
      setUserLore([]);
      setChartInput(null);
      setChartResult(null);
      setSpeechSnippet(null);
      setChartFocus(null);
      setIsSpeaking(false);
      setAuthResolved(true);
      setUser(null);
      void loader.load(null);
    });
    return () => { unsubscribe(); loader.dispose(); sessionGeneration.current += 1; profileLoader.current = null; };
  }, []);

  const runCalculation = useCallback(async (input: NatalChartInput, isUserSubmission = false) => {
    const generation = sessionGeneration.current;
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    setIsCalculating(true);
    try {
      const res = await calculateNatalChart(input);
      if (generation !== sessionGeneration.current || auth.currentUser?.uid !== uid) return false;
      setChartResult(res);
      stopSpeaking();
      setChartFocus(null);
      setSynastryChart(null);
      setChartInput(input);
      setSelectedComponents([]);

      const w = computeThemesAndWisdom(res);
      setWisdom(w);
      // Automatically roll up natal parameters like a shade & reveal major themes under it!
      setIsNatalParamsRolledUp(true);
      setIsThemesRolledUp(true);
      try {
        localStorage.removeItem('astrosphere_card_pos_themes-wisdom');
        localStorage.removeItem('astrosphere_card_pos_natal-params');
      } catch (_) {}
      setResetTrigger((c) => c + 1);

      if (isUserSubmission) {
        setExternalReadingToInject({
          title: `Your natal chart and today's sky · ${input.name}`,
          content: 'Give me my first reading in two clear sections: first explain my natal chart and how its main placements fit together; then examine it in relation to today’s calculated planetary positions and transit-to-natal aspects. State the observation date, time, timezone and location status. Use only the calculated facts provided, distinguish enduring natal themes from current transits, and finish with one practical reflection. If my birth time is unknown, explain the limitations. Keep it approachable and under 650 words.',
          type: 'initial_reading',
          sender: 'user',
        });
        setIsChatOpen(true);
      }
    } catch (err) {
      console.error('Swiss Ephemeris calculation error:', err);
      return false;
    } finally {
      if (generation === sessionGeneration.current) setIsCalculating(false);
    }
    return true;
  }, []);

  const handleDiscussWithNatally = (title: string, query: string) => {
    setExternalReadingToInject({
      title,
      content: query,
      type: 'user_query',
      sender: 'user',
    });
    setIsChatOpen(true);
  };

  const handleToggleNatalParams = (rolledUp: boolean) => {
    setIsNatalParamsRolledUp(rolledUp);
    if (!rolledUp) {
      // User expanded natal parameters: roll up themes to preserve vertical space
      setIsThemesRolledUp(true);
    } else {
      // User rolled up natal parameters: reveal themes right under the title bar!
      setIsThemesRolledUp(false);
    }
  };

  // First-light onboarding: cast the sky the moment the intake completes.
  const handleOnboarded = useCallback(
    async (draft: IntakeDraft) => {
      const uid = auth.currentUser?.uid;
      const generation = sessionGeneration.current;
      if (!uid) return;
      setOnboardBusy(true);
      setOnboardError(null);
      try {
        const input = intakeToChartInput(draft);
        saveNatalIntake(input, uid);
        if (auth.currentUser?.uid === uid) {
          try {
            await uploadUserIntake(uid, input);
          } catch (err) {
            if (generation !== sessionGeneration.current) return;
            if (err instanceof IntakeStorageBillingError) { setStorageBillingBlocked(err.message); return; }
            throw err;
          }
        }
        if (generation !== sessionGeneration.current || auth.currentUser?.uid !== uid) return;
        booted.current = true;
        const cast = await runCalculation(input, true);
        if (!cast) throw new Error('Your sky could not be drawn. Please try again.');
      } catch (err) {
        if (generation !== sessionGeneration.current) return;
        setOnboardError(
          err instanceof Error ? err.message : 'Your sky could not be drawn. Please try again.'
        );
      } finally {
        if (generation === sessionGeneration.current) setOnboardBusy(false);
      }
    },
    [runCalculation]
  );

  // Returning visitors: their persisted intake recasts on load, once.
  useEffect(() => {
    if (!authResolved || !user || profileState.uid !== user.uid || profileState.status !== 'ready' || !chartInput || booted.current) return;
    booted.current = true;
    runCalculation(chartInput, false);
  }, [chartInput, runCalculation, authResolved, user, profileState]);

  // Handle Shift-/Ctrl-Click multi-selection toggle
  const handleToggleComponent = (componentId: string, isMulti: boolean) => {
    if (isMulti) {
      setSelectedComponents((prev) =>
        prev.includes(componentId)
          ? prev.filter((id) => id !== componentId)
          : [...prev, componentId]
      );
    } else {
      setSelectedComponents((prev) =>
        prev.length === 1 && prev[0] === componentId ? [] : [componentId]
      );
    }
    setActiveTargetEntity(componentId);
  };

  const handleClearSelection = () => {
    setSelectedComponents([]);
    setActiveTargetEntity(null);
  };

  const handleRemoveComponent = (id: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c !== id));
  };

  // Begin Intuitive Reading based on selected components
  const handleBeginIntuitiveReading = async (components: string[]) => {
    if (!isCurrentSession() || !chartResult || components.length === 0) return;
    setIsGeneratingMultiReading(true);

    try {
      const title = `Intuitive Synthesis: ${components.join(' · ')}`;
      const res = await generateAstrologicalReading({
        type: 'aspect',
        targetKey: components.join(' and '),
        chart: chartResult,
        userLore,
        isCurrentSession,
      });
      if (!isCurrentSession()) return;

      // Inject directly into Natally's persistent conversation and save lore
      setExternalReadingToInject({
        title,
        content: res.content,
        chartCues: res.chartCues,
        chartFocusKey: res.chartFocusKey,
        type: 'selected_components',
      });
      setIsChatOpen(true);
      setActiveTargetEntity(components[0]);
    } catch (e) {
      console.error(e);
    } finally {
      if (isCurrentSession()) setIsGeneratingMultiReading(false);
    }
  };

  const handleOpenReading = (
    type: 'horoscope' | 'synastry' | 'house' | 'planet' | 'aspect',
    targetKey?: string
  ) => {
    setReadingsInitialType(type);
    setReadingsTargetKey(targetKey);
    setShowReadingsModal(true);
  };

  const handleAddUserLore = (newLore: string) => {
    if (!isCurrentSession()) return;
    setUserLore((prev) => (prev.includes(newLore) ? prev : [newLore, ...prev]));
  };

  const handleSpeechStateChange = (
    speaking: boolean,
    snippet: string | null,
    targetEntity: string | null
  ) => {
    if (!isCurrentSession()) return;
    setIsSpeaking(speaking);
    setSpeechSnippet(snippet);
      setActiveTargetEntity(targetEntity);
  };

  const entryStage = getEntryStage(authResolved, user?.uid ?? null, profileState, chartInput !== null);
  if (entryStage === 'login') {
    return <div className="min-h-dvh bg-[#120c1c]"><AuthModal user={null} required onClose={() => {}} /></div>;
  }
  if (entryStage === 'session-loading' || entryStage === 'profile-loading' || entryStage === 'profile-error') {
    return <div className="min-h-dvh flex items-center justify-center p-6 bg-[#120c1c] text-[#f1e8d8]">
      <div className="celestial-panel max-w-md p-6 rounded-2xl space-y-4 text-center">
        <p role={entryStage === 'profile-error' ? 'alert' : 'status'}>{entryStage === 'session-loading' ? 'Restoring your sign-in…' : entryStage === 'profile-loading' ? 'Loading your saved Natally profile…' : 'Your saved profile could not be loaded. Please retry; your existing profile has not been replaced.'}</p>
        {entryStage === 'profile-error' && <button type="button" className="px-4 py-3 border rounded text-[#d4af37]" onClick={() => { void profileLoader.current?.load(auth.currentUser?.uid ?? null); }}>Retry profile loading</button>}
        {user && <button type="button" className="px-4 py-3 border rounded" onClick={() => { void signOut(auth).catch(error => setProfileState(previous => ({ ...previous, status: 'error', error: String(error) }))); }}>Sign out</button>}
      </div>
    </div>;
  }

  if (storageBillingBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#120c1c]">
        <div className="celestial-panel max-w-md rounded-2xl p-6 border border-red-500/40 text-center space-y-3">
          <h2 className="font-cinzel text-lg text-red-300">The observatory is closed</h2>
          <p className="text-sm text-red-200/90 font-mono">{storageBillingBlocked}</p>
          <p className="text-xs text-white/60 font-mono">
            Journey blocked on purpose: unmetered inference spend would leak funds. Restore
            Firebase billing/quota, then reload.
          </p>
        </div>
      </div>
    );
  }

  if (!chartInput) {
    return (
      <FirstLight
        gazetteer={loadGazetteer()}
        busy={onboardBusy}
        error={onboardError}
        onCreate={(draft) => {
          void handleOnboarded(draft);
        }}
      />
    );
  }

  const houseSystemLabel =
    chartInput.houseSystem === 'W'
      ? 'Whole Sign'
      : chartInput.houseSystem === 'K'
      ? 'Koch Houses'
      : chartInput.houseSystem === 'R'
      ? 'Regiomontanus'
      : chartInput.houseSystem === 'E'
      ? 'Equal Houses'
      : 'Placidus Houses';

  return (
    <div className="natally-workspace relative flex flex-col justify-between p-4 md:p-8 min-h-screen bg-[#120c1c] text-[#f1e8d8] overflow-hidden select-none">
      {/* 3D Astrolabe Three.js Viewport */}
      {chartResult && (
        <Astrolabe3D
          chart={chartResult}
          isSpinning={isSpinning}
          resetTrigger={resetTrigger}
          selectedComponents={selectedComponents}
          highlightedComponents={chartFocus?.chart === chartResult ? chartFocus.targets : []}
          onToggleComponent={handleToggleComponent}
          onSelectPlanet={(name) => {
            if (name) handleToggleComponent(name, false);
          }}
        />
      )}

      {chartFocus?.chart === chartResult && chartFocus.targets.length > 0 && (
        <div className="fixed left-3 top-28 z-40 max-w-[min(90vw,460px)] rounded-xl border border-[#d4af37]/60 bg-[#181126]/95 p-3 text-xs text-[#ffdf80] pointer-events-auto">
          <p role="status">Natally is highlighting: {chartFocus.targets.join(' · ')}</p>
          <button type="button" className="mt-2 underline cursor-pointer" onClick={() => { stopSpeaking(); setChartFocus(null); }}>Clear chart highlight</button>
        </div>
      )}

      {/* Floating Mascot Sprite with Mouse Following, Chart Walking & Bauble Interaction */}
      {chartResult && (
        <NatallySprite
          chart={chartResult}
          settings={voiceSettings}
          isSpeaking={isSpeaking}
          activeTargetEntity={activeTargetEntity}
          latestSpeechSnippet={speechSnippet}
          isOpen={isChatOpen}
          onOpenChat={() => setIsChatOpen(true)}
          onSelectPlanet={(name) => handleToggleComponent(name, false)}
        />
      )}

      {/* Selected Components Multi-Selection Action Ribbon */}
      <SelectedComponentsBar
        selectedComponents={selectedComponents}
        onRemoveComponent={handleRemoveComponent}
        onClearAll={handleClearSelection}
        onBeginIntuitiveReading={handleBeginIntuitiveReading}
        isGeneratingReading={isGeneratingMultiReading}
      />

      {/* Top Navigation & Ephemeris Telemetry Bar */}
      <header className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#d4af37]/25 pb-3 z-20 pointer-events-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          <NatallyIcon size="header" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-cinzel text-lg sm:text-xl md:text-2xl text-[#f2ca50] tracking-wider uppercase font-bold shrink-0">
                AstroSphere 3D
              </h1>
              {chartResult && (
                <span className="font-fraunces text-xs sm:text-sm text-[#f2a38c] sm:border-l border-[#d4af37]/30 sm:pl-2.5 truncate">
                  {chartResult.input.name} · {chartResult.input.birthDate} ({chartResult.input.birthTime}) · {chartResult.input.placeName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <p className="font-mono text-[10px] sm:text-xs text-[#d4af37]/75">
                Swiss Ephemeris v{chartResult?.engineVersion || '2.10.03'} · {houseSystemLabel} · Geocentric
              </p>
              {chartResult && (
                <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleOpenReading('planet', 'Ascendant')}
                    className="px-2 py-0.5 rounded bg-[#1e152e] border border-[#d4af37]/40 text-[#f2ca50] whitespace-nowrap hover:border-[#f2ca50] transition-colors cursor-pointer"
                  >
                    {chartResult.ascFormatted}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReading('planet', 'Midheaven')}
                    className="px-2 py-0.5 rounded bg-[#1e152e] border border-[#d4af37]/40 text-[#f2ca50] whitespace-nowrap hover:border-[#f2ca50] transition-colors cursor-pointer"
                  >
                    {chartResult.mcFormatted}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReading('planet', 'Sun')}
                    className="px-2 py-0.5 rounded bg-[#1e152e] border border-white/20 text-[#f1e8d8] whitespace-nowrap hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                  >
                    {chartResult.sunFormatted}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReading('planet', 'Moon')}
                    className="px-2 py-0.5 rounded bg-[#1e152e] border border-white/20 text-[#f1e8d8] whitespace-nowrap hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                  >
                    {chartResult.moonFormatted}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {/* Action CTAs */}
          <button
            type="button"
            onClick={() => handleOpenReading('horoscope')}
            className="py-1.5 px-3 rounded-lg bg-[#271c36] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Readings</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="py-1.5 px-3 rounded-lg bg-[#1c1428] hover:bg-[#271c36] border border-white/10 text-white/90 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-[#9fb4ff]" />
            <span className="hidden sm:inline">Export &amp; Share</span>
            <span className="sm:hidden">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="py-1.5 px-3 rounded-lg bg-[#1c1428] hover:bg-[#271c36] border border-[#d4af37]/30 text-[#f1e8d8] font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <User className="w-3.5 h-3.5 text-[#f2a38c]" />
            <span>{user ? (user.displayName || 'Account') : 'Sign In'}</span>
          </button>
        </div>
      </header>

      {/* HUD Layer Stage */}
      <main className="natally-workspace-main relative w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between my-3 min-h-0 md:min-h-[640px] pointer-events-none">
        {/* Top Row Overlays: Draggable & Corner-Resizable Translucent Acrylic Cards */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 w-full z-20">
          {/* Left Column Cards */}
          <div className="space-y-2.5 w-full sm:w-auto pointer-events-auto">
            {/* Natal Parameters Card: Rolls up like a shade to just the title bar after submitting, click to expand */}
            <DraggableCard
              id="natal-params"
              title={
                <div className="flex items-center gap-1.5 truncate">
                  <span>Natal Parameters</span>
                  {isNatalParamsRolledUp && (
                    <span className="text-[10px] text-[#f2a38c] font-normal truncate opacity-90 hidden sm:inline">
                      · {chartInput.name} ({chartInput.birthDate})
                    </span>
                  )}
                </div>
              }
              icon={<Sparkles className="w-3.5 h-3.5 text-[#f2ca50]" />}
              defaultPosition={{ x: 0, y: 0 }}
              defaultWidth={340}
              minWidth={280}
              defaultZIndex={45}
              resetTrigger={resetTrigger}
              isCollapsed={isNatalParamsRolledUp}
              onToggleCollapse={(c) => handleToggleNatalParams(c)}
              extraHeaderControls={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleNatalParams(!isNatalParamsRolledUp);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3b2752] hover:bg-[#523573] text-[#f2ca50] border border-[#f2ca50]/40 font-bold cursor-pointer transition-colors shrink-0"
                  title={isNatalParamsRolledUp ? 'Unroll parameters form like a shade' : 'Roll up to title bar'}
                >
                  {isNatalParamsRolledUp ? 'Expand ▾' : 'Roll Up ▴'}
                </button>
              }
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-[10px] text-[#a99dae]">Established Birth Chart Inputs</span>
                  <button
                    type="button"
                    onClick={() => handleToggleNatalParams(true)}
                    className="text-[10px] text-[#f2ca50] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Roll Up Like a Shade ▴</span>
                  </button>
                </div>
                <NatalInputForm
                  key={user!.uid}
                  accountUid={user!.uid}
                  currentInput={chartInput}
                  onCalculate={(input) => {
                    if (!isCurrentSession()) return;
                    runCalculation(input, true);
                    // Automatically rolls up like a shade to just the title bar!
                    handleToggleNatalParams(true);
                  }}
                  isCalculating={isCalculating}
                  embedded={true}
                />
              </div>
            </DraggableCard>

            {/* Major Themes & Events Card (Moved UP directly under title bar; strictly constrained so it never flows off bottom of screen) */}
            {wisdom && (
              <DraggableCard
                id="themes-wisdom"
                title="Major Themes & Events"
                icon={<Compass className="w-3.5 h-3.5 text-[#f2ca50]" />}
                defaultPosition={{ x: 0, y: 0 }}
                defaultWidth={340}
                minWidth={280}
                defaultZIndex={30}
                resetTrigger={resetTrigger}
                isCollapsed={isThemesRolledUp}
                onToggleCollapse={(c) => setIsThemesRolledUp(c)}
                maxHeight="calc(100vh - 180px)"
                extraHeaderControls={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsThemesRolledUp(!isThemesRolledUp);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3b2752] hover:bg-[#523573] text-[#f2ca50] border border-[#f2ca50]/40 font-bold cursor-pointer transition-colors shrink-0"
                    title={isThemesRolledUp ? 'Expand themes & events' : 'Roll up themes & events'}
                  >
                    {isThemesRolledUp ? 'Expand ▾' : 'Roll Up ▴'}
                  </button>
                }
              >
                <ThemesAndWisdomBox
                  wisdom={wisdom}
                  onOpenReading={handleOpenReading}
                  onDiscussWithNatally={handleDiscussWithNatally}
                  embedded={true}
                />
              </DraggableCard>
            )}
          </div>

          {/* Right Column: Draggable & Resizable Dynamic Planet & House Inspector Card */}
          {chartResult && (
            <div className="w-auto pointer-events-none">
              <DraggableCard
                className="pointer-events-auto"
                id="planet-inspector"
                title={inspectorTab === 'planets' ? 'Planetary Coordinates' : 'House Cusps'}
                icon={<Compass className="w-3.5 h-3.5" />}
                defaultPosition={{ x: 0, y: 0 }}
                defaultWidth={340}
                minWidth={280}
                resetTrigger={resetTrigger}
                isCollapsed={isInspectorCollapsed}
                onToggleCollapse={setIsInspectorCollapsed}
                extraHeaderControls={
                  <div className="flex items-center gap-1 bg-[#1c1428] p-0.5 rounded border border-[#322641]">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('planets')}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                        inspectorTab === 'planets'
                          ? 'bg-[#271c36] text-[#f2ca50] font-semibold'
                          : 'text-[#a99dae] hover:text-[#f1e8d8]'
                      }`}
                    >
                      Planets
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('houses')}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                        inspectorTab === 'houses'
                          ? 'bg-[#271c36] text-[#9fb4ff] font-semibold'
                          : 'text-[#a99dae] hover:text-[#f1e8d8]'
                      }`}
                    >
                      {houseSystemLabel.split(' ')[0]}
                    </button>
                  </div>
                }
              >
                {inspectorTab === 'planets' ? (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {chartResult.natalBodies.map((b) => {
                      const isSelected = selectedComponents.includes(b.name);
                      return (
                        <div
                          key={b.name}
                          onClick={(e) => {
                            const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                            handleToggleComponent(b.name, isMulti);
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50] shadow-sm'
                              : 'bg-[#181126]/80 border-[#322641] hover:border-[#d4af37]/40 hover:bg-[#201533]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: b.color }}
                            />
                            <span className="font-semibold text-white/90">
                              {b.glyph} {b.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#c7bcce]">
                            <span>{b.fullDegText}</span>
                            <span className="text-[10px] text-[#f2ca50] bg-[#271c36] px-1 rounded">
                              H{b.house}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {chartResult.houseCusps.map((h) => {
                      const houseId = `House ${h.num}`;
                      const isSelected = selectedComponents.includes(houseId);
                      return (
                        <div
                          key={h.num}
                          onClick={(e) => {
                            const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                            handleToggleComponent(houseId, isMulti);
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50] shadow-sm'
                              : 'bg-[#181126]/80 border-[#322641] hover:border-[#d4af37]/40 hover:bg-[#201533]'
                          }`}
                        >
                          <span
                            className={`font-semibold ${
                              h.isCardo ? 'text-[#f2ca50]' : 'text-white/80'
                            }`}
                          >
                            {h.label} ({h.signGlyph})
                          </span>
                          <span className="text-[11px] text-[#c7bcce]">
                            {h.formattedDeg}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DraggableCard>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation & Controls */}
      <footer className="natally-workspace-footer w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#d4af37]/25 pt-4 z-20 pointer-events-auto">
        <div className="flex flex-wrap justify-center items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSpinning(!isSpinning)}
            className="px-4 py-2 rounded-lg bg-[#241838] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span
              className={
                isSpinning
                  ? 'w-2 h-2 rounded-full bg-[#f2ca50] animate-ping'
                  : 'w-2 h-2 rounded-full bg-white/40'
              }
            />
            <span>{isSpinning ? 'Pause Contemplative Drift' : 'Resume Contemplative Drift'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('astrosphere_card_pos_themes-wisdom');
                localStorage.removeItem('astrosphere_card_pos_natal-params');
                localStorage.removeItem('astrosphere_card_pos_planet-inspector');
              } catch (_) {}
              setResetTrigger((c) => c + 1);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#181126] hover:bg-[#241838] border border-white/10 text-white/80 font-mono text-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Reset Perspective &amp; Layout
          </button>
        </div>

        {/* Small Print Copyright & Version */}
        <div className="text-right font-mono text-[10px] text-[#a99dae]">
          <p>
            v3.3.0-build.92 · Epoch 2000.0 ·{' '}
            <span className="text-white/90">
              Copyright &copy;2026 Robin L. M. Cheung, MBA. All rights reserved.{' '}
            </span>
            <a
              href="https://natally.robin.mba/"
              target="_blank"
              rel="noreferrer"
              className="text-[#f2ca50] hover:underline"
            >
              https://natally.robin.mba/
            </a>
          </p>
        </div>
      </footer>

      {/* Natally Chatbot Card Companion */}
      {chartResult && (
        <NatallyChatbot
          key={user!.uid}
          accountUid={user!.uid}
          isCurrentSession={isCurrentSession}
          chart={chartResult}
          partnerChart={synastryChart}
          userLore={userLore}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onOpen={() => setIsChatOpen(true)}
          onSignIn={() => setShowAuthModal(true)}
          isSignedIn={!!user}
          onAddUserLore={handleAddUserLore}
          voiceSettings={voiceSettings}
          onUpdateVoiceSettings={(settings) => {
            setVoiceSettings(settings);
            saveVoiceSettings(settings);
          }}
          onSpeechStateChange={handleSpeechStateChange}
          onChartFocus={handleChartFocus}
          onSelectPlanet={(name) => handleToggleComponent(name, false)}
          externalReadingToInject={externalReadingToInject}
          onClearExternalReading={() => setExternalReadingToInject(null)}
          quickMessage={quickMessage}
          onClearQuickMessage={() => setQuickMessage(null)}
        />
      )}

      {/* Keyboard quick-entry: small box only, full chat opens on send */}
      {quickEntryOpen && !isChatOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('quick-entry') as HTMLInputElement);
            const text = input?.value.trim();
            if (text) {
              setQuickMessage({ text, nonce: Date.now() });
              setIsChatOpen(true);
            }
            setQuickEntryOpen(false);
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[65] w-[min(92vw,480px)] flex gap-2"
        >
          <input
            name="quick-entry"
            type="text"
            autoFocus
            placeholder="Ask Natally…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c1428]/95 border border-[#d4af37]/40 text-[#f1e8d8] font-mono text-sm outline-none focus:border-[#f2ca50]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#241838] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-sm cursor-pointer"
          >
            Send
          </button>
        </form>
      )}

      {/* Modals */}
      {showExportModal && chartResult && (
        <ExportModal chart={chartResult} onClose={() => setShowExportModal(false)} />
      )}
      {showAuthModal && (
        <AuthModal
          user={user}
          onClose={() => setShowAuthModal(false)}
          onReonboard={() => {
            if (!user) return;
            clearNatalIntake(user.uid);
            booted.current = false;
            setChartInput(null);
            setShowAuthModal(false);
          }}
        />
      )}
      {showReadingsModal && chartResult && (
        <ReadingsModal
          key={user!.uid}
          accountUid={user!.uid}
          isCurrentSession={isCurrentSession}
          onPartnerChart={(chart) => { if (isCurrentSession()) setSynastryChart(chart); }}
          chart={chartResult}
          onSignIn={() => setShowAuthModal(true)}
          isSignedIn={!!user}
          onClose={() => setShowReadingsModal(false)}
          initialType={readingsInitialType}
          initialTargetKey={readingsTargetKey}
          onSendToNatally={(title, content, type, presentation) => {
            if (!isCurrentSession()) return;
            setExternalReadingToInject({ title, content, type, ...presentation });
            setIsChatOpen(true);
          }}
        />
      )}
    </div>
  );
}
