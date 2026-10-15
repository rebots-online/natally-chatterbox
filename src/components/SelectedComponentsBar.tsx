import React from 'react';
import { Sparkles, X, Compass, Zap, BookOpen } from 'lucide-react';

interface SelectedComponentsBarProps {
  selectedComponents: string[];
  onRemoveComponent: (id: string) => void;
  onClearAll: () => void;
  onBeginIntuitiveReading: (components: string[]) => void;
  isGeneratingReading?: boolean;
}

export const SelectedComponentsBar: React.FC<SelectedComponentsBarProps> = ({
  selectedComponents,
  onRemoveComponent,
  onClearAll,
  onBeginIntuitiveReading,
  isGeneratingReading = false,
}) => {
  if (selectedComponents.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw] sm:max-w-xl animate-fade-in">
      <div className="celestial-panel px-4 py-3 rounded-2xl border border-[#d4af37]/60 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-center gap-3 bg-[#1d112d]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <span className="font-mono text-[10px] text-[#d4af37] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#f2ca50] animate-pulse" />
            <span>Selected ({selectedComponents.length}):</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedComponents.map((comp) => (
              <span
                key={comp}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2e1d44] border border-[#f2ca50]/40 text-[#f1e8d8] text-xs font-mono font-medium shadow-sm"
              >
                <span>{comp}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveComponent(comp);
                  }}
                  className="hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10px] font-mono text-[#a99dae] hover:text-white px-2 py-1 transition-colors cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => onBeginIntuitiveReading(selectedComponents)}
            disabled={isGeneratingReading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#f2a38c] text-[#120c1c] font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>
              {isGeneratingReading
                ? 'Synthesizing...'
                : `Begin Intuitive Reading (${selectedComponents.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
