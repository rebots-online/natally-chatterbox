export interface ViewportBounds {
  width: number;
  height: number;
  left: number;
  top: number;
  layoutWidth: number;
}

export function getChatViewportLayout(
  bounds: ViewportBounds,
  position: { x: number; y: number },
  size: { width: number; height: number },
  expanded: boolean,
) {
  const mobile = bounds.layoutWidth <= 767;
  const inset = Math.min(mobile ? 8 : 12, bounds.width / 4, bounds.height / 4);
  const availableWidth = Math.max(0, bounds.width - inset * 2);
  const availableHeight = Math.max(0, bounds.height - inset * 2);
  const width = mobile || expanded ? availableWidth
    : Math.min(availableWidth, Number.isFinite(size.width) && size.width > 0 ? size.width : 460);
  const height = mobile || expanded ? availableHeight
    : Math.min(availableHeight, Number.isFinite(size.height) && size.height > 0 ? size.height : 600);
  const minLeft = bounds.left + inset;
  const minTop = bounds.top + inset;
  const left = mobile || expanded ? minLeft
    : Math.max(minLeft, Math.min(bounds.left + bounds.width - inset - width,
      Number.isFinite(position?.x) ? position.x : minLeft));
  const top = mobile || expanded ? minTop
    : Math.max(minTop, Math.min(bounds.top + bounds.height - inset - height,
      Number.isFinite(position?.y) ? position.y : minTop));
  return { left, top, width, height, mobile, compact: bounds.height < 500 };
}
