import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Database,
  Clock,
  ShieldCheck,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Activity,
  Layers,
  Compass,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Info,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

// Custom Academic Light-Themed Tooltip for Recharts
function AcademicChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-300 rounded shadow-md p-3 text-xs space-y-1 z-50">
        <p className="font-bold text-slate-800 border-b border-slate-200 pb-1 font-mono">
          {label}
        </p>
        <div className="space-y-0.5 pt-1">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <strong className="font-mono text-slate-900">
                {item.value !== null && item.value !== undefined
                  ? (typeof item.value === 'number' ? item.value.toFixed(1) : item.value)
                  : 'N/A'}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function HistoricalAnalysisModule({
  selectedCity,
  analysisData,
  environmentalData: _environmentalData,
  isLoading = false,
  analysisPeriodDays = 7,
  onSelectPeriod,
  onRefresh,
  onNavigateToModule
}) {
  const [activeChartTab, setActiveChartTab] = useState('air_quality');

  const historicalTrends = analysisData?.historical_trends || {};
  const periodAverages = historicalTrends.period_averages || {};
  const dailyRecords = historicalTrends.daily_records || [];
  const weeklyAverages = historicalTrends.weekly_averages || [];
  const tempTrend = historicalTrends.temperature_trend || {};
  const rainTrend = historicalTrends.rainfall_trend || {};
  const aqiTrend = historicalTrends.aqi_trend || {};
  const coverage = analysisData?.coverage || {};
  const insights = analysisData?.insights || [];
  const sqliteRecords = analysisData?.sqlite_records || [];

  // Format coordinates
  const latFormatted = typeof selectedCity?.latitude === 'number'
    ? `${Math.abs(selectedCity.latitude).toFixed(4)}° ${selectedCity.latitude >= 0 ? 'N' : 'S'}`
    : '--';
  const lonFormatted = typeof selectedCity?.longitude === 'number'
    ? `${Math.abs(selectedCity.longitude).toFixed(4)}° ${selectedCity.longitude >= 0 ? 'E' : 'W'}`
    : '--';

  const chartTabs = [
    { id: 'air_quality', label: 'Air Quality (AQI, PM2.5, PM10)', icon: Wind },
    { id: 'thermal', label: 'Thermal Profile (Mean, Min, Max °C)', icon: Thermometer },
    { id: 'hydrological', label: 'Hydrological & Moisture (Rain & Humidity)', icon: CloudRain }
  ];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. MODULE OVERVIEW: PURPOSE & RETROSPECTIVE SCOPE                 */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  MOD-06
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module 06
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Historical Environmental Analysis & Longitudinal Trends
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              Scope: Multi-Period Retrospective
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              Active Module
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-800 font-semibold">Purpose & Retrospective Scope:</strong> Module 06 provides structured 
            longitudinal examination of environmental observations over time. Retrospective evaluation allows researchers to decouple 
            acute, transient meteorological events (such as brief thermal inversions or localized precipitation cleansing) from persistent 
            atmospheric air-quality trends. All historical data streams are anchored either to physical SQLite database records captured 
            during monitoring sessions or to verified daily reanalysis archives.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-emerald-800" />
                <span>SQLite Telemetry Database</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Immutable chronological records of real-time environmental observations stored persistently across monitoring sessions.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>Multi-Day Reanalysis Archive</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Daily aggregated observations derived from Open-Meteo European ERA5 reanalysis and Copernicus CAMS chemical transport models.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800 block text-xs flex items-center space-x-1">
                <BarChart2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Statistical Synthesis</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Arithmetic means, extrema detection, multi-week aggregates, and linear direction trends calculated strictly from actual data.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Domain Context Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Target Historical Domain: {selectedCity?.name}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {[selectedCity?.state, selectedCity?.country].filter(Boolean).join(', ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Coordinates: {latFormatted}, {lonFormatted} • Timezone: {selectedCity?.timezone || 'UTC'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || !selectedCity}
            className="px-3.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-800 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Historical Records</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 text-center shadow-xs">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
          <p className="text-sm text-slate-800 font-medium">Loading historical observations & trends for {selectedCity?.name}...</p>
          <p className="text-xs text-slate-500 font-mono">Querying SQLite observation table and Open-Meteo multi-day archives</p>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. HISTORICAL DATA RECORDS: PERSISTED SQLITE OBSERVATIONS          */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Persisted Telemetry Snapshots (SQLite Database)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical records stored in the &apos;environmental_observations&apos; table for {selectedCity?.name}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 self-start sm:self-auto">
            {sqliteRecords.length} Saved Snapshots
          </span>
        </div>

        <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start space-x-2">
          <Info className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold">Distinction from Live Telemetry: </strong>
            These records represent immutable time-stamped observations persisted to the local SQLite database 
            (<code>ecovision.db</code>) during previous telemetry ingestion cycles. They reflect the exact environmental 
            parameters recorded at each timestamp and are never overwritten or fabricated.
          </div>
        </div>

        {sqliteRecords.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Observation Time</th>
                  <th className="px-3.5 py-2.5">AQI & Scale</th>
                  <th className="px-3.5 py-2.5">Temperature</th>
                  <th className="px-3.5 py-2.5">Humidity</th>
                  <th className="px-3.5 py-2.5">Precipitation</th>
                  <th className="px-3.5 py-2.5">PM2.5 / PM10</th>
                  <th className="px-3.5 py-2.5">Wind</th>
                  <th className="px-3.5 py-2.5">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sqliteRecords.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-2.5 font-mono text-slate-900 font-medium">
                        {rec.observation_time || 'Unknown'}
                        <span className="block text-[10px] text-slate-400 font-sans">
                          Logged: {rec.recorded_at ? rec.recorded_at.split('.')[0] : '--'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {rec.aqi !== null && rec.aqi !== undefined ? (
                          <span className="font-mono font-bold text-slate-900">
                            {rec.aqi}
                            <span className="block text-[10px] font-sans text-slate-500 font-normal">
                              {rec.aqi_scale || 'US EPA'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No AQI</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">
                        {rec.temperature !== null && rec.temperature !== undefined ? `${rec.temperature.toFixed(1)}°C` : '--'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">
                        {rec.relative_humidity !== null && rec.relative_humidity !== undefined ? `${rec.relative_humidity}%` : '--'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">
                        {rec.precipitation !== null && rec.precipitation !== undefined ? `${rec.precipitation} mm` : '--'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">
                        <span>PM2.5: {rec.pm25 !== null && rec.pm25 !== undefined ? `${rec.pm25}` : '--'}</span>
                        <span className="block text-[10px] text-slate-500">PM10: {rec.pm10 !== null && rec.pm10 !== undefined ? `${rec.pm10}` : '--'}</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">
                        {rec.wind_speed !== null && rec.wind_speed !== undefined ? `${rec.wind_speed} km/h` : '--'}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate" title={rec.data_source}>
                        {rec.data_source || 'Open-Meteo & SQLite'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 rounded bg-slate-50 border border-slate-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              No Prior SQLite Observation Records for {selectedCity?.name}
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Real-time environmental snapshots are automatically recorded into SQLite whenever environmental data is acquired 
              in Module 03 or monitored in Module 04. Multi-day reanalysis trends remain fully accessible below.
            </p>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 3. TIME PERIOD SELECTION & COVERAGE METADATA                      */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Historical Analysis Timeframe Selection
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select analytical duration for daily multi-parameter trends
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded border border-slate-200 text-xs self-start sm:self-auto">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onSelectPeriod && onSelectPeriod(days)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                  analysisPeriodDays === days
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Past {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Coverage Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>
              Analysis Window: <strong>{coverage.start_date || 'N/A'}</strong> to <strong>{coverage.end_date || 'N/A'}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span>
              Retrieved: <strong className="text-slate-900 font-mono">{coverage.actual_days_retrieved ?? analysisPeriodDays} of {coverage.requested_period_days ?? analysisPeriodDays} Days</strong>
            </span>
            <span>•</span>
            <span>
              Completeness: <strong className="text-emerald-800 font-mono">{coverage.coverage_percentage ?? 100}%</strong>
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Provider: {coverage.data_sources || 'Open-Meteo ERA5 & CAMS'}
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. ENVIRONMENTAL TRENDS (RECHARTS VISUALIZATION)                  */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Daily Environmental Trend Curves
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical daily parameters across the selected {analysisPeriodDays}-day timeframe
              </p>
            </div>
          </div>

          {/* Chart View Selector Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs self-start sm:self-auto">
            {chartTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeChartTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-80 w-full pt-2">
          {dailyRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'air_quality' && (
                <LineChart data={dailyRecords} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<AcademicChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#1e293b' }} />
                  <Line type="monotone" name="Daily AQI" dataKey="aqi" stroke="#047857" strokeWidth={2.5} dot={{ r: 3, fill: '#047857' }} />
                  <Line type="monotone" name="PM2.5 (µg/m³)" dataKey="pm25" stroke="#0d9488" strokeWidth={1.8} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" name="PM10 (µg/m³)" dataKey="pm10" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              )}

              {activeChartTab === 'thermal' && (
                <AreaChart data={dailyRecords} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="academic-temp-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<AcademicChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#1e293b' }} />
                  <Area type="monotone" name="Mean Temp (°C)" dataKey="temp_mean" stroke="#ea580c" strokeWidth={2.5} fill="url(#academic-temp-grad)" />
                  <Line type="monotone" name="Max Temp (°C)" dataKey="temp_max" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" name="Min Temp (°C)" dataKey="temp_min" stroke="#0284c7" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </AreaChart>
              )}

              {activeChartTab === 'hydrological' && (
                <BarChart data={dailyRecords} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="display_date" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<AcademicChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#1e293b' }} />
                  <Bar name="Rainfall (mm)" dataKey="rainfall" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" name="Mean Humidity (%)" dataKey="humidity" stroke="#0d9488" strokeWidth={2} dot={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No daily historical series available for the selected duration.
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. STATISTICAL ANALYSIS & PERIOD AGGREGATES                       */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Statistical Aggregations (Past {analysisPeriodDays} Days)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Calculated Period Baseline
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* Temperature Statistics */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              <span>Thermal Profile</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {periodAverages.mean_temperature !== null && periodAverages.mean_temperature !== undefined ? `${periodAverages.mean_temperature}°C` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Min:</span>
                <strong className="font-mono text-slate-800">{periodAverages.min_temperature !== null && periodAverages.min_temperature !== undefined ? `${periodAverages.min_temperature}°C` : '--'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <strong className="font-mono text-slate-800">{periodAverages.max_temperature !== null && periodAverages.max_temperature !== undefined ? `${periodAverages.max_temperature}°C` : '--'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Diurnal Range:</span>
                <strong className="font-mono text-slate-800">
                  {periodAverages.max_temperature !== null && periodAverages.min_temperature !== null
                    ? `${(periodAverages.max_temperature - periodAverages.min_temperature).toFixed(1)}°C`
                    : '--'}
                </strong>
              </div>
            </div>
          </div>

          {/* Hydrological Statistics */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
              <span>Precipitation Totals</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {periodAverages.total_rainfall !== null && periodAverages.total_rainfall !== undefined ? `${periodAverages.total_rainfall} mm` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Rainy Days:</span>
                <strong className="font-mono text-slate-800">{periodAverages.rainy_days ?? 0} days</strong>
              </div>
              <div className="flex justify-between">
                <span>Dry Days:</span>
                <strong className="font-mono text-slate-800">{periodAverages.dry_days ?? 0} days</strong>
              </div>
              <div className="flex justify-between">
                <span>Precipitation Frequency:</span>
                <strong className="font-mono text-slate-800">
                  {dailyRecords.length > 0 ? `${Math.round(((periodAverages.rainy_days || 0) / dailyRecords.length) * 100)}%` : '--'}
                </strong>
              </div>
            </div>
          </div>

          {/* Atmospheric Moisture */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              <span>Relative Humidity</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {periodAverages.mean_humidity !== null && periodAverages.mean_humidity !== undefined ? `${periodAverages.mean_humidity}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Healthy Range:</span>
                <span className="font-mono text-slate-700">40% – 60%</span>
              </div>
              <div className="flex justify-between">
                <span>Moisture Status:</span>
                <strong className="text-slate-800">
                  {periodAverages.mean_humidity !== null
                    ? (periodAverages.mean_humidity >= 40 && periodAverages.mean_humidity <= 60 ? 'Optimal' : periodAverages.mean_humidity < 40 ? 'Dry' : 'Humid')
                    : '--'}
                </strong>
              </div>
            </div>
          </div>

          {/* Air Quality Statistics */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1">
              <Wind className="w-3.5 h-3.5 text-emerald-800" />
              <span>Air Quality Index</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {periodAverages.mean_aqi !== null && periodAverages.mean_aqi !== undefined ? Math.round(periodAverages.mean_aqi) : '--'}
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Mean PM2.5:</span>
                <strong className="font-mono text-slate-800">
                  {periodAverages.mean_pm25 !== null && periodAverages.mean_pm25 !== undefined ? `${periodAverages.mean_pm25} µg/m³` : '--'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>WHO Threshold:</span>
                <span className="font-mono text-slate-600">&lt; 15 µg/m³</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. TREND COMPARISON: VELOCITY, DELTAS & MULTI-WEEK CYCLES         */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Trend Comparison & Directional Deltas
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Temporal Baseline Shift
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Temperature Direction */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">Thermal Trend</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono text-[10px]">
                {tempTrend.direction || 'Stable'}
              </span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-900">
              {tempTrend.delta_c ? `${tempTrend.delta_c > 0 ? '+' : ''}${tempTrend.delta_c}°C` : '0.0°C'}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {tempTrend.description || 'Temperature baseline has remained stable across the observed window.'}
            </p>
          </div>

          {/* Precipitation Direction */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">Hydrological Trend</span>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-semibold font-mono text-[10px]">
                {rainTrend.direction || 'Stable'}
              </span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-900">
              {periodAverages.total_rainfall !== null && periodAverages.total_rainfall !== undefined ? `${periodAverages.total_rainfall} mm total` : '--'}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {rainTrend.description || 'Precipitation distribution reflects standard seasonal precipitation characteristics.'}
            </p>
          </div>

          {/* AQI Direction */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">Air Quality Trend</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono text-[10px]">
                {aqiTrend.direction || 'Stable'}
              </span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-900">
              {periodAverages.mean_aqi !== null && periodAverages.mean_aqi !== undefined ? `Mean ${Math.round(periodAverages.mean_aqi)} AQI` : '--'}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {aqiTrend.description || 'Air quality index variance matches baseline regional atmospheric levels.'}
            </p>
          </div>
        </div>

        {/* Multi-Week Comparative Breakdown if available */}
        {weeklyAverages.length > 1 && (
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Multi-Week Segment Comparison
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {weeklyAverages.map((wk, idx) => (
                <div key={idx} className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block truncate">{wk.week_label}</span>
                  <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Mean Temp:</span>
                      <strong className="font-mono text-slate-900">{wk.mean_temperature !== null ? `${wk.mean_temperature}°C` : '--'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rainfall:</span>
                      <strong className="font-mono text-slate-900">{wk.total_rainfall} mm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Mean AQI:</span>
                      <strong className="font-mono text-slate-900">{wk.mean_aqi !== null ? Math.round(wk.mean_aqi) : '--'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Observations:</span>
                      <span className="font-mono text-slate-500">{wk.records_count} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 7. DATA COVERAGE & COMPLETENESS                                   */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Data Coverage & Verification Methodology
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Observation Integrity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Coverage Accounting
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Requested Timespan:</span>
                <strong className="font-mono text-slate-900">{analysisPeriodDays} Calendar Days</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Actual Days Retrieved:</span>
                <strong className="font-mono text-slate-900">{coverage.actual_days_retrieved ?? dailyRecords.length} Days</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Completeness Percentage:</span>
                <strong className="font-mono text-emerald-800">{coverage.coverage_percentage ?? 100}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Missing Days / Intervals:</span>
                <strong className="font-mono text-slate-700">
                  {Math.max(0, analysisPeriodDays - (coverage.actual_days_retrieved ?? dailyRecords.length))} Days
                </strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Scientific Data Architecture
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              EcoVision strictly complies with empirical data integrity rules. Missing dates or sensor downtime are marked 
              as <code>null</code> / unavailable rather than interpolated or filled with zero. Stored SQLite snapshots provide 
              ground truth telemetry captured directly at user request, while multi-day time series are retrieved from European 
              Copernicus CAMS and Open-Meteo ERA5 Reanalysis.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. HISTORICAL INSIGHTS & INTERPRETATIONS                          */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Empirical Historical Insights
            </h3>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
            Rule-Based Deductions
          </span>
        </div>

        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Finding
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {item.headline}
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  {item.evidence}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              Historical baseline is established within normal seasonal boundaries.
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Insights are deterministically derived from observed telemetry and statistical variance. Zero AI fabrication.</span>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. NAVIGATION ACTIONS                                             */}
      {/* ================================================================= */}
      <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigateToModule && onNavigateToModule('module-05')}
          className="px-4 py-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Return to Module 05: Environmental Analysis</span>
        </button>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateToModule && onNavigateToModule('module-01')}
            className="px-3.5 py-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigateToModule && onNavigateToModule('module-07')}
            className="px-4 py-2 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <span>Proceed to Module 07: Prediction System</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>
    </div>
  );
}
