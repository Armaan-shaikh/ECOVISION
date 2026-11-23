import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Compass, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  RefreshCw, 
  Globe, 
  X,
  Building,
  Navigation
} from 'lucide-react';
import { searchCities, fetchSavedCities } from '../../services/api';

const POPULAR_PRESETS = [
  { name: 'London', state: 'England', country: 'United Kingdom', country_code: 'GB', latitude: 51.50853, longitude: -0.12574, timezone: 'Europe/London' },
  { name: 'Tokyo', state: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { name: 'New York', state: 'New York', country: 'United States', country_code: 'US', latitude: 40.71427, longitude: -74.00597, timezone: 'America/New_York' },
  { name: 'Delhi', state: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.65195, longitude: 77.23149, timezone: 'Asia/Kolkata' },
  { name: 'Paris', state: 'Île-de-France', country: 'France', country_code: 'FR', latitude: 48.85341, longitude: 2.3488, timezone: 'Europe/Paris' },
  { name: 'Berlin', state: 'Berlin', country: 'Germany', country_code: 'DE', latitude: 52.52437, longitude: 13.41053, timezone: 'Europe/Berlin' }
];

function formatCoordinates(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { latStr: '--', lonStr: '--', formatted: '--' };
  }
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(lat).toFixed(4);
  const lonAbs = Math.abs(lon).toFixed(4);
  return {
    latStr: `${latAbs}° ${latDir}`,
    lonStr: `${lonAbs}° ${lonDir}`,
    formatted: `${latAbs}° ${latDir}, ${lonAbs}° ${lonDir}`
  };
}

