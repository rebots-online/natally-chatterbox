import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Download,
  Trash2,
  Sparkles,
  Minimize2,
  Maximize2,
  Move,
  Volume2,
  VolumeX,
  Sliders,
  Search,
  Compass,
  Tag,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Paperclip,
  ZoomIn,
} from 'lucide-react';
import { loadAccountValue, saveAccountValue } from '../services/accountStorage';
import { NatalChartResult } from '../services/ephemeris';
import { ChatMessage, askNatally, ChartCue, chartFocusAt, validateChartCues } from '../services/natallyChat';
import { createCalculationSession } from '../services/calculationTools';
import { keepKaraokeVisible } from '../services/karaokeScroll';
import { getChatViewportLayout } from '../services/chatViewport';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { RichText } from './RichText';
import {
  VoiceSettings,
  loadVoiceSettings,
  saveVoiceSettings,
  speakNatallyText,
  stopSpeaking,
  beginSpeechTurn,
  isSpeechBusy,
} from '../services/voiceService';
import { ConversationVoiceStatus } from './VoiceDownloadStatus';
import { NatallyConfigModal } from './NatallyConfigModal';
import { NatallyIcon } from './NatallyIcon';
import { setCustomAvatarUrl } from './NatallyAvatar';

export interface PersistentChatMessage extends ChatMessage {
  topic?: string;
  category?: 'lore' | 'reading' | 'chat' | 'horoscope' | 'synastry';
  mediaUrl?: string;
  mediaName?: string;
}

