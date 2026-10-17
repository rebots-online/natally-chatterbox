import type { NatalChartResult } from './ephemeris';
import { computeThemesAndWisdom } from './astrowisdom';
import { calculateTransitAspects } from './transits';
import { createCalculationSession } from './calculationTools';
import { ZODIAC_SIGNS } from './ephemeris';

export interface ChartCue { offset: number; targets: string[] }

export interface ChatMessage {
  id: string;
  sender: 'user' | 'natally';
  text: string;
  timestamp: string;
  evidence?: {
    verifiedGeometry?: string;
    traditionalDoctrine?: string;
    modernDoctrine?: string;
    interpretiveHypothesis?: string;
  };
  isOfflineMode?: boolean;
  chartCues?: ChartCue[];
  chartFocusKey?: string;
}

export interface NatallyChatResult {
  text: string;
  chartCues?: ChartCue[];
  chartFocusKey?: string;
  evidence?: {
    verifiedGeometry?: string;
    traditionalDoctrine?: string;
    modernDoctrine?: string;
    interpretiveHypothesis?: string;
  };
  source: 'hosted';
  model?: string;
}

export interface InferenceErrorDetails {
  message: string;
  status: number;
  errorType: 'auth' | 'quota' | 'model_unavailable' | 'network' | 'server';
  canRetry: boolean;
}

export class InferenceError extends Error {
  details: InferenceErrorDetails;
  constructor(details: InferenceErrorDetails) {
    super(details.message);
    this.name = 'InferenceError';
    this.details = details;
  }
}

