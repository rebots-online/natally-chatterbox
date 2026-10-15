import { NatalChartResult } from './ephemeris';
import { computeThemesAndWisdom } from './astrowisdom';

export interface ComprehensiveReadingSection {
  title: string;
  subtitle: string;
  content: string;
}

export interface ComprehensiveReadingResult {
  title: string;
  nativeName: string;
  observationContext: string;
  sections: ComprehensiveReadingSection[];
  natallyPersonalNote: string;
  fullMarkdown: string;
}

const SIGN_DESCRIPTIONS: Record<string, { essence: string; light: string; shadow: string; gift: string }> = {
  Aries: {
    essence: 'The Cardinal Fire initiator; originative vitality, fearless pioneer instinct, and primal sovereign will.',
    light: 'Unflinching courage, decisive action, and infectious passion.',
    shadow: 'Impatience, combative reactivity, and burning out before the harvest.',
    gift: 'The power to ignite new realities where none existed before.',
  },
  Taurus: {
    essence: 'The Fixed Earth artisan; somatic sanctuary, sensual discernment, patient architectural building, and steadfast loyalty.',
    light: 'Unshakeable calm, grounding presence, deep aesthetic appreciation, and enduring devotion.',
    shadow: 'Resistance to necessary evolutionary change, possessiveness, and stubborn inertia.',
    gift: 'The power to anchor ethereal visions into tangible, enduring form.',
  },
  Gemini: {
    essence: 'The Mutable Air messenger; agile intellect, playful curiosity, multifaceted perception, and lightning neural synthesis.',
    light: 'Brilliant communication, adaptable wit, and connecting disparate concepts.',
    shadow: 'Nervous scattering, superficial distraction, and emotional detachment.',
    gift: 'The power to bridge separated worlds through language and understanding.',
  },
  Cancer: {
    essence: 'The Cardinal Water guardian; psychic memory, protective devotion, intuitive somatic radar, and ancestral resonance.',
    light: 'Profound empathy, fierce loyalty, and the capacity to create unconditional sanctuary.',
    shadow: 'Emotional defensiveness, brooding withdrawal, and clutching to the past.',
    gift: 'The power to nurture the soul through cyclical vulnerability and emotional truth.',
  },
  Leo: {
    essence: 'The Fixed Fire sovereign; solar radiance, sovereign dignity, generous creative expression, and open-hearted warmth.',
    light: 'Magnanimous leadership, authentic charisma, and inspiring creative joy.',
    shadow: 'Prideful vulnerability, seeking external validation, and dramatic over-identification.',
    gift: 'The power to illuminate others simply by daring to shine as your authentic self.',
  },
  Virgo: {
    essence: 'The Mutable Earth alchemist; meticulous discernment, sacred devotion to craft, holistic healing, and forensic purification.',
    light: 'Incisive analytical clarity, selfless service, and transformative attention to detail.',
    shadow: 'Paralyzing perfectionism, harsh self-criticism, and getting lost in the weeds.',
    gift: 'The power to refine raw chaos into elegant, functional sacred geometry.',
  },
  Libra: {
    essence: 'The Cardinal Air diplomat; relational aesthetic, sacred equilibrium, forensic sense of justice, and harmonic synthesis.',
    light: 'Exquisite tact, mirror-like relational insight, and balancing opposing forces.',
    shadow: 'Indecisive conflict avoidance, over-accommodating others at self-expense.',
    gift: 'The power to restore divine harmony and truth in human connections.',
  },
  Scorpio: {
    essence: 'The Fixed Water transformer; psychological forensic gaze, alchemical rebirth, unwavering loyalty, and sovereign emotional depth.',
    light: 'Penetrating intuitive truth, fearless shadow integration, and unshakeable resilience.',
    shadow: 'Vindictive guardedness, obsessive control, and terror of betrayal.',
    gift: 'The power to transmute poison into medicine and rise from any ash.',
  },
  Sagittarius: {
    essence: 'The Mutable Fire philosopher; expansive vision, spiritual seeker, untamed sovereign freedom, and generous humor.',
    light: 'Infectious optimism, prophetic wisdom, and relentless pursuit of truth.',
    shadow: 'Dogmatic bluntness, restlessness, and fleeing emotional accountability.',
    gift: 'The power to see the cosmic meaning behind every earthly chapter.',
  },
  Capricorn: {
    essence: 'The Cardinal Earth architect; sovereign authority, generational endurance, pragmatic mastery, and high ethical responsibility.',
    light: 'Unmatched discipline, steadfast reliability, and building monuments that withstand centuries.',
    shadow: 'Austere emotional cynicism, fear of vulnerability, and measuring worth by productivity.',
    gift: 'The power to climb the steepest mountain and hold the summit with integrity.',
  },
  Aquarius: {
    essence: 'The Fixed Air visionary; cosmic rebel, humanitarian avant-garde, transpersonal intellect, and sacred detachment.',
    light: 'Original genius, progressive egalitarian compassion, and seeing decades into the future.',
    shadow: 'Chilly aloofness, intellectual stubbornness, and alienating personal intimacy.',
    gift: 'The power to awaken humanity to its higher potential without demanding conformity.',
  },
  Pisces: {
    essence: 'The Mutable Water mystic; oceanic compassion, transpersonal imagination, spiritual surrender, and dissolution of borders.',
    light: 'Boundless empathy, artistic transcendence, and direct communion with the divine.',
    shadow: 'Martyrdom, escapism, fuzzy boundaries, and confusion with earthly reality.',
    gift: 'The power to remember our ultimate oneness through unconditional love.',
  },
};