export default function LocationSelectionModule({
  selectedCity,
  onSelectCity,
  savedCities = [],
  onRefreshSavedCities,
  onNavigateToModule,
  isSearchingData = false
}) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Local saved cities state for on-mount verification
  const [localSavedCities, setLocalSavedCities] = useState(savedCities);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // On mount: refresh saved cities from SQLite without calling telemetry APIs
  useEffect(() => {
    let isMounted = true;
    setLoadingSaved(true);
    fetchSavedCities()
      .then((cities) => {
        if (isMounted) {
          setLocalSavedCities(cities);
          if (onRefreshSavedCities) onRefreshSavedCities();
        }
      })
      .catch((err) => {
        console.warn('Failed to load saved cities on Module 02 mount:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSaved(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update local list when parent savedCities prop changes
  useEffect(() => {
    if (savedCities && savedCities.length > 0) {
      setLocalSavedCities(savedCities);
    }
  }, [savedCities]);

  // Execute city search with input validation
  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();

    // 1. Validation for empty input
    if (!trimmed) {
      setValidationError('Search query cannot be empty. Please enter a municipality name.');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // 2. Validation for minimum length
    if (trimmed.length < 2) {
      setValidationError('Search query must contain at least 2 characters for geocoding index lookup.');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Valid input: clear previous error and query API
    setValidationError('');
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchCities(trimmed);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Geocoding search failed:', err);
      setValidationError(err.message || 'Geocoding service error. Ensure backend API is online.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Handle selecting a city
  const handleSelect = (city) => {
    if (!city) return;
    onSelectCity(city);
    // Smoothly clear search query and results after selection
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setValidationError('');
  };

  const coords = formatCoordinates(selectedCity?.latitude, selectedCity?.longitude);
  const isCityValid = typeof selectedCity?.latitude === 'number' && typeof selectedCity?.longitude === 'number';

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE DESCRIPTION                                            */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-02
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 02
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Location Selection & Spatial Domain Specification
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              CRS: WGS-84 (EPSG:4326)
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Purpose & Scope:</strong> Module 02 serves as the 
            geographic parameterization gateway for the ECOVISION platform. Users designate the spatial domain 
            by querying global geocoding services, resolving municipal boundary coordinates (latitude, longitude, elevation), 
            and synchronizing target parameters across the analytical pipeline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Geocoding Resolution</span>
              <span className="text-[11px] text-slate-500">
                Open-Meteo Geocoding Index with sub-kilometer boundary resolution and IANA timezone resolution.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">Persistent Shared State</span>
              <span className="text-[11px] text-slate-500">
                Selected coordinates propagate automatically to all observation, analysis, and ML projection modules.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs">SQLite Registry</span>
              <span className="text-[11px] text-slate-500">
                Relational municipality catalog stores historical telemetry and observation metadata.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. CITY SEARCH                                                   */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              1. Municipal Search & Geocoding Query
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Open-Meteo Geocoding API (Limit: 7)
          </span>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="Search municipality worldwide (e.g., London, Tokyo, Berlin, Delhi)..."
                className={`w-full pl-10 pr-9 py-2.5 rounded border text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none transition-colors ${
                  validationError 
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200' 
                    : 'border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/20'
                }`}
                aria-label="Municipality Search Input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setValidationError('');
                    setHasSearched(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear Search Input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Municipality</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Feedback */}
          {validationError && (
            <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}
        </form>

        {/* Quick Select Preset Municipalities */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Preset Locations:</span>
          </span>
          {POPULAR_PRESETS.map((preset) => {
            const isSelected = selectedCity && selectedCity.name === preset.name && selectedCity.country === preset.country;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelect(preset)}
                disabled={isSearchingData}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 border-emerald-800 text-white font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset.name} ({preset.country_code})
              </button>
            );
          })}
        </div>

        {/* Geocoding Results Display */}
        {hasSearched && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Search Results ({searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'})
              </span>
              {searchResults.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Click any municipality to set as active target
                </span>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded max-h-72 overflow-y-auto">
                {searchResults.map((city, idx) => {
                  const isCurrent = selectedCity && 
                    typeof selectedCity.latitude === 'number' &&
                    Math.abs(selectedCity.latitude - city.latitude) < 0.01 &&
                    Math.abs(selectedCity.longitude - city.longitude) < 0.01;

                  return (
                    <div
                      key={`${city.name}-${city.latitude}-${idx}`}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                          <span className="font-bold text-slate-900 text-sm">{city.name}</span>
                          <span className="text-xs px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                            {city.country_code || city.country}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active Target
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {[city.state || city.admin1, city.country].filter(Boolean).join(', ')}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono pt-0.5">
                          <span>Lat: {city.latitude.toFixed(4)}°</span>
                          <span>•</span>
                          <span>Lon: {city.longitude.toFixed(4)}°</span>
                          {city.elevation !== undefined && (
                            <>
                              <span>•</span>
                              <span>Elev: {city.elevation} m</span>
                            </>
                          )}
                          <span>•</span>
                          <span>TZ: {city.timezone || 'auto'}</span>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleSelect(city)}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                          }`}
                        >
                          {isCurrent ? 'Current Selection' : 'Select Location'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center space-y-1">
                <p className="font-medium text-slate-700">No municipalities found matching &ldquo;{searchQuery}&rdquo;.</p>
                <p>Verify spelling or query a larger regional administrative district.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 3. SELECTED LOCATION DETAILS                                     */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              2. Selected Location Geographical Information
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold">
            Status: Active Domain
          </span>
        </div>

        {selectedCity ? (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center text-emerald-800 shadow-2xs">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                    {selectedCity.name}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    {[selectedCity.state, selectedCity.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="text-slate-500 block text-[11px]">WGS-84 Coordinates</span>
                <span className="text-slate-900 font-bold">{coords.formatted}</span>
              </div>
            </div>

            {/* Geographical Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Municipality Name</span>
                <p className="text-sm font-bold text-slate-900">{selectedCity.name}</p>
                <p className="text-[10px] text-slate-500">Primary Administrative Entity</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">State / Region</span>
                <p className="text-sm font-bold text-slate-900">{selectedCity.state || 'Not Specified'}</p>
                <p className="text-[10px] text-slate-500">Sub-national Division</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Country & ISO Code</span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedCity.country} {selectedCity.country_code ? `(${selectedCity.country_code})` : ''}
                </p>
                <p className="text-[10px] text-slate-500">Sovereign Jurisdiction</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Latitude (WGS-84)</span>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {typeof selectedCity.latitude === 'number' ? selectedCity.latitude.toFixed(5) : selectedCity.latitude}°
                </p>
                <p className="text-[10px] text-slate-500 font-mono">{coords.latStr}</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Longitude (WGS-84)</span>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {typeof selectedCity.longitude === 'number' ? selectedCity.longitude.toFixed(5) : selectedCity.longitude}°
                </p>
                <p className="text-[10px] text-slate-500 font-mono">{coords.lonStr}</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">IANA Timezone</span>
                <p className="text-sm font-bold text-slate-900 font-mono">{selectedCity.timezone || 'UTC'}</p>
                <p className="text-[10px] text-slate-500">Astronomical Temporal Reference</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">SQLite Database Cache</span>
                <div className="flex items-center space-x-1 pt-0.5">
                  <Database className="w-3.5 h-3.5 text-emerald-800" />
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedCity.stored_in_sqlite ? 'Persisted in SQLite' : 'Available in Session'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Relational Schema Binding</p>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-semibold text-slate-500">Spatial Integrity Check</span>
                <div className="flex items-center space-x-1 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-semibold text-emerald-900">
                    {isCityValid ? 'Coordinates Valid' : 'Invalid Coordinates'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Range: -90° to +90°, -180° to +180°</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            No municipality currently selected. Use the search field above or choose a preset location.
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 4. SAVED LOCATIONS (SQLite-Backed Database Records)               */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              3. SQLite Database: Saved Municipal Records
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-500">
              {localSavedCities.length} Recorded {localSavedCities.length === 1 ? 'Municipality' : 'Municipalities'}
            </span>
            <button
              type="button"
              onClick={() => {
                setLoadingSaved(true);
                fetchSavedCities()
                  .then((cities) => {
                    setLocalSavedCities(cities);
                    if (onRefreshSavedCities) onRefreshSavedCities();
                  })
                  .catch(() => {})
                  .finally(() => setLoadingSaved(false));
              }}
              disabled={loadingSaved}
              className="p-1.5 rounded hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              title="Refresh Saved Records from SQLite"
              aria-label="Refresh Saved Records from SQLite"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-800 ${loadingSaved ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {localSavedCities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {localSavedCities.map((c) => {
              const isSelected = selectedCity && (
                (selectedCity.id && selectedCity.id === c.id) ||
                (typeof selectedCity.latitude === 'number' &&
                 typeof selectedCity.longitude === 'number' &&
                 Math.abs(selectedCity.latitude - c.latitude) < 0.05 &&
                 Math.abs(selectedCity.longitude - c.longitude) < 0.05)
              );

              return (
                <button
                  key={c.id || `${c.name}-${c.latitude}`}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`p-3.5 rounded text-left border transition-all flex flex-col justify-between cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[80%]">
                        {c.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {[c.state, c.country].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span>
                      {c.last_aqi !== null && c.last_aqi !== undefined ? `AQI: ${c.last_aqi}` : 'Stored'}
                    </span>
                    {c.last_temperature !== null && c.last_temperature !== undefined && (
                      <span className="font-semibold text-slate-800">
                        {typeof c.last_temperature === 'number' ? c.last_temperature.toFixed(1) : c.last_temperature}°C
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center space-y-1">
            <p className="font-medium text-slate-700">No municipalities currently recorded in SQLite database.</p>
            <p>Search or select any municipality above to record its telemetry into the relational archive.</p>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. LOCATION SELECTION STATUS & NAVIGATION ACTIONS                */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              4. Spatial Domain Parameterization Status
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono">
            Pipeline Stage: Configured
          </span>
        </div>

        <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-bold text-slate-900">
                Spatial Domain Configured: {selectedCity?.name || 'None'}, {selectedCity?.country || ''}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Target municipality coordinates ({coords.formatted}) are locked into application state. 
              Switching modules preserves this location. Proceed to Module 03 to acquire real-time meteorological NWP and CAAQMS telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToModule('module-03')}
              className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Proceed to Module 03: Data Acquisition</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToModule('module-01')}
              className="px-3.5 py-2 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View in Dashboard (MOD-01)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
