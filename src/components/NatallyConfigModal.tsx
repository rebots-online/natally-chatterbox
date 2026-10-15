import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  Bot,
  MousePointer,
  Compass,
  Check,
  Camera,
  Upload,
  RefreshCw,
} from 'lucide-react';
import {
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  NATALLY_VOICE_SAMPLE,
  saveVoiceSettings,
  speakNatallyText,
  stopSpeaking,
} from '../services/voiceService';
import { subscribeVoiceStatus, type VoiceStatus } from '../services/supertonicTts';
import { VoiceMeasurementPanel } from './VoiceMeasurementPanel';
import {
  NatallyAvatar,
  getCustomAvatarUrl,
  setCustomAvatarUrl,
} from './NatallyAvatar';

interface NatallyConfigModalProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: VoiceSettings) => void;
  onClose: () => void;
}

export const NatallyConfigModal: React.FC<NatallyConfigModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({ phase: 'idle', message: 'Local voice ready to load' });
  useEffect(() => subscribeVoiceStatus(setVoiceStatus), []);
  useEffect(() => () => stopSpeaking(), []);
  const [customAvatar, setCustomAvatar] = useState<string | null>(getCustomAvatarUrl());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      setCustomAvatar(e.detail?.url ?? getCustomAvatarUrl());
    };
    window.addEventListener('natally-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('natally-avatar-updated', handleAvatarUpdate);
  }, []);

  const handleToggleReadingAloud = (val: boolean) => {
    const updated = { ...localSettings, readingAloud: val };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveVoiceSettings(updated);
    if (!val) {
      stopSpeaking();
    }
  };

  const handleChangeSpriteMode = (mode: VoiceSettings['spriteMode']) => {
    const updated = { ...localSettings, spriteMode: mode };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleSliderChange = (key: 'rate' | 'pitch', val: number) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomAvatarUrl(dataUrl);
        setCustomAvatar(dataUrl);
        const updated = { ...localSettings, customAvatarUrl: dataUrl };
        setLocalSettings(updated);
        onUpdateSettings(updated);
        saveVoiceSettings(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = () => {
    setCustomAvatarUrl(null);
    setCustomAvatar(null);
    const updated = { ...localSettings, customAvatarUrl: null };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleTestVoice = async () => {
    setIsPlayingTest(true);
    const testPhrase = NATALLY_VOICE_SAMPLE;

    try {
      await speakNatallyText(
        testPhrase,
        { ...localSettings, readingAloud: true },
        () => setIsPlayingTest(true),
        () => setIsPlayingTest(false)
      );
    } catch {
      setIsPlayingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="celestial-panel w-full max-w-md rounded-2xl border border-[#d4af37]/60 shadow-2xl overflow-hidden bg-[#180f26]/95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#322641] bg-[#201433]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#f2ca50]" />
            <div>
              <h3 className="font-cinzel text-sm font-bold text-[#f2ca50] uppercase tracking-wider">
                Natally Companion Configuration
              </h3>
              <p className="font-mono text-[10px] text-[#a99dae]">
                Avatar Portrait, Local Voice &amp; Celestial Dynamics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a99dae] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Controls */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs text-[#f1e8d8]">
          {/* 1. Natally Portrait & Avatar Customization */}
          <div className="p-3.5 rounded-xl bg-[#221636] border border-[#3b2954]">
            <label className="block text-[11px] text-[#f2ca50] font-semibold mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#f2ca50]" />
              <span>Natally's Portrait &amp; Chatbot Icon</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <NatallyAvatar size={60} allowUploadOnClick={true} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-[10px] text-[#c7bcce]">
                  {customAvatar ? (
                    <span className="text-emerald-400 font-semibold">Using your uploaded Natally portrait</span>
                  ) : (
                    <span>Illustrated celestial fortune-teller portrait</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#3b2752] hover:bg-[#4d3269] text-[#f2ca50] border border-[#d4af37]/40 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Picture</span>
                  </button>
                  {customAvatar && (
                    <button
                      type="button"
                      onClick={handleResetAvatar}
                      className="px-2 py-1.5 rounded-lg bg-[#271c36] hover:bg-[#342448] text-[#a99dae] hover:text-rose-300 border border-[#3b2954] text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 2. Reading Aloud Toggle */}
          <div className="p-3.5 rounded-xl bg-[#221636] border border-[#3b2954] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#f2ca50] flex items-center gap-1.5">
                {localSettings.readingAloud ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                )}
                <span>Reading Aloud (Neural TTS)</span>
              </div>
              <p className="text-[10px] text-[#a99dae] mt-0.5">
                {localSettings.readingAloud
                  ? 'Active: Natally speaks with neural voice and karaoke highlighting'
                  : 'Silent: Responses are typed only without voice'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleReadingAloud(!localSettings.readingAloud)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                localSettings.readingAloud
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              }`}
            >
              {localSettings.readingAloud ? 'Active (ON)' : 'Silent (OFF)'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#221636] border border-[#3b2954] space-y-3">
            <label className="block text-[11px] text-[#f2ca50] font-semibold">
              Supertonic · On-device neural voice
            </label>
            <p className="text-[10px] text-[#a99dae]">
              English voice. First use downloads about 265 MB of model files plus the runtime; subsequent use can reuse the browser cache.
              Text stays on this device. No Gemini key, account, or per-reading speech charge.
            </p>
            <select aria-label="Supertonic voice" value={localSettings.aiVoiceName}
              className="w-full bg-[#1a1224] border border-[#322641] rounded p-2"
              onChange={event => {
                const updated = { ...localSettings, ttsModel: 'supertonic-onnx' as const, aiVoiceName: event.target.value };
                setLocalSettings(updated);
                onUpdateSettings(updated);
                saveVoiceSettings(updated);
              }}>
              <option value="F1">Female 1</option>
              <option value="F2">Female 2</option>
              <option value="F3">Female 3</option>
              <option value="F4">Female 4 · Natally</option>
              <option value="F5">Female 5</option>
              <option value="M1">Male 1</option>
              <option value="M2">Male 2</option>
            </select>
            <button type="button" className="px-3 py-2 rounded border border-[#d4af37]/40 text-[#f2ca50]"
              onClick={() => {
                stopSpeaking();
                const updated = { ...localSettings,
                  aiVoiceName: DEFAULT_VOICE_SETTINGS.aiVoiceName,
                  pitch: DEFAULT_VOICE_SETTINGS.pitch, rate: DEFAULT_VOICE_SETTINGS.rate,
                  tone: DEFAULT_VOICE_SETTINGS.tone,
                  kawaiiMode: DEFAULT_VOICE_SETTINGS.kawaiiMode,
                  kawaiiIntensity: DEFAULT_VOICE_SETTINGS.kawaiiIntensity,
                };
                setLocalSettings(updated);
                onUpdateSettings(updated);
                saveVoiceSettings(updated);
              }}>
              Use configured youthful preset
            </button>
            <p className="text-[10px] text-[#a99dae]">Gentler pitch for clearer speech. Pitch also changes playback speed; tone changes warmth independently.</p>
            <label className="block">Speech resource use
              <select aria-label="Speech resource use" value={localSettings.resourceMode}
                className="w-full bg-[#1a1224] border border-[#322641] rounded p-2"
                onChange={event => {
                  const updated = { ...localSettings, resourceMode: event.target.value as VoiceSettings['resourceMode'] };
                  stopSpeaking(); setLocalSettings(updated); onUpdateSettings(updated); saveVoiceSettings(updated);
                }}>
                <option value="auto">Auto · adapt to this device</option>
                <option value="gentle">Gentle · prepare, then play</option>
              </select>
            </label>
            <p className="text-[10px] text-[#a99dae]">Auto measures generation speed. Gentle avoids generating during playback; short pauses between phrases are normal. Model download size stays the same.</p>
            <label className="block">Voice tone
              <select aria-label="Voice tone" value={localSettings.tone}
                className="w-full bg-[#1a1224] border border-[#322641] rounded p-2"
                onChange={event => {
                  const updated = { ...localSettings, tone: event.target.value as VoiceSettings['tone'] };
                  stopSpeaking(); setLocalSettings(updated); onUpdateSettings(updated); saveVoiceSettings(updated);
                }}>
                <option value="natural">Natural · original speaker</option>
                <option value="soft">Soft · gentler brightness</option>
                <option value="warm">Warm · fuller low tones</option>
              </select>
            </label>
            <p role="status" aria-live="polite" className={voiceStatus.phase === 'error' ? 'text-rose-300' : 'text-emerald-300'}>
              {voiceStatus.message}
            </p>
          </div>
          {/* 4. Variable Kawaii Character & Persona */}
          <div className="p-3 rounded-xl bg-[#221636] border border-[#3b2954] space-y-2.5">
            <label className="block text-[11px] text-[#f2ca50] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#f2ca50]" />
              <span>Character preference (not a speech-model instruction)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'cheeky_sidekick', title: 'Cheeky Sidekick 2', desc: 'Playful anime mascot & quick wit', icon: '✨' },
                { id: 'kawaii_chibi', title: 'Kawaii Chibi Robo', desc: 'Ultra-cute, sparkles & energetic nya~', icon: '🌟' },
                { id: 'moldavian_confidante', title: 'Moldavian Bestie', desc: 'Warm Slavic sisterly intuition', icon: '💖' },
                { id: 'celestial_oracle', title: 'Celestial Oracle', desc: 'Mystic depth & starry prophecy', icon: '🔮' },
                { id: 'natural_companion', title: 'Natural Companion', desc: 'Grounded conversation & warmth', icon: '☕' },
              ].map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    const updated = { ...localSettings, kawaiiMode: k.id as any };
                    setLocalSettings(updated);
                    onUpdateSettings(updated);
                    saveVoiceSettings(updated);
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    localSettings.kawaiiMode === k.id
                      ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50]'
                      : 'bg-[#1a1224] border-[#322641] text-[#c7bcce] hover:border-[#d4af37]/40'
                  }`}
                >
                  <div className="font-bold text-[10px] flex items-center justify-between">
                    <span>{k.icon} {k.title}</span>
                    {localSettings.kawaiiMode === k.id && <Check className="w-3 h-3 shrink-0" />}
                  </div>
                  <span className="text-[8px] text-[#a99dae] block mt-0.5">
                    {k.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Kawaii Intensity Range Slider */}
            <div className="pt-1">
              <div className="flex justify-between text-[10px] text-[#a99dae] mb-1">
                <span>Kawaii Personality Intensity</span>
                <span className="text-[#f2ca50] font-bold">{localSettings.kawaiiIntensity ?? 85}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={localSettings.kawaiiIntensity ?? 85}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const updated = { ...localSettings, kawaiiIntensity: val };
                  setLocalSettings(updated);
                  onUpdateSettings(updated);
                  saveVoiceSettings(updated);
                }}
                className="w-full accent-[#d4af37] cursor-pointer"
              />
            </div>
          </div>
          {/* 4. Pitch & Speed Sliders */}
          <div className="p-3 rounded-xl bg-[#1d122b] border border-[#322641] space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-[#a99dae] mb-1">
                <span>Playback Pitch (also changes speed)</span>
                <span className="text-[#f2ca50]">{localSettings.pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={localSettings.pitch}
                onChange={(e) => handleSliderChange('pitch', parseFloat(e.target.value))}
                className="w-full accent-[#d4af37] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-[#a99dae] mb-1">
                <span>Reading Pace (Speed)</span>
                <span className="text-[#f2ca50]">{localSettings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={localSettings.rate}
                onChange={(e) => handleSliderChange('rate', parseFloat(e.target.value))}
                className="w-full accent-[#d4af37] cursor-pointer"
              />
            </div>
          </div>
          {/* 5. Sprite Movement Dynamics */}
          <div>
            <label className="block text-[11px] text-[#a99dae] mb-1.5 font-semibold">
              Mascot Sprite Dynamics
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeSpriteMode('wander')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  localSettings.spriteMode === 'wander'
                    ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50]'
                    : 'bg-[#1a1224] border-[#322641] text-[#c7bcce] hover:border-[#d4af37]/40'
                }`}
              >
                <Compass className="w-4 h-4 text-[#f2ca50]" />
                <span className="text-[10px] font-bold">Chart Guide</span>
                <span className="text-[8px] text-[#8e8294]">Interacts with Planets</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeSpriteMode('follow')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  localSettings.spriteMode === 'follow'
                    ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50]'
                    : 'bg-[#1a1224] border-[#322641] text-[#c7bcce] hover:border-[#d4af37]/40'
                }`}
              >
                <MousePointer className="w-4 h-4 text-[#9fb4ff]" />
                <span className="text-[10px] font-bold">Follow Cursor</span>
                <span className="text-[8px] text-[#8e8294]">Trails Mouse</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeSpriteMode('docked')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  localSettings.spriteMode === 'docked'
                    ? 'bg-[#3b2752] border-[#f2ca50] text-[#f2ca50]'
                    : 'bg-[#1a1224] border-[#322641] text-[#c7bcce] hover:border-[#d4af37]/40'
                }`}
              >
                <Bot className="w-4 h-4 text-[#f2a38c]" />
                <span className="text-[10px] font-bold">Docked</span>
                <span className="text-[8px] text-[#8e8294]">Stays in Corner</span>
              </button>
            </div>
          </div>
          {/* Test Voice Button */}
          <VoiceMeasurementPanel />
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isPlayingTest}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#f2a38c] text-[#120c1c] font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlayingTest ? 'Speaking Test Phrase...' : 'Preview Natally’s voice'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#1d122e] border-t border-[#322641] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const def: VoiceSettings = {
                ...DEFAULT_VOICE_SETTINGS,
                customAvatarUrl: customAvatar,
              };
              setLocalSettings(def);
              onUpdateSettings(def);
            }}
            className="text-[10px] text-[#a99dae] hover:text-[#f2ca50] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#271c36] hover:bg-[#382650] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-xs transition-colors cursor-pointer"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
