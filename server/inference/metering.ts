import type { UsageReport } from './types';

/**
 * Single usage choke point for every engine. Today: dev logging only.
 *
 * The modular billing step replaces this body with the top-up ledger
 * (Alby marketplace primary; x402 and WebLN as general rails) while keeping
 * this signature stable, so no engine or route changes when it lands.
 * Local-inference engines simply never call this with a cost.
 */
export function recordUsage(
  engine: string,
  model: string,
  usage: UsageReport | undefined,
  subject?: string,
): void {
  if (!usage) return;
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[metering] engine=${engine} model=${model}${subject ? ` subject=${subject}` : ''}` +
        ` tokens=${usage.totalTokens ?? 'n/a'}${usage.costUsd != null ? ` cost=$${usage.costUsd.toFixed(6)}` : ''}`,
    );
  }
}
