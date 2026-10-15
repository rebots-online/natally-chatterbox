/**
 * Inference engine seam for the hosted-LLM proxy routes.
 *
 * Deliberate extension points (next steps land here without touching routes):
 *  - `CompletionRequest.subject` — authenticated user id. Billing pass-through
 *    routes per-user provisioned keys (Venice ADMIN `consumptionLimit.usd`,
 *    OpenRouter provisioning API spend limits) off this field; today it is
 *    optional and unused.
 *  - `UsageReport` — every engine that can reports tokens/cost; `metering.ts`
 *    is the single choke point where a top-up ledger (Alby marketplace /
 *    x402 / WebLN rails) subscribes later.
 *  - Local inference (atomic-chat llama.cpp / wllama3) registers as just
 *    another engine with `available() === true` offline and no metering.
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionImage {
  data: string;
  mimeType: string;
}

export interface CompletionRequest {
  prompt: string;
  systemInstruction?: string;
  /** Alternating prior turns; engines sanitize/skip as their API requires. */
  history?: readonly ChatTurn[];
  /** Multimodal attachment for the current prompt, if the engine supports it. */
  image?: CompletionImage;
  /** Engine-specific model id; engines substitute their default when unset. */
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  /** Authenticated user id (billing seam — unused until provisioning lands). */
  subject?: string;
}

export interface UsageReport {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** Total cost in USD for this completion, when the provider reports it. */
  costUsd?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  engine: string;
  usage?: UsageReport;
}

export type InferenceErrorCode =
  | 'ENGINE_UNAVAILABLE'
  | 'AUTH_FAILED'
  | 'INSUFFICIENT_CREDITS'
  | 'RATE_LIMITED'
  | 'MODEL_NOT_FOUND'
  | 'INFERENCE_FAILED';

export class InferenceError extends Error {
  readonly code: InferenceErrorCode;
  readonly httpStatus: number;

  constructor(message: string, code: InferenceErrorCode = 'INFERENCE_FAILED', httpStatus = 500) {
    super(message);
    this.name = 'InferenceError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface InferenceEngine {
  readonly id: string;
  /** Model used when the request does not name a valid engine-native model. */
  readonly defaultModel: string;
  /** False when the engine's required env configuration is absent. */
  available(): boolean;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