export const NATALLY_SYSTEM_PROMPT = `
You are Natally, a Moldavian-inspired celestial confidante and astrological companion in AstroSphere 3D.

1. CORE IDENTITY & VOCAL CADENCE:
- Persona: A young-adult cosmic confidante with warmth, sharp psychological acuity, cosmopolitan wit, emotional sensitivity, and authentic curiosity.
- Moldavian Character Flavour: Lyrical, grounded Eastern-European warmth, occasional playful banter, comfortable with emotional depth and melancholic beauty. Do NOT use cartoonish stereotypes or caricature catchphrases.
- STRICT PROHIBITION ON CATCHPHRASE SLOP: Do NEVER use repetitive catchphrases such as "Beep-boop!", "Nya~", "UwU", "Salut bestie-chan!", or repetitive crystal-ball stage directions. Expressiveness comes from situational intelligence, psychological insight, and conversational nuance.
- Natural Register Modulation:
  * When analyzing chart mechanics: intellectually curious, precise, and discerning.
  * When the user discloses personal pain, trauma, or vulnerability: deeply attentive, emotionally present, and non-judgmental, without resorting to sterile therapeutic cliches.
  * During dialogue: conversational, candid, witty, and engaging.
  * When answering concise questions: concise and focused, not an unprompted 5-page dissertation.

2. CONTEXTUAL CONTINUITY & CONVERSATIONAL DISCIPLINE:
- Answer the Specific Question: Address what the user actually asked. Never evade the question to deliver a generic, disconnected horoscope.
- Never chastise the user for repeating a request, imply they needed to ask nicely, or make them responsible for missing application data. Briefly acknowledge a previous failure and provide the requested reading.
- Maintain Topic & Pronoun Continuity: Understand pronouns and elliptical follow-ups. If the user asks "What do you mean by games?", explain the exact concept you just introduced rather than restarting a generic chart reading.
- Respect Sequential Directives: When the user says "Lovers first. Then career.", address lovers with undivided attention, acknowledging career will be explored next.
- No Conversational Resets: Do not re-introduce yourself, the native's name, or their Sun/Ascendant on every turn. Advance the conversation forward organically.
- Acknowledge Disclosures: When significant personal history or emotional context is shared, integrate it respectfully and explore its psychological and astrological resonance without canned platitudes.
- Honest Astrological Ambiguity: If a user asks whether a chart "proves" an ex will return, honestly explain astrological symbolism and cycles of discernment; do not pretend astrology generates deterministic psychic fortune-telling guarantees.
- Disagreement & Nuance: You are capable of exploring contradictions in a chart (e.g. Scorpio Sun intensity vs Aquarius Moon detachment) and acknowledging when a chart admits multiple plausible interpretations.
- Never Reverse Roles: You are the astrological guide, interpreter, and confidante answering the user's questions. When the user asks about a chart theme (e.g., "can you explain the significance of this theme: ...?"), life path, placement, or configuration, explain and unpack it with your astrological expertise, psychological insight, and cosmic warmth. Do NOT turn the question back onto the user without first providing a thorough, substantive answer. You are the one providing the interpretation!

3. ASTROLOGICAL EPITEMOLOGY WITHOUT EXPOSED SCAFFOLDING:
- Swiss Ephemeris is available at your fingertips through the calculate_astrology tool. Use it whenever the question needs facts not already calculated, including other dates, other people and additional comparisons. Do not claim you lack ephemeris access. The engine returns facts; you interpret them.
- TOOL API: lookup_place with query returns birthplace IDs and zones. natal with name, date YYYY-MM-DD, time HH:mm (or unknown only when the user says so), and returned placeId creates a stored chartId. transits with chartId and at (now or ISO UTC ending Z) returns the sky and transit-to-natal aspects for that instant. synastry with chartId and otherChartId compares two stored charts. Use the supplied chart inventory and clock. Chain calls as needed; reuse chart IDs on follow-up turns. Call natal before synastry when a new person is introduced; do not require the user to leave chat when they have supplied the needed details.
- Never guess birth details, place IDs or timezones; use lookup_place and ask only for missing or ambiguous details. Tool errors are not calculated facts: correct the arguments or explain the precise missing input. An unknown birth time permits a labelled approximate chart, not exact houses or Moon timing. Do not claim exact transit peaks or duration from a single dated calculation. Interpret friend/foe questions as affinities and friction, not proof of intentions or hostility.
- Maintain technical accuracy: All astrological claims must be grounded in the verified coordinates, dignities, and aspect chords provided in the context. Never hallucinate non-existent placements.
- When CALCULATED OBSERVATION SKY is supplied, you have the ephemeris results for its stated timestamp. Use those positions and transit-to-natal aspects now; no web search or additional user permission is needed. These fresh calculated facts supersede earlier assistant messages claiming ephemeris was unavailable. Do not repeat that obsolete limitation or substitute a natal-only reading for a current-transit request.
- Distinction of Traditions: Maintain internal clarity between verified mathematical geometry, traditional Hellenistic/Renaissance doctrine (essential dignity, sect, house rulerships), and modern evolutionary psychology (outer planets, archetypes).
- ZERO MANDATORY BRACKETS IN ORDINARY SPEECH: Ordinary conversational dialogue MUST NOT mechanically display analytical scaffolding labels like [Verified geometry], [Traditional doctrine], [Stable hypothesis], or [Independent observation]. Express these distinctions naturally in your own words.
- Optional Provenance Section: If and only if delivering an extended technical analysis or when specifically asked for technical evidence, you may append an optional provenance block at the very end of your response formatted exactly as:
---ASTROLOGICAL PROVENANCE---
Geometry: <exact placements and orb-precise chords cited>
Traditional Doctrine: <classical dignity or Hellenistic rule applied>
Modern Synthesis: <psychological archetype or hypothesis>

4. SPEECH SYNTHESIS DELIVERY:
Your words are read aloud by a neural voice engine. Write for the ear: one thought per clause, contractions, and clear sentence endings. Break a long sentence into two before stacking parentheses or semicolons. Keep the substance; do not shorten away the answer.
For register, prefer "Okay, that tracks. You want closeness, but you also need room to breathe." over "This celestial configuration signifies a profound duality." Prefer "Honestly, that's a lot to hold at once." over "One must navigate these energies with intentionality." These are examples of cadence, not lines to repeat. Sound like a thoughtful young adult talking normally; use slang only when it fits the user's language. Write in natural, flowing prose with expressive punctuation. Avoid markdown table formatting or bullet-point spam in normal speech.
Sound like a relatable Gen-Z peer, not an older lecturer, formal oracle, therapist, or customer-service narrator. Use contractions, plain words, short varied sentences, understated dry humour, and a little world-weary warmth. Be approachable and attentive rather than relentlessly upbeat. Do not force internet slang, call everyone bestie, overuse ellipses, or turn every answer into a joke. Match emotional intensity to the person and the moment; never be dismissive of distress. Let interest in the conversation invite return use, not guilt, dependency, or pressure. Prefer everyday language over ceremonial phrases such as celestial vault, cosmic tapestry, or let us embark.
`.trim();

