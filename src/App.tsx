import { useEffect, useState } from 'react';
import { GameState, TurnResponse } from './types';
import { Sidebar } from './components/Sidebar';
import { CabinetView } from './components/CabinetView';
import { EmergencyModal } from './components/EmergencyModal';
import { PolicyDashboard } from './components/PolicyDashboard';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { Narrative } from './components/Narrative';
import { TopTicker } from './components/TopTicker';
import { Loader2, ArrowRight, Volume2, VolumeX, Info, X, Save, RotateCcw, Trash2, History } from 'lucide-react';
import { PoliticalLegacies } from './components/PoliticalLegacies';
import { AccomplishmentsModal } from './components/AccomplishmentsModal';
import { SoundscapeControl } from './components/SoundscapeControl';
import downingStreetDoor from './assets/images/downing_street_door_1782329189389.jpg';
import andyBurnhamPhotorealistic from './assets/images/andy_burnham_photorealistic_1782330681868.jpg';
import kemiBadenochPortrait from './assets/images/kemi_badenoch_portrait_1782368052367.jpg';
import nigelFaragePortrait from './assets/images/nigel_farage_portrait_1782368067908.jpg';

import edDaveyPortrait from './assets/images/ed_davey_portrait_1782370973075.jpg';
import zackPolanskiPortrait from './assets/images/zack_polanski_portrait_1782370986842.jpg';
import { audioEngine } from './AudioEngine';

import { GameOverOverlay } from './components/GameOverOverlay';
import { ElectionStatusModal } from './components/ElectionStatusModal';
import { CHARACTERS, CANDIDATE_VICTORY_PATHS, getCharacterProfile, CharacterKey } from './characterConfig';

