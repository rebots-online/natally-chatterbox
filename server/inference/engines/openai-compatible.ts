import {
  CompletionRequest,
  CompletionResult,
  InferenceEngine,
  InferenceError,
} from '../types';

/**
 * Generic OpenAI-compatible engine — any endpoint speaking
 * POST {base}/chat/completions with Bearer auth. Covers:
 *   - z.ai GLM Coding Plan (e.g. https://api.z.ai/api/coding/paas/v4, glm-5.3-flash)
 *   - Ollama (http://localhost:11434/v1 — API key optional)
 *   - Venice direct inference (VENICE_BASE_URL + VENICE_API_KEY)
 *   - any other OpenAI-shaped provider
 *
 * Instances are configured by the factory below; models fall back along a
 * chain (comma-separated env) the same way the OpenRouter engine does.
 */

export interface OpenAICompatibleConfig {
  id: string;
  /** Human label for logs/errors. */
  label: string;
  baseUrl: () => string;
  apiKey: () => string;
  /** Candidate default models, best first; walked on 404/429. */
  defaultModels: () => string[];
  /** Extra headers (provider attribution etc.), merged per request. */
  extraHeaders?: () => Record<string, string>;
}

interface OpenAIChoice {
  message?: { content?: string | null };
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string } | string;
}

function errorMessage(payload: OpenAIResponse, status: number): string {
  if (typeof payload.error === 'string') return payload.error;
  return payload.error?.message || `OpenAI-compatible endpoint HTTP ${status}`;
}

export function makeOpenAICompatibleEngine(config: OpenAICompatibleConfig): InferenceEngine {
  return {
    id: config.id,
    get defaultModel(): string {
      return config.defaultModels()[0] ?? '';
    },

    available(): boolean {
      // Base URL is the only hard requirement (Ollama needs no key).
      return config.baseUrl().trim().length > 0;
    },

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const base = config.baseUrl().trim().replace(/\/+$/, '');
      if (!base) {
        throw new InferenceError(
          `${config.label} base URL not configured`,
          'ENGINE_UNAVAILABLE',
          503,
        );
      }
      const key = config.apiKey().trim();

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
      if (typeof req.maxOutputTokens === 'number') body.max_tokens = req.maxOutputTokens;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (key) headers.Authorization = `Bearer ${key}`;
      Object.assign(headers, config.extraHeaders?.() ?? {});

      // Explicit engine-native model (contains '/') passes through first.
      const chain = req.model && req.model.includes('/')
        ? [req.model, ...config.defaultModels()]
        : config.defaultModels();
      let lastError: InferenceError | undefined;

      for (const model of chain) {
        if (!model) continue;
        try {
          const res = await fetch(`${base}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, model }),
          });
          const payload = (await res.json().catch(() => ({}))) as OpenAIResponse;

          if (res.ok) {
            return {
              text: payload.choices?.[0]?.message?.content ?? '',
              model: payload.model || model,
              engine: config.id,
              usage: payload.usage
                ? {
                    promptTokens: payload.usage.prompt_tokens,
                    completionTokens: payload.usage.completion_tokens,
                    totalTokens: payload.usage.total_tokens,
                  }
                : undefined,
            };
          }

          const apiMessage = errorMessage(payload, res.status);
          if (res.status === 401 || res.status === 403) {
            throw new InferenceError(apiMessage, 'AUTH_FAILED', res.status);
          }
          if (res.status === 429) {
            lastError = new InferenceError(apiMessage, 'RATE_LIMITED', 429);
            continue;
          }
          if (res.status === 404) {
            lastError = new InferenceError(apiMessage, 'MODEL_NOT_FOUND', 404);
            continue;
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

      throw lastError ?? new InferenceError(`${config.label} generation failed`, 'INFERENCE_FAILED', 502);
    },
  };
}

/** CUSTOM_LLM_*: any OpenAI-compatible endpoint (z.ai, Ollama, LM Studio…). */
export const customOpenAIEngine = makeOpenAICompatibleEngine({
  id: 'openai-compatible',
  label: 'Custom OpenAI-compatible endpoint',
  baseUrl: () => process.env.CUSTOM_LLM_BASE_URL || '',
  apiKey: () => process.env.CUSTOM_LLM_API_KEY || '',
  defaultModels: () => {
    const chain = (process.env.CUSTOM_LLM_MODELS || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const single = (process.env.CUSTOM_LLM_MODEL || '').trim();
    if (single) chain.unshift(single);
    return chain;
  },
});

/** VENICE_*: direct Venice inference (OpenAI-compatible). The admin-key
 * provisioning variant (spend-limited user keys on top-up) stays reserved as
 * `venice-admin`. */
export const veniceEngine = makeOpenAICompatibleEngine({
  id: 'venice',
  label: 'Venice.ai',
  baseUrl: () => process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
  apiKey: () => process.env.VENICE_API_KEY || '',
  defaultModels: () => {
    const single = (process.env.VENICE_MODEL || '').trim();
    // venice/uncensored was renamed; catalog also hosts z-ai-glm-5-3-flash etc.
    return single ? [single] : ['venice-uncensored-1-2'];
  },
});