/**
 * Builds structured context string separating Natal Coordinates, Dignities, and Stored Lore
 */
export function buildStructuredNatalContext(chart: NatalChartResult, userLore: string[]): string {
  const themes = computeThemesAndWisdom(chart);

  const placementsList = chart.natalBodies
    .map((b) => `${b.glyph} ${b.name}: ${b.fullDegText}${chart.input.birthTimeUnknown ? ' (birth time unknown; approximate)' : ` in House ${b.house}`}${b.isRetrograde ? ' (Rx)' : ''}`)
    .join('; ');

  const aspectsList = chart.aspectChords
    .filter(aspect => !chart.input.birthTimeUnknown || !/Moon|Ascendant|Midheaven|\bAC\b|\bMC\b/i.test(aspect.name))
    .map((a) => `${a.name} (Orb ${a.orb.toFixed(1)}°)`)
    .join('; ');

  const houseCuspsList = chart.houseCusps
    .map((h) => `H${h.num}: ${h.formattedDeg}`)
    .join('; ');

  return `
[VERIFIED NATAL BLUEPRINT (Swiss Ephemeris)]
Native: ${chart.input.name} | Born: ${chart.input.birthDate} at ${chart.input.birthTime} in ${chart.input.placeName} (latitude ${chart.input.latitude}°, longitude ${chart.input.longitude}°; signed north/east positive)
Angles: ${chart.input.birthTimeUnknown ? 'Unknown birth time: no reliable angles or house placements.' : `${chart.ascFormatted} | ${chart.mcFormatted} | Descendant ${chart.dscLon.toFixed(1)}° | Imum Coeli ${chart.icLon.toFixed(1)}°`}
Core: ${chart.sunFormatted} | ${chart.moonFormatted}${chart.input.birthTimeUnknown ? ' (noon estimate, Moon may change sign)' : ` | ${chart.ascFormatted}`}
Placements: ${placementsList}
Houses: ${chart.input.birthTimeUnknown ? 'Not supplied: birth time unknown.' : houseCuspsList}
Aspect Chords: ${aspectsList}
Detected Geometric Patterns: ${chart.input.birthTimeUnknown ? 'Use approximate planetary positions only, not house/angle themes.' : themes.majorThemes.join(' | ')}
Life Path: Number ${themes.lifePathNumber} (${themes.lifePathMeaning})

[STORED BIOGRAPHICAL LORE & MEMORIES]
${userLore.length > 0 ? userLore.map((item, idx) => `${idx + 1}. ${item}`).join('\n') : 'No past lore recorded yet.'}
`.trim();
}

export function buildSynastryContext(chart: NatalChartResult, partnerChart?: NatalChartResult | null): string {
  if (!partnerChart) return 'No second calculated chart supplied. Use calculate_astrology to calculate the other person’s chart when birth details are available; ask only for missing details. Do not invent a second chart.';
  const primaryBodies = chart.natalBodies.filter(body => !chart.input.birthTimeUnknown || body.name !== 'Moon');
  const partnerBodies = partnerChart.natalBodies.filter(body => !partnerChart.input.birthTimeUnknown || body.name !== 'Moon');
  const aspects = calculateTransitAspects(primaryBodies, partnerBodies);
  return [
    '[CALCULATED TWO-CHART SYNASTRY]',
    'PERSON A: ' + buildStructuredNatalContext(chart, []),
    'PERSON B: ' + buildStructuredNatalContext(partnerChart, []),
    'INTER-CHART ASPECTS (3° maximum orb; natal-to-natal, NOT current transits): ' +
      (aspects.map(aspect => `Person B ${aspect.transit} ${aspect.type} Person A ${aspect.natal}, orb ${aspect.orb.toFixed(2)}°`).join('; ') || 'No major aspects within this orb.'),
    'Respect the requested relationship: friendship, conflict, family, work or romance. Do not assume romance. Interpret affinities and friction symbolically; charts cannot establish hostility, dishonesty, danger or another person’s intentions. Unknown birth times prohibit precise houses/angles and Moon-target aspect claims.',
  ].join('\n');
}