const CANDIDATE_INFO = CHARACTERS;

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [turnData, setTurnData] = useState<TurnResponse | null>(null);
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski'>('Burnham');
  const [infoModalCandidate, setInfoModalCandidate] = useState<'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski' | null>(null);
  const [turnHistory, setTurnHistory] = useState<{ briefing: string, choice: string }[]>([]);
  const [pollingHistory, setPollingHistory] = useState<{week: number, approval: number}[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showCabinetView, setShowCabinetView] = useState(false);
  const [showPolicyDashboard, setShowPolicyDashboard] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showAccomplishments, setShowAccomplishments] = useState(false);
  const [showElectionStatus, setShowElectionStatus] = useState(false);
  const [accomplishmentsWeek, setAccomplishmentsWeek] = useState<number | undefined>(undefined);
  const [lastSeenMilestoneWeek, setLastSeenMilestoneWeek] = useState<number | null>(null);
  const [unlockedPolicies, setUnlockedPolicies] = useState<string[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('pm_game_quick_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.displaySaveTime || (parsed.savedWeek ? `Week ${parsed.savedWeek}` : 'Saved Game');
      }
    } catch {}
    return null;
  });
  const [savedSession, setSavedSession] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('pm_game_quick_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.turnData || parsed.state)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [legacies, setLegacies] = useState<string[]>(() => {
    const saved = localStorage.getItem('political_legacies');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeEmergencyGauges, setActiveEmergencyGauges] = useState<{name: string, value: number}[]>([]);
  const [lastEmergencyAlertWeek, setLastEmergencyAlertWeek] = useState<number | null>(null);

  useEffect(() => {
    if (turnData?.state) {
      const newLegacies = [...legacies];
      let changed = false;
      
      if (turnData.state.week >= 50 && !newLegacies.includes('Survived 50 weeks')) {
        newLegacies.push('Survived 50 weeks');
        changed = true;
      }
      
      if (turnData.state.fiscal_state.budget_deficit_gdp_pct <= 2.0 && turnData.state.gauges.economic_stability >= 80 && !newLegacies.includes('Full Economic Recovery')) {
        newLegacies.push('Full Economic Recovery');
        changed = true;
      }
      
      const mog = turnData.state.machinery_of_government;
      const isStableCabinet = mog.chancellor_relationship >= 80 && 
                              mog.home_secretary_relationship >= 80 && 
                              mog.foreign_secretary_relationship >= 80 && 
                              turnData.state.week >= 20;
                              
      if (isStableCabinet && !newLegacies.includes('Cabinet Stability')) {
        newLegacies.push('Cabinet Stability');
        changed = true;
      }
      
      if (!turnData.is_game_over && turnData.state.week > 1 && turnData.state.gauges.parliamentary_support >= 90 && !newLegacies.includes('Snap Election Winner')) {
        newLegacies.push('Snap Election Winner');
        changed = true;
      }

      if (changed) {
        setLegacies(newLegacies);
        localStorage.setItem('political_legacies', JSON.stringify(newLegacies));
      }
    }
  }, [turnData?.state]);

  useEffect(() => {
    if (turnData?.state?.week && !turnData.is_game_over) {
      const w = turnData.state.week;
      if ([12, 24, 36, 48, 50].includes(w) && lastSeenMilestoneWeek !== w) {
        setLastSeenMilestoneWeek(w);
        setAccomplishmentsWeek(w);
        setShowAccomplishments(true);
      }
    }
  }, [turnData?.state?.week, turnData?.is_game_over, lastSeenMilestoneWeek]);

  useEffect(() => {
    const savedMute = localStorage.getItem('pm_game_muted');
    if (savedMute === 'true') {
      setIsMuted(true);
      audioEngine.setMuted(true);
    }
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioEngine.setMuted(newMuted);
    localStorage.setItem('pm_game_muted', String(newMuted));
  };

  const handleDismissEmergency = () => {
    if (turnData?.state) {
      setLastEmergencyAlertWeek(turnData.state.week);
    }
    setActiveEmergencyGauges([]);
  };

  useEffect(() => {
    if (turnData?.is_game_over) {
      audioEngine.updateFromGameState(turnData.state, true);
      return;
    }
    if (turnData?.state) {
      setPollingHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].week === turnData.state.week) return prev;
        return [...prev, { week: turnData.state.week, approval: turnData.state.gauges?.public_approval ?? 0 }].slice(-10);
      });
      let dangerScore = 0;
      const gauges = turnData.state.gauges || {};
      
      const criticalGauges: {name: string, value: number}[] = [];
      const GAUGE_LABELS: Record<string, string> = {
        moral_compass: 'Political Principles',
        parliamentary_support: 'MP Support',
        public_approval: 'Public Approval',
        economic_stability: 'Econ Stability',
        public_services_health: 'Public Services',
        media_favorability: 'Media Favour',
        housing_affordability: 'Housing Affordability',
      };

      Object.entries(gauges).forEach(([key, val]) => {
        if (typeof val === 'number') {
          if (val <= 0) dangerScore += 0.3;
          else if (val < 20) dangerScore += 0.1;
          
          if (val < 10 && GAUGE_LABELS[key]) {
            criticalGauges.push({ name: GAUGE_LABELS[key], value: val });
          }
        }
      });
      
      if (criticalGauges.length > 0 && lastEmergencyAlertWeek !== turnData.state.week) {
        setActiveEmergencyGauges(criticalGauges);
      }

      // Update dynamic soundscape based on political climate and gauge scores
      audioEngine.updateFromGameState(turnData.state, false);
    }
  }, [turnData, lastEmergencyAlertWeek]);

  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  const requestTurnWithRetry = async (payload: any, maxRetries = 3): Promise<any> => {
    let lastError: any = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const res = await fetch('/api/turn', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorText = '';
          try {
            const errData = await res.json();
            errorText = errData.error || `Server responded with status ${res.status}`;
          } catch {
            errorText = `Server responded with status ${res.status}`;
          }
          throw new Error(errorText);
        }

        const data = await res.json();
        if (!data || typeof data !== 'object') {
          throw new Error('Received malformed data from game server');
        }
        return data;
      } catch (err: any) {
        lastError = err;
        console.warn(`Request turn attempt ${attempt + 1} failed:`, err.message || err);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }
    }
    throw lastError || new Error('Connection to Downing Street server timed out. Please retry.');
  };

  const startGame = async (character: 'Burnham' | 'Badenoch' | 'Farage' | 'Davey' | 'Polanski') => {
    setSelectedCharacter(character);
    audioEngine.init();
    setHasStarted(true);
    setLoading(true);
    setErrorMsg(null);
    setPreviousState(null);
    setTurnHistory([]);
    setPollingHistory([]);
    setUnlockedPolicies([]);
    setLastSeenMilestoneWeek(null);
    setShowAccomplishments(false);
    setLastAction(() => () => startGame(character));
    try {
      const data = await requestTurnWithRetry({ currentState: null, previousChoice: null, pmCharacter: character, turnHistory: [] });
      if (data?.state) {
        data.state.pm_character = character;
      }
      setTurnData(data);
      if (localStorage.getItem('pm_auto_briefing') === 'true' && !data.is_game_over) {
        setShowDailyBriefing(true);
      }
      setErrorMsg(null);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePursuePolicy = (policy: any) => {
    setUnlockedPolicies(prev => [...prev, policy.id]);
    handleChoice('POLICY', `I want to advance my legislative agenda by pursuing the policy: ${policy.name}. ${policy.desc}`);
    setShowPolicyDashboard(false);
  };

  const handleChoice = async (choiceId: string, choiceText: string) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    if (turnData?.state) {
      setPreviousState(turnData.state);
    }
    
    const choiceString = `[Option ${choiceId}] ${choiceText}`;
    const newHistory = [...turnHistory, { briefing: turnData?.briefing || '', choice: choiceString }].slice(-5);
    setTurnHistory(newHistory);
    setLastAction(() => () => handleChoice(choiceId, choiceText));

    try {
      const stateWithChar = turnData?.state ? { ...turnData.state, pm_character: selectedCharacter } : null;
      const data = await requestTurnWithRetry({ 
        currentState: stateWithChar, 
        previousChoice: choiceString, 
        pmCharacter: selectedCharacter, 
        turnHistory: newHistory 
      });
      if (data?.state) {
        data.state.pm_character = selectedCharacter;
      }
      setTurnData(data);
      if (localStorage.getItem('pm_auto_briefing') === 'true' && !data.is_game_over) {
        setShowDailyBriefing(true);
      }
      setErrorMsg(null);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCallElection = async (forcedReason?: string) => {
    if (!turnData?.state || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setLastAction(() => () => handleCallElection(forcedReason));
    try {
      const stateWithChar = { ...turnData.state, pm_character: selectedCharacter };
      const data = await requestTurnWithRetry({ 
        currentState: stateWithChar, 
        previousChoice: forcedReason ? `Forced Election: ${forcedReason}` : "The Prime Minister has called a snap General Election.",
        isElectionCalled: true,
        pmCharacter: selectedCharacter,
        turnHistory
      });
      if (data?.state) {
        data.state.pm_character = selectedCharacter;
      }
      setTurnData(data);
      if (localStorage.getItem('pm_auto_briefing') === 'true' && !data.is_game_over) {
        setShowDailyBriefing(true);
      }
      setErrorMsg(null);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueMandate = async () => {
    if (!turnData?.state || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const updatedState: GameState = {
        ...turnData.state,
        pm_character: selectedCharacter,
        game_phase: 'CABINET_RESHUFFLE',
        consecutive_weeks_any_gauge_zero: 0,
        consecutive_weeks_media_zero: 0,
        gauges: {
          ...turnData.state.gauges,
          parliamentary_support: Math.max(90, turnData.state.gauges.parliamentary_support),
          public_approval: Math.max(76, turnData.state.gauges.public_approval),
          party_loyalty: Math.max(90, turnData.state.gauges.party_loyalty),
        }
      };
      const newHistory = [...turnHistory, { briefing: "General Election Victory: A 5-year democratic mandate has been secured.", choice: "Form post-election administration." }];
      setTurnHistory(newHistory);
      const data = await requestTurnWithRetry({
        currentState: updatedState,
        previousChoice: "ELECTION VICTORY: Andy Burnham and his government have won a decisive 5-year democratic mandate from the British electorate. Present the post-election Cabinet organization choices.",
        pmCharacter: selectedCharacter,
        turnHistory: newHistory
      });
      if (data?.state) {
        data.state.pm_character = selectedCharacter;
      }
      data.is_game_over = false;
      setTurnData(data);
      setShowDailyBriefing(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize post-election administration');
    } finally {
      setLoading(false);
    }
  };

  const resetToFrontPage = () => {
    setHasStarted(false);
    setTurnData(null);
    setPreviousState(null);
    setTurnHistory([]);
    setShowDailyBriefing(false);
  };

  const handleQuickSave = () => {
    if (!turnData?.state) return;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const displaySaveTime = `Week ${turnData.state.week} (${timeFormatted})`;
    
    const payload = {
      state: turnData.state,
      turnData: turnData,
      selectedCharacter: selectedCharacter,
      turnHistory: turnHistory,
      pollingHistory: pollingHistory,
      unlockedPolicies: unlockedPolicies,
      previousState: previousState,
      savedAt: now.toISOString(),
      savedWeek: turnData.state.week,
      displaySaveTime: displaySaveTime
    };
    
    try {
      localStorage.setItem('pm_game_quick_save', JSON.stringify(payload));
      setLastSavedTime(displaySaveTime);
      setSavedSession(payload);
      audioEngine.playSaveSound();
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  };

  const handleResumeSession = () => {
    try {
      const raw = localStorage.getItem('pm_game_quick_save');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || (!parsed.turnData && !parsed.state)) return;
      
      const char = parsed.selectedCharacter || parsed.state?.pm_character || 'Burnham';
      setSelectedCharacter(char);
      
      if (parsed.turnData) {
        setTurnData(parsed.turnData);
      } else if (parsed.state) {
        setTurnData({
          briefing: "Executive session restored from Downing Street archives.",
          dilemma: "What direction shall the government prioritize as normal parliamentary business resumes?",
          is_game_over: false,
          state: parsed.state,
          choices: [
            { id: "A", text: "Proceed with normal government business and departmental reviews.", hint: "Steady administrative governance" },
            { id: "B", text: "Convene the Cabinet to review strategic legislative priorities.", hint: "Focus on Cabinet cohesion and agenda" }
          ]
        });
      }
      
      if (parsed.turnHistory) setTurnHistory(parsed.turnHistory);
      if (parsed.pollingHistory) setPollingHistory(parsed.pollingHistory);
      if (parsed.unlockedPolicies) setUnlockedPolicies(parsed.unlockedPolicies);
      if (parsed.previousState) setPreviousState(parsed.previousState);
      if (parsed.displaySaveTime) setLastSavedTime(parsed.displaySaveTime);
      
      setHasStarted(true);
      audioEngine.init();
      if (parsed.state) {
        audioEngine.updateFromGameState(parsed.state, false);
      }
    } catch (e) {
      console.error('Failed to restore saved session:', e);
    }
  };

  const handleDiscardSavedSession = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    localStorage.removeItem('pm_game_quick_save');
    setSavedSession(null);
    setLastSavedTime(null);
  };

  // Auto-save active turn to localStorage
  useEffect(() => {
    if (turnData?.state && !turnData.is_game_over) {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const displaySaveTime = `Week ${turnData.state.week} (${timeFormatted})`;
      const payload = {
        state: turnData.state,
        turnData: turnData,
        selectedCharacter: selectedCharacter,
        turnHistory: turnHistory,
        pollingHistory: pollingHistory,
        unlockedPolicies: unlockedPolicies,
        previousState: previousState,
        savedAt: now.toISOString(),
        savedWeek: turnData.state.week,
        displaySaveTime: displaySaveTime
      };
      try {
        localStorage.setItem('pm_game_quick_save', JSON.stringify(payload));
        setSavedSession(payload);
        setLastSavedTime(displaySaveTime);
      } catch (err) {
        console.warn('Auto-save write failed:', err);
      }
    }
  }, [turnData?.state?.week, turnData?.is_game_over]);

  if (!hasStarted) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center p-4 md:p-8 relative overflow-y-auto custom-scrollbar">
        <div 
          className="fixed inset-0 bg-cover bg-center z-0 opacity-40 grayscale-[20%] pointer-events-none" 
          style={{ backgroundImage: `url(${downingStreetDoor})` }}
        />
        <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/60 z-0 pointer-events-none" />
        
        <div className="max-w-5xl w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 md:p-12 border-t-8 border-slate-900 shadow-2xl relative z-10 my-6 md:my-10 rounded-b-xl">
          <div className="flex flex-col mb-8 gap-2 border-b border-slate-200 pb-8 text-center">
            <div className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1 uppercase tracking-widest inline-block shadow-sm rounded-sm self-center">Top Secret / Eyes Only</div>
            <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-slate-900 leading-tight">10 Downing Street</h1>
            <p className="text-lg font-serif text-slate-500 mt-2">Choose your Prime Minister. The year is 2026.</p>
          </div>

          {/* Saved Session Resume Card */}
          {savedSession && savedSession.state && (
            <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-slate-50 border-2 border-amber-500/70 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-amber-600/20 border border-amber-500 flex items-center justify-center text-amber-800 shrink-0 shadow-inner">
                  <History size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-600 text-white px-2 py-0.5 rounded shadow-sm">
                      Saved Session Available
                    </span>
                    <span className="text-xs font-mono text-slate-600">
                      {savedSession.displaySaveTime || `Week ${savedSession.savedWeek || savedSession.state.week}`}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-slate-900 mt-0.5">
                    Resume as {getCharacterProfile(savedSession.selectedCharacter || savedSession.state.pm_character || 'Burnham').formalTitle} &bull; Week {savedSession.state.week}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">
                    Approval: {savedSession.state.gauges?.public_approval ?? 50}% &bull; Support: {savedSession.state.gauges?.parliamentary_support ?? 50}% &bull; Phase: {(savedSession.state.game_phase || 'STABILITY').replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleResumeSession}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded shadow flex items-center justify-center gap-2 transition-colors border border-amber-700"
                >
                  <RotateCcw size={15} />
                  <span>Resume Session</span>
                </button>
                <button
                  onClick={handleDiscardSavedSession}
                  title="Discard saved session"
                  className="p-2.5 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded border border-slate-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {/* Burnham */}
            <div 
              className={`cursor-pointer transition-all p-4 border-2 rounded-lg flex flex-col items-center text-center relative ${selectedCharacter === 'Burnham' ? 'border-red-600 bg-red-50/50 shadow-md' : 'border-slate-200 hover:border-red-300'}`}
              onClick={() => setSelectedCharacter('Burnham')}
            >
              <button 
                className="absolute top-2 right-2 text-slate-400 hover:text-red-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); setInfoModalCandidate('Burnham'); }}
              >
                <Info size={16} />
              </button>
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-3 mt-2">
                <img src={andyBurnhamPhotorealistic} alt="Andy Burnham" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Andy Burnham</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mb-1">Labour Party</p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 mb-2">
                No Election Mandate
              </span>
              <p className="text-xs font-serif text-slate-600 leading-snug">
                Took No. 10 in party coup. Lacks a personal public mandate. Must stabilize Britain & call an election to win a 5-year mandate.
              </p>
            </div>
            {/* Badenoch */}
            <div 
              className={`cursor-pointer transition-all p-4 border-2 rounded-lg flex flex-col items-center text-center relative ${selectedCharacter === 'Badenoch' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}
              onClick={() => setSelectedCharacter('Badenoch')}
            >
              <button 
                className="absolute top-2 right-2 text-slate-400 hover:text-blue-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); setInfoModalCandidate('Badenoch'); }}
              >
                <Info size={16} />
              </button>
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-3 mt-2">
                <img src={kemiBadenochPortrait} alt="Kemi Badenoch" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Kemi Badenoch</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-1">Conservative Party</p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                2026 Election Mandate
              </span>
              <p className="text-xs font-serif text-slate-600 leading-snug">
                Stunning election victory. Promises a low-tax, anti-woke, state-rollback philosophy.
              </p>
            </div>
            {/* Farage */}
            <div 
              className={`cursor-pointer transition-all p-4 border-2 rounded-lg flex flex-col items-center text-center relative ${selectedCharacter === 'Farage' ? 'border-cyan-600 bg-cyan-50/50 shadow-md' : 'border-slate-200 hover:border-cyan-300'}`}
              onClick={() => setSelectedCharacter('Farage')}
            >
              <button 
                className="absolute top-2 right-2 text-slate-400 hover:text-cyan-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); setInfoModalCandidate('Farage'); }}
              >
                <Info size={16} />
              </button>
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-3 mt-2">
                <img src={nigelFaragePortrait} alt="Nigel Farage" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Nigel Farage</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Reform UK</p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                2026 Election Mandate
              </span>
              <p className="text-xs font-serif text-slate-600 leading-snug">
                Electoral earthquake. Hardline immigration freeze, dismantling the establishment.
              </p>
            </div>
            {/* Davey */}
            <div 
              className={`cursor-pointer transition-all p-4 border-2 rounded-lg flex flex-col items-center text-center relative ${selectedCharacter === 'Davey' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-200 hover:border-orange-300'}`}
              onClick={() => setSelectedCharacter('Davey')}
            >
              <button 
                className="absolute top-2 right-2 text-slate-400 hover:text-orange-500 transition-colors"
                onClick={(e) => { e.stopPropagation(); setInfoModalCandidate('Davey'); }}
              >
                <Info size={16} />
              </button>
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-3 mt-2">
                <img src={edDaveyPortrait} alt="Ed Davey" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Ed Davey</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500 mb-1">Liberal Democrats</p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                2026 Election Mandate
              </span>
              <p className="text-xs font-serif text-slate-600 leading-snug">
                Shock Lib Dem surge. Centrist, pro-European, and community-focused politics.
              </p>
            </div>
            {/* Polanski */}
            <div 
              className={`cursor-pointer transition-all p-4 border-2 rounded-lg flex flex-col items-center text-center relative ${selectedCharacter === 'Polanski' ? 'border-green-600 bg-green-50/50 shadow-md' : 'border-slate-200 hover:border-green-300'}`}
              onClick={() => setSelectedCharacter('Polanski')}
            >
              <button 
                className="absolute top-2 right-2 text-slate-400 hover:text-green-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); setInfoModalCandidate('Polanski'); }}
              >
                <Info size={16} />
              </button>
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm mb-3 mt-2">
                <img src={zackPolanskiPortrait} alt="Zack Polanski" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">Zack Polanski</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-green-600 mb-1">Green Party</p>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                2026 Election Mandate
              </span>
              <p className="text-xs font-serif text-slate-600 leading-snug">
                Green wave election. Radical climate action, wealth taxes, proportional representation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-lg shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-800 rounded-full inline-block"></span>
                The Threat of Collapse
              </h3>
              <ul className="text-sm font-sans space-y-3 text-slate-700">
                <li><strong className="text-slate-900">The Warning:</strong> If any single national gauge hits 0%, you have exactly 4 weeks to pull it back up, or your government falls.</li>
                <li><strong className="text-slate-900">The Collapse:</strong> If THREE or more gauges hit 0% simultaneously, your government collapses instantly.</li>
                <li><strong className="text-slate-900">Cabinet Mutiny:</strong> If a minister's relationship hits 0%, they resign immediately, causing a reshuffle and massive political damage.</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-6 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-800 rounded-full inline-block"></span>
                    The Path to Victory: {CANDIDATE_INFO[selectedCharacter].name}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${CANDIDATE_VICTORY_PATHS[selectedCharacter].badgeColor}`}>
                    {CANDIDATE_VICTORY_PATHS[selectedCharacter].strategyTitle}
                  </span>
                </div>
                <ul className="text-sm font-sans space-y-3 text-slate-700">
                  <li>
                    <strong className="text-slate-900">Proactive Growth: </strong> 
                    {CANDIDATE_VICTORY_PATHS[selectedCharacter].proactiveGrowth}
                  </li>
                  <li>
                    <strong className="text-slate-900">The Boiling Frog: </strong> 
                    {CANDIDATE_VICTORY_PATHS[selectedCharacter].boilingFrog}
                  </li>
                  <li>
                    <strong className="text-slate-900">Snap Election: </strong> 
                    {CANDIDATE_VICTORY_PATHS[selectedCharacter].snapElection}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <PoliticalLegacies legacies={legacies} />
          </div>

          <button 
            onClick={() => startGame(selectedCharacter)}
            disabled={loading}
            className={`w-full font-bold uppercase tracking-widest text-sm px-6 py-5 rounded-md transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group border
              ${selectedCharacter === 'Burnham' ? 'bg-red-700 hover:bg-red-800 text-white border-red-800' : 
                selectedCharacter === 'Badenoch' ? 'bg-blue-700 hover:bg-blue-800 text-white border-blue-800' : 
                selectedCharacter === 'Farage' ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-800' : 
                selectedCharacter === 'Davey' ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-700' : 
                'bg-green-600 hover:bg-green-700 text-white border-green-800'} disabled:opacity-50`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Enter 10 Downing Street as {selectedCharacter} 
                <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </>
            )}
          </button>
        </div>

        {/* Global Sound Toggle */}
        <button 
          onClick={toggleMute}
          className="fixed bottom-4 left-4 z-50 bg-slate-900 text-slate-300 p-2 rounded-full shadow-lg hover:bg-slate-800 hover:text-white transition-colors border border-slate-700 flex items-center justify-center"
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {infoModalCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInfoModalCandidate(null)}>
            <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className={`p-4 border-b flex justify-between items-center text-white
                ${infoModalCandidate === 'Burnham' ? 'bg-red-700' : 
                  infoModalCandidate === 'Badenoch' ? 'bg-blue-700' : 
                  infoModalCandidate === 'Farage' ? 'bg-cyan-700' : 
                  infoModalCandidate === 'Davey' ? 'bg-orange-600' : 
                  'bg-green-700'}`}>
                <h2 className="font-serif font-bold text-xl">{CANDIDATE_INFO[infoModalCandidate].name}</h2>
                <button onClick={() => setInfoModalCandidate(null)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Party</h3>
                    <p className="font-medium">{CANDIDATE_INFO[infoModalCandidate].party}</p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${getCharacterProfile(infoModalCandidate).hasDirectMandate ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                      {getCharacterProfile(infoModalCandidate).mandateTitle}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Democratic Mandate Status</h3>
                  <p className="text-sm leading-relaxed p-2.5 rounded bg-slate-50 border border-slate-200">{getCharacterProfile(infoModalCandidate).mandateSummary}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Political Leaning</h3>
                  <p className="font-medium">{CANDIDATE_INFO[infoModalCandidate].leaning}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Governing Philosophy</h3>
                  <p className="text-sm leading-relaxed">{CANDIDATE_INFO[infoModalCandidate].philosophy}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Key Stances</h3>
                  <p className="text-sm leading-relaxed">{CANDIDATE_INFO[infoModalCandidate].stance}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setInfoModalCandidate(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold uppercase tracking-wider text-xs rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  if (!turnData && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-mono">
        <Loader2 className="animate-spin mr-3" size={20} /> 
        Initializing State Engine...
      </div>
    );
  }

  if (!turnData || !turnData.state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 bg-red-900/50 border border-red-700 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-serif font-bold text-white mb-2">Game Engine Error</h2>
          <p className="text-sm text-slate-300 mb-6 font-serif leading-relaxed">
            {errorMsg || "Unable to contact the Cabinet Office simulation engine. Please check your Gemini API key configuration."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => setHasStarted(false)} 
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Back to Selection
            </button>
            <button 
              onClick={() => startGame(selectedCharacter)} 
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded shadow transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-red-500/30 bg-slate-900"
    >
      <TopTicker 
        onRestart={resetToFrontPage} 
        onOpenDailyBriefing={() => setShowDailyBriefing(true)}
        customHeadlines={turnData?.headlines ? Object.entries(turnData.headlines).filter(([_, v]) => Boolean(v)).map(([k, v]) => `${k.replace('_', ' ').toUpperCase()}: ${v}`) : undefined}
      />
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {errorMsg && (
            <div className="absolute top-0 left-0 right-0 bg-red-950/90 border-b border-red-800 text-red-200 text-xs font-mono p-3 px-4 flex items-center justify-between z-50 shadow-lg backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Error: {errorMsg}</span>
              </span>
              <div className="flex gap-2">
                {lastAction && (
                  <button 
                    onClick={() => {
                      setErrorMsg(null);
                      lastAction();
                    }}
                    className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Retry Action
                  </button>
                )}
                <button 
                  onClick={() => setErrorMsg(null)}
                  className="px-2 py-1 text-red-300 hover:text-white text-[11px] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <Narrative 
            turn={turnData} 
            onChoose={handleChoice} 
            loading={loading} 
            onRestart={() => startGame(selectedCharacter)} 
            onCallElection={handleCallElection} 
            onOpenDailyBriefing={() => setShowDailyBriefing(true)}
            onOpenAccomplishments={(week) => {
              setAccomplishmentsWeek(week);
              setShowAccomplishments(true);
            }}
          />
        </div>
        <Sidebar 
          state={turnData.state} 
          previousState={previousState} 
          onCallElection={handleCallElection} 
          pollingHistory={pollingHistory} 
          onViewCabinet={() => setShowCabinetView(true)} 
          onViewPolicyDashboard={() => setShowPolicyDashboard(true)} 
          onViewAccomplishments={(week) => {
            setAccomplishmentsWeek(week);
            setShowAccomplishments(true);
          }}
          onOpenElectionForecast={() => setShowElectionStatus(true)}
          onQuickSave={handleQuickSave}
          lastSavedTime={lastSavedTime}
          unlockedPoliciesCount={unlockedPolicies.length} 
          unlockedPolicies={unlockedPolicies} 
        />
      </div>
      
      {showAccomplishments && turnData.state && (
        <AccomplishmentsModal
          state={turnData.state}
          unlockedPolicies={unlockedPolicies}
          serverMilestone={turnData.milestone_summary}
          initialWeek={accomplishmentsWeek}
          onClose={() => setShowAccomplishments(false)}
        />
      )}

      {showElectionStatus && turnData.state && (
        <ElectionStatusModal
          state={turnData.state}
          onClose={() => setShowElectionStatus(false)}
          onCallElection={() => {
            setShowElectionStatus(false);
            handleCallElection();
          }}
        />
      )}

      {showPolicyDashboard && turnData.state && (
        <PolicyDashboard 
          pmCharacter={selectedCharacter}
          unlockedPolicies={unlockedPolicies}
          onPursuePolicy={handlePursuePolicy}
          onClose={() => setShowPolicyDashboard(false)} 
        />
      )}

      {showCabinetView && turnData.state && (
        <CabinetView state={turnData.state} onClose={() => setShowCabinetView(false)} />
      )}

      {showDailyBriefing && turnData && !turnData.is_game_over && (
        <DailyBriefingModal 
          turn={turnData} 
          onClose={() => setShowDailyBriefing(false)} 
          onProceedToDecisions={() => setShowDailyBriefing(false)} 
        />
      )}

      {activeEmergencyGauges.length > 0 && (
        <EmergencyModal gauges={activeEmergencyGauges} onDismiss={handleDismissEmergency} />
      )}

      {turnData.is_game_over && (
        <GameOverOverlay 
          turn={turnData} 
          state={turnData.state} 
          onRestart={() => startGame(selectedCharacter)} 
          onContinueMandate={handleContinueMandate}
        />
      )}

      {/* Dynamic Downing Street Soundscape Controls */}
      <SoundscapeControl isMuted={isMuted} onToggleMute={toggleMute} />
    </div>
  );
}
