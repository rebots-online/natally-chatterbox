import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, RotateCcw, Minus, Plus } from 'lucide-react';

interface DraggableCardProps {
  id: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultWidth?: number;
  minWidth?: number;
  minHeight?: number;
  maxHeight?: string | number;
  className?: string;
  extraHeaderControls?: React.ReactNode;
  allowCollapse?: boolean;
  defaultZIndex?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  resetTrigger?: number;
}

// Shared z-index sequencer so whichever card is clicked or dragged is immediately on top
let globalHighestZIndex = 50;
export function getNextCardZIndex() {
  globalHighestZIndex += 1;
  return globalHighestZIndex;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  title,
  icon,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultWidth = 320,
  minWidth = 260,
  minHeight = 120,
  maxHeight,
  className = '',
  extraHeaderControls,
  allowCollapse = true,
  defaultZIndex = 25,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
  resetTrigger,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(`astrosphere_card_pos_${id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return defaultPosition;
  });

  const [size, setSize] = useState<{ width: number; height?: number }>(() => {
    try {
      const saved = localStorage.getItem(`astrosphere_card_size_${id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { width: defaultWidth };
  });

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;
    if (onToggleCollapse) {
      onToggleCollapse(next);
    } else {
      setInternalCollapsed(next);
    }
  }, [collapsed, onToggleCollapse]);

  const [zIndex, setZIndex] = useState(defaultZIndex);

  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: defaultWidth,
    height: 300,
  });

  // Save pos and size
  useEffect(() => {
    try {
      localStorage.setItem(`astrosphere_card_pos_${id}`, JSON.stringify(position));
    } catch (_) {}
  }, [id, position]);

  useEffect(() => {
    try {
      localStorage.setItem(`astrosphere_card_size_${id}`, JSON.stringify(size));
    } catch (_) {}
  }, [id, size]);

  // Handle external reset trigger (e.g. "Reset Perspective & Placements" or submit)
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setPosition(defaultPosition);
      setSize({ width: defaultWidth });
    }
  }, [resetTrigger, defaultPosition, defaultWidth]);

  // Bring card to front whenever touched or clicked
  const bringToFront = useCallback(() => {
    setZIndex(getNextCardZIndex());
  }, []);

  // Viewport clamping helper
  const clampPos = useCallback((newX: number, newY: number) => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: Math.max(-winW + 120, Math.min(winW - 120, newX)),
      y: Math.max(-winH + 120, Math.min(winH - 80, newY)),
    };
  }, []);

  // Drag handlers - can be initiated by clicking & dragging ANYWHERE on the card
  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth <= 767) return;
    // Only drag on primary left click
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    // Do not initiate drag if clicking interactive form controls, links, or resize grip
    if (
      target.closest(
        'button, input, select, textarea, a, [role="button"], [data-no-drag], .no-drag, [data-resize-grip]'
      )
    ) {
      bringToFront();
      return;
    }

    // Stop native text selection so mouse drag works smoothly anywhere on the card
    e.preventDefault();
    bringToFront();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const clamped = clampPos(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy);
      setPosition(clamped);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag support from anywhere on card
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth <= 767 || !(e.target as HTMLElement).closest('[data-card-header]')) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'button, input, select, textarea, a, [role="button"], [data-no-drag], .no-drag, [data-resize-grip]'
      )
    ) {
      bringToFront();
      return;
    }
    const touch = e.touches[0];
    bringToFront();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const t = moveEvent.touches[0];
      const dx = t.clientX - dragStartRef.current.x;
      const dy = t.clientY - dragStartRef.current.y;
      const clamped = clampPos(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy);
      setPosition(clamped);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Resize handler via corner grip
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    bringToFront();

    isResizingRef.current = true;
    const currentRect = cardRef.current?.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: currentRect ? currentRect.width : size.width,
      height: currentRect ? currentRect.height : (size.height || 300),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(minWidth, Math.min(800, resizeStartRef.current.width + dx));
      const newHeight = Math.max(minHeight, Math.min(900, resizeStartRef.current.height + dy));

      setSize({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(defaultPosition);
    setSize({ width: defaultWidth });
  };

  const resolvedMaxHeight = maxHeight || 'calc(100vh - 180px)';

  return (
    <div
      ref={cardRef}
      data-collapsed={collapsed}
      onMouseDown={handleDragMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: `${size.width}px`,
        height: collapsed ? 'auto' : (size.height ? `${size.height}px` : 'auto'),
        maxHeight: collapsed ? 'auto' : resolvedMaxHeight,
        zIndex,
      }}
      className={`natally-info-card celestial-panel rounded-xl shadow-2xl transition-shadow flex flex-col pointer-events-auto relative group cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {/* Draggable Header Bar (Rolls up like a shade to just this bar) */}
      <div
        data-card-header
        onClick={(e) => {
          if (collapsed && !(e.target as HTMLElement).closest('button')) {
            toggleCollapse();
          }
        }}
        className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
          collapsed ? 'border-transparent' : 'border-[#322641]/80'
        } cursor-grab active:cursor-grabbing select-none bg-gradient-to-r from-white/[0.04] to-transparent rounded-t-xl ${
          collapsed ? 'rounded-b-xl' : ''
        }`}
        title={collapsed ? 'Click to unroll like a shade / drag to move' : 'Click and drag anywhere to move card'}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors shrink-0" />
          {icon && <span className="text-[#f2ca50] shrink-0">{icon}</span>}
          <div className="font-cinzel text-xs font-semibold text-[#f2ca50] tracking-wide truncate">
            {title}
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {extraHeaderControls}

          {/* Reset position button */}
          {(position.x !== defaultPosition.x || position.y !== defaultPosition.y) && (
            <button
              type="button"
              onClick={handleResetPosition}
              className="p-1 rounded text-[#a99dae] hover:text-[#f2ca50] hover:bg-white/5 transition-colors cursor-pointer"
              title="Snap back to default position"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Collapse / Roll up toggle */}
          {allowCollapse && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 rounded text-[#a99dae] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={collapsed ? 'Unroll like a shade (expand)' : 'Roll up like a shade (collapse)'}
            >
              {collapsed ? <Plus className="w-3.5 h-3.5 text-[#f2ca50]" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Card Content Body (Hidden when rolled up like a shade; never overflows screen bottom when expanded) */}
      {!collapsed && (
        <div
          style={{
            maxHeight: typeof resolvedMaxHeight === 'string' ? `calc(${resolvedMaxHeight} - 50px)` : undefined,
          }}
          className="natally-info-content min-h-0 flex-1 overflow-y-auto p-3.5 text-xs"
        >
          {children}
        </div>
      )}

      {/* Corner Resize Grip (Bottom Right) */}
      {!collapsed && (
        <div
          data-resize-grip="true"
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-30 select-none group/resize"
          title="Drag corner to resize card"
        >
          <svg
            viewBox="0 0 10 10"
            className="w-2.5 h-2.5 text-[#d4af37]/40 group-hover/resize:text-[#d4af37] transition-colors pointer-events-none"
          >
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
