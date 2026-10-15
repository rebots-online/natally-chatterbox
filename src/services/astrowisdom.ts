// Numerology & Astrological Wisdom calculation engine
import { NatalChartResult } from './ephemeris';

export interface NumerologyAndThemes {
  lifePathNumber: number;
  lifePathMeaning: string;
  sunSign: string;
  sunSignGlyph: string;
  sunSignElement: string;
  moonSign: string;
  moonSignGlyph: string;
  moonSignElement: string;
  risingSign: string;
  risingSignGlyph: string;
  risingSignElement: string;
  corePolarity: string;
  majorThemes: string[];
  astrologicalEventsOfNote: Array<{
    title: string;
    timing: string;
    category: 'Natal Configuration' | 'Impending Transit' | 'Cyclical Phase';
    description: string;
  }>;
  traditionalBriefInterpretation: string;
}

const LIFE_PATH_DESCRIPTIONS: Record<number, string> = {
  1: 'The Sovereign Pioneer — Driven by originative will, independence, self-direction, and trailblazing initiation.',
  2: { toString: () => 'The Diplomat & Mirror — Master of intuitive attunement, mediation, sacred opposition, and harmonic partnership.' }.toString(),
  3: 'The Creative Catalyst — Radiating expressive eloquence, optimism, artistic synthesis, and joyful alchemy.',
  4: 'The Master Builder — Anchored in architectonic integrity, enduring structure, methodical discipline, and earthly foundations.',
  5: 'The Alchemical Pilgrim — Yearning for sovereign liberty, dynamic change, sensual adventure, and expansive horizons.',
  6: 'The Sacred Guardian — Grounded in harmonic nurturing, healing responsibility, domestic sanctuary, and aesthetic grace.',
  7: 'The Mystic Seeker — Drawn into esoteric inquiry, contemplative solitude, forensic perception, and metaphysical truth.',
  8: 'The Sovereign Regent — Wielding material manifestation, karmic authority, abundance cultivation, and executive potency.',
  9: 'The Universal Philanthropist — Embodying cosmic compassion, cyclical completion, transpersonal wisdom, and humanitarian grace.',
  11: 'Master 11 / The Illumination Conduit — High-frequency spiritual antenna bridging transcendent revelation into earthly awareness.',
  22: 'Master 22 / The Architect of Worlds — Transmuting loftiest cosmic archetypes into tangible monuments and enduring systems.',
  33: 'Master 33 / The Cosmic Avatar — Unconditional devotional love uplifting collective consciousness through selfless grace.',
};

export function calculateLifePathNumber(birthDate: string): { number: number; meaning: string } {
  // birthDate format YYYY-MM-DD
  const digits = birthDate.replace(/[^0-9]/g, '');
  if (!digits) return { number: 1, meaning: LIFE_PATH_DESCRIPTIONS[1] };

  const reduceDigits = (numStr: string, isMasterCheck = true): number => {
    let sum = numStr.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    while (sum > 9 && (!isMasterCheck || (sum !== 11 && sum !== 22 && sum !== 33))) {
      sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    }
    return sum;
  };

  const [yStr, mStr, dStr] = birthDate.split('-');
  const ySum = reduceDigits(yStr || '1990', false);
  const mSum = reduceDigits(mStr || '1', false);
  const dSum = reduceDigits(dStr || '1', false);

  const total = ySum + mSum + dSum;
  let finalNumber = total;
  if (finalNumber > 9 && finalNumber !== 11 && finalNumber !== 22 && finalNumber !== 33) {
    finalNumber = finalNumber.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  }

  const meaning = LIFE_PATH_DESCRIPTIONS[finalNumber] || LIFE_PATH_DESCRIPTIONS[1];
  return { number: finalNumber, meaning };
}

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

const SIGN_MODALITIES: Record<string, string> = {
  Aries: 'Cardinal',
  Cancer: 'Cardinal',
  Libra: 'Cardinal',
  Capricorn: 'Cardinal',
  Taurus: 'Fixed',
  Leo: 'Fixed',
  Scorpio: 'Fixed',
  Aquarius: 'Fixed',
  Gemini: 'Mutable',
  Virgo: 'Mutable',
  Sagittarius: 'Mutable',
  Pisces: 'Mutable',
};