const PLANET_ARCHETYPAL_ROLES: Record<string, string> = {
  Sun: 'The Sovereign Will & Conscious Spark of Divinity',
  Moon: 'The Instinctual Well, Emotional Sanctuary & Subconscious Memory',
  Mercury: 'The Alchemical Mind, Neural Transmitter & Symbolic Processor',
  Venus: 'The Sacred Magnetism, Relational Aesthetic & Deep Worth',
  Mars: 'The Sacred Warrior, Courageous Impetus & Boundary Enforcer',
  Jupiter: 'The Cosmic Benefactor, Spiritual Vision & Abundance Conduit',
  Saturn: 'The Great Architect, Karmic Taskmaster & Sovereign Master',
  Uranus: 'The Awakener, Lightning Catalyst & Transpersonal Liberator',
  Neptune: 'The Mystic Oceanic Veil, High Inspiration & Divine Surrender',
  Pluto: 'The Alchemical Transformer, Evolutionary Underworld & Sovereign Phoenix',
  Chiron: 'The Wounded Healer, Sacred Threshold & Transmuted Medicine',
  TrueNode: 'The North Star Evolutionary Destiny & Soul Growth Direction',
};

export function generateComprehensiveNatalReading(chart: NatalChartResult): ComprehensiveReadingResult {
  const wisdom = computeThemesAndWisdom(chart);
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const observationContext = `Cast on Swiss Ephemeris Engine (Epoch 2000.0) · Placidus Houses · Observed at ${chart.input.placeName} (${Math.abs(chart.input.latitude).toFixed(2)}°N, ${Math.abs(chart.input.longitude).toFixed(2)}°E) · Native: ${chart.input.name} (Born ${chart.input.birthDate} at ${chart.input.birthTime})`;

  const sunBody = chart.natalBodies.find((b) => b.id === 'Sun');
  const moonBody = chart.natalBodies.find((b) => b.id === 'Moon');
  const ascCusp = chart.houseCusps.find((h) => h.num === 1);
  const mcCusp = chart.houseCusps.find((h) => h.num === 10);

  const sunSign = sunBody?.signName || 'Scorpio';
  const moonSign = moonBody?.signName || 'Aquarius';
  const ascSign = ascCusp?.signName || 'Taurus';
  const mcSign = mcCusp?.signName || 'Capricorn';

  const sunData = SIGN_DESCRIPTIONS[sunSign] || SIGN_DESCRIPTIONS.Scorpio;
  const moonData = SIGN_DESCRIPTIONS[moonSign] || SIGN_DESCRIPTIONS.Aquarius;
  const ascData = SIGN_DESCRIPTIONS[ascSign] || SIGN_DESCRIPTIONS.Taurus;

  const sections: ComprehensiveReadingSection[] = [];

  // 1. The Core Trinity of Self
  sections.push({
    title: 'Chapter I: The Soul’s Architecture — The Core Trinity of Self',
    subtitle: `Sun in ${sunSign} · Moon in ${moonSign} · Ascendant in ${ascSign}`,
    content: `
Every human incarnation possesses a tri-fold sacred lens: the conscious solar impetus (Sun), the private subconscious well of emotional sanctuary (Moon), and the somatic threshold through which the soul interfaces with outer reality (Ascendant).

1. **The Conscious Radiance (Sun in ${sunSign} at ${sunBody?.degText || ''}):**
Your conscious core vitality is guided by the archetype of ${sunSign}. ${sunData.essence}
- *In its highest light:* ${sunData.light}
- *The evolutionary shadow:* ${sunData.shadow}
- *Your solar destiny:* You are not here to live a superficial or accidental life; your solar mission requires total authenticity and deliberate creative will.

2. **The Inner Emotional Sanctuary (Moon in ${moonSign} at ${moonBody?.degText || ''} in House ${moonBody?.house || 1}):**
While your Sun is how you shine, your Moon is how you feel, restore, and privately digest experience. With the Moon in ${moonSign}, ${moonData.essence}
- *Emotional Instincts:* You require emotional sovereignty. When the outer world becomes chaotic, your Moon needs space, mental clarity, and sacred sanctuary.
- *The Paradox of Your Trinity:* The tension between your ${sunSign} Sun and your ${moonSign} Moon is one of your greatest superpowers. Where your Sun demands profound, laser-focused emotional depth, your Moon offers transpersonal objectivity and perspective, preventing you from drowning in your own intensity.

3. **The Somatic Stance (Ascendant in ${ascSign} at ${chart.ascFormatted.replace('AC: ', '')}):**
Your Ascendant represents your energetic aura and how you step into a room. With ${ascSign} Rising, ${ascData.essence} People experience you as grounded, reliable, and aesthetically discerning. It provides a steady, composed outer anchor that houses your complex inner psychological cosmos.

4. **The Vocational Summit (Midheaven in ${mcSign} at ${chart.mcFormatted.replace('MC: ', '')}):**
The Midheaven marks your highest professional contribution and public legacy. With ${mcSign} on the Midheaven, you are built to architect enduring systems, lead with quiet authority, and leave behind work that survives long after trends fade.
    `.trim(),
  });

  // 2. Life Path & Numerological Blueprint
  sections.push({
    title: 'Chapter II: Numerological Destiny & Life Path Alignment',
    subtitle: `Life Path ${wisdom.lifePathNumber} — ${wisdom.lifePathMeaning.split('—')[0]?.trim() || ''}`,
    content: `
Numerological vibrations provide the temporal rhythm to which your planetary geometry dances. Your birthdate (${chart.input.birthDate}) reduces to **Life Path Number ${wisdom.lifePathNumber}**.

- **The Core Archetype:** ${wisdom.lifePathMeaning}
- **Synthesizing Number with Sky:** Your Life Path ${wisdom.lifePathNumber} acts as the executive compass for your natal chart. When facing crossroads, return to this foundational frequency: build with patience, lead with integrity, and refuse to compromise your ethical foundation for short-term expedience.
- **Active Major Themes:**
${wisdom.majorThemes.map((t) => `  • ${t}`).join('\n')}
    `.trim(),
  });

  // 3. The Planetary Assembly & Inner Archetypes
  const planetDetails = chart.natalBodies
    .map((b) => {
      const role = PLANET_ARCHETYPAL_ROLES[b.id] || 'Planetary Archetype';
      const signInfo = SIGN_DESCRIPTIONS[b.signName] || { essence: b.detail, gift: 'Mastery in this sector.' };
      const retrogradeNote = b.isRetrograde
        ? ' [Retrograde: Lessons here are deeply internalized, requiring self-determined authority rather than collective validation.]'
        : '';
      return `### ${b.name} (${b.fullDegText} in House ${b.house})${retrogradeNote}\n**Archetypal Role:** ${role}\n- **Placement Synthesis:** In ${b.signName}, ${signInfo.essence}\n- **House ${b.house} Manifestation:** ${b.detail}\n- **Core Gift:** ${signInfo.gift}`;
    })
    .join('\n\n');

  sections.push({
    title: 'Chapter III: The Planetary Assembly — Inner Archetypes & Powers',
    subtitle: 'Detailed Forensic Breakdown of Every Planetary Placement',
    content: `
Your psyche is not a monolith; it is an orchestra of archetypal planetary voices. Below is the detailed analysis of how every celestial body functions in your personal astrolabe:

${planetDetails}
    `.trim(),
  });

  // 4. Dynamic Aspect Chords & Creative Friction
  const aspectDetails = chart.aspectChords
    .map((a) => {
      return `### ${a.name} (Orb ${a.orb.toFixed(1)}° · ${a.type})\n${a.detail}\n*Psychological Significance:* This aspect chord represents a live energetic circuit in your nervous system. Rather than fighting this polarity, view it as creative friction that sharpens your discernment and catalyzes breakthroughs.`;
    })
    .join('\n\n');

  sections.push({
    title: 'Chapter IV: Dynamic Aspect Chords — The Tension & The Flow',
    subtitle: 'Geometric Aspect Chords Connecting Your Planetary Sphere',
    content: `
Planets do not operate in isolation; they converse along precise angular harmonic chords across the celestial wheel.

${aspectDetails || 'Your aspect wheel features a serene, balanced harmonic distribution across cardinal and fixed sectors.'}
    `.trim(),
  });

  // 5. Impending Timings & Evolutionary Life Chapters
  const eventDetails = wisdom.astrologicalEventsOfNote
    .map((e) => {
      return `• **${e.title}** (${e.timing} · *${e.category}*)\n  ${e.description}`;
    })
    .join('\n\n');

  sections.push({
    title: 'Chapter V: Impending Transits & Evolutionary Chapters',
    subtitle: 'Active Catalysts & Timings Governing Your Present Cycle',
    content: `
The natal chart is the natal seed; transits and life cycles are the seasons that bring it to fruition.

${eventDetails}

**Traditional Epistemic Counsel:**
${wisdom.traditionalBriefInterpretation}
    `.trim(),
  });

  // 6. Natally's Relatable Stream-of-Consciousness Transmission
  const natallyNote = `
"Sitting here with your live 3D chart in front of me, ${chart.input.name}, there is something deeply compelling about your celestial architecture.

Look at your geometry: your Sun in ${sunSign} paired with your Moon in ${moonSign}. You carry this fierce, investigative depth and emotional fidelity, but you also possess this panoramic, objective observer mind that refuses to be confined to simple boxes. You feel things with immense psychological resolution, yet you have the capacity to step back and examine the pattern from above.

Astrology was never meant to be a cold mechanical printout of predictions or fortune-telling warnings. It is a living, symbolic mirror for the human psyche. The tensions and aspects you carry are not flaws; they are the alchemical lathe that shapes your discernment and creative sovereignty.

Every configuration in your sky serves your becoming. Talk to me about what we have explored here: what parts resonate deeply, what feels like an active question, or where you want to dig deeper into the geometry. I am right here with you."
  `.trim();

  sections.push({
    title: 'Chapter VI: Natally’s Personal Synthesis & Companion Counsel',
    subtitle: 'Reflections from Your Celestial Confidante',
    content: natallyNote,
  });

  const fullMarkdown = `
# NATAL ASTROLABE 3D · COMPREHENSIVE PSYCHIC READING
**Native:** ${chart.input.name}
**Parameters:** ${observationContext}
**Core Trinity:** ${chart.sunFormatted} · ${chart.moonFormatted} · ${chart.ascFormatted} · ${chart.mcFormatted}
**Life Path:** Number ${wisdom.lifePathNumber} (${wisdom.lifePathMeaning})
**Generated:** ${dateStr} at ${timeStr}

---

${sections.map((s) => `## ${s.title}\n*${s.subtitle}*\n\n${s.content}\n\n---`).join('\n\n')}

Copyright (C)2026 Robin L. M. Cheung, MBA. All rights reserved. https://natally.robin.mba/
  `.trim();

  return {
    title: `Comprehensive Natal Reading · ${chart.input.name}`,
    nativeName: chart.input.name,
    observationContext,
    sections,
    natallyPersonalNote: natallyNote,
    fullMarkdown,
  };
}
