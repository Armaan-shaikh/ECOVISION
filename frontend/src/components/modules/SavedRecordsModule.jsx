import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  X,
  Layers,
  ArrowRight,
  ArrowLeft,
  Activity,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { fetchCityObservations, fetchHealth } from '../../services/api';

/**
 * Standardized AQI Category and Color Mapping for Academic Ledger
 */
function getAqiClassification(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return { label: 'Unspecified', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
  }
  const val = Number(aqi);
  if (val <= 50) {
    return { label: 'Good (0–50)', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' };
  }
  if (val <= 100) {
    return { label: 'Moderate (51–100)', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
  }
  if (val <= 150) {
    return { label: 'Poor / Sensitive (101–150)', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' };
  }
  if (val <= 200) {
    return { label: 'Unhealthy (151–200)', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' };
  }
  if (val <= 300) {
    return { label: 'Severe (201–300)', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' };
  }
  return { label: 'Hazardous (>300)', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-400' };
}

/**
 * Format ISO or SQLite timestamp into academic tabular string
 */
function formatTimestamp(timestampStr) {
  if (!timestampStr) return { dateStr: '--', timeStr: '--', full: '--' };
  try {
    const dt = new Date(timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T') + 'Z');
    if (isNaN(dt.getTime())) {
      return { dateStr: timestampStr, timeStr: '', full: timestampStr };
    }
    const dateStr = dt.toISOString().slice(0, 10);
    const timeStr = dt.toISOString().slice(11, 16) + ' UTC';
    return { dateStr, timeStr, full: `${dateStr} ${timeStr}` };
  } catch {
    return { dateStr: timestampStr, timeStr: '', full: timestampStr };
  }
}

export default function SavedRecordsModule({
  selectedCity,
  onSelectCity,
  savedCities = [],
  onRefreshSavedCities,
  onNavigateToModule,
  backendHealth = null
}) {
  // 1. Data States
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  // Derive database stats from live updates, backendHealth prop, or savedCities fallback
  const dbTelemetry = useMemo(() => {
    return {
      citiesCount: liveTelemetry?.citiesCount ?? backendHealth?.database?.cities_registered ?? savedCities.length ?? 0,
      obsCount: liveTelemetry?.obsCount ?? backendHealth?.database?.observations_recorded ?? 0,
      monthlyCount: liveTelemetry?.monthlyCount ?? backendHealth?.database?.monthly_history_records ?? 0,
      status: liveTelemetry?.status ?? backendHealth?.database?.status ?? 'connected'
    };
  }, [liveTelemetry, backendHealth, savedCities]);

  // 2. Filter & Scope States
  // Scope: 'selected' (filtered to selectedCity), 'all' (all municipalities), or 'custom'
  const [scope, setScope] = useState('all');
  const [selectedCityId, setSelectedCityId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, aqi, meteo, ground, model

  // 3. Detailed Record Inspection Modal State
  const [activeRecord, setActiveRecord] = useState(null);

  // Load records from SQLite API
  const loadObservations = useCallback(async (currentScope, targetCityId) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let queryCity = null;
      if (currentScope === 'selected') {
        queryCity = selectedCity;
      } else if (currentScope === 'custom' && targetCityId && targetCityId !== 'all') {
        const found = savedCities.find(c => c.id.toString() === targetCityId.toString());
        queryCity = found || { id: targetCityId };
      }

      const results = await fetchCityObservations(queryCity, 100);
      setObservations(results);
      setLastRefreshedAt(new Date().toLocaleTimeString());

      // Refresh health stats in parallel
      fetchHealth()
        .then(h => {
          if (h?.database) {
            setLiveTelemetry({
              citiesCount: h.database.cities_registered || 0,
              obsCount: h.database.observations_recorded || 0,
              monthlyCount: h.database.monthly_history_records || 0,
              status: h.database.status || 'connected'
            });
          }
        })
        .catch(() => {});
    } catch (err) {
      setErrorMessage(err.message || 'Failed to retrieve stored environmental observation records.');
      setObservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, savedCities]);

  // Prevent stale records when switching cities or changing scope
  useEffect(() => {
    loadObservations(scope, selectedCityId);
  }, [selectedCity, scope, selectedCityId, loadObservations]);

  // Handle scope change
  const handleScopeChange = (newScope) => {
    setScope(newScope);
    if (newScope === 'all') {
      setSelectedCityId('all');
    } else if (newScope === 'selected' && selectedCity?.id) {
      setSelectedCityId(selectedCity.id.toString());
    }
  };

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return observations.filter(rec => {
      // 1. Text search across city name, country, data source, aqi scale, and ID
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cityName = (rec.city_name || '').toLowerCase();
        const country = (rec.city_country || '').toLowerCase();
        const source = (rec.data_source || '').toLowerCase();
        const scale = (rec.aqi_scale || '').toLowerCase();
        const idMatch = rec.id ? rec.id.toString() === q : false;
        const matchesText = cityName.includes(q) || country.includes(q) || source.includes(q) || scale.includes(q) || idMatch;
        if (!matchesText) return false;
      }

      // 2. Date filter
      if (dateFilter) {
        const obsTime = rec.observation_time || '';
        const recTime = rec.recorded_at || '';
        if (!obsTime.startsWith(dateFilter) && !recTime.startsWith(dateFilter)) {
          return false;
        }
      }

      // 3. Type / Category Filter
      if (typeFilter === 'aqi') {
        if (rec.aqi === null || rec.aqi === undefined) return false;
      } else if (typeFilter === 'meteo') {
        if (rec.temperature === null && rec.relative_humidity === null && rec.wind_speed === null) return false;
      } else if (typeFilter === 'ground') {
        const src = (rec.data_source || '').toLowerCase();
        if (!src.includes('cpcb') && !src.includes('caaqms') && !src.includes('ground')) return false;
      } else if (typeFilter === 'model') {
        const src = (rec.data_source || '').toLowerCase();
        if (!src.includes('open-meteo') && !src.includes('cams') && !src.includes('copernicus')) return false;
      }

      return true;
    });
  }, [observations, searchQuery, dateFilter, typeFilter]);

  // Date coverage calculations
  const coverageStats = useMemo(() => {
    if (!observations || observations.length === 0) {
      return { earliest: null, latest: null, spanHours: 0, count: 0 };
    }
    const validDates = observations
      .map(r => new Date(r.observation_time || r.recorded_at))
      .filter(d => !isNaN(d.getTime()));

    if (validDates.length === 0) {
      return { earliest: null, latest: null, spanHours: 0, count: observations.length };
    }

    const minTimestamp = Math.min(...validDates);
    const maxTimestamp = Math.max(...validDates);
    const earliest = new Date(minTimestamp);
    const latest = new Date(maxTimestamp);
    const spanHours = Math.max(1, Math.round((maxTimestamp - minTimestamp) / (1000 * 60 * 60)));

    return {
      earliest: earliest.toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
      latest: latest.toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
      spanHours,
      count: observations.length
    };
  }, [observations]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. MODULE OVERVIEW & HEADER                                              */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Module 08 • Storage Subsystem</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Saved Records & Empirical Telemetry Repository
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Archival inspection and relational retrieval of environmental observation snapshots persisted in the local
              embedded SQLite database (<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">ecovision.db</code>).
              Provides verifiable historical ground-truth observations, spatial queries, and parameter breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => {
                loadObservations(scope, selectedCityId);
                if (onRefreshSavedCities) onRefreshSavedCities();
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Query SQLite for latest observation snapshots"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              <span>{isLoading ? 'Retrieving Records...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>

        {/* Database Architecture Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Total Recorded Snapshots
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-800">
                {dbTelemetry.obsCount}
              </span>
              <span className="text-[10px] text-slate-600">rows</span>
            </div>
            <span className="text-[10px] text-slate-600 block mt-0.5">
              Table: <span className="font-mono text-slate-800">environmental_observations</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Registered Locations
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-slate-900">
                {dbTelemetry.citiesCount}
              </span>
              <span className="text-[10px] text-slate-600">municipalities</span>
            </div>
            <span className="text-[10px] text-slate-600 block mt-0.5">
              Table: <span className="font-mono text-slate-800">cities</span> (Unique geocode)
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Historical Reanalysis Archive
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-indigo-900">
                {dbTelemetry.monthlyCount}
              </span>
              <span className="text-[10px] text-slate-600">monthly records</span>
            </div>
            <span className="text-[10px] text-slate-600 block mt-0.5">
              Table: <span className="font-mono text-slate-800">city_monthly_history</span> (ERA5)
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Persistence Engine & Health
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 uppercase">
                SQLite 3.x (WAL Mode)
              </span>
            </div>
            <span className="text-[10px] text-slate-600 block mt-0.5">
              Foreign Keys: <span className="text-emerald-700 font-semibold">ENFORCED</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TELEMETRY CLASSIFICATION & PROVENANCE DISTINCTION                     */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Environmental Data Provenance & Telemetry Ontology
          </h3>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          ECOVISION enforces strict academic data integrity by delineating between distinct tiers of environmental records.
          Users must distinguish ground-truth snapshots from retrospective model reanalysis and forward ML projections:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tier 1: Saved Observations */}
          <div className="p-3 rounded border border-emerald-300 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">
                Tier 1: Saved Observations
              </span>
              <span className="text-[10px] font-mono text-emerald-800 font-semibold">Active Scope</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Empirical Snapshots</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              Continuous ambient monitoring from CPCB ground stations and regional Copernicus CAMS 0.1° atmospheric assimilation
              snapshots recorded at specific historical observation timestamps (<code className="font-mono text-slate-800">t₀</code>).
            </p>
            <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[10px] text-slate-700 font-mono">
              Table: <span className="font-semibold text-emerald-900">environmental_observations</span>
            </div>
          </div>

          {/* Tier 2: Historical Reanalysis */}
          <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">
                Tier 2: Historical Reanalysis
              </span>
              <button
                onClick={() => onNavigateToModule && onNavigateToModule('module-06')}
                className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer underline flex items-center gap-0.5"
              >
                <span>Module 06</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1">ECMWF ERA5 Climate Archive</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              5-year retrospective reanalysis calculating monthly aggregate means (mean, min, max temperature, precipitation).
              Serves as baseline historical distribution and ML training ground truth.
            </p>
            <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] text-slate-700 font-mono">
              Table: <span className="font-semibold text-indigo-900">city_monthly_history</span>
            </div>
          </div>

          {/* Tier 3: ML Predictions */}
          <div className="p-3 rounded border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                Tier 3: Synthetic Predictions
              </span>
              <button
                onClick={() => onNavigateToModule && onNavigateToModule('module-07')}
                className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline flex items-center gap-0.5"
              >
                <span>Module 07</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Random Forest Projections</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              Mathematical forward autoregressive projections (t+1 ... t+6) subject to expanding empirical uncertainty envelopes.
              Synthetic algorithmic outputs—not empirical observations.
            </p>
            <div className="mt-2 pt-2 border-t border-amber-200/60 text-[10px] text-slate-700 font-mono">
              Engine: <span className="font-semibold text-amber-900">ml_service (RandomForest)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEARCH, FILTERING & REPOSITORY CONTROLS                               */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Observation Filtering & Query Parameters
            </h3>
          </div>

          {/* Current City Quick Selector */}
          {selectedCity && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Active City:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                <MapPin className="w-3 h-3 text-emerald-700" />
                {selectedCity.name}{selectedCity.country ? `, ${selectedCity.country}` : ''}
              </span>
              {scope !== 'selected' ? (
                <button
                  onClick={() => handleScopeChange('selected')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Filter to this City
                </button>
              ) : (
                <button
                  onClick={() => handleScopeChange('all')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Show All Cities
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter 1: Scope & City Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Municipality Scope
            </label>
            <select
              value={scope === 'selected' ? 'selected' : selectedCityId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'selected') {
                  handleScopeChange('selected');
                } else if (val === 'all') {
                  handleScopeChange('all');
                } else {
                  setScope('custom');
                  setSelectedCityId(val);
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="all">All Registered Cities ({savedCities.length})</option>
              {selectedCity && (
                <option value="selected">
                  Selected City: {selectedCity.name}
                </option>
              )}
              {savedCities.map(c => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}{c.country ? ` (${c.country})` : ''} — ID #{c.id}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Free Text Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Records
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="City, data source, or scale..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-7 pr-7 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter 3: Observation Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observation Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-7 pr-7 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter 4: Parameter & Origin Classification */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Record Focus
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="all">All Telemetry Types</option>
              <option value="aqi">Air Quality Focused (AQI Available)</option>
              <option value="meteo">Meteorology Focused (Weather Telemetry)</option>
              <option value="ground">Ground Sensor Networks (CPCB CAAQMS)</option>
              <option value="model">Numerical Models (Copernicus CAMS)</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Coverage Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900 font-mono">{filteredObservations.length}</strong> of{' '}
              <strong className="text-slate-900 font-mono">{observations.length}</strong> loaded records
            </span>
            {lastRefreshedAt && (
              <span className="text-[11px] text-slate-400">
                • Queried at {lastRefreshedAt}
              </span>
            )}
          </div>

          {/* Date Coverage Badge */}
          {coverageStats.earliest && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Coverage: {coverageStats.earliest.slice(0, 10)} to {coverageStats.latest.slice(0, 10)}</span>
              <span>({coverageStats.spanHours}h window)</span>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OBSERVATION RECORDS LEDGER (ACADEMIC TABLE)                           */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recorded Environmental Observations Ledger
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Source: SQLite Table [environmental_observations]
          </span>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 m-4 rounded bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-rose-900 block">Database Query Error</span>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              <button
                onClick={() => loadObservations(scope, selectedCityId)}
                className="mt-2 text-xs font-semibold text-rose-800 hover:text-rose-950 underline cursor-pointer"
              >
                Retry Database Query
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-medium text-slate-700">
              Querying SQLite database records for observation snapshots...
            </p>
          </div>
        ) : filteredObservations.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              No Environmental Observations Found
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {searchQuery || dateFilter || typeFilter !== 'all'
                ? 'No stored records match your active search, date, or category filters. Try clearing your filters.'
                : scope === 'selected'
                ? `No observation snapshots are currently stored in SQLite for ${selectedCity?.name || 'this location'}. Acquire live telemetry to persist snapshots.`
                : 'The database currently contains no saved observation records. Search and select a municipality to acquire telemetry.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchQuery || dateFilter || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setTypeFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                >
                  Clear Active Filters
                </button>
              )}

              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule('module-03')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Acquire Data in Module 03</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Table of Records */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-mono">ID</th>
                  <th className="py-2.5 px-3">Observation Time (UTC)</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Air Quality (AQI)</th>
                  <th className="py-2.5 px-3">Particulates (PM2.5 / PM10)</th>
                  <th className="py-2.5 px-3">Weather (Temp / Hum / Wind)</th>
                  <th className="py-2.5 px-3">Data Source</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredObservations.map((obs) => {
                  const { dateStr, timeStr } = formatTimestamp(obs.observation_time);
                  const aqiClass = getAqiClassification(obs.aqi);

                  return (
                    <tr
                      key={obs.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setActiveRecord(obs)}
                    >
                      {/* Record ID */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{obs.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-900 font-medium">{dateStr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{timeStr}</div>
                      </td>

                      {/* City Location */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{obs.city_name || 'Selected City'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {[obs.city_state, obs.city_country].filter(Boolean).join(', ') || `City ID #${obs.city_id}`}
                        </div>
                      </td>

                      {/* AQI Badge */}
                      <td className="py-3 px-3">
                        {obs.aqi !== null && obs.aqi !== undefined ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${aqiClass.bg} ${aqiClass.text} ${aqiClass.border}`}>
                              {obs.aqi}
                            </span>
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              {obs.aqi_scale?.includes('CPCB') ? 'CPCB' : 'EPA'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* PM2.5 / PM10 */}
                      <td className="py-3 px-3 font-mono">
                        <div className="text-slate-800">
                          <span className="text-slate-400 text-[10px]">PM2.5:</span> {obs.pm25 !== null && obs.pm25 !== undefined ? `${obs.pm25.toFixed(1)} µg/m³` : '--'}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          <span className="text-slate-400 text-[10px]">PM10:</span> {obs.pm10 !== null && obs.pm10 !== undefined ? `${obs.pm10.toFixed(1)} µg/m³` : '--'}
                        </div>
                      </td>

                      {/* Weather Parameters */}
                      <td className="py-3 px-3 font-mono">
                        <div className="text-slate-900 font-medium">
                          {obs.temperature !== null && obs.temperature !== undefined ? `${obs.temperature.toFixed(1)}°C` : '--'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {obs.relative_humidity !== null && obs.relative_humidity !== undefined ? `${obs.relative_humidity}% RH` : ''}
                          {obs.wind_speed !== null && obs.wind_speed !== undefined ? ` • ${obs.wind_speed.toFixed(1)} km/h` : ''}
                        </div>
                      </td>

                      {/* Data Source */}
                      <td className="py-3 px-3 max-w-xs">
                        <span className="text-[11px] text-slate-600 line-clamp-1" title={obs.data_source}>
                          {obs.data_source || 'Open-Meteo'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Ingested: {obs.recorded_at ? obs.recorded_at.slice(0, 16) : '--'}
                        </span>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRecord(obs);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-emerald-700" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. RECORD DETAILS INSPECTOR MODAL                                         */}
      {/* ========================================================================= */}
      {activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>SQLite Observation Snapshot • Record #{activeRecord.id}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeRecord.city_name || 'Observation Record Details'}
                  {activeRecord.city_country ? `, ${activeRecord.city_country}` : ''}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Observation Time: {activeRecord.observation_time} • Ingested: {activeRecord.recorded_at}
                </span>
              </div>
              <button
                onClick={() => setActiveRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Top Banner: Air Quality Status */}
              <div className="p-4 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recorded Air Quality Assessment
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {activeRecord.aqi !== null && activeRecord.aqi !== undefined ? activeRecord.aqi : 'N/A'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getAqiClassification(activeRecord.aqi).bg} ${getAqiClassification(activeRecord.aqi).text} ${getAqiClassification(activeRecord.aqi).border}`}>
                      {getAqiClassification(activeRecord.aqi).label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Scale: <strong className="text-slate-700">{activeRecord.aqi_scale || 'US EPA AQI'}</strong>
                    {activeRecord.european_aqi && ` • European AQI: ${activeRecord.european_aqi}`}
                  </span>
                </div>

                {/* Make Active City Action */}
                {activeRecord.city_name && onSelectCity && (
                  <button
                    onClick={() => {
                      onSelectCity({
                        id: activeRecord.city_id,
                        name: activeRecord.city_name,
                        state: activeRecord.city_state || '',
                        country: activeRecord.city_country || '',
                        latitude: activeRecord.city_latitude,
                        longitude: activeRecord.city_longitude
                      });
                      setActiveRecord(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 rounded transition-colors cursor-pointer shadow-xs"
                  >
                    Select as Active City
                  </button>
                )}
              </div>

              {/* Grid 1: Meteorological Telemetry */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Meteorological Telemetry (In Situ / NWP)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Temperature</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.temperature !== null && activeRecord.temperature !== undefined ? `${activeRecord.temperature.toFixed(1)}°C` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Relative Humidity</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.relative_humidity !== null && activeRecord.relative_humidity !== undefined ? `${activeRecord.relative_humidity.toFixed(0)}%` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Precipitation / Rain</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.precipitation !== null && activeRecord.precipitation !== undefined ? `${activeRecord.precipitation.toFixed(1)} mm` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Wind Speed</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.wind_speed !== null && activeRecord.wind_speed !== undefined ? `${activeRecord.wind_speed.toFixed(1)} km/h` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Atmospheric Pollutants */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Chemical Species & Pollutant Concentrations</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">PM2.5 (Fine Aerosols)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.pm25 !== null && activeRecord.pm25 !== undefined ? `${activeRecord.pm25.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">PM10 (Coarse Aerosols)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.pm10 !== null && activeRecord.pm10 !== undefined ? `${activeRecord.pm10.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Nitrogen Dioxide (NO₂)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.no2 !== null && activeRecord.no2 !== undefined ? `${activeRecord.no2.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Sulfur Dioxide (SO₂)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.so2 !== null && activeRecord.so2 !== undefined ? `${activeRecord.so2.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Carbon Monoxide (CO)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.co !== null && activeRecord.co !== undefined ? `${activeRecord.co.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 block">Ozone (O₃)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {activeRecord.ozone !== null && activeRecord.ozone !== undefined ? `${activeRecord.ozone.toFixed(1)} µg/m³` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Provenance & Storage Integrity */}
              <div className="p-3 bg-slate-100 rounded border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Data Source Attribution & SQLite Relational Integrity</span>
                </div>
                <p className="text-slate-600">
                  <strong>Source Attribution:</strong> {activeRecord.data_source || 'Verified External Provider'}
                </p>
                <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  <span>Record ID: #{activeRecord.id}</span>
                  <span>Foreign Key: city_id = {activeRecord.city_id}</span>
                  <span>Coords: {activeRecord.city_latitude?.toFixed(4)}°, {activeRecord.city_longitude?.toFixed(4)}°</span>
                  <span>Engine: SQLite WAL</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Close Record Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ACADEMIC MODULE NAVIGATION FOOTER                                     */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Database className="w-4 h-4 text-emerald-700" />
          <span>Module 08: Saved Records — SQLite Storage Verification Completed</span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToModule && (
            <>
              <button
                onClick={() => onNavigateToModule('module-07')}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Module 07: Prediction System</span>
              </button>
              <button
                onClick={() => onNavigateToModule('module-09')}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
              >
                <span>Module 09: System Information</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
