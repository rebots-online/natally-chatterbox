import { NatalChartResult } from './ephemeris';
import { buildCurrentSkyContext, resolveObservationMoment } from './transits';
import { buildChartPresentationPrompt, buildSynastryContext, parseNatallyResponse, type ChartCue } from './natallyChat';
import { createCalculationSession } from './calculationTools';

export interface ReadingRequest {
  isCurrentSession?: () => boolean;
  type: 'horoscope' | 'synastry' | 'house' | 'planet' | 'aspect' | 'full_natal';
  targetKey?: string; // e.g. "House 8", "Mars", "Saturn ☍ Jupiter"
  chart: NatalChartResult;
  partnerChart?: NatalChartResult | null;
  length?: 'short' | 'thorough' | 'exhaustive';
  userLore?: string[];
  transitDate?: string;
  transitTime?: string;
  transitPlace?: string;
  transitTimezoneOffset?: number;
}

export interface ReadingResponse {
  title: string;
  subtitle: string;
  content: string;
  chartCues?: ChartCue[];
  chartFocusKey?: string;
  generatedAt: string;
}

// Higher-than-normal temperature setting (1.25) for intuitive latitude
export async function generateAstrologicalReading(req: ReadingRequest): Promise<ReadingResponse> {
  if (req.type === 'synastry' && !req.partnerChart) throw new Error('Add the other person’s birth details to calculate synastry.');
  const partnerSummary = req.type === 'synastry' ? buildSynastryContext(req.chart, req.partnerChart) : 'None';

  const now = resolveObservationMoment(req.transitDate, req.transitTime, req.transitTimezoneOffset);
  const transitDateStr = req.transitDate || now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const transitTimeStr = req.transitTime || now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const observationLocation = req.transitPlace || req.chart.input.currentLocationName || 'Current location not supplied';
  const currentSky = req.type === 'horoscope' || req.type === 'full_natal'
    ? await buildCurrentSkyContext({ ...req.chart, input: { ...req.chart.input, currentLocationName: observationLocation,
        currentTimezoneId: req.transitDate ? Intl.DateTimeFormat().resolvedOptions().timeZone : req.chart.input.currentTimezoneId } }, now)
    : '';

  const prompt = `
You are Natally, a relatable, approachable, slightly lonely cartoon robo-psychic companion.
You are not a cold, clinical mechanical turk fortune-teller. Conversation is the main mode of communication.
Provide an intuitive astrological reading for the following request:
- Reading Type: ${req.type}
- Observation Timestamp (Current Sky): ${transitDateStr} at ${transitTimeStr}
- Observation Location: ${observationLocation}
- Target: ${req.targetKey || 'General'}
- Native Name: ${req.chart.input.name}
- Native Sun: ${req.chart.sunFormatted}
- Native Moon: ${req.chart.moonFormatted}
- Native Ascendant: ${req.chart.ascFormatted}
- Native Midheaven: ${req.chart.mcFormatted}
- Key Placements: ${req.chart.natalBodies.map((b) => `${b.glyph} ${b.name} at ${b.fullDegText} in House ${b.house}`).join(', ')}
- Aspect Chords: ${req.chart.aspectChords.map((a) => a.name).join(', ')}
- Partner Data (if synastry): ${partnerSummary}
- Desired Length: ${req.length || 'thorough'}
- User Lore / Background notes: ${req.userLore?.join('; ') || 'None'}

${currentSky}

Formatting & Tone Instructions:
1. Always state the observation parameters (Date, Time, Place of transit observation).
2. Explain the natal foundations first, then today's calculated transits when supplied. Never describe a natal aspect as a current transit. Do not invent current sky positions or exact future timings.
3. Deliver the reading as Natally: stream-of-consciousness, intimate, warm, with occasional vulnerable overshares about your past as a lonely coin-operated fortune-teller booth or quirky memories from celestial calibration camp.
4. End with an open-ended conversational question asking how the native feels this in their lived reality, inviting them to dialogue with you in this single-source conversation stream.
`.trim();

  const { requestHostedInference } = await import('./hostedInference');
  const calculations = createCalculationSession(req.chart, req.partnerChart);
  const result = await requestHostedInference({
    prompt,
    systemInstruction: 'You are Natally. Ground interpretations only in calculated facts. Use calculate_astrology for extra dates/charts/comparisons when needed. Never invent birth details or transit positions. ' + calculations.context() + '\n\n' + buildChartPresentationPrompt(req.chart),
  }, calculations.execute, req.isCurrentSession);
  const parsed = parseNatallyResponse(result.text, req.chart);
  return {
    title: req.type.toUpperCase() + ': ' + (req.targetKey || req.chart.input.name),
    subtitle: req.chart.sunFormatted,
    content: parsed.text,
    chartCues: parsed.chartCues,
    chartFocusKey: parsed.chartFocusKey,
    generatedAt: new Date().toISOString(),
  };
}
