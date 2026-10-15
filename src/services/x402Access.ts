/**
 * x402-gated guest access — an unauthenticated visitor may proceed only by
 * paying for their own inference (x402 micropayment; Alby marketplace /
 * WebLN rails). Free guest access would spend the baked-in key (operator
 * decree 2026-10-11: "only allow continue without account with x402").
 *
 * Seam shape: a facilitator URL (VITE_X402_FACILITATOR_URL) mints a 402
 * challenge/invoice for the operator's wallet; payment (WebLN when present)
 * returns a short-lived access token stored locally. Until the facilitator
 * is configured, access is honestly refused — never granted for free.
 */

const GUEST_ACCESS_KEY = 'astrosphere_x402_guest_access';
const GUEST_PRICE_SATS = 2000; // ≈ list price per guest session until billing lands

interface WebLNProvider {
  sendPayment(paymentRequest: string): Promise<{ preimage: string }>;
  enable(): Promise<void>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}

export function hasWebLn(): boolean {
  return typeof window !== 'undefined' && typeof window.webln === 'object';
}

export interface GuestAccessResult {
  granted: boolean;
  reason?: string;
}

export async function payForGuestAccess(): Promise<GuestAccessResult> {
  const facilitator = (import.meta.env.VITE_X402_FACILITATOR_URL as string | undefined) || '';
  if (!facilitator) {
    return {
      granted: false,
      reason:
        'x402 facilitator not configured yet — guest pay-per-use launches with the billing pass. ' +
        'Sign in with an account, or ask Robin to add this domain to Firebase authorized domains.',
    };
  }
  if (!hasWebLn()) {
    return {
      granted: false,
      reason: 'No WebLN wallet detected. Install the Alby browser extension, then retry.',
    };
  }
  try {
    const res = await fetch(facilitator.replace(/\/+$/, '') + '/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_sats: GUEST_PRICE_SATS, product: 'natally-guest-session' }),
    });
    if (res.status !== 402 && !res.ok) {
      return { granted: false, reason: `Facilitator error (HTTP ${res.status}).` };
    }
    const challenge = await res.json(); // { payment_request / x402 versioned fields }
    const paymentRequest: string | undefined =
      challenge?.payment_request || challenge?.invoice || challenge?.routes?.[0]?.payment_request;
    if (!paymentRequest) {
      return { granted: false, reason: 'Facilitator returned no payment request.' };
    }
    await window.webln!.enable();
    await window.webln!.sendPayment(paymentRequest);
    // Payment settled: grant a 24h guest session.
    localStorage.setItem(
      GUEST_ACCESS_KEY,
      JSON.stringify({ expires_at: Date.now() + 24 * 3600 * 1000, sats: GUEST_PRICE_SATS }),
    );
    return { granted: true };
  } catch (err) {
    return {
      granted: false,
      reason: err instanceof Error ? err.message : 'x402 payment failed.',
    };
  }
}

export function guestAccessActive(): boolean {
  try {
    const raw = localStorage.getItem(GUEST_ACCESS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { expires_at: number };
    return Date.now() < parsed.expires_at;
  } catch (_) {
    return false;
  }
}

export const GUEST_PRICE_LABEL = `${GUEST_PRICE_SATS} sats`;
