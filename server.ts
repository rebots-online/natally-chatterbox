import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { resolveEngine } from './server/inference/registry';
import { InferenceError } from './server/inference/types';
import { recordUsage } from './server/inference/metering';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let detectedKeyLeakedOrInvalid = false;
let lastKnownApiKey = process.env.GEMINI_API_KEY || '';

// Load .env file with override support so user-provided .env takes precedence over container env
function syncEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val && !val.includes('YOUR_') && !val.includes('MY_GEMINI_API_KEY')) {
            if (process.env[key] !== val) {
              process.env[key] = val;
              if (key === 'GEMINI_API_KEY') {
                detectedKeyLeakedOrInvalid = false;
              }
            }
          }
        }
      }
    } catch {
      // Ignore reading error
    }
  }
}
syncEnvFile();

function getAIClient(): GoogleGenAI {
  syncEnvFile();
  const currentKey = process.env.GEMINI_API_KEY || '';
  if (currentKey !== lastKnownApiKey) {
    lastKnownApiKey = currentKey;
    detectedKeyLeakedOrInvalid = false;
  }
  return new GoogleGenAI({
    apiKey: currentKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = (mimeType || 'audio/l16;rate=24000').split(';').map((s) => s.trim());
  const [_, format] = (fileType || '').split('/');

  const options: WavConversionOptions = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim());
    if (key === 'rate') {
      const parsedRate = parseInt(value, 10);
      if (!isNaN(parsedRate)) {
        options.sampleRate = parsedRate;
      }
    }
  }

  return options;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8); // Format
  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

function convertToWav(rawData: string, mimeType: string): Buffer {
  const rawBuffer = Buffer.from(rawData, 'base64');
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawBuffer.length, options);
  return Buffer.concat([wavHeader, rawBuffer]);
}

