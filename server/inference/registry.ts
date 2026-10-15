import { geminiEngine } from './engines/gemini';
import { openRouterEngine } from './engines/openrouter';
import { customOpenAIEngine, veniceEngine } from './engines/openai-compatible';
import { InferenceEngine, InferenceError } from './types';

/**
 * Engine registry, selected by INFERENCE_ENGINE in .env:
 *   gemini            — direct GEMINI_API_KEY access (legacy; TTS always uses this key)
 *   openrouter        — OpenRouter free tier via OPENROUTER_API_KEY (auto-default
 *                       when that key is present)
 *   openai-compatible — any OpenAI-shaped endpoint via CUSTOM_LLM_* (z.ai GLM
 *                       Coding Plan, Ollama, LM Studio, …)
 *   venice            — direct Venice inference via VENICE_API_KEY
 *   venice-admin      — reserved: ADMIN-key provisioning of spend-limited user
 *                       keys (consumptionLimit.usd) on top-up, capped at 40%
 *                       of credit charged (margin rule: every production route
 *                       covers its costs at a 40% spend limit)
 *   openrouter-admin  — reserved: Provisioning API per-user keys spend-limited
 *                       to 40% of top-up, stored in Firebase (same margin rule)
 *   local             — reserved: atomic-chat llama.cpp / wllama3, no spend limit
 *
 * Reserved ids resolve once their engine modules register; until then .env
 * selecting one logs a warning and falls back to an available engine, so a
 * fresh clone with only .env populated never hard-fails on a reserved name.
 */

const engines = new Map<string, InferenceEngine>([
  [geminiEngine.id, geminiEngine],
  [openRouterEngine.id, openRouterEngine],
  [customOpenAIEngine.id, customOpenAIEngine],
  [veniceEngine.id, veniceEngine],
]);

export function registerEngine(engine: InferenceEngine): void {
  engines.set(engine.id, engine);
}

let activeEngine: InferenceEngine | null = null;
let activeReason = '';

/** First available engine, in preference order (free tier before paid). */
function fallbackEngine(): InferenceEngine | null {
  return (
    [openRouterEngine, customOpenAIEngine, veniceEngine, geminiEngine].find((e) => e.available()) ??
    null
  );
}

export function resolveEngine(): InferenceEngine {
  if (activeEngine?.available()) return activeEngine;

  const requested = (process.env.INFERENCE_ENGINE || '').trim().toLowerCase();
  if (requested) {
    const engine = engines.get(requested);
    if (engine?.available()) {
      activeEngine = engine;
      activeReason = `INFERENCE_ENGINE=${requested}`;
    } else if (engine) {
      activeEngine = fallbackEngine();
      activeReason = `INFERENCE_ENGINE=${requested} unavailable (missing env keys); fell back to ${activeEngine?.id ?? 'none'}`;
    } else {
      activeEngine = fallbackEngine();
      activeReason = `INFERENCE_ENGINE=${requested} not registered yet; fell back to ${activeEngine?.id ?? 'none'}`;
    }
  } else {
    activeEngine = fallbackEngine();
    activeReason = `auto: ${activeEngine?.id ?? 'none'}`;
  }

  console.log(`[inference] engine=${activeEngine?.id ?? 'none'} (${activeReason})`);
  if (!activeEngine) {
    throw new InferenceError(
      'No inference engine available — populate OPENROUTER_API_KEY or GEMINI_API_KEY in .env',
      'ENGINE_UNAVAILABLE',
      503,
    );
  }
  return activeEngine;
}

/** Test seam: forget the cached selection (env keys may have been populated). */
export function resetEngineCache(): void {
  activeEngine = null;
  activeReason = '';
}