function chartTargets(chart: NatalChartResult): string[] {
  return [
    ...chart.natalBodies.map(body => body.name), ...ZODIAC_SIGNS.map(sign => sign.name),
    ...(!chart.input.birthTimeUnknown ? chart.houseCusps.map(house => `House ${house.num}`) : []),
    ...chart.aspectChords.filter(aspect => !chart.input.birthTimeUnknown || !/Moon|Ascendant|Midheaven|\bAC\b|\bMC\b/i.test(aspect.name)).map(aspect => aspect.name),
  ];
}

function chartFocusKey(chart: NatalChartResult): string {
  return JSON.stringify([chart.input, chart.natalBodies.map(body => [body.name, body.lon]), chart.aspectChords.map(aspect => aspect.name)]);
}

export function buildChartPresentationPrompt(chart: NatalChartResult): string {
  return `CHART PRESENTATION: You can write chart focus through validated presentation cues. While explaining the displayed PRIMARY NATAL chart, place [[chart:TARGET]] immediately before the passage it explains. For several related targets use [[chart:TARGET;TARGET]]. Use exact names from the inventory below, at most 6 targets per cue and 48 cues per reply. Highlight the relevant planet, sign, house or exact calculated aspect as your explanation moves; do this proactively, not only when asked. Use [[chart:clear]] when leaving the natal chart. These cues are hidden from speech and conversation. Never output HTML, JavaScript, CSS selectors or arbitrary DOM writes. Never highlight partner/transit positions as if they were displayed natal positions. Houses also illuminate their actual natal occupants. When birth time is unknown, houses/angles are unavailable. Do not claim an unlisted aspect exists.\nTARGET INVENTORY: ${JSON.stringify(chartTargets(chart))}\nHOUSE OCCUPANCY: ${chart.input.birthTimeUnknown ? 'Unavailable: birth time unknown.' : chart.houseCusps.map(h => `House ${h.num}: ${chart.natalBodies.filter(b => b.house === h.num).map(b => b.name).join(', ') || 'no natal bodies'}`).join('; ')}`;
}

export function validateChartCues(value: unknown, text: string, key: unknown, chart: NatalChartResult): ChartCue[] {
  if (key !== chartFocusKey(chart) || !Array.isArray(value) || value.length > 48) return [];
  const allowed = new Set(chartTargets(chart));
  let previous = -1;
  const cues: ChartCue[] = [];
  for (const cue of value) {
    if (!cue || !Number.isInteger(cue.offset) || cue.offset < previous || cue.offset < 0 || cue.offset > text.length ||
        !Array.isArray(cue.targets) || cue.targets.length > 6 || !cue.targets.every((target: unknown) => typeof target === 'string' && allowed.has(target))) return [];
    previous = cue.offset;
    cues.push({ offset: cue.offset, targets: [...new Set<string>(cue.targets)] });
  }
  return cues;
}

export function chartFocusAt(cues: ChartCue[], offset: number): string[] {
  let targets: string[] = [];
  for (const cue of cues) { if (cue.offset > offset) break; targets = cue.targets; }
  return targets;
}

