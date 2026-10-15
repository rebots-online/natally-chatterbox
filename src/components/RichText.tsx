import React from 'react';

interface RichTextProps {
  content: string;
  onTagClick?: (tag: string) => void;
  className?: string;
  highlightCharIndex?: number | null; // For karaoke word-by-word reading
  isCurrentlySpeaking?: boolean;
}

export const RichText: React.FC<RichTextProps> = ({
  content,
  onTagClick,
  className = '',
  highlightCharIndex = null,
  isCurrentlySpeaking = false,
}) => {
  if (!content) return null;

  // Split into paragraphs / lines
  const lines = content.split('\n');

  let accumulatedCharCount = 0;

  const renderInlineFormatted = (text: string, lineStartCharOffset: number) => {
    const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

    let segOffset = lineStartCharOffset;

    return segments.map((seg, idx) => {
      const currentStart = segOffset;
      segOffset += seg.length;

      if (seg.startsWith('**') && seg.endsWith('**')) {
        const inner = seg.slice(2, -2);
        return (
          <strong key={idx} className="text-[#f2ca50] font-semibold">
            {renderKaraokeWords(inner, currentStart + 2)}
          </strong>
        );
      }
      if (seg.startsWith('*') && seg.endsWith('*') && !seg.startsWith('**')) {
        const inner = seg.slice(1, -1);
        return (
          <em key={idx} className="text-[#e9dfce] italic">
            {renderKaraokeWords(inner, currentStart + 1)}
          </em>
        );
      }

      // Check if text mentions major astrological bodies that can be interactive
      const planetRegex =
        /\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Ascendant|Midheaven|House\s+\d{1,2})\b/gi;

      const subParts = seg.split(planetRegex);
      let subOffset = currentStart;

      return (
        <span key={idx}>
          {subParts.map((sub, sIdx) => {
            const wordStart = subOffset;
            subOffset += sub.length;

            if (/^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Ascendant|Midheaven|House\s+\d{1,2})$/i.test(sub)) {
              const isHighlightWord =
                isCurrentlySpeaking &&
                highlightCharIndex !== null &&
                highlightCharIndex >= wordStart && highlightCharIndex < wordStart + sub.length;

              return (
                <button
                  key={sIdx}
                  type="button"
                  data-karaoke-active={isHighlightWord || undefined}
                  onClick={() => onTagClick && onTagClick(sub)}
                  className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                    isHighlightWord
                      ? 'bg-[#f2ca50] text-[#120c1c] scale-105 shadow-[0_0_12px_rgba(242,202,80,0.8)]'
                      : 'bg-[#2a1b3d] text-[#f2ca50] border border-[#d4af37]/40 hover:bg-[#382650] hover:border-[#f2ca50]'
                  }`}
                  title={`View ${sub} on Astrolabe`}
                >
                  {sub}
                </button>
              );
            }
            return renderKaraokeWords(sub, wordStart);
          })}
        </span>
      );
    });
  };

  // Helper to split text into words and apply karaoke highlighting to the active word
  const renderKaraokeWords = (rawText: string, baseOffset: number) => {
    if (!isCurrentlySpeaking || highlightCharIndex === null) {
      return rawText;
    }

    const words = rawText.split(/(\s+)/);
    let currentPos = baseOffset;

    return words.map((w, wIdx) => {
      const wStart = currentPos;
      currentPos += w.length;

      // Check if highlightCharIndex is within this word (or close proximity)
      const isWordActive =
        highlightCharIndex >= wStart && highlightCharIndex < wStart + w.length;

      if (isWordActive && w.trim().length > 0) {
        return (
          <span
            key={wIdx}
            data-karaoke-active="true"
            className="bg-[#f2ca50]/30 text-[#fff7cc] font-semibold px-0.5 py-0.2 rounded shadow-[0_0_8px_rgba(242,202,80,0.5)] transition-all duration-100"
          >
            {w}
          </span>
        );
      }

      return <span key={wIdx}>{w}</span>;
    });
  };

  const renderedElements: React.ReactNode[] = [];
  let inList = false;
  let currentListItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="my-1.5 space-y-1 pl-2">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineOffset = accumulatedCharCount + line.length - line.trimStart().length;
    accumulatedCharCount += line.length + 1;

    if (!trimmed) {
      flushList();
      return;
    }

    // Heading level 3 or 4: ### or ####
    if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
      flushList();
      const hText = trimmed.replace(/^#+\s*/, '');
      renderedElements.push(
        <h4
          key={`h-${idx}`}
          className="font-cinzel text-xs font-bold text-[#f2ca50] tracking-wide mt-2.5 mb-1 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          <span>{renderInlineFormatted(hText, lineOffset + trimmed.length - hText.length)}</span>
        </h4>
      );
      return;
    }

    // Heading level 1 or 2: # or ##
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      flushList();
      const hText = trimmed.replace(/^#+\s*/, '');
      renderedElements.push(
        <h3
          key={`h-${idx}`}
          className="font-cinzel text-sm font-bold text-[#f2ca50] tracking-wide mt-3 mb-1.5 border-b border-[#d4af37]/20 pb-1"
        >
          {renderInlineFormatted(hText, lineOffset + trimmed.length - hText.length)}
        </h3>
      );
      return;
    }

    // Bullet points: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const itemText = trimmed.slice(2);
      currentListItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-1.5 text-xs text-[#f1e8d8]/90">
          <span className="text-[#d4af37] text-[10px] mt-0.5 leading-none">✦</span>
          <span className="flex-1 leading-relaxed">
            {renderInlineFormatted(itemText, lineOffset + 2)}
          </span>
        </li>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      flushList();
      const quoteText = trimmed.slice(2);
      renderedElements.push(
        <blockquote
          key={`quote-${idx}`}
          className="my-2 pl-3 py-1 border-l-2 border-[#d4af37] bg-[#1d122b]/60 rounded-r-lg text-xs italic text-[#e6d8c3]"
        >
          {renderInlineFormatted(quoteText, lineOffset + 2)}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${idx}`} className="my-1.5 text-xs leading-relaxed text-[#f1e8d8]/90">
        {renderInlineFormatted(trimmed, lineOffset)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-0.5 ${className}`}>{renderedElements}</div>;
};
