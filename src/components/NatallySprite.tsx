import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Volume2, MessageSquare, Heart, X } from 'lucide-react';
import { NatalChartResult } from '../services/ephemeris';
import { VoiceSettings, speakNatallyText, isSpeechBusy } from '../services/voiceService';
import { NatallyAvatar } from './NatallyAvatar';

interface NatallySpriteProps {
  chart: NatalChartResult;
  settings: VoiceSettings;
  isSpeaking: boolean;
  activeTargetEntity: string | null;
  latestSpeechSnippet: string | null;
  isOpen?: boolean;
  onOpenChat: () => void;
  onSelectPlanet?: (name: string) => void;
}

const KAWAII_GREETINGS = [
  "Okay, what's the situation? Let's take a look.",
  "Your chart has layers. Relatable, honestly.",
  "Hey. Love, work, or a bit of everything?",
  "We can start small. One question is plenty.",
  "A little perspective? I've got you.",
  "The stars are doing their thing. Let's figure out yours.",
];

const ENNUI_IDLE_THOUGHTS = [
  "No rush. Sometimes you need a minute to let things land.",
  "A chart can hold a contradiction. So can a person.",
  "Your Ascendant is the first impression. There's more going on underneath.",
  "Mercury has a reputation. Still not blaming it for every unread message.",
  "You don't need a whole life plan right now. A next step works.",
  "If a placement caught your eye, we can unpack it.",
  "The sky keeps moving. We can take this at your pace.",
];

/** Shuffle-cycle: draws without replacement — never the same line twice
 * in a row (or until the whole deck is spent), unlike Math.random redraws. */
let idleDeck: string[] = [];
const drawIdleThought = (): string => {
  if (idleDeck.length === 0) {
    idleDeck = [...ENNUI_IDLE_THOUGHTS];
    // Fisher-Yates
    for (let i = idleDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idleDeck[i], idleDeck[j]] = [idleDeck[j], idleDeck[i]];
    }
  }
  return idleDeck.pop() ?? ENNUI_IDLE_THOUGHTS[0];
};