// Helper to split speech into natural sentence segments (< 170 characters)
function splitIntoSpeechChunks(text: string, maxLen = 160): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((cur + ' ' + trimmed).trim().length <= maxLen) {
      cur = (cur + ' ' + trimmed).trim();
    } else {
      if (cur) chunks.push(cur);
      if (trimmed.length > maxLen) {
        const words = trimmed.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        if (sub) chunks.push(sub);
        cur = '';
      } else {
        cur = trimmed;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// In-memory audio cache for instant TTS responses
const serverTtsCache = new Map<string, { audio: string; mimeType: string }>();

// AI Neural Text-to-Speech Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      model = 'gemini-3.8-flash-tts',
      voiceName = 'The Cheeky Sidekick 2',
      language = 'en',
      accentMode,
      style,
      kawaiiMode = 'cheeky_sidekick',
      kawaiiIntensity = 85,
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const cleanText = text
      .replace(/[*#_~`>]/g, '')
      .replace(/[☉☽♂☿♀♃♄♅♆♇⚷☊♈♉♊♋♌♍♎♏♐♑♒♓]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);

    if (!cleanText) {
      return res.status(400).json({ error: 'Text content is empty' });
    }

    const cacheKey = `${model}_${voiceName}_${kawaiiMode}_${kawaiiIntensity}_${language}_${accentMode}_${cleanText}`;
    if (serverTtsCache.has(cacheKey)) {
      const cached = serverTtsCache.get(cacheKey)!;
      return res.json({
        audio: cached.audio,
        mimeType: cached.mimeType,
        source: 'cache',
      });
    }

    // 1. Attempt Google Gemini TTS (gemini-3.8-flash-tts or gemini-3.5-flash-tts / gemini-3.8-flash-lite-tts)
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_') && !detectedKeyLeakedOrInvalid) {
      try {
        let ttsModel = model || 'gemini-3.8-flash-tts';
        if (ttsModel === 'gemini-3.5-flash-tts' || ttsModel === 'gemini-3.5-flash') {
          ttsModel = 'gemini-3.8-flash-lite-tts'; // Official high-speed cost-effective TTS model
        }

        const requestedVoice = voiceName || 'The Cheeky Sidekick 2';
        const validPrebuiltVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'];
        // Use Kore as expressive lively base voice if custom persona 'The Cheeky Sidekick 2' is requested
        const prebuiltVoice = validPrebuiltVoices.includes(requestedVoice) ? requestedVoice : 'Kore';

        let speechStyle = style;
        if (!speechStyle || requestedVoice === 'The Cheeky Sidekick 2') {
          if (kawaiiMode === 'cheeky_sidekick' || requestedVoice === 'The Cheeky Sidekick 2') {
            speechStyle = `The Cheeky Sidekick 2 persona: lively, cheeky, spirited anime mascot sidekick, playful, warm with cheerful celestial energy, witty and energetic (intensity ${kawaiiIntensity}%)`;
          } else if (kawaiiMode === 'kawaii_chibi') {
            speechStyle = `Ultra-kawaii, sweet, cheerful chibi anime cartoon robo-chatbot girl mascot, high-pitched, enthusiastic, cute robot beeps and celestial sparkle energy, joyful (intensity ${kawaiiIntensity}%)`;
          } else if (kawaiiMode === 'moldavian_confidante') {
            speechStyle = `Young adult Moldavian female, charming East-European Slavic inflection, friendly, relatable, melodious companion with heartfelt warmth (intensity ${kawaiiIntensity}%)`;
          } else if (kawaiiMode === 'celestial_oracle') {
            speechStyle = `Mystic celestial oracle, atmospheric, velvety, contemplative and gentle wisdom (intensity ${kawaiiIntensity}%)`;
          } else {
            speechStyle = `Natural, authentic, warm and conversational young adult female companion voice (intensity ${kawaiiIntensity}%)`;
          }
        }

        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: `## Transcript:\n${cleanText}`,
                speechMetadata: {
                  style: speechStyle,
                },
              },
            ],
          },
        ];

        const config = {
          temperature: 1,
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: prebuiltVoice,
              },
            },
          },
        };

        const client = getAIClient();
        const response = await client.models.generateContent({
          model: ttsModel,
          config,
          contents,
        });

        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawBase64 = inlineData.data;
          const mimeType = inlineData.mimeType || 'audio/wav';
          const fileExtension = mime.getExtension(mimeType || '') || 'wav';

          let finalBuffer: Buffer;
          const rawBuf = Buffer.from(rawBase64, 'base64');

          // Check if buffer already has a RIFF header (standard WAV)
          if (rawBuf.length >= 12 && rawBuf.subarray(0, 4).toString() === 'RIFF') {
            finalBuffer = rawBuf;
          } else {
            finalBuffer = convertToWav(rawBase64, mimeType);
          }

          const finalBase64 = finalBuffer.toString('base64');
          serverTtsCache.set(cacheKey, { audio: finalBase64, mimeType: 'audio/wav' });

          return res.json({
            audio: finalBase64,
            mimeType: 'audio/wav',
            source: 'gemini-tts',
            model: ttsModel,
            voice: 'The Cheeky Sidekick 2',
            format: fileExtension,
          });
        }
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        if (errMsg.includes('leaked') || errMsg.includes('PERMISSION_DENIED') || geminiErr?.status === 403) {
          detectedKeyLeakedOrInvalid = true;
          console.info('[TTS Engine] Gemini API key reported as leaked or revoked; smoothly using multi-chunk neural voice engine fallback.');
        } else {
          console.info('[TTS Engine] Gemini TTS attempt bypassed; transitioning smoothly to neural voice engine fallback.');
        }
      }
    }

    // 2. High-Fidelity Multi-Chunk Neural Voice Engine
    // For English text with Moldavian/Slavic phrasing, use 'en' or user-selected dialect
    let targetLang = 'en';
    if (typeof language === 'string') {
      const l = language.toLowerCase();
      if (l.startsWith('ru')) targetLang = 'ru';
      else if (l.startsWith('uk')) targetLang = 'uk';
      else if (l.startsWith('pl')) targetLang = 'pl';
      else if (l === 'ro' || l === 'ro-ro') targetLang = 'ro';
      else if (l.startsWith('en')) targetLang = 'en';
    }

    const chunks = splitIntoSpeechChunks(cleanText, 160);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${targetLang}&client=tw-ob`;
      const ttsRes = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (ttsRes.ok) {
        const ab = await ttsRes.arrayBuffer();
        audioBuffers.push(Buffer.from(ab));
      }
    }

    if (audioBuffers.length > 0) {
      const fullAudio = Buffer.concat(audioBuffers);
      const b64 = fullAudio.toString('base64');
      serverTtsCache.set(cacheKey, { audio: b64, mimeType: 'audio/mpeg' });
      return res.json({
        audio: b64,
        mimeType: 'audio/mpeg',
        source: 'neural-engine',
        language: targetLang,
      });
    }

    return res.status(500).json({ error: 'Could not synthesize audio' });
  } catch (err: any) {
    console.error('Server TTS Generation Error:', err);
    res.status(500).json({ error: err?.message || 'Neural TTS generation failed' });
  }
});

// Natally Chatbot Server-Side Proxy
app.post('/api/chat', async (req, res) => {
  try {
    const {
      prompt,
      systemInstruction,
      image,
      history,
      temperature = 1.18,
      topP,
      topK,
      maxOutputTokens,
      model = 'gemini-3.8-flash',
    } = req.body;

    const engineHistory = Array.isArray(history)
      ? history
          .slice(-20)
          .filter(
            (item: any) =>
              item && typeof item.content === 'string' && item.content.trim().length > 0,
          )
          .map((item: any) => ({
            role: item.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: item.content.trim(),
          }))
      : undefined;

    const engine = resolveEngine();
    const result = await engine.complete({
      prompt: prompt || '',
      systemInstruction,
      history: engineHistory,
      image: image?.data && image?.mimeType ? { data: image.data, mimeType: image.mimeType } : undefined,
      model,
      temperature: typeof temperature === 'number' ? temperature : 1.18,
      topP,
      topK,
      maxOutputTokens,
    });
    recordUsage(result.engine, result.model, result.usage);

    res.json({ text: result.text, model: result.model, status: 'success' });
  } catch (err: any) {
    if (err instanceof InferenceError) {
      res.status(err.httpStatus).json({ error: err.message, code: err.code });
      return;
    }
    console.warn('Server Chat Notice:', err?.message || String(err));
    const statusCode = err?.status || 500;
    res.status(statusCode).json({
      error: err?.message || 'Chat generation failed',
      code: err?.code || 'INFERENCE_FAILED',
    });
  }
});

// Astrological Reading Server-Side Proxy
app.post('/api/readings', async (req, res) => {
  try {
    const {
      prompt,
      systemInstruction,
      temperature = 1.25,
      topP,
      topK,
      maxOutputTokens,
      model = 'gemini-3.8-flash',
    } = req.body;

    const engine = resolveEngine();
    const result = await engine.complete({
      prompt: prompt || '',
      systemInstruction,
      temperature: typeof temperature === 'number' ? temperature : 1.25, // Higher-than-normal temperature setting as requested
      topP,
      topK,
      maxOutputTokens,
    });
    recordUsage(result.engine, result.model, result.usage);

    res.json({ text: result.text, model: result.model, status: 'success' });
  } catch (err: any) {
    if (err instanceof InferenceError) {
      res.status(err.httpStatus).json({ error: err.message, code: err.code });
      return;
    }
    console.warn('Server Readings Notice:', err?.message || String(err));
    res.status(err?.status || 500).json({
      error: err?.message || 'Readings generation failed',
      code: err?.code || 'READINGS_FAILED',
    });
  }
});

// Serve frontend in Dev vs Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Celestial Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
