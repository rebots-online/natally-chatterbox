export function keepKaraokeVisible(container: HTMLElement, active: HTMLElement, reducedMotion = false): boolean {
  const viewport = container.getBoundingClientRect();
  const word = active.getBoundingClientRect();
  const height = container.clientHeight;
  if (!height || !word.height) return false;
  const top = viewport.top + container.clientTop;
  const margin = Math.min(24, height * 0.12);
  if (word.top >= top + margin && word.bottom <= top + height - margin) return false;
  const target = Math.max(0, Math.min(container.scrollHeight - height,
    container.scrollTop + word.top - top - height * 0.35));
  if (Math.abs(target - container.scrollTop) < 1) return false;
  container.scrollTo({ top: target, behavior: reducedMotion ? 'instant' : 'smooth' });
  return true;
}