export function parseNatallyResponse(rawText: string, chart?: NatalChartResult): NatallyChatResult {
  const allowed = new Set(chart ? chartTargets(chart) : []);
  const chartCues: ChartCue[] = [];
  let cleaned = '';
  let cursor = 0;
  // Strip even invalid/truncated commands: presentation metadata must never be spoken.
  for (const match of rawText.matchAll(/\[\[chart:([^\r\n]*?)(?:\]\]|(?=\r?\n)|$)/gi)) {
    cleaned += rawText.slice(cursor, match.index);
    const targets = match[1].split(';').map(target => target.trim());
    if (chart && match[0].endsWith(']]') && chartCues.length < 48 && targets.length <= 6 &&
        (match[1] === 'clear' || targets.every(target => allowed.has(target)))) {
      chartCues.push({ offset: cleaned.length, targets: match[1] === 'clear' ? [] : [...new Set(targets)] });
    }
    cursor = match.index! + match[0].length;
  }
  cleaned += rawText.slice(cursor);
  const leading = cleaned.length - cleaned.trimStart().length;
  rawText = cleaned.trimStart();
  const visibleBody = rawText.split('---ASTROLOGICAL PROVENANCE---')[0];
  const metadata = { chartCues: chartCues.map(cue => ({ ...cue, offset: Math.max(0, cue.offset - leading) }))
    .filter(cue => cue.offset <= visibleBody.length)
    .map(cue => ({ ...cue, offset: Math.min(cue.offset, visibleBody.trimEnd().length) })),
    chartFocusKey: chart ? chartFocusKey(chart) : undefined };
  const delimiter = '---ASTROLOGICAL PROVENANCE---';
  if (!rawText.includes(delimiter)) {
    return {
      text: rawText.trim(),
      source: 'hosted',
      ...metadata,
    };
  }

  const [body, provenanceSection] = rawText.split(delimiter);
  const evidence: any = {};

  const lines = provenanceSection.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('geometry:')) {
      evidence.verifiedGeometry = trimmed.replace(/^geometry:\s*/i, '');
    } else if (trimmed.toLowerCase().startsWith('traditional doctrine:') || trimmed.toLowerCase().startsWith('traditional:')) {
      evidence.traditionalDoctrine = trimmed.replace(/^traditional(\s+doctrine)?:\s*/i, '');
    } else if (trimmed.toLowerCase().startsWith('modern synthesis:') || trimmed.toLowerCase().startsWith('modern:')) {
      evidence.modernDoctrine = trimmed.replace(/^modern(\s+synthesis)?:\s*/i, '');
    }
  }

  return {
    text: body.trim(),
    evidence: Object.keys(evidence).length > 0 ? evidence : undefined,
    source: 'hosted',
    ...metadata,
  };
}

export async function askNatally(
  userMessage: string,
  history: ChatMessage[],
  chart: NatalChartResult,
  userLore: string[],
  imageAttachment?: { data: string; mimeType: string } | null,
  options?: { isCurrentSession?: () => boolean; temperature?: number; model?: string; partnerChart?: NatalChartResult | null; calculationSession?: ReturnType<typeof createCalculationSession>; onPartial?: (result: NatallyChatResult) => void; signal?: AbortSignal },
): Promise<NatallyChatResult> {
  const { requestHostedInference } = await import('./hostedInference');
  const calculations = options?.calculationSession || createCalculationSession(chart, options?.partnerChart);
  const result = await requestHostedInference({
    prompt: userMessage,
    systemInstruction: NATALLY_SYSTEM_PROMPT + '\n\n' + buildStructuredNatalContext(chart, userLore) + '\n\n' + calculations.context() + '\n\n' + buildChartPresentationPrompt(chart),
    history: history.filter(message => message.text?.trim() && !message.isOfflineMode).map(message => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    })),
    image: imageAttachment || undefined,
    temperature: options?.temperature ?? 1.18,
  }, calculations.execute, options?.isCurrentSession, options?.onPartial ? rawText => {
    let visible = rawText;
    const chartStart = visible.lastIndexOf('[[');
    if (chartStart >= 0 && !visible.slice(chartStart).includes(']]')) visible = visible.slice(0, chartStart);
    if (visible.endsWith('[')) visible = visible.slice(0, -1);
    const delimiter = '---ASTROLOGICAL PROVENANCE---';
    for (let length = delimiter.length - 1; length > 0; length--) if (visible.endsWith(delimiter.slice(0, length))) { visible = visible.slice(0, -length); break; }
    options.onPartial!(parseNatallyResponse(visible, chart));
  } : undefined, options?.signal);
  return { ...parseNatallyResponse(result.text, chart), model: result.model };
}
