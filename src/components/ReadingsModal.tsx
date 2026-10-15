import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Users,
  Compass,
  Eye,
  Download,
  MessageSquare,
  MapPin,
  Search,
  CheckCircle2,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { NatalChartResult, NatalChartInput, calculateNatalChart } from '../services/ephemeris';
import { generateAstrologicalReading, ReadingResponse } from '../services/readings';
import {
  CityLocation,
  PRESET_CITIES,
  searchPlaceOnline,
  getPersistedVantageLocation,
  savePersistedVantageLocation,
} from '../services/locations';
import { RichText } from './RichText';

interface ReadingsModalProps {
  accountUid: string;
  isCurrentSession: () => boolean;
  onPartnerChart?: (chart: NatalChartResult) => void;
  onSignIn: () => void;
  isSignedIn: boolean;
  chart: NatalChartResult;
  onClose: () => void;
  initialType?: 'horoscope' | 'synastry' | 'house' | 'planet' | 'aspect';
  initialTargetKey?: string;
  onSendToNatally?: (title: string, content: string, type: string, presentation?: Pick<ReadingResponse, 'chartCues' | 'chartFocusKey'>) => void;
}

export const ReadingsModal: React.FC<ReadingsModalProps> = ({
  accountUid,
  isCurrentSession,
  onPartnerChart,
  onSignIn,
  isSignedIn,
  chart,
  onClose,
  initialType = 'horoscope',
  initialTargetKey,
  onSendToNatally,
}) => {
  const [readingError, setReadingError] = useState<{ message: string; code?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'horoscope' | 'synastry' | 'entities'>('horoscope');
  const [entityType, setEntityType] = useState<'house' | 'planet' | 'aspect'>('planet');
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(
    initialTargetKey || chart.natalBodies[0].name
  );

  // Horoscope Transit Observation State (Date, Time, Location)
  const [transitDate, setTransitDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [transitTime, setTransitTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  // Validated & Persisted Residence / Transit Vantage Point
  const [vantageLocation, setVantageLocation] = useState<CityLocation>(() => {
    const saved = getPersistedVantageLocation(accountUid);
    if (saved) return saved;
    // Default to birthplace with verified coordinates
    return {
      name: chart.input.placeName.split(',')[0] || chart.input.placeName,
      country: chart.input.placeName.split(',')[1]?.trim() || 'Canada',
      latitude: chart.input.latitude,
      longitude: chart.input.longitude,
      timezoneOffset: chart.input.timezoneOffset,
      label: `${chart.input.placeName} (Birthplace · ${Math.abs(chart.input.latitude).toFixed(2)}°${chart.input.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(chart.input.longitude).toFixed(2)}°${chart.input.longitude >= 0 ? 'E' : 'W'})`,
    };
  });

  const [transitPlaceQuery, setTransitPlaceQuery] = useState(() => {
    const saved = getPersistedVantageLocation(accountUid);
    if (saved) return `${saved.name}, ${saved.country}`;
    return chart.input.placeName || 'Alexandria, ON, Canada';
  });

  const [transitLocationLocked, setTransitLocationLocked] = useState(true);
  const [transitSuggestions, setTransitSuggestions] = useState<CityLocation[]>(PRESET_CITIES.slice(0, 8));
  const [showTransitSuggestions, setShowTransitSuggestions] = useState(false);
  const [isSearchingTransitOnline, setIsSearchingTransitOnline] = useState(false);
  const transitDropdownRef = useRef<HTMLDivElement>(null);
  const transitSearchTimeoutRef = useRef<any>(null);

  // Synastry partner form state
  const [partnerName, setPartnerName] = useState('Partner');
  const [partnerDate, setPartnerDate] = useState('1992-05-15');
  const [partnerYear, setPartnerYear] = useState('1992');
  const [partnerMonth, setPartnerMonth] = useState('05');
  const [partnerDay, setPartnerDay] = useState('15');
  const [partnerTime, setPartnerTime] = useState('12:00');

  // Default partner birthplace to blank or current vantage location (NOT New York!)
  const [partnerCity, setPartnerCity] = useState<CityLocation | null>(() => {
    return getPersistedVantageLocation(accountUid) || null;
  });
  const [partnerPlaceQuery, setPartnerPlaceQuery] = useState<string>(() => {
    const saved = getPersistedVantageLocation(accountUid);
    return saved ? (saved.label || `${saved.name}, ${saved.country}`) : '';
  });
  const [partnerLocationLocked, setPartnerLocationLocked] = useState(false);
  const [partnerSuggestions, setPartnerSuggestions] = useState<CityLocation[]>(PRESET_CITIES.slice(0, 8));
  const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false);
  const [isSearchingPartnerOnline, setIsSearchingPartnerOnline] = useState(false);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);
  const partnerSearchTimeoutRef = useRef<any>(null);
  const [partnerChart, setPartnerChart] = useState<NatalChartResult | null>(null);

  // References for partner birthdate auto-advancing inputs
  const partnerYearRef = useRef<HTMLInputElement>(null);
  const partnerMonthRef = useRef<HTMLInputElement>(null);
  const partnerDayRef = useRef<HTMLInputElement>(null);
  const partnerDatePickerRef = useRef<HTMLInputElement>(null);

  // Generated Reading State
  const [reading, setReading] = useState<ReadingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        transitDropdownRef.current &&
        !transitDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTransitSuggestions(false);
      }
      if (
        partnerDropdownRef.current &&
        !partnerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowPartnerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Search Vantage Location
  const handleTransitPlaceInput = (val: string) => {
    setTransitPlaceQuery(val);
    setTransitLocationLocked(false);
    setShowTransitSuggestions(true);

    if (transitSearchTimeoutRef.current) {
      clearTimeout(transitSearchTimeoutRef.current);
    }

    const q = val.trim().toLowerCase();
    const localFiltered = PRESET_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.adminRegion && c.adminRegion.toLowerCase().includes(q))
    );
    if (localFiltered.length > 0) {
      setTransitSuggestions(localFiltered);
    }

    setIsSearchingTransitOnline(true);
    transitSearchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!isCurrentSession()) return;
        const matches = await searchPlaceOnline(val);
        if (!isCurrentSession()) return;
        setTransitSuggestions(matches.length > 0 ? matches : localFiltered);
      } finally {
        if (isCurrentSession()) setIsSearchingTransitOnline(false);
      }
    }, 200);
  };

  const selectTransitCity = (city: CityLocation) => {
    if (!isCurrentSession()) return;
    const formattedPlace = `${city.name}, ${city.country}`;
    setVantageLocation(city);
    setTransitPlaceQuery(formattedPlace);
    setTransitLocationLocked(true);
    setShowTransitSuggestions(false);
    savePersistedVantageLocation(city, accountUid);
  };

  const resetToBirthplace = () => {
    const birthCity: CityLocation = {
      name: chart.input.placeName.split(',')[0] || chart.input.placeName,
      country: chart.input.placeName.split(',')[1]?.trim() || '',
      latitude: chart.input.latitude,
      longitude: chart.input.longitude,
      timezoneOffset: chart.input.timezoneOffset,
      label: `${chart.input.placeName} (Birthplace · ${Math.abs(chart.input.latitude).toFixed(2)}°${chart.input.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(chart.input.longitude).toFixed(2)}°${chart.input.longitude >= 0 ? 'E' : 'W'})`,
    };
    selectTransitCity(birthCity);
  };

  // Partner location picker handlers
  const handlePartnerPlaceInput = (val: string) => {
    setPartnerPlaceQuery(val);
    setPartnerLocationLocked(false);
    setShowPartnerSuggestions(true);

    if (partnerSearchTimeoutRef.current) {
      clearTimeout(partnerSearchTimeoutRef.current);
    }

    const q = val.trim().toLowerCase();
    const localFiltered = PRESET_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.adminRegion && c.adminRegion.toLowerCase().includes(q))
    );
    if (localFiltered.length > 0) {
      setPartnerSuggestions(localFiltered);
    }

    setIsSearchingPartnerOnline(true);
    partnerSearchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!isCurrentSession()) return;
        const matches = await searchPlaceOnline(val);
        if (!isCurrentSession()) return;
        setPartnerSuggestions(matches.length > 0 ? matches : localFiltered);
      } finally {
        if (isCurrentSession()) setIsSearchingPartnerOnline(false);
      }
    }, 200);
  };

  const selectPartnerCity = (city: CityLocation) => {
    const formattedPlace = `${city.name}, ${city.country}`;
    setPartnerCity(city);
    setPartnerPlaceQuery(formattedPlace);
    setPartnerLocationLocked(true);
    setShowPartnerSuggestions(false);
  };

  const handleGenerateHoroscope = async (
    tDate = transitDate,
    tTime = transitTime,
    city = vantageLocation
  ) => {
    if (!isCurrentSession()) return;
    setReadingError(null);
    setIsLoading(true);
    try {
      const locString = city
        ? `${city.name}, ${city.country} (${Math.abs(city.latitude).toFixed(2)}°${city.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(city.longitude).toFixed(2)}°${city.longitude >= 0 ? 'E' : 'W'})`
        : transitPlaceQuery;

      const res = await generateAstrologicalReading({
        isCurrentSession,
        type: 'horoscope',
        chart,
        transitDate: tDate,
        transitTime: tTime,
        transitPlace: locString,
        transitTimezoneOffset: -new Date(`${tDate}T${tTime}:00`).getTimezoneOffset() / 60,
      });
      if (!isCurrentSession()) return;
      setReading(res);
    } catch (error: any) {
      if (!isCurrentSession()) return;
      setReadingError({ message: error?.message || 'Reading failed. Please try again.', code: error?.code });
    } finally {
      if (isCurrentSession()) setIsLoading(false);
    }
  };

  const handleGenerateSynastry = async () => {
    if (!isCurrentSession()) return;
    setReadingError(null);
    setIsLoading(true);
    try {
      if (!partnerCity || !partnerLocationLocked) throw new Error('Select the other person’s birth city before calculating their chart.');
      const lat = partnerCity ? partnerCity.latitude : chart.input.latitude;
      const lon = partnerCity ? partnerCity.longitude : chart.input.longitude;
      const tz = partnerCity ? partnerCity.timezoneOffset : chart.input.timezoneOffset;
      const pChart = await calculateNatalChart({
        name: partnerName,
        birthDate: partnerDate,
        birthTime: partnerTime,
        placeName: partnerPlaceQuery || chart.input.placeName,
        latitude: lat,
        longitude: lon,
        timezoneOffset: tz,
      });
      if (!isCurrentSession()) return;
      setPartnerChart(pChart);
      onPartnerChart?.(pChart);

      const res = await generateAstrologicalReading({
        isCurrentSession,
        type: 'synastry',
        chart,
        partnerChart: pChart,
      });
      if (!isCurrentSession()) return;
      setReading(res);
    } catch (error: any) {
      if (!isCurrentSession()) return;
      setReadingError({ message: error?.message || 'Reading failed. Please try again.', code: error?.code });
    } finally {
      if (isCurrentSession()) setIsLoading(false);
    }
  };

  const handleGenerateEntity = async (type: 'house' | 'planet' | 'aspect', key: string) => {
    if (!isCurrentSession()) return;
    setReadingError(null);
    setIsLoading(true);
    try {
      const res = await generateAstrologicalReading({
        isCurrentSession,
        type,
        targetKey: key,
        chart,
      });
      if (!isCurrentSession()) return;
      setReading(res);
    } catch (error: any) {
      if (!isCurrentSession()) return;
      setReadingError({ message: error?.message || 'Reading failed. Please try again.', code: error?.code });
    } finally {
      if (isCurrentSession()) setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="celestial-panel w-full max-w-2xl max-h-[90vh] rounded-2xl p-5 border border-[#d4af37]/40 shadow-2xl flex flex-col space-y-4">
        {readingError && (
          <div role="alert" className="p-3 rounded-lg border border-amber-500/50 text-amber-200 text-xs">
            <p>{readingError.code === 'auth_required' && isSignedIn ? 'Signed in. Generate your reading again to continue.' : readingError.message}</p>
            {readingError.code === 'auth_required' && !isSignedIn && (
              <button type="button" onClick={onSignIn} className="mt-2 px-3 py-2 rounded bg-amber-700 text-white">
                Sign in to get your reading
              </button>
            )}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#322641] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-cinzel text-sm text-[#f2ca50] font-bold tracking-wider uppercase">
              Astrological Readings &amp; Transits
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#271c36] text-[#a99dae] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-[#1c1428] p-1 rounded-xl border border-[#322641]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('horoscope');
              handleGenerateHoroscope();
            }}
            className={`py-1.5 px-3 rounded-lg font-mono text-xs transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'horoscope'
                ? 'bg-[#271c36] text-[#f2ca50] font-semibold'
                : 'text-[#a99dae] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Horoscope</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('synastry')}
            className={`py-1.5 px-3 rounded-lg font-mono text-xs transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'synastry'
                ? 'bg-[#271c36] text-[#f2a38c] font-semibold'
                : 'text-[#a99dae] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Synastry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('entities')}
            className={`py-1.5 px-3 rounded-lg font-mono text-xs transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'entities'
                ? 'bg-[#271c36] text-[#9fb4ff] font-semibold'
                : 'text-[#a99dae] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>House / Planet / Aspect</span>
          </button>
        </div>

        {/* Tab Content Controls */}
        {activeTab === 'horoscope' && (
          <div className="p-3.5 rounded-xl bg-[#1c1428] border border-[#322641] space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-[#f2ca50] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f2ca50]" />
                <span>Horoscope Observation Parameters (Live Sky Transits):</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetToBirthplace}
                  className="text-[10px] font-mono text-[#a99dae] hover:text-[#f2ca50] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset vantage point to natal birthplace"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Use Birthplace</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setTransitDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                    setTransitTime(
                      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                    );
                  }}
                  className="text-[10px] font-mono text-[#9fb4ff] hover:underline cursor-pointer"
                >
                  Set Current Moment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-mono text-[9px] text-[#a99dae] mb-1">Transit Date</label>
                <input
                  type="date"
                  value={transitDate}
                  onChange={(e) => setTransitDate(e.target.value)}
                  className="talisman-input w-full rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] text-[#a99dae] mb-1">Transit Time ({Intl.DateTimeFormat().resolvedOptions().timeZone}, device time)</label>
                <input
                  type="time"
                  value={transitTime}
                  onChange={(e) => setTransitTime(e.target.value)}
                  className="talisman-input w-full rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>

              {/* Transit Vantage Point (Current Residence / Location) with Autocomplete Picker & Validation */}
              <div className="relative" ref={transitDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[9px] text-[#a99dae]">
                    Transit Vantage Point (Residence)
                  </label>
                  {transitLocationLocked ? (
                    <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Validated &amp; Persisted
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-amber-400 font-semibold flex items-center gap-0.5">
                      Filter/Pick to Validate
                    </span>
                  )}
                </div>

                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#f2a38c] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={transitPlaceQuery}
                    onFocus={() => {
                      setShowTransitSuggestions(true);
                      if (transitSuggestions.length === 0) {
                        setTransitSuggestions(PRESET_CITIES.slice(0, 8));
                      }
                    }}
                    onChange={(e) => handleTransitPlaceInput(e.target.value)}
                    placeholder="Search current city (e.g. Toronto, ON)..."
                    className="talisman-input w-full rounded pl-7 pr-7 py-1.5 text-xs font-medium"
                    required
                  />
                  {isSearchingTransitOnline ? (
                    <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  ) : (
                    <Search className="w-3 h-3 text-[#a99dae] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showTransitSuggestions && transitSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#180f24] border border-[#d4af37]/50 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-[#322641]">
                    <div className="p-1.5 bg-[#251739] text-[9px] font-mono text-[#f2ca50] flex items-center justify-between">
                      <span>Select validated location to persist:</span>
                      <span className="text-white/40">Swiss Ephemeris precision</span>
                    </div>
                    {transitSuggestions.map((city, idx) => (
                      <button
                        key={`${city.name}-${city.latitude}-${idx}`}
                        type="button"
                        onClick={() => selectTransitCity(city)}
                        className="w-full text-left p-2 hover:bg-[#2e1d44] transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#f1e8d8] group-hover:text-[#f2ca50]">
                            {city.name}, {city.country}
                          </div>
                          <div className="text-[10px] font-mono text-[#a99dae]">
                            {Math.abs(city.latitude).toFixed(2)}°{city.latitude >= 0 ? 'N' : 'S'}, {Math.abs(city.longitude).toFixed(2)}°{city.longitude >= 0 ? 'E' : 'W'} · UTC{city.timezoneOffset >= 0 ? `+${city.timezoneOffset}` : city.timezoneOffset}
                          </div>
                        </div>
                        {vantageLocation.name === city.name && (
                          <span className="text-emerald-400 text-[10px] font-mono font-bold">✓ Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick 1-Tap City Badges & Active Verified Coordinates Pill */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[10px] font-mono">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[9px] text-[#a99dae] uppercase tracking-wider">Quick Pick:</span>
                <button
                  type="button"
                  onClick={() =>
                    selectTransitCity({
                      name: 'Toronto, ON',
                      country: 'Canada',
                      latitude: 43.6532,
                      longitude: -79.3832,
                      timezoneOffset: -5,
                      label: 'Toronto, ON, Canada',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#241738] hover:bg-[#382650] text-[#f2ca50] border border-[#d4af37]/30 transition-colors cursor-pointer"
                >
                  📍 Toronto, ON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectTransitCity({
                      name: 'Montreal, QC',
                      country: 'Canada',
                      latitude: 45.5017,
                      longitude: -73.5673,
                      timezoneOffset: -5,
                      label: 'Montreal, QC, Canada',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#241738] hover:bg-[#382650] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Montreal, QC
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectTransitCity({
                      name: 'Ottawa, ON',
                      country: 'Canada',
                      latitude: 45.4215,
                      longitude: -75.6972,
                      timezoneOffset: -5,
                      label: 'Ottawa, ON, Canada',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#241738] hover:bg-[#382650] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Ottawa, ON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectTransitCity({
                      name: 'Vancouver, BC',
                      country: 'Canada',
                      latitude: 49.2827,
                      longitude: -123.1207,
                      timezoneOffset: -8,
                      label: 'Vancouver, BC, Canada',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#241738] hover:bg-[#382650] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Vancouver, BC
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectTransitCity({
                      name: 'New York, NY',
                      country: 'USA',
                      latitude: 40.7128,
                      longitude: -74.006,
                      timezoneOffset: -5,
                      label: 'New York, NY, USA',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#241738] hover:bg-[#382650] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 New York, NY
                </button>
              </div>

              {/* Verified Vantage Coordinates Indicator */}
              <div className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>
                  Vantage: <strong className="text-white">{vantageLocation.name}</strong> ({Math.abs(vantageLocation.latitude).toFixed(2)}°{vantageLocation.latitude >= 0 ? 'N' : 'S'}, {Math.abs(vantageLocation.longitude).toFixed(2)}°{vantageLocation.longitude >= 0 ? 'E' : 'W'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGenerateHoroscope(transitDate, transitTime, vantageLocation)}
                className="py-1.5 px-4 rounded-lg bg-[#d4af37] hover:bg-[#e5c247] text-[#120c1c] font-bold text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Attuning to Current Sky...' : 'Cast Horoscope & Explain Transits'}
              </button>
              {reading && onSendToNatally && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrentSession()) return;
                    onSendToNatally(reading.title, reading.content, 'horoscope', reading);
                    onClose();
                  }}
                  className="py-1.5 px-3 rounded-lg bg-[#271c36] hover:bg-[#3b2752] border border-[#f2ca50]/50 text-[#f2ca50] font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Natally in Chat</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'synastry' && (
          <div className="p-3.5 rounded-xl bg-[#1c1428] border border-[#322641] space-y-3">
            <p className="font-mono text-xs text-[#f2a38c] font-semibold">
              Enter Partner Details for Inter-Chart Synastry:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="block font-mono text-[9px] text-[#a99dae] mb-1">Partner Name</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="talisman-input w-full rounded px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[9px] text-[#a99dae]">
                    Birth Date (YYYY-MM-DD)
                  </label>
                  {/* Calendar Picker Icon & Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (partnerDatePickerRef.current) {
                        try {
                          if (partnerDatePickerRef.current.showPicker) {
                            partnerDatePickerRef.current.showPicker();
                          } else {
                            partnerDatePickerRef.current.click();
                          }
                        } catch (_) {
                          partnerDatePickerRef.current.click();
                        }
                      }
                    }}
                    className="flex items-center gap-1 text-[9px] font-mono text-[#f2ca50] hover:text-white transition-colors cursor-pointer"
                    title="Open calendar date picker"
                  >
                    <Calendar className="w-3 h-3 text-[#f2ca50]" />
                    <span>Pick</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Year Input: Max 4 digits, begins with 19 or 20, auto-advances to month */}
                  <input
                    ref={partnerYearRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    maxLength={4}
                    value={partnerYear}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPartnerYear(val);
                      if (val.length === 4) {
                        const yNum = parseInt(val, 10);
                        if (val.startsWith('19') || val.startsWith('20') || (yNum >= 1800 && yNum <= 2100)) {
                          const newDate = `${val}-${partnerMonth.padStart(2, '0')}-${partnerDay.padStart(2, '0')}`;
                          setPartnerDate(newDate);
                          partnerMonthRef.current?.focus();
                          partnerMonthRef.current?.select();
                        }
                      } else if (val.length > 0) {
                        const newDate = `${val}-${partnerMonth.padStart(2, '0')}-${partnerDay.padStart(2, '0')}`;
                        setPartnerDate(newDate);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (/^\d$/.test(e.key) && partnerYear.length >= 4) {
                        e.preventDefault();
                        partnerMonthRef.current?.focus();
                        partnerMonthRef.current?.select();
                      }
                    }}
                    className="talisman-input w-16 text-center rounded px-1.5 py-1.5 text-xs font-mono"
                    title="Enter 4-digit Year (19xx or 20xx)"
                  />
                  <span className="text-[#a99dae] font-mono text-xs">-</span>

                  {/* Month Input: Max 2 digits (01-12), auto-advances to day */}
                  <input
                    ref={partnerMonthRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="MM"
                    maxLength={2}
                    value={partnerMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setPartnerMonth(val);
                      if (val.length === 2) {
                        const newDate = `${partnerYear.padStart(4, '0')}-${val}-${partnerDay.padStart(2, '0')}`;
                        setPartnerDate(newDate);
                        partnerDayRef.current?.focus();
                        partnerDayRef.current?.select();
                      } else if (val.length > 0) {
                        const newDate = `${partnerYear.padStart(4, '0')}-${val.padStart(2, '0')}-${partnerDay.padStart(2, '0')}`;
                        setPartnerDate(newDate);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !partnerMonth) {
                        partnerYearRef.current?.focus();
                      }
                    }}
                    className="talisman-input w-11 text-center rounded px-1 py-1.5 text-xs font-mono"
                    title="Enter 2-digit Month (01-12)"
                  />
                  <span className="text-[#a99dae] font-mono text-xs">-</span>

                  {/* Day Input: Max 2 digits (01-31) */}
                  <input
                    ref={partnerDayRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="DD"
                    maxLength={2}
                    value={partnerDay}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setPartnerDay(val);
                      const newDate = `${partnerYear.padStart(4, '0')}-${partnerMonth.padStart(2, '0')}-${val.padStart(2, '0')}`;
                      setPartnerDate(newDate);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !partnerDay) {
                        partnerMonthRef.current?.focus();
                      }
                    }}
                    className="talisman-input w-11 text-center rounded px-1 py-1.5 text-xs font-mono"
                    title="Enter 2-digit Day (01-31)"
                  />

                  {/* Hidden Calendar Picker for native picker integration */}
                  <input
                    ref={partnerDatePickerRef}
                    type="date"
                    value={partnerDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setPartnerDate(val);
                        const [y, m, d] = val.split('-');
                        if (y) setPartnerYear(y);
                        if (m) setPartnerMonth(m);
                        if (d) setPartnerDay(d);
                      }
                    }}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[9px] text-[#a99dae] mb-1">Birth Time</label>
                <input
                  type="time"
                  value={partnerTime}
                  onChange={(e) => setPartnerTime(e.target.value)}
                  className="talisman-input w-full rounded px-2 py-1.5 text-xs font-mono"
                />
              </div>

              {/* Partner Birthplace Location Picker-Filter */}
              <div className="relative" ref={partnerDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-mono text-[9px] text-[#a99dae]">
                    Partner Birthplace
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* Quick Button to use current location if available */}
                    {vantageLocation && (
                      <button
                        type="button"
                        onClick={() => selectPartnerCity(vantageLocation)}
                        className="text-[8.5px] font-mono text-[#f2ca50] hover:underline cursor-pointer"
                        title="Use your current living location"
                      >
                        📍 Use Current
                      </button>
                    )}
                    {partnerLocationLocked && (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#f2a38c] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={partnerPlaceQuery}
                    onFocus={() => {
                      setShowPartnerSuggestions(true);
                      if (partnerSuggestions.length === 0) {
                        setPartnerSuggestions(PRESET_CITIES.slice(0, 8));
                      }
                    }}
                    onChange={(e) => handlePartnerPlaceInput(e.target.value)}
                    placeholder="Search city or click 'Use Current'..."
                    className="talisman-input w-full rounded pl-7 pr-6 py-1.5 text-xs font-medium"
                    required
                  />
                  {isSearchingPartnerOnline ? (
                    <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  ) : (
                    <Search className="w-3 h-3 text-[#a99dae] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>

                {/* Partner Suggestions Dropdown */}
                {showPartnerSuggestions && partnerSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#180f24] border border-[#d4af37]/50 rounded-xl shadow-2xl max-h-44 overflow-y-auto divide-y divide-[#322641]">
                    {partnerSuggestions.map((city, idx) => (
                      <button
                        key={`partner-${city.name}-${idx}`}
                        type="button"
                        onClick={() => selectPartnerCity(city)}
                        className="w-full text-left p-2 hover:bg-[#2e1d44] transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#f1e8d8] group-hover:text-[#f2ca50]">
                            {city.name}, {city.country}
                          </div>
                          <div className="text-[10px] font-mono text-[#a99dae]">
                            {Math.abs(city.latitude).toFixed(2)}°{city.latitude >= 0 ? 'N' : 'S'}, {Math.abs(city.longitude).toFixed(2)}°{city.longitude >= 0 ? 'E' : 'W'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerateSynastry}
              className="py-1.5 px-4 rounded-lg bg-[#d4af37] text-[#120c1c] font-bold text-xs font-mono transition-all hover:bg-[#e5c247] cursor-pointer"
            >
              {isLoading ? 'Calculating Synastry Matrix...' : 'Generate Synastry Resonance Reading'}
            </button>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="space-y-3 p-3 rounded-xl bg-[#1c1428] border border-[#322641]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEntityType('planet')}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  entityType === 'planet' ? 'bg-[#271c36] text-[#f2ca50] border border-[#d4af37]/40' : 'text-[#a99dae]'
                }`}
              >
                Planets
              </button>
              <button
                type="button"
                onClick={() => setEntityType('house')}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  entityType === 'house' ? 'bg-[#271c36] text-[#9fb4ff] border border-[#9fb4ff]/40' : 'text-[#a99dae]'
                }`}
              >
                12 Houses
              </button>
              <button
                type="button"
                onClick={() => setEntityType('aspect')}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  entityType === 'aspect' ? 'bg-[#271c36] text-[#ff7a63] border border-[#ff7a63]/40' : 'text-[#a99dae]'
                }`}
              >
                Aspects
              </button>
            </div>

            {/* Quick Picker Buttons */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {entityType === 'planet' &&
                chart.natalBodies.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedEntityKey(b.name);
                      handleGenerateEntity('planet', b.name);
                    }}
                    className="px-2 py-1 rounded bg-[#271c36] hover:bg-[#342452] border border-[#322641] text-xs font-mono text-[#f1e8d8] flex items-center gap-1"
                  >
                    <span>{b.glyph}</span>
                    <span>{b.name}</span>
                  </button>
                ))}

              {entityType === 'house' &&
                chart.houseCusps.map((h) => (
                  <button
                    key={h.num}
                    type="button"
                    onClick={() => {
                      setSelectedEntityKey(`House ${h.num}`);
                      handleGenerateEntity('house', `House ${h.num}`);
                    }}
                    className="px-2 py-1 rounded bg-[#271c36] hover:bg-[#342452] border border-[#322641] text-xs font-mono text-[#f1e8d8]"
                  >
                    House {h.num} ({h.label})
                  </button>
                ))}

              {entityType === 'aspect' &&
                chart.aspectChords.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedEntityKey(a.name);
                      handleGenerateEntity('aspect', a.name);
                    }}
                    className="px-2 py-1 rounded bg-[#271c36] hover:bg-[#342452] border border-[#322641] text-xs font-mono text-[#f1e8d8]"
                  >
                    {a.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Reading Text Display */}
        <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[#140c20]/80 border border-[#322641] leading-relaxed text-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#f2ca50] gap-2 font-mono">
              <Sparkles className="w-6 h-6 animate-spin" />
              <span>Attuning to the celestial ephemeris sphere...</span>
            </div>
          ) : reading ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-cinzel text-base text-[#f2ca50] font-bold">
                    {reading.title}
                  </h4>
                  <p className="font-mono text-[11px] text-[#a99dae]">{reading.subtitle}</p>
                </div>
                {onSendToNatally && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCurrentSession()) return;
                      onSendToNatally(reading.title, reading.content, 'reading', reading);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#f2a38c] text-[#120c1c] font-cinzel font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Persist reading to Natally's conversation feed & read aloud"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    <span>Save to Natally &amp; Read Aloud</span>
                  </button>
                )}
              </div>
              <div className="font-sans text-[#f1e8d8] leading-relaxed">
                <RichText content={reading.content} />
              </div>
              <div className="border-t border-[#322641] pt-2 text-[10px] font-mono text-[#a99dae] flex items-center justify-between">
                <span>Generated: {reading.generatedAt} · Swiss Ephemeris Engine</span>
                <span className="text-[#f2ca50]">✦ Auto-persisted when shared to Natally</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 font-mono text-white/50">
              Select a reading option above to consult the celestial astrolabe oracle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
