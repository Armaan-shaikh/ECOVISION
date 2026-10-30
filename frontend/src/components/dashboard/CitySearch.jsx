import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Globe } from 'lucide-react';
import { searchCities } from '../../services/api';

const POPULAR_PRESETS = [
  { name: 'London', state: 'England', country: 'United Kingdom', country_code: 'GB', latitude: 51.50853, longitude: -0.12574, timezone: 'Europe/London' },
  { name: 'Tokyo', state: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { name: 'New York', state: 'New York', country: 'United States', country_code: 'US', latitude: 40.71427, longitude: -74.00597, timezone: 'America/New_York' },
  { name: 'Delhi', state: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.65195, longitude: 77.23149, timezone: 'Asia/Kolkata' },
  { name: 'Paris', state: 'Île-de-France', country: 'France', country_code: 'FR', latitude: 48.85341, longitude: 2.3488, timezone: 'Europe/Paris' },
];

export default function CitySearch({ onSelectCity, currentCity, isSearchingData }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const matches = await searchCities(query);
        setResults(matches);
        setIsOpen(true);
      } catch (err) {
        console.error('Geocoding search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelectCity(city);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full space-y-3 relative z-30" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-emerald-400/60 pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            placeholder="Search city worldwide (e.g. London, Tokyo, Berlin, Delhi)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#091b13]/80 border border-emerald-500/20 text-emerald-100 placeholder-emerald-400/40 text-sm focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 transition-colors shadow-inner"
          />

          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              className="absolute right-3 p-0.5 rounded-md text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-900/40"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl eco-popover overflow-hidden z-50 divide-y divide-emerald-950/80 shadow-2xl border border-emerald-500/30 animate-in fade-in duration-150">
            <div className="px-3.5 py-2 bg-[#06170f]/95 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70 flex items-center justify-between border-b border-emerald-950/80">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Matching Municipalities ({results.length})</span>
              </span>
              <span className="text-[9px] font-mono text-emerald-500/50">Open-Meteo Geocoding</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-emerald-950/50">
              {results.map((city, idx) => (
                <button
                  key={`${city.name}-${city.latitude}-${idx}`}
                  onClick={() => handleSelect(city)}
                  disabled={isSearchingData}
                  className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-emerald-900/40 transition-colors text-xs text-emerald-100 group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-400/70 group-hover:text-emerald-300 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-white group-hover:text-emerald-200">{city.name}</span>
                      <span className="text-emerald-400/60 ml-1.5 font-normal">
                        {[city.state, city.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/50 flex-shrink-0 ml-3">
                    {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && !isSearching && (
          <div className="absolute left-0 right-0 top-full mt-1.5 p-3 rounded-xl eco-popover z-50 text-xs text-emerald-400/70 text-center shadow-xl border border-emerald-500/20">
            No city matches found for "{query}". Check spelling and retry.
          </div>
        )}
      </div>

      {/* Quick preset pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-emerald-400/70">
        <span className="flex items-center space-x-1 text-[11px] uppercase tracking-wider font-semibold text-emerald-500/80 mr-1 flex-shrink-0">
          <Globe className="w-3 h-3" />
          <span>Quick Select:</span>
        </span>
        {POPULAR_PRESETS.map((preset) => {
          const isSelected = currentCity && currentCity.name === preset.name && currentCity.country === preset.country;
          return (
            <button
              key={preset.name}
              onClick={() => handleSelect(preset)}
              disabled={isSearchingData}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-900/50 border-emerald-400/50 text-white shadow-sm'
                  : 'bg-[#091b13]/50 border-emerald-950/90 text-emerald-300/80 hover:text-white hover:bg-emerald-900/30 hover:border-emerald-700/40'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