export function computeThemesAndWisdom(chart: NatalChartResult): NumerologyAndThemes {
  const lifePath = calculateLifePathNumber(chart.input.birthDate);

  const sun = chart.natalBodies.find((b) => b.id === 'Sun');
  const moon = chart.natalBodies.find((b) => b.id === 'Moon');
  const ascCusp = chart.houseCusps.find((h) => h.num === 1);

  const sunSign = sun?.signName || 'Aries';
  const sunGlyph = sun?.signGlyph || '♈';
  const moonSign = moon?.signName || 'Taurus';
  const moonGlyph = moon?.signGlyph || '♉';
  const risingSign = ascCusp?.signName || 'Aquarius';
  const risingGlyph = ascCusp?.signGlyph || '♒';

  const sunElement = SIGN_ELEMENTS[sunSign] || 'Fire';
  const moonElement = SIGN_ELEMENTS[moonSign] || 'Water';
  const risingElement = SIGN_ELEMENTS[risingSign] || 'Earth';

  // Major themes synthesis
  const majorThemes: string[] = [];

  // Stelliums check (3 or more distinct bodies in the same sign)
  const signCounts: Record<string, number> = {};
  chart.natalBodies.forEach((b) => {
    signCounts[b.signName] = (signCounts[b.signName] || 0) + 1;
  });
  const stelliumSign = Object.entries(signCounts).find(([_, count]) => count >= 3);
  if (stelliumSign) {
    majorThemes.push(`Potent ${stelliumSign[0]} Stellium (${stelliumSign[1]} bodies focalized in unified resonance)`);
  }

  // Rigorous Aspect Pattern Geometry Engine
  // Helper to check for specific aspect between two planet names
  const hasAspectBetween = (p1: string, p2: string, type: 'Opposition' | 'Square' | 'Trine' | 'Sextile') => {
    return chart.aspectChords.some(
      (a) =>
        a.type === type &&
        ((a.from === p1 && a.to === p2) || (a.from === p2 && a.to === p1))
    );
  };

  // 1. Genuine Grand Trine Detection:
  // Requires 3 distinct bodies A, B, C mutually forming trines (A-B, B-C, A-C)
  const planetNames = chart.natalBodies.map((b) => b.name);
  let foundGrandTrine: { p1: string; p2: string; p3: string; element: string } | null = null;

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      for (let k = j + 1; k < planetNames.length; k++) {
        const p1 = planetNames[i];
        const p2 = planetNames[j];
        const p3 = planetNames[k];
        if (
          hasAspectBetween(p1, p2, 'Trine') &&
          hasAspectBetween(p2, p3, 'Trine') &&
          hasAspectBetween(p1, p3, 'Trine')
        ) {
          const b1 = chart.natalBodies.find((b) => b.name === p1);
          const elem = b1 ? SIGN_ELEMENTS[b1.signName] || 'Elemental' : 'Elemental';
          foundGrandTrine = { p1, p2, p3, element: elem };
          break;
        }
      }
      if (foundGrandTrine) break;
    }
    if (foundGrandTrine) break;
  }

  if (foundGrandTrine) {
    majorThemes.push(
      `Elemental ${foundGrandTrine.element} Grand Trine harmonic between ${foundGrandTrine.p1}, ${foundGrandTrine.p2}, and ${foundGrandTrine.p3} gifting natural creative grace & psychic reservoir`
    );
  }

  // 2. Genuine T-Square Detection:
  // Requires an Opposition between A and B, where BOTH A and B simultaneously square an apex body C
  let foundTSquare: { oppositionA: string; oppositionB: string; apex: string; modality: string } | null = null;
  const oppositions = chart.aspectChords.filter((a) => a.type === 'Opposition');

  for (const opp of oppositions) {
    for (const b of chart.natalBodies) {
      if (b.name !== opp.from && b.name !== opp.to) {
        if (
          hasAspectBetween(opp.from, b.name, 'Square') &&
          hasAspectBetween(opp.to, b.name, 'Square')
        ) {
          const apexModality = SIGN_MODALITIES[b.signName] || 'Dynamic';
          foundTSquare = {
            oppositionA: opp.from,
            oppositionB: opp.to,
            apex: b.name,
            modality: apexModality,
          };
          break;
        }
      }
    }
    if (foundTSquare) break;
  }

  if (foundTSquare) {
    majorThemes.push(
      `Dynamic ${foundTSquare.modality} T-Square tension (${foundTSquare.oppositionA} ☍ ${foundTSquare.oppositionB} squaring apex ${foundTSquare.apex}) driving catalytic self-mastery & worldly achievement`
    );
  }

  // 3. Prominent Aspect Chords (if no closed grand configuration exists)
  if (!foundGrandTrine && !foundTSquare) {
    const tightestAspect = [...chart.aspectChords].sort((a, b) => a.orb - b.orb)[0];
    if (tightestAspect) {
      majorThemes.push(
        `Focal Aspect Chord: ${tightestAspect.name} (Orb ${tightestAspect.orb}°) anchoring psychological dynamism`
      );
    }
  }

  majorThemes.push(`Life Path ${lifePath.number} Destiny: Grounding personal sovereign will into tangible legacy`);
  majorThemes.push(`Ascendant in ${risingSign} (${risingGlyph}) anchoring external reality perception and somatic stance`);

  // Astrological events of note
  const astrologicalEventsOfNote = [
    {
      title: `${sunSign} Solar Radiance with ${moonSign} Lunar Undercurrent`,
      timing: 'Inherent Natal Blueprint',
      category: 'Natal Configuration' as const,
      description: `Your solar vital conscious purpose seeks self-realization in ${sunSign}, illuminated through deep instinctual emotional needs shaped by ${moonSign}.`,
    },
    {
      title: `Angular Anchor: Midheaven at ${chart.mcFormatted.replace('MC: ', '')}`,
      timing: 'Vocational Zenith',
      category: 'Natal Configuration' as const,
      description: `Marks the summit of your public calling and professional legacy, calling for authoritative excellence in the worldly sphere.`,
    },
    {
      title: `Pluto-Neptune Outer Evolutionary Current`,
      timing: 'Active Generational Transit',
      category: 'Impending Transit' as const,
      description: `Deep subconscious restructuring dismantling obsolete cognitive paradigms to usher in transpersonal creative breakthrough.`,
    },
    {
      title: `Saturnian Maturation & Reality Testing`,
      timing: 'Current Cycle Orbit',
      category: 'Cyclical Phase' as const,
      description: `Demands rigorous architectural boundaries in key houses, rewarding focused endurance with unshakeable long-term sovereignty.`,
    },
  ];

  const traditionalBriefInterpretation = `
Under classical Hellenistic and Renaissance astrological canons, the nativity of ${chart.input.name} is configured with the Ascendant in ${risingSign} (${risingGlyph}), granting an intuitive lens that registers reality with discerning awareness. The solar luminary reigns in ${sunSign} (${sunGlyph}), bestowing a core vital impetus toward purposeful embodiment, while the lunar luminary in ${moonSign} (${moonGlyph}) guards the inner sanctuary of memory, somatic intuition, and psychological sustenance. Coupled with Life Path Number ${lifePath.number}, the native is called to synthesize high metaphysical perception with uncompromising earthly craft.
  `.trim();

  return {
    lifePathNumber: lifePath.number,
    lifePathMeaning: lifePath.meaning,
    sunSign,
    sunSignGlyph: sunGlyph,
    sunSignElement: sunElement,
    moonSign,
    moonSignGlyph: moonGlyph,
    moonSignElement: moonElement,
    risingSign,
    risingSignGlyph: risingGlyph,
    risingSignElement: risingElement,
    corePolarity: `${sunSign} Sun (${sunElement}) · ${moonSign} Moon (${moonElement}) · ${risingSign} Ascendant (${risingElement})`,
    majorThemes,
    astrologicalEventsOfNote,
    traditionalBriefInterpretation,
  };
}