export const NatallySprite: React.FC<NatallySpriteProps> = ({
  chart,
  settings,
  isSpeaking,
  activeTargetEntity,
  latestSpeechSnippet,
  isOpen = false,
  onOpenChat,
}) => {
  const [tiltAngle, setTiltAngle] = useState(0);
  const [isPlayfulBouncing, setIsPlayfulBouncing] = useState(false);
  const [isNearCursor, setIsNearCursor] = useState(false);
  const [showSparkleBurst, setShowSparkleBurst] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const lastGreetingTimeRef = useRef(0);
  const lastActivityTimeRef = useRef(Date.now());
  const speechTimeoutRef = useRef<any>(null);
  const idleCheckIntervalRef = useRef<any>(null);
  const idleThresholdRef = useRef<number | null>(null);

  // Playful greeting speech bubble trigger helper
  const triggerGreeting = useCallback((customText?: string) => {
    const text =
      customText ||
      KAWAII_GREETINGS[Math.floor(Math.random() * KAWAII_GREETINGS.length)];
    setSpeechBubbleText(text);
    setIsPlayfulBouncing(true);
    setShowSparkleBurst(true);

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    speechTimeoutRef.current = setTimeout(() => {
      setIsPlayfulBouncing(false);
      setShowSparkleBurst(false);
      setSpeechBubbleText(null);
    }, 4500);
  }, []);

  // Idle and ennui watcher: triggers when user is inactive for > 18 seconds
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityTimeRef.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
        setIsWaving(false);
        setShowSparkleBurst(true);
        triggerGreeting("Hey, welcome back. Where were we?");
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    idleCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityTimeRef.current;
      // Irregular period: each quiet-time threshold differs from the last
      // (12–30s band, never equal twice running) so the cadence never reads
      // as mechanical — operator hypersensitivity directive 2026-10-12.
      idleThresholdRef.current =
        idleThresholdRef.current === null
          ? 12000 + Math.random() * 18000
          : (() => {
              let next = 0;
              do {
                next = 12000 + Math.random() * 18000;
              } while (Math.abs(next - idleThresholdRef.current) < 4000);
              return next;
            })();
      if (elapsed > idleThresholdRef.current && !isSpeaking && !isSpeechBusy() && !isOpen && !isIdle) {
        setIsIdle(true);
        setIsWaving(true);
        const randomThought = drawIdleThought();
        setSpeechBubbleText(randomThought);

        if (settings.readingAloud && !isSpeechBusy()) {
          speakNatallyText(randomThought, settings);
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [isIdle, isSpeaking, isOpen, settings, triggerGreeting]);

  // When cursor approaches, tilt head gently towards it
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (typeof window === 'undefined') return;
    // Intercom placement coordinates (bottom-right: ~window.innerWidth - 95, ~window.innerHeight - 85)
    const spriteX = window.innerWidth - 95;
    const spriteY = window.innerHeight - 85;
    const dx = e.clientX - spriteX;
    const dy = e.clientY - spriteY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Cute gentle head tilt towards cursor
    const targetTilt = Math.max(-10, Math.min(10, (dx / 120) * 8));
    setTiltAngle(targetTilt);

    if (dist < 140) {
      setIsNearCursor(true);
      const now = Date.now();
      if (now - lastGreetingTimeRef.current > 12000 && !isSpeaking && !isOpen) {
        lastGreetingTimeRef.current = now;
        triggerGreeting();
      }
    } else {
      setIsNearCursor(false);
    }
  }, [isSpeaking, isOpen, triggerGreeting]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Clicking on Natally functions to OPEN / TOGGLE the chatbox, NEVER running away offscreen!
  const handleClickMascot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayfulBouncing(true);
    setShowSparkleBurst(true);

    const greeting = "Hey. What's on your mind?";
    triggerGreeting(greeting);

    if (settings.readingAloud && !isSpeechBusy()) {
      speakNatallyText(greeting, settings);
    }

    // Opens or toggles chatbox companion cleanly
    onOpenChat();
  };

  const displayMessage = isSpeaking
    ? latestSpeechSnippet || 'Speaking with you...'
    : speechBubbleText || latestSpeechSnippet;

  return (
    <div
      className="fixed bottom-6 right-8 sm:right-12 md:right-14 z-50 select-none flex flex-col items-center pointer-events-auto"
      style={{
        // Intercom-style placement: comfortable clearance from right edge so button and avatar never cut off
        filter: 'drop-shadow(0 14px 32px rgba(0,0,0,0.75))',
      }}
    >
      {/* Kawaii Speech / Thought Balloon (strictly bounded so it never clips screen edges) */}
      {displayMessage && (
        <div
          style={{
            bottom: '100%',
            marginBottom: '14px',
            right: '0',
            width: '240px',
            maxWidth: 'calc(100vw - 48px)',
          }}
          className="absolute z-50 p-3 rounded-2xl bg-[#1d122e]/98 border border-[#f2ca50]/80 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-md text-[#f1e8d8] font-mono text-[11px] leading-relaxed animate-fade-in pointer-events-auto break-words whitespace-normal"
        >
          <div className="flex items-center justify-between text-[9px] text-[#f2ca50] font-bold mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f2ca50] animate-spin" />
              <span>NATALLY</span>
            </span>
            {isSpeaking ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>Speaking</span>
              </span>
            ) : isIdle ? (
              <span className="flex items-center gap-1 text-[#f2a38c]">
                <Heart className="w-2.5 h-2.5 fill-current animate-pulse" />
                <span>Ennui Musing</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#f2a38c]">
                <Heart className="w-2.5 h-2.5 fill-current" />
                <span>Kawaii</span>
              </span>
            )}
          </div>
          <p className="max-h-24 overflow-y-auto text-white/95 font-medium leading-relaxed pr-1">
            {displayMessage}
          </p>

          {/* Balloon tail pointing down to mascot */}
          <div className="absolute right-7 top-full border-6 border-transparent border-t-[#1d122e]/98 -translate-x-1/2" />
        </div>
      )}

      {/* Burst Stardust Sparkles on Interaction / Hover */}
      {(showSparkleBurst || isPlayfulBouncing) && (
        <div className="absolute -inset-6 pointer-events-none flex items-center justify-center animate-ping">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#f2ca50] via-[#ec4899] to-[#a855f7] opacity-65 blur-md" />
        </div>
      )}

      {/* Main Mascot Button: Clicking opens the chatbox without running away */}
      <button
        type="button"
        onClick={handleClickMascot}
        style={{
          transform: `rotate(${isSpeaking ? 0 : tiltAngle}deg) scale(${isNearCursor ? 1.06 : 1})`,
          width: isSpeaking && !isOpen ? Math.min(160, Math.max(80, Number(import.meta.env?.VITE_NATALLY_SPEAKING_SIZE) || 112)) : undefined,
          height: isSpeaking && !isOpen ? Math.min(160, Math.max(80, Number(import.meta.env?.VITE_NATALLY_SPEAKING_SIZE) || 112)) : undefined,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#f2ca50] ${
          isPlayfulBouncing ? 'animate-bounce' : isIdle && !isOpen ? 'animate-float-wander' : ''
        }`}
        title="Chat with Natally! (Click to open chat)"
      >
        {/* Pulsing Luminous Aura Ring */}
        <div
          className={`absolute -inset-2 rounded-full bg-gradient-to-r from-[#f2ca50] via-[#c084fc] to-[#f472b6] blur-md transition-all duration-300 ${
            isNearCursor || isSpeaking || isOpen
              ? 'opacity-100 scale-105 animate-pulse'
              : isIdle
              ? 'opacity-85 animate-pulse'
              : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
          }`}
        />

        {/* Natally Mascot Avatar (Faithful to Graphic) */}
        <div className="relative w-full h-full rounded-full shadow-2xl flex items-center justify-center bg-[#180e28] border-2 border-[#f2ca50]/80 overflow-hidden">
          <NatallyAvatar size="100%" isAnimated={true} isSpeaking={isSpeaking} />
        </div>

        {/* Idle Waving Badge */}
        {isIdle && !isOpen && (
          <div className="absolute -top-3.5 -left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ec4899] to-[#f2ca50] text-[#120c1c] text-[10px] font-bold shadow-xl flex items-center gap-1 z-30 animate-bounce">
            <span className="animate-wave-hand inline-block">👋</span>
            <span>Psst!</span>
          </div>
        )}

        {/* Hover "Chat!" Badge */}
        {isNearCursor && !isSpeaking && !isOpen && !isIdle && (
          <div className="absolute -top-2.5 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#f2ca50] to-[#f472b6] text-[#120c1c] text-[9px] font-bold shadow-lg animate-bounce flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Chat!</span>
          </div>
        )}

        {/* Speaking Audio Waves Indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#120c1c] shadow flex items-center justify-center">
            <Volume2 className="w-3 h-3 text-[#120c1c] animate-ping" />
          </div>
        )}
      </button>

      {/* Intercom-style Chat Launcher Pill (Centered directly beneath avatar with balanced padding) */}
      <button
        type="button"
        onClick={handleClickMascot}
        className="mt-2.5 flex items-center justify-center gap-1.5 bg-[#1d122e]/98 hover:bg-[#2d1b46] border border-[#f2ca50]/70 hover:border-[#f2ca50] px-3 py-1 rounded-full text-xs font-mono text-[#f1e8d8] shadow-xl cursor-pointer transition-all hover:scale-105 whitespace-nowrap"
        title={isOpen ? 'Close Natally Chat' : 'Open Natally Astrological Chat'}
      >
        <MessageSquare className="w-3.5 h-3.5 text-[#f2ca50] shrink-0" />
        <span className="text-[#f2ca50] font-bold">{isOpen ? 'Close' : 'Chat'}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      </button>
    </div>
  );
};
