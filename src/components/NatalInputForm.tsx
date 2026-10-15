import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { NatalChartInput } from '../services/ephemeris';
import {
  CityLocation,
  PRESET_CITIES,
  searchPlaceOnline,
  getPersistedVantageLocation,
  savePersistedVantageLocation,
} from '../services/locations';

interface NatalInputFormProps {
  accountUid: string;
  currentInput: NatalChartInput;
  onCalculate: (input: NatalChartInput) => void;
  isCalculating: boolean;
  embedded?: boolean;
}

export const NatalInputForm: React.FC<NatalInputFormProps> = ({
  accountUid,
  currentInput,
  onCalculate,
  isCalculating,
  embedded = false,
}) => {
  const [name, setName] = useState(currentInput.name);
  const [birthDate, setBirthDate] = useState(currentInput.birthDate);
  const [birthTime, setBirthTime] = useState(currentInput.birthTime);
  const [placeQuery, setPlaceQuery] = useState(currentInput.placeName);
  const [latitude, setLatitude] = useState(currentInput.latitude);
  const [longitude, setLongitude] = useState(currentInput.longitude);
  const [timezoneOffset, setTimezoneOffset] = useState(currentInput.timezoneOffset);
  const [houseSystem, setHouseSystem] = useState<NatalChartInput['houseSystem']>(
    currentInput.houseSystem || 'P'
  );

  const [suggestions, setSuggestions] = useState<CityLocation[]>(PRESET_CITIES.slice(0, 8));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [locationLocked, setLocationLocked] = useState(true);

  // Current Residence / Vantage Point state & persistence
  const savedVantage = getPersistedVantageLocation(accountUid);
  const [differentCurrentLocation, setDifferentCurrentLocation] = useState(
    Boolean(
      currentInput.currentLocationName &&
      currentInput.currentLocationName !== currentInput.placeName
    ) || Boolean(savedVantage && savedVantage.name !== currentInput.placeName)
  );
  const [currentPlaceQuery, setCurrentPlaceQuery] = useState(
    currentInput.currentLocationName ||
    (savedVantage ? (savedVantage.label || `${savedVantage.name}, ${savedVantage.country}`) : currentInput.placeName)
  );
  const [currentLat, setCurrentLat] = useState(
    currentInput.currentLatitude ?? (savedVantage ? savedVantage.latitude : currentInput.latitude)
  );
  const [currentLon, setCurrentLon] = useState(
    currentInput.currentLongitude ?? (savedVantage ? savedVantage.longitude : currentInput.longitude)
  );
  const [currentTz, setCurrentTz] = useState(
    currentInput.currentTimezoneOffset ?? (savedVantage ? savedVantage.timezoneOffset : currentInput.timezoneOffset)
  );
  const [currentSuggestions, setCurrentSuggestions] = useState<CityLocation[]>(PRESET_CITIES.slice(0, 8));
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);
  const [isSearchingCurrentOnline, setIsSearchingCurrentOnline] = useState(false);
  const [currentLocationLocked, setCurrentLocationLocked] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);
  const currentSearchTimeoutRef = useRef<any>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Validate and constrain date text entry (prevent 5-digit years, limit to 1900-2099)
  const handleDateChange = (val: string) => {
    if (!val) {
      setBirthDate('');
      return;
    }
    const parts = val.split('-');
    if (parts.length >= 1) {
      let y = parts[0];
      // Constrain year to at most 4 digits (prevent five-digit years typed by user)
      if (y.length > 4) {
        y = y.slice(0, 4);
      }
      // If 4 digits, validate starting with 19 or 20
      if (y.length === 4) {
        const num = parseInt(y, 10);
        if (num < 1900) y = '1900';
        else if (num > 2099) y = '2099';
      }
      parts[0] = y;
      val = parts.join('-');
    }
    setBirthDate(val);
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent typing a 5th digit into year field
    if (/^[0-9]$/.test(e.key) && birthDate) {
      const parts = birthDate.split('-');
      if (parts[0] && parts[0].length >= 4) {
        const target = e.target as HTMLInputElement;
        if (target.selectionStart !== null && target.selectionStart <= 4 && target.selectionStart === target.selectionEnd) {
          // If already 4 digits and user tries to add another number to year
          if (parts[0].length >= 4 && target.selectionStart === 4) {
            e.preventDefault();
          }
        }
      }
    }
  };

  // Human-readable date and time formatting to guarantee zero ambiguity
  const getReadableDateTime = () => {
    try {
      if (!birthDate) return null;
      const [y, m, d] = birthDate.split('-').map(Number);
      if (!y || !m || !d) return null;
      const dateObj = new Date(y, m - 1, d);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      const dateStr = dateObj.toLocaleDateString('en-US', options);

      let timeStr = birthTime;
      if (birthTime) {
        const [hh, mm] = birthTime.split(':').map(Number);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
        timeStr = `${h12}:${mmStr} ${ampm}`;
      }

      return { dateStr, timeStr };
    } catch (_) {
      return null;
    }
  };

  const readableDT = getReadableDateTime();

  useEffect(() => {
    setName(currentInput.name);
    setBirthDate(currentInput.birthDate);
    setBirthTime(currentInput.birthTime);
    setPlaceQuery(currentInput.placeName);
    setLatitude(currentInput.latitude);
    setLongitude(currentInput.longitude);
    setTimezoneOffset(currentInput.timezoneOffset);
    setHouseSystem(currentInput.houseSystem || 'P');
    setLocationLocked(true);
  }, [currentInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (currentDropdownRef.current && !currentDropdownRef.current.contains(e.target as Node)) {
        setShowCurrentSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlaceInput = (val: string) => {
    setPlaceQuery(val);
    setLocationLocked(false);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Instant local filter first
    const q = val.trim().toLowerCase();
    const localFiltered = PRESET_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.adminRegion && c.adminRegion.toLowerCase().includes(q))
    );
    if (localFiltered.length > 0) {
      setSuggestions(localFiltered);
    }

    // Debounced online lookup
    setIsSearchingOnline(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const matches = await searchPlaceOnline(val);
        setSuggestions(matches.length > 0 ? matches : localFiltered);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 200);
  };

  const handleCurrentPlaceInput = (val: string) => {
    setCurrentPlaceQuery(val);
    setCurrentLocationLocked(false);
    setShowCurrentSuggestions(true);

    if (currentSearchTimeoutRef.current) {
      clearTimeout(currentSearchTimeoutRef.current);
    }

    const q = val.trim().toLowerCase();
    const localFiltered = PRESET_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.adminRegion && c.adminRegion.toLowerCase().includes(q))
    );
    if (localFiltered.length > 0) {
      setCurrentSuggestions(localFiltered);
    }

    setIsSearchingCurrentOnline(true);
    currentSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const matches = await searchPlaceOnline(val);
        setCurrentSuggestions(matches.length > 0 ? matches : localFiltered);
      } finally {
        setIsSearchingCurrentOnline(false);
      }
    }, 200);
  };

  const selectCity = (city: CityLocation) => {
    const formattedPlace = `${city.name}, ${city.country}`;
    setPlaceQuery(formattedPlace);
    setLatitude(city.latitude);
    setLongitude(city.longitude);
    setTimezoneOffset(city.timezoneOffset);
    setLocationLocked(true);
    setShowSuggestions(false);

    if (!differentCurrentLocation) {
      setCurrentPlaceQuery(formattedPlace);
      setCurrentLat(city.latitude);
      setCurrentLon(city.longitude);
      setCurrentTz(city.timezoneOffset);
      setCurrentLocationLocked(true);
      savePersistedVantageLocation(city, accountUid);
    }

    onCalculate({
      name: name.trim() || 'Native',
      birthDate,
      birthTime,
      placeName: formattedPlace,
      latitude: city.latitude,
      longitude: city.longitude,
      timezoneOffset: city.timezoneOffset,
      houseSystem,
      currentLocationName: !differentCurrentLocation ? formattedPlace : currentPlaceQuery,
      currentLatitude: !differentCurrentLocation ? city.latitude : currentLat,
      currentLongitude: !differentCurrentLocation ? city.longitude : currentLon,
      currentTimezoneOffset: !differentCurrentLocation ? city.timezoneOffset : currentTz,
    });
  };

  const selectCurrentCity = (city: CityLocation) => {
    const formattedPlace = `${city.name}, ${city.country}`;
    setCurrentPlaceQuery(formattedPlace);
    setCurrentLat(city.latitude);
    setCurrentLon(city.longitude);
    setCurrentTz(city.timezoneOffset);
    setCurrentLocationLocked(true);
    setShowCurrentSuggestions(false);
    savePersistedVantageLocation(city, accountUid);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setShowCurrentSuggestions(false);

    const finalCurrentLocationName = differentCurrentLocation
      ? currentPlaceQuery.trim() || placeQuery.trim()
      : placeQuery.trim();
    const finalCurrentLat = differentCurrentLocation ? Number(currentLat) || latitude : latitude;
    const finalCurrentLon = differentCurrentLocation ? Number(currentLon) || longitude : longitude;
    const finalCurrentTz = differentCurrentLocation ? Number(currentTz) || timezoneOffset : timezoneOffset;

    savePersistedVantageLocation({
      name: finalCurrentLocationName,
      country: '',
      latitude: finalCurrentLat,
      longitude: finalCurrentLon,
      timezoneOffset: finalCurrentTz,
      label: finalCurrentLocationName,
    }, accountUid);

    onCalculate({
      name: name.trim() || 'Native',
      birthDate,
      birthTime,
      placeName: placeQuery.trim() || 'Alexandria, ON, Canada',
      latitude: Number(latitude) || 45.3117,
      longitude: Number(longitude) || -74.6322,
      timezoneOffset: Number(timezoneOffset) || -5,
      houseSystem,
      currentLocationName: finalCurrentLocationName,
      currentLatitude: finalCurrentLat,
      currentLongitude: finalCurrentLon,
      currentTimezoneOffset: finalCurrentTz,
    });
  };


  const formBody = (
    <div className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Native Name */}
            <div>
              <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                Native Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#a99dae] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Robin L. M. Cheung"
                  className="talisman-input w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Birth Date & Time Pickers */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                    Birth Date
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const el = dateInputRef.current as any;
                        if (el) {
                          try {
                            if (typeof el.showPicker === 'function') {
                              el.showPicker();
                            } else {
                              el.focus();
                            }
                          } catch (_) {
                            el.focus();
                          }
                        }
                      }}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-[#2d1e42] hover:bg-[#432a63] border border-[#d4af37]/40 text-[#f2ca50] hover:text-white transition-all cursor-pointer shadow-sm z-10"
                      title="Click to open calendar date picker"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={birthDate}
                      min="1900-01-01"
                      max="2099-12-31"
                      onChange={(e) => handleDateChange(e.target.value)}
                      onKeyDown={handleDateKeyDown}
                      className="talisman-input w-full rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                    Birth Time
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const el = timeInputRef.current as any;
                        if (el) {
                          try {
                            if (typeof el.showPicker === 'function') {
                              el.showPicker();
                            } else {
                              el.focus();
                            }
                          } catch (_) {
                            el.focus();
                          }
                        }
                      }}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-[#2d1e42] hover:bg-[#432a63] border border-[#d4af37]/40 text-[#f2ca50] hover:text-white transition-all cursor-pointer shadow-sm z-10"
                      title="Click to open clock time picker"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={timeInputRef}
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className="talisman-input w-full rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Crystal clear unambiguous date & time verification */}
              {readableDT && (
                <div className="flex items-center justify-between text-[10px] font-mono text-[#f2ca50] bg-[#231538]/80 px-2 py-1 rounded-md border border-[#d4af37]/30">
                  <span className="font-semibold">📅 {readableDT.dateStr}</span>
                  <span className="text-[#c7bcce]">🕒 {readableDT.timeStr}</span>
                </div>
              )}
            </div>

            {/* Birthplace Autocomplete & Locked Status */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[10px] text-[#a99dae] flex items-center gap-1.5">
                  <span>Birthplace (Search or Quick-Select)</span>
                  {locationLocked && (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
                  className="font-mono text-[10px] text-[#9fb4ff] hover:underline cursor-pointer"
                >
                  {showAdvancedCoords ? 'Hide Lat/Lon' : 'Edit Lat/Lon'}
                </button>
              </div>

              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#f2a38c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={placeQuery}
                  onFocus={() => {
                    setShowSuggestions(true);
                    if (suggestions.length === 0) {
                      setSuggestions(PRESET_CITIES.slice(0, 8));
                    }
                  }}
                  onChange={(e) => handlePlaceInput(e.target.value)}
                  placeholder="Search city (e.g. Alexandria, ON)..."
                  className="talisman-input w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-medium"
                  required
                />
                {isSearchingOnline ? (
                  <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Search className="w-3 h-3 text-[#a99dae] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {/* Quick Canadian Location Badges for 1-Tap Confirmation */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() =>
                    selectCity({
                      name: 'Alexandria, ON',
                      country: 'Canada',
                      latitude: 45.3117,
                      longitude: -74.6322,
                      timezoneOffset: -5,
                      label: 'Alexandria, ON, Canada (North Glengarry · 45.31°N, 74.63°W)',
                    })
                  }
                  className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#2a1d3b] hover:bg-[#382650] text-[#f2ca50] border border-[#d4af37]/30 transition-colors cursor-pointer"
                >
                  📍 Alexandria, ON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectCity({
                      name: 'Ottawa, ON',
                      country: 'Canada',
                      latitude: 45.4215,
                      longitude: -75.6972,
                      timezoneOffset: -5,
                      label: 'Ottawa, ON, Canada',
                    })
                  }
                  className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#1a1226] hover:bg-[#2a1d3b] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Ottawa, ON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectCity({
                      name: 'Montreal, QC',
                      country: 'Canada',
                      latitude: 45.5017,
                      longitude: -73.5673,
                      timezoneOffset: -5,
                      label: 'Montreal, QC, Canada',
                    })
                  }
                  className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#1a1226] hover:bg-[#2a1d3b] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Montreal, QC
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectCity({
                      name: 'Toronto, ON',
                      country: 'Canada',
                      latitude: 43.6532,
                      longitude: -79.3832,
                      timezoneOffset: -5,
                      label: 'Toronto, ON, Canada',
                    })
                  }
                  className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#1a1226] hover:bg-[#2a1d3b] text-[#c7bcce] border border-white/10 transition-colors cursor-pointer"
                >
                  📍 Toronto, ON
                </button>
              </div>

              {/* Coordinates & Timezone readout */}
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[#a99dae]">
                <span>
                  {Math.abs(latitude).toFixed(2)}°{latitude >= 0 ? 'N' : 'S'} ·{' '}
                  {Math.abs(longitude).toFixed(2)}°{longitude >= 0 ? 'E' : 'W'}
                </span>
                <span>
                  UTC{timezoneOffset >= 0 ? `+${timezoneOffset}` : timezoneOffset}
                </span>
              </div>

              {/* City Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-16 mt-1 bg-[#1c1428] border border-[#d4af37]/60 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-[#322641]">
                  <div className="px-2.5 py-1 text-[9px] font-mono text-[#d4af37] bg-[#241738]/90 flex justify-between">
                    <span>MATCHING LOCATIONS</span>
                    <span>CLICK TO LOCK</span>
                  </div>
                  {suggestions.map((c, idx) => (
                    <button
                      key={`${c.name}-${idx}`}
                      type="button"
                      onClick={() => selectCity(c)}
                      className="w-full text-left px-3 py-2 hover:bg-[#2a1d3d] transition-colors flex flex-col cursor-pointer"
                    >
                      <span className="text-xs text-[#f1e8d8] font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#f2a38c] shrink-0" />
                        <span>{c.label || `${c.name}, ${c.country}`}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#a99dae] pl-4">
                        {Math.abs(c.latitude).toFixed(2)}°{c.latitude >= 0 ? 'N' : 'S'},{' '}
                        {Math.abs(c.longitude).toFixed(2)}°{c.longitude >= 0 ? 'E' : 'W'} · UTC
                        {c.timezoneOffset >= 0 ? `+${c.timezoneOffset}` : c.timezoneOffset}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Lat/Lon/Timezone Fields */}
            {showAdvancedCoords && (
              <div className="p-2.5 rounded-lg bg-[#271c36]/90 border border-[#322641] space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block font-mono text-[9px] text-[#a99dae] mb-0.5">
                      Lat (°N/S)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="talisman-input w-full rounded px-2 py-1 text-[11px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-[#a99dae] mb-0.5">
                      Lon (°E/W)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="talisman-input w-full rounded px-2 py-1 text-[11px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-[#a99dae] mb-0.5">
                      UTC Offset
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={timezoneOffset}
                      onChange={(e) => setTimezoneOffset(parseFloat(e.target.value) || 0)}
                      className="talisman-input w-full rounded px-2 py-1 text-[11px] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-[#a99dae] mb-0.5">
                    House System
                  </label>
                  <select
                    value={houseSystem}
                    onChange={(e) =>
                      setHouseSystem(e.target.value as NatalChartInput['houseSystem'])
                    }
                    className="talisman-input w-full rounded px-2 py-1 text-[11px] font-mono cursor-pointer"
                  >
                    <option value="P">Placidus (Standard)</option>
                    <option value="W">Whole Sign (Hellenistic)</option>
                    <option value="K">Koch (Central Europe)</option>
                    <option value="R">Regiomontanus (Classical)</option>
                    <option value="E">Equal Houses (Equal 30°)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Current Living Residence / Vantage Point for Transit Sky */}
            <div className="pt-2 border-t border-[#322641]/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#f2ca50] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f2ca50]" />
                  <span>Current Living Location (Vantage Point)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDifferentCurrentLocation(!differentCurrentLocation)}
                  className="text-[9.5px] font-mono text-[#9fb4ff] hover:underline cursor-pointer"
                >
                  {differentCurrentLocation ? '✓ Same as Birthplace' : '+ Different from Birthplace'}
                </button>
              </div>

              {differentCurrentLocation ? (
                <div className="p-2 rounded-lg bg-[#1a1226] border border-[#d4af37]/35 space-y-2 relative" ref={currentDropdownRef}>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#a99dae]">
                    <span>Living residence for transit celestial vantage:</span>
                    {currentLocationLocked && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#f2a38c] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={currentPlaceQuery}
                      onFocus={() => {
                        setShowCurrentSuggestions(true);
                        if (currentSuggestions.length === 0) {
                          setCurrentSuggestions(PRESET_CITIES.slice(0, 8));
                        }
                      }}
                      onChange={(e) => handleCurrentPlaceInput(e.target.value)}
                      placeholder="Search current city (e.g. Ottawa, ON)..."
                      className="talisman-input w-full rounded pl-7 pr-6 py-1 text-xs font-medium"
                      required
                    />
                    {isSearchingCurrentOnline ? (
                      <span className="w-3 h-3 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : (
                      <Search className="w-3 h-3 text-[#a99dae] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>

                  {/* Quick badges for fast 1-tap confirmation */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: 'Alexandria, ON', country: 'Canada', latitude: 45.3117, longitude: -74.6322, timezoneOffset: -5, label: 'Alexandria, ON, Canada' },
                      { name: 'Ottawa, ON', country: 'Canada', latitude: 45.4215, longitude: -75.6972, timezoneOffset: -5, label: 'Ottawa, ON, Canada' },
                      { name: 'Montreal, QC', country: 'Canada', latitude: 45.5017, longitude: -73.5673, timezoneOffset: -5, label: 'Montreal, QC, Canada' },
                      { name: 'Toronto, ON', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezoneOffset: -5, label: 'Toronto, ON, Canada' },
                    ].map((city) => (
                      <button
                        key={`cur-badge-${city.name}`}
                        type="button"
                        onClick={() => selectCurrentCity(city)}
                        className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-[#27193b] hover:bg-[#382354] text-[#f1e8d8] border border-[#d4af37]/25 transition-colors cursor-pointer"
                      >
                        📍 {city.name}
                      </button>
                    ))}
                  </div>

                  {/* Coordinates & Timezone readout */}
                  <div className="flex items-center justify-between font-mono text-[9px] text-[#a99dae]">
                    <span>
                      {Math.abs(currentLat).toFixed(2)}°{currentLat >= 0 ? 'N' : 'S'} ·{' '}
                      {Math.abs(currentLon).toFixed(2)}°{currentLon >= 0 ? 'E' : 'W'}
                    </span>
                    <span>
                      UTC{currentTz >= 0 ? `+${currentTz}` : currentTz}
                    </span>
                  </div>

                  {/* Suggestions dropdown */}
                  {showCurrentSuggestions && currentSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-14 mt-1 bg-[#1c1428] border border-[#d4af37]/60 rounded-xl shadow-2xl z-50 max-h-44 overflow-y-auto divide-y divide-[#322641]">
                      {currentSuggestions.map((c, idx) => (
                        <button
                          key={`cur-sug-${c.name}-${idx}`}
                          type="button"
                          onClick={() => selectCurrentCity(c)}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-[#2a1d3d] transition-colors flex flex-col cursor-pointer"
                        >
                          <span className="text-xs text-[#f1e8d8] font-semibold flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-[#f2a38c] shrink-0" />
                            <span>{c.label || `${c.name}, ${c.country}`}</span>
                          </span>
                          <span className="font-mono text-[9px] text-[#a99dae] pl-4">
                            {Math.abs(c.latitude).toFixed(2)}°{c.latitude >= 0 ? 'N' : 'S'},{' '}
                            {Math.abs(c.longitude).toFixed(2)}°{c.longitude >= 0 ? 'E' : 'W'} · UTC
                            {c.timezoneOffset >= 0 ? `+${c.timezoneOffset}` : c.timezoneOffset}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2 py-1 rounded bg-[#181022] border border-[#322641] text-[9.5px] font-mono text-[#a99dae] flex items-center justify-between">
                  <span>Using birthplace as vantage ({placeQuery.split(',')[0] || placeQuery})</span>
                  <span className="text-emerald-400 text-[8.5px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Persisted
                  </span>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <button
              type="submit"
              disabled={isCalculating}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#f2ca50] to-[#f2a38c] text-[#120c1c] font-cinzel font-bold text-xs tracking-wider uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <Compass className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating Ephemeris...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>Recalculate 3D Astrolabe</span>
                </>
              )}
            </button>
          </form>
    </div>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <div className="celestial-panel rounded-xl overflow-hidden shadow-2xl transition-all duration-300 pointer-events-auto">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#1f152e]/90 border-b border-[#322641] cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          <h2 className="text-xs font-cinzel font-bold text-[#f2ca50] tracking-wider uppercase">
            Natal Parameters
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {locationLocked && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
              <Lock className="w-2.5 h-2.5" />
              Locked
            </span>
          )}
          <button
            type="button"
            className="text-[#a99dae] hover:text-[#f1e8d8] p-1 transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5">
          {formBody}
        </div>
      )}
    </div>
  );
};
