import { GoogleGenAI } from '@google/genai';
import {
  CompletionRequest,
  CompletionResult,
  InferenceEngine,
  InferenceError,
} from '../types';

/**
 * Legacy engine: direct Gemini access via GEMINI_API_KEY. Kept byte-compatible
 * with the original proxy behavior (contents sanitization, leaked-key flag).
 */

let detectedKeyLeakedOrInvalid = false;
let lastKnownApiKey = process.env.GEMINI_API_KEY || '';

export function resetGeminiKeyHealthIfRotated(): void {
  if ((process.env.GEMINI_API_KEY || '') !== lastKnownApiKey) {
    lastKnownApiKey = process.env.GEMINI_API_KEY || '';
    detectedKeyLeakedOrInvalid = false;
  }
}

export function geminiKeyUnhealthy(): boolean {
  return detectedKeyLeakedOrInvalid;
}

function client(): GoogleGenAI {
  resetGeminiKeyHealthIfRotated();
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export const geminiEngine: InferenceEngine = {
  id: 'gemini',
  defaultModel: 'gemini-3.8-flash',

  available(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    try {
      const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
      for (const turn of req.history ?? []) {
        if (!turn.content?.trim()) continue;
        contents.push({ role: turn.role === 'user' ? 'user' : 'model', parts: [{ text: turn.content.trim() }] });
      }
      const currentParts: any[] = [{ text: req.prompt || '' }];
      if (req.image?.data && req.image?.mimeType) {
        currentParts.push({ inlineData: { data: req.image.data, mimeType: req.image.mimeType } });
      }
      contents.push({ role: 'user', parts: currentParts });

      // Gemini requires: first turn 'user', no consecutive same-role turns.
      const sanitized: typeof contents = [];
      for (const turn of contents) {
        if (sanitized.length === 0) {
          if (turn.role !== 'user') continue;
          sanitized.push(turn);
        } else {
          const last = sanitized[sanitized.length - 1];
          if (last.role === turn.role) last.parts.push(...turn.parts);
          else sanitized.push(turn);
        }
      }
      if (sanitized.length === 0) sanitized.push({ role: 'user', parts: currentParts });

      const config: any = {
        systemInstruction: req.systemInstruction || undefined,
        temperature: typeof req.temperature === 'number' ? req.temperature : 1.2,
      };
      if (typeof req.topP === 'number') config.topP = req.topP;
      if (typeof req.topK === 'number') config.topK = req.topK;
      if (typeof req.maxOutputTokens === 'number') config.maxOutputTokens = req.maxOutputTokens;

      const model = req.model && /^[a-z0-9.-]+$/i.test(req.model) ? req.model : geminiEngine.defaultModel;
      const response = await client().models.generateContent({ model, contents: sanitized, config });
      return { text: response.text || '', model, engine: geminiEngine.id };
    } catch (err: any) {
      const message = err?.message || String(err);
      if (message.includes('leaked') || message.includes('PERMISSION_DENIED') || err?.status === 403) {
        detectedKeyLeakedOrInvalid = true;
        throw new InferenceError(
          'Gemini API authentication failed (Key invalid or permission denied).',
          'AUTH_FAILED',
          403,
        );
      }
      throw new InferenceError(
        message || 'Gemini generation failed',
        err?.status === 404 ? 'MODEL_NOT_FOUND' : 'INFERENCE_FAILED',
        err?.status || (message.includes('404') ? 404 : 500),
      );
    }
  },
};
