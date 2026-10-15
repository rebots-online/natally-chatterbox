import {
  CompletionRequest,
  CompletionResult,
  InferenceEngine,
  InferenceError,
} from '../types';

/**
 * OpenRouter engine (https://openrouter.ai/api/v1) — OpenAI-compatible.
 *
 * Defaults to OpenRouter's free tier (":free" models) so the app runs without
 * billing; OPENROUTER_MODEL overrides the default. Model ids churn frequently
 * on the free tier, so the default is a fallback chain walked on 404s.
 *
 * Future provisioning variant ("openrouter-admin"): a Provisioning API admin
 * key issues per-user project keys with spend limits (40% of top-up), stored
 * on the user's Firebase doc, selected via CompletionRequest.subject. That
 * lands as a sibling engine file; this one stays the free default.
 */

/** Resolved per request so .env changes apply without a restart. */
const openRouterBase = () =>
  (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');

const FREE_MODEL_CHAIN = [
  'nvidia/nemotron-3.5-lightning:free',
  'thinkingmachines/inkling:free',
  'poolside/laguna-s-2.1:free',
];

/** Free-tier slugs churn constantly; when the chain is dead, discover a
 * live ':free' model from the public catalog and try it. */
async function discoverLiveFreeModel(base: string, tried: string[]): Promise<string | null> {
  try {
    const res = await fetch(`${base}/models`);
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: Array<{ id: string; architecture?: { input_modalities?: string[] } }> };
    const textOnly = (payload.data ?? []).filter(
      (m) =>
        m.id.endsWith(':free') &&
        !(m.architecture?.input_modalities ?? ['text']).includes('image'), // text chat first
    );
    const fresh = textOnly.map((m) => m.id).find((id) => !tried.includes(id));
    return fresh ?? null;
  } catch {
    return null;
  }
}

function configuredChain(): string[] {
  const envModel = (process.env.OPENROUTER_MODEL || '').trim();
  // An env-configured model is authoritative: try it first, keep free-tier
  // fallbacks behind it so a delisted free model never takes chat down.
  return envModel ? [envModel, ...FREE_MODEL_CHAIN] : FREE_MODEL_CHAIN;
}

/** Explicit engine-native ids pass through; anything else uses the default. */
function resolveModels(requested: string | undefined): string[] {
  const chain = configuredChain();
  if (requested && requested.includes('/')) return [requested, ...chain];
  return chain;
}

interface OpenRouterChoice {
  message?: { content?: string | null };
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: { total?: number };
  };
  error?: { message?: string; code?: number | string };
}

export const openRouterEngine: InferenceEngine = {
  id: 'openrouter',

  get defaultModel(): string {
    return configuredChain()[0];
  },

  available(): boolean {
    const key = (process.env.OPENROUTER_API_KEY || '').trim();
    return key.length > 0 && !key.includes('YOUR_');
  },

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    if (!openRouterEngine.available()) {
      throw new InferenceError(
        'OPENROUTER_API_KEY not configured',
        'ENGINE_UNAVAILABLE',
        503,
      );
    }

    const messages: Array<Record<string, unknown>> = [];
    if (req.systemInstruction) messages.push({ role: 'system', content: req.systemInstruction });
    for (const turn of req.history ?? []) {
      if (!turn.content?.trim()) continue;
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content.trim(),
      });
    }
    if (req.image?.data && req.image?.mimeType) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: req.prompt || '' },
          { type: 'image_url', image_url: { url: `data:${req.image.mimeType};base64,${req.image.data}` } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: req.prompt || '' });
    }

    const body: Record<string, unknown> = {
      messages,
      temperature: typeof req.temperature === 'number' ? req.temperature : 1.2,
    };
    if (typeof req.topP === 'number') body.top_p = req.topP;
    // topK has no OpenRouter equivalent — intentionally dropped.
    if (typeof req.maxOutputTokens === 'number') body.max_tokens = req.maxOutputTokens;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${(process.env.OPENROUTER_API_KEY || '').trim()}`,
      'Content-Type': 'application/json',
    };
    if (process.env.APP_URL) {
      headers['HTTP-Referer'] = process.env.APP_URL;
      headers['X-Title'] = 'Natally AI Studio';
    }

    const attemptChain = async (models: string[]): Promise<CompletionResult> => {
      let lastError: InferenceError | undefined;
      for (const model of models) {
        if (!model) continue;
        try {
          const res = await fetch(`${openRouterBase()}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, model }),
          });
          const payload = (await res.json().catch(() => ({}))) as OpenRouterResponse;

          if (res.ok) {
            return {
              text: payload.choices?.[0]?.message?.content ?? '',
              model: payload.model || model,
              engine: openRouterEngine.id,
              usage: payload.usage
                ? {
                    promptTokens: payload.usage.prompt_tokens,
                    completionTokens: payload.usage.completion_tokens,
                    totalTokens: payload.usage.total_tokens,
                    costUsd: payload.usage.cost?.total,
                  }
                : undefined,
            };
          }

          const apiMessage = payload.error?.message || `OpenRouter HTTP ${res.status}`;
          if (res.status === 401 || res.status === 403) {
            throw new InferenceError(apiMessage, 'AUTH_FAILED', res.status);
          }
          if (res.status === 402) {
            throw new InferenceError(apiMessage, 'INSUFFICIENT_CREDITS', 402);
          }
          if (res.status === 429) {
            lastError = new InferenceError(apiMessage, 'RATE_LIMITED', 429);
            continue; // free-tier rate cap: the next model in the chain may serve
          }
          if (res.status === 404 || /no allowed providers|not a valid model|unavailable for free/i.test(apiMessage)) {
            lastError = new InferenceError(apiMessage, 'MODEL_NOT_FOUND', 404);
            continue; // model delisted: walk the chain
          }
          lastError = new InferenceError(apiMessage, 'INFERENCE_FAILED', res.status);
          break;
        } catch (err) {
          if (err instanceof InferenceError) {
            if (err.code === 'AUTH_FAILED' || err.code === 'ENGINE_UNAVAILABLE') throw err;
            lastError = err;
            if (err.code !== 'MODEL_NOT_FOUND' && err.code !== 'RATE_LIMITED') break;
            continue;
          }
          lastError = new InferenceError(
            err instanceof Error ? err.message : String(err),
            'INFERENCE_FAILED',
            502,
          );
          break;
        }
      }
      throw lastError ?? new InferenceError('OpenRouter generation failed', 'INFERENCE_FAILED', 502);
    };

    const models = resolveModels(req.model);
    try {
      return await attemptChain(models);
    } catch (err) {
      if (err instanceof InferenceError && err.code === 'MODEL_NOT_FOUND') {
        // Entire chain delisted: discover a live free model and try once more.
        const live = await discoverLiveFreeModel(openRouterBase(), models);
        if (live) {
          console.log(`[openrouter] free chain exhausted; discovered live model ${live}`);
          return await attemptChain([live]);
        }
      }
      throw err;
    }
  },
};
