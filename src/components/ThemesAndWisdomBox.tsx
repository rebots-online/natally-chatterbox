import React, { useState } from 'react';
import { Sparkles, Calendar, Compass, Shield, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { NumerologyAndThemes } from '../services/astrowisdom';

interface ThemesAndWisdomBoxProps {
  wisdom: NumerologyAndThemes;
  onOpenReading: (type: 'horoscope' | 'synastry' | 'house' | 'planet' | 'aspect') => void;
  onDiscussWithNatally?: (title: string, query: string) => void;
  embedded?: boolean;
}

export const ThemesAndWisdomBox: React.FC<ThemesAndWisdomBoxProps> = ({
  wisdom,
  onOpenReading,
  onDiscussWithNatally,
  embedded = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const content = (
    <div className="space-y-3 font-mono text-xs">
          {/* Life Path Number & Core Polarity */}
          <div
            onClick={() =>
              onDiscussWithNatally?.(
                `Life Path ${wisdom.lifePathNumber}`,
                `Natally, what is the significance of my Life Path Number ${wisdom.lifePathNumber} (${wisdom.lifePathMeaning}) and how does it integrate with my natal geometry?`
              )
            }
            className="p-2.5 rounded-lg bg-[#1c1428] border border-[#322641] hover:border-[#f2ca50]/50 transition-all cursor-pointer group"
            title="Click to converse with Natally about your Life Path Number"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#a99dae] uppercase tracking-wider group-hover:text-[#f2ca50] transition-colors">
                Life Path Number
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-sm text-[#f2ca50] font-bold">
                  {wisdom.lifePathNumber}
                </span>
                <MessageSquare className="w-3 h-3 text-[#f2ca50]/70 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="font-sans text-[11px] text-[#f1e8d8] leading-tight">
              {wisdom.lifePathMeaning}
            </p>
          </div>

          {/* Trinity Badges (Sun, Moon, Rising) */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div
              onClick={() =>
                onDiscussWithNatally?.(
                  `Sun in ${wisdom.sunSign}`,
                  `Natally, tell me about my Sun in ${wisdom.sunSign} ${wisdom.sunSignGlyph}! How does its sovereign life purpose fit with my other placements?`
                )
              }
              className="p-1.5 rounded-lg bg-[#271c36] border border-[#322641] hover:border-[#f2ca50]/50 transition-all cursor-pointer group"
              title="Click to chat about your Sun placement"
            >
              <span className="block text-[#a99dae] group-hover:text-[#f2ca50]">Sun</span>
              <span className="text-[#f2ca50] font-bold text-xs">{wisdom.sunSignGlyph}</span>
              <span className="block truncate text-white/90">{wisdom.sunSign}</span>
            </div>
            <div
              onClick={() =>
                onDiscussWithNatally?.(
                  `Moon in ${wisdom.moonSign}`,
                  `Natally, what does my Moon in ${wisdom.moonSign} ${wisdom.moonSignGlyph} reveal about my emotional sanctuary and inner instinctual needs?`
                )
              }
              className="p-1.5 rounded-lg bg-[#271c36] border border-[#322641] hover:border-[#e2e8f0]/60 transition-all cursor-pointer group"
              title="Click to chat about your Moon placement"
            >
              <span className="block text-[#a99dae] group-hover:text-white">Moon</span>
              <span className="text-[#e2e8f0] font-bold text-xs">{wisdom.moonSignGlyph}</span>
              <span className="block truncate text-white/90">{wisdom.moonSign}</span>
            </div>
            <div
              onClick={() =>
                onDiscussWithNatally?.(
                  `Ascendant in ${wisdom.risingSign}`,
                  `Natally, how does my Rising Sign ${wisdom.risingSign} ${wisdom.risingSignGlyph} shape my persona and outer interface with reality?`
                )
              }
              className="p-1.5 rounded-lg bg-[#271c36] border border-[#322641] hover:border-[#9fb4ff]/60 transition-all cursor-pointer group"
              title="Click to chat about your Ascendant placement"
            >
              <span className="block text-[#a99dae] group-hover:text-[#9fb4ff]">Ascendant</span>
              <span className="text-[#9fb4ff] font-bold text-xs">{wisdom.risingSignGlyph}</span>
              <span className="block truncate text-white/90">{wisdom.risingSign}</span>
            </div>
          </div>

          {/* Major Themes List */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-[10px] text-[#a99dae] uppercase tracking-wider">
                Active Astrological Themes:
              </span>
              <span className="text-[9px] text-[#f2ca50]/80">Tap to discuss</span>
            </div>
            <ul className="space-y-1 font-sans text-[11px] text-[#f1e8d8]">
              {wisdom.majorThemes.map((theme, i) => (
                <li
                  key={i}
                  onClick={() =>
                    onDiscussWithNatally?.(
                      `Theme: ${theme.slice(0, 24)}`,
                      `Natally, can you explain the significance of this theme: "${theme}"? How does it fit into the story of my chart?`
                    )
                  }
                  className="flex items-start justify-between gap-1.5 p-1 rounded hover:bg-[#271c36] transition-colors cursor-pointer group"
                  title="Click to converse with Natally about this theme"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f2ca50] mt-0.5">•</span>
                    <span className="group-hover:text-[#f2ca50] transition-colors">{theme}</span>
                  </div>
                  <MessageSquare className="w-3 h-3 text-[#f2ca50] opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
                </li>
              ))}
            </ul>
          </div>

          {/* Astrological Events of Note */}
          <div className="border-t border-[#322641] pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-[10px] text-[#f2a38c] uppercase tracking-wider font-bold">
                Astrological Events of Note (Current / Impending):
              </span>
              <span className="text-[9px] text-[#f2a38c]/80">Tap event</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {wisdom.astrologicalEventsOfNote.map((ev, i) => (
                <div
                  key={i}
                  onClick={() =>
                    onDiscussWithNatally?.(
                      ev.title,
                      `Natally, what is the astrological significance of "${ev.title}" (${ev.timing})? How do its transits fit into my natal geometry and what should I observe in my daily life?`
                    )
                  }
                  className="p-2 rounded bg-[#1c1428] border border-white/5 hover:border-[#f2a38c]/50 transition-all cursor-pointer group space-y-0.5"
                  title="Click to converse with Natally about this astrological event"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#f2ca50] group-hover:text-[#f2a38c] transition-colors font-semibold flex items-center gap-1">
                      <span>{ev.title}</span>
                      <MessageSquare className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-white/40 text-[9px]">{ev.timing}</span>
                  </div>
                  <p className="font-sans text-[10px] text-[#c4bcd0] leading-snug">
                    {ev.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Traditional Brief Interpretation */}
          <div
            onClick={() =>
              onDiscussWithNatally?.(
                'Synthesis Interpretation',
                `Natally, can you expound on this classical reading for me: "${wisdom.traditionalBriefInterpretation}"? What deeper layers and personal advice do you see in this?`
              )
            }
            className="p-2 rounded-lg bg-[#140c20]/90 border border-[#322641] hover:border-[#d4af37]/50 font-sans text-[11px] text-[#d0c5af] leading-relaxed cursor-pointer group transition-colors"
            title="Click to have Natally expand on this interpretation"
          >
            <p className="italic group-hover:text-white transition-colors">
              &quot;{wisdom.traditionalBriefInterpretation}&quot;
            </p>
          </div>

          {/* Quick Reading Trigger CTA */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                onDiscussWithNatally?.(
                  'Full Chart Stream',
                  `Natally bestie! ✨ Can you do a full stream-of-consciousness breakdown of my entire chart, explaining the significance of how everything fits together?`
                )
              }
              className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#120c1c] font-mono text-[10px] font-bold flex items-center justify-center gap-1 shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 fill-current" />
              <span>Discuss in Chat</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenReading('horoscope')}
              className="py-1.5 px-2 rounded-lg bg-[#271c36] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3" />
              <span>Live Horoscope</span>
            </button>
          </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="celestial-panel rounded-xl p-4 w-full sm:w-80 pointer-events-auto transition-all duration-200">
      <div className="flex items-center justify-between border-b border-[#322641] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#f2ca50]" />
          <h2 className="font-cinzel text-xs text-[#f2ca50] tracking-wider uppercase font-bold">
            Major Themes &amp; Events
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-[#271c36] text-[#a99dae] hover:text-[#f1e8d8] transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      {!isCollapsed && content}
    </div>
  );
};