interface NatallyChatbotProps {
  accountUid: string;
  isCurrentSession: () => boolean;
  chart: NatalChartResult;
  partnerChart?: NatalChartResult | null;
  userLore: string[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSignIn: () => void;
  isSignedIn: boolean;
  onAddUserLore: (lore: string) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  onSpeechStateChange: (isSpeaking: boolean, snippet: string | null, targetEntity: string | null) => void;
  onSelectPlanet?: (name: string) => void;
  onChartFocus?: (targets: string[], sourceChart: NatalChartResult) => void;
  externalReadingToInject?: {
    title: string;
    content: string;
    type: string;
    sender?: 'user' | 'natally';
    chartCues?: ChartCue[];
    chartFocusKey?: string;
  } | null;
  onClearExternalReading?: () => void;
  /** Quick-entry keyboard path: a user message injected from the small
   * summon-on-typing entry box — handled as a normal sent turn. */
  quickMessage?: { text: string; nonce: number } | null;
  onClearQuickMessage?: () => void;
}

const CHAT_STORAGE_KEY = 'astrosphere_natally_chat_history_v3';

export const NatallyChatbot: React.FC<NatallyChatbotProps> = ({
  accountUid,
  isCurrentSession,
  chart,
  partnerChart,
  userLore,
  isOpen,
  onClose,
  onOpen,
  onSignIn,
  isSignedIn,
  onAddUserLore,
  voiceSettings,
  onUpdateVoiceSettings,
  onSpeechStateChange,
  onSelectPlanet,
  onChartFocus,
  externalReadingToInject,
  onClearExternalReading,
  quickMessage,
  onClearQuickMessage,
}) => {
  const calculationSession = useMemo(() => createCalculationSession(chart, partnerChart), [chart, partnerChart]);
  // Load persistent messages or initialize default
  const [messages, setMessages] = useState<PersistentChatMessage[]>(() => {
    const saved = loadAccountValue<unknown>(CHAT_STORAGE_KEY, accountUid, null);
    if (Array.isArray(saved) && saved.every(message => message && typeof message.id === 'string' &&
        typeof message.text === 'string' && ['user', 'natally'].includes(message.sender))) return saved;
    return [
      {
        id: 'init-1',
        sender: 'natally',
        text: `Salut ${chart.input.name}! ✨ I am Natally, your Moldavian cosmic confidante! I'm reading your live 3D natal astrolabe (${chart.sunFormatted}, ${chart.ascFormatted}, born in ${chart.input.placeName}). What cosmic drama, readings, or lore are we unpacking today? You can upload images or documents, ask about love, career, specific planets, or why your emotions are in HD!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topic: 'Origin & Core Astrolabe',
        category: 'lore',
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [preparingMsgId, setPreparingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Error recovery & Evidence inspection state
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ message: string; canRetry: boolean; errorType: string } | null>(null);
  const [expandedEvidenceMsgId, setExpandedEvidenceMsgId] = useState<string | null>(null);

  // Media upload state
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draggable Card Coordinates & Size State - docked in comfortable bottom-right corner
  const [cardPos, setCardPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('astrosphere_natally_chat_pos_v3');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: Math.max(20, w - 490),
      y: Math.max(30, h - 640),
    };
  });
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({
    width: 460,
    height: 600,
  });
  const viewport = useVisualViewport();
  const chatLayout = getChatViewportLayout(viewport, cardPos, cardSize, isExpanded);
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 460, height: 600 });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 });

  // Save card position to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('astrosphere_natally_chat_pos_v3', JSON.stringify(cardPos));
    } catch (_) {}
  }, [cardPos]);

  // Ensure chat card is always clamped and visible in viewport when opened, never offscreen
  useEffect(() => {
    if (isOpen) {
      setCardPos((prev) => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const h = typeof window !== 'undefined' ? window.innerHeight : 800;
        const width = Math.min(cardSize.width || 460, w - 32);
        const height = Math.min(cardSize.height || 600, h - 40);

        if (
          !prev ||
          prev.x === undefined ||
          prev.y === undefined ||
          isNaN(prev.x) ||
          isNaN(prev.y) ||
          prev.x < 10 ||
          prev.x > w - 100 ||
          prev.y < 10 ||
          prev.y > h - 100
        ) {
          return {
            x: Math.max(16, w - width - 32),
            y: Math.max(20, h - height - 32),
          };
        }

        return {
          x: Math.max(16, Math.min(w - width - 16, prev.x)),
          y: Math.max(16, Math.min(h - height - 16, prev.y)),
        };
      });
    }
  }, [isOpen, cardSize.width, cardSize.height]);

  // Karaoke state
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [karaokeCharIndex, setKaraokeCharIndex] = useState<number | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const handleSendMessageRef = useRef<((t?: string) => Promise<void>) | null>(null);
  const consumedExternalReading = useRef<typeof externalReadingToInject>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const recognitionRef = useRef<any>(null);


  // Always land on the LATEST message: on open and on every new turn —
  // opening at the first-ever message forced an extreme scroll (operator
  // report 2026-10-12).
  useEffect(() => {
    if (isOpen && !currentlySpeakingMsgId && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen || !currentlySpeakingMsgId || karaokeCharIndex === null) return;
    const container = messagesContainerRef.current;
    const active = messageRefs.current[currentlySpeakingMsgId]?.querySelector<HTMLElement>('[data-karaoke-active="true"]');
    if (container && active) keepKaraokeVisible(container, active,
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, [isOpen, currentlySpeakingMsgId, karaokeCharIndex]);

  const mounted = useRef(true);
  const currentChart = useRef(chart);
  currentChart.current = chart;
  const presentationGeneration = useRef(0);
  const inferenceGeneration = useRef(0);
  const inferenceAbort = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const activeStreamMessage = useRef<PersistentChatMessage | null>(null);
  const greetingAllowed = useRef(true);
  const sessionIsActive = () => mounted.current && isCurrentSession() && currentChart.current === chart;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; inferenceGeneration.current++; inferenceAbort.current?.abort(); stopSpeaking(); };
  }, []);

  useEffect(() => {
    inferenceGeneration.current++; inferenceAbort.current?.abort();
    stopSpeaking();
    presentationGeneration.current++;
    setIsTyping(false);
    setCurrentlySpeakingMsgId(null);
    setPreparingMsgId(null);
    setKaraokeCharIndex(null);
    onSpeechStateChange(false, null, null);
    onChartFocus?.([], chart);
  }, [chart]);

  const presentMessage = (message: PersistentChatMessage) => {
    greetingAllowed.current = false;
    inferenceGeneration.current++; inferenceAbort.current?.abort(); setIsTyping(false);
    const generation = ++presentationGeneration.current;
    stopSpeaking(); setCurrentlySpeakingMsgId(null); setPreparingMsgId(null); setKaraokeCharIndex(null); onSpeechStateChange(false, null, null);
    const active = () => sessionIsActive() && presentationGeneration.current === generation;
    const cues = validateChartCues(message.chartCues, message.text, message.chartFocusKey, chart);
    let lastFocus = '';
    const focus = (targets: string[]) => {
      if (!active() || lastFocus === JSON.stringify(targets)) return;
      lastFocus = JSON.stringify(targets);
      onChartFocus?.(targets, chart);
    };
    focus(cues[0]?.targets || []);
    if (!voiceSettings.readingAloud) {
      onSpeechStateChange(false, message.text.slice(0, 110), null);
      return;
    }
    setPreparingMsgId(message.id);
    speakNatallyText(message.text, voiceSettings,
      () => { if (active()) { setPreparingMsgId(null); setCurrentlySpeakingMsgId(message.id); onSpeechStateChange(true, message.text.slice(0, 110), cues[0]?.targets[0] || null); } },
      () => {
        if (!active()) return;
        focus([]);
        onSpeechStateChange(false, null, null);
        setCurrentlySpeakingMsgId(null);
        setPreparingMsgId(null);
        setKaraokeCharIndex(null);
      },
      charIdx => {
        if (!active()) return;
        setKaraokeCharIndex(charIdx);
        focus(chartFocusAt(cues, charIdx));
      }, playing => {
        if (!active()) return;
        setCurrentlySpeakingMsgId(playing ? message.id : null);
        setPreparingMsgId(playing ? null : message.id);
        if (!playing) setKaraokeCharIndex(null);
        onSpeechStateChange(playing, playing ? message.text.slice(0, 110) : null, playing ? cues[0]?.targets[0] || null : null);
      });
  };

  useEffect(() => {
    if (sessionIsActive()) saveAccountValue(CHAT_STORAGE_KEY, accountUid, messages);
  }, [messages, accountUid]);

  const extractAstrologicalEntity = (text: string): string | null => {
    const bodies = [
      'Venus',
      'Mars',
      'Sun',
      'Moon',
      'Jupiter',
      'Saturn',
      'Mercury',
      'Uranus',
      'Neptune',
      'Pluto',
      'Chiron',
    ];
    for (const b of bodies) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
        return b;
      }
    }
    const houseMatch = text.match(/\bHouse\s+(\d{1,2})\b/i);
    if (houseMatch) {
      return `House ${houseMatch[1]}`;
    }
    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (!sessionIsActive()) return;
    const text = (textToSend || inputText).trim();
    if (!text && !attachedMedia) return;
    const interrupted = isSpeechBusy() || isTyping;
    inferenceAbort.current?.abort();
    const turnGeneration = ++inferenceGeneration.current;
    const presentation = ++presentationGeneration.current;
    const controller = new AbortController(); inferenceAbort.current = controller;
    const active = () => sessionIsActive() && inferenceGeneration.current === turnGeneration && !controller.signal.aborted;
    const speechActive = () => active() && presentationGeneration.current === presentation;
    greetingAllowed.current = false;
    stopSpeaking();
    setCurrentlySpeakingMsgId(null); setKaraokeCharIndex(null); onSpeechStateChange(false, null, null);
    onChartFocus?.([], chart);

    const mediaToSave = attachedMedia;
    setAttachedMedia(null);

    const userMsg: PersistentChatMessage = {
      id: `user-${Date.now()}-${turnGeneration}`,
      sender: 'user',
      text: text || '(Shared Media)',
      mediaUrl: mediaToSave?.url,
      mediaName: mediaToSave?.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'chat',
    };

    const history = messagesRef.current;
    messagesRef.current = [...history, userMsg]; setMessages(messagesRef.current);
    setInputText('');
    setIsTyping(true);
    setErrorDetails(null);
    setLastFailedPrompt(null);

    const replyId = `natally-${Date.now()}-${turnGeneration}`;
    const baseMessage: PersistentChatMessage = { id: replyId, sender: 'natally', text: '', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), category: 'reading', isOfflineMode: false };
    activeStreamMessage.current = baseMessage;
    let streamedCues: ChartCue[] = [];
    let lastFocus = '';
    const focus = (targets: string[]) => {
      if (!speechActive() || lastFocus === JSON.stringify(targets)) return;
      lastFocus = JSON.stringify(targets); onChartFocus?.(targets, chart);
    };
    const storeMessage = (message: PersistentChatMessage) => {
      if (!active()) return;
      activeStreamMessage.current = message;
      messagesRef.current = messagesRef.current.some(item => item.id === replyId)
        ? messagesRef.current.map(item => item.id === replyId ? message : item) : [...messagesRef.current, message];
      setMessages(messagesRef.current);
      streamedCues = validateChartCues(message.chartCues, message.text, message.chartFocusKey, chart);
    };
    setPreparingMsgId(voiceSettings.readingAloud ? replyId : null);
    const speech = beginSpeechTurn(voiceSettings, {
      onPlaybackState: playing => { if (speechActive()) { setPreparingMsgId(playing ? null : replyId); setCurrentlySpeakingMsgId(playing ? replyId : null); if (!playing) setKaraokeCharIndex(null); onSpeechStateChange(playing, playing ? activeStreamMessage.current?.text.slice(0, 110) || null : null, playing ? streamedCues[0]?.targets[0] || null : null); } },
      onEnd: () => { if (speechActive()) { focus([]); setPreparingMsgId(null); setCurrentlySpeakingMsgId(null); setKaraokeCharIndex(null); onSpeechStateChange(false, null, null); } },
      onWordBoundary: charIndex => { if (speechActive()) { setKaraokeCharIndex(charIndex); focus(chartFocusAt(streamedCues, charIndex)); } },
    }, interrupted ? 'interrupt' : 'receipt');

    if (
      text.toLowerCase().includes('i am') ||
      text.toLowerCase().includes('my job') ||
      text.toLowerCase().includes('my partner') ||
      text.toLowerCase().includes('i was born')
    ) {
      onAddUserLore(text.slice(0, 100));
    }

    if (mediaToSave) {
      onAddUserLore(`Shared media asset: ${mediaToSave.name}`);
    }

    try {
      let promptQuery = mediaToSave
        ? `${text}\n[Attached Media: ${mediaToSave.name}. Please incorporate insights from this shared media into our astrological reading and lore!]`
        : text;

      if (interrupted) promptQuery += '\n[Delivery context: the previous reply was interrupted while its displayed text remained available. Do not assume the reason or what was heard. Address this new message.]';
      await speech.acknowledged;
      if (!active()) return;
      const result = await askNatally(promptQuery, history, chart, userLore, undefined, {
        partnerChart, calculationSession, isCurrentSession: active, signal: controller.signal,
        onPartial: partial => {
          if (!active() || !partial.text.trim()) return;
          storeMessage({ ...baseMessage, text: partial.text, chartCues: partial.chartCues, chartFocusKey: partial.chartFocusKey });
          speech.update(partial.text);
        },
      });
      if (!active()) return;

      const reply = result.text;
      const targetEntity = extractAstrologicalEntity(reply);

      const topicTag = targetEntity
        ? `${targetEntity} Insight`
        : mediaToSave
        ? `Media: ${mediaToSave.name.slice(0, 15)}`
        : text.length < 24
        ? text
        : `${text.slice(0, 20)}...`;

      const natallyMsg: PersistentChatMessage = {
        id: replyId,
        sender: 'natally',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topic: topicTag,
        category: 'reading',
        evidence: result.evidence,
        chartCues: result.chartCues,
        chartFocusKey: result.chartFocusKey,
        isOfflineMode: false,
      };
      storeMessage(natallyMsg);
      speech.update(reply, true); void speech.done();
    } catch (e: any) {
      if (!active()) return;
      speech.fail(e);
      console.error('Natally inference failed:', e);
      // Preserve the user's unfulfilled message so it is not lost
      setInputText(text);
      setLastFailedPrompt(text);

      const errMessage =
        e?.details?.message ||
        e?.message ||
        'Celestial inference connection failed. Please check connection or retry.';

      setErrorDetails({
        message: errMessage,
        canRetry: e?.details?.canRetry ?? true,
        errorType: e?.code || e?.details?.errorType || 'inference_failure',
      });
    } finally {
      if (active()) setIsTyping(false);
      if (inferenceAbort.current === controller) inferenceAbort.current = null;
    }
  };

  handleSendMessageRef.current = (t?: string) => handleSendMessage(t);

  // Quick-entry: consume the injected keyboard message as a sent turn.
  useEffect(() => {
    if (quickMessage?.text && chart) {
      void handleSendMessageRef.current?.(quickMessage.text);
      onClearQuickMessage?.();
    }
  }, [quickMessage, chart]);

  // Inject external reading or user inquiry (e.g. from Readings modal, Themes box, or Multi-select)
  useEffect(() => {
    if (sessionIsActive() && externalReadingToInject && consumedExternalReading.current !== externalReadingToInject) {
      const { title, content, type, sender } = externalReadingToInject;
      if (type === 'initial_reading' && !isSignedIn) {
        onOpen();
        onSignIn();
        return;
      }
      consumedExternalReading.current = externalReadingToInject;

      if (sender === 'user' || type === 'user_query' || type === 'user_inquiry') {
        onOpen();
        if (onClearExternalReading) {
          onClearExternalReading();
        }
        handleSendMessage(content);
        return;
      }

      const readingMsg: PersistentChatMessage = {
        id: `reading-${Date.now()}`,
        sender: 'natally',
        text: `### ${title}\n\n${content}\n\n> *Persisted to your personal lore archive.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topic: title.slice(0, 28),
        category: type as any,
        chartFocusKey: externalReadingToInject.chartFocusKey,
        chartCues: externalReadingToInject.chartCues?.map(cue => ({ ...cue, offset: cue.offset + `### ${title}\n\n`.length })),
      };

      setMessages((prev) => [...prev, readingMsg]);
      onAddUserLore(`${title}: ${content.slice(0, 120)}...`);

      presentMessage(readingMsg);

      if (onClearExternalReading) {
        onClearExternalReading();
      }

      onOpen();
    }
  }, [externalReadingToInject, isSignedIn]);

  // Read initial greeting if freshly mounted and reading aloud is enabled
  useEffect(() => {
    if (voiceSettings.readingAloud && messages.length === 1 && !currentlySpeakingMsgId) {
      const initGreeting = messages[0]?.text;
      if (initGreeting) {
        const t = setTimeout(() => {
          if (!sessionIsActive() || !greetingAllowed.current) return;
          presentMessage(messages[0]);
        }, 1200);
        return () => clearTimeout(t);
      }
    }
  }, []);

  // Voice speech-to-text recognition initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && sessionIsActive()) {
          void handleSendMessageRef.current?.(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      return () => {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
        recognitionRef.current = null;
      };
    }
  }, [chart, voiceSettings]);

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser window. You can type freely!');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Draggable card event handlers - can drag anywhere on card
  const handleCardPointerDown = (e: React.PointerEvent) => {
    if (chatLayout.mobile) return;
    if (
      (e.target as HTMLElement).closest(
        'button, input, textarea, a, select, [role="button"], form, .overflow-y-auto'
      ) ||
      isExpanded
    ) {
      return;
    }
    setIsDraggingCard(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: cardPos.x,
      initialY: cardPos.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCard || isExpanded || chatLayout.mobile) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const curWidth = Math.min(cardSize.width, window.innerWidth - 32);
    const curHeight = Math.min(cardSize.height, window.innerHeight - 32);
    const newX = Math.max(16, Math.min(window.innerWidth - curWidth - 16, dragStartRef.current.initialX + dx));
    const newY = Math.max(16, Math.min(window.innerHeight - curHeight - 16, dragStartRef.current.initialY + dy));
    setCardPos({ x: newX, y: newY });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent) => {
    if (isDraggingCard) {
      setIsDraggingCard(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Corner resize handler
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: cardSize.width,
      height: cardSize.height,
    };
    const handlePointerMove = (ev: PointerEvent) => {
      if (!isResizingRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.mouseX;
      const dy = ev.clientY - resizeStartRef.current.mouseY;
      setCardSize({
        width: Math.max(320, Math.min(window.innerWidth - 30, resizeStartRef.current.width + dx)),
        height: Math.max(380, Math.min(window.innerHeight - 30, resizeStartRef.current.height + dy)),
      });
    };
    const handlePointerUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Media upload handler
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!sessionIsActive()) return;
      const dataUrl = event.target?.result as string;
      setAttachedMedia({ url: dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Replay a specific turn using the loudspeaker icon with karaoke
  const handleReplayTurn = (msg: PersistentChatMessage) => {
    if (!sessionIsActive()) return;
    if (currentlySpeakingMsgId === msg.id || preparingMsgId === msg.id) {
      stopSpeaking();
      setCurrentlySpeakingMsgId(null);
      setPreparingMsgId(null);
      setKaraokeCharIndex(null);
      onSpeechStateChange(false, null, null);
      return;
    }

    presentMessage(msg);
  };

  // Scroll to a specific message milestone from the timeline
  const scrollToMessage = (msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#f2ca50]');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#f2ca50]'), 1800);
    }
  };

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        (m.mediaName && m.mediaName.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  const messageChartCues = useMemo(() => new Map(messages.map(message => [message.id,
    validateChartCues(message.chartCues, message.text, message.chartFocusKey, chart)])), [messages, chart]);

  // Rich scrollable timeline milestones with date-time markings for all key turns
  const timelineTopics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return messages
      .filter((m) => {
        // Include messages with explicit topic, readings, user inquiries, or first greeting
        if (m.topic) return true;
        if (m.category && m.category !== 'chat') return true;
        if (m.sender === 'user') return true;
        if (m.id.includes('init') || m.id.includes('welcome')) return true;
        return false;
      })
      .map((m, idx) => {
        let topicLabel = m.topic;
        if (!topicLabel) {
          if (m.sender === 'user') {
            const clean = m.text.replace(/[*#_~`>]/g, '').trim();
            topicLabel = clean.length > 28 ? clean.slice(0, 26) + '…' : clean || 'Inquiry';
          } else if (m.category === 'reading') {
            topicLabel = 'Celestial Reading';
          } else if (m.category === 'horoscope') {
            topicLabel = 'Transit Horoscope';
          } else if (m.category === 'synastry') {
            topicLabel = 'Synastry Synthesis';
          } else {
            topicLabel = idx === 0 ? 'Natal Chart Vault' : `Turn ${idx + 1}`;
          }
        }
        return {
          id: m.id,
          topic: topicLabel,
          timestamp: m.timestamp,
          date: todayStr,
          sender: m.sender,
        };
      });
  }, [messages]);

  const handleDownloadTranscript = () => {
    if (!sessionIsActive()) return;
    const transcriptText = messages
      .map((m) => {
        const mediaTag = m.mediaName ? ` [Attached: ${m.mediaName}]` : '';
        return `[${m.timestamp}] ${m.sender.toUpperCase()}${mediaTag}: ${m.text}`;
      })
      .join('\n\n');
    const blob = new Blob(
      [
        `NATALLY CONVERSATION & PERSISTENT LORE TRANSCRIPT\nNative: ${chart.input.name} (${chart.sunFormatted}, ${chart.ascFormatted})\nLocation: ${chart.input.placeName}\nGenerated: ${new Date().toLocaleString()}\n\n${transcriptText}\n\n---\nCopyright (C)2026 Robin L. M. Cheung, MBA. https://natally.robin.mba/`,
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `natally_lore_${chart.input.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (!sessionIsActive()) return;
    if (confirm('Clear Natally conversation history? Your profile lore remains saved.')) {
      inferenceGeneration.current++; inferenceAbort.current?.abort(); setIsTyping(false);
      stopSpeaking();
      presentationGeneration.current++;
      setPreparingMsgId(null); setCurrentlySpeakingMsgId(null); setKaraokeCharIndex(null); onSpeechStateChange(false, null, null);
      onChartFocus?.([], chart);
      setMessages([
        {
          id: 'init-1',
          sender: 'natally',
          text: `Fresh start bestie! ✨ I still have your birth chart (${chart.sunFormatted}, ${chart.ascFormatted}). What are we diving into next?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          topic: 'Fresh Slate',
          category: 'lore',
        },
      ]);
    }
  };

  const toggleReadingAloud = () => {
    const updated = { ...voiceSettings, readingAloud: !voiceSettings.readingAloud };
    onUpdateVoiceSettings(updated);
    saveVoiceSettings(updated);
    if (!updated.readingAloud) {
      stopSpeaking();
      onSpeechStateChange(false, null, null);
      setCurrentlySpeakingMsgId(null);
      setPreparingMsgId(null);
    }
  };

  return (
    <>
      {/* Dockable, Resizable & Draggable Acrylic Chat Card */}
      {isOpen && (
        <div
          data-mobile={chatLayout.mobile}
          data-compact={chatLayout.compact}
          role="region"
          aria-label="Chat with Natally"
          style={{
            position: 'fixed',
            top: chatLayout.top,
            left: chatLayout.left,
            width: chatLayout.width,
            height: chatLayout.height,
            zIndex: 55,
            background: 'rgba(16, 10, 28, 0.48)',
            backdropFilter: 'blur(32px) saturate(210%)',
            WebkitBackdropFilter: 'blur(32px) saturate(210%)',
            boxShadow: isDraggingCard
              ? '0 24px 60px rgba(0,0,0,0.85), 0 0 24px rgba(212,175,55,0.35)'
              : '0 20px 48px -12px rgba(0,0,0,0.65), 0 0 18px rgba(212,175,55,0.25)',
          }}
          onPointerDown={handleCardPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          className={`natally-chat celestial-panel rounded-2xl border border-[#d4af37]/50 shadow-2xl flex flex-col pointer-events-auto transition-shadow cursor-grab active:cursor-grabbing ${
            isDraggingCard ? 'scale-[1.01]' : ''
          }`}
        >
          {/* Draggable Card Header */}
          <div
            onPointerDown={handleCardPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerUp}
            className={`natally-chat-header shrink-0 px-4 py-3 bg-[#1d122e]/95 border-b border-[#322641] rounded-t-2xl flex items-center justify-between select-none ${
              isExpanded ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <div className="natally-chat-identity flex min-w-0 items-center gap-2.5">
              <div title="Click to upload/change Natally's portrait" className="pointer-events-auto">
                <NatallyIcon size="header" isSpeaking={currentlySpeakingMsgId !== null} allowUploadOnClick={true} />
              </div>
              <div className="pointer-events-none">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-cinzel font-bold text-sm text-[#f2ca50] flex items-center gap-1">
                    <span>Natally</span>
                    <Move className="w-3 h-3 text-[#a99dae] opacity-60" />
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="natally-chat-detail text-[9px] font-mono text-[#f2a38c] bg-[#3b2752] px-1.5 py-0.2 rounded border border-[#f2ca50]/30">
                    Moldavian Voice
                  </span>
                </div>
                <p className="natally-chat-detail font-mono text-[10px] text-[#a99dae]">
                  Draggable Card · {chart.ascFormatted}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="natally-chat-controls flex shrink-0 items-center gap-1 text-[#a99dae] pointer-events-auto">

              <button
                type="button"
                onClick={toggleReadingAloud}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  voiceSettings.readingAloud
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                    : 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                }`}
                title={
                  voiceSettings.readingAloud
                    ? 'Reading Aloud Active (Click to mute)'
                    : 'Silent Mode (Click to enable Voice)'
                }
              >
                {voiceSettings.readingAloud ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="p-1.5 rounded-lg hover:text-[#f2ca50] transition-colors cursor-pointer"
                title="Voice & Mascot Configuration"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDownloadTranscript}
                className="p-1.5 rounded-lg hover:text-[#f2ca50] transition-colors cursor-pointer"
                title="Download Persistent Transcript"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg hover:text-rose-400 transition-colors cursor-pointer"
                title="Clear Conversation History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:text-[#f2ca50] transition-colors cursor-pointer"
                title={isExpanded ? 'Restore Size' : 'Maximize Window'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:text-rose-400 transition-colors cursor-pointer"
                title="Close Chat Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & Lore Filter */}
          <div className="natally-chat-search shrink-0 px-3.5 py-2 bg-[#170e24]/90 border-b border-[#322641] flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="w-3.5 h-3.5 text-[#a99dae] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversation, topics, or lore..."
                className="talisman-input w-full rounded-lg pl-8 pr-6 py-1 text-[11px] font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a99dae] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#a99dae] whitespace-nowrap">
              {filteredMessages.length} turns
            </span>
          </div>

          {/* Interactive Scrollable Timeline Rail with Conversation Turn-Lore & Date-Time Markings */}
          {timelineTopics.length > 0 && (
            <div className="natally-chat-timeline shrink-0 relative px-2 py-1.5 bg-[#180f26]/95 border-b border-[#322641] flex items-center gap-1.5 select-none z-10 group/timeline">
              <div className="flex items-center gap-1 shrink-0 px-1 text-[#f2ca50] font-bold text-[10px] font-mono border-r border-[#322641] pr-2">
                <Clock className="w-3.5 h-3.5 text-[#f2ca50] animate-spin-slow" />
                <span>Timeline:</span>
              </div>

              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => {
                  const rail = document.getElementById('natally-timeline-scroll-rail');
                  if (rail) rail.scrollBy({ left: -220, behavior: 'smooth' });
                }}
                className="p-1 rounded hover:bg-[#3d2657] text-[#a99dae] hover:text-[#f2ca50] transition-colors shrink-0 cursor-pointer"
                title="Scroll timeline back"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Horizontally Scrollable Timeline Track */}
              <div
                id="natally-timeline-scroll-rail"
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 flex-1 text-[10px] font-mono"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d4af37 #1a102a',
                }}
              >
                {timelineTopics.map((item, idx) => (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onClick={() => scrollToMessage(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#241537] hover:bg-[#382054] border border-[#d4af37]/35 hover:border-[#f2ca50] text-[#f1e8d8] whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 group shrink-0 shadow-sm"
                    title={`Go to: ${item.topic} (${item.date} ${item.timestamp})`}
                  >
                    <span className="text-[#f2ca50] group-hover:scale-125 transition-transform text-[11px]">✦</span>
                    <span className="font-semibold text-white/95 group-hover:text-[#f2ca50] transition-colors max-w-[130px] truncate">
                      {item.topic}
                    </span>
                    <span className="text-[8.5px] text-[#f2ca50] bg-[#160d24] px-1.5 py-0.5 rounded border border-[#d4af37]/25 font-mono flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5 text-[#f2ca50]" />
                      <span>{item.date}</span>
                    </span>
                    <span className="text-[8.5px] text-[#f2a38c] bg-[#160d24] px-1.5 py-0.5 rounded border border-[#f2a38c]/25 font-mono flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-[#f2a38c]" />
                      <span>{item.timestamp}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => {
                  const rail = document.getElementById('natally-timeline-scroll-rail');
                  if (rail) rail.scrollBy({ left: 220, behavior: 'smooth' });
                }}
                className="p-1 rounded hover:bg-[#3d2657] text-[#a99dae] hover:text-[#f2ca50] transition-colors shrink-0 cursor-pointer"
                title="Scroll timeline forward"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Infinite Scroll Messages Area */}
          <div
            ref={messagesContainerRef}
            className="natally-chat-messages min-h-0 flex-1 p-3.5 overflow-y-auto space-y-3 font-mono text-xs"
          >
            {filteredMessages.map((m) => {
              const chartCues = messageChartCues.get(m.id) || [];
              const isNatally = m.sender === 'natally';
              const isSpeakingThisMsg = currentlySpeakingMsgId === m.id;
              const isPreparingThisMsg = preparingMsgId === m.id;

              return (
                <div
                  key={m.id}
                  ref={(el) => {
                    messageRefs.current[m.id] = el;
                  }}
                  className={`flex flex-col transition-all duration-200 ${
                    isNatally ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-center gap-2 mb-1 text-[9px] text-[#8e8294]">
                    <span className="font-semibold">{isNatally ? 'NATALLY' : chart.input.name}</span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                    {m.topic && (
                      <span className="bg-[#2a1a3d] text-[#f2ca50] px-1.5 py-0.2 rounded border border-[#f2ca50]/20 flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{m.topic}</span>
                      </span>
                    )}
                    {m.isOfflineMode && (
                      <span className="bg-amber-950/70 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 text-[8px] font-mono tracking-wide uppercase">
                        Legacy generated template · not a model reply
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[88%] px-3.5 py-2.5 rounded-2xl leading-relaxed shadow-md transition-all ${
                      isNatally
                        ? `bg-[#25173c]/95 text-[#f1e8d8] border rounded-tl-sm ${
                            isSpeakingThisMsg
                              ? 'border-[#f2ca50] shadow-[0_0_16px_rgba(242,202,80,0.25)]'
                              : 'border-[#d4af37]/35'
                          }`
                        : 'bg-gradient-to-r from-[#d4af37] to-[#f2a38c] text-[#120c1c] font-medium rounded-tr-sm'
                    }`}
                  >
                    {/* Render Uploaded Media image if attached to message */}
                    {m.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/20 shadow-md">
                        <img
                          src={m.mediaUrl}
                          alt={m.mediaName || 'Uploaded media'}
                          className="max-h-48 w-full object-cover"
                        />
                        <div className="px-2.5 py-1 bg-black/75 text-[9px] font-mono text-white/90 flex items-center justify-between gap-2">
                          <span className="truncate">📎 {m.mediaName}</span>
                          <button
                            type="button"
                            onClick={() => setCustomAvatarUrl(m.mediaUrl!)}
                            className="text-[#f2ca50] hover:underline shrink-0 font-bold flex items-center gap-1 cursor-pointer bg-[#3b2752] px-2 py-0.5 rounded border border-[#f2ca50]/40"
                            title="Use this picture as Natally's avatar"
                          >
                            <span>🌟 Set as Natally Avatar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isNatally ? (
                      <div>
                        {chartCues.some(cue => cue.targets.length > 0) && (
                          <div className="mb-2 flex flex-wrap gap-1" aria-label="Chart highlights for this reply">
                            {chartCues.filter(cue => cue.targets.length > 0).map((cue, index) => (
                              <button key={index} type="button" className="rounded border border-[#d4af37]/50 px-2 py-1 text-[#ffdf80] cursor-pointer"
                                onClick={() => { stopSpeaking(); presentationGeneration.current++; onChartFocus?.(cue.targets, chart); }}>
                                Show {cue.targets.join(' · ')}
                              </button>
                            ))}
                          </div>
                        )}
                        <RichText
                          content={m.text}
                          highlightCharIndex={isSpeakingThisMsg ? karaokeCharIndex : null}
                          isCurrentlySpeaking={isSpeakingThisMsg}
                          onTagClick={(tag) => {
                            if (onSelectPlanet) onSelectPlanet(tag);
                          }}
                        />

                        {/* Optional Astrological Provenance & Verified Geometry Disclosure */}
                        {m.evidence && (
                          <div className="mt-2 pt-1 border-t border-[#3b2954]/50">
                            <button
                              type="button"
                              onClick={() => setExpandedEvidenceMsgId(expandedEvidenceMsgId === m.id ? null : m.id)}
                              className="text-[9px] font-mono text-[#d4af37] hover:text-[#f2ca50] flex items-center gap-1 cursor-pointer transition-colors bg-[#180f26] px-2 py-0.5 rounded border border-[#d4af37]/30"
                            >
                              <Compass className="w-2.5 h-2.5 text-[#d4af37]" />
                              <span>{expandedEvidenceMsgId === m.id ? 'Hide Astrological Provenance & Geometry' : '✦ View Astrological Provenance & Geometry'}</span>
                            </button>

                            {expandedEvidenceMsgId === m.id && (
                              <div className="mt-1.5 p-2 rounded-xl bg-[#130a21] border border-[#d4af37]/35 text-[9px] font-mono space-y-1 text-[#e5dcd0]">
                                <div className="font-bold text-[#f2ca50] flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-[#f2ca50]" />
                                  <span>Epistemological Provenance</span>
                                </div>
                                {m.evidence.verifiedGeometry && (
                                  <div>
                                    <span className="text-[#a99dae] font-semibold">Verified Geometry: </span>
                                    <span>{m.evidence.verifiedGeometry}</span>
                                  </div>
                                )}
                                {m.evidence.traditionalDoctrine && (
                                  <div>
                                    <span className="text-[#a99dae] font-semibold">Traditional Doctrine: </span>
                                    <span>{m.evidence.traditionalDoctrine}</span>
                                  </div>
                                )}
                                {m.evidence.modernDoctrine && (
                                  <div>
                                    <span className="text-[#a99dae] font-semibold">Modern Doctrine: </span>
                                    <span>{m.evidence.modernDoctrine}</span>
                                  </div>
                                )}
                                {m.evidence.interpretiveHypothesis && (
                                  <div>
                                    <span className="text-[#a99dae] font-semibold">Interpretive Hypothesis: </span>
                                    <span>{m.evidence.interpretiveHypothesis}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Turn-by-Turn Replay Loudspeaker & Karaoke Action Button */}
                        <div className="mt-2 pt-1.5 border-t border-[#3b2954]/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleReplayTurn(m)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                              isSpeakingThisMsg
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                                : 'bg-[#1b102b] text-[#f2ca50] border border-[#d4af37]/30 hover:bg-[#342452]'
                            }`}
                            title="Replay in Natally's Moldavian voice with karaoke"
                          >
                            <Volume2
                              className={`w-3 h-3 ${isSpeakingThisMsg ? 'animate-pulse text-emerald-300' : ''}`}
                            />
                            <span>{isSpeakingThisMsg ? 'Karaoke Active (Stop)' : isPreparingThisMsg ? 'Preparing voice (Stop)' : 'Replay Voice'}</span>
                          </button>

                          {m.category && (
                            <span className="text-[9px] text-[#8e8294] uppercase tracking-wider">
                              {m.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-[#d4af37] font-mono pl-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Natally is consulting the ephemeris &amp; personal lore...</span>
              </div>
            )}
          </div>

          {/* Error Recovery & Status Notice Banner */}
          {errorDetails && (
            <div className="shrink-0 max-h-[25%] overflow-y-auto mx-3.5 my-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-[11px] font-mono text-amber-200 flex flex-col gap-1.5 shadow-lg select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inference Status Notice</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorDetails(null)}
                  className="text-amber-400 hover:text-white text-xs cursor-pointer"
                  title="Dismiss notice"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-amber-100/90 leading-relaxed">
                {errorDetails.message}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {errorDetails.errorType === 'auth_required' && (
                  <button type="button" onClick={onSignIn}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer">
                    {isSignedIn ? 'Check sign-in' : 'Sign in to get your reading'}
                  </button>
                )}
                {errorDetails.canRetry && lastFailedPrompt && (errorDetails.errorType !== 'auth_required' || isSignedIn) && (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = lastFailedPrompt;
                      setErrorDetails(null);
                      handleSendMessage(prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer transition-colors"
                  >
                    ↻ Retry Live Inference
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Attached Media Preview inside Input Footer */}
          {attachedMedia && (
            <div className="shrink-0 px-3.5 py-1.5 bg-[#170e24] border-t border-[#322641] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={attachedMedia.url}
                  alt="Thumbnail"
                  className="w-7 h-7 rounded-lg object-cover border border-[#d4af37]/40 shrink-0"
                />
                <span className="text-[10px] font-mono text-[#f2ca50] truncate">
                  📎 {attachedMedia.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCustomAvatarUrl(attachedMedia.url)}
                  className="text-[9px] font-mono bg-[#3b2752] hover:bg-[#4d3269] text-[#f2ca50] border border-[#f2ca50]/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  title="Set this image as Natally's portrait"
                >
                  🌟 Set as Avatar
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="text-xs text-[#a99dae] hover:text-rose-400 p-1 cursor-pointer"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input Footer with Media Upload & Voice Buttons */}
          <div className="natally-chat-composer shrink-0 p-3 bg-[#1d122e]/95 border-t border-[#322641] rounded-b-2xl">
            <ConversationVoiceStatus />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Media Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleMediaUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-[#271c36] hover:bg-[#382650] border border-[#322641] text-[#a99dae] hover:text-[#f2ca50] transition-colors cursor-pointer"
                title="Upload image or chart media to share with Natally"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleVoiceListen}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-[#271c36] border-[#322641] text-[#a99dae] hover:text-[#f2ca50]'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak to Natally'}
              >
                {isListening ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                value={inputText}
                aria-label="Message Natally"
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to your voice...'
                    : 'Ask Natally or share media lore...'
                }
                className="talisman-input min-w-0 flex-1 rounded-xl px-3.5 py-2 text-xs"
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={!inputText.trim() && !attachedMedia}
                className="p-2 rounded-xl bg-[#d4af37] hover:bg-[#f2ca50] text-[#120c1c] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Corner Resize Grip */}
          {!isExpanded && !chatLayout.mobile && (
            <div
              onPointerDown={handleResizePointerDown}
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 z-50 select-none group/resize"
              title="Drag corner to resize chat container"
            >
              <svg
                viewBox="0 0 10 10"
                className="w-3 h-3 text-[#d4af37]/50 group-hover/resize:text-[#d4af37] transition-colors pointer-events-none"
              >
                <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <NatallyConfigModal
          settings={voiceSettings}
          onUpdateSettings={onUpdateVoiceSettings}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </>
  );
};
